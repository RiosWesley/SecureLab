/**
 * gemini-insights.js - Componente de insights baseados em IA para o dashboard
 * Gera e exibe insights relevantes sobre o sistema
 */

// Verificar se o serviço Gemini está disponível
if (!window.geminiService) {
    console.error('gemini-service.js deve ser carregado antes de gemini-insights.js');
}

/**
 * Classe para gerenciar insights do Gemini na dashboard
 */
class GeminiInsights {
    constructor() {
        this.container = null;
        this.insightsList = null;
        this.lastUpdated = null;
        this.refreshInterval = null;
        this.loading = false;
        this.initialized = false;
    }

    /**
     * Inicializa o componente de insights
     * @param {string} containerId - ID do elemento onde o componente será renderizado
     * @param {Object} options - Opções de configuração
     */
    init(containerId, options = {}) {
        if (this.initialized) return;

        // Configurações padrão
        this.options = {
            autoRefresh: true,
            refreshInterval: 30 * 60 * 1000, // 30 minutos
            maxInsights: 5,
            ...options
        };

        // Obter o container
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container com ID "${containerId}" não encontrado`);
            return;
        }

        // Renderizar estrutura inicial
        this.render();

        // Carregar insights iniciais
        this.refreshInsights();

        // Configurar atualização automática
        if (this.options.autoRefresh) {
            this.startAutoRefresh();
        }

        this.initialized = true;
    }

    /**
     * Renderiza a estrutura inicial do componente
     */
    render() {
        this.container.innerHTML = `
            <div class="gemini-insights-panel">
                <div class="gemini-insights-header">
                    <h3><i class="fas fa-lightbulb"></i> Insights do Gemini</h3>
                    <div class="gemini-insights-actions">
                        <button class="gemini-insights-refresh" title="Atualizar insights">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="gemini-insights-body">
                    <div class="gemini-insights-summary">
                        <div class="gemini-insights-loading">
                            <div class="gemini-insights-spinner"></div>
                            <p>Gerando insights...</p>
                        </div>
                    </div>
                    <div class="gemini-insights-list"></div>
                </div>
                <div class="gemini-insights-footer">
                    <span class="gemini-insights-updated"></span>
                    <a href="#" class="gemini-insights-more">Pergunte ao assistente <i class="fas fa-chevron-right"></i></a>
                </div>
            </div>
        `;

        // Guardar referências aos elementos
        this.insightsList = this.container.querySelector('.gemini-insights-list');
        this.insightsSummary = this.container.querySelector('.gemini-insights-summary');
        this.lastUpdated = this.container.querySelector('.gemini-insights-updated');
        this.loadingElement = this.container.querySelector('.gemini-insights-loading');

        // Configurar event listeners
        const refreshBtn = this.container.querySelector('.gemini-insights-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshInsights();
            });
        }

        // Event listener para o link "Pergunte ao assistente"
        const moreLink = this.container.querySelector('.gemini-insights-more');
        if (moreLink) {
            moreLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.geminiAssistant) {
                    window.geminiAssistant.toggle(true);
                }
            });
        }
    }

    /**
     * Atualiza os insights
     */
    async refreshInsights() {
        if (this.loading) return;

        try {
            this.loading = true;
            this.showLoading(true);

            // Coletar dados para análise
            const systemData = await this.collectSystemData();

            // Gerar insights via Gemini
            const insights = await window.geminiService.generateInsights(systemData);

            // Exibir insights
            this.displayInsights(insights);

            // Atualizar timestamp
            this.updateTimestamp();
        } catch (error) {
            console.error('Erro ao atualizar insights:', error);
            this.displayError('Não foi possível gerar insights. Tente novamente mais tarde.');
        } finally {
            this.loading = false;
            this.showLoading(false);
        }
    }

    /**
     * Coleta dados do sistema para análise
     * @returns {Promise<Object>} Dados do sistema
     */
    async collectSystemData() {
        try {
            // Coletar estatísticas diversas do Firebase
            const [usersSnapshot, doorsSnapshot, devicesSnapshot, logsSnapshot] = await Promise.all([
                firebase.database().ref('users').once('value'),
                firebase.database().ref('doors').once('value'),
                firebase.database().ref('devices').once('value'),
                firebase.database().ref('access_logs').limitToLast(100).once('value')
            ]);

            const systemData = {
                timestamp: new Date().toISOString(),
                stats: {}
            };

            // Processamento de usuários
            if (usersSnapshot.exists()) {
                const users = usersSnapshot.val();
                systemData.stats.users = {
                    total: Object.keys(users).length,
                    active: Object.values(users).filter(user => user.status === 'active').length,
                    inactive: Object.values(users).filter(user => user.status === 'inactive').length
                };
            } else {
                systemData.stats.users = { total: 0, active: 0, inactive: 0 };
            }

            // Processamento de portas
            if (doorsSnapshot.exists()) {
                const doors = doorsSnapshot.val();
                systemData.stats.doors = {
                    total: Object.keys(doors).length,
                    locked: Object.values(doors).filter(door => door.status === 'locked').length,
                    unlocked: Object.values(doors).filter(door => door.status === 'unlocked').length
                };
            } else {
                systemData.stats.doors = { total: 0, locked: 0, unlocked: 0 };
            }

            // Processamento de dispositivos
            if (devicesSnapshot.exists()) {
                const devices = devicesSnapshot.val();
                systemData.stats.devices = {
                    total: Object.keys(devices).length,
                    online: Object.values(devices).filter(device => device.status === 'online').length,
                    offline: Object.values(devices).filter(device => device.status === 'offline').length,
                    warning: Object.values(devices).filter(device => device.status === 'warning').length,
                    lowBattery: Object.values(devices).filter(device =>
                        device.batteryLevel !== null && device.batteryLevel < 20
                    ).length,
                    needsUpdate: Object.values(devices).filter(device => device.needsUpdate).length
                };
            } else {
                systemData.stats.devices = {
                    total: 0, online: 0, offline: 0, warning: 0, lowBattery: 0, needsUpdate: 0
                };
            }

            // Processamento de logs de acesso
            if (logsSnapshot.exists()) {
                const logs = logsSnapshot.val();
                const logsArray = Object.values(logs);

                // Agrupar logs por tipo de ação
                const logsByAction = {
                    access_granted: logsArray.filter(log => log.action === 'access_granted').length,
                    access_denied: logsArray.filter(log => log.action === 'access_denied').length,
                    door_locked: logsArray.filter(log => log.action === 'door_locked').length,
                    door_unlocked: logsArray.filter(log => log.action === 'door_unlocked').length
                };

                // Calcular taxa de negação de acesso
                const totalAccessAttempts = logsByAction.access_granted + logsByAction.access_denied;
                const denialRate = totalAccessAttempts > 0
                    ? (logsByAction.access_denied / totalAccessAttempts) * 100
                    : 0;

                // Identificar períodos de pico
                const accessByHour = {};
                logsArray.forEach(log => {
                    if (log.timestamp) {
                        const hour = new Date(log.timestamp).getHours();
                        accessByHour[hour] = (accessByHour[hour] || 0) + 1;
                    }
                });

                // Encontrar hora com mais atividade
                let peakHour = 0;
                let peakCount = 0;
                Object.entries(accessByHour).forEach(([hour, count]) => {
                    if (count > peakCount) {
                        peakHour = parseInt(hour);
                        peakCount = count;
                    }
                });

                systemData.stats.access = {
                    total: logsArray.length,
                    byAction: logsByAction,
                    denialRate: denialRate.toFixed(2),
                    peakHour,
                    peakCount
                };

                // Adicionar logs mais recentes para análise detalhada
                systemData.recentLogs = logsArray
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 20);
            } else {
                systemData.stats.access = {
                    total: 0,
                    byAction: { access_granted: 0, access_denied: 0, door_locked: 0, door_unlocked: 0 },
                    denialRate: 0,
                    peakHour: null,
                    peakCount: 0
                };
                systemData.recentLogs = [];
            }

            return systemData;
        } catch (error) {
            console.error('Erro ao coletar dados do sistema:', error);
            throw new Error('Falha ao coletar dados para análise');
        }
    }

    /**
     * Exibe os insights gerados
     * @param {Object} insights - Insights gerados pelo Gemini
     */
    displayInsights(insights) {
        if (!insights || !insights.summary) {
            this.displayError('Formato de insights inválido.');
            return;
        }

        // Exibir resumo
        this.insightsSummary.innerHTML = `
            <div class="gemini-insights-summary-content">
                <div class="gemini-insights-summary-icon">
                    <i class="fas fa-brain"></i>
                </div>
                <p>${insights.summary}</p>
            </div>
        `;

        // Limpar lista anterior
        this.insightsList.innerHTML = '';

        // Exibir insights individuais (limitados ao máximo configurado)
        const insightsToShow = insights.insights?.slice(0, this.options.maxInsights) || [];

        if (insightsToShow.length === 0) {
            this.insightsList.innerHTML = '<div class="gemini-no-insights">Nenhum insight adicional disponível.</div>';
            return;
        }

        // Adicionar cada insight à lista
        insightsToShow.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = `gemini-insight gemini-insight-${insight.type} gemini-priority-${insight.priority}`;

            // Selecionar ícone baseado no tipo
            let iconClass = 'fas fa-info-circle';
            if (insight.type === 'anomaly') {
                iconClass = 'fas fa-exclamation-triangle';
            } else if (insight.type === 'pattern') {
                iconClass = 'fas fa-chart-line';
            } else if (insight.type === 'recommendation') {
                iconClass = 'fas fa-lightbulb';
            }

            insightElement.innerHTML = `
                <div class="gemini-insight-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="gemini-insight-content">
                    <h4 class="gemini-insight-title">${insight.title}</h4>
                    <p class="gemini-insight-description">${insight.description}</p>
                    ${insight.relatedItems && insight.relatedItems.length > 0 ? `
                        <div class="gemini-insight-related">
                            ${insight.relatedItems.map(item => `<span class="gemini-insight-tag">${item}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            this.insightsList.appendChild(insightElement);
        });
    }

    /**
     * Exibe uma mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    displayError(message) {
        this.insightsSummary.innerHTML = `
            <div class="gemini-insights-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
        this.insightsList.innerHTML = '';
    }

    /**
     * Mostra ou oculta o indicador de carregamento
     * @param {boolean} show - Indica se deve mostrar ou ocultar
     */
    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Atualiza o timestamp da última atualização
     */
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (this.lastUpdated) {
            this.lastUpdated.textContent = `Atualizado às ${timeString}`;
        }
    }

    /**
     * Inicia a atualização automática
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.refreshInsights();
        }, this.options.refreshInterval);
    }

    /**
     * Para a atualização automática
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Criar instância global
const geminiInsights = new GeminiInsights();

// Para uso em um ambiente modular (como com webpack, rollup, etc.)
export default geminiInsights;

// Para uso com scripts regulares
window.geminiInsights = geminiInsights;