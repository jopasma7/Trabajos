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
  ubicacion_lado TEXT
)`).run();
// Añadir columna en_lista_espera si no existe
try {
  db.prepare('ALTER TABLE pacientes ADD COLUMN en_lista_espera INTEGER DEFAULT 0').run();
} catch (e) {}
// Añadir columna tipo_acceso_espera_id si no existe
try {
  db.prepare('ALTER TABLE pacientes ADD COLUMN tipo_acceso_espera_id INTEGER').run();
} catch (e) {}


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

// Crear tabla incidencias (uno a muchos con pacientes)
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
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado, en_lista_espera, tipo_acceso_espera_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.en_lista_espera ? 1 : 0,
    paciente.tipo_acceso_espera_id || null
  );
  return { id: info.lastInsertRowid };
};

db.editPaciente = function(paciente) {
  const stmt = db.prepare('UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso_id = ?, fecha_instalacion = ?, ubicacion_anatomica = ?, ubicacion_lado = ?, en_lista_espera = ?, tipo_acceso_espera_id = ? WHERE id = ?');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso_id,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado,
    paciente.en_lista_espera ? 1 : 0,
    paciente.tipo_acceso_espera_id || null,
    paciente.id
  );
  return { changes: info.changes };
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
try {
  if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tags'").get()) {
    crearEtiquetasTipoAcceso();
  }
} catch (e) { /* ignorar si no existe la tabla */ }
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
const pacientesCount = db.prepare('SELECT COUNT(*) as count FROM pacientes').get().count;
if (pacientesCount === 0) {
  const nombres = [
    ['Alejandro', 'García'], ['María', 'López'], ['Juan', 'Martínez'], ['Lucía', 'Sánchez'], ['Pedro', 'Fernández'],
    ['Laura', 'Gómez'], ['David', 'Díaz'], ['Carmen', 'Ruiz'], ['Javier', 'Moreno'], ['Sara', 'Muñoz'],
    ['Antonio', 'Jiménez'], ['Paula', 'Romero'], ['Manuel', 'Alonso'], ['Elena', 'Gutiérrez'], ['Francisco', 'Navarro'],
    ['Marta', 'Torres'], ['José', 'Domínguez'], ['Patricia', 'Vázquez'], ['Andrés', 'Ramos'], ['Cristina', 'Gil'],
    ['Sergio', 'Castro'], ['Beatriz', 'Suárez'], ['Miguel', 'Ortega'], ['Raquel', 'Rubio'], ['Adrián', 'Molina'],
    ['Isabel', 'Serrano'], ['Hugo', 'Reyes'], ['Nuria', 'Cano'], ['Pablo', 'Iglesias'], ['Rosa', 'Delgado'],
    ['Iván', 'Peña'], ['Natalia', 'Cabrera'], ['Samuel', 'Méndez'], ['Clara', 'Aguilar'], ['Álvaro', 'Santos'],
    ['Julia', 'Castillo'], ['Rubén', 'Rojas'], ['Silvia', 'Ortega'], ['Óscar', 'Cruz'], ['Lorena', 'Ramos'],
    ['Enrique', 'Vega'], ['Mónica', 'Herrera'], ['Guillermo', 'Campos'], ['Teresa', 'Molina'], ['Emilio', 'Sanz'],
    ['Irene', 'Pérez'], ['Tomás', 'Vicente'], ['Andrea', 'Cordero'], ['Jesús', 'León'], ['Eva', 'Fuentes'],
    ['Cristian', 'Soto'], ['Verónica', 'Carrasco'], ['Ángel', 'Blanco'], ['Sonia', 'Reina'], ['Felipe', 'Pastor'],
    ['Alicia', 'Nieto'], ['Marcos', 'Bravo'], ['Esther', 'Solís'], ['Raúl', 'Benítez'], ['Patricia', 'Lara'],
    ['Joaquín', 'Pascual'], ['Miriam', 'Vidal'], ['Vicente', 'Gallardo'], ['Noelia', 'Salas'], ['Jorge', 'Arias'],
    ['Cristina', 'Pardo'], ['Fernando', 'Redondo'], ['Elisa', 'Calvo'], ['Martín', 'Serrano'], ['Celia', 'Moya'],
    ['Gabriel', 'Sáez'], ['Rocío', 'Valle'], ['Francisca', 'Morales'], ['Julián', 'Crespo'], ['Aitana', 'Ríos'],
    ['Matías', 'Garrido'], ['Aroa', 'Soler'], ['Ignacio', 'Esteban'], ['Nerea', 'Gallego'], ['Aleix', 'Paredes']
  ];
  // Obtener los ids de los tipos de acceso
  const tags = db.getAllTags().filter(t => ['fistula', 'cateter', 'protesis'].includes(t.nombre.toLowerCase()));
  const tipoAccesoIds = {
    fistula: tags.find(t => t.nombre.toLowerCase() === 'fistula')?.id || 1,
    cateter: tags.find(t => t.nombre.toLowerCase() === 'cateter')?.id || 2,
    protesis: tags.find(t => t.nombre.toLowerCase() === 'protesis')?.id || 3
  };
  const tipos = ['fistula', 'cateter', 'protesis'];
  const ubicaciones = {
    fistula: ['Radio Cefálica', 'Braquio Cefálica'],
    protesis: ['Radio Cefálica', 'Braquio Cefálica'],
    cateter: ['Yugular', 'Femoral']
  };
  const lados = ['Izquierda', 'Derecha'];
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, tipo_acceso_id, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < 75; i++) {
    const tipo = tipos[i % 3];
    let ubicacion_anatomica = '';
    let ubicacion_lado = '';
    if (tipo === 'fistula' || tipo === 'protesis') {
      ubicacion_anatomica = ubicaciones[tipo][Math.floor(i / 2) % 2];
      ubicacion_lado = lados[i % 2];
    } else if (tipo === 'cateter') {
      ubicacion_anatomica = ubicaciones[tipo][Math.floor(i / 2) % 2];
      ubicacion_lado = lados[i % 2];
    }
    stmt.run(
      nombres[i][0],
      nombres[i][1],
      tipoAccesoIds[tipo],
      `2025-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      ubicacion_anatomica,
      ubicacion_lado
    );
  }
  for (let i = 75; i < 175; i++) {
    const tipo = tipos[i % 3];
    let ubicacion_anatomica = '';
    let ubicacion_lado = '';
    if (tipo === 'fistula' || tipo === 'protesis') {
      ubicacion_anatomica = ubicaciones[tipo][Math.floor(i / 2) % 2];
      ubicacion_lado = lados[i % 2];
    } else if (tipo === 'cateter') {
      ubicacion_anatomica = ubicaciones[tipo][Math.floor(i / 2) % 2];
      ubicacion_lado = lados[i % 2];
    }
    stmt.run(
      `Paciente${i+1}`,
      `Apellido${i+1}`,
      tipoAccesoIds[tipo],
      `2025-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      ubicacion_anatomica,
      ubicacion_lado
    );
  }
}

// --- Ejemplos reales para pruebas ---
function insertarEjemplos() {
  // Verificar si ya existen pacientes de ejemplo
  const existe = db.prepare('SELECT COUNT(*) as c FROM pacientes').get().c;
  if (existe > 0) return;

  // Insertar pacientes
  const paciente1 = db.prepare('INSERT INTO pacientes (nombre, apellidos) VALUES (?, ?)').run('Juan', 'García').lastInsertRowid;
  const paciente2 = db.prepare('INSERT INTO pacientes (nombre, apellidos) VALUES (?, ?)').run('Ana', 'López').lastInsertRowid;

  // Insertar historial clínico para Juan García
  db.addHistorialClinico(paciente1, '2025-08-01', 'Consulta', 'Dolor abdominal', 'Gastritis aguda', 'Omeprazol 20mg/día', 'Paciente refiere dolor desde hace 3 días. Se recomienda dieta blanda.', '', 'Dr. García');
  db.addHistorialClinico(paciente1, '2025-08-10', 'Prueba Laboratorio', 'Control rutinario', 'Sin alteraciones', '---', 'Hemograma y bioquímica normales.', '', 'Enf. López');

  // Insertar historial clínico para Ana López
  db.addHistorialClinico(paciente2, '2025-08-12', 'Intervención', 'Colocación de acceso vascular', 'Acceso tipo Hickman', 'Cuidados postoperatorios', 'Sin complicaciones. Se adjunta informe quirúrgico.', '', 'Dr. Ruiz');
}
insertarEjemplos();

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

// db.js
// Conexión real a better-sqlite3 y creación de tablas necesarias

module.exports = db;
 