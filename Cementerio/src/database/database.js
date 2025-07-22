const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '..', 'data', 'cementerio.db');
        this.db = null;
        this.ensureDataDirectory();
    }

    // Asegurar que el directorio de datos existe
    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    // Conectar a la base de datos
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error conectando a la base de datos:', err);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // Inicializar tablas
    async initializeTables() {
        const tables = [
            // Tabla de difuntos
            `CREATE TABLE IF NOT EXISTS difuntos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                fecha_nacimiento DATE,
                fecha_defuncion DATE NOT NULL,
                cedula TEXT UNIQUE,
                sexo TEXT CHECK(sexo IN ('M', 'F')) NOT NULL,
                lugar_nacimiento TEXT,
                causa_muerte TEXT,
                estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'trasladado', 'exhumado')),
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de parcelas/nichos
            `CREATE TABLE IF NOT EXISTS parcelas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                tipo TEXT CHECK(tipo IN ('nicho', 'parcela', 'mausoleo')) NOT NULL,
                seccion TEXT NOT NULL,
                fila INTEGER,
                numero INTEGER,
                estado TEXT DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento')),
                precio DECIMAL(10,2),
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de familiares/responsables
            `CREATE TABLE IF NOT EXISTS familiares (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                difunto_id INTEGER,
                nombre TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                relacion TEXT NOT NULL,
                telefono TEXT,
                email TEXT,
                direccion TEXT,
                cedula TEXT,
                es_responsable BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (difunto_id) REFERENCES difuntos (id)
            )`,

            // Tabla de asignaciones (relaciona difuntos con parcelas)
            `CREATE TABLE IF NOT EXISTS asignaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                difunto_id INTEGER,
                parcela_id INTEGER,
                fecha_asignacion DATE NOT NULL,
                fecha_vencimiento DATE,
                tipo_servicio TEXT CHECK(tipo_servicio IN ('perpetuo', 'temporal', 'arrendamiento')),
                costo DECIMAL(10,2),
                estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'vencida', 'cancelada')),
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (difunto_id) REFERENCES difuntos (id),
                FOREIGN KEY (parcela_id) REFERENCES parcelas (id)
            )`,

            // Tabla de pagos
            `CREATE TABLE IF NOT EXISTS pagos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asignacion_id INTEGER,
                monto DECIMAL(10,2) NOT NULL,
                fecha_pago DATE NOT NULL,
                metodo_pago TEXT CHECK(metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta')),
                referencia TEXT,
                concepto TEXT,
                estado TEXT DEFAULT 'completado' CHECK(estado IN ('pendiente', 'completado', 'cancelado')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asignacion_id) REFERENCES asignaciones (id)
            )`,

            // Tabla de configuración
            `CREATE TABLE IF NOT EXISTS configuracion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descripcion TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const sql of tables) {
            await this.run(sql);
        }

        // Insertar configuración inicial
        await this.insertInitialConfig();
        
        console.log('Tablas inicializadas correctamente');
    }

    // Insertar configuración inicial
    async insertInitialConfig() {
        const configs = [
            ['nombre_cementerio', 'Cementerio Municipal', 'Nombre del cementerio'],
            ['direccion', '', 'Dirección del cementerio'],
            ['telefono', '', 'Teléfono de contacto'],
            ['email', '', 'Email de contacto'],
            ['precio_nicho_anual', '0', 'Precio anual de nicho'],
            ['precio_parcela_anual', '0', 'Precio anual de parcela'],
            ['tiempo_mantenimiento_anos', '5', 'Años de mantenimiento incluidos']
        ];

        for (const [clave, valor, descripcion] of configs) {
            await this.run(
                `INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)`,
                [clave, valor, descripcion]
            );
        }
    }

    // Ejecutar consulta SQL
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error ejecutando SQL:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Obtener un registro
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error obteniendo registro:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Obtener múltiples registros
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error obteniendo registros:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Cerrar conexión
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Conexión a la base de datos cerrada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Métodos específicos para difuntos
    async createDifunto(data) {
        const sql = `
            INSERT INTO difuntos (
                nombre, apellidos, fecha_nacimiento, fecha_defuncion, 
                cedula, sexo, lugar_nacimiento, causa_muerte, observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            data.nombre, data.apellidos, data.fecha_nacimiento, data.fecha_defuncion,
            data.cedula, data.sexo, data.lugar_nacimiento, data.causa_muerte, data.observaciones
        ];
        
        return await this.run(sql, params);
    }

    async getAllDifuntos(limit = 100, offset = 0) {
        const sql = `
            SELECT d.*, p.codigo as parcela_codigo, a.fecha_asignacion 
            FROM difuntos d
            LEFT JOIN asignaciones a ON d.id = a.difunto_id AND a.estado = 'activa'
            LEFT JOIN parcelas p ON a.parcela_id = p.id
            ORDER BY d.fecha_defuncion DESC
            LIMIT ? OFFSET ?
        `;
        return await this.all(sql, [limit, offset]);
    }

    async searchDifuntos(searchTerm) {
        const sql = `
            SELECT d.*, p.codigo as parcela_codigo 
            FROM difuntos d
            LEFT JOIN asignaciones a ON d.id = a.difunto_id AND a.estado = 'activa'
            LEFT JOIN parcelas p ON a.parcela_id = p.id
            WHERE d.nombre LIKE ? OR d.apellidos LIKE ? OR d.cedula LIKE ?
            ORDER BY d.apellidos, d.nombre
        `;
        const searchPattern = `%${searchTerm}%`;
        return await this.all(sql, [searchPattern, searchPattern, searchPattern]);
    }

    // Métodos para estadísticas
    async getEstadisticas() {
        const totalDifuntos = await this.get('SELECT COUNT(*) as count FROM difuntos WHERE estado = "activo"');
        const difuntosEsteMes = await this.get(`
            SELECT COUNT(*) as count FROM difuntos 
            WHERE fecha_defuncion >= date('now', 'start of month') 
            AND estado = "activo"
        `);
        const parcelasDisponibles = await this.get('SELECT COUNT(*) as count FROM parcelas WHERE estado = "disponible"');
        const parcelasOcupadas = await this.get('SELECT COUNT(*) as count FROM parcelas WHERE estado = "ocupada"');

        return {
            totalDifuntos: totalDifuntos.count,
            difuntosEsteMes: difuntosEsteMes.count,
            parcelasDisponibles: parcelasDisponibles.count,
            parcelasOcupadas: parcelasOcupadas.count
        };
    }

    // Métodos para parcelas
    async createParcela(data) {
        const sql = `
            INSERT INTO parcelas (codigo, tipo, seccion, fila, numero, precio, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [data.codigo, data.tipo, data.seccion, data.fila, data.numero, data.precio, data.observaciones];
        return await this.run(sql, params);
    }

    async getParcelasDisponibles() {
        return await this.all('SELECT * FROM parcelas WHERE estado = "disponible" ORDER BY seccion, fila, numero');
    }

    // Obtener todas las parcelas
    async getParcelas() {
        return await this.all('SELECT * FROM parcelas ORDER BY seccion, fila, numero');
    }

    // Obtener todos los difuntos
    async getDifuntos() {
        return await this.all('SELECT * FROM difuntos ORDER BY apellidos, nombre');
    }

    // Insertar datos de ejemplo
    async insertSampleData() {
        try {
            // Verificar si ya existen datos
            const existingParcelas = await this.getParcelas();
            const existingDifuntos = await this.getDifuntos();
            
            if (existingParcelas.length > 0 && existingDifuntos.length > 0) {
                console.log('Datos de ejemplo ya existen, omitiendo inserción');
                return;
            }

            // Parcelas de ejemplo
            const parcelas = [
                { codigo: 'A-1-001', tipo: 'nicho', seccion: 'A', fila: 1, numero: 1, precio: 1000 },
                { codigo: 'A-1-002', tipo: 'nicho', seccion: 'A', fila: 1, numero: 2, precio: 1000 },
                { codigo: 'B-1-001', tipo: 'parcela', seccion: 'B', fila: 1, numero: 1, precio: 2000 },
                { codigo: 'B-1-002', tipo: 'parcela', seccion: 'B', fila: 1, numero: 2, precio: 2000 },
                { codigo: 'C-1-001', tipo: 'mausoleo', seccion: 'C', fila: 1, numero: 1, precio: 5000 }
            ];

            // Solo insertar si no existen parcelas
            if (existingParcelas.length === 0) {
                for (const parcela of parcelas) {
                    try {
                        await this.createParcela(parcela);
                    } catch (err) {
                        console.error('Error insertando parcela:', err.message);
                    }
                }
            }

            // Difuntos de ejemplo
            const difuntos = [
                {
                    nombre: 'Juan',
                    apellidos: 'Pérez González',
                    fecha_nacimiento: '1950-05-15',
                    fecha_defuncion: '2023-01-10',
                    sexo: 'M',
                    documento: '12345678A',
                    lugar_nacimiento: 'Madrid, España',
                    causa_muerte: 'Enfermedad',
                    estado: 'activo'
                }
            ];

            // Solo insertar si no existen difuntos
            if (existingDifuntos.length === 0) {
                for (const difunto of difuntos) {
                    try {
                        await this.createDifunto(difunto);
                    } catch (err) {
                        console.error('Error insertando difunto:', err.message);
                    }
                }
            }

            console.log('Datos de ejemplo insertados correctamente');
        } catch (error) {
            console.error('Error en insertSampleData:', error);
        }
    }
}

module.exports = DatabaseManager;
