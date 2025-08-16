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
  // Lógica real de filtrado en db.js
  return db.getPacientesCHDPendienteFAV ? db.getPacientesCHDPendienteFAV() : [];
});

// Handler: Pacientes con FAV pendiente retiro CHD
ipcMain.handle('get-pacientes-fav-pendiente-retiro-chd', () => {
  // TODO: Reemplazar con lógica real de filtrado en db.js
  return db.getPacientesFAVPendienteRetiroCHD ? db.getPacientesFAVPendienteRetiroCHD() : [];
});

// Handler: Pacientes con CHD, FAV Madurativo
ipcMain.handle('get-pacientes-chd-fav-madurativo', () => {
  // TODO: Reemplazar con lógica real de filtrado en db.js
  return db.getPacientesCHDFAVMadurativo ? db.getPacientesCHDFAVMadurativo() : [];
});

// Handler: Pacientes con Sepsis CHD
ipcMain.handle('get-pacientes-sepsis-chd', () => {
  // TODO: Reemplazar con lógica real de filtrado en db.js
  return db.getPacientesSepsisCHD ? db.getPacientesSepsisCHD() : [];
});

// Ejemplo: Agregar un paciente
ipcMain.handle('add-paciente', (event, paciente) => {
  const stmt = db.prepare(`INSERT INTO pacientes (
    nombre, apellidos, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, avatar,
    sexo, telefono, correo, direccion, alergias, observaciones, profesional_id, fecha_nacimiento, fecha_alta,
    proceso_actual, acceso_proceso
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.avatar || '',
    paciente.sexo || '',
    paciente.telefono || '',
    paciente.correo || '',
    paciente.direccion || '',
    paciente.alergias || '',
    paciente.observaciones || '',
    paciente.profesional_id || null,
    paciente.fecha_nacimiento || '',
    paciente.fecha_alta || '',
    paciente.proceso_actual || null,
    paciente.acceso_proceso || null
  );
  return { id: info.lastInsertRowid };
});
  // Editar un paciente
ipcMain.handle('edit-paciente', (event, paciente) => {
  const stmt = db.prepare(`UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso_id = ?, fecha_instalacion = ?, ubicacion_anatomica = ?, ubicacion_lado = ?, avatar = ?, sexo = ?, telefono = ?, correo = ?, direccion = ?, alergias = ?, observaciones = ?, profesional_id = ?, fecha_nacimiento = ?, fecha_alta = ?, proceso_actual = ?, acceso_proceso = ? WHERE id = ?`);
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.avatar || '',
    paciente.sexo || '',
    paciente.telefono || '',
    paciente.correo || '',
    paciente.direccion || '',
    paciente.alergias || '',
    paciente.observaciones || '',
    paciente.profesional_id || null,
    paciente.fecha_nacimiento || '',
    paciente.fecha_alta || '',
    paciente.proceso_actual || null,
    paciente.acceso_proceso || null,
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
  return db.addTag(nombre, color, descripcion, tipo, icono, ubicaciones);
});

ipcMain.handle('tags-update', (event, { id, nombre, color, descripcion, tipo, icono, ubicaciones }) => {
  return db.updateTag(id, nombre, color, descripcion, tipo, icono, ubicaciones);
});


ipcMain.handle('tags-delete', (event, id) => {
  return db.deleteTag(id);
});

// Eliminado código de persistencia JSON de agenda

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

// --- IPC para profesionales ---
const db = require('./data/db');

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

