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
			tr.innerHTML = `
				<td>${paciente.nombre} ${paciente.apellidos}</td>
				<td>${renderTipoAccesoBadge(paciente.tipo_acceso)}</td>
				<td>${fechaFormateada}</td>
				<td>${paciente.ubicacion || ''}</td>
				<td>Sin incidentes</td>
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
	for (let i = 1; i <= totalPaginas; i++) {
		const li = document.createElement('li');
		li.className = 'page-item' + (i === paginaActual ? ' active' : '');
		li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
		li.addEventListener('click', (e) => {
			e.preventDefault();
			if (paginaActual !== i) {
				paginaActual = i;
				actualizarTablaPacientes();
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
