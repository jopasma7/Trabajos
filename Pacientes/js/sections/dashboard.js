
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
	const { ipcRenderer } = require('electron');
	let pacientes = await ipcRenderer.invoke('get-pacientes-completos');

	// Cargar próximas citas para el dashboard
	let citas = [];
	try {
		citas = await ipcRenderer.invoke('agenda-cargar');
		console.log('[Dashboard] Todas las citas cargadas:', citas);
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
	console.log('[Dashboard] Próximas citas filtradas:', proximas);

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

	// Log para depuración


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
}

document.addEventListener('DOMContentLoaded', () => {
	cargarDatosDashboard();

	// Botón Configurar Perfil navega a la sección de perfil
	const btnConfigPerfil = document.querySelector('#dashboard-section .btn-outline-secondary');
	if (btnConfigPerfil) {
		btnConfigPerfil.addEventListener('click', () => {
			const perfilBtn = document.querySelector('[data-section="perfil"]');
			if (perfilBtn) perfilBtn.click();
		});
	}

	// Cargar datos del profesional en el card del dashboard
	const { ipcRenderer } = require('electron');
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

// Al pulsar cualquier card del dashboard, ir a la sección de pacientes
document.addEventListener('DOMContentLoaded', () => {
	// Solo aplicar a los cards dentro de #dashboard-pacientes-cards
	document.querySelectorAll('#dashboard-pacientes-cards .card').forEach(card => {
		card.style.cursor = 'pointer';
		card.addEventListener('click', () => {
			const pacientesBtn = document.querySelector('[data-section="pacientes"]');
			if (pacientesBtn) pacientesBtn.click();
		});
	});
});
