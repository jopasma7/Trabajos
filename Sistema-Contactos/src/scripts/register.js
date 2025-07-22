// CRM Contactos Pro - Register JavaScript
// Enhanced with modern UX features

document.addEventListener('DOMContentLoaded', () => {
    initializeRegister();
});

function initializeRegister() {
    setupEventListeners();
    setupPasswordToggles();
    setupAvatarUpload();
    animateElements();
}

function setupEventListeners() {
    const registerForm = document.getElementById('registerForm');
    const showLoginBtn = document.getElementById('showLoginBtn');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            window.electronAPI.navigateToLogin();
        });
    }
    
    // Add input animations
    setupInputAnimations();
}

function setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-group input, .select-group select');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.closest('.input-group, .select-group').classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.closest('.input-group, .select-group').classList.remove('focused');
            }
        });
        
        // Check initial values
        if (input.value) {
            input.closest('.input-group, .select-group').classList.add('focused');
        }
    });
}

function setupPasswordToggles() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = togglePassword.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                togglePassword.title = 'Ocultar contraseña';
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                togglePassword.title = 'Mostrar contraseña';
            }
        });
    }
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            
            const icon = toggleConfirmPassword.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                toggleConfirmPassword.title = 'Ocultar contraseña';
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                toggleConfirmPassword.title = 'Mostrar contraseña';
            }
        });
    }
}

function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarImage = document.getElementById('avatarImage');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (avatarInput && avatarImage) {
        avatarPreview.addEventListener('click', () => {
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function animateElements() {
    // Add staggered animation to feature items
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 200 + (index * 150));
    });
    
    // Animate register card
    const registerCard = document.querySelector('.register-card');
    if (registerCard) {
        registerCard.style.opacity = '0';
        registerCard.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            registerCard.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            registerCard.style.opacity = '1';
            registerCard.style.transform = 'translateY(0)';
        }, 400);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const gender = document.getElementById('gender').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    const avatarInput = document.getElementById('avatarInput');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Por favor, ingresa un email válido');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    if (!acceptTerms) {
        showError('Debes aceptar los términos y condiciones');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    hideSuccess();
    
    try {
        // Handle avatar upload
        let avatarData = null;
        if (avatarInput.files[0]) {
            const reader = new FileReader();
            avatarData = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(avatarInput.files[0]);
            });
        }
        
        const result = await window.electronAPI.register({
            name,
            email,
            password,
            gender: gender || null,
            avatar: avatarData,
            role: 'user' // Default role for new registrations
        });
        
        if (result.success) {
            showSuccess('¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.');
            
            // Show loading overlay
            showLoadingOverlay();
            
            // Clear form
            document.getElementById('registerForm').reset();
            document.getElementById('avatarImage').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
            
            // Navigate to login after showing success message
            setTimeout(() => {
                window.electronAPI.navigateToLogin();
            }, 3000);
        } else {
            showError(result.error || 'Error al crear la cuenta');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        showError('Error de conexión. Inténtalo de nuevo.');
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    const registerBtn = document.getElementById('registerBtn');
    const inputs = document.querySelectorAll('.input-group input, .select-group select');
    
    if (loading) {
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        inputs.forEach(input => input.disabled = true);
    } else {
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
        inputs.forEach(input => input.disabled = false);
    }
}

function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
        
        // Animate progress bar
        const progressBar = overlay.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.querySelector('.error-text').textContent = message;
        errorMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.querySelector('.success-text').textContent = message;
        successMessage.style.display = 'flex';
    }
}

function hideSuccess() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
