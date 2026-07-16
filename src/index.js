require('dotenv').config();
const { app, BrowserWindow , ipcMain} = require('electron');
const path = require('node:path');
// const { listTools, useTool } = require('./tools/toolkit');
const MODEL = 'google/gemma-4-31b-it';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const messages = [];
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


async function processResponse(response, event) {
  let pendingFunctionCall = null;

  for await (const chunk of response) {
    if (chunk.functionCalls && chunk.functionCalls.length > 0) {
      pendingFunctionCall = chunk.functionCalls[0];
      console.log('收到 function call:', pendingFunctionCall);
    } else {
      console.log('[main] 送出 chunk:', JSON.stringify(chunk.text));
      event.sender.send('chunk', chunk.text);
    }
  }

  // 迴圈保證跑完(包含那個帶 finishReason 的 chunk)之後,才處理函式呼叫
  if (pendingFunctionCall) {
    const { name, args } = pendingFunctionCall;
    const toolResult = useTool(name, args);

    const nextResponse = await chat.sendMessageStream({
      message: {
        functionResponse: {
          name,
          response: { output: toolResult },
        },
      },
    });

    await processResponse(nextResponse, event);
  }
}

ipcMain.handle('talk', async (event, message) => {
  try {
    messages.push({ role: 'user', content: message });

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    const replyText = data.choices[0].message.content;

    messages.push({ role: 'assistant', content: replyText });
    event.sender.send('chunk', replyText);
  } catch (error) {
    console.error('呼叫 OpenRouter API 時發生錯誤:', error);
    event.sender.send('chunk', '抱歉，發生錯誤，請稍後再試。');
  } finally {
    event.sender.send('chunk-done');
  }
});