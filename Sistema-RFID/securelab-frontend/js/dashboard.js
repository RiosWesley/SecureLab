// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
        // Redirecionar para login se não estiver autenticado
        window.location.href = '/login.html?auth=required';
        return;
    }
    
    // Carregar dados do usuário
    const user = JSON.parse(userStr);
    
    // Atualizar nome do usuário no topbar
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name || 'Usuário';
    }
    
    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html?logout=success';
        });
    }
    
    // Atualizar timestamp de última atualização
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
    
    // Inicializar comportamento do sistema
    initializeDashboard();
});

// Inicializar funcionalidades do dashboard
function initializeDashboard() {
    // Ativar tooltips (Bootstrap)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Fake data para o dashboard (até termos a API completa)
    updateDashboardCards({
        today: {
            access: 45,
            denied: 7,
            change: 12
        },
        active_users: 28,
        total_users: 31,
        devices: {
            total: 6,
            online: 5,
            offline: 1,
            offline_list: ['Lab05']
        }
    });
}

// Atualizar os cards do dashboard
function updateDashboardCards(data) {
    // Acessos hoje
    updateElement('access-today', data.today.access);
    updateElement('access-change', data.today.change);
    
    // Usuários
    updateElement('active-users', data.active_users);
    updateElement('total-users', data.total_users);
    
    // Acessos negados
    updateElement('denied-access', data.today.denied);
    
    // Dispositivos
    updateElement('online-devices', `${data.devices.online}/${data.devices.total}`);
    
    // Texto do dispositivo offline
    if (data.devices.offline > 0) {
        updateElement('online-devices-info', `<i class="fas fa-wifi me-1"></i>${data.devices.offline} offline: ${data.devices.offline_list[0]}`);
    }
}

// Utilitário para atualizar elementos pelo ID
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = value;
    }
}