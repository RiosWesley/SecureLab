/**
 * logs.js - Funcionalidades para a página de logs do sistema SecureLab
 */

// Variáveis globais
let allLogs = [];
let filteredLogs = [];
const PAGE_SIZE = 10;
let currentPage = 1;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Configuração inicial
    initDateFilters();
    setupEventListeners();
    
    // Carregar os logs iniciais
    loadLogs();
});

/**
 * Configura os filtros de data e inicializa valores padrão
 */
function initDateFilters() {
    // Configurar as datas iniciais para filtros personalizados
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Formatar datas para o formato ISO (YYYY-MM-DD)
    const todayFormatted = formatDateForInput(today);
    const sevenDaysAgoFormatted = formatDateForInput(sevenDaysAgo);
    
    // Definir valores padrão para os campos de data
    document.getElementById('start-date').value = sevenDaysAgoFormatted;
    document.getElementById('end-date').value = todayFormatted;
    
    // Definir valores padrão para os campos de hora
    document.getElementById('start-time').value = '00:00';
    document.getElementById('end-time').value = '23:59';
}

/**
 * Configura os event listeners para a página
 */
function setupEventListeners() {
    // Listener para o seletor de período
    const dateRangeSelect = document.getElementById('date-range');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            const customDateContainer = document.getElementById('custom-date-container');
            if (this.value === 'custom') {
                customDateContainer.style.display = 'block';
            } else {
                customDateContainer.style.display = 'none';
                
                // Se não é personalizado, aplicar o filtro imediatamente
                if (document.getElementById('apply-filters-btn')) {
                    document.getElementById('apply-filters-btn').click();
                }
            }
        });
    }
    
    // Listener para botão de aplicar filtros
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            currentPage = 1; // Resetar para primeira página ao aplicar filtros
            applyFilters();
        });
    }
    
    // Listener para botão de resetar filtros
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters();
        });
    }
    
    // Listener para botão de atualizar logs
    const refreshLogsBtn = document.getElementById('refresh-logs');
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', function() {
            loadLogs();
        });
    }
    
    // Listeners para paginação
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderLogs();
                updatePagination();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
            if (currentPage < totalPages) {
                currentPage++;
                renderLogs();
                updatePagination();
            }
        });
    }
    
    // Listener para exportação
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportLogs('csv');
        });
    }
    
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportLogs('pdf');
        });
    }
}

/**
 * Carrega os logs do Firebase
 */
function loadLogs() {
    // Mostrar mensagem de carregamento
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        activityList.innerHTML = '<li class="no-data">Carregando registros de acesso...</li>';
    }
    
    // Referência para logs de acesso no Firebase
    const accessLogsRef = firebase.database().ref('access_logs');
    
    // Buscar todos os logs (limitando apenas os últimos 1000 para performance)
    accessLogsRef.limitToLast(1000).orderByChild('timestamp').once('value')
        .then(snapshot => {
            const logs = snapshot.val();
            
            if (logs) {
                // Converter para array
                allLogs = Object.entries(logs).map(([id, log]) => ({
                    id,
                    ...log
                }));
                
                // Ordenar por timestamp (mais recente primeiro)
                allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Aplicar filtros atuais
                applyFilters();
            } else {
                // Caso não existam logs
                allLogs = [];
                filteredLogs = [];
                
                if (activityList) {
                    activityList.innerHTML = '<li class="no-data">Nenhum registro de acesso encontrado</li>';
                }
                
                updateLogsCount();
                updatePagination();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar logs de atividade:', error);
            
            if (activityList) {
                activityList.innerHTML = '<li class="no-data">Erro ao carregar registros. Tente novamente.</li>';
            }
            
            showNotification('Erro ao carregar logs: ' + error.message, 'error');
        });
}

/**
 * Aplica os filtros selecionados aos logs
 */
function applyFilters() {
    // Obter todos os valores dos filtros
    const userName = document.getElementById('filter-user').value.trim().toLowerCase();
    const doorName = document.getElementById('filter-door').value.trim().toLowerCase();
    const action = document.getElementById('filter-action').value;
    const method = document.getElementById('filter-method').value;
    const dateRange = document.getElementById('date-range').value;
    
    // Determinar período de datas baseado na seleção
    let startDate, endDate;
    
    if (dateRange === 'custom') {
        // Usar datas e horas personalizadas
        const startDateStr = document.getElementById('start-date').value;
        const startTimeStr = document.getElementById('start-time').value || '00:00';
        const endDateStr = document.getElementById('end-date').value;
        const endTimeStr = document.getElementById('end-time').value || '23:59';
        
        startDate = new Date(`${startDateStr}T${startTimeStr}:00`);
        endDate = new Date(`${endDateStr}T${endTimeStr}:59`);
    } else {
        // Usar períodos pré-definidos
        const now = new Date();
        endDate = new Date(now); // Final é sempre agora (ou fim do dia atual)
        endDate.setHours(23, 59, 59, 999);
        
        switch (dateRange) {
            case 'today': 
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'yesterday':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last7days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last30days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                startDate = new Date(0); // Início dos tempos
        }
    }
    
    // Aplicar os filtros
    filteredLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        
        // Filtro de período
        if (logDate < startDate || logDate > endDate) {
            return false;
        }
        
        // Filtro de usuário
        if (userName && (!log.user_name || !log.user_name.toLowerCase().includes(userName))) {
            return false;
        }
        
        // Filtro de porta
        if (doorName && (!log.door_name || !log.door_name.toLowerCase().includes(doorName))) {
            return false;
        }
        
        // Filtro de ação
        if (action && log.action !== action) {
            return false;
        }
        
        // Filtro de método
        if (method && (!log.method || log.method !== method)) {
            return false;
        }
        
        return true;
    });
    
    // Resetar para a primeira página
    currentPage = 1;
    
    // Renderizar logs filtrados
    renderLogs();
    updateLogsCount();
    updatePagination();
}

/**
 * Renderiza os logs na interface
 */
function renderLogs() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Verificar se temos logs para mostrar
    if (filteredLogs.length === 0) {
        activityList.innerHTML = '<li class="no-data">Nenhum registro de acesso encontrado com os filtros aplicados</li>';
        return;
    }
    
    // Calcular índices para paginação
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, filteredLogs.length);
    
    // Obter logs da página atual
    const logsToShow = filteredLogs.slice(startIndex, endIndex);
    
    // Limpar lista
    activityList.innerHTML = '';
    
    // Adicionar cada log à lista
    logsToShow.forEach(log => {
        const li = document.createElement('li');
        const timestamp = new Date(log.timestamp);
        const timeFormatted = timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateFormatted = timestamp.toLocaleDateString('pt-BR');
        
        // Definir classe e ícone baseado na ação
        let actionClass = '';
        let actionIcon = '';
        let actionText = '';
        let actionBadgeClass = '';
        
        // Usando switch para lidar com todas as ações
        switch (log.action) {
            case 'access_granted':
                actionClass = 'success';
                actionIcon = 'fas fa-check-circle';
                actionText = 'Acesso Permitido';
                actionBadgeClass = 'access-granted';
                break;
            case 'access_denied':
                actionClass = 'danger';
                actionIcon = 'fas fa-times-circle';
                actionText = 'Acesso Negado';
                actionBadgeClass = 'access-denied';
                break;
            case 'door_locked':
                actionClass = 'warning';
                actionIcon = 'fas fa-lock';
                actionText = 'Porta Trancada';
                actionBadgeClass = 'door-locked';
                break;
            case 'door_unlocked':
                actionClass = 'info';
                actionIcon = 'fas fa-lock-open';
                actionText = 'Porta Destrancada';
                actionBadgeClass = 'door-unlocked';
                break;
            default:
                actionClass = 'secondary';
                actionIcon = 'fas fa-question-circle';
                actionText = 'Ação Desconhecida';
                actionBadgeClass = '';
        }
        
        // Ícone de método
        let methodIcon = '';
        switch (log.method) {
            case 'rfid':
                methodIcon = 'fas fa-id-card';
                break;
            case 'web':
                methodIcon = 'fas fa-globe';
                break;
            case 'app':
                methodIcon = 'fas fa-mobile-alt';
                break;
            default:
                methodIcon = 'fas fa-question';
        }
        
        // Construir o elemento LI
        li.innerHTML = `
          <div class="d-flex">
            <div class="activity-icon ${actionClass}">
              <i class="${actionIcon}"></i>
            </div>
            <div class="activity-info">
              <div class="activity-title">
                <span class="user-name">${log.user_name || 'Usuário desconhecido'}</span>
                <span class="action-badge ${actionBadgeClass}">${actionText}</span>
                ${log.method ? `<span class="activity-method"><i class="${methodIcon}"></i> ${log.method}</span>` : ''}
              </div>
              <div class="activity-details">
                <span><i class="fas fa-door-open"></i> ${log.door_name || 'Porta desconhecida'}</span>
                <span class="activity-timestamp"><i class="far fa-clock"></i> ${timeFormatted}, ${dateFormatted}</span>
              </div>
              ${log.reason ? `<div class="activity-reason">Motivo: ${log.reason}</div>` : ''}
            </div>
          </div>
        `;
        
        activityList.appendChild(li);
    });
}

/**
 * Atualiza os contadores de logs
 */
function updateLogsCount() {
    const logsCountElement = document.getElementById('logs-count');
    if (logsCountElement) {
        logsCountElement.textContent = filteredLogs.length;
    }
}

/**
 * Atualiza a paginação
 */
function updatePagination() {
    // Elementos de paginação
    const paginationStart = document.getElementById('pagination-start');
    const paginationEnd = document.getElementById('pagination-end');
    const paginationTotal = document.getElementById('pagination-total');
    const paginationNumbers = document.getElementById('pagination-numbers');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // Se não houver logs, zerar paginação
    if (filteredLogs.length === 0) {
        if (paginationStart) paginationStart.textContent = '0';
        if (paginationEnd) paginationEnd.textContent = '0';
        if (paginationTotal) paginationTotal.textContent = '0';
        if (paginationNumbers) paginationNumbers.innerHTML = '';
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        return;
    }
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(startIndex + PAGE_SIZE - 1, filteredLogs.length);
    
    // Atualizar texto de informação da paginação
    if (paginationStart) paginationStart.textContent = startIndex;
    if (paginationEnd) paginationEnd.textContent = endIndex;
    if (paginationTotal) paginationTotal.textContent = filteredLogs.length;
    
    // Atualizar estado dos botões de navegação
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    
    // Gerar números de página
    if (paginationNumbers) {
        paginationNumbers.innerHTML = '';
        
        // Determinar quais páginas mostrar
        const visiblePages = getVisiblePageNumbers(currentPage, totalPages);
        
        // Adicionar cada número de página
        visiblePages.forEach(pageNum => {
            if (pageNum === '...') {
                // Adicionar ellipsis
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                paginationNumbers.appendChild(ellipsis);
            } else {
                // Adicionar número de página clicável
                const pageNumber = document.createElement('button');
                pageNumber.className = 'page-number';
                if (pageNum === currentPage) {
                    pageNumber.classList.add('active');
                }
                pageNumber.textContent = pageNum;
                pageNumber.addEventListener('click', () => {
                    if (pageNum !== currentPage) {
                        currentPage = pageNum;
                        renderLogs();
                        updatePagination();
                    }
                });
                paginationNumbers.appendChild(pageNumber);
            }
        });
    }
}

/**
 * Determina quais números de página mostrar na paginação
 */
function getVisiblePageNumbers(currentPage, totalPages) {
    // Se tivermos 7 páginas ou menos, mostrar todas
    if (totalPages <= 7) {
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }
    
    // Caso contrário, mostrar um subconjunto com ellipsis
    const pages = [];
    
    // Sempre mostrar primeira página
    pages.push(1);
    
    // Se a página atual está perto do início
    if (currentPage <= 3) {
        pages.push(2, 3, 4, '...', totalPages);
    }
    // Se a página atual está perto do final
    else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    }
    // Se a página atual está no meio
    else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    
    return pages;
}

/**
 * Reseta todos os filtros para seus valores padrão
 */
function resetFilters() {
    // Resetar campos de filtro
    document.getElementById('filter-user').value = '';
    document.getElementById('filter-door').value = '';
    document.getElementById('filter-action').value = '';
    document.getElementById('filter-method').value = '';
    document.getElementById('date-range').value = 'last7days';
    
    // Esconder filtros personalizados
    document.getElementById('custom-date-container').style.display = 'none';
    
    // Reinicializar datas
    initDateFilters();
    
    // Aplicar filtros resetados
    applyFilters();
}

/**
 * Exporta os logs no formato especificado
 * @param {string} format - Formato de exportação ('csv' ou 'pdf')
 */
function exportLogs(format) {
    if (filteredLogs.length === 0) {
        showNotification('Não há registros para exportar', 'warning');
        return;
    }
    
    showNotification(`Exportando ${filteredLogs.length} registros para ${format.toUpperCase()}...`, 'info');
    
    if (format === 'csv') {
        exportCSV();
    } else if (format === 'pdf') {
        // Aqui você chamaria a função de exportação de PDF se tiver a biblioteca
        // Mas por enquanto, vamos mostrar uma notificação informando que não está disponível
        showNotification('Exportação PDF não implementada. Use CSV.', 'warning');
    } else {
        showNotification(`Formato de exportação "${format}" não suportado`, 'error');
    }
}

/**
 * Exporta os logs filtrados para um arquivo CSV
 */
function exportCSV() {
    try {
        // Definir cabeçalhos do CSV
        const headers = ["Data/Hora", "Usuário", "Porta", "Ação", "Método", "Motivo"];
        
        // Converter logs para linhas CSV
        const rows = filteredLogs.map(log => [
            new Date(log.timestamp).toLocaleString('pt-BR'),
            log.user_name || 'Desconhecido',
            log.door_name || 'Desconhecida',
            formatActionForExport(log.action),
            log.method || 'Desconhecido',
            log.reason || ''
        ]);
        
        // Juntar cabeçalhos e linhas
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        // Criar blob e URL para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Criar link de download e clicar nele
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().substring(0, 19).replace(/[T:]/g, '-');
        link.href = url;
        link.setAttribute('download', `logs-acesso-${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revogar URL para liberar memória
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showNotification(`${filteredLogs.length} registros exportados com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        showNotification('Erro ao exportar CSV: ' + error.message, 'error');
    }
}

/**
 * Formata a ação para exibição no arquivo exportado
 * @param {string} action - Código da ação
 * @return {string} Texto formatado da ação
 */
function formatActionForExport(action) {
    switch (action) {
        case 'access_granted': return 'Acesso Permitido';
        case 'access_denied': return 'Acesso Negado';
        case 'door_locked': return 'Porta Trancada';
        case 'door_unlocked': return 'Porta Destrancada';
        default: return action || 'Desconhecido';
    }
}

/**
 * Formata uma data para o formato de input date (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Exibe uma notificação na interface
 */
function showNotification(message, type = 'info') {
    // Verificar se a função já existe no escopo global
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Implementação de fallback caso a função global não esteja disponível
    console.log(`Notificação (${type}): ${message}`);
    
    // Verificar se já existe um container de notificações
    let container = document.getElementById('notificationContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Criar a notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Definir ícone com base no tipo
    let icon = '';
    switch (type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-times-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    // Montar a estrutura da notificação
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}