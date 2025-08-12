
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

// Renderizar la tabla de pacientes
function renderizarPacientes(pacientes) {
	tablaPacientesBody.innerHTML = '';
	pacientes.forEach(paciente => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${paciente.nombre}</td>
			<td>${paciente.apellidos}</td>
			<td>${paciente.tipo_acceso || ''}</td>
			<td>${paciente.fecha_instalacion || ''}</td>
			<td>${paciente.ubicacion || ''}</td>
			<td>Sin incidentes</td>
			<td>
				<button class="btn btn-outline-success btn-sm btn-editar" data-id="${paciente.id}"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${paciente.id}"><i class="bi bi-trash"></i></button>
			</td>
		`;
		tablaPacientesBody.appendChild(tr);
	});
}

// Cargar pacientes y renderizar
function cargarPacientes() {
	ipcRenderer.invoke('get-pacientes').then(pacientes => {
		renderizarPacientes(pacientes);
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
			if (confirm('¿Seguro que deseas eliminar este paciente?')) {
					const pacientes = await ipcRenderer.invoke('get-pacientes');
					const paciente = pacientes.find(p => p.id == id);
					await ipcRenderer.invoke('delete-paciente', id);
					if (paciente) {
						mostrarMensaje(`Paciente <b>${paciente.nombre} ${paciente.apellidos}</b> eliminado correctamente.`, 'danger');
					} else {
						mostrarMensaje('Paciente eliminado correctamente.', 'danger');
					}
					cargarPacientes();
			}
		}
	});
}

// Inicializar al mostrar la sección
document.addEventListener('DOMContentLoaded', () => {
	cargarPacientes();
});
