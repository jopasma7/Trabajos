// Asegura disponibilidad global de la función
window.addEntradasHistorial = addEntradasHistorial;
const { ipcRenderer } = require('electron');

var fechaInput = document.getElementById('infeccion-fecha');
var listaInfeccion = document.getElementById('infeccion-lista');
var comentariosInput = document.getElementById('infeccion-comentarios');

const modal_historial = document.getElementById('modal-historial');
const modal_infeccion = document.getElementById('modal-infeccion');
const select_profesional_historial = document.getElementById('profesional-historial');
const btn_guardar_infecciones = document.getElementById('btn-guardar-infecciones');
const infeccion_tags = document.getElementById('infeccion-tags');
const seleccionar_paciente_principal = document.getElementById('filtro-paciente-historial');
const filtro_profesional_historial = document.getElementById('filtro-profesional-historial');
const filtro_fecha_historial = document.getElementById('filtro-fecha-historial');
const timeline = document.getElementById('timelinePaciente');
const avatar = document.getElementById('pacienteAvatarInput');

let paciente_seleccionado = null;
let tagsGlobal = [];
let historialData = [];

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


document.addEventListener('DOMContentLoaded', async function() {
	// --- Modal Incidencia: rellenar selectores dinámicamente ---
	const incidenciaTipoSelect = document.getElementById('incidenciaTipo');
	const incidenciaAccesoSelect = document.getElementById('incidenciaAcceso');

	// Rellenar tipos de incidencia desde etiquetas tipo 'incidencia'
	if (incidenciaTipoSelect && window.etiquetasGlobales) {
		incidenciaTipoSelect.innerHTML = '';
		window.etiquetasGlobales.filter(tag => tag.tipo === 'incidencia').forEach(tag => {
			const option = document.createElement('option');
			option.value = tag.id;
			option.innerHTML = `<i class='${tag.icono || ''}'></i> ${tag.nombre}`;
			incidenciaTipoSelect.appendChild(option);
		});
	}

	// Rellenar tipos de acceso con iconos
	if (incidenciaAccesoSelect && window.etiquetasGlobales) {
		incidenciaAccesoSelect.innerHTML = '';
		window.etiquetasGlobales.filter(tag => tag.tipo === 'acceso').forEach(tag => {
			const option = document.createElement('option');
			option.value = tag.id;
			option.innerHTML = `<i class='${tag.icono || ''}'></i> ${tag.nombre}`;
			incidenciaAccesoSelect.appendChild(option);
		});
	}
	// Cargar etiquetas globales al iniciar
	window.etiquetasGlobales = await ipcRenderer.invoke('tags-get-all');
	   await cargarPacientesHistorial();
	   // Renderizar historial y timeline del primer paciente seleccionado
	   const selectPacienteInicial = document.getElementById('filtro-paciente-historial');
	   if (selectPacienteInicial && selectPacienteInicial.value) {
		   const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
		   const pacienteSel = pacientes.find(p => Number(p.id) === Number(selectPacienteInicial.value));
		   await renderPacienteCard(pacienteSel || null);
		   renderHistorial();
		   renderTimelinePacienteDB();
	   }

	   await poblarFiltroProfesionalHistorial();
	   await poblarFiltroFechaHistorial();
	// Mostrar datos del paciente seleccionado solo al cambiar
	const select = document.getElementById('filtro-paciente-historial');
	   let ultimoPacienteId = null;
	   document.getElementById('filtro-paciente-historial').addEventListener('change', async function() {
		   const pacienteId = Number(this.value);
		   if (pacienteId === ultimoPacienteId) return;
		   ultimoPacienteId = pacienteId;
		   const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
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
	   document.getElementById('filtro-profesional-historial').addEventListener('change', function() {
			renderHistorial();
		});
	// Evitar duplicidad de submit
	const form = document.getElementById('form-historial');
	if (form._submitHandlerSet) return;
	form.addEventListener('submit', async function(e) {
		e.preventDefault();
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
		// Validar profesional-historial
		const profesionalSelect = document.getElementById('profesional-historial');
		if (!profesionalSelect.value || profesionalSelect.value === '' || profesionalSelect.selectedIndex === -1) {
			mostrarMensaje('Selecciona un profesional antes de guardar la entrada.', 'danger');
			profesionalSelect.focus();
			return;
		}
		const id = document.getElementById('id-historial').value;
		const data = {
			paciente_id: pacienteIdValue,
			fecha: document.getElementById('fecha-historial').value,
			tipo_evento: document.getElementById('tipo-historial-etiqueta').value, // id etiqueta evento
			motivo: document.getElementById('motivo-historial') ? document.getElementById('motivo-historial').value : '',
			diagnostico: document.getElementById('diagnostico-historial-etiqueta').value, // id etiqueta diagnostico
			tratamiento: document.getElementById('tratamiento-historial').value,
			notas: document.getElementById('notas-historial').value,
			adjuntos: '', // Implementar adjuntos si lo necesitas
			profesional_id: profesionalSelect.value
		};
		if (id) {
			await ipcRenderer.invoke('historial-edit', id, data);
		} else {
			await ipcRenderer.invoke('historial-add', data);
		}
		document.getElementById('form-historial').reset();
	const idHistorialElem = document.getElementById('id-historial');
	if (idHistorialElem) idHistorialElem.value = '';
		const modal = bootstrap.Modal.getInstance(document.getElementById('modal-historial'));
		if (modal) modal.hide();
		// Recargar datos del paciente
		const selectPaciente = document.getElementById('filtro-paciente-historial');
		if (selectPaciente && selectPaciente.value) {
			const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
			const pacienteSel = pacientes.find(p => Number(p.id) === Number(selectPaciente.value));
			await renderPacienteCard(pacienteSel || null);
		}
		renderHistorial();
		renderTimelinePacienteDB();
	});
	form._submitHandlerSet = true;
});

 



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
	// Log del paciente usado para recoger los datos de la tabla
	if (!pacienteIdActual) {
		tbody.innerHTML += `<tr data-dinamico="true"><td colspan="5" class="text-center text-muted">Selecciona un paciente.</td></tr>`;
		return;
	}
    const mostrarArchivadosCheckbox = document.getElementById('mostrar-archivados-historial');
    const mostrarArchivados = mostrarArchivadosCheckbox ? mostrarArchivadosCheckbox.checked : false;
    if (mostrarArchivados) {
        historialData = await ipcRenderer.invoke('historial-get-archived', pacienteIdActual);
        tbody.innerHTML = '';
		if (!historialData || historialData.length === 0) {
			tbody.innerHTML = `<tr data-dinamico="true"><td colspan="5" class="text-center text-muted">No hay entradas archivadas.</td></tr>`;
			return;
		}
    } else {
        historialData = await ipcRenderer.invoke('historial-get', pacienteIdActual);
        tbody.innerHTML = '';
		if (!historialData || historialData.length === 0) {
			tbody.innerHTML = `<tr data-dinamico="true"><td colspan="5" class="text-center text-muted">No hay entradas en el historial.</td></tr>`;
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
	const filtroProfesional = document.getElementById('filtro-profesional-historial')?.value || '';

		const idsUnicos = new Set();
		historialData.forEach((item, idx) => {
			// Filtrar por tipo de evento
			if (filtroTipoEvento && String(item.tipo_evento) !== String(filtroTipoEvento)) return;
			// Filtrar por fecha exacta
			if (filtroFecha && String(item.fecha) !== String(filtroFecha)) return;
			// Filtrar por profesional (nombre y apellidos exacto)
			if (filtroProfesional) {
				let nombreCompleto = '';
				if (item.profesional) {
					const prof = profesionales.find(p => String(p.id) === String(item.profesional));
					if (prof) {
						nombreCompleto = `${prof.nombre} ${prof.apellidos}`;
					}
				}
				if (nombreCompleto !== filtroProfesional) return;
			}
			// Evitar duplicados por id
			if (idsUnicos.has(item.id)) return;
			idsUnicos.add(item.id);
			// ...código para agregar la fila...
		

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
		if (item.profesional_id) {
			const prof = profesionales.find(p => String(p.id) === String(item.profesional_id));
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
				<td>${formatearFecha(item.fecha)}</td>
				<td>${nombreEvento}</td>
				<td>${item.motivo ? item.motivo : ''}</td>
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
    // Delegación de eventos para los botones de acción
	tbody.onclick = function(e) {
		const editBtn = e.target.closest('.btn-edit-historial');
		if (editBtn) {
			const idx = editBtn.getAttribute('data-idx');
			if (idx !== null) window.editHistorial(Number(idx));
			return;
		}
		const archiveBtn = e.target.closest('.btn-archive-historial');
		if (archiveBtn) {
			const idx = archiveBtn.getAttribute('data-idx'); 
			if (idx !== null) window.archiveHistorial(Number(idx));
			return;
		}
		const unarchiveBtn = e.target.closest('.btn-unarchive-historial');
		if (unarchiveBtn) {
			const idx = unarchiveBtn.getAttribute('data-idx');
			if (idx !== null) window.archiveHistorial(Number(idx));
			return;
		}
	};
}

// TIMELINE. Llama a la función con tus datos.
document.addEventListener('DOMContentLoaded', function() {
	renderTimelinePacienteDB();

	// Eliminado bloque que usaba historialSection no definida
});

 
// Evento. Botón de añadir entrada al historial clínico. 
document.getElementById('btn-add-historial').addEventListener('click', function() {
	cargarProfesionalesEnHistorial();
	document.getElementById('form-historial').reset();
	const idHistorialElem2 = document.getElementById('id-historial');
	if (idHistorialElem2) idHistorialElem2.value = '';
	const select = document.getElementById('filtro-paciente-historial');
	const nombreSpan = document.getElementById('modalHistorialPaciente');
	const avatarImg = document.getElementById('modalHistorialAvatar');
	if (select && nombreSpan) {
		const selectedOption = select.options[select.selectedIndex];
		if (selectedOption) {
			nombreSpan.textContent = `Paciente: ${selectedOption.textContent}`;
			// Si tienes el avatar, actualízalo aquí:
			// avatarImg.src = ...;
		} else {
			nombreSpan.textContent = 'Paciente: [No seleccionado]';
		}
	}
	// Establecer la fecha por defecto en hoy
	const fechaInput = document.getElementById('fecha-historial');
	if (fechaInput) {
		const hoy = new Date();
		const yyyy = hoy.getFullYear();
		const mm = String(hoy.getMonth() + 1).padStart(2, '0');
		const dd = String(hoy.getDate()).padStart(2, '0');
		fechaInput.value = `${yyyy}-${mm}-${dd}`;
	}
});

// Editar Registro del historial
window.editHistorial = async function(idx) {
	await cargarProfesionalesEnHistorial();
	const item = historialData[idx];
	// Seleccionar profesional en select y Choices.js
	const profElem = document.getElementById('profesional-historial');
	const profesionalId = typeof item.profesional_id !== 'undefined' ? String(item.profesional_id) : (typeof item.profesional !== 'undefined' ? String(item.profesional) : '');
	if (profElem) {
		const optionExists = Array.from(profElem.options).some(opt => String(opt.value) === profesionalId);
		if (optionExists) {
			profElem.value = profesionalId;
			if (profElem.choicesInstance) {
				profElem.choicesInstance.setChoiceByValue(profesionalId);
			}
		} else {
			profElem.selectedIndex = 0;
			if (profElem.choicesInstance) {
				profElem.choicesInstance.setChoiceByValue(profElem.options[0].value);
			}
			mostrarMensaje('El profesional original de la entrada no existe. Se ha seleccionado el primero disponible.', 'warning');
		}
	}
	// Asignar el motivo real de la entrada al input
	const motivoInput = document.getElementById('motivo-historial');
	if (motivoInput && typeof item.motivo !== 'undefined') {
		motivoInput.value = item.motivo;
	}
	// Asignar las notas reales de la entrada al textarea
	const notasInput = document.getElementById('notas-historial');
	if (notasInput && typeof item.notas !== 'undefined') {
		notasInput.value = item.notas;
	}

	// Asignar la fecha real de la entrada al input
	const fechaInput = document.getElementById('fecha-historial');
	if (fechaInput && item.fecha) {
		fechaInput.value = item.fecha;
	}
    // Seleccionar Tipo de Evento en select y Choices.js
    setTimeout(() => {
        const tipoEventoElem = document.getElementById('tipo-historial-etiqueta');
        if (tipoEventoElem) {
            const optionExists = Array.from(tipoEventoElem.options).some(opt => String(opt.value) === String(item.tipo_evento));
            if (optionExists) {
                tipoEventoElem.value = item.tipo_evento;
                if (tipoEventoElem.choicesInstance) {
                    tipoEventoElem.choicesInstance.setChoiceByValue(item.tipo_evento);
                }
            } else {
                tipoEventoElem.selectedIndex = 0;
                if (tipoEventoElem.choicesInstance) {
                    tipoEventoElem.choicesInstance.setChoiceByValue(tipoEventoElem.options[0].value);
                }
                mostrarMensaje('El tipo de evento original no existe. Se ha seleccionado el primero disponible.', 'warning');
            }
        }
        // Seleccionar Diagnóstico en select y Choices.js
        const diagEtiquetaElem = document.getElementById('diagnostico-historial-etiqueta');
        if (diagEtiquetaElem) {
            const optionExists = Array.from(diagEtiquetaElem.options).some(opt => String(opt.value) === String(item.diagnostico));
            if (optionExists) {
                diagEtiquetaElem.value = item.diagnostico;
                if (diagEtiquetaElem.choicesInstance) {
                    diagEtiquetaElem.choicesInstance.setChoiceByValue(item.diagnostico);
                }
            } else {
                diagEtiquetaElem.selectedIndex = 0;
                if (diagEtiquetaElem.choicesInstance) {
                    diagEtiquetaElem.choicesInstance.setChoiceByValue(diagEtiquetaElem.options[0].value);
                }
                mostrarMensaje('El diagnóstico original no existe. Se ha seleccionado el primero disponible.', 'warning');
            }
        }
    }, 0);
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

// Archivar registro del historial
window.archiveHistorial = async function(idx) {
	const item = historialData[idx];
	if (confirm('¿Seguro que quieres archivar esta entrada?')) {
		await ipcRenderer.invoke('historial-archive', item.id);
		renderHistorial();
	}
};

// Evento para cambiar la foto de perfil del paciente
avatar.addEventListener('change', async function() {
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
// Evento para el select del paciente principal
seleccionar_paciente_principal.addEventListener('change', async function() {
	// Eliminado: event listener duplicado
});

// Boton de infecciones / incidencias.
document.addEventListener('DOMContentLoaded', function() {
	// Inicializar tooltips Bootstrap
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
	tooltipTriggerList.map(function(tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl);
	});

	// Event handler para el botón de infecciones
	var btnInfeccion = document.getElementById('btn-historial-add-infeccion');
	if (btnInfeccion) {
		btnInfeccion.addEventListener('click', function() {
		abrirMenuInfecciones();
		});
	}

	// Event handler para el botón de incidencias (puedes añadir funcionalidad aquí)
	var btnIncidencia = document.getElementById('btn-historial-add-incidencia');
	if (btnIncidencia) {
		btnIncidencia.addEventListener('click', function() {
		// Handler para guardar incidencia
		const formIncidencia = document.getElementById('form-incidencia');
		if (formIncidencia && !formIncidencia._submitHandlerSet) {
			formIncidencia.addEventListener('submit', async function(e) {
				e.preventDefault();
				const selectPaciente = document.getElementById('filtro-paciente-historial');
				const pacienteId = selectPaciente && selectPaciente.value ? Number(selectPaciente.value) : null;
				const tipoIncidenciaId = document.getElementById('incidenciaTipo')?.value || '';
				const fecha = document.getElementById('incidenciaFecha')?.value || '';
				const medidas = document.getElementById('incidenciaMedidas')?.value || '';
				let tipoAccesoId = null;
				let etiquetaId = null;
				await ipcRenderer.invoke('get-pacientes-completos').then(pacientes => {
					const pacienteSel = pacientes.find(p => Number(p.id) === pacienteId);
					if (pacienteSel && pacienteSel.tipo_acceso) {
						tipoAccesoId = pacienteSel.tipo_acceso.id;
					}
				});
				// El campo tipo es el nombre del tipo de incidencia (no el id)
				let tipoIncidenciaNombre = '';
				if (window.etiquetasGlobales && tipoIncidenciaId) {
					const tag = window.etiquetasGlobales.find(t => String(t.id) === String(tipoIncidenciaId));
					if (tag) {
						tipoIncidenciaNombre = tag.nombre;
						etiquetaId = tag.id;
					}
				}
				if (!pacienteId || !tipoIncidenciaNombre || !fecha) {
					alert('Faltan datos obligatorios.');
					return;
				}
				// Construir objeto incidencia según la tabla
				const nuevaIncidencia = {
					paciente_id: pacienteId,
					tipo_acceso_id: tipoAccesoId,
					fecha: fecha,
					tipo: tipoIncidenciaNombre,
					medidas: medidas,
					etiqueta_id: etiquetaId,
					activo: 1
				};
				// Guardar en la base de datos
				const resultado = await ipcRenderer.invoke('incidencias-modal-add', nuevaIncidencia);
				if (resultado && resultado.success) {
					mostrarMensaje('Incidencia guardada correctamente', 'success');
					// Cerrar el modal
					var modalIncidencia = document.getElementById('modal-incidencia');
					if (modalIncidencia) {
						var modal = bootstrap.Modal.getInstance(modalIncidencia);
						if (modal) modal.hide();
					}
					// Actualizar historial si es necesario
					renderHistorial();
				} else {
					mostrarMensaje('Error al guardar la incidencia', 'danger');
				}
			});
			formIncidencia._submitHandlerSet = true;
		}
		// Limpiar campos al cerrar el modal de incidencias
		var modalIncidencia = document.getElementById('modal-incidencia');
		if (modalIncidencia) {
			modalIncidencia.addEventListener('hidden.bs.modal', function() {
				const incidenciaTipoSelect = document.getElementById('incidenciaTipo');
				const fechaInput = document.getElementById('incidenciaFecha');
				const medidasInput = document.getElementById('incidenciaMedidas');
				const accesoIcono = document.getElementById('incidenciaAccesoIcono');
				const accesoNombre = document.getElementById('incidenciaAccesoNombre');
				const accesoDescripcion = document.getElementById('incidenciaAccesoDescripcion');
				if (incidenciaTipoSelect) incidenciaTipoSelect.selectedIndex = -1;
				if (fechaInput) fechaInput.value = '';
				if (medidasInput) medidasInput.value = '';
				if (accesoIcono) accesoIcono.textContent = '';
				if (accesoNombre) accesoNombre.textContent = '';
				if (accesoDescripcion) accesoDescripcion.textContent = '';
			});
		}
		// Establecer la fecha del modal en el día de hoy
		const fechaInput = document.getElementById('incidenciaFecha');
		if (fechaInput) {
			const hoy = new Date();
			const yyyy = hoy.getFullYear();
			const mm = String(hoy.getMonth() + 1).padStart(2, '0');
			const dd = String(hoy.getDate()).padStart(2, '0');
			fechaInput.value = `${yyyy}-${mm}-${dd}`;
		}
			// Rellenar selectores cada vez que se abre el modal
			const incidenciaTipoSelect = document.getElementById('incidenciaTipo');
			const incidenciaAccesoSelect = document.getElementById('incidenciaAcceso');
			// Rellenar tipos de incidencia desde etiquetas tipo 'incidencia'
			if (incidenciaTipoSelect && window.etiquetasGlobales) {
				incidenciaTipoSelect.innerHTML = '';
				window.etiquetasGlobales.filter(tag => tag.tipo === 'incidencia').forEach(tag => {
					const option = document.createElement('option');
					option.value = tag.id;
					option.innerHTML = `${tag.icono ? `<i class='${tag.icono}'></i> ` : ''}${tag.nombre}`;
					incidenciaTipoSelect.appendChild(option);
				});
			}
			// Mostrar log y rellenar el textbox de tipo de acceso
			const select = document.getElementById('filtro-paciente-historial');
			let pacienteId = select && select.value ? Number(select.value) : null;
	const accesoIcono = document.getElementById('incidenciaAccesoIcono');
	const accesoNombre = document.getElementById('incidenciaAccesoNombre');
	const accesoDescripcion = document.getElementById('incidenciaAccesoDescripcion');
			if (pacienteId) {
				ipcRenderer.invoke('get-pacientes-completos').then(pacientes => {
					const pacienteSel = pacientes.find(p => Number(p.id) === pacienteId);
					if (pacienteSel && pacienteSel.tipo_acceso) {
						if (accesoIcono) accesoIcono.textContent = pacienteSel.tipo_acceso.icono || '';
						if (accesoNombre) accesoNombre.textContent = pacienteSel.tipo_acceso.nombre || '';
						if (accesoDescripcion) accesoDescripcion.textContent = pacienteSel.tipo_acceso.descripcion || '';
					} else {
						if (accesoIcono) accesoIcono.textContent = '';
						if (accesoNombre) accesoNombre.textContent = '';
						if (accesoDescripcion) accesoDescripcion.textContent = '';
					}
				});
			} else {
				if (accesoInput) accesoInput.value = '';
				console.log('No hay paciente seleccionado.');
			}
			// Abre el modal profesional de incidencias
			var modalIncidencia = document.getElementById('modal-incidencia');
			if (modalIncidencia) {
				var modal = new bootstrap.Modal(modalIncidencia);
				modal.show();
			}
		});
	}
});

/*****************************/
/*        FUNCIONES         */
/*****************************/

// Formatear fecha
function formatearFecha(fechaStr) {
	if (!fechaStr) return '';
	const partes = fechaStr.split('-');
	if (partes.length === 3) {
		return `${partes[2]}-${partes[1]}-${partes[0]}`;
	}
	return fechaStr;
}

// Renderizar timeline visual de eventos clínicos recientes
function renderTimelinePaciente(eventos) {
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

// Timeline dinámico con datos reales
async function renderTimelinePacienteDB() {
	const timeline = document.getElementById('timelinePaciente');
	const select = document.getElementById('filtro-paciente-historial');
	const pacienteIdActual = select && select.value ? Number(select.value) : null;
	if (!pacienteIdActual) {
		timeline.innerHTML = '<div class="text-muted">Selecciona un paciente para ver el timeline.</div>';
		return;
	}
	// Obtener historial clínico real
	const historial = await ipcRenderer.invoke('historial-get', pacienteIdActual);
	if (!historial || historial.length === 0) {
		timeline.innerHTML = '<div class="text-muted">No hay eventos clínicos para este paciente.</div>';
		return;
	}
	// Renderizar timeline con estilo visual
	timeline.innerHTML = '';
	historial.forEach(item => {
		let icono = 'bi bi-calendar-event';
		let colorClass = 'primary';
		if (item.tipo_evento) {
			const tipo = String(item.tipo_evento).toLowerCase();
			if (tipo.includes('consulta')) { icono = 'bi bi-person-badge'; colorClass = 'primary'; }
			else if (tipo.includes('laboratorio')) { icono = 'bi bi-flask'; colorClass = 'info'; }
			else if (tipo.includes('incidencia')) { icono = 'bi bi-exclamation-diamond'; colorClass = 'danger'; }
			else if (tipo.includes('tratamiento')) { icono = 'bi bi-capsule'; colorClass = 'success'; }
			else if (tipo.includes('control')) { icono = 'bi bi-calendar-check'; colorClass = 'secondary'; }
			else if (tipo.includes('observación')) { icono = 'bi bi-eye'; colorClass = 'warning'; }
			else if (tipo.includes('actualización')) {
				// Si es actualización de datos personales, color verde y icono diferente
				if (tipo.includes('datos personales')) {
					icono = 'bi bi-person-lines-fill';
					colorClass = 'success';
				} else {
					icono = 'bi bi-arrow-repeat';
					colorClass = 'info';
				}
			}
		}
		// Si contiene "actualización" en el tipo_evento, aseguramos que la palabra esté presente
		let tipoEventoMostrar = item.tipo_evento;
		if (String(item.tipo_evento).toLowerCase().includes('actualización') && !item.tipo_evento.includes('Actualización')) {
			tipoEventoMostrar = 'Actualización de ' + item.tipo_evento.replace(/actualización de /i, '');
		}
		timeline.innerHTML += `
			<div class="card shadow-sm border-0 mb-2 timeline-event bg-light">
				<div class="card-body d-flex align-items-center" style="gap: 0.75rem;">
					<span class="icon-circle bg-${colorClass} text-white flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 42px; height: 42px; font-size:1.5em;">
						<i class="${icono}"></i>
					</span>
					<div class="flex-grow-1" style="min-width:0;">
						<div class="fw-bold text-${colorClass}" style="word-break:break-word;">${tipoEventoMostrar ? tipoEventoMostrar : 'Evento'} - ${formatearFecha(item.fecha)}</div>
						<div style="word-break:break-word;">${item.motivo ? item.motivo : ''}</div>
					</div>
				</div>
			</div>
		`;
	});
}

// Llamar al timeline dinámico al cargar y al cambiar paciente

document.addEventListener('DOMContentLoaded', function() {
    renderTimelinePacienteDB();
});

document.getElementById('filtro-paciente-historial').addEventListener('change', renderTimelinePacienteDB);

// Función para abrir el menú / modal de infecciones
function abrirMenuInfecciones() {
    var modal = modal_infeccion;
    // Guardar el origen del modal en una variable global
    window.origenModalInfeccion = 'historial'; // Puedes cambiar este valor desde otra sección si lo usas allí
    // Limpiar modal
	limpiarModalInfecciones();
	if (modal) {
        // Cargar etiquetas de tipo infección antes de mostrar el modal
        var select = infeccion_tags;
        if (select) {
            select.innerHTML = '';
            if (window.etiquetasGlobales && Array.isArray(window.etiquetasGlobales)) {
                window.etiquetasGlobales.forEach(function(etiqueta) {
                    if (etiqueta.tipo === 'infeccion' || etiqueta.tipo === 'infección') {
                        var option = document.createElement('option');
                        option.value = etiqueta.id;
                        if (etiqueta.icono) {
                            option.textContent = `${etiqueta.icono} ${etiqueta.nombre}`;
                        } else {
                            option.textContent = etiqueta.nombre;
                        }
                        select.appendChild(option);
                    }
                });
            }
        }
        window.infeccionesTemp = [];
        if (listaInfeccion) listaInfeccion.innerHTML = '';
        var modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        alert('No se encontró el modal de infección.');
    }
}

// Limpiar el modal de Infecciones
function limpiarModalInfecciones(){
	// Limpiar comentarios y lista de infecciones
	if (comentariosInput) comentariosInput.value = '';
	if (listaInfeccion) listaInfeccion.innerHTML = '';
	// Poner la fecha actual por defecto en el campo de fecha de infección
	if (fechaInput) {
		var hoy = new Date();
		var yyyy = hoy.getFullYear();
		var mm = String(hoy.getMonth() + 1).padStart(2, '0');
		var dd = String(hoy.getDate()).padStart(2, '0');
		fechaInput.value = `${yyyy}-${mm}-${dd}`;
	}
	if(btn_guardar_infecciones) btn_guardar_infecciones.classList.add('d-none');
	// Limpiar variable de infecciones añadidas
	if (window.infeccionesTemp) window.infeccionesTemp = [];
}

// FILTROS: Poblar filtro de profesional en la tabla (única función, con avatar y Choices.js)
async function poblarFiltroProfesionalHistorial() {
    filtro_profesional_historial.innerHTML = '';
    // Opción por defecto 'Todos'
    const optionTodos = document.createElement('option');
    optionTodos.value = '';
    optionTodos.textContent = 'Todos';
    filtro_profesional_historial.appendChild(optionTodos);

    const profesionales = await obtenerProfesionales();
    profesionales.forEach((prof) => {
        const opt = document.createElement('option');
        opt.value = `${prof.nombre} ${prof.apellidos}`;
        opt.textContent = `${prof.nombre} ${prof.apellidos}`;
        opt.setAttribute('data-custom-properties', JSON.stringify({
            avatar: prof.avatar && prof.avatar !== '' ? prof.avatar : '../assets/avatar-default.png'
        }));
        filtro_profesional_historial.appendChild(opt);
    });

    // Inicializar Choices.js para mostrar lista desplegable mejorada con avatar
    if (filtro_profesional_historial.choicesInstance) {
        filtro_profesional_historial.choicesInstance.destroy();
        filtro_profesional_historial.choicesInstance = null;
    }
    if (window.Choices) {
        filtro_profesional_historial.choicesInstance = new Choices(filtro_profesional_historial, {
            searchEnabled: false,
            itemSelectText: '',
            callbackOnCreateTemplates: function(template) {
                return {
                    choice: (classNames, data) => {
                        let avatar = '';
                        if (data.customProperties && data.customProperties.avatar) {
                            avatar = `<img src='${data.customProperties.avatar}' class='rounded-circle me-2' style='width:18px;height:18px;object-fit:cover;margin-right:8px;'>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.itemChoice}' style='padding:4px 10px;border-bottom:1px solid #eee;display:flex;align-items:center;' data-select-text='${this.config.itemSelectText}' data-choice ${data.disabled ? "data-choice-disabled aria-disabled='true'" : ''} data-id='${data.id}' data-value='${data.value}' ${data.groupId > 0 ? "role='treeitem'" : "role='option'"}>${avatar}${data.label}</div>`;
                        return template(html);
                    },
                    item: (classNames, data) => { 
                        let avatar = '';
                        if (data.customProperties && data.customProperties.avatar) {
                            avatar = `<img src='${data.customProperties.avatar}' class='rounded-circle' style='width:18px;height:18px;object-fit:cover;margin-right:2px;'>`;
                        }
                        const html = `<div class='${classNames.item} ${classNames.highlighted}' style='display:flex;align-items:center;' data-item data-id='${data.id}' data-value='${data.value}' ${data.active ? "aria-selected='true'" : ''} ${data.disabled ? "aria-disabled='true'" : ''}>${avatar}${data.label}</div>`;
                        return template(html);
                    }
                };
            }
        });
    }
}


// FILTROS: Poblar filtro de fecha en la tabla
async function poblarFiltroFechaHistorial() {
	if (!filtro_fecha_historial) return;
	filtro_fecha_historial.innerHTML = '';
	// Opción para mostrar todas
	const optTodos = document.createElement('option');
	optTodos.value = '';
	optTodos.textContent = 'Todas';
	filtro_fecha_historial.appendChild(optTodos);
	// Obtener historial del paciente seleccionado
	const pacienteSelect = document.getElementById('filtro-paciente-historial');
	const pacienteIdActual = pacienteSelect && pacienteSelect.value ? Number(pacienteSelect.value) : null;
	if (!pacienteIdActual) return;
	let historial = await ipcRenderer.invoke('historial-get', pacienteIdActual);
	// Extraer fechas únicas y ordenarlas
	const fechasUnicas = [...new Set(historial.map(item => item.fecha))].sort();
	fechasUnicas.forEach(fecha => {
		const opt = document.createElement('option');
		opt.value = fecha;
		opt.textContent = formatearFecha(fecha);
		filtro_fecha_historial.appendChild(opt);
	});
}

// Poblar el select de profesionales en el modal de historial
async function cargarProfesionalesEnHistorial() {
	if (!select_profesional_historial) return;
	select_profesional_historial.innerHTML = '';
		const profesionales = await obtenerProfesionales();
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
		if (select_profesional_historial.choicesInstance) {
			select_profesional_historial.choicesInstance.destroy();
			select_profesional_historial.choicesInstance = null;
		}
		// Crear opciones en el select
		options.forEach(opt => {
			const optionElem = document.createElement('option');
			optionElem.value = opt.value;
			optionElem.textContent = opt.label;
			if (opt.disabled) optionElem.disabled = true;
			if (opt.selected) optionElem.selected = true;
			if (opt.customProperties) optionElem.setAttribute('data-custom-properties', JSON.stringify(opt.customProperties));
			select_profesional_historial.appendChild(optionElem);
		});
		// Inicializar Choices con template personalizado para mostrar avatar
		select_profesional_historial.choicesInstance = new Choices(select_profesional_historial, {
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

// Función para obtener profesionales registrados
async function obtenerProfesionales() {
	// IPC call para obtener profesionales desde el backend
	profesionales = await ipcRenderer.invoke('get-profesionales');
	return profesionales;
}

// Obtener pacientes completos
async function obtenerPacientesCompletos() {
	const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
	return pacientes || [];
}

async function cargarPacientesHistorial() {
if (!seleccionar_paciente_principal) return;
	const pacientes = await obtenerPacientesCompletos();
	seleccionar_paciente_principal.innerHTML = '';
	if (!pacientes || pacientes.length === 0) {
		console.warn('No se recibieron pacientes para el filtro.');
	}
	pacientes.forEach(p => {
		const opt = document.createElement('option');
		opt.value = Number(p.id) > 0 ? Number(p.id) : '';
		opt.textContent = `${p.nombre} ${p.apellidos}`;
		seleccionar_paciente_principal.appendChild(opt);
	});
	// Seleccionar el primero por defecto solo si no hay ninguno seleccionado
	if (pacientes.length > 0 && !seleccionar_paciente_principal.value) {
		pacienteId = pacientes[0].id;
		seleccionar_paciente_principal.value = pacienteId;
		paciente_seleccionado = pacientes[0];
	}
}

window.cargarPacientesHistorial = cargarPacientesHistorial;
	

window.renderPacienteCard = async function(paciente) {
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
	const tipoAccesoElem = document.getElementById('paciente-tipoacceso-info');
	// Definir historia correctamente para evitar ReferenceError
	const historia = document.getElementById('pacienteHistoria');  

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
	let iconosInfeccion = '';
	if (Array.isArray(paciente.infecciones) && paciente.infecciones.length > 0) {
		paciente.infecciones.forEach(inf => {
			if (inf.tag.emoji || inf.tag.icono || inf.tag.nombre) {
				const nombreInf = inf.tag.nombre ? inf.tag.nombre : 'Infección';
				if (inf.tag.emoji) {
					iconosInfeccion += inf.tag.emoji;
				} else if (inf.tag.icono) {
					iconosInfeccion += inf.tag.icono;
				}
			}
		});
	}
	nombre.innerHTML = paciente.nombre + (paciente.apellidos ? ' ' + paciente.apellidos : '') + " " + iconosInfeccion;
	// Inicializar tooltips Bootstrap para los iconos de infección
	if (nombre) {
		var tooltipTriggerList = [].slice.call(nombre.querySelectorAll('[data-bs-toggle="tooltip"]'));
		tooltipTriggerList.map(function(tooltipTriggerEl) {
			return new bootstrap.Tooltip(tooltipTriggerEl);
		});
	}
    let edad = '';
	let fechaNac = paciente.fecha_nacimiento || '';
	let acceso_final = '';
	if (paciente.tipo_acceso) {
		// Usar datos del objeto acceso si existe 
		let accesoObj = paciente.acceso || {};
		let tipoAcceso = paciente.tipo_acceso;
		let ubicacion = accesoObj.ubicacion_anatomica || paciente.ubicacion_anatomica || '';
		let lado = accesoObj.ubicacion_lado || paciente.ubicacion_lado || '';
		acceso_final = `${tipoAcceso.icono ? tipoAcceso.icono + ' ' : ''}${tipoAcceso.nombre ? tipoAcceso.nombre : ''}`;
		if (ubicacion) acceso_final += ', ' + ubicacion;
		if (lado) acceso_final += ', ' + lado;
		if (tipoAccesoElem) {
			tipoAccesoElem.textContent = acceso_final;
			tipoAccesoElem.title = tipoAcceso.descripcion || '';
		}
	} else {
		if (tipoAccesoElem) tipoAccesoElem.textContent = '';
	}
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
	let sexoNorm = (paciente.sexo || '').toString().trim().toLowerCase();
	if (sexoNorm === 'm' || sexoNorm === 'hombre') {
		sexoBadge.textContent = 'Hombre';
		sexoBadge.className = 'badge bg-primary mt-2';
		sexoBadge.style.backgroundColor = '';
	} else if (sexoNorm === 'f' || sexoNorm === 'mujer') {
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


document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-editar-paciente');
    const contenedorHistorial = document.getElementById('historial-section');
    if (btn && contenedorHistorial && contenedorHistorial.contains(btn)) {
        window.origenModalEditarPaciente = 'historial';
        // ...abrir modal de edición aquí...
    }
});

/**
 * Agrega una entrada al historial clínico del paciente según el tipo de evento.
 * @param {string|Object} evento - Puede ser un string ('Registro') o un objeto con datos.
 * Ejemplo de uso: addEntradasHistorial('Registro', { paciente_id, profesional })
 */
async function addEntradasHistorial(evento, datos = {}) {
	if (evento === 'Registro') {
		if (!datos.paciente_id) return;
		const fechaHoy = new Date();
		const yyyy = fechaHoy.getFullYear();
		const mm = String(fechaHoy.getMonth() + 1).padStart(2, '0');
		const dd = String(fechaHoy.getDate()).padStart(2, '0');
		const fecha = `${yyyy}-${mm}-${dd}`;
		let profesionalId = null;
		if (typeof datos.profesional_id !== 'undefined' && datos.profesional_id !== null && !isNaN(Number(datos.profesional_id))) {
			profesionalId = Number(datos.profesional_id);
		} else if (typeof datos.profesional !== 'undefined' && datos.profesional !== null && !isNaN(Number(datos.profesional))) {
			profesionalId = Number(datos.profesional);
		}
		const entrada = {
			paciente_id: datos.paciente_id,
			fecha: fecha,
			tipo_evento: 'Registro',
			motivo: 'Registro de nuevo paciente',
			diagnostico: null,
			tratamiento: '',
			notas: '',
			adjuntos: '',
			profesional_id: profesionalId,
		};
		await ipcRenderer.invoke('historial-add', entrada);
	}
	// Aquí puedes añadir otros tipos de evento en el futuro
}