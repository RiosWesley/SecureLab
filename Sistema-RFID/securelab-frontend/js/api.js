// js/api.js
const API_URL = 'http://localhost:3000/api';

// Função para obter o token salvo
function getToken() {
    return localStorage.getItem('token');
}

// Função para verificar e obter dados do usuário
function getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Erro ao obter dados do usuário:', e);
        return null;
    }
}

// Função genérica para fazer requisições à API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Adicionar token de autenticação se disponível
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Verificar se é erro de autenticação
        if (response.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('token');
            window.location.href = '/index.html?auth=expired';
            return null;
        }
        
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}

// Funções de autenticação
async function login(email, password) {
    try {
        const response = await apiRequest('/auth/login', 'POST', { email, password });
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html?logout=success';
}

// Funções para obter dados do dashboard
async function getDashboardSummary() {
    return apiRequest('/dashboard/summary');
}

async function getDailyAccessCount(days = 7) {
    return apiRequest(`/dashboard/daily-access?days=${days}`);
}

async function getRecentActivity(limit = 10) {
    return apiRequest(`/dashboard/recent-activity?limit=${limit}`);
}

async function getSystemStatus() {
    return apiRequest('/dashboard/system-status');
}

// Funções para gerenciar portas
async function getAllDoors() {
    return apiRequest('/doors');
}

async function lockDoor(id, userId) {
    return apiRequest(`/doors/${id}/lock`, 'POST', { userId });
}

async function unlockDoor(id, userId) {
    return apiRequest(`/doors/${id}/unlock`, 'POST', { userId });
}

async function getDoorStatus(id) {
    return apiRequest(`/doors/${id}/status`);
}

// Funções para logs de acesso
async function getAccessLogs(limit = 50, page = 1) {
    return apiRequest(`/logs?limit=${limit}&page=${page}`);
}