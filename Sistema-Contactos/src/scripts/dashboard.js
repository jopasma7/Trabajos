// CRM Contactos Pro - Dashboard JavaScript
// Variables globales
let currentUser = null;
let users = [];
let contacts = [];
let tags = [];
let currentTab = 'dashboard';
let isEditing = false;
let editingUserId = null;
let editingContactId = null;
let editingTagId = null;
let isDarkMode = false;

// Elementos del DOM
const userModal = document.getElementById('userModal');
const contactModal = document.getElementById('contactModal');
const tagModal = document.getElementById('tagModal');
const deleteModal = document.getElementById('deleteModal');
const userForm = document.getElementById('userForm');
const contactForm = document.getElementById('contactForm');
const tagForm = document.getElementById('tagForm');
const usersTableBody = document.getElementById('usersTableBody');
let contactsTableBody = document.getElementById('contactsTableBody');
let tagsTableBody = document.getElementById('tagsTableBody');
const tagsGrid = document.getElementById('tagsGrid');
const loadingOverlay = document.getElementById('loadingOverlay');
const themeToggle = document.getElementById('themeToggle');

// Elementos de estadísticas
const totalUsersElement = document.getElementById('totalUsers');
const totalAdminsElement = document.getElementById('totalAdmins');
const totalRegularUsersElement = document.getElementById('totalRegularUsers');
const totalContactsElement = document.getElementById('totalContacts');
const totalLeadsElement = document.getElementById('totalLeads');
const totalClientsElement = document.getElementById('totalClients');
const totalCompaniesElement = document.getElementById('totalCompanies');

// Charts variables
let statusChart = null;
let trendChart = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    initializeResizableColumns();
});

function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Botones principales
    document.getElementById('addUserBtn')?.addEventListener('click', openAddUserModal);
    document.getElementById('addContactBtn')?.addEventListener('click', openAddContactModal);
    document.getElementById('addTagBtn')?.addEventListener('click', openAddTagModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Forms
    userForm?.addEventListener('submit', handleUserFormSubmit);
    contactForm?.addEventListener('submit', handleContactFormSubmit);
    tagForm?.addEventListener('submit', handleTagFormSubmit);
    
    // Search and filters
    document.getElementById('contactsSearch')?.addEventListener('input', filterContacts);
    
    // Users search and filters
    document.getElementById('usersSearch')?.addEventListener('input', filterUsers);
    document.getElementById('roleFilter')?.addEventListener('change', filterUsers);
    document.getElementById('genderFilter')?.addEventListener('change', filterUsers);
    
    // Tags search and filters
    document.getElementById('tagsSearch')?.addEventListener('input', filterTags);
    document.getElementById('tagTypeFilter')?.addEventListener('change', filterTags);
    document.getElementById('tagUsageFilter')?.addEventListener('change', filterTags);
    
    // Tag color preview
    document.getElementById('tagColor')?.addEventListener('input', updateTagPreview);
    document.getElementById('tagName')?.addEventListener('input', updateTagPreview);
    
    // Avatar upload for users
    document.getElementById('avatarInput')?.addEventListener('change', handleAvatarUpload);
    
    // Avatar upload for contacts
    document.getElementById('contactAvatarInput')?.addEventListener('change', handleContactAvatarUpload);
    
    // Export buttons
    document.getElementById('exportContactsBtn')?.addEventListener('click', exportContacts);
    document.getElementById('conversionReportBtn')?.addEventListener('click', generateConversionReport);
    
    // Delete confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
    
    // View toggles for contacts
    document.getElementById('listView')?.addEventListener('click', () => changeContactView('list'));
    document.getElementById('cardView')?.addEventListener('click', () => changeContactView('card'));
    document.getElementById('gridView')?.addEventListener('click', () => changeContactView('grid'));
    
    // View toggles for users
    document.getElementById('userListView')?.addEventListener('click', () => changeUserView('list'));
    document.getElementById('userCardView')?.addEventListener('click', () => changeUserView('card'));
    document.getElementById('userGridView')?.addEventListener('click', () => changeUserView('grid'));
    
    // View toggles for tags
    document.getElementById('tagListView')?.addEventListener('click', () => changeTagView('list'));
    document.getElementById('tagCardView')?.addEventListener('click', () => changeTagView('card'));
    document.getElementById('tagGridView')?.addEventListener('click', () => changeTagView('grid'));
    
    // Label positioning fixes
    setupLabelHandlers();
    
    // Modal close handlers
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
}

// Initialize resizable columns
function initializeResizableColumns() {
    const table = document.getElementById('contactsTable');
    if (!table) return;
    
    const resizers = table.querySelectorAll('.column-resizer');
    
    resizers.forEach((resizer, index) => {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        let column = null;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            column = e.target.parentElement;
            startWidth = parseInt(document.defaultView.getComputedStyle(column).width, 10);
            
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
            
            // Prevent text selection
            document.body.style.userSelect = 'none';
            table.style.cursor = 'col-resize';
        });
        
        function doResize(e) {
            if (!isResizing) return;
            
            const diff = e.clientX - startX;
            const newWidth = startWidth + diff;
            const minWidth = parseInt(column.dataset.minWidth, 10) || 100;
            
            if (newWidth >= minWidth) {
                column.style.width = newWidth + 'px';
            }
        }
        
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            
            // Restore text selection
            document.body.style.userSelect = '';
            table.style.cursor = '';
        }
    });
}

// Handle contact avatar upload
function handleContactAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarImage = document.getElementById('contactAvatarImage');
            if (avatarImage) {
                avatarImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Get country information with flag
function getCountryInfo(countryInput) {
    if (!countryInput) return '-';
    
    const countries = {
        'ES': { name: 'España', code: 'es' },
        'US': { name: 'Estados Unidos', code: 'us' },
        'MX': { name: 'México', code: 'mx' },
        'AR': { name: 'Argentina', code: 'ar' },
        'CO': { name: 'Colombia', code: 'co' },
        'PE': { name: 'Perú', code: 'pe' },
        'VE': { name: 'Venezuela', code: 've' },
        'CL': { name: 'Chile', code: 'cl' },
        'EC': { name: 'Ecuador', code: 'ec' },
        'UY': { name: 'Uruguay', code: 'uy' },
        'PY': { name: 'Paraguay', code: 'py' },
        'BO': { name: 'Bolivia', code: 'bo' },
        'CR': { name: 'Costa Rica', code: 'cr' },
        'PA': { name: 'Panamá', code: 'pa' },
        'GT': { name: 'Guatemala', code: 'gt' },
        'HN': { name: 'Honduras', code: 'hn' },
        'NI': { name: 'Nicaragua', code: 'ni' },
        'SV': { name: 'El Salvador', code: 'sv' },
        'DO': { name: 'República Dominicana', code: 'do' },
        'CU': { name: 'Cuba', code: 'cu' },
        'FR': { name: 'Francia', code: 'fr' },
        'DE': { name: 'Alemania', code: 'de' },
        'IT': { name: 'Italia', code: 'it' },
        'PT': { name: 'Portugal', code: 'pt' },
        'GB': { name: 'Reino Unido', code: 'gb' },
        'BR': { name: 'Brasil', code: 'br' }
    };
    
    // Si es un código de país, devolverlo con bandera
    if (countries[countryInput]) {
        const country = countries[countryInput];
        return `<img src="https://flagcdn.com/w20/${country.code}.png" alt="${country.name}" class="flag-icon"><span class="country-name">${country.name}</span>`;
    }
    
    // Si es un nombre de país, buscar el código correspondiente
    const countryName = countryInput.toLowerCase();
    for (const [code, country] of Object.entries(countries)) {
        if (country.name.toLowerCase().includes(countryName) || countryName.includes(country.name.toLowerCase())) {
            return `<img src="https://flagcdn.com/w20/${country.code}.png" alt="${country.name}" class="flag-icon"><span class="country-name">${country.name}</span>`;
        }
    }
    
    // Si no se encuentra, devolver con una bandera genérica
    return `🌍 ${countryInput}`;
}

function setupLabelHandlers() {
    // Add event listeners for inputs to handle labels
    document.addEventListener('input', (e) => {
        if (e.target.matches('#contactModal input, #contactModal textarea')) {
            const label = e.target.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                if (e.target.value) {
                    label.classList.add('active');
                } else {
                    label.classList.remove('active');
                }
            }
        }
    });
    
    // Add event listeners for selects
    document.addEventListener('change', (e) => {
        if (e.target.matches('#contactModal select, #userModal select, #tagModal select')) {
            const label = e.target.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                if (e.target.value) {
                    label.classList.add('active');
                    e.target.classList.add('has-value');
                } else {
                    label.classList.remove('active');
                    e.target.classList.remove('has-value');
                }
            }
        }
    });
}

async function initializeDashboard() {
    // Intentar obtener el usuario actual
    let currentUserData = localStorage.getItem('currentUser');
    
    // Si no hay datos en localStorage, intentar con sessionStorage
    if (!currentUserData || currentUserData === 'undefined' || currentUserData === 'null') {
        currentUserData = sessionStorage.getItem('currentUser');
    }
    
    currentUser = null;
    
    if (currentUserData && currentUserData !== 'undefined' && currentUserData !== 'null' && currentUserData.length > 2) {
        try {
            currentUser = JSON.parse(currentUserData);
            
            // Verificar que el objeto tenga la estructura correcta
            if (currentUser && typeof currentUser === 'object' && currentUser.id && currentUser.name) {
                console.log('Usuario logueado:', currentUser.name);
                // Asegurar que esté en localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                currentUser = null;
            }
        } catch (error) {
            console.error('Error al parsear datos de usuario:', error);
            currentUser = null;
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
        }
    }
    
    if (!currentUser) {
        console.log('No hay sesión válida, redirigiendo al login');
        await window.electronAPI.navigateToLogin();
        return;
    }
    
    // Verificar si currentUser tiene la estructura correcta
    if (!currentUser.id || !currentUser.name) {
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                const result = await window.electronAPI.getCurrentUser(token);
                if (result.success) {
                    currentUser = result.data;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                } else {
                    await window.electronAPI.navigateToLogin();
                    return;
                }
            } catch (error) {
                console.error('Error getting current user:', error);
                await window.electronAPI.navigateToLogin();
                return;
            }
        } else {
            await window.electronAPI.navigateToLogin();
            return;
        }
    }
    
    initializeTheme();
    document.getElementById('userWelcome').textContent = `Bienvenido, ${currentUser.name}`;
    
    // Configurar navegación basada en roles
    setupRoleBasedNavigation();
    
    await Promise.all([
        loadUsers(),
        loadContacts(),
        loadContactStats()
    ]);
    
    initializeCharts();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    isDarkMode = savedTheme === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Modo claro';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Modo oscuro';
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode.toString());
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Modo claro';
        showToast('Modo oscuro activado', 'info');
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Modo oscuro';
        showToast('Modo claro activado', 'info');
    }
    
    // Actualizar gráficos si están inicializados
    if (statusChart) {
        statusChart.destroy();
        initializeStatusChart();
    }
    if (trendChart) {
        trendChart.destroy();
        initializeTrendChart();
    }
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentTab = tabName;
    
    // Load data based on active tab
    switch(tabName) {
        case 'users':
            loadUsers();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'tags':
            loadTags();
            break;
        case 'dashboard':
            loadContactStats();
            break;
    }
}

// ============ CONTACTS MANAGEMENT ============
async function loadContacts() {
    showLoading(true);
    
    try {
        const result = await window.electronAPI.getAllContacts(currentUser);
        
        if (result.success) {
            contacts = result.data;
            
            // Renderizar basado en la vista activa
            const activeViewBtn = document.querySelector('#contacts-tab .view-toggle.active');
            console.log('Active contacts view button found:', activeViewBtn);
            if (activeViewBtn) {
                const viewType = activeViewBtn.dataset.view;
                console.log('Detected contacts view type:', viewType);
                switch (viewType) {
                    case 'grid':
                        renderContactsGrid();
                        break;
                    case 'card':
                        renderContactsCards();
                        break;
                    case 'list':
                    default:
                        renderContactsTable();
                        break;
                }
            } else {
                console.log('No active contacts view button found, defaulting to table');
                renderContactsTable();
            }
        } else {
            showError('Error al cargar contactos: ' + result.error);
        }
    } catch (error) {
        console.error('Error cargando contactos:', error);
        showError('Error de conexión al cargar contactos');
    } finally {
        showLoading(false);
    }
}

async function loadContactStats() {
    try {
        const result = await window.electronAPI.getContactStats(currentUser);
        
        if (result.success) {
            const stats = result.data;
            animateNumber(totalContactsElement, stats.total || 0);
            animateNumber(totalLeadsElement, stats.leads || 0);
            animateNumber(totalClientsElement, stats.clients || 0);
            animateNumber(totalCompaniesElement, stats.companies || 0);
            
            updateCharts(stats);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function renderContactsTable() {
    // Use global variable, but fallback to getElementById if not available
    let tableBody = contactsTableBody || document.getElementById('contactsTableBody');
    if (!tableBody) {
        console.error('Contacts table body not found!');
        return;
    }
    
    console.log('Rendering contacts table with', contacts.length, 'contacts');
    tableBody.innerHTML = '';
    
    if (!contacts || contacts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">No hay contactos para mostrar</td></tr>';
        return;
    }
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        
        // Process avatar
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        // Process tags
        const tagsArray = contact.tags ? contact.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const tagsHtml = tagsArray.map(tag => `<span class="contact-tag-small">${tag}</span>`).join('');
        
        // Process country with flag
        const countryInfo = getCountryInfo(contact.country);
        
        row.innerHTML = `
            <td><strong>${contact.name}</strong></td>
            <td class="contact-avatar-cell">
                <img src="${avatarSrc}" alt="Avatar" class="contact-avatar-small">
            </td>
            <td>${contact.email || '-'}</td>
            <td>${contact.phone || '-'}</td>
            <td class="contact-country-cell">${countryInfo}</td>
            <td class="contact-tags-cell">${tagsHtml || '-'}</td>
            <td class="contact-comments-cell" title="${contact.comments || ''}">${contact.comments || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditContactModal(${contact.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteContactModal(${contact.id})">Eliminar</button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function filterContacts() {
    const searchTerm = document.getElementById('contactsSearch')?.value.toLowerCase() || '';
    
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm) ||
                             (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                             (contact.phone && contact.phone.toLowerCase().includes(searchTerm)) ||
                             (contact.country && getCountryInfo(contact.country).toLowerCase().includes(searchTerm)) ||
                             (contact.tags && contact.tags.toLowerCase().includes(searchTerm)) ||
                             (contact.comments && contact.comments.toLowerCase().includes(searchTerm));
        
        return matchesSearch;
    });
    
    // Determinar la vista activa y renderizar accordingly
    const activeView = document.querySelector('.view-toggle.active')?.id || 'listView';
    const viewType = activeView.replace('View', '');
    
    switch (viewType) {
        case 'list':
            renderFilteredContactsTable(filteredContacts);
            break;
        case 'card':
            renderFilteredContactsCards(filteredContacts);
            break;
        case 'grid':
            renderFilteredContactsGrid(filteredContacts);
            break;
        default:
            renderFilteredContactsTable(filteredContacts);
    }
}

function renderFilteredContactsTable(filteredContacts) {
    // Use global variable, but fallback to getElementById if not available
    let tableBody = contactsTableBody || document.getElementById('contactsTableBody');
    if (!tableBody) {
        console.error('Contacts table body not found in renderFilteredContactsTable!');
        return;
    }
    
    console.log('Rendering filtered contacts table with', filteredContacts.length, 'contacts');
    tableBody.innerHTML = '';
    
    if (filteredContacts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">No se encontraron contactos</td></tr>';
        return;
    }
    
    filteredContacts.forEach(contact => {
        const row = document.createElement('tr');
        
        // Process avatar
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        // Process tags
        const tags = contact.tags ? contact.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const tagsHtml = tags.map(tag => `<span class="contact-tag-small">${tag}</span>`).join('');
        
        // Process country with flag
        const countryInfo = getCountryInfo(contact.country);
        
        row.innerHTML = `
            <td><strong>${contact.name}</strong></td>
            <td class="contact-avatar-cell">
                <img src="${avatarSrc}" alt="Avatar" class="contact-avatar-small">
            </td>
            <td>${contact.email || '-'}</td>
            <td>${contact.phone || '-'}</td>
            <td class="contact-country-cell">${countryInfo}</td>
            <td class="contact-tags-cell">${tagsHtml || '-'}</td>
            <td class="contact-comments-cell" title="${contact.comments || ''}">${contact.comments || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditContactModal(${contact.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteContactModal(${contact.id})">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Contact view functions
function changeContactView(viewType) {
    console.log('=== CHANGE CONTACT VIEW DEBUG ===');
    console.log('Changing to view type:', viewType);
    console.log('Current contacts array:', contacts);
    console.log('Current contactsTableBody:', contactsTableBody);
    
    // Remove active class from all toggle buttons
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const activeButton = document.getElementById(viewType + 'View');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Get contacts container
    const contactsContainer = document.getElementById('contactsContainer');
    
    // Apply view type
    switch (viewType) {
        case 'list':
            contactsContainer.className = 'contacts-table-container';
            // Recreate table structure if needed
            if (!contactsContainer.querySelector('table')) {
                contactsContainer.innerHTML = `
                    <table id="contactsTable" class="contacts-table resizable-table">
                        <thead>
                            <tr>
                                <th class="resizable-column" data-min-width="150">
                                    <span>Nombre completo</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="80">
                                    <span>Avatar</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="180">
                                    <span>Email</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="120">
                                    <span>Teléfono</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="100">
                                    <span>País</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="120">
                                    <span>Etiquetas</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th class="resizable-column" data-min-width="150">
                                    <span>Comentarios</span>
                                    <div class="column-resizer"></div>
                                </th>
                                <th data-min-width="100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="contactsTableBody">
                        </tbody>
                    </table>
                `;
                // Re-asignar la referencia global
                contactsTableBody = document.getElementById('contactsTableBody');
                console.log('Reassigned contactsTableBody:', contactsTableBody);
                // Re-inicializar funcionalidades de la tabla
                initializeResizableColumns();
            }
            renderContactsTable();
            break;
        case 'card':
            contactsContainer.className = 'contacts-card-container';
            renderContactsCards();
            break;
        case 'grid':
            contactsContainer.className = 'contacts-grid-container';
            renderContactsGrid();
            break;
    }
    
    console.log('Contact view change completed. Final contactsTableBody:', contactsTableBody);
}

function renderContactsCards() {
    const contactsContainer = document.getElementById('contactsContainer');
    
    const cardsHTML = contacts.map(contact => {
        const countryInfo = getCountryInfo(contact.country);
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        const tagsArray = contact.tags ? contact.tags.split(',').map(tag => tag.trim()) : [];
        const tagsHtml = tagsArray.map(tag => `<span class="contact-tag">${tag}</span>`).join('');
        
        return `
            <div class="contact-card">
                <div class="contact-card-header">
                    <img src="${avatarSrc}" alt="Avatar" class="contact-card-avatar">
                    <div class="contact-card-info">
                        <h3>${contact.name}</h3>
                        <p>${contact.email || '-'}</p>
                    </div>
                </div>
                <div class="contact-card-body">
                    <div class="contact-card-field">
                        <strong>Teléfono:</strong> ${contact.phone || '-'}
                    </div>
                    <div class="contact-card-field">
                        <strong>País:</strong> ${countryInfo}
                    </div>
                    <div class="contact-card-field">
                        <strong>Etiquetas:</strong> ${tagsHtml || '-'}
                    </div>
                    <div class="contact-card-field">
                        <strong>Comentarios:</strong> ${contact.comments || '-'}
                    </div>
                </div>
                <div class="contact-card-actions">
                    <button class="edit-btn" onclick="openEditContactModal(${contact.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteContactModal(${contact.id})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
    
    contactsContainer.innerHTML = `<div class="contacts-cards-grid">${cardsHTML}</div>`;
}

function renderContactsGrid() {
    const contactsContainer = document.getElementById('contactsContainer');
    
    const gridHTML = contacts.map(contact => {
        const countryInfo = getCountryInfo(contact.country);
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        return `
            <div class="contact-grid-item" onclick="openEditContactModal(${contact.id})">
                <img src="${avatarSrc}" alt="Avatar" class="contact-grid-avatar">
                <h4>${contact.name}</h4>
                <p>${contact.email || '-'}</p>
                <div class="contact-grid-country">${countryInfo}</div>
            </div>
        `;
    }).join('');
    
    contactsContainer.innerHTML = `<div class="contacts-grid">${gridHTML}</div>`;
}

function renderFilteredContactsCards(filteredContacts) {
    const contactsContainer = document.getElementById('contactsContainer');
    
    const cardsHTML = filteredContacts.map(contact => {
        const countryInfo = getCountryInfo(contact.country);
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        const tagsArray = contact.tags ? contact.tags.split(',').map(tag => tag.trim()) : [];
        const tagsHtml = tagsArray.map(tag => `<span class="contact-tag">${tag}</span>`).join('');
        
        return `
            <div class="contact-card">
                <div class="contact-card-header">
                    <img src="${avatarSrc}" alt="Avatar" class="contact-card-avatar">
                    <div class="contact-card-info">
                        <h3>${contact.name}</h3>
                        <p>${contact.email || '-'}</p>
                    </div>
                </div>
                <div class="contact-card-body">
                    <div class="contact-card-field">
                        <strong>Teléfono:</strong> ${contact.phone || '-'}
                    </div>
                    <div class="contact-card-field">
                        <strong>País:</strong> ${countryInfo}
                    </div>
                    <div class="contact-card-field">
                        <strong>Etiquetas:</strong> ${tagsHtml || '-'}
                    </div>
                    <div class="contact-card-field">
                        <strong>Comentarios:</strong> ${contact.comments || '-'}
                    </div>
                </div>
                <div class="contact-card-actions">
                    <button class="edit-btn" onclick="openEditContactModal(${contact.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteContactModal(${contact.id})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
    
    contactsContainer.innerHTML = `<div class="contacts-cards-grid">${cardsHTML}</div>`;
}

function renderFilteredContactsGrid(filteredContacts) {
    const contactsContainer = document.getElementById('contactsContainer');
    
    const gridHTML = filteredContacts.map(contact => {
        const countryInfo = getCountryInfo(contact.country);
        const avatarSrc = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
        
        return `
            <div class="contact-grid-item" onclick="openEditContactModal(${contact.id})">
                <img src="${avatarSrc}" alt="Avatar" class="contact-grid-avatar">
                <h4>${contact.name}</h4>
                <p>${contact.email || '-'}</p>
                <div class="contact-grid-country">${countryInfo}</div>
            </div>
        `;
    }).join('');
    
    contactsContainer.innerHTML = `<div class="contacts-grid">${gridHTML}</div>`;
}

// User view functions
function changeUserView(viewType) {
    // Remove active class from all toggle buttons
    document.querySelectorAll('#users-tab .view-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const activeButton = document.getElementById('user' + viewType.charAt(0).toUpperCase() + viewType.slice(1) + 'View');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Get users container
    const usersContainer = document.getElementById('usersContainer');
    
    // Apply view type
    switch (viewType) {
        case 'list':
            usersContainer.className = 'users-table-container';
            // Recreate table structure if needed
            if (!usersContainer.querySelector('table')) {
                usersContainer.innerHTML = `
                    <table id="usersTable" class="users-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Género</th>
                                <th>Rol</th>
                                <th>Fecha de Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                        </tbody>
                    </table>
                `;
            }
            renderUsersTable();
            break;
        case 'card':
            usersContainer.className = 'users-card-container';
            renderUsersCards();
            break;
        case 'grid':
            usersContainer.className = 'users-grid-container';
            renderUsersGrid();
            break;
    }
}

function changeTagView(viewType) {
    console.log('=== CHANGE TAG VIEW DEBUG ===');
    console.log('Changing to view type:', viewType);
    console.log('Current tags array:', tags);
    
    // Remove active class from all toggle buttons
    const tagButtons = document.querySelectorAll('#tags-tab .view-toggle');
    tagButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    const activeButton = document.getElementById('tag' + viewType.charAt(0).toUpperCase() + viewType.slice(1) + 'View');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Get tags container
    const tagsContainer = document.getElementById('tagsContainer');
    
    // Apply view type
    switch (viewType) {
        case 'list':
            tagsContainer.className = 'tags-table-container';
            // Recreate table structure if needed
            if (!tagsContainer.querySelector('table')) {
                tagsContainer.innerHTML = `
                    <table id="tagsTable" class="tags-table">
                        <thead>
                            <tr>
                                <th>Color</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Uso</th>
                                <th>Descripción</th>
                                <th>Creada por</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tagsTableBody">
                        </tbody>
                    </table>
                `;
            }
            // Reassign global references after recreating the DOM
            tagsTableBody = document.getElementById('tagsTableBody');
            renderTagsTable();
            break;
        case 'card':
            tagsContainer.className = 'tags-card-container';
            renderTagsCards();
            break;
        case 'grid':
            tagsContainer.className = 'tags-grid-container';
            renderTagsGrid();
            break;
    }
    
    console.log('View change completed. Tags table body:', tagsTableBody);
}

function renderUsersCards() {
    const usersContainer = document.getElementById('usersContainer');
    
    const cardsHTML = users.map(user => {
        const avatarElement = user.avatar ? 
            `<img src="${user.avatar}" alt="${user.name}" class="user-card-avatar">` :
            `<div class="user-card-avatar-placeholder">${user.name.charAt(0)}</div>`;
            
        const genderElement = user.gender ? 
            `<span class="gender-badge gender-${user.gender}">${getGenderLabel(user.gender)}</span>` :
            '<span class="gender-badge gender-no_especifica">-</span>';
        
        const isCurrentUser = currentUser && currentUser.id === user.id;
        
        return `
            <div class="user-card">
                <div class="user-card-header">
                    ${avatarElement}
                    <div class="user-card-info">
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-card-body">
                    <div class="user-card-field">
                        <strong>Género:</strong> ${genderElement}
                    </div>
                    <div class="user-card-field">
                        <strong>Rol:</strong> 
                        <span class="role-badge role-${user.role}">
                            ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                    </div>
                    <div class="user-card-field">
                        <strong>Registro:</strong> ${formatDate(user.created_at)}
                    </div>
                </div>
                <div class="user-card-actions">
                    <button class="edit-btn" onclick="openEditUserModal(${user.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteUserModal(${user.id})" 
                            ${isCurrentUser ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''}>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    usersContainer.innerHTML = `<div class="users-cards-grid">${cardsHTML}</div>`;
}

function renderUsersGrid() {
    const usersContainer = document.getElementById('usersContainer');
    
    const gridHTML = users.map(user => {
        const avatarElement = user.avatar ? 
            `<img src="${user.avatar}" alt="${user.name}" class="user-grid-avatar">` :
            `<div class="user-grid-avatar-placeholder">${user.name.charAt(0)}</div>`;
        
        return `
            <div class="user-grid-item" onclick="openEditUserModal(${user.id})">
                ${avatarElement}
                <h4>${user.name}</h4>
                <p>${user.email}</p>
                <div class="user-grid-role">
                    <span class="role-badge role-${user.role}">
                        ${user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    usersContainer.innerHTML = `<div class="users-grid">${gridHTML}</div>`;
}

function getStatusLabel(status) {
    const labels = {
        'lead': 'Lead',
        'prospect': 'Prospect',
        'cliente': 'Cliente',
        'inactivo': 'Inactivo'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'high': 'Alta',
        'medium': 'Media',
        'low': 'Baja'
    };
    return labels[priority] || priority;
}

// Contact Modal Functions
async function loadContactTags() {
    try {
        const result = await window.electronAPI.getAllTags();
        const contactTagsSelect = document.getElementById('contactTags');
        
        if (result.success && contactTagsSelect) {
            // Limpiar opciones existentes
            contactTagsSelect.innerHTML = '';
            
            // Filtrar solo etiquetas para contactos y ambos
            const contactTags = result.data.filter(tag => tag.usage === 'contacts' || tag.usage === 'both');
            
            contactTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.name;
                option.textContent = tag.name;
                option.style.color = tag.color;
                contactTagsSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando etiquetas para contactos:', error);
    }
}

function openAddContactModal() {
    isEditing = false;
    editingContactId = null;
    
    document.getElementById('contactModalTitle').textContent = 'Agregar Contacto';
    contactForm.reset();
    
    // Reset avatar to default
    const avatarImage = document.getElementById('contactAvatarImage');
    if (avatarImage) {
        avatarImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }
    
    contactModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Cargar etiquetas disponibles
    loadContactTags();
    
    // Clear any active label classes
    setTimeout(() => {
        clearLabelsPositioning();
    }, 50);
}

function clearLabelsPositioning() {
    // Clear input labels
    const inputs = document.querySelectorAll('#contactModal input');
    inputs.forEach(input => {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.remove('active');
        }
    });
    
    // Clear textarea labels
    const textareas = document.querySelectorAll('#contactModal textarea');
    textareas.forEach(textarea => {
        const label = textarea.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.remove('active');
        }
    });
}

function openEditContactModal(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    isEditing = true;
    editingContactId = contactId;
    
    document.getElementById('contactModalTitle').textContent = 'Editar Contacto';
    
    // Fill form with contact data
    document.getElementById('contactId').value = contact.id;
    document.getElementById('contactName').value = contact.name || '';
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactPhone').value = contact.phone || '';
    document.getElementById('contactCountry').value = contact.country || '';
    document.getElementById('contactComments').value = contact.comments || '';
    
    // Set avatar
    const avatarImage = document.getElementById('contactAvatarImage');
    if (avatarImage) {
        avatarImage.src = contact.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }
    
    // Cargar etiquetas y después seleccionar las del contacto
    loadContactTags().then(() => {
        // Seleccionar las etiquetas del contacto actual
        const contactTagsSelect = document.getElementById('contactTags');
        if (contact.tags && contactTagsSelect) {
            const currentTags = contact.tags.split(',').map(tag => tag.trim());
            Array.from(contactTagsSelect.options).forEach(option => {
                option.selected = currentTags.includes(option.text);
            });
        }
    });
    
    contactModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Fix labels positioning for filled fields
    setTimeout(() => {
        fixLabelsPositioning();
    }, 50);
}

function fixLabelsPositioning() {
    // Fix input labels
    const inputs = document.querySelectorAll('#contactModal input');
    inputs.forEach(input => {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL' && input.value) {
            label.classList.add('active');
        }
    });
    
    // Fix select labels
    const selects = document.querySelectorAll('#contactModal select');
    selects.forEach(select => {
        const label = select.nextElementSibling;
        if (label && label.tagName === 'LABEL' && select.value) {
            label.classList.add('active');
            select.classList.add('has-value');
        }
    });
    
    // Fix textarea labels
    const textareas = document.querySelectorAll('#contactModal textarea');
    textareas.forEach(textarea => {
        const label = textarea.nextElementSibling;
        if (label && label.tagName === 'LABEL' && textarea.value) {
            label.classList.add('active');
        }
    });
}

function openDeleteContactModal(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    document.getElementById('deleteMessage').textContent = '¿Estás seguro de que deseas eliminar este contacto?';
    document.getElementById('deleteInfo').innerHTML = `
        <strong>Contacto:</strong> ${contact.name}<br>
        <strong>Email:</strong> ${contact.email || 'Sin email'}
    `;
    
    // Store the ID for deletion
    window.itemToDelete = { type: 'contact', id: contactId };
    
    deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== CONTACT FORM SUBMIT DEBUG ===');
    
    const formData = new FormData(contactForm);
    
    // Get avatar data
    const avatarImage = document.getElementById('contactAvatarImage');
    const defaultAvatarSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    const avatarSrc = (avatarImage && avatarImage.src !== defaultAvatarSrc) ? avatarImage.src : null;
    
    console.log('Avatar image element:', avatarImage);
    console.log('Avatar src:', avatarSrc);
    
    // Get selected tags from multi-select
    const tagsSelect = document.getElementById('contactTags');
    console.log('Tags select element:', tagsSelect);
    console.log('Selected options:', tagsSelect ? tagsSelect.selectedOptions : 'Element not found');
    
    let selectedTags = [];
    let tagsString = '';
    
    if (tagsSelect && tagsSelect.selectedOptions) {
        selectedTags = Array.from(tagsSelect.selectedOptions).map(option => option.textContent);
        tagsString = selectedTags.join(', ');
    } else {
        console.error('Tags select element not found or has no selectedOptions');
    }
    
    console.log('Selected tags:', selectedTags);
    console.log('Tags string:', tagsString);
    
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        country: formData.get('country'),
        tags: tagsString,
        comments: formData.get('comments'),
        avatar: avatarSrc,
        created_by: currentUser.id
    };
    
    console.log('Contact data to submit:', contactData);
    
    if (!contactData.name) {
        showError('El nombre es requerido');
        return;
    }
    
    if (isEditing) {
        contactData.id = editingContactId;
        await updateContact(contactData);
    } else {
        await createContact(contactData);
    }
}

async function createContact(contactData) {
    try {
        console.log('=== CREATE CONTACT DEBUG ===');
        console.log('Data being sent:', contactData);
        
        const result = await window.electronAPI.createContact(contactData, currentUser);
        
        console.log('Result from backend:', result);
        
        if (result.success) {
            closeModals();
            await loadContacts();
            await loadContactStats();
            showSuccessMessage('Contacto creado exitosamente');
        } else {
            console.error('Error from backend:', result.error);
            showError(result.error || 'Error al crear contacto');
        }
    } catch (error) {
        console.error('Error creando contacto:', error);
        showError('Error de conexión al crear contacto: ' + error.message);
    }
}

async function updateContact(contactData) {
    try {
        console.log('=== UPDATE CONTACT DEBUG ===');
        console.log('Data being sent:', contactData);
        
        const result = await window.electronAPI.updateContact(contactData, currentUser);
        
        console.log('Result from backend:', result);
        
        if (result.success) {
            closeModals();
            await loadContacts();
            await loadContactStats();
            showSuccessMessage('Contacto actualizado exitosamente');
        } else {
            console.error('Error from backend:', result.error);
            showError(result.error || 'Error al actualizar contacto');
        }
    } catch (error) {
        console.error('Error actualizando contacto:', error);
        showError('Error de conexión al actualizar contacto: ' + error.message);
    }
}

function closeContactModal() {
    contactModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    hideError();
    contactForm.reset();
    clearLabelsPositioning();
}

// ============ USERS MANAGEMENT (Existing code adapted) ============
async function loadUsers() {
    showLoading(true);
    
    try {
        const result = await window.electronAPI.getAllUsers();
        
        if (result.success) {
            users = result.data;
            
            // Renderizar basado en la vista activa
            const activeViewBtn = document.querySelector('#users-tab .view-toggle.active');
            console.log('Active users view button found:', activeViewBtn);
            if (activeViewBtn) {
                const viewType = activeViewBtn.dataset.view;
                console.log('Detected users view type:', viewType);
                switch (viewType) {
                    case 'grid':
                        renderUsersGrid();
                        break;
                    case 'card':
                        renderUsersCards();
                        break;
                    case 'list':
                    default:
                        renderUsersTable();
                        break;
                }
            } else {
                console.log('No active users view button found, defaulting to table');
                renderUsersTable();
            }
            
            updateUserStats();
        } else {
            showError('Error al cargar usuarios: ' + result.error);
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showError('Error de conexión al cargar usuarios');
    } finally {
        showLoading(false);
    }
}

function renderUsersTable() {
    let usersTableBodyElement = document.getElementById('usersTableBody');
    if (!usersTableBodyElement) {
        return;
    }
    
    usersTableBodyElement.innerHTML = '';
    
    if (!users || users.length === 0) {
        usersTableBodyElement.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No hay usuarios para mostrar</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Verificar currentUser antes de usarlo
        const isCurrentUser = currentUser && currentUser.id === user.id;
        
        // Generate avatar or placeholder
        const avatarElement = user.avatar ? 
            `<img src="${user.avatar}" alt="${user.name}" class="user-avatar">` :
            `<div class="user-avatar-placeholder">${user.name.charAt(0)}</div>`;
            
        // Gender badge
        const genderElement = user.gender ? 
            `<span class="gender-badge gender-${user.gender}">${getGenderLabel(user.gender)}</span>` :
            '<span class="gender-badge gender-no_especifica">-</span>';
        
        row.innerHTML = `
            <td>${avatarElement}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${genderElement}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditUserModal(${user.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteUserModal(${user.id})" 
                            ${isCurrentUser ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''}>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        usersTableBodyElement.appendChild(row);
    });
}

function updateUserStats() {
    const totalUsers = users.length;
    const totalAdmins = users.filter(user => user.role === 'admin').length;
    const totalRegularUsers = users.filter(user => user.role === 'user').length;
    
    animateNumber(totalUsersElement, totalUsers);
    animateNumber(totalAdminsElement, totalAdmins);
    animateNumber(totalRegularUsersElement, totalRegularUsers);
}

// User Filters
function filterUsers() {
    console.log('=== FILTER USERS DEBUG ===');
    console.log('Global users array:', users);
    
    if (!users || !Array.isArray(users)) {
        console.error('Users array not available for filtering');
        return;
    }
    
    const searchTerm = document.getElementById('usersSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const genderFilter = document.getElementById('genderFilter')?.value || '';
    
    console.log('Search term:', searchTerm);
    console.log('Role filter:', roleFilter);
    console.log('Gender filter:', genderFilter);
    
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                             user.email.toLowerCase().includes(searchTerm);
        
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesGender = !genderFilter || user.gender === genderFilter;
        
        return matchesSearch && matchesRole && matchesGender;
    });
    
    console.log('Filtered users count:', filteredUsers.length);
    
    // Re-render table with filtered results
    renderFilteredUsersTable(filteredUsers);
}

function renderFilteredUsersTable(filteredUsers) {
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No se encontraron usuarios</td></tr>';
        return;
    }
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Verificar currentUser antes de usarlo
        const isCurrentUser = currentUser && currentUser.id === user.id;
        
        // Generate avatar or placeholder
        const avatarElement = user.avatar ? 
            `<img src="${user.avatar}" alt="${user.name}" class="user-avatar">` :
            `<div class="user-avatar-placeholder">${user.name.charAt(0)}</div>`;
            
        // Gender badge
        const genderElement = user.gender ? 
            `<span class="gender-badge gender-${user.gender}">${getGenderLabel(user.gender)}</span>` :
            '<span class="gender-badge gender-no_especifica">-</span>';
        
        row.innerHTML = `
            <td>${avatarElement}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${genderElement}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditUserModal(${user.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteUserModal(${user.id})" 
                            ${isCurrentUser ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''}>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

function getGenderLabel(gender) {
    const labels = {
        'masculino': 'Masculino',
        'femenino': 'Femenino',
        'otro': 'Otro',
        'no_especifica': 'No especifica'
    };
    return labels[gender] || '-';
}

// Avatar handling
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            showError('Por favor selecciona un archivo de imagen válido');
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('La imagen debe ser menor a 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// ============ CHARTS ============
function initializeCharts() {
    initializeStatusChart();
    initializeTrendChart();
}

function initializeStatusChart() {
    const ctx = document.getElementById('statusChart')?.getContext('2d');
    if (!ctx) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e2e8f0' : '#333333';
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Leads', 'Prospects', 'Clientes', 'Inactivos'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#f57c00',
                    '#1976d2',
                    '#388e3c',
                    '#616161'
                ],
                borderWidth: 3,
                borderColor: isDark ? '#2d3748' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: 500
                        },
                        padding: 20
                    }
                }
            }
        }
    });
}

function initializeTrendChart() {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e2e8f0' : '#333333';
    const gridColor = isDark ? '#4a5568' : '#e1e5e9';
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Nuevos Contactos',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: 500
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

function updateCharts(stats) {
    if (statusChart) {
        statusChart.data.datasets[0].data = [
            stats.leads || 0,
            stats.prospects || 0, 
            stats.clients || 0,
            stats.inactive || 0
        ];
        statusChart.update();
    }
}

// ============ REPORTS ============
async function exportContacts() {
    try {
        showToast('Preparando exportación...', 'info');
        
        // Create CSV content
        const headers = ['Nombre', 'Email', 'Teléfono', 'Empresa', 'Cargo', 'Estado', 'Prioridad', 'Ciudad', 'País', 'Tags'];
        const csvContent = [
            headers.join(','),
            ...contacts.map(contact => [
                `"${contact.name || ''}"`,
                `"${contact.email || ''}"`,
                `"${contact.phone || ''}"`,
                `"${contact.company || ''}"`,
                `"${contact.position || ''}"`,
                `"${getStatusLabel(contact.status)}"`,
                `"${getPriorityLabel(contact.priority)}"`,
                `"${contact.city || ''}"`,
                `"${contact.country || ''}"`,
                `"${contact.tags || ''}"`
            ].join(','))
        ].join('\\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contactos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccessMessage('Contactos exportados exitosamente');
    } catch (error) {
        console.error('Error exportando contactos:', error);
        showError('Error al exportar contactos');
    }
}

function generateConversionReport() {
    const leads = contacts.filter(c => c.status === 'lead').length;
    const prospects = contacts.filter(c => c.status === 'prospect').length;
    const clients = contacts.filter(c => c.status === 'cliente').length;
    const total = contacts.length;
    
    if (total === 0) {
        showToast('No hay datos suficientes para generar el reporte', 'info');
        return;
    }
    
    const conversionRate = ((clients / total) * 100).toFixed(1);
    const prospectRate = ((prospects / total) * 100).toFixed(1);
    
    showToast(`Tasa de conversión: ${conversionRate}% | Prospects: ${prospectRate}%`, 'success');
}

// ============ UTILITY FUNCTIONS ============
function getRoleLabel(role) {
    switch(role) {
        case 'admin': return 'Administrador';
        case 'user': return 'Usuario';
        default: return role;
    }
}

function getTagTypeLabel(type) {
    const types = {
        status: 'Estado',
        priority: 'Prioridad',
        category: 'Categoría',
        role: 'Rol',
        custom: 'Personalizada'
    };
    return types[type] || type;
}

function animateNumber(element, targetNumber) {
    if (!element) return;
    
    const currentNumber = parseInt(element.textContent) || 0;
    
    // Si los números son iguales, no hacer animación
    if (currentNumber === targetNumber) {
        element.textContent = targetNumber;
        return;
    }
    
    const difference = Math.abs(targetNumber - currentNumber);
    const increment = targetNumber > currentNumber ? 1 : -1;
    
    // Calcular tiempo de paso más seguro
    const duration = 500; // 500ms total
    const steps = Math.min(difference, 50); // Máximo 50 pasos
    const stepTime = Math.max(duration / steps, 10); // Mínimo 10ms por paso
    
    let current = currentNumber;
    const stepIncrement = difference > steps ? Math.ceil(difference / steps) : 1;
    
    const timer = setInterval(() => {
        if (increment > 0) {
            current = Math.min(current + stepIncrement, targetNumber);
        } else {
            current = Math.max(current - stepIncrement, targetNumber);
        }
        
        element.textContent = current;
        
        if (current === targetNumber) {
            clearInterval(timer);
        }
    }, stepTime);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ USER MANAGEMENT (Existing functions) ============
function openAddUserModal() {
    isEditing = false;
    editingUserId = null;
    
    document.getElementById('modalTitle').textContent = 'Agregar Usuario';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    
    // Reset avatar preview
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E";
    }
    
    userForm.reset();
    userModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openEditUserModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    isEditing = true;
    editingUserId = userId;
    
    document.getElementById('modalTitle').textContent = 'Editar Usuario';
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('userPassword').required = false;
    
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userGender').value = user.gender || '';
    
    // Set avatar preview
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        if (user.avatar) {
            avatarPreview.src = user.avatar;
        } else {
            avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E";
        }
    }
    
    userModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openDeleteUserModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (user.id === currentUser.id) {
        showError('No puedes eliminar tu propia cuenta');
        return;
    }
    
    document.getElementById('deleteMessage').textContent = '¿Estás seguro de que deseas eliminar este usuario?';
    document.getElementById('deleteInfo').innerHTML = `
        <strong>Usuario:</strong> ${user.name}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>Rol:</strong> ${getRoleLabel(user.role)}
    `;
    
    // Store the ID for deletion
    window.itemToDelete = { type: 'user', id: userId };
    
    deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== USER FORM SUBMIT DEBUG ===');
    
    const formData = new FormData(userForm);
    
    // Log all form data
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
    
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        gender: formData.get('gender')
    };
    
    console.log('User data before avatar:', userData);
    
    // Handle avatar
    const avatarPreview = document.getElementById('avatarPreview');
    const defaultAvatarSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E";
    
    console.log('Avatar preview element:', avatarPreview);
    console.log('Avatar preview src:', avatarPreview?.src);
    console.log('Default avatar SVG:', defaultAvatarSvg);
    
    if (avatarPreview && avatarPreview.src && avatarPreview.src !== defaultAvatarSvg) {
        userData.avatar = avatarPreview.src;
        console.log('Avatar added to userData:', userData.avatar);
    } else {
        console.log('No avatar set or using default');
    }
    
    console.log('Final userData:', userData);
    
    if (!userData.name || !userData.email || !userData.role) {
        showError('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    if (isEditing) {
        userData.id = editingUserId;
        console.log('Updating user with ID:', editingUserId);
        await updateUser(userData);
    } else {
        userData.password = formData.get('password');
        if (!userData.password) {
            showError('La contraseña es requerida para nuevos usuarios');
            return;
        }
        if (userData.password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        console.log('Creating new user');
        await createUser(userData);
    }
}

async function createUser(userData) {
    try {
        console.log('=== CREATE USER DEBUG ===');
        console.log('Data being sent to backend:', userData);
        
        const result = await window.electronAPI.createUser(userData);
        
        console.log('Result from backend:', result);
        
        if (result.success) {
            closeModals();
            await loadUsers();
            showSuccessMessage('Usuario creado exitosamente');
        } else {
            console.error('Error from backend:', result.error);
            showError(result.error || 'Error al crear usuario');
        }
    } catch (error) {
        console.error('Error creando usuario:', error);
        showError('Error de conexión al crear usuario: ' + error.message);
    }
}

async function updateUser(userData) {
    try {
        console.log('=== UPDATE USER DEBUG ===');
        console.log('Data being sent to backend:', userData);
        
        const result = await window.electronAPI.updateUser(userData);
        
        console.log('Result from backend:', result);
        
        if (result.success) {
            closeModals();
            await loadUsers();
            showSuccessMessage('Usuario actualizado exitosamente');
        } else {
            showError(result.error || 'Error al actualizar usuario');
        }
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        showError('Error de conexión al actualizar usuario');
    }
}

async function confirmDelete() {
    const itemToDelete = window.itemToDelete;
    
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'user') {
        // Delete user
        try {
            const result = await window.electronAPI.deleteUser(itemToDelete.id);
            
            if (result.success) {
                closeModals();
                await loadUsers();
                showSuccessMessage('Usuario eliminado exitosamente');
            } else {
                showError(result.error || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            showError('Error de conexión al eliminar usuario');
        }
    } else if (itemToDelete.type === 'contact') {
        // Delete contact
        try {
            const result = await window.electronAPI.deleteContact(itemToDelete.id, currentUser);
            
            if (result.success) {
                closeModals();
                await loadContacts();
                await loadContactStats();
                showSuccessMessage('Contacto eliminado exitosamente');
            } else {
                showError(result.error || 'Error al eliminar contacto');
            }
        } catch (error) {
            console.error('Error eliminando contacto:', error);
            showError('Error de conexión al eliminar contacto');
        }
    } else if (itemToDelete.type === 'tag') {
        // Delete tag
        try {
            // Llamar a la API para eliminar de la base de datos
            const result = await window.electronAPI.deleteTag(itemToDelete.id);
            
            if (result.success) {
                // Solo eliminar del array local si la eliminación en BD fue exitosa
                const index = tags.findIndex(t => t.id === itemToDelete.id);
                if (index !== -1) {
                    tags.splice(index, 1);
                }
                
                closeModals();
                
                // Renderizar basado en la vista activa
                const activeViewBtn = document.querySelector('#tags-tab .view-toggle.active');
                if (activeViewBtn) {
                    const viewType = activeViewBtn.dataset.view;
                    switch (viewType) {
                        case 'grid':
                            renderTagsGrid();
                            break;
                        case 'card':
                            renderTagsCards();
                            break;
                        case 'list':
                        default:
                            renderTagsTable();
                            break;
                    }
                } else {
                    renderTagsTable(); // Default
                }
                
                updateTagStats();
                showSuccessMessage('Etiqueta eliminada exitosamente');
            } else {
                showError(result.error || 'Error al eliminar etiqueta');
            }
        } catch (error) {
            console.error('Error eliminando etiqueta:', error);
            showError('Error al eliminar etiqueta');
        }
    }
    
    // Clear the item to delete
    window.itemToDelete = null;
}

// ============ MODAL MANAGEMENT ============
function closeUserModal() {
    userModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    hideError();
    userForm.reset();
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingUserId = null;
    editingContactId = null;
}

function closeModals() {
    // Cerrar todos los modales específicos
    if (userModal) {
        userModal.style.display = 'none';
    }
    if (contactModal) {
        contactModal.style.display = 'none';
    }
    if (tagModal) {
        tagModal.style.display = 'none';
    }
    if (deleteModal) {
        deleteModal.style.display = 'none';
    }
    
    // Cerrar cualquier modal que pueda estar abierto
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Limpiar formularios
    if (userForm) userForm.reset();
    if (contactForm) contactForm.reset();
    if (tagForm) tagForm.reset();
    
    // Restaurar estado del body
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');
    
    // Ocultar errores
    hideError();
}

async function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar todos los datos de sesión
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        
        // Limpiar variables globales
        currentUser = null;
        users = [];
        contacts = [];
        tags = [];
        
        // Limpiar modales abiertos
        closeModals();
        
        // Limpiar loading overlay
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Limpiar estado de formularios y DOM
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
        document.documentElement.style.overflow = 'auto';
        
        // Limpiar cualquier overlay de backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Remover estilos inline y clases que puedan interferir
        const elementsWithInlineStyle = document.querySelectorAll('[style*="pointer-events"], [style*="cursor"]');
        elementsWithInlineStyle.forEach(element => {
            element.style.pointerEvents = '';
            element.style.cursor = '';
        });
        
        // Forzar re-render de inputs si existen
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.blur();
            input.style.pointerEvents = '';
            input.style.cursor = '';
        });
        
        // Limpiar variables de estado
        isEditing = false;
        editingUserId = null;
        editingContactId = null;
        editingTagId = null;
        window.itemToDelete = null;
        
        // Pequeña demora para asegurar que el DOM se limpie completamente
        setTimeout(async () => {
            // Navegar al login
            await window.electronAPI.navigateToLogin();
        }, 100);
    }
}

// ============ UI HELPERS ============
function showLoading(show) {
    if (show) {
        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

function showError(message) {
    showToast(message, 'error');
}

function hideError() {
    const errorElements = ['contact-form-error', 'user-form-error'];
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#28a745' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' }
    };
    
    const color = colors[type] || colors.info;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color.bg};
        color: ${color.text};
        padding: 16px 24px;
        border-radius: 12px;
        border-left: 4px solid ${color.border};
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        z-index: 10001;
        min-width: 280px;
        max-width: 400px;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        font-family: 'Inter', sans-serif;
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        word-wrap: break-word;
    `;
    
    toast.textContent = message;
    
    // Add click to close functionality
    const closeToast = () => {
        toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
        clearTimeout(autoCloseTimer);
    };
    
    toast.addEventListener('click', closeToast);
    
    document.body.appendChild(toast);
    
    // Auto-close after 4 seconds
    const autoCloseTimer = setTimeout(() => {
        if (toast.parentNode) {
            closeToast();
        }
    }, 4000);
}

// CSS Animations for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============ TAGS MANAGEMENT ============

function openAddTagModal() {
    isEditing = false;
    editingTagId = null;
    
    document.getElementById('tagModalTitle').textContent = 'Nueva Etiqueta';
    tagForm.reset();
    document.getElementById('tagColor').value = '#4FACFE';
    updateTagPreview();
    
    tagModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openEditTagModal(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    isEditing = true;
    editingTagId = tagId;
    
    document.getElementById('tagModalTitle').textContent = 'Editar Etiqueta';
    
    // Fill form with tag data
    document.getElementById('tagId').value = tag.id;
    document.getElementById('tagName').value = tag.name || '';
    document.getElementById('tagColor').value = tag.color || '#4FACFE';
    document.getElementById('tagType').value = tag.type || '';
    document.getElementById('tagUsage').value = tag.usage || '';
    document.getElementById('tagDescription').value = tag.description || '';
    
    updateTagPreview();
    
    tagModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeTagModal() {
    tagModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    tagForm.reset();
    updateTagPreview();
}

function updateTagPreview() {
    const nameInput = document.getElementById('tagName');
    const colorInput = document.getElementById('tagColor');
    const preview = document.getElementById('tagPreview');
    
    if (preview) {
        const name = nameInput?.value || 'Etiqueta de ejemplo';
        const color = colorInput?.value || '#4FACFE';
        
        preview.textContent = name;
        preview.style.backgroundColor = color;
        preview.style.color = getContrastColor(color);
    }
}

function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

async function handleTagFormSubmit(e) {
    e.preventDefault();
    
    console.log('Tag form submitted');
    console.log('Form element:', tagForm);
    console.log('Is editing:', isEditing);
    console.log('Editing tag ID:', editingTagId);
    
    const formData = new FormData(tagForm);
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    const tagData = {
        name: formData.get('name'),
        color: formData.get('color'),
        type: formData.get('type'),
        usage: formData.get('usage'),
        description: formData.get('description'),
        created_by: currentUser.id
    };
    
    console.log('Tag data:', tagData);
    
    if (!tagData.name || !tagData.type || !tagData.usage) {
        showError('Todos los campos requeridos deben completarse');
        return;
    }
    
    if (isEditing) {
        tagData.id = editingTagId;
        console.log('Updating tag with data:', tagData);
        await updateTag(tagData);
    } else {
        console.log('Creating new tag with data:', tagData);
        await createTag(tagData);
    }
}

async function createTag(tagData) {
    try {
        const result = await window.electronAPI.createTag(tagData);
        
        if (result.success) {
            closeTagModal();
            await loadTags();
            showSuccessMessage('Etiqueta creada exitosamente');
        } else {
            showError(result.error || 'Error al crear etiqueta');
        }
    } catch (error) {
        console.error('Error creando etiqueta:', error);
        showError('Error de conexión al crear etiqueta');
    }
}

async function updateTag(tagData) {
    try {
        const result = await window.electronAPI.updateTag(tagData);
        
        if (result.success) {
            closeTagModal();
            await loadTags();
            showSuccessMessage('Etiqueta actualizada exitosamente');
        } else {
            showError(result.error || 'Error al actualizar etiqueta');
        }
    } catch (error) {
        console.error('Error actualizando etiqueta:', error);
        showError('Error de conexión al actualizar etiqueta');
    }
}

function renderTagsGrid() {
    const tagsContainer = document.getElementById('tagsContainer');
    
    // Asegurar que tenga la clase correcta
    tagsContainer.className = 'tags-grid-container';
    
    const gridHTML = tags.map(tag => {
        return `
            <div class="tag-grid-item">
                <div class="tag-grid-header">
                    <div class="tag-color-indicator" style="background-color: ${tag.color}"></div>
                    <span class="tag-name">${tag.name}</span>
                </div>
                <div class="tag-grid-content">
                    <div class="tag-type">${getTagTypeLabel(tag.type)}</div>
                    <div class="tag-usage">${getTagUsageLabel(tag.usage)}</div>
                </div>
                <div class="tag-grid-actions">
                    <button class="edit-btn-small" onclick="openEditTagModal(${tag.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn-small" onclick="openDeleteTagModal(${tag.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    tagsContainer.innerHTML = gridHTML;
}

function renderTagsCards() {
    const tagsContainer = document.getElementById('tagsContainer');
    
    // Asegurar que tenga la clase correcta
    tagsContainer.className = 'tags-card-container';
    
    const cardsHTML = tags.map(tag => {
        return `
            <div class="tag-card">
                <div class="tag-card-header">
                    <div class="tag-color-indicator" style="background-color: ${tag.color}"></div>
                    <h3 class="tag-card-name">${tag.name}</h3>
                    <span class="tag-card-type">${getTagTypeLabel(tag.type)}</span>
                </div>
                <div class="tag-card-info">
                    <div class="tag-usage">Para: ${getTagUsageLabel(tag.usage)}</div>
                    ${tag.description ? `<p class="tag-description">${tag.description}</p>` : '<p class="tag-description">Sin descripción</p>'}
                </div>
                <div class="tag-card-footer">
                    <div class="tag-meta">
                        <span>Por: ${currentUser ? currentUser.name : '-'}</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="tag-card-actions">
                        <button class="edit-btn" onclick="openEditTagModal(${tag.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="openDeleteTagModal(${tag.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    tagsContainer.innerHTML = cardsHTML;
}

function renderTagsTable() {
    console.log('=== RENDER TAGS TABLE DEBUG ===');
    console.log('Tags table body element:', tagsTableBody);
    console.log('Tags array:', tags);
    console.log('Tags length:', tags ? tags.length : 'undefined');
    
    const tagsContainer = document.getElementById('tagsContainer');
    
    // Asegurar que tenga la clase y estructura correcta
    tagsContainer.className = 'tags-table-container';
    
    // Recrear estructura de tabla si no existe
    if (!tagsContainer.querySelector('table')) {
        tagsContainer.innerHTML = `
            <table id="tagsTable" class="tags-table">
                <thead>
                    <tr>
                        <th>Color</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Uso</th>
                        <th>Descripción</th>
                        <th>Creada por</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tagsTableBody">
                </tbody>
            </table>
        `;
        // Reassignar referencia global
        tagsTableBody = document.getElementById('tagsTableBody');
    }
    
    if (!tagsTableBody) {
        console.error('Tags table body not found after recreation!');
        return;
    }
    
    if (!tags || !Array.isArray(tags)) {
        console.error('Tags array not available!');
        return;
    }
    
    tagsTableBody.innerHTML = '';
    
    tags.forEach(tag => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="tag-color-indicator" style="background-color: ${tag.color}"></div>
            </td>
            <td><strong>${tag.name}</strong></td>
            <td>${getTagTypeLabel(tag.type)}</td>
            <td>${getTagUsageLabel(tag.usage)}</td>
            <td>${tag.description || '-'}</td>
            <td>${currentUser ? currentUser.name : '-'}</td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditTagModal(${tag.id})">Editar</button>
                    <button class="delete-btn" onclick="openDeleteTagModal(${tag.id})">Eliminar</button>
                </div>
            </td>
        `;
        tagsTableBody.appendChild(row);
    });
    
    console.log('Tags table rendered with', tags.length, 'rows');
}

function filterTags() {
    const searchTerm = document.getElementById('tagsSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('tagTypeFilter')?.value || '';
    const usageFilter = document.getElementById('tagUsageFilter')?.value || '';
    
    const filteredTags = tags.filter(tag => {
        const matchesSearch = tag.name.toLowerCase().includes(searchTerm) ||
                             (tag.description && tag.description.toLowerCase().includes(searchTerm));
        
        const matchesType = !typeFilter || tag.type === typeFilter;
        const matchesUsage = !usageFilter || tag.usage === usageFilter;
        
        return matchesSearch && matchesType && matchesUsage;
    });
    
    // Re-render with filtered results
    renderFilteredTags(filteredTags);
}

function renderFilteredTags(filteredTags) {
    // Update grid
    if (tagsGrid) {
        tagsGrid.innerHTML = '';
        
        filteredTags.forEach(tag => {
            const tagCard = document.createElement('div');
            tagCard.className = 'tag-card';
            tagCard.innerHTML = `
                <div class="tag-card-header">
                    <span class="tag-sample" style="background-color: ${tag.color}; color: ${getContrastColor(tag.color)}">
                        ${tag.name}
                    </span>
                </div>
                <div class="tag-info">
                    <div class="tag-type">${getTagTypeLabel(tag.type)}</div>
                    <div class="tag-usage">Para: ${getTagUsageLabel(tag.usage)}</div>
                    ${tag.description ? `<div class="tag-description">${tag.description}</div>` : ''}
                </div>
                <div class="tag-actions">
                    <button class="tag-edit-btn" onclick="openEditTagModal(${tag.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="tag-delete-btn" onclick="openDeleteTagModal(${tag.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            `;
            tagsGrid.appendChild(tagCard);
        });
    }
    
    // Update table
    if (tagsTableBody) {
        tagsTableBody.innerHTML = '';
        
        filteredTags.forEach(tag => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="tag-color-indicator" style="background-color: ${tag.color}"></div>
                </td>
                <td><strong>${tag.name}</strong></td>
                <td>${getTagTypeLabel(tag.type)}</td>
                <td>${getTagUsageLabel(tag.usage)}</td>
                <td>${tag.description || '-'}</td>
                <td>${currentUser.name}</td>
                <td>${new Date().toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="openEditTagModal(${tag.id})">Editar</button>
                        <button class="delete-btn" onclick="openDeleteTagModal(${tag.id})">Eliminar</button>
                    </div>
                </td>
            `;
            tagsTableBody.appendChild(row);
        });
    }
}

function getTagUsageLabel(usage) {
    const usages = {
        users: 'Usuarios',
        contacts: 'Contactos',
        both: 'Ambos'
    };
    return usages[usage] || usage;
}

function updateTagStats() {
    // Update tag statistics
    const totalTagsElement = document.getElementById('totalTags');
    const tagsInUseElement = document.getElementById('tagsInUse');
    const userTagsElement = document.getElementById('userTags');
    const contactTagsElement = document.getElementById('contactTagsCount');
    
    if (totalTagsElement) totalTagsElement.textContent = tags.length;
    if (tagsInUseElement) tagsInUseElement.textContent = tags.length; // Simplified
    if (userTagsElement) userTagsElement.textContent = tags.filter(t => t.usage === 'users' || t.usage === 'both').length;
    if (contactTagsElement) contactTagsElement.textContent = tags.filter(t => t.usage === 'contacts' || t.usage === 'both').length;
}

function openDeleteTagModal(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    document.getElementById('deleteMessage').textContent = '¿Estás seguro de que deseas eliminar esta etiqueta?';
    document.getElementById('deleteInfo').innerHTML = `
        <strong>Etiqueta:</strong> ${tag.name}<br>
        <strong>Tipo:</strong> ${getTagTypeLabel(tag.type)}
    `;
    
    // Store the ID for deletion
    window.itemToDelete = { type: 'tag', id: tagId };
    
    deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Initialize tags when switching to tags tab
async function loadTags() {
    try {
        const result = await window.electronAPI.getAllTags();
        
        if (result.success) {
            tags = result.data;
        } else {
            console.error('Error loading tags:', result.error);
            tags = [];
        }
        
        // Renderizar basado en la vista activa
        const activeViewBtn = document.querySelector('#tags-tab .view-toggle.active');
        console.log('Active view button found:', activeViewBtn);
        if (activeViewBtn) {
            const viewType = activeViewBtn.dataset.view;
            console.log('Detected view type:', viewType);
            switch (viewType) {
                case 'grid':
                    renderTagsGrid();
                    break;
                case 'card':
                    renderTagsCards();
                    break;
                case 'list':
                default:
                    renderTagsTable();
                    break;
            }
        } else {
            console.log('No active view button found, defaulting to table');
            // Default a lista si no hay vista activa
            renderTagsTable();
        }
        
        updateTagStats();
    } catch (error) {
        console.error('Error cargando etiquetas:', error);
        showError('Error al cargar etiquetas');
        tags = [];
    }
}

// ============ ROLE-BASED ACCESS CONTROL ============

function setupRoleBasedNavigation() {
    if (!currentUser) return;
    
    // Ocultar tab de usuarios para usuarios normales
    const usersTab = document.querySelector('[data-tab="users"]');
    if (currentUser.role !== 'admin' && usersTab) {
        usersTab.style.display = 'none';
    }
    
    // Agregar tab de perfil
    addProfileTab();
    
    // Si el usuario actual es normal y está en la tab de usuarios, cambiar al dashboard
    if (currentUser.role !== 'admin' && currentTab === 'users') {
        switchTab('dashboard');
    }
}

function addProfileTab() {
    const navigation = document.querySelector('.nav-tabs');
    if (!navigation) return;
    
    // Verificar si ya existe la tab de perfil
    if (document.querySelector('[data-tab="profile"]')) return;
    
    // Crear el botón de perfil
    const profileBtn = document.createElement('button');
    profileBtn.className = 'tab-btn';
    profileBtn.setAttribute('data-tab', 'profile');
    profileBtn.innerHTML = '👤 Perfil';
    
    // Agregar event listener
    profileBtn.addEventListener('click', (e) => {
        switchTab('profile');
    });
    
    // Insertar antes del botón de reportes (último)
    const reportsBtn = document.querySelector('[data-tab="reports"]');
    if (reportsBtn) {
        navigation.insertBefore(profileBtn, reportsBtn);
    } else {
        navigation.appendChild(profileBtn);
    }
    
    // Crear el contenido de la tab de perfil
    createProfileTabContent();
}

function createProfileTabContent() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent || document.getElementById('profile-tab')) return;
    
    const profileTab = document.createElement('div');
    profileTab.id = 'profile-tab';
    profileTab.className = 'tab-content';
    
    profileTab.innerHTML = `
        <div class="profile-section">
            <div class="section-header">
                <h2>👤 Mi Perfil</h2>
                <p>Gestiona tu información personal</p>
            </div>
            
            <div class="profile-container">
                <div class="profile-card">
                    <div class="profile-avatar">
                        <div class="avatar-circle">
                            ${currentUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="profile-info">
                        <h3>${currentUser.name}</h3>
                        <p class="profile-email">${currentUser.email}</p>
                        <div class="profile-role">
                            <span class="role-badge role-${currentUser.role}">${getRoleLabel(currentUser.role)}</span>
                        </div>
                    </div>
                    
                    <div class="profile-actions">
                        <button class="btn btn-primary" onclick="openEditProfileModal()">
                            ✏️ Editar Perfil
                        </button>
                        <button class="btn btn-secondary" onclick="openChangePasswordModal()">
                            🔒 Cambiar Contraseña
                        </button>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <h4>Estadísticas Personales</h4>
                    <div class="stats-grid" id="profileStats">
                        <div class="stat-card">
                            <div class="stat-number">-</div>
                            <div class="stat-label">Contactos Creados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">-</div>
                            <div class="stat-label">Actividades</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">-</div>
                            <div class="stat-label">Último Acceso</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    mainContent.appendChild(profileTab);
}

function openEditProfileModal() {
    // TODO: Implementar modal para editar perfil
    showInfo('Funcionalidad de editar perfil próximamente disponible');
}

function openChangePasswordModal() {
    // TODO: Implementar modal para cambiar contraseña  
    showInfo('Funcionalidad de cambiar contraseña próximamente disponible');
}
