// Función para mostrar mensajes de alerta
function showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alert-container');
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
}

// Función para redirigir según el rol del usuario
function redirectByRole(role) {
    if (role === 'administrador') {
        window.location.href = 'admin/dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Función para obtener información del usuario desde el token
function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Decodificar el token JWT (parte del payload)
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Gestionar inicio de sesión
document.addEventListener('DOMContentLoaded', function() {
    // Redirigir si ya está autenticado
    if (isAuthenticated() && window.location.pathname.endsWith('index.html')) {
        const userInfo = getUserInfo();
        redirectByRole(userInfo.role);
        return;
    }
    
    // Manejar formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await api.login(username, password);
                
                // Guardar tokens en localStorage
                localStorage.setItem('token', response.access);
                localStorage.setItem('refreshToken', response.refresh);
                
                // Decodificar el token para obtener el role
                const userInfo = getUserInfo();
                
                // Redirigir según el rol
                redirectByRole(userInfo.role);
                
            } catch (error) {
                if (error.status === 401) {
                    showAlert('Usuario o contraseña incorrectos');
                } else {
                    showAlert('Error al iniciar sesión. Intente nuevamente más tarde.');
                }
            }
        });
    }
    
    // Manejar cierre de sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            
            // Redirigir al login
            window.location.href = '../index.html';
        });
    }
});