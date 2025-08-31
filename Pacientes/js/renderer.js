// Importar módulos de secciones
require('../js/sections/dashboard.js');
require('../js/sections/pacientes.js');
require('../js/sections/historial.js');
require('../js/sections/reportes.js');
const { setupProfileSection } = require('../js/sections/profile.js');
const agenda = require('../js/sections/agenda.js');
const etiquetas = require('../js/sections/etiquetas.js');
require('../js/sections/profesionales.js');
require('../js/sections/configuracion.js');


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
		estadisticas: document.getElementById('estadisticas-section'),
		profesionales: document.getElementById('profesionales-section')
	};
	const sectionTitle = document.getElementById('section-title');

    window.showSection = function showSection(section) {
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

    // Refrescar selector y cards al salir de historial, independientemente del método de navegación
    if ((currentSection === 'historial' || window.currentSection === 'historial') && section !== 'historial') {
        (async () => {
            try {
                const selectPaciente = document.getElementById('filtro-paciente-historial');
                if (selectPaciente) {
                    const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
                    selectPaciente.innerHTML = '';
                    pacientes.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.nombre} ${p.apellidos}`;
                        selectPaciente.appendChild(opt);
                    });
                    let pacienteSel = null;
                    if (pacientes.length > 0) {
                        selectPaciente.selectedIndex = 0;
                        pacienteSel = pacientes[0];
                    }
                    if (window.renderPacienteCard) {
                        await window.renderPacienteCard(pacienteSel);
                    }
                    if (window.renderTimelinePacienteDB) {
                        await window.renderTimelinePacienteDB();
                    }
                    if (window.renderHistorial) {
                        await window.renderHistorial(pacienteSel?.id);
                    }
                }
            } catch (err) { console.error('Error al salir de historial:', err); }
        })();
    }
        // Ya no refrescamos manualmente la agenda aquí; setupAgendaSection gestiona los eventos y renderizado.
	}


    let currentSection = 'dashboard';
    window.currentSection = currentSection;
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const nextSection = link.dataset.section;


            showSection(nextSection);

            // Si es la sección etiquetas, recargar lista
            if (nextSection === 'etiquetas') {
                etiquetas.cargarTags();
            }

            currentSection = nextSection;
            window.currentSection = currentSection;
        });
    });

	// Mostrar dashboard por defecto
	showSection('dashboard');

	// Inicializar lógica de perfil
	setupProfileSection();

	// --- Inicialización de Agenda ---
	agenda.setupAgendaSection();
});

// Listener para logs de sincronización desde el backend
if (window.electron && window.electron.ipcRenderer) {
  window.electron.ipcRenderer.on('sync-log', (event, msg) => {
    console.log('[SYNC LOG]', msg);
  });
} else if (typeof require === 'function') {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('sync-log', (event, msg) => {
      console.log('[SYNC LOG]', msg);
    });
  } catch (e) {
    // No disponible en contexto actual
  }
}
