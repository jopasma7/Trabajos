
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
  const pacientes = stmt.all();
  // Añadir etiquetas a cada paciente
  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
  });
  return pacientes;
});

// Ejemplo: Agregar un paciente
ipcMain.handle('add-paciente', (event, paciente) => {
  const stmt = db.prepare(`INSERT INTO pacientes (nombre, apellidos, tipo_acceso, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado
  );
  console.log('[DEPURACIÓN] Paciente insertado con ID:', info.lastInsertRowid);
  return { id: info.lastInsertRowid };
});
  // Editar un paciente
  ipcMain.handle('edit-paciente', (event, paciente) => {
    const stmt = db.prepare(`UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso = ?, fecha_instalacion = ?, ubicacion_anatomica = ?, ubicacion_lado = ? WHERE id = ?`);
      const info = stmt.run(
        paciente.nombre,
        paciente.apellidos,
        paciente.tipo_acceso,
        paciente.fecha_instalacion,
        paciente.ubicacion_anatomica,
        paciente.ubicacion_lado,
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


// --- IPC para tags (etiquetas) ---
ipcMain.handle('tags-get-all', () => {
  return db.getAllTags();
});

ipcMain.handle('tags-get', (event, tagId) => {
  return db.getTagById(tagId);
});

ipcMain.handle('tags-add', (event, { nombre, color, descripcion, tipo, icono }) => {
  console.log('[DEPURACIÓN] ipcMain tags-add:', { nombre, color, descripcion, tipo, icono });
  return db.addTag(nombre, color, descripcion, tipo, icono);
});

ipcMain.handle('tags-update', (event, { id, nombre, color, descripcion, tipo, icono }) => {
  return db.updateTag(id, nombre, color, descripcion, tipo, icono);
});

ipcMain.handle('tags-delete', (event, id) => {
  return db.deleteTag(id);
});

// Eliminado código de persistencia JSON de agenda

// --- IPC para incidencias ---

// Guardar etiquetas de incidencias para el paciente (incidencia más reciente)
// Permite motivo y fecha personalizados
ipcMain.handle('paciente-set-etiquetas', (event, pacienteId, tagIds, motivo, fecha) => {
  console.log('[DEPURACIÓN] Handler paciente-set-etiquetas recibido:', { pacienteId, tagIds, motivo, fecha });
  return db.setEtiquetasForPaciente(pacienteId, tagIds, motivo, fecha);
});

// Nueva función: crear incidencia y asociar un tag
ipcMain.handle('incidencia-add-con-tag', (event, pacienteId, tagId, motivo, fecha) => {
  return db.addIncidenciaConTag(pacienteId, tagId, motivo, fecha);
});


// Obtener etiquetas asociadas a un paciente (por incidencias)
ipcMain.handle('paciente-get-etiquetas', (event, pacienteId) => {
  return db.getEtiquetasByPaciente(pacienteId);
});

ipcMain.handle('incidencias-get', (event, pacienteId) => {
  return db.getIncidenciasByPaciente(pacienteId);
});

ipcMain.handle('incidencias-add', (event, { pacienteId, motivo, fecha }) => {
  return db.addIncidencia(pacienteId, motivo, fecha);
});

ipcMain.handle('incidencias-delete', (event, incidenciaId) => {
  return db.deleteIncidencia(incidenciaId);
});

