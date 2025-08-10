// Script para asignar una categoría y un icono por defecto a todos los productos que no tengan categoría
// Ejecutar con: node scripts/asignar_categoria_icono.js

const sqlite3 = require('sqlite3').verbose();
const dbPath = './data/floristeria.db';

const db = new sqlite3.Database(dbPath);

async function run() {
    // 1. Crear categoría por defecto si no existe
    const categoriaNombre = 'General';
    const categoriaIcono = '🌸';
    let categoriaId;
    await new Promise((resolve, reject) => {
        db.get('SELECT id FROM categorias WHERE nombre = ?', [categoriaNombre], (err, row) => {
            if (err) return reject(err);
            if (row) {
                categoriaId = row.id;
                resolve();
            } else {
                db.run('INSERT INTO categorias (nombre, icono) VALUES (?, ?)', [categoriaNombre, categoriaIcono], function(err) {
                    if (err) return reject(err);
                    categoriaId = this.lastID;
                    resolve();
                });
            }
        });
    });

    // 2. Asignar esa categoría a todos los productos sin categoría
    await new Promise((resolve, reject) => {
        db.run('UPDATE productos SET categoria_id = ? WHERE categoria_id IS NULL OR categoria_id = 0', [categoriaId], function(err) {
            if (err) return reject(err);
            console.log(`Productos actualizados: ${this.changes}`);
            resolve();
        });
    });

    // 3. Asegurar que todas las categorías tengan icono
    await new Promise((resolve, reject) => {
        db.run("UPDATE categorias SET icono = ? WHERE icono IS NULL OR icono = ''", [categoriaIcono], function(err) {
            if (err) return reject(err);
            console.log(`Categorías actualizadas: ${this.changes}`);
            resolve();
        });
    });

    db.close();
    console.log('¡Actualización completada!');
}

run().catch(err => {
    console.error('Error:', err);
    db.close();
});
