// (El contador de eventos próximos se actualiza ahora dentro de renderAgenda)

// Función global para mostrar mensajes flotantes (debe estar antes de cualquier uso)
function mostrarMensaje(texto, tipo = 'success') {
  let alerta = document.createElement('div');
  alerta.className = `alert custom-alert alert-${tipo} position-fixed top-0 end-0 m-4 fade show`;
  alerta.style.zIndex = 9999;
    let icon = '';
    if (tipo === 'success') icon = '<span class="alert-icon">✔️</span>';
    else if (tipo === 'danger') icon = '<span class="alert-icon">❌</span>';
    else if (tipo === 'warning') icon = '<span class="alert-icon">⚠️</span>';
    else if (tipo === 'info') icon = '<span class="alert-icon">ℹ️</span>';
    alerta.innerHTML = `${icon}<span class="alert-content">${texto}</span>`;
  document.body.appendChild(alerta);
  // Cerrar al hacer click en la alerta
  alerta.onclick = () => alerta.remove();
  setTimeout(() => {
    if (document.body.contains(alerta)) {
      alerta.classList.remove('show');
      alerta.classList.add('hide');
      setTimeout(() => alerta.remove(), 500);
    }
  }, 3000);
}
// js/sections/agenda.js
// Lógica profesional de la sección Agenda
const { ipcRenderer } = require('electron');
const hoy = new Date();
const hoyKey = hoy.toISOString().slice(0,10);

let eventos = [];

function setupAgendaSection() {
  const agendaSection = document.getElementById('agenda-section');
  if (!agendaSection) return;
  const agendaBody = document.getElementById('agenda-body');
  const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
  const modalEvento = new bootstrap.Modal(document.getElementById('modal-evento'));
  const formEvento = document.getElementById('form-evento');
	// Render y acciones
// Función global para mostrar mensajes flotantes
function mostrarMensaje(texto, tipo = 'success') {
  let alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} position-fixed top-0 end-0 m-4 fade show`;
  alerta.style.zIndex = 9999;
  alerta.innerHTML = texto;
  document.body.appendChild(alerta);
  setTimeout(() => {
    alerta.classList.remove('show');
    alerta.classList.add('hide');
    setTimeout(() => alerta.remove(), 500);
  }, 1800);
}
  function openModalEditar(id) {
    const ev = agenda.getEventos().find(e => e.id === id);
    if (!ev) return;
    document.getElementById('modalEventoLabel').textContent = 'Editar Evento';
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
              const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
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
                  const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                  if (fechaHoraEv < ahora) {
                    return '<i class=\'bi bi-clock-history text-secondary ms-2\' title=\'Evento pasado\'></i>';
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
          });
        }
      });
    }
  }
  // Botón nuevo evento
  btnNuevoEvento.onclick = () => {
    formEvento.reset();
    document.getElementById('modalEventoLabel').textContent = 'Nuevo Evento';
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
    const nuevoEvento = {
      id,
      fecha: document.getElementById('evento-fecha').value,
      hora: document.getElementById('evento-hora').value,
      titulo: document.getElementById('evento-titulo').value,
      descripcion: document.getElementById('evento-descripcion').value,
      categoria: document.getElementById('evento-categoria').value
    };
    let eventos = agenda.getEventos();
    const idx = eventos.findIndex(ev => ev.id === id);
    if (idx >= 0) {
      eventos[idx] = nuevoEvento;
      mostrarMensaje('Evento editado correctamente', 'success');
    } else {
      eventos.push(nuevoEvento);
      mostrarMensaje('Evento creado correctamente', 'success');
    }
    agenda.setEventos(eventos);
    agenda.guardarEventos(() => agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento));
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
  // Filtro de eventos (todos, futuros, pasados) tomado del select del HTML
  let filtroEventos = window._agendaFiltroEventos || 'todos';

  // Calcular días de la semana antes de cualquier uso
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

  // Calcular el día de hoy y su key antes de usarlo en el template
  const hoy = new Date();
  const hoyKey = hoy.toISOString().slice(0,10);

  // Agrupar eventos por día (YYYY-MM-DD) antes de usar en el template
  const eventosPorDia = {};
  dias.forEach(d => {
    const key = d.toISOString().slice(0,10);
    eventosPorDia[key] = [];
  });
  eventos.forEach(ev => {
    if (eventosPorDia[ev.fecha]) {
      eventosPorDia[ev.fecha].push(ev);
    }
  });

  agendaBody.innerHTML = `
    <div class="agenda-semana-horizontal d-flex flex-row flex-nowrap gap-1" style="min-height: 260px;">
        ${dias.map(dia => {
          const key = dia.toISOString().slice(0,10);
          const nombreDia = dia.toLocaleDateString('es-ES', { weekday: 'short' });
          const numDia = dia.getDate();
          const isToday = key === hoyKey;
          // Filtrar eventos según el filtro seleccionado
          let eventosFiltrados = eventosPorDia[key];
          const ahora = new Date();
          if (filtroEventos === 'futuros') {
            eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) >= ahora);
          } else if (filtroEventos === 'pasados') {
            eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) < ahora);
          }
          return `
            <div class="agenda-dia-col bg-light border rounded-3 h-100 d-flex flex-column p-1 flex-grow-1" style="min-width: 140px; max-width: 1fr;" data-dia-drop="${key}">
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
    let eventosFiltrados = eventosPorDia[key];
    const ahora = new Date();
    if (filtroEventos === 'futuros') {
      eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) >= ahora);
    } else if (filtroEventos === 'pasados') {
      eventosFiltrados = eventosFiltrados.filter(ev => new Date(ev.fecha + 'T' + ev.hora) < ahora);
    }
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
                <!-- Icono de reloj para eventos pasados -->
                ${(() => {
                  const ahora = new Date();
                  const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
                  if (fechaHoraEv < ahora) {
                    return '<i class=\'bi bi-clock-history text-secondary ms-2\' title=\'Evento pasado\'></i>';
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
          const diaOrigen = eventos[idx].fecha;
          eventos[idx].fecha = diaNuevo;
          agenda.setEventos(eventos);
          agenda.guardarEventos(() => {
            // Solo recargar las columnas de origen y destino
            const renderColumna = (diaKey) => {
              const dropzone = agendaBody.querySelector(`[data-dia-dropzone="${diaKey}"]`);
              let eventosPorDia = {};
              eventos.forEach(ev => {
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
                                return '<i class=\'bi bi-clock-history text-secondary ms-2\' title=\'Evento pasado\'></i>';
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
              }
            };
            renderColumna(diaOrigen);
            renderColumna(diaNuevo);
            mostrarMensaje('Evento movido correctamente', 'success');
            // Reasignar listeners drag & drop solo en las dos columnas actualizadas
            setTimeout(() => {
              [diaOrigen, diaNuevo].forEach(diaKey => {
                const dropzone = agendaBody.querySelector(`[data-dia-dropzone="${diaKey}"]`);
                if (!dropzone) return;
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
              });
            }, 0);
          });
        }
      });
    });
  }, 0);

  // ...declaración única de lunes, diaSemana y dias ya está arriba...

  // --- EJEMPLOS DE EVENTOS PARA ESTA SEMANA ---
  // Solo añade eventos de ejemplo si la base está vacía
  if (!window._ejemploEventosAgregados && eventos.length === 0) {
    const ejemploEventos = [
      {
        titulo: "Consulta médica",
        descripcion: "Chequeo general con el Dr. Pérez.",
        fecha: dias[1].toISOString().slice(0,10),
        hora: "09:00"
      },
      {
        titulo: "Reunión de equipo",
        descripcion: "Planificación semanal de tareas.",
        fecha: dias[2].toISOString().slice(0,10),
        hora: "11:30"
      },
      {
        titulo: "Llamada paciente",
        descripcion: "Seguimiento telefónico a paciente Juan.",
        fecha: dias[4].toISOString().slice(0,10),
        hora: "16:00"
      },
      {
        titulo: "Vacunación",
        descripcion: "Aplicación de vacuna antigripal.",
        fecha: dias[0].toISOString().slice(0,10),
        hora: "13:00"
      },
      {
        titulo: "Entrega de informes",
        descripcion: "Enviar resultados de laboratorio.",
        fecha: dias[6].toISOString().slice(0,10),
        hora: "10:00"
      }
    ];
    ejemploEventos.forEach(ev => {
      eventos.push({
        id: 'ejemplo-' + Math.random().toString(36).slice(2),
        ...ev
      });
    });
    window._ejemploEventosAgregados = true;
  }

  // Agrupar eventos por día (YYYY-MM-DD)
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
                              return '<i class=\'bi bi-clock-history text-secondary ms-2\' title=\'Evento pasado\'></i>';
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
  // Acciones editar/borrar
  agendaBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openModalEditar(btn.getAttribute('data-edit')));
  });
  agendaBody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      eliminarEvento(btn.getAttribute('data-delete'));
    });
  });
}

function cargarEventos(cb) {
  ipcRenderer.invoke('agenda-cargar').then(data => {
    eventos = Array.isArray(data) ? data : [];
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
