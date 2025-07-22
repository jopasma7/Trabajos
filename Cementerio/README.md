# 🏛️ Sistema de Gestión de Cementerio

Sistema de gestión integral para cementerios desarrollado con Electron y Node.js.

## 📋 Descripción

Esta aplicación de escritorio permite gestionar de manera eficiente todos los aspectos relacionados con la administración de un cementerio, incluyendo registros de difuntos, gestión de espacios, búsquedas y estadísticas.

## ✨ Características

- 📊 **Dashboard Interactivo** - Vista general con estadísticas actualizadas en tiempo real y navegación clickeable
- 📝 **Gestión Completa de Registros** - CRUD completo para registros de difuntos con asignación automática de parcelas
- 🏛️ **Gestión Inteligente de Parcelas** - Control avanzado de disponibilidad con actualización automática de estados
- 🔍 **Búsqueda Avanzada** - Sistema de búsqueda por múltiples criterios con resultados en tiempo real
- 📈 **Estadísticas Dinámicas** - Dashboard con métricas actualizadas automáticamente
- 📋 **Tablas Ordenables** - Sistema de ordenamiento intuitivo con indicadores visuales
- 🌍 **Búsqueda de Ciudades** - Autocompletado inteligente con base de datos internacional
- 🔄 **Actividad en Tiempo Real** - Seguimiento automático de todas las operaciones del sistema
- ⚙️ **Configuración Avanzada** - Personalización completa del sistema
- 🛡️ **Integridad de Datos** - Sistema de eliminación lógica que preserva la consistencia

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

### Pasos de instalación

1. Clona el repositorio:
```bash
git clone https://github.com/jopasma7/Trabajos.git
cd Trabajos/Cementerio
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación:
```bash
npm start
```

## 📦 Scripts Disponibles

- `npm start` - Ejecuta la aplicación en modo desarrollo
- `npm run dev` - Ejecuta con herramientas de desarrollo habilitadas
- `npm run pack-win` - Empaqueta para Windows
- `npm run pack-all` - Empaqueta para todas las plataformas
- `npm run build` - Construye la aplicación para distribución

## 📁 Estructura del Proyecto

```
Cementerio/
├── main.js                    # Proceso principal de Electron
├── package.json              # Configuración y dependencias
├── cementerio.code-workspace  # Configuración del workspace
├── data/
│   └── cementerio.db         # Base de datos SQLite
├── src/
│   ├── preload.js            # Script de preload para seguridad
│   ├── database/
│   │   └── database.js       # Gestión de base de datos y modelos
│   ├── views/
│   │   └── index.html        # Interfaz principal con componentes avanzados
│   ├── styles/
│   │   └── main.css          # Estilos mejorados con efectos visuales
│   └── scripts/
│       └── main.js           # Lógica del frontend con funcionalidades avanzadas
└── README.md
```

## 🛠️ Tecnologías Utilizadas

- **Electron** - Framework para aplicaciones de escritorio
- **Node.js** - Entorno de ejecución
- **SQLite** - Base de datos local
- **HTML/CSS/JavaScript** - Tecnologías web

## 📊 Módulos del Sistema

### Dashboard Interactivo
- Estadísticas actualizadas en tiempo real
- Tarjetas clickeables para navegación rápida
- Indicadores de carga visuales
- Panel de actividad reciente con actualización automática
- Métricas de ocupación de parcelas

### Gestión Avanzada de Difuntos
- Registro completo con validación de datos
- Asignación inteligente de parcelas
- Sistema de eliminación lógica
- Autocompletado de ciudades internacionales
- Gestión de documentación y fechas

### Gestión Inteligente de Parcelas
- Control automático de disponibilidad
- Actualización de estados en tiempo real
- Liberación automática al eliminar difuntos
- Organización por zonas, secciones y tipos
- Gestión de precios y observaciones

### Sistema de Tablas Ordenables
- Ordenamiento por defecto (ID para difuntos, Código para parcelas)
- Indicadores visuales de ordenamiento
- Efectos hover mejorados
- Navegación intuitiva entre columnas

### Búsqueda Avanzada
- Búsqueda por nombre, apellido, fechas
- Filtros dinámicos en tiempo real
- Resultados paginados y organizados
- Navegación directa desde resultados

### Actividad en Tiempo Real
- Seguimiento automático de operaciones
- Historial completo de cambios
- Indicadores de acciones (creado, modificado, eliminado)
- Actualización manual con feedback visual

### Configuración del Sistema
- Configuración de base de datos automática
- Verificación de integridad de datos
- Optimización automática de rendimiento
- Gestión de respaldos

## 🔧 Desarrollo

### Modo Desarrollo

Para ejecutar en modo desarrollo con herramientas adicionales:

```bash
npm run dev
```

Esto habilitará:
- DevTools automáticas
- Recarga en caliente
- Logs detallados

### Base de Datos

El sistema utiliza SQLite para almacenamiento local con las siguientes características:

- **Creación automática** - La base de datos se inicializa automáticamente en el primer inicio
- **Integridad de datos** - Verificaciones automáticas de consistencia
- **Eliminación lógica** - Preserva la integridad referencial al eliminar registros
- **Optimización automática** - Mantenimiento automático de rendimiento
- **Gestión de estados** - Actualización automática de estados de parcelas

## 🆕 Mejoras Recientes

### ✅ Completadas en la Última Versión

- **Dashboard en Tiempo Real**: Las estadísticas se actualizan automáticamente al realizar cambios
- **Navegación Clickeable**: Las tarjetas del dashboard permiten navegación directa a secciones
- **Tablas Ordenables Mejoradas**: Ordenamiento por defecto y mejor feedback visual
- **Sistema de Actividad**: Seguimiento automático de todas las operaciones
- **Gestión Inteligente de Parcelas**: Liberación automática al eliminar difuntos
- **Integridad de Datos**: Corrección de errores críticos en eliminación lógica
- **Autocompletado de Ciudades**: Base de datos internacional con APIs de respaldo
- **Efectos Visuales Mejorados**: CSS optimizado con mejor contraste y hover effects

### 🔧 Correcciones Técnicas

- Eliminado error `this.registrarActividad is not a function`
- Corregida actualización automática de estados de parcelas
- Implementado sistema de eliminación lógica consistente
- Mejorada la experiencia visual en tablas ordenables
- Optimizada la carga de datos y navegación entre secciones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:

1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye información del sistema y pasos para reproducir

## 🔮 Roadmap

### ✅ Completado

- [x] Dashboard interactivo con estadísticas en tiempo real
- [x] Sistema de tablas ordenables con indicadores visuales
- [x] Gestión automática de estados de parcelas
- [x] Eliminación lógica con integridad de datos
- [x] Autocompletado de ciudades internacionales
- [x] Panel de actividad en tiempo real
- [x] Navegación clickeable en dashboard

### Próximas Características

- [ ] Sistema de usuarios y permisos
- [ ] Integración con impresoras para certificados
- [ ] Exportación de datos a Excel/PDF
- [ ] Sistema de copias de seguridad automáticas
- [ ] Notificaciones de fechas importantes
- [ ] Módulo de contabilidad básica
- [ ] Filtros avanzados en tablas
- [ ] Modo oscuro para la interfaz

### Versiones Futuras

- [ ] Aplicación web complementaria
- [ ] API REST para integraciones
- [ ] Módulo de mapas interactivos del cementerio
- [ ] Sistema de reservas online
- [ ] Aplicación móvil para consultas
- [ ] Generación automática de reportes PDF

## 👥 Autor

**jopasma7**
- GitHub: [@jopasma7](https://github.com/jopasma7)
