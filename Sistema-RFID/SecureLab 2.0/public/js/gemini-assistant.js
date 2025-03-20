/**
 * gemini-assistant.js - Interface do assistente Gemini para o SecureLab
 * Gerencia a interface do usuário e interações com o assistente Gemini
 */

// Verificar se o serviço Gemini está disponível
if (!window.geminiService) {
    console.error('gemini-service.js deve ser carregado antes de gemini-assistant.js');
}

/**
 * Classe para gerenciar a interface do assistente Gemini
 */
class GeminiAssistant {
    constructor() {
        this.initialized = false;
        this.visible = false;
        this.container = null;
        this.conversationContainer = null;
        this.inputField = null;
        this.systemContext = {};
        this.pendingSystemData = false;
        this.commandHistory = [];
        this.historyIndex = -1;
    }

    /**
     * Inicializa o assistente e cria os elementos da interface
     */
    init() {
        if (this.initialized) return;

        // Criar e adicionar o container principal
        this.container = document.createElement('div');
        this.container.className = 'gemini-assistant';
        this.container.innerHTML = `
            <div class="gemini-header">
                <div class="gemini-branding">
                    <div class="gemini-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>Assistente Gemini</h3>
                </div>
                <div class="gemini-actions">
                    <button class="gemini-action-btn gemini-clear-btn" title="Limpar conversa">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="gemini-action-btn gemini-toggle-btn" title="Minimizar">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            <div class="gemini-conversation-container">
                <div class="gemini-conversation"></div>
            </div>
            <div class="gemini-suggestions">
                <button class="gemini-suggestion">Analisar logs de acesso recentes</button>
            </div>
            <div class="gemini-input-container">
                <textarea class="gemini-input" placeholder="Pergunte algo ou digite um comando..." rows="1"></textarea>
                <button class="gemini-send-btn" disabled>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

        // Adicionar ao body
        document.body.appendChild(this.container);

        // Obter referências para elementos importantes
        this.conversationContainer = this.container.querySelector('.gemini-conversation');
        this.inputField = this.container.querySelector('.gemini-input');
        this.sendButton = this.container.querySelector('.gemini-send-btn');

        // Configurar event listeners
        this._setupEventListeners();

        // Adicionar mensagem de boas-vindas
        this._addMessage('assistant', 'Olá! Sou o assistente Gemini do SecureLab. Como posso ajudar?');

        // Inicializar a coleta de contexto do sistema
        this._initSystemContext();

        // Marcar como inicializado
        this.initialized = true;

        // Inicialmente minimizado em dispositivos móveis
        if (window.innerWidth <= 768) {
            this.toggle(false);
        } else {
            this.toggle(true);
        }

        console.log('Assistente Gemini inicializado');
    }

    /**
     * Configura os event listeners para interação com o assistente
     * @private
     */
    _setupEventListeners() {
        // Event listener para o botão de envio
        this.sendButton.addEventListener('click', () => this._handleSendMessage());

        // Event listener para a tecla Enter no campo de input
        this.inputField.addEventListener('keydown', (e) => {
            // Auto-expandir textarea
            setTimeout(() => {
                this.inputField.style.height = 'auto';
                this.inputField.style.height = (this.inputField.scrollHeight) + 'px';
            }, 0);

            // Enviar com Enter (sem o Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSendMessage();
            }

            // Histórico de comandos com setas para cima/baixo
            if (e.key === 'ArrowUp' && this.commandHistory.length > 0) {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputField.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
                }
            } else if (e.key === 'ArrowDown' && this.historyIndex >= 0) {
                e.preventDefault();
                this.historyIndex--;
                if (this.historyIndex >= 0) {
                    this.inputField.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
                } else {
                    this.inputField.value = '';
                }
            }
        });

        // Ativar/desativar botão de envio com base no conteúdo do input
        this.inputField.addEventListener('input', () => {
            this.sendButton.disabled = !this.inputField.value.trim();

            // Auto-expandir textarea
            this.inputField.style.height = 'auto';
            this.inputField.style.height = (this.inputField.scrollHeight) + 'px';
        });

        // Event listener para botão de toggle
        const toggleBtn = this.container.querySelector('.gemini-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            this.toggle();
        });

        // Event listener para botão de limpar
        const clearBtn = this.container.querySelector('.gemini-clear-btn');
        clearBtn.addEventListener('click', () => {
            this.clearConversation();
        });

        // Event listeners para sugestões
        const suggestionButtons = this.container.querySelectorAll('.gemini-suggestion');
        suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.inputField.value = button.textContent;
                this._handleSendMessage();
            });
        });
    }

    /**
     * Inicializa o contexto do sistema coletando dados relevantes
     * @private
     */
    _initSystemContext() {
        this.systemContext = {
            currentUser: firebase.auth().currentUser ? {
                uid: firebase.auth().currentUser.uid,
                email: firebase.auth().currentUser.email,
                displayName: firebase.auth().currentUser.displayName
            } : null,
            currentPage: window.location.pathname,
            dateTime: new Date().toISOString()
        };

        // Flag para carregar dados sensíveis do sistema apenas quando necessário
        this.pendingSystemData = true;
    }

    /**
     * Carrega dados adicionais do sistema para contexto
     * @private
     * @returns {Promise<Object>} Dados do sistema
     */
    async _loadSystemData() {
        if (!this.pendingSystemData) return this.systemContext;

        try {
            // Carregar dados básicos de usuários, portas e dispositivos
            const [usersSnapshot, doorsSnapshot, devicesSnapshot] = await Promise.all([
                firebase.database().ref('users').once('value'),
                firebase.database().ref('doors').once('value'),
                firebase.database().ref('devices').once('value')
            ]);

            // Processar e adicionar ao contexto
            this.systemContext.counts = {
                users: usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0,
                doors: doorsSnapshot.exists() ? Object.keys(doorsSnapshot.val()).length : 0,
                devices: devicesSnapshot.exists() ? Object.keys(devicesSnapshot.val()).length : 0
            };

            // Status dos dispositivos
            if (devicesSnapshot.exists()) {
                const devices = devicesSnapshot.val();
                this.systemContext.deviceStats = {
                    online: Object.values(devices).filter(d => d.status === 'online').length,
                    offline: Object.values(devices).filter(d => d.status === 'offline').length,
                    warning: Object.values(devices).filter(d => d.status === 'warning').length
                };
            }

            // Status das portas
            if (doorsSnapshot.exists()) {
                const doors = doorsSnapshot.val();
                this.systemContext.doorStats = {
                    locked: Object.values(doors).filter(d => d.status === 'locked').length,
                    unlocked: Object.values(doors).filter(d => d.status === 'unlocked').length
                };
            }

            // Marcar que já carregamos os dados
            this.pendingSystemData = false;

            console.log('Dados do sistema carregados para o assistente Gemini', this.systemContext);
            return this.systemContext;
        } catch (error) {
            console.error('Erro ao carregar dados do sistema para o Gemini:', error);
            return this.systemContext;
        }
    }

    /**
     * Lida com o envio de mensagem do usuário
     * @private
     */
    // Função que lida com o envio de mensagem do usuário
    async _handleSendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        // Adicionar a mensagem ao histórico
        if (this.commandHistory.length === 0 || this.commandHistory[this.commandHistory.length - 1] !== message) {
            this.commandHistory.push(message);
        }
        this.historyIndex = -1;

        // Adicionar mensagem do usuário à conversa
        this._addMessage('user', message);

        // Limpar o campo de entrada
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        this.sendButton.disabled = true;

        // Carregar dados adicionais do sistema se necessário
        const systemContext = await this._loadSystemData();

        // Mostrar indicador de carregamento
        const loadingMsg = this._addMessage('assistant', '<div class="gemini-typing-indicator"><span></span><span></span><span></span></div>');

        try {
            // Verificar se parece com um comando
            if (this._isCommand(message)) {
                // Para comandos, processar via método específico
                await this._processCommand(message, systemContext);
            } else {
                // Para conversas normais, enviar ao Gemini solicitando resposta em linguagem natural
                const response = await window.geminiService.sendMessage(message, systemContext, {
                    isConversation: true // Sinalizador para indicar que é uma conversa natural
                });

                // Substituir indicador de carregamento pela resposta
                this._updateMessage(loadingMsg, 'assistant', this._formatResponse(response));
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            this._updateMessage(loadingMsg, 'assistant-error', 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
        }

        // Rolar para o final da conversa
        this._scrollToBottom();
    }

    /**
     * Verifica se uma mensagem parece ser um comando
     * @private
     * @param {string} message - A mensagem a ser verificada
     * @returns {boolean} True se a mensagem parece ser um comando
     */
    _isCommand(message) {
        // Comandos começam com / ou são relacionados a ações diretas no sistema
        const commandPatterns = [
            /^\//,
            /^(mostrar?|exibir?|listar?)/i,
            /^(trancar?|destrancar?)/i,
            /^(bloquear?|desbloquear?)/i,
            /^(add|adicionar?|cadastrar?|criar?)/i,
            /^(remover?|deletar?|excluir?)/i,
            /^(ativar?|desativar?)/i,
            /^(atualizar?|sincronizar?)/i,
            /^(configurar?|definir?)/i,
            /^(verificar?|checar?)/i,
            /^(gerar?|criar?)/i
        ];

        return commandPatterns.some(pattern => pattern.test(message));
    }

    /**
     * Processa um comando e executa as ações correspondentes
     * @private
     * @param {string} command - O comando a ser processado
     * @param {Object} systemContext - O contexto atual do sistema
     */
    async _processCommand(command, systemContext) {
        // Adicionar mensagem de loading
        const loadingMsg = this._addMessage('assistant', '<div class="gemini-typing-indicator"><span></span><span></span><span></span></div>');

        try {
            // Processar o comando via Gemini
            const processedCommand = await window.geminiService.processCommand(command, systemContext);

            // Verificar se é necessário confirmação
            if (processedCommand.confirmation) {
                // Substituir indicador de carregamento pela mensagem de confirmação
                this._updateMessage(loadingMsg, 'assistant-confirmation', `
                    <div class="gemini-confirmation">
                        <p>${processedCommand.confirmationMessage || 'Você tem certeza que deseja executar este comando?'}</p>
                        <div class="gemini-confirmation-buttons">
                            <button class="gemini-confirm-btn gemini-confirm-yes" data-action="${processedCommand.action}">Sim</button>
                            <button class="gemini-confirm-btn gemini-confirm-no">Não</button>
                        </div>
                    </div>
                `);

                // Adicionar event listeners para os botões de confirmação
                const confirmYesBtn = loadingMsg.querySelector('.gemini-confirm-yes');
                const confirmNoBtn = loadingMsg.querySelector('.gemini-confirm-no');

                if (confirmYesBtn) {
                    confirmYesBtn.addEventListener('click', () => {
                        // Executar a ação confirmada
                        this._executeCommand(processedCommand, loadingMsg);
                    });
                }

                if (confirmNoBtn) {
                    confirmNoBtn.addEventListener('click', () => {
                        // Substituir a mensagem de confirmação
                        this._updateMessage(loadingMsg, 'assistant', 'Comando cancelado. Posso ajudar com mais alguma coisa?');
                    });
                }
            } else {
                // Executar o comando diretamente
                await this._executeCommand(processedCommand, loadingMsg);
            }
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            this._updateMessage(loadingMsg, 'assistant-error', 'Desculpe, não consegui processar seu comando. Por favor, tente novamente com outras palavras.');
        }
    }

    /**
     * Executa um comando processado
     * @private
     * @param {Object} processedCommand - O comando processado
     * @param {HTMLElement} messageElement - O elemento da mensagem que mostra o resultado
     */
    async _executeCommand(processedCommand, messageElement) {
        try {
            // Lógica para executar diferentes tipos de comandos
            switch (processedCommand.intent) {
                case 'query':
                    await this._executeQueryCommand(processedCommand, messageElement);
                    break;

                case 'action':
                    await this._executeActionCommand(processedCommand, messageElement);
                    break;

                case 'config':
                    await this._executeConfigCommand(processedCommand, messageElement);
                    break;

                default:
                    // Comando desconhecido ou não implementado
                    this._updateMessage(messageElement, 'assistant', `
                        <p>Entendi seu comando como: <strong>${processedCommand.action || 'não reconhecido'}</strong></p>
                        <p>Infelizmente, ainda não posso executar este tipo de comando. Posso ajudar com consultas sobre usuários, portas e dispositivos.</p>
                    `);
            }
        } catch (error) {
            console.error('Erro ao executar comando:', error);
            this._updateMessage(messageElement, 'assistant-error', `
                <p>Ocorreu um erro ao executar o comando: ${error.message}</p>
                <p>Por favor, verifique os parâmetros e tente novamente.</p>
            `);
        }
    }
    /**
     * Função para processar mais logs diretamente no chat
     * Adicione esta função ao arquivo gemini-assistant.js
     */
    async _executeLogsAnalysisCommand(processedCommand, messageElement) {
        // Mostrar indicador de carregamento
        this._updateMessage(messageElement, 'assistant', 'Analisando logs de acesso, isso pode levar alguns segundos...');

        try {
            // Parâmetros para busca de logs
            const daysToLookBack = 30; // Buscar logs dos últimos 30 dias
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysToLookBack);
            const startDateISO = startDate.toISOString();

            // Buscar logs de acesso com limite expandido
            const logsSnapshot = await firebase.database().ref('access_logs')
                .orderByChild('timestamp')
                .startAt(startDateISO)
                .limitToLast(500) // Aumentar significativamente o limite de logs
                .once('value');

            if (!logsSnapshot.exists()) {
                this._updateMessage(messageElement, 'assistant', 'Não encontrei nenhum log de acesso para análise.');
                return;
            }

            // Converter para array e processar
            const logs = logsSnapshot.val();
            const logsArray = Object.values(logs);

            // Ordenar por timestamp
            logsArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Determinar período dos logs
            const firstLog = logsArray[0];
            const lastLog = logsArray[logsArray.length - 1];
            const firstDate = new Date(firstLog.timestamp);
            const lastDate = new Date(lastLog.timestamp);

            // Formatar datas para exibição
            const formatDate = (date) => {
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            };

            const formatDateTime = (date) => {
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            // Estatísticas gerais
            const totalLogs = logsArray.length;
            const accessGranted = logsArray.filter(log => log.action === 'access_granted').length;
            const accessDenied = logsArray.filter(log => log.action === 'access_denied').length;
            const doorLocked = logsArray.filter(log => log.action === 'door_locked').length;
            const doorUnlocked = logsArray.filter(log => log.action === 'door_unlocked').length;

            // Agrupar por dia para análise de tendências
            const logsByDay = {};
            logsArray.forEach(log => {
                const day = new Date(log.timestamp).toISOString().split('T')[0];
                logsByDay[day] = logsByDay[day] || {
                    total: 0,
                    access_granted: 0,
                    access_denied: 0,
                    door_locked: 0,
                    door_unlocked: 0
                };

                logsByDay[day].total++;

                if (log.action === 'access_granted') logsByDay[day].access_granted++;
                else if (log.action === 'access_denied') logsByDay[day].access_denied++;
                else if (log.action === 'door_locked') logsByDay[day].door_locked++;
                else if (log.action === 'door_unlocked') logsByDay[day].door_unlocked++;
            });

            // Converter para array ordenado por data
            const logsByDayArray = Object.entries(logsByDay).map(([date, stats]) => ({
                date,
                ...stats
            })).sort((a, b) => a.date.localeCompare(b.date));

            // Obter os dias únicos para exibição
            const uniqueDays = logsByDayArray.map(entry => {
                const date = new Date(entry.date);
                return formatDate(date);
            });

            // Contagem de acessos por usuário
            const userAccessCounts = {};
            logsArray.forEach(log => {
                if (log.user_name) {
                    userAccessCounts[log.user_name] = userAccessCounts[log.user_name] || {
                        granted: 0,
                        denied: 0,
                        total: 0
                    };

                    userAccessCounts[log.user_name].total++;
                    if (log.action === 'access_granted') {
                        userAccessCounts[log.user_name].granted++;
                    } else if (log.action === 'access_denied') {
                        userAccessCounts[log.user_name].denied++;
                    }
                }
            });

            // Obter os usuários mais ativos
            const topUsers = Object.entries(userAccessCounts)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Contagem de acessos por porta
            const doorAccessCounts = {};
            logsArray.forEach(log => {
                if (log.door_name) {
                    doorAccessCounts[log.door_name] = doorAccessCounts[log.door_name] || {
                        granted: 0,
                        denied: 0,
                        locked: 0,
                        unlocked: 0,
                        total: 0
                    };

                    doorAccessCounts[log.door_name].total++;

                    if (log.action === 'access_granted') {
                        doorAccessCounts[log.door_name].granted++;
                    } else if (log.action === 'access_denied') {
                        doorAccessCounts[log.door_name].denied++;
                    } else if (log.action === 'door_locked') {
                        doorAccessCounts[log.door_name].locked++;
                    } else if (log.action === 'door_unlocked') {
                        doorAccessCounts[log.door_name].unlocked++;
                    }
                }
            });

            // Obter as portas mais acessadas
            const topDoors = Object.entries(doorAccessCounts)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Construir resposta em HTML
            const result = `
        <h4>Análise de Logs de Acesso</h4>
        
        <p>Analisei um total de <strong>${totalLogs} logs</strong> no período de <strong>${formatDate(firstDate)}</strong> a <strong>${formatDate(lastDate)}</strong>.</p>
        
        <div class="gemini-dashboard">
            <div class="gemini-stat-card">
                <div class="gemini-stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="gemini-stat-value">${accessGranted}</div>
                <div class="gemini-stat-label">Acessos Permitidos</div>
            </div>
            
            <div class="gemini-stat-card">
                <div class="gemini-stat-icon"><i class="fas fa-times-circle"></i></div>
                <div class="gemini-stat-value">${accessDenied}</div>
                <div class="gemini-stat-label">Acessos Negados</div>
            </div>
            
            <div class="gemini-stat-card">
                <div class="gemini-stat-icon"><i class="fas fa-lock"></i></div>
                <div class="gemini-stat-value">${doorLocked}</div>
                <div class="gemini-stat-label">Portas Trancadas</div>
            </div>
            
            <div class="gemini-stat-card">
                <div class="gemini-stat-icon"><i class="fas fa-lock-open"></i></div>
                <div class="gemini-stat-value">${doorUnlocked}</div>
                <div class="gemini-stat-label">Portas Destrancadas</div>
            </div>
        </div>
        
        <h5>Distribuição por Dia</h5>
        <p>Analisei a distribuição de acessos por dia e identifiquei os seguintes padrões:</p>
        
        <div class="gemini-chart">
            ${logsByDayArray.length > 0 ? logsByDayArray.map(dayStats => {
                const date = new Date(dayStats.date);
                const formattedDate = formatDate(date);
                const denialRate = dayStats.access_denied > 0 ?
                    ((dayStats.access_denied / (dayStats.access_granted + dayStats.access_denied)) * 100).toFixed(1) + '%' :
                    '0%';

                return `
                <div class="gemini-chart-bar-container">
                    <div class="gemini-chart-label">${formattedDate}</div>
                    <div class="gemini-chart-bar" style="width: ${Math.min(100, dayStats.total * 2)}%; background-color: #4a6cf7;">
                        <span>${dayStats.total} acessos (${denialRate} negados)</span>
                    </div>
                </div>`;
            }).join('') : '<p>Não há dados suficientes para mostrar distribuição por dia.</p>'}
        </div>
        
        <h5>Usuários mais Ativos</h5>
        <div class="gemini-insights">
            ${topUsers.map(user => `
            <div class="gemini-insight">
                <i class="fas fa-user"></i>
                <div>
                    <h5>${user.name}</h5>
                    <p>${user.total} acessos totais (${user.granted} permitidos, ${user.denied} negados)</p>
                </div>
            </div>
            `).join('')}
        </div>
        
        <h5>Portas mais Acessadas</h5>
        <div class="gemini-insights">
            ${topDoors.map(door => `
            <div class="gemini-insight">
                <i class="fas fa-door-open"></i>
                <div>
                    <h5>${door.name}</h5>
                    <p>${door.total} acessos totais (${door.granted} permitidos, ${door.denied} negados)</p>
                </div>
            </div>
            `).join('')}
        </div>
        
        <p>Estes dados abrangem um período de ${Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))} dias com registros. Se você precisar de uma análise mais específica ou detalhada, por favor me informe.</p>
        `;

            // Atualizar a mensagem com o resultado
            this._updateMessage(messageElement, 'assistant', result);

        } catch (error) {
            console.error('Erro ao analisar logs:', error);
            this._updateMessage(messageElement, 'assistant-error', 'Ocorreu um erro ao analisar os logs. Por favor, tente novamente mais tarde.');
        }
    }

    /**
     * Executa um comando de consulta
     * @private
     * @param {Object} processedCommand - O comando processado
     * @param {HTMLElement} messageElement - O elemento da mensagem que mostra o resultado
     */
    async _executeQueryCommand(processedCommand, messageElement) {
        let result = '';

        // Determinar o tipo de consulta
        switch (processedCommand.action) {
            case 'listar_usuarios':
            case 'mostrar_usuarios':
                const usersSnapshot = await firebase.database().ref('users').limitToFirst(10).once('value');
                const users = usersSnapshot.val();

                if (users) {
                    result = `<h4>Usuários (top 10)</h4>
                    <table class="gemini-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(users).map(([id, user]) => `
                                <tr>
                                    <td>${user.name || 'N/A'}</td>
                                    <td>${user.email || 'N/A'}</td>
                                    <td>${user.status || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                } else {
                    result = 'Não encontrei nenhum usuário no sistema.';
                }
                break;

            case 'listar_portas':
            case 'mostrar_portas':
                const doorsSnapshot = await firebase.database().ref('doors').once('value');
                const doors = doorsSnapshot.val();

                if (doors) {
                    result = `<h4>Portas</h4>
                    <table class="gemini-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Localização</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(doors).map(([id, door]) => `
                                <tr>
                                    <td>${door.name || 'N/A'}</td>
                                    <td>${door.location || 'N/A'}</td>
                                    <td>${door.status === 'locked' ? '🔒 Trancada' : '🔓 Destrancada'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                } else {
                    result = 'Não encontrei nenhuma porta no sistema.';
                }
                break;

            case 'dispositivos_offline':
            case 'mostrar_dispositivos_offline':
                const devicesSnapshot = await firebase.database().ref('devices').orderByChild('status').equalTo('offline').once('value');
                const offlineDevices = devicesSnapshot.val();

                if (offlineDevices) {
                    result = `<h4>Dispositivos Offline</h4>
                    <table class="gemini-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Tipo</th>
                                <th>Última Atividade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(offlineDevices).map(([id, device]) => `
                                <tr>
                                    <td>${device.name || 'N/A'}</td>
                                    <td>${device.type || 'N/A'}</td>
                                    <td>${device.lastActivity ? new Date(device.lastActivity).toLocaleString() : 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                } else {
                    result = 'Boas notícias! Não há dispositivos offline no momento.';
                }
                break;

            case 'acessos_recentes':
            case 'acessos_recusados':
            case 'mostrar_logs':
                await this._executeLogsAnalysisCommand(processedCommand, messageElement);
                return;

            case 'resumo_sistema':
            case 'status_sistema':
                // Coletar estatísticas diversas
                const [usersCount, doorsCount, devicesCount, logsCount] = await Promise.all([
                    firebase.database().ref('users').once('value').then(snap => snap.exists() ? Object.keys(snap.val()).length : 0),
                    firebase.database().ref('doors').once('value').then(snap => snap.exists() ? Object.keys(snap.val()).length : 0),
                    firebase.database().ref('devices').once('value').then(snap => snap.exists() ? Object.keys(snap.val()).length : 0),
                    firebase.database().ref('access_logs').limitToFirst(1000).once('value').then(snap => snap.exists() ? Object.keys(snap.val()).length : 0)
                ]);

                // Estatísticas de portas (trancadas/destrancadas)
                const doorStats = await firebase.database().ref('doors').once('value').then(snap => {
                    if (!snap.exists()) return { locked: 0, unlocked: 0 };
                    const doors = snap.val();
                    return {
                        locked: Object.values(doors).filter(d => d.status === 'locked').length,
                        unlocked: Object.values(doors).filter(d => d.status === 'unlocked').length
                    };
                });

                // Estatísticas de dispositivos (online/offline)
                const deviceStats = await firebase.database().ref('devices').once('value').then(snap => {
                    if (!snap.exists()) return { online: 0, offline: 0, warning: 0 };
                    const devices = snap.val();
                    return {
                        online: Object.values(devices).filter(d => d.status === 'online').length,
                        offline: Object.values(devices).filter(d => d.status === 'offline').length,
                        warning: Object.values(devices).filter(d => d.status === 'warning').length
                    };
                });

                // Montar resumo
                result = `
                <h4>Resumo do Sistema</h4>
                <div class="gemini-dashboard">
                    <div class="gemini-stat-card">
                        <div class="gemini-stat-icon"><i class="fas fa-users"></i></div>
                        <div class="gemini-stat-value">${usersCount}</div>
                        <div class="gemini-stat-label">Usuários</div>
                    </div>
                    
                    <div class="gemini-stat-card">
                        <div class="gemini-stat-icon"><i class="fas fa-door-open"></i></div>
                        <div class="gemini-stat-value">${doorsCount}</div>
                        <div class="gemini-stat-label">Portas</div>
                    </div>
                    
                    <div class="gemini-stat-card">
                        <div class="gemini-stat-icon"><i class="fas fa-microchip"></i></div>
                        <div class="gemini-stat-value">${devicesCount}</div>
                        <div class="gemini-stat-label">Dispositivos</div>
                    </div>
                    
                    <div class="gemini-stat-card">
                        <div class="gemini-stat-icon"><i class="fas fa-clipboard-list"></i></div>
                        <div class="gemini-stat-value">${logsCount}+</div>
                        <div class="gemini-stat-label">Logs</div>
                    </div>
                </div>
                
                <div class="gemini-info-grid">
                    <div class="gemini-info-item">
                        <h5>Status das Portas</h5>
                        <div class="gemini-info-data">
                            <div class="gemini-info-point">
                                <span class="gemini-info-icon" style="color: #28a745;"><i class="fas fa-lock"></i></span>
                                <span class="gemini-info-text">${doorStats.locked} Trancadas</span>
                            </div>
                            <div class="gemini-info-point">
                                <span class="gemini-info-icon" style="color: #dc3545;"><i class="fas fa-lock-open"></i></span>
                                <span class="gemini-info-text">${doorStats.unlocked} Destrancadas</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gemini-info-item">
                        <h5>Status dos Dispositivos</h5>
                        <div class="gemini-info-data">
                            <div class="gemini-info-point">
                                <span class="gemini-info-icon" style="color: #28a745;"><i class="fas fa-check-circle"></i></span>
                                <span class="gemini-info-text">${deviceStats.online} Online</span>
                            </div>
                            <div class="gemini-info-point">
                                <span class="gemini-info-icon" style="color: #dc3545;"><i class="fas fa-times-circle"></i></span>
                                <span class="gemini-info-text">${deviceStats.offline} Offline</span>
                            </div>
                            <div class="gemini-info-point">
                                <span class="gemini-info-icon" style="color: #ffc107;"><i class="fas fa-exclamation-triangle"></i></span>
                                <span class="gemini-info-text">${deviceStats.warning} Alerta</span>
                            </div>
                        </div>
                    </div>
                </div>`;
                break;

            default:
                result = `Não entendi completamente sua consulta. Por favor, tente novamente com um dos seguintes comandos: 
                <ul>
                    <li>Mostrar usuários</li>
                    <li>Listar portas</li>
                    <li>Dispositivos offline</li>
                    <li>Acessos recentes</li>
                    <li>Status do sistema</li>
                </ul>`;
        }

        // Atualizar a mensagem com o resultado
        this._updateMessage(messageElement, 'assistant', result);
    }

    /**
     * Executa um comando de ação
     * @private
     * @param {Object} processedCommand - O comando processado
     * @param {HTMLElement} messageElement - O elemento da mensagem que mostra o resultado
     */
    async _executeActionCommand(processedCommand, messageElement) {
        let result = '';

        switch (processedCommand.action) {
            case 'trancar_porta':
            case 'destrancar_porta':
                // Verificar se temos uma entidade de porta
                const doorEntity = processedCommand.entities?.find(e => e.type === 'door');
                if (!doorEntity || !doorEntity.id) {
                    this._updateMessage(messageElement, 'assistant', 'Preciso saber qual porta você deseja controlar. Por favor, especifique a porta pelo nome.');
                    return;
                }

                // Buscar a porta no Firebase
                const doorSnapshot = await firebase.database().ref(`doors/${doorEntity.id}`).once('value');
                const door = doorSnapshot.val();

                if (!door) {
                    this._updateMessage(messageElement, 'assistant', `Não encontrei uma porta com o ID '${doorEntity.id}'. Por favor, verifique o nome e tente novamente.`);
                    return;
                }

                // Atualizar o status da porta
                const newStatus = processedCommand.action === 'trancar_porta' ? 'locked' : 'unlocked';

                await firebase.database().ref(`doors/${doorEntity.id}`).update({
                    status: newStatus,
                    last_status_change: new Date().toISOString()
                });

                // Registrar log de acesso
                const user = firebase.auth().currentUser;
                if (user) {
                    await firebase.database().ref('access_logs').push({
                        user_id: user.uid,
                        user_name: user.displayName || user.email,
                        door_id: doorEntity.id,
                        door_name: door.name,
                        action: newStatus === 'locked' ? 'door_locked' : 'door_unlocked',
                        method: 'gemini',
                        timestamp: new Date().toISOString()
                    });
                }

                result = `Porta "${door.name}" ${newStatus === 'locked' ? 'trancada' : 'destrancada'} com sucesso.`;
                break;

            case 'reiniciar_dispositivo':
                // Verificar se temos uma entidade de dispositivo
                const deviceEntity = processedCommand.entities?.find(e => e.type === 'device');
                if (!deviceEntity || !deviceEntity.id) {
                    this._updateMessage(messageElement, 'assistant', 'Preciso saber qual dispositivo você deseja reiniciar. Por favor, especifique o dispositivo pelo nome.');
                    return;
                }

                // Em um sistema real, enviaríamos um comando para reiniciar o dispositivo
                // Aqui vamos apenas simular com um atraso
                this._updateMessage(messageElement, 'assistant', `Enviando comando para reiniciar o dispositivo "${deviceEntity.name || deviceEntity.id}"...`);

                // Simular um atraso
                await new Promise(resolve => setTimeout(resolve, 2000));

                result = `Dispositivo "${deviceEntity.name || deviceEntity.id}" reiniciado com sucesso. O dispositivo deve ficar online em alguns instantes.`;
                break;

            case 'analisar_logs':
                this._updateMessage(messageElement, 'assistant', 'Analisando logs de acesso recentes para identificar padrões...');

                // Buscar logs recentes
                const recentLogsSnapshot = await firebase.database().ref('access_logs').limitToLast(100).once('value');
                const recentLogs = recentLogsSnapshot.val();

                if (!recentLogs) {
                    result = 'Não encontrei logs de acesso suficientes para análise.';
                    break;
                }

                // Simular processamento
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Contar tipos de ações
                const logArray = Object.values(recentLogs);
                const accessGranted = logArray.filter(log => log.action === 'access_granted').length;
                const accessDenied = logArray.filter(log => log.action === 'access_denied').length;
                const doorLocked = logArray.filter(log => log.action === 'door_locked').length;
                const doorUnlocked = logArray.filter(log => log.action === 'door_unlocked').length;

                // Calcular porcentagem de acesso negado
                const accessDeniedPercent = Math.round((accessDenied / (accessGranted + accessDenied)) * 100) || 0;

                // Identificar horários de pico
                const hourCounts = {};
                logArray.forEach(log => {
                    if (log.timestamp) {
                        const hour = new Date(log.timestamp).getHours();
                        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                    }
                });

                // Encontrar a hora com mais acessos
                let peakHour = 0;
                let peakCount = 0;
                Object.entries(hourCounts).forEach(([hour, count]) => {
                    if (count > peakCount) {
                        peakHour = hour;
                        peakCount = count;
                    }
                });

                result = `
                <h4>Análise de Logs de Acesso</h4>
                <p>Analisei os últimos ${logArray.length} registros de acesso e encontrei os seguintes padrões:</p>
                
                <div class="gemini-analysis">
                    <div class="gemini-chart">
                        <div class="gemini-chart-bar-container">
                            <div class="gemini-chart-label">Acessos Permitidos</div>
                            <div class="gemini-chart-bar" style="width: ${(accessGranted / logArray.length * 100).toFixed(1)}%; background-color: #28a745;">
                                <span>${accessGranted}</span>
                            </div>
                        </div>
                        <div class="gemini-chart-bar-container">
                            <div class="gemini-chart-label">Acessos Negados</div>
                            <div class="gemini-chart-bar" style="width: ${(accessDenied / logArray.length * 100).toFixed(1)}%; background-color: #dc3545;">
                                <span>${accessDenied}</span>
                            </div>
                        </div>
                        <div class="gemini-chart-bar-container">
                            <div class="gemini-chart-label">Portas Trancadas</div>
                            <div class="gemini-chart-bar" style="width: ${(doorLocked / logArray.length * 100).toFixed(1)}%; background-color: #6c757d;">
                                <span>${doorLocked}</span>
                            </div>
                        </div>
                        <div class="gemini-chart-bar-container">
                            <div class="gemini-chart-label">Portas Destrancadas</div>
                            <div class="gemini-chart-bar" style="width: ${(doorUnlocked / logArray.length * 100).toFixed(1)}%; background-color: #17a2b8;">
                                <span>${doorUnlocked}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gemini-insights">
                        <div class="gemini-insight">
                            <i class="fas fa-chart-line"></i>
                            <div>
                                <h5>Taxa de Negação</h5>
                                <p>A taxa de negação de acesso é de <strong>${accessDeniedPercent}%</strong>.</p>
                                <p>${accessDeniedPercent > 20 ? 'Esta taxa está acima do ideal. Considere revisar as permissões de acesso.' : 'Esta taxa está dentro do esperado.'}</p>
                            </div>
                        </div>
                        
                        <div class="gemini-insight">
                            <i class="fas fa-clock"></i>
                            <div>
                                <h5>Horário de Pico</h5>
                                <p>O horário com mais atividade é <strong>${peakHour}:00</strong> com ${peakCount} acessos.</p>
                            </div>
                        </div>
                    </div>
                </div>`;
                break;

            case 'limpar_logs':
                // Aqui simularemos apenas, em um sistema real precisaríamos de permissões
                this._updateMessage(messageElement, 'assistant', `Esta ação requer permissão de administrador e não foi implementada na interface de assistente por motivos de segurança.`);
                return;

            default:
                result = `Não consegui executar a ação "${processedCommand.action}". Esta ação não está disponível ou não foi implementada.`;
        }

        // Atualizar a mensagem com o resultado
        this._updateMessage(messageElement, 'assistant', result);
    }

    /**
     * Executa um comando de configuração
     * @private
     * @param {Object} processedCommand - O comando processado
     * @param {HTMLElement} messageElement - O elemento da mensagem que mostra o resultado
     */
    async _executeConfigCommand(processedCommand, messageElement) {
        // Na maioria dos casos, configurações sensíveis não devem ser feitas via assistente
        this._updateMessage(messageElement, 'assistant', `
            <p>Por motivos de segurança, configurações do sistema só podem ser feitas através da interface administrativa.</p>
            <p>Por favor, acesse a página de configurações do sistema para modificar as configurações.</p>
        `);
    }

    /**
     * Adiciona uma mensagem à conversa
     * @private
     * @param {string} role - Papel do remetente ('user' ou 'assistant')
     * @param {string} content - Conteúdo da mensagem
     * @returns {HTMLElement} O elemento da mensagem criado
     */
    _addMessage(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `gemini-message gemini-${role}-message`;

        // Adicionar avatar para o assistente
        if (role.startsWith('assistant')) {
            messageElement.innerHTML = `
                <div class="gemini-message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="gemini-message-content">${content}</div>
            `;
        } else {
            messageElement.innerHTML = `<div class="gemini-message-content">${content}</div>`;
        }

        this.conversationContainer.appendChild(messageElement);
        this._scrollToBottom();

        return messageElement;
    }

    /**
     * Atualiza o conteúdo de uma mensagem existente
     * @private
     * @param {HTMLElement} messageElement - O elemento da mensagem a ser atualizado
     * @param {string} role - Papel do remetente ('user' ou 'assistant')
     * @param {string} content - Novo conteúdo da mensagem
     */
    _updateMessage(messageElement, role, content) {
        // Atualizar a classe se necessário
        if (!messageElement.className.includes(`gemini-${role}-message`)) {
            messageElement.className = `gemini-message gemini-${role}-message`;
        }

        // Atualizar apenas o conteúdo da mensagem
        const contentElement = messageElement.querySelector('.gemini-message-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        } else {
            // Se por algum motivo o elemento de conteúdo não existir, recriar a mensagem
            if (role.startsWith('assistant')) {
                messageElement.innerHTML = `
                    <div class="gemini-message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="gemini-message-content">${content}</div>
                `;
            } else {
                messageElement.innerHTML = `<div class="gemini-message-content">${content}</div>`;
            }
        }

        this._scrollToBottom();
    }

    /**
     * Rola a conversa para o final
     * @private
     */
    _scrollToBottom() {
        const container = this.container.querySelector('.gemini-conversation-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * Formata a resposta para exibição
     * @private
     * @param {string} response - Resposta bruta do Gemini
     * @returns {string} Resposta formatada com HTML
     */
    _formatResponse(response) {
        if (!response) return '';

        // Formatar código
        let formatted = response.replace(/```([\s\S]*?)```/g, (match, p1) => {
            const codeContent = p1.replace(/^(\w+)\n/, ''); // Remove a primeira linha se for o nome da linguagem
            return `<pre class="gemini-code-block"><code>${this._escapeHtml(codeContent)}</code></pre>`;
        });

        // Formatar trechos de código inline
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Formatar listas
        formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

        // Formatar títulos
        formatted = formatted.replace(/^#+\s+(.+)$/gm, (match, p1) => {
            const level = match.match(/^#+/)[0].length;
            return `<h${level + 3}>${p1}</h${level + 3}>`;
        });

        // Formatar parágrafos
        formatted = formatted.split('\n\n').map(p => {
            // Ignorar blocos que já têm HTML
            if (p.trim().startsWith('<') || p.trim() === '') return p;
            return `<p>${p}</p>`;
        }).join('\n');

        // Formatar quebras de linha
        formatted = formatted.replace(/\n(?!<)/g, '<br>');

        return formatted;
    }

    /**
     * Escapa caracteres HTML
     * @private
     * @param {string} html - String com possíveis caracteres HTML
     * @returns {string} String com caracteres HTML escapados
     */
    _escapeHtml(html) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return html.replace(/[&<>"']/g, m => escapeMap[m]);
    }

    /**
     * Alterna a visibilidade do assistente
     * @param {boolean} [visible] - Estado de visibilidade desejado (opcional)
     */
    toggle(visible) {
        // Se visible for undefined, invertemos o estado atual
        this.visible = visible !== undefined ? visible : !this.visible;

        // Atualizar classes e ícones
        if (this.visible) {
            this.container.classList.remove('gemini-minimized');
            this.container.querySelector('.gemini-toggle-btn i').className = 'fas fa-minus';
        } else {
            this.container.classList.add('gemini-minimized');
            this.container.querySelector('.gemini-toggle-btn i').className = 'fas fa-expand-arrows-alt';
        }
    }

    /**
     * Limpa a conversa atual
     */
    clearConversation() {
        // Limpar o conteúdo da conversa
        this.conversationContainer.innerHTML = '';

        // Limpar a conversa no serviço
        window.geminiService.clearConversation();

        // Adicionar mensagem de boas-vindas
        this._addMessage('assistant', 'Conversa limpa. Como posso ajudar?');
    }

    /**
     * Gera insights com base nos dados do sistema
     */
    async generateInsights() {
        // Carregar dados do sistema
        const systemData = await this._loadSystemData();

        try {
            // Gerar insights via Gemini
            const insights = await window.geminiService.generateInsights(systemData);

            // Exibir insights no painel de insights
            this._displayInsights(insights);
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
        }
    }

    /**
     * Exibe insights no painel lateral
     * @private
     * @param {Object} insights - Insights gerados
     */
    _displayInsights(insights) {
        // Implementação da exibição de insights no painel lateral (a ser implementada)
        console.log('Insights gerados:', insights);
    }
}

// Inicializar e exportar o assistente
const geminiAssistant = new GeminiAssistant();

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        geminiAssistant.init();
    }, 1000); // Pequeno atraso para garantir que outros scripts sejam carregados
});

// Para uso em um ambiente modular (como com webpack, rollup, etc.)
//export default geminiAssistant;

// Para uso com scripts regulares
window.geminiAssistant = geminiAssistant;