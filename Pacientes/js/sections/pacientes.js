const { ipcRenderer } = require('electron');

// Elementos del DOM
const filtroFechaPacientesInicio = document.getElementById('filtro-fecha-pacientes-inicio');
const filtroFechaPacientesFin = document.getElementById('filtro-fecha-pacientes-fin');
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

// Variable global temporal para infecciones añadidas en el modal
let infeccionesTemp = [];

let pacientesGlobal = [];
let etiquetasPorId = {};
const pacientesPorPagina = 10;
let datosGlobalesCargados = false;
let profesionalesGlobal = [];
let tiposAccesoGlobal = [];
let tiposPendienteGlobal = [];
let ubicacionesGlobal = [];
let paginaActual = 1;

// Carga los profesionales y los guarda en la variable global
async function cargarDatosGlobal() {
    profesionalesGlobal = await ipcRenderer.invoke('get-profesionales');
    tiposAccesoGlobal = await ipcRenderer.invoke('tipo-acceso-get-all');
	tiposPendienteGlobal = await ipcRenderer.invoke('pendiente-tipos-get');
    ubicacionesGlobal = await ipcRenderer.invoke('get-ubicaciones-anatomicas');
	datosGlobalesCargados = true;
}

window.cargarPacientes = cargarPacientes;


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
	// Handler para el botón de historial clínico en la tabla de pacientes
	document.addEventListener('click', function(e) {
		if (e.target.closest('.btn-historial')) {
			const btn = e.target.closest('.btn-historial');
			const pacienteId = btn.getAttribute('data-id');
			// Navegar a la sección de historial clínico
			document.querySelectorAll('.section').forEach(sec => sec.classList.add('d-none'));
			document.getElementById('historial-section').classList.remove('d-none');
			// Seleccionar el paciente en el selector de historial
			const selector = document.getElementById('filtro-paciente-historial');
			if (selector) {
				selector.value = pacienteId;
				// Lanzar el evento change para que se actualice el historial
				selector.dispatchEvent(new Event('change'));
			}
		}
	});
	// Función para abrir el modal de añadir incidencia a un paciente
	window.abrirModalIncidenciaPaciente = async function(pacienteId) {
		// Agregar handler de submit al formulario de incidencias si no existe
		const formIncidencia = document.getElementById('form-incidencia');
		if (formIncidencia && !formIncidencia._submitHandlerSet) {
			formIncidencia.addEventListener('submit', async function(e) {
				e.preventDefault();
				// Obtener datos del modal
				const modalIncidenciaEl = document.getElementById('modal-incidencia');
				const origen = modalIncidenciaEl?.getAttribute('data-origen') || 'pacientes';
				let pacienteId = null;
				if (origen === 'pacientes') {
					pacienteId = modalIncidenciaEl?.getAttribute('data-paciente-id') ? Number(modalIncidenciaEl.getAttribute('data-paciente-id')) : null;
				} else {
					const selectPaciente = document.getElementById('filtro-paciente-historial');
					pacienteId = selectPaciente && selectPaciente.value ? Number(selectPaciente.value) : null;
				}
				const tipoIncidenciaId = document.getElementById('incidenciaTipo')?.value || '';
				const fecha = document.getElementById('incidenciaFecha')?.value || '';
				const medidas = document.getElementById('incidenciaMedidas')?.value || '';
				let tipoAccesoId = modalIncidenciaEl?.getAttribute('data-tipo-acceso') || null;
				let etiquetaId = null;
				// Buscar nombre de la etiqueta
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
				// Construir objeto incidencia
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

					if(window.renderHistorial) window.renderHistorial();
					if(window.renderTimelinePacienteDB) window.renderTimelinePacienteDB();

					// Cerrar el modal
					var modal = bootstrap.Modal.getInstance(modalIncidenciaEl);
					if (modal) modal.hide();
					// Actualizar tabla de pacientes si está disponible
					if (window.cargarPacientes) window.cargarPacientes();
					// Actualizar notificaciones en el dashboard
					if (typeof window.refrescarNotificacionesDashboard === 'function') {
						window.refrescarNotificacionesDashboard();
					}
				} else {
					mostrarMensaje('Error al guardar la incidencia', 'danger');
				}
			});
			formIncidencia._submitHandlerSet = true;
		}
		// Cargar etiquetas globales si no están cargadas
		if (!window.etiquetasGlobales) {
			window.etiquetasGlobales = await ipcRenderer.invoke('tags-get-all');
		}
		// Rellenar select de tipo de incidencia
		const incidenciaTipoSelect = document.getElementById('incidenciaTipo');
		if (incidenciaTipoSelect && window.etiquetasGlobales) {
			incidenciaTipoSelect.innerHTML = '';
			incidenciaTipoSelect.setAttribute('multiple', 'multiple');
			window.etiquetasGlobales.filter(tag => tag.tipo === 'incidencia').forEach(tag => {
				const option = document.createElement('option');
				option.value = tag.id;
				// Emoji/icono delante del nombre
				option.textContent = `${tag.icono ? tag.icono + ' ' : '🏷️ '}${tag.nombre}`;
				incidenciaTipoSelect.appendChild(option);
			});
		}
		// Rellenar select de tipo de acceso
		const incidenciaAccesoSelect = document.getElementById('incidenciaAcceso');
		if (incidenciaAccesoSelect && window.etiquetasGlobales) {
			incidenciaAccesoSelect.innerHTML = '';
			window.etiquetasGlobales.filter(tag => tag.tipo === 'acceso').forEach(tag => {
				const option = document.createElement('option');
				option.value = tag.id;
				option.innerHTML = `${tag.icono ? `<i class='${tag.icono}'></i> ` : ''}${tag.nombre}`;
				incidenciaAccesoSelect.appendChild(option);
			});
		}
		// Recuperar el tipo de acceso del paciente seleccionado
		let tipoAccesoPaciente = '';
		let tipoAccesoObj = null;
		if (Array.isArray(pacientesGlobal)) {
			const paciente = pacientesGlobal.find(p => String(p.id) === String(pacienteId));
			if (paciente) {
				// Si el campo es un objeto, úsalo directamente
				if (paciente.tipo_acceso && typeof paciente.tipo_acceso === 'object') {
					tipoAccesoObj = paciente.tipo_acceso;
					tipoAccesoPaciente = tipoAccesoObj.id;
				} else if (paciente.acceso && paciente.acceso.tipo_acceso && typeof paciente.acceso.tipo_acceso === 'object') {
					tipoAccesoObj = paciente.acceso.tipo_acceso;
					tipoAccesoPaciente = tipoAccesoObj.id;
				} else {
					// Si es solo el id
					tipoAccesoPaciente = paciente.tipo_acceso_id || paciente.tipo_acceso || (paciente.acceso && paciente.acceso.tipo_acceso_id) || '';
					tipoAccesoObj = tiposAccesoGlobal.find(t => String(t.id) === String(tipoAccesoPaciente));
				}
			}
		}
		// Guardar el tipo de acceso en el modal como data attribute
		const modalIncidenciaPaciente = document.getElementById('modal-incidencia');
		if (modalIncidenciaPaciente) {
			// Limpiar todos los campos y atributos relevantes
			modalIncidenciaPaciente.setAttribute('data-paciente-id', pacienteId);
			modalIncidenciaPaciente.setAttribute('data-origen', 'pacientes');
			modalIncidenciaPaciente.setAttribute('data-tipo-acceso', tipoAccesoPaciente);
			const incidenciaTipoSelect = document.getElementById('incidenciaTipo');
			const fechaInput = document.getElementById('incidenciaFecha');
			const medidasInput = document.getElementById('incidenciaMedidas');
			const accesoIcono = document.getElementById('incidenciaAccesoIcono');
			const accesoNombre = document.getElementById('incidenciaAccesoNombre');
			const accesoDescripcion = document.getElementById('incidenciaAccesoDescripcion');
			if (incidenciaTipoSelect) incidenciaTipoSelect.selectedIndex = -1;
			if (fechaInput) {
				const hoy = new Date();
				const yyyy = hoy.getFullYear();
				const mm = String(hoy.getMonth() + 1).padStart(2, '0');
				const dd = String(hoy.getDate()).padStart(2, '0');
				fechaInput.value = `${yyyy}-${mm}-${dd}`;
			}
			if (medidasInput) medidasInput.value = '';
			if (accesoIcono) accesoIcono.textContent = '';
			if (accesoNombre) accesoNombre.textContent = '';
			if (accesoDescripcion) accesoDescripcion.textContent = '';
			// Mostrar el tipo de acceso en el box visual
			const accesoBox = document.getElementById('incidenciaAccesoBox');
			if (accesoBox && accesoIcono && accesoNombre && accesoDescripcion) {
				if (tipoAccesoObj) {
					// Icono
					if (tipoAccesoObj.icono) {
						if (tipoAccesoObj.icono.startsWith('bi-')) {
							accesoIcono.innerHTML = `<i class='bi ${tipoAccesoObj.icono}' style='color:${tipoAccesoObj.color || '#8e44ad'}'></i>`;
						} else {
							accesoIcono.innerHTML = `<span style='color:${tipoAccesoObj.color || '#8e44ad'}'>${tipoAccesoObj.icono}</span>`;
						}
					} else {
						accesoIcono.innerHTML = '';
					}
					// Nombre
					accesoNombre.textContent = tipoAccesoObj.nombre || '';
					// Descripción
					accesoDescripcion.textContent = tipoAccesoObj.descripcion || '';
				} else {
					accesoIcono.innerHTML = '';
					accesoNombre.textContent = 'No especificado';
					accesoDescripcion.textContent = '';
				}
			}
			const modal = new bootstrap.Modal(modalIncidenciaPaciente);
			modal.show();
		}
	}
	// Handler para el botón de añadir incidencia en la tabla de pacientes
	document.addEventListener('click', function(e) {
			if (e.target.closest('.btn-incidencia')) {
				const btn = e.target.closest('.btn-incidencia');
				const pacienteId = btn.getAttribute('data-id');
				window.abrirModalIncidenciaPaciente(pacienteId);
			}
	});
	if (filtroFechaPacientesInicio) {
		filtroFechaPacientesInicio.addEventListener('change', actualizarTablaPacientes);
	}
	if (filtroFechaPacientesFin) {
		filtroFechaPacientesFin.addEventListener('change', actualizarTablaPacientes);
	}
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
		filtroPendiente.addEventListener('change', cargarPacientes);
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
		// Mostrar modal de confirmación personalizado
		const modalConfirmacion = document.getElementById('modal-confirmacion');
		if (!modalConfirmacion) return;
		document.getElementById('modal-confirmacion-titulo').textContent = '¿Archivar paciente?';
		document.getElementById('modal-confirmacion-mensaje').textContent = `Esta acción archivará al paciente "${nombreCompleto}". No podrás desarchivarlo más adelante hasta que se implemente el funcionamiento.`;
		const icono = document.getElementById('modal-confirmacion-icono');
		icono.innerHTML = '<i class="bi bi-archive-fill text-warning" style="font-size:1.7em;"></i>';
		// Cambiar color del header y botón
		modalConfirmacion.querySelector('.modal-header').classList.remove('bg-light','bg-danger','bg-success');
		modalConfirmacion.querySelector('.modal-header').classList.add('bg-warning');
		const btnConfirmar = document.getElementById('btn-confirmar-accion');
		btnConfirmar.classList.remove('btn-danger','btn-success');
		btnConfirmar.classList.add('btn-warning');

		// Mostrar el modal
		const modalInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
		modalInstance.show();

		// Evitar listeners duplicados
		btnConfirmar.onclick = async function() {
			modalInstance.hide();
			await ipcRenderer.invoke('archivar-paciente', Number(pacienteId));
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
			if (window.cargarPacientesHistorial) window.cargarPacientesHistorial();
			if (window.cargarDatosDashboard) window.cargarDatosDashboard();
		};
		return;
	}
	// Botón de eliminar
    const btnEliminar = e.target.closest('.btn-eliminar');
    if (btnEliminar) {
        const pacienteId = btnEliminar.getAttribute('data-id');
        if (!pacienteId) return;
        const paciente = pacientesGlobal.find(p => p.id == pacienteId);
        const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellidos}` : `ID ${pacienteId}`;
        const modalConfirmacion = document.getElementById('modal-confirmacion');
        if (!modalConfirmacion) return;
        document.getElementById('modal-confirmacion-titulo').textContent = '¿Eliminar paciente?';
        document.getElementById('modal-confirmacion-mensaje').textContent = `Esta acción eliminará permanentemente al paciente "${nombreCompleto}". No podrás recuperar sus datos después.`;
        const icono = document.getElementById('modal-confirmacion-icono');
        icono.innerHTML = '<i class="bi bi-trash-fill text-danger" style="font-size:1.7em;"></i>';
        modalConfirmacion.querySelector('.modal-header').classList.remove('bg-light','bg-warning','bg-success');
        modalConfirmacion.querySelector('.modal-header').classList.add('bg-danger');
        const btnConfirmar = document.getElementById('btn-confirmar-accion');
        btnConfirmar.classList.remove('btn-warning','btn-success');
        btnConfirmar.classList.add('btn-danger');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modalInstance.show();
        btnConfirmar.onclick = async function() { 
			modalInstance.hide();
			await ipcRenderer.invoke('delete-paciente', Number(pacienteId));
			pacientesGlobal = await ipcRenderer.invoke('get-pacientes-completos');
			const pacienteIdValidoEliminar = pacienteId && !isNaN(Number(pacienteId)) && Number(pacienteId) > 0;
			if (pacienteIdValidoEliminar) {
				await ipcRenderer.invoke('notificaciones-add', {
					tipo: 'Pacientes',
					mensaje: `Se eliminó el paciente ${nombreCompleto}`,
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
			mostrarMensaje(`Paciente eliminado correctamente: <b>${nombreCompleto}</b>`, 'danger');
			if (window.cargarPacientesHistorial) window.cargarPacientesHistorial();
			if (window.cargarDatosDashboard) window.cargarDatosDashboard();
        };
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
		// Guardar copia profunda del paciente actual, incluyendo objeto pendiente si existe
		const pacienteCopia = JSON.parse(JSON.stringify(paciente));
		if (paciente.pendiente) {
			pacienteCopia.pendiente = { ...paciente.pendiente };
		}
		window.pacienteOriginalEditando = pacienteCopia;

		document.getElementById('nombre').value = paciente.nombre || '';
		document.getElementById('apellidos').value = paciente.apellidos || '';
		document.getElementById('sexo').value = paciente.sexo || '';
		document.getElementById('nacimiento').value = paciente.fecha_nacimiento || '';
		document.getElementById('alta').value = paciente.fecha_alta || '';
		document.getElementById('telefono').value = paciente.telefono || '';
		document.getElementById('correo').value = paciente.correo || ''; 
		document.getElementById('direccion').value = paciente.direccion || ''; 
		document.getElementById('alergias').value = paciente.alergias || ''; 
		document.getElementById('observaciones').value = paciente.acceso?.observaciones ?? '';
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
			document.getElementById('fechaPrimeraPuncion').value = paciente.acceso?.fecha_primera_puncion ?? '';
		}
		if (document.getElementById('fechaInstalacionAccesoPendiente')) {
			document.getElementById('fechaInstalacionAccesoPendiente').value = paciente.pendiente?.fecha_instalacion_acceso_pendiente ?? '';
		}
		document.getElementById('fechaInstalacionAcceso').value = paciente.acceso?.fecha_instalacion || paciente.fecha_instalacion || '';
		mostrarCamposFechaAcceso();
		displayCamposCHD();
		console.log("[PACIENTE][editar] Datos del paciente:", paciente);
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
		console.log('[DEBUG] Guardando Editando paciente ID:', window.pacienteEditando);
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
	// Filtrar por rango de fechas
	const fechaInicio = filtroFechaPacientesInicio?.value;
	const fechaFin = filtroFechaPacientesFin?.value;
	if (fechaInicio || fechaFin) {
		filtrados = filtrados.filter(p => {
			let fechaInstalacion = p.fecha_instalacion || p.fecha_alta || '';
			if (!fechaInstalacion || !p.nombre) return false;
			// Extraer solo la parte YYYY-MM-DD
			fechaInstalacion = fechaInstalacion.slice(0, 10);
			if (fechaInicio && fechaFin) {
				return fechaInstalacion >= fechaInicio && fechaInstalacion <= fechaFin;
			} else if (fechaInicio) {
				return fechaInstalacion >= fechaInicio;
			} else if (fechaFin) {
				return fechaInstalacion <= fechaFin;
			}
			return true;
		});
	}
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

		// Filtro por estado: Todos, Infectado, Incidencias, Pendiente, Archivado
		const estado = filtroPendiente?.value || '';
		if (estado && estado !== 'archivado') {
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
		// Incidencias: icono, color, nombre y fecha
		let badgesHtml = '';
		if (Array.isArray(paciente.incidencias) && paciente.incidencias.length > 0) {
			const incidenciasFiltradas = paciente.incidencias.filter(inc => inc.activo && inc.tag && inc.tag.tipo === 'incidencia');
			badgesHtml = incidenciasFiltradas
				.map(inc => {
					const tag = inc.tag;
					let fecha = '';
					if (inc.fecha) {
						const match = inc.fecha.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
						if (match) fecha = `${match[3]}/${match[2]}/${match[1]}`;
						else fecha = inc.fecha;
					}
					return `<i class=\"bi bi-tag-fill\" style=\"color:${tag.color};font-size:1.15em;margin-right:4px;vertical-align:middle;\" title=\"${tag.nombre.replace(/\"/g, '&quot;')}\"></i>`;
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
				<button class="btn btn-outline-secondary btn-sm btn-incidencia" data-id="${paciente.id}" title="Añadir Incidencia" style="border-color:#8e44ad;color:#8e44ad;"><i class="bi bi-virus"></i></button>
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
async function cargarPacientes() {
	const estado = filtroPendiente?.value || '';
	let pacientes;
	if (estado === 'archivado') {
		pacientes = await ipcRenderer.invoke('get-pacientes-archivados');
	} else {
		pacientes = await ipcRenderer.invoke('get-pacientes-completos');
	}
	// Para cada paciente, asociar los IDs de etiquetas desde sus incidencias activas
	for (const paciente of pacientes) {
		if (Array.isArray(paciente.incidencias)) {
			paciente.etiquetas = paciente.incidencias
				.filter(inc => inc.activo && inc.etiqueta_id)
				.map(inc => inc.etiqueta_id);
		} else {
			paciente.etiquetas = [];
		}
	}
	const paginaAnterior = paginaActual;
	pacientesGlobal = pacientes;
	// Calcular el total de páginas con los nuevos datos
	const totalPaginas = Math.max(1, Math.ceil(pacientesGlobal.length / pacientesPorPagina));
	// Si la página anterior sigue existiendo, mantenerla. Si no, ir a la última disponible.
	paginaActual = Math.min(paginaAnterior, totalPaginas);
	actualizarTablaPacientes();
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

	window.pacienteEditando = null;
}

// Crear nuevo paciente
async function crearPaciente() {
	const profesionalValue = document.getElementById('profesional').value;
	const pendienteObj = {
		id: null,
		tabla_acceso_id_vinculado: document.getElementById('accesoPendiente').value,
		fecha_instalacion_acceso_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
		ubicacion_chd: document.getElementById('chd-ubicacion') ? document.getElementById('chd-ubicacion').value : '',
		lado_chd: document.getElementById('chd-lado') ? document.getElementById('chd-lado').value : '',
		profesional_id: profesionalValue,
		pendiente_tipo_id: document.getElementById('pendiente').value,
		pendiente_tipo_acceso_id: document.getElementById('accesoPendiente').value,
		paciente_id: null,
		activo: true
	};
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
		profesional_id: profesional,
		activo: true,
		pendiente: pendienteObj,
		acceso: {
			tipo_acceso_id: tipoAcceso,
			ubicacion_anatomica: ubicacion,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			fecha_primera_puncion: document.getElementById('fechaPrimeraPuncion').value,
			observaciones: document.getElementById('observaciones').value,
			profesional_id: profesional,
			activo: true
		}
	};
	// Llama al ipcHandler para añadir paciente y obtiene el id
	const result = await ipcRenderer.invoke('add-paciente', paciente);
	if (window.cargarPacientesHistorial) window.cargarPacientesHistorial();

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

		// Crear entrada de historial tipo Registro
		if (window.addEntradasHistorial) {
			   await window.addEntradasHistorial('Registro', {
				   paciente_id: pacienteId,
				   profesional_id: paciente.profesional_id ? Number(paciente.profesional_id) : null
			   });
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
		profesional_id: document.getElementById('profesional').value,
		activo: true,
		pendiente: {
			id: window.pacienteEditando?.pendiente?.id || null,
			tabla_acceso_id_vinculado: document.getElementById('accesoPendiente').value,
			fecha_instalacion_acceso_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
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
			fecha_primera_puncion: document.getElementById('fechaPrimeraPuncion') ? document.getElementById('fechaPrimeraPuncion').value : '',
			observaciones: document.getElementById('observaciones').value,
			profesional_id: document.getElementById('profesional').value,
			activo: true
		}
	};

	console.log('Paciente a editar:', paciente);

	await registrarCambiosClinicosHistorial(window.pacienteOriginalEditando, paciente);

	const result = await ipcRenderer.invoke('update-paciente', paciente);
	if (window.cargarPacientesHistorial) window.cargarPacientesHistorial();
		// Solo registrar notificación si hubo cambios
		if (result && result.changes > 0) {
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
	
	// Actualizar card, timeline y historial para la sección de historial 
	if (typeof window.renderPacienteCard === 'function') {
		window.renderPacienteCard(paciente);
	}
	if (typeof window.renderTimelinePacienteDB === 'function') {
		window.renderTimelinePacienteDB();
	}
	if (typeof window.renderHistorial === 'function') {
		window.renderHistorial();
	}
	const modalEl = document.getElementById('modal-paciente');
	let modalInstance = bootstrap.Modal.getInstance(modalEl);
	if (!modalInstance) {
		modalInstance = new bootstrap.Modal(modalEl);
	}
	if (modalInstance) {    
		modalInstance.hide();
	}  
	mostrarMensaje(`Paciente editado correctamente: <b>${paciente.nombre} ${paciente.apellidos}</b>`, 'success'); 

	window.pacienteEditando = null; 

	// Actualizar cards del dashboard
	if (window.cargarDatosDashboard) window.cargarDatosDashboard();
}

// MODAL DE INFECCIONES

// Handler para el botón Guardar infecciones
const btnGuardarInfecciones = document.getElementById('btn-guardar-infecciones'); 
if (btnGuardarInfecciones) {
	// --- Actualizar tabla de historial también ---
	if (typeof window.renderHistorial === 'function') {
		window.renderHistorial();
	}
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
			// Crear registro en historial_clinico por cada infección añadida
			for (const inf of infeccionesTemp) {
				// Inicializar etiquetasPorId si está vacío
				if (!etiquetasPorId || Object.keys(etiquetasPorId).length === 0) {
					etiquetasPorId = {};
					if (Array.isArray(window.etiquetasGlobales)) {
						window.etiquetasGlobales.forEach(tag => {
							etiquetasPorId[tag.id] = tag;
						});
					}
				}
				const tag = etiquetasPorId[inf.tagId];
				const nombreInfeccion = tag && tag.nombre ? tag.nombre : 'Infección';
				const iconoEmoji = tag && tag.icono ? `${tag.icono}` : '';
				const motivo = `Nueva infección registrada: ${iconoEmoji} ${nombreInfeccion}` + (inf.comentarios ? `. Comentarios: ${inf.comentarios}` : '');
				const timelineObj = {
					paciente_id: pacienteId,
					fecha: inf.fecha,
					tipo_evento: 'Infección',
					motivo,
					profesional_id: (pacientesGlobal.find(p => p.id == pacienteId)?.profesional_id) || null,
					notas: '',
					adjuntos: ''
				};
				await ipcRenderer.invoke('historial-add', timelineObj);
			}
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
			// Actualizar la tabla de pacientes tras guardar infecciones y refrescar pacientesGlobal
			await cargarPacientes();
			// Actualizar el card del paciente en la sección de historial si está presente
			if (window.origenModalInfeccion === 'historial' && typeof window.renderPacienteCard === 'function') {
				// Obtener todos los pacientes completos y filtrar por ID
				const pacientesCompletos = await ipcRenderer.invoke('get-pacientes-completos');
				const pacienteActualizado = pacientesCompletos.find(p => p.id == pacienteId);
				window.renderPacienteCard(pacienteActualizado);
			}
			// --- Actualizar timeline de historial si existe ---
			if (window.renderTimelinePacienteDB) {
				try {
					await window.renderTimelinePacienteDB();
					
				} catch (err) {
					console.error('Error al refrescar timeline de historial tras guardar infecciones:', err);
				}
			}
			if(window.renderHistorial) {
				try {
					await window.renderHistorial();
				} catch (err) {
					console.error('Error al refrescar historial tras guardar infecciones:', err);
				}
			}
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

async function registrarCambiosClinicosHistorial(pacienteAnterior, pacienteNuevo) {
	function sonEquivalentesVacios(a, b) {
		const vacios = [undefined, null, '', 'undefined', 'null'];
		// Solo equivalentes si ambos son vacíos
		return vacios.includes(a) && vacios.includes(b) && (a === b);
	}
    // --- Registro de cambios clínicos en historial ---
	const camposClinicos = [
		{ key: 'profesional_id', nombre: 'Profesional a Cargo', icono: false },
		{ key: 'tipo_acceso_id', nombre: 'Tipo de acceso', icono: true, tipo: 'acceso' },
		{ key: 'ubicacion_anatomica', nombre: 'Ubicación anatómica', icono: false },
		{ key: 'ubicacion_lado', nombre: 'Lado de acceso', icono: false },
		{ key: 'fecha_instalacion', nombre: 'Fecha de instalación', icono: false },
		{ key: 'fecha_alta', nombre: 'Fecha de alta', icono: false },
		{ key: 'observaciones', nombre: 'Observaciones', icono: false },
		{ key: 'pendiente_tipo_id', nombre: 'Pendiente', icono: true, tipo: 'pendiente' },
		{ key: 'pendiente_tipo_acceso_id', nombre: 'Acceso pendiente', icono: true, tipo: 'acceso' },
	{ key: 'fecha_instalacion_acceso_pendiente', nombre: 'Fecha instalación acceso pendiente', icono: false },
	{ key: 'primera_puncion', nombre: 'Fecha de la primera punción', icono: false },
		{ key: 'ubicacion_chd', nombre: 'CHD Ubicación anatómica', icono: false },
		{ key: 'lado_chd', nombre: 'CHD Lado', icono: false },
	];

	const camposPersonales = [
		{ key: 'nombre', nombre: 'Nombre', icono: false },
		{ key: 'apellidos', nombre: 'Apellidos', icono: false },
		{ key: 'sexo', nombre: 'Sexo', icono: false },
		{ key: 'fecha_nacimiento', nombre: 'Fecha de Nacimiento', icono: false },
		{ key: 'telefono', nombre: 'Teléfono', icono: false },
		{ key: 'correo', nombre: 'Correo', icono: false },
		{ key: 'direccion', nombre: 'Dirección', icono: false },
		{ key: 'alergias', nombre: 'Alergias', icono: false },
	];

    // Unificar estructura para comparar correctamente
	function normalizarPaciente(p) {
		const out = { ...p };
		if (p.acceso) {
			for (const key in p.acceso) {
				out[key] = p.acceso[key] ?? '';
			}
		}
		// Copiar todos los campos de pendiente
		if (p.pendiente) {
			for (const key in p.pendiente) {
				out[key] = p.pendiente[key] ?? '';
			}
			// Normalización específica para campos alternativos de acceso pendiente
			out.pendiente_tipo_id = p.pendiente.pendiente_tipo_id ?? '';
			out.pendiente_tipo_acceso_id = p.pendiente.pendiente_tipo_acceso_id ?? p.pendiente.tabla_acceso_id_vinculado ?? '';
			out.pendiente_tipo_acceso = p.pendiente.pendiente_tipo_acceso ?? p.pendiente.tabla_acceso_vinculado ?? '';
			out.pendiente_acceso_fecha = p.pendiente.pendiente_acceso_fecha ?? p.pendiente.tabla_acceso_fecha_vinculado ?? '';
			out.pendiente_acceso_notas = p.pendiente.pendiente_acceso_notas ?? p.pendiente.tabla_acceso_notas_vinculado ?? '';
		}
		// Asegurar que los campos clave existan aunque sean vacíos
		// Para primera_puncion, buscar en acceso.fecha_primera_puncion o en el propio paciente
		out.primera_puncion = p.acceso?.fecha_primera_puncion ?? p.primera_puncion ?? '';
		const claves = ['fecha_instalacion_acceso_pendiente','ubicacion_chd','lado_chd'];
		for (const k of claves) {
			if (typeof out[k] === 'undefined') out[k] = '';
		}
		return out;
	}
	const pacienteAntNorm = normalizarPaciente(pacienteAnterior);
	const pacienteNueNorm = normalizarPaciente(pacienteNuevo);

	const cambiosClinicos = [];
	for (const campo of camposClinicos) {
		let valorAnterior = pacienteAntNorm[campo.key];
		let valorNuevo = pacienteNueNorm[campo.key];
	const equivalentes = sonEquivalentesVacios(valorAnterior, valorNuevo);
	const iguales = String(valorAnterior).trim() === String(valorNuevo).trim();
		if (!equivalentes && !iguales) {
			if (campo.icono && campo.tipo === 'acceso') {
				const accesoAnt = tiposAccesoGlobal.find(t => String(t.id) === String(valorAnterior));
				const accesoNue = tiposAccesoGlobal.find(t => String(t.id) === String(valorNuevo));
				const nombreAnt = accesoAnt ? `${accesoAnt.icono ? accesoAnt.icono + ' ' : ''}${accesoAnt.nombre}` : (valorAnterior ? valorAnterior : '[Sin acceso]');
				const nombreNue = accesoNue ? `${accesoNue.icono ? accesoNue.icono + ' ' : ''}${accesoNue.nombre}` : (valorNuevo ? valorNuevo : '[Sin acceso]');
				cambiosClinicos.push(`${campo.nombre}: ${nombreAnt} → ${nombreNue}`);
			} else if (campo.icono && campo.tipo === 'pendiente') {
				const pendienteAnt = tiposPendienteGlobal.find(t => String(t.id) === String(valorAnterior));
				const pendienteNue = tiposPendienteGlobal.find(t => String(t.id) === String(valorNuevo));
				const nombreAnt = pendienteAnt ? pendienteAnt.nombre : (valorAnterior ? valorAnterior : '[Sin pendiente]');
				const nombreNue = pendienteNue ? pendienteNue.nombre : (valorNuevo ? valorNuevo : '[Sin pendiente]');
				cambiosClinicos.push(`${campo.nombre}: ${nombreAnt} → ${nombreNue}`);
			} else {
				cambiosClinicos.push(`${campo.nombre}: ${valorAnterior ?? ''} → ${valorNuevo ?? ''}`);
			}
		}
	}
	if (cambiosClinicos.length > 0) {
		const motivo = cambiosClinicos.map(c => `• ${c}`).join('<br>');
		await ipcRenderer.invoke('historial-add', {
			paciente_id: pacienteNuevo.id,
			fecha: new Date().toISOString().slice(0, 10),
			tipo_evento: `Actualización de datos clínicos`,
			motivo,
			profesional_id: pacienteNuevo.profesional_id,
			notas: '',
			adjuntos: ''
		});
	}

	// Registro de cambios personales
	const cambiosPersonales = [];
	for (const campo of camposPersonales) {
		let valorAnterior = pacienteAntNorm[campo.key];
		let valorNuevo = pacienteNueNorm[campo.key];
		const equivalentes = sonEquivalentesVacios(valorAnterior, valorNuevo);
		if (!equivalentes && String(valorAnterior) !== String(valorNuevo)) {
			cambiosPersonales.push(`${campo.nombre}: ${valorAnterior ?? ''} → ${valorNuevo ?? ''}`);
		}
	}
	if (cambiosPersonales.length > 0) {
		const motivo = cambiosPersonales.map(c => `• ${c}`).join('<br>');
		await ipcRenderer.invoke('historial-add', {
			paciente_id: pacienteNuevo.id,
			fecha: new Date().toISOString().slice(0, 10),
			tipo_evento: `Actualización de datos personales`,
			motivo,
			profesional_id: pacienteNuevo.profesional_id,
			notas: '',
			adjuntos: ''
		});
	}
}


