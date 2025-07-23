const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    getAppName: () => ipcRenderer.invoke('app-name'),
    
    // Eventos del menú
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
    
    // APIs de base de datos
    getEstadisticas: () => ipcRenderer.invoke('db-get-estadisticas'),
    getDifuntos: (options) => ipcRenderer.invoke('db-get-difuntos', options),
    getDifunto: (id) => ipcRenderer.invoke('db-get-difunto', id),
    searchDifuntos: (searchTerm) => ipcRenderer.invoke('db-search-difuntos', searchTerm),
    createDifunto: (data) => ipcRenderer.invoke('db-create-difunto', data),
    updateDifunto: (id, data) => ipcRenderer.invoke('db-update-difunto', id, data),
    deleteDifunto: (id) => ipcRenderer.invoke('db-delete-difunto', id),
    createParcela: (data) => ipcRenderer.invoke('db-create-parcela', data),
    getParcela: (id) => ipcRenderer.invoke('db-get-parcela', id),
    updateParcela: (id, data) => ipcRenderer.invoke('db-update-parcela', id, data),
    deleteParcela: (id) => ipcRenderer.invoke('db-delete-parcela', id),
    checkParcelaDependencies: (id) => ipcRenderer.invoke('db-check-parcela-dependencies', id),
    forceDeleteParcela: (id) => ipcRenderer.invoke('db-force-delete-parcela', id),
    getParcelas: () => ipcRenderer.invoke('db-get-parcelas'),
    getParcelasDisponibles: () => ipcRenderer.invoke('db-get-parcelas-disponibles'),
    
    // Funciones de mantenimiento de base de datos
    selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
    backupDatabase: (customPath) => ipcRenderer.invoke('db-backup', customPath),
    optimizeDatabase: () => ipcRenderer.invoke('db-optimize'),
    getDatabaseSize: () => ipcRenderer.invoke('db-get-size'),
    getRecentActivity: (limit) => ipcRenderer.invoke('db-get-recent-activity', limit),
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
