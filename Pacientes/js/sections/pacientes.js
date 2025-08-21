const { ipcRenderer } = require('electron');

// Elementos del DOM
const tablaPacientesBody = document.querySelector('#pacientes-section tbody');
const inputBusqueda = document.getElementById('busqueda-pacientes');
const filtroTipoAcceso = document.getElementById('filtro-tipoacceso');
const filtroPendiente = document.getElementById('filtro-pendiente');
const paginacionPacientes = document.getElementById('paginacion-pacientes');
const fechaLabel = document.getElementById('labelFechaInstalacionAcceso');
const fechaInput = document.getElementById('fechaInstalacionAcceso');
const selectTipoAcceso = document.getElementById('tipoAcceso');
const selectPendiente = document.getElementById('pendiente');
const fechaLabelPend = document.getElementById('labelFechaInstalacionAccesoPendiente');
const fechaInputPend = document.getElementById('fechaInstalacionAccesoPendiente');

// Variable temporal para guardar los valores de incidencias
let incidenciaValoresTemp = {}

// Variable global temporal para infecciones añadidas en el modal
let infeccionesTemp = [];

// Variables
let pacientesGlobal = [];
let etiquetasPorId = {};
const pacientesPorPagina = 10;
let datosGlobalesCargados = false;
let profesionalesGlobal = [];
let tiposAccesoGlobal = [];
let tiposPendienteGlobal = [];
let ubicacionesGlobal = [];

// Carga los profesionales y los guarda en la variable global
async function cargarDatosGlobal() {
    profesionalesGlobal = await ipcRenderer.invoke('get-profesionales');
    tiposAccesoGlobal = await ipcRenderer.invoke('tipo-acceso-get-all');
	tiposPendienteGlobal = await ipcRenderer.invoke('pendiente-tipos-get');
    ubicacionesGlobal = await ipcRenderer.invoke('get-ubicaciones-anatomicas');
	datosGlobalesCargados = true;
}

// DOCUMENT DOM
// Captura errores JS globales y los muestra en consola y en la UI
window.addEventListener('error', function(event) {
	console.error('Error global:', event.message, event.filename, event.lineno, event.colno);
	mostrarMensaje('Error JS: ' + event.message, 'danger');
});
window.addEventListener('unhandledrejection', function(event) {
	console.error('Unhandled promise rejection:', event.reason);
	mostrarMensaje('Error promesa: ' + event.reason, 'danger');
});
// Limpia backdrops después de cerrar cualquier modal
document.addEventListener('hidden.bs.modal', function() {
	limpiarBackdropsDuplicados();
	// Ocultar campos CHD al cerrar el modal de paciente
	const chdUbicacionGroup = document.getElementById('chd-ubicacion-group');
	const chdLadoGroup = document.getElementById('chd-lado-group');
	if (chdUbicacionGroup) chdUbicacionGroup.style.display = 'none';
	if (chdLadoGroup) chdLadoGroup.style.display = 'none';
});
// Elimina backdrops duplicados de Bootstrap Modal
function limpiarBackdropsDuplicados() {
	const backdrops = document.querySelectorAll('.modal-backdrop');
	if (backdrops.length > 1) {
		console.warn(`[MODAL BACKDROP] Encontrados ${backdrops.length} backdrops, eliminando duplicados.`);
		backdrops.forEach((el, idx) => {
			if (idx > 0) el.remove();
		});
	}
}

function llenarSelectUbicacionCHD() {
    const select = document.getElementById('chd-ubicacion');
    if (!select) return;
	select.innerHTML = '<option value="">Seleccionar Ubicación</option>';
	const selectTipoAcceso = document.getElementById('accesoPendiente');
	const tipoAccesoId = selectTipoAcceso?.value;
	// Buscar el nombre real del tipo de acceso por id
	const tipoAccesoObj = tiposAccesoGlobal.find(t => String(t.id) === String(tipoAccesoId));
	const tipoAccesoNombre = tipoAccesoObj?.nombre;
	const obj = ubicacionesGlobal.find(u => u.acceso === tipoAccesoNombre);
		if (obj && Array.isArray(obj.ubicaciones)) {
			obj.ubicaciones.forEach(ubic => {
				if (ubic) {
					select.innerHTML += `<option value="${ubic}">${ubic}</option>`;
				}
			});
		}
}

// Cargar los elementos en el DOM
document.addEventListener('DOMContentLoaded', async () => {
	await cargarDatosGlobal();
	// Llenar el select de filtro de tipo de acceso en la tabla de pacientes DESPUÉS de cargar los datos globales
	if (filtroTipoAcceso) {
		filtroTipoAcceso.innerHTML = '<option value="">Todos</option>';
		if (Array.isArray(tiposAccesoGlobal)) {
			tiposAccesoGlobal.forEach(tipo => {
				let iconHtml = '';
				if (tipo.icono) {
					if (tipo.icono.startsWith('bi-')) {
						iconHtml = `<i class='bi ${tipo.icono}' style='font-size:1em;vertical-align:middle;color:${tipo.color || '#222'};'></i> `;
					} else {
						iconHtml = `<span style='font-size:1em;vertical-align:middle;color:${tipo.color || '#222'};'>${tipo.icono}</span> `;
					}
				}
				filtroTipoAcceso.innerHTML += `<option value='${tipo.id}'>${iconHtml}${tipo.nombre}</option>`;
			});
		}
	}
	await cargarDatosGlobal();
	if (document.getElementById('accesoPendiente')) {
		document.getElementById('accesoPendiente').addEventListener('change', llenarSelectUbicacionCHD);
	}
	await cargarDatosGlobal();
	cargarPacientes();
	cargarEtiquetas();
	if (selectTipoAcceso) {
		selectTipoAcceso.addEventListener('change', function() {
			llenarSelectUbicacion();
			mostrarCamposFechaAcceso();
		});
	}
	// Listener para mostrar fechaInstalacionAccesoPendiente cuando se selecciona "Retiro" en pendiente
	if (selectPendiente) {
		// Inicialmente ocultar accesoPendiente
	const accesoPendienteGroup = document.getElementById('accesoPendiente-group');
	if (accesoPendienteGroup) accesoPendienteGroup.style.display = 'none';
		selectPendiente.addEventListener('change', function() {
			// Mostrar accesoPendiente solo si la opción seleccionada NO es 'No Pendiente'
			if (accesoPendienteGroup) {
				if (selectPendiente.selectedIndex === 0) {
					accesoPendienteGroup.style.display = 'none';
				} else {
					accesoPendienteGroup.style.display = '';
				}
			}
			mostrarCamposFechaAcceso();
		});
	}
	displayCamposCHD();

	// Listeners para filtros de la tabla pacientes
	if (inputBusqueda) {
		inputBusqueda.addEventListener('input', actualizarTablaPacientes);
	}
	if (filtroTipoAcceso) {
		filtroTipoAcceso.addEventListener('change', actualizarTablaPacientes);
	}
	if (filtroPendiente) {
		filtroPendiente.addEventListener('change', actualizarTablaPacientes);
	}
});

function displayCamposCHD(){
	// Mostrar/ocultar campos CHD y fechaInstalacionAccesoPendiente según selección de accesoPendiente y pendiente
	const accesoPendienteSelect = document.getElementById('accesoPendiente');
	const chdUbicacionGroup = document.getElementById('chd-ubicacion-group');
	const chdLadoGroup = document.getElementById('chd-lado-group');
	const fechaLabelPend = document.getElementById('labelFechaInstalacionAccesoPendiente');
	const fechaInputPend = document.getElementById('fechaInstalacionAccesoPendiente');
	// Buscar id de tipo acceso CHD y FAV en tiposAccesoGlobal
	let chdTipoAccesoId = null;
	let favTipoAccesoId = null;
	if (Array.isArray(tiposAccesoGlobal)) {
		const chdTipo = tiposAccesoGlobal.find(tipo => tipo.nombre && tipo.nombre.toLowerCase().includes('catéter'));
		if (chdTipo) chdTipoAccesoId = String(chdTipo.id);
		const favTipo = tiposAccesoGlobal.find(tipo => tipo.nombre && (tipo.nombre.toLowerCase().includes('fístula') || tipo.nombre.toLowerCase().includes('fav')));
		if (favTipo) favTipoAccesoId = String(favTipo.id);
	}
	if (chdUbicacionGroup && chdLadoGroup && accesoPendienteSelect && fechaLabelPend && fechaInputPend) {
		chdUbicacionGroup.style.display = 'none';
		chdLadoGroup.style.display = 'none';
		fechaLabelPend.style.display = 'none';
		fechaInputPend.style.display = 'none';
		const pendienteSelect = document.getElementById('pendiente');
		function mostrarCamposCHD() {
			const accesoCateter = chdTipoAccesoId && accesoPendienteSelect.value === chdTipoAccesoId;
			const accesoFAV = favTipoAccesoId && accesoPendienteSelect.value === favTipoAccesoId;
			const pendienteRetiro = pendienteSelect && pendienteSelect.options[pendienteSelect.selectedIndex]?.text?.toLowerCase().includes('retiro');
			const pendienteMaduracion = pendienteSelect && pendienteSelect.options[pendienteSelect.selectedIndex]?.text?.toLowerCase().includes('maduración');
			if ((accesoCateter && pendienteRetiro) || (accesoFAV && pendienteMaduracion)) {
				chdUbicacionGroup.style.display = '';
				chdLadoGroup.style.display = '';
				fechaLabelPend.style.display = '';
				fechaInputPend.style.display = '';
				// Mostrar fechaPrimeraPuncion también
				const labelFechaPrimeraPuncion = document.getElementById('labelFechaPrimeraPuncion');
				const fechaPrimeraPuncion = document.getElementById('fechaPrimeraPuncion');
				if (labelFechaPrimeraPuncion) labelFechaPrimeraPuncion.style.display = '';
				if (fechaPrimeraPuncion) fechaPrimeraPuncion.style.display = '';
			} else {
				chdUbicacionGroup.style.display = 'none';
				chdLadoGroup.style.display = 'none';
				fechaLabelPend.style.display = 'none';
				fechaInputPend.style.display = 'none';
				// Ocultar fechaPrimeraPuncion también
				const labelFechaPrimeraPuncion = document.getElementById('labelFechaPrimeraPuncion');
				const fechaPrimeraPuncion = document.getElementById('fechaPrimeraPuncion');
				if (labelFechaPrimeraPuncion) labelFechaPrimeraPuncion.style.display = 'none';
				if (fechaPrimeraPuncion) fechaPrimeraPuncion.style.display = 'none';
			}
		}
	accesoPendienteSelect.addEventListener('change', mostrarCamposCHD);
	if (pendienteSelect) pendienteSelect.addEventListener('change', mostrarCamposCHD);
	mostrarCamposCHD();
	}
}


// Función para actualizar la tabla de pacientes (evita ReferenceError)
function actualizarTablaPacientes() {
	const filtrados = filtrarPacientes();
	const total = filtrados.length;
	const inicio = (paginaActual - 1) * pacientesPorPagina;
	const fin = inicio + pacientesPorPagina;
	renderizarPacientes(filtrados.slice(inicio, fin));
	renderizarPaginacion(total);
}


// Listener para el botón 'Nuevo paciente'
const btnNuevoPaciente = document.querySelector('.btn-nuevo-paciente');
if (btnNuevoPaciente) {
    btnNuevoPaciente.addEventListener('click', async () => {
        if (!datosGlobalesCargados) await cargarDatosGlobal();    
        limpiarCamposNuevoPaciente();
        llenarSelectProfesional();
        llenarSelectTipoAcceso();
        llenarSelectUbicacion();
        llenarSelectPendiente();
	});
	if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
}

// Handler global para los botones de la tabla
document.addEventListener('click', async function(e) {
	// Botón de archivar
	const btnArchivar = e.target.closest('.btn-archivar');
	if (btnArchivar) {
		const pacienteId = btnArchivar.getAttribute('data-id');
		if (!pacienteId) return;
		// Obtener datos del paciente para el mensaje
		const paciente = pacientesGlobal.find(p => p.id == pacienteId);
		const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellidos}` : `ID ${pacienteId}`;
		await ipcRenderer.invoke('archivar-paciente', Number(pacienteId));
		// Validar que paciente_id es válido antes de enviar la notificación
		const pacienteIdValidoArchivar = pacienteId && !isNaN(Number(pacienteId)) && Number(pacienteId) > 0;
		if (pacienteIdValidoArchivar) {
			await ipcRenderer.invoke('notificaciones-add', {
				tipo: 'Pacientes',
				mensaje: `Se archivó el paciente ${nombreCompleto}`,
				fecha: new Date().toISOString(),
				usuario_id: null,
				paciente_id: pacienteId,
				extra: ''
			});
		} else {
			console.warn('[DEBUG] Notificación NO enviada: paciente_id inválido', pacienteId);
		}
		if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
		cargarPacientes();
		mostrarMensaje(`Paciente archivado correctamente: <b>${nombreCompleto}</b>`, 'info');
		// Actualizar cards del dashboard
		if (window.cargarDatosDashboard) window.cargarDatosDashboard();
		return;
	}
	// Botón de eliminar
	const btnEliminar = e.target.closest('.btn-eliminar');
	if (btnEliminar) {
		const pacienteId = btnEliminar.getAttribute('data-id');
		if (!pacienteId) return;
		// Obtener datos del paciente para el mensaje
		const paciente = pacientesGlobal.find(p => p.id == pacienteId);
		const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellidos}` : `ID ${pacienteId}`;
		// Validar que paciente_id es válido antes de enviar la notificación
		const pacienteIdValido = pacienteId && !isNaN(Number(pacienteId)) && Number(pacienteId) > 0;
		if (pacienteIdValido) {
			// Buscar profesional_id válido del paciente si existe
			let usuarioId = null;
			if (paciente && paciente.profesional_id && !isNaN(Number(paciente.profesional_id)) && Number(paciente.profesional_id) > 0) {
				usuarioId = paciente.profesional_id;
			} else {
				usuarioId = 0; // Valor seguro si la base lo permite, si no, omitir el campo
			}
			const notificacionPayload = {
				tipo: 'Pacientes',
				mensaje: `Se eliminó el paciente ${nombreCompleto}`,
				fecha: new Date().toISOString(),
				usuario_id: usuarioId,
				paciente_id: pacienteId,
				extra: `Nombre: ${nombreCompleto}`
			};
			console.log('[DEBUG][notificaciones-add][eliminar] Payload:', notificacionPayload);
			await ipcRenderer.invoke('notificaciones-add', notificacionPayload);
		} else {
			console.warn('[DEBUG] Notificación NO enviada: paciente_id inválido', pacienteId);
		}
		await ipcRenderer.invoke('delete-paciente', Number(pacienteId));
		cargarPacientes();
		const modalEl = document.getElementById('modal-paciente');
		let modalInstance = bootstrap.Modal.getInstance(modalEl);
		if (modalInstance) {
			modalInstance.hide();
		}
		mostrarMensaje(`Paciente eliminado correctamente: <b>${nombreCompleto}</b>`, 'success');
		// Actualizar cards del dashboard
		if (window.cargarDatosDashboard) window.cargarDatosDashboard();
		if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
		return;
	}
	// Botón de infección
	const btnInfeccion = e.target.closest('.btn-infeccion');
	if (btnInfeccion) {
		const pacienteId = btnInfeccion.getAttribute('data-id');
		if (!pacienteId) return;
		// Guardar el id del paciente para la infección
		window.pacienteInfeccionId = pacienteId;
		// Limpiar campos del modal
		document.getElementById('infeccion-tags').innerHTML = '';
		// Poner la fecha actual por defecto en el campo de fecha de incidencia
		const fechaInput = document.getElementById('infeccion-fecha');
		if (fechaInput) {
			const hoy = new Date();
			const yyyy = hoy.getFullYear();
			const mm = String(hoy.getMonth() + 1).padStart(2, '0');
			const dd = String(hoy.getDate()).padStart(2, '0');
			fechaInput.value = `${yyyy}-${mm}-${dd}`;
		}
		document.getElementById('infeccion-comentarios').value = '';
		document.getElementById('infeccion-lista').innerHTML = '';
		// Cargar tags de tipo infección
		const tags = await ipcRenderer.invoke('tags-get-all');
		const tagsInfeccion = tags.filter(tag => tag.tipo && tag.tipo.toLowerCase() === 'infeccion');
		const select = document.getElementById('infeccion-tags');
		tagsInfeccion.forEach(tag => {
			const opt = document.createElement('option');
			opt.value = tag.id;
			opt.textContent = tag.icono ? tag.icono + ' ' + tag.nombre : tag.nombre;
			opt.setAttribute('data-color', tag.color || '#1976d2');
			select.appendChild(opt);
		});
		// Mostrar el modal
		abrirMenuInfeccionesDesdePacientes(pacienteId);
		
		// Limpiar infecciones temporales al abrir el modal de infección
		infeccionesTemp = [];
	}
});

// Handler para el botón de editar paciente
document.addEventListener('click', async function(e) {
    const btn = e.target.closest('.btn-editar-paciente');
    const contenedorPacientes = document.getElementById('pacientes-section');
    if (btn && contenedorPacientes && contenedorPacientes.contains(btn)) {
        window.origenModalEditarPaciente = 'pacientes';
        // Eliminar cualquier listener previo para evitar duplicados
		btn.replaceWith(btn.cloneNode(true));
		// Seleccionar el nuevo botón clonado
		const newBtn = document.querySelector(`.btn-editar-paciente[data-id='${btn.getAttribute('data-id')}']`);
		// Continuar con la lógica normal usando newBtn
		const pacienteId = newBtn.getAttribute('data-id');
		if (!pacienteId) return;
		if (!datosGlobalesCargados) await cargarDatosGlobal();    
		limpiarCamposNuevoPaciente();
		llenarSelectProfesional();
		llenarSelectTipoAcceso();
		llenarSelectUbicacion();
		llenarSelectPendiente();
		const paciente = await ipcRenderer.invoke('paciente-get-con-acceso', Number(pacienteId));
		if (!paciente) return;
		window.pacienteEditando = paciente;
		const etiquetasActivasContainer = document.getElementById('etiquetas-activas-container');
		etiquetasActivasContainer.innerHTML = '<label for="etiquetas-activas-container" class="form-label"><i class="bi bi-tag-fill me-1"></i> Etiquetas Activas</label>';
		const incidencias = await ipcRenderer.invoke('paciente-get-incidencias', paciente.id);
		let badgesHtml = '';
		if (Array.isArray(paciente.etiquetas) && paciente.etiquetas.length > 0) {
			badgesHtml = paciente.etiquetas.map(id => {
				const tag = etiquetasPorId[id];
				if (!tag || tag.tipo !== 'incidencia') return '';
				const incidencia = incidencias.find(inc => String(inc.etiqueta_id) === String(id) && inc.activo);
				let fecha = '';
				let accesoBadge = '';
				if (incidencia) {
					if (incidencia.fecha) {
						const match = incidencia.fecha.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
						if (match) fecha = `${match[3]}/${match[2]}/${match[1]}`;
						else fecha = incidencia.fecha;
					}
					let accesoObj = null;
					if (incidencia.tipo_acceso_id) {
						accesoObj = tiposAccesoGlobal.find(t => String(t.id) === String(incidencia.tipo_acceso_id));
						if (accesoObj) {
							const colorCateter = '#5dade2CC';
							const badgeColor = accesoObj.nombre === 'Catéter' ? colorCateter : `${accesoObj.color}CC`;
							accesoBadge = `<span class='badge' style='background:linear-gradient(270deg,#f8f9faCC 0%,${badgeColor} 100%);color:#222;font-size:1em;padding:4px 14px 4px 10px;border-radius:16px;margin-left:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1.5px solid #e0e0e0;display:inline-flex;align-items:center;gap:6px;vertical-align:middle;' title='${accesoObj.nombre}'>${accesoObj.icono ? `<span style='font-size:1.3em;vertical-align:middle;margin-right:4px;'>${accesoObj.icono}</span>` : ''}<span style='font-weight:500;'>${accesoObj.nombre}</span></span>`;
						} else {
							accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='${incidencia.tipo_acceso_id}'>${incidencia.tipo_acceso_id}</span>`;
						}
					} else if (incidencia.tipo_acceso_id) {
						accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='${incidencia.tipo_acceso_id}'>${incidencia.tipo_acceso_id}</span>`;
					} else {
						accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='Sin acceso'>Sin acceso</span>`;
					}
				} else {
					accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='Sin acceso'>Sin acceso</span>`;
				}
				return `<span style="display:inline-flex;align-items:center;margin-right:10px;"><i class="bi bi-tag-fill" style="color:${tag.color};font-size:1.15em;margin-right:4px;vertical-align:middle;" title="${tag.nombre.replace(/\"/g, '&quot;')}"></i><span style="font-size:0.97em;color:#14532d;">${tag.nombre}${fecha ? ' <span style=\"color:#666;font-size:0.93em;margin-left:4px;">(' + fecha + ')</span>' : ''}${accesoBadge}</span></span>`;
			}).join(' ');
		}
		etiquetasActivasContainer.innerHTML += `<div style="margin-top:6px;">${badgesHtml}</div>`;
		document.getElementById('nombre').value = paciente.nombre || '';
		document.getElementById('apellidos').value = paciente.apellidos || '';
		document.getElementById('sexo').value = paciente.sexo || '';
		document.getElementById('nacimiento').value = paciente.fecha_nacimiento || '';
		document.getElementById('alta').value = paciente.fecha_alta || '';
		document.getElementById('telefono').value = paciente.telefono || '';
		document.getElementById('correo').value = paciente.correo || ''; 
		document.getElementById('direccion').value = paciente.direccion || ''; 
		document.getElementById('alergias').value = paciente.alergias || ''; 
		document.getElementById('observaciones').value = paciente.observaciones || '';
		document.getElementById('profesional').value = paciente.acceso?.profesional_id || paciente.profesional_id || '';
		document.getElementById('tipoAcceso').value = paciente.acceso?.tipo_acceso_id || paciente.tipo_acceso_id || '';
		llenarSelectUbicacion();
		document.getElementById('ubicacion').value = paciente.acceso?.ubicacion_anatomica || paciente.ubicacion_anatomica || '';
		document.getElementById('lado').value = paciente.acceso?.ubicacion_lado || paciente.ubicacion_lado || '';
		const pendienteSelect = document.getElementById('pendiente');
		pendienteSelect.value = paciente.pendiente?.pendiente_tipo_id || '';
		document.getElementById('accesoPendiente').value = paciente.pendiente?.tabla_acceso_id_vinculado || paciente.pendiente?.pendiente_tipo_acceso_id || '';
		// Ocultar accesoPendiente si pendiente es 'No Pendiente' al editar
		const accesoPendienteGroup = document.getElementById('accesoPendiente-group');
		if (accesoPendienteGroup) {
			if (pendienteSelect.selectedIndex === 0) {
				accesoPendienteGroup.style.display = 'none';
			} else {
				accesoPendienteGroup.style.display = '';
			}
		}
		llenarSelectUbicacionCHD();
		if (document.getElementById('chd-ubicacion')) {
			document.getElementById('chd-ubicacion').value = paciente.pendiente?.ubicacion_chd || '';
		}
		if (document.getElementById('chd-lado')) {
			document.getElementById('chd-lado').value = paciente.pendiente?.lado_chd || '';
		}
		// Fecha primera punción
		if (document.getElementById('fechaPrimeraPuncion')) {
			document.getElementById('fechaPrimeraPuncion').value = paciente.acceso?.fecha_primera_puncion || paciente.fecha_primera_puncion || '';
		}
		if (document.getElementById('fechaInstalacionAccesoPendiente')) {
			document.getElementById('fechaInstalacionAccesoPendiente').value = paciente.pendiente?.fecha_instalacion_acceso_pendiente || '';
		}
		document.getElementById('fechaInstalacionAcceso').value = paciente.acceso?.fecha_instalacion || paciente.fecha_instalacion || '';
		document.getElementById('etiquetasIncidencia').value = paciente.etiquetas_incidencia || '';
		mostrarCamposFechaAcceso();
		displayCamposCHD();
		const modalEl = document.getElementById('modal-paciente');
		let modalInstance = bootstrap.Modal.getInstance(modalEl);
		if (!modalInstance) {
			modalInstance = new bootstrap.Modal(modalEl);
		}
		limpiarBackdropsDuplicados();
		modalInstance.show();
	
	}
});

// Handler para el botón de guardar paciente 
btnGuardarPaciente.addEventListener('click', function(e) {
    e.preventDefault();
	if (window.pacienteEditando && window.pacienteEditando.id) {
		// Editar paciente
		const tipoAcceso = document.getElementById('tipoAcceso');
		const profesional = document.getElementById('profesional');
		const ubicacion = document.getElementById('ubicacion');
		const ubicacion_chd = document.getElementById('chd-ubicacion');
		// Validación condicional de campos visibles
		const fechaInstalacionAccesoPendiente = document.getElementById('fechaInstalacionAccesoPendiente');
		const chdUbicacion = document.getElementById('chd-ubicacion');
		const chdLado = document.getElementById('chd-lado');
		let errorFocus = null;
		// Solo si el campo está visible (display !== 'none')
		// Usar getComputedStyle para verificar visibilidad real
		if (fechaInstalacionAccesoPendiente && window.getComputedStyle(fechaInstalacionAccesoPendiente).display !== 'none' && !fechaInstalacionAccesoPendiente.value) {
			fechaInstalacionAccesoPendiente.focus();
			mostrarMensaje('El campo Fecha Instalación Acceso Pendiente es obligatorio', 'danger');
			errorFocus = true;
		}
		if (chdUbicacion && chdUbicacion.parentElement && window.getComputedStyle(chdUbicacion.parentElement).display !== 'none' && !chdUbicacion.value) {
			chdUbicacion.focus();
			mostrarMensaje('El campo Ubicación CHD es obligatorio', 'danger');
			errorFocus = true;
		}
		if (chdLado && chdLado.parentElement && window.getComputedStyle(chdLado.parentElement).display !== 'none' && !chdLado.value) {
			chdLado.focus();
			mostrarMensaje('El campo Lado CHD es obligatorio', 'danger');
			errorFocus = true;
		}
		if (errorFocus) return;
		const paciente = {
			id: window.pacienteEditando.id,
			nombre: document.getElementById('nombre').value,
			apellidos: document.getElementById('apellidos').value,
			sexo: document.getElementById('sexo').value,
			fecha_nacimiento: document.getElementById('nacimiento').value,
			fecha_alta: document.getElementById('alta').value,
			telefono: document.getElementById('telefono').value,
			correo: document.getElementById('correo').value,
			direccion: document.getElementById('direccion').value,
			alergias: document.getElementById('alergias').value,
			observaciones: document.getElementById('observaciones').value,
			   avatar: document.getElementById('avatar') ? document.getElementById('avatar').value : '',
			profesional_id: profesional.value,
			tipo_acceso_id: tipoAcceso.value,
			ubicacion_anatomica: ubicacion.value,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
			pendiente: {
				id: window.pacienteEditando?.pendiente?.id || null,
				tabla_acceso_id_vinculado: document.getElementById('accesoPendiente').value,
				fecha_instalacion_acceso_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
				observaciones: window.pacienteEditando?.pendiente?.observaciones || '',
				profesional_id: profesional.value,
				ubicacion_chd: ubicacion_chd.value,
				lado_chd: document.getElementById('chd-lado').value,
				pendiente_tipo_id: document.getElementById('pendiente').value,
				pendiente_tipo_acceso_id: document.getElementById('accesoPendiente').value,
				paciente_id: window.pacienteEditando.id
			}
		};
		editarPaciente(window.pacienteEditando.id);
	} else {
		// Crear nuevo paciente
		crearPaciente();
	}
});


// Llenar select de Profesional a Cargo
function llenarSelectProfesional() {
    const select = document.getElementById('profesional');
    if (!select) return;
	select.innerHTML = '<option value="">Seleccionar Profesional</option>';
    profesionalesGlobal.forEach(prof => {
        select.innerHTML += `<option value="${prof.id}">${prof.nombre} ${prof.apellidos || ''}</option>`;
	});
	if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
}

// Llenar select de Tipo de Acceso y Acceso Pendiente
function llenarSelectTipoAcceso() {
    const selectAcceso = document.getElementById('tipoAcceso');
    const selectPendiente = document.getElementById('accesoPendiente');
		if (selectAcceso) {
		selectAcceso.innerHTML = '<option value="">Establecer Tipo de Acceso</option>';
			tiposAccesoGlobal.forEach(tipo => {
				let iconHtml = '';
				if (tipo.icono) {
					if (tipo.icono.startsWith('bi-')) {
						iconHtml = `<i class='bi ${tipo.icono}' style='font-size:1em;vertical-align:middle;'></i> `;
					} else {
						iconHtml = `${tipo.icono} `;
					}
				}
				selectAcceso.innerHTML += `<option value="${tipo.id}">${iconHtml}${tipo.nombre}</option>`;
			});
		}
	if (selectPendiente) {
		selectPendiente.innerHTML = '<option value="">Seleccionar Acceso Pendiente</option>';
		tiposAccesoGlobal.forEach(tipo => {
			let iconHtml = '';
			if (tipo.icono) {
				if (tipo.icono.startsWith('bi-')) {
					iconHtml = `<i class='bi ${tipo.icono}' style='font-size:1em;vertical-align:middle;'></i> `;
				} else {
					iconHtml = `${tipo.icono} `;
				}
			}
			selectPendiente.innerHTML += `<option value="${tipo.id}">${iconHtml}${tipo.nombre}</option>`;
		});
	}
}

function llenarSelectPendiente() {
    const select = document.getElementById('pendiente');
    if (!select) return;
	select.innerHTML = '<option value="">No Pendiente</option>';
    tiposPendienteGlobal.forEach(tipo => {
        select.innerHTML += `<option value="${tipo.id}">${tipo.nombre}</option>`;
	});
	if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
}

function llenarSelectUbicacion() {
    const select = document.getElementById('ubicacion');
    if (!select) return;
	select.innerHTML = '<option value="">Seleccionar Ubicación</option>';
	const selectTipoAcceso = document.getElementById('tipoAcceso');
	const tipoAccesoId = selectTipoAcceso?.value;
	// Buscar el nombre real del tipo de acceso por id
	const tipoAccesoObj = tiposAccesoGlobal.find(t => String(t.id) === String(tipoAccesoId));
	const tipoAccesoNombre = tipoAccesoObj?.nombre;
	const obj = ubicacionesGlobal.find(u => u.acceso === tipoAccesoNombre);
		if (obj && Array.isArray(obj.ubicaciones)) {
			obj.ubicaciones.forEach(ubic => {
				if (ubic) {
					select.innerHTML += `<option value="${ubic}">${ubic}</option>`;
				}
			});
		}
}

function mostrarCamposFechaAcceso() {
	// Tipo de Acceso
	if (selectTipoAcceso && selectTipoAcceso.value) {
		fechaLabel.style.display = '';
		fechaInput.style.display = '';
	} else {
		fechaLabel.style.display = 'none';
		fechaInput.style.display = 'none';
		fechaInput.value = '';
	}

	// Pendiente: mostrar fechaInstalacionAccesoPendiente si es "Retiro" o si accesoPendiente es Fístula y pendiente es Maduración
	if (selectPendiente && document.getElementById('accesoPendiente')) {
		const retiroPendiente = tiposPendienteGlobal.find(tp => tp.nombre && tp.nombre.toLowerCase().includes('retiro'));
		const maduracionPendiente = tiposPendienteGlobal.find(tp => tp.nombre && tp.nombre.toLowerCase().includes('maduración'));
		const accesoPendienteSelect = document.getElementById('accesoPendiente');
		// Buscar el id de Fístula en tiposAccesoGlobal
		let fistulaTipoAccesoId = null;
		if (Array.isArray(tiposAccesoGlobal)) {
			const fistulaTipo = tiposAccesoGlobal.find(tipo => tipo.nombre && (tipo.nombre.toLowerCase().includes('fístula') || tipo.nombre.toLowerCase().includes('fav')));
			if (fistulaTipo) fistulaTipoAccesoId = String(fistulaTipo.id);
		}
		const esRetiro = selectPendiente.value && retiroPendiente && String(selectPendiente.value) === String(retiroPendiente.id);
		const esMaduracionFistula = maduracionPendiente && fistulaTipoAccesoId &&
			String(selectPendiente.value) === String(maduracionPendiente.id) &&
			String(accesoPendienteSelect.value) === String(fistulaTipoAccesoId);
		if (esRetiro || esMaduracionFistula) {
			fechaLabelPend.style.display = '';
			fechaInputPend.style.display = '';
			const fechaLabelPrimeraPuncion = document.getElementById('labelFechaPrimeraPuncion');
			const fechaInputPrimeraPuncion = document.getElementById('fechaPrimeraPuncion');
			if (fechaLabelPrimeraPuncion && fechaInputPrimeraPuncion) {
				fechaLabelPrimeraPuncion.style.display = '';
				fechaInputPrimeraPuncion.style.display = '';
			}
		} else {
			fechaLabelPend.style.display = 'none';
			fechaInputPend.style.display = 'none';
			fechaInputPend.value = '';
			const fechaLabelPrimeraPuncion = document.getElementById('labelFechaPrimeraPuncion');
			const fechaInputPrimeraPuncion = document.getElementById('fechaPrimeraPuncion');
			if (fechaLabelPrimeraPuncion && fechaInputPrimeraPuncion) {
				fechaLabelPrimeraPuncion.style.display = 'none';
				fechaInputPrimeraPuncion.style.display = 'none';
				fechaInputPrimeraPuncion.value = '';
			}
		}
	}
}


/*********************************/
/*           FUNCIONES           */
/*********************************/

// Listener para el botón de eliminar paciente

// Filtros
function filtrarPacientes() {
		let filtrados = [...pacientesGlobal];
		// Filtro por nombre/apellidos (soporta búsqueda por palabras separadas)
		const texto = (inputBusqueda?.value || '').toLowerCase().trim();
		if (texto) {
			const palabras = texto.split(/\s+/);
			filtrados = filtrados.filter(p => {
				const nombreCompleto = `${p.nombre} ${p.apellidos}`.toLowerCase();
				return palabras.every(palabra => nombreCompleto.includes(palabra));
			});
		}

		// Filtro por tipo de acceso (usa id y muestra icono en el select)
		const tipo = filtroTipoAcceso?.value || '';
		if (tipo) {
			filtrados = filtrados.filter(p => {
				// Puede venir como id o como nombre
				const tipoAccesoObj = p.tipo_acceso || p.acceso?.tipo_acceso || null;
				return tipoAccesoObj && (String(tipoAccesoObj.id) === String(tipo) || tipoAccesoObj.nombre === tipo);
			});
		}

		// Filtro por estado: Todos, Infectado, Incidencias, Pendiente
		const estado = filtroPendiente?.value || '';
		if (estado) {
			filtrados = filtrados.filter(p => {
				if (estado === 'infectado') {
					return Array.isArray(p.infecciones) && p.infecciones.length > 0;
				} else if (estado === 'incidencias') {
					return Array.isArray(p.etiquetas) && p.etiquetas.some(id => etiquetasPorId[id]?.tipo === 'incidencia');
				} else if (estado === 'pendiente') {
					return p.proceso_actual === 'pendiente' || p.pendiente?.pendiente_tipo_id;
				}
				return true;
			});
		}
		return filtrados;
}

// Tabla de Pacientes
async function renderizarPacientes(pacientes) {
    tablaPacientesBody.innerHTML = '';
	pacientes.forEach(paciente => {
        // Obtener tipo de acceso
        let tipoAccesoObj = paciente.tipo_acceso || paciente.acceso?.tipo_acceso || null;
        let tipoAccesoHtml = '<span class="badge bg-secondary" style="font-size:1em;">Sin tipo</span>';
        if (tipoAccesoObj && tipoAccesoObj.id) {
            let iconHtml = '';
            if (tipoAccesoObj.icono) {
                if (tipoAccesoObj.icono.startsWith('bi-')) {
                    iconHtml = `<i class='bi ${tipoAccesoObj.icono}' style='color:${tipoAccesoObj.color || '#222'};font-size:1.15em;margin-right:4px;vertical-align:middle;'></i>`;
                } else {
                    iconHtml = `<span style='font-size:1.15em;margin-right:4px;vertical-align:middle;'>${tipoAccesoObj.icono}</span>`;
                }
            }
            tipoAccesoHtml = `<span class="badge" style="font-size:1em;font-weight:normal;background:none;color:${tipoAccesoObj.color || '#222'};padding:0;margin:0;">${iconHtml}${tipoAccesoObj.nombre}</span>`;
        }
        // Obtener ubicación anatómica y lado
        let accesoObj = paciente.acceso || paciente;
        const ubicacionCompleta = (accesoObj.ubicacion_anatomica && accesoObj.ubicacion_lado)
            ? `${accesoObj.ubicacion_anatomica} ${accesoObj.ubicacion_lado}`
            : (accesoObj.ubicacion_anatomica || accesoObj.ubicacion_lado || '');
        // Obtener fecha instalación
		let fechaInstalacion = accesoObj.fecha_instalacion || paciente.fecha_instalacion || '';
		let fechaFormateada = '';
		let diasDetalle = '';
		let relojEmoji = '';
		// Estado pendiente: mostrar emoji reloj de arena
		const esPendiente = paciente.proceso_actual === 'pendiente' || paciente.pendiente?.pendiente_tipo_id;
		if (esPendiente) {
			relojEmoji = '<span title="Pendiente" style="font-size:1.15em;vertical-align:middle;margin-right:2px;">⏳</span>';
		}
        if (fechaInstalacion) {
            const match = fechaInstalacion.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
            if (match) {
                fechaFormateada = `${match[3]}/${match[2]}/${match[1]}`;
                const fechaInst = new Date(`${match[1]}-${match[2]}-${match[3]}`);
                const hoy = new Date();
                fechaInst.setHours(0,0,0,0);
                hoy.setHours(0,0,0,0);
                const diffMs = hoy - fechaInst;
                if (!isNaN(diffMs)) {
                    const diffDias = Math.floor(diffMs / (1000*60*60*24));
                    if (diffDias >= 0) {
                        diasDetalle = ` <span style='color:#888;font-size:0.95em;'>(${diffDias}d)</span>`;
                    } else {
                        diasDetalle = '';
                    }
                }
            } else {
                fechaFormateada = fechaInstalacion;
            }
        }
		// Etiquetas de incidencia: solo icono coloreado, con tooltip
		let badgesHtml = '';
		if (Array.isArray(paciente.etiquetas) && paciente.etiquetas.length > 0) {
			badgesHtml = paciente.etiquetas.map(id => {
				const tag = etiquetasPorId[id];
				if (!tag) return '';
				if (tag.tipo !== 'incidencia') return '';
				return `<i class=\"bi bi-tag-fill\" style=\"color:${tag.color};font-size:1.15em;margin-right:2px;vertical-align:middle;\" title=\"${tag.nombre.replace(/\"/g, '&quot;')}\"></i>`;
			}).join(' ');
		}
		// Mostrar los iconos de todos los tags de infecciones
        let infeccionTagsHtml = '';
        if (Array.isArray(paciente.infecciones) && paciente.infecciones.length > 0) {
            // Ordenar por fecha_infeccion descendente
            const infeccionesOrdenadas = paciente.infecciones.slice().sort((a, b) => (b.fecha_infeccion || '').localeCompare(a.fecha_infeccion || ''));
            infeccionTagsHtml = infeccionesOrdenadas.map(inf => {
                if (!inf.tag) return '';
                const icono = inf.tag.icono || '';
                const nombre = inf.tag.nombre || '';
                const microorganismo = inf.tag.microorganismo_asociado || '';
                let tooltip = nombre;
                if (microorganismo && microorganismo !== nombre) {
                    tooltip += ` (${microorganismo})`;
                }
                if (icono.startsWith('bi-')) {
                    return `<i class='bi ${icono}' style='color:${inf.tag.color || '#1976d2'};font-size:1.15em;margin-left:4px;vertical-align:middle;' title='${tooltip.replace(/"/g, '&quot;')}'></i>`;
                } else {
                    return `<span style='font-size:1.15em;margin-left:4px;vertical-align:middle;color:${inf.tag.color || '#1976d2'};' title='${tooltip.replace(/"/g, '&quot;')}' >${icono}</span>`;
                }
            }).join('');
        }
		const tr = document.createElement('tr'); 
		tr.innerHTML = `
			<td>${infeccionTagsHtml} ${paciente.nombre} ${paciente.apellidos}</td>
			<td>${tipoAccesoHtml}</td>
			<td class="pacientes-ubicacion" title="${ubicacionCompleta}">${badgesHtml} ${ubicacionCompleta}</td>
			<td>${relojEmoji}${fechaFormateada}${diasDetalle}</td>
			<td>
				<button class="btn btn-outline-primary btn-sm btn-historial" data-id="${paciente.id}" title="Ver Historial Clínico"><i class="bi bi-journal-medical"></i></button>
				<button class="btn btn-outline-success btn-sm btn-editar-paciente" data-id="${paciente.id}"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-outline-info btn-sm btn-infeccion" data-id="${paciente.id}" title="Añadir Infección"><i class="bi bi-bug"></i></button>
				<button class="btn btn-outline-warning btn-sm btn-archivar" data-id="${paciente.id}" title="Archivar paciente"><i class="bi bi-archive"></i></button>
				<button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${paciente.id}"><i class="bi bi-trash"></i></button>
			</td>
		`;
        tablaPacientesBody.appendChild(tr);
    });
}

// Paginación
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

// Cargar pacientes
function cargarPacientes() {
	ipcRenderer.invoke('get-pacientes-completos').then(async pacientes => {
		// Para cada paciente, obtener sus incidencias activas y asociar los IDs de etiquetas
		for (const paciente of pacientes) {
			const incidencias = await ipcRenderer.invoke('paciente-get-incidencias', paciente.id);
			// Filtrar solo incidencias activas y de tipo etiqueta
			paciente.etiquetas = incidencias
				.filter(inc => inc.activo && inc.etiqueta_id)
				.map(inc => inc.etiqueta_id);
		}
		pacientesGlobal = pacientes;
		paginaActual = 1;
		actualizarTablaPacientes();
	});
}


// Limpia todos los campos del modal de nuevo paciente
function limpiarCamposNuevoPaciente() {
	document.getElementById('nombre').value = '';
	document.getElementById('apellidos').value = '';
	document.getElementById('sexo').value = '';
	document.getElementById('nacimiento').value = '';
	// Poner la fecha actual por defecto en el campo de alta
	const altaInput = document.getElementById('alta');
	if (altaInput) {
		const hoy = new Date();
		const yyyy = hoy.getFullYear();
		const mm = String(hoy.getMonth() + 1).padStart(2, '0');
		const dd = String(hoy.getDate()).padStart(2, '0');
		altaInput.value = `${yyyy}-${mm}-${dd}`;
	}
	document.getElementById('telefono').value = '';
	document.getElementById('correo').value = '';
	document.getElementById('direccion').value = '';
	document.getElementById('alergias').value = '';
	document.getElementById('observaciones').value = '';
	document.getElementById('profesional').value = '';
	document.getElementById('tipoAcceso').value = '';
	document.getElementById('ubicacion').value = '';
	document.getElementById('lado').value = '';
	document.getElementById('pendiente').value = '';
	document.getElementById('accesoPendiente').value = '';
	document.getElementById('fechaInstalacionAcceso').value = '';
	if (document.getElementById('chd-ubicacion')) document.getElementById('chd-ubicacion').value = '';
	if (document.getElementById('chd-lado')) document.getElementById('chd-lado').value = '';
	document.getElementById('fechaInstalacionAccesoPendiente').value = '';
	if (document.getElementById('fechaPrimeraPuncion')) document.getElementById('fechaPrimeraPuncion').value = '';
	// Limpiar select de Choices.js correctamente
	const etiquetasSelect = document.getElementById('etiquetasIncidencia');
	if (window.etiquetasChoices) {
		window.etiquetasChoices.removeActiveItems();
	}

	// Limpiar formularios dinámicos de incidencias
	const incidenciaContainer = document.getElementById('incidencia-valores-container');
	if (incidenciaContainer) {
		incidenciaContainer.innerHTML = '';
	}

	// Limpiar badges y valores visuales de incidencias activas
	const etiquetasActivasContainer = document.getElementById('etiquetas-activas-container');
	if (etiquetasActivasContainer) {
		etiquetasActivasContainer.innerHTML = '';
	}

	window.pacienteEditando = null;
	incidenciaValoresTemp = {}; // Limpiar variable temporal al cancelar/crear
}

// Crear nuevo paciente
async function crearPaciente() {
	// Validaciones de campos obligatorios
	const nombre = document.getElementById('nombre').value;
	const apellidos = document.getElementById('apellidos').value;
	const sexo = document.getElementById('sexo').value;
	const profesional = document.getElementById('profesional').value;
	const tipoAcceso = document.getElementById('tipoAcceso').value;
	const ubicacion = document.getElementById('ubicacion').value;
	const fechaInstalacionAcceso = document.getElementById('fechaInstalacionAcceso').value;
	// Validación condicional de campos visibles
	const fechaInstalacionAccesoPendiente = document.getElementById('fechaInstalacionAccesoPendiente');
	const chdUbicacion = document.getElementById('chd-ubicacion');
	const chdLado = document.getElementById('chd-lado');
	let errorFocus = null;
	// Usar getComputedStyle para verificar visibilidad real
	if (fechaInstalacionAccesoPendiente && window.getComputedStyle(fechaInstalacionAccesoPendiente).display !== 'none' && !fechaInstalacionAccesoPendiente.value) {
		fechaInstalacionAccesoPendiente.focus();
		mostrarMensaje('El campo Fecha Instalación Acceso Pendiente es obligatorio', 'danger');
		errorFocus = true;
	}
	if (chdUbicacion && chdUbicacion.parentElement && window.getComputedStyle(chdUbicacion.parentElement).display !== 'none' && !chdUbicacion.value) {
		chdUbicacion.focus();
		mostrarMensaje('El campo Ubicación CHD es obligatorio', 'danger');
		errorFocus = true;
	}
	if (chdLado && chdLado.parentElement && window.getComputedStyle(chdLado.parentElement).display !== 'none' && !chdLado.value) {
		chdLado.focus();
		mostrarMensaje('El campo Lado CHD es obligatorio', 'danger');
		errorFocus = true;
	}
	if (errorFocus) return;
	if (!nombre) {
		document.getElementById('nombre').focus();
		mostrarMensaje('El campo Nombre es obligatorio', 'danger');
		return;
	}
	if (!apellidos) {
		document.getElementById('apellidos').focus();
		mostrarMensaje('El campo Apellidos es obligatorio', 'danger');
		return;
	}
	if (!sexo) {
		document.getElementById('sexo').focus();
		mostrarMensaje('El campo Sexo es obligatorio', 'danger');
		return;
	}
	if (!profesional) {
		document.getElementById('profesional').focus();
		mostrarMensaje('El campo Profesional a Cargo es obligatorio', 'danger');
		return;
	}
	if (!tipoAcceso) {
		document.getElementById('tipoAcceso').focus();
		mostrarMensaje('El campo Tipo de Acceso es obligatorio', 'danger');
		return;
	}
	if (!ubicacion) {
		document.getElementById('ubicacion').focus();
		mostrarMensaje('El campo Ubicación Anatómica es obligatorio', 'danger');
		return;
	}
	if (!fechaInstalacionAcceso) {
		document.getElementById('fechaInstalacionAcceso').focus();
		mostrarMensaje('El campo Fecha Instalación del Acceso es obligatorio', 'danger');
		return;
	}
	// Recoge los datos del formulario
	const paciente = {
		nombre,
		apellidos,
		sexo,
		fecha_nacimiento: document.getElementById('nacimiento').value,
		fecha_alta: document.getElementById('alta').value,
		telefono: document.getElementById('telefono').value,
		correo: document.getElementById('correo').value,
		direccion: document.getElementById('direccion').value,
		alergias: document.getElementById('alergias').value,
		observaciones: document.getElementById('observaciones').value,
		profesional_id: profesional,
		tipo_acceso_id: tipoAcceso,
		ubicacion_anatomica: ubicacion,
		ubicacion_lado: document.getElementById('lado').value,
		activo: true,
		pendiente: {
			tabla_acceso_id_vinculado: document.getElementById('accesoPendiente').value,
			fecha_instalacion_acceso_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
			ubicacion_chd: document.getElementById('chd-ubicacion') ? document.getElementById('chd-ubicacion').value : '',
			lado_chd: document.getElementById('chd-lado') ? document.getElementById('chd-lado').value : '',
			observaciones: '',
			profesional_id: profesional,
			pendiente_tipo_id: document.getElementById('pendiente').value,
			pendiente_tipo_acceso_id: document.getElementById('accesoPendiente').value,
			activo: true
		},
		fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
		fecha_instalacion_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
		etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
		acceso: {
			tipo_acceso_id: tipoAcceso,
			activo: true,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			fecha_primera_puncion: document.getElementById('fechaPrimeraPuncion').value,
			profesional_id: profesional,
			activo: true
		}
	};
	const etiquetasSeleccionadass = Object.keys(incidenciaValoresTemp);
	// Llama al ipcHandler para añadir paciente y obtiene el id
	const result = await ipcRenderer.invoke('add-paciente', paciente);

	const pacienteId = result && result.id ? result.id : null;
	// Notificación: paciente añadido
	if (pacienteId) {
		await ipcRenderer.invoke('notificaciones-add', {
			tipo: 'Pacientes',
			mensaje: `Se añadió el paciente ${paciente.nombre} ${paciente.apellidos}`,
			fecha: new Date().toISOString(),
			usuario_id: paciente.profesional_id || null,
			paciente_id: pacienteId,
			extra: ''
		});
		if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
	}
			
	// Guardar incidencias si hay etiquetas seleccionadas y pacienteId válido
	const etiquetasSeleccionadas = Object.keys(incidenciaValoresTemp);
	if (pacienteId && etiquetasSeleccionadas.length > 0) {
		for (const id of etiquetasSeleccionadas) {
			const incidencia = incidenciaValoresTemp[id];
			await ipcRenderer.invoke('add-incidencia-con-tag', {
				pacienteId,
				tagId: id,
				tipo_acceso_id: incidencia.acceso ? Number(incidencia.acceso) : null,
				fecha: incidencia.fecha,
				tipo: incidencia.nombre,
				microorganismo_asociado: null,
				medidas: incidencia.medidas,
				etiqueta_id: id,
				activo: true
			});
			// Notificación: incidencia añadida
			const paciente = pacientesGlobal.find(p => p.id == pacienteId);
			const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellidos}` : `ID ${pacienteId}`;
			await ipcRenderer.invoke('notificaciones-add', {
				tipo: 'Incidencia',
				mensaje: `Se añadió una incidencia (${incidencia.nombre}) al paciente ${nombreCompleto}`,
				fecha: new Date().toISOString(),
				usuario_id: paciente ? paciente.profesional_id : null,
				paciente_id: pacienteId,
				extra: ''
			});
			if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
		}
	}
	// Actualiza la tabla y cierra el modal
	cargarPacientes();
	const modalEl = document.getElementById('modal-paciente');
	let modalInstance = bootstrap.Modal.getInstance(modalEl);
	if (!modalInstance) {
		modalInstance = new bootstrap.Modal(modalEl);
	}
	if (modalInstance) {
		modalInstance.hide();
	}
	limpiarBackdropsDuplicados();
	if (window.pacienteEditando && window.pacienteEditando.id) {
		const nombreCompleto = document.getElementById('nombre').value + ' ' + document.getElementById('apellidos').value;
		mostrarMensaje(`Paciente editado correctamente: <b>${nombreCompleto}</b>`, 'success');
	} else {
		const nombreCompleto = document.getElementById('nombre').value + ' ' + document.getElementById('apellidos').value;
		mostrarMensaje(`Paciente creado correctamente: <b>${nombreCompleto}</b>`, 'success');
	}
	incidenciaValoresTemp = {}; // Limpiar variable temporal tras guardar
	// Actualizar cards del dashboard
	if (window.cargarDatosDashboard) window.cargarDatosDashboard();
}

async function cargarEtiquetas() {
	// Inicializar Choices.js para etiquetas de incidencia
	const etiquetasSelect = document.getElementById('etiquetasIncidencia');
	let etiquetasChoices;
	// Cargar etiquetas desde el backend
	const etiquetas = await ipcRenderer.invoke('tags-get-all');
	// Poblar el diccionario etiquetasPorId para acceso rápido por id
	etiquetasPorId = {};
	etiquetas.forEach(tag => {
		etiquetasPorId[tag.id] = tag;
	});
	etiquetasSelect.innerHTML = etiquetas
		.filter(tag => tag.tipo && tag.tipo.toLowerCase() === 'incidencia')
		.map(tag => `<option value="${tag.id}" data-color="${tag.color || ''}" data-icono="${tag.icono || ''}">${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}</option>`)
		.join('');
	window.etiquetasChoices = new Choices(etiquetasSelect, {
		removeItemButton: true,
		placeholder: true,
		placeholderValue: 'Selecciona etiquetas...',
		searchEnabled: true,
		shouldSort: false
	});
	// Aplica color a los items seleccionados tras cada cambio
	function pintarEtiquetasSeleccionadas() {
		const selectedOptions = Array.from(etiquetasSelect.selectedOptions);
		const items = document.querySelectorAll('.choices__list--multiple .choices__item');
		items.forEach((item, idx) => {
			const option = selectedOptions[idx];
			if (option) {
				const color = option.getAttribute('data-color') || '#009879';
				item.style.backgroundColor = color;
				item.style.color = '#fff';
			}
		});
	}
		etiquetasSelect.addEventListener('change', function() {
			// Detectar incidencias eliminadas
			const selectedIds = Array.from(etiquetasSelect.selectedOptions).map(opt => opt.value);
			const prevIds = Object.keys(incidenciaValoresTemp);
			prevIds.forEach(id => {
				if (!selectedIds.includes(id)) {
					// Eliminada del selector, borrar de variable y mostrar mensaje
					const nombre = incidenciaValoresTemp[id]?.nombre || '';
					delete incidenciaValoresTemp[id];
					mostrarMensaje(`Incidencia "${nombre}" eliminada`, 'info');
				}
			});
			pintarEtiquetasSeleccionadas();
			// Renderizar formularios dinámicos
			const selectedOptions = Array.from(etiquetasSelect.selectedOptions);
			renderIncidenciaValores(selectedOptions);
			// Cerrar el menú desplegable de Choices.js al seleccionar
			if (window.etiquetasChoices) {
				window.etiquetasChoices.hideDropdown();
			}
		});
	// Pintar al iniciar si ya hay seleccionadas
		setTimeout(() => {
			pintarEtiquetasSeleccionadas();
			renderIncidenciaValores(Array.from(etiquetasSelect.selectedOptions));
		}, 400);
	window.etiquetasChoices.setValue([]);
	window.etiquetasChoices.passedElement.element.addEventListener('change', function(event) {
		const selectedOptions = Array.from(event.target.selectedOptions);
		selectedOptions.forEach(option => {
			const color = option.getAttribute('data-color');
			const icono = option.getAttribute('data-icono');
			option.style.backgroundColor = color || '#fff';
			option.style.color = '#fff';
			if (icono) {
				option.innerHTML = `<i class='${icono}' style='color:#fff;'></i> ${option.text}`;
			}
		});
	});
}

// Editar paciente existente
async function editarPaciente(id) { 
	const nombre = document.getElementById('nombre').value;
	const apellidos = document.getElementById('apellidos').value;
	const sexo = document.getElementById('sexo').value;
	const profesional = document.getElementById('profesional');
	const tipoAcceso = document.getElementById('tipoAcceso');
	const ubicacion = document.getElementById('ubicacion');
	const ubicacion_chd = document.getElementById('chd-ubicacion');
	const fechaInstalacionAcceso = document.getElementById('fechaInstalacionAcceso').value;
	if (!nombre) {
		document.getElementById('nombre').focus();
		mostrarMensaje('El campo Nombre es obligatorio', 'danger');
		return;
	}
	if (!apellidos) {
		document.getElementById('apellidos').focus();
		mostrarMensaje('El campo Apellidos es obligatorio', 'danger');
		return;
	}
	if (!sexo) {
		document.getElementById('sexo').focus();
		mostrarMensaje('El campo Sexo es obligatorio', 'danger');
		return;
	}
	if (!profesional.value) {
		profesional.focus();
		mostrarMensaje('El campo Profesional a Cargo es obligatorio', 'danger');
		return;
	}
	if (!tipoAcceso.value) {
		tipoAcceso.focus();
		mostrarMensaje('El campo Tipo de Acceso es obligatorio', 'danger');
		return;
	}
	if (!ubicacion.value) {
		ubicacion.focus();
		mostrarMensaje('El campo Ubicación Anatómica es obligatorio', 'danger');
		return;
	}
	if (!fechaInstalacionAcceso) {
		document.getElementById('fechaInstalacionAcceso').focus();
		mostrarMensaje('El campo Fecha Instalación del Acceso es obligatorio', 'danger');
		return;
	}
	const paciente = {
		id,
		nombre: document.getElementById('nombre').value,
		apellidos: document.getElementById('apellidos').value,
		sexo: document.getElementById('sexo').value,
		fecha_nacimiento: document.getElementById('nacimiento').value,
		fecha_alta: document.getElementById('alta').value,
		telefono: document.getElementById('telefono').value,
		correo: document.getElementById('correo').value,
		direccion: document.getElementById('direccion').value,
		alergias: document.getElementById('alergias').value,
		observaciones: document.getElementById('observaciones').value,
		profesional_id: document.getElementById('profesional').value,
		tipo_acceso_id: document.getElementById('tipoAcceso').value,
		ubicacion_anatomica: document.getElementById('ubicacion').value,
		ubicacion_lado: document.getElementById('lado').value,
		fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
		etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
		activo: true,
		pendiente: {
			id: window.pacienteEditando?.pendiente?.id || null,
			tabla_acceso_id_vinculado: document.getElementById('accesoPendiente').value,
			fecha_instalacion_acceso_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
			observaciones: window.pacienteEditando?.pendiente?.observaciones || '',
			profesional_id: document.getElementById('profesional').value,
			ubicacion_chd: ubicacion_chd.value,
			lado_chd: document.getElementById('chd-lado').value,
			pendiente_tipo_id: document.getElementById('pendiente').value,
			pendiente_tipo_acceso_id: document.getElementById('accesoPendiente').value,
			paciente_id: id,
			activo: true
		},
		acceso: {
			tipo_acceso_id: document.getElementById('tipoAcceso').value,
			ubicacion_anatomica: document.getElementById('ubicacion').value,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			profesional_id: document.getElementById('profesional').value,
			activo: true
		},
		// Eliminados: incidencia, incidencia_valores
	};

		const result = await ipcRenderer.invoke('update-paciente', paciente);
		// Solo registrar notificación si hubo cambios
		if (result && result.changes > 0) {
			console.log('[DEBUG] Notificación de edición creada para paciente:', paciente.id, paciente.nombre, paciente.apellidos, 'changes:', result.changes);
			// Validar que los IDs existen y son válidos antes de enviar la notificación
			const profesionalIdValido = paciente.profesional_id && !isNaN(Number(paciente.profesional_id)) && Number(paciente.profesional_id) > 0;
			const pacienteIdValido = paciente.id && !isNaN(Number(paciente.id)) && Number(paciente.id) > 0;
			if (profesionalIdValido && pacienteIdValido) { 
				await ipcRenderer.invoke('notificaciones-add', {
					tipo: 'Pacientes',
					mensaje: `Se editó el paciente ${paciente.nombre} ${paciente.apellidos}`,
					fecha: new Date().toISOString(),
					usuario_id: paciente.profesional_id,
					paciente_id: paciente.id,
					extra: ''
				});
				if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
			} else {
				console.warn('[DEBUG] Notificación NO enviada: profesional_id o paciente_id inválido', paciente.profesional_id, paciente.id);
			}
		}

	// Guardar incidencias si hay etiquetas seleccionadas y pacienteId válido
	const etiquetasSeleccionadas = Object.keys(incidenciaValoresTemp);
	if (id && etiquetasSeleccionadas.length > 0) {
		for (const etiquetaId of etiquetasSeleccionadas) {
			const incidencia = incidenciaValoresTemp[etiquetaId];
			const incidenciaPayload = {
				pacienteId: Number(id),
				tagId: Number(etiquetaId),
				tipo_acceso_id: incidencia.acceso ? Number(incidencia.acceso) : null,
				fecha: typeof incidencia.fecha === 'string' ? incidencia.fecha : null,
				tipo: typeof incidencia.nombre === 'string' ? incidencia.nombre : null,
				microorganismo_asociado: incidencia.microorganismo_asociado || null,
				medidas: typeof incidencia.medidas === 'string' ? incidencia.medidas : null,
				etiqueta_id: Number(etiquetaId),
				activo: 1
			};
			await ipcRenderer.invoke('add-incidencia-con-tag', incidenciaPayload);
			// Notificación: incidencia añadida
			const pacienteObj = pacientesGlobal.find(p => p.id == id);
			const nombreCompleto = pacienteObj ? `${pacienteObj.nombre} ${pacienteObj.apellidos}` : `ID ${id}`;
			const tag = etiquetasPorId[etiquetaId];
			const color = tag && tag.color ? tag.color : '#009879'; 
			await ipcRenderer.invoke('notificaciones-add', {
				tipo: 'Incidencia',
				mensaje: `El paciente <strong>${nombreCompleto}</strong> ha sufrido una incidencia (<i class='bi bi-tag-fill' style='color:${color};font-size:1.1em;vertical-align:-0.1em;'></i> <strong>${incidenciaPayload.tipo}</strong>) y se ha añadido a su historial.`,
				fecha: new Date().toISOString(),
				usuario_id: pacienteObj ? pacienteObj.profesional_id : null,
				paciente_id: id,
				extra: ''
			});
			if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
		}
	}
	 // (Ya se realiza la notificación solo si hubo cambios)
	// Recargar datos clínicos del paciente editado y actualizar el formulario/modal
	const pacienteActualizado = await ipcRenderer.invoke('paciente-get-con-acceso', id);
	if (pacienteActualizado) {
		// Actualizar campos clínicos en el formulario/modal
		document.getElementById('tipoAcceso').value = pacienteActualizado.tipo_acceso_id || '';
		document.getElementById('fechaInstalacionAcceso').value = pacienteActualizado.fecha_instalacion || '';
		document.getElementById('ubicacion').value = pacienteActualizado.ubicacion_anatomica || '';
		document.getElementById('lado').value = pacienteActualizado.ubicacion_lado || '';
		document.getElementById('profesional').value = pacienteActualizado.profesional_id || '';
		if (pacienteActualizado.pendiente) {
			document.getElementById('pendiente').value = pacienteActualizado.pendiente.pendiente_tipo_id || '';
			document.getElementById('accesoPendiente').value = pacienteActualizado.pendiente.tabla_acceso_id_vinculado || '';
			document.getElementById('fechaInstalacionAccesoPendiente').value = pacienteActualizado.pendiente.fecha_instalacion_acceso_pendiente || '';
			document.getElementById('chd-ubicacion').value = pacienteActualizado.pendiente.ubicacion_chd || '';
			document.getElementById('chd-lado').value = pacienteActualizado.pendiente.lado_chd || '';
		}
	}
	cargarPacientes();
	const modalEl = document.getElementById('modal-paciente');
	let modalInstance = bootstrap.Modal.getInstance(modalEl);
	if (!modalInstance) {
		modalInstance = new bootstrap.Modal(modalEl);
	}
	if (modalInstance) {    
		modalInstance.hide();
	}  
	mostrarMensaje(`Paciente editado correctamente: <b>${paciente.nombre} ${paciente.apellidos}</b>`, 'success'); 

	// Limpieza robusta de variables y contenedores visuales al finalizar edición
	window.pacienteEditando = null; 
	incidenciaValoresTemp = {};
	// Limpiar badges y valores visuales de incidencias activas
	const etiquetasActivasContainer = document.getElementById('etiquetas-activas-container');
	if (etiquetasActivasContainer) {
		etiquetasActivasContainer.innerHTML = '';
	}
	// Limpiar formularios dinámicos de incidencias
	const incidenciaContainer = document.getElementById('incidencia-valores-container');
	if (incidenciaContainer) {
		incidenciaContainer.innerHTML = '';
	}
	// Actualizar cards del dashboard
	if (window.cargarDatosDashboard) window.cargarDatosDashboard();
}

// Renderiza formularios dinámicos para cada incidencia seleccionada
function renderIncidenciaValores(selectedIncidencias) {
	const container = document.getElementById('incidencia-valores-container');
	container.innerHTML = '';
	// Al seleccionar nuevas incidencias, mostrar todos los formularios (resetear ocultos)
	// Si hay formularios ocultos de incidencias previas, los volvemos a mostrar
	// Esto se logra porque se recrea el contenido cada vez que se llama a la función
	selectedIncidencias.forEach(option => {
		const color = option.getAttribute('data-color') || '#009879';
		const nombre = option.textContent;
		const id = option.value;
		// Si está guardada, no mostrar nada
		if (incidenciaValoresTemp[id]) {
			return;
		}
		// Solo renderizar el formulario si la incidencia no está guardada
		const formDiv = document.createElement('div');
		formDiv.className = 'incidencia-form mb-1 p-1 border rounded';
		formDiv.style.background = '#f8fafc';
		formDiv.style.maxWidth = '640px';
		formDiv.style.fontSize = '0.92em';
		formDiv.style.padding = '6px 10px';
		formDiv.style.margin = '2px 0';

		// Rellenar select con tipos de acceso global, mostrando icono/emoji
		let selectAccesoHtml = `<select class=\"form-select form-select-sm\" name=\"acceso-${id}\" required>`;
		selectAccesoHtml += `<option value=\"\">Tipo de acceso</option>`;
		tiposAccesoGlobal.forEach(tipo => {
			let iconHtml = '';
			if (tipo.icono) {
				if (tipo.icono.startsWith('bi-')) {
					iconHtml = `<i class='bi ${tipo.icono}' style='font-size:1em;vertical-align:middle;'></i> `;
				} else {
					iconHtml = `${tipo.icono} `;
				}
			}
			selectAccesoHtml += `<option value=\"${tipo.id}\">${iconHtml}${tipo.nombre}</option>`;
		});
		selectAccesoHtml += `</select>`;

		// Fecha actual por defecto en formato yyyy-mm-dd
		const hoy = new Date();
		const yyyy = hoy.getFullYear();
		const mm = String(hoy.getMonth() + 1).padStart(2, '0');
		const dd = String(hoy.getDate()).padStart(2, '0');
		const fechaDefault = `${yyyy}-${mm}-${dd}`;
		formDiv.innerHTML = `
			<div class=\"row align-items-center g-2 justify-content-between\">
				<div class=\"col-auto\">
					<span class=\"badge\" style=\"background:${color};color:#fff;font-size:0.95em;\" title=\"${nombre}\">${nombre}</span>
				</div>
				<div class=\"col d-flex justify-content-end align-items-center\">
					<input type=\"date\" class=\"form-control form-control-sm me-2\" placeholder=\"Fecha\" name=\"fecha-${id}\" required value=\"${fechaDefault}\" />
					${selectAccesoHtml}
					<input type=\"text\" class=\"form-control form-control-sm ms-2 me-2\" placeholder=\"Medidas\" name=\"medidas-${id}\" style=\"min-width:120px;\" />
					<button type=\"button\" class=\"btn btn-success btn-sm btn-guardar-incidencia ms-2\" data-id=\"${id}\">Guardar</button>
				</div>
			</div>
		`;
		container.appendChild(formDiv);

		// Listener para guardar los datos en la variable temporal
		const btnGuardar = formDiv.querySelector('.btn-guardar-incidencia');
		btnGuardar.addEventListener('click', () => {
			const fecha = formDiv.querySelector(`input[name='fecha-${id}']`).value;
			const acceso = formDiv.querySelector(`select[name='acceso-${id}']`).value;
			const medidas = formDiv.querySelector(`input[name='medidas-${id}']`).value;
			if (!fecha) {
				formDiv.querySelector(`input[name='fecha-${id}']`).focus();
				mostrarMensaje('La fecha de la incidencia es obligatoria', 'danger');
				return;
			}
			if (!acceso) {
				formDiv.querySelector(`select[name='acceso-${id}']`).focus();
				mostrarMensaje('El tipo de acceso de la incidencia es obligatorio', 'danger');
				return;
			}
			incidenciaValoresTemp[id] = { fecha, acceso, medidas, nombre, color };
			mostrarMensaje(`Incidencia "${nombre}" guardada`, 'success');
			renderIncidenciaValores(selectedIncidencias);
		});
	});
}

// MODAL DE INFECCIONES

// Handler para el botón Guardar infecciones
const btnGuardarInfecciones = document.getElementById('btn-guardar-infecciones'); 
if (btnGuardarInfecciones) {
    btnGuardarInfecciones.addEventListener('click', async function() {
        if (infeccionesTemp.length === 0) return;
        let pacienteId;
        if (window.origenModalInfeccion === 'pacientes') {
            pacienteId = Number(window.pacienteIdOtraSeccion) || null;
        } else if (window.origenModalInfeccion === 'historial') {
            const select = document.getElementById('filtro-paciente-historial');
            pacienteId = select && select.value ? Number(select.value) : null;
        } else {
            pacienteId = window.pacienteInfeccionId || null;
        }
        if (!pacienteId) {
            mostrarMensaje('No se ha seleccionado un paciente para guardar infecciones', 'danger');
            return;
        }
        // Formatear infecciones para enviar solo los campos esperados por el backend
        const infeccionesAEnviar = infeccionesTemp.map(inf => ({
            tag_id: inf.tagId,
            fecha_infeccion: inf.fecha,
            observaciones: inf.comentarios,
            activo: true
        }));
		try {
			await ipcRenderer.invoke('add-infecciones', pacienteId, infeccionesAEnviar);
			// Notificaciones por cada infección añadida
			const paciente = pacientesGlobal.find(p => p.id == pacienteId);
			const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellidos}` : `ID ${pacienteId}`;
			infeccionesTemp.forEach(inf => {
				const tag = etiquetasPorId[inf.tagId];
				const icono = tag && tag.icono ? tag.icono : '';
				const nombre = tag && tag.nombre ? tag.nombre : 'Infección';
				ipcRenderer.invoke('notificaciones-add', {
					tipo: 'Infección',
					mensaje: `El paciente <strong>${nombreCompleto}</strong> se ha infectado de <strong>${nombre}</strong> ${icono}`,
					fecha: new Date().toISOString(),
					usuario_id: paciente ? paciente.profesional_id : null,
					paciente_id: pacienteId,
					extra: ''
				});
				if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
			});
			mostrarMensaje('Infecciones guardadas correctamente', 'success');
			infeccionesTemp = [];
			const lista = document.getElementById('infeccion-lista');
			if (lista) lista.innerHTML = '';
			const modal = document.getElementById('modal-infeccion');
			bootstrap.Modal.getInstance(modal).hide();
			// Actualizar la tabla de pacientes tras guardar infecciones
			cargarPacientes();
		} catch (err) {
			mostrarMensaje('Error al guardar infecciones', 'danger');
		}
    });
}

// Limpiar infecciones temporales al cerrar el modal de infección (evento Bootstrap)
document.addEventListener('DOMContentLoaded', function() {
    const modalInfeccionEl = document.getElementById('modal-infeccion');
    if (modalInfeccionEl) {
        modalInfeccionEl.addEventListener('hidden.bs.modal', function() {
            infeccionesTemp = [];
        });
    }
});
if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();

// Abrir Modal de Infecciones
function abrirMenuInfeccionesDesdePacientes(pacienteId) {
    var modal = document.getElementById('modal-infeccion');
    window.origenModalInfeccion = 'pacientes';
    window.pacienteIdOtraSeccion = pacienteId;
    if (modal) {
        var select = document.getElementById('infeccion-tags');
        if (select) {
            select.innerHTML = '';
            if (window.etiquetasGlobales && Array.isArray(window.etiquetasGlobales)) {
                window.etiquetasGlobales.forEach(function(etiqueta) {
                    if (etiqueta.tipo === 'infeccion' || etiqueta.tipo === 'infección') {
                        var option = document.createElement('option');
                        option.value = etiqueta.id;
                        option.textContent = etiqueta.icono ? `${etiqueta.icono} ${etiqueta.nombre}` : etiqueta.nombre;
                        select.appendChild(option);
                    }
				});
				if (window.refrescarNotificacionesDashboard) window.refrescarNotificacionesDashboard();
            }
        }
        window.infeccionesTemp = [];
        var listaInfeccion = document.getElementById('infeccion-lista');
        if (listaInfeccion) listaInfeccion.innerHTML = '';
        var modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        alert('No se encontró el modal de infección.');
    }
}

// Handler para el botón de añadir infección en el modal
document.addEventListener('DOMContentLoaded', function() {
	const btnAgregarInfeccion = document.getElementById('btn-agregar-infeccion');
	if (btnAgregarInfeccion) {
		btnAgregarInfeccion.addEventListener('click', function() {
			const select = document.getElementById('infeccion-tags');
			const fechaInput = document.getElementById('infeccion-fecha');
			let fecha = fechaInput.value;
			const comentarios = document.getElementById('infeccion-comentarios').value;
			const lista = document.getElementById('infeccion-lista');
			const selectedOptions = Array.from(select.selectedOptions);
			if (selectedOptions.length === 0) {
				select.focus();
				mostrarMensaje('Selecciona al menos un tipo de infección', 'danger');
				return;
			}
			// Si el campo de fecha está vacío, poner la fecha actual por defecto
			if (!fecha) {
				const hoy = new Date();
				const yyyy = hoy.getFullYear();
				const mm = String(hoy.getMonth() + 1).padStart(2, '0');
				const dd = String(hoy.getDate()).padStart(2, '0');
				fecha = `${yyyy}-${mm}-${dd}`;
				fechaInput.value = fecha;
			}
			// Añadir cada infección seleccionada a la lista temporal
			selectedOptions.forEach(opt => { 
				infeccionesTemp.push({
					tagId: opt.value,
					nombre: opt.textContent,
					color: opt.getAttribute('data-color') || '#1976d2',
					fecha,
					comentarios
				});
			});
			// Limpiar selección y campos
			select.selectedIndex = -1;
			// Poner la fecha actual por defecto tras agregar
			const hoy = new Date();
			const yyyy = hoy.getFullYear();
			const mm = String(hoy.getMonth() + 1).padStart(2, '0');
			const dd = String(hoy.getDate()).padStart(2, '0');
			fechaInput.value = `${yyyy}-${mm}-${dd}`;
			document.getElementById('infeccion-comentarios').value = '';
			// Renderizar lista visual
			renderizarListaInfecciones();
		});
	}
});
// Mostrar/ocultar el botón Guardar en el modal de infección
function actualizarBotonGuardarInfeccion() {
	const btnGuardar = document.getElementById('btn-guardar-infecciones');
	const lista = document.getElementById('infeccion-lista');
	if (!btnGuardar) {
		return;
	}
	// Ocultar si no hay lista o no hay infecciones
	if (!lista || infeccionesTemp.length === 0) {
		btnGuardar.classList.add('d-none');
		btnGuardar.style.display = '';
		return;
	}
	btnGuardar.style.display = '';
	btnGuardar.classList.remove('d-none');
}

// Actualizar botón Guardar cada vez que se renderiza la lista
function renderizarListaInfecciones() {
	const lista = document.getElementById('infeccion-lista');
	if (!lista) return;
	if (infeccionesTemp.length === 0) {
		lista.innerHTML = '<div class="text-muted">No hay infecciones añadidas.</div>';
	} else {
		lista.innerHTML = '<div class="mb-2" style="font-weight:500;color:#1976d2;">Infecciones añadidas:</div>' +
			infeccionesTemp.map((inf, idx) => `
				<div class="card mb-2" style="border-radius:10px;border:1px solid #e0e0e0;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
					<div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
						<div style="display:flex;align-items:center;gap:10px;">
							<span class="badge" style="background:${inf.color};color:#fff;font-size:1em;">${inf.nombre}</span>
							<span style="color:#222;font-size:0.97em;"><i class="bi bi-calendar-event me-1"></i>${inf.fecha}</span>
							${inf.comentarios ? `<span style='color:#666;font-size:0.95em;'><i class='bi bi-chat-left-text me-1'></i>${inf.comentarios}</span>` : ''}
						</div>
						<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-infeccion" data-idx="${idx}" title="Eliminar"><i class="bi bi-x"></i></button>
					</div>
				</div>
			`).join('');
		// Handler para eliminar infección
		lista.querySelectorAll('.btn-eliminar-infeccion').forEach(btn => {
			btn.addEventListener('click', function() {
				const idx = Number(btn.getAttribute('data-idx'));
				infeccionesTemp.splice(idx, 1);
				renderizarListaInfecciones();
			});
		});
	}
	actualizarBotonGuardarInfeccion();
}
