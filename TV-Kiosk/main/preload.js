const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kioskAPI', {
  getConfig:  ()              => ipcRenderer.invoke('get-config'),
  saveConfig: (config)        => ipcRenderer.invoke('save-config', config),
  resetConfig: ()             => ipcRenderer.invoke('reset-config'),
  fetchLabs:  ()              => ipcRenderer.invoke('fetch-labs'),
});
