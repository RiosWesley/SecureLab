/**
 * theme-switcher.js - Controle de tema claro/escuro para o SecureLab RFID
 */

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistema de tema
    initThemeSystem();
});

/**
 * Inicializa o sistema de tema claro/escuro
 */
function initThemeSystem() {
    // Criar botão de alternância se ainda não existir
    createThemeToggleButton();
    
    // Verificar se temos uma preferência salva
    const savedTheme = localStorage.getItem('secureLab-theme');
    
    // Se temos uma preferência salva, aplicar
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Verificar preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    }
    
    // Adicionar listener para mudanças na preferência do sistema
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            saveThemePreference(newTheme);
        });
    }
}

/**
 * Cria o botão de alternância de tema no header
 */
function createThemeToggleButton() {
    // Verificar se o botão já existe
    if (document.querySelector('.theme-toggle')) {
        return;
    }
    
    // Localizar o elemento de notificações no header (para inserir o botão ao lado)
    const notificationsElement = document.querySelector('.notifications');
    
    if (notificationsElement) {
        // Criar botão
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('title', 'Alternar tema claro/escuro');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        
        // Adicionar event listener
        themeToggle.addEventListener('click', toggleTheme);
        
        // Inserir antes do elemento de notificações
        notificationsElement.parentNode.insertBefore(themeToggle, notificationsElement);
        
        console.log('Botão de tema criado com sucesso');
    } else {
        console.warn('Elemento de notificações não encontrado. O botão de tema não foi criado.');
    }
}

/**
 * Alterna entre os temas claro e escuro
 */
function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Aplicar novo tema
    applyTheme(newTheme);
    
    // Salvar preferência
    saveThemePreference(newTheme);
    
    // Atualizar ícone do botão
    updateThemeToggleIcon(newTheme);
}

/**
 * Aplica o tema especificado
 * @param {string} theme - 'light' ou 'dark'
 */
function applyTheme(theme) {
    // Adicionar classe de transição para suavizar a mudança
    document.documentElement.classList.add('theme-transition');
    
    // Aplicar ou remover a classe dark-mode
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        
        // Corrigir textos coloridos específicos (como labels de formulário)
        fixColoredTexts();
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
    
    // Atualizar ícone do botão
    updateThemeToggleIcon(theme);
    
    // Aplicar tema aos gráficos do Chart.js (se existirem)
    updateChartsTheme(theme);
    
    // Após a transição, remover a classe de transição
    setTimeout(function() {
        document.documentElement.classList.remove('theme-transition');
    }, 300);
}

/**
 * Corrige elementos de texto específicos que precisam de ajuste no tema escuro
 * Isso é especialmente útil para elementos com cores definidas inline ou estilos específicos
 */
function fixColoredTexts() {
    // Buscar todos os elementos que podem ser labels de formulário
    const potentialLabels = document.querySelectorAll('.modal-body > div:not(.form-group), .modal label, form label, .form-group label');
    
    // Aplicar cor adequada para o tema escuro
    potentialLabels.forEach(element => {
        // Preservar a cor original em um atributo data se ainda não existir
        if (!element.dataset.originalColor && element.style.color) {
            element.dataset.originalColor = element.style.color;
        }
        
        // Aplicar a cor do tema escuro
        element.style.color = '#9ba5b0';
    });
    
    // Buscar elementos com cor azul ou clara definida inline
    const coloredElements = document.querySelectorAll('[style*="color"]');
    coloredElements.forEach(element => {
        const style = element.getAttribute('style');
        // Se o estilo contém cores azuis claras específicas
        if (style && (
            style.includes('color: #4a6cf7') || 
            style.includes('color:#4a6cf7') ||
            style.includes('color: rgb(74, 108, 247)') ||
            style.includes('color: #3498db') ||
            style.includes('color: #1e90ff')
        )) {
            // Preservar a cor original
            if (!element.dataset.originalColor) {
                element.dataset.originalColor = element.style.color;
            }
            
            // Aplicar a cor do tema escuro
            element.style.color = '#9ba5b0';
        }
    });
    
    // Específicamente para os labels Nome e Localização
    const doorLabels = document.querySelectorAll('#doorModal .modal-body > div:not(.form-group), [id*="door"] .modal-body > div');
    doorLabels.forEach(label => {
        label.style.color = '#9ba5b0';
    });
}

/**
 * Atualiza o tema dos gráficos Chart.js
 * @param {string} theme - 'light' ou 'dark'
 */
function updateChartsTheme(theme) {
    // Verificar se o Chart.js está disponível
    if (window.Chart) {
        // Definir cores globais para todos os gráficos
        const isDark = theme === 'dark';
        
        // Definir defaults globais para o Chart.js
        Chart.defaults.color = isDark ? '#e4e6eb' : '#666';
        Chart.defaults.borderColor = isDark ? '#3d434e' : '#ddd';
        Chart.defaults.backgroundColor = isDark ? '#252931' : '#fff';
        
        // Atualizar todos os gráficos existentes
        updateExistingCharts(isDark);
    }
}

/**
 * Atualiza os gráficos existentes para o tema atual
 * @param {boolean} isDark - Se o tema atual é escuro
 */
function updateExistingCharts(isDark) {
    // Verificar se há uma instância global de gráfico de atividade
    if (window.activityChartInstance) {
        const chart = window.activityChartInstance;
        
        // Atualizar configurações de cores
        chart.options.scales.x.grid.color = isDark ? '#3d434e' : '#ddd';
        chart.options.scales.y.grid.color = isDark ? '#3d434e' : '#ddd';
        chart.options.scales.x.ticks.color = isDark ? '#b1b5bd' : '#666';
        chart.options.scales.y.ticks.color = isDark ? '#b1b5bd' : '#666';
        
        // Atualizar o gráfico
        chart.update();
    }
    
    // Se houver outros gráficos específicos, atualizá-los aqui
}

/**
 * Salva a preferência de tema do usuário
 * @param {string} theme - 'light' ou 'dark'
 */
function saveThemePreference(theme) {
    localStorage.setItem('secureLab-theme', theme);
    console.log(`Tema ${theme} salvo nas preferências`);
}

/**
 * Atualiza o ícone do botão de tema
 * @param {string} theme - 'light' ou 'dark'
 */
function updateThemeToggleIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}