// Renderizar timeline visual de eventos clínicos recientes
function renderTimelinePaciente(eventos) {
	const timeline = document.getElementById('timelinePaciente');
	if (!timeline) return;
	if (!eventos || eventos.length === 0) {
		timeline.innerHTML = '<div class="text-muted">Sin datos de evolución disponibles.</div>';
		return;
	}
	timeline.innerHTML = eventos.map(ev => `
		<div class="d-flex align-items-start mb-3">
			<div class="icon-circle bg-${ev.color}-subtle text-${ev.color} me-3" style="font-size:1.3em;">
				<i class="${ev.icono}"></i>
			</div>
			<div>
				<div class="fw-semibold text-${ev.color}">${ev.tipo} <span class="text-muted small ms-2">${ev.fecha}</span></div>
				<div class="text-dark">${ev.descripcion}</div>
			</div>
		</div>
	`).join('');
}

// Ejemplo de eventos clínicos recientes
const eventosPaciente = [
	{
		fecha: '2025-08-01',
		tipo: 'Consulta',
		descripcion: 'Dolor abdominal. Diagnóstico: Gastritis aguda.',
		icono: 'bi bi-person-badge',
		color: 'primary'
	},
	{
		fecha: '2025-08-10',
		tipo: 'Prueba Laboratorio',
		descripcion: 'Hemograma y bioquímica normales.',
		icono: 'bi bi-flask',
		color: 'info'
	},
	{
		fecha: '2025-08-15',
		tipo: 'Incidencia',
		descripcion: 'Alergia detectada: Penicilina.',
		icono: 'bi bi-exclamation-diamond',
		color: 'danger'
	},
	{
		fecha: '2025-08-20',
		tipo: 'Tratamiento',
		descripcion: 'Inicio de Omeprazol 20mg/día. Seguimiento semanal.',
		icono: 'bi bi-capsule',
		color: 'success'
	},
	{
		fecha: '2025-08-25',
		tipo: 'Cita de control',
		descripcion: 'Control de evolución. Sin complicaciones.',
		icono: 'bi bi-calendar-check',
		color: 'secondary'
	},
	{
		fecha: '2025-08-28',
		tipo: 'Observación',
		descripcion: 'Paciente refiere mejoría significativa. Se mantiene tratamiento.',
		icono: 'bi bi-eye',
		color: 'warning'
	},
	{
		fecha: '2025-08-28',
		tipo: 'Observación',
		descripcion: 'Paciente refiere mejoría significativa. Se mantiene tratamiento.',
		icono: 'bi bi-eye',
		color: 'warning'
	}
];

// Llama a la función con tus datos reales o de ejemplo
document.addEventListener('DOMContentLoaded', function() {
	renderTimelinePaciente(eventosPaciente);
});
// Función global para mostrar mensajes flotantes (copiada de agenda.js)
function mostrarMensaje(texto, tipo = 'success') {
	let alerta = document.createElement('div');
	alerta.className = `alert custom-alert alert-${tipo} position-fixed top-0 end-0 m-4 fade show`;
	alerta.style.zIndex = 9999;
	let icon = '';
	if (tipo === 'success') icon = '<span class="alert-icon">✨</span>';
	else if (tipo === 'danger') icon = '<span class="alert-icon">❌</span>';
	else if (tipo === 'warning') icon = '<span class="alert-icon">⚠️</span>';
	else if (tipo === 'info') icon = '<span class="alert-icon">ℹ️</span>';
	alerta.innerHTML = `${icon}<span class="alert-content">${texto}</span>`;
	document.body.appendChild(alerta);
	// Cerrar al hacer click en la alerta
	alerta.onclick = () => alerta.remove();
	setTimeout(() => {
		if (document.body.contains(alerta)) {
			alerta.classList.remove('show');
			alerta.classList.add('hide');
			setTimeout(() => alerta.remove(), 500);
		}
	}, 3000);
}
// Poblar filtro de pacientes y actualizar historial
// Función para obtener profesionales registrados
async function obtenerProfesionales() {
	// IPC call para obtener profesionales desde el backend
	return await ipcRenderer.invoke('get-profesionales');
}

// Poblar el select de profesionales en el modal de historial
async function cargarProfesionalesEnHistorial() {
	console.log('cargarProfesionalesEnHistorial ejecutándose...');
// Forzar carga de profesionales al mostrar el modal (por si el botón no es el único trigger)
document.addEventListener('DOMContentLoaded', function() {
	const modal = document.getElementById('modal-historial');
	if (modal) {
		modal.addEventListener('shown.bs.modal', function() {
			console.log('Modal historial mostrado');
			cargarProfesionalesEnHistorial();
		});
	}
});
	console.log('Cargando profesionales...');
		const select = document.getElementById('profesional-historial');
		if (!select) return;
		select.innerHTML = '';
			const profesionales = await obtenerProfesionales();
				console.log('Profesionales recibidos:', profesionales);
					const options = [];
					if (!profesionales || profesionales.length === 0) {
						console.error('No se recibieron profesionales desde la base de datos.');
						options.push({
							value: '',
							label: 'No hay profesionales registrados'
						});
					} else {
						profesionales.forEach((prof, idx) => {
									options.push({
										value: prof.id,
										label: `${prof.nombre} ${prof.apellidos}`,
										customProperties: { avatar: prof.avatar && prof.avatar !== '' ? prof.avatar : '../assets/avatar-default.png' },
										selected: idx === 0 // Selecciona el primero por defecto
									});
						});
					}
		// Destruir instancia previa de Choices si existe
		if (select.choicesInstance) {
			select.choicesInstance.destroy();
			select.choicesInstance = null;
		}
		// Crear opciones en el select
		options.forEach(opt => {
			const optionElem = document.createElement('option');
			optionElem.value = opt.value;
			optionElem.textContent = opt.label;
			if (opt.disabled) optionElem.disabled = true;
			if (opt.selected) optionElem.selected = true;
			if (opt.customProperties) optionElem.setAttribute('data-custom-properties', JSON.stringify(opt.customProperties));
			select.appendChild(optionElem);
		});
		// Inicializar Choices con template personalizado para mostrar avatar
		select.choicesInstance = new Choices(select, {
			searchEnabled: false,
			itemSelectText: '',
			callbackOnCreateTemplates: function(template) {
				return {
					choice: (classNames, data) => {
						let avatar = '';
						if (data.customProperties && data.customProperties.avatar) {
						avatar = `<img src='${data.customProperties.avatar}' class='rounded-circle me-2' style='width:28px;height:28px;object-fit:cover;margin: 8px 0 8px 8px;'>`;
						}
						const html = `<div class='${classNames.item} ${classNames.itemChoice}' data-select-text='${this.config.itemSelectText}' data-choice ${data.disabled ? "data-choice-disabled aria-disabled='true'" : ''} data-id='${data.id}' data-value='${data.value}' ${data.groupId > 0 ? "role='treeitem'" : "role='option'"}>${avatar}${data.label}</div>`;
						return template(html);
					},
					item: (classNames, data) => {
						let avatar = '';
						if (data.customProperties && data.customProperties.avatar) {
							avatar = `<img src='${data.customProperties.avatar}' class='rounded-circle me-2' style='width:28px;height:28px;object-fit:cover;'>`;
						}
						const html = `<div class='${classNames.item} ${classNames.highlighted}' data-item data-id='${data.id}' data-value='${data.value}' ${data.active ? "aria-selected='true'" : ''} ${data.disabled ? "aria-disabled='true'" : ''}>${avatar}${data.label}</div>`;
						return template(html);
					}
				};
			}
		});
	}


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
        selectEvento.innerHTML = '';
        const eventoOptions = tagsGlobal.filter(t => t.tipo === 'evento').map((tag, idx) => {
            return {
                value: tag.id,
                label: tag.nombre,
                customProperties: { color: tag.color || '#888' },
                selected: idx === 0
            };
        });
        eventoOptions.forEach(opt => {
            const optElem = document.createElement('option');
            optElem.value = opt.value;
            optElem.textContent = opt.label;
            if (opt.selected) optElem.selected = true;
            optElem.setAttribute('data-custom-properties', JSON.stringify(opt.customProperties));
            selectEvento.appendChild(optElem);
        });
        if (selectEvento.choicesInstance) {
            selectEvento.choicesInstance.destroy();
            selectEvento.choicesInstance = null;
        }
        selectEvento.choicesInstance = new Choices(selectEvento, {
            searchEnabled: false,
            itemSelectText: '',
            callbackOnCreateTemplates: function(template) {
                return {
                    choice: (classNames, data) => {
                        let colorCircle = '';
                        if (data.customProperties && data.customProperties.color) {
                            colorCircle = `<span style='display:inline-block;width:18px;height:18px;border-radius:50%;background:${data.customProperties.color};margin-right:8px;vertical-align:middle;'></span>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.itemChoice}' style='padding:10px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;' data-select-text='${this.config.itemSelectText}' data-choice ${data.disabled ? "data-choice-disabled aria-disabled='true'" : ''} data-id='${data.id}' data-value='${data.value}' ${data.groupId > 0 ? "role='treeitem'" : "role='option'"}>${colorCircle}${data.label}</div>`;
                        return template(html);
                    },
                    item: (classNames, data) => {
                        let colorCircle = '';
                        if (data.customProperties && data.customProperties.color) {
                            colorCircle = `<span style='display:inline-block;width:18px;height:18px;border-radius:50%;background:${data.customProperties.color};margin-right:8px;vertical-align:middle;'></span>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.highlighted}' style='display:flex;align-items:center;' data-item data-id='${data.id}' data-value='${data.value}' ${data.active ? "aria-selected='true'" : ''} ${data.disabled ? "aria-disabled='true'" : ''}>${colorCircle}${data.label}</div>`;
                        return template(html);
                    }
                };
            }
        });
    }
    // Diagnóstico
    const selectDiagnostico = document.getElementById('diagnostico-historial-etiqueta');
    if (selectDiagnostico) {
        selectDiagnostico.innerHTML = '';
        const diagOptions = tagsGlobal.filter(t => t.tipo === 'diagnostico').map((tag, idx) => {
            return {
                value: tag.id,
                label: tag.nombre,
                customProperties: { color: tag.color || '#888' },
                selected: idx === 0
            };
        });
        diagOptions.forEach(opt => {
            const optElem = document.createElement('option');
            optElem.value = opt.value;
            optElem.textContent = opt.label;
            if (opt.selected) optElem.selected = true;
            optElem.setAttribute('data-custom-properties', JSON.stringify(opt.customProperties));
            selectDiagnostico.appendChild(optElem);
        });
        if (selectDiagnostico.choicesInstance) {
            selectDiagnostico.choicesInstance.destroy();
            selectDiagnostico.choicesInstance = null;
        }
        selectDiagnostico.choicesInstance = new Choices(selectDiagnostico, {
            searchEnabled: false,
            itemSelectText: '',
            callbackOnCreateTemplates: function(template) {
                return {
                    choice: (classNames, data) => {
                        let colorCircle = '';
                        if (data.customProperties && data.customProperties.color) {
                            colorCircle = `<span style='display:inline-block;width:18px;height:18px;border-radius:50%;background:${data.customProperties.color};margin-right:8px;vertical-align:middle;'></span>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.itemChoice}' style='padding:10px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;' data-select-text='${this.config.itemSelectText}' data-choice ${data.disabled ? "data-choice-disabled aria-disabled='true'" : ''} data-id='${data.id}' data-value='${data.value}' ${data.groupId > 0 ? "role='treeitem'" : "role='option'"}>${colorCircle}${data.label}</div>`;
                        return template(html);
                    },
                    item: (classNames, data) => {
                        let colorCircle = '';
                        if (data.customProperties && data.customProperties.color) {
                            colorCircle = `<span style='display:inline-block;width:18px;height:18px;border-radius:50%;background:${data.customProperties.color};margin-right:8px;vertical-align:middle;'></span>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.highlighted}' style='display:flex;align-items:center;' data-item data-id='${data.id}' data-value='${data.value}' ${data.active ? "aria-selected='true'" : ''} ${data.disabled ? "aria-disabled='true'" : ''}>${colorCircle}${data.label}</div>`;
                        return template(html);
                    }
                };
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', poblarSelectEtiquetasHistorial);
document.getElementById('btn-add-historial').addEventListener('click', poblarSelectEtiquetasHistorial);


document.addEventListener('DOMContentLoaded', async function() {
	   await cargarPacientesHistorial();
	   // Mostrar datos del paciente seleccionado por defecto
	   const select = document.getElementById('filtro-paciente-historial');
	   let pacienteId = select && select.value ? Number(select.value) : null;
	   if (pacienteId) {
		   const pacientes = await ipcRenderer.invoke('get-pacientes');
		   const pacienteSel = pacientes.find(p => Number(p.id) === pacienteId);
		   await renderPacienteCard(pacienteSel || null);
	   } else {
		   await renderPacienteCard(null);
	   }
	   renderHistorial();
	   document.getElementById('filtro-paciente-historial').addEventListener('change', async function() {
		   pacienteId = Number(this.value);
		   const pacientes = await ipcRenderer.invoke('get-pacientes');
		   const pacienteSel = pacientes.find(p => Number(p.id) === pacienteId);
		   await renderPacienteCard(pacienteSel || null);
		   renderHistorial();
	   });
	   document.getElementById('mostrar-archivados-historial').addEventListener('change', function() {
		   renderHistorial();
	   });
	   document.getElementById('filtro-tipo-evento-historial').addEventListener('change', function() {
		   renderHistorial();
	   });
	   document.getElementById('filtro-fecha-historial').addEventListener('change', function() {
		   renderHistorial();
	   });
	   document.getElementById('filtro-profesional-historial').addEventListener('input', function() {
		   renderHistorial();
	   });
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
    if (!tbody) return;
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
    const mostrarArchivadosCheckbox = document.getElementById('mostrar-archivados-historial');
    const mostrarArchivados = mostrarArchivadosCheckbox ? mostrarArchivadosCheckbox.checked : false;
    if (mostrarArchivados) {
        historialData = await ipcRenderer.invoke('historial-get-archived', pacienteIdActual);
        tbody.innerHTML = '';
        if (!historialData || historialData.length === 0) {
            tbody.innerHTML = `<tr data-dinamico="true"><td colspan="9" class="text-center text-muted">No hay entradas archivadas.</td></tr>`;
            return;
        }
    } else {
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
    // Obtener lista de profesionales para mostrar nombre y avatar
    const profesionales = await obtenerProfesionales();
    // --- Filtros avanzados ---
    const filtroTipoEvento = document.getElementById('filtro-tipo-evento-historial')?.value || '';
    const filtroFecha = document.getElementById('filtro-fecha-historial')?.value || '';
    const filtroProfesional = document.getElementById('filtro-profesional-historial')?.value?.toLowerCase() || '';

    historialData.forEach((item, idx) => {
        // Filtrar por tipo de evento
        if (filtroTipoEvento && String(item.tipo_evento) !== String(filtroTipoEvento)) return;
        // Filtrar por fecha exacta
        if (filtroFecha && String(item.fecha) !== String(filtroFecha)) return;
        // Filtrar por profesional (substring, case-insensitive)
        if (filtroProfesional && (!item.profesional || !item.profesional.toLowerCase().includes(filtroProfesional))) return;

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
        // Mostrar profesional: avatar + nombre + apellidos
        let profesionalHtml = '';
        if (item.profesional) {
            const prof = profesionales.find(p => String(p.id) === String(item.profesional));
            if (prof) {
                const avatarUrl = prof.avatar && prof.avatar !== '' ? prof.avatar : '../assets/avatar-default.png';
				profesionalHtml = `<img src='${avatarUrl}' class='rounded-circle' style='width:28px;height:28px;object-fit:cover;vertical-align:middle;margin-right:2px;'> <span>${prof.nombre} ${prof.apellidos}</span>`;
            } else {
                profesionalHtml = `<span class='text-muted'>No encontrado</span>`;
            }
        } else {
            profesionalHtml = `<span class='text-muted'>Sin profesional</span>`;
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
                <td>${profesionalHtml}</td>
                <td>
                    <button type='button' class='btn btn-sm btn-outline-primary me-1 btn-edit-historial' data-idx='${idx}'><i class='bi bi-pencil'></i></button>
                    ${esArchivado
                        ? `<button type='button' class='btn btn-sm btn-outline-success btn-unarchive-historial' data-idx='${idx}'><i class='bi bi-arrow-up-square'></i> Desarchivar</button>`
                        : `<button type='button' class='btn btn-sm btn-outline-warning btn-archive-historial' data-idx='${idx}'><i class='bi bi-archive'></i> Archivar</button>`}
                </td>
            </tr>
        `;
    });
    // ...existing code...
}


document.getElementById('btn-add-historial').addEventListener('click', function() {
	cargarProfesionalesEnHistorial();
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
	const fechaElem = document.getElementById('fecha-historial');
	if (fechaElem) fechaElem.value = item.fecha;
	const tipoElem = document.getElementById('tipo-historial');
	if (tipoElem) tipoElem.value = item.tipo_evento;
	const motivoElem = document.getElementById('motivo-historial');
	if (motivoElem) motivoElem.value = item.motivo;
	const diagElem = document.getElementById('diagnostico-historial');
	if (diagElem) diagElem.value = item.diagnostico;
	const tratElem = document.getElementById('tratamiento-historial');
	if (tratElem) tratElem.value = item.tratamiento;
	const notasElem = document.getElementById('notas-historial');
	if (notasElem) notasElem.value = item.notas;
	const profElem = document.getElementById('profesional-historial');
	if (profElem) profElem.value = item.profesional;
	const idElem = document.getElementById('id-historial');
	if (idElem) idElem.value = item.id;
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
	const modalElem = document.getElementById('modal-historial');
	if (modalElem) {
		const modal = new bootstrap.Modal(modalElem);
		modal.show();
	}
};


window.archiveHistorial = async function(idx) {
	const item = historialData[idx];
	if (confirm('¿Seguro que quieres archivar esta entrada?')) {
		await ipcRenderer.invoke('historial-archive', item.id);
		renderHistorial();
	}
};



document.getElementById('pacienteAvatarInput').addEventListener('change', async function() {
    const input = this;
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        document.getElementById('pacienteAvatar').src = base64;
        const select = document.getElementById('filtro-paciente-historial');
        const pacienteId = select && select.value ? Number(select.value) : null;
        if (pacienteId) {
            await ipcRenderer.invoke('paciente-set-avatar', pacienteId, base64);
			mostrarMensaje('¡Foto de perfil actualizada correctamente!', 'info');
        }
    };
    reader.readAsDataURL(file);
});

async function renderPacienteCard(paciente) {
	const avatar = document.getElementById('pacienteAvatar');
	const nombre = document.getElementById('pacienteNombre');
	const datos = document.getElementById('pacienteDatos');
	const extra = document.getElementById('pacienteExtra');
	const sexoBadge = document.getElementById('pacienteSexo');
	const telefono = document.getElementById('pacienteTelefono');
	const correo = document.getElementById('pacienteCorreo');
	const direccion = document.getElementById('pacienteDireccion');
	const alergias = document.getElementById('pacienteAlergias');
	const profesional = document.getElementById('pacienteProfesional');
	const observaciones = document.getElementById('pacienteObservaciones');
	const tipoAccesoElem = document.getElementById('paciente-tipoacceso');

	if (!paciente) {
		avatar.src = '../assets/avatar-default.png';
		nombre.textContent = 'Selecciona un paciente';
		datos.textContent = '';
		extra.textContent = '';
		sexoBadge.textContent = '';
		sexoBadge.className = 'badge bg-secondary mt-2';
		if (telefono) telefono.textContent = '-';
		if (correo) correo.textContent = '-';
		if (direccion) direccion.textContent = '-';
		if (historia) historia.textContent = '-';
		if (alergias) alergias.textContent = '-';
		if (profesional) profesional.textContent = '-';
		if (observaciones) observaciones.textContent = '-';
		if (tipoAccesoElem) tipoAccesoElem.textContent = '-';
		return;
	}
	// Nuevos campos visuales profesionales
	if (telefono) telefono.textContent = paciente.telefono || '-';
	if (correo) correo.textContent = paciente.correo || '-';
	if (direccion) direccion.textContent = paciente.direccion || '-';
	if (alergias) alergias.textContent = paciente.alergias || '-';
	if (profesional) profesional.textContent = paciente.alergias || '-';
	if (observaciones) observaciones.textContent = paciente.observaciones || '-';
    let avatarData = paciente.avatar;
    if (!avatarData && paciente.id) {
        avatarData = await ipcRenderer.invoke('paciente-get-avatar', paciente.id);
    }
    if (avatarData && avatarData !== '') {
        if (avatarData.startsWith('data:image')) {
            avatar.src = avatarData;
        } else {
            avatar.src = avatarData;
        }
    } else {
        avatar.src = paciente.sexo === 'M' ? '../assets/hombre.jpg' : (paciente.sexo === 'F' ? '../assets/mujer.jpg' : '../assets/avatar-default.png');
    }
    nombre.textContent = paciente.nombre + (paciente.apellidos ? ' ' + paciente.apellidos : '');
    let edad = '';
    let fechaNac = paciente.fecha_nacimiento || '';
	let tipoAcceso = paciente.tipo_acceso_id ? (tagsGlobal ? (tagsGlobal.find(t => t.id === paciente.tipo_acceso_id)?.nombre || '') : '') : '';
	let ubicacion = paciente.ubicacion_anatomica || '';
	let lado = paciente.ubicacion_lado || '';
	let acceso_final = `${tipoAcceso ? tipoAcceso : ''}${ubicacion ? ', ' + ubicacion : ''}${lado ? ', ' + lado : ''}`;
    if (tipoAccesoElem) tipoAccesoElem.textContent = acceso_final || '';
	if (fechaNac) {
        const nacimiento = new Date(fechaNac);
        const hoy = new Date();
        let years = hoy.getFullYear() - nacimiento.getFullYear();
        if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) {
            years--;
        }
        edad = years + ' años';
    }

	let fechaAlta = paciente.fecha_instalacion || '';
	// Formatear fecha de alta a dd/mm/yyyy
	let fechaAltaFormateada = '';
	if (fechaAlta && fechaAlta.includes('-')) {
		const [y, m, d] = fechaAlta.split('-');
		fechaAltaFormateada = `${d}/${m}/${y}`;
	} else {
		fechaAltaFormateada = fechaAlta;
	}
	datos.innerHTML = `${edad ? edad : 'Edad desconocida'}<br>`;
    if (paciente.sexo === 'M') {
        sexoBadge.textContent = 'Hombre';
        sexoBadge.className = 'badge bg-primary mt-2';
        sexoBadge.style.backgroundColor = '';
    } else if (paciente.sexo === 'F') {
        sexoBadge.textContent = 'Mujer';
        sexoBadge.className = 'badge bg-pink mt-2';
        sexoBadge.style.backgroundColor = '#e83e8c';
    } else {
        sexoBadge.textContent = 'Sin especificar';
        sexoBadge.className = 'badge bg-secondary mt-2';
        sexoBadge.style.backgroundColor = '';
    }
	extra.innerHTML = `ID: ${paciente.id || ''}${fechaAltaFormateada ? ', Alta: ' + fechaAltaFormateada : ''}`;
	
}

document.getElementById('filtro-paciente-historial').addEventListener('change', async function() {
    pacienteId = Number(this.value);
    const pacientes = await ipcRenderer.invoke('get-pacientes');
    const pacienteSel = pacientes.find(p => Number(p.id) === pacienteId);
    await renderPacienteCard(pacienteSel || null);
    renderHistorial();
});

