// js/sections/profesionales.js
// Lógica para la sección de profesionales: cargar, guardar, editar y avatar

const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Limpiar formulario y selector al pulsar 'Agregar profesional'
    const btnAgregarProfesional = document.getElementById('btn-agregar-profesional');
    if (btnAgregarProfesional) {
        btnAgregarProfesional.addEventListener('click', () => {
            if (selectorProfesional) selectorProfesional.value = '';
            if (form) form.reset();
            if (avatarImg) avatarImg.src = '../assets/avatar-default.png';
            if (avatarFeedback) avatarFeedback.textContent = '';
            document.getElementById('profesional-id').value = '';
        });
    }
    // Poblar selector de profesionales
    const selectorProfesional = document.getElementById('selector-profesional');
    async function poblarSelectorProfesionales() {
        if (!selectorProfesional) return;
        selectorProfesional.innerHTML = '<option value="">-- Selecciona un profesional --</option>';
        const profesionales = await ipcRenderer.invoke('get-profesionales');
        profesionales.forEach(prof => {
            const opt = document.createElement('option');
            opt.value = prof.id;
            opt.textContent = `${prof.nombre} ${prof.apellidos}`;
            selectorProfesional.appendChild(opt);
        });
    }
    poblarSelectorProfesionales();

    // Al cambiar el selector, cargar datos en el formulario
    if (selectorProfesional) {
        selectorProfesional.addEventListener('change', async (e) => {
            const id = e.target.value;
            if (!id) {
                document.getElementById('form-profesional').reset();
                avatarImg.src = '../assets/avatar-default.png';
                avatarFeedback.textContent = '';
                return;
            }
            const profesionales = await ipcRenderer.invoke('get-profesionales');
            const prof = profesionales.find(p => String(p.id) === String(id));
            if (prof) {
                document.getElementById('profesional-nombre').value = prof.nombre || '';
                document.getElementById('profesional-apellidos').value = prof.apellidos || '';
                document.getElementById('profesional-sexo').value = prof.sexo || '';
                document.getElementById('profesional-email').value = prof.email || '';
                document.getElementById('profesional-cargo').value = prof.cargo || '';
                document.getElementById('profesional-numero-colegiado').value = prof.numero_colegiado || '';
                document.getElementById('profesional-telefono').value = prof.telefono || '';
                document.getElementById('profesional-fecha-nacimiento').value = prof.fecha_nacimiento || '';
                document.getElementById('profesional-direccion').value = prof.direccion || '';
                document.getElementById('profesional-notas').value = prof.notas || '';
                document.getElementById('profesional-id').value = prof.id || '';
                avatarImg.src = prof.avatar || '../assets/avatar-default.png';
                avatarFeedback.textContent = '';
            }
        });
    }
    const form = document.getElementById('form-profesional');
    const avatarImg = document.getElementById('profesional-avatar-img');
    const cambiarAvatarBtn = document.getElementById('cambiar-profesional-avatar-btn');
    const eliminarAvatarBtn = document.getElementById('eliminar-profesional-avatar-btn');
    const avatarInput = document.getElementById('profesional-avatar-input');
    const avatarFeedback = document.getElementById('avatar-profesional-feedback');

    // Cargar datos de profesionales (puedes añadir tabla/lista si lo necesitas)
    async function cargarProfesional(id) {
        // Ejemplo: cargar profesional por id (puedes adaptar para listado)
        // const profesional = await ipcRenderer.invoke('get-profesional', id);
        // Rellenar campos del formulario...
    }

    // Guardar profesional
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const profesional = {
                nombre: document.getElementById('profesional-nombre').value.trim(),
                apellidos: document.getElementById('profesional-apellidos').value.trim(),
                sexo: document.getElementById('profesional-sexo').value,
                email: document.getElementById('profesional-email').value.trim(),
                cargo: document.getElementById('profesional-cargo').value.trim(),
                numero_colegiado: document.getElementById('profesional-numero-colegiado').value.trim(),
                telefono: document.getElementById('profesional-telefono').value.trim(),
                fecha_nacimiento: document.getElementById('profesional-fecha-nacimiento').value,
                direccion: document.getElementById('profesional-direccion').value.trim(),
                notas: document.getElementById('profesional-notas').value.trim(),
                avatar: avatarImg.src,
                id: document.getElementById('profesional-id').value || null
            };
            let nuevoId = null;
            if (profesional.id) {
                await ipcRenderer.invoke('edit-profesional', profesional);
                mostrarMensaje(`Profesional <b>${profesional.nombre} ${profesional.apellidos}</b> actualizado correctamente.`, 'success');
                nuevoId = profesional.id;
            } else {
                const res = await ipcRenderer.invoke('add-profesional', profesional);
                mostrarMensaje(`Nuevo profesional <b>${profesional.nombre} ${profesional.apellidos}</b> creado correctamente.`, 'success');
                nuevoId = res.id;
            }
            await poblarSelectorProfesionales();
            if (nuevoId) {
                selectorProfesional.value = nuevoId;
                selectorProfesional.dispatchEvent(new Event('change'));
            } else {
                form.reset();
                avatarImg.src = '../assets/avatar-default.png';
                avatarFeedback.textContent = '';
            }
        });
    }

    // Previsualización instantánea al seleccionar imagen
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    avatarImg.src = ev.target.result;
                    avatarFeedback.textContent = 'Imagen cargada correctamente.';
                    avatarFeedback.classList.remove('text-danger');
                    avatarFeedback.classList.add('text-success');
                };
                reader.onerror = function() {
                    avatarFeedback.textContent = 'Error al cargar la imagen.';
                    avatarFeedback.classList.remove('text-success');
                    avatarFeedback.classList.add('text-danger');
                };
                reader.readAsDataURL(file);
            } else {
                avatarFeedback.textContent = '';
            }
        });
    }

    // Botón cambiar foto: abre el input file
    if (cambiarAvatarBtn && avatarInput) {
        cambiarAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }

    // Eliminar avatar: vuelve al default
    if (eliminarAvatarBtn) {
        eliminarAvatarBtn.addEventListener('click', () => {
            avatarImg.src = '../assets/avatar-default.png';
            avatarInput.value = '';
            avatarFeedback.textContent = 'Avatar eliminado.';
            avatarFeedback.classList.remove('text-success');
            avatarFeedback.classList.add('text-danger');
        });
    }
    
    // Ejemplo de función para eliminar profesional y mostrar alerta
    async function eliminarProfesional(id, nombre, apellidos) {
        await ipcRenderer.invoke('delete-profesional', id);
        mostrarMensaje(`Profesional <b>${nombre} ${apellidos}</b> eliminado correctamente.`, 'danger');
        // Aquí puedes recargar la lista o limpiar el formulario si es necesario
    }
});


// Función global para mostrar mensajes flotantes (idéntica a agenda.js)
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
