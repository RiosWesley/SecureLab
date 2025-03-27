# Documentação da Integração Gemini no SecureLab

## 1. Visão Geral

Esta documentação descreve a arquitetura e o funcionamento da integração da API Google Gemini no sistema SecureLab RFID. O objetivo principal dessa integração é fornecer:

1.  **Insights Inteligentes:** Análise automática dos dados do sistema (logs, dispositivos, portas, usuários) para identificar anomalias, padrões e recomendações, exibidos no painel de "Insights" do dashboard.
2.  **Assistente de Chat:** Uma interface de chat onde os administradores podem fazer perguntas em linguagem natural sobre os dados do sistema e receber respostas contextuais geradas pela IA.

A arquitetura foi **refatorada** para ser mais modular e centralizada, facilitando a manutenção e customização.

## 2. Arquitetura e Componentes Principais

A integração é composta pelos seguintes arquivos JavaScript principais:

*   **`js/gemini-config.js`**:
    *   **Responsabilidade:** Armazena **todas** as configurações relacionadas à API Gemini e ao comportamento da integração.
    *   **Conteúdo:** Chave da API, endpoint, parâmetros de geração (temperatura, maxTokens), configurações de segurança, limites de busca de dados, tempo de cache, flags de inicialização da UI.
    *   **Importância:** Arquivo central para ajustes de parâmetros sem precisar modificar a lógica principal.

*   **`js/gemini-service.js`**:
    *   **Responsabilidade:** O **cérebro** da integração. É o único componente que interage diretamente com a API Gemini.
    *   **Funcionalidades:**
        *   Busca e faz cache dos dados relevantes do Firebase (`_fetchSystemData`).
        *   Constrói os prompts do sistema (`_buildSystemPrompt`), incluindo o contexto dos dados do Firebase.
        *   Chama a API Gemini (`_callGeminiAPI`) para gerar insights ou respostas de chat.
        *   Gerencia o histórico de conversas do chat.
        *   Oferece métodos públicos (`generateInsights`, `sendMessageToChat`) para os componentes de UI.
    *   **Importância:** Centraliza a lógica de comunicação com a API e o tratamento dos dados, desacoplando a UI.

*   **`js/simplified-gemini-insights.js`**:
    *   **Responsabilidade:** Componente de **Interface do Usuário (UI)** para o painel de Insights no dashboard.
    *   **Funcionalidades:**
        *   Renderiza a estrutura HTML do painel de insights.
        *   Chama `geminiService.generateInsights()` para obter os dados.
        *   Exibe os insights recebidos, formatando a descrição usando Markdown (`_formatResponse`).
        *   Gerencia o estado de carregamento e o auto-refresh.
        *   **NÃO** busca dados do Firebase diretamente.
        *   **NÃO** chama a API Gemini diretamente.

*   **`js/gemini-assistant.js`**:
    *   **Responsabilidade:** Componente de **Interface do Usuário (UI)** para o chat do assistente.
    *   **Funcionalidades:**
        *   Renderiza a janela de chat.
        *   Captura a entrada do usuário.
        *   Chama `geminiService.sendMessageToChat()` para enviar a mensagem e receber a resposta.
        *   Exibe a conversa (mensagens do usuário e do assistente), formatando as respostas do assistente usando Markdown (`_formatResponse`).
        *   Gerencia o estado de visibilidade (minimizado/expandido) e a limpeza da conversa.
        *   **NÃO** busca dados do Firebase diretamente.
        *   **NÃO** chama a API Gemini diretamente.

*   **`dashboard.html`**:
    *   **Responsabilidade:** Carrega todos os scripts na ordem correta e fornece os elementos HTML container (e.g., `#gemini-insights-container`) onde os componentes de UI são inicializados.

*   **`css/gemini-insights.css`, `css/gemini-assistant.css`**:
    *   **Responsabilidade:** Estilização visual dos componentes de UI.

## 3. Fluxo de Dados e Interação

### 3.1 Geração de Insights

1.  O `SimplifiedInsights` (UI) é inicializado ou o timer de refresh dispara.
2.  Ele chama `window.geminiService.generateInsights()`.
3.  O `GeminiService`:
    a.  Verifica seu cache de dados do Firebase (`systemDataContext`).
    b.  Se o cache expirou ou está vazio, chama `_fetchSystemData()` para buscar dados atualizados do Firebase (usuários, portas, dispositivos, logs recentes) dentro dos limites definidos em `gemini-config.js`. Os dados são armazenados no cache.
    c.  Chama `_buildSystemPrompt()`, passando os dados buscados e a opção `{ isInsightRequest: true }` para gerar o prompt específico para insights, instruindo a API a retornar JSON e usar o contexto.
    d.  Chama `_callGeminiAPI()` com o prompt do sistema e a mensagem de usuário específica para gerar insights (sem histórico de chat).
    e.  Recebe a resposta **JSON (string)** da API, valida se é um JSON válido.
    f.  Parseia o JSON e o retorna para `SimplifiedInsights`.
4.  O `SimplifiedInsights` (UI) recebe o objeto de insights.
5.  Renderiza o sumário e a lista de insights, usando `_formatResponse()` para formatar as descrições individuais.

### 3.2 Conversa no Chat

1.  O usuário digita uma mensagem no `GeminiAssistant` (UI) e clica em enviar.
2.  A UI chama `window.geminiService.sendMessageToChat(userMessage)`.
3.  O `GeminiService`:
    a.  Verifica/atualiza o cache de dados do Firebase via `_fetchSystemData()` (se necessário).
    b.  Chama `_buildSystemPrompt()`, passando os dados e `{ isInsightRequest: false }` para gerar o prompt de chat, instruindo a API a responder em linguagem natural e usar o contexto.
    c.  Adiciona a mensagem atual do usuário ao histórico de conversa local (`this.conversationHistory`).
    d.  Prepara o payload para a API, incluindo o histórico de conversa relevante e a mensagem atual.
    e.  Chama `_callGeminiAPI()` com o prompt do sistema e o payload da conversa.
    f.  Recebe a resposta em **texto** da API.
    g.  Adiciona a resposta do modelo (IA) ao histórico de conversa local.
    h.  Retorna o texto da resposta para `GeminiAssistant`.
4.  O `GeminiAssistant` (UI) recebe o texto da resposta.
5.  Usa `_formatResponse()` para converter o Markdown da resposta em HTML.
6.  Exibe a resposta formatada na janela de chat.

## 4. Configuração (`js/gemini-config.js`)

Este arquivo é o principal ponto para ajustes:

*   **`apiKey`**: (String) **OBRIGATÓRIO**. Sua chave de API do Google AI Studio. **Mantenha em segredo!**
*   **`apiEndpoint`**: (String) **OBRIGATÓRIO**. A URL do modelo Gemini que você deseja usar (e.g., `gemini-1.5-flash-latest`).
*   **`maxTokens`**: (Number) Número máximo de tokens na resposta da IA. Afeta o tamanho da resposta.
*   **`temperature`**: (Number, 0.0 a 1.0) Controla a "criatividade" da IA. Valores mais baixos (e.g., 0.2 - 0.3) são melhores para análise factual e insights; valores mais altos para conversas mais criativas.
*   **`safetySettings`**: (Array) Configurações de segurança para bloquear conteúdo indesejado. Mantenha os padrões a menos que tenha um motivo específico.
*   **`assistant.initiallyOpen`, `assistant.autoInitialize`, etc.**: (Boolean/Number) Controlam o comportamento inicial da UI do chat (se abre sozinho, delay, etc.).
*   **`insights.autoRefresh`, `insights.refreshInterval`, `insights.maxInsights`**: (Boolean/Number) Controlam o auto-refresh e o número máximo de insights exibidos na UI do dashboard.
*   **`dataCache.ttlSeconds`**: (Number) **IMPORTANTE.** Tempo (em segundos) que os dados do Firebase ficam em cache no `GeminiService` antes de serem buscados novamente. Um valor baixo (e.g., 60) significa dados mais frescos, mas mais leituras do Firebase. Um valor alto (e.g., 300 = 5 min) reduz leituras, mas os insights/respostas podem demorar mais para refletir mudanças recentes.
*   **`dataLimits`**: (Object) **IMPORTANTE.** Controla quantos itens de cada tipo (usuários, portas, dispositivos, logs) são buscados do Firebase e enviados no contexto para a API Gemini.
    *   **`users`, `doors`, `devices`, `logs`**: (Number) Quantidade máxima de cada item.
    *   **`logDays`**: (Number) Quantos dias de logs *recentes* devem ser considerados na busca.
    *   **Impacto:** Ajustar esses limites afeta diretamente a quantidade de informação que a IA tem para trabalhar. Valores maiores dão mais contexto, mas aumentam o tamanho do prompt (risco de exceder limites de token da API, maior custo/latência). Valores menores são mais rápidos e baratos, mas a IA pode não ter informação suficiente.

## 5. Customização e Manutenção

### 5.1 Alterar os Prompts do Sistema

*   **Onde:** Arquivo `js/gemini-service.js`, função `_buildSystemPrompt(context, options)`.
*   **Como:** Edite o texto dentro das *template literals* (delimitadas por `` ` ``).
*   **Atenção:**
    *   Existem lógicas diferentes para gerar o prompt dependendo de `options.isInsightRequest` (true para insights, false para chat). Modifique a seção correta.
    *   **Para Insights:** Mantenha a instrução CRÍTICA para retornar **APENAS JSON** e o exemplo de formato. Alterar isso quebrará a exibição dos insights.
    *   **Para Chat:** Mantenha as instruções sobre usar linguagem natural e o contexto fornecido.
    *   **Contexto:** A seção `CONTEXTO ATUAL DO SISTEMA` é preenchida dinamicamente com os dados do Firebase. Você pode ajustar como esses dados são apresentados à IA no prompt, mas os dados em si vêm de `_fetchSystemData`.
    *   **Instruções:** Seja claro e direto nas suas instruções para a IA.

### 5.2 Alterar a Busca de Dados (Firebase)

*   **Onde:** Arquivo `js/gemini-service.js`, função `_fetchSystemData()`.
*   **O que alterar:**
    *   **Limites:** A forma mais fácil é ajustar os valores em `gemini-config.js` na seção `dataLimits`.
    *   **Lógica de Busca:** Se precisar buscar dados diferentes ou de forma diferente (e.g., filtrar usuários por status antes de enviar), modifique as queries do Firebase (`firebase.database().ref(...)`) dentro desta função.
    *   **Estrutura do Contexto:** Altere o objeto `context` retornado por esta função se quiser adicionar/remover/renomear campos que são enviados para a IA. Lembre-se de atualizar também a seção `dataSchema` e as instruções no `_buildSystemPrompt` para refletir as mudanças.
    *   **Cache:** Ajuste `dataCache.ttlSeconds` em `gemini-config.js` para controlar a frequência da busca.

### 5.3 Alterar a Formatação das Respostas (Markdown)

*   **Onde:** Arquivo `js/gemini-assistant.js` (para o chat) e `js/simplified-gemini-insights.js` (para as descrições dos insights), função `_formatResponse(response)`.
*   **Como:** Modifique as expressões regulares ou a lógica de processamento de linha para adicionar suporte a mais elementos Markdown ou alterar a forma como os elementos existentes são convertidos para HTML.

### 5.4 Alterar Aparência da UI

*   **Onde:** Arquivos `css/gemini-assistant.css` e `css/gemini-insights.css`.
*   **Como:** Modifique as regras CSS para alterar cores, fontes, espaçamentos, layout, etc.

## 6. Troubleshooting Básico

1.  **Verifique o Console do Navegador (F12):** Procure por erros de JavaScript, mensagens de `console.warn` ou `console.error` dos scripts Gemini, e erros de rede (4xx, 5xx) ao chamar a API Gemini.
2.  **Verifique `gemini-config.js`:**
    *   A `apiKey` está correta e válida?
    *   O `apiEndpoint` está correto?
3.  **Fluxo de Dados:** Use `console.log` temporariamente no `GeminiService`:
    *   Dentro de `_fetchSystemData`: Logue os `results` do Firebase para ver o que foi buscado. Logue o `context` final para ver o que está sendo cacheado.
    *   Dentro de `_buildSystemPrompt`: Logue o `promptText` para ver o prompt completo enviado à API (cuidado, pode ser grande).
    *   Dentro de `_callGeminiAPI`: Logue o `payload` (antes de enviar) e o `data` (resposta da API) para depuração detalhada.
4.  **Erro de JSON (Insights):** Se os insights não aparecem e o erro menciona JSON inválido, verifique o prompt (`_buildSystemPrompt` para `isInsightRequest: true`) para garantir que a instrução de retornar *apenas* JSON está clara e não foi modificada acidentalmente. Verifique também a resposta bruta da API.
5.  **Resposta Incorreta (Chat/Insights):** Se a IA não usa os dados corretamente, revise:
    *   O contexto enviado no prompt (`console.log` em `_buildSystemPrompt`). Os dados relevantes estão lá?
    *   As instruções no prompt. Elas dizem claramente para usar o contexto fornecido?

## 7. Conclusão

Esta arquitetura centralizada no `GeminiService` torna a integração mais robusta e fácil de manter. A configuração clara em `gemini-config.js` e os prompts definidos em `_buildSystemPrompt` são os principais pontos para customização do comportamento da IA e dos dados utilizados. Os componentes de UI (`GeminiAssistant`, `SimplifiedInsights`) focam apenas na apresentação e interação com o usuário.