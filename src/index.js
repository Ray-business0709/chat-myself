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
        stream: true,
      }),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 最後一行可能不完整，留到下次跟新資料接起來

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;

        const json = JSON.parse(payload);
        const deltaText = json.choices[0].delta.content;

        if (deltaText) {
          fullReply += deltaText;
          event.sender.send('chunk', deltaText);
        }
      }
    }

    messages.push({ role: 'assistant', content: fullReply });
  } catch (error) {
    console.error('呼叫 OpenRouter API 時發生錯誤:', error);
    event.sender.send('chunk', '抱歉，發生錯誤，請稍後再試。');
  } finally {
    event.sender.send('chunk-done');
  }
});