


// Importar módulos de secciones
require('../js/sections/dashboard.js');
require('../js/sections/pacientes.js');
const { setupProfileSection } = require('../js/sections/profile.js');

// Navegación entre secciones con Bootstrap (global)
document.addEventListener('DOMContentLoaded', () => {
	const navLinks = document.querySelectorAll('.nav-link[data-section]');
	const sections = {
		dashboard: document.getElementById('dashboard-section'),
		pacientes: document.getElementById('pacientes-section'),
		reportes: document.getElementById('reportes-section'),
		configuracion: document.getElementById('configuracion-section'),
		perfil: document.getElementById('perfil-section')
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
});
