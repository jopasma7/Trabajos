// Función global para mostrar mensajes flotantes
function mostrarMensaje(texto, tipo = 'success') {
	let alerta = document.createElement('div');
	alerta.className = `alert custom-alert alert-${tipo} position-fixed top-0 end-0 m-4 fade show`;
	alerta.style.zIndex = 9999;
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

window.mostrarMensaje = mostrarMensaje;
