# 🏛️ Sistema de Gestión de Cementerio

Sistema de gestión integral para cementerios desarrollado con Electron y Node.js.

## 📋 Descripción

Esta aplicación de escritorio permite gestionar de manera eficiente todos los aspectos relacionados con la administración de un cementerio, incluyendo registros de difuntos, gestión de espacios, búsquedas avanzadas y estadísticas en tiempo real.

## ✨ Características Principales

- 📊 **Dashboard Interactivo en Tiempo Real** - Vista general con estadísticas actualizadas automáticamente y navegación clickeable
- 📝 **Gestión Completa de Registros** - CRUD completo para registros de difuntos con asignación inteligente de parcelas
- 🏛️ **Gestión Avanzada de Parcelas** - Control automático de disponibilidad con liberación inteligente y estados actualizados
- 🔍 **Búsqueda Avanzada con Actualización Automática** - Sistema de búsqueda por múltiples criterios con refresco automático de resultados
- 📈 **Estadísticas Dinámicas** - Dashboard con métricas actualizadas en tiempo real tras cada operación
- 📋 **Tablas Ordenables Inteligentes** - Sistema de ordenamiento con indicadores visuales y efectos mejorados
- 🌍 **Autocompletado de Ciudades Internacional** - Base de datos de ciudades mundiales con APIs de respaldo
- 🔄 **Actividad en Tiempo Real** - Seguimiento automático de todas las operaciones con historial completo
- ⚙️ **Configuración Avanzada** - Respaldos automáticos y optimización de base de datos
- 🛡️ **Integridad de Datos Total** - Sistema de eliminación lógica con preservación de consistencia referencial
- 🎨 **Interfaz Moderna y Responsive** - Diseño limpio con efectos visuales profesionales
- 💾 **Gestión Automática de Estados** - Actualización inteligente de parcelas y estadísticas

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
│   └── cementerio.db         # Base de datos SQLite con integridad referencial
├── src/
│   ├── preload.js            # Script de preload para seguridad
│   ├── database/
│   │   └── database.js       # Gestión avanzada de base de datos con JOINs
│   ├── views/
│   │   └── index.html        # Interfaz principal con componentes modernos
│   ├── styles/
│   │   └── main.css          # Estilos profesionales con efectos visuales
│   └── scripts/
│       └── main.js           # Lógica completa del frontend con funcionalidades avanzadas
└── README.md
```

## 🛠️ Tecnologías Utilizadas

- **Electron** - Framework para aplicaciones de escritorio
- **Node.js** - Entorno de ejecución
- **SQLite** - Base de datos local con consultas optimizadas
- **HTML/CSS/JavaScript** - Tecnologías web modernas

## 📊 Módulos del Sistema

### 🎯 Dashboard Interactivo en Tiempo Real
- **Estadísticas Automáticas**: Actualización inmediata tras cada operación
- **Navegación Clickeable**: Tarjetas interactivas para acceso directo a secciones
- **Indicadores Visuales**: Estados de carga y feedback inmediato
- **Panel de Actividad**: Historial en tiempo real con actualización manual
- **Métricas Dinámicas**: Parcelas ocupadas/disponibles con cálculo automático

### 👤 Gestión Avanzada de Difuntos
- **Registro Completo**: Formularios con validación exhaustiva
- **Asignación Inteligente**: Selección automática de parcelas disponibles
- **Eliminación Segura**: Sistema lógico que preserva integridad referencial
- **Autocompletado Global**: Ciudades internacionales con APIs de respaldo
- **Actualización en Tiempo Real**: Refresco automático de búsquedas tras edición
- **Información Completa**: Fechas, documentos, lugares de nacimiento y causas

### 🏛️ Gestión Inteligente de Parcelas
- **Control Automático**: Estados actualizados en tiempo real
- **Liberación Inteligente**: Automática al eliminar difuntos asignados
- **Organización Avanzada**: Por zonas, secciones, tipos y ubicaciones
- **Eliminación Segura**: Verificación de dependencias antes de eliminar
- **Gestión Económica**: Control de precios y observaciones detalladas

### 🔍 Sistema de Búsqueda Avanzada
- **Búsqueda Multi-criterio**: Por nombre, apellido, fechas y combinaciones
- **Actualización Automática**: Refresco de resultados tras editar difuntos
- **Filtros Inteligentes**: Búsqueda en tiempo real con debouncing
- **Resultados Organizados**: Tabla con información completa y acciones directas
- **Navegación Directa**: Edición desde resultados con actualización automática

### 📈 Sistema de Actividad en Tiempo Real
- **Seguimiento Completo**: Registro de todas las operaciones del sistema
- **Historial Detallado**: Creaciones, modificaciones y eliminaciones
- **Indicadores Visuales**: Iconos y colores por tipo de acción
- **Actualización Manual**: Botón de refresco con feedback visual
- **Información Contextual**: Detalles completos de cada operación

### 📋 Tablas Ordenables Inteligentes
- **Ordenamiento Visual**: Indicadores claros de dirección (ASC/DESC)
- **Efectos Modernos**: Hover effects y transiciones suaves
- **Ordenamiento por Defecto**: ID para difuntos, Código para parcelas
- **Columnas Inteligentes**: Detección automática de tipos de datos
- **Navegación Intuitiva**: Click en headers para cambiar ordenamiento

### 🌍 Autocompletado de Ciudades Internacional
- **Base de Datos Extensa**: Ciudades de España, Latinoamérica, Europa, USA y más
- **APIs de Respaldo**: REST Countries, OpenStreetMap y GeoAPI España
- **Búsqueda Inteligente**: Priorización por coincidencia exacta al inicio
- **Rendimiento Optimizado**: Debouncing y caché local
- **Fallback Robusto**: Funciona sin conexión a internet

### ⚙️ Configuración y Mantenimiento Avanzado
- **Base de Datos Automática**: Creación e inicialización transparente
- **Verificación de Integridad**: Chequeos automáticos de consistencia
- **Optimización Automática**: Mantenimiento de rendimiento
- **Sistema de Respaldos**: Exportación manual de base de datos
- **Datos de Ejemplo**: Generación automática de contenido de prueba
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
- Modo de depuración avanzado

### Base de Datos

El sistema utiliza SQLite para almacenamiento local con las siguientes características avanzadas:

- **Creación Automática** - Inicialización transparente en el primer inicio
- **Integridad Referencial** - JOINs optimizados para mostrar códigos de parcelas
- **Eliminación Lógica** - Preserva consistencia total al eliminar registros
- **Optimización Automática** - Mantenimiento de rendimiento en segundo plano
- **Estados Inteligentes** - Actualización automática de disponibilidad de parcelas
- **Consultas Optimizadas** - LEFT JOINs para datos relacionados

## 🆕 Mejoras Recientes

### ✅ Última Actualización - Versión Completa

#### 🔄 Funcionalidades de Tiempo Real
- **Dashboard Dinámico**: Estadísticas actualizadas automáticamente tras cada operación
- **Búsqueda con Refresco**: Los resultados de búsqueda se actualizan al editar difuntos
- **Estados Automáticos**: Parcelas cambian de estado automáticamente según ocupación
- **Actividad en Vivo**: Panel de actividad con seguimiento completo de operaciones

#### 🎨 Mejoras de Interfaz
- **Diálogos de Confirmación Elegantes**: Formato compacto con información relevante
- **Efectos Visuales Profesionales**: Hover effects y transiciones suaves
- **Indicadores de Ordenamiento**: Flechas visuales claras en tablas
- **Navegación Clickeable**: Tarjetas del dashboard como botones de navegación

#### 🛡️ Correcciones Críticas de Integridad
- **Códigos de Parcela Corregidos**: LEFT JOIN implementado para mostrar información completa
- **Eliminación Lógica Completa**: Sistema robusto que preserva todas las relaciones
- **Actualización de Estados**: Parcelas se liberan automáticamente al eliminar difuntos
- **Consistencia de Datos**: Verificación automática de integridad referencial

#### 🌍 Sistema de Ciudades Avanzado
- **Base de Datos Internacional**: Más de 500 ciudades de España, Latinoamérica, Europa y mundo
- **APIs de Respaldo**: Integración con REST Countries, OpenStreetMap y GeoAPI España
- **Búsqueda Inteligente**: Priorización por coincidencias exactas y relevancia
- **Rendimiento Optimizado**: Debouncing, caché local y límites de resultados

#### 🔍 Búsqueda Avanzada Mejorada
- **Refresco Automático**: Los resultados se actualizan tras editar desde la búsqueda
- **Persistencia de Criterios**: Guarda la última búsqueda realizada para actualizaciones
- **Limpieza Inteligente**: Reset completo al limpiar filtros
- **Información Completa**: Muestra códigos de parcela correctos en resultados

### 🔧 Correcciones Técnicas Importantes

- ✅ **Error de Actividad Eliminado**: Corregido `this.registrarActividad is not a function`
- ✅ **Parcelas Sin Código**: Implementado LEFT JOIN para mostrar parcela_codigo
- ✅ **Estados de Parcela**: Liberación automática funcionando correctamente
- ✅ **Búsqueda Desactualizada**: Refresco automático tras ediciones implementado
- ✅ **Diálogos Corruptos**: Emojis y formato limpio en confirmaciones
- ✅ **Ordenamiento Mejorado**: Indicadores visuales y efectos profesionales

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

### ✅ Completado - Versión Actual

- [x] **Dashboard interactivo** con estadísticas en tiempo real
- [x] **Sistema de tablas ordenables** con indicadores visuales profesionales
- [x] **Gestión automática de estados** de parcelas con liberación inteligente
- [x] **Eliminación lógica completa** con integridad referencial total
- [x] **Autocompletado de ciudades** internacional con APIs de respaldo
- [x] **Panel de actividad** en tiempo real con historial completo
- [x] **Navegación clickeable** en dashboard con acceso directo
- [x] **Búsqueda con refresco automático** tras ediciones
- [x] **Diálogos de confirmación elegantes** con formato compacto
- [x] **Códigos de parcela corregidos** con LEFT JOINs optimizados

### 🚀 Próximas Características

- [ ] **Sistema de usuarios y permisos** con roles diferenciados
- [ ] **Integración con impresoras** para certificados y documentos oficiales
- [ ] **Exportación avanzada** a Excel/PDF con plantillas personalizables
- [ ] **Copias de seguridad automáticas** programadas con compresión
- [ ] **Notificaciones inteligentes** de fechas importantes y recordatorios
- [ ] **Módulo de contabilidad** básica con seguimiento de pagos
- [ ] **Filtros avanzados** en tablas con múltiples criterios
- [ ] **Modo oscuro** para la interfaz con cambio dinámico

### 🌟 Versiones Futuras

- [ ] **Aplicación web complementaria** con sincronización
- [ ] **API REST** para integraciones con sistemas externos
- [ ] **Mapas interactivos** del cementerio con ubicaciones precisas
- [ ] **Sistema de reservas online** con portal público
- [ ] **Aplicación móvil** para consultas y gestión básica
- [ ] **Generación automática** de reportes PDF personalizados
- [ ] **Integración con servicios** funerarios y sistemas municipales

## 👥 Autor

**jopasma7**
- GitHub: [@jopasma7](https://github.com/jopasma7)

---

## 📊 Estadísticas del Proyecto

- **Líneas de Código**: ~2,300+ líneas
- **Funcionalidades**: 15+ módulos principales
- **Base de Datos**: SQLite con integridad referencial completa
- **Interfaz**: Responsive con efectos visuales profesionales
- **APIs Integradas**: 3 servicios externos para ciudades
- **Tiempo de Desarrollo**: Múltiples iteraciones con mejora continua

## 🏆 Características Destacadas

### 🎯 **Dashboard en Tiempo Real**
El dashboard se actualiza automáticamente tras cada operación, mostrando estadísticas precisas sin necesidad de recargar manualmente.

### 🔄 **Búsqueda Inteligente**
La función de búsqueda no solo filtra resultados, sino que mantiene actualizada la tabla tras editar difuntos desde los resultados.

### 🏛️ **Gestión Automática de Parcelas**
Las parcelas cambian de estado automáticamente según ocupación, liberándose inteligentemente al eliminar difuntos asignados.

### 🌍 **Autocompletado Global**
Sistema de ciudades con base de datos internacional y APIs de respaldo que funciona sin conexión a internet.

### 🛡️ **Integridad Total**
Eliminación lógica que preserva todas las relaciones de datos, evitando pérdida de información histórica.

**¡El sistema está completo y listo para uso profesional en la gestión de cementerios!**
