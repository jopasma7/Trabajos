// Variables globales
let currentSection = 'dashboard';

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// Inicializar la aplicación
function initializeApp() {
    console.log('Inicializando Sistema de Gestión de Cementerio...');
    
    // Cargar información de la aplicación
    loadAppInfo();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación del sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Botón nuevo registro
    const newRecordBtn = document.getElementById('newRecordBtn');
    if (newRecordBtn) {
        newRecordBtn.addEventListener('click', handleNewRecord);
    }

    // Modal de About
    const aboutModal = document.getElementById('aboutModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            aboutModal.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    // Eventos de Electron API
    setupElectronListeners();
}

// Configurar listeners de Electron
function setupElectronListeners() {
    if (window.electronAPI) {
        // Evento del menú: Nuevo registro
        window.electronAPI.onMenuNewRecord(() => {
            handleNewRecord();
        });

        // Evento del menú: Mostrar About
        window.electronAPI.onShowAbout(() => {
            showAboutModal();
        });
    }
}

// Manejar navegación del sidebar
function handleNavigation(event) {
    event.preventDefault();
    
    const sectionName = event.target.getAttribute('data-section');
    if (sectionName) {
        showSection(sectionName);
    }
}

// Mostrar sección específica
function showSection(sectionName) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Actualizar navegación activa
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    currentSection = sectionName;

    // Cargar datos específicos de la sección
    loadSectionData(sectionName);
}

// Cargar datos específicos de cada sección
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'registros':
            loadRegistrosData();
            break;
        case 'buscar':
            loadBuscarData();
            break;
        case 'estadisticas':
            loadEstadisticasData();
            break;
        case 'configuracion':
            loadConfiguracionData();
            break;
    }
}

// Cargar datos del dashboard
function loadDashboardData() {
    // Simulación de datos (reemplazar con datos reales de la base de datos)
    updateStatCard('totalRegistros', '0');
    updateStatCard('registrosMes', '0');
    updateStatCard('espaciosDisponibles', '0');
    
    updateRecentActivity();
}

// Actualizar tarjeta de estadística
function updateStatCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.textContent = value;
        
        // Animación de conteo
        animateNumber(card, 0, parseInt(value) || 0);
    }
}

// Animar números
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(start + (end - start) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Actualizar actividad reciente
function updateRecentActivity() {
    const recentList = document.getElementById('recentList');
    if (recentList) {
        // Por ahora mostrar mensaje vacío
        recentList.innerHTML = '<p>No hay actividad reciente para mostrar.</p>';
    }
}

// Cargar datos de otras secciones (placeholders)
function loadRegistrosData() {
    console.log('Cargando datos de registros...');
}

function loadBuscarData() {
    console.log('Cargando interfaz de búsqueda...');
}

function loadEstadisticasData() {
    console.log('Cargando estadísticas...');
}

function loadConfiguracionData() {
    console.log('Cargando configuración...');
}

// Manejar nuevo registro
function handleNewRecord() {
    console.log('Creando nuevo registro...');
    // TODO: Implementar modal o página para nuevo registro
    alert('Funcionalidad de nuevo registro será implementada próximamente.');
}

// Mostrar modal About
function showAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Cargar información de la aplicación
async function loadAppInfo() {
    if (window.electronAPI) {
        try {
            const version = await window.electronAPI.getAppVersion();
            const appVersionElement = document.getElementById('appVersion');
            if (appVersionElement) {
                appVersionElement.textContent = version;
            }
        } catch (error) {
            console.error('Error cargando información de la aplicación:', error);
        }
    }
}

// Utilidades
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('Error en la aplicación:', event.error);
});

// Limpieza al cerrar
window.addEventListener('beforeunload', function() {
    if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-new-record');
        window.electronAPI.removeAllListeners('show-about');
    }
});
