# 🏛️ Sistema de Gestión de Cementerio

Sistema de gestión integral para cementerios desarrollado con Electron y Node.js.

## 📋 Descripción

Esta aplicación de escritorio permite gestionar de manera eficiente todos los aspectos relacionados con la administración de un cementerio, incluyendo registros de difuntos, gestión de espacios, búsquedas y estadísticas.

## ✨ Características

- 📊 **Dashboard Informativo** - Vista general con estadísticas principales
- 📝 **Gestión de Registros** - CRUD completo para registros de difuntos
- 🔍 **Búsqueda Avanzada** - Sistema de búsqueda por múltiples criterios
- 📈 **Estadísticas y Reportes** - Análisis de datos y generación de reportes
- ⚙️ **Configuración** - Personalización del sistema
- 🏛️ **Gestión de Espacios** - Control de disponibilidad de parcelas y nichos

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
├── src/
│   ├── preload.js            # Script de preload para seguridad
│   ├── views/
│   │   └── index.html        # Interfaz principal
│   ├── styles/
│   │   └── main.css          # Estilos de la aplicación
│   └── scripts/
│       └── main.js           # Lógica del frontend
└── README.md
```

## 🛠️ Tecnologías Utilizadas

- **Electron** - Framework para aplicaciones de escritorio
- **Node.js** - Entorno de ejecución
- **SQLite** - Base de datos local
- **HTML/CSS/JavaScript** - Tecnologías web

## 📊 Módulos del Sistema

### Dashboard
- Resumen de estadísticas principales
- Actividad reciente
- Accesos rápidos a funciones principales

### Gestión de Registros
- Registro de nuevos difuntos
- Edición de información existente
- Gestión de documentación
- Control de fechas importantes

### Búsqueda
- Búsqueda por nombre, apellido, fecha
- Filtros avanzados
- Resultados paginados

### Estadísticas
- Reportes mensuales/anuales
- Gráficos de ocupación
- Análisis de tendencias

### Configuración
- Configuración de la base de datos
- Personalización de la interfaz
- Gestión de usuarios del sistema

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

El sistema utiliza SQLite para almacenamiento local. La base de datos se crea automáticamente en el primer inicio.

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

### Próximas Características

- [ ] Sistema de usuarios y permisos
- [ ] Integración con impresoras para certificados
- [ ] Exportación de datos a Excel/PDF
- [ ] Sistema de copias de seguridad automáticas
- [ ] Notificaciones de fechas importantes
- [ ] Módulo de contabilidad básica

### Versiones Futuras

- [ ] Aplicación web complementaria
- [ ] API REST para integraciones
- [ ] Módulo de mapas interactivos
- [ ] Sistema de reservas online

## 👥 Autor

**jopasma7**
- GitHub: [@jopasma7](https://github.com/jopasma7)
