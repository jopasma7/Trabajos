// db.js
// Conexión real a better-sqlite3 y creación de tablas necesarias

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'hospital.db');
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
// --- MIGRACIÓN: Si la tabla pacientes tiene columna 'ubicacion', migrar a ubicacion_anatomica y ubicacion_lado ---
const tableInfo = db.prepare("PRAGMA table_info(pacientes)").all();
const hasOldUbicacion = tableInfo.some(col => col.name === 'ubicacion');
const hasNewUbicacion = tableInfo.some(col => col.name === 'ubicacion_anatomica');
if (hasOldUbicacion && !hasNewUbicacion) {
  // Renombrar tabla antigua
  db.prepare('ALTER TABLE pacientes RENAME TO pacientes_old').run();
  // Crear nueva tabla
  db.prepare(`CREATE TABLE pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    tipo_acceso TEXT,
    fecha_instalacion TEXT,
    ubicacion_anatomica TEXT,
    ubicacion_lado TEXT
  )`).run();
  // Migrar datos (ubicacion -> ubicacion_anatomica, ubicacion_lado vacía)
  const rows = db.prepare('SELECT * FROM pacientes_old').all();
  const insert = db.prepare('INSERT INTO pacientes (id, nombre, apellidos, tipo_acceso, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const row of rows) {
    insert.run(row.id, row.nombre, row.apellidos, row.tipo_acceso, row.fecha_instalacion, row.ubicacion, '');
  }
  db.prepare('DROP TABLE pacientes_old').run();
}
// Crear tabla pacientes si no existe (campos nuevos)
db.prepare(`CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_acceso TEXT,
  fecha_instalacion TEXT,
  ubicacion_anatomica TEXT,
  ubicacion_lado TEXT
)`).run();


// Crear tabla incidencias (uno a muchos con pacientes)
db.prepare(`CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
)`).run();

// Crear tabla tags (etiquetas personalizables)
// Añadir columna 'tipo' a tags si no existe
const tagsTableInfo = db.prepare("PRAGMA table_info(tags)").all();
const hasTipo = tagsTableInfo.some(col => col.name === 'tipo');
if (!hasTipo) {
  try {
    db.prepare('ALTER TABLE tags ADD COLUMN tipo TEXT DEFAULT "incidencia"').run();
  } catch (e) {}
}
db.prepare(`CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#009879',
  descripcion TEXT,
  tipo TEXT DEFAULT 'incidencia'
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



// Actualizar etiquetas de incidencias para la incidencia más reciente de un paciente
// Permite motivo y fecha personalizados para la incidencia inicial
db.setEtiquetasForPaciente = function(pacienteId, tagIds, motivoPersonalizado, fechaPersonalizada) {
  console.log('[DEPURACIÓN] setEtiquetasForPaciente llamado con:', { pacienteId, tagIds, motivoPersonalizado, fechaPersonalizada });
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
  return db.prepare('SELECT * FROM tags ORDER BY nombre COLLATE NOCASE').all();
};

db.getTagById = function(tagId) {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
};

db.addTag = function(nombre, color = '#009879', descripcion = '', tipo = 'incidencia') {
  const stmt = db.prepare('INSERT INTO tags (nombre, color, descripcion, tipo) VALUES (?, ?, ?, ?)');
  const info = stmt.run(nombre, color, descripcion, tipo);
  return { id: info.lastInsertRowid };
};

db.updateTag = function(id, nombre, color, descripcion, tipo = 'incidencia') {
  const stmt = db.prepare('UPDATE tags SET nombre = ?, color = ?, descripcion = ?, tipo = ? WHERE id = ?');
  const info = stmt.run(nombre, color, descripcion, tipo, id);
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
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, tipo_acceso, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso,
    paciente.fecha_instalacion,
    paciente.ubicacion_anatomica,
    paciente.ubicacion_lado
  );
  return { id: info.lastInsertRowid };
};

db.editPaciente = function(paciente) {
  const stmt = db.prepare('UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso = ?, fecha_instalacion = ?, ubicacion_anatomica = ?, ubicacion_lado = ? WHERE id = ?');
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
};

db.deletePaciente = function(id) {
  const stmt = db.prepare('DELETE FROM pacientes WHERE id = ?');
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


// --- Insertar 25 pacientes de prueba si la tabla está vacía ---
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
  const tipos = ['fistula', 'cateter', 'protesis'];
  const ubicaciones = {
    fistula: ['Radio Cefálica', 'Braquio Cefálica'],
    protesis: ['Radio Cefálica', 'Braquio Cefálica'],
    cateter: ['Yugular', 'Femoral']
  };
  const lados = ['Izquierda', 'Derecha'];
  const stmt = db.prepare('INSERT INTO pacientes (nombre, apellidos, tipo_acceso, fecha_instalacion, ubicacion_anatomica, ubicacion_lado) VALUES (?, ?, ?, ?, ?, ?)');
  // Insertar los 75 primeros
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
      tipo,
      `2025-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      ubicacion_anatomica,
      ubicacion_lado
    );
  }
  // Insertar 100 pacientes adicionales ficticios
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
      tipo,
      `2025-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      ubicacion_anatomica,
      ubicacion_lado
    );
  }
  console.log('Se insertaron 25 pacientes reales de prueba en la base de datos.');
}

module.exports = db;
 