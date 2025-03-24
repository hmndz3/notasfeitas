// URL base de la API
const API_BASE_URL = 'http://localhost:8000/api';

// Función para hacer peticiones a la API
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                data: result
            };
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
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
        console.log('Datos de calificación a enviar:', JSON.stringify(gradeData));
        return apiRequest('/grades/', 'POST', gradeData, token);
    },

    deleteGrade: (id, token) => {
        return apiRequest(`/grades/${id}/`, 'DELETE', null, token);
    },
};