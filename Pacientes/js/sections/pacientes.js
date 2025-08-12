// Opciones de ubicación anatómica según tipo de acceso
const ubicacionesAnatomicasPorAcceso = {
	fistula: [
		'Radio Cefálica',
		'Braquio Cefálica'
	],
	protesis: [
		'Radio Cefálica',
		'Braquio Cefálica'
	],
	cateter: [
		'Yugular',
		'Femoral'
	]
};

const selectTipoAccesoForm = document.getElementById('paciente-tipoacceso');
const selectUbicacionAnatomica = document.getElementById('paciente-ubicacion-anatomica');
const selectUbicacionLado = document.getElementById('paciente-ubicacion-lado');

if (selectTipoAccesoForm && selectUbicacionAnatomica && selectUbicacionLado) {
	selectTipoAccesoForm.addEventListener('change', function() {
		const tipo = this.value;
		selectUbicacionAnatomica.innerHTML = '';
		selectUbicacionLado.value = '';
		selectUbicacionLado.disabled = true;
		if (!tipo || !ubicacionesAnatomicasPorAcceso[tipo]) {
			selectUbicacionAnatomica.innerHTML = '<option value="">Selecciona tipo de acceso primero</option>';
			selectUbicacionAnatomica.disabled = true;
			return;
		}
		selectUbicacionAnatomica.disabled = false;
		selectUbicacionAnatomica.innerHTML = '<option value="">Selecciona ubicación...</option>' +
			ubicacionesAnatomicasPorAcceso[tipo].map(u => `<option value="${u}">${u}</option>`).join('');
	});
	selectUbicacionAnatomica.addEventListener('change', function() {
		if (this.value) {
			selectUbicacionLado.disabled = false;
		} else {
			selectUbicacionLado.value = '';
			selectUbicacionLado.disabled = true;
		}
	});
	// Inicialmente deshabilitados
	selectUbicacionAnatomica.disabled = true;
	selectUbicacionLado.disabled = true;
}
// pacientes.js
// Lógica específica para la sección Pacientes

console.log('Pacientes module loaded');


const { ipcRenderer } = require('electron');

// Elementos del DOM

const tablaPacientesBody = document.querySelector('#pacientes-section tbody');
const formPaciente = document.getElementById('form-paciente');
const btnNuevoPaciente = document.getElementById('btn-nuevo-paciente');
const modalPaciente = document.getElementById('modal-paciente');
let pacienteEditando = null;
let pacienteAEliminar = null;
const modalConfirmarEliminar = document.getElementById('modal-confirmar-eliminar-paciente');
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar-paciente');
const textoConfirmarEliminar = document.getElementById('texto-confirmar-eliminar-paciente');

// Filtros y paginación
const inputBusqueda = document.getElementById('busqueda-pacientes');
const selectTipoAcceso = document.getElementById('filtro-tipoacceso');
const inputFecha = document.getElementById('filtro-fecha');
const paginacionPacientes = document.getElementById('paginacion-pacientes');
let pacientesGlobal = [];

let paginaActual = 1;
const pacientesPorPagina = 10;


function filtrarPacientes() {
	let filtrados = [...pacientesGlobal];
	const texto = (inputBusqueda?.value || '').toLowerCase();
	const tipo = selectTipoAcceso?.value || '';
	const fecha = inputFecha?.value || '';
       if (texto) {
	       filtrados = filtrados.filter(p =>
		       p.nombre.toLowerCase().includes(texto) ||
		       (p.apellidos && p.apellidos.toLowerCase().includes(texto))
	       );
       }
	if (tipo) {
		filtrados = filtrados.filter(p => (p.tipo_acceso || '') === tipo);
	}
	if (fecha) {
		filtrados = filtrados.filter(p => (p.fecha_instalacion || '') === fecha);
	}
	return filtrados;
}

function renderizarPacientes(pacientes) {
	tablaPacientesBody.innerHTML = '';
	pacientes.forEach(paciente => {
		const tr = document.createElement('tr');
			// Formatear fecha a DD/MM/YYYY si es YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
			let fechaFormateada = '';
			if (paciente.fecha_instalacion) {
				const match = paciente.fecha_instalacion.match(/^(\d{4})-(\d{2})-(\d{2})/);
				if (match) {
					fechaFormateada = `${match[3]}/${match[2]}/${match[1]}`;
				} else {
					fechaFormateada = paciente.fecha_instalacion;
				}
			}
			const ubicacionCompleta = (paciente.ubicacion_anatomica && paciente.ubicacion_lado)
				? `${paciente.ubicacion_anatomica} ${paciente.ubicacion_lado}`
				: (paciente.ubicacion_anatomica || paciente.ubicacion_lado || '');
			tr.innerHTML = `
				<td>${paciente.nombre} ${paciente.apellidos}</td>
				<td>${renderTipoAccesoBadge(paciente.tipo_acceso)}</td>
				<td>${ubicacionCompleta}</td>
				<td>${fechaFormateada}</td>
				<td>
					<button class="btn btn-outline-success btn-sm btn-editar" data-id="${paciente.id}"><i class="bi bi-pencil"></i></button>
					<button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${paciente.id}"><i class="bi bi-trash"></i></button>
				</td>
			`;
// Devuelve badge con emoji y color según tipo de acceso
function renderTipoAccesoBadge(tipo) {
	switch ((tipo||'').toLowerCase()) {
		case 'fistula':
			return '<span class="badge badge-fistula" style="font-size:1em;">🩸 Fístula</span>';
		case 'cateter':
			return '<span class="badge badge-cateter" style="font-size:1em;">➰ Catéter</span>';
		case 'protesis':
			return '<span class="badge badge-protesis" style="font-size:1em;">🦾 Prótesis</span>';
		default:
			return '<span class="badge bg-secondary" style="font-size:1em;">Sin tipo</span>';
	}
}
		tablaPacientesBody.appendChild(tr);
	});
}

function renderizarPaginacion(totalPacientes) {
	if (!paginacionPacientes) return;
	paginacionPacientes.innerHTML = '';
	const totalPaginas = Math.ceil(totalPacientes / pacientesPorPagina) || 1;
	const maxVisible = 5;
	const paginas = [];

	if (totalPaginas <= maxVisible) {
		for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
	} else {
		let start = Math.max(1, paginaActual - 2);
		let end = Math.min(totalPaginas, paginaActual + 2);
		if (paginaActual <= 3) {
			end = 5;
			start = 1;
		} else if (paginaActual >= totalPaginas - 2) {
			start = totalPaginas - 4;
			end = totalPaginas;
		}
		for (let i = start; i <= end; i++) paginas.push(i);
	}

	// Botón primero
	if (paginas[0] > 1) {
		paginarBtn(1, '«');
		if (paginas[0] > 2) addEllipsis();
	}
	// Botones centrales
	for (const i of paginas) paginarBtn(i);
	// Mostrar siempre el botón de la última página (número), con puntos suspensivos si no está en el rango visible
	if (paginas[paginas.length - 1] < totalPaginas) {
		if (paginas[paginas.length - 1] < totalPaginas - 1) addEllipsis();
		paginarBtn(totalPaginas);
	}

	function paginarBtn(i, label) {
		const li = document.createElement('li');
		li.className = 'page-item' + (i === paginaActual ? ' active' : '');
		li.innerHTML = `<a class="page-link" href="#">${label || i}</a>`;
		li.addEventListener('click', (e) => {
			e.preventDefault();
			if (paginaActual !== i) {
				paginaActual = i;
				actualizarTablaPacientes();
			}
		});
		paginacionPacientes.appendChild(li);
	}
	function addEllipsis() {
		const li = document.createElement('li');
		li.className = 'page-item disabled';
		li.innerHTML = '<span class="page-link">…</span>';
		paginacionPacientes.appendChild(li);
	}

	// Botón moderno de salto de página (abre popover/input al hacer click)
	if (totalPaginas > maxVisible) {
		const li = document.createElement('li');
		li.className = 'page-item';
		li.style.position = 'relative';
		li.innerHTML = `<button class="page-link" title="Ir a página..." style="display:flex;align-items:center;gap:4px;"><i class="bi bi-search"></i><span style="font-size:0.95em;">Ir</span></button>`;
		const btn = li.querySelector('button');
		let popover = null;
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			if (popover) {
				popover.remove();
				popover = null;
				return;
			}
			popover = document.createElement('div');
			popover.style.position = 'absolute';
			popover.style.top = '110%';
			popover.style.left = '50%';
			popover.style.transform = 'translateX(-50%)';
			popover.style.background = '#fff';
			popover.style.border = '1px solid #ccc';
			popover.style.borderRadius = '6px';
			popover.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
			popover.style.padding = '8px 12px';
			popover.style.zIndex = '1000';
			popover.innerHTML = `<div style="display:flex;align-items:center;gap:6px;"><input type="number" min="1" max="${totalPaginas}" value="${paginaActual}" style="width:56px; height:28px; font-size:1em; text-align:center; border-radius:4px; border:1px solid #ccc;" title="Página" autofocus><button class="btn btn-primary btn-sm" style="margin-left:4px;">Ir</button></div>`;
			li.appendChild(popover);
			const input = popover.querySelector('input');
			const goBtn = popover.querySelector('button');
			input.focus();
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') goBtn.click();
				if (e.key === 'Escape') { popover.remove(); popover = null; }
			});
			goBtn.addEventListener('click', () => {
				let val = parseInt(input.value);
				if (!isNaN(val) && val >= 1 && val <= totalPaginas && val !== paginaActual) {
					paginaActual = val;
					actualizarTablaPacientes();
				}
				popover.remove();
				popover = null;
			});
			document.addEventListener('click', cerrarPopover, { once: true });
			function cerrarPopover(ev) {
				if (!popover.contains(ev.target)) {
					popover.remove();
					popover = null;
				}
			}
		});
		paginacionPacientes.appendChild(li);
	}
}

function actualizarTablaPacientes() {
	const filtrados = filtrarPacientes();
	const total = filtrados.length;
	const inicio = (paginaActual - 1) * pacientesPorPagina;
	const fin = inicio + pacientesPorPagina;
	renderizarPacientes(filtrados.slice(inicio, fin));
	renderizarPaginacion(total);
}


// Cargar pacientes y renderizar
function cargarPacientes() {
	ipcRenderer.invoke('get-pacientes').then(pacientes => {
		pacientesGlobal = pacientes;
		paginaActual = 1;
		actualizarTablaPacientes();
	});
}


// Mostrar modal para nuevo paciente
if (btnNuevoPaciente) {
	btnNuevoPaciente.addEventListener('click', () => {
		pacienteEditando = null;
		formPaciente.reset();
		document.getElementById('modalPacienteLabel').textContent = 'Nuevo Paciente';
	});
}

// Filtros: búsqueda, tipo de acceso, fecha
if (inputBusqueda) inputBusqueda.addEventListener('input', () => { paginaActual = 1; actualizarTablaPacientes(); });
if (selectTipoAcceso) selectTipoAcceso.addEventListener('change', () => { paginaActual = 1; actualizarTablaPacientes(); });
if (inputFecha) inputFecha.addEventListener('change', () => { paginaActual = 1; actualizarTablaPacientes(); });



// Guardar (agregar o editar) paciente
if (formPaciente) {
	formPaciente.addEventListener('submit', async (e) => {
		e.preventDefault();
		const paciente = {
			nombre: document.getElementById('paciente-nombre').value.trim(),
			apellidos: document.getElementById('paciente-apellidos').value.trim(),
			tipo_acceso: document.getElementById('paciente-tipoacceso')?.value || '',
			fecha_instalacion: document.getElementById('paciente-fecha')?.value || '',
			ubicacion: document.getElementById('paciente-ubicacion')?.value || ''
		};
		if (pacienteEditando) {
			paciente.id = pacienteEditando;
			await ipcRenderer.invoke('edit-paciente', paciente);
			mostrarMensaje(`Paciente <b>${paciente.nombre} ${paciente.apellidos}</b> modificado correctamente.`, 'info');
		} else {
			await ipcRenderer.invoke('add-paciente', paciente);
			mostrarMensaje(`Nuevo paciente <b>${paciente.nombre} ${paciente.apellidos}</b> creado. Tipo de Acceso: <b>${paciente.tipo_acceso}</b>`, 'success');
		}
		cargarPacientes();
		// Cerrar modal Bootstrap
		const modal = bootstrap.Modal.getOrCreateInstance(modalPaciente);
		modal.hide();
	});
}

// Delegación de eventos para editar y eliminar
if (tablaPacientesBody) {
	tablaPacientesBody.addEventListener('click', async (e) => {
		if (e.target.closest('.btn-editar')) {
			const id = e.target.closest('.btn-editar').dataset.id;
			const pacientes = await ipcRenderer.invoke('get-pacientes');
			const paciente = pacientes.find(p => p.id == id);
			if (paciente) {
				pacienteEditando = paciente.id;
				document.getElementById('paciente-nombre').value = paciente.nombre;
				document.getElementById('paciente-apellidos').value = paciente.apellidos;
				if (document.getElementById('paciente-tipo-acceso')) document.getElementById('paciente-tipo-acceso').value = paciente.tipo_acceso || '';
				if (document.getElementById('paciente-fecha-instalacion')) document.getElementById('paciente-fecha-instalacion').value = paciente.fecha_instalacion || '';
				if (document.getElementById('paciente-ubicacion')) document.getElementById('paciente-ubicacion').value = paciente.ubicacion || '';
				document.getElementById('modalPacienteLabel').textContent = 'Editar Paciente';
				const modal = bootstrap.Modal.getOrCreateInstance(modalPaciente);
				modal.show();
			}
		}
		if (e.target.closest('.btn-eliminar')) {
			const id = e.target.closest('.btn-eliminar').dataset.id;
			const pacientes = await ipcRenderer.invoke('get-pacientes');
			const paciente = pacientes.find(p => p.id == id);
			pacienteAEliminar = paciente;
			if (paciente) {
				textoConfirmarEliminar.innerHTML = `¿Eliminar al paciente <b>${paciente.nombre} ${paciente.apellidos}</b>?`;
			} else {
				textoConfirmarEliminar.innerHTML = '¿Estás seguro de que deseas eliminar este paciente?';
			}
			const modal = bootstrap.Modal.getOrCreateInstance(modalConfirmarEliminar);
			modal.show();
		}
	});
}

// Confirmar eliminación desde el modal
if (btnConfirmarEliminar) {
	btnConfirmarEliminar.addEventListener('click', async () => {
		if (pacienteAEliminar) {
			await ipcRenderer.invoke('delete-paciente', pacienteAEliminar.id);
			mostrarMensaje(`Paciente <b>${pacienteAEliminar.nombre} ${pacienteAEliminar.apellidos}</b> eliminado correctamente.`, 'danger');
			cargarPacientes();
			pacienteAEliminar = null;
			const modal = bootstrap.Modal.getOrCreateInstance(modalConfirmarEliminar);
			modal.hide();
		}
	});
}


// Inicializar al mostrar la sección
document.addEventListener('DOMContentLoaded', () => {
	cargarPacientes();
});
