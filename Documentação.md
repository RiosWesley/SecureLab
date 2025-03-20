# SecureLab 2.0 - Sistema de Controle de Acesso com RFID e IoT
## Documentação Técnica Detalhada

## 1. Visão Geral do Sistema

### 1.1 Introdução

O SecureLab 2.0 é um sistema avançado de controle de acesso baseado em tecnologia RFID e IoT, projetado para proporcionar autenticação segura, monitoramento em tempo real e gerenciamento completo de acessos em instalações. O sistema integra hardware RFID com uma plataforma web e aplicativo móvel, oferecendo uma solução abrangente para segurança física.

### 1.2 Objetivos

- Autenticação segura de usuários via tecnologia RFID
- Monitoramento e controle de pontos de acesso em tempo real
- Gerenciamento centralizado de usuários, portas e dispositivos
- Geração de logs detalhados para auditoria e análise
- Interface intuitiva para administradores e usuários
- Integração com sistemas de segurança existentes
- Notificações e alertas em tempo real
- Dashboard com análises e estatísticas
- Suporte a configurações avançadas de segurança

### 1.3 Escopo

O sistema SecureLab 2.0 engloba:

- Plataforma web administrativa
- Aplicativo móvel para gerenciamento remoto
- Hardware RFID para leitura de cartões/tags
- Controladores de portas eletrônicas
- Gateway IoT para comunicação entre dispositivos
- API RESTful para integração
- Banco de dados em tempo real
- Sistema de autenticação e autorização
- Módulo de análise e relatórios

### 1.4 Arquitetura de Alto Nível

O SecureLab 2.0 segue uma arquitetura cliente-servidor com componentes IoT:

1. **Camada de Hardware**: Leitores RFID, controladores de portas e gateways IoT
2. **Camada de Backend**: Servidores API, sistema de autenticação e banco de dados
3. **Camada de Frontend**: Interface web administrativa e aplicativo móvel
4. **Camada de Comunicação**: Protocolos seguros para transferência de dados entre componentes

## 2. Arquitetura Técnica


### 2.1 Componentes do Sistema

#### 2.1.1 Hardware

- **Leitores RFID**: Dispositivos para leitura de cartões/tags RFID
- **Controladores de Porta**: Hardware que gerencia o estado físico das fechaduras


#### 2.1.2 Backend

- **Serviço de Autenticação**: Firebase Authentication
- **Banco de Dados**: Firebase Realtime Database

#### 2.1.3 Frontend

- **Interface Web**: Implementada com HTML, CSS e JavaScript

### 2.3 Tecnologias Utilizadas

- **Frontend Web**: HTML5, CSS3, JavaScript
- **Backend**: JavaScript
- **Banco de Dados**: Firebase Realtime Database
- **Autenticação**: Firebase Authentication
- **IoT**: ESP32
- **Cloud**: Firebase Hosting, Firebase Cloud Functions
- **Visualização de Dados**: Chart.js

## 3. Banco de Dados

### 3.1 Estrutura do Firebase

O Firebase Realtime Database é organizado nas seguintes coleções:

```
/users                  # Informações de usuários
/doors                  # Configurações de portas
/devices                # Informações de dispositivos
/access_logs            # Registros de tentativas de acesso
/device_logs            # Logs de atividade de dispositivos
/settings               # Configurações do sistema
/permissions            # Matriz de permissões de acesso
/schedules              # Agendamentos de acesso
```

### 3.2 Modelos de Dados

#### 3.2.1 Modelo de Usuário

```json
{
  "id": "user-123",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "role": "user",
  "department": "TI",
  "status": "active",
  "created_at": "2025-03-15T10:30:00Z",
  "last_login": "2025-03-20T08:45:30Z"
}
```

#### 3.2.2 Modelo de Porta

```json
{
  "id": "door-456",
  "name": "Entrada Principal",
  "location": "Recepção",
  "status": "locked",
  "last_status_change": "2025-03-20T07:30:00Z",
  "device_id": "device-789",
  "access_schedule": {
    "weekdays": ["1", "2", "3", "4", "5"],
    "start_time": "08:00",
    "end_time": "18:00"
  }
}
```

#### 3.2.3 Modelo de Dispositivo

```json
{
  "id": "device-789",
  "name": "Leitor RFID #01",
  "type": "rfid-reader",
  "typeCode": "rfid-reader",
  "location": "Entrada Principal",
  "status": "online",
  "ip": "192.168.1.101",
  "mac": "00:1A:2B:3C:4D:5E",
  "firmware": "v2.3.1",
  "last_activity": "2025-03-20T09:32:15Z",
  "battery_level": 85,
  "signal_strength": 92
}
```

#### 3.2.4 Modelo de Log de Acesso

```json
{
  "id": "log-012",
  "user_id": "user-123",
  "user_name": "João Silva",
  "door_id": "door-456",
  "door_name": "Entrada Principal",
  "action": "access_granted",
  "method": "rfid",
  "timestamp": "2025-03-20T08:45:30Z",
  "device_id": "device-789"
}
```

## 4. Frontend Web

### 4.1 Interface de Administração

A interface web administrativa é organizada em seções principais:

- Dashboard
- Gerenciamento de Usuários
- Gerenciamento de Portas
- Gerenciamento de Dispositivos
- Logs de Acesso
- Configurações

### 4.2 Dashboard

O dashboard fornece uma visão geral do sistema com:

- Estatísticas de usuários ativos
- Status das portas (trancadas/destrancadas)
- Status dos dispositivos (online/offline)
- Gráfico de atividade diária
- Atividades recentes
- Alertas e notificações
- Métricas de desempenho de dispositivos

### 4.3 Gestão de Usuários

A interface de gerenciamento de usuários permite:

- Visualização de todos os usuários
- Adição de novos usuários
- Edição de usuários existentes
- Desativação/reativação de usuários
- Atribuição de permissões
- Exportação de dados de usuários

### 4.4 Gestão de Portas

A interface de gerenciamento de portas oferece:

- Visualização de todas as portas
- Adição de novas portas
- Configuração de restrições de acesso
- Controle remoto (trancar/destrancar)
- Monitoramento de status em tempo real
- Programação de acesso baseado em horários

### 4.5 Gestão de Dispositivos

A interface de gerenciamento de dispositivos inclui:

- Listagem de todos os dispositivos
- Status de cada dispositivo
- Configuração remota
- Atualização de firmware
- Diagnóstico e estatísticas
- Gestão de bateria para dispositivos móveis

### 4.6 Logs e Relatórios

A seção de logs e relatórios fornece:

- Histórico completo de acessos
- Filtros avançados por data, usuário, porta e resultado
- Gráficos e visualizações
- Detecção de anomalias
- Relatórios personalizados

## 5. Hardware e IoT

### 5.1 Especificações do Hardware

#### 5.1.1 Leitores RFID

- Frequência: 13.56 MHz (MIFARE)
- Interfaces: UART, SPI, I2C
- Microcontrolador: ESP32
- Conectividade: Wi-Fi, Bluetooth
- Alimentação: 5V DC ou bateria com gestão de energia

#### 5.1.2 Controladores de Porta

- Microcontrolador: ESP32
- Relés: 2 (fechadura e alarme)
- Entradas: Sensor de porta, botão de saída
- Conectividade: Wi-Fi, Bluetooth
- Alimentação: 12V DC com backup de bateria

## 6. Backend

### 6.1 Autenticação e Autorização

O sistema utiliza Firebase Authentication para gerenciar identidades de usuários:

- Autenticação por email/senha
- Controle de acesso baseado em perfis (admin, user)
- Gerenciamento de sessões seguras
- Recuperação de senha

### 6.2 Integração com Firebase

O backend integra-se com serviços Firebase:

- **Firebase Authentication**: Para autenticação de usuários
- **Firebase Realtime Database**: Para armazenamento e sincronização de dados
- **Firebase Hosting**: Para hospedagem da interface web


## 7. Componentes do Sistema e Funções Principais

### 7.1 Utilitários (utils.js)

| Função | Descrição |
|--------|-----------|
| `safeDOM(id, callback)` | Verifica se um elemento DOM existe antes de acessá-lo |
| `safeTextContent(id, text)` | Define o conteúdo de texto de um elemento com segurança |
| `safeInnerHTML(id, html)` | Define o HTML interno de um elemento com segurança |
| `safeValue(id, value)` | Define o valor de um elemento com segurança |
| `safeSetAttribute(id, attribute, value)` | Define um atributo de um elemento com segurança |
| `safeStyle(id, property, value)` | Define o estilo de um elemento com segurança |
| `safeAddClass(id, className)` | Adiciona uma classe a um elemento com segurança |
| `safeRemoveClass(id, className)` | Remove uma classe de um elemento com segurança |
| `getCurrentPage()` | Obtém o nome da página atual a partir da URL |
| `isPage(pageName)` | Verifica se a página atual corresponde ao nome fornecido |

### 7.2 Funções Comuns (common.js)

| Função | Descrição |
|--------|-----------|
| `checkAuth()` | Verifica se o usuário está autenticado e redireciona se necessário |
| `loadCurrentUserName()` | Carrega o nome do usuário atual do Firebase |
| `loadAlertsCount()` | Carrega a contagem de alertas ativos |
| `initSidebar()` | Inicializa o comportamento da barra lateral |
| `initLogout()` | Configura o botão de logout |
| `showNotification(type, message, duration)` | Exibe uma notificação na interface |
| `closeNotification(notification)` | Fecha uma notificação específica |
| `setupModal(modalId, openBtn, closeBtn, cancelBtn)` | Configura o comportamento de um modal |
| `openModal(modalId)` | Abre um modal específico |
| `closeModal(modalId)` | Fecha um modal específico |
| `formatDate(isoString)` | Formata uma data ISO para exibição |
| `formatDateTime(isoString)` | Formata uma data e hora ISO para exibição |
| `formatStatus(status)` | Converte códigos de status em texto legível |
| `getStatusClass(status)` | Obtém a classe CSS correspondente a um status |
| `capitalize(string)` | Capitaliza a primeira letra de uma string |
| `translateRole(role)` | Traduz códigos de função para texto legível |
| `isValidEmail(email)` | Valida um endereço de email |
| `isValidPassword(password)` | Valida uma senha |

### 7.3 Gerenciamento de Temas (theme-switcher.js)

| Função | Descrição |
|--------|-----------|
| `initThemeSwitcher()` | Inicializa o controle de tema claro/escuro |
| `createThemeToggleButton()` | Cria o botão de alternância de tema |
| `getPreferredTheme()` | Obtém o tema preferido do usuário |
| `applyTheme(theme)` | Aplica o tema especificado à interface |
| `toggleTheme()` | Alterna entre os temas claro e escuro |
| `updateCharts(theme)` | Atualiza os gráficos para se adequarem ao tema atual |
| `increaseBrightness(color, percent)` | Aumenta o brilho de uma cor para melhor visibilidade |

### 7.4 Mobile (mobile.js)

| Função | Descrição |
|--------|-----------|
| `handleResize()` | Manipula o redimensionamento da tela |
| `createMobileElements()` | Cria os elementos necessários para a interface mobile |
| `setupMobileMenuBehavior()` | Configura o comportamento do menu mobile |
| `toggleMobileMenu()` | Alterna a visibilidade do menu mobile |
| `closeMobileMenu()` | Fecha o menu mobile |
| `isTouchDevice()` | Detecta se o dispositivo é touch |

### 7.5 Dashboard (dashboard.js)

| Função | Descrição |
|--------|-----------|
| `loadDashboardData()` | Carrega os dados principais do dashboard |
| `loadUserStats()` | Carrega estatísticas de usuários |
| `loadDoorStats()` | Carrega estatísticas das portas |
| `loadDeviceStats()` | Carrega estatísticas de dispositivos |
| `updateBenchmarkMetrics(onlineDevices)` | Atualiza as métricas de benchmark dos dispositivos |
| `updateBenchmarkBar(id, value, unit)` | Atualiza uma barra de benchmark específica |
| `resetBenchmarkMetrics()` | Reseta todas as métricas de benchmark |
| `loadRecentActivity()` | Carrega logs de atividade recente |
| `updateDoorList(doors)` | Atualiza a lista de portas |
| `setupDoorActionButtons()` | Configura botões de ação das portas |
| `toggleDoorLock(doorId, action)` | Alterna estado de tranca da porta |
| `loadAlerts()` | Carrega alertas ativos |
| `formatDateTime(isoString)` | Formata uma data e hora ISO para exibição |

### 7.6 Gráfico de Atividade (activity-chart.js)

| Função | Descrição |
|--------|-----------|
| `initActivityChart()` | Inicializa e configura o gráfico de atividade diária |
| `loadActivityData()` | Carrega e processa os dados de atividade do Firebase |
| `processActivityData(accessLogs)` | Processa os logs de acesso agrupando por dia e por porta |
| `getChartThemeOptions()` | Determina as cores e opções do gráfico com base no tema atual |
| `createActivityChart(data)` | Cria ou atualiza o gráfico com os dados processados |
| `generateDoorColors(count)` | Gera um array de cores para as portas |
| `hslToHex(h, s, l)` | Converte uma cor HSL para formato hexadecimal |
| `adjustColorBrightness(hexColor, percent)` | Ajusta o brilho de uma cor hexadecimal |

### 7.7 Gerenciamento de Usuários (users.js)

| Função | Descrição |
|--------|-----------|
| `initDOMElements()` | Inicializa elementos do DOM de forma segura |
| `setupFilters()` | Configura eventos de filtro |
| `setupExport()` | Configura eventos de exportação |
| `setupForm()` | Configura eventos de formulário |
| `loadUsers()` | Carrega usuários do Firebase |
| `renderUsers()` | Renderiza usuários na tabela |
| `setupActionButtons()` | Configura botões de ação para edição e exclusão |
| `editUser(userId)` | Abre modal para editar usuário |
| `confirmDelete(userId)` | Confirma exclusão de usuário |
| `deleteUser(userId)` | Exclui usuário |
| `saveUser()` | Salva usuário (criar ou atualizar) |
| `validateUserForm()` | Valida formulário de usuário |
| `resetForm()` | Reseta formulário |
| `applyFilters()` | Aplica filtros e busca |
| `exportUsers(format)` | Exporta usuários |
| `updatePaginationInfo(start, end, total)` | Atualiza informações de paginação |
| `updatePagination()` | Atualiza controles de paginação |
| `debounce(func, wait)` | Função para debounce (evitar múltiplas chamadas rápidas) |

### 7.8 Gerenciamento de Portas (doors.js)

| Função | Descrição |
|--------|-----------|
| `initDoorManagement()` | Inicializa a página de gerenciamento de portas |
| `setupEventListeners()` | Configura todos os event listeners da página |
| `loadDoors()` | Carrega as portas do Firebase |
| `renderDoors()` | Renderiza as portas na tabela |
| `confirmDeleteDoor(door)` | Confirma exclusão de uma porta |
| `deleteDoor(doorId)` | Exclui uma porta |
| `openDoorModal(door)` | Abre o modal para adicionar ou editar uma porta |
| `handleDoorFormSubmit()` | Manipula o envio do formulário de porta |
| `openControlModal(door)` | Abre o modal de controle de porta |
| `controlDoor(action)` | Controla uma porta (tranca/destranca) |
| `closeModal(modalId)` | Fecha um modal pelo ID |
| `showNotification(message, type)` | Mostra uma notificação na tela |
| `formatDate(date)` | Formata uma data para exibição |

### 7.9 Logs (logs.js)

| Função | Descrição |
|--------|-----------|
| `initDateFilters()` | Configura os filtros de data e inicializa valores padrão |
| `setupEventListeners()` | Configura os event listeners para a página |
| `loadLogs()` | Carrega os logs do Firebase |
| `applyFilters()` | Aplica os filtros selecionados aos logs |
| `renderLogs()` | Renderiza os logs na interface |
| `updateLogsCount()` | Atualiza os contadores de logs |
| `updatePagination()` | Atualiza a paginação |
| `getVisiblePageNumbers(currentPage, totalPages)` | Determina quais números de página mostrar na paginação |
| `resetFilters()` | Reseta todos os filtros para seus valores padrão |
| `exportLogs(format)` | Exporta os logs no formato especificado |
| `exportCSV()` | Exporta os logs filtrados para um arquivo CSV |
| `formatActionForExport(action)` | Formata a ação para exibição no arquivo exportado |
| `formatDateForInput(date)` | Formata uma data para o formato de input date |
| `showNotification(message, type)` | Exibe uma notificação na interface |

### 7.10 Gerenciamento de Dispositivos (devices.js)

| Função | Descrição |
|--------|-----------|
| `initModals()` | Inicializa os modais da página |
| `setupEventListeners()` | Configura os event listeners da página |
| `mockDevicesData()` | Simula a carga de dados de dispositivos para visualização |
| `renderDevices()` | Renderiza os dispositivos na tabela |
| `updatePagination()` | Atualiza as informações de paginação |
| `updateDeviceStats()` | Atualiza as estatísticas de dispositivos |
| `openDeviceModal(device)` | Abre o modal para adicionar ou editar um dispositivo |
| `openConfigModal(device)` | Abre o modal de configuração de dispositivo |
| `saveDevice()` | Salva um dispositivo (adição ou edição) |
| `saveDeviceConfig()` | Salva as configurações de um dispositivo |
| `applyFilters()` | Aplica filtros aos dispositivos |
| `resetFilters()` | Reseta todos os filtros |
| `confirmAction(title, message, onConfirm, confirmButtonText)` | Abre um modal de confirmação para uma ação |
| `openModal(modalId)` | Abre um modal pelo ID |
| `closeModal(modalId)` | Fecha um modal pelo ID |
| `showNotification(message, type)` | Exibe uma notificação na tela |
| `formatDate(date)` | Formata uma data para exibição |
| `generateUUID()` | Gera um UUID simples |
| `getDeviceTypeName(typeCode)` | Obtém o nome do tipo de dispositivo com base no código |
| `findDeviceByName(name)` | Encontra um dispositivo pelo nome |
| `setupTabStyles()` | Adiciona estilos CSS para tabs no modal de configuração |

### 7.11 Assistente Gemini (gemini-assistant.js)

| Classe/Método | Descrição |
|---------------|-----------|
| `GeminiAssistant` | Classe para gerenciar a interface do assistente Gemini |
| `init()` | Inicializa o assistente e cria os elementos da interface |
| `_setupEventListeners()` | Configura os event listeners para interação com o assistente |
| `_initSystemContext()` | Inicializa o contexto do sistema coletando dados relevantes |
| `_loadSystemData()` | Carrega dados adicionais do sistema para contexto |
| `_handleSendMessage()` | Lida com o envio de mensagem do usuário |
| `_isCommand(message)` | Verifica se uma mensagem parece ser um comando |
| `_processCommand(command, systemContext)` | Processa um comando e executa as ações correspondentes |
| `_executeCommand(processedCommand, messageElement)` | Executa um comando processado |
| `_executeLogsAnalysisCommand(processedCommand, messageElement)` | Processa logs de acesso diretamente no chat |
| `_executeQueryCommand(processedCommand, messageElement)` | Executa um comando de consulta |
| `_executeActionCommand(processedCommand, messageElement)` | Executa um comando de ação |
| `_executeConfigCommand(processedCommand, messageElement)` | Executa um comando de configuração |
| `_addMessage(role, content)` | Adiciona uma mensagem à conversa |
| `_updateMessage(messageElement, role, content)` | Atualiza o conteúdo de uma mensagem existente |
| `_scrollToBottom()` | Rola a conversa para o final |
| `_formatResponse(response)` | Formata a resposta para exibição |
| `toggle(visible)` | Alterna a visibilidade do assistente |
| `clearConversation()` | Limpa a conversa atual |
| `generateInsights()` | Gera insights com base nos dados do sistema |

### 7.12 Serviço Gemini (gemini-service.js)

| Classe/Método | Descrição |
|---------------|-----------|
| `GeminiService` | Classe para gerenciar a comunicação com a API Gemini |
| `_generateSystemContext()` | Gera o contexto do sistema para o assistente Gemini |
| `sendMessage(message, context, options)` | Envia uma mensagem para a API Gemini e processa a resposta |
| `_looksLikeJSON(text)` | Verifica se uma string parece conter JSON |
| `_convertJSONToNaturalText(jsonText)` | Converte respostas JSON em texto natural |
| `_removeThinkingProcess(response)` | Remove o processo de raciocínio interno da resposta do modelo |
| `clearConversation()` | Limpa a conversa atual |
| `generateInsights(systemData)` | Gera insights baseados em dados do sistema |
| `_createFallbackInsights(response, errorMessage)` | Método auxiliar para criar insights de fallback |
| `processCommand(command, systemState)` | Processa comandos de linguagem natural |
| `processModelResponse(response, isConversation)` | Processa respostas do modelo Gemini |

## 8. Fluxos de Funcionamento

### 8.1 Fluxo de Controle Remoto

1. Um administrador acessa a interface web ou app móvel
2. Navega até a seção de gerenciamento de portas
3. Seleciona uma porta específica e escolhe "Controlar"
4. Clica em "Destrancar" ou "Trancar"
5. O backend processa o comando e valida a autorização
6. O comando é enviado ao Firebase
7. O Firebase atualiza os dados do controlador da porta correspondente
8. A porta muda de estado e a ação é registrada

## 10. Implantação e DevOps

### 10.1 Processo de Implantação

1. Configurar projeto Firebase e obter credenciais
2. Implantar a interface web via Firebase Hosting
3. Implantar as funções de backend (Cloud Functions)
4. Configurar as regras de segurança do banco de dados
5. Configurar os dispositivos IoT com as credenciais apropriadas
6. Testar o sistema completo

## 11. Testes

### 11.1 Estratégia de Testes

- Testes unitários para componentes individuais
- Testes de integração para interações entre componentes
- Testes end-to-end para fluxos completos
- Testes de segurança
- Testes de desempenho
- Testes de usabilidade

### 11.2 Testes Específicos

- Validação de leituras RFID
- Verificação de tempo de resposta
- Simulação de falhas de conectividade
- Teste de backup de energia
- Verificação de segurança de comunicação

## 12. Manutenção e Suporte

### 12.1 Procedimentos de Manutenção

- Atualização regular de firmware dos dispositivos
- Verificação periódica do estado das baterias
- Backup regular do banco de dados
- Monitoramento de logs para detecção de anomalias
- Atualização de certificados de segurança

### 12.2 Solução de Problemas Comuns

- Dispositivo offline: Verificar conexão Wi-Fi e alimentação
- Falha de leitura RFID: Limpar leitor ou substituir cartão
- Porta não responde: Verificar controlador e conexões
- Usuário não autorizado: Verificar cadastro e permissões

## 13. Glossário

- **RFID**: Radio-Frequency Identification - Tecnologia que usa campos eletromagnéticos para identificar e rastrear tags anexadas a objetos
- **IoT**: Internet of Things - Rede de dispositivos físicos conectados à internet
- **ESP32**: Microcontrolador com WiFi e Bluetooth integrados, frequentemente usado em projetos IoT
- **JWT**: JSON Web Token - Método para representar reivindicações com segurança entre duas partes
- **TLS**: Transport Layer Security - Protocolo criptográfico para comunicações seguras
- **MQTT**: Message Queuing Telemetry Transport - Protocolo leve de mensagens para dispositivos IoT
- **Firebase**: Plataforma de desenvolvimento de aplicativos da Google que fornece ferramentas como banco de dados em tempo real, autenticação e hospedagem

## 14. Referências

1. Documentação do Firebase: https://firebase.google.com/docs
2. Especificações RFID ISO/IEC 14443
3. Documentação do ESP32: https://docs.espressif.com/projects/esp-idf/en/latest/
4. Especificação MQTT: https://mqtt.org/mqtt-specification/
5. Guia de segurança para IoT: NIST SP 800-82

---

Documentação elaborada para o projeto SecureLab 2.0 - Sistema de Controle de Acesso com RFID e IoT
Versão: 2.3.1
Data: 20 de março de 2025