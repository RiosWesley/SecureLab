/**
 * simplified-gemini-insights.js - Streamlined insights component for SecureLab dashboard
 * Generates and displays actionable insights about system status and user activities
 */

class SimplifiedInsights {
    constructor() {
        this.container = null;
        this.options = {
            refreshInterval: 15 * 60 * 1000, // 15 minutes
            maxInsights: 4
        };
        this.refreshTimer = null;
        this.isLoading = false;
    }

    /**
     * Initialize the insights component
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Optional configuration
     */
    init(containerId, options = {}) {
        // Get container element
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // Merge options
        this.options = {...this.options, ...options};

        // Render initial UI
        this.render();

        // Load initial insights
        this.refreshInsights();

        // Set up auto-refresh if enabled
        if (this.options.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    /**
     * Render the insights component UI
     */
    render() {
        this.container.innerHTML = `
      <div class="gemini-insights-panel">
        <div class="gemini-insights-header">
          <h3><i class="fas fa-lightbulb"></i> Insights</h3>
          <div class="gemini-insights-actions">
            <button class="gemini-insights-refresh" title="Refresh insights">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <div class="gemini-insights-body">
          <div class="gemini-insights-summary">
            <div class="gemini-insights-loading">
              <div class="gemini-insights-spinner"></div>
              <p>Generating insights...</p>
            </div>
            <div class="gemini-insights-summary-content" style="display: none">
              <div class="gemini-insights-summary-icon">
                <i class="fas fa-brain"></i>
              </div>
              <p>Analyzing system data...</p>
            </div>
          </div>
          <div class="gemini-insights-list"></div>
        </div>
        <div class="gemini-insights-footer">
          <span class="gemini-insights-updated"></span>
          <a href="#" class="gemini-insights-more">Ask assistant <i class="fas fa-chevron-right"></i></a>
        </div>
      </div>
    `;

        // Store references to DOM elements
        this.loadingElement = this.container.querySelector('.gemini-insights-loading');
        this.summaryElement = this.container.querySelector('.gemini-insights-summary-content');
        this.summaryTextElement = this.container.querySelector('.gemini-insights-summary-content p');
        this.insightsListElement = this.container.querySelector('.gemini-insights-list');
        this.timestampElement = this.container.querySelector('.gemini-insights-updated');

        // Set up event listeners
        this.container.querySelector('.gemini-insights-refresh').addEventListener('click', () => {
            this.refreshInsights();
        });

        this.container.querySelector('.gemini-insights-more').addEventListener('click', (e) => {
            e.preventDefault();
            if (window.geminiAssistant) {
                window.geminiAssistant.toggle(true);
            }
        });
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            this.refreshInsights();
        }, this.options.refreshInterval);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Refresh insights data
     */
    async refreshInsights() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.showLoading(true);

            // Collect system data
            const systemData = await this.collectSystemData();

            // Generate insights
            const insights = await this.generateInsights(systemData);

            // Display insights
            this.displayInsights(insights);

            // Update timestamp
            this.updateTimestamp();
        } catch (error) {
            console.error('Error refreshing insights:', error);
            this.displayError('Unable to generate insights. Please try again later.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * Collect system data for analysis
     * @returns {Promise<Object>} System data
     */
    async collectSystemData() {
        console.log('Iniciando coleta de dados do sistema...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        try {
            const [usersSnapshot, doorsSnapshot, devicesSnapshot, logsSnapshot] = await Promise.all([
                firebase.database().ref('users').once('value'),
                firebase.database().ref('doors').once('value'),
                firebase.database().ref('devices').once('value'),
                firebase.database().ref('access_logs')
                    .orderByChild('timestamp')
                    .startAt(thirtyDaysAgoISO)
                    .limitToLast(100)
                    .once('value') // Sem limite, coletamos todos os logs
            ]);

            const systemData = {
                users: usersSnapshot.val(),
                doors: doorsSnapshot.val(),
                devices: devicesSnapshot.val(),
                logs: logsSnapshot.val()
            };

            console.log('Dados coletados com sucesso:', systemData);
            return systemData;
        } catch (error) {
            console.error('Erro ao coletar dados do sistema:', error);
            throw error;
        }
    }
    /**
     * Generate insights using data analysis
     * @param {Object} systemData - Collected system data
     * @returns {Promise<Object>} Generated insights
     */
    async generateInsights(systemData) {
        // If Gemini API is available, use it
        if (window.geminiService) {
            try {
                return await this.generateInsightsWithGemini(systemData);
            } catch (error) {
                console.warn('Error using Gemini for insights, falling back to local analysis:', error);
                return this.generateLocalInsights(systemData);
            }
        } else {
            // Fall back to local insight generation
            return this.generateLocalInsights(systemData);
        }
    }

    /**
     * Generate insights using Gemini API
     * @param {Object} systemData - Collected system data
     * @returns {Promise<Object>} Insights from Gemini
     */
    // Modifique esta função no arquivo simplified-gemini-insights.js
    async generateInsightsWithGemini(systemData) {
        // Modificar o prompt para ser mais específico sobre o formato JSON
        const prompt = `Analyze the following SecureLab access control system data and provide insights:
${JSON.stringify(systemData, null, 2)}

IMPORTANT: You MUST respond with a valid JSON object in the following format and NOTHING ELSE:
{
  "summary": "Brief summary of the system status",
  "insights": [
    {
      "type": "anomaly|pattern|recommendation",
      "title": "Short title of the insight",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "relatedItems": ["doors", "users", "access", etc]
    }
  ]
}`;

        try {
            // Use o parâmetro isConversation: false para indicar que queremos JSON
            const response = await window.geminiService.sendMessage(prompt, {}, {isConversation: false});
            console.log('Resposta recebida da API Gemini:', response);

            // Tentar extrair JSON da resposta
            try {
                // Primeiro, tentar analisar a resposta inteira como JSON
                return JSON.parse(response);
            } catch (parseError) {
                // Se falhar, tentar extrair JSON de um bloco de código ou da resposta
                const jsonMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) ||
                    response.match(/```([\s\S]*?)```/) ||
                    response.match(/(\{[\s\S]*\})/);

                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                } else if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }

                // Se ainda falhar, criar um objeto de insights básico
                console.warn('Não foi possível extrair JSON válido da resposta:', response);
                return {
                    summary: "Análise baseada em resposta não estruturada",
                    insights: [{
                        type: "recommendation",
                        title: "Limitações na análise de insights",
                        description: "O sistema não conseguiu estruturar a análise em formato JSON. Recomenda-se revisar manualmente os logs de acesso.",
                        priority: "medium",
                        relatedItems: ["system"]
                    }]
                };
            }
        } catch (error) {
            console.error('Erro ao gerar insights com Gemini:', error);
            throw error;
        }
    }
    /**
     * Generate insights locally without API
     * @param {Object} systemData - Collected system data
     * @returns {Object} Generated insights
     */
    // Modifique esta função no arquivo simplified-gemini-insights.js
    generateLocalInsights(systemData) {
        const insights = {
            summary: "Análise do Sistema SecureLab",
            insights: []
        };

        try {
            // Verificar se temos dados para analisar sem depender de systemData.stats
            if (!systemData || !systemData.users || !systemData.doors || !systemData.logs) {
                throw new Error('Insufficient data for analysis');
            }

            // Computar estatísticas a partir dos dados brutos
            const stats = this.computeSystemStats(systemData);

            // Atualizar o resumo com base nas estatísticas calculadas
            insights.summary = `O sistema SecureLab tem ${Object.keys(systemData.users || {}).length} usuários e 
                           ${Object.keys(systemData.doors || {}).length} portas registradas com 
                           ${Object.keys(systemData.logs || {}).length} logs de acesso.`;

            // Analisar portas destrancadas
            const unlockedDoors = Object.values(systemData.doors || {}).filter(door =>
                door.status === 'unlocked'
            );

            if (unlockedDoors.length > 0) {
                insights.insights.push({
                    type: "recommendation",
                    title: `${unlockedDoors.length} Portas Destrancadas Detectadas`,
                    description: `Existem ${unlockedDoors.length} portas atualmente destrancadas. Verifique se isso é intencional e considere trancá-las ao final do expediente.`,
                    priority: unlockedDoors.length > 3 ? "high" : "medium",
                    relatedItems: ["doors", "security"]
                });
            }

            // Analisar logs de acesso
            if (systemData.logs && Object.keys(systemData.logs).length > 0) {
                const logsArray = Object.values(systemData.logs);

                // Contar tipos de ações
                const accessGranted = logsArray.filter(log => log.action === 'access_granted').length;
                const accessDenied = logsArray.filter(log => log.action === 'access_denied').length;

                if (accessGranted + accessDenied > 0) {
                    const denialRate = Math.round((accessDenied / (accessGranted + accessDenied)) * 100);

                    if (denialRate > 15) {
                        insights.insights.push({
                            type: "anomaly",
                            title: "Taxa elevada de acessos negados",
                            description: `A taxa de negação de acesso está em ${denialRate}%, acima do ideal. Verifique se as permissões estão configuradas corretamente.`,
                            priority: "high",
                            relatedItems: ["access", "security", "users"]
                        });
                    }
                }

                // Analisar atividade por usuário
                const userActivity = {};
                logsArray.forEach(log => {
                    if (log.user_name) {
                        userActivity[log.user_name] = (userActivity[log.user_name] || 0) + 1;
                    }
                });

                // Encontrar usuários mais ativos
                const topUsers = Object.entries(userActivity)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                if (topUsers.length > 0) {
                    insights.insights.push({
                        type: "pattern",
                        title: "Usuários com maior atividade",
                        description: `Os usuários mais ativos são: ${topUsers.map(u => `${u[0]} (${u[1]} ações)`).join(', ')}.`,
                        priority: "low",
                        relatedItems: ["users", "access"]
                    });
                }
            }

            // Verificar dispositivos offline
            const offlineDevices = Object.values(systemData.devices || {}).filter(device =>
                device.status === 'offline'
            );

            if (offlineDevices.length > 0) {
                insights.insights.push({
                    type: "anomaly",
                    title: `${offlineDevices.length} Dispositivos Offline`,
                    description: `Existem ${offlineDevices.length} dispositivos offline. Verifique a conectividade e fonte de energia desses dispositivos.`,
                    priority: "high",
                    relatedItems: ["devices", "maintenance"]
                });
            }

            // Se não houver insights, adicionar um insight padrão
            if (insights.insights.length === 0) {
                insights.insights.push({
                    type: "recommendation",
                    title: "Sistema operando normalmente",
                    description: "Nenhum problema significativo detectado. Continue monitorando o sistema.",
                    priority: "low",
                    relatedItems: ["maintenance"]
                });
            }

            return insights;
        } catch (error) {
            console.error('Error generating local insights:', error);
            throw error;
        }
    }

// Adicione esta nova função auxiliar para calcular estatísticas
    computeSystemStats(systemData) {
        const stats = {
            users: {
                total: Object.keys(systemData.users || {}).length,
                active: Object.values(systemData.users || {}).filter(u => u.status === 'active').length
            },
            doors: {
                total: Object.keys(systemData.doors || {}).length,
                locked: Object.values(systemData.doors || {}).filter(d => d.status === 'locked').length,
                unlocked: Object.values(systemData.doors || {}).filter(d => d.status === 'unlocked').length
            },
            devices: {
                total: Object.keys(systemData.devices || {}).length,
                online: Object.values(systemData.devices || {}).filter(d => d.status === 'online').length,
                offline: Object.values(systemData.devices || {}).filter(d => d.status === 'offline').length
            },
            logs: {
                total: Object.keys(systemData.logs || {}).length
            }
        };

        // Calcular estatísticas adicionais
        if (systemData.logs && Object.keys(systemData.logs).length > 0) {
            const logsArray = Object.values(systemData.logs);
            stats.access = {
                granted: logsArray.filter(log => log.action === 'access_granted').length,
                denied: logsArray.filter(log => log.action === 'access_denied').length,
                doorLocked: logsArray.filter(log => log.action === 'door_locked').length,
                doorUnlocked: logsArray.filter(log => log.action === 'door_unlocked').length
            };

            // Calcular taxa de negação
            if (stats.access.granted + stats.access.denied > 0) {
                stats.access.denialRate = (stats.access.denied / (stats.access.granted + stats.access.denied) * 100).toFixed(1);
            } else {
                stats.access.denialRate = "0.0";
            }
        }

        return stats;
    }

    /**
     * Display insights in the UI
     * @param {Object} insights - Generated insights
     */
    displayInsights(insights) {
        // Display summary
        this.summaryTextElement.textContent = insights.summary || "System analysis complete";
        this.summaryElement.style.display = "flex";

        // Clear previous insights
        this.insightsListElement.innerHTML = '';

        // Display insights
        const insightsToShow = insights.insights || [];

        if (insightsToShow.length === 0) {
            this.insightsListElement.innerHTML = '<div class="gemini-no-insights">No insights available at this time.</div>';
            return;
        }

        // Add each insight to the list (limit to maxInsights)
        insightsToShow.slice(0, this.options.maxInsights).forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = `gemini-insight gemini-insight-${insight.type || 'recommendation'} gemini-priority-${insight.priority || 'medium'}`;

            // Select icon based on type
            let iconClass = 'fas fa-info-circle';
            let iconContainer = '';

            if (insight.type === 'anomaly') {
                iconClass = 'fas fa-exclamation-triangle';
                iconContainer = `<div class="gemini-insight-icon" style="background-color: #fff6f6; color: #dc3545;">`;
                if (insight.priority === 'high') {
                    iconContainer = `<div class="gemini-insight-icon" style="background-color: #ff8a8a; color: #721c24;">`;
                }
            } else if (insight.type === 'pattern') {
                iconClass = 'fas fa-chart-line';
                iconContainer = `<div class="gemini-insight-icon" style="background-color: #f0f8ff; color: #0d6efd;">`;
            } else if (insight.type === 'recommendation') {
                iconClass = 'fas fa-lightbulb';
                iconContainer = `<div class="gemini-insight-icon" style="background-color: #f7f9ff; color: #4a6cf7;">`;
            }

            // Define title color based on priority
            let titleStyle = '';
            if (insight.priority === 'high') {
                titleStyle = 'style="color: #dc3545;"';
            } else if (insight.priority === 'medium') {
                titleStyle = 'style="color: #fd7e14;"';
            }

            insightElement.innerHTML = `
        ${iconContainer}
          <i class="${iconClass}"></i>
        </div>
        <div class="gemini-insight-content">
          <h4 class="gemini-insight-title" ${titleStyle}>${insight.title || 'Insight'}</h4>
          <p class="gemini-insight-description">${insight.description || ''}</p>
          ${insight.relatedItems && insight.relatedItems.length > 0 ? `
            <div class="gemini-insight-related">
              ${insight.relatedItems.map(item => `<span class="gemini-insight-tag">${item}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;

            this.insightsListElement.appendChild(insightElement);
        });
    }

    /**
     * Display error message
     * @param {string} message - Error message
     */
    displayError(message) {
        this.summaryTextElement.textContent = message || "Unable to generate insights";
        this.summaryElement.style.display = "flex";
        this.insightsListElement.innerHTML = '';
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} isLoading - Whether loading is in progress
     */
    showLoading(isLoading) {
        if (this.loadingElement) {
            this.loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
        if (this.summaryElement) {
            this.summaryElement.style.display = isLoading ? 'none' : 'flex';
        }
    }

    /**
     * Update last updated timestamp
     */
    updateTimestamp() {
        if (this.timestampElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.timestampElement.textContent = `Updated at ${timeString}`;
        }
    }
}

// Create global instance
const geminiInsights = new SimplifiedInsights();

// For use with regular scripts
window.geminiInsights = geminiInsights;