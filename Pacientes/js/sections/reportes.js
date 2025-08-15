



// Función para obtener pacientes con CHD pendiente de FAV (simulación, reemplaza con tu lógica real)
async function obtenerPacientesCHDPendienteFAV() {
  // Consulta real a la base de datos vía IPC
  // Requiere que el handler 'get-pacientes-chd-pendiente-fav' esté implementado en ipcHandlers.js
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-chd-pendiente-fav');
  // Adaptar los campos para el reporte
  return pacientes.map(p => ({
    usuario: `${p.nombre} ${p.apellidos}`,
    ubicacion: `${p.ubicacion_anatomica || ''} ${p.ubicacion_lado || ''}`.trim(),
    fecha_instalacion: p.fecha_instalacion,
    observaciones: p.observaciones || ''
  }));
}
document.getElementById('btn-generar-reporte-chd').addEventListener('click', async function() {
  // Aquí puedes obtener los datos desde tu backend o base de datos
  const datos = await obtenerPacientesCHDPendienteFAV(); // Debes implementar esta función
  const profesional = 'Dr. Ejemplo'; // Puedes obtenerlo dinámicamente
  const mes = 'Agosto';
  const anio = '2025';

  // Crea el HTML del modal si no existe
  let modal = document.getElementById('modal-reporte-chd');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-reporte-chd';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registro de pacientes con CHD pendiente de FAV</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <strong>Mes:</strong> ${mes} &nbsp; <strong>Año:</strong> ${anio}
            </div>
            <table class="table table-bordered table-sm">
              <thead class="table-light">
                <tr>
                  <th>N°</th>
                  <th>Usuario</th>
                  <th>Ubicación</th>
                  <th>Fecha de instalación</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody id="reporte-chd-body"></tbody>
            </table>
            <div class="mt-3">
              <strong>Profesional:</strong> ${profesional}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" onclick="window.print()">
              <i class="bi bi-printer"></i> Imprimir
            </button>
            <button class="btn btn-danger" id="btn-exportar-pdf-reporte-chd">
              <i class="bi bi-file-earmark-pdf"></i> Exportar PDF
            </button>
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Poblar la tabla
  const tbody = modal.querySelector('#reporte-chd-body');
  tbody.innerHTML = '';
  datos.forEach((item, idx) => {
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.usuario}</td>
        <td>${item.ubicacion}</td>
        <td>${item.fecha_instalacion}</td>
        <td>${item.observaciones || ''}</td>
      </tr>
    `;
  });

  // Mostrar el modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  // Evento para exportar PDF
  const btnExportar = modal.querySelector('#btn-exportar-pdf-reporte-chd');
  btnExportar.onclick = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF no está disponible. Verifica el script y el orden de carga.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    // Título y datos
    doc.setFontSize(16);
    doc.text('Registro de pacientes con CHD pendiente de FAV', 14, 18);
    doc.setFontSize(10);
    // Usar directamente las variables mes y anio
    doc.text(`Mes: ${mes}    Año: ${anio}`, 14, 26);
    // Tabla
    const table = modal.querySelector('table');
    if (!table) {
      alert('No se encontró la tabla de datos.');
      return;
    }
    let rows = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td').forEach(td => row.push(td.textContent));
      rows.push(row);
    });
    // Encabezados
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => headers.push(th.textContent));
    // Usar autoTable si está disponible
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [220, 230, 241], textColor: 40, fontStyle: 'bold', halign: 'left', fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 1.7, halign: 'left' },
        margin: { left: 10, right: 10 }
      });
    } else {
      // Fallback simple
      let y = 32;
      doc.setFontSize(10);
      doc.text(headers.join(' | '), 10, y, { align: 'left' });
      y += 7;
      rows.forEach(row => {
        doc.text(row.join(' | '), 10, y, { align: 'left' });
        y += 7;
      });
    }
    // Profesional
    const profesional = modal.querySelector('.mt-3').textContent || '';
    doc.text(profesional, 14, doc.internal.pageSize.getHeight() - 14);
    doc.save('reporte_chd_pendiente_fav.pdf');
  };
});