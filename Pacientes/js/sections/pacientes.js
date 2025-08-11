
// pacientes.js
// Lógica específica para la sección Pacientes

console.log('Pacientes module loaded');

// Ejemplo: función para cargar pacientes desde el backend
const { ipcRenderer } = require('electron');

function cargarPacientes() {
	ipcRenderer.invoke('get-pacientes').then(pacientes => {
		console.log('Pacientes:', pacientes);
		// Aquí puedes renderizar la tabla de pacientes
	});
}

// Puedes llamar cargarPacientes() cuando se muestre la sección de pacientes
