/**
 * theme-switcher.js - Gerenciamento de tema claro/escuro para SecureLab 2.0
 */

(function() {
    // Constantes
    const THEME_STORAGE_KEY = 'securelab-theme';
    const DARK_MODE_CLASS = 'dark-mode';
    
    // Verifica se estamos na página de login ou no dashboard
    const isLoginPage = window.location.pathname.includes('login.html');
    
    /**
     * Inicializa o controle de tema
     */
    function initThemeSwitcher() {
        // Criar botão de alternância se não existir
        createThemeToggleButton();
        
        // Aplicar tema inicial
        applyTheme(getPreferredTheme());
        
        // Adicionar listener para o botão de tema
        document.addEventListener('click', function(e) {
            if (e.target.closest('#theme-toggle')) {
                toggleTheme();
            }
        });
        
        // Ouvir mudanças nas preferências do sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                    // Aplicar a preferência do sistema se o usuário não definiu manualmente
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    /**
     * Cria o botão de alternância de tema se não existir
     */
    function createThemeToggleButton() {
        // Verificar se o botão já existe
        if (document.getElementById('theme-toggle')) {
            return;
        }
        
        // Criar botão
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'icon-button';
        button.setAttribute('aria-label', 'Alternar tema');
        button.innerHTML = '<i class="fas fa-moon"></i>';
        
        // Adicionar o botão à página
        if (isLoginPage) {
            // Na página de login, adicionar no canto superior direito
            const container = document.createElement('div');
            container.className = 'theme-toggle-container';
            container.style.cssText = 'position: absolute; top: 20px; right: 20px; z-index: 100;';
            container.appendChild(button);
            document.body.appendChild(container);
        } else {
            // Nas outras páginas, adicionar no header
            const headerRight = document.querySelector('.header-right');
            if (headerRight) {
                headerRight.insertBefore(button, headerRight.firstChild);
            }
        }
    }
    
    /**
     * Obtém o tema preferido do usuário
     */
    function getPreferredTheme() {
        // Verificar preferência salva
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
            return savedTheme;
        }
        
        // Verificar preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        // Padrão: tema claro
        return 'light';
    }
    
    /**
     * Aplica o tema especificado
     */
    function applyTheme(theme) {
        const html = document.documentElement;
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle ? themeToggle.querySelector('i') : null;
        
        if (theme === 'dark') {
            html.classList.add(DARK_MODE_CLASS);
            if (icon) {
                icon.className = 'fas fa-sun'; // Ícone do sol no modo escuro
            }
        } else {
            html.classList.remove(DARK_MODE_CLASS);
            if (icon) {
                icon.className = 'fas fa-moon'; // Ícone da lua no modo claro
            }
        }
        
        // Salvar preferência
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        
        // Ajustar gráficos se estiverem presentes
        updateCharts(theme);
    }
    
    /**
     * Alterna entre os temas claro e escuro
     */
    function toggleTheme() {
        const currentTheme = getPreferredTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }
    
    /**
     * Atualiza os gráficos para se adequarem ao tema atual (se existirem)
     */
    function updateCharts(theme) {
        // Verificar se a variável global Chart existe (Chart.js)
        if (window.Chart && window.activityChartInstance) {
            // Aplicar tema ao gráfico
            const isDark = theme === 'dark';
            
            // Ajustar cores do gráfico
            window.activityChartInstance.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            window.activityChartInstance.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            window.activityChartInstance.options.scales.x.ticks.color = isDark ? '#c9cdd4' : '#6c757d';
            window.activityChartInstance.options.scales.y.ticks.color = isDark ? '#c9cdd4' : '#6c757d';
            
            // Ajustar legendas
            if (window.activityChartInstance.options.plugins && window.activityChartInstance.options.plugins.legend) {
                window.activityChartInstance.options.plugins.legend.labels.color = isDark ? '#c9cdd4' : '#333';
                
                // Tentar ajustar as cores de cada dataset para manter a visibilidade
                if (window.activityChartInstance.data && window.activityChartInstance.data.datasets) {
                    window.activityChartInstance.data.datasets.forEach(dataset => {
                        // Aumentar a opacidade para maior visibilidade no modo escuro
                        if (isDark && dataset.backgroundColor) {
                            if (typeof dataset.backgroundColor === 'string') {
                                // Se for uma string, assumimos que é uma cor única
                                dataset.borderColor = increaseBrightness(dataset.backgroundColor, 15);
                            } else if (Array.isArray(dataset.backgroundColor)) {
                                // Se for um array, precisamos ajustar cada cor
                                dataset.borderColor = dataset.backgroundColor.map(color => 
                                    increaseBrightness(color, 15)
                                );
                            }
                        }
                    });
                }
            }
            
            // Atualizar o gráfico
            window.activityChartInstance.update();
        }
        
        // Ajustar gráfico de donut dos dispositivos
        const donutHole = document.querySelector('.donut-hole');
        const donutText = document.querySelector('.donut-text');
        if (donutHole && theme === 'dark') {
            donutHole.style.backgroundColor = '#2c3144';
            if (donutText) {
                donutText.style.color = '#f0f2f5';
            }
        } else if (donutHole && theme === 'light') {
            donutHole.style.backgroundColor = 'white';
            if (donutText) {
                donutText.style.color = '#212529';
            }
        }
    }
    
    /**
     * Aumenta o brilho de uma cor para melhor visibilidade no modo escuro
     */
    function increaseBrightness(color, percent) {
        // Se não for uma cor no formato hexadecimal, retornar a cor original
        if (!color || typeof color !== 'string' || !color.startsWith('#')) {
            return color;
        }
        
        // Converter para RGB
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        
        // Aumentar brilho
        r = Math.min(255, Math.floor(r * (1 + percent / 100)));
        g = Math.min(255, Math.floor(g * (1 + percent / 100)));
        b = Math.min(255, Math.floor(b * (1 + percent / 100)));
        
        // Converter de volta para hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeSwitcher);
    } else {
        initThemeSwitcher();
    }
})();