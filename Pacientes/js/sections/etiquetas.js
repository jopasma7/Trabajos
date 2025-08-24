// Función para obtener los datos del formulario de etiqueta
function getEtiquetaFormData() {
  const nombre = inputNombre.value.trim();
  const tipo = inputTipo.value;
  const icono = inputIcono.value;
  const inputMicroorganismoActual = document.getElementById('etiqueta-microorganismo');
  const microorganismo = (tipo === 'infeccion' && inputMicroorganismoActual) ? inputMicroorganismoActual.value.trim() : '';
  return {
    id: inputId.value || undefined,
    nombre,
    color: inputColor.value,
    microorganismo_asociado: microorganismo,
    descripcion: inputDescripcion.value,
    tipo,
    icono
  };
}
// Función para preparar el formulario de etiqueta (crear/editar)
function prepararFormularioEtiqueta(tag = null) {
  if (tag) {
    inputNombre.value = tag.nombre || '';
    inputColor.value = tag.color || '#009879';
    inputDescripcion.value = tag.descripcion || '';
    inputId.value = tag.id || '';
    inputTipo.value = tag.tipo || 'incidencia';
    // Microorganismo asociado
    const inputMicroorganismoActual = document.getElementById('etiqueta-microorganismo');
    if (inputMicroorganismoActual) inputMicroorganismoActual.value = tag.microorganismo_asociado || '';
    inputTipo.dispatchEvent(new Event('change'));
    // Establecer el icono después del cambio de tipo para evitar que se sobrescriba
    inputIcono.value = tag.icono || '';
    // Actualizar el botón de emoji si existe
    const btnIcono = document.getElementById('etiqueta-icono-btn');
    if (btnIcono) {
      btnIcono.textContent = tag.icono || '🩸';
    }
  } else {
    inputNombre.value = '';
    inputColor.value = '';
    inputDescripcion.value = '';
    inputId.value = '';
    inputIcono.value = '';
    inputTipo.value = 'infeccion';
    inputTipo.dispatchEvent(new Event('change'));
    // Limpiar microorganismo asociado
    const inputMicroorganismoActual = document.getElementById('etiqueta-microorganismo');
    if (inputMicroorganismoActual) inputMicroorganismoActual.value = '';
    // Actualizar el botón de emoji si existe
    const btnIcono = document.getElementById('etiqueta-icono-btn');
    if (btnIcono) {
      btnIcono.textContent = '🩸';
    }
  }
}

// Handler para editar y eliminar etiquetas
document.addEventListener('click', async function(e) {
  const btnEditar = e.target.closest('.btn-editar-etiqueta');
  if (btnEditar) {
    const tagId = btnEditar.getAttribute('data-id');
    const tag = await ipcRenderer.invoke('tags-get', tagId);
    prepararFormularioEtiqueta(tag);
    modalEtiqueta.show();
    return;
  }

  const btnEliminar = e.target.closest('.btn-eliminar-etiqueta');
  if (btnEliminar) {
    const tagId = btnEliminar.getAttribute('data-id');
    if (tagId) {
      // Eliminar incidencias asociadas a la etiqueta antes de eliminar la etiqueta
      await ipcRenderer.invoke('incidencias-delete-by-etiqueta', tagId);
      await ipcRenderer.invoke('tags-delete', tagId);
      showAlert('Etiqueta eliminada correctamente', 'danger');
      cargarTags();
    }
    return;
  }
});
// js/sections/etiquetas.js
// Lógica de gestión de etiquetas (tags) para la sección Etiquetas  

const { ipcRenderer } = require('electron');
let tags = [];

// Elementos DOM
const tablaEtiquetas = document.getElementById('tabla-etiquetas').querySelector('tbody');
const btnNuevaEtiqueta = document.getElementById('btn-nueva-etiqueta');
const modalEtiqueta = new bootstrap.Modal(document.getElementById('modal-etiqueta'), { focus: false });
const formEtiqueta = document.getElementById('form-etiqueta');
const inputNombre = document.getElementById('etiqueta-nombre');
const inputColor = document.getElementById('etiqueta-color');
const inputDescripcion = document.getElementById('etiqueta-descripcion');
const inputTipo = document.getElementById('etiqueta-tipo');
const inputId = document.getElementById('etiqueta-id');
const inputIcono = document.getElementById('etiqueta-icono');
const colorGroup = document.getElementById('etiqueta-color-group');
const iconoGroup = document.getElementById('etiqueta-icono-group');
const listaVacia = document.getElementById('tags-lista-vacia');


const paginacionEtiquetas = document.getElementById('paginacion-etiquetas');
let paginaActualEtiquetas = 1;
const etiquetasPorPagina = 4;
const filtroTipoEtiqueta = document.getElementById('filtro-tipo-etiqueta');
let tipoFiltroActual = '';

// Usa la función mostrarMensaje global de agenda.js si está disponible
function showAlert(msg, tipo = 'success') {
  if (typeof window.mostrarMensaje === 'function') {
    window.mostrarMensaje(msg, tipo);
  } else {
    // Fallback mínimo si no está cargada (no debería ocurrir)
    alert(msg);
  }
}

function renderTags() {
  tablaEtiquetas.innerHTML = '';
  const tabla = document.getElementById('tabla-etiquetas');
  let tagsFiltradas = tipoFiltroActual ? tags.filter(tag => tag.tipo === tipoFiltroActual) : tags;
  if (!tagsFiltradas.length) {
    listaVacia.classList.remove('d-none');
    tabla.parentElement.classList.add('d-none'); // Oculta la tabla
    if (paginacionEtiquetas) paginacionEtiquetas.innerHTML = '';
    return;
  }
  listaVacia.classList.add('d-none');
  tabla.parentElement.classList.remove('d-none'); // Muestra la tabla
  // Paginación
  const total = tagsFiltradas.length;
  const totalPaginas = Math.ceil(total / etiquetasPorPagina) || 1;
  if (paginaActualEtiquetas > totalPaginas) paginaActualEtiquetas = totalPaginas;
  const inicio = (paginaActualEtiquetas - 1) * etiquetasPorPagina;
  const fin = inicio + etiquetasPorPagina;
  const visibles = tagsFiltradas.slice(inicio, fin);
    visibles.forEach(tag => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <i class="bi bi-tag-fill" style="color:${tag.color}"></i>
          </td>
          <td>${tag.nombre}</td>
          <td>
            ${(tag.icono && (tag.tipo === 'acceso' || tag.tipo === 'infeccion'))
              ? `<span class="badge" style="font-size:1em;">${tag.icono}</span>`
              : `<span class="badge" style="background:${tag.color}">${tag.color}</span>`}
          </td>
          <td>${tag.tipo ? tag.tipo.charAt(0).toUpperCase() + tag.tipo.slice(1) : ''}</td>
          <td>${tag.descripcion ? tag.descripcion : ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1 btn-editar-etiqueta" data-id="${tag.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar-etiqueta" data-id="${tag.id}"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tablaEtiquetas.appendChild(tr);
    });
  renderizarPaginacionEtiquetas(total);
}
// Filtro de tipo de etiqueta
if (filtroTipoEtiqueta) {
  filtroTipoEtiqueta.addEventListener('change', function() {
    tipoFiltroActual = this.value;
    paginaActualEtiquetas = 1;
    renderTags();
  });
}

function renderizarPaginacionEtiquetas(totalEtiquetas) {
    if (!paginacionEtiquetas) return;
    paginacionEtiquetas.innerHTML = '';
    const totalPaginas = Math.ceil(totalEtiquetas / etiquetasPorPagina) || 1;
    const maxVisible = 5;
    let paginas = [];
    if (totalPaginas <= maxVisible) {
        for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
        let start = Math.max(1, paginaActualEtiquetas - 2);
        let end = Math.min(totalPaginas, paginaActualEtiquetas + 2);
        if (paginaActualEtiquetas <= 3) {
        start = 1; end = maxVisible;
        } else if (paginaActualEtiquetas >= totalPaginas - 2) {
        start = totalPaginas - 4; end = totalPaginas;
        }
        for (let i = start; i <= end; i++) paginas.push(i);
    }
    // Botón anterior
    const prev = document.createElement('li');
    prev.className = 'page-item' + (paginaActualEtiquetas === 1 ? ' disabled' : '');
    prev.innerHTML = `<a class="page-link" href="#" tabindex="-1">&laquo;</a>`;
    prev.onclick = e => { e.preventDefault(); if (paginaActualEtiquetas > 1) { paginaActualEtiquetas--; renderTags(); } };
    paginacionEtiquetas.appendChild(prev);
    // Números
    paginas.forEach(i => {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === paginaActualEtiquetas ? ' active' : '');
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = e => { e.preventDefault(); if (paginaActualEtiquetas !== i) { paginaActualEtiquetas = i; renderTags(); } };
        paginacionEtiquetas.appendChild(li);
    });
    // Botón siguiente
    const next = document.createElement('li');
    next.className = 'page-item' + (paginaActualEtiquetas === totalPaginas ? ' disabled' : '');
    next.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    next.onclick = e => { e.preventDefault(); if (paginaActualEtiquetas < totalPaginas) { paginaActualEtiquetas++; renderTags(); } };
    paginacionEtiquetas.appendChild(next);
}


async function cargarTags() {
  tags = await ipcRenderer.invoke('tags-get-all');
  // Actualizar filtro de tipo de etiqueta con los tipos realmente existentes
  if (filtroTipoEtiqueta) {
    const tiposUnicos = Array.from(new Set(tags.map(tag => tag.tipo))).filter(Boolean);
    filtroTipoEtiqueta.innerHTML = '';
    const optTodos = document.createElement('option');
    optTodos.value = '';
    optTodos.textContent = 'Todos';
    filtroTipoEtiqueta.appendChild(optTodos);
    tiposUnicos.forEach(tipo => {
      const opt = document.createElement('option');
      opt.value = tipo;
      opt.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      filtroTipoEtiqueta.appendChild(opt);
    });
  }
  renderTags();
}

btnNuevaEtiqueta.addEventListener('click', () => {
  prepararFormularioEtiqueta();
  modalEtiqueta.show();
});

// Función para mostrar/ocultar grupo emoji/color según el tipo
function actualizarGruposTipo() {
  if (inputTipo.value === 'infeccion') {
    iconoGroup.style.display = '';
    colorGroup.style.display = 'none';
  } else {
    iconoGroup.style.display = 'none';
    colorGroup.style.display = '';
  }
}

// Handler global para mostrar/ocultar grupo emoji/color según el tipo



formEtiqueta.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Si el campo está vacío, asigna el emoji por defecto antes de recoger los datos
  if (!inputIcono.value) inputIcono.value = '🩸';
  const nuevaEtiqueta = getEtiquetaFormData();
  if (nuevaEtiqueta.id) {
    await ipcRenderer.invoke('tags-update', nuevaEtiqueta);
    showAlert('Etiqueta actualizada correctamente', 'success');
  } else {
    await ipcRenderer.invoke('tags-add', nuevaEtiqueta);
    showAlert('Etiqueta guardada correctamente', 'success');
  }
  // Refrescar etiquetas globales en toda la app
  window.etiquetasGlobales = await ipcRenderer.invoke('tags-get-all');
  cargarTags();
  // Recargar selects de etiquetas en los modales de incidencia y paciente
  if (window.poblarEtiquetasIncidenciaPaciente) window.poblarEtiquetasIncidenciaPaciente();
  if (window.cargarTagsInfeccion) window.cargarTagsInfeccion();
  if (window.cargarEtiquetasHistorial) window.cargarEtiquetasHistorial();
  modalEtiqueta.hide();
});




// Inicialización automática al mostrar la sección
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('etiquetas-section')) {
    cargarTags();
    // Registrar el handler SOLO una vez al cargar la sección
      inputTipo.addEventListener('change', function() {
        actualizarGruposTipo();
        // Buscar el campo por id cada vez, por si ha cambiado de lugar
        const grupoMicroorganismoActual = document.getElementById('grupo-microorganismo');
        const inputMicroorganismoActual = document.getElementById('etiqueta-microorganismo');
        if (inputTipo.value === 'infeccion') {
          if (grupoMicroorganismoActual) grupoMicroorganismoActual.style.display = '';
        } else {
          if (grupoMicroorganismoActual) grupoMicroorganismoActual.style.display = 'none';
          if (inputMicroorganismoActual) inputMicroorganismoActual.value = '';
        }
      });
  }
});

module.exports = { cargarTags };
