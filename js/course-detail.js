document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar nombre de usuario
    const userInfo = getUserInfo();
    document.getElementById('username-display').textContent = userInfo.username;
    
    // Obtener ID del curso de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar información del curso
    loadCourseDetails(courseId);
    
    // Función para cargar detalles del curso
    async function loadCourseDetails(id) {
        try {
            const token = localStorage.getItem('token');
            
            // Mostrar mensaje de carga
            showAlert('Cargando información del curso...', 'info');
            
            // Cargar curso
            const course = await api.getCourseDetail(id, token);
            
            // Mostrar información básica del curso
            document.getElementById('course-title').textContent = course.nombre;
            document.getElementById('course-code').textContent = `Código: ${course.codigo}`;
            document.title = `${course.nombre} - Calculadora de Notas`;
            
            // Cargar actividades
            const activities = await api.getCourseActivities(id, token);
            
            // Cargar calificaciones del usuario
            const grades = await api.getGrades(token);
            
            // Limpiar alerta de carga
            document.getElementById('alert-container').innerHTML = '';
            
            // Mostrar actividades y calificaciones
            displayActivities(activities, grades);
            
            // Mostrar resumen
            displaySummary(activities, grades);
            
        } catch (error) {
            console.error('Error cargando detalles del curso:', error);
            if (error.status === 401) {
                // Token expirado
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = 'index.html';
            } else {
                showAlert('Error al cargar los detalles del curso. Por favor, intente nuevamente más tarde.');
            }
        }
    }
    
    // Función para mostrar actividades y calificaciones
    function displayActivities(activities, grades) {
        const container = document.getElementById('activities-container');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    No hay actividades programadas para este curso.
                </div>
            `;
            return;
        }
        
        // Crear formulario
        const formHTML = `
            <form id="grades-form">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Actividad</th>
                            <th>Ponderación</th>
                            <th>Fecha</th>
                            <th>Calificación</th>
                            <th>Puntos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activities.map(activity => {
                            // Buscar calificación existente
                            const grade = grades.find(g => g.actividad === activity.id);
                            const hasGrade = !!grade;
                            const gradeValue = hasGrade ? grade.nota : '';
                            const points = hasGrade ? (grade.nota * activity.ponderacion / 100).toFixed(2) : '-';
                            
                            return `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <span class="status-indicator ${hasGrade ? 'status-completed' : 'status-pending'}"></span>
                                            ${activity.nombre}
                                        </div>
                                    </td>
                                    <td>${activity.ponderacion}%</td>
                                    <td>${formatDate(activity.fecha_programada)}</td>
                                    <td class="note-cell">
                                        <div class="d-flex">
                                            <input type="number" name="grades[${activity.id}]" 
                                                   class="form-control form-control-sm" 
                                                   min="0" max="100" step="0.1"
                                                   value="${gradeValue}"
                                                   placeholder="0-100">
                                            ${hasGrade ? `
                                                <button type="button" class="btn btn-sm btn-danger ms-1 delete-grade-btn" 
                                                        data-grade-id="${grade.id}" title="Eliminar nota">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td>${points} pts</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i> Guardar Notas
                    </button>
                </div>
            </form>
        `;
        
        container.innerHTML = formHTML;
        
        // Agregar eventos
        document.getElementById('grades-form').addEventListener('submit', handleGradeSubmit);
        
        // Agregar eventos a botones de eliminar
        document.querySelectorAll('.delete-grade-btn').forEach(button => {
            button.addEventListener('click', handleDeleteGrade);
        });
    }
    
    // Función para mostrar resumen (CORREGIDA)
    function displaySummary(activities, grades) {
        const container = document.getElementById('summary-container');
        
        // Calcular totales
        let totalWeight = 0;
        let evaluatedWeight = 0;
        let earnedPoints = 0;
        
        // Asegurarse de que estamos trabajando con números
        activities.forEach(activity => {
            const weight = parseFloat(activity.ponderacion);
            totalWeight += weight;
            
            // Buscar calificación
            const grade = grades.find(g => g.actividad === activity.id);
            if (grade) {
                const gradeValue = parseFloat(grade.nota);
                evaluatedWeight += weight;
                earnedPoints += (gradeValue * weight / 100); // Convertir a puntos
            }
        });
        
        // Logs para depuración
        console.log("DEBUG - Totales:", { totalWeight, evaluatedWeight, earnedPoints });
        
        // Puntos mínimos para aprobar (61% del total)
        const minPointsToPass = totalWeight * 0.61;
        
        // Puntos faltantes para aprobar (CORREGIDO)
        const missingPoints = Math.max(0, minPointsToPass - earnedPoints);
        
        // Puntos restantes por evaluar
        const remainingPoints = totalWeight - evaluatedWeight;
        
        console.log("DEBUG - Cálculos:", { minPointsToPass, missingPoints, remainingPoints });
        
        // Determinar si es posible aprobar
        const canStillPass = missingPoints <= remainingPoints;
        
        // Estado del curso
        let courseStatus = '';
        let statusClass = '';
        
        if (earnedPoints >= minPointsToPass) {
            courseStatus = "Ya tienes los puntos para aprobar";
            statusClass = "success";
        } else if (canStillPass) {
            courseStatus = `Necesitas ${missingPoints.toFixed(2)} pts más`;
            statusClass = "warning";
        } else {
            courseStatus = "Ya no es posible alcanzar los puntos para aprobar";
            statusClass = "danger";
        }
        
        // Crear HTML
        const summaryHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>Estado:</span>
                    <span class="badge bg-${statusClass}">${courseStatus}</span>
                </div>
            </div>
            
            <table class="table table-sm">
                <tr>
                    <td>Total de puntos del curso:</td>
                    <td class="text-end fw-bold">${totalWeight.toFixed(2)} pts</td>
                </tr>
                <tr>
                    <td>Puntos evaluados hasta ahora:</td>
                    <td class="text-end">${evaluatedWeight.toFixed(2)} pts</td>
                </tr>
                <tr>
                    <td>Puntos obtenidos:</td>
                    <td class="text-end">${earnedPoints.toFixed(2)} pts</td>
                </tr>
                <tr>
                    <td>Puntos restantes por evaluar:</td>
                    <td class="text-end">${remainingPoints.toFixed(2)} pts</td>
                </tr>
                <tr>
                    <td>Puntos mínimos para aprobar (61%):</td>
                    <td class="text-end">${minPointsToPass.toFixed(2)} pts</td>
                </tr>
                ${missingPoints > 0 ? `
                <tr class="${canStillPass ? 'table-warning' : 'table-danger'}">
                    <td>Puntos que te faltan para aprobar:</td>
                    <td class="text-end fw-bold">${missingPoints.toFixed(2)} pts</td>
                </tr>
                ` : ''}
            </table>
            
            <div class="progress mt-3" style="height: 20px;">
                <div class="progress-bar bg-${earnedPoints >= minPointsToPass ? 'success' : 'warning'}" 
                     role="progressbar" 
                     style="width: ${Math.min((earnedPoints / minPointsToPass) * 100, 100)}%" 
                     aria-valuenow="${earnedPoints}" 
                     aria-valuemin="0" 
                     aria-valuemax="${minPointsToPass}">
                    ${earnedPoints.toFixed(1)} / ${minPointsToPass.toFixed(1)} pts
                </div>
            </div>
        `;
        
        container.innerHTML = summaryHTML;
    }
    
    // Función mejorada para manejar envío de calificaciones
    async function handleGradeSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const token = localStorage.getItem('token');
        
        // Deshabilitar botón para evitar múltiples envíos
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        try {
            showAlert('Guardando calificaciones...', 'info');
            
            let savedAnyGrade = false;
            let errors = [];
            
            // Procesar datos del formulario
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('grades[') && value !== '') {
                    // Extraer ID de actividad
                    const activityId = parseInt(key.match(/\[(\d+)\]/)[1]);
                    const grade = parseFloat(value);
                    
                    // Validar rango de calificación
                    if (grade < 0 || grade > 100) {
                        errors.push(`La calificación para la actividad #${activityId} debe estar entre 0 y 100`);
                        continue;
                    }
                    
                    console.log('Enviando calificación:', {
                        actividad: activityId,
                        nota: grade
                    });
                    
                    try {
                        // Verificar si ya existe una calificación
                        const grades = await api.getGrades(token);
                        const existingGrade = grades.find(g => g.actividad === activityId);
                        
                        if (existingGrade) {
                            // Actualizar calificación existente
                            await api.updateGrade(existingGrade.id, { 
                                nota: grade 
                            }, token);
                            console.log('Calificación actualizada:', existingGrade.id);
                        } else {
                            // Crear nueva calificación
                            const result = await api.createGrade({ 
                                actividad: activityId,
                                nota: grade 
                            }, token);
                            console.log('Nueva calificación creada:', result);
                        }
                        
                        savedAnyGrade = true;
                    } catch (innerError) {
                        console.error(`Error guardando calificación para actividad ${activityId}:`, innerError);
                        let errorMsg = `Error al guardar la calificación para actividad #${activityId}`;
                        if (innerError.data && innerError.data.detail) {
                            errorMsg += `: ${innerError.data.detail}`;
                        }
                        errors.push(errorMsg);
                    }
                }
            }
            
            // Reactivar botón
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save me-1"></i> Guardar Notas';
            
            if (errors.length > 0) {
                showAlert(`Se encontraron errores: ${errors.join('. ')}`, 'warning');
            } else if (savedAnyGrade) {
                showAlert('Calificaciones guardadas correctamente.', 'success');
                
                // Recargar página para mostrar cambios
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showAlert('No se guardaron calificaciones. Asegúrate de ingresar al menos una calificación.', 'warning');
            }
            
        } catch (error) {
            console.error('Error general guardando calificaciones:', error);
            
            // Reactivar botón
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save me-1"></i> Guardar Notas';
            
            if (error.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                showAlert('Tu sesión ha expirado. Serás redirigido al inicio de sesión.', 'warning');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                if (error.data && error.data.detail) {
                    showAlert(`Error: ${error.data.detail}`, 'danger');
                } else {
                    showAlert('Error al guardar las calificaciones. Por favor, intente nuevamente más tarde.', 'danger');
                }
            }
        }
    }
    
    // Manejar eliminación de calificación
    async function handleDeleteGrade(event) {
        const gradeId = parseInt(event.currentTarget.getAttribute('data-grade-id'));
        
        if (!confirm('¿Estás seguro de que quieres eliminar esta calificación?')) {
            return;
        }
        
        try {
            const button = event.currentTarget;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            showAlert('Eliminando calificación...', 'info');
            
            const token = localStorage.getItem('token');
            await api.deleteGrade(gradeId, token);
            
            showAlert('Calificación eliminada correctamente.', 'success');
            
            // Recargar página
            setTimeout(() => {
                location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error eliminando calificación:', error);
            if (error.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = 'index.html';
            } else {
                let errorMsg = 'Error al eliminar la calificación.';
                if (error.data && error.data.detail) {
                    errorMsg += ` ${error.data.detail}`;
                }
                showAlert(errorMsg, 'danger');
            }
        }
    }
    
    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return 'No programada';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return dateString || 'Fecha desconocida';
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