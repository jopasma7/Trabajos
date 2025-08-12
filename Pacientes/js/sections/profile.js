// js/sections/profile.js
// Lógica de la sección Perfil de Usuario

const { ipcRenderer } = require('electron');

function setupProfileSection() {
    // --- Cargar datos de usuario y avatar en header al iniciar la app ---
    function cargarPerfilHeaderSolo() {
        ipcRenderer.invoke('perfil-cargar').then(data => {
            const sexo = (data && data.sexo) ? data.sexo : 'hombre';
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
    // Ejecutar al cargar el módulo
    cargarPerfilHeaderSolo();
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
    // Eliminar imagen personalizada y restaurar avatar por defecto SOLO en el formulario
    if (eliminarAvatarBtn) {
        eliminarAvatarBtn.addEventListener('click', () => {
            const sexo = document.getElementById('perfil-sexo').value || 'hombre';
            const defaultAvatar = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
            perfilAvatar.src = defaultAvatar;
            // NO cambiar el avatar del header aquí
        });
    }
    const perfilForm = document.querySelector('#perfil-section form');
    const perfilAvatar = document.querySelector('#perfil-section img.rounded-circle');
    const cambiarAvatarBtn = document.getElementById('cambiar-avatar-btn');

    // Cargar datos de perfil al mostrar sección
    let datosPerfilOriginal = {};
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
            // Guardar snapshot original para comparar cambios
            datosPerfilOriginal = {
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
                avatar: (data && data.avatar) ? data.avatar : (sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg')
            };
            // Cambiar también el avatar y el nombre del header SOLO al cargar, no al eliminar avatar
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
                        headerName.innerHTML = `<span class=\"header-cargo\" style=\"color:#16a34a;font-weight:600;\"> ${cargo}</span> | ${nombreCompleto}`;
                    } else {
                        headerName.textContent = nombreCompleto;
                    }
                } else {
                    headerName.textContent = 'Usuario';
                }
            }
            // Deshabilitar el botón de guardar cambios al cargar
            const btnGuardar = perfilForm.querySelector('button[type="submit"]');
            if (btnGuardar) btnGuardar.disabled = true;
        });
    // Habilitar el botón de guardar solo si hay cambios
    function hayCambiosPerfil() {
        if (!datosPerfilOriginal) return false;
        return [
            'nombre','apellido','email','sexo','cargo','numeroColegiado','telefono','fechaNacimiento','direccion','notas'
        ].some(campo => {
            const input = document.getElementById('perfil-' + campo.replace('numeroColegiado','numero-colegiado').replace('fechaNacimiento','fecha-nacimiento'));
            if (!input) return false;
            return input.value !== (datosPerfilOriginal[campo] || '');
        }) || (perfilAvatar && perfilAvatar.src !== datosPerfilOriginal.avatar);
    }

    // Evitar que el header cambie de avatar al eliminar imagen en el formulario
    // Si existe un botón para eliminar imagen, sobreescribimos su handler para que solo cambie el avatar del formulario
    const btnEliminarAvatar = document.getElementById('perfil-eliminar-avatar');
    if (btnEliminarAvatar && perfilAvatar) {
        btnEliminarAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            // Solo cambiar el avatar del formulario, NO el del header
            const sexo = document.getElementById('perfil-sexo').value || 'hombre';
            perfilAvatar.src = sexo === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
            // Habilitar guardar cambios
            const btnGuardar = perfilForm.querySelector('button[type="submit"]');
            if (btnGuardar) btnGuardar.disabled = !hayCambiosPerfil();
        });
    }
    // Escuchar cambios en los campos del formulario
    if (perfilForm) {
        perfilForm.addEventListener('input', () => {
            const btnGuardar = perfilForm.querySelector('button[type="submit"]');
            if (btnGuardar) btnGuardar.disabled = !hayCambiosPerfil();
        });
        // También al cambiar avatar, pero NO actualizar el header aquí
        if (perfilAvatar) {
            perfilAvatar.addEventListener('load', () => {
                const btnGuardar = perfilForm.querySelector('button[type="submit"]');
                if (btnGuardar) btnGuardar.disabled = !hayCambiosPerfil();
            });
        }
    }
    }

    // Guardar datos de perfil
    perfilForm.addEventListener('submit', (e) => {
        const btnGuardar = perfilForm.querySelector('button[type="submit"]');
        if (btnGuardar) btnGuardar.disabled = true;
        // Al guardar, actualizar avatar del header si corresponde
        setTimeout(() => {
            const headerAvatar = document.querySelector('header img.rounded-circle');
            if (headerAvatar) {
                headerAvatar.src = perfilAvatar.src;
            }
        }, 100);
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
            // Actualizar header inmediatamente tras guardar
            const headerName = document.querySelector('header .header-username');
            if (headerName) {
                let nombreCompleto = '';
                if (perfil.nombre && perfil.nombre.trim() !== '') nombreCompleto += perfil.nombre.trim();
                if (perfil.apellido && perfil.apellido.trim() !== '') nombreCompleto += (nombreCompleto ? ' ' : '') + perfil.apellido.trim();
                let cargo = perfil.cargo && perfil.cargo.trim() !== '' ? perfil.cargo.trim() : '';
                if (cargo && nombreCompleto) {
                    headerName.innerHTML = `<span class=\"header-cargo\" style=\"color:#16a34a;font-weight:600;\"> ${cargo}</span> | ${nombreCompleto}`;
                } else if (nombreCompleto) {
                    headerName.textContent = nombreCompleto;
                } else {
                    headerName.textContent = 'Usuario';
                }
            }
            if (typeof mostrarMensaje === 'function') {
                mostrarMensaje('Perfil guardado correctamente', 'success');
            } else if (window.mostrarMensaje) {
                window.mostrarMensaje('Perfil guardado correctamente', 'success');
            } else {
                alert('Perfil guardado correctamente');
            }
        });
    });

    // Cambiar avatar (botón)
    if (cambiarAvatarBtn) {
        cambiarAvatarBtn.addEventListener('click', () => {
            ipcRenderer.invoke('perfil-cambiar-avatar').then(nuevaRuta => {
                if (nuevaRuta) {
                    perfilAvatar.src = nuevaRuta;
                    // NO cambiar el avatar del header aquí
                }
            });
        });
    }

    // Cargar perfil al mostrar sección
    document.querySelector('[data-section="perfil"]').addEventListener('click', cargarPerfil);
    // Cambiar avatar por defecto al cambiar sexo SOLO en el formulario
    const sexoSelect = document.getElementById('perfil-sexo');
    if (sexoSelect) {
        sexoSelect.addEventListener('change', function() {
            if (!perfilAvatar.src || perfilAvatar.src.includes('hombre.jpg') || perfilAvatar.src.includes('mujer.jpg')) {
                perfilAvatar.src = this.value === 'mujer' ? '../assets/mujer.jpg' : '../assets/hombre.jpg';
                // NO cambiar el avatar del header aquí
            }
        });
    }
}

module.exports = { setupProfileSection };
