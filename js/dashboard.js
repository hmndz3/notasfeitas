document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar nombre de usuario
    const userInfo = getUserInfo();
    document.getElementById('username-display').textContent = userInfo.username;
    
    // Cargar cursos
    loadCourses();
    
    // Función para cargar todos los cursos
    async function loadCourses() {
        try {
            const token = localStorage.getItem('token');
            const courses = await api.getCourses(token);
            
            // Separar cursos inscritos y no inscritos
            const [enrolledCourses, availableCourses] = await separateCourses(courses);
            
            // Actualizar la interfaz
            displayAllCourses(availableCourses);
            displayEnrolledCourses(enrolledCourses);
            
        } catch (error) {
            console.error('Error cargando cursos:', error);
            showAlert('Error al cargar los cursos. Por favor, intente nuevamente más tarde.');
        }
    }
    
    // Función para separar cursos inscritos y disponibles
    async function separateCourses(courses) {
        try {
            const token = localStorage.getItem('token');
            const enrollments = await api.getEnrollments(token);
            
            // IDs de cursos inscritos
            const enrolledIds = enrollments.map(enrollment => enrollment.curso);
            
            // Separar cursos
            const enrolled = [];
            const available = [];
            
            for (const course of courses) {
                if (enrolledIds.includes(course.id)) {
                    // Buscar la inscripción correspondiente para obtener info adicional
                    const enrollment = enrollments.find(e => e.curso === course.id);
                    course.enrollment = enrollment;
                    enrolled.push(course);
                } else {
                    available.push(course);
                }
            }
            
            return [enrolled, available];
        } catch (error) {
            console.error('Error separando cursos:', error);
            return [[], courses]; // En caso de error, mostrar todos como disponibles
        }
    }
    
    // Función para mostrar todos los cursos
    function displayAllCourses(courses) {
        const container = document.getElementById('all-courses-container');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        No hay cursos disponibles en este momento.
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        courses.forEach(course => {
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card course-card h-100 not-enrolled border-secondary">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0">${course.nombre}</h5>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">Código: ${course.codigo}</h6>
                            <p class="card-text">${course.descripcion || 'Sin descripción'}</p>
                            
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-1"></i> No estás inscrito en este curso
                            </div>
                            <div class="d-flex justify-content-between">
                                <div>
                                    <small class="text-muted">Créditos: ${course.creditos}</small>
                                </div>
                                <button class="btn btn-success btn-sm enroll-btn" data-course-id="${course.id}">
                                    <i class="fas fa-plus-circle me-1"></i> Inscribirme
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Agregar eventos a los botones de inscripción
        document.querySelectorAll('.enroll-btn').forEach(button => {
            button.addEventListener('click', handleEnrollment);
        });
    }
    
    // Función para mostrar cursos inscritos
    function displayEnrolledCourses(courses) {
        const container = document.getElementById('enrolled-courses-container');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        No estás inscrito en ningún curso para este semestre.
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        courses.forEach(course => {
            // Calcular el progreso (aquí sería un placeholder, en un sistema real calcularías basado en calificaciones)
            const progreso = Math.floor(Math.random() * 100); // Ejemplo aleatorio
            const colorClass = (progreso >= 60) ? "success" : (progreso >= 40) ? "warning" : "danger";
            
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card course-card h-100">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">${course.nombre}</h5>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">Código: ${course.codigo}</h6>
                            <p class="card-text">${course.descripcion || 'Sin descripción'}</p>
                            
                            <div class="mb-3">
                                <small class="text-muted">Progreso actual (${progreso}%)</small>
                                <div class="progress mt-1">
                                    <div class="progress-bar bg-${colorClass}" role="progressbar" 
                                         style="width: ${progreso}%" 
                                         aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <small class="text-muted">Semestre: ${course.enrollment ? course.enrollment.semestre : 'Actual'}</small>
                                </div>
                                <a href="course-detail.html?id=${course.id}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye me-1"></i> Ver Detalles
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // Manejar inscripción a un curso
    async function handleEnrollment(event) {
        const courseId = parseInt(event.currentTarget.getAttribute('data-course-id'));
        const semestre = document.getElementById('current-semester').textContent;
        
        try {
            const token = localStorage.getItem('token');
            const enrollmentData = {
                curso: courseId,
                semestre: semestre,
            };
            
            await api.createEnrollment(enrollmentData, token);
            
            showAlert('Te has inscrito correctamente en el curso.', 'success');
            
            // Recargar cursos
            loadCourses();
            
            // Cambiar a la pestaña de cursos inscritos
            document.getElementById('enrolled-courses-tab').click();
            
        } catch (error) {
            console.error('Error en la inscripción:', error);
            
            if (error.data && error.data.non_field_errors) {
                showAlert(error.data.non_field_errors.join(' '));
            } else {
                showAlert('Error al inscribirse en el curso. Por favor, intente nuevamente más tarde.');
            }
        }
    }
    
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
        
        // Desplazarse hacia arriba para mostrar la alerta
        window.scrollTo(0, 0);
    }
});