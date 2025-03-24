// URL base de la API - Configurable para diferentes entornos
let API_BASE_URL;

// Detectar entorno
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = 'http://localhost:8000/api';
} else {
    // URL para producción (GitHub Pages)
    API_BASE_URL = 'http://localhost:8000/api'; // CAMBIAR ESTO cuando despliegues tu backend
}

console.log('API Base URL:', API_BASE_URL);

// Función para hacer peticiones a la API con mejor manejo de errores
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers,
        credentials: 'include' // Para manejar cookies
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        console.log(`Enviando ${method} a ${endpoint}:`, data);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        console.log(`Respuesta de ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText
        });
        
        // Manejar respuestas vacías (ej. DELETE)
        if (response.status === 204) {
            return { success: true };
        }
        
        // Intentar parsear JSON
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
            console.log('Datos recibidos:', result);
        } else {
            const text = await response.text();
            console.warn('Respuesta no es JSON:', text);
            result = { detail: 'No se recibió respuesta JSON' };
        }
        
        if (!response.ok) {
            throw {
                status: response.status,
                data: result
            };
        }
        
        return result;
    } catch (error) {
        if (error.status) {
            console.error(`Error API (${error.status}):`, error.data);
        } else if (error.message) {
            console.error('Error de red:', error.message);
            throw {
                status: 0,
                data: { detail: `Error de conexión: ${error.message}` }
            };
        } else {
            console.error('Error desconocido:', error);
        }
        throw error;
    }
}

// Funciones específicas para cada endpoint
const api = {
    // Autenticación
    login: (username, password) => {
        return apiRequest('/token/', 'POST', { username, password });
    },
    
    register: (userData) => {
        return apiRequest('/register/', 'POST', userData);
    },
    
    refreshToken: (refreshToken) => {
        return apiRequest('/token/refresh/', 'POST', { refresh: refreshToken });
    },
    
    // Cursos
    getCourses: (token) => {
        return apiRequest('/courses/', 'GET', null, token);
    },
    
    getCourseDetail: (id, token) => {
        return apiRequest(`/courses/${id}/`, 'GET', null, token);
    },
    
    createCourse: (courseData, token) => {
        return apiRequest('/courses/', 'POST', courseData, token);
    },
    
    updateCourse: (id, courseData, token) => {
        return apiRequest(`/courses/${id}/`, 'PUT', courseData, token);
    },
    
    // Actividades
    getCourseActivities: (courseId, token) => {
        return apiRequest(`/courses/${courseId}/activities/`, 'GET', null, token);
    },
    
    createActivity: (activityData, token) => {
        return apiRequest('/activities/', 'POST', activityData, token);
    },
    
    updateActivity: (id, activityData, token) => {
        return apiRequest(`/activities/${id}/`, 'PUT', activityData, token);
    },
    
    // Inscripciones
    getEnrollments: (token) => {
        return apiRequest('/enrollments/', 'GET', null, token);
    },
    
    createEnrollment: (enrollmentData, token) => {
        return apiRequest('/enrollments/', 'POST', enrollmentData, token);
    },
    
    // Calificaciones
    getGrades: (token) => {
        return apiRequest('/grades/', 'GET', null, token);
    },
    
    updateGrade: (id, gradeData, token) => {
        return apiRequest(`/grades/${id}/`, 'PUT', gradeData, token);
    },
    
    createGrade: (gradeData, token) => {
        console.log('Enviando datos de calificación:', JSON.stringify(gradeData));
        return apiRequest('/grades/', 'POST', gradeData, token);
    },

    deleteGrade: (id, token) => {
        return apiRequest(`/grades/${id}/`, 'DELETE', null, token);
    },
};