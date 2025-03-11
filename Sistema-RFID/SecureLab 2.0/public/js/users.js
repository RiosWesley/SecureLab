/**
 * Gerenciamento de Usuários
 */

// Verificar se estamos na página de usuários
if (!isPage('users')) {
    console.log('Script de usuários não será executado nesta página');
} else {
    console.log('Carregando script de usuários...');
}

// Configurações de paginação
const PAGE_SIZE = 10;
let currentPage = 1;
let totalUsers = 0;
let filteredUsers = [];

// Usuário atual sendo editado
let currentEditingUser = null;

// Elementos do DOM
let tableBody, searchInput, filterDepartment, filterRole, filterStatus, 
    resetFiltersBtn, refreshBtn, exportDropdown, exportMenu, exportCsvBtn, 
    exportPdfBtn, addUserBtn, userForm, userNameInput, userEmailInput, 
    userDepartmentInput, userRoleInput, userStatusInput, userPasswordInput, 
    passwordGroup, togglePasswordBtn, saveUserBtn, userModalTitle, 
    paginationStart, paginationEnd, paginationTotal, paginationNumbers, 
    prevPageBtn, nextPageBtn, confirmActionBtn, confirmModalMessage;

// Inicializar elementos do DOM de forma segura
function initDOMElements() {
    tableBody = document.getElementById('users-table-body');
    searchInput = document.getElementById('search-users');
    filterDepartment = document.getElementById('filter-department');
    filterRole = document.getElementById('filter-role');
    filterStatus = document.getElementById('filter-status');
    resetFiltersBtn = document.getElementById('reset-filters-btn');
    refreshBtn = document.getElementById('refresh-users');
    exportDropdown = document.getElementById('export-dropdown');
    exportMenu = document.getElementById('export-menu');
    exportCsvBtn = document.getElementById('export-csv');
    exportPdfBtn = document.getElementById('export-pdf');
    addUserBtn = document.getElementById('add-user-btn');
    userForm = document.getElementById('user-form');
    userNameInput = document.getElementById('user-name');
    userEmailInput = document.getElementById('user-email');
    userDepartmentInput = document.getElementById('user-department');
    userRoleInput = document.getElementById('user-role');
    userStatusInput = document.getElementById('user-status');
    userPasswordInput = document.getElementById('user-password');
    passwordGroup = document.getElementById('password-group');
    togglePasswordBtn = document.getElementById('toggle-password');
    saveUserBtn = document.getElementById('save-user-btn');
    userModalTitle = document.getElementById('user-modal-title');
    paginationStart = document.getElementById('pagination-start');
    paginationEnd = document.getElementById('pagination-end');
    paginationTotal = document.getElementById('pagination-total');
    paginationNumbers = document.getElementById('pagination-numbers');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');
    confirmActionBtn = document.getElementById('confirm-action-btn');
    confirmModalMessage = document.getElementById('confirm-modal-message');
}

// Carregar usuários quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de usuários
    if (!isPage('users')) {
        return; // Não executar o script se não estiver na página de usuários
    }
    
    console.log("Inicializando página de usuários...");
    
    // Inicializar elementos DOM
    initDOMElements();
    
    // Setup modais
    setupModal('user-modal', 'add-user-btn', 'close-user-modal', 'cancel-user-btn');
    setupModal('confirm-modal', null, 'close-confirm-modal', 'cancel-confirm-btn');
    
    // Carregar usuários
    loadUsers();
    
    // Configurar eventos de filtro
    setupFilters();
    
    // Configurar eventos de exportação
    setupExport();
    
    // Configurar eventos de formulário
    setupForm();
    
    // Configurar dropdown
    setupDropdown();
});

// Configurar eventos de dropdown
function setupDropdown() {
    if (exportDropdown && exportMenu) {
        exportDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('show');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            if (exportMenu.classList.contains('show')) {
                exportMenu.classList.remove('show');
            }
        });
    }
}

// Configurar eventos de filtro
function setupFilters() {
    // Busca de usuários
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            applyFilters();
        }, 300));
    }
    
    // Filtros de dropdown
    [filterDepartment, filterRole, filterStatus].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                applyFilters();
            });
        }
    });
    
    // Botão de resetar filtros
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterDepartment) filterDepartment.value = '';
            if (filterRole) filterRole.value = '';
            if (filterStatus) filterStatus.value = '';
            
            applyFilters();
        });
    }
    
    // Botão de atualizar
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadUsers();
        });
    }
}

// Configurar eventos de exportação
function setupExport() {
    // Exportar CSV
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportUsers('csv');
        });
    }
    
    // Exportar PDF
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportUsers('pdf');
        });
    }
}

// Configurar eventos de formulário
function setupForm() {
    // Toggle de senha
    if (togglePasswordBtn && userPasswordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = userPasswordInput.type === 'password' ? 'text' : 'password';
            userPasswordInput.type = type;
            
            // Alterar ícone
            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                if (type === 'password') {
                    icon.className = 'fas fa-eye';
                } else {
                    icon.className = 'fas fa-eye-slash';
                }
            }
        });
    }
    
    // Salvar usuário
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', () => {
            saveUser();
        });
    }
    
    // Reset de formulário ao fechar modal
    const closeUserModal = document.getElementById('close-user-modal');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    
    if (closeUserModal) {
        closeUserModal.addEventListener('click', resetForm);
    }
    
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', resetForm);
    }
}

// Carregar usuários do Firebase
function loadUsers() {
    if (!tableBody) {
        console.error('Elemento tableBody não encontrado!');
        return;
    }
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando usuários...</td></tr>';
    
    database.ref('users').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            
            if (users) {
                // Converter objeto para array e adicionar ID
                const usersArray = Object.entries(users).map(([id, user]) => ({
                    id,
                    ...user
                }));
                
                // Ordenar por nome
                usersArray.sort((a, b) => a.name.localeCompare(b.name));
                
                // Guardar usuários filtrados
                filteredUsers = [...usersArray];
                totalUsers = usersArray.length;
                
                // Renderizar usuários
                renderUsers();
                
                // Atualizar paginação
                updatePagination();
            } else {
                // Nenhum usuário encontrado
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum usuário encontrado</td></tr>';
                updatePaginationInfo(0, 0, 0);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar usuários</td></tr>';
            }
            showNotification('error', 'Erro ao carregar usuários: ' + error.message);
        });
}

// Renderizar usuários na tabela
function renderUsers() {
    if (!tableBody) {
        console.error('Elemento tableBody não encontrado!');
        return;
    }
    
    if (filteredUsers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum usuário encontrado</td></tr>';
        updatePaginationInfo(0, 0, 0);
        return;
    }
    
    // Calcular índices de paginação
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, filteredUsers.length);
    
    // Obter usuários da página atual
    const usersPage = filteredUsers.slice(startIndex, endIndex);
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Renderizar cada usuário
    usersPage.forEach(user => {
        const row = document.createElement('tr');
        
        // Status badge
        const statusClass = getStatusClass(user.status);
        const statusBadge = `<span class="badge-status badge-${statusClass}">${formatStatus(user.status)}</span>`;
        
        // Criar linha da tabela
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.department || '-'}</td>
            <td>${translateRole(user.role)}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-edit" data-id="${user.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn action-btn-delete" data-id="${user.id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Adicionar à tabela
        tableBody.appendChild(row);
    });
    
    // Atualizar informações de paginação
    updatePaginationInfo(startIndex + 1, endIndex, filteredUsers.length);
    
    // Adicionar event listeners aos botões de ação
    setupActionButtons();
}

// Configurar botões de ação para edição e exclusão
function setupActionButtons() {
    // Botões de editar
    const editButtons = document.querySelectorAll('.action-btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            editUser(userId);
        });
    });
    
    // Botões de excluir
    const deleteButtons = document.querySelectorAll('.action-btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            confirmDelete(userId);
        });
    });
}

// Abrir modal para editar usuário
function editUser(userId) {
    const user = filteredUsers.find(u => u.id === userId);
    
    if (user && userModalTitle && userNameInput && userEmailInput && 
        userDepartmentInput && userRoleInput && userStatusInput && passwordGroup) {
        
        // Salvar usuário atual
        currentEditingUser = user;
        
        // Atualizar título do modal
        userModalTitle.textContent = 'Editar Usuário';
        
        // Preencher formulário
        userNameInput.value = user.name || '';
        userEmailInput.value = user.email || '';
        userDepartmentInput.value = user.department || '';
        userRoleInput.value = user.role || '';
        userStatusInput.value = user.status || 'active';
        
        // Ocultar campo de senha para edição
        passwordGroup.style.display = 'none';
        
        // Abrir modal
        openModal('user-modal');
    }
}

// Confirmar exclusão de usuário
function confirmDelete(userId) {
    const user = filteredUsers.find(u => u.id === userId);
    
    if (user && confirmModalMessage) {
        // Atualizar mensagem de confirmação
        confirmModalMessage.textContent = `Tem certeza que deseja excluir o usuário "${user.name}"?`;
        
        // Configurar botão de confirmação
        if (confirmActionBtn) {
            confirmActionBtn.onclick = () => {
                deleteUser(userId);
                closeModal('confirm-modal');
            };
        }
        
        // Abrir modal de confirmação
        openModal('confirm-modal');
    }
}

// Excluir usuário
function deleteUser(userId) {
    database.ref(`users/${userId}`).remove()
        .then(() => {
            showNotification('success', 'Usuário excluído com sucesso');
            loadUsers();
        })
        .catch(error => {
            console.error('Erro ao excluir usuário:', error);
            showNotification('error', 'Erro ao excluir usuário: ' + error.message);
        });
}

/**
 * Salvar usuário (criar ou atualizar)
 */
function saveUser() {
    // Validar formulário
    if (!validateUserForm()) {
        return;
    }
    
    // Coletar dados do formulário
    const userData = {
        name: userNameInput.value.trim(),
        email: userEmailInput.value.trim(),
        department: userDepartmentInput.value,
        role: userRoleInput.value,
        status: userStatusInput.value
    };
    
    // Se é uma edição
    if (currentEditingUser) {
        // Atualizar usuário existente
        database.ref(`users/${currentEditingUser.id}`).update(userData)
            .then(() => {
                // Se o email do usuário em edição é o mesmo do usuário logado,
                // atualizar o displayName
                const currentUser = firebase.auth().currentUser;
                if (currentUser && currentUser.email === userData.email) {
                    return currentUser.updateProfile({
                        displayName: userData.name
                    });
                }
                return Promise.resolve();
            })
            .then(() => {
                showNotification('success', 'Usuário atualizado com sucesso');
                closeModal('user-modal');
                loadUsers();
            })
            .catch(error => {
                console.error('Erro ao atualizar usuário:', error);
                showNotification('error', 'Erro ao atualizar usuário: ' + error.message);
            });
    } else {
        // Verificar se o e-mail já existe
        database.ref('users').orderByChild('email').equalTo(userData.email).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    showNotification('error', 'Este e-mail já está em uso');
                    return;
                }
                
                // Adicionar data de criação para novos usuários
                userData.created_at = new Date().toISOString();
                
                // Criar novo usuário
                const newUserRef = database.ref('users').push();
                
                // Também criar no Firebase Authentication
                firebase.auth().createUserWithEmailAndPassword(userData.email, userPasswordInput.value)
                    .then(userCredential => {
                        // Atualizar o displayName com o nome do usuário
                        return userCredential.user.updateProfile({
                            displayName: userData.name
                        }).then(() => {
                            // Salvar no Realtime Database
                            return newUserRef.set(userData);
                        });
                    })
                    .then(() => {
                        showNotification('success', 'Usuário criado com sucesso');
                        closeModal('user-modal');
                        loadUsers();
                    })
                    .catch(error => {
                        console.error('Erro ao criar usuário:', error);
                        showNotification('error', 'Erro ao criar usuário: ' + error.message);
                    });
            })
            .catch(error => {
                console.error('Erro ao verificar e-mail:', error);
                showNotification('error', 'Erro ao verificar e-mail: ' + error.message);
            });
    }
}

// Validar formulário de usuário
function validateUserForm() {
    // Validar nome
    if (!userNameInput || !userNameInput.value.trim()) {
        showNotification('error', 'O nome é obrigatório');
        if (userNameInput) userNameInput.focus();
        return false;
    }
    
    // Validar e-mail
    if (!userEmailInput || !userEmailInput.value.trim() || !isValidEmail(userEmailInput.value.trim())) {
        showNotification('error', 'E-mail inválido');
        if (userEmailInput) userEmailInput.focus();
        return false;
    }
    
    // Validar departamento
    if (!userDepartmentInput || !userDepartmentInput.value) {
        showNotification('error', 'Selecione um departamento');
        if (userDepartmentInput) userDepartmentInput.focus();
        return false;
    }
    
    // Validar função
    if (!userRoleInput || !userRoleInput.value) {
        showNotification('error', 'Selecione uma função');
        if (userRoleInput) userRoleInput.focus();
        return false;
    }
    
    // Validar senha para novos usuários
    if (!currentEditingUser && userPasswordInput) {
        if (!userPasswordInput.value || !isValidPassword(userPasswordInput.value)) {
            showNotification('error', 'A senha deve ter pelo menos 6 caracteres');
            userPasswordInput.focus();
            return false;
        }
    }
    
    return true;
}

// Resetar formulário
function resetForm() {
    if (!userForm) return;
    
    userForm.reset();
    currentEditingUser = null;
    
    if (userModalTitle) {
        userModalTitle.textContent = 'Adicionar Usuário';
    }
    
    if (passwordGroup) {
        passwordGroup.style.display = 'block';
    }
    
    // Resetar tipo de senha para password
    if (userPasswordInput && userPasswordInput.type !== 'password') {
        userPasswordInput.type = 'password';
        
        const icon = togglePasswordBtn?.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-eye';
        }
    }
}

// Aplicar filtros e busca
function applyFilters() {
    database.ref('users').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            
            if (users) {
                let usersArray = Object.entries(users).map(([id, user]) => ({
                    id,
                    ...user
                }));
                
                // Filtrar por termo de busca
                const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
                if (searchTerm) {
                    usersArray = usersArray.filter(user => {
                        return (
                            user.name.toLowerCase().includes(searchTerm) ||
                            user.email.toLowerCase().includes(searchTerm) ||
                            (user.department && user.department.toLowerCase().includes(searchTerm))
                        );
                    });
                }
                
                // Filtrar por departamento
                const department = filterDepartment ? filterDepartment.value : '';
                if (department) {
                    usersArray = usersArray.filter(user => user.department === department);
                }
                
                // Filtrar por função
                const role = filterRole ? filterRole.value : '';
                if (role) {
                    usersArray = usersArray.filter(user => user.role === role);
                }
                
                // Filtrar por status
                const status = filterStatus ? filterStatus.value : '';
                if (status) {
                    usersArray = usersArray.filter(user => user.status === status);
                }
                
                // Ordenar por nome
                usersArray.sort((a, b) => a.name.localeCompare(b.name));
                
                // Atualizar usuários filtrados
                filteredUsers = usersArray;
                
                // Voltar para a primeira página ao filtrar
                currentPage = 1;
                
                // Renderizar usuários
                renderUsers();
                
                // Atualizar paginação
                updatePagination();
            }
        })
        .catch(error => {
            console.error('Erro ao aplicar filtros:', error);
            showNotification('error', 'Erro ao aplicar filtros: ' + error.message);
        });
}

// Exportar usuários
function exportUsers(format) {
    if (filteredUsers.length === 0) {
        showNotification('warning', 'Não há usuários para exportar');
        return;
    }
    
    // Em uma aplicação real, isso faria a exportação para o formato selecionado
    // Aqui vamos apenas simular a exportação
    
    showNotification('info', `Exportando ${filteredUsers.length} usuários para formato ${format.toUpperCase()}...`);
    
    setTimeout(() => {
        showNotification('success', `Usuários exportados com sucesso para ${format.toUpperCase()}`);
    }, 1500);
}

// Atualizar informações de paginação
function updatePaginationInfo(start, end, total) {
    if (paginationStart) paginationStart.textContent = start;
    if (paginationEnd) paginationEnd.textContent = end;
    if (paginationTotal) paginationTotal.textContent = total;
}

// Atualizar controles de paginação
function updatePagination() {
    if (!paginationNumbers) return;
    
    // Limpar números de paginação
    paginationNumbers.innerHTML = '';
    
    // Calcular total de páginas
    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    
    // Adicionar números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageNumber = document.createElement('div');
        pageNumber.classList.add('page-number');
        
        if (i === currentPage) {
            pageNumber.classList.add('active');
        }
        
        pageNumber.textContent = i;
        pageNumber.addEventListener('click', () => {
            if (i !== currentPage) {
                currentPage = i;
                renderUsers();
                updatePagination();
            }
        });
        
        paginationNumbers.appendChild(pageNumber);
    }
    
    // Atualizar estado dos botões de navegação
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Adicionar event listeners aos botões de navegação
    if (prevPageBtn) {
        prevPageBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderUsers();
                updatePagination();
            }
        };
    }
    
    if (nextPageBtn) {
        nextPageBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderUsers();
                updatePagination();
            }
        };
    }
}

// Função para debounce (evitar múltiplas chamadas rápidas)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}