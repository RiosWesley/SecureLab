/**
 * gemini-service.js - Serviço para integração com a API Gemini
 * Este serviço gerencia a comunicação com a API Gemini e processa as respostas
 */

// Configuração da API Gemini
const GEMINI_CONFIG = {
    apiKey: "AIzaSyB_zYq8J9iAGLjqjLvHa5JaR6MvdLvPp4k", // Substitua pela sua API key do Gemini
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    maxTokens: 1024,
    temperature: 0.7,
    systemInstruction: "Responda diretamente às perguntas do usuário sem mostrar seu processo de pensamento. Forneça apenas a resposta final.",
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
            role: "user",
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
    /**
     * Envia uma mensagem para a API Gemini e processa a resposta
     * @param {string} message - Mensagem do usuário
     * @param {Object} context - Contexto adicional (opcional)
     * @param {Object} options - Opções adicionais
     * @param {boolean} options.isConversation - Se é uma conversa natural (não estruturada)
     * @returns {Promise<string>} Resposta do Gemini
     */
    async sendMessage(message, context = {}, options = {}) {
        try {
            // Definir se é uma conversa natural ou uma solicitação estruturada
            const isConversation = options.isConversation !== false; // Por padrão, assumir que é conversa

            // Adicionar mensagem do usuário à conversa
            this.conversation.push({
                role: "user",
                parts: [{ text: message }]
            });

            // Criar estrutura para envio
            let contents = [];

            // Se for a primeira mensagem ou tivermos um novo contexto
            if (this.conversation.length <= 3 || Object.keys(context).length > 0) {
                // Instruções específicas para o modelo
                let systemPrompt = "";

                if (isConversation) {
                    // Para conversas naturais, instruir o modelo a responder diretamente
                    systemPrompt = `Você é o assistente virtual do sistema SecureLab RFID, um sistema de controle de acesso. 
                
                IMPORTANTE: Responda diretamente às perguntas do usuário de forma clara e conversacional.
                NÃO inclua seu processo de pensamento interno ou passos analíticos.
                NÃO use frases como "o usuário está perguntando sobre..."
                NÃO liste os passos que você usaria para resolver o problema.
                
                Conhecimentos:
                - Você tem conhecimento sobre o sistema SecureLab, incluindo gestão de usuários, portas, dispositivos RFID e logs de acesso.
                - Você pode analisar dados de acesso e fornecer recomendações.
                
                Comportamento:
                - Seja amigável e direto em suas respostas.
                - Use linguagem natural e fácil de entender.
                - Evite usar formatos técnicos como JSON nas suas respostas.
                - Forneça apenas a resposta final, como se fosse um assistente humano.`;
                } else {
                    // Para análises estruturadas
                    systemPrompt = `Você é o assistente analítico do sistema SecureLab RFID. 
                Forneça análises técnicas e estruturadas conforme solicitado.`;
                }

                // Adicionar contexto do sistema se disponível
                if (context && Object.keys(context).length > 0) {
                    systemPrompt += `\n\nContexto do sistema:\n${JSON.stringify(context, null, 2)}`;
                }

                // Adicionar essa mensagem no início
                contents.push({
                    role: "user",
                    parts: [{ text: systemPrompt }]
                });
            }

            // Adicionar o histórico de conversa
            contents = contents.concat(this.conversation);

            // Preparar o payload para a API Gemini
            const payload = {
                contents: contents,
                generationConfig: {
                    temperature: isConversation ? 0.7 : 0.4, // Temperatura mais baixa para respostas estruturadas
                    maxOutputTokens: GEMINI_CONFIG.maxTokens,
                    topP: 0.95,
                    topK: 64
                },
                safetySettings: GEMINI_CONFIG.safetySettings
            };

            // Enviar requisição
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(60000) // 60 segundos de timeout
            });

            // Verificar se a resposta foi bem-sucedida
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro na API Gemini: ${errorData.error?.message || 'Erro desconhecido'}`);
            }

            // Processar a resposta
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('Resposta sem conteúdo');
            }

            const geminiResponse = data.candidates[0].content.parts[0].text;

            // Se for uma conversa, verificar se a resposta contém raciocínio interno e limpar
            let cleanedResponse = geminiResponse;
            if (isConversation) {
                // Verificar por padrões de raciocínio interno e removê-los
                cleanedResponse = this._removeThinkingProcess(geminiResponse);
            }

            // Adicionar resposta do Gemini à conversa
            this.conversation.push({
                role: "model",
                parts: [{ text: cleanedResponse }]
            });

            // Limitar o tamanho da conversa para evitar exceder limites de token
            if (this.conversation.length > 10) {
                this.conversation = this.conversation.slice(this.conversation.length - 10);
            }

            return cleanedResponse;
        } catch (error) {
            console.error('Erro ao comunicar com a API Gemini:', error);
            return `Erro de comunicação: ${error.message}`;
        }
    }

    /**
     * Remove o processo de raciocínio interno da resposta do modelo
     * @private
     * @param {string} response - Resposta bruta do modelo
     * @returns {string} Resposta limpa
     */
    _removeThinkingProcess(response) {
        // Padrões comuns de raciocínio interno
        const thinkingPatterns = [
            /The user is asking .*?\./s,
            /To answer this, I need to:.*?(?=\n\n)/s,
            /Let's (?:analyze|examine|break down).*?(?=\n\n)/s,
            /I'll (?:analyze|examine|break down).*?(?=\n\n)/s,
            /First, (?:I'll|I will|let me).*?(?=\n\n)/s,
            /(?:Step|Steps)(?: \d+)?:.*?(?=\n\n)/s,
            /Let me (?:think|analyze|check).*?(?=\n\n)/s,
            /Looking at (?:the|these) (?:logs|data).*?(?=\n\n)/s,
            /Based on (?:the|these) (?:logs|data).*?, I need to.*?(?=\n\n)/s,
            /(?:Problem|Constraints|Issues):(.*?)(?:(?:\n\n)|$)/s,
            /Possible Solutions.*?(?=\n\n)/s,
            /It seems there is a mistake.*?(?=\n\n)/s,
            /Let's recount.*?(?=\n\n)/s,
            /User Access Counts.*?(?=\n\n)/s
        ];

        let cleanedResponse = response;

        // Remover cada padrão de pensamento
        thinkingPatterns.forEach(pattern => {
            cleanedResponse = cleanedResponse.replace(pattern, '');
        });

        // Remover linhas vazias extras e limpar a formatação
        cleanedResponse = cleanedResponse.replace(/\n{3,}/g, '\n\n');
        cleanedResponse = cleanedResponse.trim();

        // Se limpar demais, retornar a resposta original
        if (cleanedResponse.length < 20 && response.length > 100) {
            // Tentar uma abordagem mais conservadora
            // Manter apenas o primeiro parágrafo se for substantivo
            const firstParagraph = response.split('\n\n')[0];
            if (firstParagraph && firstParagraph.length > 30) {
                return firstParagraph;
            }
            return response;
        }

        return cleanedResponse;
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
            const prompt = `Analise os seguintes dados do sistema SecureLab e forneça insights relevantes.
        
        ${JSON.stringify(systemData, null, 2)}
        
        Responda APENAS com um JSON válido no seguinte formato sem nenhum texto adicional antes ou depois:
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
        }
        
        É extremamente importante que você responda APENAS com o JSON válido, sem comentários adicionais ou texto explicativo.`;

            const response = await this.sendMessage(prompt);

            // Tentar extrair JSON diretamente
            try {
                // Primeiro, tentar analisar a resposta inteira como JSON
                return JSON.parse(response);
            } catch (firstParseError) {
                // Se falhar, tentar extrair JSON de um bloco de código
                try {
                    const jsonMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) ||
                        response.match(/```([\s\S]*?)```/) ||
                        response.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        const jsonContent = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
                        return JSON.parse(jsonContent);
                    }

                    // Nenhum JSON encontrado, usar fallback
                    console.warn('JSON não encontrado na resposta. Usando fallback.', response);
                    return this._createFallbackInsights(response);
                } catch (secondParseError) {
                    console.error('Erro ao extrair e analisar JSON:', secondParseError);
                    return this._createFallbackInsights(response);
                }
            }
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            return this._createFallbackInsights(null, error.message);
        }
    }

// Método auxiliar para criar insights de fallback
    _createFallbackInsights(response, errorMessage = null) {
        return {
            summary: "Análise do sistema não estruturada",
            insights: [
                {
                    type: "recommendation",
                    title: errorMessage ? "Erro de comunicação" : "Resposta não estruturada",
                    description: errorMessage ||
                        "Não foi possível extrair insights estruturados. Consulte o assistente para obter uma análise detalhada.",
                    priority: "medium",
                    relatedItems: []
                }
            ],
            rawResponse: response
        };
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
//export default geminiService;

// Para uso com scripts regulares
window.geminiService = geminiService;