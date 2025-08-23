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

// Handler: Pacientes con CHD pendiente de FAV
ipcMain.handle('get-pacientes-chd-pendiente-fav', () => {
  // Filtrado por CHD pendiente de FAV según lógica normalizada en db.js
  return db.getPacientesCHDPendienteFAV();
});

// Handler: Pacientes con FAV pendiente retiro CHD
// Handler para agregar múltiples infecciones a un paciente
ipcMain.handle('add-infecciones', (event, pacienteId, infecciones) => {
  return db.addInfecciones(pacienteId, infecciones);
});
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

// Handler para agregar incidencia con tag
ipcMain.handle('add-incidencia-con-tag', (event, data) => {
  // data: { pacienteId, tagId, tipo_acceso_id, fecha, tipo, microorganismo_asociado, medidas, etiqueta_id, activo }
  // Adaptar a la estructura de la tabla incidencias
  return db.addIncidenciaConTag(
    data.pacienteId,
    data.tagId,
  data.tipo_acceso_id || null,
    data.fecha || null,
    data.tipo || null,
    data.microorganismo_asociado || null,
    data.medidas || null,
    data.etiqueta_id || data.tagId || null,
    typeof data.activo === 'undefined' ? 1 : data.activo
  );
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

// Archiva un paciente
ipcMain.handle('archivar-paciente', (event, id) => {
  // Archivar registros relacionados antes de archivar el paciente
  db.prepare('UPDATE pendiente SET activo = 0 WHERE paciente_id = ? AND activo = 1').run(id);
  db.prepare('UPDATE acceso SET activo = 0 WHERE paciente_id = ? AND activo = 1').run(id);
  db.prepare('UPDATE incidencias SET activo = 0 WHERE paciente_id = ? AND activo = 1').run(id);
  // Si tienes otras tablas relacionadas, agrégalas aquí
  const stmt = db.prepare('UPDATE pacientes SET activo = 0 WHERE id = ? AND activo = 1');
  const info = stmt.run(id);
  return { changes: info.changes };
});

// Eliminar un paciente
ipcMain.handle('delete-paciente', (event, id) => {
  // Eliminar registros relacionados antes de eliminar el paciente
  // Eliminar registros que referencian acceso_id
  // Eliminar todos los pendientes relacionados con el paciente directamente
  db.prepare('DELETE FROM pendiente WHERE paciente_id = ?').run(id);
  db.prepare('DELETE FROM acceso WHERE paciente_id = ?').run(id);
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

ipcMain.handle('historial-add', (event, { paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional_id }) => {
  return db.addHistorialClinico(paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional_id);
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

ipcMain.handle('tags-add', (event, tag) => {
  // tag: { nombre, color, microorganismo_asociado, descripcion, tipo, icono }
  return db.addTag(tag.nombre, tag.color, tag.microorganismo_asociado, tag.descripcion, tag.tipo, tag.icono);
});

ipcMain.handle('tags-update', (event, tag) => {
  // tag: { id, nombre, color, microorganismo_asociado, descripcion, tipo, icono }
  return db.updateTag(tag.id, tag.nombre, tag.color, tag.microorganismo_asociado, tag.descripcion, tag.tipo, tag.icono);
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
  // Devuelve todas las incidencias asociadas al paciente, todos los campos + tagId
  return db.prepare(`
    SELECT i.*, it.tag_id as tagId
    FROM incidencias i
    JOIN incidencia_tags it ON i.id = it.incidencia_id
    WHERE i.paciente_id = ? AND i.activo = 1
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

// Nuevo handler para agregar incidencia desde el modal
ipcMain.handle('incidencias-modal-add', (event, incidencia) => {
  // Llama a la función db.addIncidenciasModal con el objeto incidencia
  return db.addIncidenciasModal(incidencia);
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
  return db.prepare('SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1').get(pacienteId);
});

// --- IPC para profesionales ---
const db = require('./data/db');

// --- IPC para pendientes ---
ipcMain.handle('pendiente-add', (event, pendiente) => {
  console.log('[IPC][pendiente-add] Recibido:', pendiente);
  return db.addPendiente(pendiente);
});

ipcMain.handle('pendiente-edit', (event, pendiente) => {
  console.log('[IPC][pendiente-edit] Recibido:', pendiente);
  return db.editPendiente(pendiente);
});

ipcMain.handle('pendiente-delete', (event, id) => {
  return db.deletePendiente(id);
});

ipcMain.handle('pendiente-archivar', (event, id) => {
  return db.archivarPendiente(id);
});

ipcMain.handle('pendientes-get', () => {
  return db.getPendientes();
});

// Handler para obtener los tipos de pendiente
ipcMain.handle('pendiente-tipos-get', () => {
  return db.prepare('SELECT id, nombre FROM pendiente_tipo').all();
});

// --- Notificaciones ---
ipcMain.handle('notificaciones-get-recientes', (event, limit = 10) => {
  return db.getRecentNotifications(limit);
});

ipcMain.handle('notificaciones-add', (event, notification) => {
  return db.addNotification(notification);
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

// Handler: Incidencias por tipo para estadísticas
ipcMain.handle('get-incidencias-por-tipo', () => {
  return db.getIncidenciasPorTipo ? db.getIncidenciasPorTipo() : [];
});

// Handler: Ranking de profesionales para estadísticas
ipcMain.handle('get-ranking-profesionales', () => {
  return db.getRankingProfesionales ? db.getRankingProfesionales() : [];
});


