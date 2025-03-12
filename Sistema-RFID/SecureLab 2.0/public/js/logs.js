loadRecentActivity();

function loadRecentActivity(filters = {}) {
    const logLimit = 50;
    let query = database.ref('access_logs')
        .orderByChild('timestamp')
        .limitToLast(logLimit);

    query.once('value')
        .then(snapshot => {
            let logs = snapshot.val();

            // Apply filters if they exist
            if (filters.userName) {
                if (filters.userName) {
                    logs = Object.fromEntries(Object.entries(logs).filter(([key, log]) => {
                        return log.user_name && filters.userName && log.user_name.toLowerCase().includes(filters.userName.toLowerCase());
                    }));
                }
            }
            if (filters.doorName) {
                if (filters.doorName) {
                    logs = Object.fromEntries(Object.entries(logs).filter(([key, log]) => {
                        return log.door_name && filters.doorName && log.door_name.toLowerCase().includes(filters.doorName.toLowerCase());
                    }));
                }
            }
            if (filters.action && filters.action !== '') {
                if (filters.action) { // Modified this line
                    logs = Object.fromEntries(Object.entries(logs).filter(([key, log]) => {
                        return log.action && filters.action && log.action === filters.action;
                    }));
                }
            }


            const activityList = document.getElementById('activity-list');
            if (!activityList) {
                console.warn('Activity list element not found');
                return;
            }

            // Limpar lista atual
            activityList.innerHTML = '';

            if (logs) {
                // Converter para array e ordenar por timestamp (mais recente primeiro)
                const logsArray = Object.values(logs);
                logsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                // Atualizar contadores de acessos apenas se os elementos existirem
                const todayAccessCount = document.getElementById('today-access-count');
                const todayDeniedCount = document.getElementById('today-denied-count');

                if (todayAccessCount || todayDeniedCount) {
                    const today = new Date().toISOString().split('T')[0];
                    const todayLogs = logsArray.filter(log => log.timestamp.startsWith(today));
                    const todayAccess = todayLogs.length;
                    const todayDenied = todayLogs.filter(log => log.action === 'access_denied' || log.action === 'door_locked').length;

                    if (todayAccessCount) todayAccessCount.textContent = todayAccess;
                    if (todayDeniedCount) todayDeniedCount.textContent = `${todayDenied} acessos negados`;
                }

                // Adicionar atividades à lista
                logsArray.forEach(log => {
                    const li = document.createElement('li');
                    const timestamp = new Date(log.timestamp);
                    const timeFormatted = timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const dateFormatted = timestamp.toLocaleDateString('pt-BR');

                    let actionClass = '';
                    let actionIcon = '';
                    let actionText = '';

                    // Usando switch para lidar com todas as ações
                    switch (log.action) {
                        case 'access_granted':
                            actionClass = 'success';
                            actionIcon = 'fas fa-check-circle';
                            actionText = 'acesso permitido';
                            break;
                        case 'access_denied':
                            actionClass = 'danger';
                            actionIcon = 'fas fa-times-circle';
                            actionText = 'acesso negado';
                            break;
                        case 'door_locked':
                            actionClass = 'warning';
                            actionIcon = 'fas fa-lock';
                            actionText = 'porta trancada';
                            break;
                        case 'door_unlocked':
                            actionClass = 'info';
                            actionIcon = 'fas fa-lock-open';
                            actionText = 'porta destrancada';
                            break;
                        default:
                            actionClass = 'secondary';
                            actionIcon = 'fas fa-question-circle';
                            actionText = 'ação desconhecida';
                    }

                    li.innerHTML = `
                      <div class="activity-icon ${actionClass}">
                        <i class="${actionIcon}"></i>
                      </div>
                      <div class="activity-info">
                        <div class="activity-title">
                          <span class="user-name">${log.user_name}</span>
                          <span class="${actionClass}-text">${actionText}</span>
                        </div>
                        <div class="activity-details">
                          ${log.door_name} - ${timeFormatted}, ${dateFormatted}
                        </div>
                        ${log.reason ? `<div class="activity-reason">Motivo: ${log.reason}</div>` : ''}
                      </div>
                    `;

                    activityList.appendChild(li);
                });
            } else {
                activityList.innerHTML = '<li class="no-data">Nenhuma atividade recente</li>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar logs de atividade:', error);
            const activityList = document.getElementById('activity-list');
            if (activityList) {
                activityList.innerHTML = '<li class="no-data">Erro ao carregar atividades</li>';
            }
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const filterUser = document.getElementById('filter-user');
    const filterDoor = document.getElementById('filter-door');
    const filterAction = document.getElementById('filter-action');
    const filters = {};

    function applyFilters() {
        filters.userName = filterUser.value;
        filters.doorName = filterDoor.value;
        filters.action = filterAction.value;
        loadRecentActivity(filters);
    }

    filterUser.addEventListener('input', applyFilters);
    filterDoor.addEventListener('input', applyFilters);
    filterAction.addEventListener('change', applyFilters);
});
