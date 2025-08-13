// Poblar filtro de pacientes y actualizar historial
const { ipcRenderer } = require('electron');
async function cargarPacientesHistorial() {
	const select = document.getElementById('filtro-paciente-historial');
	if (!select) return;
	const pacientes = await ipcRenderer.invoke('get-pacientes');
	select.innerHTML = '';
	if (!pacientes || pacientes.length === 0) {
		console.warn('No se recibieron pacientes para el filtro.');
	}
	pacientes.forEach(p => {
		const opt = document.createElement('option');
		opt.value = Number(p.id) > 0 ? Number(p.id) : '';
		opt.textContent = `${p.nombre} ${p.apellidos}`;
		select.appendChild(opt);
	});
	// Seleccionar el primero por defecto
	if (pacientes.length > 0) {
		pacienteId = pacientes[0].id;
		select.value = pacienteId;
	}
}

// --- Poblar selectores de etiquetas de tipo evento y diagnóstico ---
const etiquetas = require('../sections/etiquetas.js');
let tagsGlobal = [];

async function poblarSelectEtiquetasHistorial() {
	// Esperar a que se carguen las etiquetas globales
       if (!tagsGlobal.length) {
	       tagsGlobal = await ipcRenderer.invoke('tags-get-all');
       }
	// Evento
	const selectEvento = document.getElementById('tipo-historial-etiqueta');
	if (selectEvento) {
		selectEvento.innerHTML = '<option value="">Selecciona etiqueta de evento</option>';
		tagsGlobal.filter(t => t.tipo === 'evento').forEach(tag => {
			const opt = document.createElement('option');
			opt.value = tag.id;
			opt.textContent = tag.nombre + (tag.descripcion ? ' - ' + tag.descripcion : '');
			selectEvento.appendChild(opt);
		});
	}
	// Diagnóstico
	const selectDiagnostico = document.getElementById('diagnostico-historial-etiqueta');
	if (selectDiagnostico) {
		selectDiagnostico.innerHTML = '<option value="">Selecciona etiqueta de diagnóstico</option>';
		tagsGlobal.filter(t => t.tipo === 'diagnostico').forEach(tag => {
			const opt = document.createElement('option');
			opt.value = tag.id;
			opt.textContent = tag.nombre + (tag.descripcion ? ' - ' + tag.descripcion : '');
			selectDiagnostico.appendChild(opt);
		});
	}
}

document.addEventListener('DOMContentLoaded', poblarSelectEtiquetasHistorial);
document.getElementById('btn-add-historial').addEventListener('click', poblarSelectEtiquetasHistorial);


document.addEventListener('DOMContentLoaded', async function() {
	await cargarPacientesHistorial();
	document.getElementById('filtro-paciente-historial').addEventListener('change', function() {
		pacienteId = Number(this.value);
		renderHistorial();
	});
	document.getElementById('mostrar-archivados-historial').addEventListener('change', function() {
		renderHistorial();
	});
	renderHistorial();
	// Evitar duplicidad de submit
	const form = document.getElementById('form-historial');
	if (form._submitHandlerSet) return;
	form.addEventListener('submit', async function(e) {
		e.preventDefault();
		// ...existing code...
		const select = document.getElementById('filtro-paciente-historial');
		let pacienteIdValue = select && select.value ? select.value : null;
		// Validar que pacienteIdValue es un número válido
		if (!pacienteIdValue || isNaN(Number(pacienteIdValue))) {
			alert('Selecciona un paciente válido antes de guardar la entrada.');
			return;
		}
		pacienteIdValue = Number(pacienteIdValue);
		// Validar que pacienteIdValue > 0
		if (pacienteIdValue <= 0) {
			alert('Selecciona un paciente válido antes de guardar la entrada.');
			return;
		}
		// Sincronizar pacienteId global
		pacienteId = pacienteIdValue;
		const id = document.getElementById('id-historial').value;
	       const data = {
		       paciente_id: pacienteIdValue,
		       fecha: document.getElementById('fecha-historial').value,
		       tipo_evento: document.getElementById('tipo-historial-etiqueta').value, // id etiqueta evento
		       motivo: document.getElementById('motivo-historial').value,
		       diagnostico: document.getElementById('diagnostico-historial-etiqueta').value, // id etiqueta diagnostico
		       tratamiento: document.getElementById('tratamiento-historial').value,
		       notas: document.getElementById('notas-historial').value,
		       adjuntos: '', // Implementar adjuntos si lo necesitas
		       profesional: document.getElementById('profesional-historial').value
	       };
		if (id) {
			await ipcRenderer.invoke('historial-edit', id, data);
		} else {
			await ipcRenderer.invoke('historial-add', data);
		}
		document.getElementById('form-historial').reset();
		document.getElementById('id-historial').value = '';
		const modal = bootstrap.Modal.getInstance(document.getElementById('modal-historial'));
		if (modal) modal.hide();
		renderHistorial();
	});
	form._submitHandlerSet = true;
});
// Historial Clínico - JS
// Usar window.ipcRenderer como en el resto de secciones
let historialData = [];
// Debes definir pacienteId según el paciente seleccionado en la app
let pacienteId = window.pacienteId || null;

async function renderHistorial() {
	const tbody = document.querySelector('#tabla-historial tbody');
	// Mantener los ejemplos fijos arriba, luego las entradas dinámicas
	const ejemplos = document.querySelectorAll('#tabla-historial tbody tr');
	ejemplos.forEach(tr => {
		if (tr.getAttribute('data-dinamico') === 'true') tr.remove();
	});
	// Leer pacienteId actual del select siempre
	const select = document.getElementById('filtro-paciente-historial');
	const pacienteIdActual = select && select.value ? Number(select.value) : null;
	if (!pacienteIdActual) {
		tbody.innerHTML += `<tr data-dinamico="true"><td colspan="9" class="text-center text-muted">Selecciona un paciente.</td></tr>`;
		return;
	}
	const mostrarArchivados = document.getElementById('mostrar-archivados-historial')?.checked;
	if (mostrarArchivados) {
		// Mostrar solo los archivados
		historialData = await ipcRenderer.invoke('historial-get-archived', pacienteIdActual);
		tbody.innerHTML = '';
		if (!historialData || historialData.length === 0) {
			tbody.innerHTML = `<tr data-dinamico="true"><td colspan="9" class="text-center text-muted">No hay entradas archivadas.</td></tr>`;
			return;
		}
	} else {
		// Mostrar solo los activos
		historialData = await ipcRenderer.invoke('historial-get', pacienteIdActual);
		tbody.innerHTML = '';
		if (!historialData || historialData.length === 0) {
			tbody.innerHTML = `<tr data-dinamico="true"><td colspan="9" class="text-center text-muted">No hay entradas en el historial.</td></tr>`;
			return;
		}
	}
	       // Asegurarse de tener los tags globales
	       if (!tagsGlobal.length) {
		       tagsGlobal = await ipcRenderer.invoke('tags-get-all');
	       }
	       historialData.forEach((item, idx) => {
		       const esArchivado = item.archivado === 1 || item.archivado === true;
		       // Buscar nombre de etiqueta evento
		       let nombreEvento = '';
		       if (item.tipo_evento) {
			       const tagEvento = tagsGlobal.find(t => String(t.id) === String(item.tipo_evento));
			       nombreEvento = tagEvento ? tagEvento.nombre : item.tipo_evento;
		       }
		       // Buscar nombre de etiqueta diagnostico
		       let nombreDiagnostico = '';
		       if (item.diagnostico) {
			       const tagDiag = tagsGlobal.find(t => String(t.id) === String(item.diagnostico));
			       nombreDiagnostico = tagDiag ? tagDiag.nombre : item.diagnostico;
		       }
		       tbody.innerHTML += `
			       <tr data-dinamico="true">
				       <td>${item.fecha}</td>
				       <td>${nombreEvento}</td>
				       <td>${item.motivo}</td>
				       <td>${nombreDiagnostico}</td>
				       <td>${item.tratamiento}</td>
				       <td>${item.notas}</td>
				       <td>${item.adjuntos ? `<a href='#' class='btn btn-sm btn-outline-secondary'><i class='bi bi-paperclip'></i></a>` : ''}</td>
				       <td>${item.profesional}</td>
				       <td>
					       <button type='button' class='btn btn-sm btn-outline-primary me-1 btn-edit-historial' data-idx='${idx}'><i class='bi bi-pencil'></i></button>
					       ${esArchivado
						       ? `<button type='button' class='btn btn-sm btn-outline-success btn-unarchive-historial' data-idx='${idx}'><i class='bi bi-arrow-up-square'></i> Desarchivar</button>`
						       : `<button type='button' class='btn btn-sm btn-outline-warning btn-archive-historial' data-idx='${idx}'><i class='bi bi-archive'></i> Archivar</button>`}
				       </td>
			       </tr>
		       `;
	       });
		// Delegación de eventos para los botones de acción
		if (!tbody._delegationSet) {
			tbody.addEventListener('click', function(e) {
				if (e.target.closest('.btn-edit-historial')) {
					const idx = e.target.closest('.btn-edit-historial').getAttribute('data-idx');
					editHistorial(idx);
				}
				if (e.target.closest('.btn-archive-historial')) {
					const idx = e.target.closest('.btn-archive-historial').getAttribute('data-idx');
					archiveHistorial(idx);
				}
				if (e.target.closest('.btn-unarchive-historial')) {
					const idx = e.target.closest('.btn-unarchive-historial').getAttribute('data-idx');
					unarchiveHistorial(idx);
				}
			});
			tbody._delegationSet = true;
		}
// Desarchivar historial
window.unarchiveHistorial = async function(idx) {
	const item = historialData[idx];
	if (confirm('¿Seguro que quieres desarchivar esta entrada?')) {
		await ipcRenderer.invoke('historial-unarchive', item.id);
		renderHistorial();
	}
};
}


document.getElementById('btn-add-historial').addEventListener('click', function() {
	document.getElementById('form-historial').reset();
	document.getElementById('id-historial').value = '';
	const select = document.getElementById('filtro-paciente-historial');
	const nombreDiv = document.getElementById('paciente-historial-nombre');
	if (select && nombreDiv) {
		const selectedOption = select.options[select.selectedIndex];
		if (selectedOption) {
			nombreDiv.textContent = `Paciente seleccionado: ${selectedOption.textContent}`;
			nombreDiv.style.display = 'block';
		} else {
			nombreDiv.textContent = 'Selecciona un paciente antes de añadir entrada.';
			nombreDiv.style.display = 'block';
		}
	}
});

window.editHistorial = function(idx) {
	const item = historialData[idx];
	document.getElementById('fecha-historial').value = item.fecha;
	document.getElementById('tipo-historial').value = item.tipo_evento;
	document.getElementById('motivo-historial').value = item.motivo;
	document.getElementById('diagnostico-historial').value = item.diagnostico;
	document.getElementById('tratamiento-historial').value = item.tratamiento;
	document.getElementById('notas-historial').value = item.notas;
	document.getElementById('profesional-historial').value = item.profesional;
	document.getElementById('id-historial').value = item.id;
	// Mostrar nombre del paciente en el modal
	const select = document.getElementById('filtro-paciente-historial');
	const nombreDiv = document.getElementById('paciente-historial-nombre');
	if (select && nombreDiv) {
		const selectedOption = select.options[select.selectedIndex];
		if (selectedOption) {
			nombreDiv.textContent = `Paciente seleccionado: ${selectedOption.textContent}`;
			nombreDiv.style.display = 'block';
		} else {
			nombreDiv.textContent = 'Selecciona un paciente antes de editar entrada.';
			nombreDiv.style.display = 'block';
		}
	}
	const modal = new bootstrap.Modal(document.getElementById('modal-historial'));
	modal.show();
};


window.archiveHistorial = async function(idx) {
	const item = historialData[idx];
	if (confirm('¿Seguro que quieres archivar esta entrada?')) {
		await ipcRenderer.invoke('historial-archive', item.id);
		renderHistorial();
	}
};

