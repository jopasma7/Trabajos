// Variables globales
let currentSection = 'dashboard';
let appData = {
    recetas: [],
    planes: [],
    ingredientes: [],
    favoritas: []
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando Gestor de Comidas y Nutrición...');
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// Inicializar la aplicación
function initializeApp() {
    // Cargar información de la aplicación
    loadAppInfo();
    
    // Cargar datos iniciales (simulados por ahora)
    loadInitialData();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación del sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Botones del header
    const newRecipeBtn = document.getElementById('newRecipeBtn');
    const newPlanBtn = document.getElementById('newPlanBtn');
    
    if (newRecipeBtn) {
        newRecipeBtn.addEventListener('click', handleNewRecipe);
    }
    
    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', handleNewPlan);
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
        // Eventos del menú
        window.electronAPI.onMenuNewRecipe(() => handleNewRecipe());
        window.electronAPI.onMenuNewPlan(() => handleNewPlan());
        window.electronAPI.onMenuImport(() => handleImport());
        window.electronAPI.onMenuExport(() => handleExport());
        window.electronAPI.onMenuCalculator(() => showCalculator());
        window.electronAPI.onMenuShoppingList(() => showShoppingList());
        window.electronAPI.onShowHelp(() => showHelp());
        window.electronAPI.onShowAbout(() => showAboutModal());
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
        case 'planificacion':
            loadPlanificacionData();
            break;
        case 'recetas':
            loadRecetasData();
            break;
        case 'ingredientes':
            loadIngredientesData();
            break;
        case 'nutricion':
            loadNutricionData();
            break;
        case 'compras':
            loadComprasData();
            break;
        case 'estadisticas':
            loadEstadisticasData();
            break;
        case 'reportes':
            loadReportesData();
            break;
        case 'configuracion':
            loadConfiguracionData();
            break;
    }
}

// Cargar datos iniciales (simulados)
function loadInitialData() {
    // Datos de ejemplo - en una aplicación real estos vendrían de la base de datos
    appData.recetas = [
        { id: 1, nombre: 'Ensalada César', tipo: 'ensalada', favorita: true, fecha: new Date() },
        { id: 2, nombre: 'Pollo a la plancha', tipo: 'principal', favorita: false, fecha: new Date() },
        { id: 3, nombre: 'Smoothie verde', tipo: 'bebida', favorita: true, fecha: new Date() }
    ];
    
    appData.ingredientes = [
        { id: 1, nombre: 'Lechuga', categoria: 'vegetales' },
        { id: 2, nombre: 'Pollo', categoria: 'proteinas' },
        { id: 3, nombre: 'Espinaca', categoria: 'vegetales' }
    ];
    
    appData.favoritas = appData.recetas.filter(r => r.favorita);
}

// Cargar datos del dashboard
function loadDashboardData() {
    // Actualizar estadísticas
    updateStatCard('totalRecetas', appData.recetas.length);
    updateStatCard('totalPlanes', appData.planes.length);
    updateStatCard('totalIngredientes', appData.ingredientes.length);
    updateStatCard('recetasFavoritas', appData.favoritas.length);
    
    // Actualizar contenido del dashboard
    updateRecentRecipes();
    updateWeeklyPlan();
}

// Actualizar tarjeta de estadística
function updateStatCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        // Animación de conteo
        animateNumber(card, 0, value);
    }
}

// Animar números
function animateNumber(element, start, end, duration = 1000) {
    if (start === end) {
        element.textContent = end;
        return;
    }
    
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

// Actualizar recetas recientes
function updateRecentRecipes() {
    const recentList = document.getElementById('recentRecipesList');
    if (recentList) {
        if (appData.recetas.length > 0) {
            const recentRecipes = appData.recetas.slice(-5).reverse();
            recentList.innerHTML = recentRecipes.map(receta => `
                <div class="recipe-item">
                    <h4>${receta.nombre}</h4>
                    <p>Tipo: ${receta.tipo}</p>
                    <small>${formatDate(receta.fecha)}</small>
                </div>
            `).join('');
        } else {
            recentList.innerHTML = '<p class="empty-state">No hay recetas recientes para mostrar.</p>';
        }
    }
}

// Actualizar plan semanal
function updateWeeklyPlan() {
    const weekPlan = document.getElementById('currentWeekPlan');
    if (weekPlan) {
        // Por ahora mostrar mensaje vacío
        weekPlan.innerHTML = '<p class="empty-state">No hay plan semanal configurado.</p>';
    }
}

// Funciones para cargar datos de otras secciones
function loadPlanificacionData() {
    console.log('Cargando datos de planificación...');
}

function loadRecetasData() {
    console.log('Cargando datos de recetas...');
}

function loadIngredientesData() {
    console.log('Cargando datos de ingredientes...');
}

function loadNutricionData() {
    console.log('Cargando calculadora nutricional...');
}

function loadComprasData() {
    console.log('Cargando lista de compras...');
}

function loadEstadisticasData() {
    console.log('Cargando estadísticas...');
}

function loadReportesData() {
    console.log('Cargando reportes...');
}

function loadConfiguracionData() {
    console.log('Cargando configuración...');
}

// Manejadores de eventos del menú
function handleNewRecipe() {
    console.log('Creando nueva receta...');
    showSection('recetas');
    // TODO: Implementar modal o formulario para nueva receta
    showNotification('Funcionalidad de nueva receta será implementada próximamente.', 'info');
}

function handleNewPlan() {
    console.log('Creando nuevo plan...');
    showSection('planificacion');
    // TODO: Implementar modal o formulario para nuevo plan
    showNotification('Funcionalidad de nuevo plan será implementada próximamente.', 'info');
}

function handleImport() {
    console.log('Importando recetas...');
    // TODO: Implementar importación de recetas
    showNotification('Funcionalidad de importación será implementada próximamente.', 'info');
}

function handleExport() {
    console.log('Exportando datos...');
    // TODO: Implementar exportación de datos
    showNotification('Funcionalidad de exportación será implementada próximamente.', 'info');
}

function showCalculator() {
    console.log('Mostrando calculadora nutricional...');
    showSection('nutricion');
}

function showShoppingList() {
    console.log('Mostrando lista de compras...');
    showSection('compras');
}

function showHelp() {
    console.log('Mostrando ayuda...');
    showNotification('Guía de usuario será implementada próximamente.', 'info');
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

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Agregar estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'info' ? '#3498db' : type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utilidades
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Agregar estilos para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('Error en la aplicación:', event.error);
    showNotification('Ha ocurrido un error inesperado.', 'error');
});

// Limpieza al cerrar
window.addEventListener('beforeunload', function() {
    if (window.electronAPI) {
        // Limpiar todos los listeners
        window.electronAPI.removeAllListeners('menu-new-recipe');
        window.electronAPI.removeAllListeners('menu-new-plan');
        window.electronAPI.removeAllListeners('menu-import');
        window.electronAPI.removeAllListeners('menu-export');
        window.electronAPI.removeAllListeners('menu-calculator');
        window.electronAPI.removeAllListeners('menu-shopping-list');
        window.electronAPI.removeAllListeners('show-help');
        window.electronAPI.removeAllListeners('show-about');
    }
});
