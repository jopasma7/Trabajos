// (El contador de eventos próximos se actualiza ahora dentro de renderAgenda)
// js/sections/agenda.js
// Lógica profesional de la sección Agenda
const { ipcRenderer } = require('electron');

let eventos = [];

function setupAgendaSection() {
  const agendaSection = document.getElementById('agenda-section');
  if (!agendaSection) return;
  const agendaBody = document.getElementById('agenda-body');
  const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
  const modalEvento = new bootstrap.Modal(document.getElementById('modal-evento'));
  const formEvento = document.getElementById('form-evento');
	// Render y acciones
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
              // Re-renderizar solo la columna del día usando la misma lógica/HTML que en renderAgenda
              const eventosPorDia = {};
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
  // Contador de eventos próximos (próxima hora)
  setTimeout(() => {
    const badge = document.getElementById('contador-proximos');
    if (badge && typeof eventosPorDia === 'object') {
      const ahora = new Date();
      const unaHoraDespues = new Date(ahora.getTime() + 60*60*1000);
      let totalProximos = 0;
      Object.values(eventosPorDia).forEach(evList => {
        totalProximos += evList.filter(ev => {
          const fechaHoraEv = new Date(ev.fecha + 'T' + ev.hora);
          return fechaHoraEv >= ahora && fechaHoraEv <= unaHoraDespues;
        }).length;
      });
      if (totalProximos > 0) {
        badge.style.display = '';
        badge.textContent = `Próximos: ${totalProximos}`;
      } else {
        badge.style.display = 'none';
      }
    }
  }, 10);
  // Listener para marcar como completado (fuera del template)
  setTimeout(() => {
    agendaBody.querySelectorAll('[data-completar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-completar');
        const evento = eventos.find(ev => ev.id == id);
        if (evento) {
          evento.completado = !evento.completado;
          agenda.setEventos(eventos);
          renderAgenda(agendaBody, openModalEditar, eliminarEvento);
        }
      });
    });
  }, 10);
  // --- AGREGAR 5 EVENTOS EXTRA DE EJEMPLO EL LUNES DE LA SEMANA ACTUAL ---
  if (!window._ejemploLunesExtraAgregado) {
    const lunesKey = (() => {
      let semanaBase = window._agendaSemanaBase;
      if (!semanaBase) semanaBase = new Date();
      if (!(semanaBase instanceof Date)) semanaBase = new Date(semanaBase);
      const diaSemana = semanaBase.getDay() === 0 ? 7 : semanaBase.getDay();
      const lunes = new Date(semanaBase);
      lunes.setDate(semanaBase.getDate() - diaSemana + 1);
      return lunes.toISOString().slice(0,10);
    })();
    const eventosLunesExtra = [
      { titulo: "Cita 6", descripcion: "Sexta cita del día.", fecha: lunesKey, hora: "16:00" },
      { titulo: "Cita 7", descripcion: "Séptima cita del día.", fecha: lunesKey, hora: "17:00" },
      { titulo: "Cita 8", descripcion: "Octava cita del día.", fecha: lunesKey, hora: "18:00" },
      { titulo: "Cita 9", descripcion: "Novena cita del día.", fecha: lunesKey, hora: "19:00" },
      { titulo: "Cita 10", descripcion: "Décima cita del día.", fecha: lunesKey, hora: "20:00" }
    ];
    let eventosReal = agenda.getEventos();
    let agregado = false;
    eventosLunesExtra.forEach(ev => {
      if (!eventosReal.some(e => e.titulo === ev.titulo && e.fecha === ev.fecha && e.hora === ev.hora)) {
        eventosReal.push({
          id: 'ejemplo-lunes-extra-' + Math.random().toString(36).slice(2),
          ...ev
        });
        agregado = true;
      }
    });
    if (agregado) {
      agenda.setEventos(eventosReal);
      agenda.guardarEventos();
    }
    window._ejemploLunesExtraAgregado = true;
  }
  // --- AGREGAR 5 EVENTOS DE EJEMPLO EL LUNES DE LA SEMANA ACTUAL ---
  if (!window._ejemploLunesAgregado) {
    const lunesKey = (() => {
      // Calcular lunes de la semana base
      let semanaBase = window._agendaSemanaBase;
      if (!semanaBase) semanaBase = new Date();
      if (!(semanaBase instanceof Date)) semanaBase = new Date(semanaBase);
      const diaSemana = semanaBase.getDay() === 0 ? 7 : semanaBase.getDay();
      const lunes = new Date(semanaBase);
      lunes.setDate(semanaBase.getDate() - diaSemana + 1);
      return lunes.toISOString().slice(0,10);
    })();
    const eventosLunes = [
      { titulo: "Cita 1", descripcion: "Primera cita del día.", fecha: lunesKey, hora: "08:00" },
      { titulo: "Cita 2", descripcion: "Segunda cita del día.", fecha: lunesKey, hora: "09:30" },
      { titulo: "Cita 3", descripcion: "Tercera cita del día.", fecha: lunesKey, hora: "11:00" },
      { titulo: "Cita 4", descripcion: "Cuarta cita del día.", fecha: lunesKey, hora: "13:00" },
      { titulo: "Cita 5", descripcion: "Quinta cita del día.", fecha: lunesKey, hora: "15:00" }
    ];
    let eventosReal = agenda.getEventos();
    let agregado = false;
    eventosLunes.forEach(ev => {
      if (!eventosReal.some(e => e.titulo === ev.titulo && e.fecha === ev.fecha && e.hora === ev.hora)) {
        eventosReal.push({
          id: 'ejemplo-lunes-' + Math.random().toString(36).slice(2),
          ...ev
        });
        agregado = true;
      }
    });
    if (agregado) {
      agenda.setEventos(eventosReal);
      agenda.guardarEventos();
    }
    window._ejemploLunesAgregado = true;
  }
  if (!agendaBody) return;

  // Estado de la semana mostrada
  if (!window._agendaSemanaBase) {
    window._agendaSemanaBase = new Date();
  }
  let semanaBase = window._agendaSemanaBase;
  if (!(semanaBase instanceof Date)) semanaBase = new Date(semanaBase);

  // Calcular lunes de la semana base
  const diaSemana = semanaBase.getDay() === 0 ? 7 : semanaBase.getDay(); // Lunes=1, Domingo=7
  const lunes = new Date(semanaBase);
  lunes.setDate(semanaBase.getDate() - diaSemana + 1);
  const dias = Array.from({length: 7}, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  // --- EJEMPLOS DE EVENTOS PARA ESTA SEMANA ---
  if (!window._ejemploEventosAgregados) {
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
      if (!eventos.some(e => e.titulo === ev.titulo && e.fecha === ev.fecha && e.hora === ev.hora)) {
        eventos.push({
          id: 'ejemplo-' + Math.random().toString(36).slice(2),
          ...ev
        });
      }
    });
    window._ejemploEventosAgregados = true;
  }

  // Agrupar eventos por día (YYYY-MM-DD)
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

  // Barra de navegación tipo Google Calendar
  const semanaInicio = dias[0];
  const semanaFin = dias[6];
  const semanaLabel = `${semanaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${semanaFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const hoy = new Date();
  const hoyKey = hoy.toISOString().slice(0,10);

  // Filtro de eventos (todos, futuros, pasados) tomado del select del HTML
  let filtroEventos = window._agendaFiltroEventos || 'todos';
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
              <div class="flex-grow-1 d-flex flex-column gap-1">
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
