require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { app, BrowserWindow , ipcMain} = require('electron');
const path = require('node:path');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  // mainWindow.webContents.openDevTools();
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

// ipcMain.handle('talk', async (event, message) => {
//   // 這裡可以呼叫外部 API、讀寫檔案等等
//   return '成功透過IPC talk';
// });

ipcMain.handle('talk', async (event, message) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: message,
    });
    return response.text;
  } catch (error) {
    console.error('呼叫 Gemini API 時發生錯誤:', error);
    return '抱歉，發生錯誤，請稍後再試。';
  }
});