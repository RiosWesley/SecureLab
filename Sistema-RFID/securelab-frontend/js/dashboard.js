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
        logoutBtn.addEventListener('click', logout);
    }
    
    // Inicializar comportamento do sistema
    initializeDashboard();
    
    // Configurar botão de atualização de portas
    const refreshDoorsBtn = document.getElementById('refresh-doors');
    if (refreshDoorsBtn) {
        refreshDoorsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateDoorStatus();
        });
    }
    
    // Event listener para botões de período nos gráficos
    document.querySelectorAll('[data-period]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const period = e.target.getAttribute('data-period');
            updateChartByPeriod(period);
        });
    });
});

// Inicializar funcionalidades do dashboard
async function initializeDashboard() {
    try {
        // Mostrar indicador de carregamento
        showLoadingIndicator(true);
        
        // Buscar dados do dashboard
        await loadDashboardData();
        
        // Atualizar timestamp de última atualização
        document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString();
        
        // Inicializar gráficos
        await initCharts();
        
        // Carregar atividades recentes
        await updateRecentActivities();
        
        // Carregar status das portas
        await updateDoorStatus();
        
        // Carregar status do sistema
        await updateSystemStatus();
        
        // Carregar alertas
        await updateAlerts();
    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        showError('Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.');
    } finally {
        // Esconder indicador de carregamento
        showLoadingIndicator(false);
    }
}

// Carregar dados principais do dashboard
async function loadDashboardData() {
    try {
        const response = await getDashboardSummary();
        
        if (response && response.success) {
            updateDashboardCards(response.summary);
        } else {
            throw new Error('Falha ao carregar resumo do dashboard');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        throw error;
    }
}

// Inicializar gráficos
async function initCharts() {
    try {
        // Dados para o gráfico de atividade
        const activityData = await getDailyAccessCount(7);
        if (activityData && activityData.success) {
            createActivityChart(activityData.data);
        }
        
        // Dados para o gráfico de distribuição
        const distributionData = await getAccessDistribution();
        if (distributionData && distributionData.success) {
            createDistributionChart(distributionData.distribution);
        }
    } catch (error) {
        console.error('Erro ao inicializar gráficos:', error);
    }
}

// Atualizar os cards do dashboard
function updateDashboardCards(data) {
    // Acessos hoje
    updateElement('access-today', data.today?.access || 0);
    updateElement('access-change', data.today?.change || 0);
    
    // Usuários
    updateElement('active-users', data.active_users || 0);
    updateElement('total-users', data.total_users || 0);
    
    // Acessos negados
    updateElement('denied-access', data.today?.denied || 0);
    
    // Informação de acessos negados
    if (data.most_denied_door) {
        updateElement('denied-info', `<i class="fas fa-exclamation-triangle me-1"></i>${data.most_denied_door.count} na ${data.most_denied_door.name}`);
    } else {
        updateElement('denied-info', '<i class="fas fa-check-circle me-1"></i>Nenhum acesso negado hoje');
    }
    
    // Dispositivos
    const devicesTotal = data.devices?.total || 0;
    const devicesOnline = data.devices?.online || 0;
    updateElement('online-devices', `${devicesOnline}/${devicesTotal}`);
    
    // Texto do dispositivo offline
    if (data.devices?.offline > 0) {
        const offlineList = data.devices.offline_list?.join(', ') || 'Desconhecido';
        updateElement('online-devices-info', `<i class="fas fa-wifi me-1"></i>${data.devices.offline} offline: ${offlineList}`);
    } else {
        updateElement('online-devices-info', '<i class="fas fa-check-circle me-1"></i>Todos dispositivos online');
    }
}

// Atualizar atividades recentes
async function updateRecentActivities() {
    const activitiesContainer = document.getElementById('recent-activities');
    const loadingIndicator = document.getElementById('activities-loading');
    
    try {
        const response = await getRecentActivity(5); // Obter 5 atividades mais recentes
        
        if (response && response.success) {
            // Remover indicador de carregamento
            if (loadingIndicator) loadingIndicator.remove();
            
            // Limpar o container
            activitiesContainer.innerHTML = '';
            
            if (response.activities && response.activities.length > 0) {
                // Adicionar cada atividade
                response.activities.forEach(activity => {
                    const entryClass = activity.action === 'access_granted' ? 'log-success' : 'log-denied';
                    const badgeClass = activity.action === 'access_granted' ? 'bg-success' : 'bg-danger';
                    const badgeText = activity.action === 'access_granted' ? 'Acesso Permitido' : 'Acesso Negado';
                    
                    const timeAgo = formatTimeAgo(new Date(activity.timestamp));
                    
                    const entryHtml = `
                        <div class="log-entry ${entryClass}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="fw-bold">${activity.user_name || 'Usuário'}</span> •
                                    <span class="text-muted">${activity.door_name || 'Porta'}</span>
                                </div>
                                <span class="badge ${badgeClass}">${badgeText}</span>
                            </div>
                            <div class="small text-muted mt-1">
                                <i class="far fa-clock me-1"></i> ${timeAgo}
                            </div>
                        </div>
                    `;
                    
                    activitiesContainer.innerHTML += entryHtml;
                });
            } else {
                activitiesContainer.innerHTML = `
                    <div class="text-center py-3 text-muted">
                        <i class="fas fa-info-circle me-1"></i> Nenhuma atividade recente
                    </div>
                `;
            }
        } else {
            throw new Error('Falha ao carregar atividades recentes');
        }
    } catch (error) {
        console.error('Erro ao atualizar atividades recentes:', error);
        activitiesContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar atividades.
                <a href="#" onclick="updateRecentActivities(); return false;">Tentar novamente</a>
            </div>
        `;
    }
}

// Atualizar status das portas
async function updateDoorStatus() {
    const doorTable = document.getElementById('door-status-table').querySelector('tbody');
    
    try {
        doorTable.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-3 text-muted">
                    <div class="spinner-border spinner-border-sm me-2"></div>
                    Carregando status das portas...
                </td>
            </tr>
        `;
        
        const response = await getAllDoors();
        
        if (response && response.success) {
            // Limpar a tabela
            doorTable.innerHTML = '';
            
            if (response.doors && response.doors.length > 0) {
                // Adicionar cada porta
                response.doors.forEach(door => {
                    const isLocked = door.status === 'locked';
                    const statusClass = isLocked ? 'status-locked' : 'status-unlocked';
                    const statusText = isLocked ? 'Trancada' : 'Desbloqueada';
                    const actionText = isLocked ? 'unlock' : 'lock';
                    const actionIcon = isLocked ? 'fas fa-unlock' : 'fas fa-lock';
                    const buttonClass = isLocked ? 'btn-primary' : 'btn-danger';
                    
                    const rowHtml = `
                        <tr>
                            <td class="align-middle">${door.name}</td>
                            <td class="align-middle"><span class="door-status ${statusClass}">${statusText}</span></td>
                            <td class="text-end">
                                <button class="btn btn-sm ${buttonClass} door-control-btn" 
                                        data-door-id="${door.id}" 
                                        data-action="${actionText}">
                                    <i class="${actionIcon}"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    
                    doorTable.innerHTML += rowHtml;
                });
                
                // Adicionar event listeners aos botões
                setupDoorControlButtons();
            } else {
                doorTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center py-3 text-muted">
                            <i class="fas fa-info-circle me-1"></i> Nenhuma porta cadastrada
                        </td>
                    </tr>
                `;
            }
        } else {
            throw new Error('Falha ao carregar status das portas');
        }
    } catch (error) {
        console.error('Erro ao atualizar status das portas:', error);
        doorTable.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-3 text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar portas.
                    <a href="#" onclick="updateDoorStatus(); return false;">Tentar novamente</a>
                </td>
            </tr>
        `;
    }
}

// Configurar botões de controle de portas
function setupDoorControlButtons() {
    document.querySelectorAll('.door-control-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const doorId = this.getAttribute('data-door-id');
            const action = this.getAttribute('data-action');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!doorId || !action || !user) return;
            
            try {
                // Desabilitar botão durante a operação
                this.disabled = true;
                const originalHtml = this.innerHTML;
                this.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                
                let response;
                if (action === 'lock') {
                    response = await lockDoor(doorId, user.id);
                } else {
                    response = await unlockDoor(doorId, user.id);
                }
                
                if (response && response.success) {
                    // Atualizar a interface
                    await updateDoorStatus();
                } else {
                    throw new Error(`Falha ao ${action === 'lock' ? 'trancar' : 'destrancar'} a porta`);
                }
            } catch (error) {
                console.error(`Erro ao ${action} porta:`, error);
                showError(`Erro ao ${action === 'lock' ? 'trancar' : 'destrancar'} a porta. Tente novamente.`);
                
                // Restaurar botão
                this.disabled = false;
                this.innerHTML = originalHtml;
            }
        });
    });
}

// Atualizar status do sistema
async function updateSystemStatus() {
    try {
        const response = await getSystemStatus();
        
        if (response && response.success) {
            updateDevicesStatus(response.system_status.device_list);
            updateSystemCapacity(response.system_status);
        } else {
            throw new Error('Falha ao carregar status do sistema');
        }
    } catch (error) {
        console.error('Erro ao atualizar status do sistema:', error);
        document.getElementById('devices-status').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar status dos dispositivos.
                <a href="#" onclick="updateSystemStatus(); return false;">Tentar novamente</a>
            </div>
        `;
    }
}

// Atualizar status dos dispositivos
function updateDevicesStatus(devices) {
    const container = document.getElementById('devices-status');
    
    if (!container || !devices) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Listar dispositivos
    devices.forEach(device => {
        const isOnline = device.status === 'online';
        const statusClass = isOnline ? 'text-success' : 'text-danger';
        const statusText = isOnline ? 'Online' : 'Offline';
        
        const html = `
            <div class="mb-4">
                <div class="d-flex justify-content-between mb-1">
                    <span class="text-sm font-weight-bold">${device.name}</span>
                    <span class="${statusClass} text-sm">${statusText}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-${isOnline ? 'success' : 'danger'}" role="progressbar" 
                        style="width: ${isOnline ? '100' : '20'}%" 
                        aria-valuenow="${isOnline ? '100' : '20'}" 
                        aria-valuemin="0" 
                        aria-valuemax="100"></div>
                </div>
            </div>
        `;
        
        container.innerHTML += html;
    });
}

// Atualizar capacidade do sistema
function updateSystemCapacity(data) {
    const container = document.getElementById('system-capacity');
    
    if (!container || !data) return;
    
    // Limpar container
    container.innerHTML = '';
    
    // Armazenamento
    container.innerHTML += `
        <div class="mb-4">
            <div class="d-flex justify-content-between mb-1">
                <span class="text-sm font-weight-bold">Armazenamento</span>
                <span class="text-sm">${data.storage_usage}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-info" role="progressbar" 
                    style="width: ${data.storage_usage}%" 
                    aria-valuenow="${data.storage_usage}" 
                    aria-valuemin="0" 
                    aria-valuemax="100"></div>
            </div>
        </div>
    `;
    
    // Memória
    container.innerHTML += `
        <div class="mb-4">
            <div class="d-flex justify-content-between mb-1">
                <span class="text-sm font-weight-bold">Uso de Memória</span>
                <span class="text-sm">${data.memory_usage}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-${data.memory_usage > 80 ? 'danger' : data.memory_usage > 60 ? 'warning' : 'success'}" 
                    role="progressbar" 
                    style="width: ${data.memory_usage}%" 
                    aria-valuenow="${data.memory_usage}" 
                    aria-valuemin="0" 
                    aria-valuemax="100"></div>
            </div>
        </div>
    `;
    
    // CPU
    container.innerHTML += `
        <div class="mb-4">
            <div class="d-flex justify-content-between mb-1">
                <span class="text-sm font-weight-bold">CPU</span>
                <span class="text-sm">${data.cpu_usage}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-${data.cpu_usage > 80 ? 'danger' : data.cpu_usage > 60 ? 'warning' : 'success'}" 
                    role="progressbar" 
                    style="width: ${data.cpu_usage}%" 
                    aria-valuenow="${data.cpu_usage}" 
                    aria-valuemin="0" 
                    aria-valuemax="100"></div>
            </div>
        </div>
    `;
}

// Atualizar alertas
async function updateAlerts() {
    const alertsTable = document.getElementById('alerts-table').querySelector('tbody');
    
    try {
        const response = await getAlerts();
        
        if (response && response.success) {
            // Limpar a tabela
            alertsTable.innerHTML = '';
            
            if (response.alerts && response.alerts.length > 0) {
                // Adicionar cada alerta
                response.alerts.slice(0, 5).forEach(alert => {
                    const severityClass = getSeverityClass(alert.severity);
                    const severityText = getSeverityText(alert.severity);
                    
                    const alertTime = new Date(alert.timestamp).toLocaleString();
                    
                    const rowHtml = `
                        <tr>
                            <td><span class="badge ${severityClass}">${severityText}</span></td>
                            <td>${alert.message}</td>
                            <td>${alert.device_name || 'Sistema'}</td>
                            <td>${alertTime}</td>
                            <td>${alert.resolved ? 'Resolvido' : 'Não resolvido'}</td>
                            <td>
                                <button class="btn btn-sm btn-light"><i class="fas fa-eye"></i></button>
                                ${!alert.resolved ? `<button class="btn btn-sm btn-danger"><i class="fas fa-wrench"></i></button>` : ''}
                            </td>
                        </tr>
                    `;
                    
                    alertsTable.innerHTML += rowHtml;
                });
            } else {
                alertsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-3 text-muted">
                            <i class="fas fa-info-circle me-1"></i> Nenhum alerta recente
                        </td>
                    </tr>
                `;
            }
        } else {
            throw new Error('Falha ao carregar alertas');
        }
    } catch (error) {
        console.error('Erro ao atualizar alertas:', error);
        alertsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-3 text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar alertas.
                    <a href="#" onclick="updateAlerts(); return false;">Tentar novamente</a>
                </td>
            </tr>
        `;
    }
}

// Criar gráfico de atividade
function createActivityChart(data) {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;
    
    // Limpar gráfico anterior se existir
    if (window.activityChart) {
        window.activityChart.destroy();
    }
    
    // Processar dados para o gráfico
    const labels = data.map(item => item.day || item.date);
    const granted = data.map(item => item.granted || 0);
    const denied = data.map(item => item.denied || 0);
    
    window.activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Acessos Permitidos',
                    data: granted,
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Acessos Negados',
                    data: denied,
                    borderColor: '#e74a3b',
                    backgroundColor: 'rgba(231, 74, 59, 0.1)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Atualizar legenda
    updateChartLegend('chart-legend', [
        { label: 'Acessos Permitidos', color: '#1cc88a' },
        { label: 'Acessos Negados', color: '#e74a3b' }
    ]);
}

// Criar gráfico de distribuição
function createDistributionChart(data) {
    const ctx = document.getElementById('distribution-chart');
    if (!ctx) return;
    
    // Limpar gráfico anterior se existir
    if (window.distributionChart) {
        window.distributionChart.destroy();
    }
    
    // Processar dados para o gráfico
    let labels = [];
    let values = [];
    let colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
    
    // Se data.byDoor existir, usar isso
    if (data.byDoor) {
        // Ordenar por contagem (maior primeiro)
        const doorData = Object.values(data.byDoor)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); // Pegar os 5 maiores
        
        labels = doorData.map(door => door.name);
        values = doorData.map(door => door.total);
    } 
    // Caso contrário, verificar se temos o formato antigo
    else if (Array.isArray(data)) {
        labels = data.map(item => item.name);
        values = data.map(item => item.count);
    }
    
    window.distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                hoverBackgroundColor: colors.map(color => adjustColor(color, -20)),
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }],
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Atualizar legenda
    const legendItems = labels.map((label, i) => ({
        label: `${label} (${Math.round((values[i] / values.reduce((a, b) => a + b, 0)) * 100)}%)`,
        color: colors[i % colors.length]
    }));
    updateChartLegend('distribution-legend', legendItems);
}

// Atualizar legenda de gráfico
function updateChartLegend(id, items) {
    const legend = document.getElementById(id);
    if (!legend) return;
    
    legend.innerHTML = '';
    
    items.forEach(item => {
        legend.innerHTML += `
            <span class="me-2">
                <i class="fas fa-circle" style="color: ${item.color}"></i> ${item.label}
            </span>
        `;
    });
}

// Atualizar gráfico por período selecionado
async function updateChartByPeriod(period) {
    try {
        let days = 7;
        
        switch (period) {
            case '30':
            case 'month':
                days = 30;
                break;
            case 'week':
                days = 7;
                break;
            case 'today':
                days = 1;
                break;
            default:
                days = 7;
        }
        
        // Atualizar gráfico de atividade
        const activityData = await getDailyAccessCount(days);
        if (activityData && activityData.success) {
            createActivityChart(activityData.data);
        }
        
        // Atualizar gráfico de distribuição
        const distributionData = await getAccessDistribution(days);
        if (distributionData && distributionData.success) {
            createDistributionChart(distributionData.distribution);
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
        showError('Erro ao atualizar gráficos. Tente novamente.');
    }
}

// Utilitários

// Formatar tempo relativo (ex: "2 minutos atrás")
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} anos atrás`;
    if (interval === 1) return 'há 1 ano';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} meses atrás`;
    if (interval === 1) return 'há 1 mês';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} dias atrás`;
    if (interval === 1) return 'ontem';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} horas atrás`;
    if (interval === 1) return 'há 1 hora';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutos atrás`;
    if (interval === 1) return 'há 1 minuto';
    
    return 'agora mesmo';
}

// Obter classe CSS baseada na severidade
function getSeverityClass(severity) {
    switch (severity) {
        case 'critical': return 'bg-danger';
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning';
        case 'low': return 'bg-info';
        default: return 'bg-info';
    }
}

// Obter texto baseado na severidade
function getSeverityText(severity) {
    switch (severity) {
        case 'critical': return 'Crítico';
        case 'high': return 'Alto';
        case 'medium': return 'Médio';
        case 'low': return 'Baixo';
        default: return 'Informação';
    }
}

// Ajustar cor (escurecer/clarear)
function adjustColor(color, amount) {
    // Remover o hash e converter para RGB
    let hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Ajustar valores
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Converter de volta para hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Atualizar elemento pelo ID
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = value;
    }
}

// Mostrar/esconder indicador de carregamento
function showLoadingIndicator(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Mostrar mensagem de erro
function showError(message) {
    // Implementação simplificada - poderia ser um toast ou modal
    alert(message);
}