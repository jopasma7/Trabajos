class FlowerShopApp {
    // Actualiza los badges del sidebar con los valores reales
    async updateSidebarBadges() {
        try {
            const [productos, clientes, eventos, pedidos] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getEventos(),
                window.flowerShopAPI.getPedidos()
            ]);
            const badgeProductos = document.getElementById('badge-productos');
            const badgeClientes = document.getElementById('badge-clientes');
            const badgeEventos = document.getElementById('badge-eventos');
            const badgePedidos = document.getElementById('badge-pedidos');
            if (badgeProductos) badgeProductos.textContent = productos.length;
            if (badgeClientes) badgeClientes.textContent = clientes.length;
            if (badgeEventos) badgeEventos.textContent = eventos.length;
            if (badgePedidos) {
                // Mostrar solo la cantidad de pedidos pendientes
                const pendientes = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'pendiente');
                badgePedidos.textContent = pendientes.length;
                if (pendientes.length > 0) {
                    badgePedidos.classList.add('new');
                } else {
                    badgePedidos.classList.remove('new');
                }
            }
        } catch (error) {
            console.error('❌ Error actualizando badges del sidebar:', error);
        }
    }
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        console.log('🌸 Iniciando aplicación de floristería...');
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        this.setupPedidosTabs();
        await this.updateSidebarBadges();
        // Actualizar badge de notificaciones al iniciar
        try {
            const notificaciones = await window.flowerShopAPI.listarNotificaciones();
            this.updateNotificacionesBadge(notificaciones);
        } catch (e) {
            console.error('No se pudo actualizar el badge de notificaciones al iniciar:', e);
        }
        await this.loadInitialData();
    this.showSection('dashboard');
    // Forzar recarga de datos del dashboard al iniciar
    await this.loadDashboardData();
    }

    // ========== NAVEGACIÓN ==========
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.showSection(sectionId);
                
                // Actualizar estados activos
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.style.display = 'none');
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionId;
            
            // Actualizar breadcrumbs
            this.updateBreadcrumbs(sectionId);
            
            // Cargar datos específicos de la sección
            this.loadSectionData(sectionId);
        }
        // Actualiza el sidebar activo
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        // Si la navegación viene desde el dashboard, también actualiza el color del dashboard si corresponde
        if (sectionId === 'dashboard') {
            document.querySelectorAll('.nav-link[data-section]').forEach(link => {
                if (link.dataset.section === 'dashboard') {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    async loadSectionData(sectionId) {
        console.log(`📊 Cargando datos de: ${sectionId}`);
        try {
            switch (sectionId) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'productos':
                    await this.loadProductosData();
                    break;
                case 'clientes':
                    await this.loadClientesData();
                    break;
                case 'eventos':
                    await this.loadEventosData();
                    break;
                case 'pedidos':
                    // Cargar ambas tablas al entrar en la sección
                    await this.loadPedidosPendientes();
                    await this.loadPedidosData();
                    break;
                case 'inventario':
                    await this.loadInventarioData();
                    // Cargar automáticamente la pestaña activa de inventario
                    const activeTab = document.querySelector('.inventory-tabs .tab-btn.active');
                    if (activeTab) {
                        await this.loadInventoryTabData(activeTab.dataset.tab);
                    }
                    break;
                case 'reportes':
                    await this.loadReportesData();
                    break;
                case 'configuracion':
                    await this.loadConfiguracionData();
                    break;
                case 'notificaciones':
                    await this.loadNotificacionesData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error cargando datos de ${sectionId}:`, error);
            this.showToastGlobal('Error cargando datos de la sección', 'error', 'toast-global');
        }
    }

    // ========== NOTIFICACIONES ========== 
    async loadNotificacionesData() {
        try {
            const notificaciones = await window.flowerShopAPI.listarNotificaciones();
            this.renderNotificaciones(notificaciones);
            this.updateNotificacionesBadge(notificaciones);
            this.setupNotificacionesActions();

            // Tabs de notificaciones y papelera (asignación robusta)
            setTimeout(() => {
                const tabNotificaciones = document.getElementById('tab-notificaciones');
                const tabPapelera = document.getElementById('tab-papelera');
                const tabContentNotificaciones = document.getElementById('tab-content-notificaciones');
                const tabContentPapelera = document.getElementById('tab-content-papelera');
                if (tabNotificaciones && tabPapelera && tabContentNotificaciones && tabContentPapelera) {
                    tabNotificaciones.onclick = async () => {
                        tabNotificaciones.classList.add('active');
                        tabPapelera.classList.remove('active');
                        tabContentNotificaciones.classList.add('active');
                        tabContentPapelera.classList.remove('active');
                    };
                    tabPapelera.onclick = async () => {
                        tabNotificaciones.classList.remove('active');
                        tabPapelera.classList.add('active');
                        tabContentNotificaciones.classList.remove('active');
                        tabContentPapelera.classList.add('active');
                        // Siempre cargar papelera al hacer clic
                        await this.loadNotificacionesTrash();
                    };
                }
            }, 0);
        } catch (error) {
            console.error('❌ Error cargando notificaciones:', error);
            this.showToastGlobal('Error cargando notificaciones', 'error', 'toast-global');
        }
    }



    renderNotificaciones(notificaciones) {
        const container = document.getElementById('notificaciones-list');
        if (!container) return;
        const noLeidas = (notificaciones || []).filter(n => !n.leida);
        if (!noLeidas || noLeidas.length === 0) {
            container.innerHTML = `
                <li class="notifications-empty" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem 0 1.1rem 0;
                    gap: 0.6rem;
                    list-style: none;
                    min-height: 120px;
                    border-radius: 14px;
                    box-shadow: 0 2px 12px 0 rgba(37,99,235,0.08), 0 1px 3px 0 rgba(37,99,235,0.05);
                    border: 1px solid #e0e7ef;
                    background: linear-gradient(120deg, #f8fafc 80%, #e0e7ef 100%);
                ">
                    <div style="font-size:2.1rem;color:#60a5fa;filter:drop-shadow(0 1px 4px #bae6fd);">🔔</div>
                    <div style="font-size:1.05rem;font-weight:700;color:#2563eb;letter-spacing:0.01em;">¡Sin notificaciones!</div>
                    <div style="font-size:0.93rem;color:#64748b;max-width:320px;text-align:center;font-weight:400;line-height:1.4;">
                        Todo está al día. Cuando recibas nuevas notificaciones aparecerán aquí automáticamente.<br><span style='font-size:1.2em;opacity:0.7;'>✨</span>
                    </div>
                </li>
            `;
            return;
        }
        container.innerHTML = noLeidas.map(n => {
            const pedidoClass = n.origen && n.origen.toLowerCase() === 'pedidos' ? 'pedido' : '';
            return `
            <li class="notification-card unread ${pedidoClass}" data-id="${n.id}">
                <div class="notification-header">
                    <span class="notification-title">${n.titulo}</span>
                    <span class="notification-meta">${this.formatFechaNotificacion(n.fecha_creacion)}</span>
                </div>
                <div class="notification-message">${n.mensaje}</div>
                <div class="notification-actions">
                    <button class="notification-btn mark-read" data-id="${n.id}" title="Marcar como leída">
                        <span class="icon-check" aria-label="Marcar como leída"></span>
                    </button>
                </div>
            </li>
            `;
        }).join('');
    }

    async loadNotificacionesTrash() {
        const trashList = document.getElementById('notificaciones-trash-list');
        if (!trashList) return;
        trashList.innerHTML = '<li class="notifications-empty">Cargando papelera...</li>';
        try {
            // Mostrar todas las notificaciones leídas (no eliminadas)
            const todas = await window.flowerShopAPI.listarNotificaciones();
            const leidas = (todas || []).filter(n => n.leida && (!n.eliminada || n.eliminada === 0));
            if (!leidas || leidas.length === 0) {
                trashList.innerHTML = `
                    <li class="notifications-empty" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 1.5rem 0 1.1rem 0;
                        gap: 0.6rem;
                        list-style: none;
                        min-height: 120px;
                        border-radius: 14px;
                        box-shadow: 0 2px 12px 0 rgba(37,99,235,0.08), 0 1px 3px 0 rgba(37,99,235,0.05);
                        border: 1px solid #e0e7ef;
                        background: linear-gradient(120deg, #f8fafc 80%, #e0e7ef 100%);
                    ">
                        <div style="font-size:2.1rem;color:#60a5fa;filter:drop-shadow(0 1px 4px #bae6fd);">🗑️</div>
                        <div style="font-size:1.05rem;font-weight:700;color:#2563eb;letter-spacing:0.01em;">Papelera vacía</div>
                        <div style="font-size:0.93rem;color:#64748b;max-width:320px;text-align:center;font-weight:400;line-height:1.4;">
                            No hay notificaciones leídas.<br><span style='font-size:1.2em;opacity:0.7;'>✨</span>
                        </div>
                    </li>
                `;
                return;
            }
            trashList.innerHTML = leidas.map(n => {
                // Detectar si es de pedido por origen o mensaje
                const origen = (n.origen || '').toLowerCase();
                const mensaje = (n.mensaje || '').toLowerCase();
                const esPedido = origen.includes('pedido') || mensaje.includes('pedido');
                const pedidoClass = esPedido ? 'pedido' : '';
                return `
                <li class="notification-card deleted ${pedidoClass}" data-id="${n.id}">
                    <div class="notification-header">
                        <span class="notification-title">${n.titulo}</span>
                        <span class="notification-meta">${this.formatFechaNotificacion(n.fecha_creacion)}</span>
                    </div>
                    <div class="notification-message">${n.mensaje}</div>
                    <div class="notification-actions">
                        <button class="notification-btn delete" data-id="${n.id}" title="Eliminar">
                            <span class="icon-trash" aria-label="Eliminar"></span>
                        </button>
                    </div>
                </li>
                `;
            }).join('');
            // Asignar eventos para eliminar (lógica)
            document.querySelectorAll('.notification-btn.delete').forEach(btn => {
                btn.onclick = async (e) => {
                    const id = btn.getAttribute('data-id');
                    btn.disabled = true;
                    btn.innerHTML = '<span class="icon-wait"></span>';
                    await window.flowerShopAPI.eliminarNotificacion(parseInt(id));
                    await this.loadNotificacionesTrash();
                };
            });
        } catch (error) {
            trashList.innerHTML = '<li class="notifications-empty">Error cargando papelera.</li>';
        }
    }
    

    formatFechaNotificacion(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
    }

    setupNotificacionesActions() {
        // Marcar como leída y ocultar de la lista
        document.querySelectorAll('.notification-btn.mark-read').forEach(btn => {
            btn.onclick = async (e) => {
                const id = btn.getAttribute('data-id');
                btn.disabled = true;
                await window.flowerShopAPI.marcarNotificacionLeida(parseInt(id));
                await this.loadNotificacionesData();
            };
        });
    }

    async updateNotificacionesBadge(notificaciones) {
        // Actualiza el badge de notificaciones en el header y en la sección
        const badgeHeader = document.getElementById('badge-notificaciones');
        const badgeSection = document.getElementById('notifications-badge');
        const noLeidas = (notificaciones || []).filter(n => !n.leida).length;
        if (badgeHeader) {
            badgeHeader.textContent = noLeidas > 0 ? noLeidas : '';
            badgeHeader.style.display = noLeidas > 0 ? 'inline-block' : 'none';
        }
        if (badgeSection) {
            badgeSection.textContent = noLeidas > 0 ? noLeidas : '';
            badgeSection.style.display = noLeidas > 0 ? 'inline-block' : 'none';
        }
    }

    // ========== DASHBOARD ==========
    async loadDashboardData() {
        try {
            console.log('📈 Cargando dashboard...');
            const stats = await window.flowerShopAPI.getEstadisticas();
            
            // Actualizar estadísticas principales
            this.updateElement('total-productos', stats.totalProductos || 0);
            this.updateElement('total-clientes', stats.totalClientes || 0);
            this.updateElement('pedidos-pendientes', stats.pedidosPendientes || 0);
            this.updateElement('eventos-activos', stats.eventosActivos || 0);
            
            // Actualizar ventas del mes
            this.updateElement('ventas-mes', window.flowerShopAPI.formatCurrency(stats.ventasMesActual || 0));
            
            // Actualizar productos con stock bajo
            this.updateStockBajo(stats.stockBajo || []);
            
            // Cargar próximos eventos
            const eventos = await window.flowerShopAPI.getEventos();
            this.updateProximosEventos(eventos);
            
        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showToastGlobal('Error cargando el dashboard', 'error', 'toast-global');
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateStockBajo(productos) {
        const container = document.getElementById('stock-bajo-list');
        if (!container) return;

        if (productos.length > 0) {
            container.innerHTML = productos.map(producto => `
                <div class="stock-item warning">
                    <span class="producto-nombre">${producto.nombre}</span>
                    <span class="stock-info">${producto.stock_actual}/${producto.stock_minimo} unidades</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-success">✅ Todos los productos tienen stock suficiente</p>';
        }
    }

    updateProximosEventos(eventos) {
        const container = document.getElementById('proximos-eventos');
        if (!container) return;

        const proximosEventos = eventos
            .filter(evento => new Date(evento.fecha_inicio) >= new Date())
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
            .slice(0, 3);

        if (proximosEventos.length > 0) {
            container.innerHTML = proximosEventos.map(evento => `
                <div class="evento-item">
                    <div class="evento-fecha">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</div>
                    <div class="evento-nombre">${evento.nombre}</div>
                    <div class="evento-tipo">${evento.tipo_evento}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>📅 No hay eventos próximos programados</p>';
        }
    }

    // ========== PRODUCTOS ==========
    async loadProductosData() {
        try {
            console.log('🌺 Cargando productos...');
            const productos = await window.flowerShopAPI.getProductos();
            this.displayProductos(productos);
            // Cargar categorías y poblar el filtro
            const categorias = await window.flowerShopAPI.getCategorias();
            const selectFiltro = document.getElementById('filter-categoria');
            if (selectFiltro) {
                // Guardar valor actual para no perder selección
                const valorActual = selectFiltro.value;
                selectFiltro.innerHTML = '<option value="">Todas las categorías</option>' +
                    categorias.map(cat => `<option value="${cat.nombre}">${cat.nombre}</option>`).join('');
                // Restaurar selección si es posible
                if (Array.from(selectFiltro.options).some(opt => opt.value === valorActual)) {
                    selectFiltro.value = valorActual;
                }
            }
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showToastGlobal('Error cargando productos', 'error', 'toast-global');
        }
    }

    displayProductos(productos) {
        const tbody = document.querySelector('#productos-table tbody');
        if (!tbody) return;

        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr data-id="${producto.id}">
                <td>${producto.codigo_producto || 'N/A'}</td>
                <td>
                    <div class="producto-info">
                        <span class="producto-nombre">${producto.nombre}</span>
                        <small class="producto-categoria">${producto.categoria_icono} ${producto.categoria_nombre}</small>
                    </div>
                </td>
                <td>
                    <span class="stock-badge ${producto.stock_actual <= producto.stock_minimo ? 'low-stock' : 'normal-stock'}">
                        ${producto.stock_actual} ${producto.unidad_medida}
                    </span>
                </td>
                <td>${window.flowerShopAPI.formatCurrency(producto.precio_venta)}</td>
                <td>
                    <span class="status-badge ${producto.activo ? 'active' : 'inactive'}">
                        ${producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editarProducto(${producto.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verProducto(${producto.id})" title="Ver detalles">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarProducto(${producto.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== CLIENTES ==========
    async loadClientesData() {
        try {
            console.log('👥 Cargando clientes...');
            const clientes = await window.flowerShopAPI.getClientes();
            this.displayClientes(clientes);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando clientes:', error);
            this.showToastGlobal('Error cargando clientes', 'error', 'toast-global');
        }
    }

    displayClientes(clientes) {
        const tbody = document.querySelector('#clientes-table tbody');
        if (!tbody) return;

        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay clientes registrados</td></tr>';
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr data-id="${cliente.id}">
                <td>${cliente.nombre} ${cliente.apellidos || ''}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.email || 'N/A'}</td>
                <td>
                    <span class="cliente-tipo ${cliente.tipo_cliente}">${cliente.tipo_cliente}</span>
                </td>
                <td>${window.flowerShopAPI.formatCurrency(cliente.total_compras || 0)}</td>
                <td>${cliente.ultima_compra ? window.flowerShopAPI.formatDate(cliente.ultima_compra) : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editarCliente(${cliente.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verCliente(${cliente.id})" title="Ver historial">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="app.nuevoPedidoCliente(${cliente.id})" title="Nuevo pedido">
                            📋
                        </button>
                            <button class="btn btn-sm btn-danger" onclick="app.eliminarCliente(${cliente.id})" title="Eliminar cliente">
                                🗑️
                            </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== EVENTOS ==========
    async loadEventosData() {
        try {
            console.log('🎉 Cargando eventos...');
            const eventos = await window.flowerShopAPI.getEventos();
            this.displayEventos(eventos);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            this.showToastGlobal('Error cargando eventos', 'error', 'toast-global');
        }
    }

    displayEventos(eventos) {
        // Usar el timeline
        const container = document.getElementById('eventos-timeline');
        if (!container) return;

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-center">No hay eventos registrados</p>';
            return;
        }

        container.innerHTML = eventos.map(evento => {
            const fechaInicio = new Date(evento.fecha_inicio);
            const fechaFin = new Date(evento.fecha_fin);
            const hoy = new Date();
            const esActivo = fechaInicio <= hoy && fechaFin >= hoy;
            const esProximo = fechaInicio > hoy;
            // Icono según tipo de evento
            let icono = '🎉';
            if (evento.tipo_evento) {
                const tipo = evento.tipo_evento.toLowerCase();
                if (tipo.includes('boda')) icono = '💍';
                else if (tipo.includes('cumple')) icono = '🎂';
                else if (tipo.includes('aniversario')) icono = '💐';
                else if (tipo.includes('funeral')) icono = '🕊️';
                else if (tipo.includes('corporativo')) icono = '🏢';
                else if (tipo.includes('navidad')) icono = '🎄';
                else if (tipo.includes('san valentín')) icono = '❤️';
                else if (tipo.includes('bautizo')) icono = '👶';
                else if (tipo.includes('comunión')) icono = '🕊️';
                else if (tipo.includes('graduación')) icono = '🎓';
                else if (tipo.includes('baby')) icono = '🍼';
                else if (tipo.includes('evento')) icono = '🎟️';
            }
            return `
                <div class="evento-timeline-item ${esActivo ? 'activo' : ''} ${esProximo ? 'proximo' : ''}" data-id="${evento.id}">
                    <div class="evento-timeline-dot"></div>
                    <div class="evento-timeline-content">
                        <div class="evento-timeline-header">
                            <span class="evento-timeline-date">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</span>
                            <span class="evento-timeline-title">${icono} ${evento.nombre}</span>
                        </div>
                        <div class="evento-timeline-desc">${evento.descripcion || ''}</div>
                        <div class="evento-timeline-actions">
                            <button class="btn-edit" onclick="app.editarEvento(${evento.id})">Editar</button>
                            <button class="btn-delete" onclick="app.eliminarEvento(${evento.id})">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    // ========== PEDIDOS ==========
    setupPedidosTabs() {
        // Solo agregar listeners una vez
        if (this.pedidosTabsInitialized) return;
        this.pedidosTabsInitialized = true;
        const tabPendientesBtn = document.getElementById('tab-pedidos-pendientes-btn');
        const tabTodosBtn = document.getElementById('tab-pedidos-todos-btn');
        const tabPendientes = document.getElementById('tab-pedidos-pendientes');
        const tabTodos = document.getElementById('tab-pedidos-todos');
        if (tabPendientesBtn && tabTodosBtn && tabPendientes && tabTodos) {
            tabPendientesBtn.addEventListener('click', () => {
                tabPendientesBtn.classList.add('active');
                tabTodosBtn.classList.remove('active');
                tabPendientes.classList.add('active');
                tabPendientes.style.display = '';
                tabTodos.classList.remove('active');
                tabTodos.style.display = 'none';
                this.loadPedidosPendientes();
            });
            tabTodosBtn.addEventListener('click', () => {
                tabTodosBtn.classList.add('active');
                tabPendientesBtn.classList.remove('active');
                tabTodos.classList.add('active');
                tabTodos.style.display = '';
                tabPendientes.classList.remove('active');
                tabPendientes.style.display = 'none';
                this.loadPedidosData();
            });
        }
    }

        // Cargar y mostrar todos los pedidos en la pestaña "Todos los pedidos"
        async loadPedidosData() {
            try {
                const pedidos = await window.flowerShopAPI.getPedidos();
                // Obtener valores de los filtros
                const estadoFiltro = document.getElementById('filter-estado-pedidos')?.value?.toLowerCase() || '';
                const fechaFiltro = document.getElementById('filter-fecha-pedidos')?.value || '';

                let pedidosFiltrados = pedidos;
                if (estadoFiltro) {
                    pedidosFiltrados = pedidosFiltrados.filter(p => (p.estado || '').toLowerCase() === estadoFiltro);
                }
                if (fechaFiltro) {
                    pedidosFiltrados = pedidosFiltrados.filter(p => {
                        // Considera p.fecha o p.fecha_pedido
                        const fechaPedido = p.fecha || p.fecha_pedido;
                        if (!fechaPedido) return false;
                        // Normaliza formato a yyyy-mm-dd
                        const fechaStr = (fechaPedido instanceof Date)
                            ? fechaPedido.toISOString().slice(0,10)
                            : (typeof fechaPedido === 'string' ? fechaPedido.slice(0,10) : '');
                        return fechaStr === fechaFiltro;
                    });
                }
                this.displayPedidosTodos(pedidosFiltrados);
            } catch (error) {
                console.error('❌ Error cargando todos los pedidos:', error);
                const tbody = document.querySelector('#pedidos-todos-table tbody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error cargando todos los pedidos</td></tr>';
            }
        }

        // Mostrar todos los pedidos en la tabla correspondiente
        displayPedidosTodos(pedidos) {
            const tbody = document.querySelector('#pedidos-table tbody');
            if (!tbody) return;

            // Filtrar solo los pedidos que NO están en estado 'pendiente'
            const pedidosNoPendientes = (pedidos || []).filter(p => (p.estado || '').toLowerCase() !== 'pendiente');

            if (!pedidosNoPendientes || pedidosNoPendientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay pedidos registrados</td></tr>';
                return;
            }

            tbody.innerHTML = pedidosNoPendientes.map(pedido => {
                let productoHtml = 'N/A';
                if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {
                    productoHtml = pedido.productos.map(prod => {
                        const icono = prod.categoria_icono ? `<span style=\"font-size:1.2em;vertical-align:middle;\">${prod.categoria_icono}</span>` : '';
                        const nombre = prod.producto_nombre || prod.nombre || '';
                        return `${nombre} ${icono} <span style=\"color:#64748b;font-size:0.95em;\">${prod.categoria_nombre || ''}</span>`;
                    }).join('<br>');
                }
                // Mostrar nombre completo del cliente o 'N/A' si no hay datos
                let clienteNombre = '';
                if (pedido.cliente_nombre && pedido.cliente_apellidos) {
                    clienteNombre = `${pedido.cliente_nombre} ${pedido.cliente_apellidos}`;
                } else if (pedido.cliente_nombre) {
                    clienteNombre = pedido.cliente_nombre;
                } else if (pedido.cliente_apellidos) {
                    clienteNombre = pedido.cliente_apellidos;
                } else {
                    clienteNombre = 'N/A';
                }
                return `
                <tr data-id="${pedido.id}">
                    <td>${productoHtml}</td>
                    <td>${clienteNombre}</td>
                    <td>${window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_pedido || pedido.fecha) : (pedido.fecha_pedido || pedido.fecha || 'N/A')}</td>
                    <td>${pedido.entrega || pedido.fecha_entrega || 'N/A'}</td>
                    <td><span class="badge-estado badge-estado-${pedido.estado?.toLowerCase() || 'otro'}">${pedido.estado || 'N/A'}</span></td>
                    <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total || 0) : (pedido.total || 0)}</td>
                    <td>
                        ${pedido.estado && pedido.estado.toLowerCase() === 'pendiente' ? `<button class="btn btn-sm btn-primary" onclick="app.aprobarPedido(${pedido.id})" title="Aprobar">✔️</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="app.verPedido(${pedido.id})" title="Ver detalles">👁️</button>
                        ${pedido.estado && pedido.estado.toLowerCase() === 'pendiente' ? `<button class="btn btn-sm btn-danger" onclick="app.cancelarPedido(${pedido.id})" title="Cancelar">✖️</button>` : ''}
                    </td>
                </tr>
                `;
            }).join('');
        }

    async loadPedidosPendientes() {
        try {
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pendientes = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'pendiente');
            this.displayPedidosPendientes(pendientes);
        } catch (error) {
            console.error('❌ Error cargando pedidos pendientes:', error);
            const tbody = document.querySelector('#pedidos-pendientes-table tbody');
            if (!tbody) {
                console.error('No se encontró el tbody para la tabla de pedidos.');
                return;
            }
        }
    }

    displayPedidosPendientes(pedidos) {
        const tbody = document.querySelector('#pedidos-pendientes-table tbody');
        const thead = document.querySelector('#pedidos-pendientes-table thead');
        if (!tbody) return;
        if (!pedidos || pedidos.length === 0) {
            if (thead) thead.style.display = 'none';
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 2.5rem 0; background: #f9fafb;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.7rem;">
                            <div style="font-size: 2.5rem; color: #a3a3a3;">📋</div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: #64748b;">No hay pedidos pendientes</div>
                            <div style="font-size: 0.95rem; color: #94a3b8; max-width: 350px; text-align: center;">
                                ¡Genial! No tienes pedidos pendientes de aprobación.<br>Cuando recibas nuevos pedidos aparecerán aquí para que los gestiones fácilmente.
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        } else {
            if (thead) thead.style.display = '';
        }
        tbody.innerHTML = pedidos.map(pedido => {
            const estadoBadge = `<span class="badge-estado badge-estado-${(pedido.estado || '').toLowerCase()}">${pedido.estado || 'N/A'}</span>`;
            const cliente = (pedido.cliente_nombre ? pedido.cliente_nombre : '') + (pedido.cliente_apellidos ? ' ' + pedido.cliente_apellidos : '');
            const fechaPedido = pedido.fecha_pedido ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_pedido) : pedido.fecha_pedido) : 'N/A';
            const fechaEntrega = pedido.fecha_entrega ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_entrega) : pedido.fecha_entrega) : 'N/A';
            const totalPedido = (typeof pedido.total !== 'undefined' && pedido.total !== null) ? (window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total) : pedido.total) : 'N/A';
            // Mostrar todos los productos del pedido (igual que en Todos los Pedidos)
            let productoHtml = 'N/A';
            if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {
                productoHtml = pedido.productos.map(prod => {
                    const icono = prod.categoria_icono ? `<span style=\"font-size:1.2em;vertical-align:middle;\">${prod.categoria_icono}</span>` : '';
                    const nombre = prod.producto_nombre || prod.nombre || '';
                    return `${nombre} ${icono} <span style=\"color:#64748b;font-size:0.95em;\">${prod.categoria_nombre || ''}</span>`;
                }).join('<br>');
            }
            return `
                <tr data-id="${pedido.id}">
                    <td>${productoHtml}</td>
                    <td>${cliente.trim() || 'N/A'}</td>
                    <td>${fechaPedido}</td>
                    <td>${fechaEntrega}</td>
                    <td>${estadoBadge}</td>
                    <td>${totalPedido}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="app.aprobarPedido(${pedido.id})" title="Aprobar">✔️</button>
                            <button class="btn btn-sm btn-secondary" onclick="app.verPedido(${pedido.id})" title="Ver detalles">👁️</button>
                            <button class="btn btn-sm btn-danger" onclick="app.cancelarPedido(${pedido.id})" title="Cancelar">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Acciones básicas para pedidos
    async verPedido(id) {
        try {
            // Obtener el pedido y sus detalles
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedido = pedidos.find(p => p.id === id);
            if (!pedido) {
                this.showToastGlobal('No se encontró el pedido', 'error', 'toast-global');
                return;
            }
            // Obtener detalles de productos del pedido si existe la función
            let productosPedido = pedido.productos || [];
            if (!productosPedido.length && window.flowerShopAPI.getProductosPedido) {
                productosPedido = await window.flowerShopAPI.getProductosPedido(id);
            }
            // Renderizar modal de detalles
            this.renderPedidoDetallesModal(pedido, productosPedido);
            this.showModal('modal-pedido-detalles');
        } catch (error) {
            this.showToastGlobal('Error mostrando detalles del pedido', 'error', 'toast-global');
        }
    }

    renderPedidoDetallesModal(pedido, productos) {
        // Crear el modal si no existe
        let modal = document.getElementById('modal-pedido-detalles');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-pedido-detalles';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:950px">
                    <span class="modal-close" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
                    <h2>Detalles del Pedido #<span id="detalle-numero-pedido"></span></h2>
                    <div id="detalle-pedido-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            // Cerrar modal al hacer click en la X
            modal.querySelector('.modal-close').onclick = () => this.hideModal('modal-pedido-detalles');
            // Cerrar al hacer click fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal('modal-pedido-detalles');
            });
        }
        // Rellenar datos
        document.getElementById('detalle-numero-pedido').textContent = pedido.numero || pedido.id;
        const body = document.getElementById('detalle-pedido-body');
        body.innerHTML = `
            <p><strong>Cliente:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${pedido.fecha || 'N/A'}</p>
            <p><strong>Entrega:</strong> ${pedido.entrega || 'N/A'}</p>
            <p><strong>Estado:</strong> <span class="badge-estado badge-estado-${pedido.estado?.toLowerCase() || 'otro'}">${pedido.estado || 'N/A'}</span></p>
            <h4>Productos</h4>
            <div style="max-height:180px;overflow:auto">
                <table class="table table-sm">
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        ${productos && productos.length > 0 ? productos.map(prod => `
                            <tr>
                                <td>${prod.nombre || prod.producto_nombre || 'N/A'}</td>
                                <td>${prod.cantidad || 1}</td>
                                <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(prod.precio_unitario || prod.precio || 0) : (prod.precio_unitario || prod.precio || 0)}</td>
                                <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency((prod.cantidad || 1) * (prod.precio_unitario || prod.precio || 0)) : ((prod.cantidad || 1) * (prod.precio_unitario || prod.precio || 0))}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">No hay productos</td></tr>'}
                    </tbody>
                </table>
            </div>
            <p style="text-align:right;font-size:1.2em"><strong>Total:</strong> ${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total || 0) : (pedido.total || 0)}</p>
            <p><strong>Notas:</strong> ${pedido.notas || '-'}</p>
        `;
    }

    aprobarPedido(id) {
        // Mostrar modal de confirmación verde
        const modal = document.getElementById('modal-confirmacion-aprobar');
        if (!modal) {
            // Fallback si no existe el modal
            if (confirm('¿Aprobar este pedido?')) {
                this.confirmarAprobarPedido(id);
            }
            return;
        }
        // Guardar el id temporalmente en el botón
        const btnConfirmar = document.getElementById('btn-confirmar-aprobar');
        if (btnConfirmar) {
            btnConfirmar.onclick = () => {
                this.confirmarAprobarPedido(id);
                this.hideModal('modal-confirmacion-aprobar');
            };
        }
        this.showModal('modal-confirmacion-aprobar');
    }

    async confirmarAprobarPedido(id) {
        try {
            // 1. Obtener el pedido y sus productos
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedido = pedidos.find(p => p.id === id);
            if (!pedido) {
                this.showToastGlobal('No se encontró el pedido', 'error', 'toast-global');
                return;
            }
            let productosPedido = pedido.productos || [];
            if (!productosPedido.length && window.flowerShopAPI.getProductosPedido) {
                productosPedido = await window.flowerShopAPI.getProductosPedido(id);
            }

            // Validar funciones necesarias
            if (!window.flowerShopAPI.descontarStockProducto) {
                this.showToastGlobal('Error: No existe la función descontarStockProducto en la API.', 'error', 'toast-global');
                console.error('Falta window.flowerShopAPI.descontarStockProducto. No se puede descontar stock al aprobar el pedido.');
                return;
            }
            if (!window.flowerShopAPI.registrarMovimientoInventario) {
                this.showToastGlobal('Error: No existe la función registrarMovimientoInventario en la API.', 'error', 'toast-global');
                console.error('Falta window.flowerShopAPI.registrarMovimientoInventario. No se puede registrar movimiento de inventario al aprobar el pedido.');
                return;
            }

            // 2. Descontar stock de cada producto y registrar movimiento
            for (const prod of productosPedido) {
                try {
                    await window.flowerShopAPI.descontarStockProducto(prod.producto_id || prod.id, prod.cantidad);
                } catch (e) {
                    this.showToastGlobal(`Error descontando stock del producto ${prod.producto_id || prod.id}: ${e.message}`, 'error', 'toast-global');
                    console.error('Error descontando stock:', prod, e);
                    return;
                }
                try {
                    await window.flowerShopAPI.registrarMovimientoInventario({
                        producto_id: prod.producto_id || prod.id,
                        cantidad: prod.cantidad,
                        tipo_movimiento: 'salida',
                        motivo: 'Venta por pedido',
                        referencia: `Pedido #${pedido.numero || pedido.id}`
                    });
                } catch (e) {
                    this.showToastGlobal(`Error registrando movimiento de inventario para producto ${prod.producto_id || prod.id}: ${e.message}`, 'error', 'toast-global');
                    console.error('Error registrando movimiento inventario:', prod, e);
                    return;
                }
            }

            // 3. Actualizar estado del pedido
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'completado');

            // 4. Notificar y refrescar tablas/badges
            this.showToastGlobal('Pedido aprobado y stock actualizado', 'success', 'toast-global');
            await Promise.all([
                this.loadPedidosData(),
                this.loadPedidosPendientes(),
                this.updateSidebarBadges()
            ]);
        } catch (error) {
            this.showToastGlobal('Error aprobando pedido: ' + (error.message || error), 'error', 'toast-global');
            console.error('Error en confirmarAprobarPedido:', error);
        }
    }

    async cancelarPedido(id) {
        try {
            if (!confirm('¿Cancelar este pedido?')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'cancelado');
            this.showToastGlobal('Pedido cancelado', 'success', 'toast-global');
            await Promise.all([
                this.loadPedidosData(),
                this.loadPedidosPendientes(),
                this.updateSidebarBadges()
            ]);
        } catch (error) {
            this.showToastGlobal('Error cancelando pedido', 'error', 'toast-global');
        }
    }

    async loadInventarioData() {
        console.log('📦 Cargando inventario avanzado...');
        
        // Configurar navegación de pestañas
        this.setupInventoryTabs();
        
        // Cargar datos del dashboard por defecto
        await this.loadInventoryDashboard();
        
        // Configurar event listeners para inventario
        this.setupInventoryEventListeners();
    }

    setupInventoryTabs() {
        const tabButtons = document.querySelectorAll('.inventory-tabs .tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const tabId = button.getAttribute('data-tab');
                
                // Actualizar botones activos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Mostrar contenido correspondiente
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) {
                    targetTab.classList.add('active');
                    
                    // Cargar datos específicos de la pestaña
                    switch(tabId) {
                        case 'dashboard':
                            await this.loadInventoryDashboard();
                            break;
                        case 'alertas':
                            await this.loadInventoryAlerts();
                            break;
                        case 'prediccion':
                            await this.loadDemandPrediction();
                            break;
                        case 'proveedores':
                            await this.loadProviders();
                            // Configurar event listeners específicos de proveedores
                            this.setupProveedoresEventListeners();
                            break;
                        case 'ordenes':
                            await this.loadPurchaseOrders();
                            break;
                        case 'movimientos':
                            await this.loadInventoryMovements();
                            break;
                    }
                }
            });
        });
    }

    async loadInventoryDashboard() {
        try {
            console.log('🔄 Cargando dashboard de inventario...');
            
            // Cargar productos
            const productos = await window.flowerShopAPI.getProductos();
            console.log(`📦 ${productos.length} productos cargados`);
            
            // Total productos
            const totalProductosEl = document.getElementById('inventario-total-productos');
            if (totalProductosEl) {
                totalProductosEl.textContent = productos.length;
            }
            
            // Stock bajo (menos de 10 unidades)
            const stockBajoEl = document.getElementById('inventario-stock-bajo');
            if (stockBajoEl) {
                const stockBajo = productos.filter(p => p.stock_actual < 10).length;
                stockBajoEl.textContent = stockBajo;
            }
            
            // Valor total del inventario
            const valorInventarioEl = document.getElementById('inventario-valor-inventario');
            if (valorInventarioEl) {
                const valorTotal = productos.reduce((total, producto) => {
                    return total + (producto.precio_venta * producto.stock_actual);
                }, 0);
                valorInventarioEl.textContent = `€${valorTotal.toLocaleString()}`;
            }
            
            // Rotación promedio (simulado)
            const rotacionPromedioEl = document.getElementById('inventario-rotacion-promedio');
            if (rotacionPromedioEl) {
                rotacionPromedioEl.textContent = '15';
            }
            
            // Actualizar tendencias (porcentajes)
            this.updateInventoryTrends(productos);
            
            // Cargar análisis de rotación
            try {
                const analisisData = await window.flowerShopAPI.getAnalisisInventario();
                this.createRotationAnalysisChart(analisisData.productos_rotacion_rapida || []);
                this.displayProductsWithoutMovement(analisisData.productos_sin_movimiento || []);
            } catch (error) {
                console.warn('⚠️ Análisis de inventario no disponible:', error);
                // Mostrar datos simulados para demostración
                this.createSimulatedRotationChart(productos);
                this.displaySimulatedProductsWithoutMovement(productos);
            }
            
            console.log('✅ Dashboard de inventario actualizado');
            
        } catch (error) {
            console.error('❌ Error cargando dashboard de inventario:', error);
            this.showToastGlobal('Error cargando dashboard de inventario', 'error', 'toast-global');
        }
    }
    
    updateInventoryTrends(productos) {
        // Simular tendencias basadas en los datos actuales
        const totalProductos = productos.length;
        const stockBajo = productos.filter(p => p.stock_actual < 10).length;
        const valorTotal = productos.reduce((total, producto) => {
            return total + (producto.precio_venta * producto.stock_actual);
        }, 0);
        
        // Actualizar elementos de tendencias (simulando crecimiento)
        const trendProductos = document.getElementById('trend-productos');
        if (trendProductos) {
            const crecimientoProductos = Math.round((totalProductos / 15 - 1) * 100); // Simulado
            trendProductos.textContent = `${crecimientoProductos >= 0 ? '+' : ''}${crecimientoProductos}%`;
            trendProductos.className = `kpi-trend ${crecimientoProductos >= 0 ? 'positive' : 'negative'}`;
        }
        
        const trendStock = document.getElementById('trend-stock');
        if (trendStock) {
            trendStock.textContent = `${stockBajo} críticos`;
        }
        
        const trendValor = document.getElementById('trend-valor');
        if (trendValor) {
            const crecimientoValor = Math.round((valorTotal / 15000 - 1) * 100); // Simulado
            trendValor.textContent = `${crecimientoValor >= 0 ? '+' : ''}${crecimientoValor}%`;
            trendValor.className = `kpi-trend ${crecimientoValor >= 0 ? 'positive' : 'negative'}`;
        }
        
        const trendRotacion = document.getElementById('trend-rotacion');
        if (trendRotacion) {
            trendRotacion.textContent = 'días';
        }
    }
    
    createSimulatedRotationChart(productos) {
        const ctx = document.getElementById('rotation-analysis-chart');
        if (!ctx) return;

        if (this.rotationChart) {
            this.rotationChart.destroy();
        }

        // Simular datos de rotación basados en stock
        const rotacionRapida = productos.filter(p => p.stock_actual > 30).length;
        const rotacionLenta = productos.filter(p => p.stock_actual >= 10 && p.stock_actual <= 30).length;
        const sinMovimiento = productos.filter(p => p.stock_actual < 10).length;

        this.rotationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Rotación Rápida', 'Rotación Lenta', 'Stock Bajo'],
                datasets: [{
                    data: [rotacionRapida, rotacionLenta, sinMovimiento],
                    backgroundColor: [
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    displaySimulatedProductsWithoutMovement(productos) {
        const container = document.getElementById('productos-sin-movimiento');
        if (!container) return;

        // Simular productos con bajo movimiento (los que tienen menos stock)
        const productosOrdenados = productos
            .sort((a, b) => a.stock_actual - b.stock_actual)
            .slice(0, 5);

        if (productosOrdenados.length === 0) {
            container.innerHTML = '<div class="ranking-loading">🎉 ¡Todos los productos tienen buen movimiento!</div>';
            return;
        }

        container.innerHTML = productosOrdenados.map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value">${Math.floor(Math.random() * 30) + 10} días</div>
            </div>
        `).join('');
    }

    updateInventoryKPIs(estadisticas) {
        document.getElementById('total-productos').textContent = estadisticas.total_productos || 0;
        document.getElementById('stock-bajo').textContent = estadisticas.productos_stock_bajo || 0;
        document.getElementById('valor-inventario').textContent = 
            window.flowerShopAPI.formatCurrency(estadisticas.valor_inventario_venta);
        
        // Calcular rotación promedio aproximada
        const rotacionPromedio = Math.round(estadisticas.promedio_stock / 30 * 365) || 0;
        document.getElementById('rotacion-promedio').textContent = rotacionPromedio;
        
        // Actualizar trends
        document.getElementById('trend-stock').textContent = 
            `${estadisticas.productos_sin_stock || 0} sin stock`;
        document.getElementById('trend-rotacion').textContent = `días/año`;
    }

    createRotationAnalysisChart(analisisData) {
        const ctx = document.getElementById('rotation-analysis-chart');
        if (!ctx) return;

        if (this.rotationChart) {
            this.rotationChart.destroy();
        }

        const rapidaCount = analisisData.productos_rotacion_rapida.length;
        const lentaCount = analisisData.productos_rotacion_lenta.length;
        const sinMovimientoCount = analisisData.productos_sin_movimiento.length;

        this.rotationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Rotación Rápida', 'Rotación Lenta', 'Sin Movimiento'],
                datasets: [{
                    data: [rapidaCount, lentaCount, sinMovimientoCount],
                    backgroundColor: [
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    displayProductsWithoutMovement(productos) {
        const container = document.getElementById('productos-sin-movimiento');
        if (!container) return;

        if (productos.length === 0) {
            container.innerHTML = '<div class="ranking-loading">🎉 ¡Todos los productos tienen movimiento!</div>';
            return;
        }

        container.innerHTML = productos.slice(0, 10).map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value">${producto.dias_stock} días</div>
            </div>
        `).join('');
    }

    async loadInventoryAlerts() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            this.displayStockAlerts(alertas);
        } catch (error) {
            console.error('Error cargando alertas de stock:', error);
            this.showToastGlobal('Error cargando alertas de stock', 'error', 'toast-global');
        }
    }

    displayStockAlerts(alertas) {
        const container = document.getElementById('alertas-stock-grid');
        if (!container) return;

        if (alertas.length === 0) {
            container.innerHTML = '<div class="loading-message">🎉 ¡No hay alertas de stock activas!</div>';
            return;
        }

        container.innerHTML = alertas.map(alerta => `
            <div class="alert-card ${alerta.nivel_alerta}">
                <div class="alert-header">
                    <h4 class="alert-title">${alerta.nombre}</h4>
                    <span class="alert-badge ${alerta.nivel_alerta}">${alerta.nivel_alerta.replace('_', ' ')}</span>
                </div>
                <div class="alert-details">
                    <div><strong>Stock Actual:</strong> ${alerta.stock_actual}</div>
                    <div><strong>Stock Mínimo:</strong> ${alerta.stock_minimo}</div>
                    <div><strong>Categoría:</strong> ${alerta.categoria || 'N/A'}</div>
                    <div><strong>Sugerido:</strong> ${Math.max(alerta.stock_sugerido, 0)}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.ajustarStockMinimo(${alerta.id})">
                        ⚙️ Ajustar
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="app.crearOrdenCompra([${alerta.id}])">
                        🛒 Pedir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadDemandPrediction() {
        try {
            const periodo = 30; // Valor fijo de 30 días
            const predicciones = await window.flowerShopAPI.getPrediccionDemanda(null, parseInt(periodo));
            
            this.createDemandPredictionChart(predicciones);
            this.displayPredictionTable(predicciones);
        } catch (error) {
            console.error('Error cargando predicción de demanda:', error);
            this.showToastGlobal('Error cargando predicción de demanda', 'error', 'toast-global');
        }
    }

    createDemandPredictionChart(predicciones) {
        const ctx = document.getElementById('demand-prediction-chart');
        if (!ctx) return;

        if (this.demandChart) {
            this.demandChart.destroy();
        }

        const topPredicciones = predicciones.slice(0, 10);

        this.demandChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topPredicciones.map(p => p.nombre.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Stock Actual',
                    data: topPredicciones.map(p => p.stock_actual),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }, {
                    label: 'Demanda Prevista',
                    data: topPredicciones.map(p => p.demanda_prevista),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    displayPredictionTable(predicciones) {
        const tbody = document.querySelector('#prediction-table tbody');
        if (!tbody) return;

        if (predicciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de predicción disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = predicciones.slice(0, 20).map(pred => {
            const alertClass = pred.stock_proyectado < 0 ? 'text-danger' : pred.stock_proyectado < pred.stock_actual * 0.3 ? 'text-warning' : '';
            return `
                <tr>
                    <td>${pred.nombre}</td>
                    <td>${pred.stock_actual}</td>
                    <td>${Math.round(pred.demanda_prevista)}</td>
                    <td class="${alertClass}">${Math.round(pred.stock_proyectado)}</td>
                    <td>
                        ${pred.stock_proyectado < 0 ? 
                            '<span class="badge bg-danger">Reabastecer</span>' : 
                            pred.stock_proyectado < pred.stock_actual * 0.3 ? 
                            '<span class="badge bg-warning">Monitorear</span>' : 
                            '<span class="badge bg-success">OK</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupInventoryEventListeners() {
        // Botón actualizar inventario
        const btnActualizar = document.getElementById('btn-actualizar-inventario');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', () => this.loadInventarioData());
        }

        // Generar orden automática
        const btnOrdenAuto = document.getElementById('btn-generar-orden-auto');
        if (btnOrdenAuto) {
            btnOrdenAuto.addEventListener('click', () => this.generateAutomaticOrder());
        }
    }

    setupProveedoresEventListeners() {
        console.log('⚙️ Configurando event listeners de proveedores...');
        
        // Botón nuevo proveedor
        const btnNuevoProveedorTab = document.getElementById('btn-nuevo-proveedor-tab');
        if (btnNuevoProveedorTab) {
            console.log('✅ Configurando event listener para botón nuevo proveedor');
            // Remover event listeners anteriores
            btnNuevoProveedorTab.replaceWith(btnNuevoProveedorTab.cloneNode(true));
            const newBtn = document.getElementById('btn-nuevo-proveedor-tab');
            newBtn.addEventListener('click', () => {
                console.log('🔄 Click en botón nuevo proveedor detectado');
                this.nuevoProveedor();
            });
        } else {
            console.warn('⚠️ Botón nuevo proveedor no encontrado en el DOM');
        }
    }

    async generateAutomaticOrder() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            
            if (alertas.length === 0) {
                this.showToastGlobal('No hay productos que requieran reabastecimiento', 'info', 'toast-global');
                return;
            }

            const productos = alertas.map(alerta => ({
                producto_id: alerta.id,
                cantidad: Math.max(alerta.stock_sugerido, alerta.stock_minimo)
            }));

            const ordenes = await window.flowerShopAPI.generarOrdenCompra(productos);
            
            if (ordenes.length > 0) {
                this.showToastGlobal(`✅ Se generaron ${ordenes.length} órdenes de compra automáticamente`, 'success', 'toast-global');
                // Cambiar a la pestaña de órdenes
                document.querySelector('[data-tab="ordenes"]').click();
            } else {
                this.showToastGlobal('No se pudieron generar órdenes automáticas. Verifica los proveedores.', 'warning', 'toast-global');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showToastGlobal('Error generando orden automática', 'error', 'toast-global');
        }
    }

    async loadProviders() {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            this.displayProviders(proveedores);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.showToastGlobal('Error cargando proveedores', 'error', 'toast-global');
        }
    }

    displayProviders(proveedores) {
        const container = document.getElementById('proveedores-grid');
        if (!container) return;

        if (proveedores.length === 0) {
            container.innerHTML = '<div class="loading-message">No hay proveedores registrados</div>';
            return;
        }

        container.innerHTML = proveedores.map(proveedor => `
            <div class="provider-card">
                <div class="provider-header">
                    <h4 class="provider-name">${proveedor.nombre}</h4>
                    <span class="provider-status ${proveedor.activo ? 'activo' : 'inactivo'}">
                        ${proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="provider-info">
                    <div>📞 ${proveedor.telefono || 'N/A'}</div>
                    <div>📧 ${proveedor.email || 'N/A'}</div>
                    <div>📍 ${proveedor.ciudad || 'N/A'}</div>
                </div>
                <div class="provider-stats">
                    <div class="provider-stat">
                        <div class="provider-stat-value">${proveedor.productos_suministrados}</div>
                        <div class="provider-stat-label">Productos</div>
                    </div>
                    <div class="provider-stat">
                        <div class="provider-stat-value">${window.flowerShopAPI.formatCurrency(proveedor.promedio_pedidos)}</div>
                        <div class="provider-stat-label">Promedio</div>
                    </div>
                </div>
                <div class="provider-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.editarProveedor(${proveedor.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-success" onclick="app.viewProviderOrders(${proveedor.id})">
                        📋 Órdenes
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.eliminarProveedor(${proveedor.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadPurchaseOrders() {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            this.displayPurchaseOrders(ordenes);
        } catch (error) {
            console.error('Error cargando órdenes de compra:', error);
            this.showToastGlobal('Error cargando órdenes de compra', 'error', 'toast-global');
        }
    }

    displayPurchaseOrders(ordenes) {
        const tbody = document.querySelector('#ordenes-table tbody');
        if (!tbody) return;

        if (ordenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay órdenes de compra registradas</td></tr>';
            return;
        }

        tbody.innerHTML = ordenes.map(orden => `
            <tr>
                <td>${orden.numero_orden}</td>
                <td>${orden.proveedor_nombre}</td>
                <td>${window.flowerShopAPI.formatDate(orden.fecha_orden)}</td>
                <td>${orden.total_items}</td>
                <td>${window.flowerShopAPI.formatCurrency(orden.total)}</td>
                <td><span class="status-badge ${orden.estado}">${orden.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.viewOrderDetails(${orden.id})">
                        👁️ Ver
                    </button>
                    ${orden.estado === 'pendiente' ? `
                        <button class="btn btn-sm btn-success" onclick="app.markOrderReceived(${orden.id})">
                            ✅ Recibida
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async loadInventoryMovements() {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario({ limite: 50 });
            this.displayInventoryMovements(movimientos);
        } catch (error) {
            console.error('Error cargando movimientos de inventario:', error);
            this.showToastGlobal('Error cargando movimientos de inventario', 'error', 'toast-global');
        }
    }

    displayInventoryMovements(movimientos) {
        const tbody = document.querySelector('#movimientos-table tbody');
        if (!tbody) return;

        if (movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay movimientos de inventario registrados</td></tr>';
            return;
        }

        tbody.innerHTML = movimientos.map(mov => `
            <tr>
                <td>${window.flowerShopAPI.formatDateTime(mov.fecha_movimiento)}</td>
                <td>${mov.producto_nombre}</td>
                <td>
                    <span class="badge ${mov.tipo_movimiento === 'entrada' ? 'bg-success' : 'bg-danger'}">
                        ${mov.tipo_movimiento}
                    </span>
                </td>
                <td>${mov.cantidad}</td>
                <td>${mov.stock_anterior || 'N/A'} → ${mov.stock_nuevo || 'N/A'}</td>
                <td>${mov.motivo || 'N/A'}</td>
                <td>${mov.referencia || 'N/A'}</td>
            </tr>
        `).join('');
    }

    async loadReportesData() {
        console.log('📈 Cargando reportes...');
        try {
            // Obtener período seleccionado
            const periodSelect = document.getElementById('report-period');
            const dias = periodSelect ? parseInt(periodSelect.value) : 30;
            
            // Cargar datos en paralelo
            const [
                ventasData,
                topProductos,
                estadosPedidos,
                clientesTipo,
                eventosRentables,
                rotacionInventario,
                detalleVentas
            ] = await Promise.all([
                window.flowerShopAPI.getReportesVentas(dias),
                window.flowerShopAPI.getProductosTopVentas(10, dias),
                window.flowerShopAPI.getEstadosPedidos(),
                window.flowerShopAPI.getClientesPorTipo(),
                window.flowerShopAPI.getEventosRentables(5, 365),
                window.flowerShopAPI.getRotacionInventario(),
                window.flowerShopAPI.getDetalleVentas(dias, '', 100)
            ]);

            // Actualizar KPIs
            this.updateReportKPIs(ventasData.kpis);
            
            // Crear gráficos
            this.createSalesChart(ventasData.ventasDiarias);
            this.createOrdersStatusChart(estadosPedidos);
            this.createInventoryRotationChart(rotacionInventario);
            
            // Actualizar rankings y listas
            this.updateTopProducts(topProductos);
            this.updateClientsType(clientesTipo);
            this.updateTopEvents(eventosRentables);
            this.updateSalesDetail(detalleVentas);
            
            // Configurar event listeners para controles
            this.setupReportControls();
            
        } catch (error) {
            console.error('❌ Error cargando reportes:', error);
            this.showToastGlobal('Error cargando reportes', 'error', 'toast-global');
        }
    }

    updateReportKPIs(kpis) {
        // Actualizar valores principales
        this.updateElement('kpi-total-ventas', window.flowerShopAPI.formatCurrency(kpis.total_ventas || 0));
        this.updateElement('kpi-total-pedidos', kpis.total_pedidos || 0);
        this.updateElement('kpi-clientes-activos', kpis.clientes_activos || 0);
        this.updateElement('kpi-ticket-promedio', window.flowerShopAPI.formatCurrency(kpis.ticket_promedio || 0));
        
        // TODO: Calcular tendencias comparando con período anterior
        // Por ahora mostramos valores neutros
        this.updateTrend('kpi-ventas-trend', 0);
        this.updateTrend('kpi-pedidos-trend', 0);
        this.updateTrend('kpi-clientes-trend', 0);
        this.updateTrend('kpi-ticket-trend', 0);
    }

    updateTrend(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
        element.className = 'kpi-trend ' + (percentage > 0 ? 'positive' : percentage < 0 ? 'negative' : 'neutral');
    }

    createSalesChart(ventasData) {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        const labels = ventasData.map(v => {
            const fecha = new Date(v.fecha);
            return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        }).reverse();
        
        const valores = ventasData.map(v => v.total_ventas).reverse();

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas (€)',
                    data: valores,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => window.flowerShopAPI.formatCurrency(value)
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#8b5cf6'
                    }
                }
            }
        });
    }

    createOrdersStatusChart(estadosData) {
        const ctx = document.getElementById('orders-status-chart');
        if (!ctx) return;

        if (this.ordersChart) {
            this.ordersChart.destroy();
        }

        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
        
        this.ordersChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: estadosData.map(e => e.estado),
                datasets: [{
                    data: estadosData.map(e => e.cantidad),
                    backgroundColor: colores.slice(0, estadosData.length),
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createInventoryRotationChart(inventarioData) {
        const ctx = document.getElementById('inventory-rotation-chart');
        if (!ctx) return;

        if (this.inventoryChart) {
            this.inventoryChart.destroy();
        }

        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
        
        this.inventoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: inventarioData.map(i => i.categoria),
                datasets: [{
                    label: 'Valor Vendido (€)',
                    data: inventarioData.map(i => i.valor_vendido),
                    backgroundColor: colores,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => window.flowerShopAPI.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    updateTopProducts(productos) {
        const container = document.getElementById('top-products');
        if (!container) return;

        if (productos.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay datos de productos vendidos</div>';
            return;
        }

        container.innerHTML = productos.map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.categoria_icono} ${producto.nombre}</div>
                    <div class="ranking-subtitle">${producto.categoria} • ${producto.pedidos_count} pedidos</div>
                </div>
                <div class="ranking-value">${producto.cantidad_vendida} uds</div>
            </div>
        `).join('');
    }

    updateClientsType(clientesData) {
        const container = document.getElementById('clients-type');
        if (!container) return;

        if (clientesData.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay datos de clientes</div>';
            return;
        }

        const total = clientesData.reduce((sum, c) => sum + c.cantidad, 0);
        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

        container.innerHTML = clientesData.map((cliente, index) => {
            const porcentaje = total > 0 ? (cliente.cantidad / total * 100) : 0;
            return `
                <div class="segment-item">
                    <div class="segment-label">
                        <div class="segment-color" style="background: ${colores[index % colores.length]}"></div>
                        <span>${cliente.tipo_cliente}</span>
                    </div>
                    <div class="segment-bar">
                        <div class="segment-fill" style="width: ${porcentaje}%; background: ${colores[index % colores.length]}"></div>
                    </div>
                    <div class="segment-percentage">${porcentaje.toFixed(1)}%</div>
                </div>
            `;
        }).join('');
    }

    updateTopEvents(eventos) {
        const container = document.getElementById('top-events');
        if (!container) return;

        if (eventos.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay eventos con ventas registradas</div>';
            return;
        }

        container.innerHTML = eventos.map((evento, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${evento.nombre}</div>
                    <div class="ranking-subtitle">${evento.tipo_evento} • ${evento.pedidos_generados} pedidos</div>
                </div>
                <div class="ranking-value">${window.flowerShopAPI.formatCurrency(evento.ventas_totales)}</div>
            </div>
        `).join('');
    }

    updateSalesDetail(ventasData) {
        const tbody = document.querySelector('#sales-detail-table tbody');
        if (!tbody) return;

        if (ventasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ventas en el período seleccionado</td></tr>';
            return;
        }

        tbody.innerHTML = ventasData.map(venta => `
            <tr>
                <td>${window.flowerShopAPI.formatDate(venta.fecha_pedido)}</td>
                <td>${venta.numero_pedido}</td>
                <td>${venta.cliente_nombre || 'N/A'}</td>
                <td title="${venta.productos}">${venta.productos ? venta.productos.substring(0, 30) + '...' : 'N/A'}</td>
                <td>${window.flowerShopAPI.formatCurrency(venta.total)}</td>
                <td><span class="badge-estado badge-estado-${venta.estado.toLowerCase()}">${venta.estado}</span></td>
                <td>${window.flowerShopAPI.formatCurrency(venta.margen || 0)}</td>
            </tr>
        `).join('');
    }

    setupReportControls() {
        // Selector de período
        const periodSelect = document.getElementById('report-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.loadReportesData();
            });
        }

        // Controles de gráfico de ventas
        document.querySelectorAll('.chart-btn[data-chart="ventas"]').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover clase activa de otros botones
                document.querySelectorAll('.chart-btn[data-chart="ventas"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // TODO: Implementar cambio de vista (diario/semanal/mensual)
                const tipo = btn.dataset.type;
                console.log('Cambiar vista de ventas a:', tipo);
            });
        });

        // Búsqueda en tabla de detalles
        const searchInput = document.getElementById('search-sales');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    const periodSelect = document.getElementById('report-period');
                    const dias = periodSelect ? parseInt(periodSelect.value) : 30;
                    const ventasData = await window.flowerShopAPI.getDetalleVentas(dias, e.target.value, 100);
                    this.updateSalesDetail(ventasData);
                }, 500);
            });
        }

        // Botón de exportar
        const exportBtn = document.getElementById('btn-export-reports');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReports();
            });
        }
    }

    exportReports() {
        // TODO: Implementar exportación de reportes
    this.showToastGlobal('Funcionalidad de exportación en desarrollo', 'info', 'toast-global');
    }

    async loadConfiguracionData() {
        console.log('⚙️ Cargando configuración...');
        // TODO: Implementar configuración
    }

    // ========== ACCIONES CRUD ==========
    
    // Productos
    async nuevoProducto() {
        console.log('➕ Nuevo producto');
        try {
            // Limpiar formulario
            this.clearForm('form-producto');
            // Cargar categorías
            await this.loadCategoriasEnModal();
            // Mostrar modal
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error abriendo modal de producto:', error);
            this.showToastGlobal('Error abriendo formulario', 'error', 'toast-global');
        }
    }

    async loadCategoriasEnModal() {
        try {
            const categorias = await window.flowerShopAPI.getCategorias();
            const select = document.getElementById('producto-categoria');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar categoría</option>' +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.showToastGlobal('Error cargando categorías', 'error', 'toast-global');
        }
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Limpiar cualquier data-id
            form.removeAttribute('data-edit-id');
        }
    }

    async editarProducto(id) {
        console.log('✏️ Editar producto:', id);
        try {
            await this.loadCategoriasEnModal();
            // Obtener todos los productos y buscar el que corresponde
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            if (!producto) {
                this.showToastGlobal('No se encontró el producto', 'error', 'toast-global');
                return;
            }
            // Rellenar el formulario
            const form = document.getElementById('form-producto');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('producto-nombre').value = producto.nombre || '';
            document.getElementById('producto-codigo').value = producto.codigo_producto || '';
            document.getElementById('producto-categoria').value = producto.categoria_id || '';
            document.getElementById('producto-temporada').value = producto.temporada || 'todo_año';
            document.getElementById('producto-precio-compra').value = producto.precio_compra || '';
            document.getElementById('producto-precio-venta').value = producto.precio_venta || '';
            document.getElementById('producto-stock').value = producto.stock_actual || 0;
            document.getElementById('producto-stock-minimo').value = producto.stock_minimo || 5;
            document.getElementById('producto-descripcion').value = producto.descripcion || '';
            // Si tienes más campos, agrégalos aquí
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showToastGlobal('Error abriendo editor', 'error', 'toast-global');
        }
    }

    async verProducto(id) {
        console.log('👁️ Ver producto:', id);
        // TODO: Implementar vista de detalles del producto
    this.showToastGlobal('Vista de detalles en desarrollo', 'info', 'toast-global');
    }

    async eliminarProducto(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este producto?\n\nEsta acción no se puede deshacer.')) {
            try {
                console.log('🗑️ Eliminar producto:', id);
                await window.flowerShopAPI.eliminarProducto(id);
                await this.loadProductosData();
                this.showToastGlobal('Producto eliminado correctamente', 'success', 'toast-global');
            } catch (error) {
                console.error('❌ Error eliminando producto:', error);
                this.showToastGlobal('Error eliminando producto: ' + error.message, 'error', 'toast-global');
            }
        }
    }

    // Clientes
    async nuevoCliente() {
        console.log('➕ Nuevo cliente - Iniciando función');
        try {
            console.log('🔍 Buscando formulario form-cliente...');
            const form = document.getElementById('form-cliente');
            console.log('📝 Formulario encontrado:', form);
            
            console.log('🧹 Limpiando formulario...');
            this.clearForm('form-cliente');
            
            console.log('🔍 Buscando modal modal-cliente...');
            const modal = document.getElementById('modal-cliente');
            console.log('🗖️ Modal encontrado:', modal);
            
            console.log('🚀 Abriendo modal...');
            this.showModal('modal-cliente');
            console.log('✅ Modal abierto exitosamente');
        } catch (error) {
            console.error('❌ Error abriendo modal de cliente:', error);
            this.showToastGlobal('Error abriendo formulario', 'error', 'toast-global');
        }
    }

    async editarCliente(id) {
        console.log('✏️ Editar cliente - Iniciando función con ID:', id);
        try {
            console.log('🔍 Obteniendo lista de clientes...');
            // Obtener todos los clientes y buscar el que corresponde
            const clientes = await window.flowerShopAPI.getClientes();
            console.log('📋 Clientes obtenidos:', clientes.length);
            
            console.log('🔎 Buscando cliente con ID:', id);
            const cliente = clientes.find(c => c.id === id);
            console.log('👤 Cliente encontrado:', cliente);
            
            if (!cliente) {
                console.error('❌ No se encontró el cliente con ID:', id);
                this.showToastGlobal('No se encontró el cliente', 'error', 'toast-global');
                return;
            }
            
            console.log('🔍 Buscando formulario form-cliente...');
            // Rellenar el formulario compacto
            const form = document.getElementById('form-cliente');
            console.log('📝 Formulario encontrado:', form);
            
            if (!form) {
                console.error('❌ No se encontró el formulario form-cliente');
                return;
            }
            
            console.log('🧹 Limpiando formulario...');
            form.reset();
            
            console.log('🏷️ Estableciendo ID de edición:', id);
            form.setAttribute('data-edit-id', id);
            
            console.log('📝 Rellenando campos del formulario...');
            document.getElementById('cliente-nombre-completo').value = cliente.nombre || '';
            document.getElementById('cliente-email').value = cliente.email || '';
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-fecha-nacimiento').value = cliente.fecha_nacimiento || '';
            document.getElementById('cliente-tipo').value = cliente.tipo_cliente || 'nuevo';
            document.getElementById('cliente-preferencias').value = cliente.preferencias || '';
            document.getElementById('cliente-presupuesto-habitual').value = cliente.presupuesto_habitual || '';
            document.getElementById('cliente-ocasiones-importantes').value = cliente.ocasiones_importantes || '';
            document.getElementById('cliente-notas').value = cliente.notas || '';
            
            console.log('✅ Campos del formulario rellenados correctamente');
            
            console.log('🔍 Buscando modal modal-cliente...');
            const modal = document.getElementById('modal-cliente');
            console.log('🗖️ Modal encontrado:', modal);
            
            console.log('🚀 Abriendo modal...');
            this.showModal('modal-cliente');
            console.log('✅ Modal de edición abierto exitosamente');
        } catch (error) {
            console.error('❌ Error editando cliente:', error);
            this.showToastGlobal('Error abriendo editor', 'error', 'toast-global');
        }
    }

    async verCliente(id) {
        try {
            console.log('👁️ Cargando historial del cliente:', id);
            console.log('🔍 Verificando modal historial...');
            
            const modal = document.getElementById('modal-historial-cliente');
            if (!modal) {
                console.error('❌ Modal historial-cliente no encontrado en el DOM');
                this.showToastGlobal('Error: Modal de historial no encontrado', 'error', 'toast-global');
                return;
            }
            
            // Obtener datos del cliente
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === parseInt(id));
            
            if (!cliente) {
                this.showToastGlobal('Cliente no encontrado', 'error', 'toast-global');
                return;
            }

            console.log('👤 Cliente encontrado:', cliente);

            // Obtener historial de pedidos del cliente
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedidosCliente = pedidos.filter(p => p.cliente_id === parseInt(id));

            console.log('📋 Pedidos del cliente:', pedidosCliente);

            // Calcular estadísticas
            const totalPedidos = pedidosCliente.length;
            const totalGastado = pedidosCliente.reduce((sum, p) => sum + (p.total || 0), 0);
            const fechaRegistro = cliente.created_at ? new Date(cliente.created_at).getFullYear() : new Date().getFullYear();

            // Rellenar modal con información del cliente
            document.getElementById('historial-cliente-nombre').textContent = `${cliente.nombre} ${cliente.apellidos || ''}`;
            document.getElementById('historial-cliente-email').textContent = cliente.email || 'Sin email';
            
            // Actualizar estadísticas usando los IDs específicos del HTML
            console.log('🔍 Depurando estadísticas del cliente...');
            console.log('Total pedidos:', totalPedidos);
            console.log('Total gastado:', totalGastado);
            console.log('Fecha registro:', fechaRegistro);
            
            // Usar los IDs específicos para actualizar cada estadística
            const statPedidos = document.getElementById('stat-pedidos');
            const statGastado = document.getElementById('stat-gastado');
            const statFecha = document.getElementById('stat-fecha');
            
            console.log('📋 Elementos encontrados:');
            console.log('statPedidos:', statPedidos);
            console.log('statGastado:', statGastado);
            console.log('statFecha:', statFecha);
            
            if (statPedidos && statGastado && statFecha) {
                console.log('✅ Actualizando estadísticas con IDs específicos...');
                statPedidos.innerHTML = `<strong>${totalPedidos}</strong>&nbsp;pedidos`;
                statGastado.innerHTML = `<strong>${window.flowerShopAPI.formatCurrency(totalGastado)}</strong>&nbsp;gastado`;
                statFecha.innerHTML = `Desde&nbsp;<strong>${fechaRegistro}</strong>`;
                
                console.log('📊 Estadística 1 aplicada:', statPedidos.innerHTML);
                console.log('📊 Estadística 2 aplicada:', statGastado.innerHTML);
                console.log('📊 Estadística 3 aplicada:', statFecha.innerHTML);
            } else {
                console.warn('⚠️ No se encontraron elementos con IDs específicos');
                console.log('Intentando con selector general...');
                
                // Fallback: usar selector de clases como en el editor del usuario
                const statItems = document.querySelectorAll('.cliente-stats .stat-item');
                console.log('📊 Elementos stat-item encontrados:', statItems.length);
                
                if (statItems.length >= 3) {
                    console.log('✅ Usando fallback con selectores de clase...');
                    statItems[0].innerHTML = `<strong>${totalPedidos}</strong> pedidos`;
                    statItems[1].innerHTML = `<strong>${window.flowerShopAPI.formatCurrency(totalGastado)}</strong> gastado`;
                    statItems[2].innerHTML = `Desde <strong>${fechaRegistro}</strong>`;
                    
                    console.log('📊 Fallback aplicado correctamente');
                } else {
                    console.error('❌ No se pudieron encontrar elementos de estadísticas');
                }
            }

            // Mostrar lista de pedidos
            this.mostrarHistorialPedidos(pedidosCliente);

            console.log('🔄 Abriendo modal historial...');
            // Mostrar modal
            this.showModal('modal-historial-cliente');
            
        } catch (error) {
            console.error('❌ Error cargando historial del cliente:', error);
            this.showToastGlobal('Error cargando historial del cliente', 'error', 'toast-global');
        }
    }

    mostrarHistorialPedidos(pedidos) {
        const container = document.getElementById('historial-pedidos-lista');
        
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="no-pedidos" style="padding: 1rem; min-height: auto;">
                    <div class="empty-state" style="padding: 1rem; text-align: center; max-width: 300px; margin: 0 auto;">
                        <div class="empty-icon" style="font-size: 1.5rem; margin-bottom: 0.5rem;">📋</div>
                        <h3 style="font-size: 0.9rem !important; margin: 0.25rem 0 !important; font-weight: 600 !important;">Sin pedidos aún</h3>
                        <p style="font-size: 0.8rem !important; color: #6b7280 !important; margin: 0 !important; line-height: 1.4 !important;">Este cliente no ha realizado ningún pedido todavía.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Ordenar pedidos por fecha (más recientes primero)
        const pedidosOrdenados = pedidos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = pedidosOrdenados.map(pedido => `
            <div class="pedido-item" data-pedido-id="${pedido.id}">
                <div class="pedido-header">
                    <div class="pedido-info">
                        <span class="pedido-numero">#${pedido.numero_pedido}</span>
                        <span class="pedido-fecha">${window.flowerShopAPI.formatDate(pedido.created_at)}</span>
                    </div>
                    <div class="pedido-estado">
                        <span class="estado-badge ${pedido.estado}">${pedido.estado}</span>
                    </div>
                </div>
                <div class="pedido-detalles">
                    <div class="pedido-productos">
                        <strong>Entrega:</strong> ${pedido.fecha_entrega ? window.flowerShopAPI.formatDate(pedido.fecha_entrega) : 'Sin fecha'}
                    </div>
                    <div class="pedido-total">
                        <strong>Total: ${window.flowerShopAPI.formatCurrency(pedido.total || 0)}</strong>
                    </div>
                </div>
                ${pedido.notas ? `<div class="pedido-notas">📝 ${pedido.notas}</div>` : ''}
                <div class="pedido-acciones">
                    <button class="btn btn-sm btn-secondary" onclick="app.verDetallePedido(${pedido.id})" title="Ver detalles">
                        👁️ Ver detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    async nuevoPedidoCliente(id) {
        try {
            console.log('📋 Nuevo pedido para cliente:', id);
            
            // Obtener datos del cliente
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === parseInt(id));
            
            if (!cliente) {
                this.showToastGlobal('Cliente no encontrado', 'error', 'toast-global');
                return;
            }

            console.log('👤 Cliente encontrado:', cliente);

            // Usar la función existente nuevoPedido() indicando que viene desde cliente
            await this.nuevoPedido(true);
            
            // Esperar un poco para que el modal se renderice completamente y LUEGO preseleccionar
            setTimeout(() => {
                console.log('🎯 Iniciando preselección del cliente...');
                this.preseleccionarClienteEnModal(cliente, id);
            }, 200);
            
            console.log('✅ Modal de nuevo pedido abierto');
            
        } catch (error) {
            console.error('❌ Error abriendo formulario de pedido:', error);
            this.showToastGlobal('Error abriendo formulario de pedido', 'error', 'toast-global');
        }
    }

    preseleccionarClienteEnModal(cliente, id) {
        console.log('🎯 Preseleccionando cliente:', cliente.nombre, 'ID:', id);
        
        // Preseleccionar el cliente en el modal creado dinámicamente
        const clienteSelect = document.getElementById('pedido-cliente');
        
        if (!clienteSelect) {
            console.error('❌ No se encontró el select de cliente');
            return;
        }
        
        console.log('✅ Select de cliente encontrado, opciones disponibles:', clienteSelect.options.length);
        
        // Verificar que el cliente esté en las opciones
        const opcionCliente = Array.from(clienteSelect.options).find(option => option.value == id);
        if (!opcionCliente) {
            console.error('❌ Cliente no encontrado en las opciones del select');
            return;
        }
        
        console.log('✅ Opción de cliente encontrada:', opcionCliente.text);
        
        // Preseleccionar el cliente
        clienteSelect.value = id;
        clienteSelect.disabled = true; // Bloquear la selección de cliente
        
        // Agregar estilo visual para indicar que está bloqueado
        clienteSelect.style.cssText = `
            background-color: #f0f8f0 !important;
            cursor: not-allowed;
            border: 2px solid #4CAF50;
            padding: 0.4rem 0.6rem;
            font-size: 0.9rem;
        `;
        
        // Mostrar información del cliente preseleccionado (más compacta)
        const clienteInfo = document.createElement('div');
        clienteInfo.style.cssText = `
            margin-top: 4px;
            padding: 6px 8px;
            background: #e8f5e8;
            border: 1px solid #4CAF50;
            border-radius: 4px;
            font-size: 0.8rem;
            line-height: 1.3;
        `;
        
        // Construir información del cliente solo con datos disponibles
        let infoTexto = `<strong style="color: #2d5016;">✅ ${cliente.nombre} ${cliente.apellidos || ''}</strong>`;
        
        const infoAdicional = [];
        if (cliente.telefono && cliente.telefono.trim()) {
            infoAdicional.push(`📞 ${cliente.telefono.trim()}`);
        }
        if (cliente.email && cliente.email.trim()) {
            infoAdicional.push(`✉️ ${cliente.email.trim()}`);
        }
        
        if (infoAdicional.length > 0) {
            infoTexto += `<br><span style="color: #2d5016;">${infoAdicional.join(' | ')}</span>`;
        }
        
        clienteInfo.innerHTML = infoTexto;
        
        // Insertar después del select
        clienteSelect.parentNode.insertBefore(clienteInfo, clienteSelect.nextSibling);
        
        console.log('✅ Cliente preseleccionado correctamente');
    }

    // Función auxiliar para ver detalles de un pedido desde el historial
    async verDetallePedido(pedidoId) {
        console.log('👁️ Ver detalles del pedido:', pedidoId);
    this.showToastGlobal('Vista de detalles del pedido en desarrollo', 'info', 'toast-global');
    }

    // Función para exportar historial del cliente
    async exportarHistorialCliente() {
        console.log('📄 Exportar historial del cliente');
    this.showToastGlobal('Exportación de PDF en desarrollo', 'info', 'toast-global');
    }

    // Eventos
    async nuevoEvento() {
        console.log('➕ Nuevo evento');
        try {
            this.clearForm('form-evento');
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error abriendo modal de evento:', error);
            this.showToastGlobal('Error abriendo formulario', 'error', 'toast-global');
        }
    }

    async editarEvento(id) {
        console.log('✏️ Editar evento:', id);
    //
        try {
            // Obtener todos los eventos y buscar el que corresponde
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(ev => ev.id === id);
            if (!evento) {
                this.showToastGlobal('No se encontró el evento', 'error', 'toast-global');
                return;
            }
            //
            // Rellenar el formulario
            const form = document.getElementById('form-evento');
            //
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            const inputNombre = document.getElementById('evento-nombre');
            if (inputNombre) {
                inputNombre.value = evento.nombre || evento.evento_nombre || '';
            }
            document.getElementById('evento-fecha-inicio').value = evento.fecha_inicio || '';
            document.getElementById('evento-fecha-fin').value = evento.fecha_fin || '';
            document.getElementById('evento-tipo').value = evento.tipo_evento || '';
            document.getElementById('evento-demanda').value = evento.demanda_esperada || '';
            document.getElementById('evento-descuento').value = evento.descuento_especial || '';
            document.getElementById('evento-preparacion').value = evento.preparacion_dias || 7;
            document.getElementById('evento-descripcion').value = evento.descripcion || '';
            // Solo asignar notas si el campo existe
            const notasField = document.getElementById('evento-notas');
            if (notasField) notasField.value = evento.notas || '';
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error editando evento:', error);
            this.showToastGlobal('Error abriendo editor', 'error', 'toast-global');
        }
    }
    // Eliminar evento
    async eliminarEvento(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este evento?\n\nEsta acción no se puede deshacer.')) {
            try {
                await window.flowerShopAPI.eliminarEvento(id);
                this.showToastGlobal('Evento eliminado correctamente', 'success', 'toast-global');
                await this.loadEventosData();
            } catch (error) {
                this.showToastGlobal('Error al eliminar el evento', 'error', 'toast-global');
                console.error('❌ Error eliminando evento:', error);
            }
        }
    }

    async gestionarEventoStock(id) {
        // Redirigir a la sección de Stock en Inventario
        this.showSection('inventario');
        this.switchInventoryTab && this.switchInventoryTab('stock');
        // Cargar y seleccionar el evento específico
        setTimeout(() => {
            if (typeof this.seleccionarEventoStock === 'function') {
                this.seleccionarEventoStock(id);
            }
        }, 100);
    }

    async nuevoPedido(desdeCliente = false) {
        try {
            // Crear modal si no existe
            let modal = document.getElementById('modal-nuevo-pedido');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-nuevo-pedido';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 950px; padding-top: 0; padding-bottom: 0;">
                        <div class="modal-header" style="padding: 1.5rem 2rem 1rem 2rem;">
                            <div>
                                <h2 class="modal-title-pro" style="font-size: 1.6rem; margin-bottom: 0.3rem;">📋 Nuevo Pedido</h2>
                                <p class="modal-subtitle-pro" style="font-size: 0.9rem;">Crear pedido con productos seleccionados</p>
                            </div>
                            <span class="close modal-close" style="
                                position: absolute;
                                top: 15px;
                                right: 20px;
                                color: #aaa;
                                float: right;
                                font-size: 28px;
                                font-weight: bold;
                                cursor: pointer;
                                line-height: 1;
                                user-select: none;
                            ">&times;</span>
                        </div>
                        <form id="form-nuevo-pedido">
                            <div class="modal-body" style="padding: 1rem 2rem;">
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="pedido-cliente" style="font-size: 0.9rem; margin-bottom: 0.3rem;">Cliente *</label>
                                    <select id="pedido-cliente" name="cliente_id" required class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.9rem;"></select>
                                </div>
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="pedido-productos-list" style="font-size: 0.9rem; margin-bottom: 0.3rem;">Productos *</label>
                                    <div id="pedido-productos-list" style="margin-bottom: 0.5rem;"></div>
                                    <button type="button" id="btn-agregar-producto-pedido" class="btn-agregar-producto" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                                        ➕ Agregar
                                    </button>
                                </div>
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="pedido-entrega" style="font-size: 0.9rem; margin-bottom: 0.3rem;">Fecha de entrega *</label>
                                    <input type="date" id="pedido-entrega" name="entrega" required class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.9rem;" />
                                </div>
                                <div class="form-group" style="margin-bottom: 0.5rem;">
                                    <label for="pedido-notas" style="font-size: 0.9rem; margin-bottom: 0.3rem;">Notas</label>
                                    <textarea id="pedido-notas" name="notas" rows="2" class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.9rem; resize: vertical;" placeholder="Instrucciones especiales..."></textarea>
                                </div>
                            </div>
                            <div class="modal-footer" style="padding: 0.5rem 2rem 0.8rem 2rem; margin: 0; display: flex; justify-content: flex-end;">
                                <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                                    💾 Guardar Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                `;
                document.body.appendChild(modal);
                // Cerrar modal
                modal.querySelector('.close').onclick = () => this.limpiarYCerrarModalPedido();
                modal.addEventListener('click', (e) => { if (e.target === modal) this.limpiarYCerrarModalPedido(); });
                // Evento submit
                modal.querySelector('#form-nuevo-pedido').onsubmit = (e) => this.handleNuevoPedidoSubmit(e);
                // Agregar producto
                modal.querySelector('#btn-agregar-producto-pedido').onclick = () => this.agregarProductoAlPedido();
            }
            // Cargar clientes y productos
            await this.cargarClientesEnPedido();
            await this.cargarProductosEnPedido();
            
            // Solo limpiar si NO viene desde un cliente específico
            if (!desdeCliente) {
                // Limpiar formulario completamente DESPUÉS de cargar datos
                setTimeout(() => {
                    this.limpiarFormularioPedido();
                    // Volver a poner la fecha de hoy tras limpiar
                    const fechaEntregaInput = document.getElementById('pedido-entrega');
                    if (fechaEntregaInput) {
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        fechaEntregaInput.value = `${yyyy}-${mm}-${dd}`;
                        fechaEntregaInput.placeholder = `${dd}/${mm}/${yyyy}`;
                    }
                }, 100);
            } else {
                // Si viene desde cliente, poner la fecha de hoy directamente
                const fechaEntregaInput = document.getElementById('pedido-entrega');
                if (fechaEntregaInput) {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    fechaEntregaInput.value = `${yyyy}-${mm}-${dd}`;
                    fechaEntregaInput.placeholder = `${dd}/${mm}/${yyyy}`;
                }
            }
            // Mostrar modal
            this.showModal('modal-nuevo-pedido');
        } catch (error) {
            this.showToastGlobal('Error abriendo formulario de pedido', 'error', 'toast-global');
        }
    }

    async cargarClientesEnPedido() {
        const select = document.getElementById('pedido-cliente');
        if (!select) return;
        const clientes = await window.flowerShopAPI.getClientes();
        
        // Mejorar visualización del cliente mostrando solo datos disponibles
        const opcionesClientes = clientes.map(c => {
            let textoCliente = `${c.nombre} ${c.apellidos || ''}`.trim();
            
            // Agregar información adicional disponible
            const infoAdicional = [];
            if (c.telefono && c.telefono.trim()) {
                infoAdicional.push(`📞 ${c.telefono.trim()}`);
            }
            if (c.email && c.email.trim()) {
                infoAdicional.push(`✉️ ${c.email.trim()}`);
            }
            
            if (infoAdicional.length > 0) {
                textoCliente += ` - ${infoAdicional.join(' | ')}`;
            }
            
            return `<option value="${c.id}">${textoCliente}</option>`;
        }).join('');
        
        select.innerHTML = '<option value="">Seleccionar cliente</option>' + opcionesClientes;
    }

    async cargarProductosEnPedido() {
        // Guardar productos en memoria para selección rápida
        this._productosParaPedido = await window.flowerShopAPI.getProductos();
    }

    limpiarFormularioPedido() {
        console.log('🧹 Limpiando formulario de pedido...');
        
        // Limpiar todos los campos del formulario
        const clienteSelect = document.getElementById('pedido-cliente');
        const fechaEntrega = document.getElementById('pedido-entrega');
        const notas = document.getElementById('pedido-notas');
        const productosList = document.getElementById('pedido-productos-list');
        
        if (clienteSelect) {
            console.log('🧹 Limpiando campo cliente...');
            clienteSelect.value = '';
            clienteSelect.disabled = false;
            clienteSelect.style.cssText = 'padding: 0.4rem 0.6rem; font-size: 0.9rem;';
            
            // Eliminar TODAS las div de información del cliente que puedan existir
            const parentNode = clienteSelect.parentNode;
            if (parentNode) {
                // Buscar todas las divs que contienen información del cliente
                const clienteInfoDivs = parentNode.querySelectorAll('div[style*="background: #e8f5e8"], div[style*="#e8f5e8"], div[style*="color: #2d5016"]');
                clienteInfoDivs.forEach(div => {
                    console.log('🗑️ Eliminando div de info cliente:', div);
                    div.remove();
                });
                
                // También buscar por contenido específico
                const allDivs = parentNode.querySelectorAll('div');
                allDivs.forEach(div => {
                    if (div.innerHTML && (div.innerHTML.includes('✅') || div.innerHTML.includes('📞') || div.innerHTML.includes('✉️'))) {
                        console.log('🗑️ Eliminando div con iconos cliente:', div);
                        div.remove();
                    }
                });
            }
        }
        
        if (fechaEntrega) {
            console.log('🧹 Limpiando fecha de entrega...');
            fechaEntrega.value = '';
        }
        
        if (notas) {
            console.log('🧹 Limpiando notas...');
            notas.value = '';
        }
        
        if (productosList) {
            console.log('🧹 Limpiando lista de productos...');
            productosList.innerHTML = '';
        }
        
        console.log('✅ Formulario de pedido limpiado completamente');
    }

    limpiarYCerrarModalPedido() {
        this.limpiarFormularioPedido();
        this.hideModal('modal-nuevo-pedido');
    }

    agregarProductoAlPedido() {
        const productos = this._productosParaPedido || [];
        const list = document.getElementById('pedido-productos-list');
        if (!list) return;
        
        // Crear fila de selección compacta
        const row = document.createElement('div');
        row.className = 'pedido-producto-row';
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            padding: 6px 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        `;
        row.innerHTML = `
            <select class="pedido-producto-select form-input" required style="flex: 2; padding: 0.3rem 0.5rem; font-size: 0.85rem;">
                <option value="">Seleccionar producto...</option>
                ${productos.map(p => `<option value="${p.id}">${p.nombre} - €${p.precio_venta}</option>`).join('')}
            </select>
            <input type="number" class="pedido-producto-cantidad form-input" min="1" value="1" required 
                   style="width: 60px; padding: 0.3rem 0.4rem; font-size: 0.85rem;" placeholder="1" />
            <button type="button" class="btn-quitar-producto" style="
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                cursor: pointer;
                line-height: 1;
            ">✕</button>
        `;
        
        // Quitar producto
        row.querySelector('.btn-quitar-producto').onclick = () => row.remove();
        list.appendChild(row);
    }

    async handleNuevoPedidoSubmit(e) {
        e.preventDefault();
        try {
            const form = e.target;
            const clienteId = form.querySelector('#pedido-cliente').value;
            const entrega = form.querySelector('#pedido-entrega').value;
            const notas = form.querySelector('#pedido-notas').value;
            // Productos
            const productos = Array.from(form.querySelectorAll('.pedido-producto-row')).map(row => {
                return {
                    producto_id: parseInt(row.querySelector('.pedido-producto-select').value),
                    cantidad: parseInt(row.querySelector('.pedido-producto-cantidad').value)
                };
            }).filter(p => p.producto_id && p.cantidad > 0);
            if (!clienteId || !entrega || productos.length === 0) {
                this.showToastGlobal('Completa todos los campos obligatorios y agrega al menos un producto', 'warning', 'toast-global');
                return;
            }

            // Calcular subtotal y total (sin descuentos ni impuestos por ahora)
            let subtotal = 0;
            let total = 0;
            let descuento = 0;
            let adelanto = 0;
            let saldo_pendiente = 0;
            let metodo_pago = '';
            let direccion_entrega = '';
            let instrucciones_especiales = '';
            // Obtener precios de productos
            const productosData = this._productosParaPedido || [];
            const detalles = productos.map(p => {
                const prod = productosData.find(pr => pr.id === p.producto_id);
                const precio_unitario = prod ? parseFloat(prod.precio_venta) : 0;
                const cantidad = p.cantidad;
                const subtotalDetalle = precio_unitario * cantidad;
                subtotal += subtotalDetalle;
                return {
                    producto_id: p.producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal: subtotalDetalle,
                    personalizacion: ''
                };
            });
            total = subtotal - descuento; // No se aplica descuento ni impuestos por ahora
            saldo_pendiente = total - adelanto;

            // Guardar pedido con todos los campos requeridos
            const pedido = {
                cliente_id: parseInt(clienteId),
                evento_id: null, // No se selecciona evento en el formulario actual
                fecha_entrega: entrega,
                estado: 'pendiente',
                tipo_pedido: 'regular',
                subtotal,
                descuento,
                total,
                adelanto,
                saldo_pendiente,
                metodo_pago,
                direccion_entrega,
                instrucciones_especiales,
                notas,
                detalles
            };
            const pedidoResult = await window.flowerShopAPI.crearPedido(pedido);
            // Crear notificación real
            let clienteNombre = '';
            try {
                const clientes = await window.flowerShopAPI.getClientes();
                const cliente = clientes.find(c => c.id === pedido.cliente_id);
                clienteNombre = cliente ? cliente.nombre : '';
            } catch {}
            const notificacion = {
                titulo: 'Nuevo pedido creado',
                mensaje: clienteNombre ? `Se ha creado un nuevo pedido para el cliente ${clienteNombre}.` : 'Se ha creado un nuevo pedido.',
                tipo: 'info',
                origen: 'pedidos',
                datos_extra: {
                    pedido_id: pedidoResult.id,
                    numero_pedido: pedidoResult.numero_pedido,
                    cliente_id: pedido.cliente_id
                }
            };
            await window.flowerShopAPI.crearNotificacion(notificacion);
            // Actualizar badge de notificaciones inmediatamente
            const notificacionesActualizadas = await window.flowerShopAPI.listarNotificaciones();
            this.updateNotificacionesBadge(notificacionesActualizadas);
            this.showToastGlobal('Pedido creado correctamente', 'success', 'toast-global');
            this.limpiarYCerrarModalPedido();
            // Si estamos en la sección de pedidos, actualizar ambas tablas y el badge
            if (this.currentSection === 'pedidos') {
                await Promise.all([
                    this.loadPedidosPendientes(),
                    this.loadPedidosData(),
                    this.updateSidebarBadges()
                ]);
            } else {
                await this.updateSidebarBadges();
            }
        } catch (error) {
            this.showToastGlobal('Error guardando pedido', 'error', 'toast-global');
        }
    }

    // ========== MODALES ==========
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Cerrar con cualquier botón .modal-close o .btn-cancelar dentro del modal
            const closeBtns = modal.querySelectorAll('.modal-close, .btn-cancelar');
            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => this.hideModal(modal.id));
            });
            // Cerrar al hacer click fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal[style*="block"]');
                if (activeModal) {
                    // Si es el modal de pedidos, usar la función de limpieza
                    if (activeModal.id === 'modal-nuevo-pedido') {
                        this.limpiarYCerrarModalPedido();
                    } else {
                        this.hideModal(activeModal.id);
                    }
                }
            }
        });

        // Configurar formularios
        this.setupForms();
    }

    setupForms() {
        // Formulario de producto
        const formProducto = document.getElementById('form-producto');
        if (formProducto) {
            formProducto.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductoSubmit(e);
            });
        }

        // Formulario de cliente
        const formCliente = document.getElementById('form-cliente');
        if (formCliente) {
            formCliente.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleClienteSubmit(e);
            });
        }

        // Formulario de evento
        const formEvento = document.getElementById('form-evento');
        if (formEvento) {
            formEvento.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEventoSubmit(e);
            });
        }
    }

    async handleProductoSubmit(e) {
        try {
            const form = e.target;
            const formData = new FormData(form);
            const producto = {
                codigo_producto: formData.get('codigo_producto'),
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion'),
                categoria_id: parseInt(formData.get('categoria_id')),
                precio_compra: parseFloat(formData.get('precio_compra')) || 0,
                precio_venta: parseFloat(formData.get('precio_venta')),
                stock_actual: parseInt(formData.get('stock_actual')) || 0,
                stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
                unidad_medida: formData.get('unidad_medida') || 'unidad',
                temporada: formData.get('temporada') || 'todo_año',
                perecedero: formData.get('perecedero') === 'on',
                dias_caducidad: parseInt(formData.get('dias_caducidad')) || null,
                proveedor: formData.get('proveedor') || ''
            };

            // Validación básica
            if (!producto.nombre || !producto.precio_venta || !producto.categoria_id) {
                this.showToastGlobal('Por favor completa los campos obligatorios', 'warning', 'toast-global');
                return;
            }

            // Si está en modo edición
            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                await window.flowerShopAPI.actualizarProducto(Number(editId), producto);
                form.removeAttribute('data-edit-id');
                this.showToastGlobal('Producto actualizado correctamente', 'success', 'toast-global');
            } else {
                await window.flowerShopAPI.crearProducto(producto);
                this.showToastGlobal('Producto guardado correctamente', 'success', 'toast-global');
            }
            this.hideModal('modal-producto');
            await this.loadProductosData();
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showToastGlobal('Error guardando producto: ' + error.message, 'error', 'toast-global');
        }
    }

    async handleClienteSubmit(e) {
        try {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const editId = form.getAttribute('data-edit-id');
            
            const nombreCompleto = formData.get('nombre_completo')?.trim() || '';
            const cliente = {
                nombre: nombreCompleto,
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                fecha_nacimiento: formData.get('fecha_nacimiento'),
                tipo_cliente: formData.get('tipo_cliente') || 'nuevo',
                preferencias: formData.get('preferencias'),
                presupuesto_habitual: formData.get('presupuesto_habitual') ? parseFloat(formData.get('presupuesto_habitual')) : null,
                ocasiones_importantes: formData.get('ocasiones_importantes'),
                notas: formData.get('notas')
            };

            console.log('📝 Guardando cliente:', cliente);

            if (!cliente.nombre) {
                this.showToastGlobal('El nombre completo es obligatorio', 'warning', 'toast-global');
                return;
            }

            // Validar email si se proporciona
            if (cliente.email && !cliente.email.includes('@')) {
                this.showToastGlobal('El formato del email no es válido', 'warning', 'toast-global');
                return;
            }

            if (editId) {
                console.log('✏️ Actualizando cliente existente con ID:', editId);
                await window.flowerShopAPI.actualizarCliente(editId, cliente);
                this.showToastGlobal('Cliente actualizado correctamente', 'success', 'toast-global');
            } else {
                console.log('➕ Creando nuevo cliente');
                await window.flowerShopAPI.crearCliente(cliente);
                this.showToastGlobal('Cliente creado correctamente', 'success', 'toast-global');
            }
            
            this.hideModal('modal-cliente');
            await this.loadClientesData();

        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
            this.showToastGlobal('Error guardando cliente: ' + error.message, 'error', 'toast-global');
        }
    }

    async handleEventoSubmit(e) {
        try {
            const form = e.target;
            const formData = new FormData(form);
            const evento = {
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion'),
                fecha_inicio: formData.get('fecha_inicio'),
                fecha_fin: formData.get('fecha_fin'),
                tipo_evento: formData.get('tipo_evento'),
                demanda_esperada: formData.get('demanda_esperada'),
                descuento_especial: parseFloat(formData.get('descuento_especial')) || 0,
                preparacion_dias: parseInt(formData.get('preparacion_dias')) || 7,
                notas: formData.get('notas')
            };

            console.log('📝 Guardando evento:', evento);

            if (!evento.nombre || !evento.fecha_inicio || !evento.fecha_fin) {
                this.showToastGlobal('Por favor completa los campos obligatorios', 'warning', 'toast-global');
                return;
            }

            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                // Actualizar evento existente
                await window.flowerShopAPI.actualizarEvento(Number(editId), evento);

                form.removeAttribute('data-edit-id');
                this.showToastGlobal('Evento actualizado correctamente', 'success', 'toast-global');
            } else {
                // Crear nuevo evento
                await window.flowerShopAPI.crearEvento(evento);
                this.showToastGlobal('Evento guardado correctamente', 'success', 'toast-global');
            }
            this.hideModal('modal-evento');
            await this.loadEventosData();
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            this.showToastGlobal('Error guardando evento: ' + error.message, 'error', 'toast-global');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Cerrar cualquier otro modal abierto
            document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            console.log(`🔄 Modal abierto: ${modalId}`);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = 'auto';
            console.log(`🔄 Modal cerrado: ${modalId}`);
        }
    }

        // Filtrar clientes por término de búsqueda
    filtrarClientes(termino) {
        const filas = document.querySelectorAll('#clientes-table tbody tr');
        filas.forEach(fila => {
            const texto = fila.textContent.toLowerCase();
            if (texto.includes(termino.toLowerCase())) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Botones principales
        document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => this.nuevoProducto());
        document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => this.nuevoCliente());
        document.getElementById('btn-nuevo-evento')?.addEventListener('click', () => this.nuevoEvento());
        document.getElementById('btn-nuevo-pedido')?.addEventListener('click', () => this.nuevoPedido());
        document.getElementById('btn-nuevo-pedido-section')?.addEventListener('click', () => this.nuevoPedido());
        
        // Botones de inventario
        document.getElementById('btn-generar-orden-auto')?.addEventListener('click', () => this.generarOrdenAutomatica());
        document.getElementById('btn-nueva-orden')?.addEventListener('click', () => this.nuevaOrdenCompra());
        document.getElementById('btn-nuevo-movimiento')?.addEventListener('click', () => this.nuevoMovimientoInventario());
        document.getElementById('btn-filtrar-movimientos')?.addEventListener('click', () => this.filtrarMovimientos());
        
        // Pestañas de inventario
        this.setupInventoryTabs();
        
        // Floating Action Button
        this.setupFAB();
        
        // Búsqueda y filtros
        document.getElementById('search-productos')?.addEventListener('input', (e) => {
            this.filtrarProductos(e.target.value);
        });
        
        document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
            this.filtrarProductosPorCategoria(e.target.value);
        });
        
        // Búsqueda global
        document.querySelector('.global-search-input')?.addEventListener('input', (e) => {
            this.busquedaGlobal(e.target.value);
        });

        // Filtro de búsqueda de clientes
        document.getElementById('search-clientes')?.addEventListener('input', (e) => {
            this.filtrarClientes(e.target.value);
        });
        
        // Eventos del menú
        if (window.flowerShopAPI?.onMenuAction) {
            window.flowerShopAPI.onMenuAction((action) => {
                this.handleMenuAction(action);
            });
        }

        // Dashboard stat cards click
        document.querySelectorAll('.dashboard-link').forEach(card => {
            card.addEventListener('click', (e) => {
                const section = card.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Topbar: Notificaciones, Configuración, Perfil
        document.querySelector('.nav-action-btn[title="Notificaciones"]')?.addEventListener('click', () => {
            this.showSection('notificaciones');
        });
        document.querySelector('.nav-action-btn[title="Configuración"]')?.addEventListener('click', () => {
            this.showSection('configuracion');
        });
        document.querySelector('.user-menu')?.addEventListener('click', () => {
            this.showSection('perfil');
        });
    }

    setupFAB() {
        const mainFab = document.getElementById('main-fab');
        const fabMenu = document.getElementById('fab-menu');
        
        if (mainFab && fabMenu) {
            let isOpen = false;
            
            mainFab.addEventListener('click', () => {
                isOpen = !isOpen;
                fabMenu.classList.toggle('active', isOpen);
                mainFab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
            });
            
            // Cerrar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!mainFab.contains(e.target) && !fabMenu.contains(e.target)) {
                    isOpen = false;
                    fabMenu.classList.remove('active');
                    mainFab.style.transform = 'rotate(0deg)';
                }
            });
            
            // Acciones del FAB
            fabMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.fab-secondary')?.dataset.action;
                if (action) {
                    this.handleFabAction(action);
                    // Cerrar menú
                    isOpen = false;
                    fabMenu.classList.remove('active');
                    mainFab.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    handleFabAction(action) {
        switch (action) {
            case 'nuevo-producto':
                this.nuevoProducto();
                break;
            case 'nuevo-cliente':
                this.nuevoCliente();
                break;
            case 'nuevo-evento':
                this.nuevoEvento();
                break;
            case 'nuevo-pedido':
                this.nuevoPedido();
                break;
        }
    }

    busquedaGlobal(termino) {
        if (termino.length < 2) return;
        
        console.log('🔍 Búsqueda global:', termino);
        // TODO: Implementar búsqueda global en todas las secciones
    this.showToastGlobal(`Buscando: "${termino}"`, 'info', 'toast-global');
    }

    updateBreadcrumbs(section) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            const sectionNames = {
                dashboard: 'Dashboard',
                productos: 'Productos',
                clientes: 'Clientes',
                eventos: 'Eventos',
                pedidos: 'Pedidos',
                inventario: 'Inventario',
                reportes: 'Reportes'
            };
            
            breadcrumbs.innerHTML = `
                <span class="breadcrumb-item active">${sectionNames[section] || section}</span>
            `;
        }
    }

    // ========== FILTROS ==========
    filtrarProductos(termino) {
        const filas = document.querySelectorAll('#productos-table tbody tr');
        filas.forEach(fila => {
            const texto = fila.textContent.toLowerCase();
            if (texto.includes(termino.toLowerCase())) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    filtrarProductosPorCategoria(categoria) {
        const filas = document.querySelectorAll('#productos-table tbody tr');
        filas.forEach(fila => {
            if (!categoria || fila.textContent.includes(categoria)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    // ========== UTILIDADES ==========
    handleMenuAction(action) {
        switch (action) {
            case 'productos':
                this.showSection('productos');
                break;
            case 'clientes':
                this.showSection('clientes');
                break;
            case 'eventos':
                this.showSection('eventos');
                break;
            case 'pedidos':
                this.showSection('pedidos');
                break;
            case 'reportes-ventas':
            case 'reportes-inventario':
            case 'reportes-eventos':
                this.showSection('reportes');
                break;
            case 'ayuda':
                this.mostrarAyuda();
                break;
            case 'acerca-de':
                this.mostrarAcercaDe();
                break;
        }
    }

    mostrarAyuda() {
        alert('🌸 Floristería Manager\n\nManual de usuario próximamente disponible');
    }

    mostrarAcercaDe() {
        alert('🌸 Floristería Manager v1.0.0\nSistema de gestión integral para floristerías\n\n© 2025 - Desarrollado con ❤️');
    }

    /**
     * Muestra un toast global en la esquina superior derecha.
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'info', 'warning'
     * @param {string} [id] - ID único opcional para el toast (por defecto 'toast-global')
     */
    showToastGlobal(message, type = 'info', id = 'toast-global') {
        // Eliminar cualquier toast global existente
        const prev = document.getElementById(id);
        if (prev) prev.remove();

        // Crear el toast
        const toast = document.createElement('div');
        toast.id = id;
    toast.className = `toast-global toast-global-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;

    // Cerrar al hacer click en el toast
    toast.onclick = () => toast.remove();

        // Insertar en el body
        document.body.appendChild(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-cerrar tras 4s
        setTimeout(() => {
            if (document.getElementById(id)) toast.remove();
        }, 4000);
    }

    /**
     * Devuelve el icono adecuado para el tipo de toast
     */
    getToastIcon(type) {
        // SVG icons for a more professional look
        switch (type) {
            case 'success':
                return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#e6f4ea"/><path d="M8 12l2.5 2.5L16 9"/></svg>`;
            case 'error':
                return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#fbeaea"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;
            case 'warning':
                return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#fff7e6"/><path d="M12 8v4M12 16h.01"/></svg>`;
            case 'info':
            default:
                return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#eaf1fb"/><path d="M12 8h.01M12 12v4"/></svg>`;
        }
    }

    // ========== FUNCIONES DE INVENTARIO AVANZADO ==========
    
    setupInventoryTabs() {
        const tabBtns = document.querySelectorAll('.inventory-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchInventoryTab(tabId);
            });
        });
    }

    switchInventoryTab(tabId) {
        // Actualizar botones de pestañas
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Actualizar contenido de pestañas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos específicos de la pestaña
        this.loadInventoryTabData(tabId);
    }

    async loadInventoryTabData(tabId) {
        switch(tabId) {
            case 'dashboard':
                await this.loadInventoryDashboard();
                break;
            case 'alertas':
                await this.loadAlertasStock();
                break;
            case 'prediccion':
                await this.loadPrediccionDemanda();
                break;
            case 'stock':
                await this.loadStockEventos();
                break;
            case 'proveedores':
                await this.loadProviders();
                break;
            case 'ordenes':
                await this.loadOrdenesCompra();
                break;
            case 'movimientos':
                await this.loadMovimientosInventario();
                break;
        }
    }

    async nuevoProveedor() {
        console.log('🆕 Creando nuevo proveedor...');
        
        try {
            // Crear modal con el estilo igual al de productos
            const modal = this.createProveedorModal();
            document.body.appendChild(modal);
            
            // Mostrar modal usando el método estándar
            this.showModal('modal-proveedor');
            
        } catch (error) {
            console.error('❌ Error al crear proveedor:', error);
            this.showToastGlobal('Error al abrir formulario de proveedor', 'error', 'toast-global');
        }
    }

    createProveedorModal(proveedor = null) {
        const isEdit = proveedor !== null;
        const modal = document.createElement('div');
        modal.id = 'modal-proveedor';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header" style="display: flex; flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 1.5rem;">
                    <div style="flex:1 1 auto; min-width:0;">
                        <h2 class="modal-title-pro">🏪 ${isEdit ? 'Editar Proveedor' : 'Alta de Proveedor'}</h2>
                        <p class="modal-subtitle-pro">${isEdit ? 'Modifica los datos del proveedor en tu sistema' : 'Completa los datos para registrar un nuevo proveedor en tu sistema'}</p>
                    </div>
                    <span class="close modal-close" style="font-size:2.2rem;line-height:1;cursor:pointer;align-self:flex-start;opacity:0.7;transition:opacity 0.2s;">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="form-proveedor" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${proveedor.id}">` : ''}
                        
                        <div class="form-group">
                            <label for="proveedor-nombre">Nombre *</label>
                            <input 
                                type="text" 
                                id="proveedor-nombre"
                                name="nombre" 
                                value="${isEdit ? proveedor.nombre || '' : ''}"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="proveedor-contacto">Contacto</label>
                            <input 
                                type="text" 
                                id="proveedor-contacto"
                                name="contacto"
                                value="${isEdit ? proveedor.contacto || '' : ''}"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="proveedor-telefono">Teléfono</label>
                            <input 
                                type="tel" 
                                id="proveedor-telefono"
                                name="telefono"
                                value="${isEdit ? proveedor.telefono || '' : ''}"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="proveedor-email">Email</label>
                            <input 
                                type="email" 
                                id="proveedor-email"
                                name="email"
                                value="${isEdit ? proveedor.email || '' : ''}"
                            >
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="proveedor-direccion">Dirección</label>
                            <textarea 
                                id="proveedor-direccion"
                                name="direccion" 
                                rows="3"
                            >${isEdit ? proveedor.direccion || '' : ''}</textarea>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancelar modal-close">
                        ❌ Cancelar
                    </button>
                    <button type="submit" form="form-proveedor" class="btn btn-guardar">
                        💾 ${isEdit ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.querySelector('.btn-cancelar').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.querySelector('button[type="submit"]').addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('form-proveedor');
            if (form) {
                await this.guardarProveedor(new FormData(form), isEdit);
            }
        });
        
        return modal;
    }

    closeModal(modal) {
        if (modal.classList.contains('modal-professional')) {
            modal.classList.remove('show');
            // Esperar a que termine la transición antes de remover del DOM
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 200); // Sincronizado con la transición CSS
        } else {
            modal.style.display = 'none';
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }
    }

    async guardarProveedor(formData, isEdit = false) {
        try {
            const proveedor = {
                nombre: formData.get('nombre'),
                contacto: formData.get('contacto'),
                telefono: formData.get('telefono'),
                email: formData.get('email'),
                direccion: formData.get('direccion')
            };

            if (isEdit) {
                const id = parseInt(formData.get('id'));
                await window.flowerShopAPI.actualizarProveedor(id, proveedor);
                this.showToastGlobal('Proveedor actualizado correctamente', 'success', 'toast-global');
            } else {
                await window.flowerShopAPI.crearProveedor(proveedor);
                this.showToastGlobal('Proveedor creado correctamente', 'success', 'toast-global');
            }
            
            // Cerrar modal usando el método estándar
            this.hideModal('modal-proveedor');
            
            await this.loadProviders();
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            this.showToastGlobal('Error al guardar proveedor', 'error', 'toast-global');
        }
    }

    async generarOrdenAutomatica() {
        try {
            this.showToastGlobal('Generando orden automática...', 'info', 'toast-global');
            const ordenAutomatica = await window.flowerShopAPI.generarOrdenAutomatica();
            
            if (ordenAutomatica && ordenAutomatica.productos && ordenAutomatica.productos.length > 0) {
                this.showToastGlobal(`Orden automática generada con ${ordenAutomatica.productos.length} productos`, 'success', 'toast-global');
                await this.loadOrdenesCompra();
            } else {
                this.showToastGlobal('No se necesitan órdenes automáticas en este momento', 'info', 'toast-global');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showToastGlobal('Error al generar orden automática', 'error', 'toast-global');
        }
    }

    async nuevaOrdenCompra() {
        const modal = document.getElementById('modal-orden-compra') || this.createOrdenCompraModal();
        this.openModal(modal);
    }

    createOrdenCompraModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-orden-compra';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>📋 Nueva Orden de Compra</h3>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="form-orden-compra" class="form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Proveedor *</label>
                                <select class="form-select" name="proveedor_id" required>
                                    <option value="">Seleccionar proveedor...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha Entrega</label>
                                <input type="date" class="form-input" name="fecha_entrega">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Productos</label>
                            <div id="productos-orden" class="productos-selector">
                                <button type="button" class="btn btn-secondary" id="btn-agregar-producto-orden">➕ Agregar Producto</button>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('modal-orden-compra')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">💾 Crear Orden</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#form-orden-compra').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarOrdenCompra(new FormData(e.target));
        });
        
        return modal;
    }

    async nuevoMovimientoInventario() {
        const modal = document.getElementById('modal-movimiento') || this.createMovimientoModal();
        this.openModal(modal);
    }

    createMovimientoModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-movimiento';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📦 Registrar Movimiento</h3>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="form-movimiento" class="form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Producto *</label>
                                <select class="form-select" name="producto_id" required>
                                    <option value="">Seleccionar producto...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tipo Movimiento *</label>
                                <select class="form-select" name="tipo_movimiento" required>
                                    <option value="entrada">📥 Entrada</option>
                                    <option value="salida">📤 Salida</option>
                                    <option value="ajuste">⚖️ Ajuste</option>
                                    <option value="devolucion">🔄 Devolución</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Cantidad *</label>
                                <input type="number" class="form-input" name="cantidad" min="1" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Stock Actual</label>
                                <input type="number" class="form-input" name="stock_anterior" readonly>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Motivo</label>
                            <input type="text" class="form-input" name="motivo" placeholder="Descripción del movimiento">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('modal-movimiento')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">💾 Registrar Movimiento</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#form-movimiento').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarMovimiento(new FormData(e.target));
        });
        
        return modal;
    }

    async filtrarMovimientos() {
        const fechaDesde = document.getElementById('filter-fecha-desde').value;
        const fechaHasta = document.getElementById('filter-fecha-hasta').value;
        const tipoMovimiento = document.getElementById('filter-tipo-movimiento').value;
        
        const filtros = {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            tipo_movimiento: tipoMovimiento
        };
        
        await this.loadMovimientosInventario(filtros);
    }

    async nuevaOrdenCompra() {
        try {
            // Crear modal para nueva orden
            const modal = this.createOrdenModal();
            document.body.appendChild(modal);
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Error al crear orden:', error);
            this.showToastGlobal('Error al abrir formulario de orden', 'error', 'toast-global');
        }
    }

    async nuevoMovimientoInventario() {
        try {
            // Crear modal para nuevo movimiento
            const modal = this.createMovimientoInventarioModal();
            document.body.appendChild(modal);
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Error al crear movimiento:', error);
            this.showToastGlobal('Error al abrir formulario de movimiento', 'error', 'toast-global');
        }
    }

    createMovimientoInventarioModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-nuevo-movimiento';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header" style="display: flex; flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 1.5rem;">
                    <div style="flex:1 1 auto; min-width:0;">
                        <h2 class="modal-title-pro">📝 Registro de Movimiento</h2>
                        <p class="modal-subtitle-pro">Completa los datos para registrar un movimiento de inventario en tu sistema</p>
                    </div>
                    <span class="close modal-close" style="font-size:2.2rem;line-height:1;cursor:pointer;align-self:flex-start;opacity:0.7;transition:opacity 0.2s;" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="form-movimiento" class="form">
                        <div class="form-group">
                            <label for="movimiento-producto">Producto *</label>
                            <select id="movimiento-producto" name="producto_id" required>
                                <option value="">Seleccionar producto...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="movimiento-tipo">Tipo de Movimiento *</label>
                            <select id="movimiento-tipo" name="tipo_movimiento" required>
                                <option value="">Seleccionar tipo...</option>
                                <option value="entrada">Entrada</option>
                                <option value="salida">Salida</option>
                                <option value="ajuste">Ajuste</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="movimiento-cantidad">Cantidad *</label>
                            <input type="number" id="movimiento-cantidad" name="cantidad" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="movimiento-motivo">Motivo</label>
                            <input type="text" id="movimiento-motivo" name="motivo" placeholder="Ej: Venta, Restock, Daño, etc.">
                        </div>
                        <div class="form-group">
                            <label for="movimiento-fecha">Fecha</label>
                            <input type="datetime-local" id="movimiento-fecha" name="fecha_movimiento" value="${new Date().toISOString().slice(0, 16)}">
                        </div>
                        <div class="form-actions" style="flex-basis:100%">
                            <button type="button" class="btn btn-cancelar modal-close" onclick="this.closest('.modal').style.display='none'">❌ Cancelar</button>
                            <button type="submit" class="btn btn-guardar">💾 Registrar Movimiento</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Cargar productos de forma asíncrona
        setTimeout(async () => {
            try {
                await this.loadProductosInSelect(modal.querySelector('#movimiento-producto'));
            } catch (error) {
                console.error('Error cargando productos:', error);
            }
        }, 100);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.remove();
            }
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
        });
        
        modal.querySelector('#form-movimiento').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarMovimiento(new FormData(e.target));
        });
        
        return modal;
    }

    async loadProductosInSelect(selectElement) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.nombre} (Stock: ${producto.stock})`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    async guardarMovimiento(formData) {
        try {
            const movimiento = {
                producto_id: parseInt(formData.get('producto_id')),
                tipo_movimiento: formData.get('tipo_movimiento'),
                cantidad: parseInt(formData.get('cantidad')),
                motivo: formData.get('motivo') || null,
                fecha_movimiento: formData.get('fecha_movimiento'),
                usuario: 'Usuario' // Aquí puedes poner el usuario actual
            };

            await window.electronAPI.createMovimientoInventario(movimiento);
            this.showToastGlobal('Movimiento registrado correctamente', 'success', 'toast-global');
            
            const modal = document.getElementById('modal-nuevo-movimiento');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            
            await this.loadMovimientosInventario();
        } catch (error) {
            console.error('Error guardando movimiento:', error);
            this.showToastGlobal('Error al registrar movimiento', 'error', 'toast-global');
        }
    }

    // Funciones para botones de acciones
    async editarProveedor(id) {
        console.log(`✏️ Intentando editar proveedor con ID: ${id}`);
        try {
            // Obtener datos del proveedor
            console.log('📥 Obteniendo datos del proveedor...');
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                console.error('❌ Proveedor no encontrado');
                this.showToastGlobal('Proveedor no encontrado', 'error', 'toast-global');
                return;
            }

            console.log('📝 Proveedor encontrado:', proveedor.nombre);
            // Crear modal para editar proveedor
            const modal = this.createProveedorModal(proveedor);
            document.body.appendChild(modal);
            
            // Mostrar modal usando el método estándar
            this.showModal('modal-proveedor');
            console.log('✅ Modal de edición creado y mostrado');
            
        } catch (error) {
            console.error('❌ Error al editar proveedor:', error);
            this.showToastGlobal('Error al cargar datos del proveedor', 'error', 'toast-global');
        }
    }

    async eliminarProveedor(id) {
        try {
            // Obtener información del proveedor antes de eliminar
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showToastGlobal('Proveedor no encontrado', 'error', 'toast-global');
                return;
            }
            
            // Confirmar eliminación
            const confirmMessage = `🗑️ ¿Estás seguro de que deseas eliminar el proveedor "${proveedor.nombre}"?\n\n⚠️ Esta acción desactivará el proveedor pero mantendrá el historial de órdenes.\n\nEsta acción no se puede deshacer.`;
            
            if (confirm(confirmMessage)) {
                await window.flowerShopAPI.eliminarProveedor(id);
                this.showToastGlobal(`Proveedor "${proveedor.nombre}" eliminado correctamente`, 'success', 'toast-global');
                await this.loadProviders(); // Recargar lista
            }
            
        } catch (error) {
            console.error('❌ Error eliminando proveedor:', error);
            this.showToastGlobal('Error al eliminar proveedor: ' + error.message, 'error', 'toast-global');
        }
    }

    verOrden(id) {
    this.showToastGlobal(`Viendo orden ${id}`, 'info', 'toast-global');
    }

    createOrdenModal(orden = null) {
        const isEdit = orden !== null;
        const modal = document.createElement('div');
        modal.id = 'modal-orden';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header" style="display: flex; flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 1.5rem;">
                    <div style="flex:1 1 auto; min-width:0;">
                        <h2 class="modal-title-pro">📋 ${isEdit ? 'Editar' : 'Nueva'} Orden de Compra</h2>
                        <p class="modal-subtitle-pro">${isEdit ? 'Modifica los datos de la orden de compra' : 'Completa los datos para crear una nueva orden de compra'}</p>
                    </div>
                    <span class="close modal-close" style="font-size:2.2rem;line-height:1;cursor:pointer;align-self:flex-start;opacity:0.7;transition:opacity 0.2s;" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="form-orden" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${orden.id}">` : ''}
                        <div class="form-group">
                            <label for="orden-proveedor">Proveedor *</label>
                            <select id="orden-proveedor" name="proveedor_id" required>
                                <option value="">Seleccionar proveedor...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="orden-fecha">Fecha de Orden</label>
                            <input type="date" id="orden-fecha" name="fecha_orden" value="${isEdit ? orden.fecha_orden || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label for="orden-estado">Estado</label>
                            <select id="orden-estado" name="estado">
                                <option value="pendiente" ${isEdit && orden.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="enviada" ${isEdit && orden.estado === 'enviada' ? 'selected' : ''}>Enviada</option>
                                <option value="recibida" ${isEdit && orden.estado === 'recibida' ? 'selected' : ''}>Recibida</option>
                                <option value="cancelada" ${isEdit && orden.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex-basis:100%">
                            <label for="orden-notas">Notas</label>
                            <textarea id="orden-notas" name="notas" rows="3">${isEdit ? orden.notas || '' : ''}</textarea>
                        </div>
                        <div class="form-actions" style="flex-basis:100%">
                            <button type="button" class="btn btn-cancelar modal-close" onclick="this.closest('.modal').style.display='none'">❌ Cancelar</button>
                            <button type="submit" class="btn btn-guardar">💾 ${isEdit ? 'Actualizar' : 'Crear'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Cargar proveedores de forma asíncrona para no bloquear
        setTimeout(async () => {
            try {
                await this.loadProveedoresInSelect(modal.querySelector('#orden-proveedor'), isEdit ? orden.proveedor_id : null);
            } catch (error) {
                console.error('Error cargando proveedores:', error);
            }
        }, 100);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.remove();
            }
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
        });
        
        modal.querySelector('#form-orden').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarOrden(new FormData(e.target), isEdit);
        });
        
        return modal;
    }

    async loadProveedoresInSelect(selectElement, selectedId = null) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            proveedores.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = proveedor.nombre;
                if (selectedId && proveedor.id === selectedId) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando proveedores:', error);
        }
    }

    async guardarOrden(formData, isEdit = false) {
        try {
            const orden = {
                proveedor_id: parseInt(formData.get('proveedor_id')),
                fecha_orden: formData.get('fecha_orden'),
                estado: formData.get('estado'),
                notas: formData.get('notas') || null
            };

            if (isEdit) {
                orden.id = parseInt(formData.get('id'));
                await window.electronAPI.updateOrdenCompra(orden);
                this.showToastGlobal('Orden actualizada correctamente', 'success', 'toast-global');
            } else {
                await window.electronAPI.createOrdenCompra(orden);
                this.showToastGlobal('Orden creada correctamente', 'success', 'toast-global');
            }
            
            const modal = document.getElementById('modal-orden');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error guardando orden:', error);
            this.showToastGlobal('Error al guardar orden', 'error', 'toast-global');
        }
    }

    async editarOrden(id) {
        try {
            // Obtener datos de la orden
            const ordenes = await window.electronAPI.getOrdenesCompra();
            const orden = ordenes.find(o => o.id === id);
            
            if (!orden) {
                this.showToastGlobal('Orden no encontrada', 'error', 'toast-global');
                return;
            }

            // Crear modal para editar orden
            const modal = this.createOrdenModal(orden);
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error al editar orden:', error);
            this.showToastGlobal('Error al cargar datos de la orden', 'error', 'toast-global');
        }
    }

    async verMovimiento(id) {
        try {
            // Obtener datos del movimiento
            const movimientos = await window.electronAPI.getMovimientosInventario();
            const movimiento = movimientos.find(m => m.id === id);
            
            if (!movimiento) {
                this.showToastGlobal('Movimiento no encontrado', 'error', 'toast-global');
                return;
            }

            // Crear modal para ver detalles del movimiento
            const modal = document.createElement('div');
            modal.id = 'modal-movimiento';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📝 Detalles del Movimiento</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="movimiento-details">
                            <div class="detail-row">
                                <strong>ID:</strong> ${movimiento.id}
                            </div>
                            <div class="detail-row">
                                <strong>Producto:</strong> ${movimiento.producto_nombre || 'N/A'}
                            </div>
                            <div class="detail-row">
                                <strong>Tipo:</strong> 
                                <span class="tipo-${movimiento.tipo_movimiento}">${movimiento.tipo_movimiento}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Cantidad:</strong> ${movimiento.cantidad}
                            </div>
                            <div class="detail-row">
                                <strong>Fecha:</strong> ${new Date(movimiento.fecha_movimiento).toLocaleDateString()}
                            </div>
                            <div class="detail-row">
                                <strong>Motivo:</strong> ${movimiento.motivo || 'N/A'}
                            </div>
                            <div class="detail-row">
                                <strong>Usuario:</strong> ${movimiento.usuario || 'Sistema'}
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });
            
        } catch (error) {
            console.error('Error al ver movimiento:', error);
            this.showToastGlobal('Error al cargar datos del movimiento', 'error', 'toast-global');
        }
    }

    async generarOrdenProducto(productoId) {
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === productoId);
            
            if (!producto) {
                this.showToastGlobal('Producto no encontrado', 'error', 'toast-global');
                return;
            }

            // Crear modal para generar orden específica
            const modal = document.createElement('div');
            modal.id = 'modal-orden-producto';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📋 Generar Orden para Producto</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="producto-info">
                            <h3>🌸 ${producto.nombre}</h3>
                            <p><strong>Stock actual:</strong> ${producto.stock}</p>
                            <p><strong>Precio:</strong> $${producto.precio}</p>
                        </div>
                        <form id="form-orden-producto" class="form">
                            <input type="hidden" name="producto_id" value="${producto.id}">
                            <div class="form-group">
                                <label for="cantidad-orden">Cantidad a solicitar *</label>
                                <input type="number" id="cantidad-orden" name="cantidad" min="1" value="10" required>
                            </div>
                            <div class="form-group">
                                <label for="proveedor-orden">Proveedor *</label>
                                <select id="proveedor-orden" name="proveedor_id" required>
                                    <option value="">Seleccionar proveedor...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="notas-orden">Notas</label>
                                <textarea id="notas-orden" name="notas" rows="3" placeholder="Notas adicionales para la orden..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancelar</button>
                                <button type="submit" class="btn btn-primary">📦 Generar Orden</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
            // Cargar proveedores
            this.loadProveedoresInSelect(modal.querySelector('#proveedor-orden'));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });
            
            modal.querySelector('#form-orden-producto').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Crear orden con producto específico
                const orden = {
                    proveedor_id: parseInt(formData.get('proveedor_id')),
                    fecha_orden: new Date().toISOString().split('T')[0],
                    estado: 'pendiente',
                    notas: formData.get('notas'),
                    productos: [{
                        producto_id: parseInt(formData.get('producto_id')),
                        cantidad: parseInt(formData.get('cantidad'))
                    }]
                };
                
                try {
                    await window.electronAPI.createOrdenCompra(orden);
                    this.showToastGlobal('Orden generada correctamente', 'success', 'toast-global');
                    modal.style.display = 'none';
                    modal.remove();
                    await this.loadOrdenesCompra();
                } catch (error) {
                    console.error('Error creando orden:', error);
                    this.showToastGlobal('Error al generar orden', 'error', 'toast-global');
                }
            });
            
        } catch (error) {
            console.error('Error al generar orden:', error);
            this.showToastGlobal('Error al cargar datos del producto', 'error', 'toast-global');
        }
    }

    // Funciones auxiliares de carga de datos
    async loadAlertasStock() {
        try {
            // Simulamos alertas basadas en productos con stock bajo
            const productos = await window.flowerShopAPI.getProductos();
            const alertas = productos.filter(p => p.stock < 10).map(p => ({
                producto_id: p.id,
                producto_nombre: p.nombre,
                stock_actual: p.stock,
                stock_minimo: 10,
                nivel: p.stock === 0 ? 'sin_stock' : p.stock < 5 ? 'critico' : 'bajo'
            }));
            
            this.renderAlertasStock(alertas);
        } catch (error) {
            console.error('Error cargando alertas:', error);
            this.renderAlertasStock([]);
        }
    }

    async loadPrediccionDemanda(periodo = 30) {
        try {
            // Simulamos predicciones basadas en datos existentes
            const productos = await window.flowerShopAPI.getProductos();
            const prediccion = productos.slice(0, 10).map(p => ({
                producto_nombre: p.nombre,
                stock_actual: p.stock,
                demanda_prevista: Math.floor(Math.random() * 20) + 5,
                stock_proyectado: p.stock - (Math.floor(Math.random() * 15) + 5)
            }));
            
            this.renderPrediccionDemanda(prediccion);
        } catch (error) {
            console.error('Error cargando predicción:', error);
            this.renderPrediccionDemanda([]);
        }
    }

    async loadOrdenesCompra() {
        try {
            // Simulamos órdenes de compra
            const ordenes = [
                { 
                    id: 1, 
                    numero: 'OC-001', 
                    proveedor_nombre: 'Florería Central', 
                    fecha: '2025-08-01', 
                    total_items: 5, 
                    estado: 'pendiente' 
                },
                { 
                    id: 2, 
                    numero: 'OC-002', 
                    proveedor_nombre: 'Distribuidora Verde', 
                    fecha: '2025-07-30', 
                    total_items: 8, 
                    estado: 'enviada' 
                }
            ];
            
            this.renderOrdenesCompra(ordenes);
        } catch (error) {
            console.error('Error cargando órdenes:', error);
            this.renderOrdenesCompra([]);
        }
    }

    async loadMovimientosInventario(filtros = {}) {
        try {
            // Simulamos movimientos de inventario
            const movimientos = [
                {
                    id: 1,
                    producto_nombre: 'Rosas Rojas',
                    tipo_movimiento: 'entrada',
                    cantidad: 50,
                    fecha_movimiento: '2025-08-01',
                    motivo: 'Compra a proveedor'
                },
                {
                    id: 2,
                    producto_nombre: 'Tulipanes',
                    tipo_movimiento: 'salida',
                    cantidad: 12,
                    fecha_movimiento: '2025-07-31',
                    motivo: 'Venta'
                }
            ];
            
            this.renderMovimientosInventario(movimientos);
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            this.renderMovimientosInventario([]);
        }
    }

    renderAlertasStock(alertas) {
        const grid = document.getElementById('alertas-stock-grid');
        if (!grid) return;

        if (!alertas || alertas.length === 0) {
            grid.innerHTML = '<div class="no-data">✅ No hay alertas de stock activas</div>';
            return;
        }

        grid.innerHTML = alertas.map(alerta => `
            <div class="alert-card alert-${alerta.nivel}">
                <div class="alert-header">
                    <span class="alert-icon">${alerta.nivel === 'critico' ? '🔴' : alerta.nivel === 'bajo' ? '🟡' : '⚫'}</span>
                    <span class="alert-level">${alerta.nivel.toUpperCase()}</span>
                </div>
                <h4>${alerta.producto_nombre}</h4>
                <p>Stock actual: <strong>${alerta.stock_actual}</strong></p>
                <p>Stock mínimo: <strong>${alerta.stock_minimo}</strong></p>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.generarOrdenProducto(${alerta.producto_id})">
                        🛒 Ordenar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPrediccionDemanda(prediccion) {
        const tbody = document.querySelector('#prediction-table tbody');
        if (!tbody) return;

        if (!prediccion || prediccion.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de predicción disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = prediccion.map(p => `
            <tr>
                <td>${p.producto_nombre || 'N/A'}</td>
                <td>${p.stock_actual || 0}</td>
                <td>${p.demanda_prevista || 0}</td>
                <td class="${(p.stock_proyectado || 0) < 0 ? 'text-danger' : ''}">${p.stock_proyectado || 0}</td>
                <td>
                    ${(p.stock_proyectado || 0) < 0 ? 
                        '<span class="badge badge-danger">Reabastecer</span>' : 
                        '<span class="badge badge-success">OK</span>'
                    }
                </td>
            </tr>
        `).join('');

        // Crear gráfico de predicción
        this.createPredictionChart(prediccion);
    }

    createPredictionChart(prediccion) {
        const ctx = document.getElementById('demand-prediction-chart')?.getContext('2d');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        if (this.predictionChart) {
            this.predictionChart.destroy();
        }

        const labels = prediccion.map(p => p.producto_nombre || 'Producto');
        const stockActual = prediccion.map(p => p.stock_actual || 0);
        const demandaPrevista = prediccion.map(p => p.demanda_prevista || 0);

        this.predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Stock Actual',
                        data: stockActual,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Demanda Prevista',
                        data: demandaPrevista,
                        backgroundColor: 'rgba(217, 70, 239, 0.6)',
                        borderColor: 'rgba(217, 70, 239, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Predicción de Demanda vs Stock Actual'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    }
                }
            }
        });
    }

    renderOrdenesCompra(ordenes) {
        const tbody = document.querySelector('#ordenes-table tbody');
        if (!tbody) return;

        if (!ordenes || ordenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay órdenes de compra</td></tr>';
            return;
        }

        tbody.innerHTML = ordenes.map(orden => `
            <tr>
                <td>${orden.numero}</td>
                <td>${orden.proveedor_nombre}</td>
                <td>${orden.fecha}</td>
                <td>${orden.total_items}</td>
                <td>$${(Math.random() * 1000 + 100).toFixed(2)}</td>
                <td><span class="estado-badge ${orden.estado}">${orden.estado}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.verOrden(${orden.id})" title="Ver detalles">👁️</button>
                        <button class="btn btn-sm btn-success" onclick="app.editarOrden(${orden.id})" title="Editar">✏️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderMovimientosInventario(movimientos) {
        const tbody = document.querySelector('#movimientos-table tbody');
        if (!tbody) return;

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay movimientos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = movimientos.map(mov => `
            <tr>
                <td>${mov.fecha_movimiento}</td>
                <td>${mov.producto_nombre}</td>
                <td><span class="badge badge-${mov.tipo_movimiento === 'entrada' ? 'success' : 'warning'}">${mov.tipo_movimiento}</span></td>
                <td>${mov.cantidad}</td>
                <td>${mov.motivo || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.verMovimiento(${mov.id})" title="Ver detalles">👁️ Ver</button>
                </td>
            </tr>
        `).join('');
    }

    createRotationAnalysisChart(productos) {
        const ctx = document.getElementById('rotation-analysis-chart')?.getContext('2d');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        if (this.rotationChart) {
            this.rotationChart.destroy();
        }

        const data = productos.slice(0, 10).map(p => ({
            producto: p.nombre,
            rotacion: p.rotacion || 0
        }));

        this.rotationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.producto),
                datasets: [{
                    label: 'Días de Rotación',
                    data: data.map(d => d.rotacion),
                    backgroundColor: 'rgba(217, 70, 239, 0.6)',
                    borderColor: 'rgba(217, 70, 239, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Días'
                        }
                    }
                }
            }
        });
    }

    async loadInitialData() {
        try {
            console.log('🚀 Cargando datos iniciales...');
            await this.loadDashboardData();
            console.log('✅ Datos iniciales cargados correctamente');
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            this.showToastGlobal('Error cargando datos iniciales', 'error', 'toast-global');
        }
    }

    // ========== FUNCIONES FALTANTES ==========
    
    async ajustarStockMinimo(id) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            
            if (!producto) {
                this.showToastGlobal('Producto no encontrado', 'error', 'toast-global');
                return;
            }

            const nuevoMinimo = prompt(`Nuevo stock mínimo para ${producto.nombre}:`, producto.stock_minimo || 10);
            if (nuevoMinimo && !isNaN(nuevoMinimo)) {
                await window.flowerShopAPI.actualizarProducto(id, { stock_minimo: parseInt(nuevoMinimo) });
                this.showNotification('Stock mínimo actualizado', 'success');
                await this.loadInventoryAlerts();
            }
        } catch (error) {
            console.error('Error ajustando stock mínimo:', error);
            this.showNotification('Error ajustando stock mínimo', 'error');
        }
    }

    async crearOrdenCompra(productos) {
        try {
            this.showNotification('Creando orden de compra...', 'info');
            const orden = {
                fecha_orden: new Date().toISOString().split('T')[0],
                estado: 'pendiente',
                productos: productos
            };
            
            await window.flowerShopAPI.crearOrdenCompra(orden);
            this.showNotification('Orden de compra creada', 'success');
            await this.loadPurchaseOrders();
        } catch (error) {
            console.error('Error creando orden:', error);
            this.showNotification('Error creando orden de compra', 'error');
        }
    }

    async viewProviderOrders(id) {
        try {
            console.log('🔍 Cargando órdenes del proveedor:', id);
            
            // Obtener información del proveedor
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification('Proveedor no encontrado', 'error');
                return;
            }
            
            // Obtener órdenes del proveedor
            const ordenes = await window.flowerShopAPI.getOrdenesCompraByProveedor(id);
            
            // Crear modal
            const modal = this.createProviderOrdersModal(proveedor, ordenes);
            document.body.appendChild(modal);
            
            // Mostrar modal
            this.showModal('modal-provider-orders');
            
        } catch (error) {
            console.error('❌ Error cargando órdenes del proveedor:', error);
            this.showNotification('Error cargando órdenes del proveedor', 'error');
        }
    }

    createProviderOrdersModal(proveedor, ordenes) {
        const modal = document.createElement('div');
        modal.id = 'modal-provider-orders';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        // Calcular estadísticas
        const totalOrdenes = ordenes.length;
        const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente').length;
        const valorTotal = ordenes.reduce((sum, o) => sum + (o.total_valor || o.total || 0), 0);
        
        const ordenesHtml = ordenes.length === 0 
            ? `<div class="no-data-message">
                 <div class="no-data-icon">📋</div>
                 <p>No hay órdenes de compra registradas para este proveedor</p>
               </div>`
            : ordenes.map(orden => `
                <div class="order-item-pro">
                    <div class="order-header-pro">
                        <div class="order-main-info">
                            <span class="order-number">Orden #${orden.numero_orden || orden.id}</span>
                            <span class="order-date">${window.flowerShopAPI.formatDate(orden.created_at)}</span>
                        </div>
                        <span class="order-status ${orden.estado}">${orden.estado}</span>
                    </div>
                    <div class="order-details-row">
                        <div class="order-detail-group">
                            <div class="order-detail">
                                <span class="label">Items:</span>
                                <span class="value">${orden.total_items}</span>
                            </div>
                            <div class="order-detail">
                                <span class="label">Total:</span>
                                <span class="value">${window.flowerShopAPI.formatCurrency(orden.total_valor || orden.total || 0)}</span>
                            </div>
                            ${orden.fecha_entrega ? `
                            <div class="order-detail">
                                <span class="label">Entrega:</span>
                                <span class="value">${window.flowerShopAPI.formatDate(orden.fecha_entrega)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="header-content">
                        <h2 class="modal-title-pro">
                            <span class="modal-icon">📋</span>
                            Órdenes de Compra
                        </h2>
                        <p class="modal-subtitle-pro">Historial de órdenes del proveedor ${proveedor.nombre}</p>
                    </div>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="two-column-layout">
                        <!-- Columna izquierda: Información del proveedor -->
                        <div class="left-column">
                            <!-- Información del proveedor -->
                            <div class="section-pro">
                                <h3 class="section-title-pro">🏪 Información del Proveedor</h3>
                                <div class="provider-info-card">
                                    <div class="provider-name">${proveedor.nombre}</div>
                                    <div class="provider-details">
                                        <div class="provider-detail-item">
                                            <span class="detail-icon">📞</span>
                                            <span class="detail-text">${proveedor.contacto || proveedor.telefono || 'No disponible'}</span>
                                        </div>
                                        <div class="provider-detail-item">
                                            <span class="detail-icon">📧</span>
                                            <span class="detail-text">${proveedor.email || 'No disponible'}</span>
                                        </div>
                                        <div class="provider-detail-item">
                                            <span class="detail-icon">📍</span>
                                            <span class="detail-text">${proveedor.ciudad || proveedor.direccion || 'No disponible'}</span>
                                        </div>
                                        <div class="provider-detail-item">
                                            <span class="detail-icon">🏷️</span>
                                            <span class="detail-text ${proveedor.activo ? 'status-active' : 'status-inactive'}">
                                                ${proveedor.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Columna derecha: Resumen de órdenes -->
                        <div class="right-column">
                            <div class="section-pro">
                                <h3 class="section-title-pro">📊 Resumen de Órdenes</h3>
                                <div class="stats-grid-pro horizontal">
                                    <div class="stat-card-pro compact">
                                        <div class="stat-number-pro">${totalOrdenes}</div>
                                        <div class="stat-label-pro">Total Órdenes</div>
                                    </div>
                                    <div class="stat-card-pro compact">
                                        <div class="stat-number-pro">${ordenesPendientes}</div>
                                        <div class="stat-label-pro">Pendientes</div>
                                    </div>
                                    <div class="stat-card-pro compact">
                                        <div class="stat-number-pro">${window.flowerShopAPI.formatCurrency(valorTotal)}</div>
                                        <div class="stat-label-pro">Valor Total</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Historial de órdenes - Ocupa toda la anchura -->
                    <div class="section-pro full-width-section">
                        <h3 class="section-title-pro">📦 Historial de Órdenes</h3>
                        <div class="orders-container-pro">
                            ${ordenesHtml}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancelar modal-close">Cerrar</button>
                    <button type="button" class="btn btn-guardar" onclick="app.nuevaOrdenCompraProveedor(${proveedor.id})">Nueva Orden</button>
                </div>
            </div>
        `;
        
        // Event listeners para cerrar modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        });
        
        return modal;
    }

    async nuevaOrdenCompraProveedor(proveedorId) {
        try {
            // Cerrar modal actual
            this.hideModal('modal-provider-orders');
            
            // TODO: Implementar modal de nueva orden específica para este proveedor
            this.showNotification(`Creando nueva orden para proveedor ${proveedorId}`, 'info');
            
        } catch (error) {
            console.error('❌ Error creando nueva orden:', error);
            this.showNotification('Error creando nueva orden', 'error');
        }
    }

    async viewOrderDetails(id) {
        this.showNotification(`Viendo detalles de la orden ${id}`, 'info');
    }

    async markOrderReceived(id) {
        try {
            await window.flowerShopAPI.actualizarOrdenCompra(id, { estado: 'recibida' });
            this.showNotification('Orden marcada como recibida', 'success');
            await this.loadPurchaseOrders();
        } catch (error) {
            console.error('Error marcando orden:', error);
            this.showNotification('Error marcando orden como recibida', 'error');
        }
    }

    async verProducto(id) {
        console.log('👁️ Ver producto:', id);
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            
            if (!producto) {
                this.showNotification('Producto no encontrado', 'error');
                return;
            }

            // Crear y mostrar modal de vista de producto
            const modal = this.createViewProductModal(producto);
            document.body.appendChild(modal);
            this.showModal('modal-view-producto');
            
        } catch (error) {
            console.error('❌ Error viendo producto:', error);
            this.showNotification('Error cargando datos del producto', 'error');
        }
    }

    createViewProductModal(producto) {
        const modal = document.createElement('div');
        modal.id = 'modal-view-producto';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        // Calcular datos adicionales
        const stockStatus = this.getStockStatus(producto.stock_actual, producto.stock_minimo);
        const margenGanancia = producto.precio_venta && producto.precio_compra 
            ? ((producto.precio_venta - producto.precio_compra) / producto.precio_compra * 100).toFixed(1)
            : 'N/A';
        
        // Obtener nombre de categoría
        const categoriaNombre = this.getCategoryName(producto.categoria_id);
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header" style="padding: 1.2rem 1.8rem 0.8rem 1.8rem;">
                    <div>
                        <h2 class="modal-title-pro" style="font-size: 1.5rem; margin-bottom: 0.2rem;">🌺 Información del Producto</h2>
                        <p class="modal-subtitle-pro" style="font-size: 0.85rem;">Detalles completos del producto</p>
                    </div>
                    <button type="button" class="modal-close" onclick="app.hideModal('modal-view-producto')" style="
                        position: absolute;
                        top: 1rem;
                        right: 1.2rem;
                        background: none;
                        border: none;
                        font-size: 1.8rem;
                        cursor: pointer;
                        color: #6b7280;
                        transition: color 0.2s;
                        line-height: 1;
                        padding: 0.2rem;
                    ">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1rem 1.8rem; max-height: 60vh; overflow-y: auto;">
                    <div class="producto-info-header" style="
                        display: flex;
                        align-items: center;
                        gap: 0.8rem;
                        margin-bottom: 1rem;
                        padding: 0.8rem;
                        background: #f8fafc;
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                    ">
                        <div class="producto-avatar" style="
                            width: 40px;
                            height: 40px;
                            background: #e2e8f0;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.2rem;
                        ">🌸</div>
                        <div class="producto-details" style="flex: 1;">
                            <h3 style="font-size: 1rem; margin: 0 0 0.2rem 0; color: #1f2937;">${producto.nombre}</h3>
                            <p style="font-size: 0.8rem; margin: 0 0 0.3rem 0; color: #6b7280;">Código: ${producto.codigo_producto || 'No asignado'}</p>
                            <div class="producto-stats" style="display: flex; gap: 1rem; font-size: 0.75rem;">
                                <span class="stat-item">
                                    <strong>${producto.stock_actual || 0}</strong>&nbsp;en stock
                                </span>
                                <span class="stat-item">
                                    <strong>${this.formatCurrency(producto.precio_venta)}</strong>&nbsp;precio
                                </span>
                                <span class="stat-item ${stockStatus.class}">
                                    <strong>${stockStatus.text}</strong>
                                </span>
                            </div>
                        </div>
                        <div class="producto-status-badge" style="
                            display: flex;
                            align-items: center;
                            gap: 0.3rem;
                            padding: 0.3rem 0.6rem;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 0.75rem;
                            background: ${stockStatus.class === 'sin-stock' ? '#fef2f2' : 
                                       stockStatus.class === 'stock-bajo' ? '#fffbeb' : 
                                       stockStatus.class === 'stock-medio' ? '#fff7ed' : '#f0fdf4'};
                            color: ${stockStatus.class === 'sin-stock' ? '#dc2626' : 
                                   stockStatus.class === 'stock-bajo' ? '#d97706' : 
                                   stockStatus.class === 'stock-medio' ? '#ea580c' : '#16a34a'};
                            border: 1px solid ${stockStatus.class === 'sin-stock' ? '#fecaca' : 
                                              stockStatus.class === 'stock-bajo' ? '#fed7aa' : 
                                              stockStatus.class === 'stock-medio' ? '#fdba74' : '#bbf7d0'};
                        ">
                            <span>${stockStatus.icon}</span>
                            <span>${stockStatus.text}</span>
                        </div>
                    </div>
                    
                    <div class="producto-detalles" style="
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        background: #ffffff;
                    ">
                        <!-- Información Básica -->
                        <div class="detalle-seccion" style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">
                            <h4 style="font-size: 0.9rem; color: #374151; margin: 0 0 0.8rem 0; font-weight: 600;">📋 Información Básica</h4>
                            <div class="detalle-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 0.85rem;">
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Categoría:</span>
                                    <span style="color: #374151; font-weight: 500;">${categoriaNombre}</span>
                                </div>
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Temporada:</span>
                                    <span style="color: #374151; font-weight: 500;">${this.getTemporadaText(producto.temporada)}</span>
                                </div>
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Creado:</span>
                                    <span style="color: #374151; font-weight: 500;">${this.formatDate(producto.created_at)}</span>
                                </div>
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Actualizado:</span>
                                    <span style="color: #374151; font-weight: 500;">${this.formatDate(producto.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Información de Stock -->
                        <div class="detalle-seccion" style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">
                            <h4 style="font-size: 0.9rem; color: #374151; margin: 0 0 0.8rem 0; font-weight: 600;">📦 Inventario</h4>
                            <div class="detalle-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 0.85rem;">
                                <div class="detalle-item destacado" style="
                                    padding: 0.5rem;
                                    background: #f8fafc;
                                    border-radius: 4px;
                                    border-left: 3px solid #3b82f6;
                                ">
                                    <span style="color: #6b7280;">Stock Actual:</span>
                                    <span style="color: #374151; font-weight: 600; font-size: 1rem;">${producto.stock_actual || 0} unidades</span>
                                </div>
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Stock Mínimo:</span>
                                    <span style="color: #374151; font-weight: 500;">${producto.stock_minimo || 5} unidades</span>
                                </div>
                            </div>
                        </div>

                        <!-- Información de Precios -->
                        <div class="detalle-seccion" style="padding: 1rem; ${producto.descripcion ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                            <h4 style="font-size: 0.9rem; color: #374151; margin: 0 0 0.8rem 0; font-weight: 600;">💰 Precios y Márgenes</h4>
                            <div class="detalle-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-size: 0.85rem;">
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Precio Compra:</span>
                                    <span style="color: #374151; font-weight: 500;">${this.formatCurrency(producto.precio_compra)}</span>
                                </div>
                                <div class="detalle-item destacado" style="
                                    padding: 0.5rem;
                                    background: #f0fdf4;
                                    border-radius: 4px;
                                    border-left: 3px solid #16a34a;
                                ">
                                    <span style="color: #6b7280;">Precio Venta:</span>
                                    <span style="color: #16a34a; font-weight: 600; font-size: 1rem;">${this.formatCurrency(producto.precio_venta)}</span>
                                </div>
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Margen:</span>
                                    <span style="color: #7c3aed; font-weight: 600;">${margenGanancia}${margenGanancia !== 'N/A' ? '%' : ''}</span>
                                </div>
                                ${producto.precio_compra && producto.precio_venta ? `
                                <div class="detalle-item">
                                    <span style="color: #6b7280;">Ganancia/ud:</span>
                                    <span style="color: #16a34a; font-weight: 600;">${this.formatCurrency(producto.precio_venta - producto.precio_compra)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        ${producto.descripcion ? `
                        <!-- Descripción -->
                        <div class="detalle-seccion" style="padding: 1rem;">
                            <h4 style="font-size: 0.9rem; color: #374151; margin: 0 0 0.8rem 0; font-weight: 600;">📝 Descripción</h4>
                            <div style="
                                background: #f8fafc;
                                padding: 0.8rem;
                                border-radius: 4px;
                                border-left: 3px solid #3b82f6;
                                color: #374151;
                                line-height: 1.5;
                                font-size: 0.85rem;
                            ">
                                ${producto.descripcion}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer" style="padding: 0.8rem 1.8rem 1.2rem 1.8rem;">
                    <button type="button" class="btn btn-primary" onclick="app.editarProducto(${producto.id}); app.hideModal('modal-view-producto');" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        ✏️ Editar Producto
                    </button>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeViewProductModal(modal);
            }
        });
        
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeViewProductModal(modal);
            });
        });
        
        return modal;
    }

    closeViewProductModal(modal) {
        modal.style.display = 'none';
        modal.remove();
    }

    getStockStatus(stockActual, stockMinimo) {
        const stock = stockActual || 0;
        const minimo = stockMinimo || 5;
        
        if (stock === 0) {
            return { class: 'sin-stock', icon: '🔴', text: 'Sin Stock' };
        } else if (stock <= minimo) {
            return { class: 'stock-bajo', icon: '🟡', text: 'Stock Bajo' };
        } else if (stock <= minimo * 2) {
            return { class: 'stock-medio', icon: '🟠', text: 'Stock Medio' };
        } else {
            return { class: 'stock-alto', icon: '🟢', text: 'Stock Bueno' };
        }
    }

    getCategoryName(categoriaId) {
        // Mapeo de categorías - puedes expandir esto según tus categorías
        const categorias = {
            1: 'Flores Frescas',
            2: 'Plantas de Interior',
            3: 'Plantas de Exterior',
            4: 'Arreglos Florales',
            5: 'Accesorios',
            6: 'Herramientas'
        };
        return categorias[categoriaId] || 'Sin Categoría';
    }

    getTemporadaText(temporada) {
        const temporadas = {
            'primavera': '🌸 Primavera',
            'verano': '☀️ Verano',
            'otoño': '🍂 Otoño',
            'invierno': '❄️ Invierno',
            'todo_año': '🌿 Todo el Año'
        };
        return temporadas[temporada] || '🌿 Todo el Año';
    }

    formatDate(dateString) {
        if (!dateString) return 'No disponible';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return 'No especificado';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    async gestionarEventoStock(id) {
        // Redirigir a la sección de Stock en Inventario
        this.showSection('inventario');
        if (typeof this.switchInventoryTab === 'function') {
            this.switchInventoryTab('stock');
        }
        // Cargar y seleccionar el evento específico
        setTimeout(() => {
            if (typeof this.seleccionarEventoStock === 'function') {
                this.seleccionarEventoStock(id);
            }
        }, 100);
    }

    // ========== FUNCIONES DE GESTIÓN DE STOCK PARA EVENTOS ==========
    
    async loadStockEventos() {
        try {
            console.log('📦 Cargando gestión de stock para eventos...');
            
            // Cargar eventos en el selector
            await this.cargarEventosEnSelector();
            
            // Configurar event listeners para sub-tabs
            this.setupStockSubTabs();
            
            // Configurar formularios y controles
            this.setupStockControls();
            
            console.log('✅ Stock de eventos cargado correctamente');
        } catch (error) {
            console.error('❌ Error cargando stock de eventos:', error);
            this.showNotification('Error cargando gestión de stock', 'error');
        }
    }

    async cargarEventosEnSelector() {
        try {
            const eventos = await window.flowerShopAPI.getEventos();
            const selector = document.getElementById('selector-evento-stock');
            
            if (!selector) return;
            
            selector.innerHTML = '<option value="">Seleccionar evento...</option>';
            
            eventos.forEach(evento => {
                const option = document.createElement('option');
                option.value = evento.id;
                option.textContent = `${evento.nombre} - ${this.formatDate(evento.fecha_inicio)}`;
                selector.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error cargando eventos:', error);
        }
    }

    setupStockSubTabs() {
        const subTabBtns = document.querySelectorAll('.stock-nav-tab');
        subTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subTabId = btn.dataset.subtab;
                this.switchStockSubTab(subTabId);
            });
        });
    }

    switchStockSubTab(subTabId) {
        // Actualizar botones de sub-pestañas
        document.querySelectorAll('.stock-nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-subtab="${subTabId}"]`).classList.add('active');

        // Actualizar contenido de sub-pestañas
        document.querySelectorAll('.stock-panel').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`subtab-${subTabId}`).classList.add('active');

        // Cargar datos específicos del sub-tab si hay evento seleccionado
        const eventoId = document.getElementById('selector-evento-stock').value;
        if (eventoId) {
            this.loadStockSubTabData(subTabId, eventoId);
        }
    }

    setupStockControls() {
        // Event listener para cargar evento
        const btnCargar = document.querySelector('[onclick="app.cargarStockEvento()"]');
        if (btnCargar) {
            btnCargar.addEventListener('click', () => this.cargarStockEvento());
        }

        // Event listener para selector de producto en form de reserva
        const selectProducto = document.getElementById('producto-reservar');
        const stockDisplay = document.getElementById('stock-display');
        
        if (selectProducto && stockDisplay) {
            selectProducto.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                const stockNumber = stockDisplay.querySelector('.stock-number');
                const stockStatus = stockDisplay.querySelector('.stock-status');
                
                if (selectedOption && selectedOption.dataset.stock) {
                    if (stockNumber) stockNumber.textContent = selectedOption.dataset.stock;
                    if (stockStatus) stockStatus.textContent = 'Unidades disponibles';
                } else {
                    if (stockNumber) stockNumber.textContent = '-';
                    if (stockStatus) stockStatus.textContent = 'Selecciona un producto';
                }
            });
        }

        // Event listener para formulario de reserva
        const formReservar = document.getElementById('form-reservar-stock');
        if (formReservar) {
            formReservar.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarReservaStock(e.target);
            });
        }
    }

    async cargarStockEvento() {
        const selector = document.getElementById('selector-evento-stock');
        const eventoId = selector.value;
        
        if (!eventoId) {
            this.showNotification('Por favor selecciona un evento', 'warning');
            return;
        }

        await this.seleccionarEventoStock(eventoId);
    }

    async seleccionarEventoStock(eventoId) {
        try {
            console.log('📦 Cargando stock para evento:', eventoId);
            
            // Obtener datos del evento
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(e => e.id == eventoId);
            
            if (!evento) {
                this.showNotification('Evento no encontrado', 'error');
                return;
            }

            // Actualizar información del evento en la UI
            this.mostrarInfoEvento(evento);
            
            // Mostrar contenedores de gestión
            document.getElementById('evento-info-container').style.display = 'block';
            document.getElementById('stock-tabs-container').style.display = 'block';
            
            // Cargar datos del sub-tab activo
            const activeSubTabElement = document.querySelector('.stock-nav-tab.active');
            if (activeSubTabElement && activeSubTabElement.dataset && activeSubTabElement.dataset.subtab) {
                const activeSubTab = activeSubTabElement.dataset.subtab;
                await this.loadStockSubTabData(activeSubTab, eventoId);
            } else {
                // Por defecto cargar reservas si no hay tab activa
                await this.loadStockSubTabData('reservas', eventoId);
            }
            
            // Cargar productos en selector de reserva
            await this.cargarProductosEnSelector();
            
            this.showNotification(`Stock del evento "${evento.nombre}" cargado`, 'success');
            
        } catch (error) {
            console.error('❌ Error cargando stock del evento:', error);
            this.showNotification('Error cargando datos del evento', 'error');
        }
    }

    mostrarInfoEvento(evento) {
        // Actualizar información básica
    document.getElementById('evento-nombre-header').textContent = evento.nombre;
        document.getElementById('evento-fecha').textContent = this.formatDate(evento.fecha_inicio);
        document.getElementById('evento-tipo').textContent = this.getEventTypeText(evento.tipo_evento);
        document.getElementById('evento-demanda').textContent = this.getDemandaText(evento.demanda_esperada);
        
        // Calcular y mostrar días restantes
        const diasRestantes = this.calcularDiasRestantes(evento.fecha_inicio);
        const diasElement = document.getElementById('dias-restantes');
        const countdownNumber = diasElement.querySelector('.countdown-number');
        const countdownLabel = diasElement.querySelector('.countdown-label');
        
        if (countdownNumber) {
            countdownNumber.textContent = Math.abs(diasRestantes);
        }
        if (countdownLabel) {
            countdownLabel.textContent = diasRestantes >= 0 ? 'días para el evento' : 'días desde el evento';
        }
        
        // Actualizar estado
        const statusElement = document.getElementById('evento-status');
        const status = this.getEstadoPreparacion(diasRestantes, 0); // Por ahora 0 productos insuficientes
        const statusIcon = statusElement.querySelector('.status-icon');
        const statusText = statusElement.querySelector('.status-text');
        
        if (statusIcon) {
            statusIcon.textContent = status.icon;
        }
        if (statusText) {
            statusText.textContent = status.text;
        }
        
        statusElement.style.background = status.color;
        statusElement.style.color = status.textColor;
    }

    async loadStockSubTabData(subTabId, eventoId) {
        switch(subTabId) {
            case 'reservas':
                await this.loadReservasEvento(eventoId);
                break;
            case 'demanda':
                await this.loadAnalisisDemanda(eventoId);
                break;
            case 'agregar':
                await this.loadProductosParaAgregar();
                break;
            case 'ordenes':
                await this.loadResumenOrdenes(eventoId);
                break;
            case 'reporte':
                // Se carga cuando se genera el reporte
                break;
        }
    }

    async loadReservasEvento(eventoId) {
        try {
            // Simular datos de reservas
            const reservas = await this.getReservasEvento(eventoId);
            this.renderReservasEvento(reservas);
            this.actualizarStatsReservas(reservas);
        } catch (error) {
            console.error('Error cargando reservas:', error);
        }
    }

    async getReservasEvento(eventoId) {
        // Inicializar almacenamiento de reservas si no existe
        if (!this.reservasEventos) {
            this.reservasEventos = {
                1: [ // Boda María & Carlos
                    { 
                        id: 1, 
                        producto_id: 1, 
                        producto_nombre: 'Rosas Rojas Premium', 
                        cantidad_reservada: 150, 
                        stock_disponible: 120,
                        prioridad: 'alta'
                    },
                    { 
                        id: 2, 
                        producto_id: 2, 
                        producto_nombre: 'Orquídeas Blancas Phalaenopsis', 
                        cantidad_reservada: 30, 
                        stock_disponible: 45,
                        prioridad: 'normal'
                    },
                    { 
                        id: 3, 
                        producto_id: 3, 
                        producto_nombre: 'Lirios Orientales Blancos', 
                        cantidad_reservada: 80, 
                        stock_disponible: 85,
                        prioridad: 'normal'
                    },
                    { 
                        id: 4, 
                        producto_id: 7, 
                        producto_nombre: 'Peonías Rosadas', 
                        cantidad_reservada: 60, 
                        stock_disponible: 40,
                        prioridad: 'alta'
                    }
                ],
                2: [ // Graduación Universidad
                    { 
                        id: 5, 
                        producto_id: 5, 
                        producto_nombre: 'Gerberas Multicolor', 
                        cantidad_reservada: 200, 
                        stock_disponible: 180,
                        prioridad: 'alta'
                    },
                    { 
                        id: 6, 
                        producto_id: 8, 
                        producto_nombre: 'Girasoles Gigantes', 
                        cantidad_reservada: 100, 
                        stock_disponible: 100,
                        prioridad: 'normal'
                    },
                    { 
                        id: 7, 
                        producto_id: 4, 
                        producto_nombre: 'Tulipanes Holandeses Mix', 
                        cantidad_reservada: 120, 
                        stock_disponible: 90,
                        prioridad: 'normal'
                    }
                ],
                3: [ // Aniversario Hotel Plaza
                    { 
                        id: 8, 
                        producto_id: 7, 
                        producto_nombre: 'Peonías Rosadas', 
                        cantidad_reservada: 50, 
                        stock_disponible: 30,
                        prioridad: 'alta'
                    },
                    { 
                        id: 9, 
                        producto_id: 1, 
                        producto_nombre: 'Rosas Rojas Premium', 
                        cantidad_reservada: 80, 
                        stock_disponible: 95,
                        prioridad: 'normal'
                    },
                    { 
                        id: 10, 
                        producto_id: 6, 
                        producto_nombre: 'Claveles Españoles', 
                        cantidad_reservada: 150, 
                        stock_disponible: 140,
                        prioridad: 'baja'
                    }
                ]
            };
        }

        return this.reservasEventos[eventoId] || [];
    }

    renderReservasEvento(reservas) {
        const container = document.getElementById('reservas-list');
        
        if (!reservas || reservas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h5>No hay reservas</h5>
                    <p>No hay productos reservados para este evento</p>
                    <button class="btn btn-primary" onclick="app.switchStockSubTab('agregar')">
                        ➕ Agregar Productos
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = reservas.map(reserva => {
            const stockSuficiente = reserva.cantidad_reservada <= reserva.stock_disponible;
            const fechaFormateada = new Date().toLocaleDateString('es-ES');
            
            return `
                <div class="reserva-item ${stockSuficiente ? 'reservado' : 'insuficiente'}">
                    <div class="reserva-acciones">
                        <button class="btn btn-sm btn-primary" onclick="app.editarReservaStock(${reserva.id})" title="Editar reserva">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarReservaStock(${reserva.id})" title="Eliminar reserva">
                            🗑️
                        </button>
                    </div>
                    <div class="reserva-producto">
                        <h5>
                            🌸 ${reserva.producto_nombre}
                            <span class="codigo-producto">#${reserva.producto_id}</span>
                        </h5>
                        <div class="reserva-meta">
                            Stock disponible: <span class="${stockSuficiente ? 'text-success' : 'text-danger'}">${reserva.stock_disponible}</span> unidades
                            ${!stockSuficiente ? ` • <strong class="text-danger">Faltan ${reserva.cantidad_reservada - reserva.stock_disponible}</strong>` : ''}
                        </div>
                        <div class="reserva-fecha">
                            Reservado el ${fechaFormateada}
                        </div>
                    </div>
                    <div class="reserva-cantidad">
                        <span class="cantidad-numero">${reserva.cantidad_reservada}</span>
                        <span class="cantidad-label">reservadas</span>
                    </div>
                    <div class="reserva-prioridad">
                        <span class="prioridad-badge ${reserva.prioridad}">${this.getPrioridadText(reserva.prioridad)}</span>
                    </div>
                    <div class="reserva-estado">
                        <span class="estado-badge ${stockSuficiente ? 'reservado' : 'insuficiente'}">
                            ${stockSuficiente ? '✅ Disponible' : '⚠️ Insuficiente'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    actualizarStatsReservas(reservas) {
        const totalReservado = reservas.reduce((sum, r) => sum + r.cantidad_reservada, 0);
        const productosInsuficientes = reservas.filter(r => r.estado === 'insuficiente').length;
        
        document.getElementById('total-reservado').textContent = totalReservado;
        document.getElementById('productos-insuficientes').textContent = productosInsuficientes;
        
        // Actualizar badge en la tab de reservas
        this.updateReservasBadge(reservas.length);
    }

    updateReservasBadge(count) {
        let badge = document.getElementById('reservas-count');
        if (!badge) {
            // Intentar encontrar la pestaña de reservas y agregar el badge si no existe
            const tab = document.querySelector('.stock-nav-tab[data-subtab="reservas"]');
            if (tab) {
                badge = document.createElement('span');
                badge.id = 'reservas-count';
                badge.className = 'badge badge-reservas';
                badge.style.marginLeft = '0.4em';
                tab.appendChild(badge);
            }
        }
        if (badge) {
            badge.textContent = count || 0;
        }
    }

    async cargarProductosEnSelector() {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const selector = document.getElementById('producto-reservar');
            
            if (!selector) return;
            
            selector.innerHTML = '<option value="">Seleccionar producto...</option>';
            
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.nombre} (Stock: ${producto.stock_actual || 0})`;
                option.dataset.stock = producto.stock_actual || 0;
                selector.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    // Funciones auxiliares
    getPrioridadText(prioridad) {
        const prioridades = {
            'normal': 'Normal',
            'media': 'Normal',
            'alta': 'Alta',
            'baja': 'Baja',
            'critica': 'Crítica'
        };
        return prioridades[prioridad] || 'Normal';
    }

    getEventTypeText(tipo) {
        const tipos = {
            'temporal': '🌸 Temporal',
            'religioso': '⛪ Religioso',
            'comercial': '🛒 Comercial',
            'personalizado': '✨ Personalizado'
        };
        return tipos[tipo] || '📅 General';
    }

    getDemandaText(demanda) {
        const demandas = {
            'baja': '📉 Baja',
            'media': '📊 Media',
            'alta': '📈 Alta',
            'extrema': '🔥 Extrema'
        };
        return demandas[demanda] || '📊 Media';
    }

    calcularDiasRestantes(fechaEvento) {
        if (!fechaEvento) return 0;
        const hoy = new Date();
        const fecha = new Date(fechaEvento);
        const diferencia = fecha.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 3600 * 24));
    }

    getEstadoPreparacion(diasRestantes, productosInsuficientes) {
        if (productosInsuficientes > 0) {
            return {
                text: 'Acción Requerida',
                icon: '⚠️',
                color: '#fef3c7',
                textColor: '#92400e'
            };
        }
        
        if (diasRestantes < 0) {
            return {
                text: 'Evento Pasado',
                icon: '📅',
                color: '#f3f4f6',
                textColor: '#6b7280'
            };
        }
        
        if (diasRestantes <= 3) {
            return {
                text: 'Urgente',
                icon: '🔴',
                color: '#fef2f2',
                textColor: '#dc2626'
            };
        }
        
        if (diasRestantes <= 7) {
            return {
                text: 'Próximo',
                icon: '🟡',
                color: '#fffbeb',
                textColor: '#d97706'
            };
        }
        
        return {
            text: 'En Preparación',
            icon: '✅',
            color: '#dcfce7',
            textColor: '#16a34a'
        };
    }

    // ========== FUNCIONES ADICIONALES DE GESTIÓN DE STOCK ==========
    
    async procesarReservaStock(form) {
        try {
            const productoId = document.getElementById('producto-reservar').value;
            const cantidad = parseInt(document.getElementById('cantidad-reservar').value);
            const prioridad = document.getElementById('prioridad-reserva').value || 'normal';
            const eventoId = document.getElementById('selector-evento-stock').value;
            
            console.log('Datos del formulario:', { productoId, cantidad, prioridad, eventoId });
            
            if (!productoId) {
                this.showNotification('Por favor selecciona un producto', 'warning');
                return;
            }
            
            if (!eventoId) {
                this.showNotification('Por favor selecciona un evento primero', 'warning');
                return;
            }
            
            if (!cantidad || isNaN(cantidad)) {
                this.showNotification('Por favor ingresa una cantidad válida', 'warning');
                return;
            }

            if (cantidad <= 0) {
                this.showNotification('La cantidad debe ser mayor a 0', 'warning');
                return;
            }

            // Validar stock disponible
            const selectedOption = document.querySelector('#producto-reservar').selectedOptions[0];
            const stockDisponible = parseInt(selectedOption?.dataset?.stock || 0);
            
            if (cantidad > stockDisponible) {
                this.showNotification(`Solo hay ${stockDisponible} unidades disponibles`, 'error');
                return;
            }

            // Simular guardado de reserva
            this.showNotification(`Producto reservado correctamente: ${cantidad} unidades`, 'success');
            
            // Limpiar formulario
            form.reset();
            const stockDisplay = document.getElementById('stock-display');
            if (stockDisplay) {
                const stockNumber = stockDisplay.querySelector('.stock-number');
                const stockStatus = stockDisplay.querySelector('.stock-status');
                if (stockNumber) stockNumber.textContent = '-';
                if (stockStatus) stockStatus.textContent = 'Selecciona un producto';
            }
            
            // Recargar reservas
            const selectorEvento = document.getElementById('selector-evento-stock');
            if (selectorEvento && selectorEvento.value) {
                this.loadReservasEvento(selectorEvento.value);
            }
            
        } catch (error) {
            console.error('Error reservando producto:', error);
            this.showNotification('Error al reservar producto', 'error');
        }
    }

    async editarReservaStock(reservaId) {
        try {
            // Crear modal de edición personalizado
            this.mostrarModalEditarReserva(reservaId);
        } catch (error) {
            console.error('Error editando reserva:', error);
            this.showNotification('Error al editar reserva', 'error');
        }
    }

    mostrarModalEditarReserva(reservaId) {
        // Obtener datos actuales de la reserva (simulado)
        const selectorEvento = document.getElementById('selector-evento-stock');
        const eventoId = selectorEvento?.value;
        
        if (!eventoId) {
            this.showNotification('No hay evento seleccionado', 'warning');
            return;
        }

        // Verificar si ya existe un modal y eliminarlo
        const existingModal = document.getElementById('modal-editar-reserva');
        if (existingModal) {
            existingModal.remove();
        }

        console.log('🔧 Creando modal de edición para reserva:', reservaId);

        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'modal-editar-reserva';
        modal.className = 'modal';
        // Estilos para asegurar visibilidad
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '99999'; // z-index muy alto
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.flexDirection = 'row';
        modal.style.pointerEvents = 'auto';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        // Forzar display visible por si hay CSS global
        modal.setAttribute('style', modal.getAttribute('style') + ';display:flex !important;');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative;">
                <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: #1f2937;">✏️ Editar Reserva</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()" style="
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 0;
                        line-height: 1;
                    ">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem;">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="nueva-cantidad" class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151; font-size: 0.9rem;">Nueva cantidad a reservar:</label>
                        <input type="number" 
                               id="nueva-cantidad" 
                               class="form-control" 
                               min="1" 
                               placeholder="Ingresa la nueva cantidad"
                               style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                    </div>
                    <div class="form-group">
                        <label for="nueva-prioridad" class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151; font-size: 0.9rem;">Prioridad:</label>
                        <select id="nueva-prioridad" 
                                class="form-control" 
                                style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; background: white;">
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Crítica</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="
                        padding: 0.5rem 1rem;
                        border: 1px solid #d1d5db;
                        background: white;
                        color: #374151;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="app.confirmarEditarReserva(${reservaId})" style="
                        padding: 0.5rem 1rem;
                        border: 1px solid #3b82f6;
                        background: #3b82f6;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">
                        Actualizar Reserva
                    </button>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.appendChild(modal);
        
        console.log('✅ Modal de edición agregado al DOM:', modal);

        // Focus en el input
        setTimeout(() => {
            const input = document.getElementById('nueva-cantidad');
            if (input) {
                input.focus();
                console.log('🎯 Focus puesto en input de cantidad');
            } else {
                console.log('❌ No se encontró el input nueva-cantidad');
            }
        }, 100);

        // Cerrar con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });

        // Cerrar clickeando fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    confirmarEditarReserva(reservaId) {
        const nuevaCantidad = document.getElementById('nueva-cantidad').value;
        const nuevaPrioridad = document.getElementById('nueva-prioridad').value;
        
        if (!nuevaCantidad || isNaN(nuevaCantidad) || parseInt(nuevaCantidad) <= 0) {
            this.showNotification('Por favor ingresa una cantidad válida', 'warning');
            return;
        }

        // Cerrar modal
        const modal = document.getElementById('modal-editar-reserva');
        if (modal) modal.remove();

        try {
            console.log('✏️ Actualizando reserva con ID:', reservaId);
            
            // Obtener el evento actual
            const selectorEvento = document.getElementById('selector-evento-stock');
            const eventoId = selectorEvento?.value;
            
            if (!eventoId) {
                this.showNotification('No hay evento seleccionado', 'error');
                return;
            }

            // Actualizar la reserva en el almacenamiento dinámico
            const actualizada = this.actualizarReservaEnLista(eventoId, reservaId, {
                cantidad_reservada: parseInt(nuevaCantidad),
                prioridad: nuevaPrioridad
            });
            
            if (actualizada) {
                this.showNotification(`Reserva actualizada: ${nuevaCantidad} unidades, prioridad ${nuevaPrioridad}`, 'success');
                
                // Recargar reservas
                this.loadReservasEvento(eventoId);
            } else {
                this.showNotification('No se pudo encontrar la reserva para actualizar', 'error');
            }
        } catch (error) {
            console.error('Error actualizando reserva:', error);
            this.showNotification('Error al actualizar reserva', 'error');
        }
    }

    // Función auxiliar para actualizar reserva en la lista
    actualizarReservaEnLista(eventoId, reservaId, nuevosDatos) {
        if (!this.reservasEventos || !this.reservasEventos[eventoId]) {
            return false;
        }

        const reservasEvento = this.reservasEventos[eventoId];
        const reserva = reservasEvento.find(r => r.id == reservaId);
        
        if (reserva) {
            // Actualizar los campos especificados
            Object.assign(reserva, nuevosDatos);
            console.log(`✅ Reserva ${reservaId} actualizada en el evento ${eventoId}:`, nuevosDatos);
            return true;
        }
        
        console.log(`❌ No se encontró la reserva ${reservaId} en el evento ${eventoId}`);
        return false;
    }

    async eliminarReservaStock(reservaId) {
        this.mostrarConfirmacionEliminar({
            tipo: 'Reserva',
            nombre: 'esta reserva de stock',
            mensaje: '¿Estás seguro de que quieres eliminar esta reserva de stock del evento? Esta acción no se puede deshacer.',
            onConfirm: () => {
                try {
                    console.log('🗑️ Eliminando reserva con ID:', reservaId);
                    
                    // Obtener el evento actual
                    const selectorEvento = document.getElementById('selector-evento-stock');
                    const eventoId = selectorEvento?.value;
                    
                    if (!eventoId) {
                        this.showNotification('No hay evento seleccionado', 'error');
                        return;
                    }

                    // Eliminar la reserva del almacenamiento dinámico
                    const eliminada = this.eliminarReservaDeLista(eventoId, reservaId);
                    
                    if (eliminada) {
                        this.showNotification('Reserva eliminada correctamente', 'success');
                        
                        // Recargar reservas
                        this.loadReservasEvento(eventoId);
                    } else {
                        this.showNotification('No se pudo encontrar la reserva', 'error');
                    }
                } catch (error) {
                    console.error('Error eliminando reserva:', error);
                    this.showNotification('Error al eliminar reserva', 'error');
                }
            }
        });
    }

    // Función auxiliar para eliminar reserva de la lista
    eliminarReservaDeLista(eventoId, reservaId) {
        if (!this.reservasEventos || !this.reservasEventos[eventoId]) {
            return false;
        }

        const reservasEvento = this.reservasEventos[eventoId];
        const indiceReserva = reservasEvento.findIndex(r => r.id == reservaId);
        
        if (indiceReserva !== -1) {
            // Eliminar la reserva del array
            reservasEvento.splice(indiceReserva, 1);
            console.log(`✅ Reserva ${reservaId} eliminada del evento ${eventoId}`);
            return true;
        }
        
        console.log(`❌ No se encontró la reserva ${reservaId} en el evento ${eventoId}`);
        return false;
    }

    async loadAnalisisDemanda(eventoId) {
        try {
            // Simular análisis de demanda
            this.renderAnalisisDemanda();
        } catch (error) {
            console.error('Error cargando análisis de demanda:', error);
        }
    }

    renderAnalisisDemanda() {
        const productosContainer = document.getElementById('productos-demandados');
        const tendenciasContainer = document.getElementById('tendencias-demanda');
        
        if (productosContainer) {
            productosContainer.innerHTML = `
                <div class="demanda-item">
                    <span class="producto-nombre">🌹 Rosas Rojas</span>
                    <span class="demanda-valor">85%</span>
                </div>
                <div class="demanda-item">
                    <span class="producto-nombre">🌷 Tulipanes</span>
                    <span class="demanda-valor">72%</span>
                </div>
                <div class="demanda-item">
                    <span class="producto-nombre">🌺 Claveles</span>
                    <span class="demanda-valor">58%</span>
                </div>
            `;
        }
        
        if (tendenciasContainer) {
            tendenciasContainer.innerHTML = `
                <div class="tendencia-item">
                    <span class="tendencia-icon">📈</span>
                    <span class="tendencia-texto">Demanda alta en eventos religiosos</span>
                </div>
                <div class="tendencia-item">
                    <span class="tendencia-icon">🔄</span>
                    <span class="tendencia-texto">Rotación rápida en temporada alta</span>
                </div>
            `;
        }
        
        // Crear gráfico de demanda
        this.createDemandChart();
    }

    createDemandChart() {
        const canvas = document.getElementById('stock-demanda-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Datos de ejemplo
        const data = [
            { label: 'Rosas', value: 85, color: '#ff6384' },
            { label: 'Tulipanes', value: 72, color: '#36a2eb' },
            { label: 'Claveles', value: 58, color: '#ffce56' },
            { label: 'Lirios', value: 45, color: '#4bc0c0' }
        ];
        
        const maxValue = 100;
        const barWidth = 60;
        const barSpacing = 80;
        const startX = 40;
        const startY = height - 40;
        const chartHeight = height - 80;
        
        // Dibujar barras
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = startX + (index * barSpacing);
            const y = startY - barHeight;
            
            // Barra
            ctx.fillStyle = item.color;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Etiqueta del valor
            ctx.fillStyle = '#374151';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.value}%`, x + barWidth/2, y - 5);
            
            // Etiqueta del producto
            ctx.fillText(item.label, x + barWidth/2, startY + 15);
        });
        
        // Título
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Demanda por Producto (%)', width/2, 20);
        
        // Líneas de grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = startY - (i * chartHeight / 4);
            ctx.beginPath();
            ctx.moveTo(startX - 10, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
            
            // Etiquetas del eje Y
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(`${(i * 25)}%`, startX - 15, y + 3);
        }
    }

    async loadResumenOrdenes(eventoId) {
        try {
            const resumenContainer = document.getElementById('resumen-necesidades');
            
            if (resumenContainer) {
                resumenContainer.innerHTML = `
                    <div class="necesidad-item">
                        <div class="necesidad-producto">🌹 Rosas Rojas</div>
                        <div class="necesidad-cantidad">Faltan: <strong>20 unidades</strong></div>
                        <div class="necesidad-estado critico">🔴 Crítico</div>
                    </div>
                    <div class="necesidad-item">
                        <div class="necesidad-producto">🌷 Tulipanes Blancos</div>
                        <div class="necesidad-cantidad">Faltan: <strong>5 unidades</strong></div>
                        <div class="necesidad-estado alto">🟡 Medio</div>
                    </div>
                    <div class="estado-general">
                        <strong>Estado:</strong> Se requiere generar 2 órdenes de compra
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error cargando resumen de órdenes:', error);
        }
    }

    async analizarNecesidadesStock() {
        try {
            this.showNotification('Analizando necesidades de stock...', 'info');
            
            setTimeout(() => {
                this.showNotification('Análisis completado', 'success');
                const eventoId = document.getElementById('selector-evento-stock').value;
                if (eventoId) {
                    this.loadResumenOrdenes(eventoId);
                }
            }, 2000);
        } catch (error) {
            console.error('Error analizando necesidades:', error);
            this.showNotification('Error en el análisis', 'error');
        }
    }

    async generarOrdenesAutomaticas() {
        try {
            this.showNotification('Generando órdenes de compra automáticas...', 'info');
            
            // Simular generación de órdenes
            const ordenesGeneradas = [
                {
                    id: 1,
                    producto: 'Rosas Rojas Premium',
                    cantidad: 30,
                    proveedor: 'Florería Central',
                    estado: 'Pendiente'
                },
                {
                    id: 2,
                    producto: 'Peonías Rosadas',
                    cantidad: 20,
                    proveedor: 'Vivero San José',
                    estado: 'Pendiente'
                }
            ];
            
            setTimeout(() => {
                this.renderOrdenesGeneradas(ordenesGeneradas);
                this.showNotification(`${ordenesGeneradas.length} órdenes de compra generadas correctamente`, 'success');
            }, 2000);
        } catch (error) {
            console.error('Error generando órdenes:', error);
            this.showNotification('Error generando órdenes', 'error');
        }
    }

    renderOrdenesGeneradas(ordenes) {
        const container = document.getElementById('ordenes-generadas');
        if (!container) return;

        if (ordenes.length === 0) {
            container.innerHTML = `
                <div class="ordenes-placeholder">
                    <i class="placeholder-icon">📋</i>
                    <p>No hay órdenes generadas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ordenes.map(orden => `
            <div class="orden-item">
                <div class="orden-info">
                    <h6>🛒 ${orden.producto}</h6>
                    <div class="orden-meta">${orden.cantidad} unidades • ${orden.proveedor}</div>
                </div>
                <div class="orden-estado">
                    <span class="badge badge-warning">${orden.estado}</span>
                </div>
            </div>
        `).join('');
    }

    async verOrdenesGeneradas() {
        try {
            this.showNotification('Abriendo vista de órdenes generadas...', 'info');
            // Cambiar a la tab de órdenes
            this.switchInventoryTab('ordenes');
        } catch (error) {
            console.error('Error mostrando órdenes:', error);
        }
    }

    async generarReporteStock() {
        try {
            this.showNotification('Generando reporte de stock...', 'info');
            
            const reporteContainer = document.getElementById('reporte-content');
            
            setTimeout(() => {
                if (reporteContainer) {
                    reporteContainer.innerHTML = `
                        <div class="reporte-generado">
                            <div class="reporte-header">
                                <h5>📊 Reporte de Stock del Evento</h5>
                                <div class="reporte-fecha">Generado: ${new Date().toLocaleDateString('es-ES')}</div>
                            </div>
                            <div class="reporte-seccion">
                                <h6>📋 Resumen de Reservas</h6>
                                <div class="reporte-dato">Total productos reservados: <strong>100 unidades</strong></div>
                                <div class="reporte-dato">Productos con stock suficiente: <strong>2 de 3</strong></div>
                                <div class="reporte-dato">Valor total estimado: <strong>€1,250.00</strong></div>
                            </div>
                            <div class="reporte-seccion">
                                <h6>⚠️ Alertas</h6>
                                <div class="reporte-alerta">1 producto requiere reabastecimiento urgente</div>
                            </div>
                            <div class="reporte-seccion">
                                <h6>🛒 Órdenes Recomendadas</h6>
                                <div class="reporte-orden">Orden #1: 20 Rosas Rojas - Proveedor: Florería Central</div>
                                <div class="reporte-orden">Orden #2: 5 Tulipanes - Proveedor: Distribuidora Verde</div>
                            </div>
                        </div>
                    `;
                }
                this.showNotification('Reporte generado correctamente', 'success');
            }, 1500);
        } catch (error) {
            console.error('Error generando reporte:', error);
            this.showNotification('Error generando reporte', 'error');
        }
    }

    async exportarReporteStock() {
        try {
            this.showNotification('Exportando reporte a Excel...', 'info');
            setTimeout(() => {
                this.showNotification('Reporte exportado correctamente', 'success');
            }, 1000);
        } catch (error) {
            console.error('Error exportando reporte:', error);
            this.showNotification('Error exportando reporte', 'error');
        }
    }

    async imprimirReporteStock() {
        try {
            this.showNotification('Preparando vista de impresión...', 'info');
            setTimeout(() => {
                this.showNotification('Vista de impresión lista', 'success');
                // Aquí se abriría la ventana de impresión
            }, 1000);
        } catch (error) {
            console.error('Error preparando impresión:', error);
            this.showNotification('Error preparando impresión', 'error');
        }
    }

    limpiarFormularioReserva() {
        const form = document.getElementById('form-reservar-stock');
        if (form) {
            form.reset();
            const stockDisplay = document.getElementById('stock-display');
            if (stockDisplay) {
                const stockNumber = stockDisplay.querySelector('.stock-number');
                const stockStatus = stockDisplay.querySelector('.stock-status');
                if (stockNumber) stockNumber.textContent = '-';
                if (stockStatus) stockStatus.textContent = 'Selecciona un producto';
            }
        }
    }

    nuevoEventoStock() {
        this.showNotification('Redirigiendo a crear nuevo evento...', 'info');
        // Cambiar a la sección de eventos
        this.showContent('eventos');
    }

    async loadProductosParaAgregar() {
        try {
            const selector = document.getElementById('producto-reservar');
            if (selector) {
                await this.cargarProductosEnSelector(selector);
            }
        } catch (error) {
            console.error('Error cargando productos para agregar:', error);
        }
    }

    async eliminarEvento(id) {
        try {
            // Obtener datos del evento
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(e => e.id === id);
            
            if (!evento) {
                this.showToastGlobal('Evento no encontrado', 'error', 'toast-global');
                return;
            }

            // Capturar el contexto de this
            const self = this;

            // Mostrar confirmación
            this.mostrarConfirmacionEliminar({
                tipo: 'evento',
                nombre: evento.nombre,
                mensaje: `¿Estás seguro de que deseas eliminar el evento "${evento.nombre}"?\n\nEsta acción eliminará:\n• El evento y su configuración\n• Descuentos asociados\n• Predicciones de demanda\n\nEsta acción no se puede deshacer.`,
                onConfirm: async () => {
                    try {
                        await window.flowerShopAPI.eliminarEvento(id);
                        self.showToastGlobal('Evento eliminado correctamente', 'success', 'toast-global');
                        await self.loadEventosData();
                    } catch (error) {
                        console.error('Error eliminando evento:', error);
                        self.showToastGlobal('Error al eliminar evento', 'error', 'toast-global');
                    }
                }
            });
        } catch (error) {
            console.error('Error preparando eliminación:', error);
            this.showToastGlobal('Error al cargar datos del evento', 'error', 'toast-global');
        }
    }

    async eliminarCliente(id) {
        try {
            // Obtener datos del cliente
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === id);
            
            if (!cliente) {
                this.showToastGlobal('Cliente no encontrado', 'error', 'toast-global');
                return;
            }

            // Capturar el contexto de this
            const self = this;

            // Mostrar confirmación
            this.mostrarConfirmacionEliminar({
                tipo: 'cliente',
                nombre: cliente.nombre || cliente.nombre_completo,
                mensaje: `¿Estás seguro de que deseas eliminar el cliente "${cliente.nombre || cliente.nombre_completo}"?\n\nEsta acción eliminará:\n• Los datos del cliente\n• Su historial de compras\n• Pedidos asociados\n\nEsta acción no se puede deshacer.`,
                onConfirm: async () => {
                    try {
                        await window.flowerShopAPI.eliminarCliente(id);
                        self.showToastGlobal('Cliente eliminado correctamente', 'success', 'toast-global');
                        await self.loadClientesData();
                    } catch (error) {
                        console.error('Error eliminando cliente:', error);
                        self.showToastGlobal('Error al eliminar cliente', 'error', 'toast-global');
                    }
                }
            });
        } catch (error) {
            console.error('Error preparando eliminación:', error);
            this.showToastGlobal('Error al cargar datos del cliente', 'error', 'toast-global');
        }
    }

    async eliminarPedido(id) {
        try {
            // Obtener datos del pedido
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedido = pedidos.find(p => p.id === id);
            
            if (!pedido) {
                this.showToastGlobal('Pedido no encontrado', 'error', 'toast-global');
                return;
            }

            // Capturar el contexto de this
            const self = this;

            // Mostrar confirmación
            this.mostrarConfirmacionEliminar({
                tipo: 'pedido',
                nombre: `#${pedido.numero_pedido || pedido.id}`,
                mensaje: `¿Estás seguro de que deseas eliminar el pedido #${pedido.numero_pedido || pedido.id}?\n\nEsta acción eliminará:\n• El pedido y sus detalles\n• Los productos asociados\n• El historial del cliente\n\nEsta acción no se puede deshacer.`,
                onConfirm: async () => {
                    try {
                        await window.flowerShopAPI.eliminarPedido(id);
                        self.showToastGlobal('Pedido eliminado correctamente', 'success', 'toast-global');
                        await self.loadPedidosData();
                    } catch (error) {
                        console.error('Error eliminando pedido:', error);
                        self.showToastGlobal('Error al eliminar pedido', 'error', 'toast-global');
                    }
                }
            });
        } catch (error) {
            console.error('Error preparando eliminación:', error);
            this.showToastGlobal('Error al cargar datos del pedido', 'error', 'toast-global');
        }
    }

    // Funciones auxiliares para nuevos elementos
    async loadConfiguracionData() {
    console.log('⚙️ Cargando configuración...');
    this.showToastGlobal('Configuración cargada', 'info', 'toast-global');
    }

    // ========== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ==========
    
    /**
     * Muestra el modal de confirmación de eliminación
     * @param {Object} config - Configuración del modal
     * @param {string} config.tipo - Tipo de elemento (producto, cliente, evento, etc.)
     * @param {string} config.nombre - Nombre del elemento a eliminar
     * @param {Function} config.onConfirm - Función a ejecutar al confirmar
     * @param {string} [config.mensaje] - Mensaje personalizado (opcional)
     */
    mostrarConfirmacionEliminar(config) {
        const { tipo, nombre, onConfirm, mensaje } = config;
        
        // Configurar el título y mensaje
        const titulo = document.getElementById('confirmacion-titulo');
        const mensajeEl = document.getElementById('confirmacion-mensaje');
        const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
        
        if (titulo) {
            titulo.textContent = `¿Eliminar ${tipo}?`;
        }
        
        if (mensajeEl) {
            const mensajePersonalizado = mensaje || 
                `¿Estás seguro de que deseas eliminar ${tipo.toLowerCase()} "${nombre}"? Esta acción no se puede deshacer.`;
            mensajeEl.textContent = mensajePersonalizado;
        }
        
        // Configurar el botón de confirmar
        if (btnConfirmar) {
            // Remover eventos anteriores
            const nuevoBtn = btnConfirmar.cloneNode(true);
            btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
            
            // Agregar nuevo evento
            nuevoBtn.addEventListener('click', () => {
                this.hideModal('modal-confirmacion-eliminar');
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
        }
        
        // Mostrar el modal
        this.showModal('modal-confirmacion-eliminar');
    }

    // ========== FUNCIONES DE ELIMINACIÓN ACTUALIZADAS ==========
    
    async eliminarProducto(id) {
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            
            if (!producto) {
                this.showToastGlobal('Producto no encontrado', 'error', 'toast-global');
                return;
            }

            // Capturar el contexto de this
            const self = this;

            // Mostrar confirmación
            this.mostrarConfirmacionEliminar({
                tipo: 'producto',
                nombre: producto.nombre,
                mensaje: `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?\n\nEsta acción eliminará:\n• El producto del inventario\n• Todo su historial de movimientos\n• Referencias en pedidos futuros\n\nEsta acción no se puede deshacer.`,
                onConfirm: async () => {
                    try {
                        await window.flowerShopAPI.eliminarProducto(id);
                        self.showToastGlobal('Producto eliminado correctamente', 'success', 'toast-global');
                        await self.loadProductosData();
                    } catch (error) {
                        console.error('Error eliminando producto:', error);
                        self.showToastGlobal('Error al eliminar producto', 'error', 'toast-global');
                    }
                }
            });
        } catch (error) {
            console.error('Error preparando eliminación:', error);
            this.showToastGlobal('Error al cargar datos del producto', 'error', 'toast-global');
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌸 DOM cargado, inicializando aplicación...');
    window.app = new FlowerShopApp();
    console.log('✅ window.app creado:', window.app);
    console.log('✅ Función nuevoProveedor disponible:', typeof window.app.nuevoProveedor);
});

// Funciones globales para HTML onclick
window.editarProducto = (id) => window.app?.editarProducto(id);
window.verProducto = (id) => window.app?.verProducto(id);
window.eliminarProducto = (id) => window.app?.eliminarProducto(id);
window.editarCliente = (id) => window.app?.editarCliente(id);
window.verCliente = (id) => window.app?.verCliente(id);
window.nuevoPedidoCliente = (id) => window.app?.nuevoPedidoCliente(id);
window.editarEvento = (id) => window.app?.editarEvento(id);
window.gestionarEventoStock = (id) => window.app?.gestionarEventoStock(id);
window.eliminarEvento = (id) => window.app?.eliminarEvento(id);
window.verPedido = (id) => window.app?.verPedido(id);
window.aprobarPedido = (id) => window.app?.aprobarPedido(id);
window.cancelarPedido = (id) => window.app?.cancelarPedido(id);
window.editarProveedor = (id) => window.app?.editarProveedor(id);
window.eliminarProveedor = (id) => window.app?.eliminarProveedor(id);
window.viewProviderOrders = (id) => window.app?.viewProviderOrders(id);
window.viewOrderDetails = (id) => window.app?.viewOrderDetails(id);
window.markOrderReceived = (id) => window.app?.markOrderReceived(id);
window.ajustarStockMinimo = (id) => window.app?.ajustarStockMinimo(id);
window.crearOrdenCompra = (productos) => window.app?.crearOrdenCompra(productos);
window.generarOrdenProducto = (id) => window.app?.generarOrdenProducto(id);

// Refuerzo: Asignar evento al tab de papelera tras DOMContentLoaded para asegurar ejecución
document.addEventListener('DOMContentLoaded', () => {
    const tabPapelera = document.getElementById('tab-papelera');
    if (tabPapelera) {
        tabPapelera.addEventListener('click', async () => {
            if (window.app && typeof window.app.loadNotificacionesTrash === 'function') {
                console.log('[DEBUG] Click en tab-papelera: llamando a loadNotificacionesTrash');
                await window.app.loadNotificacionesTrash();
            } else {
                console.log('[DEBUG] window.app.loadNotificacionesTrash no está disponible');
            }
        });
    }
});

// Avatar preview y lógica de subida en configuración
// Avatar preview y lógica de subida en perfil
document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const perfilForm = document.getElementById('perfil-form');
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', (e) => {
            const file = avatarInput.files && avatarInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    avatarPreview.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (perfilForm) {
        perfilForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const file = avatarInput && avatarInput.files && avatarInput.files[0];
        });
    }
});

// Lógica de perfil de usuario: previsualización de avatar, carga y guardado de datos reales

document.addEventListener('DOMContentLoaded', () => {
    const perfilForm = document.getElementById('perfil-form');
    const avatarInput = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const headerAvatar = document.querySelector('.user-avatar');

    // Cargar datos actuales del perfil
    if (window.flowerShopAPI && window.flowerShopAPI.cargarPerfilUsuario) {
        window.flowerShopAPI.cargarPerfilUsuario().then(perfil => {
            if (perfil) {
                document.getElementById('perfil-nombre').value = perfil.nombre || '';
                document.getElementById('perfil-usuario').value = perfil.usuario || '';
                document.getElementById('perfil-email').value = perfil.email || '';
                document.getElementById('perfil-telefono').value = perfil.telefono || '';
                document.getElementById('perfil-rol').value = perfil.rol || 'Administrador';
                if (perfil.avatar && avatarPreview) {
                    avatarPreview.src = perfil.avatar;
                }
                // Cambiar avatar del header
                if (headerAvatar) {
                    if (perfil.avatar) {
                        headerAvatar.src = perfil.avatar;
                    } else {
                        headerAvatar.src = 'https://randomuser.me/api/portraits/men/1.jpg';
                    }
                }
            }
        });
    }

    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', (e) => {
            const file = avatarInput.files && avatarInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    avatarPreview.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (perfilForm) {
        perfilForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('perfil-nombre').value,
                usuario: document.getElementById('perfil-usuario').value,
                email: document.getElementById('perfil-email').value,
                telefono: document.getElementById('perfil-telefono').value,
                rol: document.getElementById('perfil-rol').value,
                password: document.getElementById('perfil-password').value,
            };
            const file = avatarInput && avatarInput.files && avatarInput.files[0];
            let avatarFile = null;
            if (file) {
                // Convertir el archivo a ArrayBuffer para que sea serializable por IPC
                avatarFile = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: await file.arrayBuffer()
                };
            }
            try {
                await window.flowerShopAPI.guardarPerfilUsuario(data, avatarFile);
                // Actualizar avatar del header inmediatamente
                const headerAvatar = document.querySelector('.user-avatar');
                if (headerAvatar) {
                    if (file) {
                        // Si se subió un nuevo archivo, usar la preview local
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            headerAvatar.src = ev.target.result;
                        };
                        reader.readAsDataURL(file);
                    } else if (avatarInput && avatarInput.value === '') {
                        // Si se eliminó el avatar, poner el default
                        headerAvatar.src = 'https://randomuser.me/api/portraits/men/1.jpg';
                    }
                }
            } catch (err) {
                alert('Error guardando el perfil: ' + (err?.message || err));
            }
        });
    }
});
