const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  listPorts: () => ipcRenderer.invoke('list-ports'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  deleteConfig: (id) => ipcRenderer.invoke('delete-config', id),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  startListening: (testInfo) => ipcRenderer.invoke('start-listening', testInfo),
  stopListening: () => ipcRenderer.invoke('stop-listening'),
  getActivePorts: () => ipcRenderer.invoke('get-active-ports'),
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
  onTestCompleted: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('test-completed', listener);
    return () => ipcRenderer.removeListener('test-completed', listener);
  },
  onDeviceStatus: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('device-status', listener);
    return () => ipcRenderer.removeListener('device-status', listener);
  },
  onPanelComplete: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('panel-complete', listener);
    return () => ipcRenderer.removeListener('panel-complete', listener);
  }
});