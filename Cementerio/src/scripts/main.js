// Gestión de Cementerio - Frontend
class CementerioApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchFilters = {};
        this.currentSortColumn = null;
        this.currentSortDirection = 'asc';
        this.originalData = {}; // Para almacenar datos originales sin ordenar
        this.lastSearchData = null; // Para almacenar la última búsqueda realizada
        this.init();
    }

    async init() {
        this.bindNavigationEvents();
        this.bindModalEvents();
        this.bindFormEvents();
        this.bindSearchEvents();
        this.bindTableSortEvents();
        
        // Inicializar ciudades populares
        this.inicializarCiudadesPopulares();
        
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
                    // Siempre actualizar dashboard al navegar a él
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
            }
        } catch (error) {
            this.showNotification('Error al cargar los datos: ' + error.message, 'error');
        }
    }

    // Dashboard
    async loadDashboard() {
        try {
            // Mostrar indicadores de carga en las estadísticas
            this.showDashboardLoading(true);
            
            const stats = await window.electronAPI.getEstadisticas();
            this.updateDashboardStats(stats);
            
            // Cargar actividad reciente
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showNotification('Error al cargar las estadísticas', 'error');
        } finally {
            this.showDashboardLoading(false);
        }
    }

    // Mostrar/ocultar indicadores de carga en el dashboard
    showDashboardLoading(show) {
        const statsCards = ['total-difuntos', 'total-parcelas', 'parcelas-ocupadas', 'parcelas-disponibles'];
        
        statsCards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                if (show) {
                    card.textContent = '⟳';
                    card.style.opacity = '0.6';
                } else {
                    card.style.opacity = '1';
                }
            }
        });
    }

    async loadRecentActivity(showNotification = false) {
        try {
            // Mostrar animación de carga en el botón
            const refreshButton = document.querySelector('.refresh-activity');
            if (refreshButton && showNotification) {
                refreshButton.innerHTML = '⟳ Actualizando...';
                refreshButton.disabled = true;
                refreshButton.style.opacity = '0.6';
            }

            const recentActivity = await window.electronAPI.getRecentActivity(8);
            this.updateRecentActivity(recentActivity);

            // Mostrar notificación de éxito si se solicitó
            if (showNotification) {
                this.showNotification('✅ Actividad reciente actualizada', 'success');
                
                // Indicador visual temporal en el header
                const activityHeader = document.querySelector('.activity-header span');
                if (activityHeader) {
                    const originalText = activityHeader.textContent;
                    activityHeader.textContent = '✨ Actividad Actualizada';
                    activityHeader.style.color = '#28a745';
                    
                    // Restaurar después de 2 segundos
                    setTimeout(() => {
                        activityHeader.textContent = originalText;
                        activityHeader.style.color = '';
                    }, 2000);
                }
            }

            // Restaurar botón
            if (refreshButton && showNotification) {
                setTimeout(() => {
                    refreshButton.innerHTML = '↻ Actualizar';
                    refreshButton.disabled = false;
                    refreshButton.style.opacity = '1';
                }, 500);
            }

        } catch (error) {
            console.error('Error cargando actividad reciente:', error);
            
            if (showNotification) {
                this.showNotification('❌ Error al actualizar actividad reciente', 'error');
            }
            
            // Restaurar botón en caso de error
            const refreshButton = document.querySelector('.refresh-activity');
            if (refreshButton && showNotification) {
                refreshButton.innerHTML = '↻ Actualizar';
                refreshButton.disabled = false;
                refreshButton.style.opacity = '1';
            }
            
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
            const icon = this.getActivityIcon(activity.tipo);
            const actionClass = this.getActivityActionClass(activity.accion, activity.tipo);
            const badge = this.getActivityBadge(activity.tipo);
            
            return `
                <div class="activity-item ${actionClass}">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.descripcion}</div>
                        <div class="activity-action">${activity.accion}</div>
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
                <button class="refresh-activity" onclick="app.loadRecentActivity(true)" title="Actualizar">
                    ↻ Actualizar
                </button>
            </div>
            ${activitiesHtml}
        `;
    }

    getActivityIcon(tipo) {
        const icons = {
            'difunto': '👤',
            'parcela': '🏛️',
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

    getActivityActionClass(accion, tipo) {
        // Determinar color basado en la acción
        if (accion === 'Eliminado' || accion === 'Eliminada') {
            return 'activity-deleted';
        } else if (accion === 'Modificado' || accion === 'Modificada') {
            return 'activity-modified';
        } else if (accion === 'Nuevo registro' || accion === 'Nueva parcela') {
            return 'activity-created';
        }
        
        // Fallback a la clase basada en tipo
        return this.getActivityClass(tipo);
    }

    getActivityBadge(tipo) {
        const badges = {
            'difunto': 'Difunto',
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

        // Hacer clickeables las tarjetas de estadísticas
        this.makeStatsCardsClickable();
    }

    makeStatsCardsClickable() {
        // Tarjeta de Total Difuntos -> Sección Difuntos
        const totalDifuntosCard = document.getElementById('total-difuntos');
        if (totalDifuntosCard && totalDifuntosCard.parentElement) {
            const cardContainer = totalDifuntosCard.parentElement;
            cardContainer.style.cursor = 'pointer';
            cardContainer.title = 'Haz clic para ver todos los difuntos';
            
            // Remover event listeners previos
            cardContainer.replaceWith(cardContainer.cloneNode(true));
            const newCardContainer = document.getElementById('total-difuntos').parentElement;
            
            newCardContainer.addEventListener('click', () => {
                this.showSection('difuntos');
            });
        }

        // Tarjeta de Total Parcelas -> Sección Parcelas
        const totalParcelasCard = document.getElementById('total-parcelas');
        if (totalParcelasCard && totalParcelasCard.parentElement) {
            const cardContainer = totalParcelasCard.parentElement;
            cardContainer.style.cursor = 'pointer';
            cardContainer.title = 'Haz clic para ver todas las parcelas';
            
            cardContainer.replaceWith(cardContainer.cloneNode(true));
            const newCardContainer = document.getElementById('total-parcelas').parentElement;
            
            newCardContainer.addEventListener('click', () => {
                this.showSection('parcelas');
            });
        }

        // Tarjeta de Parcelas Ocupadas -> Sección Parcelas
        const parcelasOcupadasCard = document.getElementById('parcelas-ocupadas');
        if (parcelasOcupadasCard && parcelasOcupadasCard.parentElement) {
            const cardContainer = parcelasOcupadasCard.parentElement;
            cardContainer.style.cursor = 'pointer';
            cardContainer.title = 'Haz clic para ver las parcelas ocupadas';
            
            cardContainer.replaceWith(cardContainer.cloneNode(true));
            const newCardContainer = document.getElementById('parcelas-ocupadas').parentElement;
            
            newCardContainer.addEventListener('click', () => {
                this.showSection('parcelas');
            });
        }

        // Tarjeta de Parcelas Disponibles -> Sección Parcelas
        const parcelasDisponiblesCard = document.getElementById('parcelas-disponibles');
        if (parcelasDisponiblesCard && parcelasDisponiblesCard.parentElement) {
            const cardContainer = parcelasDisponiblesCard.parentElement;
            cardContainer.style.cursor = 'pointer';
            cardContainer.title = 'Haz clic para ver las parcelas disponibles';
            
            cardContainer.replaceWith(cardContainer.cloneNode(true));
            const newCardContainer = document.getElementById('parcelas-disponibles').parentElement;
            
            newCardContainer.addEventListener('click', () => {
                this.showSection('parcelas');
            });
        }
    }

    // Gestión de Difuntos
    async loadDifuntos() {
        try {
            this.showLoading('difuntos-table-container');
            const difuntos = await window.electronAPI.getDifuntos();
            this.originalData.difuntos = difuntos; // Guardar datos originales
            
            // Aplicar ordenamiento por defecto: ID ascendente
            this.currentSortColumn = 'id';
            this.currentSortDirection = 'asc';
            const sortedDifuntos = this.sortData(difuntos, 'id');
            
            this.renderDifuntosTable(sortedDifuntos);
            this.updateSortIcons('difuntos', 'id'); // Mostrar indicador visual
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
                <td>#${difunto.id}</td>
                <td><strong>${difunto.nombre} ${difunto.apellidos}</strong></td>
                <td>${this.formatDate(difunto.fecha_nacimiento)}</td>
                <td>${this.formatDate(difunto.fecha_defuncion)}</td>
                <td>${difunto.parcela_numero ? `🏛️ ${difunto.parcela_numero}` : '<span class="badge badge-sin-asignar">Sin asignar</span>'}</td>
                <td class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="app.editDifunto(${difunto.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="app.deleteDifunto(${difunto.id})">
                        🗑️ Eliminar
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
            this.originalData.parcelas = parcelas; // Guardar datos originales
            
            // Aplicar ordenamiento por defecto: Código ascendente
            this.currentSortColumn = 'codigo';
            this.currentSortDirection = 'asc';
            const sortedParcelas = this.sortData(parcelas, 'codigo');
            
            this.renderParcelasTable(sortedParcelas);
            this.updateSortIcons('parcelas', 'codigo'); // Mostrar indicador visual
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
                <td>${parcela.codigo}</td>
                <td><span class="badge badge-${parcela.tipo}">${parcela.tipo}</span></td>
                <td><span class="badge badge-zona-${parcela.zona?.toLowerCase()}">${parcela.zona || 'N/A'}</span></td>
                <td>${parcela.seccion}-${parcela.numero}</td>
                <td>${parcela.fila || 'S/N'}</td>
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
        document.getElementById('btn-nuevo-difunto')?.addEventListener('click', async () => {
            // Limpiar modo edición
            const form = document.getElementById('form-difunto');
            if (form) {
                delete form.dataset.editingId;
                form.reset();
            }
            
            // Cargar parcelas disponibles
            await this.loadParcelasDisponibles();
            
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
            documento: formData.get('documento'),
            sexo: formData.get('sexo') || 'M', // Valor por defecto si no se selecciona
            fecha_nacimiento: formData.get('fecha_nacimiento'),
            fecha_defuncion: formData.get('fecha_defuncion'),
            lugar_nacimiento: formData.get('lugar_nacimiento'),
            causa_muerte: formData.get('causa_muerte'),
            observaciones: formData.get('observaciones'),
            parcela_id: formData.get('parcela_id') || null
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
            
            // Actualizar la sección actual si corresponde
            if (this.currentSection === 'difuntos') {
                await this.loadDifuntos();
            }
            if (this.currentSection === 'parcelas') {
                await this.loadParcelas();
            }
            if (this.currentSection === 'busqueda') {
                // Refrescar la búsqueda si estamos en esa sección
                await this.refreshLastSearch();
            }
            
            // SIEMPRE actualizar dashboard para refrescar estadísticas
            await this.loadDashboard();
            await this.loadRecentActivity(); // Actualizar actividad reciente
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
            
            // Actualizar la sección actual si corresponde
            if (this.currentSection === 'parcelas') {
                await this.loadParcelas();
            }
            
            // SIEMPRE actualizar dashboard para refrescar estadísticas
            await this.loadDashboard();
            await this.loadRecentActivity(); // Actualizar actividad reciente
        } catch (error) {
            console.error('Error procesando parcela:', error);
            this.showNotification('❌ Error al procesar la parcela: ' + error.message, 'error');
        }
    }

    // Búsqueda
    bindSearchEvents() {
        const searchForm = document.getElementById('search-form');
        const clearButton = document.querySelector('#search-form button[type="reset"]');

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        if (clearButton) {
            clearButton.addEventListener('click', (e) => this.handleClearSearch(e));
        }
    }

    handleClearSearch(e) {
        // Limpiar los resultados de búsqueda
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p>Utiliza los filtros para buscar registros</p>';
            resultsContainer.className = 'search-results empty';
        }
        
        // Limpiar la última búsqueda guardada
        this.lastSearchData = null;
        
        // Mostrar notificación
        this.showNotification('Búsqueda limpiada', 'success');
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

        // Guardar los datos de búsqueda para poder repetir la búsqueda más tarde
        this.lastSearchData = searchData;

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
                        <th>Parcela Asignada</th>
                        <th class="action-header">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr>
                            <td>${result.id}</td>
                            <td>${result.nombre} ${result.apellidos}</td>
                            <td>${this.formatDate(result.fecha_defuncion)}</td>
                            <td>
                                ${result.parcela_codigo 
                                    ? `🏛️ ${result.parcela_codigo}` 
                                    : '<span class="badge badge-sin-asignar">Sin asignar</span>'
                                }
                            </td>
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

    // Función para repetir la última búsqueda realizada
    async refreshLastSearch() {
        if (!this.lastSearchData) {
            return; // No hay búsqueda previa para repetir
        }

        try {
            this.showLoading('search-results');
            const results = await window.electronAPI.searchDifuntos(this.lastSearchData);
            this.renderSearchResults(results);
        } catch (error) {
            console.error('Error refrescando búsqueda:', error);
            this.showNotification('Error al actualizar los resultados de búsqueda: ' + error.message, 'error');
        } finally {
            this.hideLoading('search-results');
        }
    }

    // Funciones de ordenamiento de tablas
    bindTableSortEvents() {
        // Event listeners para tabla de difuntos
        document.addEventListener('click', (e) => {
            if (e.target.closest('#difuntos-table th.sortable')) {
                const th = e.target.closest('th.sortable');
                const column = th.dataset.column;
                this.sortTable('difuntos', column);
            }
        });

        // Event listeners para tabla de parcelas
        document.addEventListener('click', (e) => {
            if (e.target.closest('#parcelas-table th.sortable')) {
                const th = e.target.closest('th.sortable');
                const column = th.dataset.column;
                this.sortTable('parcelas', column);
            }
        });
    }

    sortTable(tableType, column) {
        // Determinar dirección de ordenamiento
        if (this.currentSortColumn === column) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortDirection = 'asc';
        }
        this.currentSortColumn = column;

        // Actualizar iconos visuales
        this.updateSortIcons(tableType, column);

        // Ordenar datos
        if (tableType === 'difuntos') {
            const sortedData = this.sortData(this.originalData.difuntos || [], column);
            this.renderDifuntosTable(sortedData);
        } else if (tableType === 'parcelas') {
            const sortedData = this.sortData(this.originalData.parcelas || [], column);
            this.renderParcelasTable(sortedData);
        }
    }

    updateSortIcons(tableType, column) {
        // Limpiar iconos anteriores
        const table = document.getElementById(`${tableType}-table`);
        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        // Agregar icono al header actual
        const currentHeader = table.querySelector(`th[data-column="${column}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sort-${this.currentSortDirection}`);
        }
    }

    sortData(data, column) {
        return [...data].sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Manejar casos especiales
            if (column === 'nombre') {
                aVal = `${a.nombre} ${a.apellidos}`;
                bVal = `${b.nombre} ${b.apellidos}`;
            } else if (column === 'precio') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (column === 'id' || column === 'fila') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else if (column.includes('fecha')) {
                aVal = new Date(aVal || '1900-01-01');
                bVal = new Date(bVal || '1900-01-01');
            }

            // Manejar valores null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Comparación
            let result = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                result = aVal.localeCompare(bVal);
            } else {
                result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }

            return this.currentSortDirection === 'desc' ? -result : result;
        });
    }

    // Método para cargar parcelas disponibles en el select
    async loadParcelasDisponibles() {
        try {
            const parcelas = await window.electronAPI.getParcelasDisponibles();
            const select = document.getElementById('parcela_id');
            
            if (select) {
                // Limpiar opciones existentes excepto la primera
                select.innerHTML = '<option value="">Sin asignar</option>';
                
                // Agregar parcelas disponibles
                parcelas.forEach(parcela => {
                    const option = document.createElement('option');
                    option.value = parcela.id;
                    option.textContent = `${parcela.codigo} - ${parcela.seccion}-${parcela.numero} (${parcela.tipo})`;
                    select.appendChild(option);
                });
                
                // Inicializar mensaje
                this.updateParcelaMessage('', '');
            }
        } catch (error) {
            console.error('Error cargando parcelas disponibles:', error);
        }
    }

    // Método para actualizar el mensaje de parcela seleccionada
    updateParcelaMessage(parcelaId, parcelaText) {
        const statusDiv = document.getElementById('parcela-status');
        const messageSpan = document.getElementById('parcela-message');
        
        if (!statusDiv || !messageSpan) return;
        
        if (parcelaId && parcelaId !== '') {
            // Parcela seleccionada
            statusDiv.style.display = 'flex';
            statusDiv.className = 'parcela-status-right';
            
            // Extraer información más clara de la parcela
            let parcelaInfo = 'Parcela seleccionada';
            if (parcelaText && parcelaText.trim() !== '') {
                // Si el texto viene en formato "CÓDIGO - SECCIÓN-NUMERO (TIPO)"
                // Extraer solo la parte más importante
                const match = parcelaText.match(/([A-Z\d]+)\s*-\s*([A-Z\d]+)-(\d+)/);
                if (match) {
                    const [, codigo, seccion, numero] = match;
                    parcelaInfo = `${codigo} - ${seccion}-${numero}`;
                } else {
                    parcelaInfo = parcelaText;
                }
            } else {
                // Si no hay texto, intentar obtenerlo del select
                const selectElement = document.getElementById('parcela_id');
                if (selectElement && selectElement.selectedIndex > 0) {
                    const selectedOption = selectElement.options[selectElement.selectedIndex];
                    const text = selectedOption.textContent;
                    const match = text.match(/([A-Z\d]+)\s*-\s*([A-Z\d]+)-(\d+)/);
                    if (match) {
                        const [, codigo, seccion, numero] = match;
                        parcelaInfo = `${codigo} - ${seccion}-${numero}`;
                    } else {
                        parcelaInfo = text;
                    }
                }
            }
            
            messageSpan.textContent = `Parcela asignada: ${parcelaInfo}`;
        } else {
            // Sin parcela
            statusDiv.style.display = 'flex';
            statusDiv.className = 'parcela-status-right sin-asignar';
            messageSpan.textContent = 'Sin parcela asignada';
        }
    }

    // Método específico para actualizar mensaje de parcela durante la edición
    async updateParcelaMensajeEnEdicion(parcelaId) {
        if (!parcelaId) {
            // Sin parcela asignada
            this.updateParcelaMessage('', '');
            return;
        }

        try {
            // Obtener información completa de la parcela desde el select
            const selectElement = document.getElementById('parcela_id');
            if (selectElement) {
                // Buscar la opción correspondiente
                const option = Array.from(selectElement.options).find(opt => opt.value === parcelaId.toString());
                if (option && option.textContent) {
                    this.updateParcelaMessage(parcelaId, option.textContent);
                    return;
                }
            }

            // Si no se encuentra en el select, intentar obtener de la API
            const parcela = await window.electronAPI.getParcela(parcelaId);
            if (parcela) {
                const parcelaInfo = `${parcela.codigo} - ${parcela.seccion}-${parcela.numero} (${parcela.tipo})`;
                this.updateParcelaMessage(parcelaId, parcelaInfo);
            } else {
                this.updateParcelaMessage(parcelaId, 'Parcela no encontrada');
            }
        } catch (error) {
            console.error('Error obteniendo información de parcela:', error);
            this.updateParcelaMessage(parcelaId, 'Error obteniendo parcela');
        }
    }

    // Método para buscar ciudades dinámicamente
    async buscarCiudades(termino) {
        if (!termino || termino.length < 1) {
            // Si no hay término o es muy corto, mostrar ciudades populares
            this.inicializarCiudadesPopulares();
            return;
        }

        // Cancelar búsqueda anterior si existe
        if (this.busquedaTimeout) {
            clearTimeout(this.busquedaTimeout);
        }

        // Debouncing - esperar 200ms antes de buscar (reducido para mejor UX)
        this.busquedaTimeout = setTimeout(async () => {
            await this.realizarBusquedaCiudades(termino);
        }, 200);
    }

    async realizarBusquedaCiudades(termino) {
        const loadingIndicator = document.getElementById('ciudades-loading');

        try {
            // Mostrar indicador de carga
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
            }

            // Buscar primero en la base de datos local (más rápido y confiable)
            let ciudades = this.buscarCiudadesLocal(termino);

            // Si hay menos de 5 ciudades locales, buscar en APIs para complementar
            if (ciudades.length < 5) {
                try {
                    const ciudadesAPI = await this.buscarCiudadesEnAPI(termino);
                    // Combinar resultados evitando duplicados
                    ciudadesAPI.forEach(ciudad => {
                        if (!ciudades.some(c => c.toLowerCase() === ciudad.toLowerCase())) {
                            ciudades.push(ciudad);
                        }
                    });
                } catch (apiError) {
                    console.log('APIs no disponibles, usando solo búsqueda local:', apiError.message);
                }
            }

            // Actualizar la lista de opciones - mostrar hasta 50 resultados
            this.actualizarListaCiudades(ciudades.slice(0, 50));

        } catch (error) {
            console.error('Error buscando ciudades:', error);
            // En caso de error, usar solo búsqueda local
            const ciudadesLocal = this.buscarCiudadesLocal(termino);
            this.actualizarListaCiudades(ciudadesLocal.slice(0, 20));
        } finally {
            // Ocultar indicador de carga
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    // Búsqueda local rápida y confiable
    buscarCiudadesLocal(termino) {
        const terminoLower = termino.toLowerCase();
        const todasLasCiudades = this.obtenerCiudadesInternacionales();
        
        return todasLasCiudades
            .filter(ciudad => ciudad.toLowerCase().includes(terminoLower))
            .sort((a, b) => {
                // Priorizar ciudades que empiecen con el término
                const aStartsWith = a.toLowerCase().startsWith(terminoLower);
                const bStartsWith = b.toLowerCase().startsWith(terminoLower);
                
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.localeCompare(b);
            });
    }

    // Buscar ciudades en APIs externas (mejorado y más completo)
    async buscarCiudadesEnAPI(termino) {
        const ciudades = [];
        
        // 1. API de REST Countries para capitales
        try {
            const response = await fetch(`https://restcountries.com/v3.1/all?fields=name,capital`, {
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                const paises = await response.json();
                const terminoLower = termino.toLowerCase();
                
                paises.forEach(pais => {
                    if (pais.capital && pais.capital[0]) {
                        const capital = pais.capital[0];
                        const paisNombre = pais.name.common;
                        if (capital.toLowerCase().includes(terminoLower)) {
                            ciudades.push(`${capital}, ${paisNombre}`);
                        }
                    }
                });
            }
        } catch (error) {
            console.log('API REST Countries no disponible:', error.message);
        }

        // 2. API de OpenStreetMap Nominatim (alternativa gratuita y robusta)
        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(termino)}&format=json&addressdetails=1&limit=20&countrycodes=es&featuretype=city`;
            
            const response = await fetch(nominatimUrl, {
                headers: {
                    'User-Agent': 'CementerioApp/1.0'
                },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const resultados = await response.json();
                resultados.forEach(resultado => {
                    if (resultado.display_name && resultado.address) {
                        let ciudad = resultado.address.city || 
                                   resultado.address.town || 
                                   resultado.address.village || 
                                   resultado.address.municipality ||
                                   resultado.name;
                        
                        if (ciudad) {
                            const pais = resultado.address.country || 'España';
                            const ciudadFormateada = `${ciudad}, ${pais}`;
                            
                            // Evitar duplicados
                            if (!ciudades.some(c => c.toLowerCase() === ciudadFormateada.toLowerCase())) {
                                ciudades.push(ciudadFormateada);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.log('API Nominatim no disponible:', error.message);
        }

        // 3. API adicional para ciudades españolas (usando API del gobierno)
        try {
            // Esta API es específica para España y muy completa
            const spainUrl = `https://apiv1.geoapi.es/municipios?q=${encodeURIComponent(termino)}`;
            
            const response = await fetch(spainUrl, {
                signal: AbortSignal.timeout(4000)
            });
            
            if (response.ok) {
                const resultados = await response.json();
                if (resultados && resultados.data) {
                    resultados.data.forEach(municipio => {
                        if (municipio.NOMBRE_MUNICIPIO) {
                            const ciudadFormateada = `${municipio.NOMBRE_MUNICIPIO}, España`;
                            if (!ciudades.some(c => c.toLowerCase() === ciudadFormateada.toLowerCase())) {
                                ciudades.push(ciudadFormateada);
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.log('API GeoAPI España no disponible:', error.message);
        }

        return ciudades.slice(0, 15); // Limitar resultados de API para no saturar
    }

    // Base de datos local de ciudades internacionales
    obtenerCiudadesInternacionales() {
        return [
            // España - Lista expandida de ciudades y pueblos
            'Madrid, España', 'Barcelona, España', 'Valencia, España', 'Sevilla, España',
            'Zaragoza, España', 'Málaga, España', 'Murcia, España', 'Palma de Mallorca, España',
            'Las Palmas, España', 'Bilbao, España', 'Alicante, España', 'Córdoba, España',
            'Valladolid, España', 'Vigo, España', 'Gijón, España', 'A Coruña, España',
            'Vitoria, España', 'Granada, España', 'Elche, España', 'Oviedo, España',
            'Santa Cruz de Tenerife, España', 'Badalona, España', 'Cartagena, España',
            'Terrassa, España', 'Jerez de la Frontera, España', 'Sabadell, España',
            'Móstoles, España', 'Alcalá de Henares, España', 'Pamplona, España',
            'Fuenlabrada, España', 'Almería, España', 'Leganés, España', 'San Sebastián, España',
            'Burgos, España', 'Santander, España', 'Castellón, España', 'Alcorcón, España',
            'Albacete, España', 'Getafe, España', 'Salamanca, España', 'Huelva, España',
            'Badajoz, España', 'Logroño, España', 'Tarragona, España', 'León, España',
            'Cádiz, España', 'Lérida, España', 'Marbella, España', 'Dos Hermanas, España',
            'Mataró, España', 'Santa Coloma de Gramanet, España', 'Torrejón de Ardoz, España',
            'Parla, España', 'Alcobendas, España', 'Reus, España', 'Torrelavega, España',
            
            // Más ciudades españolas (expandida significativamente)
            'Cáceres, España', 'Toledo, España', 'Ávila, España', 'Cuenca, España', 'Guadalajara, España',
            'Huesca, España', 'Jaén, España', 'Orense, España', 'Palencia, España', 'Segovia, España',
            'Soria, España', 'Teruel, España', 'Zamora, España', 'Ceuta, España', 'Melilla, España',
            
            // Ciudades y pueblos importantes de España
            'Alcoy, España', 'Elda, España', 'Petrer, España', 'Villena, España', 'Denia, España',
            'Xàbia, España', 'Calpe, España', 'Altea, España', 'Benidorm, España', 'Torrevieja, España',
            'Orihuela, España', 'Crevillente, España', 'Aspe, España', 'Novelda, España', 'Monóvar, España',
            'Alcantarilla, España', 'Molina de Segura, España', 'Las Torres de Cotillas, España',
            'Cieza, España', 'Yecla, España', 'Jumilla, España', 'Caravaca de la Cruz, España',
            'Lorca, España', 'Águilas, España', 'Mazarrón, España', 'San Javier, España',
            
            // Comunidad Valenciana
            'Sagunto, España', 'Gandia, España', 'Alzira, España', 'Xàtiva, España', 'Cullera, España',
            'Sueca, España', 'Ontinyent, España', 'Alcoi, España', 'Elche, España', 'Santa Pola, España',
            'Guardamar del Segura, España', 'Pilar de la Horadada, España', 'San Vicente del Raspeig, España',
            'Campello, España', 'Muchamiel, España', 'San Juan de Alicante, España', 'Mutxamel, España',
            
            // Cataluña
            'Girona, España', 'Figueres, España', 'Olot, España', 'Blanes, España', 'Lloret de Mar, España',
            'Manresa, España', 'Vic, España', 'Igualada, España', 'Vilafranca del Penedès, España',
            'Sitges, España', 'Vilanova i la Geltrú, España', 'Martorell, España', 'Cornellà de Llobregat, España',
            'Sant Boi de Llobregat, España', 'Mollet del Vallès, España', 'Cerdanyola del Vallès, España',
            
            // Andalucía
            'Antequera, España', 'Ronda, España', 'Estepona, España', 'Fuengirola, España', 'Mijas, España',
            'Torremolinos, España', 'Benalmádena, España', 'Vélez-Málaga, España', 'Nerja, España',
            'Motril, España', 'Baza, España', 'Guadix, España', 'Linares, España', 'Andújar, España',
            'Martos, España', 'Úbeda, España', 'Baeza, España', 'Alcalá la Real, España',
            'Sanlúcar de Barrameda, España', 'Chiclana de la Frontera, España', 'Conil de la Frontera, España',
            'Barbate, España', 'Tarifa, España', 'Algeciras, España', 'La Línea de la Concepción, España',
            'Arcos de la Frontera, España', 'Rota, España', 'El Puerto de Santa María, España',
            'Lebrija, España', 'Utrera, España', 'Écija, España', 'Osuna, España', 'Estepa, España',
            'Marchena, España', 'Morón de la Frontera, España', 'Carmona, España', 'Alcalá de Guadaíra, España',
            'Dos Hermanas, España', 'Mairena del Aljarafe, España', 'Coria del Río, España',
            'Ayamonte, España', 'Isla Cristina, España', 'Lepe, España', 'Cartaya, España',
            'Almonte, España', 'Moguer, España', 'Palos de la Frontera, España', 'La Palma del Condado, España',
            
            // Castilla y León
            'Ponferrada, España', 'Astorga, España', 'Bembibre, España', 'La Bañeza, España',
            'Medina del Campo, España', 'Aranda de Duero, España', 'Miranda de Ebro, España',
            'Soria, España', 'Ávila, España', 'Arévalo, España', 'Béjar, España', 'Ciudad Rodrigo, España',
            'Peñaranda de Bracamonte, España', 'Alba de Tormes, España', 'Guijuelo, España',
            'Villablino, España', 'Villaquilambre, España', 'San Andrés del Rabanedo, España',
            
            // Galicia
            'Santiago de Compostela, España', 'Lugo, España', 'Ferrol, España', 'Pontevedra, España',
            'Ourense, España', 'Vilagarcía de Arousa, España', 'Redondela, España', 'Cangas, España',
            'Marín, España', 'Tui, España', 'O Grove, España', 'Cambados, España', 'Lalín, España',
            'Ribeira, España', 'Noia, España', 'Padrón, España', 'Carballo, España', 'Betanzos, España',
            'Viveiro, España', 'Monforte de Lemos, España', 'Verín, España', 'O Barco de Valdeorras, España',
            
            // Asturias
            'Langreo, España', 'Mieres, España', 'Avilés, España', 'Siero, España', 'Castrillón, España',
            'Llanera, España', 'Corvera de Asturias, España', 'Carreño, España', 'Gozón, España',
            'Villaviciosa, España', 'Cangas de Onís, España', 'Llanes, España', 'Ribadesella, España',
            
            // Cantabria
            'Camargo, España', 'Piélagos, España', 'Santa María de Cayón, España', 'El Astillero, España',
            'Laredo, España', 'Castro-Urdiales, España', 'Santoña, España', 'Reinosa, España',
            'Los Corrales de Buelna, España', 'Torrelavega, España',
            
            // País Vasco
            'Donostia, España', 'Irún, España', 'Errenteria, España', 'Pasaia, España', 'Hondarribia, España',
            'Zarautz, España', 'Getaria, España', 'Azpeitia, España', 'Tolosa, España', 'Beasain, España',
            'Arrasate, España', 'Eibar, España', 'Ermua, España', 'Durango, España', 'Gernika, España',
            'Leioa, España', 'Getxo, España', 'Portugalete, España', 'Santurtzi, España', 'Basauri, España',
            'Galdakao, España', 'Llodio, España', 'Amurrio, España',
            
            // Latinoamérica - Capitales y ciudades principales
            'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina', 'La Plata, Argentina',
            'Mar del Plata, Argentina', 'Tucumán, Argentina', 'Salta, Argentina', 'Mendoza, Argentina',
            'La Paz, Bolivia', 'Santa Cruz de la Sierra, Bolivia', 'Cochabamba, Bolivia', 'Sucre, Bolivia',
            'São Paulo, Brasil', 'Rio de Janeiro, Brasil', 'Brasília, Brasil', 'Salvador, Brasil',
            'Fortaleza, Brasil', 'Belo Horizonte, Brasil', 'Manaus, Brasil', 'Curitiba, Brasil',
            'Recife, Brasil', 'Porto Alegre, Brasil', 'Santiago, Chile', 'Valparaíso, Chile',
            'Concepción, Chile', 'Antofagasta, Chile', 'Viña del Mar, Chile', 'Valdivia, Chile',
            'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia',
            'Cartagena, Colombia', 'Bucaramanga, Colombia', 'Pereira, Colombia', 'Ibagué, Colombia',
            'San José, Costa Rica', 'Cartago, Costa Rica', 'Puntarenas, Costa Rica', 'Alajuela, Costa Rica',
            'Quito, Ecuador', 'Guayaquil, Ecuador', 'Cuenca, Ecuador', 'Ambato, Ecuador',
            'San Salvador, El Salvador', 'Santa Ana, El Salvador', 'San Miguel, El Salvador',
            'Guatemala, Guatemala', 'Quetzaltenango, Guatemala', 'Antigua Guatemala, Guatemala',
            'Tegucigalpa, Honduras', 'San Pedro Sula, Honduras', 'La Ceiba, Honduras',
            'Ciudad de México, México', 'Guadalajara, México', 'Monterrey, México', 'Puebla, México',
            'Tijuana, México', 'León, México', 'Juárez, México', 'Torreón, México',
            'Querétaro, México', 'Mérida, México', 'Managua, Nicaragua', 'León, Nicaragua',
            'Ciudad de Panamá, Panamá', 'Colón, Panamá', 'Asunción, Paraguay', 'Ciudad del Este, Paraguay',
            'Lima, Perú', 'Arequipa, Perú', 'Trujillo, Perú', 'Chiclayo, Perú',
            'Cusco, Perú', 'Iquitos, Perú', 'Santo Domingo, República Dominicana', 'Santiago, República Dominicana',
            'Montevideo, Uruguay', 'Salto, Uruguay', 'Paysandú, Uruguay', 'Caracas, Venezuela',
            'Maracaibo, Venezuela', 'Valencia, Venezuela', 'Barquisimeto, Venezuela',
            
            // Estados Unidos - Ciudades principales
            'New York, Estados Unidos', 'Los Angeles, Estados Unidos', 'Chicago, Estados Unidos',
            'Houston, Estados Unidos', 'Phoenix, Estados Unidos', 'Philadelphia, Estados Unidos',
            'San Antonio, Estados Unidos', 'San Diego, Estados Unidos', 'Dallas, Estados Unidos',
            'San Jose, Estados Unidos', 'Miami, Estados Unidos', 'Boston, Estados Unidos',
            'Seattle, Estados Unidos', 'Denver, Estados Unidos', 'Washington, Estados Unidos',
            'Las Vegas, Estados Unidos', 'Portland, Estados Unidos', 'Detroit, Estados Unidos',
            
            // Europa - Capitales y ciudades principales
            'Paris, Francia', 'Lyon, Francia', 'Marseille, Francia', 'Nice, Francia',
            'Berlin, Alemania', 'Munich, Alemania', 'Hamburg, Alemania', 'Cologne, Alemania',
            'Rome, Italia', 'Milan, Italia', 'Naples, Italia', 'Turin, Italia',
            'Florence, Italia', 'Venice, Italia', 'London, Reino Unido', 'Manchester, Reino Unido',
            'Birmingham, Reino Unido', 'Liverpool, Reino Unido', 'Edinburgh, Reino Unido',
            'Amsterdam, Países Bajos', 'Rotterdam, Países Bajos', 'The Hague, Países Bajos',
            'Brussels, Bélgica', 'Antwerp, Bélgica', 'Zurich, Suiza', 'Geneva, Suiza',
            'Vienna, Austria', 'Salzburg, Austria', 'Stockholm, Suecia', 'Gothenburg, Suecia',
            'Oslo, Noruega', 'Bergen, Noruega', 'Copenhagen, Dinamarca', 'Helsinki, Finlandia',
            
            // Otras regiones importantes
            'Tokyo, Japón', 'Osaka, Japón', 'Kyoto, Japón', 'Beijing, China',
            'Shanghai, China', 'Hong Kong, China', 'Seoul, Corea del Sur', 'Mumbai, India',
            'Delhi, India', 'Bangalore, India', 'Sydney, Australia', 'Melbourne, Australia',
            'Toronto, Canadá', 'Vancouver, Canadá', 'Montreal, Canadá'
        ];
    }

    // Actualizar la lista de opciones del datalist
    actualizarListaCiudades(ciudades) {
        const datalist = document.getElementById('ciudades');
        if (!datalist) return;

        // Limpiar opciones existentes
        datalist.innerHTML = '';

        // Agregar nuevas opciones
        ciudades.forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad;
            datalist.appendChild(option);
        });
    }

    // Limpiar la lista de ciudades
    limpiarListaCiudades() {
        const datalist = document.getElementById('ciudades');
        if (datalist) {
            datalist.innerHTML = '';
        }
    }

    // Cargar ciudades por defecto en caso de error
    cargarCiudadesPorDefecto(termino = '') {
        const ciudadesDefecto = [
            'Madrid, España', 'Barcelona, España', 'Valencia, España', 'Sevilla, España',
            'Zaragoza, España', 'Málaga, España', 'Murcia, España', 'Bilbao, España',
            'Alicante, España', 'Córdoba, España', 'Granada, España', 'Pamplona, España',
            'Buenos Aires, Argentina', 'São Paulo, Brasil', 'Santiago, Chile', 'Bogotá, Colombia',
            'Ciudad de México, México', 'Lima, Perú', 'Caracas, Venezuela', 'Montevideo, Uruguay'
        ];
        
        // Filtrar por término si se proporciona
        const ciudadesFiltradas = termino ? 
            ciudadesDefecto.filter(ciudad => 
                ciudad.toLowerCase().includes(termino.toLowerCase())
            ) : ciudadesDefecto;
            
        this.actualizarListaCiudades(ciudadesFiltradas);
    }

    // Inicializar con ciudades populares al cargar la aplicación
    inicializarCiudadesPopulares() {
        const ciudadesPopulares = [
            'Madrid, España', 'Barcelona, España', 'Valencia, España', 'Sevilla, España',
            'Buenos Aires, Argentina', 'São Paulo, Brasil', 'Ciudad de México, México',
            'Bogotá, Colombia', 'Lima, Perú', 'Santiago, Chile', 'Caracas, Venezuela',
            'Paris, Francia', 'London, Reino Unido', 'Rome, Italia', 'Berlin, Alemania',
            'New York, Estados Unidos', 'Los Angeles, Estados Unidos', 'Miami, Estados Unidos'
        ];
        this.actualizarListaCiudades(ciudadesPopulares);
    }

    // Operaciones CRUD
    async editDifunto(id) {
        try {
            const difunto = await window.electronAPI.getDifunto(id);
            
            // Cargar parcelas disponibles primero
            await this.loadParcelasDisponibles();
            
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
        try {
            // Obtener información del difunto
            const difunto = await window.electronAPI.getDifunto(id);
            if (!difunto) {
                this.showNotification('No se pudo encontrar el registro del difunto', 'error');
                return;
            }

            // Mostrar diálogo de confirmación personalizado
            const message = `
                <div class="confirmation-dialog compact">
                    <div class="warning-section">
                        <div class="warning-icon">⚠️</div>
                        <h3>Eliminar Registro de Difunto</h3>
                    </div>
                    
                    <div class="compact-info">
                        <strong>👤 ${difunto.nombre} ${difunto.apellidos}</strong> (ID: ${difunto.id})<br>
                        📅 ${this.formatDate(difunto.fecha_nacimiento)} - ${this.formatDate(difunto.fecha_defuncion)}<br>
                        ${difunto.lugar_nacimiento ? `📍 ${difunto.lugar_nacimiento}<br>` : ''}${difunto.parcela_codigo ? `🏛️ Parcela: ${difunto.parcela_codigo}` : '<span class="badge badge-sin-asignar">Sin parcela asignada</span>'}
                    </div>
                    
                    ${difunto.parcela_codigo ? `
                    <div class="info-notice">
                        <p>La parcela asignada será liberada automáticamente.</p>
                    </div>
                    ` : ''}
                </div>
            `;

            const result = await this.showCustomDialog({
                title: '⚠️ Confirmar Eliminación de Difunto',
                message: message,
                headerClass: 'about-header',
                buttons: [
                    { id: 'btn-confirm', class: 'btn-danger-modern', text: '🗑️ Eliminar Registro', value: 'confirm' }
                ],
                critical: true
            });

            if (result === 'confirm') {
                try {
                    await window.electronAPI.deleteDifunto(id);
                    this.showNotification('Registro eliminado correctamente', 'success');
                    
                    // Actualizar la sección actual si corresponde
                    if (this.currentSection === 'difuntos') {
                        await this.loadDifuntos();
                    }
                    if (this.currentSection === 'parcelas') {
                        await this.loadParcelas(); // Actualizar porque una parcela puede haberse liberado
                    }
                    
                    // SIEMPRE actualizar dashboard para refrescar estadísticas
                    await this.loadDashboard();
                    await this.loadRecentActivity(); // Actualizar actividad reciente
                } catch (error) {
                    this.showNotification('Error al eliminar el registro', 'error');
                }
            }

        } catch (error) {
            console.error('Error en deleteDifunto:', error);
            this.showNotification('Error al cargar la información del difunto', 'error');
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
        try {
            // Primero verificar si la parcela tiene difuntos asignados
            const dependencies = await window.electronAPI.checkParcelaDependencies(id);
            
            if (dependencies.error) {
                this.showNotification('Error al verificar la parcela: ' + dependencies.error, 'error');
                return;
            }
            
            const { parcela, difuntosAsignados, canDelete } = dependencies;
            
            // Mostrar modal de confirmación personalizado
            this.showParcelaDeleteConfirmation(parcela, difuntosAsignados, canDelete);
            
        } catch (error) {
            console.error('Error en deleteParcela:', error);
            this.showNotification('Error al procesar la eliminación de la parcela', 'error');
        }
    }
    
    showParcelaDeleteConfirmation(parcela, difuntosAsignados, canDelete) {
        let message, headerClass, buttons;
        
        if (canDelete) {
            // Sin dependencias - eliminación simple (formato compacto)
            message = `
                <div class="confirmation-dialog compact">
                    <div class="parcela-info-section">
                        <div class="success-icon">✅</div>
                        <h3>Eliminación Simple</h3>
                        <div class="compact-info">
                            <strong>📍 Parcela:</strong> ${parcela.codigo} (${parcela.tipo})<br>
                            <strong>🗺️ Ubicación:</strong> ${parcela.zona} - ${parcela.seccion}-${parcela.numero}
                        </div>
                        <div class="safe-delete-notice">
                            <p>Esta parcela no tiene difuntos asignados y se puede eliminar de forma segura.</p>
                        </div>
                    </div>
                </div>
            `;
            headerClass = 'about-header';
            buttons = [
                { id: 'btn-confirm', class: 'btn-danger-modern', text: '🗑️ Eliminar Parcela', value: 'confirm' }
            ];
        } else {
            // Con dependencias - eliminación con liberación (formato compacto)
            const difuntosCompactos = difuntosAsignados.map(d => `👤 ${d.nombre} ${d.apellidos} (ID: ${d.id})`).join(', ');
            
            message = `
                <div class="confirmation-dialog compact">
                    <div class="warning-section">
                        <div class="warning-icon">⚠️</div>
                        <h3>Parcela con ${difuntosAsignados.length} Difunto(s)</h3>
                    </div>
                    
                    <div class="compact-info">
                        <p><strong>🏞️ Parcela:</strong> ${parcela.codigo} (${parcela.tipo})</p>
                        <p><strong>⚰️ Difuntos:</strong> ${difuntosCompactos}</p>
                        <p><strong>⚠️ Acción:</strong> Los difuntos serán liberados automáticamente</p>
                    </div>
                </div>
            `;
            headerClass = 'about-header';
            buttons = [
                { id: 'btn-confirm', class: 'btn-warning-modern', text: '🔄 Liberar y Eliminar', value: 'confirm' }
            ];
        }
        
        this.showCustomDialog({
            title: '⚠️ Confirmar Eliminación de Parcela',
            message: message,
            headerClass: 'about-header',
            buttons: buttons,
            critical: true
        }).then((result) => {
            if (result === 'confirm') {
                this.performParcelaDelete(parcela.id, !canDelete);
            }
        });
    }
    
    async performParcelaDelete(id, isForced) {
        try {
            let result;
            
            if (isForced) {
                // Eliminación forzada: liberar difuntos primero
                result = await window.electronAPI.forceDeleteParcela(id);
                this.showNotification('✅ Parcela eliminada y difuntos liberados correctamente', 'success');
            } else {
                // Eliminación normal
                result = await window.electronAPI.deleteParcela(id);
                this.showNotification('✅ Parcela eliminada correctamente', 'success');
            }
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Actualizar todas las secciones relevantes
            if (this.currentSection === 'parcelas') {
                await this.loadParcelas();
            }
            if (this.currentSection === 'difuntos') {
                await this.loadDifuntos(); // Actualizar porque algunos difuntos pueden perder su parcela
            }
            
            // SIEMPRE actualizar dashboard para refrescar estadísticas
            await this.loadDashboard();
            await this.loadRecentActivity(); // Actualizar actividad reciente
            
        } catch (error) {
            console.error('Error eliminando parcela:', error);
            this.showNotification('❌ Error al eliminar la parcela: ' + error.message, 'error');
        }
    }

    populateDifuntoForm(difunto) {
        const form = document.getElementById('form-difunto');
        if (!form) return;

        form.querySelector('[name="nombre"]').value = difunto.nombre || '';
        form.querySelector('[name="apellidos"]').value = difunto.apellidos || '';
        form.querySelector('[name="documento"]').value = difunto.cedula || '';
        form.querySelector('[name="sexo"]').value = difunto.sexo || 'M';
        form.querySelector('[name="fecha_nacimiento"]').value = difunto.fecha_nacimiento || '';
        form.querySelector('[name="fecha_defuncion"]').value = difunto.fecha_defuncion || '';
        form.querySelector('[name="lugar_nacimiento"]').value = difunto.lugar_nacimiento || '';
        form.querySelector('[name="causa_muerte"]').value = difunto.causa_muerte || '';
        form.querySelector('[name="observaciones"]').value = difunto.observaciones || '';
        form.querySelector('[name="parcela_id"]').value = difunto.parcela_id || '';
        
        // Actualizar mensaje informativo de parcela con información completa
        this.updateParcelaMensajeEnEdicion(difunto.parcela_id);
        
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
                        <button class="dialog-close-btn" id="dialog-close">×</button>
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

            // Event listener para el botón de cerrar (X)
            dialog.querySelector('#dialog-close').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve('cancel');
            });

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
    
    // Hacer disponible el método updateParcelaMessage globalmente
    window.updateParcelaMessage = (parcelaId, parcelaText) => {
        if (window.app && typeof window.app.updateParcelaMessage === 'function') {
            window.app.updateParcelaMessage(parcelaId, parcelaText);
        }
    };
    
    // Hacer disponible el método buscarCiudades globalmente
    window.buscarCiudades = (termino) => {
        if (window.app && typeof window.app.buscarCiudades === 'function') {
            window.app.buscarCiudades(termino);
        } else {
            console.error('Window.app no está disponible o buscarCiudades no es una función');
        }
    };
});
