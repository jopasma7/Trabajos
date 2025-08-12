
// Eliminar require innecesario de agendaData
const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const db = require('./data/db');


// Ruta del archivo de perfil en la carpeta de usuario de la app
const perfilPath = path.join(app.getPath('userData'), 'perfil.json');

// --- Agenda: persistencia de eventos en base de datos (usando db.js) ---
ipcMain.handle('agenda-cargar', () => db.getAllEventos());
ipcMain.handle('agenda-guardar', (event, eventos) => db.upsertEventos(eventos));

// Handler: cargar perfil
ipcMain.handle('perfil-cargar', () => {
  if (fs.existsSync(perfilPath)) {
    try {
      return JSON.parse(fs.readFileSync(perfilPath, 'utf8'));
    } catch (e) { return null; }
  }
  return null;
});

// Handler: guardar perfil
ipcMain.handle('perfil-guardar', (event, perfil) => {
  fs.writeFileSync(perfilPath, JSON.stringify(perfil, null, 2), 'utf8');
  return true;
});

// Handler: cambiar avatar (seleccionar imagen y copiar a userData)
ipcMain.handle('perfil-cambiar-avatar', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecciona una imagen de perfil',
    filters: [ { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif'] } ],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const src = result.filePaths[0];
    const ext = path.extname(src);
    const dest = path.join(app.getPath('userData'), 'avatar' + ext);
    fs.copyFileSync(src, dest);
    return dest;
  }
  return null;
});

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
  // Editar un paciente
  ipcMain.handle('edit-paciente', (event, paciente) => {
    const stmt = db.prepare(`UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso = ?, fecha_instalacion = ?, ubicacion = ? WHERE id = ?`);
    const info = stmt.run(
      paciente.nombre,
      paciente.apellidos,
      paciente.tipo_acceso,
      paciente.fecha_instalacion,
      paciente.ubicacion,
      paciente.id
    );
    return { changes: info.changes };
  });

  // Eliminar un paciente
  ipcMain.handle('delete-paciente', (event, id) => {
    const stmt = db.prepare(`DELETE FROM pacientes WHERE id = ?`);
    const info = stmt.run(id);
    return { changes: info.changes };
  });


// Eliminado código de persistencia JSON de agenda

