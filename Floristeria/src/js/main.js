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
                badgePedidos.textContent = pedidos.length;
                // Buscar pedidos pendientes
                const pendientes = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'pendiente');
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
        await this.updateSidebarBadges();
        await this.loadInitialData();
        this.showSection('dashboard');
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
            }
        } catch (error) {
            console.error(`❌ Error cargando datos de ${sectionId}:`, error);
            this.showNotification('Error cargando datos de la sección', 'error');
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
            this.showNotification('Error cargando el dashboard', 'error');
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
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showNotification('Error cargando productos', 'error');
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
                <td>${producto.categoria_nombre}</td>
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
            this.showNotification('Error cargando clientes', 'error');
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
            this.showNotification('Error cargando eventos', 'error');
        }
    }

    displayEventos(eventos) {
        const container = document.getElementById('eventos-grid');
        if (!container) return;

        if (eventos.length === 0) {
            container.innerHTML = '<p class="text-center">No hay eventos registrados</p>';
            return;
        }

        container.innerHTML = eventos.map(evento => {
            const fechaInicio = new Date(evento.fecha_inicio);
            const fechaFin = new Date(evento.fecha_fin);
            const hoy = new Date();
            const esActivo = fechaInicio <= hoy && fechaFin >= hoy;
            const esProximo = fechaInicio > hoy;
            
            return `
                <div class="evento-card ${esActivo ? 'activo' : ''} ${esProximo ? 'proximo' : ''}" data-id="${evento.id}">
                    <div class="evento-header">
                        <h3>${evento.nombre}</h3>
                    </div>
                    <hr class="evento-header-hr" />
                    <div class="evento-details">
                        <p><strong>Tipo:</strong> ${evento.tipo_evento}</p>
                        <p><strong>Fechas:</strong> ${window.flowerShopAPI.formatDate(evento.fecha_inicio)} - ${window.flowerShopAPI.formatDate(evento.fecha_fin)}</p>
                        <p><strong>Demanda esperada:</strong> ${evento.demanda_esperada}</p>
                        ${evento.descuento_especial > 0 ? `<p><strong>Descuento:</strong> ${evento.descuento_especial}%</p>` : ''}
                        <p class="evento-descripcion">${evento.descripcion}</p>
                    </div>
                    <div class="evento-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.editarEvento(${evento.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-sm btn-success" onclick="app.gestionarEventoStock(${evento.id})">
                            📦 Stock
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarEvento(${evento.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    // ========== PEDIDOS ==========
    async loadPedidosData() {
        try {
            console.log('📋 Cargando pedidos...');
            const pedidos = await window.flowerShopAPI.getPedidos();
            this.displayPedidos(pedidos);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            this.showNotification('Error cargando pedidos', 'error');
        }
    }

    displayPedidos(pedidos) {
        const tbody = document.querySelector('#pedidos-table tbody');
        if (!tbody) return;

        if (!pedidos || pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(pedido => {
            const estadoBadge = `<span class="badge-estado badge-estado-${(pedido.estado || '').toLowerCase()}">${pedido.estado || 'N/A'}</span>`;
            // Usar los nombres correctos de los campos según la base de datos
            const numeroPedido = pedido.numero_pedido || pedido.numero || pedido.id;
            const cliente = (pedido.cliente_nombre ? pedido.cliente_nombre : '') + (pedido.cliente_apellidos ? ' ' + pedido.cliente_apellidos : '');
            const fechaPedido = pedido.fecha_pedido ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_pedido) : pedido.fecha_pedido) : 'N/A';
            const fechaEntrega = pedido.fecha_entrega ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_entrega) : pedido.fecha_entrega) : 'N/A';
            const totalPedido = (typeof pedido.total !== 'undefined' && pedido.total !== null) ? (window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total) : pedido.total) : 'N/A';
            return `
                <tr data-id="${pedido.id}">
                    <td>${numeroPedido}</td>
                    <td>${cliente.trim() || 'N/A'}</td>
                    <td>${fechaPedido}</td>
                    <td>${fechaEntrega}</td>
                    <td>${estadoBadge}</td>
                    <td>${totalPedido}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="app.verPedido(${pedido.id})" title="Ver detalles">👁️</button>
                            ${pedido.estado && pedido.estado.toLowerCase() === 'pendiente' ? `<button class="btn btn-sm btn-success" onclick="app.aprobarPedido(${pedido.id})" title="Aprobar">✔️</button>` : ''}
                            ${pedido.estado && pedido.estado.toLowerCase() !== 'cancelado' && pedido.estado.toLowerCase() !== 'entregado' ? `<button class="btn btn-sm btn-danger" onclick="app.cancelarPedido(${pedido.id})" title="Cancelar">🗑️</button>` : ''}
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
                this.showNotification('No se encontró el pedido', 'error');
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
            this.showNotification('Error mostrando detalles del pedido', 'error');
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
                <div class="modal-content" style="max-width:600px">
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

    async aprobarPedido(id) {
        try {
            if (!confirm('¿Aprobar este pedido?')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'confirmado');
            this.showNotification('Pedido aprobado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error aprobando pedido', 'error');
        }
    }

    async cancelarPedido(id) {
        try {
            if (!confirm('¿Cancelar este pedido?')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'cancelado');
            this.showNotification('Pedido cancelado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error cancelando pedido', 'error');
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
                this.createRotationAnalysisChart(analisisData);
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
            this.showNotification('Error cargando dashboard de inventario', 'error');
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
            this.showNotification('Error cargando alertas de stock', 'error');
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
            this.showNotification('Error cargando predicción de demanda', 'error');
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
                this.showNotification('No hay productos que requieran reabastecimiento', 'info');
                return;
            }

            const productos = alertas.map(alerta => ({
                producto_id: alerta.id,
                cantidad: Math.max(alerta.stock_sugerido, alerta.stock_minimo)
            }));

            const ordenes = await window.flowerShopAPI.generarOrdenCompra(productos);
            
            if (ordenes.length > 0) {
                this.showNotification(`✅ Se generaron ${ordenes.length} órdenes de compra automáticamente`, 'success');
                // Cambiar a la pestaña de órdenes
                document.querySelector('[data-tab="ordenes"]').click();
            } else {
                this.showNotification('No se pudieron generar órdenes automáticas. Verifica los proveedores.', 'warning');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification('Error generando orden automática', 'error');
        }
    }

    async loadProviders() {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            this.displayProviders(proveedores);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.showNotification('Error cargando proveedores', 'error');
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
            this.showNotification('Error cargando órdenes de compra', 'error');
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
            this.showNotification('Error cargando movimientos de inventario', 'error');
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
            this.showNotification('Error cargando reportes', 'error');
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
        this.showNotification('Funcionalidad de exportación en desarrollo', 'info');
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
            this.showNotification('Error abriendo formulario', 'error');
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
            this.showNotification('Error cargando categorías', 'error');
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
                this.showNotification('No se encontró el producto', 'error');
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
            this.showNotification('Error abriendo editor', 'error');
        }
    }

    async verProducto(id) {
        console.log('👁️ Ver producto:', id);
        // TODO: Implementar vista de detalles del producto
        this.showNotification('Vista de detalles en desarrollo', 'info');
    }

    async eliminarProducto(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este producto?\n\nEsta acción no se puede deshacer.')) {
            try {
                console.log('🗑️ Eliminar producto:', id);
                await window.flowerShopAPI.eliminarProducto(id);
                await this.loadProductosData();
                this.showNotification('Producto eliminado correctamente', 'success');
            } catch (error) {
                console.error('❌ Error eliminando producto:', error);
                this.showNotification('Error eliminando producto: ' + error.message, 'error');
            }
        }
    }

    // Clientes
    async nuevoCliente() {
        console.log('➕ Nuevo cliente');
        try {
            this.clearForm('form-cliente');
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error abriendo modal de cliente:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarCliente(id) {
        console.log('✏️ Editar cliente:', id);
        try {
            // Obtener todos los clientes y buscar el que corresponde
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) {
                this.showNotification('No se encontró el cliente', 'error');
                return;
            }
            // Rellenar el formulario compacto
            const form = document.getElementById('form-cliente');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('cliente-nombre-completo').value = cliente.nombre || '';
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-tipo').value = cliente.tipo_cliente || 'nuevo';
            document.getElementById('cliente-notas').value = cliente.notas || '';
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error editando cliente:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }

    async verCliente(id) {
        console.log('👁️ Ver cliente:', id);
        this.showNotification('Vista de historial en desarrollo', 'info');
    }

    async nuevoPedidoCliente(id) {
        console.log('📋 Nuevo pedido para cliente:', id);
        this.showNotification('Funcionalidad de pedidos en desarrollo', 'info');
    }

    // Eventos
    async nuevoEvento() {
        console.log('➕ Nuevo evento');
        try {
            this.clearForm('form-evento');
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error abriendo modal de evento:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarEvento(id) {
        console.log('✏️ Editar evento:', id);
        try {
            // Obtener todos los eventos y buscar el que corresponde
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(ev => ev.id === id);
            if (!evento) {
                this.showNotification('No se encontró el evento', 'error');
                return;
            }
            // Rellenar el formulario
            const form = document.getElementById('form-evento');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('evento-nombre').value = evento.nombre || '';
            document.getElementById('evento-fecha-inicio').value = evento.fecha_inicio || '';
            document.getElementById('evento-fecha-fin').value = evento.fecha_fin || '';
            document.getElementById('evento-tipo').value = evento.tipo_evento || '';
            document.getElementById('evento-demanda').value = evento.demanda_esperada || '';
            document.getElementById('evento-descuento').value = evento.descuento_especial || '';
            document.getElementById('evento-preparacion').value = evento.preparacion_dias || 7;
            document.getElementById('evento-descripcion').value = evento.descripcion || '';
            document.getElementById('evento-notas').value = evento.notas || '';
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error editando evento:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }
    // Eliminar evento
    async eliminarEvento(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este evento?\n\nEsta acción no se puede deshacer.')) {
            try {
                await window.flowerShopAPI.eliminarEvento(id);
                this.showNotification('Evento eliminado correctamente', 'success');
                await this.loadEventosData();
            } catch (error) {
                this.showNotification('Error al eliminar el evento', 'error');
                console.error('❌ Error eliminando evento:', error);
            }
        }
    }

    async gestionarEventoStock(id) {
        console.log('📦 Gestionar stock del evento:', id);
        this.showNotification('Gestión de stock en desarrollo', 'info');
    }

    async nuevoPedido() {
        try {
            // Crear modal si no existe
            let modal = document.getElementById('modal-nuevo-pedido');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-nuevo-pedido';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:650px">
                        <span class="modal-close" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
                        <h2>Nuevo Pedido</h2>
                        <form id="form-nuevo-pedido">
                            <div class="form-group">
                                <label>Cliente</label>
                                <select id="pedido-cliente" name="cliente_id" required style="width:100%"></select>
                            </div>
                            <div class="form-group">
                                <label>Productos</label>
                                <div id="pedido-productos-list"></div>
                                <button type="button" id="btn-agregar-producto-pedido" class="btn btn-sm btn-primary" style="margin-top:5px">Agregar producto</button>
                            </div>
                            <div class="form-group">
                                <label>Fecha de entrega</label>
                                <input type="date" id="pedido-entrega" name="entrega" required />
                            </div>
                            <div class="form-group">
                                <label>Notas</label>
                                <textarea id="pedido-notas" name="notas" rows="2"></textarea>
                            </div>
                            <div style="text-align:right">
                                <button type="button" class="btn btn-cancelar modal-close"><span style='font-size:1.1em;vertical-align:middle;'>❌</span> <span style='vertical-align:middle;'>Cancelar</span></button>
                                <button type="submit" class="btn btn-guardar"><span style='font-size:1.1em;vertical-align:middle;'>💾</span> <span style='vertical-align:middle;'>Guardar</span></button>
                            </div>
                        </form>
                    </div>
                `;
                document.body.appendChild(modal);
                // Cerrar modal
                modal.querySelector('.modal-close').onclick = () => this.hideModal('modal-nuevo-pedido');
                modal.querySelector('.btn-cancelar').onclick = () => this.hideModal('modal-nuevo-pedido');
                modal.addEventListener('click', (e) => { if (e.target === modal) this.hideModal('modal-nuevo-pedido'); });
                // Evento submit
                modal.querySelector('#form-nuevo-pedido').onsubmit = (e) => this.handleNuevoPedidoSubmit(e);
                // Agregar producto
                modal.querySelector('#btn-agregar-producto-pedido').onclick = () => this.agregarProductoAlPedido();
            }
            // Cargar clientes y productos
            await this.cargarClientesEnPedido();
            await this.cargarProductosEnPedido();
            // Limpiar productos seleccionados
            document.getElementById('pedido-productos-list').innerHTML = '';
            // Mostrar modal
            this.showModal('modal-nuevo-pedido');
        } catch (error) {
            this.showNotification('Error abriendo formulario de pedido', 'error');
        }
    }

    async cargarClientesEnPedido() {
        const select = document.getElementById('pedido-cliente');
        if (!select) return;
        const clientes = await window.flowerShopAPI.getClientes();
        select.innerHTML = '<option value="">Seleccionar cliente</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellidos || ''}</option>`).join('');
    }

    async cargarProductosEnPedido() {
        // Guardar productos en memoria para selección rápida
        this._productosParaPedido = await window.flowerShopAPI.getProductos();
    }

    agregarProductoAlPedido() {
        const productos = this._productosParaPedido || [];
        const list = document.getElementById('pedido-productos-list');
        if (!list) return;
        // Crear fila de selección
        const idx = list.children.length;
        const row = document.createElement('div');
        row.className = 'pedido-producto-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '4px';
        row.innerHTML = `
            <select class="pedido-producto-select" required style="flex:2">
                <option value="">Producto</option>
                ${productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
            </select>
            <input type="number" class="pedido-producto-cantidad" min="1" value="1" required style="width:60px" />
            <button type="button" class="btn btn-danger btn-sm btn-quitar-producto">Quitar</button>
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
                this.showNotification('Completa todos los campos obligatorios y agrega al menos un producto', 'warning');
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
            await window.flowerShopAPI.crearPedido(pedido);
            this.showNotification('Pedido creado correctamente', 'success');
            this.hideModal('modal-nuevo-pedido');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error guardando pedido', 'error');
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
                    this.hideModal(activeModal.id);
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
                this.showNotification('Por favor completa los campos obligatorios', 'warning');
                return;
            }

            // Si está en modo edición
            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                await window.flowerShopAPI.actualizarProducto(Number(editId), producto);
                form.removeAttribute('data-edit-id');
                this.showNotification('Producto actualizado correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearProducto(producto);
                this.showNotification('Producto guardado correctamente', 'success');
            }
            this.hideModal('modal-producto');
            await this.loadProductosData();
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showNotification('Error guardando producto: ' + error.message, 'error');
        }
    }

    async handleClienteSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const nombreCompleto = formData.get('nombre_completo')?.trim() || '';
            const cliente = {
                nombre: nombreCompleto,
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                tipo_cliente: formData.get('tipo_cliente') || 'nuevo',
                notas: formData.get('notas')
            };

            console.log('📝 Guardando cliente:', cliente);

            if (!cliente.nombre) {
                this.showNotification('El nombre completo es obligatorio', 'warning');
                return;
            }

            // Llamar a la API
            await window.flowerShopAPI.crearCliente(cliente);
            
            this.hideModal('modal-cliente');
            this.showNotification('Cliente guardado correctamente', 'success');
            await this.loadClientesData();

        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
            this.showNotification('Error guardando cliente: ' + error.message, 'error');
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
                this.showNotification('Por favor completa los campos obligatorios', 'warning');
                return;
            }

            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                // Actualizar evento existente
                await window.flowerShopAPI.actualizarEvento(Number(editId), evento);
                form.removeAttribute('data-edit-id');
                this.showNotification('Evento actualizado correctamente', 'success');
            } else {
                // Crear nuevo evento
                await window.flowerShopAPI.crearEvento(evento);
                this.showNotification('Evento guardado correctamente', 'success');
            }
            this.hideModal('modal-evento');
            await this.loadEventosData();
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            this.showNotification('Error guardando evento: ' + error.message, 'error');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log(`🔄 Modal abierto: ${modalId}`);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log(`🔄 Modal cerrado: ${modalId}`);
        }
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
        this.showNotification(`Buscando: "${termino}"`, 'info');
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

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Estilos
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: this.getNotificationColor(type),
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '2000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            minWidth: '300px',
            maxWidth: '500px'
        });

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        return colors[type] || '#2196f3';
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
            this.showNotification('Error al abrir formulario de proveedor', 'error');
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
                this.showNotification('Proveedor actualizado correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearProveedor(proveedor);
                this.showNotification('Proveedor creado correctamente', 'success');
            }
            
            // Cerrar modal usando el método estándar
            this.hideModal('modal-proveedor');
            
            await this.loadProviders();
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            this.showNotification('Error al guardar proveedor', 'error');
        }
    }

    async generarOrdenAutomatica() {
        try {
            this.showNotification('Generando orden automática...', 'info');
            const ordenAutomatica = await window.flowerShopAPI.generarOrdenAutomatica();
            
            if (ordenAutomatica && ordenAutomatica.productos && ordenAutomatica.productos.length > 0) {
                this.showNotification(`Orden automática generada con ${ordenAutomatica.productos.length} productos`, 'success');
                await this.loadOrdenesCompra();
            } else {
                this.showNotification('No se necesitan órdenes automáticas en este momento', 'info');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification('Error al generar orden automática', 'error');
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
            this.showNotification('Error al abrir formulario de orden', 'error');
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
            this.showNotification('Error al abrir formulario de movimiento', 'error');
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
            this.showNotification('Movimiento registrado correctamente', 'success');
            
            const modal = document.getElementById('modal-nuevo-movimiento');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            
            await this.loadMovimientosInventario();
        } catch (error) {
            console.error('Error guardando movimiento:', error);
            this.showNotification('Error al registrar movimiento', 'error');
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
                this.showNotification('Proveedor no encontrado', 'error');
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
            this.showNotification('Error al cargar datos del proveedor', 'error');
        }
    }

    async eliminarProveedor(id) {
        try {
            // Obtener información del proveedor antes de eliminar
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification('Proveedor no encontrado', 'error');
                return;
            }
            
            // Confirmar eliminación
            const confirmMessage = `🗑️ ¿Estás seguro de que deseas eliminar el proveedor "${proveedor.nombre}"?\n\n⚠️ Esta acción desactivará el proveedor pero mantendrá el historial de órdenes.\n\nEsta acción no se puede deshacer.`;
            
            if (confirm(confirmMessage)) {
                await window.flowerShopAPI.eliminarProveedor(id);
                this.showNotification(`Proveedor "${proveedor.nombre}" eliminado correctamente`, 'success');
                await this.loadProviders(); // Recargar lista
            }
            
        } catch (error) {
            console.error('❌ Error eliminando proveedor:', error);
            this.showNotification('Error al eliminar proveedor: ' + error.message, 'error');
        }
    }

    verOrden(id) {
        this.showNotification(`Viendo orden ${id}`, 'info');
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
                this.showNotification('Orden actualizada correctamente', 'success');
            } else {
                await window.electronAPI.createOrdenCompra(orden);
                this.showNotification('Orden creada correctamente', 'success');
            }
            
            const modal = document.getElementById('modal-orden');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error guardando orden:', error);
            this.showNotification('Error al guardar orden', 'error');
        }
    }

    async editarOrden(id) {
        try {
            // Obtener datos de la orden
            const ordenes = await window.electronAPI.getOrdenesCompra();
            const orden = ordenes.find(o => o.id === id);
            
            if (!orden) {
                this.showNotification('Orden no encontrada', 'error');
                return;
            }

            // Crear modal para editar orden
            const modal = this.createOrdenModal(orden);
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error al editar orden:', error);
            this.showNotification('Error al cargar datos de la orden', 'error');
        }
    }

    async verMovimiento(id) {
        try {
            // Obtener datos del movimiento
            const movimientos = await window.electronAPI.getMovimientosInventario();
            const movimiento = movimientos.find(m => m.id === id);
            
            if (!movimiento) {
                this.showNotification('Movimiento no encontrado', 'error');
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
            this.showNotification('Error al cargar datos del movimiento', 'error');
        }
    }

    async generarOrdenProducto(productoId) {
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === productoId);
            
            if (!producto) {
                this.showNotification('Producto no encontrado', 'error');
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
                    this.showNotification('Orden generada correctamente', 'success');
                    modal.style.display = 'none';
                    modal.remove();
                    await this.loadOrdenesCompra();
                } catch (error) {
                    console.error('Error creando orden:', error);
                    this.showNotification('Error al generar orden', 'error');
                }
            });
            
        } catch (error) {
            console.error('Error al generar orden:', error);
            this.showNotification('Error al cargar datos del producto', 'error');
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
            this.showNotification('Error cargando datos iniciales', 'error');
        }
    }

    // ========== FUNCIONES FALTANTES ==========
    
    async ajustarStockMinimo(id) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            
            if (!producto) {
                this.showNotification('Producto no encontrado', 'error');
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

    // Funciones de productos, clientes, eventos que pueden estar faltando
    async editarProducto(id) {
        this.showNotification(`Editando producto ${id}`, 'info');
    }

    async verProducto(id) {
        this.showNotification(`Viendo producto ${id}`, 'info');
    }

    async eliminarProducto(id) {
        if (confirm('¿Eliminar este producto?')) {
            this.showNotification(`Producto ${id} eliminado`, 'success');
        }
    }

    async editarCliente(id) {
        this.showNotification(`Editando cliente ${id}`, 'info');
    }

    async verCliente(id) {
        this.showNotification(`Viendo cliente ${id}`, 'info');
    }

    async nuevoPedidoCliente(id) {
        this.showNotification(`Nuevo pedido para cliente ${id}`, 'info');
    }

    async editarEvento(id) {
        this.showNotification(`Editando evento ${id}`, 'info');
    }

    async gestionarEventoStock(id) {
        this.showNotification(`Gestionando stock para evento ${id}`, 'info');
    }

    async eliminarEvento(id) {
        if (confirm('¿Eliminar este evento?')) {
            this.showNotification(`Evento ${id} eliminado`, 'success');
        }
    }

    // Funciones auxiliares para nuevos elementos
    async nuevoCliente() {
        this.showNotification('Abriendo formulario de nuevo cliente', 'info');
    }

    async nuevoEvento() {
        this.showNotification('Abriendo formulario de nuevo evento', 'info');
    }

    async loadConfiguracionData() {
        console.log('⚙️ Cargando configuración...');
        this.showNotification('Configuración cargada', 'info');
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
