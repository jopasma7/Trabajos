# Trabajos - Proyectos Electron + Node.js

Este repositorio contiene una colección de aplicaciones desarrolladas con Electron y Node.js.

## 🚀 Tecnologías

- **Electron** - Framework para crear aplicaciones de escritorio con tecnologías web
- **Node.js** - Entorno de ejecución de JavaScript del lado del servidor
- **HTML/CSS/JavaScript** - Tecnologías web fundamentales

## 📁 Estructura del Proyecto

```
Trabajos/
│
├── proyecto1/
│   ├── main.js
│   ├── package.json
│   └── src/
│
├── proyecto2/
│   ├── main.js
│   ├── package.json
│   └── src/
│
└── README.md
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

### Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/jopasma7/Trabajos.git
cd Trabajos
```

2. Navega al proyecto específico que deseas ejecutar:
```bash
cd nombre-del-proyecto
```

3. Instala las dependencias:
```bash
npm install
```

## 🚀 Ejecución

Para ejecutar cualquier proyecto de Electron:

```bash
# Modo desarrollo
npm start

# O usando Electron directamente
npx electron .
```

## 📦 Construcción

Para crear un ejecutable de la aplicación:

```bash
# Instalar electron-builder si no está instalado
npm install -g electron-builder

# Construir para tu plataforma actual
npm run build

# Construir para Windows
npm run build:win

# Construir para macOS
npm run build:mac

# Construir para Linux
npm run build:linux
```

## 📋 Scripts Comunes

En cada proyecto encontrarás scripts comunes en el `package.json`:

- `npm start` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para distribución
- `npm test` - Ejecuta las pruebas (si están configuradas)

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

**Autor:** jopasma7
**GitHub:** [https://github.com/jopasma7](https://github.com/jopasma7)

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de permisos en Windows:**
   ```bash
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Problemas con node-gyp:**
   ```bash
   npm install -g windows-build-tools
   ```

3. **Electron no se ejecuta:**
   - Verifica que tengas la versión correcta de Node.js
   - Reinstala las dependencias con `npm ci`

## 📚 Recursos Útiles

- [Documentación oficial de Electron](https://www.electronjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Electron Builder](https://www.electron.build/)
- [Awesome Electron](https://github.com/sindresorhus/awesome-electron)
