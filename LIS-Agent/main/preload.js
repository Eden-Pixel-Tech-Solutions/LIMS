const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  listPorts: () => ipcRenderer.invoke('list-ports'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  startListening: (testInfo) => ipcRenderer.invoke('start-listening', testInfo),
  stopListening: () => ipcRenderer.invoke('stop-listening'),
  onTestCompleted: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('test-completed', listener);
    return () => ipcRenderer.removeListener('test-completed', listener);
  }
});