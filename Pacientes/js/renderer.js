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
		   // Cambiar título con formato especial para Perfil y Agenda
		   if (section === 'perfil') {
			   sectionTitle.innerHTML = `
				   <span style="font-size:1.3em;">👤</span>
				   <span style="color:#1f2937;">Mi Perfil</span>
				   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Datos personales y configuración</span>
			   `;
			   sectionTitle.className = '';
			   sectionTitle.style.fontSize = '1.7rem';
			   sectionTitle.style.fontWeight = '800';
			   sectionTitle.style.color = '#1f2937';
			   sectionTitle.style.marginBottom = '0.5rem';
			   sectionTitle.style.display = 'flex';
			   sectionTitle.style.alignItems = 'center';
		   } else if (section === 'agenda') {
			   sectionTitle.innerHTML = `
				   <span style="font-size:1.3em;">🗓️</span>
				   <span style="color:#1f2937;">Agenda</span>
				   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Turnos, citas y eventos</span>
			   `;
			   sectionTitle.className = '';
			   sectionTitle.style.fontSize = '1.7rem';
			   sectionTitle.style.fontWeight = '800';
			   sectionTitle.style.color = '#1f2937';
			   sectionTitle.style.marginBottom = '0.5rem';
			   sectionTitle.style.display = 'flex';
			   sectionTitle.style.alignItems = 'center';
		   } else {
			   sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
			   sectionTitle.className = '';
			   sectionTitle.removeAttribute('style');
		   }
		// Actualizar nav-link activo
		navLinks.forEach(link => {
			link.classList.toggle('active', link.dataset.section === section);
		});

		   // Refrescar Agenda al mostrar la sección
		   if (section === 'agenda') {
			   // Recargar y renderizar eventos al entrar en la sección
			   agenda.cargarEventos(() => {
				   const agendaBody = document.getElementById('agenda-body');
				   agenda.renderAgenda(
					   agendaBody,
					   // openModalEditar
					   (id) => {
						   // Usar la función openModalEditar de setupAgendaSection si es necesario
						   // Aquí solo refrescamos, la edición sigue funcionando desde el botón
					   },
					   // eliminarEvento
					   (id) => {}
				   );
			   });
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
	agenda.setupAgendaSection();
});
