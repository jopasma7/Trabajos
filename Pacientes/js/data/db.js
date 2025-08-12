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
 
module.exports = db;
 