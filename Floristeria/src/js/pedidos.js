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
    {
      id: 1,
      cliente: 'Ana Torres',
      fecha: '2024-06-10',
      productos: 'Ramo de rosas',
      estado: 'pendiente',
    },
    {
      id: 2,
      cliente: 'Carlos Ruiz',
      fecha: '2024-06-09',
      productos: 'Orquídea blanca',
      estado: 'realizado',
    },
    {
      id: 3,
      cliente: 'Lucía Gómez',
      fecha: '2024-06-08',
      productos: 'Centro de mesa',
      estado: 'entregado',
    },
    {
      id: 4,
      cliente: 'Pedro Díaz',
      fecha: '2024-06-07',
      productos: 'Ramo variado',
      estado: 'cancelado',
    },
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
