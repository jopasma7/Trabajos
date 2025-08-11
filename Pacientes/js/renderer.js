// Importar módulos de secciones
require('../js/sections/dashboard.js');
require('../js/sections/pacientes.js');
const { setupProfileSection } = require('../js/sections/profile.js');
const agenda = require('../js/sections/agenda.js');

// Navegación entre secciones con Bootstrap (global)
document.addEventListener('DOMContentLoaded', () => {
	const navLinks = document.querySelectorAll('.nav-link[data-section]');
	const sections = {
		dashboard: document.getElementById('dashboard-section'),
		pacientes: document.getElementById('pacientes-section'),
		reportes: document.getElementById('reportes-section'),
		configuracion: document.getElementById('configuracion-section'),
		perfil: document.getElementById('perfil-section'),
		agenda: document.getElementById('agenda-section')
	};
	const sectionTitle = document.getElementById('section-title');

	function showSection(section) {
		Object.keys(sections).forEach(key => {
			if (key === section) {
				sections[key].classList.remove('d-none');
			} else {
				sections[key].classList.add('d-none');
			}
		});
		// Cambiar título
		sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
		// Actualizar nav-link activo
		navLinks.forEach(link => {
			link.classList.toggle('active', link.dataset.section === section);
		});

		// Inicializar Agenda al mostrar la sección
		if (section === 'agenda') {
			inicializarAgenda();
		}
	}

	navLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			showSection(link.dataset.section);
		});
	});

	// Mostrar dashboard por defecto
	showSection('dashboard');

	// Inicializar lógica de perfil
	setupProfileSection();

	// --- Inicialización de Agenda ---
	function inicializarAgenda() {
		const agendaSection = document.getElementById('agenda-section');
		if (!agendaSection) return;
		const agendaBody = document.getElementById('agenda-body');
		const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
		const modalEvento = new bootstrap.Modal(document.getElementById('modal-evento'));
		const formEvento = document.getElementById('form-evento');

		// Render y acciones
		function openModalEditar(id) {
			const ev = agenda.getEventos().find(e => e.id === id);
			if (!ev) return;
			document.getElementById('modalEventoLabel').textContent = 'Editar Evento';
			document.getElementById('evento-fecha').value = ev.fecha;
			document.getElementById('evento-hora').value = ev.hora;
			document.getElementById('evento-titulo').value = ev.titulo;
			document.getElementById('evento-descripcion').value = ev.descripcion || '';
			document.getElementById('evento-id').value = ev.id;
			modalEvento.show();
		}
		function eliminarEvento(id) {
			if (confirm('¿Seguro que deseas eliminar este evento?')) {
				const nuevos = agenda.getEventos().filter(e => e.id !== id);
				agenda.setEventos(nuevos);
				agenda.guardarEventos(() => agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento));
			}
		}

		// Botón nuevo evento
		btnNuevoEvento.onclick = () => {
			formEvento.reset();
			document.getElementById('modalEventoLabel').textContent = 'Nuevo Evento';
			document.getElementById('evento-id').value = '';
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
				descripcion: document.getElementById('evento-descripcion').value
			};
			let eventos = agenda.getEventos();
			const idx = eventos.findIndex(ev => ev.id === id);
			if (idx >= 0) {
				eventos[idx] = nuevoEvento;
			} else {
				eventos.push(nuevoEvento);
			}
			agenda.setEventos(eventos);
			agenda.guardarEventos(() => agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento));
			modalEvento.hide();
		};

		// Cargar y renderizar eventos
		agenda.cargarEventos(() => agenda.renderAgenda(agendaBody, openModalEditar, eliminarEvento));
	}
});
