const { ipcRenderer } = require('electron');
// --- Backup y Sincronización ---
const btnBackupLocalTurso = document.getElementById('btn-backup-local-turso');
const btnAgregarTursoLocal = document.getElementById('btn-agregar-turso-local');
const backupStatus = document.getElementById('backup-status');

function mostrarModalConfirmacion({ icono, titulo, mensaje, onConfirm }) {
  document.getElementById('modal-confirmacion-icono').textContent = icono || '';
  document.getElementById('modal-confirmacion-titulo').textContent = titulo || '¿Confirmar acción?';
  document.getElementById('modal-confirmacion-mensaje').textContent = mensaje || '¿Estás seguro de que deseas realizar esta acción?';

  const modal = new bootstrap.Modal(document.getElementById('modal-confirmacion'));
  modal.show();

  const btnConfirmar = document.getElementById('btn-confirmar-accion');
  btnConfirmar.onclick = null;
  btnConfirmar.onclick = () => {
    modal.hide();
    if (typeof onConfirm === 'function') onConfirm();
  };
}

if (btnBackupLocalTurso && btnAgregarTursoLocal) {
  btnBackupLocalTurso.onclick = () => {
    mostrarModalConfirmacion({
      icono: '☁️',
      titulo: 'Backup completo a la nube',
      mensaje: '¿Estás seguro de que quieres sobrescribir todos los datos en la nube? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        backupStatus.textContent = '☁️ Realizando backup completo a la nube...';
        const modalCargando = new bootstrap.Modal(document.getElementById('modal-cargando-sync'));
        modalCargando.show();
        try {
          await ipcRenderer.invoke('syncLocalToTurso');
          backupStatus.textContent = '✅ Backup a la nube completado correctamente.';
          window.mostrarMensaje('Sincronización completada con éxito', 'success');
          if (window.mostrarConfetti) window.mostrarConfetti();
          const audio = new Audio('../assets/sounds/success-ta-da.mp3');
          audio.volume = 0.7;
          audio.play();
        } catch (err) {
          backupStatus.textContent = '❌ Error en el backup: ' + err.message;
        }
        modalCargando.hide();
      }
    });
  };

  btnAgregarTursoLocal.onclick = () => {
    mostrarModalConfirmacion({
      icono: '➕',
      titulo: 'Agregar datos de la nube',
      mensaje: '¿Quieres agregar los datos de la nube a tu base local? Solo se añadirán registros nuevos.',
      onConfirm: async () => {
        backupStatus.textContent = '🔄 Agregando datos desde la nube...';
        const modalCargando = new bootstrap.Modal(document.getElementById('modal-cargando-sync'));
        modalCargando.show();
        try {
          await ipcRenderer.invoke('agregarDesdeTursoAlLocal');
          backupStatus.textContent = '✅ Datos agregados desde la nube a la base local.';
          window.mostrarMensaje('Datos agregados correctamente. Reinicia la aplicación o refresca para que los cambios tengan efecto', 'info');
          if (window.mostrarConfetti) window.mostrarConfetti();
          const audio = new Audio('../assets/sounds/success-ta-da.mp3');
          audio.volume = 0.7;
          audio.play();
        } catch (err) {
          backupStatus.textContent = '❌ Error al agregar datos: ' + err.message;
        }
        modalCargando.hide();
      }
    });
  };
}