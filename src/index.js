require('dotenv').config();
const { app, BrowserWindow , ipcMain} = require('electron');
const path = require('node:path');
const { listTools, useTool } = require('./tools/toolkit');
const MODEL = 'google/gemma-4-31b-it';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const messages = [];
let totalTokens = { prompt: 0, completion: 0, total: 0 };  // ← 加這行
let msgTokenCount = 0;  // 用來計算訊息的 token 數量

const fs = require('fs');
const { log } = require('node:console');

const TOKEN_LOG_PATH = path.join(__dirname, 'logs', 'token-usage.csv');

function getNextSessionId() {
    if (!fs.existsSync(TOKEN_LOG_PATH)) {
        return 1;   // 檔案不存在，這是有史以來第一次執行
    }

    const lines = fs.readFileSync(TOKEN_LOG_PATH, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');   // 過濾掉切割出來的空字串

    const lastLine = lines[lines.length - 1];
    if (!lastLine || lastLine.startsWith('session,')) {
        return 1;   // 檔案存在但只有表頭、沒有任何資料列
    }

    const lastSessionId = parseInt(lastLine.split(',')[0], 10);
    return isNaN(lastSessionId) ? 1 : lastSessionId + 1;
}

let sessionId = getNextSessionId();   // 程式一啟動就決定好，整個 session 期間不變

function formatTimestamp(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function logTokenUsage(tokenCount, cumulativeTokens) {
    const logDir = path.dirname(TOKEN_LOG_PATH);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const isNewFile = !fs.existsSync(TOKEN_LOG_PATH);
    if (isNewFile) {
        fs.appendFileSync(TOKEN_LOG_PATH, 'session,time,tokens,cumulative_tokens\n', 'utf-8');
    }

    const timestamp = formatTimestamp(new Date());
    fs.appendFileSync(TOKEN_LOG_PATH, `${sessionId},${timestamp},${tokenCount},${cumulativeTokens}\n`, 'utf-8');
}


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

async function streamChat(event) {
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
            tools: listTools(),
            stream_options: { include_usage: true },  
        }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';
    let buffer = '';
    const toolCallsAcc = []; // 用陣列存，位置(index)對應「第幾個 tool call」

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') continue;

            const json = JSON.parse(payload);
            // 先檢查有沒有 usage，跟 choices 是否存在無關
            if (json.usage) {
                totalTokens.prompt += json.usage.prompt_tokens;
                totalTokens.completion += json.usage.completion_tokens;
                totalTokens.total += json.usage.total_tokens;
                console.log(`本次用量：prompt ${json.usage.prompt_tokens} + completion ${json.usage.completion_tokens} = ${json.usage.total_tokens}`);
                console.log(`累計用量：`, totalTokens);
                msgTokenCount += json.usage.total_tokens;  // 更新訊息的 token 數量
            }

            // 再檢查有沒有 choices 可以處理
            if (!json.choices || json.choices.length === 0) {
                continue;
            }

            const delta = json.choices[0].delta;

            if (delta.content) {
                fullReply += delta.content;
                event.sender.send('chunk', delta.content);
            }

            if (delta.tool_calls) {
                for (const fragment of delta.tool_calls) {
                    const index = fragment.index;

                    if (!toolCallsAcc[index]) {
                        toolCallsAcc[index] = { id: '', function: { name: '', arguments: '' } };
                    }

                    if (fragment.id) {
                        toolCallsAcc[index].id = fragment.id;
                    }
                    if (fragment.function.name) {
                        toolCallsAcc[index].function.name = fragment.function.name;
                    }
                    if (fragment.function.arguments) {
                        toolCallsAcc[index].function.arguments += fragment.function.arguments;
                    }
                }
            }
        }
    }
    if (toolCallsAcc.length > 0) {
        messages.push({
            role: 'assistant',
            content: fullReply || null,
            tool_calls: toolCallsAcc.map(tc => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
        });
        for (const toolCall of toolCallsAcc) {
            const args = JSON.parse(toolCall.function.arguments);
            let toolResponse = useTool(toolCall.function.name, args);
            if(typeof(toolResponse) !== 'string') {
                toolResponse = JSON.stringify(toolResponse);
            }
            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: toolResponse,
            });
        }
        await streamChat(event);
    } else {
    // 沒有要用工具，就是一般文字回答，正常結束
    messages.push({ role: 'assistant', content: fullReply });
    event.sender.send('token-count', msgTokenCount);  // 回覆完成後，傳送訊息的 token 計數
    logTokenUsage(msgTokenCount, totalTokens.total); // 回覆完成後，寫入 token 使用紀錄
    msgTokenCount = 0;  // 回覆完成後，重置訊息的 token 計數
    }
    
}



ipcMain.handle('talk', async (event, message) => {
  try {
    messages.push({ role: 'user', content: message });
    await streamChat(event);
  } catch (error) {
    console.error('呼叫 OpenRouter API 時發生錯誤:', error);
    event.sender.send('chunk', '抱歉，發生錯誤，請稍後再試。');
  } finally {
    event.sender.send('chunk-done');
  }
});