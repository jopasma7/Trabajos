// js/sections/etiquetas.js
// Lógica de gestión de etiquetas (tags) para la sección Etiquetas

const { ipcRenderer } = require('electron');
let tags = [];

// Elementos DOM
const tablaEtiquetas = document.getElementById('tabla-etiquetas').querySelector('tbody');
const btnNuevaEtiqueta = document.getElementById('btn-nueva-etiqueta');
const modalEtiqueta = new bootstrap.Modal(document.getElementById('modal-etiqueta'));
const formEtiqueta = document.getElementById('form-etiqueta');
const inputNombre = document.getElementById('etiqueta-nombre');
const inputColor = document.getElementById('etiqueta-color');
const inputDescripcion = document.getElementById('etiqueta-descripcion');
const inputTipo = document.getElementById('etiqueta-tipo');
const inputId = document.getElementById('etiqueta-id');
const listaVacia = document.getElementById('tags-lista-vacia');

const cardEtiquetas = document.querySelector('#etiquetas-section .card');
const paginacionEtiquetas = document.getElementById('paginacion-etiquetas');
let paginaActualEtiquetas = 1;
const etiquetasPorPagina = 4;

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
  if (!tags.length) {
    listaVacia.classList.remove('d-none');
    tabla.parentElement.classList.add('d-none'); // Oculta la tabla
    if (paginacionEtiquetas) paginacionEtiquetas.innerHTML = '';
    return;
  }
  listaVacia.classList.add('d-none');
  tabla.parentElement.classList.remove('d-none'); // Muestra la tabla
  // Paginación
  const total = tags.length;
  const totalPaginas = Math.ceil(total / etiquetasPorPagina) || 1;
  if (paginaActualEtiquetas > totalPaginas) paginaActualEtiquetas = totalPaginas;
  const inicio = (paginaActualEtiquetas - 1) * etiquetasPorPagina;
  const fin = inicio + etiquetasPorPagina;
  const visibles = tags.slice(inicio, fin);
  visibles.forEach(tag => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><i class="bi bi-tag-fill" style="color:${tag.color}"></i></td>
      <td>${tag.nombre}</td>
      <td><span class="badge" style="background:${tag.color}">${tag.color}</span></td>
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
  inputTipo.value = 'incidencia';
  modalEtiqueta.show();
  document.getElementById('modalEtiquetaLabel').textContent = '🏷️ Nueva Etiqueta';
  paginaActualEtiquetas = 1;
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
    if (id) {
      await ipcRenderer.invoke('tags-update', { id: Number(id), nombre, color, descripcion, tipo });
      showAlert('Etiqueta actualizada correctamente', 'success');
    } else {
      await ipcRenderer.invoke('tags-add', { nombre, color, descripcion, tipo });
      showAlert('Etiqueta creada correctamente', 'success');
    }
    modalEtiqueta.hide();
    cargarTags();
  } catch (err) {
    errorDiv.textContent = 'Error al guardar la etiqueta.';
  }
});

// Inicialización automática al mostrar la sección
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('etiquetas-section')) {
    cargarTags();
  }
});

module.exports = { cargarTags };
