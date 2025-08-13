// --- Reabrir modal paciente al cancelar incidencias personalizadas ---
// --- Reabrir modal paciente solo si se cancela incidencias personalizadas ---
document.addEventListener('DOMContentLoaded', () => {
	const modalIncidencia = document.getElementById('modal-incidencia-inicial');
	if (modalIncidencia) {
		let confirmado = false;
		// Interceptar el botón confirmar para marcar que fue confirmación
		const btnConfirmar = document.getElementById('btn-confirmar-incidencia-inicial');
		if (btnConfirmar) {
			btnConfirmar.addEventListener('click', () => { confirmado = true; });
		}
		modalIncidencia.addEventListener('hidden.bs.modal', function (e) {
			const modalPaciente = document.getElementById('modal-paciente');
			if (!confirmado) {
				// Solo si se cancela, reabrir modal paciente
				if (modalPaciente && !modalPaciente.classList.contains('show')) {
					const modalPacienteInst = bootstrap.Modal.getOrCreateInstance(modalPaciente);
					setTimeout(() => modalPacienteInst.show(), 200);
				}
			}
			confirmado = false; // Reset para el siguiente uso
		});
	}
});
try {
	const electron = require('electron');
	console.log('[DEPURACIÓN][RENDERER] require("electron") funciona:', !!electron);
	console.log('[DEPURACIÓN][RENDERER] ipcRenderer:', !!electron.ipcRenderer);
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
let etiquetasSeleccionadas = [];
let etiquetasYaAsociadas = [];

async function cargarEtiquetasDisponibles(selectedIds = null, asociadasIds = null) {
	if (!listaSimpleContainer) return;
	let ipcRenderer;
	try {
		ipcRenderer = require('electron').ipcRenderer;
		if (!ipcRenderer) return;
	} catch (e) {
		return;
	}
	etiquetasDisponibles = (await ipcRenderer.invoke('tags-get-all')).filter(tag => tag.tipo === 'incidencia');
	listaSimpleContainer.innerHTML = '';
	// ...existing code...
	if (selectedIds && Array.isArray(asociadasIds)) {
		etiquetasSeleccionadas = [...selectedIds];
		etiquetasYaAsociadas = [...asociadasIds];
	} else if (selectedIds) {
		etiquetasSeleccionadas = [...selectedIds];
		etiquetasYaAsociadas = [...selectedIds];
	} else if (!pacienteEditando) {
		etiquetasSeleccionadas = [];
		etiquetasYaAsociadas = [];
	}
	if (etiquetasDisponibles.length === 0) {
		listaSimpleContainer.innerHTML = '<li class="text-muted">No hay etiquetas disponibles</li>';
		return;
	}
	etiquetasDisponibles.forEach(tag => {
		const li = document.createElement('li');
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.value = tag.id;
		const idNum = Number(tag.id);
		if (etiquetasYaAsociadas.includes(idNum)) {
			input.checked = true;
			input.disabled = true;
			li.classList.add('text-muted');
		} else {
			input.checked = etiquetasSeleccionadas.includes(idNum);
			input.addEventListener('change', () => {
				if (input.checked) {
					if (!etiquetasSeleccionadas.includes(idNum)) etiquetasSeleccionadas.push(idNum);
				} else {
					const idx = etiquetasSeleccionadas.indexOf(idNum);
					if (idx !== -1) etiquetasSeleccionadas.splice(idx, 1);
				}
			});
		}
		li.appendChild(input);
		li.appendChild(document.createTextNode(' ' + tag.nombre));
		listaSimpleContainer.appendChild(li);
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
				selectTipoAccesoForm.innerHTML = '';
				// Si NO se está editando, añadir opción inicial
				if (window.pacienteEditandoTipoAccesoId === undefined || window.pacienteEditandoTipoAccesoId === null || window.pacienteEditandoTipoAccesoId === '') {
					const optInit = document.createElement('option');
					optInit.value = '';
					optInit.textContent = 'Selecciona tipo de acceso...';
					optInit.disabled = true;
					optInit.selected = true;
					selectTipoAccesoForm.appendChild(optInit);
				}
				try {
					const allTags = await ipcRenderer.invoke('tags-get-all');
					etiquetasAccesoDisponibles = allTags.filter(tag => tag.tipo === 'acceso');
				} catch {}
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
		// Limpiar el id global al cerrar el modal
		modalPaciente.addEventListener('hidden.bs.modal', () => {
			window.pacienteEditandoTipoAccesoId = undefined;
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
    // Prepara un mapa de etiquetas por id para acceso rápido
    const etiquetasPorId = {};
    (etiquetasDisponibles || []).forEach(tag => { etiquetasPorId[tag.id] = tag; });

	pacientes.forEach(paciente => {
		// Debug: mostrar etiquetas de cada paciente
		console.log(`[DEBUG] Paciente: ${paciente.nombre} ${paciente.apellidos} | Etiquetas:`, paciente.etiquetas);
		if (!paciente.etiquetas || paciente.etiquetas.length === 0) {
			console.warn(`[DEBUG] Paciente sin etiquetas asociadas: ${paciente.nombre} ${paciente.apellidos}`);
		}
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
			console.log('Pacientes actuales:', pacientes);
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
					// Añadir opción inicial
					const optInit = document.createElement('option');
					optInit.value = '';
					optInit.textContent = 'Selecciona tipo de acceso...';
					optInit.disabled = true;
					selectTipoAccesoForm.appendChild(optInit);
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

		// Solo permitir añadir incidencias nuevas (no duplicar las ya asociadas)
		const nuevasEtiquetas = etiquetasSeleccionadas.filter(id => !etiquetasYaAsociadas.includes(id));

		// Modal de incidencias personalizadas solo para las nuevas
		const showIncidenciaModal = (defaultMotivo, defaultFecha, etiquetasNuevas) => {
			return new Promise(resolve => {
				// Guardar el estado previo de etiquetas
				const etiquetasSeleccionadasPrev = [...etiquetasSeleccionadas];
				const etiquetasYaAsociadasPrev = [...etiquetasYaAsociadas];
				// Cerrar el modal de paciente antes de abrir el de incidencia
				const modalPacienteInst = bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-paciente'));
				modalPacienteInst.hide();
				const modalIncidencia = new bootstrap.Modal(document.getElementById('modal-incidencia-inicial'));
				const container = document.getElementById('incidencias-multiples-container');
				container.innerHTML = '';
				// Obtener nombres de etiquetas seleccionadas
				const etiquetas = etiquetasDisponibles.filter(tag => etiquetasNuevas.includes(Number(tag.id)));
				const hoy = (new Date()).toISOString().split('T')[0];
				// Agrupar en filas de dos columnas
				for (let i = 0; i < etiquetas.length; i += 2) {
					const row = document.createElement('div');
					row.className = 'row';
					for (let j = 0; j < 2; j++) {
						const tag = etiquetas[i + j];
						if (!tag) break;
						const col = document.createElement('div');
						col.className = 'col-12 col-md-6 mb-3';
						col.innerHTML = `
							<div class="border rounded p-2 h-100">
								<div class="fw-bold mb-2 d-flex align-items-center gap-2">
									<span class="badge" style="background:${tag.color};color:#fff;font-size:1em;"><i class="bi bi-tag"></i></span>
									<span>${tag.nombre}</span>
								</div>
								<div class="mb-2">
									<input type="text" class="form-control" id="input-motivo-incidencia-${tag.id}" maxlength="100" placeholder="Motivo de la incidencia...">
								</div>
								<div>
									<input type="date" class="form-control" id="input-fecha-incidencia-${tag.id}" value="${defaultFecha || hoy}">
								</div>
							</div>
						`;
						row.appendChild(col);
					}
					container.appendChild(row);
				}
				const btnConfirmar = document.getElementById('btn-confirmar-incidencia-inicial');
				let cerradoPorConfirmar = false;
				const handler = () => {
					cerradoPorConfirmar = true;
					// Recoger motivos y fechas de cada etiqueta
					const resultados = etiquetas.map(tag => {
						return {
							tagId: tag.id,
							motivo: document.getElementById(`input-motivo-incidencia-${tag.id}`).value,
							fecha: document.getElementById(`input-fecha-incidencia-${tag.id}`).value
						};
					});
					console.log('[DEBUG] Incidencias guardadas al confirmar:', resultados);
					modalIncidencia.hide();
					btnConfirmar.removeEventListener('click', handler);
					resolve(resultados);
				};
				btnConfirmar.addEventListener('click', handler);
				// Si se cierra el modal sin confirmar, restaurar el estado
				document.getElementById('modal-incidencia-inicial').addEventListener('hidden.bs.modal', function onHide() {
					if (!cerradoPorConfirmar) {
						etiquetasSeleccionadas.length = 0;
						etiquetasYaAsociadas.length = 0;
						etiquetasSeleccionadas.push(...etiquetasSeleccionadasPrev);
						etiquetasYaAsociadas.push(...etiquetasYaAsociadasPrev);
					}
					document.getElementById('modal-incidencia-inicial').removeEventListener('hidden.bs.modal', onHide);
				});
				modalIncidencia.show();
			});
		};

		if (pacienteEditando) {
			paciente.id = pacienteEditando;
			await ipcRenderer.invoke('edit-paciente', paciente);
			// Solo si hay nuevas etiquetas, pedir motivo/fecha y guardar incidencia personalizada
			if (nuevasEtiquetas.length) {
				const motivo = 'Etiquetas iniciales';
				const fecha = (new Date()).toISOString().split('T')[0];
				const incidencias = await showIncidenciaModal(motivo, fecha, nuevasEtiquetas);
				// Guardar cada incidencia personalizada (una incidencia por tag)
				for (const inc of incidencias) {
					await ipcRenderer.invoke('incidencia-add-con-tag', paciente.id, Number(inc.tagId), inc.motivo, inc.fecha);
				}
			}
			// Solo permitir añadir incidencias nuevas (no duplicar las ya asociadas)
			console.log('[DEBUG] Etiquetas seleccionadas al guardar:', etiquetasSeleccionadas);
		} else {
			const result = await ipcRenderer.invoke('add-paciente', paciente);
			if (etiquetasSeleccionadas.length) {
				const motivo = 'Etiquetas iniciales';
				const fecha = (new Date()).toISOString().split('T')[0];
				const incidencias = await showIncidenciaModal(motivo, fecha, etiquetasSeleccionadas);
				for (const inc of incidencias) {
					await ipcRenderer.invoke('incidencia-add-con-tag', result.id, Number(inc.tagId), inc.motivo, inc.fecha);
				}
			}
			// Mostrar el nombre y emoji del tipo de acceso seleccionado
			const tag = (etiquetasAccesoDisponibles || []).find(t => t.id === paciente.tipo_acceso_id);
			mostrarMensaje(`Nuevo paciente <b>${paciente.nombre} ${paciente.apellidos}</b> creado. Tipo de Acceso: <b>${tag ? (tag.icono ? tag.icono + ' ' : '') + tag.nombre : 'Sin tipo'}</b>`, 'success');
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
		if (e.target.closest('.btn-historial')) {
			const id = e.target.closest('.btn-historial').dataset.id;
			mostrarMensaje('Funcionalidad de Historial Clínico para el paciente ID ' + id + ' próximamente.', 'info');
		}
		if (e.target.closest('.btn-editar')) {
			const id = e.target.closest('.btn-editar').dataset.id;
			const pacientes = await ipcRenderer.invoke('get-pacientes');
			const paciente = pacientes.find(p => p.id == id);
			if (paciente) {
				console.log('[DEBUG] Editar paciente:', paciente);
				pacienteEditando = paciente.id;
				document.getElementById('paciente-nombre').value = paciente.nombre;
				document.getElementById('paciente-apellidos').value = paciente.apellidos;
				// Poblar el select de tipo acceso antes de asignar el valor
				if (selectTipoAccesoForm) {
					// Eliminar todas las opciones previas (incluida la por defecto)
					selectTipoAccesoForm.innerHTML = '';
					// Añadir opción inicial
					const optInit = document.createElement('option');
					optInit.value = '';
					optInit.textContent = 'Selecciona tipo de acceso...';
					optInit.disabled = true;
					selectTipoAccesoForm.appendChild(optInit);
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
					const ids = await ipcRenderer.invoke('paciente-get-etiquetas', paciente.id);
					etiquetasSeleccionadas = ids;
					cargarEtiquetasDisponibles(ids, ids);
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
