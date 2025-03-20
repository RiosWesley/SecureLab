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
    /**
     * Método corrigido para atualizar insights com timeout adequado
     * para modelos Gemini Thinking
     */
    async refreshInsights() {
        if (this.loading) return;

        try {
            this.loading = true;
            this.showLoading(true);

            // Coletar dados para análise
            const systemData = await this.collectSystemData();

            // Gerar insights via Gemini com prompt aprimorado
            const prompt = `Analise os seguintes dados do sistema SecureLab e forneça insights relevantes.

${JSON.stringify(systemData, null, 2)}

IMPORTANTE: Você DEVE responder APENAS com um objeto JSON válido e bem-formado no formato abaixo.
NÃO inclua comentários explicativos ou texto adicional antes ou depois do JSON.
NÃO use blocos de código (\`\`\`) - retorne apenas o JSON puro.
Verifique cuidadosamente que o JSON está bem formatado sem vírgulas extras ou campos malformados.

Formato esperado:
{
  "summary": "Uma frase resumindo sua análise principal",
  "insights": [
    {
      "type": "anomaly",
      "title": "Título curto do insight",
      "description": "Descrição detalhada do insight",
      "priority": "high",
      "relatedItems": ["item1", "item2"]
    },
    {
      "type": "pattern",
      "title": "Outro insight identificado",
      "description": "Descrição detalhada",
      "priority": "medium",
      "relatedItems": []
    }
  ]
}

Certifique-se de que o JSON é completamente válido. Não use valores extras ou chaves não especificadas.`;

            // Usar a opção isConversation: false para indicar que queremos dados estruturados
            // A configuração de timeout já deve estar definida no método sendMessage
            const response = await window.geminiService.sendMessage(prompt, {}, {
                isConversation: false,
                timeout: 180000 // Especificar timeout de 3 minutos para esta chamada específica
            });

            // Tentar processar a resposta, mesmo se parecer truncada
            let processedResponse = response;
            if (window.geminiService.processModelResponse) {
                processedResponse = await window.geminiService.processModelResponse(response, false);
            }

            // Usar o método corrigido para extrair JSON da resposta
            const insights = this.extractJSONFromResponse(processedResponse);

            // Exibir insights
            this.displayInsights(insights);

            // Atualizar timestamp
            this.updateTimestamp();
        } catch (error) {
            console.error('Erro ao atualizar insights:', error);
            this.displayError(`Não foi possível gerar insights. Tente novamente mais tarde.`);
        } finally {
            this.loading = false;
            this.showLoading(false);
        }
    }

// Adicionar um novo método para extração de JSON
    // Método aprimorado para extrair JSON da resposta, tratando formatos inválidos
    extractJSONFromResponse(response) {
        try {
            // Primeiro, tentar analisar a resposta inteira como JSON
            return JSON.parse(response);
        } catch (firstParseError) {
            // Se falhar, tentar extrair JSON de um bloco de código
            try {
                // Tentar várias abordagens para encontrar conteúdo JSON válido
                const jsonMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) ||
                    response.match(/```([\s\S]*?)```/) ||
                    response.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    let jsonContent = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];

                    // Tentar limpar o JSON antes de parsear
                    // Remover caracteres de controle que possam ter sido adicionados
                    jsonContent = jsonContent.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

                    // Corrigir problemas comuns em respostas JSON malformadas
                    // 1. Remover vírgulas extras em arrays
                    jsonContent = jsonContent.replace(/,\s*(\])/g, '$1');

                    // 2. Remover vírgulas extras em objetos
                    jsonContent = jsonContent.replace(/,\s*(\})/g, '$1');

                    // 3. Adicionar aspas a chaves de objetos sem aspas
                    jsonContent = jsonContent.replace(/(\{|\,)\s*(\w+)\s*\:/g, '$1"$2":');

                    try {
                        return JSON.parse(jsonContent);
                    } catch (jsonError) {
                        console.warn('Falha ao limpar e parsear JSON. Usando fallback.', jsonError);
                        // Último recurso: tentar remover a linha problemática
                        // Com base no erro, que indica problema na linha/coluna 22:6
                        const lines = jsonContent.split('\n');
                        if (lines.length > 21) {
                            // Remover a linha problemática e tentar novamente
                            lines.splice(21, 1);
                            const fixedContent = lines.join('\n');
                            try {
                                return JSON.parse(fixedContent);
                            } catch (finalError) {
                                console.error('Todas as tentativas de correção JSON falharam:', finalError);
                            }
                        }
                    }
                }

                // Nenhum JSON encontrado, usar fallback
                console.warn('JSON não encontrado na resposta. Usando fallback.', response);
                return {
                    summary: "Análise não estruturada disponível",
                    insights: [
                        {
                            type: "recommendation",
                            title: "Consulte o assistente para detalhes",
                            description: "Os insights não puderam ser estruturados automaticamente. Por favor, consulte o assistente para uma análise detalhada.",
                            priority: "medium",
                            relatedItems: []
                        }
                    ],
                    rawResponse: response
                };
            } catch (secondParseError) {
                console.error('Erro ao extrair e analisar JSON:', secondParseError);
                return {
                    summary: "Erro ao processar insights",
                    insights: [
                        {
                            type: "error",
                            title: "Erro de processamento",
                            description: "O assistente gerou uma resposta, mas não foi possível extrair os insights estruturados.",
                            priority: "medium",
                            relatedItems: []
                        }
                    ],
                    rawResponse: response
                };
            }
        }
    }

    /**
     * Coleta dados do sistema para análise
     * @returns {Promise<Object>} Dados do sistema
     */
    /**
     * Coleta dados do sistema para análise, com acesso expandido aos logs
     * @returns {Promise<Object>} Dados do sistema
     */
    async collectSystemData() {
        try {
            // Definir um período maior para coletar logs (últimos 30 dias)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

            // Coletar estatísticas diversas do Firebase com maior quantidade de logs
            const [usersSnapshot, doorsSnapshot, devicesSnapshot, logsSnapshot] = await Promise.all([
                firebase.database().ref('users').once('value'),
                firebase.database().ref('doors').once('value'),
                firebase.database().ref('devices').once('value'),
                // Buscar mais logs e ordenar por timestamp
                firebase.database().ref('access_logs')
                    .orderByChild('timestamp')
                    .startAt(thirtyDaysAgoISO)
                    .limitToLast(300) // Aumentar o limite para 300 logs
                    .once('value')
            ]);

            const systemData = {
                timestamp: new Date().toISOString(),
                stats: {},
                dataRange: {
                    start: thirtyDaysAgoISO,
                    end: new Date().toISOString(),
                    description: "Dados dos últimos 30 dias"
                }
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

                // Adicionar informação sobre o período dos logs
                if (logsArray.length > 0) {
                    // Ordenar logs por timestamp
                    logsArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    // Determinar o período real dos logs
                    const firstLogDate = new Date(logsArray[0].timestamp);
                    const lastLogDate = new Date(logsArray[logsArray.length - 1].timestamp);

                    systemData.dataRange = {
                        start: firstLogDate.toISOString(),
                        end: lastLogDate.toISOString(),
                        description: `Dados de ${firstLogDate.toLocaleDateString()} até ${lastLogDate.toLocaleDateString()}`,
                        totalLogs: logsArray.length
                    };
                }

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

                // Agrupar logs por dia para análise de tendências
                const accessByDay = {};
                logsArray.forEach(log => {
                    if (log.timestamp) {
                        const date = new Date(log.timestamp).toISOString().split('T')[0];
                        accessByDay[date] = accessByDay[date] || {
                            total: 0,
                            access_granted: 0,
                            access_denied: 0,
                            door_locked: 0,
                            door_unlocked: 0
                        };

                        accessByDay[date].total += 1;

                        // Incrementar contador específico por tipo de ação
                        if (log.action === 'access_granted') accessByDay[date].access_granted += 1;
                        else if (log.action === 'access_denied') accessByDay[date].access_denied += 1;
                        else if (log.action === 'door_locked') accessByDay[date].door_locked += 1;
                        else if (log.action === 'door_unlocked') accessByDay[date].door_unlocked += 1;
                    }
                });

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

                // Agrupar acessos por usuário e porta para identificar padrões
                const accessByUser = {};
                const accessByDoor = {};

                logsArray.forEach(log => {
                    if (log.user_id) {
                        accessByUser[log.user_id] = accessByUser[log.user_id] || {
                            user_name: log.user_name || log.user_id,
                            total: 0,
                            granted: 0,
                            denied: 0
                        };

                        accessByUser[log.user_id].total += 1;
                        if (log.action === 'access_granted') {
                            accessByUser[log.user_id].granted += 1;
                        } else if (log.action === 'access_denied') {
                            accessByUser[log.user_id].denied += 1;
                        }
                    }

                    if (log.door_id) {
                        accessByDoor[log.door_id] = accessByDoor[log.door_id] || {
                            door_name: log.door_name || log.door_id,
                            total: 0,
                            granted: 0,
                            denied: 0,
                            locked: 0,
                            unlocked: 0
                        };

                        accessByDoor[log.door_id].total += 1;
                        if (log.action === 'access_granted') {
                            accessByDoor[log.door_id].granted += 1;
                        } else if (log.action === 'access_denied') {
                            accessByDoor[log.door_id].denied += 1;
                        } else if (log.action === 'door_locked') {
                            accessByDoor[log.door_id].locked += 1;
                        } else if (log.action === 'door_unlocked') {
                            accessByDoor[log.door_id].unlocked += 1;
                        }
                    }
                });

                systemData.stats.access = {
                    total: logsArray.length,
                    byAction: logsByAction,
                    denialRate: denialRate.toFixed(2),
                    peakHour,
                    peakCount,
                    byDay: accessByDay,
                    byUser: accessByUser,
                    byDoor: accessByDoor
                };

                // Adicionar logs mais recentes para análise detalhada (limitados a 50 para não sobrecarregar)
                systemData.recentLogs = logsArray
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 50);

                // Adicionar amostra de logs mais antigos para dar contexto histórico
                if (logsArray.length > 100) {
                    systemData.olderLogs = logsArray
                        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                        .slice(0, 20);
                }
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
    // No método displayInsights em gemini-insights.js
    displayInsights(insights) {
        if (!insights) {
            this.displayError('Não foi possível gerar insights.');
            return;
        }

        // Garantir que temos um resumo, mesmo que seja um fallback
        const summary = insights.summary || "Análise do sistema SecureLab";

        // Exibir resumo
        this.insightsSummary.innerHTML = `
        <div class="gemini-insights-summary-content">
            <div class="gemini-insights-summary-icon">
                <i class="fas fa-brain"></i>
            </div>
            <p>${summary}</p>
        </div>
    `;

        // Limpar lista anterior
        this.insightsList.innerHTML = '';

        // Verificar se temos insights para mostrar
        const insightsToShow = insights.insights && Array.isArray(insights.insights) && insights.insights.length > 0
            ? insights.insights.slice(0, this.options.maxInsights)
            : [];

        if (insightsToShow.length === 0) {
            this.insightsList.innerHTML = '<div class="gemini-no-insights">Nenhum insight disponível. Tente atualizar ou consulte o assistente para mais informações.</div>';
            return;
        }

        // Adicionar cada insight à lista com tratamento de erros
        insightsToShow.forEach(insight => {
            // Verificar se temos dados válidos
            if (!insight || typeof insight !== 'object') return;

            const insightType = insight.type || 'recommendation';
            const insightTitle = insight.title || 'Insight';
            const insightDesc = insight.description || 'Sem descrição disponível';
            const insightPriority = insight.priority || 'medium';

            const insightElement = document.createElement('div');
            insightElement.className = `gemini-insight gemini-insight-${insightType} gemini-priority-${insightPriority}`;

            // Selecionar ícone baseado no tipo com fallback
            let iconClass = 'fas fa-info-circle';
            if (insightType === 'anomaly') {
                iconClass = 'fas fa-exclamation-triangle';
            } else if (insightType === 'pattern') {
                iconClass = 'fas fa-chart-line';
            } else if (insightType === 'recommendation') {
                iconClass = 'fas fa-lightbulb';
            }

            insightElement.innerHTML = `
            <div class="gemini-insight-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="gemini-insight-content">
                <h4 class="gemini-insight-title">${insightTitle}</h4>
                <p class="gemini-insight-description">${insightDesc}</p>
                ${insight.relatedItems && Array.isArray(insight.relatedItems) && insight.relatedItems.length > 0 ? `
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
//export default geminiInsights;

// Para uso com scripts regulares
window.geminiInsights = geminiInsights;