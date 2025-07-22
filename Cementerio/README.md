# 🏛️ Sistema de Gestión de Cementerio

Sistema de gestión integral para cementerios desarrollado con **Electron v30.0.0** y **SQLite**. Una aplicación de escritorio moderna y profesional para la administración completa de cementerios.

## 📋 Descripción

Esta aplicación de escritorio permite gestionar de manera eficiente todos los aspectos relacionados con la administración de un cementerio, incluyendo registros de difuntos, gestión completa de espacios, búsquedas avanzadas, backups profesionales y dashboard de actividad en tiempo real.

## ✨ Características Principales

### 🎨 **Interfaz Moderna y Profesional**
- **Diseño Responsivo** - Compatible con diferentes tamaños de pantalla
- **Diálogos Custom** - Sistema de diálogos profesionales con animaciones
- **CSS Grid Layout** - Diseño moderno con gradientes y efectos visuales
- **Experiencia de Usuario Premium** - Interfaz intuitiva y elegante

### 📊 **Dashboard Inteligente**
- **Estadísticas en Tiempo Real** - Métricas principales del cementerio
- **Actividad Reciente** - Historial de cambios con emojis y metadatos
- **Información del Sistema** - Tamaño de BD, versión, y estado general
- **Accesos Rápidos** - Navegación eficiente entre módulos

### 📝 **Gestión Completa de Registros**
- **CRUD Difuntos** - Registro completo con validaciones profesionales
- **CRUD Parcelas** - Gestión de espacios (parcelas, nichos, mausoleos)
- **Búsqueda Inteligente** - Sistema de búsqueda por múltiples criterios
- **Validación de Datos** - Controles de integridad y consistencia

### 💾 **Sistema de Backup Profesional**
- **Selección de Carpeta Custom** - Diálogo nativo para elegir ubicación
- **Backup Automático** - Respaldos con timestamp y nomenclatura clara
- **Optimización de BD** - Herramientas de mantenimiento y limpieza
- **Gestión de Tamaño** - Monitoreo del crecimiento de la base de datos

### 🏛️ **Gestión Avanzada de Espacios**
- **Control de Disponibilidad** - Estados: disponible, ocupado, reservado
- **Tipos de Parcelas** - Parcela estándar, nicho, mausoleo
- **Asignación Inteligente** - Vinculación automática con registros de difuntos

## 🚀 Instalación

### Prerrequisitos

- **Node.js** (versión 16 o superior) - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Git** (para clonar el repositorio)

### Pasos de instalación

1. **Clona el repositorio:**
```bash
git clone https://github.com/jopasma7/Trabajos.git
cd Trabajos/Cementerio
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Ejecuta la aplicación:**
```bash
npm start
```

> 💡 **Nota**: En el primer inicio, la aplicación creará automáticamente la base de datos SQLite y datos de ejemplo para pruebas.

## 📦 Scripts Disponibles

- `npm start` - Ejecuta la aplicación en modo producción
- `npm run dev` - Ejecuta con herramientas de desarrollo (DevTools automáticas)
- `npm run pack-win` - Empaqueta para Windows (.exe)
- `npm run pack-all` - Empaqueta para todas las plataformas
- `npm run build` - Construye la aplicación para distribución

## 📁 Estructura del Proyecto

```
Cementerio/
├── main.js                    # Proceso principal de Electron (backend)
├── package.json              # Configuración y dependencias
├── .gitignore                # Archivos ignorados en Git
├── data/
│   └── cementerio.db         # Base de datos SQLite (auto-generada)
├── src/
│   ├── preload.js            # Bridge de seguridad Electron
│   ├── database/
│   │   └── database.js       # Manager de base de datos SQLite
│   ├── views/
│   │   └── index.html        # Interfaz principal (frontend)
│   ├── styles/
│   │   └── main.css          # Estilos profesionales con CSS Grid
│   └── scripts/
│       └── main.js           # Lógica del frontend y custom dialogs
└── README.md                 # Documentación (este archivo)
```

## 🛠️ Tecnologías Utilizadas

### **Core Technologies**
- **Electron 30.0.0** - Framework multiplataforma para aplicaciones de escritorio
- **Node.js 16+** - Entorno de ejecución JavaScript
- **SQLite 5.1.7** - Base de datos ligera y eficiente

### **Frontend Stack**
- **HTML5** - Estructura semántica moderna
- **CSS3 Grid & Flexbox** - Layout profesional responsivo
- **Vanilla JavaScript ES6+** - Lógica del cliente sin frameworks externos

### **Features Avanzadas**
- **IPC (Inter-Process Communication)** - Comunicación segura main↔renderer
- **Custom Dialog System** - Sistema de diálogos profesionales
- **File System API** - Manejo de backups y selección de carpetas
- **SQLite Optimization** - Herramientas de mantenimiento de BD

## 📊 Módulos del Sistema

### 🏠 **Dashboard Principal**
- **Estadísticas en Tiempo Real**: Total de difuntos, parcelas disponibles/ocupadas
- **Actividad Recent**: Últimos registros y modificaciones con emojis informativos
- **Información del Sistema**: Tamaño de base de datos, versión de la aplicación
- **Navegación Rápida**: Acceso directo a todos los módulos principales

### 👥 **Gestión de Difuntos**
- **Registro Completo**: Nombre, apellidos, fecha de nacimiento/fallecimiento
- **Información Detallada**: Lugar de nacimiento, causa de fallecimiento, observaciones
- **Validación de Datos**: Controles de formato y coherencia de fechas
- **Búsqueda Inteligente**: Por nombre, apellido, fecha o cualquier campo
- **Edición Profesional**: Formularios con validación y confirmación

### 🏛️ **Gestión de Parcelas**
- **Tipos de Espacio**: Parcela estándar, nicho, mausoleo
- **Estados de Ocupación**: Disponible, ocupado, reservado, en mantenimiento
- **Información Completa**: Ubicación, sección, fila, número, dimensiones
- **Asignación Automática**: Vinculación con registros de difuntos
- **Control de Disponibilidad**: Gestión visual del estado de ocupación

### 🔍 **Sistema de Búsqueda**
- **Búsqueda Universal**: Texto libre que busca en todos los campos
- **Filtros Avanzados**: Por fechas, tipo de parcela, estado
- **Resultados Interactivos**: Click para editar directamente
- **Búsqueda en Tiempo Real**: Resultados instantáneos mientras escribes

### 💾 **Backup y Mantenimiento**
- **Backup Professional**: Selección de carpeta con diálogo nativo del sistema
- **Nomenclatura Inteligente**: Archivos con timestamp automático
- **Optimización de BD**: Herramientas de limpieza y compactación
- **Monitoreo de Tamaño**: Control del crecimiento de la base de datos
- **Restauración Fácil**: Backups listos para restaurar en cualquier momento

### ⚙️ **Configuración del Sistema**
- **Información de la Aplicación**: Versión, autor, repositorio
- **Estadísticas de BD**: Tamaño actual, número de registros
- **Herramientas de Mantenimiento**: Optimización y limpieza
- **Configuración de Backup**: Rutas y preferencias de respaldo
- Gestión de usuarios del sistema

## 🔧 Desarrollo

### 🛠️ **Modo Desarrollo**

Para ejecutar en modo desarrollo con herramientas adicionales:

```bash
npm run dev
```

Esto habilitará:
- **DevTools Automáticas** - Herramientas de desarrollador de Chrome
- **Recarga Manual** - Ctrl+R para recargar la aplicación
- **Logs Detallados** - Información extendida en consola
- **Debugging Avanzado** - Breakpoints y debugging completo

### 💾 **Base de Datos**

El sistema utiliza **SQLite** para almacenamiento local con las siguientes características:

- **Creación Automática**: La BD se crea automáticamente en el primer inicio
- **Ubicación**: `data/cementerio.db` (ignorado en Git)
- **Datos de Ejemplo**: Se insertan registros de prueba automáticamente
- **Schema Optimizado**: Tablas `difuntos` y `parcelas` con columnas `created_at` y `updated_at`
- **Integridad Referencial**: Claves foráneas y constrains de validación

### 🏗️ **Arquitectura**

```
┌─────────────────┐    IPC     ┌──────────────────┐
│   Frontend      │<---------->│    Backend       │
│   (Renderer)    │            │    (Main)        │
│                 │            │                  │
│ - UI Logic      │            │ - DB Manager     │
│ - Custom Dialog │            │ - IPC Handlers   │
│ - Event Handling│            │ - File System    │
└─────────────────┘            └──────────────────┘
        │                               │
        ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│   HTML/CSS      │            │    SQLite DB     │
│   Interface     │            │    Storage       │
└─────────────────┘            └──────────────────┘
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. **Fork el proyecto** en GitHub
2. **Crea una rama** para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. **Commit tus cambios** (`git commit -m 'feat: agregar nueva característica'`)
4. **Push a la rama** (`git push origin feature/nueva-caracteristica`)
5. **Abre un Pull Request** con descripción detallada

### 📝 **Convenciones de Commit**
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: cambios de formato
refactor: refactorización de código
test: agregar o modificar tests
```

## 📝 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

¿Necesitas ayuda? ¡Estamos aquí para ayudarte!

### 📋 **Reportar Problemas**
1. Revisa los [issues existentes](https://github.com/jopasma7/Trabajos/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Información del sistema (OS, versión de Node.js)
   - Screenshots si es necesario

### 💡 **Sugerir Mejoras**
- Usa la etiqueta `enhancement` en los issues
- Describe detalladamente la funcionalidad propuesta
- Explica el beneficio para los usuarios

### 🔧 **Problemas Comunes**

**La aplicación no inicia:**
- Verifica que Node.js 16+ esté instalado
- Ejecuta `npm install` nuevamente
- Revisa los permisos de la carpeta

**Base de datos corrupta:**
- La aplicación creará una nueva BD automáticamente
- Los backups pueden restaurarse manualmente

**Problemas de permisos en Windows:**
- Ejecuta la terminal como administrador
- Revisa el antivirus (puede bloquear Electron)

## 🔮 Roadmap

### ✅ **Funcionalidades Completadas (v1.0)**

- [x] **Sistema CRUD Completo** - Difuntos y parcelas
- [x] **Interfaz Moderna** - CSS Grid, gradientes, animaciones
- [x] **Diálogos Custom** - Sistema profesional sin ventanas nativas
- [x] **Backup Professional** - Selección de carpeta y archivos con timestamp
- [x] **Dashboard de Actividad** - Historial en tiempo real con emojis
- [x] **Búsqueda Inteligente** - Texto libre y filtros avanzados
- [x] **Base de Datos Optimizada** - SQLite con herramientas de mantenimiento
- [x] **Responsive Design** - Compatible con diferentes resoluciones
- [x] **Validación de Datos** - Controles de integridad y consistencia

### 🚀 **Próximas Características (v1.1)**

- [ ] **Sistema de Usuarios** - Autenticación y permisos de acceso
- [ ] **Impresión de Certificados** - Generación automática de documentos
- [ ] **Exportación Avanzada** - Excel, PDF, CSV con plantillas
- [ ] **Backup Automático** - Respaldos programados y notificaciones
- [ ] **Notificaciones** - Recordatorios de fechas importantes
- [ ] **Estadísticas Avanzadas** - Gráficos y reportes detallados

### 🌟 **Versiones Futuras (v2.0)**

- [ ] **Aplicación Web** - Versión online complementaria
- [ ] **API REST** - Integración con otros sistemas
- [ ] **Mapas Interactivos** - Visualización del cementerio
- [ ] **Sistema de Reservas** - Booking online de espacios
- [ ] **Módulo Contable** - Gestión de pagos y servicios
- [ ] **Mobile App** - Aplicación para dispositivos móviles

## 👥 Autor

**Alejandro Pastor Mayor (jopasma7)**
- 🐙 GitHub: [@jopasma7](https://github.com/jopasma7)
- 📧 Email: contacto disponible via GitHub
- 🌟 Repository: [Sistema de Cementerio](https://github.com/jopasma7/Trabajos/tree/master/Cementerio)

---

## 📸 Screenshots

### Dashboard Principal
*Estadísticas en tiempo real y actividad reciente con diseño profesional*

### Gestión de Difuntos
*Formularios intuitivos con validación completa y búsqueda inteligente*

### Sistema de Backup
*Herramientas profesionales de respaldo con selección de carpeta nativa*

---

## 📊 Estado del Proyecto

![Estado](https://img.shields.io/badge/Estado-Producción-green)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Electron](https://img.shields.io/badge/Electron-30.0.0-purple)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![Licencia](https://img.shields.io/badge/Licencia-MIT-orange)

**✨ Sistema completo, funcional y listo para producción ✨**

---

*Desarrollado con ❤️ por Alejandro Pastor Mayor para mejorar la gestión de cementerios*
