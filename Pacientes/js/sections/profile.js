// js/sections/profile.js
// Lógica de la sección Perfil de Usuario

const { ipcRenderer } = require('electron');

function setupProfileSection() {
    // Cambiar el título del header al entrar en la sección de perfil
    const perfilNav = document.querySelector('[data-section="perfil"]');
    if (perfilNav) {
        perfilNav.addEventListener('click', () => {
            const sectionTitle = document.getElementById('section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = `
                  <span style="font-size:1.3em;">👤</span>
                  <span style="color:#1f2937;">Mi Perfil</span>
                  <span style="font-size:1rem; font-weight:400; color:#64748b; margin-left:0.7rem;">| Datos personales y configuración</span>
                `;
                sectionTitle.className = '';
                sectionTitle.style.fontSize = '1.7rem';
                sectionTitle.style.fontWeight = '800';
                sectionTitle.style.color = '#1f2937';
                sectionTitle.style.marginBottom = '0.5rem';
                sectionTitle.style.display = 'flex';
                sectionTitle.style.alignItems = 'center';
            }
        });
    }
    const eliminarAvatarBtn = document.getElementById('eliminar-avatar-btn');
    // Eliminar imagen personalizada y restaurar avatar por defecto
    if (eliminarAvatarBtn) {
        eliminarAvatarBtn.addEventListener('click', () => {
            const sexo = document.getElementById('perfil-sexo').value || 'hombre';
            const defaultAvatar = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
            perfilAvatar.src = defaultAvatar;
            // Cambiar también el avatar del header
            const headerAvatar = document.querySelector('header img.rounded-circle');
            if (headerAvatar) headerAvatar.src = defaultAvatar;
        });
    }
    const perfilForm = document.querySelector('#perfil-section form');
    const perfilAvatar = document.querySelector('#perfil-section img.rounded-circle');
    const cambiarAvatarBtn = document.getElementById('cambiar-avatar-btn');

    // Cargar datos de perfil al mostrar sección
    function cargarPerfil() {
        ipcRenderer.invoke('perfil-cargar').then(data => {
            const sexo = (data && data.sexo) ? data.sexo : 'hombre';
            document.getElementById('perfil-sexo').value = sexo;
            document.getElementById('perfil-nombre').value = data && data.nombre ? data.nombre : '';
            document.getElementById('perfil-apellido').value = data && data.apellido ? data.apellido : '';
            document.getElementById('perfil-email').value = data && data.email ? data.email : '';
            document.getElementById('perfil-cargo').value = data && data.cargo ? data.cargo : '';
            document.getElementById('perfil-numero-colegiado').value = data && data.numeroColegiado ? data.numeroColegiado : '';
            document.getElementById('perfil-telefono').value = data && data.telefono ? data.telefono : '';
            document.getElementById('perfil-fecha-nacimiento').value = data && data.fechaNacimiento ? data.fechaNacimiento : '';
            document.getElementById('perfil-direccion').value = data && data.direccion ? data.direccion : '';
            document.getElementById('perfil-notas').value = data && data.notas ? data.notas : '';
            if (data && data.avatar) {
                perfilAvatar.src = data.avatar;
            } else {
                perfilAvatar.src = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
            }
            // Cambiar también el avatar y el nombre del header
            const headerAvatar = document.querySelector('header img.rounded-circle');
            const headerName = document.querySelector('header .header-username');
            if (headerAvatar) {
                if (data && data.avatar) {
                    headerAvatar.src = data.avatar;
                } else {
                    headerAvatar.src = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
                }
            }
            if (headerName) {
                if (data && ((data.nombre && data.nombre.trim() !== '') || (data.apellido && data.apellido.trim() !== ''))) {
                    let nombreCompleto = '';
                    if (data.nombre && data.nombre.trim() !== '') nombreCompleto += data.nombre.trim();
                    if (data.apellido && data.apellido.trim() !== '') nombreCompleto += (nombreCompleto ? ' ' : '') + data.apellido.trim();
                    let cargo = data.cargo && data.cargo.trim() !== '' ? data.cargo.trim() : '';
                    if (cargo) {
                        headerName.innerHTML = `<span class="header-cargo" style="color:#16a34a;font-weight:600;"> ${cargo}</span> | ${nombreCompleto}`;
                    } else {
                        headerName.textContent = nombreCompleto;
                    }
                } else {
                    headerName.textContent = 'Usuario';
                }
            }
        });
    }

    // Guardar datos de perfil
    perfilForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const perfil = {
            nombre: document.getElementById('perfil-nombre').value,
            apellido: document.getElementById('perfil-apellido').value,
            email: document.getElementById('perfil-email').value,
            sexo: document.getElementById('perfil-sexo').value,
            cargo: document.getElementById('perfil-cargo').value,
            numeroColegiado: document.getElementById('perfil-numero-colegiado').value,
            telefono: document.getElementById('perfil-telefono').value,
            fechaNacimiento: document.getElementById('perfil-fecha-nacimiento').value,
            direccion: document.getElementById('perfil-direccion').value,
            notas: document.getElementById('perfil-notas').value,
            avatar: (perfilAvatar.src.includes('hombre.jpg') || perfilAvatar.src.includes('mujer.jpg')) ? '' : perfilAvatar.src
        };
        ipcRenderer.invoke('perfil-guardar', perfil).then(() => {
            alert('Perfil guardado correctamente');
        });
    });

    // Cambiar avatar (botón)
    if (cambiarAvatarBtn) {
        cambiarAvatarBtn.addEventListener('click', () => {
            ipcRenderer.invoke('perfil-cambiar-avatar').then(nuevaRuta => {
                if (nuevaRuta) {
                    perfilAvatar.src = nuevaRuta;
                    // Cambiar también el avatar del header
                    const headerAvatar = document.querySelector('header img.rounded-circle');
                    if (headerAvatar) headerAvatar.src = nuevaRuta;
                }
            });
        });
    }

    // Cargar perfil al mostrar sección
    document.querySelector('[data-section="perfil"]').addEventListener('click', cargarPerfil);
    // Cambiar avatar por defecto al cambiar sexo
    const sexoSelect = document.getElementById('perfil-sexo');
    if (sexoSelect) {
        sexoSelect.addEventListener('change', function() {
            if (!perfilAvatar.src || perfilAvatar.src.includes('hombre.jpg') || perfilAvatar.src.includes('mujer.jpg')) {
                perfilAvatar.src = this.value === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
                const headerAvatar = document.querySelector('header img.rounded-circle');
                if (headerAvatar) headerAvatar.src = perfilAvatar.src;
            }
        });
    }
}

module.exports = { setupProfileSection };
