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
const inputId = document.getElementById('etiqueta-id');
const listaVacia = document.getElementById('tags-lista-vacia');
const cardEtiquetas = document.querySelector('#etiquetas-section .card');

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
    return;
  }
  listaVacia.classList.add('d-none');
  tabla.parentElement.classList.remove('d-none'); // Muestra la tabla
  tags.forEach(tag => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><i class="bi bi-tag-fill" style="color:${tag.color}"></i></td>
      <td>${tag.nombre}</td>
      <td><span class="badge" style="background:${tag.color}">${tag.color}</span></td>
      <td>${tag.descripcion ? tag.descripcion : ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-editar" data-id="${tag.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${tag.id}"><i class="bi bi-trash"></i></button>
      </td>
    `;
    tablaEtiquetas.appendChild(tr);
  });
}

async function cargarTags() {
  tags = await ipcRenderer.invoke('tags-get-all');
  renderTags();
}

btnNuevaEtiqueta.addEventListener('click', () => {
  formEtiqueta.reset();
  inputId.value = '';
  inputColor.value = '#009879';
  modalEtiqueta.show();
  document.getElementById('modalEtiquetaLabel').textContent = '🏷️ Nueva Etiqueta';
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
      await ipcRenderer.invoke('tags-update', { id: Number(id), nombre, color, descripcion });
  showAlert('Etiqueta actualizada correctamente', 'success');
    } else {
      await ipcRenderer.invoke('tags-add', { nombre, color, descripcion });
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
