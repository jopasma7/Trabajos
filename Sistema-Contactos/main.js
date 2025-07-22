const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const Database = require('./src/database/database');
const AuthService = require('./src/services/authService');

let mainWindow;
let database;
let authService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Opcional
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('src/views/login.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Menú de la aplicación
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
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
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  // Inicializar base de datos
  database = new Database();
  authService = new AuthService(database);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers para comunicación con el renderer
ipcMain.handle('auth:login', async (event, credentials) => {
  try {
    const result = await authService.login(credentials.email, credentials.password);
    // result ya contiene { user: {...}, token: "..." }
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:register', async (event, userData) => {
  try {
    const result = await authService.register(userData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:getCurrentUser', async (event, token) => {
  try {
    const user = authService.verifyToken(token);
    if (user) {
      return { success: true, data: user };
    } else {
      return { success: false, error: 'Token inválido' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:getAll', async () => {
  try {
    const users = await database.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:create', async (event, userData) => {
  try {
    const user = await authService.register(userData);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:update', async (event, userData) => {
  try {
    const user = await database.updateUser(userData);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:delete', async (event, userId) => {
  try {
    await database.deleteUser(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('navigate:dashboard', () => {
  mainWindow.loadFile('src/views/dashboard.html');
});

ipcMain.handle('navigate:login', () => {
  mainWindow.loadFile('src/views/login.html');
});

ipcMain.handle('navigate:register', () => {
  mainWindow.loadFile('src/views/register.html');
});

// IPC Handlers para gestión de contactos
ipcMain.handle('contacts:getAll', async (event, userContext = null) => {
  try {
    // Si userContext es null o el usuario es admin, obtener todos los contactos
    // Si es usuario normal, obtener solo sus contactos
    const userId = (userContext && userContext.role !== 'admin') ? userContext.id : null;
    const contacts = await database.getAllContacts(userId);
    return { success: true, data: contacts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contacts:create', async (event, contactData, userContext = null) => {
  try {
    // Asegurarse de que el contacto tenga el user_id correcto
    if (userContext) {
      contactData.user_id = userContext.id;
    }
    const contact = await database.createContact(contactData);
    return { success: true, data: contact };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contacts:update', async (event, contactData, userContext = null) => {
  try {
    // Pasar el contexto de usuario para verificar permisos
    const userId = (userContext && userContext.role !== 'admin') ? userContext.id : null;
    const contact = await database.updateContact(contactData, userId);
    return { success: true, data: contact };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contacts:delete', async (event, contactId, userContext = null) => {
  try {
    // Pasar el contexto de usuario para verificar permisos
    const userId = (userContext && userContext.role !== 'admin') ? userContext.id : null;
    await database.deleteContact(contactId, userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contacts:getStats', async (event, userContext = null) => {
  try {
    // Si userContext es null o el usuario es admin, obtener estadísticas de todos
    // Si es usuario normal, obtener solo estadísticas de sus contactos
    const userId = (userContext && userContext.role !== 'admin') ? userContext.id : null;
    const stats = await database.getContactStats(userId);
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers para gestión de tags
ipcMain.handle('tags:getAll', async () => {
  try {
    return new Promise((resolve, reject) => {
      database.getAllTags((err, tags) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, data: tags });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tags:create', async (event, tagData) => {
  try {
    return new Promise((resolve, reject) => {
      database.createTag(tagData, (err, tag) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, data: tag });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tags:update', async (event, tagData) => {
  try {
    return new Promise((resolve, reject) => {
      database.updateTag(tagData.id, tagData, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, data: tagData });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tags:delete', async (event, tagId) => {
  try {
    return new Promise((resolve, reject) => {
      database.deleteTag(tagId, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});
