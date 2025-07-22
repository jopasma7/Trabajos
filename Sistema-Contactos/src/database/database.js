const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '..', '..', 'data', 'users.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.init();
      }
    });
  }

  init() {
    // Tabla de usuarios (mantener para autenticación)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        gender TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Nueva tabla de contactos empresariales
    const createContactsTable = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        country TEXT,
        avatar TEXT,
        tags TEXT,
        comments TEXT,
        company TEXT,
        position TEXT,
        address TEXT,
        city TEXT,
        website TEXT,
        notes TEXT,
        status TEXT DEFAULT 'lead',
        priority TEXT DEFAULT 'medium',
        source TEXT,
        assigned_to INTEGER,
        last_contact DATE,
        next_followup DATE,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `;

    // Tabla de interacciones/actividades
    const createActivitiesTable = `
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER,
        user_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    // Tabla de etiquetas
    const createTagsTable = `
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#4FACFE',
        type TEXT NOT NULL DEFAULT 'category',
        usage TEXT NOT NULL DEFAULT 'both',
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
        // Agregar columnas que puedan faltar en bases de datos existentes
        this.db.run(`ALTER TABLE users ADD COLUMN gender TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.createDefaultAdmin();
      }
    });

    this.db.run(createContactsTable, (err) => {
      if (err) {
        console.error('Error creating contacts table:', err);
      } else {
        console.log('Contacts table ready');
        // Agregar columnas que puedan faltar en bases de datos existentes
        this.db.run(`ALTER TABLE contacts ADD COLUMN user_id INTEGER`, (err) => {
          // Ignorar error si la columna ya existe
          if (!err) {
            // Si se agregó la columna user_id, asignar todos los contactos existentes al primer admin
            this.db.run(`UPDATE contacts SET user_id = 1 WHERE user_id IS NULL`, (err) => {
              if (err) console.error('Error updating contacts user_id:', err);
            });
          }
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN avatar TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN company TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN position TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN address TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN city TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN website TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN notes TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'lead'`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN priority TEXT DEFAULT 'medium'`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN source TEXT`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN assigned_to INTEGER`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN last_contact DATE`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN next_followup DATE`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.db.run(`ALTER TABLE contacts ADD COLUMN created_by INTEGER`, (err) => {
          // Ignorar error si la columna ya existe
        });
        this.createSampleContacts();
      }
    });

    this.db.run(createActivitiesTable, (err) => {
      if (err) {
        console.error('Error creating activities table:', err);
      } else {
        console.log('Activities table ready');
      }
    });

    this.db.run(createTagsTable, (err) => {
      if (err) {
        console.error('Error creating tags table:', err);
      } else {
        console.log('Tags table ready');
        this.createDefaultTags();
      }
    });
  }

  createDefaultAdmin() {
    const bcrypt = require('bcrypt');
    
    // Crear admin por defecto
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin123';

    this.getUserByEmail(adminEmail, (err, user) => {
      if (err || !user) {
        bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing admin password:', err);
            return;
          }

          const insertAdmin = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
          `;

          this.db.run(insertAdmin, ['Administrador', adminEmail, hashedPassword, 'admin'], (err) => {
            if (err) {
              console.error('Error creating default admin:', err);
            } else {
              console.log('Default admin created: admin@admin.com / admin123');
            }
          });
        });
      }
    });

    // Crear usuario de prueba
    const testEmail = 'test@test.com';
    const testPassword = 'test123';

    this.getUserByEmail(testEmail, (err, user) => {
      if (err || !user) {
        bcrypt.hash(testPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing test password:', err);
            return;
          }

          const insertTest = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
          `;

          this.db.run(insertTest, ['Usuario de Prueba', testEmail, hashedPassword, 'user'], (err) => {
            if (err) {
              console.error('Error creating test user:', err);
            } else {
              console.log('Test user created: test@test.com / test123');
            }
          });
        });
      }
    });

    // Crear usuario admin@test.com para el login de prueba
    const adminTestEmail = 'admin@test.com';
    const adminTestPassword = '123456';

    this.getUserByEmail(adminTestEmail, (err, user) => {
      if (err || !user) {
        bcrypt.hash(adminTestPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing admin test password:', err);
            return;
          }

          const insertAdminTest = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
          `;

          this.db.run(insertAdminTest, ['Administrador de Prueba', adminTestEmail, hashedPassword, 'admin'], (err) => {
            if (err) {
              console.error('Error creating admin test user:', err);
            } else {
              console.log('Admin test user created: admin@test.com / 123456');
            }
          });
        });
      }
    });
  }

  createUser(userData, callback) {
    const { name, email, password, role = 'user', gender, avatar } = userData;
    const sql = `
      INSERT INTO users (name, email, password, role, gender, avatar, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    this.db.run(sql, [name, email, password, role, gender, avatar], function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { id: this.lastID, name, email, role, gender, avatar });
      }
    });
  }

  getUserByEmail(email, callback) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    this.db.get(sql, [email], callback);
  }

  getUserById(id, callback) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    this.db.get(sql, [id], callback);
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email, role, gender, avatar, created_at, updated_at FROM users ORDER BY created_at DESC';
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  updateUser(userData) {
    return new Promise((resolve, reject) => {
      const { id, name, email, role, gender, avatar } = userData;
      const sql = `
        UPDATE users 
        SET name = ?, email = ?, role = ?, gender = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(sql, [name, email, role, gender, avatar, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, name, email, role, gender, avatar });
        }
      });
    });
  }

  deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      this.db.run(sql, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  createSampleContacts() {
    // Verificar si ya existen contactos
    const checkContacts = 'SELECT COUNT(*) as count FROM contacts';
    this.db.get(checkContacts, [], (err, result) => {
      if (err || result.count > 0) return;

      const sampleContacts = [
        {
          name: 'Ana García López',
          email: 'ana.garcia@techcorp.com',
          phone: '+34 91 123 4567',
          company: 'TechCorp Solutions',
          position: 'Directora de Marketing',
          city: 'Madrid',
          country: 'España',
          status: 'cliente',
          priority: 'high',
          source: 'referido',
          tags: 'vip,marketing,tecnología'
        },
        {
          name: 'Carlos Rodríguez',
          email: 'carlos@innovatech.es',
          phone: '+34 93 987 6543',
          company: 'InnovaTech Barcelona',
          position: 'CEO',
          city: 'Barcelona',
          country: 'España',
          status: 'prospect',
          priority: 'high',
          source: 'web',
          tags: 'ceo,innovación,startup'
        },
        {
          name: 'María Fernández',
          email: 'maria.fernandez@globalcorp.com',
          phone: '+34 95 456 7890',
          company: 'Global Corp',
          position: 'Gerente de Ventas',
          city: 'Sevilla',
          country: 'España',
          status: 'lead',
          priority: 'medium',
          source: 'linkedin',
          tags: 'ventas,global,b2b'
        },
        {
          name: 'José Martínez',
          email: 'jose@startupvalencia.com',
          phone: '+34 96 321 0987',
          company: 'Startup Valencia',
          position: 'CTO',
          city: 'Valencia',
          country: 'España',
          status: 'lead',
          priority: 'low',
          source: 'evento',
          tags: 'startup,tecnología,cto'
        },
        {
          name: 'Isabel Sánchez',
          email: 'isabel.sanchez@consultingpro.es',
          phone: '+34 98 654 3210',
          company: 'Consulting Pro',
          position: 'Consultora Senior',
          city: 'Bilbao',
          country: 'España',
          status: 'inactivo',
          priority: 'low',
          source: 'email',
          tags: 'consultoría,senior,b2b'
        }
      ];

      sampleContacts.forEach(contact => {
        const sql = `
          INSERT INTO contacts (name, email, phone, company, position, city, country, status, priority, source, tags, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        
        this.db.run(sql, [
          contact.name, contact.email, contact.phone, contact.company, 
          contact.position, contact.city, contact.country, contact.status, 
          contact.priority, contact.source, contact.tags
        ]);
      });
      
      console.log('Sample contacts created');
    });
  }

  // Métodos para gestión de contactos
  getAllContacts(userId = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT c.*, u.name as assigned_to_name 
        FROM contacts c 
        LEFT JOIN users u ON c.assigned_to = u.id 
      `;
      let params = [];
      
      if (userId) {
        sql += ` WHERE c.user_id = ?`;
        params.push(userId);
      }
      
      sql += ` ORDER BY c.created_at DESC`;
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Map 'notes' to 'comments' for frontend compatibility
          const mappedRows = rows.map(row => ({
            ...row,
            comments: row.notes
          }));
          resolve(mappedRows);
        }
      });
    });
  }

  createContact(contactData) {
    return new Promise((resolve, reject) => {
      const {
        name, email, phone, country, avatar, tags, comments, created_by, user_id
      } = contactData;

      const sql = `
        INSERT INTO contacts (
          user_id, name, email, phone, country, avatar, tags, notes, created_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [
        user_id, name, email, phone, country, avatar, tags, comments, created_by
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...contactData });
        }
      });
    });
  }

  updateContact(contactData) {
    return new Promise((resolve, reject) => {
      const {
        id, name, email, phone, country, avatar, tags, comments, user_id
      } = contactData;

      let sql, params;
      
      if (user_id) {
        // Verificar que el usuario solo pueda editar sus propios contactos
        sql = `
          UPDATE contacts 
          SET name = ?, email = ?, phone = ?, country = ?, avatar = ?, 
              tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `;
        params = [name, email, phone, country, avatar, tags, comments, id, user_id];
      } else {
        // Admin puede editar cualquier contacto
        sql = `
          UPDATE contacts 
          SET name = ?, email = ?, phone = ?, country = ?, avatar = ?, 
              tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        params = [name, email, phone, country, avatar, tags, comments, id];
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('No se pudo actualizar el contacto. Verifique que tenga permisos.'));
        } else {
          resolve({ id, name, email, phone, country, avatar, tags, comments });
        }
      });
    });
  }

  deleteContact(contactId, userId = null) {
    return new Promise((resolve, reject) => {
      let sql, params;
      
      if (userId) {
        // Usuario normal solo puede eliminar sus propios contactos
        sql = 'DELETE FROM contacts WHERE id = ? AND user_id = ?';
        params = [contactId, userId];
      } else {
        // Admin puede eliminar cualquier contacto
        sql = 'DELETE FROM contacts WHERE id = ?';
        params = [contactId];
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('No se pudo eliminar el contacto. Verifique que tenga permisos.'));
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  getContactStats(userId = null) {
    return new Promise((resolve, reject) => {
      let sql, params;
      
      if (userId) {
        // Usuario normal ve solo estadísticas de sus contactos
        sql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'lead' THEN 1 ELSE 0 END) as leads,
            SUM(CASE WHEN status = 'prospect' THEN 1 ELSE 0 END) as prospects,
            SUM(CASE WHEN status = 'cliente' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN status = 'inactivo' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
            COUNT(DISTINCT company) as companies
          FROM contacts
          WHERE user_id = ?
        `;
        params = [userId];
      } else {
        // Admin ve estadísticas de todos los contactos
        sql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'lead' THEN 1 ELSE 0 END) as leads,
            SUM(CASE WHEN status = 'prospect' THEN 1 ELSE 0 END) as prospects,
            SUM(CASE WHEN status = 'cliente' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN status = 'inactivo' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
            COUNT(DISTINCT company) as companies
          FROM contacts
        `;
        params = [];
      }
      
      this.db.get(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // ============ TAGS METHODS ============
  
  createDefaultTags() {
    const defaultTags = [
      { name: 'VIP', color: '#FFD700', type: 'category', usage: 'both', description: 'Clientes importantes' },
      { name: 'Activo', color: '#28A745', type: 'status', usage: 'contacts', description: 'Contacto activo' },
      { name: 'Prospecto', color: '#17A2B8', type: 'status', usage: 'contacts', description: 'Cliente potencial' },
      { name: 'Cliente', color: '#007BFF', type: 'category', usage: 'contacts', description: 'Cliente confirmado' },
      { name: 'Urgente', color: '#DC3545', type: 'priority', usage: 'both', description: 'Prioridad alta' },
      { name: 'Seguimiento', color: '#FFC107', type: 'action', usage: 'contacts', description: 'Requiere seguimiento' },
      { name: 'Nuevo', color: '#6C757D', type: 'status', usage: 'both', description: 'Contacto o usuario nuevo' },
      { name: 'Inactivo', color: '#6C757D', type: 'status', usage: 'both', description: 'Sin actividad reciente' },
      { name: 'Empresa', color: '#20C997', type: 'category', usage: 'contacts', description: 'Contacto empresarial' },
      { name: 'Personal', color: '#E83E8C', type: 'category', usage: 'contacts', description: 'Contacto personal' },
      { name: 'Admin', color: '#DC3545', type: 'role', usage: 'users', description: 'Usuario administrador' },
      { name: 'Vendedor', color: '#6F42C1', type: 'role', usage: 'users', description: 'Usuario vendedor' }
    ];

    // Check if tags exist before creating
    this.db.get('SELECT COUNT(*) as count FROM tags', [], (err, result) => {
      if (err || result.count === 0) {
        const insertTag = `INSERT OR IGNORE INTO tags (name, color, type, usage, description, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
        
        defaultTags.forEach(tag => {
          this.db.run(insertTag, [tag.name, tag.color, tag.type, tag.usage, tag.description, 1], (err) => {
            if (err) {
              console.error('Error creating default tag:', err);
            }
          });
        });
        
        console.log('Default tags created');
      }
    });
  }

  createTag(tagData, callback) {
    const sql = `
      INSERT INTO tags (name, color, type, usage, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.db.run(sql, [
      tagData.name, tagData.color, tagData.type, tagData.usage, 
      tagData.description, tagData.created_by
    ], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
          const uniqueError = new Error(`Ya existe una etiqueta con el nombre "${tagData.name}". Por favor, elige un nombre diferente.`);
          uniqueError.code = 'DUPLICATE_NAME';
          if (callback) callback(uniqueError);
          return;
        }
      }
      
      if (callback) {
        callback(err, err ? null : { id: this.lastID, ...tagData });
      }
    });
  }

  getAllTags(callback) {
    const sql = 'SELECT * FROM tags ORDER BY name';
    this.db.all(sql, [], callback);
  }

  getTagById(id, callback) {
    const sql = 'SELECT * FROM tags WHERE id = ?';
    this.db.get(sql, [id], callback);
  }

  updateTag(id, tagData, callback) {
    const sql = `
      UPDATE tags SET 
        name = ?, color = ?, type = ?, usage = ?, description = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    this.db.run(sql, [
      tagData.name, tagData.color, tagData.type, tagData.usage,
      tagData.description, id
    ], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
          const uniqueError = new Error(`Ya existe una etiqueta con el nombre "${tagData.name}". Por favor, elige un nombre diferente.`);
          uniqueError.code = 'DUPLICATE_NAME';
          if (callback) callback(uniqueError);
          return;
        }
      }
      
      if (callback) {
        callback(err, err ? null : { changes: this.changes });
      }
    });
  }

  deleteTag(id, callback) {
    const sql = 'DELETE FROM tags WHERE id = ?';
    this.db.run(sql, [id], callback);
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = Database;
