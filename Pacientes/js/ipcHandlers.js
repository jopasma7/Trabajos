// js/ipcHandlers.js
// Lógica de comunicación entre frontend y backend (IPC) y acceso a la base de datos

const { ipcMain } = require('electron');
const db = require('./data/db');

// Ejemplo: Obtener todos los pacientes
ipcMain.handle('get-pacientes', () => {
  const stmt = db.prepare('SELECT * FROM pacientes');
  return stmt.all();
});

// Ejemplo: Agregar un paciente
ipcMain.handle('add-paciente', (event, paciente) => {
  const stmt = db.prepare(`INSERT INTO pacientes (nombre, apellidos, tipo_acceso, fecha_instalacion, ubicacion) VALUES (?, ?, ?, ?, ?)`);
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso,
    paciente.fecha_instalacion,
    paciente.ubicacion
  );
  return { id: info.lastInsertRowid };
});

// Puedes agregar más handlers para incidentes, renovaciones, etc.
