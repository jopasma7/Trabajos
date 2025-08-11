

// Importamos los módulos principales de Electron
const { app, BrowserWindow } = require('electron');

// Inicializamos la base de datos y los handlers de IPC
require('./js/data/db');
require('./js/ipcHandlers');


// Función para crear la ventana principal de la aplicación
function createWindow() {
  // Creamos una nueva instancia de BrowserWindow (ventana de la app)
  const win = new BrowserWindow({
    width: 800, // Ancho de la ventana
    height: 600, // Alto de la ventana
    webPreferences: {
      nodeIntegration: true, // Permite usar Node.js en el frontend
      contextIsolation: false // Desactiva el aislamiento de contexto
    }
  });
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
