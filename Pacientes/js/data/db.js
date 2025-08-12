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

// --- Métodos para incidencias ---
db.getIncidenciasByPaciente = function(pacienteId) {
  return db.prepare('SELECT * FROM incidencias WHERE paciente_id = ? ORDER BY fecha DESC, id DESC').all(pacienteId);
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
  const stmt = db.prepare('UPDATE pacientes SET nombre = ?, apellidos = ?, tipo_acceso = ?, fecha_instalacion = ?, ubicacion = ? WHERE id = ?');
  const info = stmt.run(
    paciente.nombre,
    paciente.apellidos,
    paciente.tipo_acceso,
    paciente.fecha_instalacion,
    paciente.ubicacion,
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
 