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
// Cargar los elementos en el DOM
document.addEventListener('DOMContentLoaded', async () => {
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
		selectPendiente.addEventListener('change', function() {
			mostrarCamposFechaAcceso();
		});
	}
});
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

	// Pendiente: mostrar fechaInstalacionAccesoPendiente solo si es "Retiro"
	if (selectPendiente) {
		const retiroPendiente = tiposPendienteGlobal.find(tp => tp.nombre && tp.nombre.toLowerCase().includes('retiro'));
		if (selectPendiente.value && retiroPendiente && String(selectPendiente.value) === String(retiroPendiente.id)) {
			fechaLabelPend.style.display = '';
			fechaInputPend.style.display = '';
		} else {
			fechaLabelPend.style.display = 'none';
			fechaInputPend.style.display = 'none';
			fechaInputPend.value = '';
		}
	}
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
}

// Handler global para los botones de eliminar en la tabla
document.addEventListener('click', async function(e) {
	const btnArchivar = e.target.closest('.btn-archivar');
	if (btnArchivar) {
		const pacienteId = btnArchivar.getAttribute('data-id');
		if (!pacienteId) return;
		await ipcRenderer.invoke('archivar-paciente', Number(pacienteId));
		cargarPacientes();
		mostrarMensaje('Paciente archivado correctamente', 'info');
		return;
	}
	const btn = e.target.closest('.btn-eliminar');
	if (btn) {
		const pacienteId = btn.getAttribute('data-id');
		if (!pacienteId) return;
		await ipcRenderer.invoke('delete-paciente', Number(pacienteId));
		cargarPacientes();
		const modalEl = document.getElementById('modal-paciente');
		let modalInstance = bootstrap.Modal.getInstance(modalEl);
		if (modalInstance) {
			modalInstance.hide();
		}
		mostrarMensaje('Paciente eliminado correctamente', 'success');
	}
});

// Handler para el botón de editar paciente
document.addEventListener('click', async function(e) {
	const btn = e.target.closest('.btn-editar');
	if (btn) {
		const pacienteId = btn.getAttribute('data-id');
		if (!pacienteId) return;
		// Obtener datos completos del paciente
		if (!datosGlobalesCargados) await cargarDatosGlobal();    
		limpiarCamposNuevoPaciente();
		llenarSelectProfesional();
		llenarSelectTipoAcceso();
		llenarSelectUbicacion();
		llenarSelectPendiente();
		const paciente = await ipcRenderer.invoke('paciente-get-con-acceso', Number(pacienteId));
		if (!paciente) return;
		window.pacienteEditando = paciente;
		// Mostrar etiquetas activas visualmente
		const etiquetasActivasContainer = document.getElementById('etiquetas-activas-container');
		etiquetasActivasContainer.innerHTML = '<label for="etiquetas-activas-container" class="form-label"><i class="bi bi-tag-fill me-1"></i> Etiquetas Activas</label>';
		// Recoger incidencias activas del paciente
		const incidencias = await ipcRenderer.invoke('paciente-get-incidencias', paciente.id);
		let badgesHtml = '';
		console.log('incidencias:', incidencias);
		if (Array.isArray(paciente.etiquetas) && paciente.etiquetas.length > 0) {
			badgesHtml = paciente.etiquetas.map(id => {
				const tag = etiquetasPorId[id];
				if (!tag || tag.tipo !== 'incidencia') return '';
				// Buscar incidencia activa para esta etiqueta
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
					// Buscar por id y por nombre
					if (incidencia.tipo_acceso_id) {
						accesoObj = tiposAccesoGlobal.find(t => String(t.id) === String(incidencia.tipo_acceso_id));
						if (accesoObj) {
							const colorCateter = '#5dade2CC';
							const badgeColor = accesoObj.nombre === 'Catéter' ? colorCateter : `${accesoObj.color}CC`;
							accesoBadge = `<span class='badge' style='background:linear-gradient(270deg,#f8f9faCC 0%,${badgeColor} 100%);color:#222;font-size:1em;padding:4px 14px 4px 10px;border-radius:16px;margin-left:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border:1.5px solid #e0e0e0;display:inline-flex;align-items:center;gap:6px;vertical-align:middle;' title='${accesoObj.nombre}'>${accesoObj.icono ? `<span style='font-size:1.3em;vertical-align:middle;margin-right:4px;'>${accesoObj.icono}</span>` : ''}<span style='font-weight:500;'>${accesoObj.nombre}</span></span>`;
						} else {
							// Si no está en tiposAccesoGlobal, mostrar el id
							accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='${incidencia.tipo_acceso_id}'>${incidencia.tipo_acceso_id}</span>`;
						}
					} else if (incidencia.tipo_acceso_id) {
						// Si existe tipo_acceso_id pero no está en tiposAccesoGlobal, mostrar el valor
						accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='${incidencia.tipo_acceso_id}'>${incidencia.tipo_acceso_id}</span>`;
					} else {
						accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='Sin acceso'>Sin acceso</span>`;
					}
				} else {
					accesoBadge = `<span class='badge' style='background:#e0e0e0;color:#222;font-size:0.93em;margin-left:6px;vertical-align:middle;' title='Sin acceso'>Sin acceso</span>`;
				}
				return `<span style="display:inline-flex;align-items:center;margin-right:10px;"><i class="bi bi-tag-fill" style="color:${tag.color};font-size:1.15em;margin-right:4px;vertical-align:middle;" title="${tag.nombre.replace(/\"/g, '&quot;')}"></i><span style="font-size:0.97em;color:#14532d;">${tag.nombre}${fecha ? ' <span style=\"color:#666;font-size:0.93em;margin-left:4px;\">(' + fecha + ')</span>' : ''}${accesoBadge}</span></span>`;
			}).join(' ');
		}
		etiquetasActivasContainer.innerHTML += `<div style="margin-top:6px;">${badgesHtml}</div>`;
		// Cargar datos en el formulario
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
		document.getElementById('avatar').value = paciente.avatar || '';
		document.getElementById('avatarPreview').src = paciente.avatar || '../assets/avatar-default.png';
		document.getElementById('profesional').value = paciente.acceso?.profesional_id || paciente.profesional_id || '';
		document.getElementById('tipoAcceso').value = paciente.acceso?.tipo_acceso_id || paciente.tipo_acceso_id || '';
		llenarSelectUbicacion();
		document.getElementById('ubicacion').value = paciente.acceso?.ubicacion_anatomica || paciente.ubicacion_anatomica || '';
		document.getElementById('lado').value = paciente.acceso?.ubicacion_lado || paciente.ubicacion_lado || '';
		document.getElementById('pendiente').value = paciente.pendiente?.pendiente_tipo_id || '';
		document.getElementById('accesoPendiente').value = paciente.pendiente?.acceso_id || '';
		document.getElementById('fechaInstalacionAcceso').value = paciente.acceso?.fecha_instalacion || paciente.fecha_instalacion || '';
		document.getElementById('fechaInstalacionAccesoPendiente').value = paciente.pendiente?.fecha || '';
		document.getElementById('etiquetasIncidencia').value = paciente.etiquetas_incidencia || '';
		mostrarCamposFechaAcceso();
		// Mostrar el modal de edición
		const modalEl = document.getElementById('modal-paciente');
		let modalInstance = bootstrap.Modal.getInstance(modalEl);
		if (!modalInstance) {
			modalInstance = new bootstrap.Modal(modalEl);
		}
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
			avatar: document.getElementById('avatar').value,
			profesional_id: profesional.value,
			tipo_acceso_id: tipoAcceso.value,
			ubicacion_anatomica: ubicacion.value,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
			pendiente: {
				id: window.pacienteEditando?.pendiente?.id || null,
				acceso_id: document.getElementById('accesoPendiente').value,
				fecha: document.getElementById('fechaInstalacionAccesoPendiente').value,
				observaciones: window.pacienteEditando?.pendiente?.observaciones || '',
				profesional_id: profesional.value,
				pendiente_tipo_id: document.getElementById('pendiente').value,
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
    select.innerHTML = '<option value="">Seleccione...</option>';
    profesionalesGlobal.forEach(prof => {
        select.innerHTML += `<option value="${prof.id}">${prof.nombre} ${prof.apellidos || ''}</option>`;
    });
}

// Llenar select de Tipo de Acceso y Acceso Pendiente
function llenarSelectTipoAcceso() {
    const selectAcceso = document.getElementById('tipoAcceso');
    const selectPendiente = document.getElementById('accesoPendiente');
		if (selectAcceso) {
			selectAcceso.innerHTML = '<option value="">Seleccione...</option>';
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
		selectPendiente.innerHTML = '<option value="">Seleccione...</option>';
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
    select.innerHTML = '<option value="">Seleccione...</option>';
    tiposPendienteGlobal.forEach(tipo => {
        select.innerHTML += `<option value="${tipo.id}">${tipo.nombre}</option>`;
    });
}

function llenarSelectUbicacion() {
    const select = document.getElementById('ubicacion');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione...</option>';
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


/*********************************/
/*           FUNCIONES           */
/*********************************/

// Listener para el botón de eliminar paciente

// Filtros
function filtrarPacientes() {
	let filtrados = [...pacientesGlobal];
	const texto = (inputBusqueda?.value || '').toLowerCase();
	const tipo = filtroTipoAcceso?.value || '';
	const pendiente = filtroPendiente?.value || '';
	if (texto) {
		filtrados = filtrados.filter(p =>
			p.nombre.toLowerCase().includes(texto) ||
			(p.apellidos && p.apellidos.toLowerCase().includes(texto))
		);
	}
	if (tipo) {
		filtrados = filtrados.filter(p => Number(p.tipo_acceso_id) === Number(tipo));
	}
	if (pendiente) {
		filtrados = filtrados.filter(p => String(p.proceso_actual) === String(pendiente));
	}
	return filtrados;
}

// Tabla de Pacientes
async function renderizarPacientes() {
	tablaPacientesBody.innerHTML = '';
	const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
	pacientes.forEach(paciente => {
		// tipo de acceso
		let tipoAccesoHtml = '<span class="badge bg-secondary" style="font-size:1em;">Sin tipo</span>';
		if (paciente.tipo_acceso && paciente.tipo_acceso.id) {
			let iconHtml = '';
			if (paciente.tipo_acceso.icono) {
				if (paciente.tipo_acceso.icono.startsWith('bi-')) {
					iconHtml = `<i class='bi ${paciente.tipo_acceso.icono}' style='color:${paciente.tipo_acceso.color || '#222'};font-size:1.15em;margin-right:4px;vertical-align:middle;'></i>`;
				} else {
					iconHtml = `<span style='font-size:1.15em;margin-right:4px;vertical-align:middle;'>${paciente.tipo_acceso.icono}</span>`;
				}
			}
			tipoAccesoHtml = `<span class="badge" style="font-size:1em;font-weight:normal;background:none;color:${paciente.tipo_acceso.color || '#222'};padding:0;margin:0;">${iconHtml}${paciente.tipo_acceso.nombre}</span>`;
		}
		// ubicación
		const acceso = paciente.acceso || {};
		const ubicacionCompleta = (acceso.ubicacion_anatomica && acceso.ubicacion_lado)
			? `${acceso.ubicacion_anatomica} ${acceso.ubicacion_lado}`
			: (acceso.ubicacion_anatomica || acceso.ubicacion_lado || '');
		// fecha instalación
		let fechaFormateada = '';
		let diasDetalle = '';
		if (acceso.fecha_instalacion) {
			const match = acceso.fecha_instalacion.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/);
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
				fechaFormateada = acceso.fecha_instalacion;
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
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${badgesHtml} ${paciente.nombre} ${paciente.apellidos}</td>
			<td>${tipoAccesoHtml}</td>
			<td>${ubicacionCompleta}</td>
			<td>${fechaFormateada}${diasDetalle}</td>
			<td>
				<button class="btn btn-outline-primary btn-sm btn-historial" data-id="${paciente.id}" title="Ver Historial Clínico"><i class="bi bi-journal-medical"></i></button>
				<button class="btn btn-outline-success btn-sm btn-editar" data-id="${paciente.id}"><i class="bi bi-pencil"></i></button>
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

// Cargar pacientes y renderizar
function cargarPacientes() {
	ipcRenderer.invoke('get-pacientes').then(pacientes => {
        pacientesGlobal = pacientes;
        paginaActual = 1;
        const filtrados = filtrarPacientes();
        const total = filtrados.length;
        const inicio = (paginaActual - 1) * pacientesPorPagina;
        const fin = inicio + pacientesPorPagina;
        renderizarPacientes(filtrados.slice(inicio, fin));
        renderizarPaginacion(total);
    });
}

// Función global para mostrar mensajes flotantes (debe estar antes de cualquier uso)
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

// Limpia todos los campos del modal de nuevo paciente
function limpiarCamposNuevoPaciente() {
	document.getElementById('nombre').value = '';
	document.getElementById('apellidos').value = '';
	document.getElementById('sexo').value = '';
	document.getElementById('nacimiento').value = '';
	document.getElementById('alta').value = '';
	document.getElementById('telefono').value = '';
	document.getElementById('correo').value = '';
	document.getElementById('direccion').value = '';
	document.getElementById('alergias').value = '';
	document.getElementById('observaciones').value = '';
	document.getElementById('avatar').value = '';
	document.getElementById('avatarPreview').src = '../assets/avatar-default.png';
	document.getElementById('profesional').value = '';
	document.getElementById('tipoAcceso').value = '';
	document.getElementById('ubicacion').value = '';
	document.getElementById('lado').value = '';
	document.getElementById('pendiente').value = '';
	document.getElementById('accesoPendiente').value = '';
	document.getElementById('fechaInstalacionAcceso').value = '';
	document.getElementById('fechaInstalacionAccesoPendiente').value = '';
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
		avatar: document.getElementById('avatar').value,
		profesional_id: profesional,
		tipo_acceso_id: tipoAcceso,
		ubicacion_anatomica: ubicacion,
		ubicacion_lado: document.getElementById('lado').value,
		activo: 1,
		pendiente: {
			acceso_id: document.getElementById('accesoPendiente').value,
			fecha: document.getElementById('fechaInstalacionAccesoPendiente').value,
			observaciones: '',
			profesional_id: profesional,
			pendiente_tipo_id: document.getElementById('pendiente').value,
			activo: 1
		},
		fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
		fecha_instalacion_pendiente: document.getElementById('fechaInstalacionAccesoPendiente').value,
		etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
		acceso: {
			tipo_acceso_id: tipoAcceso,
			ubicacion_anatomica: ubicacion,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			profesional_id: profesional,
			activo: 1
		}
	};
	// Llama al ipcHandler para añadir paciente y obtiene el id
	const result = await ipcRenderer.invoke('add-paciente', paciente);
	const pacienteId = result && result.id ? result.id : null;

	// Guardar incidencias si hay etiquetas seleccionadas y pacienteId válido
	const etiquetasSeleccionadas = Object.keys(incidenciaValoresTemp);
	if (pacienteId && etiquetasSeleccionadas.length > 0) {
		for (const id of etiquetasSeleccionadas) {
			const incidencia = incidenciaValoresTemp[id];
			console.log(`Guardando incidencia para paciente ${pacienteId} con etiqueta ${id}`, incidencia);
			await ipcRenderer.invoke('add-incidencia-con-tag', {
				pacienteId,
				tagId: id,
				tipo_acceso_id: incidencia.acceso ? Number(incidencia.acceso) : null,
				fecha: incidencia.fecha,
				tipo: incidencia.nombre,
				microorganismo_asociado: null,
				medidas: incidencia.medidas,
				etiqueta_id: id,
				activo: 1
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
	mostrarMensaje('Paciente creado correctamente', 'success');
	incidenciaValoresTemp = {}; // Limpiar variable temporal tras guardar
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
	// Eliminar log de etiquetas
	// etiquetasSelect.innerHTML = etiquetas
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
		avatar: document.getElementById('avatar').value,
		profesional_id: document.getElementById('profesional').value,
		tipo_acceso_id: document.getElementById('tipoAcceso').value,
		ubicacion_anatomica: document.getElementById('ubicacion').value,
		ubicacion_lado: document.getElementById('lado').value,
		fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
		etiquetas_incidencia: document.getElementById('etiquetasIncidencia').value,
		activo: 1,
		pendiente: {
			id: window.pacienteEditando?.pendiente?.id || null,
			acceso_id: document.getElementById('accesoPendiente').value,
			fecha: document.getElementById('fechaInstalacionAccesoPendiente').value,
			observaciones: window.pacienteEditando?.pendiente?.observaciones || '',
			profesional_id: document.getElementById('profesional').value,
			pendiente_tipo_id: document.getElementById('pendiente').value,
			paciente_id: id,
			activo: 1
		},
		acceso: {
			tipo_acceso_id: document.getElementById('tipoAcceso').value,
			ubicacion_anatomica: document.getElementById('ubicacion').value,
			ubicacion_lado: document.getElementById('lado').value,
			fecha_instalacion: document.getElementById('fechaInstalacionAcceso').value,
			profesional_id: document.getElementById('profesional').value,
			activo: 1
		},
		// Eliminados: incidencia, incidencia_valores
	};
	await ipcRenderer.invoke('update-paciente', paciente);
	cargarPacientes();
	const modalEl = document.getElementById('modal-paciente');
	let modalInstance = bootstrap.Modal.getInstance(modalEl);
	if (!modalInstance) {
		modalInstance = new bootstrap.Modal(modalEl);
	}
	if (modalInstance) {
		modalInstance.hide();
	}
	mostrarMensaje('Paciente editado correctamente', 'success');
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

		formDiv.innerHTML = `
			<div class=\"row align-items-center g-2 justify-content-between\">
				<div class=\"col-auto\">
					<span class=\"badge\" style=\"background:${color};color:#fff;font-size:0.95em;\" title=\"${nombre}\">${nombre}</span>
				</div>
				<div class=\"col d-flex justify-content-end align-items-center\">
					<input type=\"date\" class=\"form-control form-control-sm me-2\" placeholder=\"Fecha\" name=\"fecha-${id}\" required />
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
			console.log('incidenciaValoresTemp:', incidenciaValoresTemp); // Log al guardar incidencia
			mostrarMensaje(`Incidencia "${nombre}" guardada`, 'success');
			renderIncidenciaValores(selectedIncidencias);
		});
	});
}

