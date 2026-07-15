// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('DealwithMessage',{
    sendMessage:(message) => {
        return ipcRenderer.invoke('talk', message);
    },
    onChunk:(callback) =>{
        ipcRenderer.on('chunk', (event, data) => callback(data));
    }
})