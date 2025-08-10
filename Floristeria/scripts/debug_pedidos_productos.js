// Script de depuración para listar pedidos y sus productos asociados
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../data/floristeria.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Pedidos y sus productos asociados:');
  db.all(`SELECT p.id as pedido_id, p.fecha_pedido, c.nombre as cliente, pd.producto_id, pr.nombre as producto_nombre
          FROM pedidos p
          LEFT JOIN clientes c ON p.cliente_id = c.id
          LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
          LEFT JOIN productos pr ON pd.producto_id = pr.id
          ORDER BY p.id DESC, pd.producto_id`, [], (err, rows) => {
    if (err) {
      console.error('Error consultando:', err);
      process.exit(1);
    }
    let lastPedido = null;
    rows.forEach(row => {
      if (lastPedido !== row.pedido_id) {
        console.log(`\nPedido #${row.pedido_id} | Fecha: ${row.fecha_pedido} | Cliente: ${row.cliente}`);
        lastPedido = row.pedido_id;
      }
      if (row.producto_id) {
        console.log(`   - Producto: [${row.producto_id}] ${row.producto_nombre}`);
      } else {
        console.log('   - (Sin productos asociados)');
      }
    });
    if (rows.length === 0) {
      console.log('No hay pedidos en la base de datos.');
    }
    db.close();
  });
});
