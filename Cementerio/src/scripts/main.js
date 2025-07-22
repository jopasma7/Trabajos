// Gestión de Cementerio - Frontend
class CementerioApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchFilters = {};
        this.init();
    }

    async init() {
        this.bindNavigationEvents();
        this.bindModalEvents();
        this.bindFormEvents();
        this.bindSearchEvents();
        
        // Cargar dashboard inicial
        await this.loadDashboard();
        this.showSection('dashboard');
    }

    // Navegación
    bindNavigationEvents() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Mostrar sección seleccionada
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
        }

        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

        // Cargar datos según la sección
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'difuntos':
                    await this.loadDifuntos();
                    break;
                case 'parcelas':
                    await this.loadParcelas();
                    break;
                case 'busqueda':
                    // La búsqueda se carga bajo demanda
                    break;
            }
        } catch (error) {
            this.showNotification('Error al cargar los datos: ' + error.message, 'error');
        }
    }

    // Dashboard
    async loadDashboard() {
        try {
            const stats = await window.electronAPI.getEstadisticas();
            this.updateDashboardStats(stats);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showNotification('Error al cargar las estadísticas', 'error');
        }
    }

    updateDashboardStats(stats) {
        const statsCards = {
            'total-difuntos': stats.totalDifuntos || 0,
            'total-parcelas': stats.totalParcelas || 0,
            'parcelas-ocupadas': stats.parcelasOcupadas || 0,
            'parcelas-disponibles': stats.parcelasDisponibles || 0
        };

        Object.keys(statsCards).forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                card.textContent = statsCards[cardId];
            }
        });
    }

    // Gestión de Difuntos
    async loadDifuntos() {
        try {
            this.showLoading('difuntos-table-container');
            const difuntos = await window.electronAPI.getDifuntos();
            this.renderDifuntosTable(difuntos);
        } catch (error) {
            console.error('Error cargando difuntos:', error);
            this.showNotification('Error al cargar los difuntos', 'error');
        } finally {
            this.hideLoading('difuntos-table-container');
        }
    }

    renderDifuntosTable(difuntos) {
        const tableBody = document.querySelector('#difuntos-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        difuntos.forEach(difunto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${difunto.id}</td>
                <td>${difunto.nombre} ${difunto.apellidos}</td>
                <td>${this.formatDate(difunto.fecha_nacimiento)}</td>
                <td>${this.formatDate(difunto.fecha_defuncion)}</td>
                <td>${difunto.parcela_numero || 'Sin asignar'}</td>
                <td><span class="status ${difunto.estado}">${difunto.estado}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="app.editDifunto(${difunto.id})">
                        Editar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteDifunto(${difunto.id})">
                        Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Gestión de Parcelas
    async loadParcelas() {
        try {
            this.showLoading('parcelas-table-container');
            const parcelas = await window.electronAPI.getParcelas();
            this.renderParcelasTable(parcelas);
        } catch (error) {
            console.error('Error cargando parcelas:', error);
            this.showNotification('Error al cargar las parcelas', 'error');
        } finally {
            this.hideLoading('parcelas-table-container');
        }
    }

    renderParcelasTable(parcelas) {
        const tableBody = document.querySelector('#parcelas-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        parcelas.forEach(parcela => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parcela.numero}</td>
                <td>${parcela.tipo}</td>
                <td>${parcela.ubicacion || 'N/A'}</td>
                <td><span class="status ${parcela.estado}">${parcela.estado}</span></td>
                <td>${parcela.precio ? '$' + parcela.precio.toFixed(2) : 'N/A'}</td>
                <td class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="app.editParcela(${parcela.id})">
                        Editar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteParcela(${parcela.id})">
                        Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Modales
    bindModalEvents() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            const cancelBtn = modal.querySelector('.btn-secondary');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal.id));
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeModal(modal.id));
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Botones para abrir modales
        document.getElementById('btn-nuevo-difunto')?.addEventListener('click', () => {
            this.openModal('modal-difunto');
        });

        document.getElementById('btn-nueva-parcela')?.addEventListener('click', () => {
            this.openModal('modal-parcela');
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.resetForm(modal);
        }
    }

    resetForm(modal) {
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            // Limpiar cualquier error de validación
            form.querySelectorAll('.error').forEach(el => el.remove());
        }
    }

    // Formularios
    bindFormEvents() {
        const formDifunto = document.getElementById('form-difunto');
        const formParcela = document.getElementById('form-parcela');

        if (formDifunto) {
            formDifunto.addEventListener('submit', (e) => this.handleDifuntoSubmit(e));
        }

        if (formParcela) {
            formParcela.addEventListener('submit', (e) => this.handleParcelaSubmit(e));
        }
    }

    async handleDifuntoSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const difuntoData = {
            nombre: formData.get('nombre'),
            apellidos: formData.get('apellidos'),
            fecha_nacimiento: formData.get('fecha_nacimiento'),
            fecha_defuncion: formData.get('fecha_defuncion'),
            lugar_nacimiento: formData.get('lugar_nacimiento'),
            causa_muerte: formData.get('causa_muerte'),
            observaciones: formData.get('observaciones')
        };

        try {
            await window.electronAPI.createDifunto(difuntoData);
            this.showNotification('Difunto registrado correctamente', 'success');
            this.closeModal('modal-difunto');
            if (this.currentSection === 'difuntos') {
                await this.loadDifuntos();
            }
            await this.loadDashboard(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error creando difunto:', error);
            this.showNotification('Error al registrar el difunto: ' + error.message, 'error');
        }
    }

    async handleParcelaSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const parcelaData = {
            numero: formData.get('numero'),
            tipo: formData.get('tipo'),
            ubicacion: formData.get('ubicacion'),
            precio: parseFloat(formData.get('precio')) || 0,
            observaciones: formData.get('observaciones')
        };

        try {
            await window.electronAPI.createParcela(parcelaData);
            this.showNotification('Parcela creada correctamente', 'success');
            this.closeModal('modal-parcela');
            if (this.currentSection === 'parcelas') {
                await this.loadParcelas();
            }
            await this.loadDashboard(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error creando parcela:', error);
            this.showNotification('Error al crear la parcela: ' + error.message, 'error');
        }
    }

    // Búsqueda
    bindSearchEvents() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-general');

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                if (e.target.value.length >= 3) {
                    this.performQuickSearch(e.target.value);
                }
            }, 300));
        }
    }

    async handleSearch(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const searchData = {
            nombre: formData.get('search-nombre'),
            apellidos: formData.get('search-apellidos'),
            fecha_desde: formData.get('search-fecha-desde'),
            fecha_hasta: formData.get('search-fecha-hasta'),
            parcela: formData.get('search-parcela'),
            estado: formData.get('search-estado')
        };

        try {
            this.showLoading('search-results');
            const results = await window.electronAPI.searchDifuntos(searchData);
            this.renderSearchResults(results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showNotification('Error en la búsqueda: ' + error.message, 'error');
        } finally {
            this.hideLoading('search-results');
        }
    }

    async performQuickSearch(query) {
        try {
            const results = await window.electronAPI.searchDifuntos({ general: query });
            this.renderSearchResults(results);
        } catch (error) {
            console.error('Error en búsqueda rápida:', error);
        }
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<p class="empty">No se encontraron resultados</p>';
            container.className = 'search-results empty';
            return;
        }

        container.className = 'search-results';
        container.innerHTML = `
            <table class="records-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Fecha Defunción</th>
                        <th>Parcela</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr>
                            <td>${result.id}</td>
                            <td>${result.nombre} ${result.apellidos}</td>
                            <td>${this.formatDate(result.fecha_defuncion)}</td>
                            <td>${result.parcela_numero || 'Sin asignar'}</td>
                            <td><span class="status ${result.estado}">${result.estado}</span></td>
                            <td class="action-buttons">
                                <button class="btn btn-small btn-primary" onclick="app.viewDifunto(${result.id})">
                                    Ver
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Operaciones CRUD
    async editDifunto(id) {
        try {
            const difunto = await window.electronAPI.getDifunto(id);
            this.populateDifuntoForm(difunto);
            this.openModal('modal-difunto');
        } catch (error) {
            this.showNotification('Error al cargar los datos del difunto', 'error');
        }
    }

    async deleteDifunto(id) {
        if (confirm('¿Está seguro de que desea eliminar este registro?')) {
            try {
                await window.electronAPI.deleteDifunto(id);
                this.showNotification('Registro eliminado correctamente', 'success');
                await this.loadDifuntos();
                await this.loadDashboard();
            } catch (error) {
                this.showNotification('Error al eliminar el registro', 'error');
            }
        }
    }

    async editParcela(id) {
        try {
            const parcela = await window.electronAPI.getParcela(id);
            this.populateParcelaForm(parcela);
            this.openModal('modal-parcela');
        } catch (error) {
            this.showNotification('Error al cargar los datos de la parcela', 'error');
        }
    }

    async deleteParcela(id) {
        if (confirm('¿Está seguro de que desea eliminar esta parcela?')) {
            try {
                await window.electronAPI.deleteParcela(id);
                this.showNotification('Parcela eliminada correctamente', 'success');
                await this.loadParcelas();
                await this.loadDashboard();
            } catch (error) {
                this.showNotification('Error al eliminar la parcela', 'error');
            }
        }
    }

    populateDifuntoForm(difunto) {
        const form = document.getElementById('form-difunto');
        if (!form) return;

        form.querySelector('[name="nombre"]').value = difunto.nombre || '';
        form.querySelector('[name="apellidos"]').value = difunto.apellidos || '';
        form.querySelector('[name="fecha_nacimiento"]').value = difunto.fecha_nacimiento || '';
        form.querySelector('[name="fecha_defuncion"]').value = difunto.fecha_defuncion || '';
        form.querySelector('[name="lugar_nacimiento"]').value = difunto.lugar_nacimiento || '';
        form.querySelector('[name="causa_muerte"]').value = difunto.causa_muerte || '';
        form.querySelector('[name="observaciones"]').value = difunto.observaciones || '';
        
        form.dataset.editId = difunto.id;
    }

    populateParcelaForm(parcela) {
        const form = document.getElementById('form-parcela');
        if (!form) return;

        form.querySelector('[name="numero"]').value = parcela.numero || '';
        form.querySelector('[name="tipo"]').value = parcela.tipo || '';
        form.querySelector('[name="ubicacion"]').value = parcela.ubicacion || '';
        form.querySelector('[name="precio"]').value = parcela.precio || '';
        form.querySelector('[name="observaciones"]').value = parcela.observaciones || '';
        
        form.dataset.editId = parcela.id;
    }

    // Utilidades
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('loading');
        }
    }

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CementerioApp();
});
