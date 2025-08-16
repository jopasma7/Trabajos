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

// Crear tabla profesionales si no existe
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
  tipo_acceso_id INTEGER,
  fecha_instalacion TEXT,
  ubicacion_anatomica TEXT,
  ubicacion_lado TEXT,
  avatar TEXT
)`).run();
// Añadir columna avatar si no existe
try {
  db.prepare('ALTER TABLE pacientes ADD COLUMN avatar TEXT').run();
} catch (e) {}
// Añadir columna en_lista_espera si no existe
// Eliminadas migraciones de en_lista_espera y tipo_acceso_espera_id

// Añadir nuevos campos si no existen
const pacientesTableInfo = db.prepare("PRAGMA table_info(pacientes)").all();
const addColumnIfMissing = (colName, colType) => {
  if (!pacientesTableInfo.some(col => col.name === colName)) {
    try {
      db.prepare(`ALTER TABLE pacientes ADD COLUMN ${colName} ${colType}`).run();
    } catch (e) {}
  }
};
// Añadir columnas si no existen
addColumnIfMissing('tipo_acceso_id', 'INTEGER');
addColumnIfMissing('fecha_instalacion', 'TEXT');
addColumnIfMissing('ubicacion_anatomica', 'TEXT');
addColumnIfMissing('ubicacion_lado', 'TEXT');
addColumnIfMissing('avatar', 'TEXT');
addColumnIfMissing('profesional_asignado', 'TEXT');
addColumnIfMissing('historia_clinica', 'TEXT');
addColumnIfMissing('sexo', 'TEXT');
addColumnIfMissing('telefono', 'TEXT');
addColumnIfMissing('correo', 'TEXT');
addColumnIfMissing('direccion', 'TEXT');
addColumnIfMissing('alergias', 'TEXT');
addColumnIfMissing('observaciones', 'TEXT');
addColumnIfMissing('profesional_id', 'INTEGER');
addColumnIfMissing('fecha_nacimiento', 'TEXT');
addColumnIfMissing('fecha_alta', 'TEXT');
addColumnIfMissing('proceso_actual', 'INTEGER'); // id etiqueta tipo "Proceso"
addColumnIfMissing('acceso_proceso', 'INTEGER'); // id etiqueta tipo "Acceso"


// Crear tabla historial_clinico (uno a muchos con pacientes)
db.prepare(`CREATE TABLE IF NOT EXISTS historial_clinico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  tipo_evento INTEGER,
  motivo TEXT,
  diagnostico INTEGER,
  tratamiento TEXT,
  notas TEXT,
  adjuntos TEXT,
  profesional TEXT,
  archivado INTEGER DEFAULT 0,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (tipo_evento) REFERENCES tags(id),
  FOREIGN KEY (diagnostico) REFERENCES tags(id)
)`).run();
// Migración: cambiar tipo_evento y diagnostico a INTEGER si eran TEXT
// Migrar valores antiguos de tipo_evento y diagnostico a ids de tags si coinciden por nombre
try {
  const rows = db.prepare('SELECT id, tipo_evento, diagnostico FROM historial_clinico WHERE tipo_evento IS NULL OR diagnostico IS NULL').all();
  const tags = db.prepare('SELECT id, nombre FROM tags').all();
  const nombreToId = {};
  tags.forEach(t => { nombreToId[t.nombre.toLowerCase()] = t.id; });
  const updateStmt = db.prepare('UPDATE historial_clinico SET tipo_evento = ?, diagnostico = ? WHERE id = ?');
  let migrados = 0;
  rows.forEach(row => {
    let tipoId = null, diagId = null;
    if (row.tipo_evento && typeof row.tipo_evento === 'string') {
      tipoId = nombreToId[row.tipo_evento.toLowerCase()] || null;
    }
    if (row.diagnostico && typeof row.diagnostico === 'string') {
      diagId = nombreToId[row.diagnostico.toLowerCase()] || null;
    }
    if (tipoId !== null || diagId !== null) migrados++;
    updateStmt.run(tipoId, diagId, row.id);
  });
  if (migrados > 0) {
    console.log(`[MIGRACIÓN historial_clinico] Migrados ${migrados} registros de tipo_evento/diagnostico a ids de tags.`);
  }
} catch(e) { console.error('[MIGRACIÓN historial_clinico] Error:', e); }
try {
  const cols = db.prepare("PRAGMA table_info(historial_clinico)").all();
  if (cols.find(c => c.name === 'tipo_evento' && c.type === 'TEXT')) {
    db.prepare('ALTER TABLE historial_clinico RENAME TO historial_clinico_old').run();
    db.prepare(`CREATE TABLE historial_clinico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      tipo_evento INTEGER,
      motivo TEXT,
      diagnostico INTEGER,
      tratamiento TEXT,
      notas TEXT,
      adjuntos TEXT,
      profesional TEXT,
      archivado INTEGER DEFAULT 0,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
      FOREIGN KEY (tipo_evento) REFERENCES tags(id),
      FOREIGN KEY (diagnostico) REFERENCES tags(id)
    )`).run();
    db.prepare(`INSERT INTO historial_clinico (id, paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional, archivado)
      SELECT id, paciente_id, fecha, NULL, motivo, NULL, tratamiento, notas, adjuntos, profesional, archivado FROM historial_clinico_old`).run();
    db.prepare('DROP TABLE historial_clinico_old').run();
  }
} catch(e) {}
// Añadir columna archivado si no existe (migración)
try {
  db.prepare('ALTER TABLE historial_clinico ADD COLUMN archivado INTEGER DEFAULT 0').run();
} catch (e) {}

// Crear tabla incidencias (uno a muchos with pacientes)
db.prepare(`CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
)`).run();

// Crear tabla tags (etiquetas personalizables)
// Añadir columna 'tipo', 'icono' y 'ubicaciones' a tags si no existen
const tagsTableInfo = db.prepare("PRAGMA table_info(tags)").all();
const hasTipo = tagsTableInfo.some(col => col.name === 'tipo');
const hasIcono = tagsTableInfo.some(col => col.name === 'icono');
const hasUbicaciones = tagsTableInfo.some(col => col.name === 'ubicaciones');
if (!hasTipo) {
  try {
    db.prepare('ALTER TABLE tags ADD COLUMN tipo TEXT DEFAULT "incidencia"').run();
  } catch (e) {}
}
if (!hasIcono) {
  try {
    db.prepare('ALTER TABLE tags ADD COLUMN icono TEXT').run();
  } catch (e) {}
}
if (!hasUbicaciones) {
  try {
    db.prepare('ALTER TABLE tags ADD COLUMN ubicaciones TEXT').run();
  } catch (e) {}
}
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
  return db.prepare('SELECT * FROM incidencias WHERE paciente_id = ? ORDER BY fecha DESC, id DESC').all(pacienteId);
};

// Crear una incidencia y asociar un tag (motivo y fecha personalizados)
db.addIncidenciaConTag = function(pacienteId, tagId, motivo, fecha) {
  // Insertar nueva incidencia
  const insertIncidencia = db.prepare('INSERT INTO incidencias (paciente_id, motivo, fecha) VALUES (?, ?, ?)');
  const result = insertIncidencia.run(pacienteId, motivo, fecha);
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
    WHERE i.paciente_id = ?
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

db.addTag = function(nombre, color = '#009879', descripcion = '', tipo = 'incidencia') {
  // arguments[5] = ubicaciones (array)
  const ubicaciones = Array.isArray(arguments[5]) ? JSON.stringify(arguments[5]) : '[]';
  const stmt = db.prepare('INSERT INTO tags (nombre, color, descripcion, tipo, icono, ubicaciones) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(nombre, color, descripcion, tipo, arguments[4], ubicaciones);
  return { id: info.lastInsertRowid };
};

db.updateTag = function(id, nombre, color, descripcion, tipo = 'incidencia') {
  // arguments[6] = ubicaciones (array)
  const ubicaciones = Array.isArray(arguments[6]) ? JSON.stringify(arguments[6]) : '[]';
  const stmt = db.prepare('UPDATE tags SET nombre = ?, color = ?, descripcion = ?, tipo = ?, icono = ?, ubicaciones = ? WHERE id = ?');
  const info = stmt.run(nombre, color, descripcion, tipo, arguments[5], ubicaciones, id);
  return { changes: info.changes };
};

db.deleteTag = function(id) {
  const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};


db.getAllPacientes = function() {
  return db.prepare('SELECT * FROM pacientes').all();
};

db.addPaciente = function(paciente) {
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, avatar, proceso_actual, acceso_proceso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.avatar || '',
    paciente.proceso_actual || null,
    paciente.acceso_proceso || null
  );
  return { id: info.lastInsertRowid };
};

db.editPaciente = function(paciente) {
  const stmt = db.prepare('UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso_id = ?, fecha_instalacion = ?, ubicacion_anatomica = ?, ubicacion_lado = ?, avatar = ?, proceso_actual = ?, acceso_proceso = ? WHERE id = ?');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.avatar || '',
    paciente.proceso_actual || null,
    paciente.acceso_proceso || null,
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
  const stmt = db.prepare('INSERT INTO historial_clinico (paciente_id, fecha, tipo_evento, motivo, diagnostico, tratamiento, notas, adjuntos, profesional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
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

db.getHistorialArchivadoByPaciente = function(pacienteId) {
  return db.prepare('SELECT * FROM historial_clinico WHERE paciente_id = ? AND archivado = 1 ORDER BY fecha DESC, id DESC').all(pacienteId);
};

// Desarchivar una entrada de historial clínico
db.unarchiveHistorialClinico = function(id) {
  const stmt = db.prepare('UPDATE historial_clinico SET archivado = 0 WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};




// Añadir columna categoria si no existe (migración)
try {
  db.prepare('ALTER TABLE agenda ADD COLUMN categoria TEXT').run();
} catch (e) {}
// Añadir columna completado si no existe (migración)
try {
  db.prepare('ALTER TABLE agenda ADD COLUMN completado INTEGER DEFAULT 0').run();
} catch (e) {}

// Pacientes con CHD pendiente de FAV
// Se asume que tipo_acceso_id corresponde a CHD y proceso_actual corresponde a "Pendiente de confección / reparación" (proceso)
db.getPacientesCHDPendienteFAV = function() {
  // Buscar el id de la etiqueta "Pendiente de confección / reparación" en tags tipo proceso
  const procesoTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'proceso'").get('%confección%');
  if (!procesoTag) return [];
  // Buscar el id de la etiqueta "Catéter" en tags tipo acceso (CHD)
  const accesoTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%catéter%');
  if (!accesoTag) return [];
  // Buscar el id de la etiqueta "Fístula" en tags tipo acceso (FAV)
  const favTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%fístula%');
  if (!favTag) return [];
  // Filtrar pacientes con tipo_acceso_id = accesoTag.id, proceso_actual = procesoTag.id y acceso_proceso = favTag.id
  const pacientes = db.prepare("SELECT * FROM pacientes WHERE tipo_acceso_id = ? AND proceso_actual = ? AND acceso_proceso = ?").all(accesoTag.id, procesoTag.id, favTag.id);
  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
  });
  return pacientes;
};

  // Pacientes con FAV pendiente retiro CHD
  db.getPacientesFAVPendienteRetiroCHD = function() {
    // Buscar el id de la etiqueta "Pendiente de Retiro" en tags tipo proceso
    const procesoTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'proceso'").get('%retiro%');
    if (!procesoTag) return [];
    // Buscar el id de la etiqueta "Fístula" en tags tipo acceso (FAV)
    const favTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%fístula%');
    if (!favTag) return [];
    // Buscar el id de la etiqueta "Catéter" en tags tipo acceso (CHD)
    const chdTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%catéter%');
    if (!chdTag) return [];
    // Filtrar pacientes con tipo_acceso_id = favTag.id, proceso_actual = procesoTag.id y acceso_proceso = chdTag.id
    const pacientes = db.prepare("SELECT * FROM pacientes WHERE tipo_acceso_id = ? AND proceso_actual = ? AND acceso_proceso = ?").all(favTag.id, procesoTag.id, chdTag.id);
    pacientes.forEach(p => {
      p.etiquetas = db.getEtiquetasByPaciente(p.id); 
    });
    return pacientes;
  };

// Pacientes con CHD y proceso madurativo de FAV
db.getPacientesCHDFAVMadurativo = function() {
  // Buscar el id de la etiqueta "Proceso Madurativo" en tags tipo proceso
  const procesoTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'proceso'").get('%madurativo%');
  if (!procesoTag) return [];
  // Buscar el id de la etiqueta "Catéter" en tags tipo acceso (CHD)
  const chdTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%catéter%');
  if (!chdTag) return [];
  // Buscar el id de la etiqueta "Fístula" en tags tipo acceso (FAV)
  const favTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%fístula%');
  if (!favTag) return [];
  // Filtrar pacientes con tipo_acceso_id = chdTag.id, proceso_actual = procesoTag.id y acceso_proceso = favTag.id
  const pacientes = db.prepare("SELECT * FROM pacientes WHERE tipo_acceso_id = ? AND proceso_actual = ? AND acceso_proceso = ?").all(chdTag.id, procesoTag.id, favTag.id);
  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
  });
  return pacientes;
};

// Pacientes con CHD y diagnóstico de Sepsis
db.getPacientesSepsisCHD = function() {
  // Buscar el id de la etiqueta "Catéter" en tags tipo acceso (CHD)
  const chdTag = db.prepare("SELECT id FROM tags WHERE LOWER(nombre) LIKE LOWER(?) AND tipo = 'acceso'").get('%catéter%');
  if (!chdTag) return [];
  // Buscar pacientes con tipo_acceso_id = chdTag.id y al menos una incidencia con cualquier etiqueta de tipo incidencia
  const pacientes = db.prepare(`SELECT DISTINCT p.* FROM pacientes p JOIN incidencias i ON p.id = i.paciente_id JOIN incidencia_tags it ON i.id = it.incidencia_id JOIN tags t ON it.tag_id = t.id WHERE p.tipo_acceso_id = ? AND t.tipo = 'incidencia'`).all(chdTag.id);
  pacientes.forEach(p => {
    p.etiquetas = db.getEtiquetasByPaciente(p.id);
  });
  return pacientes;
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
 
// --- Etiquetas predefinidas para Motivo de Derivación ---
// Crear etiquetas de acceso de prueba si no existen
const accesoTags = [
  {
    nombre: 'Fístula',
    color: '#007bff',
    tipo: 'acceso',
    icono: '🩸',
    ubicaciones: JSON.stringify(['Radio Cefálica', 'Braquio Cefálica'])
  },
  {
    nombre: 'Prótesis',
    color: '#28a745',
    tipo: 'acceso',
    icono: '🦾',
    ubicaciones: JSON.stringify(['Radio Cefálica', 'Braquio Cefálica'])
  },
  {
    nombre: 'Catéter',
    color: '#ffc107',
    tipo: 'acceso',
    icono: '➰',
    ubicaciones: JSON.stringify(['Yugular', 'Femoral'])
  },
  {
    nombre: 'Prueba sin ubicaciones',
    color: '#6c757d',
    tipo: 'acceso',
    icono: '🧪',
    ubicaciones: JSON.stringify([])
  }
];
const insertTagStmt = db.prepare('INSERT OR IGNORE INTO tags (nombre, color, tipo, icono, ubicaciones) VALUES (?, ?, ?, ?, ?)');
accesoTags.forEach(tag => {
  insertTagStmt.run(tag.nombre, tag.color, tag.tipo, tag.icono, tag.ubicaciones);
});

// Ejecutar al iniciar si la tabla tags existe
// (Eliminado bloque duplicado, solo se llama al final)
function crearEtiquetasMotivoDerivacion() {
  const motivos = [
    { nombre: 'Flujo insuficiente', color: '#e74c3c', descripcion: 'El flujo sanguíneo es menor al esperado.' },
    { nombre: 'Disminución o pérdida del frémito', color: '#f39c12', descripcion: 'El frémito se percibe débil o ausente.' },
    { nombre: 'Dificultad para la canulación', color: '#e67e22', descripcion: 'Problemas al intentar canalizar el acceso.' },
    { nombre: 'Hematomas frecuentes', color: '#8e44ad', descripcion: 'Aparición repetida de hematomas en la zona.' },
    { nombre: 'Aumento de la presión venosa', color: '#2980b9', descripcion: 'Presión venosa superior a lo normal.' },
    { nombre: 'Sangramiento', color: '#c0392b', descripcion: 'Presencia de sangrado en el acceso.' },
    { nombre: 'Edema', color: '#16a085', descripcion: 'Hinchazón o retención de líquidos en la extremidad.' },
    { nombre: 'Circulación colateral', color: '#27ae60', descripcion: 'Desarrollo de circulación venosa alternativa.' },
    { nombre: 'Dolor', color: '#d35400', descripcion: 'El paciente refiere dolor en la zona.' },
    { nombre: 'Fav ocluida', color: '#34495e', descripcion: 'Fístula arteriovenosa ocluida o no funcional.' },
    { nombre: 'Dilataciones', color: '#9b59b6', descripcion: 'Presencia de dilataciones venosas.' },
    { nombre: 'Infección', color: '#e84393', descripcion: 'Signos de infección en el acceso o zona.' },
    { nombre: 'Construcción FAV', color: '#00b894', descripcion: 'Motivo relacionado con la creación de una nueva FAV.' },
    { nombre: 'Otros', color: '#636e72', descripcion: 'Otro motivo no especificado en la lista.' }
  ];
  motivos.forEach(motivo => {
    const existe = db.prepare('SELECT 1 FROM tags WHERE LOWER(nombre) = LOWER(?)').get(motivo.nombre);
    if (!existe) {
      db.prepare('INSERT INTO tags (nombre, color, descripcion) VALUES (?, ?, ?)').run(motivo.nombre, motivo.color, motivo.descripcion);
    }
  });
}

// Ejecutar al iniciar si la tabla tags existe
try {
  if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tags'").get()) {
    crearEtiquetasMotivoDerivacion();
  }
} catch (e) { /* ignorar si no existe la tabla */ }


// --- Insertar pacientes de prueba si la tabla está vacía ---
// --- Método para agregar etiquetas de tipo Proceso por defecto ---
db.insertarEtiquetasProcesoDemo = function() {
  const etiquetasProceso = [
    {
      nombre: 'Pendiente de confección / reparación',
      tipo: 'proceso',
      color: '#f7b731',
      descripcion: 'Paciente pendiente de confección o reparación de acceso vascular.'
    },
    {
      nombre: 'Pendiente de Retiro',
      tipo: 'proceso',
      color: '#eb3b5a',
      descripcion: 'Paciente pendiente de retiro de acceso vascular.'
    },
    {
      nombre: 'Proceso Madurativo',
      tipo: 'proceso',
      color: '#20bf6b',
      descripcion: 'Paciente en proceso madurativo del acceso vascular.'
    } 
  ];
  const existeStmt = db.prepare('SELECT COUNT(*) as count FROM tags WHERE nombre = ? AND tipo = ?');
  const insertStmt = db.prepare('INSERT INTO tags (nombre, tipo, color, descripcion) VALUES (?, ?, ?, ?)');
  etiquetasProceso.forEach(tag => {
    try {
      const existe = existeStmt.get(tag.nombre, tag.tipo).count;
      if (!existe) {
        insertStmt.run(tag.nombre, tag.tipo, tag.color, tag.descripcion);
        // Etiqueta creada
      } else {
        // Etiqueta ya existe
      }
    } catch (e) {
  // Error al crear etiqueta
    }
  });
};
// --- Método para agregar etiquetas de tipo Proceso por defecto ---
// Función para insertar 10 pacientes completos y realistas con imagen y registros en el historial clínico
db.insertarPacientesDemo = function() {
  // Obtener IDs válidos de tags para tipo_evento y diagnostico
  const tagsEvento = db.prepare("SELECT id FROM tags WHERE tipo='evento' ORDER BY id ASC LIMIT 3").all();
  const tagsDiagnostico = db.prepare("SELECT id FROM tags WHERE tipo='diagnostico' ORDER BY id ASC LIMIT 3").all();
  // Obtener IDs válidos de tags para tipo_acceso_id
  const tagsAcceso = db.prepare("SELECT id, nombre FROM tags WHERE tipo='acceso' ORDER BY id ASC LIMIT 3").all();
  const tiposAcceso = [tagsAcceso[0]?.id || 1, tagsAcceso[1]?.id || 2, tagsAcceso[2]?.id || 3];
  const ubicaciones = ['Radio Cefálica', 'Braquio Cefálica', 'Yugular', 'Femoral'];
  const lados = ['Izquierda', 'Derecha'];
  const pacientes = [
    {
      nombre: 'Alejandro', apellidos: 'García', sexo: 'M', telefono: '600123456', correo: 'alejandro.garcia@mail.com', direccion: 'Calle Mayor 1', fecha_nacimiento: '1985-03-12', historia_clinica: 'Diálisis desde 2020', alergias: 'Penicilina', profesional_asignado: 'Dr. Ruiz', observaciones: 'Buen estado general', avatar: '../assets/hombre.jpg', tipo_acceso_id: tiposAcceso[0], fecha_instalacion: '2024-01-15', ubicacion_anatomica: ubicaciones[0], ubicacion_lado: lados[0]
    },
    {
      nombre: 'María', apellidos: 'López', sexo: 'F', telefono: '600234567', correo: 'maria.lopez@mail.com', direccion: 'Av. Andalucía 23', fecha_nacimiento: '1990-07-25', historia_clinica: 'Trasplante renal en 2022', alergias: 'Ninguna', profesional_asignado: 'Dra. Gómez', observaciones: 'Control mensual', avatar: '../assets/mujer.jpg', tipo_acceso_id: tiposAcceso[1], fecha_instalacion: '2023-11-10', ubicacion_anatomica: ubicaciones[1], ubicacion_lado: lados[1]
    },
    {
      nombre: 'Juan', apellidos: 'Martínez', sexo: 'M', telefono: '600345678', correo: 'juan.martinez@mail.com', direccion: 'Calle Sol 15', fecha_nacimiento: '1978-11-02', historia_clinica: 'Fístula radiocefálica', alergias: 'Sulfas', profesional_asignado: 'Dr. García', observaciones: 'Pendiente revisión', avatar: '../assets/hombre.jpg', tipo_acceso_id: tiposAcceso[2], fecha_instalacion: '2022-09-05', ubicacion_anatomica: ubicaciones[2], ubicacion_lado: lados[0]
    },
    {
      nombre: 'Lucía', apellidos: 'Sánchez', sexo: 'F', telefono: '600456789', correo: 'lucia.sanchez@mail.com', direccion: 'Plaza Nueva 8', fecha_nacimiento: '1988-05-18', historia_clinica: 'Catéter yugular', alergias: 'Latex', profesional_asignado: 'Dra. Pérez', observaciones: 'Alergia conocida', avatar: '../assets/mujer.jpg', tipo_acceso_id: tiposAcceso[0], fecha_instalacion: '2021-06-20', ubicacion_anatomica: ubicaciones[3], ubicacion_lado: lados[1]
    },
    {
      nombre: 'Pedro', apellidos: 'Fernández', sexo: 'M', telefono: '600567890', correo: 'pedro.fernandez@mail.com', direccion: 'Calle Real 22', fecha_nacimiento: '1965-09-30', historia_clinica: 'Prótesis braquiocefálica', alergias: 'Ninguna', profesional_asignado: 'Dr. Torres', observaciones: 'Revisión anual', avatar: '../assets/hombre.jpg', tipo_acceso_id: tiposAcceso[1], fecha_instalacion: '2020-03-12', ubicacion_anatomica: ubicaciones[0], ubicacion_lado: lados[0]
    },
    {
      nombre: 'Laura', apellidos: 'Gómez', sexo: 'F', telefono: '600678901', correo: 'laura.gomez@mail.com', direccion: 'Av. Madrid 5', fecha_nacimiento: '1995-01-10', historia_clinica: 'Diálisis peritoneal', alergias: 'Aspirina', profesional_asignado: 'Dra. Romero', observaciones: 'Sin incidencias', avatar: '../assets/mujer.jpg', tipo_acceso_id: tiposAcceso[2], fecha_instalacion: '2023-05-18', ubicacion_anatomica: ubicaciones[1], ubicacion_lado: lados[1]
    },
    {
      nombre: 'David', apellidos: 'Díaz', sexo: 'M', telefono: '600789012', correo: 'david.diaz@mail.com', direccion: 'Calle Luna 3', fecha_nacimiento: '1982-06-21', historia_clinica: 'Catéter femoral', alergias: 'Ibuprofeno', profesional_asignado: 'Dr. Moreno', observaciones: 'Control trimestral', avatar: '../assets/hombre.jpg', tipo_acceso_id: tiposAcceso[0], fecha_instalacion: '2022-12-01', ubicacion_anatomica: ubicaciones[2], ubicacion_lado: lados[0]
    },
    {
      nombre: 'Carmen', apellidos: 'Ruiz', sexo: 'F', telefono: '600890123', correo: 'carmen.ruiz@mail.com', direccion: 'Plaza Vieja 7', fecha_nacimiento: '1972-12-05', historia_clinica: 'Fístula braquiocefálica', alergias: 'Ninguna', profesional_asignado: 'Dra. Herrera', observaciones: 'Estable', avatar: '../assets/mujer.jpg', tipo_acceso_id: tiposAcceso[1], fecha_instalacion: '2021-08-30', ubicacion_anatomica: ubicaciones[3], ubicacion_lado: lados[1]
    },
    {
      nombre: 'Javier', apellidos: 'Moreno', sexo: 'M', telefono: '600901234', correo: 'javier.moreno@mail.com', direccion: 'Calle Norte 19', fecha_nacimiento: '1980-04-14', historia_clinica: 'Prótesis radiocefálica', alergias: 'Paracetamol', profesional_asignado: 'Dr. Campos', observaciones: 'Sin complicaciones', avatar: '../assets/hombre.jpg', tipo_acceso_id: tiposAcceso[2], fecha_instalacion: '2024-02-22', ubicacion_anatomica: ubicaciones[0], ubicacion_lado: lados[0]
    },
    {
      nombre: 'Sara', apellidos: 'Muñoz', sexo: 'F', telefono: '600012345', correo: 'sara.munoz@mail.com', direccion: 'Av. Sevilla 11', fecha_nacimiento: '1993-08-27', historia_clinica: 'Diálisis desde 2021', alergias: 'Ninguna', profesional_asignado: 'Dra. León', observaciones: 'Buen cumplimiento', avatar: '../assets/mujer.jpg', tipo_acceso_id: tiposAcceso[1], fecha_instalacion: '2023-07-14', ubicacion_anatomica: ubicaciones[1], ubicacion_lado: lados[1]
    }
  ];
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, sexo, telefono, correo, direccion, fecha_nacimiento, historia_clinica, alergias, profesional_asignado, observaciones, avatar, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  pacientes.forEach((p, idx) => {
    const info = stmt.run(p.nombre, p.apellidos, p.sexo, p.telefono, p.correo, p.direccion, p.fecha_nacimiento, p.historia_clinica, p.alergias, p.profesional_asignado, p.observaciones, p.avatar, p.tipo_acceso_id, p.fecha_instalacion, p.ubicacion_anatomica, p.ubicacion_lado);
    // Insertar 2-3 registros de historial clínico para cada paciente usando IDs válidos
    const pacienteId = info.lastInsertRowid;
    db.addHistorialClinico(pacienteId, '2025-08-01', tagsEvento[idx % tagsEvento.length]?.id || 1, 'Consulta inicial', tagsDiagnostico[idx % tagsDiagnostico.length]?.id || 1, 'Tratamiento base', 'Sin incidencias', '', p.profesional_asignado);
    db.addHistorialClinico(pacienteId, '2025-08-10', tagsEvento[(idx+1) % tagsEvento.length]?.id || 1, 'Revisión', tagsDiagnostico[(idx+1) % tagsDiagnostico.length]?.id || 1, 'Ajuste de medicación', 'Mejoría clínica', '', p.profesional_asignado);
    db.addHistorialClinico(pacienteId, '2025-08-20', tagsEvento[(idx+2) % tagsEvento.length]?.id || 1, 'Seguimiento', tagsDiagnostico[(idx+2) % tagsDiagnostico.length]?.id || 1, 'Sin cambios', 'Estable', '', p.profesional_asignado);
    // Añadir incidencias de ejemplo para algunos pacientes
    if (idx % 3 === 0) {
      db.addIncidencia(pacienteId, 'Dolor en acceso vascular', '2025-07-15');
      db.addIncidencia(pacienteId, 'Hematoma leve', '2025-07-20');
    }
    if (idx % 4 === 0) {
      db.addIncidencia(pacienteId, 'Dificultad para canulación', '2025-06-10');
    }
  });
};

// --- Ejemplos reales para pruebas ---

// Método para agregar etiquetas de tipo Proceso por defecto


// Insertar 10 pacientes completos y realistas al iniciar si la tabla está vacía
const pacientesCountDemo = db.prepare('SELECT COUNT(*) as count FROM pacientes').get().count;
if (pacientesCountDemo === 0) {
  db.insertarPacientesDemo();
}

// Etiquetas por defecto para tipos de evento y diagnósticos
const etiquetasEvento = [
  { nombre: 'Consulta médica', descripcion: 'Visita médica programada para revisión o seguimiento.' },
  { nombre: 'Prueba de laboratorio', descripcion: 'Análisis clínicos realizados al paciente.' },
  { nombre: 'Intervención quirúrgica', descripcion: 'Procedimiento quirúrgico realizado.' },
  { nombre: 'Seguimiento clínico', descripcion: 'Control periódico del estado del paciente.' },
  { nombre: 'Urgencia', descripcion: 'Atención médica urgente por complicación.' },
  { nombre: 'Alta hospitalaria', descripcion: 'Finalización de la estancia hospitalaria.' },
  { nombre: 'Ingreso hospitalario', descripcion: 'Admisión del paciente en el hospital.' },
  { nombre: 'Cambio de tratamiento', descripcion: 'Modificación en la pauta terapéutica.' },
  { nombre: 'Revisión de medicación', descripcion: 'Evaluación y ajuste de medicamentos.' },
  { nombre: 'Otro', descripcion: 'Evento no clasificado en las categorías anteriores.' }
];
const etiquetasDiagnostico = [
  { nombre: 'Insuficiencia renal crónica', descripcion: 'Pérdida progresiva de la función renal.' },
  { nombre: 'Hipertensión arterial', descripcion: 'Presión arterial elevada de forma crónica.' },
  { nombre: 'Diabetes mellitus', descripcion: 'Alteración metabólica con hiperglucemia crónica.' },
  { nombre: 'Infección de acceso vascular', descripcion: 'Infección localizada en el acceso vascular.' },
  { nombre: 'Trombosis de fístula', descripcion: 'Obstrucción de la fístula por coágulo.' },
  { nombre: 'Anemia', descripcion: 'Disminución de la concentración de hemoglobina.' },
  { nombre: 'Hiperkalemia', descripcion: 'Elevación de los niveles de potasio en sangre.' },
  { nombre: 'Edema pulmonar', descripcion: 'Acumulación de líquido en los pulmones.' },
  { nombre: 'Sepsis', descripcion: 'Respuesta inflamatoria grave a una infección.' },
  { nombre: 'Cardiopatía', descripcion: 'Enfermedad que afecta al corazón.' },
  { nombre: 'Descompensación metabólica', descripcion: 'Alteración aguda del equilibrio metabólico.' },
  { nombre: 'Fracaso renal agudo', descripcion: 'Pérdida súbita de la función renal.' }
];
const insertTag = db.prepare('INSERT OR IGNORE INTO tags (nombre, tipo, descripcion, color) VALUES (?, ?, ?, ?)');
etiquetasEvento.forEach(e => insertTag.run(e.nombre, 'evento', e.descripcion, '#34c759'));
etiquetasDiagnostico.forEach(e => insertTag.run(e.nombre, 'diagnostico', e.descripcion, '#14532d'));

// Ejecutar al iniciar si la tabla tags existe (después de la definición)
try {
  if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tags'").get()) {
    console.log('[DB] Llamando a insertarEtiquetasProcesoDemo()');
    db.insertarEtiquetasProcesoDemo();
    console.log('[DB] Fin llamada a insertarEtiquetasProcesoDemo()');
  }
} catch (e) { console.error('[DB] Error comprobando tabla tags:', e); }
// Conexión real a better-sqlite3 y creación de tablas necesarias

module.exports = db;
 