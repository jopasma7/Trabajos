try {
	const electron = require('electron');
} catch (e) {
	console.error('[DEPURACIÓN][RENDERER] require("electron") FALLÓ:', e);
}
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
const listaSimpleContainer = document.getElementById('paciente-etiquetas-lista-simple');
let etiquetasDisponibles = [];
let etiquetasAccesoDisponibles = [];
// Ahora cada elemento es {tagId, motivo, fecha}
let etiquetasSeleccionadas = [];
let etiquetasYaAsociadas = [];

async function cargarEtiquetasDisponibles(selectedIds = null, asociadasIds = null) {
	// Elementos del modal de paciente
	const selectIncidencia = document.getElementById('select-incidencia-etiqueta');
	const listaIncidencia = document.getElementById('lista-incidencia-etiquetas');
	if (!selectIncidencia || !listaIncidencia) return;
	let ipcRenderer;
	try {
		ipcRenderer = require('electron').ipcRenderer;
		if (!ipcRenderer) return;
	} catch (e) { return; }
	const allTags = await ipcRenderer.invoke('tags-get-all');
	etiquetasDisponibles = allTags.filter(tag => tag.tipo === 'incidencia');
	selectIncidencia.innerHTML = '';
	listaIncidencia.innerHTML = '';
	// Actualizar arrays
	if (selectedIds && Array.isArray(asociadasIds)) {
		etiquetasSeleccionadas = [...selectedIds];
		etiquetasYaAsociadas = [...asociadasIds];
	} else if (selectedIds) {
		etiquetasSeleccionadas = [...selectedIds];
		etiquetasYaAsociadas = [...selectedIds.map(e => e.tagId)];
	} else if (!pacienteEditando) {
		etiquetasSeleccionadas = [];
		etiquetasYaAsociadas = [];
	}
	// Opciones del select: mostrar todas las etiquetas disponibles, aunque ya estén seleccionadas
	etiquetasDisponibles.forEach(tag => {
		const opt = document.createElement('option');
		opt.value = tag.id;
		opt.textContent = (tag.icono ? tag.icono + ' ' : '') + tag.nombre;
		selectIncidencia.appendChild(opt);
	});
	// Mostrar etiquetas seleccionadas en lista visual, con motivo y fecha
	etiquetasSeleccionadas.forEach((item, idx) => {
		const tag = etiquetasDisponibles.find(t => Number(t.id) === Number(item.tagId));
		if (tag) {
			const li = document.createElement('li');
			li.className = 'd-flex flex-column gap-2';
			li.style.listStyle = 'none';
			li.style.width = 'auto';
			li.style.padding = '8px 15px';
			li.style.background = '#abe8d2ff';
			li.style.fontWeight = '500';
			li.innerHTML = `
				<div class="d-flex align-items-center justify-content-between">
					<span>${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}</span>
					<button type="button" class="btn btn-outline-danger btn-remove-incidencia p-0 ms-2" style="width:24px;height:24px;min-width:24px;min-height:24px;display:flex;align-items:center;justify-content:center;" data-idx="${idx}"><i class="bi bi-x" style="font-size:1.1em;"></i></button>
				</div>
				<div class="row g-2">
					<div class="col-7">
						<input type="text" class="form-control form-control-sm" placeholder="Motivo" data-motivo-idx="${idx}" value="${item.motivo || ''}">
					</div>
					<div class="col-5">
						<input type="date" class="form-control form-control-sm" data-fecha-idx="${idx}" value="${item.fecha || (new Date()).toISOString().split('T')[0]}">
					</div>
				</div>
			`;
			listaIncidencia.appendChild(li);
		}
	});
	// Añadir evento al botón de añadir
	const btnAdd = document.getElementById('btn-add-incidencia-etiqueta');
	if (btnAdd) {
		btnAdd.onclick = () => {
			const selected = selectIncidencia.value;
			if (selected) {
				// Solo añadir si no existe ya ese tag en etiquetasSeleccionadas
				if (!etiquetasSeleccionadas.some(e => e.tagId === Number(selected))) {
					etiquetasSeleccionadas.push({ tagId: Number(selected), motivo: '', fecha: (new Date()).toISOString().split('T')[0] });
					cargarEtiquetasDisponibles(etiquetasSeleccionadas, etiquetasYaAsociadas);
				}
			}
		};
	}
	// Evento para eliminar etiqueta seleccionada
	listaIncidencia.querySelectorAll('.btn-remove-incidencia').forEach(btn => {
		btn.onclick = () => {
			const idx = Number(btn.getAttribute('data-idx'));
			etiquetasSeleccionadas.splice(idx, 1);
			cargarEtiquetasDisponibles(etiquetasSeleccionadas, etiquetasYaAsociadas);
		};
	});
	// Evento para actualizar motivo y fecha
	listaIncidencia.querySelectorAll('input[data-motivo-idx]').forEach(input => {
		input.oninput = () => {
			const idx = Number(input.getAttribute('data-motivo-idx'));
			etiquetasSeleccionadas[idx].motivo = input.value;
		};
	});
	listaIncidencia.querySelectorAll('input[data-fecha-idx]').forEach(input => {
		input.oninput = () => {
			const idx = Number(input.getAttribute('data-fecha-idx'));
			etiquetasSeleccionadas[idx].fecha = input.value;
		};
	});
}

// Asociación del listener del modal para cargar etiquetas
document.addEventListener('DOMContentLoaded', () => {
	const modalPaciente = document.getElementById('modal-paciente');
	if (modalPaciente) {
		modalPaciente.addEventListener('show.bs.modal', async () => {
			// Si no se está editando, limpiar el id global
			if (!window.pacienteEditandoTipoAccesoId) {
				window.pacienteEditandoTipoAccesoId = undefined;
			}
			// Poblar select de tipo acceso dinámicamente
			if (selectTipoAccesoForm) {
				// Limpiar todas las opciones antes de añadir
				while (selectTipoAccesoForm.firstChild) {
					selectTipoAccesoForm.removeChild(selectTipoAccesoForm.firstChild);
				}
				let esNuevoPaciente = (window.pacienteEditandoTipoAccesoId === undefined || window.pacienteEditandoTipoAccesoId === null || window.pacienteEditandoTipoAccesoId === '');
				try {
					const allTags = await ipcRenderer.invoke('tags-get-all');
					etiquetasAccesoDisponibles = allTags.filter(tag => tag.tipo === 'acceso');
					await poblarSelectTipoAccesoEspera(etiquetasAccesoDisponibles);
				} catch {}
				if (esNuevoPaciente) {
					const optInit = document.createElement('option');
					optInit.value = '';
					optInit.textContent = 'Selecciona tipo de acceso...';
					optInit.disabled = true;
					optInit.selected = true;
					selectTipoAccesoForm.appendChild(optInit);
				}
				etiquetasAccesoDisponibles.forEach(tag => {
					const opt = document.createElement('option');
					opt.value = String(tag.id);
					opt.textContent = `${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}`;
					selectTipoAccesoForm.appendChild(opt);
				});
				// Asignar el valor del select solo si se está editando
				if (window.pacienteEditandoTipoAccesoId !== undefined && window.pacienteEditandoTipoAccesoId !== null && window.pacienteEditandoTipoAccesoId !== '') {
					setTimeout(() => {
						selectTipoAccesoForm.value = String(window.pacienteEditandoTipoAccesoId);
						selectTipoAccesoForm.dispatchEvent(new Event('change'));
						// Mostrar campos de ubicación si el tipo de acceso tiene ubicaciones
						const tag = etiquetasAccesoDisponibles.find(t => String(t.id) === String(window.pacienteEditandoTipoAccesoId));
						const ubicacionGroup = selectUbicacionAnatomica.closest('.col-7');
						const ladoGroup = selectUbicacionLado.closest('.col-5');
						if (tag && Array.isArray(tag.ubicaciones) && tag.ubicaciones.length > 0) {
							if (ubicacionGroup) ubicacionGroup.style.display = '';
							if (ladoGroup) ladoGroup.style.display = '';
						} else {
							if (ubicacionGroup) ubicacionGroup.style.display = 'none';
							if (ladoGroup) ladoGroup.style.display = 'none';
						}
					}, 60);
				} else {
					// Si es nuevo paciente, ocultar los campos
					const ubicacionGroup = selectUbicacionAnatomica.closest('.col-7');
					const ladoGroup = selectUbicacionLado.closest('.col-5');
					if (ubicacionGroup) ubicacionGroup.style.display = 'none';
					if (ladoGroup) ladoGroup.style.display = 'none';
				}
			}
			// Ocultar los campos de ubicación anatómica y lado por defecto
			const ubicacionGroup = selectUbicacionAnatomica.closest('.col-7');
			const ladoGroup = selectUbicacionLado.closest('.col-5');
			if (ubicacionGroup) ubicacionGroup.style.display = 'none';
			if (ladoGroup) ladoGroup.style.display = 'none';
			// Obtener las etiquetas realmente asociadas desde la BD
			let asociadas = [];
			try {
				asociadas = await ipcRenderer.invoke('paciente-get-etiquetas', pacienteEditando);
			} catch {}
			cargarEtiquetasDisponibles(etiquetasSeleccionadas, asociadas);
		});
		// Limpiar el id global y el historial de incidencias al cerrar el modal
		modalPaciente.addEventListener('hidden.bs.modal', () => {
			window.pacienteEditandoTipoAccesoId = undefined;
			const historialContainer = document.getElementById('historial-incidencias-container');
			if (historialContainer) {
				historialContainer.innerHTML = '';
			}
		});
	}
});

if (selectTipoAccesoForm && selectUbicacionAnatomica && selectUbicacionLado) {
	// Obtener el grupo de campos para mostrar/ocultar
	const ubicacionGroup = selectUbicacionAnatomica.closest('.col-7');
	const ladoGroup = selectUbicacionLado.closest('.col-5');
	// Ocultar ambos al inicio
	if (ubicacionGroup) ubicacionGroup.style.display = 'none';
	if (ladoGroup) ladoGroup.style.display = 'none';

	selectTipoAccesoForm.addEventListener('change', function() {
		const id = Number(this.value);
		selectUbicacionAnatomica.innerHTML = '';
		selectUbicacionLado.value = '';
		selectUbicacionLado.disabled = true;
		// Buscar la etiqueta seleccionada en etiquetasAccesoDisponibles por id
		const tag = (etiquetasAccesoDisponibles || []).find(t => t.id === id);
		if (!tag || !Array.isArray(tag.ubicaciones) || tag.ubicaciones.length === 0) {
			selectUbicacionAnatomica.innerHTML = '<option value="">Selecciona tipo de acceso primero</option>';
			selectUbicacionAnatomica.disabled = true;
			if (ubicacionGroup) ubicacionGroup.style.display = 'none';
			if (ladoGroup) ladoGroup.style.display = 'none';
			   selectUbicacionAnatomica.required = false;
			return;
		}
		selectUbicacionAnatomica.disabled = false;
		selectUbicacionAnatomica.innerHTML = '<option value="">Selecciona ubicación...</option>' +
			tag.ubicaciones.map(u => `<option value="${u}">${u}</option>`).join('') +
			'<option value="Otra">Otra</option>';
		if (ubicacionGroup) ubicacionGroup.style.display = '';
		if (ladoGroup) ladoGroup.style.display = '';
		   selectUbicacionAnatomica.required = true;
	});
	selectUbicacionAnatomica.addEventListener('change', function() {
		if (this.value) {
			selectUbicacionLado.disabled = false;
			if (this.value === 'Otra') {
				selectUbicacionLado.required = false;
			} else {
				selectUbicacionLado.required = true;
			}
		} else {
			selectUbicacionLado.value = '';
			selectUbicacionLado.disabled = true;
			selectUbicacionLado.required = false;
		}
	});
	// Inicialmente deshabilitados
	selectUbicacionAnatomica.disabled = true;
	selectUbicacionLado.disabled = true;
}
// pacientes.js
// Lógica específica para la sección Pacientes



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
// Elementos para lista de espera
const checkboxListaEspera = document.getElementById('paciente-lista-espera');
const selectListaEsperaContainer = document.getElementById('paciente-lista-espera-select-container');
const selectTipoAccesoEspera = document.getElementById('paciente-tipoacceso-espera');

// Mostrar/ocultar el select según el checkbox
if (checkboxListaEspera && selectListaEsperaContainer) {
    checkboxListaEspera.addEventListener('change', function() {
        selectListaEsperaContainer.style.display = this.checked ? '' : 'none';
    });
    // Inicializar visibilidad al abrir el modal
    selectListaEsperaContainer.style.display = checkboxListaEspera.checked ? '' : 'none';
}

// Función para poblar el select de tipo acceso destino (lista de espera)
async function poblarSelectTipoAccesoEspera(etiquetasAccesoDisponibles) {
	if (selectTipoAccesoEspera) {
		selectTipoAccesoEspera.innerHTML = '';
		const optInit = document.createElement('option');
		optInit.value = '';
		optInit.textContent = 'Tipo acceso pendiente...';
		optInit.disabled = true;
		optInit.selected = true;
		selectTipoAccesoEspera.appendChild(optInit);
		etiquetasAccesoDisponibles.forEach(tag => {
			const opt = document.createElement('option');
			opt.value = String(tag.id);
			opt.textContent = `${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}`;
			selectTipoAccesoEspera.appendChild(opt);
		});
	}
}

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
    // Prepara un mapa de etiquetas por id para acceso rápido
    const etiquetasPorId = {};
    (etiquetasDisponibles || []).forEach(tag => { etiquetasPorId[tag.id] = tag; });

	pacientes.forEach(paciente => {
        const tr = document.createElement('tr');
        // Formatear fecha a DD/MM/YYYY si es YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
        let fechaFormateada = '';
        let diasDetalle = '';
        if (paciente.fecha_instalacion) {
            const match = paciente.fecha_instalacion.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                fechaFormateada = `${match[3]}/${match[2]}/${match[1]}`;
                // Calcular días desde la fecha hasta hoy
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
                fechaFormateada = paciente.fecha_instalacion;
            }
        }
        const ubicacionCompleta = (paciente.ubicacion_anatomica && paciente.ubicacion_lado)
            ? `${paciente.ubicacion_anatomica} ${paciente.ubicacion_lado}`
            : (paciente.ubicacion_anatomica || paciente.ubicacion_lado || '');

		// Etiquetas de incidencia: solo icono coloreado, con tooltip
		let badgesHtml = '';
		if (Array.isArray(paciente.etiquetas) && paciente.etiquetas.length > 0) {
			badgesHtml = paciente.etiquetas.map(id => {
				const tag = etiquetasPorId[id];
				if (!tag) return '';
				if (tag.tipo !== 'incidencia') return '';
				// Icono coloreado con tooltip solo el nombre
				return `<i class=\"bi bi-tag-fill\" style=\"color:${tag.color};font-size:1.15em;margin-right:2px;vertical-align:middle;\" title=\"${tag.nombre.replace(/\"/g, '&quot;')}\"></i>`;
			}).join(' ');
		}

		tr.innerHTML = `
			<td>${badgesHtml} ${paciente.nombre} ${paciente.apellidos}</td>
			<td>${renderTipoAccesoBadgeById(paciente.tipo_acceso_id)}</td>
			<td>${ubicacionCompleta}</td>
			<td>${fechaFormateada}${diasDetalle}</td>
			<td>
				<button class="btn btn-outline-primary btn-sm btn-historial" data-id="${paciente.id}" title="Ver Historial Clínico"><i class="bi bi-journal-medical"></i></button>
				<button class="btn btn-outline-success btn-sm btn-editar" data-id="${paciente.id}"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${paciente.id}"><i class="bi bi-trash"></i></button>
			</td>
		`;
        tablaPacientesBody.appendChild(tr);
    });
}
// Devuelve badge con emoji y color según tipo de acceso
function renderTipoAccesoBadgeById(tipo_acceso_id) {
	if (!tipo_acceso_id) return '<span class="badge bg-secondary" style="font-size:1em;">Sin tipo</span>';
	const tag = (etiquetasAccesoDisponibles || []).find(t => t.id === tipo_acceso_id);
	if (tag) {
		return `<span class="badge" style="font-size:1em;font-weight:normal;background:none;color:#222;padding:0;margin:0;">${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}</span>`;
	}
	return '<span class="badge bg-secondary" style="font-size:1em;">Sin tipo</span>';
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
		etiquetasSeleccionadas = [];
		cargarEtiquetasDisponibles([]);
		document.getElementById('modalPacienteLabel').innerHTML = '<span style="font-size:1.2em;vertical-align:-0.1em;">🧑‍⚕️</span> Nuevo Paciente';
		// Poner fecha actual por defecto
		const inputFecha = document.getElementById('paciente-fecha');
		if (inputFecha) {
			const hoy = new Date();
			const yyyy = hoy.getFullYear();
			const mm = String(hoy.getMonth() + 1).padStart(2, '0');
			const dd = String(hoy.getDate()).padStart(2, '0');
			inputFecha.value = `${yyyy}-${mm}-${dd}`;
		}
		// Forzar tipo de acceso a vacío
		const selectTipoAcceso = document.getElementById('paciente-tipoacceso');
		if (selectTipoAcceso) {
			selectTipoAcceso.value = '';
		}
	});
}

// Filtros: búsqueda, tipo de acceso, fecha
if (inputBusqueda) inputBusqueda.addEventListener('input', () => { paginaActual = 1; actualizarTablaPacientes(); });


// Guardar (agregar o editar) paciente
if (formPaciente) {
    formPaciente.addEventListener('submit', async (e) => {
        e.preventDefault();
        const paciente = {
            nombre: document.getElementById('paciente-nombre').value.trim(),
            apellidos: document.getElementById('paciente-apellidos').value.trim(),
            tipo_acceso_id: Number(document.getElementById('paciente-tipoacceso')?.value) || null,
            fecha_instalacion: document.getElementById('paciente-fecha')?.value || '',
            ubicacion_anatomica: selectUbicacionAnatomica?.value || '',
            ubicacion_lado: selectUbicacionLado?.value || '',
            etiquetas: [...etiquetasSeleccionadas]
        };

		// Guardar incidencias seleccionadas
		let pacienteId;
		if (pacienteEditando) {
			paciente.id = pacienteEditando;
			await ipcRenderer.invoke('edit-paciente', paciente);
			pacienteId = paciente.id;
			if (etiquetasSeleccionadas.length) {
				await Promise.all(etiquetasSeleccionadas.map(inc =>
					ipcRenderer.invoke('incidencia-add-con-tag', pacienteId, Number(inc.tagId), inc.motivo, inc.fecha)
				));
			}
			cargarPacientes();
		} else {
			const result = await ipcRenderer.invoke('add-paciente', paciente);
			pacienteId = result.id;
			if (etiquetasSeleccionadas.length) {
				await Promise.all(etiquetasSeleccionadas.map(inc =>
					ipcRenderer.invoke('incidencia-add-con-tag', pacienteId, Number(inc.tagId), inc.motivo, inc.fecha)
				));
			}
			cargarPacientes();
			const tag = (etiquetasAccesoDisponibles || []).find(t => t.id === paciente.tipo_acceso_id);
			mostrarMensaje(`Nuevo paciente <b>${paciente.nombre} ${paciente.apellidos}</b> creado. Tipo de Acceso: <b>${tag ? (tag.icono ? tag.icono + ' ' : '') + tag.nombre : 'Sin tipo'}</b>`, 'success');
		}
        const modal = bootstrap.Modal.getOrCreateInstance(modalPaciente);
        modal.hide();
    });
}

// Nueva función para renderizar incidencias en el modal
function cargarIncidenciasEnModal(incidencias) {
	// Historial visual (no editable) al final del modal
	const historialContainerId = 'historial-incidencias-container';
	let historialContainer = document.getElementById(historialContainerId);
	const modalBody = document.querySelector('#modal-paciente .modal-body');
	if (!historialContainer) {
		historialContainer = document.createElement('div');
		historialContainer.id = historialContainerId;
	historialContainer.className = 'mb-2 rounded border bg-light';
	historialContainer.style.background = '#f8fafc';
	historialContainer.style.maxHeight = '140px';
	historialContainer.style.overflowY = 'auto';
	historialContainer.style.paddingTop = '10px';
	historialContainer.style.paddingBottom = '10px';
		if (modalBody) {
			// Insert label above historialContainer
			const label = document.createElement('div');
			label.textContent = 'Incidencias previas';
			label.className = 'mb-1 fw-bold text-secondary';
			modalBody.appendChild(label);
			modalBody.appendChild(historialContainer);
		}
	}
	if (!incidencias || !incidencias.length) {
		historialContainer.innerHTML = '<div class="text-muted">Sin incidencias previas.</div>';
		historialContainer.className = 'mb-2 d-flex flex-column gap-2 align-items-start';
			return;
		}
		// Visualización ultra compacta tipo lista horizontal con separadores
		const div = document.createElement('div');
	div.className = 'd-flex flex-column gap-2 align-items-start';
	const incidenciasOrdenadas = [...incidencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
	incidenciasOrdenadas.forEach((inc, idx) => {
			const tag = etiquetasDisponibles.find(t => Number(t.id) === Number(inc.tagId));
			if (tag) {
				const item = document.createElement('span');
				item.className = 'd-inline-flex align-items-center px-2 py-1';
				item.style.fontSize = '0.95em';
				item.innerHTML = `
				<span class="badge ms-2" style="font-size:0.90em;background:#e3e6f5;color:#222;min-width:90px;text-align:center;">${inc.fecha}</span>
				<span style="font-weight:500;color:#009879;margin-left:8px;">${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}</span>
				<span class="badge bg-light text-dark border ms-2" style="font-size:0.90em;">${inc.motivo || 'Sin motivo'}</span>
				`;
				div.appendChild(item);
			}
		});
		historialContainer.innerHTML = '';
		historialContainer.appendChild(div);
}

// Delegación de eventos para editar y eliminar
if (tablaPacientesBody) {
	tablaPacientesBody.addEventListener('click', async (e) => {
		if (e.target.closest('.btn-historial')) {
			const id = e.target.closest('.btn-historial').dataset.id;
			mostrarMensaje('Funcionalidad de Historial Clínico para el paciente ID ' + id + ' próximamente.', 'info');
		}
		if (e.target.closest('.btn-editar')) {
			const id = e.target.closest('.btn-editar').dataset.id;
			const pacientes = await ipcRenderer.invoke('get-pacientes');
			const paciente = pacientes.find(p => p.id == id);
			if (paciente) { 
				pacienteEditando = paciente.id;
				document.getElementById('paciente-nombre').value = paciente.nombre;
				document.getElementById('paciente-apellidos').value = paciente.apellidos;
				// Limpiar incidencias visuales y seleccionadas
				etiquetasSeleccionadas = [];
				const listaIncidencia = document.getElementById('lista-incidencia-etiquetas');
				if (listaIncidencia) listaIncidencia.innerHTML = '';
				// Poblar el select de tipo acceso antes de asignar el valor
				if (selectTipoAccesoForm) {
					// Eliminar todas las opciones previas (incluida la por defecto)
					selectTipoAccesoForm.innerHTML = '';
					etiquetasAccesoDisponibles.forEach(tag => {
						const opt = document.createElement('option');
						opt.value = String(tag.id);
						opt.textContent = `${tag.icono ? tag.icono + ' ' : ''}${tag.nombre}`;
						selectTipoAccesoForm.appendChild(opt);
					});
					// Esperar a que el select esté completamente poblado antes de asignar el valor
					setTimeout(() => {
						if (paciente.tipo_acceso_id && selectTipoAccesoForm.querySelector(`option[value='${paciente.tipo_acceso_id}']`)) {
							selectTipoAccesoForm.value = String(paciente.tipo_acceso_id);
						} else {
							selectTipoAccesoForm.selectedIndex = 0;
						}
						selectTipoAccesoForm.dispatchEvent(new Event('change'));
					}, 50);
				}
				const fechaInput = document.getElementById('paciente-fecha');
				if (fechaInput) {
					let fecha = paciente.fecha_instalacion || '';
					if (fecha && fecha.includes('T')) fecha = fecha.split('T')[0];
					fechaInput.value = fecha;
				}
				// Esperar a que el select de ubicaciones esté poblado antes de asignar el valor y disparar el evento
				setTimeout(() => {
					if (selectUbicacionAnatomica) {
						selectUbicacionAnatomica.value = paciente.ubicacion_anatomica || '';
						selectUbicacionAnatomica.dispatchEvent(new Event('change'));
					}
					if (selectUbicacionLado) selectUbicacionLado.value = paciente.ubicacion_lado || '';
				}, 100);
				document.getElementById('modalPacienteLabel').innerHTML = '<span style="font-size:1.2em;vertical-align:-0.1em;">🧑‍⚕️</span> Editar datos del paciente';
				const modalSubtitle = document.querySelector('#modal-paciente .modal-subtitle');
				if (modalSubtitle) {
					modalSubtitle.textContent = 'Modifica la información, incidencias o seguimiento clínico del paciente seleccionado.';
				}
				const modal = bootstrap.Modal.getOrCreateInstance(modalPaciente);
				modal.show();
				// Esperar a que el modal esté visible antes de cargar etiquetas
				setTimeout(async () => {
					const incidencias = await ipcRenderer.invoke('paciente-get-incidencias', paciente.id);
					cargarIncidenciasEnModal(incidencias); // Nueva función que renderiza cada incidencia individual
				}, 200);
			}
		}
		if (e.target.closest('.btn-eliminar')) {
			const id = e.target.closest('.btn-eliminar').dataset.id;
			const pacientes = await ipcRenderer.invoke('get-pacientes');
			const paciente = pacientes.find(p => p.id == id);
			pacienteAEliminar = paciente;
			// Mostrar modal de confirmación
			if (modalConfirmarEliminar) {
				const modal = bootstrap.Modal.getOrCreateInstance(modalConfirmarEliminar);
				// Actualizar texto del modal si se desea
				if (textoConfirmarEliminar && paciente) {
					textoConfirmarEliminar.innerHTML = `¿Estás seguro de que deseas eliminar a <b>${paciente.nombre} ${paciente.apellidos}</b>?`;
				}
				modal.show();
			}
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

// Cargar etiquetas y pacientes al iniciar la sección para que los iconos estén disponibles
document.addEventListener('DOMContentLoaded', async () => {
	// Cargar todas las etiquetas disponibles antes de cargar pacientes
	let ipcRenderer;
	try {
		ipcRenderer = require('electron').ipcRenderer;
		if (ipcRenderer) {
			const allTags = await ipcRenderer.invoke('tags-get-all');
			etiquetasDisponibles = allTags;
			etiquetasAccesoDisponibles = allTags.filter(tag => tag.tipo === 'acceso');
		}
	} catch (e) {}
	cargarPacientes();
});
