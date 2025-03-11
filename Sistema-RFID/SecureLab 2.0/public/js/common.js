/**
 * Funções comuns para todas as páginas do sistema
 */

// Função para verificar autenticação
function checkAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            // Redirecionar para login se não estiver autenticado
            console.log("checkAuth: Usuário não autenticado. Redirecionando para /login.html")
            window.location.href = '/login.html';
        } else {
            // Carregar nome do usuário
            loadCurrentUserName();
            // Carregar contagem de alertas
            loadAlertsCount();
        }
    });
}

// Função para carregar nome do usuário atual
function loadCurrentUserName() {
    const user = firebase.auth().currentUser;
    if (user) {
        database.ref('users').once('value')
            .then(snapshot => {
                const users = snapshot.val();
                // Procurar pelo usuário atual baseado no email
                const currentUser = Object.values(users).find(u => u.email === user.email);
                if (currentUser) {
                    const userNameElements = document.querySelectorAll('#current-user-name');
                    userNameElements.forEach(element => {
                        element.textContent = currentUser.name;
                    });
                }
            })
            .catch(error => console.error('Erro ao carregar dados do usuário:', error));
    }
}

// Função para carregar contagem de alertas
function loadAlertsCount() {
    // Em um sistema real, isso seria baseado em um modelo de alertas no Firebase
    // Por enquanto, vamos apenas verificar os dispositivos offline
    database.ref('devices').once('value')
        .then(snapshot => {
            const devices = snapshot.val();
            const offlineCount = devices ? Object.values(devices).filter(d => d.status === 'offline').length : 0;
            
            const alertCountElements = document.querySelectorAll('#alerts-count, #header-alerts-count');
            alertCountElements.forEach(element => {
                element.textContent = offlineCount;
            });
        })
        .catch(error => console.error('Erro ao carregar alertas:', error));
}

// Inicializar sidebar toggle
/**
 * Versão aprimorada para o common.js com gerenciamento consistente do sidebar
 */

// Inicializar sidebar toggle com persistência de estado
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const appContainer = document.querySelector('.app-container');
    
    if (sidebarToggle && appContainer) {
        // Remover event listeners anteriores para evitar duplicação
        const newToggle = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
        
        // Adicionar event listener ao novo elemento
        document.getElementById('sidebar-toggle').addEventListener('click', function() {
            appContainer.classList.toggle('sidebar-collapsed');
            
            // Salvar estado no localStorage para persistir entre páginas
            const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        // Restaurar estado do sidebar
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            appContainer.classList.add('sidebar-collapsed');
        } else {
            appContainer.classList.remove('sidebar-collapsed');
        }
    }
}

// Inicializar overlay para fechamento do menu em dispositivos móveis
function initSidebarOverlay() {
    const overlay = document.getElementById('sidebar-overlay');
    const appContainer = document.querySelector('.app-container');
    
    if (overlay && appContainer) {
        overlay.addEventListener('click', function() {
            appContainer.classList.remove('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', false);
        });
    }
}



// Inicializar botão de logout
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("initLogout: Clicou em Sair. Chamando signOut()"); // ADICIONE ESTA LINHA
            firebase.auth().signOut()
                .then(() => {
                    console.log("initLogout: signOut() bem-sucedido. Redirecionando para /login.html"); // ADICIONE ESTA LINHA
                    window.location.href = '/login.html';
                })
                .catch(error => {
                    console.error('Erro ao fazer logout:', error);
                    showNotification('error', 'Erro ao fazer logout');
                });
        });
    }
}
// Função para exibir notificações
function showNotification(type, message, duration = 3000) {
    // Verificar se já existe uma notificação
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        // Criar container de notificações
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Ícone com base no tipo
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Conteúdo da notificação
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao container
    notificationContainer.appendChild(notification);
    
    // Mostrar notificação com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar evento para fechar notificação
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-fechar após o tempo definido
    const timeout = setTimeout(() => {
        closeNotification(notification);
    }, duration);
    
    // Salvar timeout para cancelamento
    notification.dataset.timeout = timeout;
    
    return notification;
}

// Função para fechar uma notificação
function closeNotification(notification) {
    // Limpar timeout se existir
    const timeout = notification.dataset.timeout;
    if (timeout) {
        clearTimeout(timeout);
    }
    
    // Remover classe show para iniciar animação de saída
    notification.classList.remove('show');
    
    // Remover elemento após animação
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Função para configurar modal
function setupModal(modalId, openBtn, closeBtn, cancelBtn) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Adicionar classe modal-container se não existir
    if (!modal.classList.contains('modal')) {
        modal.classList.add('modal');
    }
    
    // Configurar botão de abrir
    if (openBtn) {
        const openButton = document.getElementById(openBtn);
        if (openButton) {
            openButton.addEventListener('click', () => {
                openModal(modalId);
            });
        }
    }
    
    // Configurar botão de fechar
    if (closeBtn) {
        const closeButton = document.getElementById(closeBtn);
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModal(modalId);
            });
        }
    }
    
    // Configurar botão de cancelar
    if (cancelBtn) {
        const cancelButton = document.getElementById(cancelBtn);
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModal(modalId);
            });
        }
    }
    
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

// Função para abrir modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        document.body.classList.add('modal-open');
        modal.classList.add('active');
    }
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        document.body.classList.remove('modal-open');
        modal.classList.remove('active');
    }
}

// Função para formatar data
function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Função para formatar data e hora
function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para formatar status
function formatStatus(status) {
    const statusMap = {
        'active': 'Ativo',
        'inactive': 'Inativo',
        'locked': 'Trancado',
        'unlocked': 'Destrancado',
        'online': 'Online',
        'offline': 'Offline',
        'access_granted': 'Acesso Permitido',
        'access_denied': 'Acesso Negado'
    };
    
    return statusMap[status] || status;
}

// Função para obter classe CSS com base no status
function getStatusClass(status) {
    const classMap = {
        'active': 'success',
        'inactive': 'secondary',
        'locked': 'success',
        'unlocked': 'danger',
        'online': 'success',
        'offline': 'danger',
        'access_granted': 'success',
        'access_denied': 'danger'
    };
    
    return classMap[status] || 'secondary';
}

// Função para capitalizar texto
function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Função para traduzir função/papel
function translateRole(role) {
    const roleMap = {
        'admin': 'Administrador',
        'user': 'Usuário'
    };
    
    return roleMap[role] || role;
}



// Função para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Função para validar senha
function isValidPassword(password) {
    // Pelo menos 6 caracteres
    return password && password.length >= 6;
}

// Inicializar funções comuns quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initSidebar();
    initSidebarOverlay();
    initLogout();
    
    // Adicionar estilos para notificações se ainda não existirem
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            }
            
            .notification {
                display: flex;
                align-items: center;
                padding: 12px 15px;
                margin-bottom: 10px;
                border-radius: 4px;
                background-color: white;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
                transform: translateX(120%);
                transition: transform 0.3s ease-out;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                border-left: 4px solid #28a745;
            }
            
            .notification-error {
                border-left: 4px solid #dc3545;
            }
            
            .notification-warning {
                border-left: 4px solid #ffc107;
            }
            
            .notification-info {
                border-left: 4px solid #17a2b8;
            }
            
            .notification-icon {
                margin-right: 10px;
                font-size: 1.2rem;
            }
            
            .notification-success .notification-icon {
                color: #28a745;
            }
            
            .notification-error .notification-icon {
                color: #dc3545;
            }
            
            .notification-warning .notification-icon {
                color: #ffc107;
            }
            
            .notification-info .notification-icon {
                color: #17a2b8;
            }
            
            .notification-message {
                flex: 1;
                font-size: 0.9rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #6c757d;
                font-size: 0.8rem;
                padding: 0;
                margin-left: 10px;
            }
            
            /* Modal styles */
            body.modal-open {
                overflow: hidden;
            }
            
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                overflow-y: auto;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal.active {
                display: flex;
                opacity: 1;
                align-items: center;
                justify-content: center;
            }
            
            .modal-dialog {
                background-color: white;
                border-radius: 5px;
                max-width: 500px;
                width: 100%;
                margin: 30px auto;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            
            .modal.active .modal-dialog {
                transform: translateY(0);
            }
            
            .modal-dialog.modal-sm {
                max-width: 300px;
            }
            
            .modal-dialog.modal-lg {
                max-width: 800px;
            }
            
            .modal-content {
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
            }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                border-bottom: 1px solid #dee2e6;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            
            .close-button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #6c757d;
                padding: 0;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding: 15px 20px;
                border-top: 1px solid #dee2e6;
                gap: 10px;
            }
            
            /* Form styles */
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .form-control {
                display: block;
                width: 100%;
                padding: 8px 12px;
                font-size: 1rem;
                border: 1px solid #ced4da;
                border-radius: 4px;
                transition: border-color 0.15s ease-in-out;
            }
            
            .form-control:focus {
                border-color: #4a6cf7;
                outline: 0;
            }
            
            /* Table styles */
            .table-responsive {
                overflow-x: auto;
            }
            
            .table {
                width: 100%;
                margin-bottom: 1rem;
                color: #212529;
                border-collapse: collapse;
            }
            
            .table thead th {
                vertical-align: bottom;
                padding: 12px 15px;
                border-bottom: 2px solid #dee2e6;
                text-align: left;
                font-weight: 600;
            }
            
            .table tbody tr {
                border-bottom: 1px solid #dee2e6;
                transition: background-color 0.1s;
            }
            
            .table-hover tbody tr:hover {
                background-color: rgba(0, 0, 0, 0.03);
            }
            
            .table td {
                padding: 12px 15px;
                vertical-align: middle;
            }
            
            /* Status badge */
            .badge-status {
                display: inline-block;
                padding: 4px 8px;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 30px;
                text-align: center;
            }
            
            .badge-success {
                background-color: rgba(40, 167, 69, 0.1);
                color: #28a745;
            }
            
            .badge-danger {
                background-color: rgba(220, 53, 69, 0.1);
                color: #dc3545;
            }
            
            .badge-warning {
                background-color: rgba(255, 193, 7, 0.1);
                color: #ffc107;
            }
            
            .badge-info {
                background-color: rgba(23, 162, 184, 0.1);
                color: #17a2b8;
            }
            
            .badge-secondary {
                background-color: rgba(108, 117, 125, 0.1);
                color: #6c757d;
            }
            
            /* Action buttons */
            .action-buttons {
                display: flex;
                gap: 5px;
            }
            
            .action-btn {
                background: none;
                border: none;
                font-size: 0.9rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .action-btn:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            
            .action-btn-edit {
                color: #17a2b8;
            }
            
            .action-btn-delete {
                color: #dc3545;
            }
            
            /* Pagination */
            .pagination-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 20px;
            }
            
            .pagination-info {
                font-size: 0.9rem;
                color: #6c757d;
            }
            
            .pagination {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .pagination-btn {
                background: none;
                border: 1px solid #dee2e6;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .pagination-btn:hover:not(:disabled) {
                background-color: #f8f9fa;
            }
            
            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .pagination-numbers {
                display: flex;
                gap: 5px;
            }
            
            .page-number {
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                border: 1px solid #dee2e6;
                transition: all 0.2s;
            }
            
            .page-number.active {
                background-color: #4a6cf7;
                color: white;
                border-color: #4a6cf7;
            }
            
            .page-number:hover:not(.active) {
                background-color: #f8f9fa;
            }
            
            /* Dropdown */
            .dropdown {
                position: relative;
                display: inline-block;
            }
            
            .dropdown-menu {
                position: absolute;
                right: 0;
                top: 100%;
                z-index: 100;
                display: none;
                min-width: 180px;
                padding: 8px 0;
                margin: 5px 0 0;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .dropdown-menu.show {
                display: block;
            }
            
            .dropdown-item {
                display: block;
                width: 100%;
                padding: 8px 15px;
                clear: both;
                text-align: inherit;
                white-space: nowrap;
                background-color: transparent;
                border: 0;
                color: #212529;
                text-decoration: none;
                transition: background-color 0.2s;
            }
            
            .dropdown-item:hover {
                background-color: #f8f9fa;
            }
            
            .dropdown-item i {
                width: 20px;
                text-align: center;
                margin-right: 5px;
            }
            
            /* Password input */
            .password-input {
                position: relative;
            }
            
            .password-toggle {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                color: #6c757d;
            }
            
            /* Row for filters */
            .row {
                display: flex;
                flex-wrap: wrap;
                margin-right: -10px;
                margin-left: -10px;
            }
            
            .col-md-4 {
                position: relative;
                width: 100%;
                padding-right: 10px;
                padding-left: 10px;
            }
            
            @media (min-width: 768px) {
                .col-md-4 {
                    flex: 0 0 33.333333%;
                    max-width: 33.333333%;
                }
            }
        `;
        document.head.appendChild(style);
    }
});