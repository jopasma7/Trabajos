const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbDir, dbPath;
// Detectar si estamos en producción (empaquetado) o desarrollo
const isProd = process.mainModule && process.mainModule.filename.indexOf('app.asar') !== -1;
if (isProd) {
  // En producción: usar la carpeta userData de Electron
  const { app } = require('electron');
  dbDir = app.getPath('userData');
  dbPath = path.join(dbDir, 'hospital.db');
} else {
  // En desarrollo: usar la carpeta data del proyecto
  dbDir = path.join(__dirname, '../../data');
  dbPath = path.join(dbDir, 'hospital.db');
}
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
// Activar claves foráneas en SQLite
db.pragma('foreign_keys = ON');

// Crear tabla tipo_acceso (tipos de acceso vascular)
db.prepare(`CREATE TABLE IF NOT EXISTS tipo_acceso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  color TEXT,
  icono TEXT,
  ubicaciones TEXT
)`).run();

// Insertar tipos de acceso predeterminados si no existen
insertarTiposAccesoPredeterminados();

// Crear tabla notificaciones si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER,
  usuario_id INTEGER,
  mensaje TEXT NOT NULL,
  tipo TEXT,
  leido INTEGER DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP,
  extra TEXT,
  FOREIGN KEY(paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
)`).run();

// Crear tabla acceso (relaciona paciente y tipo de acceso)
db.prepare(`CREATE TABLE IF NOT EXISTS acceso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  tipo_acceso_id INTEGER NOT NULL,
  ubicacion_anatomica TEXT,
  ubicacion_lado TEXT,
  fecha_instalacion TEXT,
  fecha_primera_puncion TEXT,
  observaciones TEXT,
  etiqueta_id INTEGER,
  profesional_id INTEGER, -- Nuevo: profesional responsable
  estado TEXT,            -- Nuevo: estado/proceso del acceso
  activo INTEGER DEFAULT 1,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_acceso_id) REFERENCES tipo_acceso(id),
  FOREIGN KEY (etiqueta_id) REFERENCES tags(id),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS pendiente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  pendiente_tipo_id INTEGER,
  tabla_acceso_id_vinculado INTEGER NOT NULL,
  fecha_instalacion_acceso_pendiente TEXT,
  ubicacion_chd TEXT,
  lado_chd TEXT,
  profesional_id INTEGER,
  activo INTEGER DEFAULT 1,
  pendiente_tipo_acceso_id INTEGER,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (tabla_acceso_id_vinculado) REFERENCES acceso(id),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id),
  FOREIGN KEY (pendiente_tipo_id) REFERENCES pendiente_tipo(id),
  FOREIGN KEY (pendiente_tipo_acceso_id) REFERENCES tipo_acceso(id)
)`).run();

// Crear tabla pendiente_tipo (tipos de pendiente)
db.prepare(`CREATE TABLE IF NOT EXISTS pendiente_tipo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
)`).run();

// Insertar tipos de pendiente si no existen
const tiposPendiente = ['Confección / Reparación', 'Retiro', 'Maduración'];
tiposPendiente.forEach(nombre => {
  const existe = db.prepare('SELECT 1 FROM pendiente_tipo WHERE nombre = ?').get(nombre);
  if (!existe) {
    db.prepare('INSERT INTO pendiente_tipo (nombre) VALUES (?)').run(nombre);
  }
});

// Crear tabla incidencias (eventos clínicos, incluyendo sepsis)
db.prepare(`CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  tipo_acceso_id INTEGER,
  fecha TEXT,
  tipo TEXT,
  microorganismo_asociado TEXT,
  medidas TEXT,
  etiqueta_id INTEGER,
  activo INTEGER DEFAULT 1,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_acceso_id) REFERENCES tipo_acceso(id),
  FOREIGN KEY (etiqueta_id) REFERENCES tags(id)
)`).run();

// Crear tabla infecciones (solo infecciones, no incidencias)
// Insertar múltiples infecciones en la tabla infecciones
db.addInfecciones = function(pacienteId, infecciones) {
  if (!Array.isArray(infecciones) || !pacienteId) return { error: 'Datos inválidos' };
  const stmt = db.prepare(`INSERT INTO infecciones (paciente_id, tag_id, fecha_infeccion, observaciones, activo) VALUES (?, ?, ?, ?, 1)`);
  let results = [];
  for (const inf of infecciones) {
    const fecha = inf.fecha || inf.fecha_infeccion || null;
    const obs = inf.comentarios || inf.observaciones || '';
    const tagId = inf.tagId || inf.tag_id || null;
    if (!tagId) continue;
    const info = stmt.run(pacienteId, tagId, fecha, obs);
    results.push(info.lastInsertRowid);
  }
  return { ok: true, count: results.length, ids: results };
};
db.prepare(`CREATE TABLE IF NOT EXISTS infecciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  fecha_infeccion TEXT NOT NULL,
  observaciones TEXT,
  activo INTEGER DEFAULT 1,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id)
)`).run();


// Crear tabla tags (etiquetas personalizables) antes de cualquier migración o uso
db.prepare(`CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#009879',
  microorganismo_asociado TEXT,
  descripcion TEXT,
  tipo TEXT DEFAULT 'incidencia', 
  icono TEXT
)`).run(); 


// Crear tabla profesionales si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS profesionales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  sexo TEXT,
  email TEXT,
  telefono TEXT,
  cargo TEXT,
  numero_colegiado TEXT,
  fecha_nacimiento TEXT,
  direccion TEXT,
  notas TEXT,
  avatar TEXT
)`).run();

// Crear tabla agenda si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  completado INTEGER DEFAULT 0
)`).run();

// Crear tabla pacientes si no existe (solo tipo_acceso_id)
db.prepare(`CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  sexo TEXT,
  fecha_nacimiento TEXT,
  fecha_alta TEXT,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  alergias TEXT,
  avatar TEXT,
  profesional_id INTEGER,
  activo INTEGER DEFAULT 1,
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
)`).run();

// Crear tabla historial_clinico (uno a muchos con pacientes)
db.prepare(`CREATE TABLE IF NOT EXISTS historial_clinico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  tipo_evento TEXT,
  motivo TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  notas TEXT,
  adjuntos TEXT,
  profesional_id INTEGER,
  archivado INTEGER DEFAULT 0,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
)`).run();

// Crear tabla tags (etiquetas personalizables) antes de cualquier migración o uso
db.prepare(`CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#009879',
  descripcion TEXT,
  tipo TEXT DEFAULT 'incidencia',
  icono TEXT,
  ubicaciones TEXT
)`).run();

// Tabla intermedia incidencia_tags (muchos a muchos)

db.prepare(`CREATE TABLE IF NOT EXISTS incidencia_tags (
  incidencia_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (incidencia_id, tag_id),
  FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)`).run();


// --- Métodos para profesionales ---
// Insertar profesional de prueba si no existe
const profesionalPrueba = {
  nombre: 'Prueba',
  apellidos: 'Test',
  sexo: 'Otro',
  email: 'prueba@test.com',
  telefono: '123456789',
  cargo: 'Tester',
  numero_colegiado: '0000',
  fecha_nacimiento: '1990-01-01',
  direccion: 'Calle Falsa 123',
  notas: 'Profesional de prueba',
  avatar: ''
};
const existePrueba = db.prepare('SELECT 1 FROM profesionales WHERE nombre = ? AND apellidos = ?').get(profesionalPrueba.nombre, profesionalPrueba.apellidos);
if (!existePrueba) {
  db.prepare(`INSERT INTO profesionales (nombre, apellidos, sexo, email, telefono, cargo, numero_colegiado, fecha_nacimiento, direccion, notas, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      profesionalPrueba.nombre,
      profesionalPrueba.apellidos,
      profesionalPrueba.sexo,
      profesionalPrueba.email,
      profesionalPrueba.telefono,
      profesionalPrueba.cargo,
      profesionalPrueba.numero_colegiado,
      profesionalPrueba.fecha_nacimiento,
      profesionalPrueba.direccion,
      profesionalPrueba.notas,
      profesionalPrueba.avatar
    );
}
db.addProfesional = function(prof) {
  const stmt = db.prepare(`INSERT INTO profesionales (nombre, apellidos, sexo, email, telefono, cargo, numero_colegiado, fecha_nacimiento, direccion, notas, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    prof.nombre,
    prof.apellidos,
    prof.sexo || '',
    prof.email || '',
    prof.telefono || '',
    prof.cargo || '',
    prof.numero_colegiado || '',
    prof.fecha_nacimiento || '',
    prof.direccion || '',
    prof.notas || '',
    prof.avatar || ''
  );
  return { id: info.lastInsertRowid };
};

db.editProfesional = function(prof) {
  const stmt = db.prepare(`UPDATE profesionales SET nombre = ?, apellidos = ?, sexo = ?, email = ?, telefono = ?, cargo = ?, numero_colegiado = ?, fecha_nacimiento = ?, direccion = ?, notas = ?, avatar = ? WHERE id = ?`);
  const info = stmt.run(
    prof.nombre,
    prof.apellidos,
    prof.sexo || '',
    prof.email || '',
    prof.telefono || '',
    prof.cargo || '',
    prof.numero_colegiado || '',
    prof.fecha_nacimiento || '',
    prof.direccion || '',
    prof.notas || '',
    prof.avatar || '',
    prof.id
  );
  return { changes: info.changes };
};

db.deleteProfesional = function(id) {
  const stmt = db.prepare('DELETE FROM profesionales WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

db.getProfesionales = function() {
  return db.prepare('SELECT * FROM profesionales ORDER BY nombre, apellidos').all();
};



// --- Métodos para incidencias ---
db.getIncidenciasByPaciente = function(pacienteId) {
  return db.prepare('SELECT * FROM incidencias WHERE paciente_id = ? AND activo = 1 ORDER BY fecha DESC, id DESC').all(pacienteId);
};

// Crear una incidencia y asociar un tag (motivo y fecha personalizados)
db.addIncidenciaConTag = function(pacienteId, tagId, motivo, fecha) {
  // Insertar nueva incidencia with todos los campos relevantes
  // Si motivo se usaba como tipo, ahora se guarda en tipo
  // Los argumentos: pacienteId, tagId, tipo_acceso_id, fecha, tipo, microorganismo_asociado, medidas, etiqueta_id, activo
  const insertIncidencia = db.prepare(`
    INSERT INTO incidencias (
      paciente_id, tipo_acceso_id, fecha, tipo, microorganismo_asociado, medidas, etiqueta_id, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insertIncidencia.run(
    pacienteId,
  arguments[2] || null, // tipo_acceso_id
    arguments[3] || null, // fecha
    arguments[4] || null, // tipo
    arguments[5] || null, // microorganismo_asociado
    arguments[6] || null, // medidas
    arguments[7] || tagId || null, // etiqueta_id
    typeof arguments[8] === 'undefined' ? 1 : arguments[8] // activo
  );
  const incidenciaId = result.lastInsertRowid;
  // Asociar el tag a la incidencia
  const insertTag = db.prepare('INSERT INTO incidencia_tags (incidencia_id, tag_id) VALUES (?, ?)');
  insertTag.run(incidenciaId, tagId);
  return incidenciaId;
};


// Actualizar etiquetas de incidencias para la incidencia más reciente de un paciente
// Permite motivo y fecha personalizados para la incidencia inicial
db.setEtiquetasForPaciente = function(pacienteId, tagIds, motivoPersonalizado, fechaPersonalizada) {
  // Obtener la incidencia más reciente del paciente
  let incidencia = db.prepare('SELECT id FROM incidencias WHERE paciente_id = ? ORDER BY fecha DESC, id DESC LIMIT 1').get(pacienteId);
  // Si no existe, crear una incidencia inicial personalizada
  if (!incidencia) {
    let motivo = motivoPersonalizado || 'Etiquetas iniciales';
    let fecha = fechaPersonalizada || (new Date()).toISOString().split('T')[0];
    const info = db.addIncidencia(pacienteId, motivo, fecha);
    incidencia = { id: info.id };
  }
  // Eliminar etiquetas actuales
  db.prepare('DELETE FROM incidencia_tags WHERE incidencia_id = ?').run(incidencia.id);
  // Insertar nuevas etiquetas
  const insert = db.prepare('INSERT INTO incidencia_tags (incidencia_id, tag_id) VALUES (?, ?)');
  let changes = 0;
  for (const tagId of tagIds) {
    insert.run(incidencia.id, tagId);
    changes++;
  }
  return { changes };
};


// Obtener IDs de etiquetas asociadas a las incidencias de un paciente
db.getEtiquetasByPaciente = function(pacienteId) {
  // Busca todas las incidencias del paciente y sus tags
  return db.prepare(`
    SELECT DISTINCT t.id
    FROM incidencias i
    JOIN incidencia_tags it ON i.id = it.incidencia_id
    JOIN tags t ON it.tag_id = t.id
    WHERE i.paciente_id = ? AND i.activo = 1
  `).all(pacienteId).map(row => row.id);
};


db.addIncidencia = function(pacienteId, motivo, fecha) {
  const stmt = db.prepare('INSERT INTO incidencias (paciente_id, motivo, fecha) VALUES (?, ?, ?)');
  const info = stmt.run(pacienteId, motivo, fecha);
  return { id: info.lastInsertRowid };
};

db.deleteIncidencia = function(incidenciaId) {
  const stmt = db.prepare('DELETE FROM incidencias WHERE id = ?');
  const info = stmt.run(incidenciaId);
  return { changes: info.changes };
};

// --- Métodos para tags (etiquetas) ---
db.getAllTags = function() {
  // Parsear ubicaciones JSON
  return db.prepare('SELECT * FROM tags ORDER BY nombre COLLATE NOCASE').all().map(tag => {
    if (tag.ubicaciones) {
      try { tag.ubicaciones = JSON.parse(tag.ubicaciones); } catch { tag.ubicaciones = []; }
    } else {
      tag.ubicaciones = [];
    }
    return tag;
  });
};

db.getTagById = function(tagId) {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
  if (tag && tag.ubicaciones) {
    try { tag.ubicaciones = JSON.parse(tag.ubicaciones); } catch { tag.ubicaciones = []; }
  } else if (tag) {
    tag.ubicaciones = [];
  }
  return tag;
};

db.addTag = function(nombre, color, microorganismo_asociado, descripcion, tipo, icono) {
  // nombre, color, microorganismo_asociado, descripcion, tipo, icono
  const stmt = db.prepare('INSERT INTO tags (nombre, color, microorganismo_asociado, descripcion, tipo, icono) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(nombre, color, microorganismo_asociado, descripcion, tipo, icono);
  return { id: info.lastInsertRowid };
};

db.updateTag = function(id, nombre, color, descripcion, tipo = 'incidencia') {
db.updateTag = function(id, nombre, color, microorganismo_asociado, descripcion, tipo, icono) {
  // Actualiza todos los campos correctamente
  const stmt = db.prepare('UPDATE tags SET nombre = ?, color = ?, microorganismo_asociado = ?, descripcion = ?, tipo = ?, icono = ? WHERE id = ?');
  const info = stmt.run(nombre, color, microorganismo_asociado, descripcion, tipo, icono, id);
  return { changes: info.changes };
};
};

db.deleteTag = function(id) {
  const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};


db.getAllPacientes = function() {
  return db.prepare('SELECT * FROM pacientes WHERE activo = 1').all();
};

db.addPaciente = function(paciente) {
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, sexo, fecha_nacimiento, fecha_alta, telefono, correo, direccion, alergias, avatar, profesional_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.sexo || '',
    paciente.fecha_nacimiento || '',
    paciente.fecha_alta || '',
    paciente.telefono || '',
    paciente.correo || '',
    paciente.direccion || '',
    paciente.alergias || '',
    paciente.avatar || '',
    paciente.profesional_id || null
  );
  return { id: info.lastInsertRowid };
};

db.editPaciente = function(paciente) {
  const stmt = db.prepare('UPDATE pacientes SET nombre = ?, apellidos = ?, sexo = ?, fecha_nacimiento = ?, fecha_alta = ?, telefono = ?, correo = ?, direccion = ?, alergias = ?, avatar = ?, profesional_id = ? WHERE id = ?');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.sexo || '',
    paciente.fecha_nacimiento || '',
    paciente.fecha_alta || '',
    paciente.telefono || '',
    paciente.correo || '',
    paciente.direccion || '',
    paciente.alergias || '',
    paciente.avatar || '',
    paciente.profesional_id || null,
    paciente.id
  );
  return { changes: info.changes };
};
// Actualizar solo el avatar de un paciente
db.setPacienteAvatar = function(pacienteId, avatarData) {
  const stmt = db.prepare('UPDATE pacientes SET avatar = ? WHERE id = ?');
  const info = stmt.run(avatarData, pacienteId);
  return { changes: info.changes };
};
// Obtener avatar de un paciente
db.getPacienteAvatar = function(pacienteId) {
  const stmt = db.prepare('SELECT avatar FROM pacientes WHERE id = ?');
  const row = stmt.get(pacienteId);
  return row ? row.avatar : '';
};

// Obtener solo pacientes archivados
db.getPacientesArchivados = function() {
  return db.prepare('SELECT * FROM pacientes WHERE activo = 0').all();
};

db.deletePaciente = function(id) {
  const stmt = db.prepare('DELETE FROM pacientes WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

// --- Métodos para historial clínico ---
db.getHistorialClinicoByPaciente = function(pacienteId) {
  return db.prepare('SELECT * FROM historial_clinico WHERE paciente_id = ? AND archivado = 0 ORDER BY fecha DESC, id DESC').all(pacienteId);
};

db.addHistorialClinico = function(pacienteId, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional) {
  const stmt = db.prepare('INSERT INTO historial_clinico (paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(pacienteId, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional);
  return { id: info.lastInsertRowid };
};

// Editar una entrada de historial clínico
db.updateHistorialClinico = function(id, fields) {
  const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'paciente_id');
  const setStr = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(id);
  const stmt = db.prepare(`UPDATE historial_clinico SET ${setStr} WHERE id = ?`);
  const info = stmt.run(...values);
  return { changes: info.changes };
};

// Eliminar una entrada de historial clínico
db.archiveHistorialClinico = function(id) {
  const stmt = db.prepare('UPDATE historial_clinico SET archivado = 1 WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

// Eliminar definitivamente una entrada de historial clínico
db.deleteHistorial = function(id) {
  const stmt = db.prepare('DELETE FROM historial_clinico WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};
db.getHistorialArchivadoByPaciente = function(pacienteId) { 
  return db.prepare('SELECT * FROM historial_clinico WHERE paciente_id = ? AND archivado = 1 ORDER BY fecha DESC, id DESC').all(pacienteId);
};

// Obtener paciente con datos de acceso para edición
// Obtener todos los datos completos de todos los pacientes
db.getPacientesCompletos = function() {
  // Obtener todos los pacientes activos
  const pacientes = db.prepare('SELECT * FROM pacientes WHERE activo = 1').all();
  if (pacientes.length === 0) {
    return [];
  }
  return pacientes.map(paciente => {
    // Acceso más reciente
    const acceso = db.prepare('SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1 ORDER BY id DESC LIMIT 1').get(paciente.id);
    // Tipo de acceso
    let tipoAcceso = null;
    if (acceso && acceso.tipo_acceso_id) {
      tipoAcceso = db.prepare('SELECT * FROM tipo_acceso WHERE id = ?').get(acceso.tipo_acceso_id);
    }
    // Pendiente activo más reciente
    const pendiente = db.getPendienteActualByPaciente(paciente.id);
    // Etiquetas
    const etiquetas = db.getEtiquetasByPaciente(paciente.id);
    // Infecciones con tag
    let infecciones = db.prepare('SELECT * FROM infecciones WHERE paciente_id = ? AND activo = 1').all(paciente.id);
    infecciones = infecciones.map(inf => ({
      ...inf,
      tag: db.prepare('SELECT * FROM tags WHERE id = ?').get(inf.tag_id)
    }));
    // Incidencias con tag
    let incidencias = db.prepare('SELECT i.*, it.tag_id as tagId FROM incidencias i JOIN incidencia_tags it ON i.id = it.incidencia_id WHERE i.paciente_id = ? AND i.activo = 1 ORDER BY i.fecha DESC, i.id DESC').all(paciente.id);
    incidencias = incidencias.map(inc => ({
      ...inc,
      tag: db.prepare('SELECT * FROM tags WHERE id = ?').get(inc.tagId)
    }));
    return {
      ...paciente,
      acceso: acceso || {},
      tipo_acceso: tipoAcceso || {},
      pendiente: pendiente || {},
      etiquetas,
      infecciones,
      incidencias
    };
  });
};
db.getPacienteConAcceso = function(pacienteId) {
  // Obtener datos de paciente
  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ? AND activo = 1').get(pacienteId);
  if (!paciente) return null;
  // Obtener acceso más reciente
  const acceso = db.prepare('SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1 ORDER BY id DESC LIMIT 1').get(pacienteId);
  // Tipo de acceso
  let tipoAcceso = null;
  if (acceso && acceso.tipo_acceso_id) {
    tipoAcceso = db.prepare('SELECT * FROM tipo_acceso WHERE id = ?').get(acceso.tipo_acceso_id);
  }
  // Pendiente activo más reciente
  const pendiente = db.getPendienteActualByPaciente(pacienteId);
  if (pendiente && (pendiente.ubicacion_chd || pendiente.lado_chd)) {
  // No concatenar, devolver por separado
  }
  // Etiquetas
  const etiquetas = db.getEtiquetasByPaciente(pacienteId);
  // Infecciones con tag
  let infecciones = db.prepare('SELECT * FROM infecciones WHERE paciente_id = ? AND activo = 1').all(pacienteId);
  infecciones = infecciones.map(inf => ({
    ...inf,
    tag: db.prepare('SELECT * FROM tags WHERE id = ?').get(inf.tag_id)
  }));
  return {
    ...paciente,
    acceso: acceso || {},
    tipo_acceso: tipoAcceso || {},
    pendiente: pendiente || {},
    etiquetas,
    infecciones
  };
};


// Desarchivar una entrada de historial clínico
db.unarchiveHistorialClinico = function(id) {
  const stmt = db.prepare('UPDATE historial_clinico SET archivado = 0 WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

// Pacientes con CHD pendiente de FAV
// Se asume que tipo_acceso_id corresponde a CHD y proceso_actual corresponde a "Pendiente de confección / reparación" (proceso)
db.getPacientesCHDPendienteFAV = function() {
  // Consulta robusta: pacientes con pendiente activa de tipo 'Confección / Reparación' y acceso 'Fístula'
  const pacientes = db.prepare(`
    SELECT p.* FROM pacientes p
    INNER JOIN acceso a_chd ON a_chd.paciente_id = p.id AND a_chd.activo = 1 AND a_chd.tipo_acceso_id = (SELECT id FROM tipo_acceso WHERE LOWER(nombre) LIKE LOWER('%catéter%'))
    INNER JOIN pendiente pen ON pen.paciente_id = p.id
    INNER JOIN pendiente_tipo pt ON pen.pendiente_tipo_id = pt.id
    WHERE pen.activo = 1 AND p.activo = 1
      AND pt.nombre LIKE '%Confección%'
      AND pen.pendiente_tipo_acceso_id IN (SELECT id FROM tipo_acceso WHERE nombre LIKE '%Fístula%')
  `).all();
  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
    // Acceso más reciente y datos relevantes
    const acceso = db.prepare('SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1 ORDER BY id DESC LIMIT 1').get(p.id);
    if (acceso) {
      // Formatear fecha de instalación DD-MM-YYYY
      if (acceso.fecha_instalacion) {
        const partes = acceso.fecha_instalacion.split('-');
        p.fecha_instalacion = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : acceso.fecha_instalacion;
      } else {
        p.fecha_instalacion = undefined;
      }
      // Ubicación CHD y lado
      p.ubicacion_chd = acceso.ubicacion_anatomica || undefined;
      p.ubicacion_lado = acceso.ubicacion_lado || undefined;
      p.observaciones = acceso.observaciones || '';
    } else {
      p.fecha_instalacion = undefined;
      p.ubicacion_chd = undefined;
      p.ubicacion_lado = undefined;
      p.observaciones = '';
    }
  });
  return pacientes;
};

// Pacientes con FAV pendiente retiro CHD
db.getPacientesFAVPendienteRetiroCHD = function() {
  // Buscar el id de tipo_acceso para Fístula y Catéter
  const favTipo = db.prepare("SELECT id FROM tipo_acceso WHERE LOWER(nombre) LIKE LOWER(?)").get('%fístula%');
  const chdTipo = db.prepare("SELECT id FROM tipo_acceso WHERE LOWER(nombre) LIKE LOWER(?)").get('%catéter%');
  if (!favTipo || !chdTipo) return [];

  // Consulta: pacientes con acceso FAV actual y pendiente de retiro CHD (catéter) activo
  const pacientes = db.prepare(`
    SELECT p.*
    FROM pacientes p
    INNER JOIN acceso a_fav ON a_fav.paciente_id = p.id AND a_fav.activo = 1 AND a_fav.tipo_acceso_id = ?
    INNER JOIN pendiente pen ON pen.paciente_id = p.id AND pen.activo = 1 AND pen.pendiente_tipo_id = (SELECT id FROM pendiente_tipo WHERE nombre LIKE '%Retiro%') AND pen.pendiente_tipo_acceso_id = ?
    WHERE p.activo = 1
  `).all(favTipo.id, chdTipo.id);

  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
    // Acceso FAV actual
    const accesoFAV = db.prepare("SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1 AND tipo_acceso_id = ? ORDER BY id DESC LIMIT 1").get(p.id, favTipo.id);
    // Pendiente de retiro CHD (catéter)
    const pendienteCHD = db.prepare("SELECT * FROM pendiente WHERE paciente_id = ? AND activo = 1 AND pendiente_tipo_id = (SELECT id FROM pendiente_tipo WHERE nombre LIKE '%Retiro%') AND pendiente_tipo_acceso_id = ? ORDER BY id DESC LIMIT 1").get(p.id, chdTipo.id);
    // Llenar campos para el reporte
  p.ubicacion_fav = accesoFAV ? [accesoFAV.ubicacion_anatomica, accesoFAV.ubicacion_lado].filter(Boolean).join(' | ') : '';
  p.fecha_instalacion_fav = accesoFAV && accesoFAV.fecha_instalacion ? accesoFAV.fecha_instalacion.split('-').reverse().join('-') : '';
  p.fecha_primera_puncion = accesoFAV && accesoFAV.fecha_primera_puncion ? accesoFAV.fecha_primera_puncion : '';
  // Devolver ubicacion_chd y lado_chd por separado, sin concatenar
  p.ubicacion_chd = pendienteCHD ? pendienteCHD.ubicacion_chd : '';
  p.lado_chd = pendienteCHD ? pendienteCHD.lado_chd : '';
  p.fecha_instalacion_chd = pendienteCHD ? pendienteCHD.fecha_instalacion_acceso_pendiente : '';
    // Añadir observaciones de acceso FAV y pendiente CHD
    p.observaciones_fav = accesoFAV ? accesoFAV.observaciones : '';
    p.observaciones_chd = pendienteCHD ? pendienteCHD.observaciones : '';
  });
  return pacientes;
};

// Pacientes con CHD y proceso madurativo de FAV
db.getPacientesCHDFAVMadurativo = function() {
  // Buscar el id de la etiqueta "Catéter" en tipo_acceso (CHD)
  const chdTipo = db.prepare("SELECT id FROM tipo_acceso WHERE LOWER(nombre) LIKE LOWER(?)").get('%catéter%');
  if (!chdTipo) return [];
  // Buscar el id de la etiqueta "Fístula" en tipo_acceso (FAV)
  const favTipo = db.prepare("SELECT id FROM tipo_acceso WHERE LOWER(nombre) LIKE LOWER(?)").get('%fístula%');
  if (!favTipo) return [];
  // Obtener el id de pendiente_tipo para 'Maduración'
  const maduracionTipo = db.prepare("SELECT id FROM pendiente_tipo WHERE LOWER(nombre) LIKE LOWER(?)").get('%maduración%');
  if (!maduracionTipo) return [];
  const rows = db.prepare(`
    SELECT p.id, p.nombre, p.apellidos,
           a_chd.ubicacion_anatomica AS ubicacion_chd,
           a_chd.fecha_instalacion AS fecha_instalacion_chd,
           pen.ubicacion_chd AS ubicacion_fav,
           pen.fecha_instalacion_acceso_pendiente AS fecha_instalacion_fav
    FROM pacientes p
    JOIN acceso a_chd ON a_chd.paciente_id = p.id AND a_chd.activo = 1 AND a_chd.tipo_acceso_id = ?
    JOIN pendiente pen ON pen.paciente_id = p.id AND pen.activo = 1 AND pen.pendiente_tipo_acceso_id = ? AND pen.pendiente_tipo_id = ?
    WHERE p.activo = 1
  `).all(chdTipo.id, favTipo.id, maduracionTipo.id);
  // Formatear resultado para la tabla
  const resultado = rows.map((p, idx) => {
    // Obtener observaciones de acceso CHD y pendiente FAV
    const accesoCHD = db.prepare("SELECT observaciones FROM acceso WHERE paciente_id = ? AND activo = 1 AND tipo_acceso_id = ? ORDER BY id DESC LIMIT 1").get(p.id, chdTipo.id);
  // Obtener observaciones del acceso FAV madurativo
  const accesoFAV = db.prepare("SELECT observaciones FROM acceso WHERE paciente_id = ? AND activo = 1 AND tipo_acceso_id = ? ORDER BY id DESC LIMIT 1").get(p.id, favTipo.id);
    return {
      numero: idx + 1,
      usuario: `${p.nombre} ${p.apellidos}`,
      ubicacion_chd: p.ubicacion_chd || '',
      fecha_instalacion_chd: p.fecha_instalacion_chd || '',
      ubicacion_fav: p.ubicacion_fav || '',
      fecha_instalacion_fav: p.fecha_instalacion_fav || '',
  observaciones_chd: accesoCHD ? accesoCHD.observaciones : '',
  observaciones_fav: accesoFAV ? accesoFAV.observaciones : ''
    };
  });
  return resultado;
  //   chdTipo,
  //   favTipo,
  //   maduracionTipo
  // });
  return resultado;
};

// Pacientes con CHD y diagnóstico de Sepsis
db.getPacientesSepsisCHD = function() {
  // Seleccionar infecciones activas asociadas a CHD (catéter) y pacientes activos, incluyendo tipo de acceso actual
  const rows = db.prepare(`
    SELECT 
      inf.id as id,
      p.nombre || ' ' || p.apellidos as paciente,
      inf.fecha_infeccion as fecha_diagnostico,
      t.microorganismo_asociado as microorganismo,
      inf.observaciones as medidas,
      ta.nombre as tipo_acceso
    FROM infecciones inf
    JOIN pacientes p ON p.id = inf.paciente_id
    JOIN tags t ON t.id = inf.tag_id
    LEFT JOIN acceso a ON a.paciente_id = p.id AND a.activo = 1
    LEFT JOIN tipo_acceso ta ON a.tipo_acceso_id = ta.id
    WHERE inf.activo = 1 AND p.activo = 1
      AND t.tipo = 'infeccion'
    GROUP BY inf.id
    ORDER BY inf.fecha_infeccion DESC
  `).all();
  // Añadir número correlativo
  return rows.map((row, idx) => ({
    numero: idx + 1,
    paciente: row.paciente,
    tipo_acceso: row.tipo_acceso || '',
    fecha_diagnostico: row.fecha_diagnostico,
    microorganismo: row.microorganismo,
    medidas: row.medidas
  }));
};

// Estadísticas: Incidencias por tipo
db.getIncidenciasPorTipo = function() {
  // Agrupa incidencias activas por tipo
  const rows = db.prepare(`
    SELECT tipo, COUNT(*) as cantidad
    FROM incidencias
    WHERE activo = 1
    GROUP BY tipo
    ORDER BY cantidad DESC
  `).all();
  return rows;
};

// Estadísticas: Ranking de profesionales
db.getRankingProfesionales = function() {
  // Cuenta pacientes atendidos por profesional
  const rows = db.prepare(`
    SELECT p.nombre || ' ' || p.apellidos as nombre, COUNT(pa.id) as pacientes_atendidos
    FROM profesionales p
    LEFT JOIN pacientes pa ON pa.profesional_id = p.id AND pa.activo = 1
    GROUP BY p.id
    ORDER BY pacientes_atendidos DESC
  `).all();
  return rows;
};



// --- Métodos de agenda ---
db.getAllEventos = function() {
  // Convertir completado INTEGER a booleano
  return db.prepare('SELECT * FROM agenda ORDER BY fecha ASC, hora ASC').all().map(ev => ({
    ...ev,
    completado: !!ev.completado
  }));
};

db.upsertEventos = function(eventos) {
  const idsEnviado = eventos.map(e => e.id);
  // Eliminar los que no están en el array
  const idsEnBD = db.prepare('SELECT id FROM agenda').all().map(r => r.id);
  const idsAEliminar = idsEnBD.filter(id => !idsEnviado.includes(id));
  const deleteStmt = db.prepare('DELETE FROM agenda WHERE id = ?');
  idsAEliminar.forEach(id => deleteStmt.run(id));
  // Insertar o actualizar
  const upsertStmt = db.prepare(`INSERT INTO agenda (id, fecha, hora, titulo, descripcion, categoria, completado) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET fecha=excluded.fecha, hora=excluded.hora, titulo=excluded.titulo, descripcion=excluded.descripcion, categoria=excluded.categoria, completado=excluded.completado`);
  eventos.forEach(ev => {
    upsertStmt.run(
      ev.id,
      ev.fecha,
      ev.hora,
      ev.titulo,
      ev.descripcion,
      ev.categoria || null,
      ev.completado ? 1 : 0
    );
  });  
  return true;
};

// Inserta una incidencia desde el modal, recibe un objeto con todos los campos
db.addIncidenciasModal = function(incidencia) {
  // Ajusta los campos según la estructura de la tabla incidencias
  const stmt = db.prepare(`INSERT INTO incidencias (paciente_id, tipo_acceso_id, fecha, tipo, medidas, etiqueta_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    incidencia.paciente_id,
    incidencia.tipo_acceso_id,
    incidencia.fecha,
    incidencia.tipo,
    incidencia.medidas,
    incidencia.etiqueta_id,
    incidencia.activo
  );
  // Si hay etiqueta_id, crear relación en incidencia_tags
  if (incidencia.etiqueta_id) {
    const incidenciaId = info.lastInsertRowid;
    const stmtTag = db.prepare('INSERT OR IGNORE INTO incidencia_tags (incidencia_id, tag_id) VALUES (?, ?)');
    stmtTag.run(incidenciaId, incidencia.etiqueta_id);
  }
  return { success: info.changes > 0, id: info.lastInsertRowid };
};
// Inserta una incidencia con motivo y fecha como antes
db.addIncidencia = function(pacienteId, motivo, fecha) {
  const stmt = db.prepare('INSERT INTO incidencias (paciente_id, motivo, fecha) VALUES (?, ?, ?)');
  const info = stmt.run(pacienteId, motivo, fecha);
  return { success: info.changes > 0, id: info.lastInsertRowid };
};

 
// Actualiza un paciente y sus relaciones normalizadas
db.editPacienteCompleto = function(paciente) {
  // --- INICIO REESTRUCTURACIÓN ---
  // Obtener datos actuales del paciente
  const pacienteActual = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(paciente.id);
  let cambios = { paciente: false, acceso: false, pendiente: false };

  // --- LÓGICA DE PACIENTE ---
  function normalizaValor(v) {
    if (v === undefined || v === null || v === '') return null;
    if (!isNaN(v) && v !== true && v !== false) return Number(v);
    return v;
  }
  function valoresIguales(a, b) {
    return normalizaValor(a) === normalizaValor(b);
  }
  // Compara campos relevantes del paciente
  if (pacienteActual) {
    if (!valoresIguales(pacienteActual.nombre, paciente.nombre) ||
      !valoresIguales(pacienteActual.apellidos, paciente.apellidos) ||
      !valoresIguales(pacienteActual.sexo, paciente.sexo) ||
      !valoresIguales(pacienteActual.fecha_nacimiento, paciente.fecha_nacimiento) ||
      !valoresIguales(pacienteActual.telefono, paciente.telefono) ||
      !valoresIguales(pacienteActual.correo, paciente.correo) ||
      !valoresIguales(pacienteActual.direccion, paciente.direccion) ||
      !valoresIguales(pacienteActual.alergias, paciente.alergias) ||
      !valoresIguales(pacienteActual.avatar, paciente.avatar) ||
      !valoresIguales(pacienteActual.profesional_id, paciente.profesional_id)) {
      cambios.paciente = true;
      db.prepare(`UPDATE pacientes SET nombre = ?, apellidos = ?, sexo = ?, fecha_nacimiento = ?, telefono = ?, correo = ?, direccion = ?, alergias = ?, avatar = ?, profesional_id = ? WHERE id = ?`).run(
        paciente.nombre,
        paciente.apellidos,
        paciente.sexo || '',
        paciente.fecha_nacimiento || '',
        paciente.telefono || '',
        paciente.correo || '',
        paciente.direccion || '',
        paciente.alergias || '',
        paciente.avatar || '',
        paciente.profesional_id || null,
        paciente.id
      );
    }
  }
  // --- LÓGICA DE ACCESO ---
  const accesoActual = db.prepare('SELECT * FROM acceso WHERE paciente_id = ? AND activo = 1 ORDER BY id DESC LIMIT 1').get(paciente.id);
  const accesoData = paciente.acceso || {};
  const hayCambiosAcceso = accesoActual && (
    !valoresIguales(accesoActual.tipo_acceso_id, accesoData.tipo_acceso_id) ||
    !valoresIguales(accesoActual.fecha_instalacion, accesoData.fecha_instalacion) ||
    !valoresIguales(accesoActual.ubicacion_anatomica, accesoData.ubicacion_anatomica) ||
    !valoresIguales(accesoActual.ubicacion_lado, accesoData.ubicacion_lado) ||
    !valoresIguales(accesoActual.profesional_id, accesoData.profesional_id) ||
    !valoresIguales(accesoActual.estado, accesoData.estado) ||
    !valoresIguales(accesoActual.observaciones, accesoData.observaciones) ||
    !valoresIguales(accesoActual.fecha_primera_puncion, accesoData.fecha_primera_puncion)
  );
  if (accesoActual && hayCambiosAcceso) {
    cambios.acceso = true;
    db.prepare('UPDATE acceso SET activo = 0 WHERE id = ?').run(accesoActual.id);
    db.prepare('INSERT INTO acceso (paciente_id, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, fecha_primera_puncion, observaciones, profesional_id, estado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)').run(
      paciente.id,
      accesoData.tipo_acceso_id || null,
      accesoData.fecha_instalacion || '',
      accesoData.ubicacion_anatomica || '',
      accesoData.ubicacion_lado || '',
      accesoData.fecha_primera_puncion || '',
      accesoData.observaciones || '',
      accesoData.profesional_id || null,
      accesoData.estado || ''
    );
  } else if (!accesoActual && Object.keys(accesoData).length > 0) {
    db.prepare('INSERT INTO acceso (paciente_id, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, fecha_primera_puncion, observaciones, profesional_id, estado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)').run(
      paciente.id,
      accesoData.tipo_acceso_id || null,
      accesoData.fecha_instalacion || '',
      accesoData.ubicacion_anatomica || '',
      accesoData.ubicacion_lado || '',
      accesoData.fecha_primera_puncion || '',
      accesoData.observaciones || '',
      accesoData.profesional_id || null,
      accesoData.estado || ''
    );
    cambios.acceso = true;
  }

// --- LÓGICA DE PENDIENTE ---
  if (paciente.pendiente && paciente.pendiente.pendiente_tipo_id) {
    // Si hay pendiente, actualizar como antes
    const pendienteActivo = db.prepare('SELECT * FROM pendiente WHERE paciente_id = ? AND activo = 1').get(paciente.id);
    if (pendienteActivo) {
      db.prepare('UPDATE pendiente SET activo = 0 WHERE id = ?').run(pendienteActivo.id);
    }
    db.addPendiente({
      paciente_id: paciente.id,
      tabla_acceso_id_vinculado: paciente.pendiente.tabla_acceso_id_vinculado,
      fecha_instalacion_acceso_pendiente: paciente.pendiente.fecha_instalacion_acceso_pendiente || '',
      ubicacion_chd: paciente.pendiente.ubicacion_chd || '',
      lado_chd: paciente.pendiente.lado_chd || '',
      profesional_id: paciente.pendiente.profesional_id || paciente.profesional_id || null,
      pendiente_tipo_id: paciente.pendiente.pendiente_tipo_id,
      pendiente_tipo_acceso_id: paciente.pendiente.pendiente_tipo_acceso_id,
      activo: 1
    });
  } else {
    // Si NO hay pendiente, desactivar cualquier pendiente activo anterior
    db.prepare('UPDATE pendiente SET activo = 0 WHERE paciente_id = ? AND activo = 1').run(paciente.id);
  }

  // ...existing code...
  if (pacienteActual) {
    if (
      !valoresIguales(pacienteActual.nombre, paciente.nombre) ||
      !valoresIguales(pacienteActual.apellidos, paciente.apellidos) ||
      !valoresIguales(pacienteActual.sexo, paciente.sexo) ||
      !valoresIguales(pacienteActual.fecha_nacimiento, paciente.fecha_nacimiento) ||
      !valoresIguales(pacienteActual.telefono, paciente.telefono) ||
      !valoresIguales(pacienteActual.correo, paciente.correo) ||
      !valoresIguales(pacienteActual.direccion, paciente.direccion) ||
      !valoresIguales(pacienteActual.alergias, paciente.alergias) ||
      !valoresIguales(pacienteActual.avatar, paciente.avatar) ||
      !valoresIguales(pacienteActual.profesional_id, paciente.profesional_id)
    ) {
      db.prepare(`UPDATE pacientes SET nombre = ?, apellidos = ?, sexo = ?, fecha_nacimiento = ?, telefono = ?, correo = ?, direccion = ?, alergias = ?, avatar = ?, profesional_id = ? WHERE id = ?`).run(
        paciente.nombre,
        paciente.apellidos,
        paciente.sexo || '',
        paciente.fecha_nacimiento || '',
        paciente.telefono || '',
        paciente.correo || '',
        paciente.direccion || '',
        paciente.alergias || '',
        paciente.avatar || '',
        paciente.profesional_id || null,
        paciente.id
      );
    }
  }
  // ...existing code...

  // Si hubo cambios en cualquier parte, devolver changes: 1
  if (cambios.paciente || cambios.acceso || cambios.pendiente) {
    return { changes: 1 };
  } else {
    return { changes: 0 };
  }
  // --- FIN REESTRUCTURACIÓN ---
};

// Inserta un paciente y sus relaciones normalizadas
db.addPacienteCompleto = function(paciente) {
  // Insertar paciente principal
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, sexo, fecha_nacimiento, fecha_alta, telefono, correo, direccion, alergias, avatar, profesional_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.sexo || '',
    paciente.fecha_nacimiento || '',
    paciente.fecha_alta || '',
    paciente.telefono || '',
    paciente.correo || '',
    paciente.direccion || '',
    paciente.alergias || '',
    paciente.avatar || '',
    paciente.profesional_id || null
  );
  const pacienteId = info.lastInsertRowid;

  // Crear acceso asociado al paciente SOLO usando paciente.acceso
  const acceso = paciente.acceso || {};
  const stmtAccesoInsert = db.prepare('INSERT INTO acceso (paciente_id, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, fecha_primera_puncion, observaciones, profesional_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const infoAcceso = stmtAccesoInsert.run(
    pacienteId,
    acceso.tipo_acceso_id || null,
    acceso.fecha_instalacion || paciente.fecha_alta || '',
    acceso.ubicacion_anatomica || '',
    acceso.ubicacion_lado || '',
    acceso.fecha_primera_puncion || '',
    acceso.observaciones || '',
    acceso.profesional_id || null,
    acceso.estado || ''
  );
  const accesoId = infoAcceso.lastInsertRowid;

  // Crear registro en tabla pendiente solo si pendiente.pendiente_tipo_id tiene valor
  if (paciente.pendiente && paciente.pendiente.pendiente_tipo_id) {
    db.addPendiente({
      paciente_id: pacienteId,
      tabla_acceso_id_vinculado: paciente.pendiente.tabla_acceso_id_vinculado, // valor correcto del formulario
      fecha_instalacion_acceso_pendiente: paciente.pendiente.fecha_instalacion_acceso_pendiente || paciente.fecha_instalacion_pendiente || '',
      ubicacion_chd: paciente.pendiente.ubicacion_chd || '',
      lado_chd: paciente.pendiente.lado_chd || '',
      profesional_id: paciente.pendiente.profesional_id || paciente.profesional_id || null,
      pendiente_tipo_id: paciente.pendiente.pendiente_tipo_id,
      pendiente_tipo_acceso_id: paciente.pendiente.pendiente_tipo_acceso_id,
      activo: typeof paciente.pendiente.activo === 'undefined' ? 1 : paciente.pendiente.activo ? 1 : 0
    });
  }

  return { id: pacienteId, acceso_id: accesoId };
};

// --- Métodos para pendientes ---
// Agregar pendiente
db.addPendiente = function(pendiente) {
  // acceso_id ahora representa tipo_acceso_id
  const stmt = db.prepare(`INSERT INTO pendiente (paciente_id, pendiente_tipo_id, tabla_acceso_id_vinculado, fecha_instalacion_acceso_pendiente, ubicacion_chd, lado_chd, profesional_id, activo, pendiente_tipo_acceso_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    pendiente.paciente_id,
    pendiente.pendiente_tipo_id || null,
    pendiente.tabla_acceso_id_vinculado || null,
    pendiente.fecha_instalacion_acceso_pendiente || null,
    pendiente.ubicacion_chd || '',
    pendiente.lado_chd || '',
    pendiente.profesional_id || null,
    typeof pendiente.activo === 'undefined' ? 1 : pendiente.activo ? 1 : 0,
    pendiente.pendiente_tipo_acceso_id || null
  );
  return { id: info.lastInsertRowid };
};

// Editar pendiente
db.editPendiente = function(pendiente) {
  // acceso_id ahora representa tipo_acceso_id
  const stmt = db.prepare(`UPDATE pendiente SET paciente_id = ?, pendiente_tipo_id = ?, tabla_acceso_id_vinculado = ?, fecha_instalacion_acceso_pendiente = ?, ubicacion_chd = ?, lado_chd = ?, profesional_id = ?, activo = ?, pendiente_tipo_acceso_id = ? WHERE id = ?`);
  const info = stmt.run(
    pendiente.paciente_id,
    pendiente.pendiente_tipo_id || null,
    pendiente.tabla_acceso_id_vinculado || null,
    pendiente.fecha_instalacion_acceso_pendiente || null,
    pendiente.ubicacion_chd || '',
    pendiente.lado_chd || '',
    pendiente.profesional_id || null,
    typeof pendiente.activo === 'undefined' ? 1 : pendiente.activo ? 1 : 0,
    pendiente.pendiente_tipo_acceso_id || null,
    pendiente.id
  );
  return { changes: info.changes };
};

// Eliminar pendiente
db.deletePendiente = function(id) {
  const stmt = db.prepare('DELETE FROM pendiente WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

// Archivar pendiente (soft delete)
db.archivarPendiente = function(id) {
  const stmt = db.prepare('UPDATE pendiente SET activo = 0 WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

// Obtener todos los pendientes
db.getPendientes = function() {
  return db.prepare(`SELECT * FROM pendiente WHERE activo = 1 ORDER BY fecha_instalacion_acceso_pendiente DESC, id DESC`).all();
};

// Obtener pendientes por paciente
db.getPendientesByPaciente = function(pacienteId) {
  return db.prepare(`SELECT * FROM pendiente WHERE paciente_id = ? AND activo = 1 ORDER BY fecha_instalacion_acceso_pendiente DESC, id DESC`).all(pacienteId);
};

// Obtener el pendiente más reciente de un paciente
db.getPendienteActualByPaciente = function(pacienteId) {
  // Devuelve solo el pendiente activo más reciente del paciente
  return db.prepare(`
    SELECT * FROM pendiente
    WHERE paciente_id = ? AND activo = 1
    ORDER BY fecha_instalacion_acceso_pendiente DESC, id DESC LIMIT 1
  `).get(pacienteId) || null;
};




// --- Ejemplos reales para pruebas ---
function insertarTiposAccesoPredeterminados() {
  const tipos = [
    {
      nombre: 'Fístula',
      descripcion: 'Fístula arteriovenosa creada quirúrgicamente para hemodiálisis. Proporciona acceso vascular duradero y de bajo riesgo de infección.',
      color: '#e63946',
      icono: '🩸',
      ubicaciones: [
        'Radiocefálica',
        'Radiobasílica',
        'Braquiocefálica',
        'Braquiobasílica',
        'Braquiorradial',
        'Fémoro-femoral'
      ]
    },
    {
      nombre: 'Prótesis',
      descripcion: 'Prótesis vascular o injerto sintético utilizado cuando no es posible crear una fístula. Alternativa para hemodiálisis.',
      color: '#b28900', // Nuevo color para Prótesis
      icono: '🦾',
      ubicaciones: [
        'Injerto protésico en brazo (brazo medio / superior)',
        'Injerto protésico femoral (muslo)',
        'Injerto subclavio o axilar (tórax)'
      ]
    },
    {
      nombre: 'Catéter',
      descripcion: 'Catéter venoso central, temporal o tunelizado, para acceso inmediato o prolongado. Mayor riesgo de infección.',
      color: '#5dade2',
      icono: '➰',
      ubicaciones: [
        'Yugular Interna',
        'Subclavia',
        'Femoral'
      ]
    },
    {
      nombre: 'Otro',
      descripcion: 'Acceso vascular alternativo o no especificado, utilizado en situaciones especiales o transitorias.',
      color: '#222', // Nuevo color para Otro
      icono: '❓',
      ubicaciones: ['Variable']
    }
  ];
  tipos.forEach(tipo => {
    const existe = db.prepare('SELECT 1 FROM tipo_acceso WHERE nombre = ?').get(tipo.nombre);
    if (!existe) {
      db.prepare(`INSERT INTO tipo_acceso (nombre, descripcion, color, icono, ubicaciones) VALUES (?, ?, ?, ?, ?)`)
        .run(tipo.nombre, tipo.descripcion, tipo.color, tipo.icono, JSON.stringify(tipo.ubicaciones));
    }
  });
}

// Crear etiquetas de tipo incidencia (motivos de derivación)
db.crearEtiquetasIncidenciaMotivos = function() {
  const motivos = [
    { nombre: 'Flujo insuficiente', color: '#009879', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Disminución o pérdida del frémito', color: '#1565c0', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Dificultad para la canulación', color: '#b28900', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Hematomas frecuentes', color: '#c62828', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Aumento de la presión venosa', color: '#3a8dde', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Sangramiento', color: '#ad1457', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Edema', color: '#00897b', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Circulación colateral', color: '#6d4c41', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Dolor', color: '#f57c00', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' },
    { nombre: 'Fav ocluida', color: '#7b1fa2', microorganismo_asociado: '', descripcion: '', tipo: 'incidencia', icono: '' }
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO tags (nombre, color, microorganismo_asociado, descripcion, tipo, icono) VALUES (?, ?, ?, ?, ?, ?)');
  motivos.forEach(m => {
    stmt.run(m.nombre, m.color, m.microorganismo_asociado, m.descripcion, m.tipo, m.icono);
  });

  // Crear 20 etiquetas de infección (10 originales + 10 comunes en nefrología)
  const infecciones = [
    // Originales
    { nombre: 'Staphylococcus aureus', color: '#e53935', microorganismo_asociado: 'Staphylococcus aureus', descripcion: 'Infección por S. aureus', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Escherichia coli', color: '#43a047', microorganismo_asociado: 'Escherichia coli', descripcion: 'Infección por E. coli', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Klebsiella pneumoniae', color: '#1e88e5', microorganismo_asociado: 'Klebsiella pneumoniae', descripcion: 'Infección por K. pneumoniae', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Pseudomonas aeruginosa', color: '#fbc02d', microorganismo_asociado: 'Pseudomonas aeruginosa', descripcion: 'Infección por P. aeruginosa', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Enterococcus faecalis', color: '#8e24aa', microorganismo_asociado: 'Enterococcus faecalis', descripcion: 'Infección por E. faecalis', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Candida albicans', color: '#00897b', microorganismo_asociado: 'Candida albicans', descripcion: 'Infección por C. albicans', tipo: 'infeccion', icono: '🍄' },
    { nombre: 'Streptococcus pyogenes', color: '#6d4c41', microorganismo_asociado: 'Streptococcus pyogenes', descripcion: 'Infección por S. pyogenes', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Acinetobacter baumannii', color: '#f57c00', microorganismo_asociado: 'Acinetobacter baumannii', descripcion: 'Infección por A. baumannii', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Proteus mirabilis', color: '#7b1fa2', microorganismo_asociado: 'Proteus mirabilis', descripcion: 'Infección por P. mirabilis', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Serratia marcescens', color: '#009688', microorganismo_asociado: 'Serratia marcescens', descripcion: 'Infección por S. marcescens', tipo: 'infeccion', icono: '🧫' },
    // Comunes en nefrología
    { nombre: 'Staphylococcus epidermidis', color: '#bdbdbd', microorganismo_asociado: 'Staphylococcus epidermidis', descripcion: 'Infección por S. epidermidis', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Enterobacter cloacae', color: '#ffb300', microorganismo_asociado: 'Enterobacter cloacae', descripcion: 'Infección por E. cloacae', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Citrobacter freundii', color: '#8d6e63', microorganismo_asociado: 'Citrobacter freundii', descripcion: 'Infección por C. freundii', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Morganella morganii', color: '#00bcd4', microorganismo_asociado: 'Morganella morganii', descripcion: 'Infección por M. morganii', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Providencia stuartii', color: '#cddc39', microorganismo_asociado: 'Providencia stuartii', descripcion: 'Infección por P. stuartii', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Bacteroides fragilis', color: '#ff7043', microorganismo_asociado: 'Bacteroides fragilis', descripcion: 'Infección por B. fragilis', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Corynebacterium jeikeium', color: '#607d8b', microorganismo_asociado: 'Corynebacterium jeikeium', descripcion: 'Infección por C. jeikeium', tipo: 'infeccion', icono: '🦠' },
    { nombre: 'Stenotrophomonas maltophilia', color: '#00e676', microorganismo_asociado: 'Stenotrophomonas maltophilia', descripcion: 'Infección por S. maltophilia', tipo: 'infeccion', icono: '🧫' },
    { nombre: 'Candida glabrata', color: '#6a1b9a', microorganismo_asociado: 'Candida glabrata', descripcion: 'Infección por C. glabrata', tipo: 'infeccion', icono: '🍄' },
    { nombre: 'Pseudomonas putida', color: '#388e3c', microorganismo_asociado: 'Pseudomonas putida', descripcion: 'Infección por P. putida', tipo: 'infeccion', icono: '🦠' }
  ];
  infecciones.forEach(i => {
    stmt.run(i.nombre, i.color, i.microorganismo_asociado, i.descripcion, i.tipo, i.icono);
  });
};

module.exports = db;
// --- Notificaciones ---
const getRecentNotifications = (limit = 10) => {
  return db.prepare(`SELECT * FROM notificaciones ORDER BY fecha DESC LIMIT ?`).all(limit);
};

const addNotification = ({ tipo, mensaje, fecha, usuario_id = null, paciente_id = null, extra = null }) => {
  const stmt = db.prepare(`INSERT INTO notificaciones (tipo, mensaje, fecha, usuario_id, paciente_id, extra) VALUES (?, ?, ?, ?, ?, ?)`);
  return stmt.run(tipo, mensaje, fecha, usuario_id, paciente_id, extra);
};

module.exports.getRecentNotifications = getRecentNotifications;
module.exports.addNotification = addNotification;

db.crearEtiquetasIncidenciaMotivos();

db.deleteIncidenciasByEtiqueta = function(etiquetaId) {
  const stmt = db.prepare('DELETE FROM incidencias WHERE etiqueta_id = ?');
  const info = stmt.run(etiquetaId);
  return { success: true, deleted: info.changes };
};

db.deleteInfeccionByEtiqueta = function(etiquetaId) {
  const stmt = db.prepare('DELETE FROM infecciones WHERE tag_id = ?');
  const info = stmt.run(etiquetaId);
  return { success: true, deleted: info.changes };
};