// emoji-picker.js
// Integración de emoji-picker-element para el modal de etiquetas

document.addEventListener('DOMContentLoaded', () => {
  const iconoInput = document.getElementById('etiqueta-icono');
  const iconoBtn = document.getElementById('etiqueta-icono-btn');
  const iconoGroup = document.getElementById('etiqueta-icono-group');
  if (!iconoInput || !iconoBtn || !iconoGroup) return;

  // Crear el emoji picker
  const picker = document.createElement('emoji-picker');
  picker.style.position = 'absolute';
  picker.style.zIndex = '12000';
  picker.style.display = 'none';
  picker.style.width = '320px';
  picker.style.maxHeight = '350px';
  picker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  document.body.appendChild(picker);

  // Mostrar el picker al hacer clic en el botón
  iconoBtn.addEventListener('click', (e) => {
    const rect = iconoBtn.getBoundingClientRect();
    picker.style.left = rect.left + 'px';
    picker.style.top = (rect.bottom + window.scrollY) + 'px';
    picker.style.display = 'block';
    // Espera a que el picker se renderice y enfoca el campo de búsqueda
    setTimeout(() => {
      const searchInput = picker.shadowRoot && picker.shadowRoot.querySelector('input[type="search"]');
      if (searchInput) searchInput.focus();
    }, 100);
  });

  // Ocultar el picker al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target) && e.target !== iconoBtn) {
      picker.style.display = 'none';
    }
  });

  // Selección de emoji
  picker.addEventListener('emoji-click', (event) => {
    iconoInput.value = event.detail.unicode;
    iconoBtn.textContent = event.detail.unicode;
    picker.style.display = 'none';
  });

  // Resetear el botón al abrir el modal
  document.getElementById('modal-etiqueta').addEventListener('show.bs.modal', () => {
  iconoBtn.textContent = iconoInput.value || '🩸';
  });
});
