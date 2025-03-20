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
        try {
            // Define time period (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

            // Fetch data from Firebase
            const [usersSnapshot, doorsSnapshot, devicesSnapshot, logsSnapshot] = await Promise.all([
                firebase.database().ref('users').once('value'),
                firebase.database().ref('doors').once('value'),
                firebase.database().ref('devices').once('value'),
                firebase.database().ref('access_logs')
                    .orderByChild('timestamp')
                    .startAt(thirtyDaysAgoISO)
                    .limitToLast(100)
                    .once('value')
            ]);

            // Initialize data structure
            const systemData = {
                timestamp: new Date().toISOString(),
                stats: {},
                dataRange: {
                    start: thirtyDaysAgoISO,
                    end: new Date().toISOString()
                }
            };

            // Process users data
            if (usersSnapshot.exists()) {
                const users = usersSnapshot.val();
                systemData.stats.users = {
                    total: Object.keys(users).length,
                    active: Object.values(users).filter(u => u.status === 'active').length,
                    inactive: Object.values(users).filter(u => u.status !== 'active').length
                };
            } else {
                systemData.stats.users = { total: 0, active: 0, inactive: 0 };
            }

            // Process doors data
            if (doorsSnapshot.exists()) {
                const doors = doorsSnapshot.val();
                systemData.stats.doors = {
                    total: Object.keys(doors).length,
                    locked: Object.values(doors).filter(d => d.status === 'locked').length,
                    unlocked: Object.values(doors).filter(d => d.status === 'unlocked').length
                };
            } else {
                systemData.stats.doors = { total: 0, locked: 0, unlocked: 0 };
            }

            // Process devices data
            if (devicesSnapshot.exists()) {
                const devices = devicesSnapshot.val();
                systemData.stats.devices = {
                    total: Object.keys(devices).length,
                    online: Object.values(devices).filter(d => d.status === 'online').length,
                    offline: Object.values(devices).filter(d => d.status === 'offline').length
                };
            } else {
                systemData.stats.devices = { total: 0, online: 0, offline: 0 };
            }

            // Process access logs
            if (logsSnapshot.exists()) {
                const logs = logsSnapshot.val();
                const logsArray = Object.values(logs);

                // Group by action type
                const accessGranted = logsArray.filter(log => log.action === 'access_granted').length;
                const accessDenied = logsArray.filter(log => log.action === 'access_denied').length;
                const doorLocked = logsArray.filter(log => log.action === 'door_locked').length;
                const doorUnlocked = logsArray.filter(log => log.action === 'door_unlocked').length;

                // Calculate denial rate
                const totalAccessAttempts = accessGranted + accessDenied;
                const denialRate = totalAccessAttempts > 0 ?
                    (accessDenied / totalAccessAttempts) * 100 : 0;

                // Group by day
                const accessByDay = {};
                logsArray.forEach(log => {
                    if (log.timestamp) {
                        const date = new Date(log.timestamp).toISOString().split('T')[0];
                        accessByDay[date] = accessByDay[date] || {
                            total: 0,
                            granted: 0,
                            denied: 0
                        };

                        accessByDay[date].total++;
                        if (log.action === 'access_granted') {
                            accessByDay[date].granted++;
                        } else if (log.action === 'access_denied') {
                            accessByDay[date].denied++;
                        }
                    }
                });

                // Find most active users
                const userActivity = {};
                logsArray.forEach(log => {
                    if (log.user_id) {
                        userActivity[log.user_id] = userActivity[log.user_id] || {
                            name: log.user_name || log.user_id,
                            total: 0,
                            denied: 0
                        };

                        userActivity[log.user_id].total++;
                        if (log.action === 'access_denied') {
                            userActivity[log.user_id].denied++;
                        }
                    }
                });

                // Find most accessed doors
                const doorActivity = {};
                logsArray.forEach(log => {
                    if (log.door_id) {
                        doorActivity[log.door_id] = doorActivity[log.door_id] || {
                            name: log.door_name || log.door_id,
                            total: 0,
                            denied: 0
                        };

                        doorActivity[log.door_id].total++;
                        if (log.action === 'access_denied') {
                            doorActivity[log.door_id].denied++;
                        }
                    }
                });

                systemData.stats.access = {
                    total: logsArray.length,
                    granted: accessGranted,
                    denied: accessDenied,
                    locked: doorLocked,
                    unlocked: doorUnlocked,
                    denialRate: denialRate.toFixed(1),
                    byDay: accessByDay,
                    byUser: userActivity,
                    byDoor: doorActivity
                };

                // Most recent logs (last 10)
                systemData.recentLogs = logsArray
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 10);
            } else {
                systemData.stats.access = {
                    total: 0,
                    granted: 0,
                    denied: 0,
                    locked: 0,
                    unlocked: 0,
                    denialRate: 0
                };
                systemData.recentLogs = [];
            }

            return systemData;
        } catch (error) {
            console.error('Error collecting system data:', error);
            throw new Error('Failed to collect system data');
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
        // Create prompt for Gemini
        const prompt = `Analyze the following SecureLab access control system data and provide insights:
    
${JSON.stringify(systemData, null, 2)}

Respond ONLY with a valid JSON object using this exact structure:
{
  "summary": "A single sentence summary of the most important insight",
  "insights": [
    {
      "type": "anomaly|pattern|recommendation",
      "title": "Short title for the insight",
      "description": "Detailed description of the insight",
      "priority": "high|medium|low",
      "relatedItems": ["item1", "item2"]
    }
  ]
}`;

        try {
            // Send request to Gemini
            const response = await window.geminiService.sendMessage(prompt, {}, {
                isConversation: false,
                timeout: 15000
            });

            // Try to parse response as JSON
            try {
                return JSON.parse(response);
            } catch (parseError) {
                // If we can't parse it directly, try to extract JSON from the response
                const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                    response.match(/```\n([\s\S]*?)\n```/) ||
                    response.match(/(\{[\s\S]*\})/);

                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                }

                // If all else fails, return a fallback
                throw new Error('Could not parse Gemini response');
            }
        } catch (error) {
            console.error('Error generating insights with Gemini:', error);
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
        }
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