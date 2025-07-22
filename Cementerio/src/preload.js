const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    getAppName: () => ipcRenderer.invoke('app-name'),
    
    // Eventos del menú
    onMenuNewRecord: (callback) => ipcRenderer.on('menu-new-record', callback),
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
    
    // APIs de base de datos
    getEstadisticas: () => ipcRenderer.invoke('db-get-estadisticas'),
    getDifuntos: (options) => ipcRenderer.invoke('db-get-difuntos', options),
    searchDifuntos: (searchTerm) => ipcRenderer.invoke('db-search-difuntos', searchTerm),
    createDifunto: (data) => ipcRenderer.invoke('db-create-difunto', data),
    getParcelasDisponibles: () => ipcRenderer.invoke('db-get-parcelas-disponibles'),
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
