// pedidos.js
// Lógica para tabs y renderizado de pedidos

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.pedidos-section');

  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      sections[idx].classList.add('active');
    });
  });

  // Datos de ejemplo para pedidos
  const pedidos = [
    { id: 1, cliente: 'Ana Torres', fecha: '2024-06-10', productos: 'Ramo de rosas', estado: 'pendiente' },
    { id: 2, cliente: 'Carlos Ruiz', fecha: '2024-06-09', productos: 'Orquídea blanca', estado: 'realizado' },
    { id: 3, cliente: 'Lucía Gómez', fecha: '2024-06-08', productos: 'Centro de mesa', estado: 'entregado' },
    { id: 4, cliente: 'Pedro Díaz', fecha: '2024-06-07', productos: 'Ramo variado', estado: 'cancelado' },
    { id: 5, cliente: 'María López', fecha: '2024-06-06', productos: 'Bouquet primaveral', estado: 'pendiente' },
    { id: 6, cliente: 'Javier Martín', fecha: '2024-06-05', productos: 'Caja de tulipanes', estado: 'pendiente' },
    { id: 7, cliente: 'Sofía Pérez', fecha: '2024-06-04', productos: 'Ramo de girasoles', estado: 'entregado' },
    { id: 8, cliente: 'Miguel Ángel', fecha: '2024-06-03', productos: 'Centro de orquídeas', estado: 'realizado' },
    { id: 9, cliente: 'Laura Sánchez', fecha: '2024-06-02', productos: 'Ramo de margaritas', estado: 'pendiente' },
    { id: 10, cliente: 'Raúl Fernández', fecha: '2024-06-01', productos: 'Bouquet elegante', estado: 'entregado' },
    { id: 11, cliente: 'Elena Romero', fecha: '2024-05-31', productos: 'Ramo de lirios', estado: 'pendiente' },
    { id: 12, cliente: 'Pablo García', fecha: '2024-05-30', productos: 'Ramo de rosas rojas', estado: 'realizado' },
    { id: 13, cliente: 'Carmen Ruiz', fecha: '2024-05-29', productos: 'Centro de flores silvestres', estado: 'pendiente' },
    { id: 14, cliente: 'Alberto Torres', fecha: '2024-05-28', productos: 'Ramo de peonías', estado: 'entregado' },
    { id: 15, cliente: 'Isabel Díaz', fecha: '2024-05-27', productos: 'Bouquet romántico', estado: 'pendiente' },
    { id: 16, cliente: 'Manuel López', fecha: '2024-05-26', productos: 'Ramo de flores mixtas', estado: 'cancelado' },
    { id: 17, cliente: 'Patricia Gómez', fecha: '2024-05-25', productos: 'Caja de rosas', estado: 'pendiente' },
    { id: 18, cliente: 'Francisco Pérez', fecha: '2024-05-24', productos: 'Ramo de tulipanes', estado: 'realizado' },
    { id: 19, cliente: 'Lucía Martín', fecha: '2024-05-23', productos: 'Centro de mesa elegante', estado: 'pendiente' },
    { id: 20, cliente: 'David Sánchez', fecha: '2024-05-22', productos: 'Bouquet de temporada', estado: 'entregado' }
  ];

  // Renderizar pedidos en la tabla de pedidos entrantes
  function renderEntrantes() {
    const tbody = document.querySelector('#pedidos-table tbody');
    if (!tbody) return;
    // Obtener filtros
    const estadoFiltro = document.getElementById('filter-estado').value;
    const fechaFiltro = document.getElementById('filter-fecha').value;
    // Filtrar pedidos
    let filtrados = pedidos.filter(p => {
      let estadoOk = !estadoFiltro || p.estado === estadoFiltro;
      let fechaOk = !fechaFiltro || p.fecha === fechaFiltro;
      return estadoOk && fechaOk;
    });
    tbody.innerHTML = '';
    if (filtrados.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="7" class="text-center">No hay pedidos para mostrar</td>';
      tbody.appendChild(tr);
      return;
    }
    filtrados.forEach(pedido => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pedido.id}</td>
        <td>${pedido.cliente}</td>
        <td>${pedido.fecha}</td>
        <td>${pedido.productos}</td>
        <td><span class="pedido-estado estado-${pedido.estado}">${pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}</span></td>
        <td>€0.00</td>
        <td>
          <button class="btn btn-sm btn-outline-primary">Ver</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Renderizar resumen
  function renderResumen() {
    const resumenPendientes = document.getElementById('resumen-pendientes');
    const resumenRealizados = document.getElementById('resumen-realizados');
    const resumenCancelados = document.getElementById('resumen-cancelados');
    const resumenEntregados = document.getElementById('resumen-entregados');
    resumenPendientes.innerHTML = '';
    resumenRealizados.innerHTML = '';
    resumenCancelados.innerHTML = '';
    resumenEntregados.innerHTML = '';
    pedidos.forEach(pedido => {
      const card = createPedidoCard(pedido);
      if (pedido.estado === 'pendiente') resumenPendientes.appendChild(card);
      if (pedido.estado === 'realizado') resumenRealizados.appendChild(card);
      if (pedido.estado === 'cancelado') resumenCancelados.appendChild(card);
      if (pedido.estado === 'entregado') resumenEntregados.appendChild(card);
    });
  }

  // Crear tarjeta de pedido
  function createPedidoCard(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    const info = document.createElement('div');
    info.className = 'pedido-info';
    info.innerHTML = `<strong>${pedido.cliente}</strong> <br>
      <span>${pedido.productos}</span><br>
      <small>Fecha: ${pedido.fecha}</small>`;
    const estado = document.createElement('span');
    estado.className = 'pedido-estado estado-' + pedido.estado;
    estado.textContent = pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1);
    card.appendChild(info);
    card.appendChild(estado);
    return card;
  }

  // Eventos de filtro
  document.getElementById('filter-estado').addEventListener('change', renderEntrantes);
  document.getElementById('filter-fecha').addEventListener('change', renderEntrantes);

  // Inicializar
  renderEntrantes();
  renderResumen();
});
