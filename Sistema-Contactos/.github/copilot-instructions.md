<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instrucciones para GitHub Copilot

Este proyecto es una aplicación de gestión de usuarios desarrollada con Electron, Node.js y SQLite.

## Contexto del Proyecto

- **Tecnología Principal**: Electron con Node.js
- **Base de Datos**: SQLite3 local
- **Autenticación**: bcrypt + JWT
- **Frontend**: HTML, CSS, JavaScript vanilla
- **Arquitectura**: IPC entre main y renderer processes

## Patrones de Código

### Estructura de Archivos
- `main.js`: Proceso principal de Electron con IPC handlers
- `src/preload.js`: Contexto bridge para comunicación segura
- `src/database/`: Gestión de base de datos SQLite
- `src/services/`: Servicios como autenticación
- `src/views/`: Páginas HTML
- `src/styles/`: Archivos CSS
- `src/scripts/`: JavaScript del frontend

### Convenciones de Nombres
- Variables y funciones: camelCase
- Constantes: UPPER_CASE
- Clases: PascalCase
- Archivos CSS: kebab-case
- IDs de elementos HTML: camelCase

### Estilo de Código
- Usar async/await para operaciones asíncronas
- Manejar errores con try/catch
- Validar datos tanto en frontend como backend
- Usar promesas para operaciones de base de datos
- Implementar loading states para UX

### Seguridad
- Nunca exponer nodeIntegration en webPreferences
- Usar contextIsolation siempre
- Validar y sanitizar todos los inputs
- Usar bcrypt para hash de contraseñas
- Implementar verificación de JWT

### Base de Datos
- Usar prepared statements para prevenir SQL injection
- Manejar conexiones de DB de forma adecuada
- Implementar transacciones cuando sea necesario
- Usar callbacks/promises consistentemente

### UI/UX
- Implementar loading spinners para operaciones largas
- Mostrar mensajes de error claros al usuario
- Usar modales para acciones destructivas
- Mantener interfaz responsive
- Implementar validación de formularios en tiempo real

## Ejemplos de Patrones Específicos

### IPC Communication
```javascript
// Main process
ipcMain.handle('operation:name', async (event, data) => {
  try {
    const result = await service.operation(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Renderer process
const result = await window.electronAPI.operationName(data);
if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

### Database Operations
```javascript
methodName(data) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM table WHERE condition = ?';
    this.db.method(sql, [data], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
```

### Error Handling
- Siempre proporcionar mensajes de error útiles
- Loggear errores en consola para debugging
- Mostrar mensajes amigables al usuario
- Implementar fallbacks cuando sea posible
