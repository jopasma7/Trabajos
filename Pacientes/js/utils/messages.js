// Función global para mostrar mensajes flotantes
function mostrarMensaje(texto, tipo = 'success') {
	// Crear contenedor de toasts si no existe
	let toastContainer = document.getElementById('toast-messages-container');
	if (!toastContainer) {
		toastContainer = document.createElement('div');
		toastContainer.id = 'toast-messages-container';
		toastContainer.style.position = 'fixed';
		toastContainer.style.top = '20px';
		toastContainer.style.right = '20px';
		toastContainer.style.zIndex = 9999;
		toastContainer.style.display = 'flex';
		toastContainer.style.flexDirection = 'column';
		toastContainer.style.gap = '10px';
		document.body.appendChild(toastContainer);
	}
	let alerta = document.createElement('div');
	alerta.className = `alert custom-alert alert-${tipo} fade show`;
	alerta.style.minWidth = '260px';
	alerta.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
	let icon = '';
	switch (tipo) {
		case 'success':
			icon = '<span class="alert-icon">✨🎉</span>';
			break;
		case 'danger':
			icon = '<span class="alert-icon">❌😱🚨</span>';
			break;
		case 'warning':
			icon = '<span class="alert-icon">⚠️🧐🔔</span>';
			break;
		case 'info':
			icon = '<span class="alert-icon">ℹ️👀💡</span>';
			break;
		case 'delete':
			icon = '<span class="alert-icon">🗑️</span>';
			break;
		case 'edit':
			icon = '<span class="alert-icon">✏️</span>';
			break;
		case 'archive':
			icon = '<span class="alert-icon">📦</span>';
			break;
		default:
			icon = '<span class="alert-icon">💬</span>';
	}
	alerta.innerHTML = `${icon}<span class="alert-content">${texto}</span>`;
	toastContainer.appendChild(alerta);
	// Cerrar al hacer click en la alerta
	alerta.onclick = () => alerta.remove();
	setTimeout(() => {
		if (toastContainer.contains(alerta)) {
			alerta.classList.remove('show');
			alerta.classList.add('hide');
			setTimeout(() => alerta.remove(), 500);
		}
	}, 3000);
}

window.mostrarMensaje = mostrarMensaje;
