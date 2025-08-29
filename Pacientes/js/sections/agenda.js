// Función global para mostrar mensajes flotantes (debe estar antes de cualquier uso)
// js/sections/agenda.js
// Lógica profesional de la sección Agenda

const hoy = new Date();
const hoyKey = hoy.toISOString().slice(0,10);
const { ipcRenderer } = require('electron');
let eventos = [];

function setupAgendaSection() {
  // --- FILTRO Y BÚSQUEDA ---
  window._agendaBusquedaTexto = '';
  window._agendaFiltroCategoria = '';
  window._agendaFiltroEventos = 'todos';
  const inputBusqueda = document.getElementById('agendaBusquedaEventos');
  const selectCategoria = document.getElementById('agendaFiltroCategoria');
  const selectTipo = document.getElementById('agendaFiltroEventos');
  function actualizarFiltrosAgenda() {
    window._agendaBusquedaTexto = inputBusqueda ? inputBusqueda.value.toLowerCase() : '';
    window._agendaFiltroCategoria = selectCategoria ? selectCategoria.value : '';
    window._agendaFiltroEventos = selectTipo ? selectTipo.value : 'todos';
    agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento);
  }
  if (inputBusqueda) inputBusqueda.addEventListener('input', actualizarFiltrosAgenda);
  if (selectCategoria) selectCategoria.addEventListener('change', actualizarFiltrosAgenda);
  if (selectTipo) selectTipo.addEventListener('change', actualizarFiltrosAgenda);
  const agendaSection = document.getElementById('agenda-section');
  if (!agendaSection) return;
  const agendaBody = document.getElementById('agenda-body');
  const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
  const modalEvento = new bootstrap.Modal(document.getElementById('modal-evento'));
  const formEvento = document.getElementById('form-evento');
	// Render y acciones
// Función global para mostrar mensajes flotantes
  function openModalEditar(id) {
    const ev = agenda.getEventos().find(e => e.id === id);
    if (!ev) return;
  document.getElementById('modalEventoTitulo').textContent = 'Editar Evento';
    document.getElementById('evento-fecha').value = ev.fecha;
    document.getElementById('evento-hora').value = ev.hora;
    document.getElementById('evento-titulo').value = ev.titulo;
    document.getElementById('evento-descripcion').value = ev.descripcion || '';
  document.getElementById('evento-id').value = ev.id;
  document.getElementById('evento-categoria').value = ev.categoria || '';
    modalEvento.show();
  }
  // Renderiza los eventos de un día en un contenedor dado
  function renderEventosDia(contenedor, eventosFiltrados) {
    // Eliminar todos los hijos del contenedor (más seguro que innerHTML)
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);
    // Forzar reflow
    void contenedor.offsetHeight;
    if (eventosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="text-muted small text-center">—</div>';
    } else {
      const eventosHtml = eventosFiltrados
        .sort((a, b) => a.hora.localeCompare(b.hora))
        .map((ev, idx, arr) => {
          let claseNuevo = '';
          if (window._ultimoEventoCreado && ev.id === window._ultimoEventoCreado) {
            claseNuevo = '';
            setTimeout(() => { window._ultimoEventoCreado = null; }, 1000);
          }
          // Quitar mb-1 al último evento
          const mbClass = (idx === arr.length - 1) ? '' : 'mb-1';
          return `
            <div class="agenda-evento-calendario bg-white border-end border-3 px-2 py-1 ${mbClass} position-relative ${claseNuevo} ${(() => {
              const ahora = new Date();
              // Crear fecha/hora local correctamente
              const [anio, mes, dia] = ev.fecha.split('-').map(Number);
              const [hora, minuto] = ev.hora.split(':').map(Number);
              const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto);
              if (fechaHoraEv < ahora) return 'evento-pasado';
              const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
              if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) return 'evento-proximo';
              if (ev.categoria === 'importante') return 'evento-categoria-importante';
              if (ev.categoria === 'personal') return 'evento-categoria-personal';
              if (ev.categoria === 'trabajo') return 'evento-categoria-trabajo';
              return '';
            })()}" data-id="${ev.id}" data-dia="${ev.fecha}" title="${ev.titulo} - ${ev.descripcion} (${ev.hora})">
              <div class="fw-bold text-success small">
                <i class="bi bi-clock me-1"></i> ${ev.hora}
                ${(() => {
                  const ahora = new Date();
                  const [anio, mes, dia] = ev.fecha.split('-').map(Number);
                  const [hora, minuto] = ev.hora.split(':').map(Number);
                  const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto);
                  if (fechaHoraEv < ahora) {
                    return '';
                  }
                  return '';
                })()}
                ${(() => {
                  const ahora = new Date();
                  const [anio, mes, dia] = ev.fecha.split('-').map(Number);
                  const [hora, minuto] = ev.hora.split(':').map(Number);
                  const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto);
                  const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                  if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) {
                    return '<i class=\'bi bi-lightning-charge-fill text-warning ms-2\' title=\'Evento próximo\'></i>';
                  }
                  return '';
                })()}
              </div>
              <div class="fw-semibold small">${ev.titulo}</div>
              <div class="text-muted small fst-italic">${ev.descripcion ? ev.descripcion : ''}</div>
              <button class="btn btn-link btn-sm text-primary p-0 position-absolute" style="right: 0.5rem; top: 0;" data-edit="${ev.id}" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-link btn-sm text-danger p-0 position-absolute" style="right: 0.5rem; bottom: 0;" data-delete="${ev.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
            </div>
          `;
        }).join('');
      contenedor.innerHTML = eventosHtml;
    }
    // Volver a asociar listeners de editar y eliminar solo en esa columna
    contenedor.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = () => eliminarEvento(btn.getAttribute('data-delete'));
    });
    contenedor.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => openModalEditar(btn.getAttribute('data-edit'));
    });
  }

  function eliminarEvento(id) {
    // Animación de desvanecimiento al eliminar
    const row = agendaBody.querySelector(`[data-delete="${id}"]`)?.closest('.agenda-evento-calendario');
    const diaCol = row?.closest('.agenda-dia-col');
    const diaKey = row?.getAttribute('data-dia');
    if (row) {
      row.classList.add('evento-eliminando');
      // Esperar a que termine la transición de opacity
      row.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'opacity') {
          row.removeEventListener('transitionend', handler);
          // Eliminar de datos y re-renderizar columna
          const nuevos = agenda.getEventos().filter(e => e.id !== id);
          agenda.setEventos(nuevos);
          agenda.guardarEventos(() => {
            if (row && diaCol && diaKey) {
              // Además, eliminar cualquier nodo .agenda-evento-calendario.evento-eliminando que haya quedado en el DOM
              diaCol.querySelectorAll('.agenda-evento-calendario.evento-eliminando').forEach(n => n.remove());
              // Re-renderizar solo la columna del día usando la función reutilizable
              var eventosPorDia = {};
              nuevos.forEach(ev => {
                if (!eventosPorDia[ev.fecha]) eventosPorDia[ev.fecha] = [];
                eventosPorDia[ev.fecha].push(ev);
              });
              let eventosFiltrados = eventosPorDia[diaKey] || [];
              const ahora = new Date();
              if (window._agendaFiltroEventos === 'futuros') {
                eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) >= ahora);
              } else if (window._agendaFiltroEventos === 'pasados') {
                eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) < ahora);
              }
              const contenedor = diaCol.querySelector('.flex-grow-1');
              renderEventosDia(contenedor, eventosFiltrados);
              mostrarMensaje('Evento eliminado correctamente', 'success');
            } else {
                mostrarMensaje('Evento eliminado correctamente', 'success');
            }
            if (window.cargarDatosDashboard) window.cargarDatosDashboard();
          });
        }
      });
    }
  }
  // Botón nuevo evento
  btnNuevoEvento.onclick = () => {
    formEvento.reset();
  document.getElementById('modalEventoTitulo').textContent = 'Nuevo Evento';
    document.getElementById('evento-id').value = '';
  // Poner fecha y hora actual por defecto
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const hh = String(hoy.getHours()).padStart(2, '0');
  const min = String(hoy.getMinutes()).padStart(2, '0');
  document.getElementById('evento-fecha').value = `${yyyy}-${mm}-${dd}`;
  document.getElementById('evento-hora').value = `${hh}:${min}`;
    modalEvento.show();
  };
	// Guardar evento (nuevo o editado)
	formEvento.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('evento-id').value || crypto.randomUUID();
    const categoriaValue = document.getElementById('evento-categoria').value;
    let eventos = agenda.getEventos();
    const idx = eventos.findIndex(ev => ev.id === id);
    const completado = (idx >= 0 && typeof eventos[idx].completado !== 'undefined') ? !!eventos[idx].completado : false;
    const nuevoEvento = {
      id,
      fecha: document.getElementById('evento-fecha').value,
      hora: document.getElementById('evento-hora').value,
      titulo: document.getElementById('evento-titulo').value,
      descripcion: document.getElementById('evento-descripcion').value,
      categoria: categoriaValue === undefined || categoriaValue === null ? '' : categoriaValue,
      completado
    };
    if (idx >= 0) {
      eventos[idx] = nuevoEvento;
      mostrarMensaje('Evento editado correctamente', 'success');
    } else {
      eventos.push(nuevoEvento);
      mostrarMensaje('Evento creado correctamente', 'success');
    }
    agenda.setEventos(eventos);
    agenda.guardarEventos(() => {
      agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento);
      if (window.cargarDatosDashboard) window.cargarDatosDashboard();
    });
    modalEvento.hide(); 
  };
  // Al iniciar, poner el filtro de fecha al día de hoy
  const picker = document.getElementById('agendaSemanaPicker');
  if (picker) {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    picker.value = `${yyyy}-${mm}-${dd}`;
  }
  // Cargar y renderizar eventos solo al iniciar
  agenda.cargarEventos(() => agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento));
}

function renderAgenda(agendaBody, openModalEditar, eliminarEvento) {

  // Obtener SIEMPRE los valores actuales de los filtros
  const filtroEventos = window._agendaFiltroEventos || 'todos';
  const filtroCategoria = window._agendaFiltroCategoria || '';
  const busquedaTexto = window._agendaBusquedaTexto || '';

  // Calcular días de la semana solo una vez
  if (!window._agendaSemanaBase) {
    window._agendaSemanaBase = new Date();
  }
  let semanaBase = window._agendaSemanaBase;
  if (!(semanaBase instanceof Date)) semanaBase = new Date(semanaBase);
  const diaSemana = semanaBase.getDay() === 0 ? 7 : semanaBase.getDay(); // Lunes=1, Domingo=7
  const lunes = new Date(semanaBase);
  lunes.setDate(semanaBase.getDate() - diaSemana + 1);
  const dias = Array.from({length: 7}, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
  const diasSemana = dias.map(d => d.toISOString().slice(0,10));

  // DEBUG: Mostrar valores de filtros y eventos antes de filtrar
  // ...existing code...

  // Filtrar SOLO eventos de la semana visible
  let eventosSemana = eventos.filter(ev => diasSemana.includes(ev.fecha));

  // ...existing code...

  // Siempre comparar en local
  const ahora = new Date();
  if (filtroEventos === 'futuros') {
    eventosSemana = eventosSemana.filter(ev => {
      const [anio, mes, dia] = ev.fecha.split('-').map(Number);
      const [hora, minuto] = ev.hora.split(':').map(Number);
      // Forzar local time
      const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
      return fechaHoraEv.getTime() >= ahora.getTime();
    });
  // ...existing code...
  } else if (filtroEventos === 'pasados') {
    eventosSemana = eventosSemana.filter(ev => {
      const [anio, mes, dia] = ev.fecha.split('-').map(Number);
      const [hora, minuto] = ev.hora.split(':').map(Number);
      // Forzar local time
      const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
      return fechaHoraEv.getTime() < ahora.getTime();
    });
  // ...existing code...
  }

  // Filtro por categoría
  if (filtroCategoria && filtroCategoria !== '') {
    eventosSemana = eventosSemana.filter(ev => {
      // Si ev.categoria es null o undefined, lo tratamos como ''
      return (ev.categoria || '') === filtroCategoria;
    });
  // ...existing code...
  }

  // Filtro por texto (insensible a mayúsculas/minúsculas y espacios)
  if (busquedaTexto && busquedaTexto.trim() !== '') {
    const textoFiltro = busquedaTexto.trim().toLowerCase();
    eventosSemana = eventosSemana.filter(ev => {
      const texto = ((ev.titulo || '') + ' ' + (ev.descripcion || '')).toLowerCase();
      return texto.includes(textoFiltro);
    });
  // ...existing code...
  }

  // Calcular el día de hoy y su key antes de usarlo en el template
  const hoy = new Date();
  const hoyKey = hoy.toISOString().slice(0,10);

  // No agrupar, solo filtrar por día directamente en el render

  agendaBody.innerHTML = `
    <div class="agenda-semana-horizontal d-flex flex-row flex-nowrap gap-1" style="min-height: 260px;">
        ${dias.map(dia => {
          const key = dia.toISOString().slice(0,10);
          const nombreDia = dia.toLocaleDateString('es-ES', { weekday: 'short' });
          const numDia = dia.getDate();
          const isToday = key === hoyKey;
          // Filtrar eventos de este día directamente
          let eventosFiltrados = eventosSemana.filter(ev => ev.fecha === key);
          return `
            <div class="agenda-dia-col bg-light border rounded-3 h-100 d-flex flex-column p-1 flex-grow-1" style="min-width: 140px; max-width: 1fr;" data-dia-drop="${key}">
              <div class="agenda-dia-header text-center small fw-bold mb-1 ${isToday ? 'agenda-dia-hoy' : ''}">
                <div class="agenda-dia-nombre d-flex align-items-center justify-content-center gap-1">
                  ${(() => {
                    // Indicador de evento importante
                    const eventosImportantes = eventosFiltrados.some(ev => ev.categoria === 'importante');
                    if (eventosImportantes) {
                      return '<span class="badge rounded-pill bg-danger me-1" title="Evento importante" style="width:10px;height:10px;padding:0;"></span>';
                    }
                    return '';
                  })()}
                  ${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}
                </div>
                <div class="d-flex justify-content-center align-items-center gap-1">
                  <div class="agenda-dia-numero">${numDia}</div>
                  <div class="agenda-dia-total-eventos text-secondary small" style="min-width:1.5em;">
                    ${eventosFiltrados.length > 0 ? `<i class='bi bi-calendar-event'></i> ${eventosFiltrados.length}` : ''}
                  </div>
                </div>
              </div>
              <div class="flex-grow-1 d-flex flex-column gap-1" data-dia-dropzone="${key}"></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  // Renderiza los eventos en cada dropzone
  dias.forEach(dia => {
    const key = dia.toISOString().slice(0,10);
    const dropzone = agendaBody.querySelector(`[data-dia-dropzone="${key}"]`);
    // Filtrar eventos de este día directamente
    let eventosFiltrados = eventosSemana.filter(ev => ev.fecha === key);
    if (dropzone) {
      if (eventosFiltrados.length === 0) {
        dropzone.innerHTML = '<div class="text-muted small text-center" style="min-height:40px;display:flex;align-items:center;justify-content:center;pointer-events:none;">—</div>' +
                             '<div style="min-height:20px;pointer-events:none;"></div>';
      } else {
        dropzone.innerHTML = eventosFiltrados
          .sort((a, b) => a.hora.localeCompare(b.hora))
          .map(ev => {
            let claseNuevo = '';
            if (window._ultimoEventoCreado && ev.id === window._ultimoEventoCreado) {
              claseNuevo = 'nuevo-evento';
              setTimeout(() => { window._ultimoEventoCreado = null; }, 1000);
            }
            return `
              <div class="agenda-evento-calendario bg-white border-end border-3 px-2 py-1 mb-1 position-relative ${claseNuevo} ${(() => {
              // Determinar si el evento ya ha pasado o es próximo
              const ahora = new Date();
              const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
              if (fechaHoraEv < ahora) return 'evento-pasado';
              // Evento en la próxima hora
              const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
              if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) return 'evento-proximo';
              // Color por tipo/categoría (aplica al borde derecho)
              if (ev.categoria === 'importante') return 'evento-categoria-importante';
              if (ev.categoria === 'personal') return 'evento-categoria-personal';
              if (ev.categoria === 'trabajo') return 'evento-categoria-trabajo';
              return '';
            })()}"
            data-id="${ev.id}" data-dia="${ev.fecha}"
            draggable="true"
            title="${ev.titulo} - ${ev.descripcion} (${ev.hora})">
              <div class="fw-bold text-success small">
                <i class="bi bi-clock me-1"></i> ${ev.hora}
                <!-- Icono de reloj para eventos pasados eliminado -->
                <!-- Icono de rayo para eventos próximos -->
                ${(() => {
                  const ahora = new Date();
                  const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                  const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                  if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) {
                    return '<i class=\'bi bi-lightning-charge-fill text-warning ms-2\' title=\'Evento próximo\'></i>';
                  }
                  return '';
                })()}
              </div>
              <div class="fw-semibold small">${ev.titulo}</div>
              <div class="text-muted small fst-italic">${ev.descripcion ? ev.descripcion : ''}</div>
              <button class="btn btn-link btn-sm text-primary p-0 position-absolute" style="right: 0.5rem; top: 0;" data-edit="${ev.id}" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-link btn-sm text-success p-0 position-absolute" style="right: 1.8rem; top: 0;" data-completar="${ev.id}" title="Marcar como completado"><i class="bi bi-check-circle${ev.completado ? '-fill' : ''}"></i></button>
              <button class="btn btn-link btn-sm text-danger p-0 position-absolute" style="right: 0.5rem; bottom: 0;" data-delete="${ev.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
            </div>
            `;
          }).join('');
      }
    }
  });

  // Asignar listeners dragstart a los eventos después de renderizar
  setTimeout(() => {
    const eventosArrastrables = agendaBody.querySelectorAll('.agenda-evento-calendario[draggable="true"]');
    eventosArrastrables.forEach(evEl => {
      evEl.addEventListener('dragstart', function(e) {
        e.stopPropagation();
        evEl.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'none');
        e.dataTransfer.setData('text/plain', evEl.getAttribute('data-id'));
      });
      evEl.addEventListener('dragend', function(e) {
        evEl.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'auto');
      });
    });
    // Drag & Drop listeners para columnas de día
    const dropzones = agendaBody.querySelectorAll('[data-dia-dropzone]');
    dropzones.forEach(dropzone => {
      dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropzone.classList.add('dropzone-hover');
      });
      dropzone.addEventListener('dragenter', e => {
        dropzone.classList.add('dropzone-hover');
      });
      dropzone.addEventListener('dragleave', e => {
        dropzone.classList.remove('dropzone-hover');
      });
      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-hover');
        const eventoId = e.dataTransfer.getData('text/plain');
        const diaNuevo = dropzone.getAttribute('data-dia-dropzone');
        if (!eventoId || !diaNuevo) return;
        let eventos = agenda.getEventos();
        const idx = eventos.findIndex(ev => ev.id === eventoId);
        if (idx >= 0 && eventos[idx].fecha !== diaNuevo) {
          const diaAntiguo = eventos[idx].fecha;
          eventos[idx].fecha = diaNuevo;
          agenda.setEventos(eventos);
          agenda.guardarEventos(() => {
            // Solo renderizar columnas afectadas, pero usando los filtros activos
            if (window.cargarDatosDashboard) window.cargarDatosDashboard();
            const filtroEventos = window._agendaFiltroEventos || 'todos';
            const filtroCategoria = window._agendaFiltroCategoria || '';
            const busquedaTexto = window._agendaBusquedaTexto || '';
            // Calcular días de la semana visibles
            let semanaBase = window._agendaSemanaBase;
            if (!(semanaBase instanceof Date)) semanaBase = new Date(semanaBase);
            const diaSemana = semanaBase.getDay() === 0 ? 7 : semanaBase.getDay();
            const lunes = new Date(semanaBase);
            lunes.setDate(semanaBase.getDate() - diaSemana + 1);
            const dias = Array.from({length: 7}, (_, i) => {
              const d = new Date(lunes);
              d.setDate(lunes.getDate() + i);
              return d;
            });
            const diasSemana = dias.map(d => d.toISOString().slice(0,10));
            // Filtrar eventos de la semana visible
            let eventosSemana = eventos.filter(ev => diasSemana.includes(ev.fecha));
            const ahora = new Date();
            if (filtroEventos === 'futuros') {
              eventosSemana = eventosSemana.filter(ev => {
                const [anio, mes, dia] = ev.fecha.split('-').map(Number);
                const [hora, minuto] = ev.hora.split(':').map(Number);
                const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
                return fechaHoraEv.getTime() >= ahora.getTime();
              });
            } else if (filtroEventos === 'pasados') {
              eventosSemana = eventosSemana.filter(ev => {
                const [anio, mes, dia] = ev.fecha.split('-').map(Number);
                const [hora, minuto] = ev.hora.split(':').map(Number);
                const fechaHoraEv = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
                return fechaHoraEv.getTime() < ahora.getTime();
              });
            }
            if (filtroCategoria && filtroCategoria !== '') {
              eventosSemana = eventosSemana.filter(ev => (ev.categoria || '') === filtroCategoria);
            }
            if (busquedaTexto && busquedaTexto.trim() !== '') {
              const textoFiltro = busquedaTexto.trim().toLowerCase();
              eventosSemana = eventosSemana.filter(ev => {
                const texto = ((ev.titulo || '') + ' ' + (ev.descripcion || '')).toLowerCase();
                return texto.includes(textoFiltro);
              });
            }
            // Renderizar solo las columnas de origen y destino
            [diaAntiguo, diaNuevo].forEach(diaKey => {
              const dropzone = agendaBody.querySelector(`[data-dia-dropzone="${diaKey}"]`);
              if (dropzone) {
                let eventosFiltrados = eventosSemana.filter(ev => ev.fecha === diaKey);
                if (eventosFiltrados.length === 0) {
                  dropzone.innerHTML = '<div class="text-muted small text-center" style="min-height:40px;display:flex;align-items:center;justify-content:center;pointer-events:none;">—</div>' +
                                       '<div style="min-height:20px;pointer-events:none;"></div>';
                } else {
                  dropzone.innerHTML = eventosFiltrados
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map(ev => {
                      let claseNuevo = '';
                      if (window._ultimoEventoCreado && ev.id === window._ultimoEventoCreado) {
                        claseNuevo = 'nuevo-evento';
                        setTimeout(() => { window._ultimoEventoCreado = null; }, 1000);
                      }
                      return `
                        <div class="agenda-evento-calendario bg-white border-end border-3 px-2 py-1 mb-1 position-relative ${claseNuevo} ${(() => {
                        const ahora = new Date();
                        const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                        if (fechaHoraEv < ahora) return 'evento-pasado';
                        const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                        if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) return 'evento-proximo';
                        if (ev.categoria === 'importante') return 'evento-categoria-importante';
                        if (ev.categoria === 'personal') return 'evento-categoria-personal';
                        if (ev.categoria === 'trabajo') return 'evento-categoria-trabajo';
                        return '';
                      })()}"
                      data-id="${ev.id}" data-dia="${ev.fecha}"
                      draggable="true"
                      title="${ev.titulo} - ${ev.descripcion} (${ev.hora})">
                        <div class="fw-bold text-success small">
                          <i class="bi bi-clock me-1"></i> ${ev.hora}
                          ${(() => {
                            const ahora = new Date();
                            const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                            if (fechaHoraEv < ahora) {
                                return '';
                              }
                              return '';
                          })()}
                          ${(() => {
                            const ahora = new Date();
                            const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                            const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                            if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) {
                              return '<i class=\'bi bi-lightning-charge-fill text-warning ms-2\' title=\'Evento próximo\'></i>';
                            }
                            return '';
                          })()}
                        </div>
                        <div class="fw-semibold small">${ev.titulo}</div>
                        <div class="text-muted small fst-italic">${ev.descripcion ? ev.descripcion : ''}</div>
                        <button class="btn btn-link btn-sm text-primary p-0 position-absolute" style="right: 0.5rem; top: 0;" data-edit="${ev.id}" title="Editar"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-link btn-sm text-success p-0 position-absolute" style="right: 1.8rem; top: 0;" data-completar="${ev.id}" title="Marcar como completado"><i class="bi bi-check-circle${ev.completado ? '-fill' : ''}"></i></button>
                        <button class="btn btn-link btn-sm text-danger p-0 position-absolute" style="right: 0.5rem; bottom: 0;" data-delete="${ev.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
                      </div>
                      `;
                    }).join('');
                }
                // Reasignar listeners de editar y eliminar en la columna
                dropzone.querySelectorAll('[data-edit]').forEach(btn => {
                  btn.replaceWith(btn.cloneNode(true));
                });
                dropzone.querySelectorAll('[data-edit]').forEach(btn => {
                  btn.onclick = () => openModalEditar(btn.getAttribute('data-edit'));
                });
                dropzone.querySelectorAll('[data-delete]').forEach(btn => {
                  btn.replaceWith(btn.cloneNode(true));
                });
                dropzone.querySelectorAll('[data-delete]').forEach(btn => {
                  btn.onclick = () => eliminarEvento(btn.getAttribute('data-delete'));
                });
                // Reasignar listener de completar en la columna
                dropzone.querySelectorAll('[data-completar]').forEach(btn => {
                  asignarListenerCompletar(btn, openModalEditar, eliminarEvento);
                });
                // Reasignar listeners de drag & drop y dragstart/dragend SOLO en esta columna
                dropzone.querySelectorAll('.agenda-evento-calendario[draggable="true"]').forEach(evEl => {
                  evEl.addEventListener('dragstart', function(e) {
                    e.stopPropagation();
                    evEl.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'none');
                    e.dataTransfer.setData('text/plain', evEl.getAttribute('data-id'));
                  });
                  evEl.addEventListener('dragend', function(e) {
                    evEl.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'auto');
                  });
                });
                dropzone.addEventListener('dragover', e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  dropzone.classList.add('dropzone-hover');
                });
                dropzone.addEventListener('dragenter', e => {
                  dropzone.classList.add('dropzone-hover');
                });
                dropzone.addEventListener('dragleave', e => {
                  dropzone.classList.remove('dropzone-hover');
                });
                // El drop se mantiene, ya que estamos dentro de él
              }
            });
            mostrarMensaje('Evento movido correctamente', 'info');
          });
        }
      });
    });
  }, 0);

  // ...declaración única de lunes, diaSemana y dias ya está arriba...


  // Agrupar eventos por día (YYYY-MM-DD)
  let eventosPorDia = {};
  dias.forEach(d => {
    const key = d.toISOString().slice(0,10);
    eventosPorDia[key] = []; 
  });
  eventos.forEach(ev => {
    if (eventosPorDia[ev.fecha]) {
      eventosPorDia[ev.fecha].push(ev);
    }
  });

  // Barra de navegación tipo Google Calendar
  const semanaInicio = dias[0];
  const semanaFin = dias[6];
  const semanaLabel = `${semanaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${semanaFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  
  // Filtro de eventos (todos, futuros, pasados) tomado del select del HTML
  // (declarado arriba)
  agendaBody.innerHTML = `
    <div class="agenda-semana-horizontal d-flex flex-row flex-nowrap gap-1" style="min-height: 260px;">
        ${dias.map(dia => {
          const key = dia.toISOString().slice(0,10);
          const nombreDia = dia.toLocaleDateString('es-ES', { weekday: 'short' });
          const numDia = dia.getDate();
          const isToday = key === hoyKey;
          return `
            <div class="agenda-dia-col bg-light border rounded-3 h-100 d-flex flex-column p-1 flex-grow-1" style="min-width: 140px; max-width: 1fr;">
              <div class="agenda-dia-header text-center small fw-bold mb-1 ${isToday ? 'agenda-dia-hoy' : ''}">
                <div class="agenda-dia-nombre d-flex align-items-center justify-content-center gap-1">
                  ${(() => {
                    // Indicador de evento importante
                    const eventosImportantes = eventosPorDia[key].some(ev => ev.categoria === 'importante');
                    if (eventosImportantes) {
                      return '<span class="badge rounded-pill bg-danger me-1" title="Evento importante" style="width:10px;height:10px;padding:0;"></span>';
                    }
                    return '';
                  })()}
                  ${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}
                </div>
                <div class="d-grid grid-template">
                  <div></div>
                  <div class="agenda-dia-numero">${numDia}</div>
                  <div class="agenda-dia-total-eventos text-secondary small" style="padding-left:15px; min-width:1.5em;">
                    ${(() => {
                      // Contar eventos según el filtro seleccionado
                      let eventosFiltrados = eventosPorDia[key];
                      const ahora = new Date();
                      if (filtroEventos === 'futuros') {
                        eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) >= ahora);
                      } else if (filtroEventos === 'pasados') {
                        eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) < ahora);
                      }
                      return eventosFiltrados.length > 0 ? `<i class='bi bi-calendar-event'></i> ${eventosFiltrados.length}` : '';
                    })()}
                  </div>
                </div>
              </div>
              <div class="flex-grow-1 d-flex flex-column gap-1" data-dia-dropzone="${key}">
                ${(() => {
                  // Filtrar eventos según el filtro seleccionado
                  let eventosFiltrados = eventosPorDia[key];
                  const ahora = new Date();
                  if (filtroEventos === 'futuros') {
                    eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) >= ahora);
                  } else if (filtroEventos === 'pasados') {
                    eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) < ahora);
                  }
                  if (eventosFiltrados.length === 0) {
                    return '<div class="text-muted small text-center">—</div>';
                  }
                  return eventosFiltrados
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map(ev => {
                      let claseNuevo = '';
                      if (window._ultimoEventoCreado && ev.id === window._ultimoEventoCreado) {
                        claseNuevo = 'nuevo-evento';
                        setTimeout(() => { window._ultimoEventoCreado = null; }, 1000);
                      }
                      return `
                        <div class="agenda-evento-calendario bg-white border-end border-3 px-2 py-1 mb-1 position-relative ${claseNuevo} ${(() => {
                        // Determinar si el evento ya ha pasado o es próximo
                        const ahora = new Date();
                        const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                        if (fechaHoraEv < ahora) return 'evento-pasado';
                        // Evento en la próxima hora
                        const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                        if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) return 'evento-proximo';
                        // Color por tipo/categoría (aplica al borde derecho)
                        if (ev.categoria === 'importante') return 'evento-categoria-importante';
                        if (ev.categoria === 'personal') return 'evento-categoria-personal';
                        if (ev.categoria === 'trabajo') return 'evento-categoria-trabajo';
                        return '';
                      })()}"
                      data-id="${ev.id}" data-dia="${ev.fecha}"
                      draggable="true"
                      title="${ev.titulo} - ${ev.descripcion} (${ev.hora})">
                        <div class="fw-bold text-success small">
                          <i class="bi bi-clock me-1"></i> ${ev.hora}
                          <!-- Icono de reloj para eventos pasados -->
                          ${(() => {
                            const ahora = new Date();
                            const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                            if (fechaHoraEv < ahora) {
                              return '';
                            }
                            return '';
                          })()}
                          <!-- Icono de rayo para eventos próximos -->
                          ${(() => {
                            const ahora = new Date();
                            const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                            const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                            if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) {
                              return '<i class=\'bi bi-lightning-charge-fill text-warning ms-2\' title=\'Evento próximo\'></i>';
                            }
                            return '';
                          })()}
                        </div>
                        <div class="fw-semibold small">${ev.titulo}</div>
                        <div class="text-muted small fst-italic">${ev.descripcion ? ev.descripcion : ''}</div>
                        <button class="btn btn-link btn-sm text-primary p-0 position-absolute" style="right: 0.5rem; top: 0;" data-edit="${ev.id}" title="Editar"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-link btn-sm text-success p-0 position-absolute" style="right: 1.8rem; top: 0;" data-completar="${ev.id}" title="Marcar como completado"><i class="bi bi-check-circle${ev.completado ? '-fill' : ''}"></i></button>
                        <button class="btn btn-link btn-sm text-danger p-0 position-absolute" style="right: 0.5rem; bottom: 0;" data-delete="${ev.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
                      </div>
                      `;
                    }).join('');
                })()}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  // Listener para filtro de eventos
  setTimeout(() => {
    const filtro = document.getElementById('agendaFiltroEventos');
    if (filtro) {
      filtro.onchange = (e) => {
        window._agendaFiltroEventos = e.target.value;
        renderAgenda(agendaBody, openModalEditar, eliminarEvento);
      };
    }
  }, 10);

  // Listeners para navegación
  setTimeout(() => {
    const prevBtn = document.getElementById('agendaSemanaPrev');
    const nextBtn = document.getElementById('agendaSemanaNext');
    const hoyBtn = document.getElementById('agendaSemanaHoy');
    const picker = document.getElementById('agendaSemanaPicker');
    if (prevBtn) prevBtn.onclick = () => {
      window._agendaSemanaBase = new Date(lunes.getTime() - 7 * 24 * 60 * 60 * 1000);
      renderAgenda(agendaBody, openModalEditar, eliminarEvento);
    };
    if (nextBtn) nextBtn.onclick = () => {
      window._agendaSemanaBase = new Date(lunes.getTime() + 7 * 24 * 60 * 60 * 1000);
      renderAgenda(agendaBody, openModalEditar, eliminarEvento);
    };
    if (hoyBtn) hoyBtn.onclick = () => {
      window._agendaSemanaBase = new Date();
      renderAgenda(agendaBody, openModalEditar, eliminarEvento);
    };
    if (picker) picker.onchange = (e) => {
      window._agendaSemanaBase = new Date(e.target.value);
      renderAgenda(agendaBody, openModalEditar, eliminarEvento);
    };
  }, 10);
  // Acciones editar/borrar/completar
  agendaBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openModalEditar(btn.getAttribute('data-edit')));
  });
  agendaBody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      eliminarEvento(btn.getAttribute('data-delete'));
    });
  });
  agendaBody.querySelectorAll('[data-completar]').forEach(btn => {
    asignarListenerCompletar(btn, openModalEditar, eliminarEvento);
  });
}

function asignarListenerCompletar(btn, openModalEditar, eliminarEvento) {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-completar');
    let eventos = agenda.getEventos();
    const idx = eventos.findIndex(ev => ev.id === id);
    if (idx >= 0) {
      eventos[idx].completado = !eventos[idx].completado;
  agenda.setEventos(eventos);
  agenda.guardarEventos(() => {
        // Actualizar solo la card del evento
        const card = btn.closest('.agenda-evento-calendario');
        if (window.cargarDatosDashboard) window.cargarDatosDashboard();
        if (card) {
          const ev = eventos[idx];
          let claseNuevo = '';
          if (window._ultimoEventoCreado && ev.id === window._ultimoEventoCreado) {
            claseNuevo = 'nuevo-evento';
            setTimeout(() => { window._ultimoEventoCreado = null; }, 1000);
          }
          const ahora = new Date();
          const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
          let estadoClase = '';
          if (fechaHoraEv < ahora) estadoClase = 'evento-pasado';
          else {
            const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
            if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) estadoClase = 'evento-proximo';
            else if (ev.categoria === 'importante') estadoClase = 'evento-categoria-importante';
            else if (ev.categoria === 'personal') estadoClase = 'evento-categoria-personal';
            else if (ev.categoria === 'trabajo') estadoClase = 'evento-categoria-trabajo';
          }
          card.outerHTML = `
            <div class="agenda-evento-calendario bg-white border-end border-3 px-2 py-1 mb-1 position-relative ${claseNuevo} ${estadoClase}"
              data-id="${ev.id}" data-dia="${ev.fecha}"
              draggable="true"
              title="${ev.titulo} - ${ev.descripcion} (${ev.hora})">
              <div class="fw-bold text-success small">
                <i class="bi bi-clock me-1"></i> ${ev.hora}
                ${(() => {
                  const ahora = new Date();
                  const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                  const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
                  if (fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues) {
                    return '<i class="bi bi-lightning-charge-fill text-warning ms-2" title="Evento próximo"></i>';
                  }
                  return '';
                })()}
              </div>
              <div class="fw-semibold small">${ev.titulo}</div>
              <div class="text-muted small fst-italic">${ev.descripcion ? ev.descripcion : ''}</div>
              <button class="btn btn-link btn-sm text-primary p-0 position-absolute" style="right: 0.5rem; top: 0;" data-edit="${ev.id}" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-link btn-sm text-success p-0 position-absolute" style="right: 1.8rem; top: 0;" data-completar="${ev.id}" title="Marcar como completado"><i class="bi bi-check-circle${ev.completado ? '-fill' : ''}"></i></button>
              <button class="btn btn-link btn-sm text-danger p-0 position-absolute" style="right: 0.5rem; bottom: 0;" data-delete="${ev.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
            </div>
          `;
          // Reasignar listeners SOLO a la nueva card
          const parent = document.querySelector(`[data-dia-dropzone="${ev.fecha}"]`);
          if (parent) {
            const newCard = parent.querySelector(`.agenda-evento-calendario[data-id="${ev.id}"]`);
            if (newCard) {
              // Editar
              const editBtn = newCard.querySelector('[data-edit]');
              if (editBtn) editBtn.addEventListener('click', () => openModalEditar(ev.id));
              // Completar (recursivo)
              const completarBtn2 = newCard.querySelector('[data-completar]');
              if (completarBtn2) asignarListenerCompletar(completarBtn2, openModalEditar, eliminarEvento);
              // Eliminar
              const deleteBtn = newCard.querySelector('[data-delete]');
              if (deleteBtn) deleteBtn.addEventListener('click', () => eliminarEvento(ev.id));
              // Drag & drop
              newCard.addEventListener('dragstart', function(e) {
                e.stopPropagation();
                newCard.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'none');
                e.dataTransfer.setData('text/plain', newCard.getAttribute('data-id'));
              });
              newCard.addEventListener('dragend', function(e) {
                newCard.querySelectorAll('button').forEach(btn => btn.style.pointerEvents = 'auto');
              });
            } 
          }
        }
        mostrarMensaje(
          eventos[idx].completado ? 'Evento marcado como completado' : 'Evento marcado como pendiente',
          eventos[idx].completado ? 'success' : 'info'
        );
      });
    }
  });
}

function cargarEventos(cb) {
  ipcRenderer.invoke('agenda-cargar').then(data => {
    eventos = Array.isArray(data)
      ? data.map(ev => ({ ...ev, completado: !!ev.completado }))
      : [];
    if (typeof cb === 'function') cb(eventos);
  });
}

function guardarEventos(cb) {
  ipcRenderer.invoke('agenda-guardar', eventos).then(() => {
    if (typeof cb === 'function') cb(eventos);
  });
}

function getEventos() {
  return eventos;
}

function setEventos(nuevos) {
  eventos = nuevos;
}

module.exports = {
    setupAgendaSection,
    renderAgenda,
    cargarEventos,
    guardarEventos,
    getEventos,
    setEventos
};
