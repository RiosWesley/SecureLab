/**
 * mobile.js - Funcionalidades para otimização da experiência mobile
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes mobile imediatamente
    createMobileElements();
    setupMobileMenuBehavior();
    
    // Detectar mudanças de tamanho de tela
    window.addEventListener('resize', handleResize);
    
    // Chamar uma vez para configurar o estado inicial
    handleResize();
});

/**
 * Manipula o redimensionamento da tela
 */
function handleResize() {
    const appContainer = document.querySelector('.app-container');
    
    if (window.innerWidth <= 768) {
        // Em dispositivos móveis, garantir que o menu esteja fechado inicialmente
        if (appContainer) {
            appContainer.classList.remove('show-mobile-menu');
        }
    }
}

/**
 * Cria os elementos necessários para a interface mobile
 */
function createMobileElements() {
    // Adicionar botão de menu mobile se não existir
    if (!document.querySelector('.mobile-menu-toggle')) {
        const header = document.querySelector('.main-header');
        
        if (header) {
            // Criar botão do menu
            const menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-toggle';
            menuButton.setAttribute('aria-label', 'Menu');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Adicionar ao header (no final)
            header.appendChild(menuButton);
            
            // Garantir que o botão seja visível (debug)
            console.log('Menu mobile criado:', menuButton);
        } else {
            console.warn('Header não encontrado para adicionar botão de menu mobile');
        }
    }
    
    // Criar overlay para fechamento do menu se não existir
    if (!document.querySelector('.mobile-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }
}

/**
 * Configura o comportamento do menu mobile
 */
function setupMobileMenuBehavior() {
    const appContainer = document.querySelector('.app-container');
    const menuButton = document.querySelector('.mobile-menu-toggle');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (menuButton && appContainer) {
        // Remover listeners existentes para evitar duplicação
        menuButton.removeEventListener('click', toggleMobileMenu);
        
        // Adicionar evento de clique no botão do menu
        menuButton.addEventListener('click', toggleMobileMenu);
        
        console.log('Comportamento do menu mobile configurado');
    } else {
        console.warn('Elementos necessários para o menu mobile não encontrados');
        if (!appContainer) console.warn('app-container não encontrado');
        if (!menuButton) console.warn('mobile-menu-toggle não encontrado');
    }
    
    if (overlay && appContainer) {
        // Remover listeners existentes para evitar duplicação
        overlay.removeEventListener('click', closeMobileMenu);
        
        // Fechar menu ao clicar no overlay
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    // Fechar menu ao clicar em links da navegação
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(function(link) {
        // Remover listeners existentes para evitar duplicação
        link.removeEventListener('click', closeMobileMenu);
        
        // Adicionar evento de clique
        link.addEventListener('click', closeMobileMenu);
    });
}

/**
 * Função para alternar a visibilidade do menu mobile
 */
function toggleMobileMenu() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        console.log('Alternando menu mobile');
        appContainer.classList.toggle('show-mobile-menu');
    }
}

/**
 * Função para fechar o menu mobile
 */
function closeMobileMenu() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.classList.remove('show-mobile-menu');
    }
}

/**
 * Detecta se o dispositivo é touch
 */
function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

// Adicionar classe ao body se for dispositivo touch para otimizações CSS específicas
if (isTouchDevice()) {
    document.body.classList.add('touch-device');
}