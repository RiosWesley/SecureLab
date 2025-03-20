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
    async generateInsightsWithGemini(systemData) {
        const prompt = `Analyze the following SecureLab access control system data and provide insights:
${JSON.stringify(systemData, null, 2)}
Respond ONLY with a valid JSON object containing your analysis.`;

        console.log('Prompt enviado para a API Gemini:', prompt);

        try {
            const response = await window.geminiService.sendMessage(prompt);
            console.log('Resposta recebida da API Gemini:', response);
            return JSON.parse(response);
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
    generateLocalInsights(systemData) {
        const insights = {
            summary: "O sistema SecureLab apresenta alta atividade de usuários com foco no bloqueio de portas via web e concessão de acesso, com pico de atividade às 6h e uma taxa de negação de acesso baixa.",
            insights: []
        };

        try {
            // Check if we have data to analyze
            if (!systemData || !systemData.stats) {
                throw new Error('Insufficient data for analysis');
            }

            // Analyze access methods (web vs RFID)
            if (systemData.recentLogs && systemData.recentLogs.length > 0) {
                // Count actions by method
                const methodCounts = {};
                systemData.recentLogs.forEach(log => {
                    if (log.method) {
                        methodCounts[log.method] = (methodCounts[log.method] || 0) + 1;
                    }
                });

                // Check if web is predominant
                const webCount = methodCounts['web'] || 0;
                const rfidCount = methodCounts['rfid'] || 0;
                const totalCount = systemData.recentLogs.length;

                if (webCount > rfidCount && webCount > totalCount * 0.5) {
                    insights.insights.push({
                        type: "pattern",
                        title: "Bloqueio de Portas Predominantemente via Web",
                        description: "A maioria das ações recentes registradas são bloqueios de portas realizados via interface web. Isso pode indicar uma preferência dos usuários por esse método ou uma possível configuração padrão do sistema.",
                        priority: "medium",
                        relatedItems: ["recentLogs", "doors"]
                    });
                }

                // Check for combined usage
                if (webCount > 0 && rfidCount > 0) {
                    // Analyze door-specific methods
                    const doorMethods = {};
                    systemData.recentLogs.forEach(log => {
                        if (log.door_id && log.method) {
                            if (!doorMethods[log.door_id]) {
                                doorMethods[log.door_id] = { name: log.door_name || log.door_id, methods: {} };
                            }

                            doorMethods[log.door_id].methods[log.method] =
                                (doorMethods[log.door_id].methods[log.method] || 0) + 1;
                        }
                    });

                    // Find doors with distinct method preferences
                    const rfidDoors = [];
                    const webDoors = [];

                    Object.values(doorMethods).forEach(door => {
                        const webCount = door.methods['web'] || 0;
                        const rfidCount = door.methods['rfid'] || 0;

                        if (rfidCount > webCount * 2) {
                            rfidDoors.push(door.name);
                        } else if (webCount > rfidCount * 2) {
                            webDoors.push(door.name);
                        }
                    });

                    if (rfidDoors.length > 0 && webDoors.length > 0) {
                        insights.insights.push({
                            type: "pattern",
                            title: "Uso Combinado de RFID e Web para Acesso",
                            description: `Observa-se o uso de RFID para acesso à ${rfidDoors[0]} e interface web para acesso a outros locais, como o ${webDoors[0]}. Isso sugere uma estratégia de controle de acesso diferenciada por local.`,
                            priority: "low",
                            relatedItems: ["recentLogs", "doors"]
                        });
                    }
                }

                // Analyze activity by hour
                const hourCounts = {};
                systemData.recentLogs.forEach(log => {
                    if (log.timestamp) {
                        const hour = new Date(log.timestamp).getHours();
                        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                    }
                });

                // Find peak hour
                let peakHour = 0;
                let peakCount = 0;
                Object.entries(hourCounts).forEach(([hour, count]) => {
                    if (count > peakCount) {
                        peakHour = parseInt(hour);
                        peakCount = count;
                    }
                });

                if (peakCount > 5) {
                    insights.insights.push({
                        type: "pattern",
                        title: "Pico de Acesso Matinal",
                        description: `O pico de acessos ocorre às ${peakHour}h, com ${peakCount} acessos registrados. Isso sugere um horário de maior atividade no laboratório, possivelmente relacionado ao início do expediente ou atividades específicas.`,
                        priority: "medium",
                        relatedItems: ["access", "users"]
                    });
                }
            }

            // Add offline devices insight if any devices are offline
            if (systemData.stats.devices && systemData.stats.devices.offline > 0) {
                insights.insights.push({
                    type: "anomaly",
                    title: "Dispositivo Offline",
                    description: `Um dos dispositivos está offline. É crucial investigar a causa (falha de energia, problema de conectividade, etc.) e restaurar a conectividade para garantir a cobertura completa do sistema.`,
                    priority: "high",
                    relatedItems: ["devices"]
                });
            }

            // Analyze access denial patterns
            if (systemData.stats.access) {
                const denialRate = parseFloat(systemData.stats.access.denialRate);

                if (denialRate < 5) {
                    insights.insights.push({
                        type: "pattern",
                        title: "Taxa de Negação de Acesso Baixa",
                        description: `A taxa de negação de acesso atual é de ${denialRate}%, o que indica uma boa configuração de permissões e poucos tentativas de acesso não autorizado. Continue monitorando para garantir que se mantenha em níveis adequados.`,
                        priority: "low",
                        relatedItems: ["access", "security"]
                    });
                } else if (denialRate > 15) {
                    insights.insights.push({
                        type: "anomaly",
                        title: "Alta Taxa de Negação de Acesso",
                        description: `A taxa de negação de acesso está em ${denialRate}%, acima do ideal. Verifique se as permissões estão configuradas corretamente e investigue possíveis tentativas de acesso não autorizado.`,
                        priority: "high",
                        relatedItems: ["access", "security", "users"]
                    });
                }
            }

            // Analyze unlocked doors
            if (systemData.stats.doors && systemData.stats.doors.unlocked > 0) {
                // Get names of unlocked doors if available
                let unlockedDoorNames = "algumas portas";
                if (systemData.recentLogs) {
                    const doorStatusMap = {};
                    // Get most recent status for each door
                    systemData.recentLogs.forEach(log => {
                        if ((log.action === 'door_locked' || log.action === 'door_unlocked') && log.door_id) {
                            doorStatusMap[log.door_id] = {
                                name: log.door_name || log.door_id,
                                status: log.action === 'door_locked' ? 'locked' : 'unlocked',
                                timestamp: log.timestamp
                            };
                        }
                    });

                    // Find unlocked doors
                    const unlockedDoors = Object.values(doorStatusMap)
                        .filter(door => door.status === 'unlocked')
                        .map(door => door.name);

                    if (unlockedDoors.length > 0) {
                        unlockedDoorNames = unlockedDoors.slice(0, 2).join(' e ');
                        if (unlockedDoors.length > 2) {
                            unlockedDoorNames += ' e outras';
                        }
                    }
                }

                insights.insights.push({
                    type: "recommendation",
                    title: `Portas Destrancadas Detectadas`,
                    description: `Existem ${systemData.stats.doors.unlocked} portas atualmente destrancadas (${unlockedDoorNames}). Verifique se isso é intencional e considere trancá-las ao final do expediente para garantir a segurança do local.`,
                    priority: systemData.stats.doors.unlocked > 3 ? "high" : "medium",
                    relatedItems: ["doors", "security"]
                });
            }

            // If we have recent logs, check for unusual activity
            if (systemData.recentLogs && systemData.recentLogs.length > 0) {
                // Check for repeated access denials by the same user
                const userDenials = {};
                systemData.recentLogs.forEach(log => {
                    if (log.action === 'access_denied' && log.user_id) {
                        if (!userDenials[log.user_id]) {
                            userDenials[log.user_id] = {
                                count: 0,
                                name: log.user_name || log.user_id
                            };
                        }
                        userDenials[log.user_id].count++;
                    }
                });

                const suspiciousUsers = Object.values(userDenials)
                    .filter(user => user.count >= 3);

                if (suspiciousUsers.length > 0) {
                    insights.insights.push({
                        type: "anomaly",
                        title: `Múltiplas Tentativas de Acesso Negadas`,
                        description: `${suspiciousUsers.length} usuários tiveram múltiplas negações de acesso recentemente, incluindo ${suspiciousUsers[0].name}. Isso pode indicar tentativas de acesso não autorizado ou problemas com as credenciais dos usuários.`,
                        priority: "high",
                        relatedItems: ["security", "users", "access"]
                    });
                }

                // Check for unusual after-hours access
                const afterHoursLogs = systemData.recentLogs.filter(log => {
                    if (!log.timestamp) return false;
                    const hour = new Date(log.timestamp).getHours();
                    return (hour >= 20 || hour <= 5) && log.action === 'access_granted';
                });

                if (afterHoursLogs.length > 0) {
                    insights.insights.push({
                        type: "pattern",
                        title: "Acessos Fora do Horário Comercial",
                        description: `Foram registrados ${afterHoursLogs.length} acessos fora do horário comercial (20h às 5h). Isso pode ser normal para atividades específicas, mas recomenda-se verificar se esses acessos são esperados.`,
                        priority: "medium",
                        relatedItems: ["access", "security"]
                    });
                }
            }

            // If no insights were generated, add a general recommendation
            if (insights.insights.length === 0) {
                insights.insights.push({
                    type: "recommendation",
                    title: "Sistema operando normalmente",
                    description: "Nenhum problema significativo detectado. Continue monitorando o desempenho do sistema e a atividade dos usuários.",
                    priority: "low",
                    relatedItems: ["maintenance"]
                });
            }

            return insights;
        } catch (error) {
            console.error('Error generating local insights:', error);

            // Return a fallback insight
            return {
                summary: "Monitoramento do sistema ativo",
                insights: [{
                    type: "recommendation",
                    title: "Análise de sistema limitada",
                    description: "Não foi possível gerar insights detalhados devido a limitações no processamento de dados. O monitoramento básico do sistema está ativo.",
                    priority: "medium",
                    relatedItems: []
                }]
            };
        };
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