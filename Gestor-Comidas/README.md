# 🍽️ Gestor de Comidas y Nutrición

Sistema integral de gestión nutricional y planificación de comidas desarrollado con Electron y Node.js.

## 📋 Descripción

Una aplicación de escritorio completa para planificar comidas, gestionar recetas, calcular valores nutricionales y mantener una alimentación saludable y organizada. Ideal para personas que buscan controlar su dieta, profesionales de la nutrición o cualquiera interesado en mejorar sus hábitos alimenticios.

## ✨ Características Principales

### 🏠 Dashboard Inteligente
- Vista general de estadísticas nutricionales
- Resumen de recetas favoritas y recientes
- Plan semanal actual
- Métricas de progreso nutricional

### 📅 Planificación de Comidas
- Creación de planes semanales y mensuales
- Programación de desayuno, almuerzo, cena y snacks
- Rotación automática de menús
- Visualización tipo calendario

### 📝 Gestión de Recetas
- Base de datos completa de recetas personalizadas
- Categorización por tipo de comida, dificultad y tiempo
- Sistema de favoritos y valoraciones
- Importación/exportación de recetas

### 🥬 Base de Datos Nutricional
- Catálogo extenso de ingredientes
- Información nutricional detallada (calorías, macros, vitaminas)
- Gestión de alérgenos e intolerancias
- Precios y disponibilidad estacional

### 🧮 Calculadora Nutricional
- Cálculo automático de valores nutricionales por receta
- Análisis de macronutrientes (proteínas, carbohidratos, grasas)
- Tracking de calorías diarias
- Objetivos nutricionales personalizados

### 🛒 Lista de Compras Automática
- Generación automática basada en planes semanales
- Organización por categorías de supermercado
- Estimación de costos
- Sincronización con inventario casero

### 📈 Análisis y Reportes
- Estadísticas de consumo nutricional
- Gráficos de progreso hacia objetivos
- Reportes de adherencia al plan
- Análisis de tendencias alimentarias

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

### Pasos de instalación

1. Clona el repositorio:
```bash
git clone https://github.com/jopasma7/Trabajos.git
cd Trabajos/Gestor-Comidas
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
Gestor-Comidas/
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
- **SQLite** - Base de datos local para recetas e ingredientes
- **HTML/CSS/JavaScript** - Tecnologías web modernas
- **Chart.js** - Visualización de datos (próximamente)

## 📊 Módulos del Sistema

### 🏠 Dashboard
- **Resumen nutricional diario**
- **Estadísticas de la semana**
- **Accesos rápidos a funciones principales**
- **Widget del plan actual**

### 📅 Planificación
- **Editor visual de planes semanales**
- **Plantillas de menús predefinidas**
- **Ajuste automático por objetivos calóricos**
- **Vista mensual para planificación a largo plazo**

### 📝 Recetas
- **Editor de recetas con formato rich-text**
- **Cálculo automático de porciones**
- **Galería de imágenes**
- **Sistema de etiquetas y categorías**
- **Importación desde sitios web populares**

### 🥬 Ingredientes
- **Base de datos USDA integrada**
- **Gestión de proveedores y precios**
- **Control de inventario doméstico**
- **Alertas de caducidad**

### 🧮 Calculadora Nutricional
- **Análisis completo de macronutrientes**
- **Tracking de micronutrientes**
- **Comparación con objetivos diarios**
- **Sugerencias de mejoras nutricionales**

### 🛒 Lista de Compras
- **Generación automática inteligente**
- **Optimización de rutas de compra**
- **Comparación de precios**
- **Historial de compras**

### 📈 Estadísticas y Reportes
- **Dashboard de métricas personales**
- **Gráficos de tendencias**
- **Reportes exportables (PDF, Excel)**
- **Análisis de cumplimiento de objetivos**

### ⚙️ Configuración
- **Perfiles nutricionales personalizados**
- **Objetivos de salud y fitness**
- **Preferencias alimentarias y restricciones**
- **Configuración de recordatorios**

## ⌨️ Atajos de Teclado

- `Ctrl+N` - Nueva receta
- `Ctrl+Shift+N` - Nuevo plan semanal
- `Ctrl+K` - Calculadora nutricional
- `Ctrl+L` - Lista de compras
- `Ctrl+S` - Guardar cambios
- `F11` - Pantalla completa

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
- Mock data para testing

### Base de Datos

El sistema utiliza SQLite para almacenamiento local:
- `recetas.db` - Recetas personalizadas
- `ingredientes.db` - Base de datos nutricional
- `planes.db` - Planes de comidas
- `configuracion.db` - Preferencias del usuario

## 🎯 Casos de Uso

### Para Individuos
- Planificación semanal de comidas familiares
- Control de peso y objetivos fitness
- Gestión de restricciones alimentarias
- Optimización del presupuesto de comida

### Para Profesionales
- Nutricionistas: Planes para pacientes
- Chefs: Gestión de menús y costos
- Entrenadores: Planes nutricionales deportivos
- Dietistas: Seguimiento de pacientes

### Para Familias
- Coordinación de comidas familiares
- Educación nutricional para niños
- Gestión de alergias e intolerancias
- Planificación de eventos especiales

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

## 🆘 Soporte y FAQ

### Preguntas Frecuentes

**¿Puedo importar mis recetas existentes?**
Sí, el sistema soporta importación desde formatos JSON, CSV y algunos sitios web populares.

**¿Los datos se sincronizan en la nube?**
Actualmente es una aplicación local, pero la sincronización en la nube está en desarrollo.

**¿Funciona sin conexión a internet?**
Sí, toda la funcionalidad principal está disponible offline.

### Reportar Problemas

Si encuentras algún bug o tienes sugerencias:
1. Revisa los issues existentes en GitHub
2. Crea un nuevo issue con detalles del problema
3. Incluye información del sistema y pasos para reproducir

## 🔮 Roadmap

### Próximas Características (v1.1)

- [ ] Sistema de usuarios múltiples
- [ ] Sincronización en la nube
- [ ] Aplicación móvil complementaria
- [ ] Integración con wearables (Fitbit, Apple Watch)
- [ ] API para desarrolladores externos

### Versiones Futuras (v2.0+)

- [ ] Inteligencia artificial para sugerencias de comidas
- [ ] Integración con supermercados online
- [ ] Sistema de comunidad y sharing de recetas
- [ ] Análisis de impacto ambiental de la dieta
- [ ] Integración con servicios de delivery

## 👥 Equipo

**Desarrollador Principal:** jopasma7
- GitHub: [@jopasma7](https://github.com/jopasma7)
- Especialización: Aplicaciones Electron y Node.js

## 🙏 Agradecimientos

- Base de datos nutricional basada en USDA FoodData Central
- Icons por Feather Icons
- Inspiración en aplicaciones como MyFitnessPal y Cronometer

---

**¡Comienza tu viaje hacia una alimentación más saludable y organizada! 🌱**
