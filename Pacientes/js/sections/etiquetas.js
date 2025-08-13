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
// Ubicaciones anatómicas dinámicas
const ubicacionesGroup = document.getElementById('etiqueta-ubicaciones-group');
const ubicacionInput = document.getElementById('etiqueta-ubicacion-input');
const ubicacionAddBtn = document.getElementById('etiqueta-ubicacion-add');
const ubicacionesLista = document.getElementById('etiqueta-ubicaciones-lista');
let ubicacionesAnatomicas = [];

const cardEtiquetas = document.querySelector('#etiquetas-section .card');
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
        ${tag.tipo === 'acceso' ? `<span class="badge" style="font-size:1em;">${tag.icono ? tag.icono : ''}</span>` : `<span class="badge" style="background:${tag.color}">${tag.color}</span>`}
      </td>
      <td>${tag.tipo ? tag.tipo.charAt(0).toUpperCase() + tag.tipo.slice(1) : ''}</td>
      <td>${tag.descripcion ? tag.descripcion : ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-editar" data-id="${tag.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${tag.id}"><i class="bi bi-trash"></i></button>
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
  renderTags();
}

btnNuevaEtiqueta.addEventListener('click', () => {
  formEtiqueta.reset();
  inputId.value = '';
  inputColor.value = '#009879';
  ubicacionesAnatomicas = [];
  renderizarUbicaciones();
  // Si el tipo es acceso, poner emoji por defecto y mostrar ubicaciones
  if (inputTipo.value === 'acceso') {
    inputIcono.value = '🩸';
    colorGroup.classList.add('d-none');
    iconoGroup.classList.remove('d-none');
    ubicacionesGroup.classList.remove('d-none');
  } else {
    inputIcono.value = '';
    colorGroup.classList.remove('d-none');
    iconoGroup.classList.add('d-none');
    ubicacionesGroup.classList.add('d-none');
  }
  modalEtiqueta.show();
  document.getElementById('modalEtiquetaLabel').textContent = '🏷️ Nueva Etiqueta';
  paginaActualEtiquetas = 1;
});
// Mostrar/ocultar campos según el tipo seleccionado
inputTipo.addEventListener('change', function() {
  if (this.value === 'acceso') {
    colorGroup.classList.add('d-none');
    iconoGroup.classList.remove('d-none');
    ubicacionesGroup.classList.remove('d-none');
  } else {
    colorGroup.classList.remove('d-none');
    iconoGroup.classList.add('d-none');
    ubicacionesGroup.classList.add('d-none');
  }
});

tablaEtiquetas.addEventListener('click', async (e) => {
  if (e.target.closest('.btn-editar')) {
    const id = e.target.closest('.btn-editar').dataset.id;
    const tag = tags.find(t => t.id == id);
    if (tag) {
      inputId.value = tag.id;
      inputNombre.value = tag.nombre;
      inputColor.value = tag.color;
      inputDescripcion.value = tag.descripcion || '';
      inputTipo.value = tag.tipo || 'incidencia';
      inputIcono.value = tag.icono || '';
      ubicacionesAnatomicas = Array.isArray(tag.ubicaciones) ? [...tag.ubicaciones] : [];
      renderizarUbicaciones();
      // Mostrar/ocultar campos según el tipo seleccionado
      if (tag.tipo === 'acceso') {
        colorGroup.classList.add('d-none');
        iconoGroup.classList.remove('d-none');
        ubicacionesGroup.classList.remove('d-none');
        // Actualiza el botón con el emoji guardado
        const iconoBtn = document.getElementById('etiqueta-icono-btn');
        if (iconoBtn) iconoBtn.textContent = tag.icono || '🩸';
      } else {
        colorGroup.classList.remove('d-none');
        iconoGroup.classList.add('d-none');
        ubicacionesGroup.classList.add('d-none');
      }
      modalEtiqueta.show();
      document.getElementById('modalEtiquetaLabel').textContent = '🏷️ Editar Etiqueta';
    }
  } else if (e.target.closest('.btn-eliminar')) {
    const id = e.target.closest('.btn-eliminar').dataset.id;
    await ipcRenderer.invoke('tags-delete', Number(id));
    showAlert('Etiqueta eliminada correctamente', 'success');
    cargarTags();
  }
});

formEtiqueta.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = inputNombre.value.trim();
  const color = inputColor.value;
  const descripcion = inputDescripcion.value.trim();
  const tipo = inputTipo.value;
  // Si es acceso y el icono está vacío, poner emoji por defecto
  let icono = inputIcono.value.trim();
  if (tipo === 'acceso' && !icono) {
    icono = '🩸';
    inputIcono.value = icono;
  }
  const id = inputId.value;
  if (!nombre) return;
  // Validación de unicidad (case-insensitive)
  const nombreLower = nombre.toLowerCase();
  const existe = tags.some(tag => tag.nombre.toLowerCase() === nombreLower && String(tag.id) !== String(id));
  let errorDiv = document.getElementById('etiqueta-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'etiqueta-error';
    errorDiv.className = 'alert alert-danger py-2 px-3 mb-2';
    formEtiqueta.querySelector('.modal-body').prepend(errorDiv);
  }
  if (existe) {
    errorDiv.textContent = 'Ya existe una etiqueta con ese nombre.';
    inputNombre.focus();
    return;
  } else {
    errorDiv.textContent = '';
    errorDiv.remove();
  }
  try {
    const ubicaciones = (tipo === 'acceso') ? [...ubicacionesAnatomicas] : [];
    if (id) {
      await ipcRenderer.invoke('tags-update', { id: Number(id), nombre, color, descripcion, tipo, icono, ubicaciones });
      showAlert('Etiqueta actualizada correctamente', 'success');
    } else {
      await ipcRenderer.invoke('tags-add', { nombre, color, descripcion, tipo, icono, ubicaciones });
      showAlert('Etiqueta creada correctamente', 'success');
    }
    modalEtiqueta.hide();
    cargarTags();
  } catch (err) {
    errorDiv.textContent = 'Error al guardar la etiqueta.';
  }
});

function renderizarUbicaciones() {
  ubicacionesLista.innerHTML = '';
  if (!ubicacionesAnatomicas.length) {
    ubicacionesLista.style.display = '';
    return;
  }
  // Color azul Bootstrap (btn-success: #198754, btn-primary: #0d6efd)
  const color = '#0d6efd';
  // Crear contenedor flex row
  const flexDiv = document.createElement('div');
  flexDiv.style.display = 'flex';
  flexDiv.style.flexDirection = 'row';
  flexDiv.style.flexWrap = 'wrap';
  flexDiv.style.gap = '8px';
  flexDiv.style.paddingTop = '8px';
  flexDiv.style.paddingBottom = '8px';
  ubicacionesAnatomicas.forEach((ubic, idx) => {
    const badge = document.createElement('span');
    badge.className = 'badge d-flex align-items-center gap-1 px-3 py-2';
    badge.style.background = color;
    badge.style.color = '#fff';
    badge.style.fontSize = '1em';
    badge.style.maxWidth = '280px';
    badge.style.overflow = 'hidden';
    badge.style.textOverflow = 'ellipsis';
    badge.style.whiteSpace = 'nowrap';
    badge.innerHTML = `
      <span style="flex:1;min-width:0;">${ubic}</span>
      <button type="button" class="btn btn-sm btn-light ms-1 px-1 py-0" style="font-size:0.95em;line-height:1;" title="Eliminar ubicación">
        <i class="bi bi-x"></i>
      </button>
    `;
    const btnDel = badge.querySelector('button');
    btnDel.onclick = () => {
      ubicacionesAnatomicas.splice(idx, 1);
      renderizarUbicaciones();
    };
    flexDiv.appendChild(badge);
  });
  ubicacionesLista.appendChild(flexDiv);
}

ubicacionAddBtn.addEventListener('click', () => {
  const val = ubicacionInput.value.trim();
  if (val && !ubicacionesAnatomicas.includes(val)) {
    ubicacionesAnatomicas.push(val);
    renderizarUbicaciones();
    ubicacionInput.value = '';
    ubicacionInput.focus();
  }
});

ubicacionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    ubicacionAddBtn.click();
  }
});

// Inicialización automática al mostrar la sección
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('etiquetas-section')) {
    cargarTags();
  }
});

module.exports = { cargarTags };
