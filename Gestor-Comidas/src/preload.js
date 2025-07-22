const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    getAppName: () => ipcRenderer.invoke('app-name'),
    
    // Eventos del menú
    onMenuNewRecipe: (callback) => ipcRenderer.on('menu-new-recipe', callback),
    onMenuNewPlan: (callback) => ipcRenderer.on('menu-new-plan', callback),
    onMenuImport: (callback) => ipcRenderer.on('menu-import', callback),
    onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
    onMenuCalculator: (callback) => ipcRenderer.on('menu-calculator', callback),
    onMenuShoppingList: (callback) => ipcRenderer.on('menu-shopping-list', callback),
    onShowHelp: (callback) => ipcRenderer.on('show-help', callback),
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
