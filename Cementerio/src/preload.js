const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    getAppName: () => ipcRenderer.invoke('app-name'),
    
    // Eventos del menú
    onMenuNewRecord: (callback) => ipcRenderer.on('menu-new-record', callback),
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
