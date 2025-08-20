

// dashboard.js
// Lógica específica para la sección Dashboard


// Función para actualizar las cards del dashboard con datos reales
function actualizarDashboardCards(data) {
	const cards = document.querySelectorAll('#dashboard-section .card-text.fs-3');
	if (cards.length >= 4) {
		cards[0].textContent = data.pacientes;
		cards[1].textContent = data.fistula;
		cards[2].textContent = data.cateter;
		cards[3].textContent = data.protesis;
	}
}

// Obtener datos reales desde el backend (usando IPC)
async function cargarDatosDashboard() {
	// window.electronAPI o window.api depende de tu preload.js
	const { ipcRenderer } = require('electron');
	let pacientes = await ipcRenderer.invoke('get-pacientes-completos');

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


		actualizarDashboardCards({
			pacientes: totalPacientes,
			fistula: totalFistula,
			cateter: totalCateter,
			protesis: totalProtesis
		});
}

document.addEventListener('DOMContentLoaded', () => {
	cargarDatosDashboard();
});
