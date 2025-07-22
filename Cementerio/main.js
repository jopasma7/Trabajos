const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const DatabaseManager = require('./src/database/database');

// Variables globales
let mainWindow;
let dbManager;

// Función para crear la ventana principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.png'), // Opcional: agregar icono
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preload.js')
        },
        show: true
    });
    
    // Cargar la página principal
    mainWindow.loadFile(path.join(__dirname, 'src', 'views', 'index.html'));

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus(); // Asegurar que tenga el foco
    });

    // Evento cuando se cierra la ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Abrir DevTools en modo desarrollo
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// Crear menú de la aplicación
function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Salir',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de',
                    click: () => {
                        // Mostrar información de la aplicación
                        mainWindow.webContents.send('show-about');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Eventos de la aplicación
app.whenReady().then(async () => {
    // Inicializar base de datos
    dbManager = new DatabaseManager();
    try {
        await dbManager.connect();
        await dbManager.insertSampleData(); // Insertar datos de ejemplo
    } catch (error) {
        console.error('Error inicializando base de datos:', error);
    }

    createMainWindow();
    createMenu();

    // En macOS, recrear ventana cuando se hace clic en el dock
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Cerrar la aplicación cuando todas las ventanas están cerradas
app.on('window-all-closed', async () => {
    // Cerrar conexión a la base de datos
    if (dbManager) {
        await dbManager.close();
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Eventos IPC (comunicación entre procesos)
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('app-name', () => {
    return app.getName();
});

// Eventos de base de datos
ipcMain.handle('db-get-estadisticas', async () => {
    try {
        return await dbManager.getEstadisticas();
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-difuntos', async (event, options = {}) => {
    try {
        const { limit = 100, offset = 0 } = options;
        return await dbManager.getAllDifuntos(limit, offset);
    } catch (error) {
        console.error('Error obteniendo difuntos:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-search-difuntos', async (event, searchTerm) => {
    try {
        return await dbManager.searchDifuntos(searchTerm);
    } catch (error) {
        console.error('Error buscando difuntos:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-difunto', async (event, id) => {
    try {
        return await dbManager.getDifunto(id);
    } catch (error) {
        console.error('Error obteniendo difunto:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-create-difunto', async (event, data) => {
    try {
        return await dbManager.createDifunto(data);
    } catch (error) {
        console.error('Error creando difunto:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-update-difunto', async (event, id, data) => {
    try {
        return await dbManager.updateDifunto(id, data);
    } catch (error) {
        console.error('Error actualizando difunto:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-delete-difunto', async (event, id) => {
    try {
        return await dbManager.deleteDifunto(id);
    } catch (error) {
        console.error('Error eliminando difunto:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-parcela', async (event, id) => {
    try {
        return await dbManager.getParcela(id);
    } catch (error) {
        console.error('Error obteniendo parcela:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-create-parcela', async (event, data) => {
    try {
        return await dbManager.createParcela(data);
    } catch (error) {
        console.error('Error creando parcela:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-update-parcela', async (event, id, data) => {
    try {
        return await dbManager.updateParcela(id, data);
    } catch (error) {
        console.error('Error actualizando parcela:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-delete-parcela', async (event, id) => {
    try {
        return await dbManager.deleteParcela(id);
    } catch (error) {
        console.error('Error eliminando parcela:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-parcelas', async () => {
    try {
        return await dbManager.getParcelas();
    } catch (error) {
        console.error('Error obteniendo todas las parcelas:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-parcelas-disponibles', async () => {
    try {
        return await dbManager.getParcelasDisponibles();
    } catch (error) {
        console.error('Error obteniendo parcelas:', error);
        return { error: error.message };
    }
});

ipcMain.handle('select-backup-folder', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar carpeta para el respaldo',
            properties: ['openDirectory', 'createDirectory'],
            buttonLabel: 'Seleccionar Carpeta'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            return { success: true, folderPath: result.filePaths[0] };
        } else {
            return { success: false, canceled: true };
        }
    } catch (error) {
        console.error('Error seleccionando carpeta:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-backup', async (event, customPath = null) => {
    try {
        return await dbManager.createBackup(customPath);
    } catch (error) {
        console.error('Error creando respaldo:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-optimize', async () => {
    try {
        return await dbManager.optimizeDatabase();
    } catch (error) {
        console.error('Error optimizando base de datos:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-size', async () => {
    try {
        return await dbManager.getDatabaseSize();
    } catch (error) {
        console.error('Error obteniendo tamaño de base de datos:', error);
        return { error: error.message };
    }
});

ipcMain.handle('db-get-recent-activity', async (event, limit = 10) => {
    try {
        return await dbManager.getRecentActivity(limit);
    } catch (error) {
        console.error('Error obteniendo actividad reciente:', error);
        return { error: error.message };
    }
});

// Prevenir navegación externa
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (navigationEvent, navigationURL) => {
        event.preventDefault();
    });
});
