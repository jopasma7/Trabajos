// js/sections/agenda.js
// Lógica de la sección Agenda

document.addEventListener('DOMContentLoaded', () => {
  const agendaSection = document.getElementById('agenda-section');
  if (!agendaSection) return;

  // Inicialización de la sección Agenda
  function renderAgenda() {
    // Aquí se cargarán los eventos de la agenda
    // Por ahora, solo mostramos un mensaje vacío profesional
    const agendaBody = document.getElementById('agenda-body');
    if (agendaBody) {
      agendaBody.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="bi bi-calendar-event display-4 mb-3"></i>
          <h4 class="fw-bold mb-2">Sin eventos programados</h4>
          <p class="mb-0">Aquí aparecerán tus turnos, citas y eventos importantes.</p>
        </div>
      `;
    }
  }

  // Mostrar la agenda al activar la sección
  const agendaNav = document.querySelector('[data-section="agenda"]');
  if (agendaNav) {
    agendaNav.addEventListener('click', renderAgenda);
  }

  // Renderizar agenda si la sección está visible al cargar
  if (!agendaSection.classList.contains('d-none')) {
    renderAgenda();
  }
});
