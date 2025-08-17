// Eliminar require innecesario de agendaData
const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');

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

// Handler: Pacientes con CHD pendiente de FAV
ipcMain.handle('get-pacientes-chd-pendiente-fav', () => {
  // Filtrado por CHD pendiente de FAV según lógica normalizada en db.js
  return db.getPacientesCHDPendienteFAV();
});

// Handler: Pacientes con FAV pendiente retiro CHD
ipcMain.handle('get-pacientes-fav-pendiente-retiro-chd', () => {
  // Filtrado por FAV pendiente de retiro CHD según lógica normalizada en db.js
  return db.getPacientesFAVPendienteRetiroCHD();
});

// Handler: Pacientes con CHD, FAV Madurativo
ipcMain.handle('get-pacientes-chd-fav-madurativo', () => {
  // Filtrado por CHD y FAV madurativo según lógica normalizada en db.js
  return db.getPacientesCHDFAVMadurativo();
});

// Handler: Pacientes con Sepsis CHD
ipcMain.handle('get-pacientes-sepsis-chd', () => {
  // Filtrado por Sepsis CHD según lógica normalizada en db.js
  return db.getPacientesSepsisCHD();
});

// Ejemplo: Agregar un paciente
ipcMain.handle('add-paciente', (event, paciente) => {
  // Delegar la lógica de inserción a una función de alto nivel en db.js
  // Esta función debe encargarse de insertar en pacientes y en las tablas relacionadas según el modelo normalizado
  const result = db.addPacienteCompleto(paciente);
  return result;
});

// Handler para obtener paciente con datos de acceso para edición
// Handler para obtener todos los datos completos de todos los pacientes
ipcMain.handle('get-pacientes-completos', () => {
  return db.getPacientesCompletos();
});
ipcMain.handle('paciente-get-con-acceso', (event, pacienteId) => {
  return db.getPacienteConAcceso(pacienteId);
});

// Handler para obtener el pendiente actual de un paciente
ipcMain.handle('pendiente-get-by-paciente', (event, pacienteId) => {
  return db.getPendienteActualByPaciente(pacienteId);
});

  // Editar un paciente
// Handler para actualizar un paciente (usado en edición)
ipcMain.handle('update-paciente', (event, paciente) => {
  // Delegar la edición a una función de alto nivel en db.js que gestione la actualización normalizada
  const result = db.editPacienteCompleto(paciente);
  return result;
});

  // Eliminar un paciente
  ipcMain.handle('delete-paciente', (event, id) => {
  // Eliminar registros relacionados antes de eliminar el paciente
  // Eliminar registros que referencian acceso_id
  // Eliminar todos los pendientes relacionados con el paciente directamente
  db.prepare('DELETE FROM pendiente WHERE paciente_id = ?').run(id);
  db.prepare('DELETE FROM acceso WHERE paciente_id = ?').run(id);
  db.prepare('DELETE FROM pendiente WHERE paciente_id = ?').run(id);
  // db.prepare('DELETE FROM historial WHERE paciente_id = ?').run(id); // Tabla no existe
  db.prepare('DELETE FROM incidencias WHERE paciente_id = ?').run(id);
  db.prepare('DELETE FROM historial_clinico WHERE paciente_id = ?').run(id);
  // Si tienes otras tablas relacionadas, agrégalas aquí
  const stmt = db.prepare('DELETE FROM pacientes WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
  });


// --- IPC para historial clínico ---
ipcMain.handle('historial-get', (event, pacienteId) => {
  return db.getHistorialClinicoByPaciente(pacienteId);
});

ipcMain.handle('historial-add', (event, { paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional }) => {
  return db.addHistorialClinico(paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional);
});

// Editar una entrada de historial clínico
ipcMain.handle('historial-edit', (event, id, fields) => {
  return db.updateHistorialClinico(id, fields);
});

// Eliminar una entrada de historial clínico
// Archivar una entrada de historial clínico
ipcMain.handle('historial-archive', (event, id) => {
  return db.archiveHistorialClinico(id);
});

ipcMain.handle('historial-get-archived', (event, pacienteId) => {
  return db.getHistorialArchivadoByPaciente(pacienteId);
});

// Desarchivar una entrada de historial clínico
ipcMain.handle('historial-unarchive', (event, id) => {
  return db.unarchiveHistorialClinico(id);
});


// --- IPC para tags (etiquetas) ---
ipcMain.handle('tags-get-all', () => {
  return db.getAllTags();
});

ipcMain.handle('tags-get', (event, tagId) => {
  return db.getTagById(tagId);
});

ipcMain.handle('tags-add', (event, { nombre, color, descripcion, tipo, icono, ubicaciones }) => {
  return db.addTag(nombre, color, descripcion, tipo, icono);
});

ipcMain.handle('tags-update', (event, { id, nombre, color, descripcion, tipo, icono, ubicaciones }) => {
  return db.updateTag(id, nombre, color, descripcion, tipo, icono, ubicaciones);
});


ipcMain.handle('tags-delete', (event, id) => {
  return db.deleteTag(id);
});


// --- IPC para incidencias ---

// Guardar etiquetas de incidencias para el paciente (incidencia más reciente)
// Permite motivo y fecha personalizados
ipcMain.handle('paciente-set-etiquetas', (event, pacienteId, tagIds, motivo, fecha) => {
  return db.setEtiquetasForPaciente(pacienteId, tagIds, motivo, fecha);
});

// Nueva función: crear incidencia y asociar un tag
ipcMain.handle('incidencia-add-con-tag', (event, pacienteId, tagId, motivo, fecha) => {
  return db.addIncidenciaConTag(pacienteId, tagId, motivo, fecha);
});

ipcMain.handle('tipo-acceso-get-all', () => {
  return db.prepare('SELECT * FROM tipo_acceso').all();
});

ipcMain.handle('paciente-get-incidencias', async (event, pacienteId) => {
  // Devuelve todas las incidencias asociadas al paciente, con motivo, fecha y tagId
  return db.prepare(`
    SELECT i.id, it.tag_id as tagId, i.motivo, i.fecha
    FROM incidencias i
    JOIN incidencia_tags it ON i.id = it.incidencia_id
    WHERE i.paciente_id = ?
    ORDER BY i.fecha DESC, i.id DESC
  `).all(pacienteId);
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

ipcMain.handle('paciente-set-avatar', async (event, pacienteId, avatarData) => {
  return db.setPacienteAvatar(pacienteId, avatarData);
});
ipcMain.handle('paciente-get-avatar', async (event, pacienteId) => {
  return db.getPacienteAvatar(pacienteId);
});

ipcMain.handle('get-acceso-by-paciente', (event, pacienteId) => {
  return db.prepare('SELECT * FROM acceso WHERE paciente_id = ?').get(pacienteId);
});

// --- IPC para profesionales ---
const db = require('./data/db');

// --- IPC para pendientes ---
ipcMain.handle('pendiente-add', (event, pendiente) => {
  return db.addPendiente(pendiente);
});

ipcMain.handle('pendiente-edit', (event, pendiente) => {
  return db.editPendiente(pendiente);
});

ipcMain.handle('pendiente-delete', (event, id) => {
  return db.deletePendiente(id);
});

ipcMain.handle('pendientes-get', () => {
  return db.getPendientes();
});

// Handler para obtener los tipos de pendiente
ipcMain.handle('pendiente-tipos-get', () => {
  return db.prepare('SELECT id, nombre FROM pendiente_tipo').all();
});

ipcMain.handle('pendientes-get-by-paciente', (event, pacienteId) => {
  return db.getPendientesByPaciente(pacienteId);
});
ipcMain.handle('get-profesionales', () => {
  const profesionales = db.getProfesionales();
  return profesionales;
});

ipcMain.handle('add-profesional', (event, profesional) => {
  return db.addProfesional(profesional);
});

ipcMain.handle('edit-profesional', (event, profesional) => {
  return db.editProfesional(profesional);
});

ipcMain.handle('delete-profesional', (event, id) => {
  return db.deleteProfesional(id);
});

ipcMain.handle('get-ubicaciones-anatomicas', () => {
  const rows = db.prepare("SELECT nombre, ubicaciones FROM tipo_acceso WHERE ubicaciones IS NOT NULL AND ubicaciones != ''").all();
  return rows.map(row => ({
    acceso: row.nombre,
    ubicaciones: JSON.parse(row.ubicaciones)
  }));
});

