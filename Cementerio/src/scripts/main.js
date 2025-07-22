// Gestión de Cementerio - Frontend
class CementerioApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchFilters = {};
        this.init();
    }

    // Nueva función con emoji correcto
    getActivityIconFixed(tipo) {
        const icons = {
            'difunto': '👤',
            'parcela': '🏛️',
            'sistema': '⚙️',
            'backup': '💾',
            'optimizacion': '⚡'
        };
        return icons[tipo] || '📝';
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
                case 'configuracion':
                    await this.loadConfigurationInfo();
                    break;
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
            
            // Cargar actividad reciente
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showNotification('Error al cargar las estadísticas', 'error');
        }
    }

    async loadRecentActivity() {
        try {
            const recentActivity = await window.electronAPI.getRecentActivity(8);
            this.updateRecentActivity(recentActivity);
        } catch (error) {
            console.error('Error cargando actividad reciente:', error);
            // Mostrar mensaje por defecto si hay error
            this.updateRecentActivity([]);
        }
    }

    updateRecentActivity(activities) {
        const recentList = document.getElementById('recentList');
        if (!recentList) return;

        if (!activities || activities.length === 0) {
            recentList.innerHTML = `
                <div class="no-activity">
                    <div class="activity-icon">📝</div>
                    <p>No hay actividad reciente para mostrar.</p>
                    <small>Las nuevas acciones aparecerán aquí.</small>
                </div>
            `;
            return;
        }

        const activitiesHtml = activities.map(activity => {
            const icon = this.getActivityIconFixed(activity.tipo);
            const actionClass = this.getActivityClass(activity.tipo);
            const badge = this.getActivityBadge(activity.tipo);
            
            return `
                <div class="activity-item ${actionClass}">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.accion}</div>
                        <div class="activity-description">${activity.descripcion}</div>
                    </div>
                    <div class="activity-meta">
                        <div class="activity-badge">${badge}</div>
                        <div class="activity-time">${activity.fecha}</div>
                    </div>
                </div>
            `;
        }).join('');

        recentList.innerHTML = `
            <div class="activity-header">
                <span>📊 Actividad Reciente</span>
                <button class="refresh-activity" onclick="app.loadRecentActivity()" title="Actualizar">
                    ↻ Actualizar
                </button>
            </div>
            ${activitiesHtml}
        `;
    }

    getActivityIcon(tipo) {
        const icons = {
            'difunto': '👤',
            'parcela': '�',
            'sistema': '⚙️',
            'backup': '💾',
            'optimizacion': '⚡'
        };
        return icons[tipo] || '📝';
    }

    getActivityClass(tipo) {
        const classes = {
            'difunto': 'activity-difunto',
            'parcela': 'activity-parcela',
            'sistema': 'activity-sistema',
            'backup': 'activity-backup',
            'optimizacion': 'activity-optimize'
        };
        return classes[tipo] || 'activity-default';
    }

    getActivityBadge(tipo) {
        const badges = {
            'difunto': 'Persona',
            'parcela': 'Parcela',
            'sistema': 'Sistema',
            'backup': 'Respaldo',
            'optimizacion': 'Optimizado'
        };
        return badges[tipo] || 'Acción';
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
                <td><strong>${parcela.codigo}</strong></td>
                <td><span class="badge badge-${parcela.tipo}">${parcela.tipo}</span></td>
                <td><span class="badge badge-zona-${parcela.zona?.toLowerCase()}">${parcela.zona || 'N/A'}</span></td>
                <td>${parcela.seccion}-${parcela.fila || 'S'}-${parcela.numero}</td>
                <td><span class="badge badge-ubicacion">${parcela.ubicacion || 'N/A'}</span></td>
                <td><span class="status ${parcela.estado}">${parcela.estado}</span></td>
                <td>${parcela.precio ? '$' + parcela.precio.toFixed(2) : 'N/A'}</td>
                <td class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="app.editParcela(${parcela.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteParcela(${parcela.id})">
                        🗑️ Eliminar
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
            // Limpiar modo edición
            const form = document.getElementById('form-difunto');
            if (form) {
                delete form.dataset.editingId;
                form.reset();
            }
            
            // Restaurar título del modal
            const modalTitle = document.querySelector('#modal-difunto .modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Nuevo Difunto';
            
            this.openModal('modal-difunto');
        });

        document.getElementById('btn-nueva-parcela')?.addEventListener('click', () => {
            // Limpiar modo edición para parcelas también
            const form = document.getElementById('form-parcela');
            if (form) {
                delete form.dataset.editingId;
                form.reset();
            }
            
            // Restaurar título del modal
            const modalTitle = document.querySelector('#modal-parcela .modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Nueva Parcela';
            
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
            cedula: formData.get('documento'),
            sexo: formData.get('sexo') || 'M', // Valor por defecto si no se selecciona
            lugar_nacimiento: formData.get('lugar_nacimiento'),
            causa_muerte: formData.get('causa_muerte'),
            observaciones: formData.get('observaciones')
        };

        try {
            const editingId = e.target.dataset.editingId;
            
            if (editingId) {
                // Actualizar difunto existente
                await window.electronAPI.updateDifunto(editingId, difuntoData);
                this.showNotification('Difunto actualizado correctamente', 'success');
            } else {
                // Crear nuevo difunto
                await window.electronAPI.createDifunto(difuntoData);
                this.showNotification('Difunto registrado correctamente', 'success');
            }
            
            this.closeModal('modal-difunto');
            if (this.currentSection === 'difuntos') {
                await this.loadDifuntos();
            }
            await this.loadDashboard(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error procesando difunto:', error);
            this.showNotification('Error al procesar el difunto: ' + error.message, 'error');
        }
    }

    async handleParcelaSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const parcelaData = {
            codigo: formData.get('codigo'),
            tipo: formData.get('tipo'),
            zona: formData.get('zona'),
            seccion: formData.get('seccion'),
            fila: parseInt(formData.get('fila')) || null,
            numero: parseInt(formData.get('numero')),
            ubicacion: formData.get('ubicacion'),
            precio: parseFloat(formData.get('precio')) || 0,
            observaciones: formData.get('observaciones')
        };

        try {
            const editingId = e.target.dataset.editingId;
            
            if (editingId) {
                // Actualizar parcela existente
                await window.electronAPI.updateParcela(editingId, parcelaData);
                this.showNotification('✅ Parcela actualizada correctamente', 'success');
            } else {
                // Crear nueva parcela
                await window.electronAPI.createParcela(parcelaData);
                this.showNotification('✅ Parcela creada correctamente', 'success');
            }
            
            this.closeModal('modal-parcela');
            if (this.currentSection === 'parcelas') {
                await this.loadParcelas();
            }
            await this.loadDashboard(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error procesando parcela:', error);
            this.showNotification('❌ Error al procesar la parcela: ' + error.message, 'error');
        }
    }

    // Búsqueda
    bindSearchEvents() {
        const searchForm = document.getElementById('search-form');

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }
    }

    async handleSearch(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const searchData = {
            nombre: formData.get('search-nombre'),
            apellidos: formData.get('search-apellidos'),
            fecha_desde: formData.get('search-fecha-desde'),
            fecha_hasta: formData.get('search-fecha-hasta')
        };

        // Solo buscar si hay al menos un campo con datos
        const hasSearchData = Object.values(searchData).some(value => value && value.trim() !== '');
        
        if (!hasSearchData) {
            this.showNotification('Por favor, ingrese al menos un criterio de búsqueda', 'info');
            return;
        }

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
                            <td>${result.parcela_codigo || 'Sin asignar'}</td>
                            <td><span class="status ${result.estado}">${result.estado}</span></td>
                            <td class="action-buttons">
                                <button class="btn btn-small btn-primary" onclick="app.editDifunto(${result.id})">
                                    ✏️ Editar
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
            
            // Marcar el formulario como en modo edición
            const form = document.getElementById('form-difunto');
            form.dataset.editingId = id;
            
            // Cambiar el título del modal
            const modalTitle = document.querySelector('#modal-difunto .modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Editar Difunto';
            
            this.openModal('modal-difunto');
        } catch (error) {
            console.error('Error editando difunto:', error);
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
            
            // Marcar el formulario como en modo edición
            const form = document.getElementById('form-parcela');
            form.dataset.editingId = id;
            
            // Cambiar el título del modal
            const modalTitle = document.querySelector('#modal-parcela .modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Editar Parcela';
            
            this.openModal('modal-parcela');
        } catch (error) {
            console.error('Error editando parcela:', error);
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

        form.querySelector('[name="codigo"]').value = parcela.codigo || '';
        form.querySelector('[name="tipo"]').value = parcela.tipo || '';
        form.querySelector('[name="zona"]').value = parcela.zona || 'Nueva';
        form.querySelector('[name="seccion"]').value = parcela.seccion || '';
        form.querySelector('[name="fila"]').value = parcela.fila || '';
        form.querySelector('[name="numero"]').value = parcela.numero || '';
        form.querySelector('[name="ubicacion"]').value = parcela.ubicacion || 'Centro';
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

    // Funciones de configuración
    
    // Helper para crear diálogos personalizados
    showCustomDialog(config) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'custom-dialog-overlay';
            
            let buttonsHtml = '';
            if (config.buttons) {
                buttonsHtml = config.buttons.map(btn => 
                    `<button id="${btn.id}" class="btn ${btn.class}">${btn.text}</button>`
                ).join('');
            } else {
                buttonsHtml = `<button id="btn-ok" class="btn btn-primary">✅ Aceptar</button>`;
            }

            dialog.innerHTML = `
                <div class="custom-dialog ${config.type === 'info' ? 'info-dialog' : ''}">
                    <div class="dialog-header ${config.headerClass || ''}">
                        <h3>${config.title}</h3>
                    </div>
                    <div class="dialog-content">
                        <div class="dialog-message">${config.message}</div>
                        <div class="dialog-buttons">
                            ${buttonsHtml}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // Agregar event listeners
            if (config.buttons) {
                config.buttons.forEach(btn => {
                    dialog.querySelector(`#${btn.id}`).addEventListener('click', () => {
                        document.body.removeChild(dialog);
                        resolve(btn.value || btn.id);
                    });
                });
            } else {
                dialog.querySelector('#btn-ok').addEventListener('click', () => {
                    document.body.removeChild(dialog);
                    resolve('ok');
                });
            }

            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(dialog);
                    document.removeEventListener('keydown', handleEscape);
                    resolve('cancel');
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Cerrar al hacer clic fuera del diálogo (solo si no es crítico)
            if (!config.critical) {
                dialog.addEventListener('click', (e) => {
                    if (e.target === dialog) {
                        document.body.removeChild(dialog);
                        resolve('cancel');
                    }
                });
            }
        });
    }

    showBackupDialog() {
        return new Promise((resolve) => {
            // Crear un diálogo personalizado
            const dialog = document.createElement('div');
            dialog.className = 'custom-dialog-overlay';
            dialog.innerHTML = `
                <div class="custom-dialog">
                    <div class="dialog-header">
                        <h3>🗃️ Respaldar Base de Datos</h3>
                    </div>
                    <div class="dialog-content">
                        <p>¿Dónde desea guardar el respaldo de la base de datos?</p>
                        <div class="dialog-buttons">
                            <button id="btn-custom-folder" class="btn btn-primary">
                                📁 Seleccionar Carpeta
                            </button>
                            <button id="btn-default-folder" class="btn btn-secondary">
                                🏠 Carpeta por Defecto
                            </button>
                            <button id="btn-cancel-backup" class="btn btn-danger">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // Agregar event listeners
            dialog.querySelector('#btn-custom-folder').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve('custom');
            });

            dialog.querySelector('#btn-default-folder').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve('default');
            });

            dialog.querySelector('#btn-cancel-backup').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve('cancel');
            });

            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(dialog);
                    document.removeEventListener('keydown', handleEscape);
                    resolve('cancel');
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Cerrar al hacer clic fuera del diálogo
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    document.body.removeChild(dialog);
                    resolve('cancel');
                }
            });
        });
    }

    async backupDatabase() {
        try {
            // Mostrar diálogo personalizado con tres opciones
            const userChoice = await this.showBackupDialog();
            
            if (userChoice === 'cancel') {
                this.showNotification('Operación de respaldo cancelada', 'info');
                return;
            }
            
            let customPath = null;
            
            if (userChoice === 'custom') {
                // Mostrar diálogo de selección de carpeta
                const folderResult = await window.electronAPI.selectBackupFolder();
                
                if (folderResult.error) {
                    throw new Error(folderResult.error);
                }
                
                if (folderResult.canceled) {
                    this.showNotification('Selección de carpeta cancelada', 'info');
                    return;
                }
                
                if (folderResult.success) {
                    customPath = folderResult.folderPath;
                }
            }
            
            this.showNotification('Iniciando respaldo de base de datos...', 'info');
            
            const result = await window.electronAPI.backupDatabase(customPath);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            if (result.success) {
                const locationText = result.customPath ? 
                    'Ubicación personalizada' : 
                    'Carpeta por defecto (backups/)';
                
                const message = `Respaldo creado exitosamente\n\n` +
                              `Archivo: ${result.fileName}\n` +
                              `Tamaño: ${result.size}\n` +
                              `Ubicación: ${locationText}\n` +
                              `Ruta completa: ${result.backupPath}\n` +
                              `Fecha: ${result.date}`;
                
                this.showNotification('Respaldo completado exitosamente', 'success');
                
                // Mostrar información detallada en diálogo personalizado
                setTimeout(() => {
                    this.showCustomDialog({
                        title: '🎉 Respaldo Exitoso',
                        message: `
                            <div class="success-message">
                                <div class="success-icon">✅</div>
                                <h4>¡Respaldo creado exitosamente!</h4>
                                <div class="backup-details">
                                    <div class="detail-item">
                                        <strong>📄 Archivo:</strong> ${result.fileName}
                                    </div>
                                    <div class="detail-item">
                                        <strong>📊 Tamaño:</strong> ${result.size}
                                    </div>
                                    <div class="detail-item">
                                        <strong>📍 Ubicación:</strong> ${locationText}
                                    </div>
                                    <div class="detail-item">
                                        <strong>🗂️ Ruta completa:</strong> <code>${result.backupPath}</code>
                                    </div>
                                    <div class="detail-item">
                                        <strong>🕒 Fecha:</strong> ${result.date}
                                    </div>
                                </div>
                            </div>
                        `,
                        headerClass: 'success-header',
                        type: 'info'
                    });
                }, 500);
            }
        } catch (error) {
            console.error('Error al crear respaldo:', error);
            this.showNotification('Error al crear el respaldo: ' + error.message, 'error');
        }
    }

    async optimizeDatabase() {
        try {
            this.showNotification('Optimizando base de datos...', 'info');
            
            const result = await window.electronAPI.optimizeDatabase();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            if (result.success) {
                const message = `Optimización completada\n` +
                              `Operaciones realizadas:\n${result.results.join('\n')}\n` +
                              `Tiempo de ejecución: ${result.executionTime}\n` +
                              `Fecha: ${result.date}`;
                
                this.showNotification('Base de datos optimizada correctamente', 'success');
                
                // Mostrar información detallada en diálogo personalizado
                setTimeout(() => {
                    this.showCustomDialog({
                        title: '⚡ Optimización Completada',
                        message: `
                            <div class="success-message">
                                <div class="success-icon">🚀</div>
                                <h4>¡Base de datos optimizada correctamente!</h4>
                                <div class="optimization-details">
                                    <div class="detail-item">
                                        <strong>⏱️ Tiempo de ejecución:</strong> ${result.executionTime}
                                    </div>
                                    <div class="detail-item">
                                        <strong>🔧 Operaciones realizadas:</strong>
                                        <ul class="operations-list">
                                            ${result.results.map(op => `<li>✓ ${op}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="detail-item">
                                        <strong>🕒 Fecha:</strong> ${result.date}
                                    </div>
                                </div>
                                <div class="optimization-benefits">
                                    <small>💡 <strong>Beneficios:</strong> Mejor rendimiento, menor uso de espacio y consultas más rápidas.</small>
                                </div>
                            </div>
                        `,
                        headerClass: 'success-header',
                        type: 'info'
                    });
                }, 500);
            }
        } catch (error) {
            console.error('Error al optimizar:', error);
            this.showNotification('Error al optimizar: ' + error.message, 'error');
        }
    }

    savePreferences() {
        try {
            const theme = document.getElementById('theme-select').value;
            const recordsPerPage = document.getElementById('records-per-page').value;
            
            // Guardar en localStorage
            localStorage.setItem('cementerio-theme', theme);
            localStorage.setItem('cementerio-records-per-page', recordsPerPage);
            
            this.showNotification('Preferencias guardadas correctamente', 'success');
            
            // Mostrar confirmación con diálogo personalizado
            setTimeout(() => {
                this.showCustomDialog({
                    title: '💾 Preferencias Guardadas',
                    message: `
                        <div class="success-message">
                            <div class="success-icon">✅</div>
                            <h4>¡Preferencias guardadas exitosamente!</h4>
                            <div class="preferences-details">
                                <div class="detail-item">
                                    <strong>🎨 Tema seleccionado:</strong> ${this.getThemeDisplayName(theme)}
                                </div>
                                <div class="detail-item">
                                    <strong>📄 Registros por página:</strong> ${recordsPerPage}
                                </div>
                            </div>
                            <div class="preferences-note">
                                <small>💡 <strong>Nota:</strong> Los cambios se aplicarán en la próxima sesión o al recargar la aplicación.</small>
                            </div>
                        </div>
                    `,
                    headerClass: 'success-header',
                    type: 'info'
                });
            }, 500);
        } catch (error) {
            this.showNotification('Error al guardar preferencias: ' + error.message, 'error');
        }
    }

    getThemeDisplayName(theme) {
        const themes = {
            'light': '☀️ Claro',
            'dark': '🌙 Oscuro',
            'auto': '🔄 Automático'
        };
        return themes[theme] || theme;
    }

    async resetPreferences() {
        const userChoice = await this.showCustomDialog({
            title: '🔄 Restaurar Configuraciones',
            message: `
                <div class="warning-message">
                    <div class="warning-icon">⚠️</div>
                    <h4>¿Restaurar configuraciones predeterminadas?</h4>
                    <p>Esta acción restaurará todas las preferencias a sus valores originales:</p>
                    <div class="reset-details">
                        <div class="detail-item">• <strong>Tema:</strong> Claro</div>
                        <div class="detail-item">• <strong>Registros por página:</strong> 50</div>
                    </div>
                    <p><strong>Esta acción no se puede deshacer.</strong></p>
                </div>
            `,
            headerClass: 'warning-header',
            buttons: [
                { id: 'btn-confirm', class: 'btn-primary', text: '✅ Confirmar', value: 'confirm' },
                { id: 'btn-cancel', class: 'btn-secondary', text: '❌ Cancelar', value: 'cancel' }
            ]
        });

        if (userChoice === 'confirm') {
            try {
                // Limpiar localStorage
                localStorage.removeItem('cementerio-theme');
                localStorage.removeItem('cementerio-records-per-page');
                
                // Restaurar valores predeterminados
                document.getElementById('theme-select').value = 'light';
                document.getElementById('records-per-page').value = '50';
                
                this.showNotification('Configuraciones restauradas a valores predeterminados', 'success');
                
                // Mostrar confirmación
                setTimeout(() => {
                    this.showCustomDialog({
                        title: '🔄 Configuraciones Restauradas',
                        message: `
                            <div class="success-message">
                                <div class="success-icon">✅</div>
                                <h4>¡Configuraciones restauradas exitosamente!</h4>
                                <p>Todas las preferencias han sido restablecidas a sus valores predeterminados.</p>
                                <div class="reset-confirmation">
                                    <div class="detail-item">✓ <strong>Tema:</strong> ☀️ Claro</div>
                                    <div class="detail-item">✓ <strong>Registros por página:</strong> 50</div>
                                </div>
                            </div>
                        `,
                        headerClass: 'success-header',
                        type: 'info'
                    });
                }, 500);
            } catch (error) {
                this.showNotification('Error al restaurar configuraciones: ' + error.message, 'error');
            }
        }
    }

    showAbout() {
        this.showCustomDialog({
            title: '🏛️ Acerca del Sistema',
            message: `
                <div class="about-dialog">
                    <div class="app-info">
                        <h2>🏛️ Sistema de Gestión de Cementerio</h2>
                        <div class="version-info">
                            <span class="version-badge">v1.0.0</span>
                            <span class="tech-stack">Electron + Node.js + SQLite</span>
                        </div>
                    </div>
                    
                    <div class="developer-info">
                        <h3>👨‍💻 Información del Desarrollador</h3>
                        <div class="developer-card">
                            <div class="developer-name">
                                <strong>Alejandro Pastor Mayor</strong>
                            </div>
                            <div class="contact-info">
                                <div class="contact-item">
                                    <span class="contact-icon">📞</span>
                                    <span>683 132 931</span>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">🇪🇸</span>
                                    <span>España</span>
                                </div>
                                <div class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <span>Desarrollador de Software</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="features-info">
                        <h3>⚡ Funcionalidades Principales</h3>
                        <div class="features-grid">
                            <div class="feature-item">
                                <span class="feature-icon">👥</span>
                                <span>Gestión de Difuntos</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🏞️</span>
                                <span>Administración de Parcelas</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🔍</span>
                                <span>Búsqueda Avanzada</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">💾</span>
                                <span>Respaldo de Datos</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">⚡</span>
                                <span>Optimización de BD</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">📊</span>
                                <span>Reportes y Estadísticas</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="copyright-info">
                        <p>© 2025 Alejandro Pastor Mayor. Todos los derechos reservados.</p>
                        <p class="description">Sistema integral para la administración profesional de cementerios y registro de difuntos.</p>
                    </div>
                </div>
            `,
            headerClass: 'about-header',
            type: 'info'
        });
    }

    async loadConfigurationInfo() {
        try {
            // Cargar información del sistema si la sección está activa
            if (this.currentSection === 'configuracion') {
                document.getElementById('app-version').textContent = '1.0.0';
                document.getElementById('platform').textContent = navigator.platform;
                document.getElementById('electron-version').textContent = 'Cargando...';
                
                // Obtener tamaño real de la base de datos
                try {
                    const dbInfo = await window.electronAPI.getDatabaseSize();
                    if (dbInfo.success) {
                        const displaySize = dbInfo.fileSize.mb;
                        document.getElementById('db-size').textContent = displaySize;
                        
                        // Agregar tooltip con información detallada
                        const dbElement = document.getElementById('db-size');
                        if (dbElement) {
                            dbElement.title = `Espacio usado: ${dbInfo.database.usedSpace}\n` +
                                            `Espacio libre: ${dbInfo.database.freeSpace}\n` +
                                            `Páginas totales: ${dbInfo.database.totalPages}\n` +
                                            `Última modificación: ${dbInfo.lastModified}`;
                        }
                    } else {
                        document.getElementById('db-size').textContent = 'Error al obtener';
                    }
                } catch (error) {
                    console.error('Error obteniendo tamaño de BD:', error);
                    document.getElementById('db-size').textContent = 'No disponible';
                }
                
                // Cargar preferencias guardadas
                const savedTheme = localStorage.getItem('cementerio-theme') || 'light';
                const savedRecordsPerPage = localStorage.getItem('cementerio-records-per-page') || '50';
                
                document.getElementById('theme-select').value = savedTheme;
                document.getElementById('records-per-page').value = savedRecordsPerPage;
            }
        } catch (error) {
            console.error('Error cargando información de configuración:', error);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CementerioApp();
});
