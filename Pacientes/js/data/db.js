// db.js
// Conexión real a better-sqlite3 y creación de tablas necesarias
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../../data/hospital.db');
const db = new Database(dbPath);

// Crear tabla agenda si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT
)`).run();

// --- Métodos de agenda ---
db.getAllEventos = function() {
  return db.prepare('SELECT * FROM agenda ORDER BY fecha ASC, hora ASC').all();
};

db.upsertEventos = function(eventos) {
  const idsEnviado = eventos.map(e => e.id);
  // Eliminar los que no están en el array
  const idsEnBD = db.prepare('SELECT id FROM agenda').all().map(r => r.id);
  const idsAEliminar = idsEnBD.filter(id => !idsEnviado.includes(id));
  const deleteStmt = db.prepare('DELETE FROM agenda WHERE id = ?');
  idsAEliminar.forEach(id => deleteStmt.run(id));
  // Insertar o actualizar
  const upsertStmt = db.prepare(`INSERT INTO agenda (id, fecha, hora, titulo, descripcion) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET fecha=excluded.fecha, hora=excluded.hora, titulo=excluded.titulo, descripcion=excluded.descripcion`);
  eventos.forEach(ev => {
    upsertStmt.run(ev.id, ev.fecha, ev.hora, ev.titulo, ev.descripcion);
  });
  return true;
};

module.exports = db;
