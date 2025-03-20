```markdown
# Documentação Detalhada do Projeto SecureLab RFID

## Visão Geral do Projeto

O SecureLab RFID é um sistema de controle de acesso baseado em RFID (Radio-Frequency Identification) projetado para gerenciar e monitorar a segurança em ambientes controlados, como laboratórios, escritórios ou áreas restritas. A interface web do sistema oferece um painel de controle abrangente para administradores e usuários autorizados, permitindo o gerenciamento de usuários, portas, dispositivos RFID, logs de acesso e fornecendo insights inteligentes através da integração com o assistente Gemini.

Este documento detalha a estrutura, funcionalidades e tecnologias implementadas no projeto SecureLab RFID, fornecendo uma visão minuciosa do seu funcionamento.

## Estrutura de Arquivos

O projeto está organizado em diretórios que separam as responsabilidades de cada tipo de arquivo, facilitando a manutenção e escalabilidade.

```
public/
├── css/
│   ├── components.css           # Estilos para componentes de UI reutilizáveis
│   ├── dashboard.css            # Estilos específicos para a página do Dashboard
│   ├── dark-mode.css            # Implementação e variáveis do modo escuro
│   ├── devices.css              # Estilos específicos para a página de Dispositivos
│   ├── gemini-assistant.css     # Estilos para o assistente Gemini
│   ├── gemini-insights.css      # Estilos para o componente de insights do Gemini
│   ├── logs.css                 # Estilos específicos para a página de Logs
│   ├── mobile.css               # Otimizações de estilo para dispositivos móveis
│   ├── styles.css               # Estilos globais e layout principal
│   └── utils.css                # Classes utilitárias (margens, paddings, etc.)
├── js/
│   ├── activity-chart.js        # Lógica para o gráfico de atividades no Dashboard
│   ├── common.js              # Funções JavaScript comuns e utilitárias
│   ├── devices.js             # Lógica para a página de Dispositivos
│   ├── doors.js               # Lógica para a página de Portas
│   ├── dashboard.js           # Lógica para a página do Dashboard
│   ├── firebase-config.js     # Configuração e inicialização do Firebase
│   ├── gemini-assistant.js      # Lógica da interface do assistente Gemini
│   ├── gemini-config.js       # Configurações da API Gemini
│   ├── gemini-service.js      # Serviço para comunicação com a API Gemini
│   ├── logs.js                # Lógica para a página de Logs
│   ├── mobile.js              # Funcionalidades JavaScript para mobile
│   ├── simplified-gemini-insights.js # Componente simplificado de Insights Gemini
│   ├── theme-switcher.js        # Lógica para o tema claro/escuro
│   ├── users.js               # Lógica para a página de Usuários
│   └── utils.js               # Utilitários JavaScript para manipulação do DOM
└── README.md                  # Documentação do projeto (este arquivo)
```

## Documentação dos Arquivos CSS

### `components.css`

Este arquivo CSS define os estilos para componentes de interface do usuário reutilizáveis em todo o sistema. Ele promove a consistência visual e facilita a manutenção do design.

- **Botões (`.btn`, `.btn-*`, `.icon-button`, `.btn-link`, `.btn-sm`):** Estilos base para botões, incluindo variações de cor primária, secundária, sucesso, perigo, estilos outline e botões de ícone. Define propriedades como `display`, `font-weight`, `padding`, `border-radius`, `transition` e `cursor`.
- **Status Badges (`.status-badge`, `.status-*`):** Estilos para badges indicativos de status, como `locked` e `unlocked`. Inclui estilos para ícones dentro dos badges.
- **Modal (`.modal`, `.modal-*`, `.close-button`):** Estilos para modais, incluindo o container, diálogo, conteúdo, cabeçalho, corpo, rodapé e botão de fechar. Garante responsividade com `max-width` e `width: 90%` para `.modal-dialog`.
- **Form Styles (`.form-group`, `.form-control`):** Estilos para elementos de formulário como grupos de campos, labels e controles de input. Inclui estilos para estados de foco e validação.
- **Dropdown (`.dropdown`, `.dropdown-menu`, `.dropdown-item`):** Estilos para componentes dropdown, incluindo o menu, itens e interações hover/focus.
- **Tables (`.table-responsive`, `.table`, `.table th`, `.table td`):** Estilos para tabelas responsivas, cabeçalhos de tabela, células de dados e efeitos hover nas linhas.
- **Pagination (`.pagination-container`, `.pagination`, `.pagination-*`):** Estilos para componentes de paginação, incluindo container, botões de navegação e informações de página.
- **Notification (`.notification-container`, `.notification`, `.close-notification`):** Estilos para notificações flutuantes, incluindo animação `fadeIn` e botão de fechar.
- **Activity List, Door List, Alerts List (`.activity-list`, `.door-list`, `.alerts-list`, `.activity-*`, `.alert-*`):** Estilos para listas de atividades, portas e alertas, incluindo ícones e layouts responsivos.
- **Card Styles (`.card`, `.card-*`):** Estilos para cards de conteúdo, incluindo cabeçalho, corpo e ações.
- **Password Toggle (`.password-input`, `.password-toggle`):** Estilos para campos de input de senha com funcionalidade de toggle de visibilidade.

### `dashboard.css`

Este arquivo contém estilos específicos para a página do dashboard, focando na apresentação de métricas de benchmark e informações de dispositivos.

- **Benchmark Container (`.benchmark-container`, `.benchmark-*`):** Estilos para o container geral do benchmark, título, métricas, labels, barras de progresso e valores. Inclui estilos responsivos e para o modo escuro.
- **Hotspot Device (`.hotspot-device`, `.hotspot-*`):** Estilos para a seção do dispositivo mais sobrecarregado, incluindo título, nome do dispositivo e carga.
- **Responsividade:** Media queries para ajustar o layout em telas menores (`max-width: 768px`).
- **Tema Escuro:** Estilos específicos para o modo escuro (`html.dark-mode .benchmark-*`).
- **Classes de Criticidade (`.benchmark-bar.normal`, `.benchmark-bar.warning`, `.benchmark-bar.critical`):** Estilos para indicar o nível de criticidade das métricas de benchmark através de cores, padrões e animações.

### `dark-mode.css`

Este arquivo implementa o tema escuro para o sistema, redefinindo variáveis de cor e ajustando estilos de componentes para garantir legibilidade e contraste em ambientes escuros.

- **Redefinição de Variáveis de Cor (`html.dark-mode :root`):** Define novas variáveis de cor `--primary-color`, `--secondary-color`, `--success-color`, `--danger-color`, etc., e variáveis específicas para o modo escuro como `--dark-bg-color`, `--dark-card-bg`, `--dark-text-primary`, etc.
- **Correções para Páginas Específicas:**
    - **Página de Login (`html.dark-mode .login-container`, etc.):** Ajustes para elementos da página de login, garantindo que labels, inputs e outros elementos sejam legíveis no modo escuro.
    - **Status das Portas (`html.dark-mode [style*="color: #e74c3c"]`, etc.):** Correções para indicadores de status de portas, badges e ícones em tabelas para manter a semântica de cores (vermelho para perigo, verde para sucesso) no tema escuro.
    - **Status de Portas no Dashboard (`html.dark-mode .door-status.*`):** Estilos específicos para os indicadores de status das portas no dashboard.
- **Ajustes para Outros Elementos da Interface:**
    - **Sidebar e Header (`html.dark-mode .sidebar`, `.main-header`, `.sidebar-nav li a`, etc.):** Estilos para sidebar, header, navegação e footer no modo escuro.
    - **Formulários e Inputs (`html.dark-mode .header-search`, `.form-control`, etc.):** Ajustes para campos de busca, inputs de formulário e labels.
    - **Cards e Tabelas (`html.dark-mode .log`, `.card`, `.table`, etc.):** Estilos para cards, tabelas, cabeçalhos, células e linhas alternadas para garantir contraste e legibilidade.
    - **Status Cards no Dashboard (`html.dark-mode .status-card-*`):** Estilos para status cards no dashboard, incluindo cabeçalho, contadores e labels.
    - **Modais (`html.dark-mode .modal-*`, `.close-button`, etc.):** Estilos para modais, conteúdo, cabeçalho, rodapé, botões de fechar e inputs dentro de modais.
    - **Notificações (`html.dark-mode .notification`):** Estilos para notificações no modo escuro.
    - **Botões (`html.dark-mode .btn-outline-secondary`, etc.):** Ajustes para botões outline e outros tipos de botões.
    - **Paginação (`html.dark-mode .pagination-*`, `.page-number`):** Estilos para paginação, informações e botões no modo escuro.
    - **Dropdown (`html.dark-mode .dropdown-*`, `.dropdown-item`):** Estilos para dropdowns, menus e itens no modo escuro.
    - **Chart.js (`html.dark-mode .chart-placeholder`, `canvas`, `.chart-legend span`, etc.):** Ajustes para gráficos Chart.js, incluindo placeholders, canvases e legendas para garantir visibilidade e contraste.
    - **Gemini (`html.dark-mode #gemini-toggle-btn`):** Estilos para elementos específicos do assistente Gemini no tema escuro.
    - **Dispositivos Mobile (`@media (max-width: 768px) html.dark-mode .mobile-overlay`):** Ajustes responsivos para dispositivos mobile no modo escuro.

### `devices.css`

Este arquivo CSS é dedicado aos estilos específicos da página de gerenciamento de dispositivos, focando na apresentação de configurações e métricas de dispositivos.

- **Settings Tabs (`.settings-tabs`, `.tab-buttons`, `.tab-btn`, `.tab-pane`):** Estilos para a interface de abas dentro do modal de configurações de dispositivos, incluindo botões de aba e painéis de conteúdo.
- **Network Inputs (`.radio-group`, `.input-group`, `.input-group-append`):** Estilos para inputs relacionados à configuração de rede, como grupos de radio para seleção de DHCP/Estático e inputs de grupos com botões anexados.
- **Brightness Slider (`input[type="range"]`):** Estilos para o slider de controle de brilho, incluindo a barra, thumb e compatibilidade com navegadores WebKit e Mozilla.
- **Maintenance Actions (`.maintenance-actions`):** Estilos para a seção de ações de manutenção, como reiniciar ou restaurar configurações de fábrica.
- **Battery and Connectivity Status (`.device-battery-status`, `.device-connectivity-status`, `.battery-indicator`, `.connectivity-indicator`, `.battery-level`, `.connectivity-level`):** Estilos para indicadores visuais de status da bateria e conectividade, utilizando barras de progresso com cores dinâmicas baseadas no nível.
- **Dark Mode Adjustments (`html.dark-mode .tab-btn`, `input[type="range"]`, `.battery-indicator`, `.connectivity-indicator`):** Ajustes de estilo para o modo escuro, garantindo que os elementos de configuração e status sejam legíveis e consistentes visualmente.
- **Device Metrics (`.device-metrics`, `.metric-item`, `.metric-title`, `.metric-value`, `.metric-unit`):** Estilos para exibir métricas de dispositivos em um layout de grid, incluindo títulos, valores e unidades de medida.
- **Responsiveness (`@media (max-width: 768px) .device-metrics`, `.tab-buttons`, `.tab-btn`, `.radio-group`, `.maintenance-actions button`):** Media queries para otimizar o layout da página de dispositivos em telas menores, incluindo ajuste do grid de métricas, layout de abas e grupos de radio para melhor usabilidade em mobile.

### `gemini-assistant.css`

Este arquivo CSS define os estilos para a interface do assistente Gemini, que permite a interação com o sistema através de linguagem natural.

- **Assistant Container (`.gemini-assistant`):** Estilos para o container principal do assistente, incluindo posicionamento fixo, dimensões, fundo, borda arredondada, sombra e transições para efeitos de minimizar/maximizar.
- **Minimized State (`.gemini-assistant.gemini-minimized`):** Estilos para o estado minimizado do assistente, reduzindo a altura e ocultando a área de conversa e input.
- **Header (`.gemini-header`, `.gemini-branding`, `.gemini-avatar`, `.gemini-actions`, `.gemini-action-btn`):** Estilos para o cabeçalho do assistente, incluindo branding, avatar, título e botões de ação (minimizar, limpar conversa).
- **Conversation Area (`.gemini-conversation-container`, `.gemini-conversation`):** Estilos para o container da conversa, permitindo scroll vertical e layout flexível para as mensagens.
- **Messages (`.gemini-message`, `.gemini-*-message`, `.gemini-message-avatar`, `.gemini-message-content`):** Estilos para mensagens de usuário e assistente, incluindo avatares, conteúdos, formatação de texto, código, listas e tabelas dentro das mensagens.
- **Content Formatting (`.gemini-message-content p`, `.gemini-message-content code`, `.gemini-message-content pre`, etc.):** Estilos para formatar o conteúdo dentro das mensagens, como parágrafos, código inline, blocos de código (`.gemini-code-block`), títulos (h4, h5, h6), listas (ul, ol) e tabelas (`.gemini-table`).
- **Dashboard in Messages (`.gemini-dashboard`, `.gemini-stat-card`, `.gemini-stat-*`):** Estilos para exibir mini dashboards dentro das mensagens do assistente, mostrando métricas e estatísticas.
- **Info Grid (`.gemini-info-grid`, `.gemini-info-item`, `.gemini-info-*`):** Estilos para exibir informações em formato de grid dentro das mensagens.
- **Analysis Charts (`.gemini-analysis`, `.gemini-chart`, `.gemini-chart-*`):** Estilos para gráficos de análise de barra dentro das mensagens.
- **Insights (`.gemini-insights`, `.gemini-insight`):** Estilos para exibir insights e recomendações em formato de lista dentro das mensagens.
- **Typing Indicator (`.gemini-typing-indicator`, `.gemini-typing-indicator span`):** Estilos para o indicador de digitação animado.
- **Confirmation (`.gemini-confirmation`, `.gemini-confirmation-*`, `.gemini-confirm-*`):** Estilos para mensagens de confirmação e botões de confirmação (sim/não).
- **Suggestions (`.gemini-suggestions`, `.gemini-suggestion`):** Estilos para a área de sugestões rápidas de comandos ou perguntas.
- **Input Field (`.gemini-input-container`, `.gemini-input`, `.gemini-send-btn`):** Estilos para o container do campo de input, textarea para entrada de texto e botão de envio.
- **Dark Mode Adjustments (`html.dark-mode .gemini-assistant`, `.gemini-header`, `.gemini-conversation-container`, etc.):** Ajustes de estilo para o modo escuro, garantindo que todos os elementos do assistente Gemini sejam legíveis e visíveis no tema escuro.
- **Responsiveness (`@media (max-width: 768px) .gemini-assistant`, `.gemini-header`, `.gemini-dashboard`, `.gemini-chart-label`):** Media queries para otimizar o layout do assistente Gemini em telas menores, incluindo ajuste de dimensões, layout do dashboard e labels de gráficos.

### `gemini-insights.css`

Este arquivo CSS define os estilos para o componente de insights do Gemini, que exibe insights e recomendações inteligentes no dashboard.

- **Insights Panel Container (`.gemini-insights-panel`):** Estilos para o container principal do painel de insights, incluindo fundo, borda arredondada, sombra e layout flexível.
- **Header (`.gemini-insights-header`, `.gemini-insights-header h3`, `.gemini-insights-header h3 i`, `.gemini-insights-actions`, `.gemini-insights-refresh`):** Estilos para o cabeçalho do painel, incluindo título, ícone e botão de refresh.
- **Body (`.gemini-insights-body`):** Estilos para o corpo do painel, permitindo scroll vertical.
- **Insights Summary (`.gemini-insights-summary`, `.gemini-insights-summary-content`, `.gemini-insights-summary-icon`, `.gemini-insights-summary p`):** Estilos para a área de resumo dos insights, incluindo ícone e texto.
- **Loading Indicator (`.gemini-insights-loading`, `.gemini-insights-spinner`, `@keyframes spin`):** Estilos para o indicador de carregamento, incluindo um spinner animado.
- **Insights List (`.gemini-insights-list`):** Estilos para a lista de insights.
- **Insight Item (`.gemini-insight`, `.gemini-insight:hover`, `.gemini-insight:last-child`, `.gemini-insight-icon`, `.gemini-insight-* .gemini-insight-icon`, `.gemini-insight-content`, `.gemini-insight-title`, `.gemini-insight-description`, `.gemini-insight-related`, `.gemini-insight-tag`):** Estilos para cada item de insight, incluindo hover, ícones baseados no tipo de insight (anomaly, pattern, recommendation, error), título, descrição e tags relacionadas.
- **Insight Priority (`.gemini-priority-high .gemini-insight-title`, `.gemini-priority-medium .gemini-insight-title`):** Estilos para destacar a prioridade dos insights, especialmente alta prioridade com cor vermelha e um indicador visual (!).
- **No Insights Message (`.gemini-no-insights`):** Estilos para exibir uma mensagem quando não há insights disponíveis.
- **Error Message (`.gemini-insights-error`, `.gemini-insights-error i`, `.gemini-insights-error p`):** Estilos para exibir mensagens de erro no painel de insights.
- **Footer (`.gemini-insights-footer`, `.gemini-insights-updated`, `.gemini-insights-more`, `.gemini-insights-more i`, `.gemini-insights-more:hover`):** Estilos para o rodapé do painel, incluindo timestamp da última atualização e link "Ask assistant".
- **Dark Mode Adjustments (`html.dark-mode .gemini-insights-panel`, `.gemini-insights-header`, `.gemini-insights-refresh`, etc.):** Ajustes de estilo para o modo escuro, garantindo que todos os elementos do painel de insights sejam legíveis e visíveis no tema escuro.
- **Responsiveness (`@media (max-width: 768px) .gemini-insights-panel`, `.gemini-insights-header`, `.gemini-insights-summary`, `.gemini-insight`):** Media queries para otimizar o layout do painel de insights em telas menores, incluindo ajuste de bordas e paddings.

### `logs.css`

Este arquivo CSS é dedicado aos estilos específicos da página de logs, focando na apresentação de logs de acesso e filtros.

- **Custom Date Filters (`.custom-date-filters`):** Estilos para a seção de filtros de data personalizados, adicionando uma borda superior para separação visual.
- **Logs List (`.logs-list`, `.logs-list li`, `.logs-list li:hover`, `.logs-list li:last-child`):** Estilos para a lista de logs, definindo altura máxima, overflow para scroll, padding para itens da lista, borda inferior e efeito hover.
- **Log Appearance Enhancements (`.activity-icon`, `.activity-title`, `.activity-details`, `.logs-count`):** Estilos para melhorar a aparência dos logs, incluindo ícones de atividade, títulos com flexbox para alinhamento, detalhes e contagem de logs.
- **Action Badges (`.action-badge`, `.action-badge.*`):** Estilos para badges indicando o tipo de ação (access-granted, access-denied, door-locked, door-unlocked), com cores e fundos específicos.
- **Activity Method (`.activity-method`, `.activity-method i`):** Estilos para badges indicando o método de acesso (RFID, Web, App), incluindo ícones.
- **Activity Timestamp (`.activity-timestamp`, `.activity-timestamp i`):** Estilos para timestamps de atividade, incluindo ícones de relógio.
- **Dark Mode Adjustments (`html.dark-mode .logs-list li`, `.custom-date-filters`, `.action-badge.*`, `.activity-method`):** Ajustes de estilo para o modo escuro, garantindo que os logs e filtros sejam legíveis e visíveis no tema escuro, incluindo cores de borda e fundo para badges.
- **Responsiveness for Mobile Devices (`@media (max-width: 768px) .logs-list`, `.activity-title`, `.activity-details`):** Media queries para otimizar o layout da página de logs em dispositivos móveis, incluindo ajuste de altura máxima da lista e layout flexível para títulos e detalhes de atividade.

### `mobile.css`

Este arquivo CSS contém otimizações e ajustes específicos para dispositivos móveis, garantindo que a interface do SecureLab seja responsiva e utilizável em telas menores.

- **Mobile Menu Toggle (`.mobile-menu-toggle`):** Estilos para o botão de menu mobile, inicialmente oculto e visível apenas em media queries, posicionado no canto superior direito do header.
- **Mobile Overlay (`.mobile-overlay`):** Estilos para o overlay escuro que cobre o conteúdo principal quando o menu mobile está aberto, inicialmente oculto e visível apenas em media queries.
- **Global Adjustments for Small Screens (`@media (max-width: 768px) body`, `.mobile-menu-toggle`, `.sidebar`, `.app-container.show-mobile-menu .sidebar`, `.show-mobile-menu .mobile-overlay`, `.main-header`, `.header-search`, `.main-content`, `.content-wrapper`, `.page-header`, `.card-header`, `.card-body`, `.table-responsive`, `.table`, `.table th`, `.table td`, `.modal-dialog`, `.modal-body`, `.form-group`, `.btn`, `.icon-button, .action-btn`, `.pagination-container`, `.pagination-info`, `.notification-container`):** Media queries para telas com largura máxima de 768px, aplicando ajustes como:
    - Redução do tamanho da fonte base (`body`).
    - Exibição do botão do menu mobile (`.mobile-menu-toggle`).
    - Configuração da sidebar para ocupar a tela inteira em mobile, com transição para exibir/ocultar (`.sidebar`, `.app-container.show-mobile-menu .sidebar`).
    - Exibição do overlay quando o menu mobile está ativo (`.show-mobile-menu .mobile-overlay`).
    - Ajustes no header, ocultando a barra de busca (`.main-header`, `.header-search`).
    - Ajuste da margem do conteúdo principal (`.main-content`).
    - Redução do padding do conteúdo (`.content-wrapper`).
    - Layout vertical para cabeçalhos de página (`.page-header`).
    - Redução do padding em cabeçalhos e corpos de cards (`.card-header`, `.card-body`).
    - Configuração de tabelas para rolagem horizontal em telas pequenas (`.table-responsive`, `.table`).
    - Ajuste de padding e `white-space` nas células da tabela (`.table th`, `.table td`).
    - Ajuste de margens e largura dos modais (`.modal-dialog`, `.modal-body`).
    - Redução da margem inferior dos grupos de formulário (`.form-group`).
    - Aumento do padding e altura mínima dos botões para melhor toque (`.btn`, `.icon-button, .action-btn`).
    - Layout vertical para o container de paginação (`.pagination-container`).
    - Ajuste da largura máxima das notificações (`.notification-container`).
- **Adjustments for Very Small Screens (Smartphones) (`@media (max-width: 480px) .card-grid`, `.status-card`, `.status-count`, `.activity-list li`, `.door-list li`, `.alerts-list li`, `.activity-icon`, `.alert-icon`):** Media queries para telas com largura máxima de 480px, aplicando ajustes como:
    - Redução do gap no grid de cards (`.card-grid`).
    - Tornar os status cards mais compactos (`.status-card`, `.status-count`).
    - Redução do padding em listas e ícones de atividade/alerta (`.activity-list li`, `.door-list li`, `.alerts-list li`, `.activity-icon`, `.alert-icon`).

### `styles.css`

Este arquivo CSS define os estilos principais e globais para o dashboard SecureLab RFID, incluindo variáveis de cor, layout principal, sidebar, header e componentes comuns.

- **Custom Properties (`:root`):** Definição de variáveis CSS para cores primárias, secundárias, de sucesso, perigo, etc., além de largura da sidebar, altura do header, raio do card e velocidade de transição.
- **Global Reset and Box-sizing (`*`):** Reset de margens, paddings e definição de `box-sizing: border-box` para todos os elementos.
- **Body Styles (`body`):** Estilos base para o body, incluindo `font-family`, `background-color`, `color` e `line-height`.
- **Main Layout (`.app-container`, `.sidebar`, `.main-content`):** Estilos para o layout principal da aplicação, com um container flexível, sidebar fixa e conteúdo principal que se expande. Inclui transições para a sidebar colapsada.
- **Sidebar (`.sidebar`, `.sidebar-header`, `.logo`, `.sidebar-toggle`, `.sidebar-nav`, `.sidebar-nav ul`, `.sidebar-nav li`, `.sidebar-nav li a`, `.badge`, `.sidebar-footer`, `.sidebar-footer a`):** Estilos para a sidebar, incluindo cabeçalho com logo e botão de toggle, navegação, footer e elementos internos.
- **Main Header (`.main-header`, `.header-search`, `.header-search i`, `.header-search input`, `.header-right`, `.notifications`, `.icon-button`, `.user-menu`, `.avatar`, `.user-name`):** Estilos para o header principal, incluindo barra de busca, ícones de notificação, menu de usuário e elementos internos.
- **Main Content (`.content-wrapper`, `.page-header`, `.page-header h1`, `.date-filter`, `.date-filter label`, `.date-filter select`):** Estilos para o conteúdo principal, incluindo wrapper, cabeçalho de página, filtros de data e elementos internos.
- **Card Grid and Row (`.card-grid`, `.card-row`):** Sistemas de grid para cards de estatísticas e seções maiores, utilizando `grid-template-columns` e `gap`.
- **Card Styles (`.card`, `.card-header`, `.card-header h3`, `.card-actions`, `.card-actions.center`, `.card-body`):** Estilos base para cards, cabeçalhos, ações e corpos de cards.
- **Status Cards (`.status-card`, `.status-card-header`, `.status-card-header h3`, `.card-icon`, `.status-card-body`, `.status-count`, `.status-label`, `.status-card-footer`, `.status-trend`, `.status-trend.positive`, `.status-trend.negative`, `.status-trend i`, `.status-period`, `.door-status`, `.status-dot`, `.status-dot.locked`, `.status-dot.unlocked`, `.progress-bar`, `.progress`):** Estilos específicos para status cards, incluindo cabeçalhos, ícones, contadores, labels, rodapés, tendências, status de porta e barras de progresso.
- **Activity, Door, Alerts Lists (`.activity-list`, `.door-list`, `.alerts-list`, `.activity-list li`, `.door-list li`, `.alerts-list li`, `.activity-icon`, `.alert-icon`, `.activity-icon.success`, `.alert-icon.success`, `.activity-icon.danger`, `.alert-icon.danger`, `.activity-icon.warning`, `.alert-icon.warning`, `.activity-info`, `.alert-info`, `.activity-title`, `.alert-title`, `.user-name`, `.success-text`, `.danger-text`, `.activity-details`, `.alert-details`, `.activity-reason`, `.door-info`, `.door-name`, `.door-location`, `.door-status`, `.door-status.locked`, `.door-status.unlocked`, `.door-status i`):** Estilos para listas de atividades, portas e alertas, e seus elementos internos, como ícones, informações, títulos, detalhes e status.
- **Buttons (`.btn`, `.btn-sm`, `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-outline-primary`, `.btn-link`, `.btn:hover`):** Estilos base para botões, variações de tamanho e cor, estilos outline e link, e efeito hover.
- **Chart Placeholder and Related Styles (`.chart-placeholder`, `.loading-chart`, `.loading-chart i`, `.no-data`, `.no-data i`, `.chart-error`, `.chart-error i`, `.chartjs-tooltip`):** Estilos para o container do gráfico de atividade diária, indicador de carregamento, mensagem de "sem dados", mensagem de erro e tooltip personalizado do Chart.js. Inclui ajustes responsivos para o tamanho do gráfico (`@media (max-width: 768px) .chart-placeholder`).
- **Donut Chart (`.device-stats`, `.stat-item`, `.stat-value`, `.stat-label`, `.device-chart-placeholder`, `.donut-chart`, `.donut-hole`, `.donut-ring`, `.donut-segment`, `.donut-text`):** Estilos para o gráfico de donut de dispositivos e estatísticas relacionadas, incluindo layout flexível para estatísticas, placeholder do gráfico e elementos do donut chart.
- **Alerts Specific Styles (`.alert-count`, `.alert-action`):** Estilos específicos para alertas e ações relacionadas.
- **No Data State (`.no-data`):** Estilos para a mensagem de "sem dados" em listas e gráficos.
- **Responsiveness (`@media (max-width: 992px) .card-row`, `@media (max-width: 768px) .app-container`, `.sidebar`, `.main-content`, `.card-grid`):** Media queries para ajustar o layout em diferentes tamanhos de tela, incluindo layout de cards em linha única em telas menores.
- **Chart Fullwidth Class (`.chart-fullwidth`, `.chart-card`, `.chart-card .card-body`, `.chart-placeholder`, `@media (max-width: 768px) .chart-placeholder`):** Estilos específicos para um gráfico de atividade de largura total, otimizado para ocupar a largura total do container e responsividade.
- **Chart Integration Adjustments (`#activityChart`, `canvas.chartjs-render-monitor`):** Ajustes para integração com o layout existente e Chart.js, garantindo que o gráfico ocupe 100% do espaço disponível.

### `utils.css`

Este arquivo CSS contém uma coleção de classes utilitárias para facilitar o desenvolvimento e manter a consistência visual, oferecendo classes para margens, paddings, texto, flexbox, display, bordas, largura, altura e cursor.

- **Margins (`.m-*`, `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*`, `.mx-*`, `.my-*`):** Classes utilitárias para definir margens em todos os lados (`.m-*`), topo (`.mt-*`, `.my-*`), inferior (`.mb-*`, `.my-*`), esquerdo (`.ml-*`, `.mx-*`), direito (`.mr-*`, `.mx-*`) e eixos X e Y (`.mx-*`, `.my-*`). Variações de tamanho de 0 a 5 (`.m-0` a `.m-5`).
- **Padding (`.p-*`, `.pt-*`, `.pb-*`, `.pl-*`, `.pr-*`, `.px-*`, `.py-*`):** Classes utilitárias para definir paddings de forma análoga às classes de margem, com variações de tamanho de 0 a 5 (`.p-0` a `.p-5`).
- **Text (`.text-center`, `.text-*`, `.fw-bold`):** Classes utilitárias para alinhamento de texto (`.text-center`), cores de texto (`.text-primary`, `.text-secondary`, etc., correspondendo às variáveis de cor do sistema) e peso da fonte (`.fw-bold`).
- **Flexbox (`.d-flex`, `.flex-column`, `.justify-content-*`, `.align-items-*`, `.flex-grow-1`):** Classes utilitárias para display flexível (`.d-flex`), direção da flexbox (`.flex-column`), alinhamento horizontal (`.justify-content-*`, incluindo `space-between` e `center`), alinhamento vertical (`.align-items-center`) e `flex-grow` (`.flex-grow-1`).
- **Display (`.d-none`, `.d-inline-block`, `.d-block`):** Classes utilitárias para controlar a propriedade `display` dos elementos (`none`, `inline-block`, `block`).
- **Borders (`.rounded`):** Classes utilitárias para adicionar bordas arredondadas (`.rounded`, utilizando a variável `--card-border-radius`).
- **Width & Height (`.w-100`):** Classes utilitárias para definir largura (`.w-100`, 100% de largura).
- **Cursor (`.cursor-pointer`):** Classes utilitárias para definir o cursor como pointer (`.cursor-pointer`).
- **Global Scrollbar Styling (`::-webkit-scrollbar`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-thumb:hover`, `[data-theme="dark"] ::-webkit-scrollbar-track`):** Estilos globais para a barra de rolagem usando pseudo-elementos WebKit, personalizando largura, trilho, thumb e comportamento hover, com ajustes para o modo escuro (usando o atributo `data-theme="dark"`).

## Documentação dos Arquivos JavaScript

### `activity-chart.js`

Este arquivo JavaScript é responsável pela inicialização, carregamento de dados e renderização do gráfico de atividade diária no dashboard.

- **Variável Global `activityChartInstance`:** Armazena a instância do gráfico Chart.js para manipulação e destruição.
- **Função `initActivityChart()`:**
    - Verifica se o gráfico já foi inicializado (`window.activityChartInitialized`) para evitar múltiplas inicializações.
    - Marca o gráfico como inicializado.
    - Obtém o container do gráfico (`.chart-placeholder`).
    - Limpa o container e insere um elemento `<canvas>` com id `activityChart`.
    - Chama `loadActivityData()` para carregar os dados do Firebase.
- **Função `loadActivityData()`:**
    - Obtém a referência para os logs de acesso no Firebase (`firebase.database().ref('access_logs')`).
    - Calcula a data de 7 dias atrás para filtrar os logs.
    - Busca os logs dos últimos 7 dias do Firebase usando `orderByChild('timestamp').startAt(sevenDaysAgoStr).once('value')`.
    - Processa os dados recebidos usando `processActivityData()`.
    - Cria o gráfico com os dados processados chamando `createActivityChart()`.
    - Lida com erros de carregamento, exibindo uma mensagem de erro no container do gráfico.
- **Função `processActivityData(accessLogs)`:**
    - Inicializa `doorInfo` para armazenar informações das portas.
    - Converte o objeto de logs em um array.
    - Define os labels do eixo X como os últimos 7 dias.
    - Inicializa `doorCounts` para armazenar a contagem de acessos por porta e dia.
    - Itera sobre os logs, filtrando por ações `access_granted` e `door_unlocked`, e incrementa a contagem para a porta e dia correspondentes.
    - Retorna um objeto com labels, dias, contagens, informações das portas e IDs das portas.
- **Função `getChartThemeOptions()`:**
    - Detecta se o tema escuro está ativo (`document.documentElement.classList.contains('dark-mode')`).
    - Retorna um objeto com cores de fundo, texto, grid e borda baseadas no tema atual.
- **Função `createActivityChart(data)`:**
    - Obtém o elemento canvas do gráfico (`#activityChart`).
    - Verifica se há portas para mostrar; se não, exibe mensagem de "sem dados".
    - Destrói a instância do gráfico existente (`activityChartInstance.destroy()`) para atualizar o gráfico.
    - Recria o canvas se necessário.
    - Gera cores para as portas usando `generateDoorColors()`.
    - Prepara os datasets para o Chart.js, um dataset para cada porta, mapeando dados por dia.
    - Define as opções de configuração do gráfico, incluindo tipo, dados, opções responsivas, plugins (título, legenda, tooltip), escalas (eixos X e Y com labels e grids), e cores baseadas no tema.
    - Cria uma nova instância do Chart.js (`new Chart(chartCanvas, chartConfig)`) e armazena em `activityChartInstance`.
    - Lida com erros na criação do gráfico, exibindo uma mensagem de erro no container.
- **Função `generateDoorColors(count)`:**
    - Define uma paleta de cores predefinida para até 10 portas.
    - Se o número de portas for menor ou igual a 10, retorna as cores predefinidas.
    - Caso contrário, gera cores programaticamente usando HSL para garantir uma boa distribuição de matiz.
    - Retorna um array de cores em formato hexadecimal.
- **Função `hslToHex(h, s, l)`:**
    - Converte uma cor HSL (Hue, Saturation, Lightness) para o formato hexadecimal.
    - Utiliza cálculos para converter HSL para RGB e então para Hex.
- **Função `adjustColorBrightness(hexColor, percent)`:**
    - Ajusta o brilho de uma cor hexadecimal por uma porcentagem.
    - Converte a cor hex para RGB, ajusta os valores RGB e converte de volta para hex.
- **Inicialização do Gráfico:**
    - Adiciona um event listener para `DOMContentLoaded` que chama `initActivityChart()` quando o DOM estiver carregado.
    - Verifica se a página atual é o dashboard (`document.querySelector('.chart-placeholder') !== null`) antes de inicializar o gráfico.
    - Carrega o script Chart.js dinamicamente se não estiver presente na página, e inicializa o gráfico após o script ser carregado.

### `common.js`

Este arquivo JavaScript contém funções comuns e utilitárias que são utilizadas em várias páginas do sistema SecureLab.

- **Função `checkAuth()`:**
    - Utiliza `firebase.auth().onAuthStateChanged()` para verificar o estado de autenticação do usuário.
    - Se o usuário não estiver autenticado, redireciona para a página de login (`/login.html`).
    - Se autenticado, chama `loadCurrentUserName()` e `loadAlertsCount()`.
- **Função `loadCurrentUserName()`:**
    - Obtém o usuário autenticado atualmente (`firebase.auth().currentUser`).
    - Busca a lista de usuários do Firebase (`database.ref('users').once('value')`).
    - Encontra o usuário atual na lista com base no email.
    - Atualiza elementos HTML com id `current-user-name` com o nome do usuário.
- **Função `loadAlertsCount()`:**
    - Busca a lista de dispositivos do Firebase (`database.ref('devices').once('value')`).
    - Conta dispositivos offline para simular contagem de alertas.
    - Atualiza elementos HTML com ids `alerts-count` e `header-alerts-count` com a contagem de alertas.
- **Função `initSidebar()`:**
    - Obtém o botão de toggle da sidebar (`#sidebar-toggle`).
    - Adiciona um event listener para alternar a classe `sidebar-collapsed` no container principal (`.app-container`) ao clicar no botão.
- **Função `initLogout()`:**
    - Obtém o botão de logout (`#logout-btn`).
    - Adiciona um event listener para realizar logout do Firebase (`firebase.auth().signOut()`) ao clicar no botão.
    - Redireciona para a página de login após logout bem-sucedido.
    - Exibe notificação de erro em caso de falha no logout.
- **Função `showNotification(type, message, duration = 3000)`:**
    - Exibe notificações na tela com diferentes tipos (success, error, warning, info).
    - Cria um container de notificações se não existir (`#notification-container`).
    - Cria um elemento de notificação (`.notification`) com base no tipo e mensagem.
    - Define ícone baseado no tipo de notificação.
    - Adiciona a notificação ao container e inicia animação de entrada.
    - Configura um botão de fechar e auto-fechamento após o tempo definido.
- **Função `closeNotification(notification)`:**
    - Fecha uma notificação específica, removendo a classe `show` para iniciar animação de saída e removendo o elemento após a animação.
- **Função `setupModal(modalId, openBtn, closeBtn, cancelBtn)`:**
    - Configura um modal com base em IDs de modal e botões de abrir, fechar e cancelar.
    - Adiciona classe `modal-container` ao modal se necessário.
    - Adiciona event listeners aos botões para abrir e fechar o modal.
    - Fecha o modal ao clicar fora do conteúdo do modal.
- **Função `openModal(modalId)`:**
    - Abre um modal específico, adicionando as classes `modal-open` ao body e `active` ao modal.
- **Função `closeModal(modalId)`:**
    - Fecha um modal específico, removendo as classes `modal-open` do body e `active` do modal.
- **Função `formatDate(isoString)`:**
    - Formata uma string ISO de data para o formato DD/MM/AAAA.
- **Função `formatDateTime(isoString)`:**
    - Formata uma string ISO de data e hora para o formato DD/MM/AAAA HH:MM.
- **Função `formatStatus(status)`:**
    - Formata strings de status para exibição amigável (ex: 'active' para 'Ativo').
- **Função `getStatusClass(status)`:**
    - Retorna uma classe CSS com base no status (ex: 'success' para 'active', 'danger' para 'offline').
- **Função `capitalize(string)`:**
    - Capitaliza a primeira letra de uma string.
- **Função `translateRole(role)`:**
    - Traduz roles (ex: 'admin' para 'Administrador').
- **Função `isValidEmail(email)`:**
    - Valida o formato de um e-mail usando uma expressão regular.
- **Função `isValidPassword(password)`:**
    - Valida se uma senha tem pelo menos 6 caracteres.
- **Inicialização de Funções Comuns:**
    - Adiciona um event listener para `DOMContentLoaded` para executar funções de inicialização (`checkAuth`, `initSidebar`, `initLogout`).
    - Adiciona estilos CSS para notificações dinamicamente se não existirem (`#notification-styles`).

### `devices.js`

Este arquivo JavaScript gerencia a funcionalidade da página de dispositivos, incluindo listagem, filtragem, edição, adição e configurações de dispositivos.

- **Variáveis Globais:**
    - `devices`: Array para armazenar dados de dispositivos.
    - `currentDeviceId`: ID do dispositivo atualmente selecionado ou sendo editado.
    - `PAGE_SIZE`: Constante para definir o número de dispositivos por página na paginação.
    - `currentPage`: Número da página atual na paginação.
- **Função `initModals()`:**
    - Chama `setupModal()` para inicializar os modais de dispositivo, configuração e confirmação, associando-os aos seus respectivos botões de abertura e fechamento.
- **Função `setupEventListeners()`:**
    - Configura event listeners para:
        - Botões de adicionar, salvar dispositivo e salvar configurações.
        - Filtros de status, tipo, firmware e busca.
        - Botão de resetar filtros.
        - Botões de reiniciar dispositivo, reset de fábrica, verificar atualizações e download de logs no modal de configuração.
        - Alternador de modo IP (DHCP/Estático).
        - Botões de copiar e regenerar token API.
        - Toggle de senha Wi-Fi.
        - Navegação por abas no modal de configuração.
        - Navegação de paginação (botões "Página Anterior" e "Próxima Página").
        - Ações dos dispositivos na tabela (editar, reiniciar, diagnóstico, configurar) após renderização.
- **Função `setupDeviceActions()`:**
    - Seleciona todos os botões de ação (editar, reiniciar, diagnóstico, configurar) na tabela de dispositivos e adiciona event listeners para cada ação, recuperando o nome do dispositivo da linha correspondente da tabela.
- **Função `mockDevicesData()`:**
    - Simula o carregamento de dados de dispositivos, utilizando um array `devices` com dados mockados para demonstração e desenvolvimento.
    - Renderiza os dispositivos na tabela chamando `renderDevices()`.
    - Atualiza a paginação chamando `updatePagination()`.
    - Atualiza as estatísticas dos dispositivos chamando `updateDeviceStats()`.
- **Função `renderDevices()`:**
    - Obtém o corpo da tabela de dispositivos (`#devices-table-body`).
    - Limpa o conteúdo da tabela.
    - Aplica paginação para exibir apenas os dispositivos da página atual.
    - Itera sobre os dispositivos a serem exibidos e cria linhas (`<tr>`) para cada um, preenchendo as células (`<td>`) com informações do dispositivo (nome, tipo, localização, status, firmware, última atividade, ações).
    - Adiciona os badges de status formatados e ícones de atualização de firmware.
    - Renderiza os botões de ação (editar, reiniciar, diagnóstico, configurar) para cada dispositivo.
    - Adiciona as linhas criadas ao corpo da tabela.
    - Chama `setupDeviceActions()` após renderização para garantir que os botões de ação estejam funcionais.
- **Função `updatePagination()`:**
    - Atualiza as informações de paginação (índice inicial, índice final, total de dispositivos) nos elementos HTML correspondentes (`#pagination-start`, `#pagination-end`, `#pagination-total`).
    - Atualiza o estado dos botões de navegação de página (`#prev-page`, `#next-page`) com base na página atual e no total de páginas.
    - Atualiza os números das páginas na paginação (`#pagination-numbers`), criando botões para cada página e adicionando event listeners para mudança de página.
- **Função `updateDeviceStats()`:**
    - Calcula e atualiza as estatísticas dos dispositivos:
        - Contagem de dispositivos online e total (`#online-devices-count`, `#devices-status`).
        - Barra de progresso de dispositivos online (`#devices-progress`, `#devices-percentage`).
        - Contagem detalhada de dispositivos online e offline (`#online-devices`, `#offline-devices`).
        - Versão do firmware (assumindo versão comum para todos online) (`#firmware-version`).
    - Chama `updateBenchmarkMetrics()` para atualizar as métricas de benchmark dos dispositivos online.
- **Função `openDeviceModal(device = null)`:**
    - Abre o modal de dispositivo (`#deviceModal`) para adicionar um novo dispositivo ou editar um existente.
    - Se `device` for fornecido (modo de edição):
        - Preenche os campos do formulário com os dados do dispositivo.
        - Define o título do modal para "Editar Dispositivo".
    - Se `device` for null (modo de adição):
        - Limpa o formulário.
        - Define o título do modal para "Adicionar Novo Dispositivo".
- **Função `openConfigModal(device)`:**
    - Abre o modal de configuração (`#configModal`) para um dispositivo específico.
    - Define o título do modal com o nome do dispositivo.
    - Preenche campos de configuração com dados do dispositivo (nome, localização, etc.).
    - Define a aba ativa para "Geral" por padrão.
- **Função `saveDevice()`:**
    - Obtém os valores do formulário de dispositivo.
    - Valida os campos obrigatórios (nome, tipo, localização).
    - Cria um objeto `device` com os dados do formulário.
    - Se `currentDeviceId` estiver definido (modo de edição):
        - Atualiza o dispositivo existente no array `devices`.
        - Exibe notificação de sucesso.
    - Se `currentDeviceId` for null (modo de adição):
        - Gera um novo ID para o dispositivo usando `generateUUID()`.
        - Adiciona o novo dispositivo ao array `devices`.
        - Exibe notificação de sucesso.
    - Fecha o modal de dispositivo.
    - Re-renderiza a tabela de dispositivos, atualiza paginação e estatísticas.
- **Função `saveDeviceConfig()`:**
    - Simula o salvamento das configurações do dispositivo (em uma aplicação real, salvaria no servidor/Firebase).
    - Exibe notificação de sucesso.
    - Fecha o modal de configuração.
- **Função `applyFilters()`:**
    - Obtém os valores dos filtros (status, tipo, firmware, texto de busca).
    - Recarrega os dados mockados (substituir por chamada de API real).
    - Aplica os filtros ao array `devices` com base nos valores dos filtros.
    - Reseta a paginação para a primeira página.
    - Re-renderiza a tabela de dispositivos e atualiza a paginação.
- **Função `resetFilters()`:**
    - Limpa os campos de filtro (status, tipo, firmware, busca).
    - Recarrega e renderiza todos os dispositivos sem filtros.
- **Função `confirmAction(title, message, onConfirm, confirmButtonText = 'Confirmar')`:**
    - Abre um modal de confirmação (`#confirm-modal`) com um título, mensagem e função de callback para o botão de confirmação.
- **Função `openModal(modalId)`:**
    - Exibe um modal específico pelo ID.
- **Função `closeModal(modalId)`:**
    - Oculta um modal específico pelo ID.
- **Função `showNotification(message, type = 'info')`:**
    - Exibe uma notificação na tela (se a função global `showNotification` existir, usa ela; senão, usa uma implementação local).
- **Função `formatDate(date)`:**
    - Formata um objeto `Date` para uma string de data e hora no formato pt-BR.
- **Função `debounce(func, wait)`:**
    - Implementação da função utilitária de debounce para limitar a frequência de execução de uma função.
- **Função `generateUUID()`:**
    - Gera um UUID (Universally Unique Identifier) simples para IDs de dispositivos.
- **Function `getDeviceTypeName(typeCode)`:**
    - Retorna o nome legível do tipo de dispositivo baseado no código do tipo.
- **Function `findDeviceByName(name)`:**
    - Busca e retorna um dispositivo no array `devices` pelo nome.
- **Function `setupTabStyles()`:**
    - Adiciona estilos CSS dinamicamente para as abas no modal de configuração, caso ainda não existam na página.
- **Inicialização:**
    - Adiciona um event listener para `DOMContentLoaded` para inicializar a página quando o DOM estiver pronto, chamando `initModals()`, `setupEventListeners()`, `mockDevicesData()`, e `setupTabStyles()`.

### `doors.js`

Este arquivo JavaScript gerencia a funcionalidade da página de portas, incluindo listagem, adição, edição, controle de status (trancar/destrancar) e exclusão de portas.

- **Variáveis Globais:**
    - `doors`: Array para armazenar dados de portas.
    - `currentDoorId`: ID da porta atualmente selecionada ou sendo editada.
    - `doorsRef`: Referência para o nó 'doors' no Firebase Realtime Database.
- **Função `initDoorManagement()`:**
    - Função de inicialização principal da página de gerenciamento de portas.
    - Chama `setupEventListeners()` para configurar os listeners de eventos.
    - Chama `loadDoors()` para carregar os dados das portas do Firebase.
- **Função `setupEventListeners()`:**
    - Configura event listeners para:
        - Botão "Nova Porta" (`#addDoorBtn`) para abrir o modal de adição/edição de portas (`openDoorModal()`).
        - Botão "Salvar" no modal de portas (`#saveDoorBtn`) para lidar com o envio do formulário de portas (`handleDoorFormSubmit()`).
        - Campo de pesquisa (`#searchInput`) para filtrar portas na tabela (`renderDoors()`).
        - Botões "Trancar Porta" (`#lockDoorBtn`) e "Destrancar Porta" (`#unlockDoorBtn`) no modal de controle de portas (`controlDoor()`).
        - Botões de fechar modais (`.close-modal`) para fechar modais genéricos.
        - Botão "Cancelar" no modal de portas (`#cancelBtn`) para fechar o modal de portas.
        - Botão "Fechar" no modal de controle de portas (`#closeControlBtn`) para fechar o modal de controle de portas.
- **Função `loadDoors()`:**
    - Carrega dados das portas do Firebase usando `doorsRef.on('value', ...)` para escutar por atualizações em tempo real.
    - Limpa o array `doors` e preenche com os dados do snapshot do Firebase.
    - Chama `renderDoors()` para atualizar a tabela de portas na UI.
    - Lida com erros ao carregar dados, exibindo uma notificação de erro.
- **Função `renderDoors()`:**
    - Renderiza a lista de portas na tabela HTML (`#doorsTable tbody`).
    - Limpa o conteúdo da tabela.
    - Filtra as portas com base no texto de pesquisa do campo `#searchInput`.
    - Ordena as portas por nome em ordem alfabética.
    - Se não houver portas para exibir, exibe uma linha indicando "Nenhuma porta encontrada".
    - Para cada porta, cria uma linha `<tr>` na tabela com colunas para nome, localização, status (com ícone), última atividade e botões de ação (editar, controlar, excluir).
    - Configura event listeners para os botões "Editar" e "Controlar" de cada linha diretamente no código de renderização.
    - Adiciona um botão de "Excluir" com um listener para `confirmDeleteDoor()`.
- **Função `confirmDeleteDoor(door)`:**
    - Abre um modal de confirmação (`#confirm-modal`) antes de excluir uma porta.
    - Define o título e a mensagem do modal de confirmação para a exclusão da porta.
    - Configura o botão "Confirmar" no modal para chamar `deleteDoor(door.id)`.
- **Função `deleteDoor(doorId)`:**
    - Exclui uma porta específica do Firebase usando `doorsRef.child(doorId).remove()`.
    - Exibe notificações de sucesso ou erro após a tentativa de exclusão.
- **Função `openDoorModal(door = null)`:**
    - Abre o modal de adição/edição de portas (`#doorModal`).
    - Limpa o formulário do modal.
    - Define o título do modal como "Editar Porta" ou "Adicionar Nova Porta" dependendo se `door` é fornecido ou não.
    - Se `door` for fornecido (modo de edição):
        - Preenche os campos do formulário com os dados da porta.
        - Oculta o campo de status inicial, pois não é editável.
    - Se `door` for null (modo de adição):
        - Define o status inicial como "locked".
        - Exibe o campo de status inicial.
    - Exibe o modal de forma segura, garantindo que seja visível e interativo.
- **Função `handleDoorFormSubmit()`:**
    - Lida com o envio do formulário de portas.
    - Valida os campos obrigatórios (nome, localização).
    - Coleta dados do formulário (nome, localização, status - apenas para novas portas).
    - Salva os dados no Firebase:
        - Se `currentDoorId` estiver definido (modo de edição), atualiza a porta existente usando `doorsRef.child(currentDoorId).update(doorData)`.
        - Se `currentDoorId` for null (modo de adição), adiciona uma nova porta usando `doorsRef.push(doorData)`.
    - Exibe notificações de sucesso ou erro após a tentativa de salvar.
    - Fecha o modal de portas.
- **Função `openControlModal(door)`:**
    - Abre o modal de controle de portas (`#controlDoorModal`) para uma porta específica.
    - Armazena o ID da porta atual em `currentDoorId`.
    - Preenche o título do modal, o nome da porta e o status atual da porta no modal.
    - Ajusta a visibilidade dos botões "Trancar Porta" e "Destrancar Porta" com base no status atual da porta.
    - Exibe o modal de forma segura, garantindo que seja visível e interativo.
- **Função `controlDoor(action)`:**
    - Controla o status de uma porta (trancar ou destrancar).
    - Atualiza o status da porta no Firebase (`doorsRef.child(currentDoorId).update(statusUpdate)`), incluindo o timestamp da última mudança de status.
    - Registra um log de acesso no Firebase (`firebase.database().ref('access_logs').push(logData)`), incluindo informações do usuário, porta, ação e método.
    - Fecha o modal de controle de portas.
    - Exibe notificações de sucesso ou erro após a tentativa de controle.
- **Função `closeModal(modalId)`:**
    - Oculta um modal específico pelo ID, definindo `display: 'none'`.
- **Função `showNotification(message, type = 'info')`:**
    - Exibe notificações na tela (se a função global `showNotification` existir, usa ela; senão, usa uma implementação local).
- **Função `formatDate(date)`:**
    - Formata um objeto `Date` para uma string de data e hora no formato pt-BR.
- **Verificação de Elementos do Modal:**
    - Adiciona um event listener para `DOMContentLoaded` para verificar se os elementos dos modais existem no DOM e logar sua estrutura no console para debugging.

### `dashboard.js`

Este arquivo JavaScript é responsável pela lógica e carregamento de dados para o dashboard principal do sistema SecureLab.

- **Função `loadDashboardData()`:**
    - Função principal para carregar todos os dados necessários para o dashboard.
    - Obtém o nome do usuário atual autenticado e exibe no dashboard.
    - Chama as seguintes funções para carregar estatísticas e dados:
        - `loadUserStats()`: Carrega e atualiza as estatísticas de usuários.
        - `loadDoorStats()`: Carrega e atualiza as estatísticas de portas e a lista de portas.
        - `loadDeviceStats()`: Carrega e atualiza as estatísticas de dispositivos e métricas de benchmark.
        - `loadRecentActivity()`: Carrega e atualiza os logs de atividade recentes.
        - `loadAlerts()`: Carrega e atualiza os alertas.
- **Função `loadUserStats()`:**
    - Carrega estatísticas de usuários do Firebase (`database.ref('users').once('value')`).
    - Atualiza contadores de usuários ativos e total (`#active-users-count`, `#users-label`).
    - Simula tendência de usuários (valor fixo '5%').
- **Função `loadDoorStats()`:**
    - Carrega estatísticas de portas do Firebase (`database.ref('doors').limitToLast(7).once('value')`).
    - Atualiza o contador de portas (`#doors-count`).
    - Conta portas trancadas e destrancadas e atualiza os contadores (`#locked-doors-count`, `#unlocked-doors-count`).
    - Ordena as portas por nome e atualiza a lista de portas no dashboard chamando `updateDoorList()`.
- **Função `loadDeviceStats()`:**
    - Carrega estatísticas de dispositivos do Firebase (`database.ref('devices').once('value')`).
    - Atualiza o status geral dos dispositivos (online/total) e a barra de progresso (`#devices-status`, `#devices-progress`, `#devices-percentage`).
    - Atualiza estatísticas detalhadas (online, offline, versão do firmware) (`#online-devices`, `#offline-devices`, `#firmware-version`).
    - Chama `updateBenchmarkMetrics()` para atualizar as métricas de benchmark com base nos dispositivos online.
- **Função `updateBenchmarkMetrics(onlineDevices)`:**
    - Atualiza as barras de benchmark e valores com base nas métricas do dispositivo mais sobrecarregado (hotspot device).
    - Se não houver dispositivos online, reseta as métricas chamando `resetBenchmarkMetrics()`.
    - Encontra o dispositivo mais sobrecarregado com base no uso da CPU.
    - Atualiza barras e valores para CPU, RAM, temperatura e latência chamando `updateBenchmarkBar()` para cada métrica.
    - Atualiza informações do dispositivo hotspot (`#hotspot-device-name`, `#hotspot-device-load`).
- **Função `updateBenchmarkBar(id, value, unit)`:**
    - Atualiza uma barra de benchmark específica e seu valor de texto.
    - Calcula a largura da barra com base no valor e no máximo valor esperado para cada métrica.
    - Adiciona classes CSS (`normal`, `warning`, `critical`) à barra com base no valor para indicar criticidade.
    - Atualiza o texto do valor com o valor e a unidade correspondente.
- **Função `resetBenchmarkMetrics()`:**
    - Reseta todas as barras de benchmark para 0% e os valores para 0.
    - Reseta as informações do dispositivo hotspot para '-'.
- **Função `loadRecentActivity()`:**
    - Carrega os logs de atividade recentes do Firebase (`database.ref('access_logs').orderByChild('timestamp').limitToLast(7).once('value')`).
    - Atualiza os contadores de acessos de hoje (permitidos e negados) (`#today-access-count`, `#today-denied-count`).
    - Simula tendência de acesso (valor fixo '8%').
    - Preenche a lista de atividades recentes (`#activity-list`) com os logs, formatando data, hora, usuário, ação e porta.
    - Se não houver logs, exibe mensagem "Nenhuma atividade recente".
- **Função `updateDoorList(doors)`:**
    - Atualiza a lista de portas no dashboard (`#door-list`).
    - Limpa a lista atual.
    - Preenche a lista com itens `<li>` para cada porta, exibindo nome, localização, status (com ícone) e um botão de ação para trancar/destrancar.
    - Chama `setupDoorActionButtons()` para adicionar event listeners aos botões de ação das portas.
    - Se não houver portas, exibe mensagem "Nenhuma porta encontrada".
- **Função `setupDoorActionButtons()`:**
    - Seleciona todos os botões de ação de porta (`[data-door-id]`) e adiciona event listeners para alternar o estado de tranca da porta (`toggleDoorLock()`).
- **Função `toggleDoorLock(doorId, action)`:**
    - Alterna o estado de tranca de uma porta específica no Firebase (`database.ref('doors/${doorId}`).update(statusUpdate)`).
    - Registra um log de acesso no Firebase (`firebase.database().ref('access_logs').push(logData)`).
    - Atualiza as estatísticas de portas chamando `loadDoorStats()`.
    - Exibe notificação de sucesso.
- **Função `loadAlerts()`:**
    - Carrega alertas (simulados com base em dispositivos offline) do Firebase (`database.ref('devices').once('value')`).
    - Conta dispositivos offline e atualiza contadores de alertas (`#alerts-count`, `#header-alerts-count`, `#alert-count-badge`).
    - Preenche a lista de alertas (`#alerts-list`) com itens `<li>` para cada dispositivo offline, exibindo nome, detalhes e um botão "Verificar".
    - Se não houver alertas, exibe mensagem "Nenhum alerta ativo".
- **Função `formatDateTime(isoString)`:**
    - Formata uma string ISO de data e hora para o formato DD/MM/AAAA HH:MM (utilizada para exibir timestamps de alertas).
- **Event Listeners para Botões de Refresh:**
    - Adiciona event listeners para botões de refresh da atividade recente e lista de portas (`#refresh-activity`, `#refresh-doors`) para chamar `loadRecentActivity()` e `loadDoorStats()` respectivamente.
- **Event Listener para Sidebar Toggle:**
    - Adiciona event listener para o botão de toggle da sidebar (`#sidebar-toggle`) para alternar a classe `sidebar-collapsed` no container principal.
- **Inicialização:**
    - Adiciona um event listener para `DOMContentLoaded` para carregar os dados do dashboard (`loadDashboardData()`) quando a página estiver completamente carregada.

### `firebase-config.js`

Este arquivo JavaScript contém a configuração e inicialização do Firebase para o projeto SecureLab.

- **`firebaseConfig` Object:**
    - Define um objeto `firebaseConfig` com as credenciais de configuração do Firebase, incluindo `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, e `appId`.
    - **IMPORTANTE:** As credenciais fornecidas (`apiKey: "AIzaSyAQOogYuOAKJt4irq17qvuOadGTA5dr08o"`, etc.) são de exemplo e devem ser substituídas pelas credenciais reais do projeto Firebase do usuário.
- **`firebase.initializeApp(firebaseConfig)`:**
    - Inicializa o Firebase utilizando as configurações definidas em `firebaseConfig`.
- **`auth = firebase.auth()`:**
    - Obtém uma referência para o serviço de autenticação do Firebase (`firebase.auth()`).
- **`database = firebase.database()`:**
    - Obtém uma referência para o serviço de banco de dados Realtime Database do Firebase (`firebase.database()`).
- **`auth.onAuthStateChanged(user => { ... })`:**
    - Configura um listener para o estado de autenticação do Firebase (`auth.onAuthStateChanged`).
    - Este listener é executado sempre que o estado de autenticação do usuário muda.
    - Se um `user` está autenticado:
        - Loga no console 'Usuário autenticado:' seguido pelo email do usuário.
        - Chama `loadDashboardData()` para carregar os dados do dashboard.
    - Se nenhum `user` está autenticado:
        - Loga no console 'Nenhum usuário autenticado'.
        - Redireciona a janela para a página de login (`login.html`).
- **`document.getElementById('logout-btn')?.addEventListener('click', () => { ... })`:**
    - Adiciona um event listener ao botão de logout (`#logout-btn`).
    - Ao clicar no botão de logout:
        - Chama `auth.signOut()` para desautenticar o usuário do Firebase.
        - Em caso de sucesso, redireciona a janela para a página de login (`login.html`).
        - Em caso de erro, loga o erro no console.

### `gemini-assistant.js`

Este arquivo JavaScript implementa a classe `GeminiAssistant` para gerenciar a interface e a lógica do assistente Gemini no SecureLab.

- **Verificação da Disponibilidade do Serviço Gemini:**
    - Inicia com uma verificação para garantir que o arquivo `gemini-service.js` foi carregado antes, logando um erro no console se `window.geminiService` não estiver definido.
- **Classe `GeminiAssistant`:**
    - **Construtor:**
        - Inicializa propriedades como `initialized`, `visible`, `container`, `conversationContainer`, `inputField`, `systemContext`, `pendingSystemData`, `commandHistory` e `historyIndex`.
    - **`init()`:**
        - Verifica se o assistente já está inicializado (`this.initialized`).
        - Cria e adiciona o container principal do assistente (`.gemini-assistant`) ao body do documento, definindo sua estrutura HTML interna (header, área de conversa, sugestões, campo de input).
        - Obtém referências para elementos importantes do DOM dentro do container (área de conversa, campo de input, botão de envio).
        - Chama `_setupEventListeners()` para configurar os event listeners para interação do usuário.
        - Adiciona uma mensagem de boas-vindas do assistente à conversa.
        - Chama `_initSystemContext()` para inicializar a coleta de contexto do sistema.
        - Marca o assistente como inicializado (`this.initialized = true`).
        - Inicializa o estado de visibilidade do assistente como minimizado em dispositivos móveis e visível em desktops, chamando `toggle()`.
    - **`_setupEventListeners()`:**
        - Configura event listeners para:
            - Botão de envio (`.gemini-send-btn`) para chamar `_handleSendMessage()` ao clicar.
            - Tecla "Enter" no campo de input (`.gemini-input`) para enviar mensagem (sem Shift) e para navegação no histórico de comandos com setas para cima e para baixo.
            - Input do campo de texto (`.gemini-input`) para habilitar/desabilitar o botão de envio baseado no conteúdo, e para auto-expandir a altura do textarea.
            - Botão de toggle (`.gemini-toggle-btn`) para chamar `toggle()` ao clicar.
            - Botão de limpar conversa (`.gemini-clear-btn`) para chamar `clearConversation()` ao clicar.
            - Botões de sugestão (`.gemini-suggestion`) para preencher o campo de input com a sugestão e enviar a mensagem ao clicar.
    - **`_initSystemContext()`:**
        - Inicializa o contexto do sistema (`this.systemContext`) com informações básicas como usuário atual (se autenticado), página atual e data/hora.
        - Define `this.pendingSystemData = true` para indicar que dados adicionais do sistema precisam ser carregados posteriormente.
    - **`_loadSystemData()`:**
        - Carrega dados adicionais do sistema de forma assíncrona (usuários, portas, dispositivos) do Firebase usando `Promise.all()` e `firebase.database().ref(...).once('value')`.
        - Processa os snapshots dos dados e adiciona contagens de usuários, portas e dispositivos, e estatísticas de status de dispositivos e portas ao `this.systemContext`.
        - Define `this.pendingSystemData = false` após carregar os dados.
        - Retorna `this.systemContext` com os dados carregados.
    - **`_handleSendMessage()`:**
        - Obtém a mensagem do usuário do campo de input e limpa espaços em branco.
        - Se a mensagem não estiver vazia:
            - Adiciona a mensagem ao histórico de comandos (`this.commandHistory`).
            - Adiciona a mensagem do usuário à conversa na UI (`_addMessage('user', message)`).
            - Limpa o campo de input e desabilita o botão de envio.
            - Chama `_loadSystemData()` para garantir que o contexto do sistema esteja atualizado.
            - Adiciona um indicador de carregamento do assistente (`_addMessage('assistant', ...)`).
            - Verifica se a mensagem parece ser um comando usando `_isCommand(message)`.
            - Se for um comando, chama `_processCommand(message, systemContext)`.
            - Se não for um comando (conversação normal), chama `window.geminiService.sendMessage(message, systemContext, { isConversation: true })` para enviar a mensagem ao Gemini para resposta em linguagem natural.
            - Substitui o indicador de carregamento pela resposta do Gemini usando `_updateMessage()`.
        - Lida com erros ao processar a mensagem, exibindo uma mensagem de erro do assistente.
        - Rola a conversa para o final usando `_scrollToBottom()`.
    - **`_isCommand(message)`:**
        - Verifica se uma mensagem parece ser um comando baseando-se em padrões regex que indicam intenções de comando (começando com `/` ou verbos de ação como "mostrar", "trancar", etc.).
    - **`_processCommand(command, systemContext)`:**
        - Adiciona um indicador de carregamento do assistente à conversa.
        - Chama `window.geminiService.processCommand(command, systemContext)` para processar o comando usando o serviço Gemini, que retorna um comando processado estruturado.
        - Verifica se o comando processado requer confirmação (`processedCommand.confirmation`).
        - Se precisar de confirmação, substitui o indicador de carregamento por uma mensagem de confirmação com botões "Sim" e "Não" (`_updateMessage('assistant-confirmation', ...)`), e adiciona event listeners para os botões de confirmação para executar ou cancelar o comando.
        - Se não precisar de confirmação, chama `_executeCommand(processedCommand, loadingMsg)` diretamente.
        - Lida com erros ao processar o comando, exibindo uma mensagem de erro do assistente.
    - **`_executeCommand(processedCommand, messageElement)`:**
        - Executa diferentes tipos de comandos baseando-se em `processedCommand.intent`:
            - `query`: Chama `_executeQueryCommand(processedCommand, messageElement)`.
            - `action`: Chama `_executeActionCommand(processedCommand, messageElement)`.
            - `config`: Chama `_executeConfigCommand(processedCommand, messageElement)`.
            - `default`: Exibe uma mensagem informando que o comando não é suportado.
        - Lida com erros ao executar o comando, exibindo uma mensagem de erro do assistente.
    - **`_executeQueryCommand(processedCommand, messageElement)`:**
        - Executa comandos de consulta baseando-se em `processedCommand.action`, como listar usuários, portas, dispositivos offline, acessos recentes e resumo do sistema.
        - Para cada tipo de consulta, busca os dados necessários do Firebase e formata a resposta em HTML (tabelas, dashboards, grids de informação).
        - Atualiza o elemento da mensagem com a resposta formatada usando `_updateMessage()`.
    - **`_executeActionCommand(processedCommand, messageElement)`:**
        - Executa comandos de ação baseando-se em `processedCommand.action`, como trancar/destrancar porta, reiniciar dispositivo e analisar logs.
        - Para cada tipo de ação, realiza as operações correspondentes (atualizar status da porta no Firebase, simular reinicialização de dispositivo, analisar logs usando `_executeLogsAnalysisCommand()`).
        - Atualiza o elemento da mensagem com a resposta formatada usando `_updateMessage()`.
    - **`_executeLogsAnalysisCommand(processedCommand, messageElement)`:**
        - Processa o comando de análise de logs diretamente no chat.
        - Busca logs de acesso do Firebase dos últimos 30 dias, limitados a 500 registros.
        - Calcula estatísticas gerais dos logs (totais, acessos permitidos/negados, portas trancadas/destrancadas).
        - Agrupa logs por dia para análise de tendências.
        - Calcula contagem de acessos por usuário e por porta.
        - Formata os resultados em HTML, incluindo dashboards de estatísticas, gráficos de barra para distribuição diária, insights de usuários e portas mais ativos.
        - Atualiza o elemento da mensagem com os resultados formatados da análise de logs.
    - **`_executeConfigCommand(processedCommand, messageElement)`:**
        - Executa comandos de configuração (atualmente apenas exibe uma mensagem informando que configurações sensíveis devem ser feitas via interface administrativa).
        - Atualiza o elemento da mensagem com a resposta formatada usando `_updateMessage()`.
    - **`_addMessage(role, content)`:**
        - Adiciona uma mensagem à conversa na UI.
        - Cria um elemento `<div>` com classes `gemini-message` e `gemini-${role}-message`.
        - Adiciona um avatar para mensagens do assistente.
        - Define o conteúdo da mensagem (`content`).
        - Adiciona o elemento de mensagem ao container da conversa (`this.conversationContainer`).
        - Rola a conversa para o final (`_scrollToBottom()`).
        - Retorna o elemento de mensagem criado.
    - **`_updateMessage(messageElement, role, content)`:**
        - Atualiza o conteúdo de uma mensagem existente na UI.
        - Atualiza a classe do elemento de mensagem para `gemini-message gemini-${role}-message`.
        - Atualiza o `innerHTML` do elemento de conteúdo da mensagem (`.gemini-message-content`).
        - Rola a conversa para o final (`_scrollToBottom()`).
    - **`_scrollToBottom()`:**
        - Rola o container da conversa (`.gemini-conversation-container`) para o final para mostrar a mensagem mais recente.
    - **`_formatResponse(response)`:**
        - Formata a resposta do Gemini para exibição em HTML.
        - Formata blocos de código (``` ```) para `<pre class="gemini-code-block"><code>...</code></pre>`.
        - Formata código inline (`) para `<code>...</code>`.
        - Formata listas (-, *) para `<ul><li>...</li></ul>`.
        - Formata títulos (#, ##, ###) para `<h4-h6>`.
        - Formata parágrafos (<p>).
        - Formata quebras de linha (<br>).
        - Escapa caracteres HTML usando `_escapeHtml()`.
    - **`_escapeHtml(html)`:**
        - Escapa caracteres HTML especiais (&, <, >, ", ') para evitar injeção de código e garantir exibição correta.
    - **`toggle(visible)`:**
        - Alterna a visibilidade do assistente entre minimizado e maximizado.
        - Atualiza classes CSS (`gemini-minimized`) e ícones do botão de toggle (`.gemini-toggle-btn i`) para refletir o estado atual.
    - **`clearConversation()`:**
        - Limpa o conteúdo da conversa na UI (`this.conversationContainer.innerHTML = '';`).
        - Limpa o histórico de conversa no serviço Gemini (`window.geminiService.clearConversation()`).
        - Adiciona uma mensagem de boas-vindas do assistente após limpar a conversa.
    - **`generateInsights()`:**
        - Carrega dados do sistema usando `_loadSystemData()`.
        - Chama `window.geminiService.generateInsights(systemData)` para gerar insights usando o serviço Gemini.
        - Chama `_displayInsights(insights)` para exibir os insights no painel lateral (ainda não implementado no código fornecido).
    - **`_displayInsights(insights)`:**
        - Função placeholder para exibir insights no painel lateral (não implementada).
- **Inicialização e Exportação:**
    - Cria uma instância da classe `GeminiAssistant` chamada `geminiAssistant`.
    - Inicializa o assistente (`geminiAssistant.init()`) após o DOM estar carregado, com um pequeno atraso para garantir que outros scripts sejam carregados primeiro.
    - Exporta a instância `geminiAssistant` para uso global no script.

### `gemini-config.js`

Este arquivo JavaScript contém as configurações para a integração com a API Gemini, incluindo a chave de API, endpoint e parâmetros de configuração.

- **`GEMINI_CONFIG` Object:**
    - **`apiKey`:** String contendo a chave de API do Gemini. **IMPORTANTE:** Substituir o valor de exemplo (`"AIzaSyB_zYq8J9iAGLjqjLvHa5JaR6MvdLvPp4k"`) pela chave API real do usuário obtida em [Google AI Studio](https://aistudio.google.com/app/apikey).
    - **`apiEndpoint`:** String contendo o endpoint da API Gemini Pro (`"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent"`).
    - **`maxTokens`:** Número máximo de tokens para a resposta do modelo (1024).
    - **`temperature`:** Temperatura para controlar a criatividade da resposta do modelo (0.7).
    - **`safetySettings`:** Array de objetos definindo configurações de segurança para categorias de conteúdo potencialmente nocivo (HARM_CATEGORY_HARASSMENT, HARM_CATEGORY_HATE_SPEECH, HARM_CATEGORY_SEXUALLY_EXPLICIT, HARM_CATEGORY_DANGEROUS_CONTENT), com o threshold definido para "BLOCK_MEDIUM_AND_ABOVE".
    - **`assistant` Object:** Configurações específicas para a UI do assistente:
        - `initiallyOpen`: Boolean indicando se o assistente deve ser aberto ao carregar a página (false).
        - `autoInitialize`: Boolean indicando se o assistente deve ser inicializado automaticamente (true).
        - `initialDelay`: Número de milissegundos de atraso antes da inicialização (1500ms).
        - `mobileMinimized`: Boolean indicando se o assistente deve ser minimizado em dispositivos móveis (true).
    - **`insights` Object:** Configurações específicas para insights:
        - `autoRefresh`: Boolean indicando se os insights devem ser atualizados automaticamente (true).
        - `refreshInterval`: Intervalo de atualização dos insights em milissegundos (900000ms, 15 minutos).
        - `maxInsights`: Número máximo de insights a serem exibidos (4).
- **Exportação:**
    - Exporta o objeto `GEMINI_CONFIG` como padrão para uso em módulos ES (`export default GEMINI_CONFIG;`).
    - Também define `window.GEMINI_CONFIG = GEMINI_CONFIG;` para compatibilidade com scripts regulares (não modulares).

### `gemini-service.js`

Este arquivo JavaScript implementa a classe `GeminiService`, que gerencia a comunicação com a API Gemini, incluindo o envio de mensagens, processamento de respostas e geração de prompts.

- **`GEMINI_CONFIG` Object (local):**
    - Define um objeto de configuração local `GEMINI_CONFIG` com a mesma estrutura e valores que o arquivo `gemini-config.js`, incluindo `apiKey`, `apiEndpoint`, `maxTokens`, `temperature`, `systemInstruction` e `safetySettings`.
    - **IMPORTANTE:** Novamente, a `apiKey` fornecida é um exemplo e deve ser substituída pela chave API real do usuário.
- **Classe `GeminiService`:**
    - **Construtor:**
        - Inicializa propriedades como `apiKey`, `apiEndpoint`, `conversation` (histórico da conversa, inicialmente vazio) e `systemContext` (contexto do sistema gerado por `_generateSystemContext()`).
    - **`_generateSystemContext()`:**
        - Gera e retorna o contexto do sistema como um objeto.
        - Define o papel como "user" e o conteúdo como um texto instruindo o modelo Gemini sobre seu papel como assistente virtual do sistema SecureLab RFID, detalhando seus conhecimentos, comportamento esperado e limitações.
    - **`sendMessage(message, context = {}, options = {})`:**
        - Função principal para enviar mensagens para a API Gemini.
        - Adiciona a mensagem do usuário ao histórico da conversa (`this.conversation.push(...)`).
        - Cria a estrutura do payload para a API Gemini, incluindo:
            - `contents`: Array contendo o contexto do sistema (apenas na primeira mensagem ou com novo contexto) e o histórico da conversa.
            - `generationConfig`: Configurações de geração como `temperature`, `maxOutputTokens`, `topP`, `topK`.
            - `safetySettings`: Configurações de segurança.
        - Envia uma requisição `POST` para o endpoint da API Gemini (`this.apiEndpoint?key=${this.apiKey}`) com o payload JSON e um timeout aumentado de 120 segundos para modelos "thinking".
        - Verifica se a resposta da API foi bem-sucedida (`response.ok`).
        - Processa a resposta JSON da API.
        - Extrai a resposta de texto do modelo Gemini (`data.candidates[0].content.parts[0].text`).
        - Limpa a resposta para remover raciocínio interno e formatar corretamente para linguagem natural (apenas se for uma conversa normal, sinalizado por `options.isConversation !== false`).
        - Adiciona a resposta do Gemini ao histórico da conversa.
        - Limita o tamanho do histórico da conversa a 10 mensagens para evitar exceder limites de token.
        - Retorna a resposta limpa do Gemini.
        - Lida com erros de comunicação com a API, retornando uma mensagem de erro genérica.
    - **`_looksLikeJSON(text)`:**
        - Verifica se um texto string parece conter JSON, procurando por padrões de início e fim de objetos ou arrays JSON, ou blocos de código com JSON.
    - **`_convertJSONToNaturalText(jsonText)`:**
        - Converte respostas JSON para texto em linguagem natural.
        - Tenta extrair a parte JSON da string, mesmo se estiver dentro de blocos de código.
        - Parsea o JSON e extrai informações relevantes como resumo e insights.
        - Formata os insights em texto natural, incluindo títulos, descrições e prioridades.
        - Se a conversão falhar, retorna uma mensagem de fallback com o JSON bruto.
    - **`_removeThinkingProcess(response)`:**
        - Remove o processo de raciocínio interno da resposta do modelo.
        - Utiliza expressões regulares para identificar e remover padrões comuns de raciocínio interno do modelo (ex: "The user is asking...", "Let's analyze...").
        - Limpa linhas vazias extras e espaços em branco.
        - Retorna a resposta limpa.
    - **`clearConversation()`:**
        - Limpa o histórico de conversa (`this.conversation = [];`).
    - **`generateInsights(systemData)`:**
        - Gera insights baseados nos dados do sistema (`systemData`).
        - Cria um prompt para a API Gemini, incluindo os dados do sistema e instruções para responder APENAS com um JSON válido no formato especificado.
        - Chama `sendMessage(prompt)` para enviar o prompt para a API Gemini.
        - Tenta extrair e parsear o JSON da resposta do Gemini:
            - Primeiro, tenta parsear a resposta inteira como JSON.
            - Se falhar, tenta extrair JSON de dentro de blocos de código ou procura por um objeto JSON isolado.
            - Se ainda falhar, retorna insights de fallback usando `_createFallbackInsights()`.
        - Lida com erros ao gerar insights com a API, retornando insights de fallback em caso de erro.
    - **`_createFallbackInsights(response, errorMessage = null)`:**
        - Método auxiliar para criar insights de fallback em caso de falha ao gerar insights estruturados ou em caso de erro de comunicação.
        - Retorna um objeto JSON com um resumo genérico e um insight de recomendação informando sobre a limitação da análise.
    - **`processCommand(command, systemState)`:**
        - Processa um comando em linguagem natural para o sistema SecureLab.
        - Cria um prompt para a API Gemini, incluindo o comando do usuário, o estado atual do sistema e instruções para identificar a intenção, entidades, parâmetros e ação do comando, e responder APENAS com um JSON válido no formato especificado.
        - Chama `sendMessage(prompt)` para enviar o prompt para a API Gemini.
        - Tenta extrair e parsear o JSON da resposta, lidando com possíveis erros de parsing e retornando um objeto de erro em caso de falha.
    - **`processModelResponse(response, isConversation = true)`:**
        - Detecta e trata respostas truncadas do modelo Gemini Thinking.
        - Chama `_checkForTruncation(response)` para verificar se a resposta parece estar truncada.
        - Se a resposta for JSON e estiver truncada, chama `_fixTruncatedJSON(response)` para tentar corrigir o JSON.
        - Retorna a resposta (corrigida ou original).
    - **`_checkForTruncation(response)`:**
        - Verifica se a resposta parece estar truncada usando expressões regulares para identificar padrões de JSON incompleto.
    - **`_fixTruncatedJSON(truncatedJSON)`:**
        - Tenta corrigir JSON truncado, detectando o início do JSON válido, contando tags e colchetes abertos, adicionando tags fechantes faltantes e tentando parsear o JSON corrigido.
        - Em caso de falha ao corrigir, retorna um JSON de fallback com um insight de erro.
- **Inicialização e Exportação:**
    - Cria uma instância da classe `GeminiService` chamada `geminiService`.
    - Exporta a instância `geminiService` como padrão para uso em módulos ES (`export default geminiService;`).
    - Também define `window.geminiService = geminiService;` para compatibilidade com scripts regulares (não modulares).

### `logs.js`

Este arquivo JavaScript é responsável pela funcionalidade da página de logs, incluindo carregamento, filtragem, paginação e exportação de logs de acesso.

- **Variáveis Globais:**
    - `allLogs`: Array para armazenar todos os logs carregados do Firebase.
    - `filteredLogs`: Array para armazenar logs após aplicação de filtros.
    - `PAGE_SIZE`: Constante para definir o número de logs por página na paginação.
    - `currentPage`: Número da página atual na paginação.
- **Função `initDateFilters()`:**
    - Inicializa os filtros de data com valores padrão (últimos 7 dias até hoje) para os campos de data e hora personalizados (`#start-date`, `#end-date`, `#start-time`, `#end-time`).
- **Função `setupEventListeners()`:**
    - Configura event listeners para:
        - Seletor de período (`#date-range`) para exibir/ocultar filtros de data personalizados.
        - Botão "Aplicar Filtros" (`#apply-filters-btn`) para chamar `applyFilters()`.
        - Botão "Resetar Filtros" (`#reset-filters-btn`) para chamar `resetFilters()`.
        - Botão "Atualizar Logs" (`#refresh-logs`) para chamar `loadLogs()`.
        - Botões de paginação "Página Anterior" (`#prev-page`) e "Próxima Página" (`#next-page`) para navegar entre páginas de logs (`renderLogs()`, `updatePagination()`).
        - Botões "Exportar CSV" (`#export-csv`) e "Exportar PDF" (`#export-pdf`) para chamar `exportLogs()` com o formato correspondente.
- **Função `loadLogs()`:**
    - Exibe uma mensagem de carregamento na lista de atividades (`#activity-list`).
    - Obtém a referência para os logs de acesso no Firebase (`firebase.database().ref('access_logs')`).
    - Busca os últimos 1000 logs do Firebase ordenados por timestamp usando `limitToLast(1000).orderByChild('timestamp').once('value')`.
    - Converte os logs do snapshot para um array de objetos (`allLogs`).
    - Ordena os logs por timestamp (mais recente primeiro).
    - Chama `applyFilters()` para aplicar os filtros atuais e renderizar os logs filtrados.
    - Lida com o caso de não haver logs ou erros ao carregar, exibindo mensagens apropriadas na UI e notificações de erro.
- **Função `applyFilters()`:**
    - Obtém os valores dos filtros (usuário, porta, ação, método, período de data).
    - Determina o período de data com base no seletor de período (`#date-range`) e campos de data/hora personalizados.
    - Filtra o array `allLogs` para criar `filteredLogs` com base nos critérios de filtro selecionados (período, usuário, porta, ação, método).
    - Reseta a paginação para a primeira página (`currentPage = 1`).
    - Chama `renderLogs()`, `updateLogsCount()`, e `updatePagination()` para atualizar a UI com os logs filtrados e paginação.
- **Função `renderLogs()`:**
    - Renderiza os logs filtrados na lista de atividades (`#activity-list`).
    - Limpa o conteúdo da lista de atividades.
    - Verifica se há logs filtrados para exibir; se não, exibe mensagem "Nenhum registro de acesso encontrado com os filtros aplicados".
    - Calcula os índices de início e fim para paginação e obtém os logs da página atual (`logsToShow`).
    - Para cada log na página atual, cria um item `<li>` com informações formatadas (ícone de ação, nome de usuário, badge de ação, método, nome da porta, timestamp, motivo).
    - Adiciona os itens `<li>` à lista de atividades.
- **Função `updateLogsCount()`:**
    - Atualiza o contador de logs exibido na página (`#logs-count`) com o número de logs filtrados (`filteredLogs.length`).
- **Função `updatePagination()`:**
    - Atualiza os elementos de paginação na UI, incluindo:
        - Informações de paginação (início, fim, total de logs) (`#pagination-start`, `#pagination-end`, `#pagination-total`).
        - Botões de navegação "Página Anterior" e "Próxima Página" (`#prev-page`, `#next-page`) - habilitando/desabilitando com base na página atual.
        - Números das páginas (`#pagination-numbers`), gerando botões para cada página visível e adicionando event listeners para mudança de página.
- **Função `getVisiblePageNumbers(currentPage, totalPages)`:**
    - Determina quais números de página devem ser exibidos na paginação para melhorar a usabilidade, especialmente quando há muitas páginas.
    - Lógica para mostrar um subconjunto de páginas com ellipsis (...) para indicar páginas omitidas, mantendo sempre a primeira e a última página visíveis.
- **Função `resetFilters()`:**
    - Reseta todos os filtros de logs para os valores padrão:
        - Limpa os campos de filtro (usuário, porta, ação, método).
        - Reseta o seletor de período para "últimos 7 dias" (`#date-range`).
        - Oculta os filtros de data personalizados.
        - Reinicializa os campos de data para os últimos 7 dias (`initDateFilters()`).
    - Chama `applyFilters()` para re-renderizar os logs com os filtros resetados.
- **Função `exportLogs(format)`:**
    - Inicia o processo de exportação de logs para o formato especificado (CSV ou PDF).
    - Verifica se há logs filtrados para exportar; se não, exibe notificação de aviso.
    - Exibe uma notificação informando que a exportação está em andamento.
    - Chama a função de exportação correspondente (`exportCSV()` para CSV) ou exibe uma notificação de que a exportação PDF não está implementada.
- **Função `exportCSV()`:**
    - Exporta os logs filtrados para um arquivo CSV.
    - Define os cabeçalhos do arquivo CSV.
    - Converte cada log filtrado para uma linha CSV formatada.
    - Cria um blob CSV e um URL para download.
    - Cria um link `<a>` para download, define o nome do arquivo com timestamp, e simula um clique para iniciar o download.
    - Revoga o URL do blob para liberar memória após o download.
    - Exibe notificação de sucesso ou erro na exportação.
- **Função `formatActionForExport(action)`:**
    - Formata o código da ação para uma string legível para exportação (ex: 'access_granted' para 'Acesso Permitido').
- **Função `formatDateForInput(date)`:**
    - Formata um objeto `Date` para uma string no formato YYYY-MM-DD, adequado para inputs de data HTML5.
- **Função `showNotification(message, type = 'info')`:**
    - Exibe notificações na tela (se a função global `showNotification` existir, usa ela; senão, usa uma implementação local).

### `mobile.js`

Este arquivo JavaScript contém funcionalidades específicas para otimizar a experiência do usuário em dispositivos móveis.

- **Event Listener `DOMContentLoaded`:**
    - Garante que o script seja executado após o DOM (Document Object Model) estar completamente carregado.
    - Chama `createMobileElements()` para criar elementos específicos para mobile (como o botão de menu).
    - Chama `setupMobileMenuBehavior()` para configurar o comportamento do menu mobile (toggle e fechar).
    - Adiciona um event listener para o evento `resize` da janela, chamando `handleResize()` para lidar com mudanças no tamanho da tela.
    - Chama `handleResize()` uma vez para configurar o estado inicial da interface com base no tamanho da tela no carregamento da página.
- **Função `handleResize()`:**
    - Obtém o container principal da aplicação (`.app-container`).
    - Verifica se a largura da janela é menor ou igual a 768px (breakpoint para mobile).
    - Se for mobile, garante que o menu mobile esteja fechado inicialmente (`appContainer.classList.remove('show-mobile-menu')`).
- **Função `createMobileElements()`:**
    - Cria elementos específicos para a interface mobile, se ainda não existirem no DOM:
        - **Mobile Menu Toggle Button (`.mobile-menu-toggle`):**
            - Cria um botão `<button>` com a classe `mobile-menu-toggle`.
            - Define atributos aria e conteúdo interno (ícone de menu `<i class="fas fa-bars"></i>`).
            - Adiciona o botão ao header principal (`.main-header`).
        - **Mobile Overlay (`.mobile-overlay`):**
            - Cria um `<div>` com a classe `mobile-overlay`.
            - Adiciona o overlay ao body do documento.
- **Função `setupMobileMenuBehavior()`:**
    - Configura o comportamento do menu mobile, adicionando event listeners para:
        - Botão de menu mobile (`.mobile-menu-toggle`) para chamar `toggleMobileMenu()` ao clicar.
        - Overlay (`.mobile-overlay`) para chamar `closeMobileMenu()` ao clicar (fechar o menu ao clicar fora).
        - Links de navegação na sidebar (`.sidebar-nav a`) para chamar `closeMobileMenu()` ao clicar (fechar o menu ao navegar).
- **Função `toggleMobileMenu()`:**
    - Alterna a classe `show-mobile-menu` no container principal da aplicação (`.app-container`) para exibir ou ocultar o menu mobile.
- **Função `closeMobileMenu()`:**
    - Remove a classe `show-mobile-menu` do container principal da aplicação (`.app-container`) para fechar o menu mobile.
- **Função `isTouchDevice()`:**
    - Detecta se o dispositivo atual é um dispositivo touch, verificando a presença de `ontouchstart` no objeto `window`, `navigator.maxTouchPoints` ou `navigator.msMaxTouchPoints`.
- **Touch Device Class:**
    - Adiciona a classe `touch-device` ao elemento `body` se `isTouchDevice()` retornar `true`, permitindo aplicar estilos CSS específicos para dispositivos touch.

### `simplified-gemini-insights.js`

Este arquivo JavaScript implementa uma versão simplificada do componente de insights do Gemini, focando na geração e exibição de insights acionáveis sobre o estado do sistema e atividades do usuário, com uma abordagem mais direta e menos dependente da API Gemini para cenários de fallback.

- **Classe `SimplifiedInsights`:**
    - **Construtor:**
        - Inicializa propriedades: `container` (elemento HTML container), `options` (configurações, incluindo `refreshInterval` e `maxInsights`), `refreshTimer` (para auto-refresh), `isLoading` (estado de carregamento).
    - **`init(containerId, options = {})`:**
        - Inicializa o componente de insights.
        - Obtém o elemento container pelo `containerId`.
        - Mescla as opções fornecidas com as opções padrão.
        - Chama `render()` para renderizar a UI inicial.
        - Chama `refreshInsights()` para carregar os insights iniciais.
        - Inicia o auto-refresh se habilitado (`startAutoRefresh()`).
    - **`render()`:**
        - Renderiza a estrutura HTML do painel de insights dentro do container, incluindo cabeçalho, corpo (com resumo e lista de insights) e rodapé.
        - Inclui indicadores de carregamento e erro.
        - Armazena referências para elementos DOM importantes (loading, summary, list, timestamp).
        - Adiciona event listeners para o botão de refresh (`.gemini-insights-refresh`) e o link "Ask assistant" (`.gemini-insights-more`).
    - **`startAutoRefresh()`:**
        - Inicia o timer para auto-refresh dos insights, chamando `refreshInsights()` no intervalo definido em `this.options.refreshInterval`.
    - **`stopAutoRefresh()`:**
        - Limpa o timer de auto-refresh, interrompendo as atualizações automáticas.
    - **`refreshInsights()`:**
        - Função principal para atualizar os insights.
        - Verifica se já está carregando (`this.isLoading`) para evitar requisições múltiplas.
        - Define `this.isLoading = true` e exibe o indicador de carregamento (`showLoading(true)`).
        - Coleta dados do sistema chamando `collectSystemData()`.
        - Gera insights chamando `generateInsights()` (tenta usar `generateInsightsWithGemini()` primeiro, com fallback para `generateLocalInsights()` em caso de erro).
        - Exibe os insights na UI chamando `displayInsights()`.
        - Atualiza o timestamp de atualização (`updateTimestamp()`).
        - Lida com erros durante o processo de refresh, exibindo uma mensagem de erro (`displayError()`).
        - Define `this.isLoading = false` e oculta o indicador de carregamento (`showLoading(false)`) no bloco `finally`.
    - **`collectSystemData()`:**
        - Coleta dados do sistema do Firebase para análise, incluindo:
            - Estatísticas de usuários, portas e dispositivos (contagens totais, ativos/inativos, trancadas/destrancadas, online/offline).
            - Logs de acesso dos últimos 30 dias (limitados a 200 registros).
        - Processa os dados para calcular métricas como taxa de negação de acesso, acessos por dia, usuários mais ativos e portas mais acessadas.
        - Retorna um objeto `systemData` com as estatísticas e dados coletados.
    - **`generateInsights(systemData)`:**
        - Função principal para gerar insights.
        - Tenta gerar insights usando a API Gemini via `generateInsightsWithGemini()`.
        - Em caso de erro ao usar a API Gemini, utiliza uma função de fallback para gerar insights localmente (`generateLocalInsights()`).
    - **`generateInsightsWithGemini(systemData)`:**
        - Gera insights usando a API Gemini.
        - Cria um prompt para a API Gemini, incluindo os dados do sistema e instruções para responder com um JSON estruturado contendo resumo e insights.
        - Envia a requisição para a API Gemini via `window.geminiService.sendMessage(prompt, {}, { isConversation: false, timeout: 15000 })`.
        - Tenta parsear a resposta como JSON, com lógica para extrair JSON mesmo que esteja dentro de blocos de código ou levemente formatado.
        - Em caso de falha ao parsear ou erro de comunicação, lança um erro.
    - **`generateLocalInsights(systemData)`:**
        - Função de fallback para gerar insights localmente, sem depender da API Gemini.
        - Implementa lógica de análise de dados para identificar padrões e anomalias nos dados do sistema (ex: pico de acesso matinal, dispositivos offline, alta taxa de negação de acesso, portas destrancadas, acessos fora do horário comercial, acessos por método).
        - Cria insights baseados nos padrões e anomalias identificadas, com títulos, descrições e prioridades apropriadas.
        - Se nenhum insight significativo for encontrado, retorna um insight genérico informando que o sistema está operando normalmente.
        - Lida com casos de dados insuficientes para análise, retornando um insight de fallback.
    - **`displayInsights(insights)`:**
        - Exibe os insights na UI.
        - Atualiza o texto de resumo do painel (`.gemini-insights-summary-content p`).
        - Limpa a lista de insights existente (`.gemini-insights-list`).
        - Itera sobre os insights gerados (limitados a `this.options.maxInsights`) e cria elementos `<div>` para cada insight, formatando título, descrição, ícone (baseado no tipo de insight), tags relacionadas e estilos de prioridade.
        - Adiciona os elementos de insight à lista na UI.
        - Exibe uma mensagem de "No insights available at this time" se não houver insights para exibir.
    - **`displayError(message)`:**
        - Exibe uma mensagem de erro no painel de insights, atualizando o texto de resumo e limpando a lista de insights.
    - **`showLoading(isLoading)`:**
        - Exibe ou oculta o indicador de carregamento (`.gemini-insights-loading`) e a área de resumo (`.gemini-insights-summary-content`) com base no estado de carregamento (`isLoading`).
    - **`updateTimestamp()`:**
        - Atualiza o timestamp da última atualização no rodapé do painel (`.gemini-insights-updated`) com a hora atual formatada.
- **Instância Global:**
    - Cria uma instância global da classe `SimplifiedInsights` chamada `geminiInsights`.
- **Inicialização Automática:**
    - Define `window.geminiInsights = geminiInsights;` para tornar a instância globalmente acessível.

### `theme-switcher.js`

Este arquivo JavaScript implementa a funcionalidade de alternância entre tema claro e escuro para o SecureLab 2.0.

- **Constantes:**
    - `THEME_STORAGE_KEY`: Chave para armazenar o tema preferido do usuário no localStorage ('securelab-theme').
    - `DARK_MODE_CLASS`: Classe CSS aplicada ao `<html>` para ativar o modo escuro ('dark-mode').
- **Função `initThemeSwitcher()`:**
    - Função de inicialização do theme switcher.
    - Chama `createThemeToggleButton()` para criar o botão de alternância de tema na UI, se não existir.
    - Aplica o tema inicial obtido de `getPreferredTheme()` chamando `applyTheme()`.
    - Adiciona um event listener global ao `document` para detectar cliques no botão de alternância de tema (`#theme-toggle`) e chamar `toggleTheme()` quando clicado.
    - Adiciona um listener para mudanças nas preferências de tema do sistema (`window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)`), aplicando o tema do sistema se o usuário não tiver definido manualmente um tema preferido.
- **Função `createThemeToggleButton()`:**
    - Cria o botão de alternância de tema (`<button id="theme-toggle">`) se ele ainda não existir no DOM.
    - Define classes CSS (`icon-button`), atributo `aria-label` e conteúdo interno (ícone da lua `<i class="fas fa-moon"></i>`).
    - Adiciona o botão à página:
        - Na página de login, adiciona um container (`.theme-toggle-container`) posicionado no canto superior direito da tela para o botão de tema.
        - Nas outras páginas, adiciona o botão ao `header-right` no header principal.
- **Function `getPreferredTheme()`:**
    - Determina o tema preferido do usuário.
    - Verifica se há um tema salvo no localStorage (`THEME_STORAGE_KEY`); se sim, retorna o tema salvo.
    - Verifica a preferência de tema do sistema operacional usando `window.matchMedia('(prefers-color-scheme: dark)').matches`; se o sistema preferir o tema escuro, retorna 'dark'.
    - Se nenhuma preferência for encontrada, retorna o tema padrão 'light'.
- **Função `applyTheme(theme)`:**
    - Aplica um tema específico ('dark' ou 'light') à página.
    - Obtém o elemento `<html>` e o botão de toggle de tema (`#theme-toggle`).
    - Se o tema for 'dark':
        - Adiciona a classe `DARK_MODE_CLASS` ('dark-mode') ao elemento `<html>`.
        - Altera o ícone do botão de toggle para o ícone do sol (`<i class="fas fa-sun"></i>`).
    - Se o tema for 'light':
        - Remove a classe `DARK_MODE_CLASS` do elemento `<html>`.
        - Altera o ícone do botão de toggle para o ícone da lua (`<i class="fas fa-moon"></i>`).
    - Salva o tema preferido do usuário no localStorage (`localStorage.setItem(THEME_STORAGE_KEY, theme)`).
    - Chama `updateCharts(theme)` para ajustar as cores dos gráficos para o tema aplicado.
- **Função `toggleTheme()`:**
    - Alterna o tema atual entre 'dark' e 'light'.
    - Obtém o tema atual usando `getPreferredTheme()`.
    - Determina o novo tema (se o tema atual for 'dark', o novo tema será 'light', e vice-versa).
    - Chama `applyTheme(newTheme)` para aplicar o novo tema.
- **Função `updateCharts(theme)`:**
    - Atualiza as cores dos gráficos (se presentes) para se adequarem ao tema atual.
    - Verifica se a biblioteca Chart.js está carregada (`window.Chart`) e se há uma instância do gráfico de atividade (`window.activityChartInstance`).
    - Ajusta as cores do grid e ticks dos eixos X e Y do gráfico para o tema escuro ou claro.
    - Ajusta as cores das legendas do gráfico.
    - Aumenta a opacidade das cores dos datasets no modo escuro para melhorar a visibilidade.
    - Chama `window.activityChartInstance.update()` para re-renderizar o gráfico com as novas cores.
    - Ajusta a cor de fundo do "donut hole" e a cor do texto do gráfico de donut de dispositivos para os temas claro e escuro.
- **Função `increaseBrightness(color, percent)`:**
    - Aumenta o brilho de uma cor hexadecimal por uma porcentagem especificada para melhorar a visibilidade no modo escuro.
    - Converte a cor hexadecimal para RGB, ajusta os valores RGB para aumentar o brilho e converte de volta para hexadecimal.
- **Inicialização:**
    - Inicializa o theme switcher chamando `initThemeSwitcher()` quando o DOM estiver completamente carregado (`document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', initThemeSwitcher) : initThemeSwitcher();`).

### `users.js`

Este arquivo JavaScript gerencia a funcionalidade da página de usuários, incluindo listagem, filtragem, paginação, adição, edição e exclusão de usuários.

- **Verificação da Página Atual:**
    - No início do arquivo, verifica se a página atual é a página de usuários (`isPage('users')`) e interrompe a execução do script se não for.
- **Variáveis Globais:**
    - `PAGE_SIZE`: Constante para definir o número de usuários por página na paginação (10).
    - `currentPage`: Número da página atual (inicialmente 1).
    - `totalUsers`: Número total de usuários (inicialmente 0).
    - `filteredUsers`: Array para armazenar usuários após aplicação de filtros.
    - `currentEditingUser`: Objeto para armazenar o usuário atualmente sendo editado (inicialmente null).
    - Variáveis para elementos do DOM (`tableBody`, `searchInput`, `filterDepartment`, etc.) para acesso rápido aos elementos da página.
- **Função `initDOMElements()`:**
    - Inicializa as variáveis globais de elementos do DOM, obtendo referências para elementos HTML importantes da página de usuários usando `document.getElementById()`.
- **Função `initThemeSwitcher()`:**
    - Inicializa o controle de tema
- **Função `loadUsers()`:**
    - Carrega dados de usuários do Firebase Realtime Database (`database.ref('users').once('value')`).
    - Exibe uma mensagem de "Carregando usuários..." na tabela (`tableBody.innerHTML = ...`).
    - Converte o snapshot do Firebase para um array de objetos JavaScript (`usersArray`).
    - Ordena o array de usuários por nome (`usersArray.sort(...)`).
    - Armazena o array filtrado em `filteredUsers` e o total de usuários em `totalUsers`.
    - Chama `renderUsers()` para exibir os usuários na tabela.
    - Chama `updatePagination()` para atualizar os controles de paginação.
    - Lida com casos em que não há usuários encontrados ou erros ao carregar, exibindo mensagens apropriadas na tabela e notificações de erro.
- **Função `renderUsers()`:**
    - Renderiza os usuários na tabela HTML (`#users-table-body`).
    - Limpa o conteúdo da tabela (`tableBody.innerHTML = '';`).
    - Ordena `filteredUsers` por nome antes de renderizar.
    - Calcula os índices de início e fim para paginação e obtém os usuários da página atual (`usersPage`).
    - Itera sobre os usuários da página atual e cria linhas `<tr>` para cada usuário, preenchendo as células `<td>` com informações do usuário (nome, email, departamento, função, status, data de criação, botões de ação).
    - Adiciona badges de status formatados (`getStatusClass()`, `formatStatus()`).
    - Adiciona botões de ação (editar, excluir) para cada usuário.
    - Chama `updatePaginationInfo()` para atualizar as informações de paginação na UI.
    - Chama `setupActionButtons()` para adicionar event listeners aos botões de ação de cada linha.
- **Função `setupActionButtons()`:**
    - Adiciona event listeners aos botões de ação "Editar" (`.action-btn-edit`) e "Excluir" (`.action-btn-delete`) em cada linha da tabela de usuários.
    - Para botões "Editar", chama `editUser(userId)` ao clicar.
    - Para botões "Excluir", chama `confirmDelete(userId)` ao clicar.
- **Função `editUser(userId)`:**
    - Abre o modal de edição de usuário (`#user-modal`) para um usuário específico.
    - Encontra o usuário no array `filteredUsers` pelo `userId`.
    - Preenche os campos do formulário no modal com os dados do usuário (nome, email, departamento, função, status).
    - Oculta o campo de senha (`#password-group`) no modo de edição.
    - Define `currentEditingUser` para o usuário que está sendo editado.
    - Define o título do modal para "Editar Usuário".
    - Abre o modal de usuário usando `openModal('user-modal')`.
- **Função `confirmDelete(userId)`:**
    - Abre o modal de confirmação (`#confirm-modal`) antes de excluir um usuário.
    - Encontra o usuário no array `filteredUsers` pelo `userId`.
    - Define a mensagem de confirmação no modal para perguntar se o usuário deseja excluir o usuário selecionado.
    - Configura o botão "Confirmar" no modal para chamar `deleteUser(userId)` ao clicar.
    - Abre o modal de confirmação usando `openModal('confirm-modal')`.
- **Função `deleteUser(userId)`:**
    - Exclui um usuário específico do Firebase Realtime Database usando `database.ref('users/${userId}`).remove()`.
    - Exibe notificações de sucesso ou erro após a tentativa de exclusão.
    - Re-carrega a lista de usuários chamando `loadUsers()`.
- **Função `saveUser()`:**
    - Valida o formulário de usuário usando `validateUserForm()`.
    - Coleta os dados do formulário (nome, email, departamento, função, status).
    - Se `currentEditingUser` estiver definido (modo de edição):
        - Atualiza os dados do usuário existente no Firebase usando `database.ref('users/${currentEditingUser.id}`).update(userData)`.
        - Se o usuário em edição for o usuário logado, atualiza também o `displayName` do usuário no Firebase Authentication.
        - Exibe notificação de sucesso e fecha o modal.
    - Se `currentEditingUser` for null (modo de adição):
        - Verifica se o email já existe no Firebase (`database.ref('users').orderByChild('email').equalTo(userData.email).once('value')`).
        - Se o email não existir, cria um novo usuário no Firebase Authentication usando `firebase.auth().createUserWithEmailAndPassword(userData.email, userPasswordInput.value)`, e então salva os dados do usuário no Realtime Database (`database.ref('users').push().set(userData)`), incluindo a data de criação.
        - Exibe notificações de sucesso e fecha o modal.
    - Lida com erros durante a criação ou atualização de usuários, exibindo notificações de erro.
- **Função `validateUserForm()`:**
    - Valida os campos do formulário de usuário:
        - Nome (obrigatório).
        - Email (obrigatório e formato válido usando `isValidEmail()`).
        - Departamento (obrigatório).
        - Função (obrigatório).
        - Senha (obrigatória e com pelo menos 6 caracteres para novos usuários, não validada para edição).
    - Exibe notificações de erro para campos inválidos e retorna `false` se a validação falhar, `true` se for bem-sucedida.
- **Função `resetForm()`:**
    - Reseta o formulário de usuário (`userForm.reset()`).
    - Define `currentEditingUser = null` para indicar que não está mais editando um usuário.
    - Define o título do modal para "Adicionar Usuário".
    - Exibe o campo de senha (`#password-group`).
    - Reseta o tipo do campo de senha para "password" e atualiza o ícone de toggle de senha.
- **Função `applyFilters()`:**
    - Aplica filtros de busca, departamento, função e status à lista de usuários.
    - Busca todos os usuários do Firebase (`database.ref('users').once('value')`).
    - Filtra o array de usuários (`usersArray`) com base nos critérios de filtro (termo de busca, departamento, função, status).
    - Ordena o array filtrado por nome.
    - Atualiza `filteredUsers` com o array filtrado.
    - Reseta a paginação para a primeira página (`currentPage = 1`).
    - Chama `renderUsers()` e `updatePagination()` para atualizar a UI com os usuários filtrados e paginação.
- **Função `exportUsers(format)`:**
    - Simula a exportação de usuários para um formato especificado (CSV ou PDF).
    - Exibe notificações de progresso e sucesso/aviso, mas a funcionalidade real de exportação não está implementada (apenas simula a conclusão bem-sucedida).
- **Função `updatePaginationInfo(start, end, total)`:**
    - Atualiza os elementos HTML que exibem informações de paginação (início, fim, total de usuários).
- **Função `updatePagination()`:**
    - Atualiza os controles de paginação na UI:
        - Limpa os números de página existentes (`#pagination-numbers.innerHTML = '';`).
        - Calcula o total de páginas com base em `filteredUsers.length` e `PAGE_SIZE`.
        - Cria elementos `<div>` para cada número de página, adicionando a classe `active` para a página atual e event listeners para mudança de página.
        - Atualiza o estado dos botões "Página Anterior" e "Próxima Página" (`#prev-page`, `#next-page`) habilitando/desabilitando com base na página atual e no total de páginas.
- **Função `debounce(func, wait)`:**
    - Implementação da função utilitária de debounce para limitar a taxa de execução de uma função, usada para otimizar a resposta do filtro de busca.
- **Inicialização:**
    - Adiciona um event listener para `DOMContentLoaded` para executar a inicialização da página de usuários quando o DOM estiver carregado.

### `utils.js`

Este arquivo JavaScript fornece funções utilitárias para manipulação segura de elementos DOM e outras operações comuns.

- **Função `safeDOM(id, callback)`:**
    - Função de utilidade para acessar elementos DOM de forma segura, verificando se o elemento com o ID fornecido existe antes de executar um callback function.
    - Obtém o elemento do DOM pelo ID usando `document.getElementById(id)`.
    - Se o elemento existir e um callback function for fornecido, executa o callback function passando o elemento como argumento.
    - Retorna o elemento do DOM (se encontrado) ou `null`.
- **Funções de Manipulação de Elementos DOM Seguras (`safeTextContent`, `safeInnerHTML`, `safeValue`, `safeSetAttribute`, `safeStyle`, `safeAddClass`, `safeRemoveClass`):**
    - Uma série de funções utilitárias que encapsulam a função `safeDOM` para realizar operações comuns de manipulação de elementos DOM de forma segura, garantindo que a operação só seja realizada se o elemento existir.
    - `safeTextContent(id, text)`: Define o `textContent` de um elemento.
    - `safeInnerHTML(id, html)`: Define o `innerHTML` de um elemento.
    - `safeValue(id, value)`: Define o `value` de um elemento (tipicamente para inputs).
    - `safeSetAttribute(id, attribute, value)`: Define um atributo de um elemento.
    - `safeStyle(id, property, value)`: Define uma propriedade CSS de estilo de um elemento.
    - `safeAddClass(id, className)`: Adiciona uma classe CSS a um elemento.
    - `safeRemoveClass(id, className)`: Remove uma classe CSS de um elemento.
- **Função `getCurrentPage()`:**
    - Retorna o nome da página atual, extraindo-o do `window.location.pathname`.
    - Divide o pathname por `/` e obtém o último segmento, então divide por `.` e obtém o primeiro segmento (nome do arquivo sem extensão).
    - Retorna o nome da página ou 'index' se não conseguir determinar o nome.
- **Função `isPage(pageName)`:**
    - Verifica se a página atual corresponde a um nome de página fornecido, comparando o resultado de `getCurrentPage()` com `pageName`.

## Integração com Firebase

O projeto SecureLab RFID utiliza o Firebase como backend para autenticação e banco de dados em tempo real.

- **Firebase Realtime Database:** Utilizado para armazenar dados em tempo real, como informações de usuários, portas, dispositivos e logs de acesso. A sincronização em tempo real permite que as alterações sejam refletidas instantaneamente em todos os clientes conectados.
- **Firebase Authentication:** Utilizado para gerenciar a autenticação de usuários, permitindo login seguro com email e senha e gerenciamento de sessões.

A configuração do Firebase é inicializada no arquivo `firebase-config.js`, que inclui as credenciais do projeto e inicializa os serviços de autenticação e banco de dados.

## Integração com o Assistente Gemini

O sistema SecureLab RFID integra o assistente Gemini para fornecer funcionalidades avançadas de análise de dados e interação em linguagem natural.

- **API Gemini:** Utilizada através do serviço `gemini-service.js` para enviar prompts e receber respostas do modelo Gemini. A configuração da API, incluindo a chave de API, é armazenada em `gemini-config.js`.
- **Processamento de Linguagem Natural:** O assistente Gemini permite que os usuários interajam com o sistema usando linguagem natural, enviando comandos e perguntas através da interface de chat (`gemini-assistant.js`).
- **Geração de Insights:** O assistente Gemini é capaz de analisar dados do sistema e gerar insights inteligentes, que são exibidos no dashboard e na interface do assistente (`gemini-insights.js`).
- **Processamento de Comandos:** O assistente pode interpretar e executar comandos do usuário, como trancar/destrancar portas, reiniciar dispositivos e fornecer informações sobre o sistema.

## Implementação do Modo Escuro

O tema escuro é implementado principalmente através do arquivo `dark-mode.css`, que redefine as variáveis de cor CSS e ajusta os estilos dos componentes para o tema escuro.

- **Variáveis CSS:** Utilização de variáveis CSS (`:root`) para definir cores base e específicas do modo escuro, facilitando a alteração de temas.
- **Classe `dark-mode`:** A classe `dark-mode` é aplicada ao elemento `<html>` para ativar o tema escuro, com estilos específicos definidos em `dark-mode.css` dentro de regras `html.dark-mode`.
- **Theme Switcher JavaScript (`theme-switcher.js`):** JavaScript gerencia a alternância entre temas claro e escuro, persistindo a preferência do usuário no localStorage e aplicando o tema correto ao carregar a página.
- **Detecção de Preferência do Sistema:** O sistema detecta a preferência de tema do sistema operacional do usuário (`prefers-color-scheme: dark`) e aplica o tema correspondente por padrão, a menos que o usuário tenha definido manualmente um tema.

## Responsividade Mobile

A responsividade mobile é tratada principalmente através do arquivo `mobile.css`, que utiliza media queries para ajustar o layout e a apresentação da interface em telas menores.

- **Mobile-First Approach:** Embora não estritamente mobile-first, o projeto inclui otimizações consideráveis para dispositivos móveis, com um arquivo CSS dedicado (`mobile.css`) e JavaScript (`mobile.js`) para funcionalidades específicas.
- **Media Queries (`@media (max-width: 768px)` e `@media (max-width: 480px)`):** Utilização extensiva de media queries para ajustar fontes, paddings, margens, layouts de grid e elementos específicos para telas menores.
- **Sidebar Mobile:** A sidebar se transforma em um menu off-canvas em dispositivos móveis, sendo exibida e oculta com um botão de toggle e overlay.
- **Otimizações de Componentes:** Ajustes específicos para componentes como cards, tabelas, modais, formulários e botões para garantir que sejam utilizáveis em telas touch e com espaço limitado.
- **JavaScript para Mobile (`mobile.js`):** Criação dinâmica de elementos mobile (botão de menu, overlay) e configuração de comportamento do menu mobile via JavaScript.

## Análise do `README.md` Existente

O `README.md` fornecido é bastante conciso e focado em instruções para iniciar o Firebase. Ele cobre os passos essenciais para configurar e iniciar o backend do Firebase, o que é crucial para o projeto.

**Sugestões de Melhoria e Expansão:**

- **Visão Geral do Projeto:** Expandir a seção "README.md" para incluir uma visão geral mais detalhada do projeto, seu propósito, funcionalidades principais e para quem ele foi desenvolvido.
- **Estrutura de Arquivos:** Adicionar uma seção que descreva a estrutura de arquivos e diretórios do projeto, como foi feito na seção "Estrutura de Arquivos" desta documentação.
- **Tecnologias Utilizadas:** Listar as principais tecnologias e bibliotecas utilizadas (Firebase, Chart.js, Gemini API, etc.).
- **Configuração e Deploy:** Detalhar os passos para configurar o projeto (além do Firebase, como configurar a API Gemini) e para realizar o deploy da aplicação.
- **Funcionalidades Principais:** Criar uma seção que detalhe as funcionalidades chave do sistema SecureLab, como gerenciamento de usuários, portas, dispositivos, logs, assistente Gemini, etc.
- **Guia para Desenvolvedores:** Adicionar seções com guias para desenvolvedores que desejam contribuir ou estender o projeto, incluindo convenções de código, como adicionar novas funcionalidades, como testar e como contribuir com código.
- **Créditos e Licença:** Incluir informações sobre autores e licença do projeto.

## Arquitetura Geral do Projeto

O SecureLab RFID adota uma arquitetura front-end centrada em JavaScript, HTML (implícito nos componentes e funcionalidades JS) e CSS, interagindo com um backend Firebase e integrando serviços de IA através da API Gemini.

- **Front-end (HTML, CSS, JavaScript):**
    - **HTML (Estrutura):** A estrutura da interface web é definida implicitamente através dos scripts JavaScript que manipulam o DOM e injetam HTML dinamicamente. O projeto se beneficiaria da criação de arquivos HTML explícitos para cada página ou componente principal para melhor organização e manutenção.
    - **CSS (Estilização):** O CSS é bem organizado em múltiplos arquivos, cada um responsável por uma parte específica da interface (componentes, dashboard, tema escuro, páginas específicas, utilitários). Isso facilita a manutenção e a escalabilidade do design.
    - **JavaScript (Lógica):** O JavaScript é responsável pela lógica da aplicação, incluindo manipulação do DOM, interação com o Firebase e a API Gemini, gerenciamento de estado da UI, validação de formulários, paginação, filtragem e funcionalidades específicas de cada página (dashboard, usuários, portas, dispositivos, logs).
- **Backend (Firebase):**
    - **Firebase Realtime Database:** Fornece persistência de dados em tempo real, armazenando informações de usuários, portas, dispositivos e logs de acesso.
    - **Firebase Authentication:** Gerencia a autenticação de usuários, garantindo acesso seguro ao sistema.
- **Serviços de IA (Gemini API):**
    - **Gemini Assistant:** Integração com a API Gemini para fornecer um assistente virtual que permite interação em linguagem natural, geração de insights e execução de comandos no sistema.

## Sugestões de Melhorias e Direções Futuras

- **Refatoração para Framework Front-end:** Considerar refatorar o front-end para um framework JavaScript moderno como React, Vue ou Angular. Isso facilitaria o desenvolvimento de componentes reutilizáveis, gerenciamento de estado mais eficiente e melhor organização do código.
- **Implementação de Testes:** Adicionar testes automatizados (unitários, de integração, E2E) para garantir a qualidade do código e evitar regressões em futuras atualizações.
- **Melhoria da Documentação:** Expandir a documentação (como este documento detalhado) e criar documentação para desenvolvedores que desejam contribuir.
- **Internacionalização (i18n):** Implementar suporte para múltiplos idiomas para tornar o sistema acessível a um público mais amplo.
- **Acessibilidade (a11y):** Melhorar a acessibilidade da interface web, seguindo diretrizes WCAG para garantir que o sistema seja utilizável por pessoas com deficiência.
- **Segurança:** Realizar auditorias de segurança e implementar medidas adicionais para proteger o sistema contra vulnerabilidades.
- **Escalabilidade:** Considerar a escalabilidade do sistema, especialmente se o número de usuários, portas e dispositivos aumentar significativamente. Avaliar a possibilidade de migrar para um banco de dados mais escalável se necessário.
- **Monitoramento e Alertas Avançados:** Expandir as funcionalidades de monitoramento e alertas, incluindo notificações mais ricas, alertas personalizáveis e integração com sistemas de notificação externos.
- **Personalização e Tematização:** Permitir maior personalização da interface, incluindo temas adicionais e opções de customização para usuários.
- **API Pública:** Desenvolver uma API pública para permitir que outras aplicações e sistemas interajam com o SecureLab, abrindo possibilidades para integrações e automações.

Este documento detalhado fornece uma visão abrangente do projeto SecureLab RFID, analisando sua estrutura, funcionalidades e tecnologias. Ele serve como um guia completo para entender o sistema e como ele foi construído, além de sugerir direções para futuras melhorias e expansões.
```