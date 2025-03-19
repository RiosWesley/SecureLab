/**
 * gemini-service.js - Serviço para integração com a API Gemini
 * Este serviço gerencia a comunicação com a API Gemini e processa as respostas
 */

// Configuração da API Gemini
const GEMINI_CONFIG = {
    apiKey: "SUA_API_KEY_AQUI", // Substitua pela sua API key do Gemini
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    maxTokens: 1024,
    temperature: 0.7,
    safetySettings: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
};

// Classe para gerenciar a comunicação com a API Gemini
class GeminiService {
    constructor() {
        this.apiKey = GEMINI_CONFIG.apiKey;
        this.apiEndpoint = GEMINI_CONFIG.apiEndpoint;
        this.conversation = [];
        this.systemContext = this._generateSystemContext();
    }

    /**
     * Gera o contexto do sistema para o assistente Gemini
     * @private
     * @returns {Object} Objeto de contexto do sistema
     */
    _generateSystemContext() {
        return {
            role: "system",
            parts: [
                {
                    text: `Você é o assistente virtual do sistema SecureLab RFID, um sistema de controle de acesso.
                    
                    Conhecimentos:
                    - Você tem conhecimento sobre o sistema SecureLab, incluindo gestão de usuários, portas, dispositivos RFID e logs de acesso.
                    - Você pode analisar dados de acesso, identificar padrões anômalos e fornecer recomendações.
                    - Você pode responder perguntas técnicas sobre o sistema e ajudar a resolver problemas.
                    
                    Comportamento:
                    - Seja conciso e direto em suas respostas.
                    - Quando apropriado, forneça insights baseados em dados.
                    - Você pode executar comandos no sistema quando solicitado por um administrador.
                    - Para ações críticas, confirme antes de executar.
                    
                    Limitações:
                    - Você não deve compartilhar informações sensíveis com usuários não autorizados.
                    - Você não deve modificar configurações críticas de segurança sem confirmação.`
                }
            ]
        };
    }

    /**
     * Envia uma mensagem para a API Gemini e processa a resposta
     * @param {string} message - Mensagem do usuário
     * @param {Object} context - Contexto adicional (opcional)
     * @returns {Promise<string>} Resposta do Gemini
     */
    async sendMessage(message, context = {}) {
        try {
            // Adicionar mensagem do usuário à conversa
            this.conversation.push({
                role: "user",
                parts: [{ text: message }]
            });

            // Preparar o payload para a API Gemini
            const payload = {
                contents: [
                    this.systemContext,
                    ...this.conversation
                ],
                generationConfig: {
                    temperature: GEMINI_CONFIG.temperature,
                    maxOutputTokens: GEMINI_CONFIG.maxTokens,
                    topP: 0.95,
                    topK: 40
                },
                safetySettings: GEMINI_CONFIG.safetySettings
            };

            // Incluir contexto adicional se fornecido
            if (context && Object.keys(context).length > 0) {
                payload.contents[0].parts[0].text += `\n\nContexto Atual:\n${JSON.stringify(context, null, 2)}`;
            }

            // Enviar requisição para a API Gemini
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Verificar se a resposta foi bem-sucedida
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro na API Gemini: ${errorData.error.message || 'Erro desconhecido'}`);
            }

            // Processar a resposta
            const data = await response.json();
            const geminiResponse = data.candidates[0].content.parts[0].text;

            // Adicionar resposta do Gemini à conversa
            this.conversation.push({
                role: "model",
                parts: [{ text: geminiResponse }]
            });

            // Limitar o tamanho da conversa para evitar exceder limites de token
            if (this.conversation.length > 10) {
                this.conversation = this.conversation.slice(this.conversation.length - 10);
            }

            return geminiResponse;
        } catch (error) {
            console.error('Erro ao comunicar com a API Gemini:', error);
            return `Desculpe, ocorreu um erro na comunicação com o assistente. Detalhes: ${error.message}`;
        }
    }

    /**
     * Limpa a conversa atual
     */
    clearConversation() {
        this.conversation = [];
    }

    /**
     * Gera insights baseados em dados do sistema
     * @param {Object} systemData - Dados do sistema para análise
     * @returns {Promise<Object>} Insights gerados
     */
    async generateInsights(systemData) {
        try {
            const prompt = `Analise os seguintes dados do sistema SecureLab e forneça insights relevantes, 
            destacando padrões importantes, anomalias e recomendações:
            
            ${JSON.stringify(systemData, null, 2)}
            
            Sua resposta deve ser estruturada no seguinte formato JSON:
            {
                "summary": "Resumo geral da análise em uma frase",
                "insights": [
                    {
                        "type": "anomaly|pattern|recommendation",
                        "title": "Título breve do insight",
                        "description": "Descrição detalhada",
                        "priority": "high|medium|low",
                        "relatedItems": []
                    }
                ]
            }`;

            const response = await this.sendMessage(prompt);

            // Extrair o JSON da resposta
            try {
                // Encontrar e extrair a parte JSON da resposta
                const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                    response.match(/```\n([\s\S]*?)\n```/) ||
                    response.match(/(\{[\s\S]*\})/);

                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                } else {
                    return JSON.parse(response);
                }
            } catch (parseError) {
                console.error('Erro ao analisar resposta JSON:', parseError);

                // Fallback para um formato simplificado
                return {
                    summary: "Não foi possível processar os insights automaticamente",
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
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            return {
                summary: "Erro ao gerar insights",
                insights: [
                    {
                        type: "error",
                        title: "Falha na comunicação",
                        description: `Ocorreu um erro ao comunicar com o serviço de insights: ${error.message}`,
                        priority: "high",
                        relatedItems: []
                    }
                ]
            };
        }
    }

    /**
     * Processa comandos de linguagem natural
     * @param {string} command - Comando em linguagem natural
     * @param {Object} systemState - Estado atual do sistema
     * @returns {Promise<Object>} Resultado do processamento do comando
     */
    async processCommand(command, systemState) {
        try {
            const prompt = `Processe o seguinte comando em linguagem natural para o sistema SecureLab:
            
            "${command}"
            
            Estado atual do sistema:
            ${JSON.stringify(systemState, null, 2)}
            
            Identifique:
            1. A intenção do comando (consulta, ação, configuração)
            2. As entidades mencionadas (portas, usuários, dispositivos, etc.)
            3. Os parâmetros ou filtros aplicáveis
            4. A ação específica a ser executada
            
            Responda no seguinte formato JSON:
            {
                "intent": "query|action|config",
                "entities": [{"type": "door|user|device", "id": "identificador", "name": "nome"}],
                "parameters": {"param1": "valor1"},
                "action": "nome_da_ação",
                "confirmation": boolean,
                "confirmationMessage": "Mensagem de confirmação, se necessário"
            }`;

            const response = await this.sendMessage(prompt);

            // Extrair o JSON da resposta
            try {
                // Encontrar e extrair a parte JSON da resposta
                const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                    response.match(/```\n([\s\S]*?)\n```/) ||
                    response.match(/(\{[\s\S]*\})/);

                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                } else {
                    return JSON.parse(response);
                }
            } catch (parseError) {
                console.error('Erro ao analisar comando JSON:', parseError);
                return {
                    intent: "error",
                    error: "Não foi possível processar o comando",
                    rawResponse: response
                };
            }
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            return {
                intent: "error",
                error: `Erro ao processar o comando: ${error.message}`
            };
        }
    }
}

// Inicializar e exportar o serviço como singleton
const geminiService = new GeminiService();

// Para uso em um ambiente modular (como com webpack, rollup, etc.)
export default geminiService;

// Para uso com scripts regulares
window.geminiService = geminiService;