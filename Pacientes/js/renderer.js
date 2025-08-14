// Importar módulos de secciones
require('../js/sections/dashboard.js');
require('../js/sections/pacientes.js');
require('../js/sections/historial.js');
const { setupProfileSection } = require('../js/sections/profile.js');
const agenda = require('../js/sections/agenda.js');
const etiquetas = require('../js/sections/etiquetas.js');
require('../js/sections/profesionales.js');

// Navegación entre secciones con Bootstrap (global)
document.addEventListener('DOMContentLoaded', () => {
	const navLinks = document.querySelectorAll('.nav-link[data-section]');
	const sections = {
		dashboard: document.getElementById('dashboard-section'),
		pacientes: document.getElementById('pacientes-section'),
		reportes: document.getElementById('reportes-section'),
		configuracion: document.getElementById('configuracion-section'),
		perfil: document.getElementById('perfil-section'),
		agenda: document.getElementById('agenda-section'),
		etiquetas: document.getElementById('etiquetas-section'),
		historial: document.getElementById('historial-section'),
		medicaciones: document.getElementById('medicaciones-section'),
		alertas: document.getElementById('alertas-section'),
		documentos: document.getElementById('documentos-section'),
		estadisticas: document.getElementById('estadisticas-section'),
		profesionales: document.getElementById('profesionales-section')
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
		   } else if (section === 'pacientes') {
			   sectionTitle.innerHTML = `
				   <span style="font-size:1.3em;">👨‍⚕️</span>
				   <span style="color:#1f2937;">Pacientes</span>
				   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Gestión y seguimiento de pacientes</span>
			   `;
			   sectionTitle.className = '';
			   sectionTitle.style.fontSize = '1.7rem';
			   sectionTitle.style.fontWeight = '800';
			   sectionTitle.style.color = '#1f2937';
			   sectionTitle.style.marginBottom = '0.5rem';
			   sectionTitle.style.display = 'flex';
			   sectionTitle.style.alignItems = 'center';
		   } else if (section === 'etiquetas') {
			   sectionTitle.innerHTML = `
				   <span style="font-size:1.3em;">🏷️</span>
				   <span style="color:#1f2937;">Etiquetas</span>
				   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Gestión de etiquetas</span>
			   `;
			   sectionTitle.className = '';
			   sectionTitle.style.fontSize = '1.7rem';
			   sectionTitle.style.fontWeight = '800';
			   sectionTitle.style.color = '#1f2937';
			   sectionTitle.style.marginBottom = '0.5rem';
			   sectionTitle.style.display = 'flex';
			   sectionTitle.style.alignItems = 'center';
		   } else if (section === 'dashboard') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">🏥</span>
                   <span style="color:#1f2937;">Dashboard</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Resumen general y métricas</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'reportes') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">📊</span>
                   <span style="color:#1f2937;">Reportes</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Informes y estadísticas</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'configuracion') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">⚙️</span>
                   <span style="color:#1f2937;">Configuración</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Preferencias del sistema</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'historial') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">📖</span>
                   <span style="color:#1f2937;">Historial Clínico</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Evolución y antecedentes</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'medicaciones') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">💊</span>
                   <span style="color:#1f2937;">Medicaciones</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Tratamientos y prescripciones</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'alertas') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">🔔</span>
                   <span style="color:#1f2937;">Alertas</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Notificaciones y avisos</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'documentos') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">📁</span>
                   <span style="color:#1f2937;">Documentos</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Archivos y gestión documental</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'estadisticas') {
               sectionTitle.innerHTML = `
                   <span style="font-size:1.3em;">📈</span>
                   <span style="color:#1f2937;">Estadísticas</span>
                   <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Datos y análisis</span>
               `;
               sectionTitle.className = '';
               sectionTitle.style.fontSize = '1.7rem';
               sectionTitle.style.fontWeight = '800';
               sectionTitle.style.color = '#1f2937';
               sectionTitle.style.marginBottom = '0.5rem';
               sectionTitle.style.display = 'flex';
               sectionTitle.style.alignItems = 'center';
           } else if (section === 'profesionales') {
            sectionTitle.innerHTML = `
                <span style="font-size:1.3em;">🩺</span>
                <span style="color:#1f2937;">Profesionales</span>
                <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Registro y edición de médicos y especialistas</span>
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

		// Ya no refrescamos manualmente la agenda aquí; setupAgendaSection gestiona los eventos y renderizado.
	}

	navLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
				showSection(link.dataset.section);
				// Si es la sección etiquetas, recargar lista
				if (link.dataset.section === 'etiquetas') {
					etiquetas.cargarTags();
				}
		});
	});

	// Mostrar dashboard por defecto
	showSection('dashboard');

	// Inicializar lógica de perfil
	setupProfileSection();

	// --- Inicialización de Agenda ---
	agenda.setupAgendaSection();
});
