// CRM Contactos Pro - Login JavaScript
// Enhanced with modern UX features

document.addEventListener('DOMContentLoaded', () => {
    initializeLogin();
});

function initializeLogin() {
    // Asegurar que los inputs estén correctamente habilitados
    ensureInputsEnabled();
    setupEventListeners();
    setupPasswordToggle();
    setupCredentialsCopy();
    animateElements();
}

function ensureInputsEnabled() {
    // Pequeña demora para asegurar que el DOM esté completamente cargado
    setTimeout(() => {
        const inputs = document.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            // Limpiar estilos que puedan interferir
            input.style.pointerEvents = '';
            input.style.cursor = '';
            input.style.opacity = '';
            
            // Asegurar que estén habilitados
            input.disabled = false;
            
            // Forzar reflow para Firefox/Webkit
            input.offsetHeight;
        });
        
        // Forzar focus en el primer input para activar el cursor
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
            // Pequeña demora y refocus si es necesario
            setTimeout(() => {
                if (document.activeElement !== usernameInput) {
                    usernameInput.focus();
                }
            }, 50);
        }
    }, 100);
}

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            window.electronAPI.navigateToRegister();
        });
    }
    
    // Add input animations
    setupInputAnimations();
}

function setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.closest('.input-group').classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.closest('.input-group').classList.remove('focused');
            }
        });
        
        // Check initial values
        if (input.value) {
            input.closest('.input-group').classList.add('focused');
        }
    });
}

function setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = toggleBtn.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                toggleBtn.title = 'Ocultar contraseña';
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                toggleBtn.title = 'Mostrar contraseña';
            }
        });
    }
}

function setupCredentialsCopy() {
    // Copy to clipboard functionality is handled inline in HTML
    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copiado al portapapeles', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Copiado al portapapeles', 'success');
        });
    };
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
    
    // Animate login card
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            loginCard.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
        }, 400);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    // Validation
    if (!email || !password) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Por favor, ingresa un email válido');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    
    try {
        const result = await window.electronAPI.login({
            email,
            password,
            rememberMe
        });
        
        if (result.success) {
            showSuccess('¡Bienvenido de vuelta!');
            
            // Show loading overlay with progress
            showLoadingOverlay();
            
            // Store user data in both localStorage and sessionStorage for redundancy
            const userDataStr = JSON.stringify(result.user);
            localStorage.setItem('currentUser', userDataStr);
            sessionStorage.setItem('currentUser', userDataStr);
            
            console.log('User data stored:', result.user);
            
            if (result.token) {
                localStorage.setItem('userToken', result.token);
                sessionStorage.setItem('userToken', result.token);
            }
            
            // Navigate to dashboard after animation
            setTimeout(async () => {
                await window.electronAPI.navigateToDashboard();
            }, 2000);
        } else {
            showError(result.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión. Inténtalo de nuevo.');
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const inputs = document.querySelectorAll('.input-group input');
    
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        inputs.forEach(input => input.disabled = true);
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
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
        errorMessage.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#28a745' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' }
    };
    
    const color = colors[type] || colors.info;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color.bg};
        color: ${color.text};
        padding: 16px 24px;
        border-radius: 12px;
        border-left: 4px solid ${color.border};
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        z-index: 10001;
        min-width: 280px;
        max-width: 400px;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        font-family: 'Inter', sans-serif;
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        word-wrap: break-word;
    `;
    
    toast.textContent = message;
    
    // Add click to close functionality
    const closeToast = () => {
        toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
        clearTimeout(autoCloseTimer);
    };
    
    toast.addEventListener('click', closeToast);
    
    document.body.appendChild(toast);
    
    // Auto-close after 4 seconds
    const autoCloseTimer = setTimeout(() => {
        if (toast.parentNode) {
            closeToast();
        }
    }, 4000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// CSS Animations for toasts
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
