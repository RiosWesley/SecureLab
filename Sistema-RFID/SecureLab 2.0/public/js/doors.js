/**
 * doors.js - Gerenciamento básico de portas para o sistema SecureLab RFID
 * 
 * Funcionalidades:
 * - Visualizar portas existentes
 * - Adicionar novas portas
 * - Controlar portas (abrir/fechar)
 */

// Garantir que o usuário está autenticado
checkAuth();

// Elementos do DOM
const elements = {
    // Tabela
    tableBody: document.querySelector('#doorsTable tbody'),
    
    // Pesquisa
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    
    // Botões de ação
    addDoorBtn: document.getElementById('addDoorBtn'),
    
    // Modal para adicionar/editar portas
    doorModal: document.getElementById('doorModal'),
    doorForm: document.getElementById('doorForm'),
    doorName: document.getElementById('doorName'),
    doorLocation: document.getElementById('doorLocation'),
    doorStatus: document.getElementById('doorStatus'),
    saveDoorBtn: document.getElementById('saveDoorBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    
    // Modal de controle de portas
    controlDoorModal: document.getElementById('controlDoorModal'),
    controlDoorName: document.getElementById('controlDoorName'),
    controlDoorStatus: document.getElementById('controlDoorStatus'),
    lockDoorBtn: document.getElementById('lockDoorBtn'),
    unlockDoorBtn: document.getElementById('unlockDoorBtn'),
    closeControlBtn: document.getElementById('closeControlBtn')
};

// Dados e estado
let doors = [];
let currentDoorId = null;

// Referência ao Firebase
const doorsRef = firebase.database().ref('doors');

/**
 * Inicializa a página de gerenciamento de portas
 */
function initDoorManagement() {
    // Carregar portas do Firebase
    loadDoors();
    
    // Configurar eventos
    setupEventListeners();
}

/**
 * Carrega as portas do Firebase
 */
function loadDoors() {
    doorsRef.on('value', (snapshot) => {
        doors = [];
        snapshot.forEach((childSnapshot) => {
            const door = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            doors.push(door);
        });
        
        // Atualizar tabela
        renderDoors();
    });
}

/**
 * Configura os event listeners para a página
 */
function setupEventListeners() {
    // Pesquisa
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Modal de porta
    elements.addDoorBtn.addEventListener('click', () => openDoorModal());
    elements.cancelBtn.addEventListener('click', () => closeModal(elements.doorModal));
    elements.doorForm.addEventListener('submit', handleDoorFormSubmit);
    elements.saveDoorBtn.addEventListener('click', () => elements.doorForm.dispatchEvent(new Event('submit')));
    
    // Modal de controle de porta
    elements.closeControlBtn.addEventListener('click', () => closeModal(elements.controlDoorModal));
    elements.lockDoorBtn.addEventListener('click', () => controlDoor('lock'));
    elements.unlockDoorBtn.addEventListener('click', () => controlDoor('unlock'));
    
    // Fechar modais ao clicar no X
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });
}

/**
 * Renderiza as portas na tabela
 */
function renderDoors() {
    const tableBody = elements.tableBody;
    tableBody.innerHTML = '';
    
    // Verificar se há portas para exibir
    if (doors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'Nenhuma porta encontrada.';
        cell.classList.add('empty-table-message');
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    // Filtrar portas se houver texto de pesquisa
    let displayDoors = doors;
    const searchText = elements.searchInput.value.trim().toLowerCase();
    if (searchText) {
        displayDoors = doors.filter(door => 
            door.name.toLowerCase().includes(searchText) || 
            door.location.toLowerCase().includes(searchText)
        );
    }
    
    // Adicionar as portas à tabela
    displayDoors.forEach(door => {
        const row = document.createElement('tr');
        
        // Nome
        const nameCell = document.createElement('td');
        nameCell.textContent = door.name;
        row.appendChild(nameCell);
        
        // Localização
        const locationCell = document.createElement('td');
        locationCell.textContent = door.location;
        row.appendChild(locationCell);
        
        // Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.classList.add('status-badge');
        
        if (door.status === 'locked') {
            statusBadge.classList.add('status-locked');
            statusBadge.innerHTML = '<i class="fas fa-lock"></i> Trancada';
        } else if (door.status === 'unlocked') {
            statusBadge.classList.add('status-unlocked');
            statusBadge.innerHTML = '<i class="fas fa-lock-open"></i> Destrancada';
        } else {
            statusBadge.classList.add('status-unknown');
            statusBadge.innerHTML = '<i class="fas fa-question-circle"></i> Desconhecido';
        }
        
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Última Atividade
        const lastActivityCell = document.createElement('td');
        if (door.last_status_change) {
            const date = new Date(door.last_status_change);
            lastActivityCell.textContent = formatDate(date);
        } else {
            lastActivityCell.textContent = 'Nunca';
        }
        row.appendChild(lastActivityCell);
        
        // Ações
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('actions-cell');
        
        // Botão de controle
        const controlBtn = document.createElement('button');
        controlBtn.classList.add('btn-icon', 'btn-control');
        controlBtn.innerHTML = '<i class="fas fa-sliders-h"></i>';
        controlBtn.setAttribute('title', 'Controlar Porta');
        controlBtn.addEventListener('click', () => openControlModal(door));
        actionsCell.appendChild(controlBtn);
        
        // Botão de edição
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn-icon', 'btn-edit');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.setAttribute('title', 'Editar Porta');
        editBtn.addEventListener('click', () => openDoorModal(door));
        actionsCell.appendChild(editBtn);
        
        row.appendChild(actionsCell);
        
        // Adicionar a linha à tabela
        tableBody.appendChild(row);
    });
}

/**
 * Manipula a pesquisa de portas
 */
function handleSearch() {
    renderDoors();
}

/**
 * Abre o modal para adicionar ou editar uma porta
 * @param {Object} door - A porta a ser editada (null para adicionar)
 */
function openDoorModal(door = null) {
    // Limpar formulário
    elements.doorForm.reset();
    
    if (door) {
        // Modo de edição
        document.getElementById('modalTitle').textContent = 'Editar Porta';
        currentDoorId = door.id;
        
        // Preencher formulário
        elements.doorName.value = door.name;
        elements.doorLocation.value = door.location;
        elements.doorStatus.value = door.status || 'locked';
    } else {
        // Modo de adição
        document.getElementById('modalTitle').textContent = 'Adicionar Nova Porta';
        currentDoorId = null;
        
        // Valor padrão para status
        elements.doorStatus.value = 'locked';
    }
    
    // Abrir modal
    openModal(elements.doorModal);
}

/**
 * Manipula o envio do formulário de porta
 * @param {Event} e - O evento de envio
 */
function handleDoorFormSubmit(e) {
    e.preventDefault();
    
    // Validar formulário
    if (!elements.doorForm.checkValidity()) {
        elements.doorForm.reportValidity();
        return;
    }
    
    // Obter dados do formulário
    const doorData = {
        name: elements.doorName.value.trim(),
        location: elements.doorLocation.value.trim(),
        status: elements.doorStatus.value,
        last_status_change: Date.now()
    };
    
    // Salvar no Firebase
    if (currentDoorId) {
        // Atualizar porta existente
        doorsRef.child(currentDoorId).update(doorData)
            .then(() => {
                closeModal(elements.doorModal);
                showNotification('Porta atualizada com sucesso!', 'success');
            })
            .catch(error => {
                console.error('Erro ao atualizar porta:', error);
                showNotification('Erro ao atualizar porta: ' + error.message, 'error');
            });
    } else {
        // Adicionar nova porta
        doorsRef.push(doorData)
            .then(() => {
                closeModal(elements.doorModal);
                showNotification('Porta adicionada com sucesso!', 'success');
            })
            .catch(error => {
                console.error('Erro ao adicionar porta:', error);
                showNotification('Erro ao adicionar porta: ' + error.message, 'error');
            });
    }
}

/**
 * Abre o modal de controle para uma porta específica
 * @param {Object} door - A porta a ser controlada
 */
function openControlModal(door) {
    currentDoorId = door.id;
    
    // Preencher informações da porta
    document.getElementById('controlModalTitle').textContent = `Controlar Porta - ${door.name}`;
    elements.controlDoorName.textContent = door.name;
    
    // Status
    let statusText = 'Desconhecido';
    let statusClass = 'status-unknown';
    
    if (door.status === 'locked') {
        statusText = 'Trancada';
        statusClass = 'status-locked';
    } else if (door.status === 'unlocked') {
        statusText = 'Destrancada';
        statusClass = 'status-unlocked';
    }
    
    const statusSpan = elements.controlDoorStatus.querySelector('span');
    statusSpan.textContent = statusText;
    statusSpan.className = 'status-badge ' + statusClass;
    
    // Configurar visibilidade dos botões de controle
    if (door.status === 'locked') {
        elements.lockDoorBtn.classList.add('hidden');
        elements.unlockDoorBtn.classList.remove('hidden');
    } else {
        elements.lockDoorBtn.classList.remove('hidden');
        elements.unlockDoorBtn.classList.add('hidden');
    }
    
    // Abrir modal
    openModal(elements.controlDoorModal);
}

/**
 * Controla uma porta (tranca/destranca)
 * @param {string} action - A ação a ser realizada (lock/unlock)
 */
function controlDoor(action) {
    if (!currentDoorId) return;
    
    const statusUpdate = {
        status: action === 'lock' ? 'locked' : 'unlocked',
        last_status_change: Date.now()
    };
    
    // Atualizar status no Firebase
    doorsRef.child(currentDoorId).update(statusUpdate)
        .then(() => {
            // Registrar log de acesso
            const user = firebase.auth().currentUser;
            const logData = {
                user_id: user.uid,
                user_name: user.displayName || user.email,
                door_id: currentDoorId,
                door_name: doors.find(d => d.id === currentDoorId)?.name || 'Porta',
                action: action,
                method: 'web',
                timestamp: Date.now()
            };
            
            return firebase.database().ref('access_logs').push(logData);
        })
        .then(() => {
            closeModal(elements.controlDoorModal);
            const actionText = action === 'lock' ? 'trancada' : 'destrancada';
            showNotification(`Porta ${actionText} com sucesso!`, 'success');
        })
        .catch(error => {
            console.error(`Erro ao ${action === 'lock' ? 'trancar' : 'destrancar'} porta:`, error);
            showNotification(`Erro ao controlar porta: ${error.message}`, 'error');
        });
}

/**
 * Formata uma data para exibição
 * @param {Date} date - A data a ser formatada
 * @returns {string} A data formatada
 */
function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Mostra uma notificação na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        ${icon}
        <span>${message}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Configurar botão de fechar
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Abre um modal
 * @param {HTMLElement} modal - O modal a ser aberto
 */
function openModal(modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

/**
 * Fecha um modal
 * @param {HTMLElement} modal - O modal a ser fechado
 */
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Inicializar a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initDoorManagement);