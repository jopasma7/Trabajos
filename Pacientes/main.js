
// Recarga automática en desarrollo
try {
  require('electron-reloader')(module, {
    ignore: [
      'data',
      'data/**'
    ]
  });
} catch (_) {}


// Importamos los módulos principales de Electron
const { app, BrowserWindow } = require('electron');

// Inicializamos la base de datos y los handlers de IPC
require('./js/data/db');
require('./js/ipcHandlers.js'); // Asegura que los handlers de agenda estén activos


// Función para crear la ventana principal de la aplicación
function createWindow() {
  // Creamos una nueva instancia de BrowserWindow (ventana de la app)
  const path = require('path');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'app.ico'), // Icono de la app
    title: 'Gigi Hospital',
    webPreferences: {
      nodeIntegration: true, // Permite usar Node.js en el frontend
      contextIsolation: false // Desactiva el aislamiento de contexto
    }
  });
  win.maximize();
  // Cargamos el archivo HTML principal desde la carpeta views
  win.loadFile('views/index.html');
}


// Cuando Electron esté listo, creamos la ventana principal
app.whenReady().then(createWindow);


// Evento: cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  // En macOS, las apps suelen seguir activas hasta que el usuario sale explícitamente
  if (process.platform !== 'darwin') {
    app.quit(); // Cerramos la aplicación en otros sistemas
  }
});


// Evento: cuando la app se activa (por ejemplo, al hacer clic en el dock en macOS)
app.on('activate', () => {
  // Si no hay ventanas abiertas, creamos una nueva
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
