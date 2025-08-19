// Obtener nombre completo del profesional desde el perfil
async function getNombreCompletoProfesional() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const data = await ipcRenderer.invoke('perfil-cargar');
  let nombreCompleto = '';
  if (data && data.nombre && data.nombre.trim() !== '') nombreCompleto += data.nombre.trim();
  if (data && data.apellido && data.apellido.trim() !== '') nombreCompleto += (nombreCompleto ? ' ' : '') + data.apellido.trim();
  return nombreCompleto || 'Profesional';
}




// Función para obtener pacientes con CHD pendiente de FAV (simulación, reemplaza con tu lógica real)
async function obtenerPacientesCHDPendienteFAV() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-chd-pendiente-fav');
  return pacientes.map((p, idx) => [
    idx + 1,
    `${p.nombre} ${p.apellidos}`,
    [p.ubicacion_chd, p.ubicacion_lado].filter(Boolean).join(' | '),
    p.fecha_instalacion,
    p.observaciones || ''
  ]);
}

// Función para obtener pacientes con Acceso FAV y pendiente retiro CHD
async function obtenerPacientesFAVPendienteRetiroCHD() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-fav-pendiente-retiro-chd');
  return pacientes.map((p, idx) => [
    idx + 1,
    `${p.nombre} ${p.apellidos}`,
    p.ubicacion_fav || '',
    p.fecha_instalacion_fav || '',
    '', // Fecha Primera Punción (futuro)
    '', // Ubicación CHD (futuro)
    p.fecha_instalacion_chd || '',
    p.observaciones || ''
  ]);
}

// Función para obtener pacientes con CHD y FAV en proceso madurativo
async function obtenerPacientesCHDFAVMadurativo() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-chd-fav-madurativo');
  return pacientes.map((p, idx) => [
    idx + 1,
    `${p.nombre} ${p.apellidos}`,
    `${p.ubicacion_anatomica || ''} ${p.ubicacion_lado || ''}`.trim(),
    p.fecha_instalacion,
    p.fecha_maduracion_fav || '',
    p.observaciones || ''
  ]);
}

// Función para obtener pacientes con Sepsis CHD
async function obtenerPacientesSepsisCHD() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-sepsis-chd');
  return pacientes.map((p, idx) => [
    idx + 1,
    `${p.nombre} ${p.apellidos}`,
    `${p.ubicacion_anatomica || ''} ${p.ubicacion_lado || ''}`.trim(),
    p.fecha_instalacion,
    p.fecha_sepsis || '',
    p.observaciones || ''
  ]);
}

function mostrarModalReporte({ titulo, mes, anio, profesional, columnas, datos, id = 'modal-reporte-generico', exportarPDF = true, descripcion = '' }) {
  let modal = document.getElementById(id);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div style="width:100%">
              <h5 class="modal-title modal-titulo-reporte"><span>🩺</span> ${titulo}</h5>
              <div class="modal-descripcion-reporte text-muted" style="font-size:1.05em;margin-top:2px;">${descripcion}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <strong>Mes:</strong> ${mes} &nbsp; <strong>Año:</strong> ${anio}
            </div>
            <table class="table table-bordered table-sm">
              <thead class="table-light">
                <tr>
                  ${columnas.map(col => `<th>${col}</th>`).join('')}
                </tr>
              </thead>
              <tbody id="reporte-generico-body"></tbody>
            </table>
            <div class="mt-3" id="profesional-reporte-modal"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" onclick="window.print()">
              <i class="bi bi-printer"></i> Imprimir
            </button>
            ${exportarPDF ? `<button class="btn btn-pdf" id="btn-exportar-pdf-reporte-generico"><i class="bi bi-file-earmark-pdf"></i> Exportar PDF</button>` : ''}
            <button class="btn btn-cerrar" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Eliminar el modal del DOM al cerrarse para evitar solapamiento de campos
    modal.addEventListener('hidden.bs.modal', () => {
      modal.parentNode.removeChild(modal);
    });
  }
  // Actualizar SIEMPRE el título y la descripción del modal antes de mostrarlo
  const tituloElem = modal.querySelector('.modal-titulo-reporte');
  if (tituloElem) {
    tituloElem.innerHTML = `<span>🩺</span> ${titulo}`;
  }
  const descripcionElem = modal.querySelector('.modal-descripcion-reporte');
  if (descripcionElem) {
    descripcionElem.innerHTML = descripcion;
  }
  // Poblar la tabla, rellenando con filas vacías hasta completar 15
  const tbody = modal.querySelector('#reporte-generico-body');
  tbody.innerHTML = '';
  const minFilas = 15;
  const totalFilas = Math.max(minFilas, datos.length);
  for (let i = 0; i < totalFilas; i++) {
    const item = datos[i] || Array(columnas.length).fill('&nbsp;');
    tbody.innerHTML += `<tr>${item.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }
  // Actualizar el campo Profesional en el modal (sin bold, solo texto)
  const profesionalDiv = modal.querySelector('#profesional-reporte-modal');
  if (profesionalDiv) {
    profesionalDiv.innerHTML = `<strong>Profesional:</strong> ${profesional}`;
  }
  // Mostrar el modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  // Evento para exportar PDF
  if (exportarPDF) {
    const btnExportar = modal.querySelector('#btn-exportar-pdf-reporte-generico');
    btnExportar.onclick = function() {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('jsPDF no está disponible. Verifica el script y el orden de carga.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(titulo, 14, 18);
      doc.setFontSize(10);
      doc.text(`Mes: ${mes}    Año: ${anio}`, 14, 26);
      // Tabla
      let headers = columnas;
      let minFilas = 15;
      let rows = datos.slice();
      while (rows.length < minFilas) {
        rows.push(Array(headers.length).fill(''));
      }
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
        let y = 32;
        doc.setFontSize(10);
        doc.text(headers.join(' | '), 10, y, { align: 'left' });
        y += 7;
        rows.forEach(row => {
          doc.text(row.join(' | '), 10, y, { align: 'left' });
          y += 7;
        });
      }
      doc.text(`Profesional: ${profesional}`, 14, doc.internal.pageSize.getHeight() - 14);
      doc.save('reporte_generico.pdf');
    };
  }
}


document.getElementById('btn-generar-reporte-chd').addEventListener('click', async function() {
  // Esperar un pequeño retardo para asegurar que el perfil se ha guardado
  setTimeout(async () => {
    const datos = await obtenerPacientesCHDPendienteFAV();
    const profesional = await getNombreCompletoProfesional();
    const mes = 'Agosto';
    const anio = '2025';
    mostrarModalReporte({
      titulo: 'Registro de pacientes con CHD pendiente de FAV',
      descripcion: 'Controla pacientes con CHD y pendiente de confección o reparación de FAV. Este reporte permite identificar a los pacientes que aún no cuentan con una fístula arteriovenosa funcional y requieren seguimiento especial para evitar complicaciones asociadas al acceso temporal. Incluye ubicación, fecha y observaciones clínicas.',
      mes,
      anio,
      profesional,
      columnas: ['Nº', 'Usuario', 'Ubicación CHD', 'Fecha de Instalación', 'Observaciones'],
      datos
    });
  }, 200);
});

// Evento para el nuevo reporte: Acceso FAV, pendiente retiro CHD
document.getElementById('btn-generar-reporte-fav-pendiente-retiro-chd').addEventListener('click', async function() {
  setTimeout(async () => {
    const datos = await obtenerPacientesFAVPendienteRetiroCHD();
    const profesional = await getNombreCompletoProfesional();
    const mes = 'Agosto';
    const anio = '2025';
    mostrarModalReporte({
      titulo: 'Acceso FAV, pendiente retiro CHD',
      descripcion: 'Visualiza pacientes con acceso FAV y retiro de CHD pendiente. Este reporte ayuda a gestionar el proceso de transición de acceso vascular, asegurando que los pacientes con FAV maduro sean evaluados para el retiro oportuno del catéter y así reducir riesgos de infección. Facilita el seguimiento y la planificación clínica.',
      mes,
      anio,
      profesional,
      columnas: ['Nº', 'Usuario', 'Ubicación FAV', 'Fecha de Instalación FAV', 'Fecha Primera Punción', 'Ubicación CHD', 'Fecha de instalación CHD', 'Observaciones'],
      datos
    });
  }, 200);
});

// Evento para reporte: CHD, FAV en proceso Madurativo
document.getElementById('btn-generar-reporte-chd-fav-madurativo').addEventListener('click', async function() {
  setTimeout(async () => {
    const datos = await obtenerPacientesCHDFAVMadurativo();
    const profesional = await getNombreCompletoProfesional();
    const mes = 'Agosto';
    const anio = '2025';
    mostrarModalReporte({
      titulo: 'Acceso CHD, FAV en proceso Madurativo',
      descripcion: 'Pacientes con CHD y FAV en proceso madurativo. Permite identificar a quienes están en fase de maduración de la fístula arteriovenosa, facilitando el control evolutivo y la toma de decisiones clínicas para el cambio de acceso.',
      mes,
      anio,
      profesional,
      columnas: ['N°', 'Usuario', 'Ubicación', 'Fecha de instalación', 'Fecha maduración FAV', 'Observaciones'],
      datos
    });
  }, 200);
});

// Evento para reporte: Sepsis CHD
document.getElementById('btn-generar-reporte-sepsis-chd').addEventListener('click', async function() {
  setTimeout(async () => {
    const datos = await obtenerPacientesSepsisCHD();
    const profesional = await getNombreCompletoProfesional();
    const mes = 'Agosto';
    const anio = '2025';
    mostrarModalReporte({
      titulo: 'Sepsis CHD',
      descripcion: 'Reporte de pacientes con sepsis asociada a CHD. Permite el seguimiento de casos de infección grave vinculados al catéter, facilitando la gestión clínica y la prevención de complicaciones.',
      mes,
      anio,
      profesional,
      columnas: ['N°', 'Usuario', 'Ubicación', 'Fecha de instalación', 'Fecha Sepsis', 'Observaciones'],
      datos
    });
  }, 200);
});