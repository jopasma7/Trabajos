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
  const pacientesRaw = await ipcRenderer.invoke('get-pacientes-fav-pendiente-retiro-chd');
  // Filtrar pacientes: solo mostrar si ubicacion_chd o lado_chd NO están ambos vacíos
  const pacientesFiltrados = pacientesRaw.filter(p => {
    const ubicacion = (p.ubicacion_chd || '').trim();
    const lado = (p.lado_chd || '').trim();
    return ubicacion.length > 0 || lado.length > 0;
  });
  return pacientesFiltrados.map((p, idx) => [
    idx + 1,
    `${p.nombre} ${p.apellidos}`,
    p.ubicacion_fav || '',
    p.fecha_instalacion_fav || '', // sin formatear aquí
    p.fecha_primera_puncion || '',
    p.ubicacion_chd || '',
    p.fecha_instalacion_chd || '',
    [p.observaciones_fav, p.observaciones_chd].filter(Boolean).join(' | ')
  ]);
}

// Función para obtener pacientes con CHD y FAV en proceso madurativo
async function obtenerPacientesCHDFAVMadurativo() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  const pacientes = await ipcRenderer.invoke('get-pacientes-chd-fav-madurativo');
  // Los campos ya vienen formateados desde el backend
  return pacientes.map(p => [
    p.numero,
    p.usuario,
    p.ubicacion_chd,
    p.fecha_instalacion_chd,
    p.ubicacion_fav && p.ubicacion_fav.trim() !== '' ? p.ubicacion_fav : '⚠️ Sin datos',
    p.fecha_instalacion_fav && p.fecha_instalacion_fav.trim() !== '' ? p.fecha_instalacion_fav : '⚠️ Sin datos',
    [p.observaciones_chd, p.observaciones_fav].filter(Boolean).join(' | ')
  ]);
}

// Función para obtener pacientes con Sepsis
async function obtenerPacientesSepsisCHD() {
  const { ipcRenderer } = window.require ? window.require('electron') : window.electron;
  // El backend ya devuelve los datos en el formato correcto
  return await ipcRenderer.invoke('get-pacientes-sepsis-chd');
}

// Crear el modal genérico al iniciar la app (solo una vez)
(function crearModalGenerico() {
  const id = 'modal-reporte-generico';
  if (!document.getElementById(id)) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    // El contenido se actualizará dinámicamente en mostrarModalReporte
    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    // Si quieres eliminar el modal al cerrarse, puedes dejar el listener, pero ya no es necesario para evitar el error
    // modal.addEventListener('hidden.bs.modal', () => { modal.remove(); });
  }
})();

function mostrarModalReporte({ titulo, mes, anio, profesional, columnas, datos, id = 'modal-reporte-generico', exportarPDF = true, descripcion = '' }) {
  const modal = document.getElementById(id);
  // Actualiza el contenido del modal SIEMPRE
  modal.querySelector('.modal-content').innerHTML = `
    <div class="modal-header">
      <div style="width:100%">
        <h5 class="modal-title modal-titulo-reporte"><span>🩺</span> ${titulo}</h5>
        <div class="modal-descripcion-reporte text-muted" style="font-size:1.05em;margin-top:2px;">${descripcion}</div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body">
      <div class="row mb-3 g-3 align-items-end">
        <div class="col-md-3 col-12">
          <label for="filtro-fecha-inicio" class="form-label"><i class="bi bi-calendar-date"></i> Fecha inicio</label>
          <input type="date" id="filtro-fecha-inicio" class="form-control" />
        </div>
        <div class="col-md-3 col-12">
          <label for="filtro-fecha-fin" class="form-label"><i class="bi bi-calendar-date"></i> Fecha fin</label>
          <input type="date" id="filtro-fecha-fin" class="form-control" />
        </div>
        <div class="col-md-6 col-12 d-flex justify-content-end align-items-end">
          <button id="btn-filtrar-fechas-reporte" class="btn btn-pdf" style="font-size:1.08em; min-width:180px;"><i class="bi bi-funnel"></i> Filtrar por fecha</button>
        </div>
      </div>
      <div class="mb-2">
        <strong>Mes:</strong> ${mes} &nbsp; <strong>Año:</strong> ${anio}
      </div>
      <table class="table table-bordered table-sm">
        <thead class="table-light">
          <tr>
            ${(() => {
              // Buscar la columna de fecha
              const fechaIdx = columnas.findIndex(c => c.toLowerCase().includes('fecha'));
              return columnas.map((col, idx) => {
                if (idx === fechaIdx) {
                  return `<th class="columna-fecha-ref" title="Columna de referencia para el filtro"><i class="bi bi-calendar-event"></i> ${col}</th>`;
                } else {
                  return `<th>${col}</th>`;
                }
              }).join('');
            })()}
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
  `;

  // Poblar la tabla, mostrando solo 5 filas si hay menos de 5 pacientes
  const tbody = modal.querySelector('#reporte-generico-body');
  tbody.innerHTML = '';
  let rows = datos.slice();
  const minFilas = 5;
  if (rows.length < minFilas) {
    while (rows.length < minFilas) {
      rows.push(Array(columnas.length).fill('&nbsp;'));
    }
  }
  rows.forEach(item => {
    tbody.innerHTML += `<tr>${item.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  });

  // Lógica de filtrado por fecha
  const btnFiltrar = modal.querySelector('#btn-filtrar-fechas-reporte');
  if (btnFiltrar) {
    btnFiltrar.onclick = function() {
      const inicio = modal.querySelector('#filtro-fecha-inicio').value;
      const fin = modal.querySelector('#filtro-fecha-fin').value;
      let filtrados = datos;
      if (inicio || fin) {
        // Buscar la PRIMERA columna que contenga "fecha" en el nombre
        let fechaIdx = columnas.findIndex(c => c.toLowerCase().includes('fecha'));
        if (fechaIdx === -1) {
          tbody.innerHTML = '';
          return; // No hay columna de fecha, no filtrar
        }
        // Función para normalizar a DD-MM-YYYY
        function normalizaFecha(fechaStr) {
          if (!fechaStr) return '';
          // Si es YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
            const [a, m, d] = fechaStr.split('-');
            return `${d}-${m}-${a}`;
          }
          // Si es DD-MM-YYYY
          if (/^\d{2}-\d{2}-\d{4}$/.test(fechaStr)) {
            return fechaStr;
          }
          // Si es otro formato, intentar parsear
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) return '';
          const d = String(fecha.getDate()).padStart(2, '0');
          const m = String(fecha.getMonth() + 1).padStart(2, '0');
          const a = fecha.getFullYear();
          return `${d}-${m}-${a}`;
        }

        filtrados = datos.filter(row => {
          const fechaStr = row[fechaIdx];
          const fechaNorm = normalizaFecha(fechaStr);
          if (!fechaNorm) return false;
          let incluir = true;
          if (inicio) {
            const inicioNorm = normalizaFecha(inicio);
            incluir = incluir && (fechaNorm >= inicioNorm);
          }
          if (fin) {
            const finNorm = normalizaFecha(fin);
            incluir = incluir && (fechaNorm <= finNorm);
          }
          return incluir;
        });
      }
      tbody.innerHTML = '';
      let rowsFiltrados = filtrados.slice();
      if (rowsFiltrados.length < minFilas) {
        while (rowsFiltrados.length < minFilas) {
          rowsFiltrados.push(Array(columnas.length).fill('&nbsp;'));
        }
      }
      rowsFiltrados.forEach(item => {
        tbody.innerHTML += `<tr>${item.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
      });
    };
  }

  // Actualizar el campo Profesional en el modal
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
      let minFilasPDF = 15;
      let rowsPDF = datos.slice();
      while (rowsPDF.length < minFilasPDF) {
        rowsPDF.push(Array(headers.length).fill(''));
      }
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [headers],
          body: rowsPDF,
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
        rowsPDF.forEach(row => {
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
  const fechaActual = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[fechaActual.getMonth()];
  const anio = fechaActual.getFullYear();
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
    const datosRaw = await obtenerPacientesFAVPendienteRetiroCHD();
    const formatearFecha = fecha => {
      if (!fecha) return '';
      // Si la fecha está en formato YYYY-MM-DD, la convertimos a DD-MM-YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [a, m, d] = fecha.split('-');
        return `${d}-${m}-${a}`;
      }
      return fecha;
    };
    const datos = datosRaw.map(row => [
      row[0], // Nº
      row[1], // Usuario
      row[2], // Ubicación FAV
      formatearFecha(row[3]), // Fecha de Instalación FAV SOLO aquí
      formatearFecha(row[4]), // Fecha Primera Punción
      row[5], // Ubicación CHD
      formatearFecha(row[6]), // Fecha de instalación CHD
      row[7]  // Observaciones
    ]);
    const profesional = await getNombreCompletoProfesional();
  const fechaActual = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[fechaActual.getMonth()];
  const anio = fechaActual.getFullYear();
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
    const datosRaw = await obtenerPacientesCHDFAVMadurativo();
    const formatearFecha = fecha => {
      if (!fecha) return '';
      const partes = fecha.split('-');
      if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
      return fecha;
    };
    const datos = datosRaw.map(row => [
      row[0], // Nº
      row[1], // Usuario
      row[2], // Ubicación CHD
      formatearFecha(row[3]), // Fecha de Instalación CHD
      row[4], // Ubicación FAV
      formatearFecha(row[5]), // Fecha de instalación FAV
      row[6]  // Observaciones
    ]);
    const profesional = await getNombreCompletoProfesional();
  const fechaActual = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[fechaActual.getMonth()];
  const anio = fechaActual.getFullYear();
    mostrarModalReporte({
      titulo: 'Acceso CHD, FAV en proceso Madurativo',
      descripcion: 'Pacientes con CHD y FAV en proceso madurativo. Permite identificar a quienes están en fase de maduración de la fístula arteriovenosa, facilitando el control evolutivo y la toma de decisiones clínicas para el cambio de acceso.',
      mes,
      anio,
      profesional,
      columnas: ['Nº', 'Usuario', 'Ubicación CHD', 'Fecha de Instalación CHD', 'Ubicación FAV', 'Fecha de instalación FAV', 'Observaciones'],
      datos
    });
  }, 200);
});

// Evento para reporte: Sepsis
document.getElementById('btn-generar-reporte-sepsis-chd').addEventListener('click', async function() {
  setTimeout(async () => {
  const datosRaw = await obtenerPacientesSepsisCHD();
  const profesional = await getNombreCompletoProfesional();
  const fechaActual = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = meses[fechaActual.getMonth()];
  const anio = fechaActual.getFullYear();
     // Ordenar para mostrar el número 1 primero y el último al final
     const formatearFecha = fecha => {
       if (!fecha) return '';
       const partes = fecha.split('-');
       if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
       return fecha;
     };
     const datos = datosRaw
       .filter(row => row && (row.paciente || row.fecha_diagnostico || row.microorganismo || row.medidas))
       .map((row, idx) => [
         (row.numero !== undefined ? row.numero : idx + 1),
         row.paciente || '',
         (row.tipo_acceso && typeof row.tipo_acceso === 'object') ? (row.tipo_acceso.nombre || '') : (typeof row.tipo_acceso === 'string' ? row.tipo_acceso : ''),
         formatearFecha(row.fecha_diagnostico),
         row.microorganismo || '',
         row.medidas || ''
       ])
       .sort((a, b) => a[0] - b[0]); // Sort by patient number
  mostrarModalReporte({
  titulo: 'Sepsis',
    descripcion: 'Reporte de pacientes con infecciones asociadas a CHD. Permite el seguimiento de casos de infección grave vinculados al catéter, facilitando la gestión clínica y la prevención de complicaciones.',
    mes,
    anio,
    profesional,
  columnas: ['Nº', 'Paciente', 'Tipo de Acceso', 'Fecha de Diagnóstico', 'Microorganismo asociado', 'Medidas'],
    datos
  });
  }, 200);
});