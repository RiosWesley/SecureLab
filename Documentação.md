# Documentação Atualizada - Sistema de Controle de Acesso RFID
## SecureLab 2.0 (Março 2025)

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Módulos e Componentes](#módulos-e-componentes)
4. [Status de Implementação](#status-de-implementação)
5. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
6. [Integração com Firebase](#integração-com-firebase)
7. [Otimização Mobile](#otimização-mobile)
8. [Modo Escuro](#modo-escuro)
9. [Limitações Conhecidas](#limitações-conhecidas)
10. [Atualizações Recentes](#atualizações-recentes)
11. [Próximos Passos](#próximos-passos)

## Visão Geral

O Sistema de Controle de Acesso RFID (SecureLab 2.0) é uma solução para gerenciamento de acessos em instalações que utiliza tecnologia RFID, integrada a uma plataforma web. Atualmente, o sistema se encontra em fase de desenvolvimento, com a interface web de administração funcional e otimizada para visualização em dispositivos móveis.

O sistema está implementado como uma aplicação web integrada ao Firebase para autenticação e armazenamento de dados. Ele permite gerenciar usuários e portas, visualizar estatísticas básicas e monitorar atividades de acesso.

## Estrutura de Pastas

A estrutura atual do projeto é a seguinte:

```
Sistema-RFID/SecureLab 2.0/
│
├── /public/                        # Todos os arquivos da aplicação web
│   ├── index.html                  # Redirecionamento para login
│   ├── login.html                  # Página de login
│   ├── dashboard.html              # Painel principal
│   ├── users.html                  # Gerenciamento de usuários
│   ├── doors.html                  # Gerenciamento de portas
│   ├── logs.html                   # Logs de acesso (COMPLETO)
│   ├── settings.html               # Configurações do sistema (NOVO)
│   ├── reports.html                # Relatórios e análises (NOVO)
│   ├── 404.html                    # Página de erro
│   │
│   ├── /css/                       # Estilos CSS
│   │   ├── styles.css              # Estilos principais
│   │   ├── utils.css               # Classes utilitárias
│   │   ├── components.css          # Componentes reutilizáveis
│   │   ├── mobile.css              # Otimizações para dispositivos móveis
│   │   ├── dark-mode.css           # Estilos para o modo escuro
│   │   ├── logs.css                # Estilos específicos para página de logs
│   │
│   ├── /js/                        # Scripts JavaScript
│       ├── firebase-config.js      # Configuração do Firebase
│       ├── auth.service.js                 # Lógica de autenticação
│       ├── common.js               # Funções comuns
│       ├── utils.js                # Utilitários para manipulação do DOM
│       ├── dashboard.js            # Lógica do dashboard
│       ├── activity-chart.js       # Implementação do gráfico de atividade
│       ├── users.js                # Gerenciamento de usuários
│       ├── doors.js                # Gerenciamento de portas
│       ├── logs.js                 # Lógica completa para página de logs
│       ├── mobile.js               # Funcionalidades para dispositivos móveis
│       ├── theme-switcher.js       # Controle do tema claro/escuro
│
├── .firebaserc                     # Configuração do projeto Firebase
├── .gitignore                      # Arquivos ignorados pelo Git
├── firebase.json                   # Configuração de hosting do Firebase
```

## Módulos e Componentes

### Módulos Implementados

#### 1. Autenticação de Usuários
- **Implementação**: Completa via Firebase Authentication
- **Funcionalidades**:
  - Login com email/senha
  - Verificação de autenticação em todas as páginas
  - Logout

#### 2. Gerenciamento de Usuários
- **Implementação**: Completa
- **Funcionalidades**:
  - Listagem de usuários com filtros e paginação
  - Adição de novos usuários
  - Edição de usuários existentes
  - Exclusão de usuários
  - Gerenciamento básico de permissões (admin/user)

#### 3. Gerenciamento de Portas
- **Implementação**: Completa
- **Funcionalidades**:
  - Listagem de portas
  - Adição de novas portas
  - Edição de portas existentes
  - Controle de portas (trancar/destrancar)
  - Visualização do status das portas

#### 4. Dashboard
- **Implementação**: Aprimorada
- **Funcionalidades**:
  - Exibição de estatísticas gerais (usuários, portas, dispositivos)
  - Visualização de atividades recentes
  - Visualização do status das portas
  - Visualização simplificada de alertas
  - Gráfico interativo de atividade diária por porta

#### 5. Logs de Acesso
- **Implementação**: Completa
- **Funcionalidades**:
  - Visualização detalhada de todos os logs de acesso do sistema
  - Filtragem avançada por múltiplos critérios (usuário, porta, ação, método)
  - Filtragem por períodos pré-definidos ou personalizados (incluindo hora)
  - Exibição de informações detalhadas de cada acesso (usuário, data/hora, método)
  - Paginação completa para navegação eficiente
  - Interface intuitiva com elementos visuais para identificação rápida
  - Exportação de logs filtrados para diferentes formatos

#### 6. Otimização Mobile
- **Implementação**: Funcional Básica
- **Funcionalidades**:
  - Interface adaptável para dispositivos móveis
  - Menu lateral colapsável via botão hamburger
  - Tabelas com rolagem horizontal em telas pequenas
  - Ajustes de layout para melhor visualização em dispositivos móveis

#### 7. Modo Escuro
- **Implementação**: Completa
- **Funcionalidades**:
  - Alternância entre temas claro e escuro
  - Detecção automática da preferência do sistema
  - Persistência da escolha do usuário
  - Interface adaptada para melhor visualização em ambientes com pouca luz
  - Suporte a todos os elementos da interface, incluindo tabelas, gráficos e modais

#### 8. Configurações do Sistema (NOVO)
- **Implementação**: Frontend Completo (sem backend)
- **Funcionalidades**:
  - Interface organizada por abas (Sistema, Segurança, Dispositivos, Integração, Notificações, Aparência)
  - Formulários para configuração de todos os aspectos do sistema
  - Opções de personalização visual (temas, cores, layout)
  - Configurações de segurança e autenticação
  - Gerenciamento de integrações com sistemas externos
  - Configurações para dispositivos RFID e fechaduras

#### 9. Relatórios (NOVO)
- **Implementação**: Frontend Básico (sem backend)
- **Funcionalidades**:
  - Visualização de relatórios de acesso
  - Opções de filtros e parâmetros para relatórios
  - Opções de exportação de dados
  - Interface para análise de dados históricos

### Componentes UI

1. **Sidebar**: Navegação principal
2. **Header**: Barra superior com pesquisa e informações do usuário
3. **Cards**: Exibição de informações em blocos
4. **Tabelas**: Listagem de dados com opções de ordenação
5. **Modais**: Formulários e confirmações em janelas sobrepostas
6. **Formulários**: Entrada de dados com validação
7. **Notificações**: Sistema de feedback para ações do usuário
8. **Menu Mobile**: Navegação adaptada para dispositivos móveis
9. **Gráficos Interativos**: Visualização de dados em formato de gráficos
10. **Botão de Tema**: Alternância entre modos claro e escuro
11. **Navegação por abas**: Organização de conteúdo em categorias
12. **Toggle Switches**: Controles para opções binárias
13. **Upload de arquivos**: Interface para envio de arquivos
14. **Filtros Avançados**: Sistema de filtragem de dados com múltiplos critérios 
15. **Paginação**: Sistema de navegação entre páginas de resultados

## Status de Implementação

### Frontend (Interface Web)

| Módulo/Página | Status | Observações |
|---------------|--------|-------------|
| Login | ✅ Funcional | Integrado com Firebase |
| Dashboard | ✅ Aprimorado | Exibe estatísticas, atividades recentes e gráfico de atividade |
| Usuários | ✅ Funcional | CRUD completo implementado |
| Portas | ✅ Funcional | CRUD completo e controle implementados |
| Logs | ✅ Completo | Interface e funcionalidade completas com filtros avançados, paginação e visualização detalhada |
| Grupos | 🗑️ Removido | Módulo removido do escopo do projeto |
| Alertas | 🗑️ Removido | Módulo removido do escopo do projeto |
| Configurações | ✅ Frontend Completo | Interface completa implementada, sem backend |
| Relatórios | ✅ Frontend Básico | Interface básica implementada, sem backend |
| Dispositivos | ❌ Não implementado | Apenas como link na navegação |
| Otimização Mobile | ✅ Funcional Básica | Implementado nas principais páginas |
| Modo Escuro | ✅ Funcional | Sistema completo de alternância de temas |

### Outros Componentes

| Componente | Status | Observações |
|------------|--------|-------------|
| Aplicativo Mobile | ❌ Não iniciado | Não há código para desenvolvimento mobile |
| Firmware para ESP32 | ❌ Não iniciado | Não há código para dispositivos RFID |

## Arquitetura e Tecnologias

A arquitetura do sistema é baseada em uma integração direta entre o frontend e o Firebase:

### Tecnologias Utilizadas
- **HTML/CSS/JavaScript** puro (sem frameworks como React, Vue, etc.)
- **Chart.js** para visualizações de dados em gráficos
- **Design responsivo** para adaptação a diferentes dispositivos
- **Estilização modular** com separação de estilos em diferentes arquivos CSS
- **Sistema de temas** baseado em variáveis CSS para o modo escuro
- **Navegação por abas** para organização de conteúdo em categorias
- **Firebase Authentication** para gerenciamento de usuários e autenticação
- **Firebase Realtime Database** para armazenamento e sincronização de dados em tempo real
- **Firebase Hosting** para publicação da aplicação web

### Padrões de Projeto
- **Singleton** para conexão com Firebase e instâncias de componentes
- **Observer** para reação a mudanças de dados em tempo real
- **MVC simplificado** com separação entre visualização (HTML), controle (JS) e modelo (Firebase)
- **Theme Provider** para gerenciamento do modo escuro/claro
- **Tab Controller** para gerenciamento de navegação por abas
- **Filter Pattern** para filtragem de dados em múltiplos critérios

## Integração com Firebase

### Estrutura do Banco de Dados
```
/users
  /{user_id}
    - name
    - email
    - role
    - department
    - status
    - created_at
    
/doors
  /{door_id}
    - name
    - location
    - status
    - last_status_change
    
/access_logs
  /{log_id}
    - user_id
    - user_name
    - door_id
    - door_name
    - action
    - method
    - timestamp
    - reason (opcional)
```

### Regras de Segurança
- Não implementadas explicitamente; usando configurações padrão do Firebase

## Otimização Mobile

A interface do sistema foi otimizada para uso em dispositivos móveis, com as seguintes características:

### Principais Funcionalidades Mobile
- **Menu lateral colapsável**: Em dispositivos móveis, a barra lateral é substituída por um menu deslizante que pode ser aberto/fechado com o botão hamburger
- **Layout responsivo**: Ajustes automáticos para diferentes tamanhos de tela
- **Tabelas otimizadas**: Tabelas com rolagem horizontal para visualização completa dos dados
- **Formulários adaptados**: Ajustes nos formulários para melhor usabilidade em telas pequenas
- **Alvos de toque ampliados**: Botões e elementos interativos dimensionados para facilitar o uso em telas touch

### Implementação Técnica
- **CSS**: Regras específicas para dispositivos móveis usando media queries
- **JavaScript**: Detecção de dispositivos e manipulação de elementos da interface
- **HTML**: Estrutura semântica que permite adaptação a diferentes tamanhos de tela

### Status da Implementação Mobile
- ✅ Funcional na página de portas (doors.html)
- ✅ Funcional no dashboard (dashboard.html)
- ✅ Funcional na página de configurações (settings.html)
- ✅ Funcional na página de relatórios (reports.html)
- ✅ Funcional na página de logs (logs.html)
- ✅ Botão hamburger implementado e funcional
- ✅ Menu lateral adaptável para dispositivos móveis

## Modo Escuro

O sistema conta com um modo escuro completo que melhora a experiência do usuário em ambientes com pouca luz e reduz a fadiga visual.

### Principais Características
- **Alternância de tema**: Botão dedicado no cabeçalho para alternar entre os modos claro e escuro
- **Preferência do sistema**: Detecção automática da preferência de tema do sistema operacional do usuário
- **Persistência**: A escolha do usuário é salva no localStorage e mantida entre sessões
- **Transição suave**: Mudanças de tema com animações suaves para melhor experiência visual
- **Contraste aprimorado**: Cores cuidadosamente selecionadas para manter a legibilidade e o contraste adequado

### Implementação Técnica
- **Variáveis CSS**: Sistema baseado em variáveis CSS para facilitar a manutenção
- **JavaScript**: Controle dinâmico do tema com detecção de preferências do sistema
- **LocalStorage**: Armazenamento da preferência do usuário no navegador
- **Integração com Chart.js**: Ajustes específicos para gráficos funcionarem corretamente no modo escuro
- **Componentes adaptáveis**: Todos os componentes da interface respondem ao tema atual

### Arquivos Envolvidos
- **dark-mode.css**: Redefinições de variáveis CSS e ajustes específicos para o modo escuro
- **theme-switcher.js**: Lógica de alternância, detecção de preferências e persistência

### Status da Implementação
- ✅ Funcional em todas as páginas principais
- ✅ Integração completa com tabelas e formulários
- ✅ Integração com gráficos e visualizações
- ✅ Suporte a modais e formulários
- ✅ Botão de alternância no cabeçalho de fácil acesso
- ✅ Implementado na página de configurações
- ✅ Implementado na página de relatórios
- ✅ Implementado na página de logs

## Limitações Conhecidas

### Limitações do Sistema
- **Funcionalidade parcial**: Algumas páginas têm apenas o frontend implementado (configurações, relatórios, etc.)
- **Sem backend para novas páginas**: As páginas de configurações e relatórios não possuem backend implementado
- **Segurança básica**: Implementação limitada de regras de segurança no Firebase
- **Sem integração com hardware**: O sistema ainda não se integra com dispositivos RFID reais

### Limitações da Interface Mobile
- **Menu mobile**: O menu lateral fecha apenas ao clicar no botão hamburger, não ao clicar fora dele
- **Tabelas grandes**: Algumas tabelas podem ser difíceis de navegar em dispositivos muito pequenos
- **Modais**: Alguns modais podem não se ajustar perfeitamente em dispositivos com telas muito pequenas

### Limitações do Gráfico de Atividade
- **Período fixo**: Atualmente, o gráfico mostra apenas os últimos 7 dias, sem opção de personalização
- **Atualização não automática**: É necessário recarregar a página para atualizar o gráfico com novos dados
- **Dados simulados**: Sem integração com hardware real, os dados de acesso são limitados aos gerados manualmente

### Limitações das Novas Páginas
- **Sem persistência de configurações**: As configurações na página de settings não são salvas
- **Sem geração real de relatórios**: A página de relatórios não gera relatórios reais a partir dos dados
- **Interface sem funcionalidade completa**: Vários elementos de interface nas novas páginas são apenas visuais, sem funcionalidade real
- **Escopo reduzido**: Remoção dos módulos de Grupos e Alertas simplifica o sistema, mas limita alguns casos de uso

## Atualizações Recentes

### Implementação Completa da Página de Logs (Março 2025)

Foi realizada uma reformulação completa da página de logs, transformando-a de uma implementação parcial para uma solução completa e integrada ao sistema:

1. **Interface Aprimorada**:
   - Design totalmente renovado, seguindo o padrão visual do sistema
   - Layout em cards para melhor organização da informação
   - Elementos visuais (ícones, badges) para identificação rápida de ações
   - Suporte completo ao modo escuro

2. **Sistema de Filtragem Avançada**:
   - Filtros por múltiplos critérios simultaneamente (usuário, porta, ação, método)
   - Filtros de período com opções pré-definidas (hoje, ontem, últimos 7/30 dias)
   - Filtros de período personalizado com suporte a data e hora específicas
   - Botões para aplicar e limpar filtros

3. **Paginação e Navegação**:
   - Sistema completo de paginação para navegar entre os registros
   - Indicadores de quantidade total de registros e página atual
   - Interface intuitiva para navegação entre páginas

4. **Visualização Detalhada**:
   - Exibição completa de informações de cada log (usuário, porta, ação, data/hora, método)
   - Formatação visual diferenciada para cada tipo de ação
   - Indicadores visuais do método de acesso (RFID, web, app)

5. **Funcionalidades Adicionais**:
   - Exportação de logs filtrados para diferentes formatos (CSV, PDF)
   - Botão para atualizar logs em tempo real
   - Contagem de registros encontrados após aplicação de filtros

6. **Melhorias de Performance**:
   - Carregamento otimizado de logs para evitar sobrecarga
   - Limitação inteligente da quantidade de logs carregados inicialmente
   - Renderização eficiente apenas dos logs visíveis na página atual

7. **Responsividade**:
   - Interface totalmente responsiva para dispositivos móveis
   - Ajustes automáticos de layout para diferentes tamanhos de tela
   - Melhorias na legibilidade em telas pequenas

Estas melhorias transformaram a página de logs de uma implementação parcial para um componente completo e integrado do sistema, oferecendo funcionalidades avançadas de filtragem, visualização e análise dos registros de acesso.

### Implementação do Modo Escuro (Março 2025)

Foi implementado um sistema completo de tema escuro para melhorar a experiência do usuário:

- **Sistema de tema**: Alternância entre modo claro e escuro com botão dedicado no cabeçalho
- **Detecção de preferências**: Reconhecimento automático das preferências do sistema do usuário
- **Consistência visual**: Todos os elementos da interface são ajustados de forma coerente
- **Melhoria na experiência**: Redução da fadiga visual em ambientes com pouca luz
- **Acessibilidade**: Melhor contraste para usuários com necessidades visuais específicas

### Implementação do Gráfico de Atividade Diária (Março 2025)

Foi implementado um novo gráfico interativo no dashboard que visualiza o acesso às portas. Este gráfico:

- Mostra dados de acesso por porta ao longo dos últimos 7 dias
- Usa barras empilhadas com cores diferentes para cada porta/sala
- Exibe tooltips detalhados ao passar o mouse sobre as barras
- Processa dados do Firebase para agrupar acessos por dia e por porta
- Se adapta automaticamente a diferentes tamanhos de tela

### Otimização Mobile (Março 2025)
- **Interface responsiva**: Adaptação da interface para dispositivos móveis
- **Menu mobile**: Implementação de menu lateral colapsável com botão hamburger
- **Layout adaptável**: Ajustes automáticos para diferentes tamanhos de tela
- **UX aprimorada**: Melhorias na usabilidade em dispositivos touch

### Correções na Página de Portas (11/03/2025)
- **Estilização Corrigida**: Resolvidos problemas de estilo nos modais e botões
- **Funcionalidade Restaurada**: Corrigido o JavaScript para permitir adição, edição e controle de portas
- **Melhorias na Interface**: Reimplementada a estrutura HTML dos modais

## Próximos Passos

### Implementação de Backend para Novas Páginas
1. Desenvolver backend para persistência das configurações
2. Implementar lógica para geração real de relatórios
3. Conectar formulários de configuração com o Firebase
4. Implementar exportação de relatórios em diferentes formatos

### Melhorias no Modo Escuro
1. Implementar ajustes finos em componentes específicos
2. Adicionar animações mais elaboradas durante a transição de temas
3. Permitir programação de horários para alternância automática de tema
4. Adicionar mais opções de personalização de cores

### Melhorias no Gráfico de Atividade Diária
1. Implementar opções para personalizar o período de visualização (7, 14, 30 dias)
2. Adicionar filtros por porta/sala específica
3. Implementar atualização em tempo real sem necessidade de recarregar a página
4. Adicionar opções de exportação de dados do gráfico para CSV/Excel

### Melhorias da Interface Mobile
1. Implementar fechamento do menu ao clicar fora dele
2. Otimizar a visualização de tabelas em dispositivos muito pequenos
3. Melhorar a adaptação dos modais em diferentes tamanhos de tela

### Desenvolvimento do Sistema
1. Implementar a página de gerenciamento de dispositivos
2. Preparar MVP para demonstração

### Médio Prazo (8-12 semanas)
1. Iniciar desenvolvimento do aplicativo mobile
2. Prototipar o firmware para ESP32 com integração direta ao Firebase
3. Implementar comunicação segura entre dispositivos e Firebase

### Longo Prazo (16+ semanas)
1. Implementar funcionalidades avançadas (relatórios, análises)
2. Integrar totalmente hardware e software
3. Realizar testes de escalabilidade e segurança
4. Preparar para lançamento em produção