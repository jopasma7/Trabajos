const { ipcRenderer } = require('electron');
// Función para actualizar las cards del dashboard con datos reales
window.actualizarDashboardCards = function(data) {
	const cards = document.querySelectorAll('#dashboard-section .card-text.fs-3');
	if (cards.length >= 4) {
		cards[0].textContent = data.pacientes;
		cards[1].textContent = data.fistula;
		cards[2].textContent = data.cateter;
		cards[3].textContent = data.protesis;
	}
}

// Obtener datos reales desde el backend (usando IPC)
window.cargarDatosDashboard = async function() {
	// window.electronAPI o window.api depende de tu preload.js
	let pacientes = await ipcRenderer.invoke('get-pacientes-completos');

	// Cargar próximas citas para el dashboard
	let citas = [];
	try {
		citas = await ipcRenderer.invoke('agenda-cargar');
	// ...
	} catch (e) {
		citas = [];
	}
	// Filtrar próximas citas (hoy o futuras)
	const hoy = new Date();
	const proximas = (Array.isArray(citas) ? citas : []).filter(cita => {
		if (!cita.fecha || !cita.hora) return false;
		const fechaHora = new Date(cita.fecha + 'T' + cita.hora);
		return fechaHora >= hoy;
	}).sort((a, b) => {
		// Ordenar por fecha y hora ascendente
		const fa = new Date(a.fecha + 'T' + a.hora);
		const fb = new Date(b.fecha + 'T' + b.hora);
		return fa - fb;
	}).slice(0, 5); // Solo mostrar las 5 próximas
	// ...

	const citasTbody = document.getElementById('dashboard-citas');
	if (citasTbody) {
		if (proximas.length === 0) {
			citasTbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center">No hay próximas citas</td></tr>';
		} else {
			citasTbody.innerHTML = proximas.map(cita => {
				const fecha = cita.fecha ? cita.fecha.split('-').reverse().join('/') : '';
				const hora = cita.hora || '';
				const paciente = cita.paciente || cita.titulo || '';
				const estado = cita.completado ? '<span class="badge bg-success">Completada</span>' : '<span class="badge bg-warning text-dark">Pendiente</span>';
				return `<tr>
					<td>${fecha} ${hora}</td>
					<td>${paciente}</td>
					<td>${estado}</td>
				</tr>`;
			}).join('');
		}
	}

	// ...


		// Contadores robustos
		let totalPacientes = pacientes.length;
		let totalFistula = 0;
		let totalCateter = 0;
		let totalProtesis = 0;

		pacientes.forEach(p => {
			// Buscar tipo de acceso en p.tipo_acceso.nombre, si no existe, buscar en p.acceso.tipo_acceso_id y p.acceso
			let tipo = '';
			if (p.tipo_acceso && p.tipo_acceso.nombre) {
				tipo = p.tipo_acceso.nombre.toLowerCase();
			} else if (p.acceso && p.acceso.tipo_acceso_id && p.acceso.tipo_acceso) {
				tipo = p.acceso.tipo_acceso.nombre ? p.acceso.tipo_acceso.nombre.toLowerCase() : '';
			}
			// Fallback: buscar en p.acceso.tipo_acceso_id y comparar con IDs conocidos
			if (!tipo && p.acceso && p.acceso.tipo_acceso_id) {
				const id = Number(p.acceso.tipo_acceso_id);
				// Si tienes los IDs fijos, puedes mapearlos aquí
				// Ejemplo: 1=fístula, 2=prótesis, 3=catéter
				if (id === 1) tipo = 'fístula';
				else if (id === 2) tipo = 'prótesis';
				else if (id === 3) tipo = 'catéter';
			}
			if (tipo.includes('fístula')) totalFistula++;
			else if (tipo.includes('catéter')) totalCateter++;
			else if (tipo.includes('prótesis')) totalProtesis++;
	});


		window.actualizarDashboardCards({
			pacientes: totalPacientes,
			fistula: totalFistula,
			cateter: totalCateter,
			protesis: totalProtesis
		});
		window.renderGraficaPacientesPorMes(pacientes);
}

document.addEventListener('DOMContentLoaded', () => {
	cargarDatosDashboard();

	// --- Mostrar notificaciones recientes en el dashboard ---
	ipcRenderer.invoke('notificaciones-get-recientes', 10).then(notificaciones => {
		const ul = document.getElementById('dashboard-notificaciones');
		if (!ul) return;
		if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
			ul.innerHTML = '<li class="text-muted text-center">No hay notificaciones recientes</li>';
			return;
		}
		ul.innerHTML = notificaciones.map(n => {
			const fecha = n.fecha ? n.fecha.replace('T', ' ').slice(0, 16) : '';
			return `<li class="list-group-item d-flex justify-content-between align-items-center">
				<span><strong>${n.tipo}</strong>: ${n.mensaje}</span>
				<small class="text-muted">${fecha}</small>
			</li>`;
		}).join('');
	});

	// Botón Configurar Perfil navega a la sección de perfil
	const btnConfigPerfil = document.querySelector('#dashboard-section .btn-outline-secondary');
	if (btnConfigPerfil) {
		btnConfigPerfil.addEventListener('click', () => {
			const perfilBtn = document.querySelector('[data-section="perfil"]');
			if (perfilBtn) perfilBtn.click();
		});
	}

	// Cargar datos del profesional en el card del dashboard
	ipcRenderer.invoke('perfil-cargar').then(data => {
		const nombreEl = document.getElementById('dashboard-nombre-profesional');
		const cargoEl = document.getElementById('dashboard-cargo-profesional');
			const avatarEl = document.querySelector('#dashboard-section img.rounded-circle');
		if (nombreEl) {
			let nombreCompleto = '';
			if (data && data.nombre) nombreCompleto += data.nombre.trim();
			if (data && data.apellido) nombreCompleto += (nombreCompleto ? ' ' : '') + data.apellido.trim();
			nombreEl.textContent = nombreCompleto || 'Nombre Profesional';
		}
		if (cargoEl) {
			cargoEl.textContent = (data && data.cargo) ? data.cargo.trim() : 'Especialidad';
		}
			if (avatarEl) {
				if (data && data.avatar) {
					avatarEl.src = data.avatar;
				} else {
					const sexo = (data && data.sexo) ? data.sexo : 'hombre';
					avatarEl.src = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
				}
			}
	});
});

async function actualizarNotificacionesDashboard() {
	const notificaciones = await ipcRenderer.invoke('notificaciones-get-recientes', 5);
    const ul = document.getElementById('dashboard-notificaciones');
    if (!ul) return;
    if (!Array.isArray(notificaciones) || notificaciones.length === 0) {
        ul.innerHTML = '<li class="text-muted text-center">No hay notificaciones recientes</li>';
        return;
    }
	ul.innerHTML = notificaciones.map(n => {
		let fecha = '';
		if (n.fecha) {
			const d = new Date(n.fecha);
			const dia = String(d.getDate()).padStart(2, '0');
			const mes = String(d.getMonth() + 1).padStart(2, '0');
			const anio = d.getFullYear();
			const hora = String(d.getHours()).padStart(2, '0');
			const min = String(d.getMinutes()).padStart(2, '0');
			fecha = `${dia}-${mes}-${anio} ${hora}:${min}`;
		}
	// Buscar nombre de paciente y ponerlo en negrita (nombre completo)
	let mensaje = n.mensaje.replace(/(al paciente |del paciente |a la paciente |de la paciente )(.*?)([.,;]|$)/i, (match, pre, nombre, fin) => `${pre}<strong>${nombre.trim()}</strong>${fin}`);
		return `<li class="list-group-item d-flex justify-content-between align-items-center">
			<span><strong>${n.tipo}</strong>: ${mensaje}</span>
			<small class="text-muted">${fecha}</small>
		</li>`;
	}).join('');
}

// Permite disparar el evento desde cualquier sección tras una acción relevante
window.refrescarNotificacionesDashboard = function() {
    window.dispatchEvent(new Event('notificacion-nueva'));
}

// Al pulsar cualquier card del dashboard, ir a la sección de pacientes
document.addEventListener('DOMContentLoaded', () => {
	actualizarNotificacionesDashboard();
    window.addEventListener('notificacion-nueva', actualizarNotificacionesDashboard);
	// Solo aplicar a los cards dentro de #dashboard-pacientes-cards
	document.querySelectorAll('#dashboard-pacientes-cards .card').forEach(card => {
		card.style.cursor = 'pointer';
		card.addEventListener('click', () => {
			const pacientesBtn = document.querySelector('[data-section="pacientes"]');
			if (pacientesBtn) pacientesBtn.click();
		});
	});
});

// --- Gráfica de pacientes por mes ---
window.renderGraficaPacientesPorMes = function(pacientes) {
  // Agrupar pacientes por mes de alta
  const meses = {};
  pacientes.forEach(p => {
    const fechaAlta = p.fecha_alta || p.fecha_creacion || '';
    if (!fechaAlta) return;
    const [y, m] = fechaAlta.split('-');
    if (!y || !m) return;
    const key = `${y}-${m}`;
    meses[key] = (meses[key] || 0) + 1;
  });
  // Ordenar meses
  const labels = Object.keys(meses).sort();
  const data = labels.map(m => meses[m]);
  // Crear o actualizar la gráfica
  const ctx = document.getElementById('dashboard-chart-pacientes').getContext('2d');
  if (window._graficaPacientesPorMes) window._graficaPacientesPorMes.destroy();
  window._graficaPacientesPorMes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(l => {
        const [y, m] = l.split('-');
        return `${m}/${y}`;
      }),
      datasets: [{
        label: 'Pacientes por mes',
        data,
        backgroundColor: '#34c759',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#eee' } }
      }
    }
  });
};

// Comportamiento de click en los cards de pacientes del dashboard
document.addEventListener('DOMContentLoaded', function() {
	const cards = document.querySelectorAll('#dashboard-pacientes-cards .card');
	// Card 0: Total pacientes (no hace nada)
	// Card 1: Fístula
	// Card 2: Catéter
	// Card 3: Prótesis
		// Mapea el nombre al id real del tipo de acceso (ajusta según tu base de datos)
		const tipoAccesoIds = {
			'Fístula': 1,
			'Catéter': 2,
			'Prótesis': 3
		};
		const tipoAccesoNombres = ['Fístula', 'Catéter', 'Prótesis'];
			cards.forEach((card, idx) => {
				card.style.cursor = 'pointer';
				card.addEventListener('click', function() {
					// Mostrar sección pacientes
					document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
					document.getElementById('pacientes-section').classList.remove('d-none');
					// Poner filtro de tipo de acceso
					const filtro = document.getElementById('filtro-tipoacceso');
					if (filtro) {
						if (idx === 0) {
							filtro.value = '';
							console.debug('[Dashboard Card Click] idx:', idx, 'Todos');
						} else {
							const nombre = tipoAccesoNombres[idx-1];
							const id = tipoAccesoIds[nombre];
							filtro.value = id;
							console.debug('[Dashboard Card Click] idx:', idx, 'nombre:', nombre, 'id:', id);
						}
						filtro.dispatchEvent(new Event('change'));
					}
				});
			});
				// Al acceder a la sección de pacientes desde el menú lateral, poner filtro en Todos solo si no venimos de un card
				let accesoDesdeCard = false;
				cards.forEach((card, idx) => {
					card.addEventListener('click', function() {
						accesoDesdeCard = true;
						// ...resto del código...
					});
				});
				const pacientesNav = document.querySelector('[data-section="pacientes"]');
				if (pacientesNav) {
					pacientesNav.addEventListener('click', function() {
						setTimeout(() => {
							if (!accesoDesdeCard) {
								const filtro = document.getElementById('filtro-tipoacceso');
								if (filtro) {
									filtro.value = '';
									filtro.dispatchEvent(new Event('change'));
									console.debug('[Pacientes Nav Click] Todos');
								}
							}
							accesoDesdeCard = false;
						}, 100);
					});
				}
});
