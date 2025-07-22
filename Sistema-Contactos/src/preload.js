const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Autenticación
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  register: (userData) => ipcRenderer.invoke('auth:register', userData),
  getCurrentUser: (token) => ipcRenderer.invoke('auth:getCurrentUser', token),
  
  // Gestión de usuarios (mantener para administración)
  getAllUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (userData) => ipcRenderer.invoke('users:create', userData),
  updateUser: (userData) => ipcRenderer.invoke('users:update', userData),
  deleteUser: (userId) => ipcRenderer.invoke('users:delete', userId),
  
  // Gestión de contactos empresariales
  getAllContacts: (userContext) => ipcRenderer.invoke('contacts:getAll', userContext),
  createContact: (contactData, userContext) => ipcRenderer.invoke('contacts:create', contactData, userContext),
  updateContact: (contactData, userContext) => ipcRenderer.invoke('contacts:update', contactData, userContext),
  deleteContact: (contactId, userContext) => ipcRenderer.invoke('contacts:delete', contactId, userContext),
  getContactStats: (userContext) => ipcRenderer.invoke('contacts:getStats', userContext),
  
  // Gestión de etiquetas
  getAllTags: () => ipcRenderer.invoke('tags:getAll'),
  createTag: (tagData) => ipcRenderer.invoke('tags:create', tagData),
  updateTag: (tagData) => ipcRenderer.invoke('tags:update', tagData),
  deleteTag: (tagId) => ipcRenderer.invoke('tags:delete', tagId),
  
  // Navegación
  navigateToDashboard: () => ipcRenderer.invoke('navigate:dashboard'),
  navigateToLogin: () => ipcRenderer.invoke('navigate:login'),
  navigateToRegister: () => ipcRenderer.invoke('navigate:register')
});
