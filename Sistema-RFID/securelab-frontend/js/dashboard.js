// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const user = getUser();
    const token = getToken();
    
    if (!user || !token) {
        // Redirecionar para login se não estiver autenticado
        window.location.href = '/index.html?auth=required';
        return;
    }
    
    // Configurar informações do usuário
    setupUserInfo(user);
    
    // Carregar dados do dashboard
    await loadDashboardData();
    
    // Configurar eventos
    setupEventListeners();
});

// Configurar informações do usuário no topbar
function setupUserInfo(user) {
    // Atualizar nome do usuário no dropdown de perfil
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name || 'Usuário';
    }
    
    // Configurar evento de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Carregar todos os dados necessários para o dashboard
async function loadDashboardData() {
    showLoading(true);
    
    try {
        // Carregar dados em paralelo para melhor performance
        const [summaryResponse, doorsResponse, activityResponse] = await Promise.all([
            getDashboardSummary(),
            getAllDoors(),
            getRecentActivity(5)
        ]);
        
        // Atualizar estatísticas gerais
        if (summaryResponse.success) {
            updateSummaryCards(summaryResponse.summary);
        }
        
        // Atualizar status das portas
        if (doorsResponse.success) {
            updateDoorStatus(doorsResponse.doors);
        }
        
        // Atualizar atividades recentes
        if (activityResponse.success) {
            updateRecentActivity(activityResponse.activities);
        }
        
        // Carregar dados para os gráficos
        const dailyAccessResponse = await getDailyAccessCount(7);
        if (dailyAccessResponse.success) {
            updateActivityChart(dailyAccessResponse.data);
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showErrorMessage('Falha ao carregar dados. Verifique sua conexão.');
    } finally {
        showLoading(false);
    }
}

// Atualizar os cards com os números do dashboard
function updateSummaryCards(summary) {
    // Acessos hoje
    updateCardValue('access-today', summary.today.access);
    updateCardValue('access-change', summary.today.change);
    
    // Usuários ativos
    updateCardValue('active-users', summary.active_users);
    updateCardValue('total-users', summary.total_users);
    
    // Acessos negados
    updateCardValue('denied-access', summary.today.denied);
    
    // Dispositivos
    updateCardValue('online-devices', `${summary.devices.online}/${summary.devices.total}`);
    
    if (summary.devices.offline > 0) {
        const deviceInfo = document.querySelector('#online-devices-info');
        if (deviceInfo) {
            deviceInfo.innerHTML = `<i class="fas fa-wifi me-1"></i>${summary.devices.offline} offline: ${summary.devices.offline_list?.[0] || 'Dispositivo'}`;
        }
    }
}

// Atualizar valor de um card específico
function updateCardValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Atualizar o status das portas na tabela
function updateDoorStatus(doors) {
    const doorTableBody = document.querySelector('#door-status-table tbody');
    if (!doorTableBody) return;
    
    // Limpar tabela
    doorTableBody.innerHTML = '';
    
    // Adicionar cada porta
    doors.forEach(door => {
        const row = document.createElement('tr');
        const isLocked = door.status === 'locked';
        
        row.innerHTML = `
            <td class="align-middle">${door.name}</td>
            <td class="align-middle">
                <span class="door-status ${isLocked ? 'status-locked' : 'status-unlocked'}">
                    ${isLocked ? 'Trancada' : 'Desbloqueada'}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm ${isLocked ? 'btn-primary' : 'btn-danger'} door-control-btn"
                        data-door-id="${door.id}" 
                        data-action="${isLocked ? 'unlock' : 'lock'}">
                    <i class="fas fa-${isLocked ? 'unlock' : 'lock'}"></i>
                </button>
            </td>
        `;
        
        doorTableBody.appendChild(row);
    });
}

// Atualizar a lista de atividades recentes
function updateRecentActivity(activities) {
    const container = document.getElementById('recent-activities');
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-3">Nenhuma atividade recente</div>';
        return;
    }
    
    // Adicionar cada atividade
    activities.forEach(activity => {
        const isGranted = activity.action === 'access_granted';
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${isGranted ? 'log-success' : 'log-denied'}`;
        
        logEntry.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="fw-bold">${activity.user_name || 'Usuário'}</span> •
                    <span class="text-muted">${activity.door_name || 'Porta'}</span>
                </div>
                <span class="badge ${isGranted ? 'bg-success' : 'bg-danger'}">
                    ${isGranted ? 'Acesso Permitido' : 'Acesso Negado'}
                </span>
            </div>
            <div class="small text-muted mt-1">
                <i class="far fa-clock me-1"></i> ${formatTimeAgo(activity.timestamp)}
            </div>
        `;
        
        container.appendChild(logEntry);
    });
}

// Atualizar o gráfico de atividade diária (exemplo para Chart.js)
function updateActivityChart(data) {
    const chartCanvas = document.getElementById('activity-chart');
    if (!chartCanvas) return;
    
    // Se você estiver usando Chart.js, algo assim:
    if (window.activityChart) {
        window.activityChart.destroy();
    }
    
    if (window.Chart) {
        const ctx = chartCanvas.getContext('2d');
        
        // Preparar dados para o gráfico
        const labels = data.map(item => item.day);
        const grantedData = data.map(item => item.granted);
        const deniedData = data.map(item => item.denied);
        
        window.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Acessos Permitidos',
                        data: grantedData,
                        borderColor: '#1cc88a',
                        backgroundColor: 'rgba(28, 200, 138, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Acessos Negados',
                        data: deniedData,
                        borderColor: '#e74a3b',
                        backgroundColor: 'rgba(231, 74, 59, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        // Fallback se Chart.js não estiver disponível
        console.log('Chart.js não está disponível. Dados:', data);
    }
}

// Configurar ouvintes de eventos
function setupEventListeners() {
    // Botão para atualizar portas
    const refreshDoorsBtn = document.getElementById('refresh-doors');
    if (refreshDoorsBtn) {
        refreshDoorsBtn.addEventListener('click', async () => {
            try {
                const response = await getAllDoors();
                if (response.success) {
                    updateDoorStatus(response.doors);
                }
            } catch (error) {
                console.error('Erro ao atualizar status das portas:', error);
            }
        });
    }
    
    // Configurar controle de portas (delegação de eventos)
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.door-control-btn')) {
            const button = e.target.closest('.door-control-btn');
            const doorId = button.dataset.doorId;
            const action = button.dataset.action;
            const user = getUser();
            
            if (!doorId || !action || !user) return;
            
            // Desabilitar botão e mostrar loading
            button.disabled = true;
            const originalContent = button.innerHTML;
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            
            try {
                // Executar ação
                if (action === 'lock') {
                    await lockDoor(doorId, user.id);
                } else {
                    await unlockDoor(doorId, user.id);
                }
                
                // Atualizar lista de portas
                const response = await getAllDoors();
                if (response.success) {
                    updateDoorStatus(response.doors);
                }
            } catch (error) {
                console.error(`Erro ao ${action === 'lock' ? 'trancar' : 'destrancar'} porta:`, error);
                showErrorMessage(`Falha ao controlar porta. ${error.message || ''}`);
                
                // Restaurar botão ao estado original
                button.innerHTML = originalContent;
                button.disabled = false;
            }
        }
    });
    
    // Configurar toggle do sidebar
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
}

// Exibir/ocultar indicador de carregamento
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

// Exibir mensagem de erro
function showErrorMessage(message, duration = 5000) {
    // Criar elemento de toast se não existir
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Criar toast
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header bg-danger text-white">
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong class="me-auto">Erro</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remover após duração
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, duration);
    
    // Configurar botão de fechar
    const closeButton = toast.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        });
    }
}

// Formatar timestamp para tempo relativo
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} segundos atrás`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minutos atrás`;
    
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} horas atrás`;
    
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} dias atrás`;
    
    // Formato de data regular para mais de 7 dias
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}