// js/sections/agenda.js
// Lógica profesional de la sección Agenda
const { ipcRenderer } = require('electron');

let eventos = [];

function renderAgenda(agendaBody, openModalEditar, eliminarEvento) {
  if (!agendaBody) return;
  if (!eventos.length) {
    agendaBody.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-calendar-event display-4 mb-3"></i>
        <h4 class="fw-bold mb-2">Sin eventos programados</h4>
        <p class="mb-0">Aquí aparecerán tus turnos, citas y eventos importantes.</p>
      </div>
    `;
    return;
  }
  agendaBody.innerHTML = eventos
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .map(ev => `
      <div class="agenda-evento d-flex align-items-center justify-content-between py-3 border-bottom">
        <div>
          <div class="fw-bold text-success mb-1"><i class="bi bi-clock me-1"></i> ${ev.fecha} ${ev.hora}</div>
          <div class="fs-5 fw-semibold">${ev.titulo}</div>
          <div class="text-muted small">${ev.descripcion || ''}</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" data-edit="${ev.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" data-delete="${ev.id}"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `).join('');
  // Acciones editar/borrar
  agendaBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openModalEditar(btn.getAttribute('data-edit')));
  });
  agendaBody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => eliminarEvento(btn.getAttribute('data-delete')));
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
  renderAgenda,
  cargarEventos,
  guardarEventos,
  getEventos,
  setEventos
};
