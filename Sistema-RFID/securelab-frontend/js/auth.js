// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está autenticado
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Se estiver na página de login mas já estiver autenticado, redirecionar para dashboard
    if (token && user && window.location.pathname.includes('login.html')) {
        // Verificar se tem parâmetros na URL que indicam logout ou erro de autenticação
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('logout') && !urlParams.has('auth')) {
            window.location.href = '/';
        }
    }
    
    // Configurar formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Verificar mensagens de erro ou logout na URL
    checkUrlMessages();
});

// Lidar com envio do formulário de login
async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showLoginMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Mostrar indicador de carregamento
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autenticando...';
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Salvar token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirecionar para dashboard
            window.location.href = '/';
        } else {
            showLoginMessage(data.message || 'Email ou senha incorretos. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro durante login:', error);
        showLoginMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Verificar mensagens na URL
function checkUrlMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('logout') && urlParams.get('logout') === 'success') {
        showLoginMessage('Logout realizado com sucesso.', 'success');
    }
    
    if (urlParams.has('auth')) {
        const authStatus = urlParams.get('auth');
        
        if (authStatus === 'required') {
            showLoginMessage('Você precisa fazer login para acessar o sistema.', 'warning');
        } else if (authStatus === 'expired') {
            showLoginMessage('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        }
    }
}

// Exibir mensagem na tela de login
function showLoginMessage(message, type = 'info') {
    // Criar elemento para a mensagem se não existir
    let messageContainer = document.getElementById('login-message');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'login-message';
        document.body.insertBefore(messageContainer, document.body.firstChild);
    }
    
    // Mapear tipo para classe Bootstrap
    const classMap = {
        error: 'alert-danger',
        success: 'alert-success',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    // Limpar classes anteriores
    messageContainer.className = 'alert';
    messageContainer.classList.add(classMap[type] || 'alert-info');
    
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    
    // Esconder mensagem após 5 segundos se for sucesso
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Função para realizar logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html?logout=success';
}