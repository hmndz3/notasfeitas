document.addEventListener('DOMContentLoaded', function() {
    // Redirigir si ya está autenticado
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const first_name = document.getElementById('first_name').value;
            const last_name = document.getElementById('last_name').value;
            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const password_confirm = document.getElementById('password_confirm').value;
            
            // Validar que las contraseñas coincidan
            if (password !== password_confirm) {
                showAlert('Las contraseñas no coinciden');
                return;
            }
            
            try {
                const userData = {
                    first_name,
                    last_name,
                    email,
                    username,
                    password,
                    role: 'estudiante'
                };
                
                await api.register(userData);
                
                showAlert('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                if (error.data) {
                    if (error.data.username) {
                        showAlert(`Error: ${error.data.username.join(' ')}`);
                    } else if (error.data.email) {
                        showAlert(`Error: ${error.data.email.join(' ')}`);
                    } else {
                        showAlert('Error en el registro. Por favor, verifica tus datos.');
                    }
                } else {
                    showAlert('Error en el registro. Intente nuevamente más tarde.');
                }
            }
        });
    }
    
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
});