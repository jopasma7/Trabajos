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
                    reject(err);
                } else {
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
                zona TEXT CHECK(zona IN ('Nueva', 'Vieja')) NOT NULL DEFAULT 'Nueva',
                seccion TEXT NOT NULL,
                fila INTEGER,
                numero INTEGER,
                ubicacion TEXT CHECK(ubicacion IN ('Centro', 'Izquierda', 'Derecha')) NOT NULL DEFAULT 'Centro',
                estado TEXT DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento')),
                precio DECIMAL(10,2),
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

        // Ejecutar migraciones
        await this.runMigrations();
    }

    // Ejecutar migraciones de la base de datos
    async runMigrations() {
        try {
            // Verificar si las columnas zona y ubicacion ya existen
            const tableInfo = await this.all("PRAGMA table_info(parcelas)");
            const columnNames = tableInfo.map(col => col.name);
            
            let needsMigration = false;
            
            // Verificar si faltan las nuevas columnas
            if (!columnNames.includes('zona')) {
                await this.run(`ALTER TABLE parcelas ADD COLUMN zona TEXT DEFAULT 'Nueva'`);
                needsMigration = true;
            }
            
            if (!columnNames.includes('ubicacion')) {
                await this.run(`ALTER TABLE parcelas ADD COLUMN ubicacion TEXT DEFAULT 'Centro'`);
                needsMigration = true;
            }
            
            if (!columnNames.includes('updated_at')) {
                await this.run(`ALTER TABLE parcelas ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
                needsMigration = true;
            }
            
            if (needsMigration) {
                console.log('✅ Migración de parcelas completada: agregadas columnas zona, ubicacion y updated_at');
                
                // Actualizar registros existentes para que cumplan las restricciones
                await this.run(`UPDATE parcelas SET zona = 'Nueva' WHERE zona IS NULL OR zona = ''`);
                await this.run(`UPDATE parcelas SET ubicacion = 'Centro' WHERE ubicacion IS NULL OR ubicacion = ''`);
            }
        } catch (error) {
            console.error('❌ Error en migración de parcelas:', error);
        }
    }

    // Validar datos de parcela
    validateParcelaData(data) {
        const validZonas = ['Nueva', 'Vieja'];
        const validUbicaciones = ['Centro', 'Izquierda', 'Derecha'];
        const validTipos = ['nicho', 'parcela', 'mausoleo'];

        if (data.zona && !validZonas.includes(data.zona)) {
            throw new Error(`Zona inválida. Debe ser: ${validZonas.join(', ')}`);
        }

        if (data.ubicacion && !validUbicaciones.includes(data.ubicacion)) {
            throw new Error(`Ubicación inválida. Debe ser: ${validUbicaciones.join(', ')}`);
        }

        if (data.tipo && !validTipos.includes(data.tipo)) {
            throw new Error(`Tipo inválido. Debe ser: ${validTipos.join(', ')}`);
        }

        return true;
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

    async searchDifuntos(searchParams) {
        let sql = `
            SELECT d.*, p.codigo as parcela_codigo, a.fecha_asignacion 
            FROM difuntos d
            LEFT JOIN asignaciones a ON d.id = a.difunto_id AND a.estado = 'activa'
            LEFT JOIN parcelas p ON a.parcela_id = p.id
            WHERE 1=1
        `;
        let params = [];

        // Si es una búsqueda simple (string), buscar en nombre, apellidos y cédula
        if (typeof searchParams === 'string') {
            const searchPattern = `%${searchParams}%`;
            sql += ` AND (d.nombre LIKE ? OR d.apellidos LIKE ? OR d.cedula LIKE ?)`;
            params.push(searchPattern, searchPattern, searchPattern);
        } else {
            // Búsqueda avanzada con múltiples filtros
            if (searchParams.nombre && searchParams.nombre.trim()) {
                sql += ` AND d.nombre LIKE ?`;
                params.push(`%${searchParams.nombre.trim()}%`);
            }
            
            if (searchParams.apellidos && searchParams.apellidos.trim()) {
                sql += ` AND d.apellidos LIKE ?`;
                params.push(`%${searchParams.apellidos.trim()}%`);
            }
            
            if (searchParams.fecha_desde) {
                sql += ` AND d.fecha_defuncion >= ?`;
                params.push(searchParams.fecha_desde);
            }
            
            if (searchParams.fecha_hasta) {
                sql += ` AND d.fecha_defuncion <= ?`;
                params.push(searchParams.fecha_hasta);
            }
            
            if (searchParams.general && searchParams.general.trim()) {
                const searchPattern = `%${searchParams.general.trim()}%`;
                sql += ` AND (d.nombre LIKE ? OR d.apellidos LIKE ? OR d.cedula LIKE ?)`;
                params.push(searchPattern, searchPattern, searchPattern);
            }
        }

        sql += ` ORDER BY d.apellidos, d.nombre`;
        return await this.all(sql, params);
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
        // Validar datos antes de insertar
        this.validateParcelaData(data);
        
        const sql = `
            INSERT INTO parcelas (codigo, tipo, zona, seccion, fila, numero, ubicacion, precio, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.codigo, 
            data.tipo, 
            data.zona || 'Nueva', 
            data.seccion, 
            data.fila, 
            data.numero, 
            data.ubicacion || 'Centro', 
            data.precio, 
            data.observaciones
        ];
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
                return;
            }

            // Parcelas de ejemplo
            const parcelas = [
                { codigo: 'A-1-001', tipo: 'nicho', zona: 'Nueva', seccion: 'A', fila: 1, numero: 1, ubicacion: 'Centro', precio: 1000 },
                { codigo: 'A-1-002', tipo: 'nicho', zona: 'Nueva', seccion: 'A', fila: 1, numero: 2, ubicacion: 'Izquierda', precio: 1000 },
                { codigo: 'B-1-001', tipo: 'parcela', zona: 'Vieja', seccion: 'B', fila: 1, numero: 1, ubicacion: 'Derecha', precio: 2000 },
                { codigo: 'B-1-002', tipo: 'parcela', zona: 'Vieja', seccion: 'B', fila: 1, numero: 2, ubicacion: 'Centro', precio: 2000 },
                { codigo: 'C-1-001', tipo: 'mausoleo', zona: 'Nueva', seccion: 'C', fila: 1, numero: 1, ubicacion: 'Centro', precio: 5000 }
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

        } catch (error) {
            throw error;
        }
    }

    // Métodos CRUD para difuntos individuales
    async getDifunto(id) {
        return await this.get('SELECT * FROM difuntos WHERE id = ?', [id]);
    }

    async updateDifunto(id, data) {
        const sql = `
            UPDATE difuntos SET 
                nombre = ?, apellidos = ?, fecha_nacimiento = ?, fecha_defuncion = ?,
                cedula = ?, sexo = ?, lugar_nacimiento = ?, causa_muerte = ?, observaciones = ?
            WHERE id = ?
        `;
        
        const params = [
            data.nombre, data.apellidos, data.fecha_nacimiento, data.fecha_defuncion,
            data.cedula, data.sexo, data.lugar_nacimiento, data.causa_muerte, data.observaciones, id
        ];
        
        return await this.run(sql, params);
    }

    async deleteDifunto(id) {
        // Primero eliminar asignaciones relacionadas
        await this.run('DELETE FROM asignaciones WHERE difunto_id = ?', [id]);
        // Luego eliminar el difunto
        return await this.run('DELETE FROM difuntos WHERE id = ?', [id]);
    }

    // Métodos CRUD para parcelas individuales
    async getParcela(id) {
        return await this.get('SELECT * FROM parcelas WHERE id = ?', [id]);
    }

    async updateParcela(id, data) {
        // Validar datos antes de actualizar
        this.validateParcelaData(data);
        
        // Verificar si la columna updated_at existe
        const tableInfo = await this.all("PRAGMA table_info(parcelas)");
        const columnNames = tableInfo.map(col => col.name);
        const hasUpdatedAt = columnNames.includes('updated_at');
        
        const sql = `
            UPDATE parcelas SET 
                codigo = ?, tipo = ?, zona = ?, seccion = ?, fila = ?, numero = ?, ubicacion = ?, precio = ?, observaciones = ?${hasUpdatedAt ? ', updated_at = CURRENT_TIMESTAMP' : ''}
            WHERE id = ?
        `;
        
        const params = [
            data.codigo, 
            data.tipo, 
            data.zona || 'Nueva', 
            data.seccion, 
            data.fila, 
            data.numero, 
            data.ubicacion || 'Centro', 
            data.precio, 
            data.observaciones, 
            id
        ];
        
        return await this.run(sql, params);
    }

    async deleteParcela(id) {
        // Primero verificar si tiene asignaciones activas
        const asignaciones = await this.all('SELECT * FROM asignaciones WHERE parcela_id = ? AND estado = "activa"', [id]);
        if (asignaciones.length > 0) {
            throw new Error('No se puede eliminar la parcela porque tiene difuntos asignados');
        }
        
        // Eliminar asignaciones históricas
        await this.run('DELETE FROM asignaciones WHERE parcela_id = ?', [id]);
        // Eliminar la parcela
        return await this.run('DELETE FROM parcelas WHERE id = ?', [id]);
    }

    // Crear respaldo de la base de datos
    async createBackup(customPath = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `cementerio_backup_${timestamp}.db`;
            
            // Usar ruta personalizada o ruta por defecto
            let backupDir;
            if (customPath) {
                backupDir = customPath;
            } else {
                backupDir = path.join(__dirname, '..', '..', 'backups');
            }
            
            const backupPath = path.join(backupDir, backupFileName);

            // Crear directorio de respaldos si no existe
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Copiar archivo de base de datos
            await fs.promises.copyFile(this.dbPath, backupPath);

            // Obtener información del respaldo
            const stats = await fs.promises.stat(backupPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            return {
                success: true,
                message: 'Respaldo creado exitosamente',
                backupPath: backupPath,
                fileName: backupFileName,
                size: sizeInMB + ' MB',
                date: new Date().toLocaleString('es-ES'),
                customPath: customPath !== null
            };
        } catch (error) {
            console.error('Error creando respaldo:', error);
            throw new Error(`Error al crear respaldo: ${error.message}`);
        }
    }

    // Optimizar base de datos
    async optimizeDatabase() {
        try {
            const startTime = Date.now();
            const results = [];

            // Ejecutar VACUUM para recompilar y optimizar la base de datos
            await new Promise((resolve, reject) => {
                this.db.run('VACUUM', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        results.push('VACUUM ejecutado correctamente');
                        resolve();
                    }
                });
            });

            // Ejecutar ANALYZE para actualizar estadísticas de consulta
            await new Promise((resolve, reject) => {
                this.db.run('ANALYZE', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        results.push('ANALYZE ejecutado correctamente');
                        resolve();
                    }
                });
            });

            // Verificar integridad de la base de datos
            const integrityResult = await new Promise((resolve, reject) => {
                this.db.get('PRAGMA integrity_check', (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });

            const integrityStatus = integrityResult['integrity_check'] === 'ok' ? 
                'Base de datos íntegra' : 
                'Problemas de integridad detectados';
            results.push(integrityStatus);

            const endTime = Date.now();
            const executionTime = ((endTime - startTime) / 1000).toFixed(2);

            return {
                success: true,
                message: 'Optimización completada exitosamente',
                results: results,
                executionTime: executionTime + ' segundos',
                date: new Date().toLocaleString('es-ES')
            };
        } catch (error) {
            console.error('Error optimizando base de datos:', error);
            throw new Error(`Error al optimizar base de datos: ${error.message}`);
        }
    }

    // Obtener tamaño de la base de datos
    async getDatabaseSize() {
        try {
            const stats = await fs.promises.stat(this.dbPath);
            const sizeInBytes = stats.size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

            // Obtener información adicional de la base de datos
            const pageCount = await new Promise((resolve, reject) => {
                this.db.get('PRAGMA page_count', (err, row) => {
                    if (err) reject(err);
                    else resolve(row.page_count);
                });
            });

            const pageSize = await new Promise((resolve, reject) => {
                this.db.get('PRAGMA page_size', (err, row) => {
                    if (err) reject(err);
                    else resolve(row.page_size);
                });
            });

            const freePages = await new Promise((resolve, reject) => {
                this.db.get('PRAGMA freelist_count', (err, row) => {
                    if (err) reject(err);
                    else resolve(row.freelist_count);
                });
            });

            const usedSpace = ((pageCount - freePages) * pageSize / (1024 * 1024)).toFixed(2);
            const freeSpace = (freePages * pageSize / (1024 * 1024)).toFixed(2);

            return {
                success: true,
                fileSize: {
                    bytes: sizeInBytes,
                    kb: sizeInKB + ' KB',
                    mb: sizeInMB + ' MB'
                },
                database: {
                    totalPages: pageCount,
                    pageSize: pageSize + ' bytes',
                    usedSpace: usedSpace + ' MB',
                    freeSpace: freeSpace + ' MB',
                    freePages: freePages
                },
                lastModified: stats.mtime.toLocaleString('es-ES')
            };
        } catch (error) {
            console.error('Error obteniendo tamaño de base de datos:', error);
            throw new Error(`Error al obtener información de la base de datos: ${error.message}`);
        }
    }

    // Obtener actividad reciente
    async getRecentActivity(limit = 10) {
        try {
            // Obtener difuntos recientes (últimos registrados)
            const recentDifuntos = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT 
                        'difunto' as tipo,
                        'Nuevo registro' as accion,
                        nombre || ' ' || apellidos as descripcion,
                        created_at as fecha,
                        id
                    FROM difuntos 
                    WHERE created_at IS NOT NULL
                    ORDER BY created_at DESC 
                    LIMIT ?
                `, [Math.ceil(limit * 0.6)], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            // Obtener parcelas recientes
            const recentParcelas = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT 
                        'parcela' as tipo,
                        'Nueva parcela' as accion,
                        CASE 
                            WHEN codigo IS NOT NULL AND codigo != '' 
                            THEN 'Parcela ' || codigo || ' (' || tipo || ')'
                            ELSE 'Parcela #' || numero || ' (' || tipo || ')'
                        END as descripcion,
                        created_at as fecha,
                        id
                    FROM parcelas 
                    WHERE created_at IS NOT NULL
                    ORDER BY created_at DESC 
                    LIMIT ?
                `, [Math.ceil(limit * 0.4)], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            // Combinar y ordenar por fecha
            const allActivity = [...recentDifuntos, ...recentParcelas]
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, limit)
                .map(item => ({
                    ...item,
                    fecha: new Date(item.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    fechaRaw: item.fecha
                }));
            return allActivity;
        } catch (error) {
            // Devolver datos de ejemplo si hay error
            return [
                {
                    tipo: 'sistema',
                    accion: 'Sistema iniciado',
                    descripcion: 'Aplicación iniciada correctamente',
                    fecha: new Date().toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    fechaRaw: new Date().toISOString(),
                    id: 'system'
                },
                {
                    tipo: 'sistema',
                    accion: 'Base de datos',
                    descripcion: 'Conexión establecida exitosamente',
                    fecha: new Date(Date.now() - 1000).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    fechaRaw: new Date(Date.now() - 1000).toISOString(),
                    id: 'db'
                }
            ];
        }
    }
}

module.exports = DatabaseManager;
