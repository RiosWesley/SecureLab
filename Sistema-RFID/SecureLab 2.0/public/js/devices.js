/**
 * devices.js - Funcionalidades para a página de gerenciamento de dispositivos do SecureLab
 */

// Variáveis globais
let devices = [];
let currentDeviceId = null;
const PAGE_SIZE = 10;
let currentPage = 1;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    initModals();
    setupEventListeners();
    
    // Carregar dados mockados para visualização
    mockDevicesData();
});

/**
 * Inicializa os modais da página
 */
function initModals() {
    setupModal('deviceModal', 'addDeviceBtn', 'close-device-modal', 'cancelDeviceBtn');
    setupModal('configModal', null, 'close-config-modal', 'closeConfigBtn');
    setupModal('confirm-modal', null, 'close-confirm-modal', 'cancel-confirm-btn');
}

/**
 * Configura os event listeners da página
 */
function setupEventListeners() {
    // Botão de adicionar dispositivo
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', function() {
            openDeviceModal();
        });
    }
    
    // Botão de salvar dispositivo
    const saveDeviceBtn = document.getElementById('saveDeviceBtn');
    if (saveDeviceBtn) {
        saveDeviceBtn.addEventListener('click', function() {
            saveDevice();
        });
    }
    
    // Botão de salvar configurações
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', function() {
            saveDeviceConfig();
        });
    }
    
    // Botões de filtro
    const filterInputs = document.querySelectorAll('#filter-status, #filter-type, #filter-firmware');
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    // Botão de resetar filtros
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters();
        });
    }
    
    // Campo de busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            applyFilters();
        }, 300));
    }
    
    // Botão de reiniciar dispositivo no modal de configuração
    const restartDeviceBtn = document.getElementById('restart-device');
    if (restartDeviceBtn) {
        restartDeviceBtn.addEventListener('click', function() {
            confirmAction('Reiniciar Dispositivo', 'Tem certeza que deseja reiniciar este dispositivo? Esta ação pode levar até 1 minuto para ser concluída.', function() {
                showNotification('Dispositivo reiniciado com sucesso', 'success');
                closeModal('confirm-modal');
            });
        });
    }
    
    // Botão de reset de fábrica no modal de configuração
    const factoryResetBtn = document.getElementById('factory-reset');
    if (factoryResetBtn) {
        factoryResetBtn.addEventListener('click', function() {
            confirmAction('Restaurar Configurações de Fábrica', 'ATENÇÃO: Esta ação irá restaurar todas as configurações para os valores padrão de fábrica. Todos os dados personalizados serão perdidos. Deseja continuar?', function() {
                showNotification('Configurações de fábrica restauradas com sucesso', 'success');
                closeModal('confirm-modal');
                closeModal('configModal');
            }, 'Restaurar');
        });
    }
    
    // Botão de verificar atualizações no modal de configuração
    const checkFirmwareBtn = document.getElementById('check-firmware-updates');
    if (checkFirmwareBtn) {
        checkFirmwareBtn.addEventListener('click', function() {
            // Simular verificação de atualização
            showNotification('Verificando atualizações de firmware...', 'info');
            
            setTimeout(function() {
                showNotification('Dispositivo já está com a versão mais recente (v2.3.1)', 'success');
            }, 2000);
        });
    }
    
    // Botão de download de logs no modal de configuração
    const downloadLogsBtn = document.getElementById('download-logs');
    if (downloadLogsBtn) {
        downloadLogsBtn.addEventListener('click', function() {
            showNotification('Baixando logs de diagnóstico...', 'info');
            
            setTimeout(function() {
                showNotification('Logs de diagnóstico baixados com sucesso', 'success');
            }, 1500);
        });
    }
    
    // Alternador de modo de IP (DHCP/Estático)
    const ipConfigRadios = document.querySelectorAll('input[name="ip-config"]');
    ipConfigRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const staticIpSettings = document.getElementById('static-ip-settings');
            if (radio.value === 'static') {
                staticIpSettings.style.display = 'block';
            } else {
                staticIpSettings.style.display = 'none';
            }
        });
    });
    
    // Botão de copiar token API
    const copyApiTokenBtn = document.getElementById('copy-api-token');
    if (copyApiTokenBtn) {
        copyApiTokenBtn.addEventListener('click', function() {
            const apiToken = document.getElementById('api-token');
            if (apiToken) {
                navigator.clipboard.writeText(apiToken.value)
                    .then(() => {
                        showNotification('Token API copiado para a área de transferência', 'success');
                    })
                    .catch(err => {
                        showNotification('Erro ao copiar token API', 'error');
                    });
            }
        });
    }
    
    // Botão de regenerar token API
    const regenerateApiTokenBtn = document.getElementById('regenerate-api-token');
    if (regenerateApiTokenBtn) {
        regenerateApiTokenBtn.addEventListener('click', function() {
            confirmAction('Regenerar Token API', 'Esta ação irá invalidar o token atual e gerar um novo. Qualquer sistema que use o token atual precisará ser atualizado. Deseja continuar?', function() {
                // Gerar um novo token pseudo-aleatório
                const newToken = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                document.getElementById('api-token').value = newToken;
                showNotification('Token API regenerado com sucesso', 'success');
                closeModal('confirm-modal');
            });
        });
    }
    
    // Toggle de senha Wi-Fi
    const toggleWifiPasswordBtn = document.getElementById('toggle-wifi-password');
    if (toggleWifiPasswordBtn) {
        toggleWifiPasswordBtn.addEventListener('click', function() {
            const passwordField = document.getElementById('wifi-password');
            if (passwordField) {
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    toggleWifiPasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordField.type = 'password';
                    toggleWifiPasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
        });
    }
    
    // Configuração de navegação por abas no modal de configuração
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões e painéis
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            this.classList.add('active');
            
            // Ativar o painel correspondente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Navegação de paginação
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderDevices();
                updatePagination();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(devices.length / PAGE_SIZE);
            if (currentPage < totalPages) {
                currentPage++;
                renderDevices();
                updatePagination();
            }
        });
    }
    
    // Configurar ações de dispositivos na tabela após renderização
    setupDeviceActions();
}

/**
 * Configura as ações dos dispositivos na tabela
 */
function setupDeviceActions() {
    // Botões de editar
    document.querySelectorAll('.action-btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const deviceName = row.cells[0].textContent;
            openDeviceModal(findDeviceByName(deviceName));
        });
    });
    
    // Botões de reiniciar
    document.querySelectorAll('.action-btn[title="Reiniciar"]').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const deviceName = row.cells[0].textContent;
            confirmAction('Reiniciar Dispositivo', `Tem certeza que deseja reiniciar o dispositivo "${deviceName}"?`, function() {
                showNotification(`Dispositivo "${deviceName}" reiniciado com sucesso`, 'success');
                closeModal('confirm-modal');
            });
        });
    });
    
    // Botões de diagnóstico
    document.querySelectorAll('.action-btn[title="Diagnóstico"]').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const deviceName = row.cells[0].textContent;
            showNotification(`Executando diagnóstico em "${deviceName}"...`, 'info');
            
            setTimeout(function() {
                showNotification(`Diagnóstico de "${deviceName}" concluído. Problemas encontrados: Conectividade Wi-Fi instável.`, 'warning');
            }, 2000);
        });
    });
    
    // Botões de configurar
    document.querySelectorAll('.action-btn[title="Configurar"]').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const deviceName = row.cells[0].textContent;
            openConfigModal(findDeviceByName(deviceName));
        });
    });
}

/**
 * Simula a carga de dados de dispositivos para visualização
 */
function mockDevicesData() {
    // Dados de exemplo
    devices = [
        {
            id: '1',
            name: 'Leitor RFID #01',
            type: 'Leitor RFID',
            typeCode: 'rfid-reader',
            location: 'Entrada Principal',
            status: 'online',
            firmware: 'v2.3.1',
            ip: '192.168.1.101',
            mac: '00:1A:2B:3C:4D:5E',
            lastActivity: '2025-03-13T09:32:15',
            batteryLevel: 85,
            signalStrength: 92
        },
        {
            id: '2',
            name: 'Leitor RFID #02',
            type: 'Leitor RFID',
            typeCode: 'rfid-reader',
            location: 'Laboratório A',
            status: 'online',
            firmware: 'v2.3.1',
            ip: '192.168.1.102',
            mac: '00:1A:2B:3C:4D:5F',
            lastActivity: '2025-03-13T09:45:22',
            batteryLevel: 92,
            signalStrength: 88
        },
        {
            id: '3',
            name: 'Leitor RFID #03',
            type: 'Leitor RFID',
            typeCode: 'rfid-reader',
            location: 'Sala de Servidores',
            status: 'warning',
            statusMessage: 'Bateria Baixa',
            firmware: 'v2.3.1',
            ip: '192.168.1.103',
            mac: '00:1A:2B:3C:4D:60',
            lastActivity: '2025-03-13T08:57:09',
            batteryLevel: 15,
            signalStrength: 76
        },
        {
            id: '4',
            name: 'Controlador #01',
            type: 'Controlador',
            typeCode: 'controller',
            location: 'Corredor Principal',
            status: 'online',
            firmware: 'v2.3.1',
            ip: '192.168.1.104',
            mac: '00:1A:2B:3C:4D:61',
            lastActivity: '2025-03-13T09:50:03',
            batteryLevel: null, // Sem bateria, conexão via cabo
            signalStrength: 100
        },
        {
            id: '5',
            name: 'Gateway IoT #01',
            type: 'Gateway IoT',
            typeCode: 'gateway',
            location: 'Sala Técnica',
            status: 'online',
            firmware: 'v2.3.1',
            ip: '192.168.1.105',
            mac: '00:1A:2B:3C:4D:62',
            lastActivity: '2025-03-13T09:55:47',
            batteryLevel: null, // Sem bateria, conexão via cabo
            signalStrength: 100
        },
        {
            id: '6',
            name: 'Controlador #02',
            type: 'Controlador',
            typeCode: 'controller',
            location: 'Área Restrita',
            status: 'online',
            firmware: 'v2.3.1',
            ip: '192.168.1.106',
            mac: '00:1A:2B:3C:4D:63',
            lastActivity: '2025-03-13T09:22:31',
            batteryLevel: null, // Sem bateria, conexão via cabo
            signalStrength: 95
        },
        {
            id: '7',
            name: 'Leitor RFID #04',
            type: 'Leitor RFID',
            typeCode: 'rfid-reader',
            location: 'Entrada Secundária',
            status: 'online',
            firmware: 'v2.2.5',
            ip: '192.168.1.107',
            mac: '00:1A:2B:3C:4D:64',
            lastActivity: '2025-03-13T09:40:12',
            batteryLevel: 78,
            signalStrength: 82,
            needsUpdate: true
        },
        {
            id: '8',
            name: 'Leitor RFID #05',
            type: 'Leitor RFID',
            typeCode: 'rfid-reader',
            location: 'Laboratório B',
            status: 'offline',
            firmware: 'v2.2.5',
            ip: '192.168.1.108',
            mac: '00:1A:2B:3C:4D:65',
            lastActivity: '2025-03-12T16:22:05',
            batteryLevel: 65,
            signalStrength: 0,
            needsUpdate: true
        }
    ];
    
    // Renderizar dispositivos na tabela
    renderDevices();
    
    // Atualizar paginação
    updatePagination();
    
    // Atualizar estatísticas
    updateDeviceStats();
}

/**
 * Renderiza os dispositivos na tabela com base nos filtros aplicados
 */
function renderDevices() {
    const tableBody = document.getElementById('devices-table-body');
    if (!tableBody) return;
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Aplicar paginação
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, devices.length);
    const displayDevices = devices.slice(startIndex, endIndex);
    
    // Verificar se há dispositivos para exibir
    if (displayDevices.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = 'Nenhum dispositivo encontrado.';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    // Renderizar cada dispositivo
    displayDevices.forEach(device => {
        const row = document.createElement('tr');
        
        // Nome
        const nameCell = document.createElement('td');
        nameCell.textContent = device.name;
        row.appendChild(nameCell);
        
        // Tipo
        const typeCell = document.createElement('td');
        typeCell.textContent = device.type;
        row.appendChild(typeCell);
        
        // Localização
        const locationCell = document.createElement('td');
        locationCell.textContent = device.location;
        row.appendChild(locationCell);
        
        // Status
        const statusCell = document.createElement('td');
        let statusClass = '';
        let statusText = '';
        
        switch (device.status) {
            case 'online':
                statusClass = 'badge-success';
                statusText = 'Online';
                break;
            case 'offline':
                statusClass = 'badge-danger';
                statusText = 'Offline';
                break;
            case 'warning':
                statusClass = 'badge-warning';
                statusText = device.statusMessage || 'Alerta';
                break;
            default:
                statusClass = 'badge-secondary';
                statusText = device.status || 'Desconhecido';
        }
        
        statusCell.innerHTML = `<span class="badge-status ${statusClass}">${statusText}</span>`;
        row.appendChild(statusCell);
        
        // Firmware
        const firmwareCell = document.createElement('td');
        let firmwareText = device.firmware;
        
        if (device.needsUpdate) {
            firmwareText += ' <i class="fas fa-exclamation-triangle text-warning" title="Atualização disponível"></i>';
        }
        
        firmwareCell.innerHTML = firmwareText;
        row.appendChild(firmwareCell);
        
        // Última Atividade
        const lastActivityCell = document.createElement('td');
        const lastActivity = new Date(device.lastActivity);
        lastActivityCell.textContent = formatDate(lastActivity);
        row.appendChild(lastActivityCell);
        
        // Ações
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="action-buttons">
                <button class="action-btn action-btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${device.status === 'offline' ? 
                    `<button class="action-btn" title="Diagnóstico">
                        <i class="fas fa-stethoscope"></i>
                    </button>` : 
                    `<button class="action-btn" title="Reiniciar">
                        <i class="fas fa-redo-alt"></i>
                    </button>`
                }
                <button class="action-btn" title="Configurar">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        `;
        row.appendChild(actionsCell);
        
        // Adicionar linha à tabela
        tableBody.appendChild(row);
    });
    
    // Atualizar ações após renderização
    setupDeviceActions();
}

/**
 * Atualiza as informações de paginação
 */
function updatePagination() {
    // Atualizar informações de paginação
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(startIndex + PAGE_SIZE - 1, devices.length);
    
    document.getElementById('pagination-start').textContent = devices.length > 0 ? startIndex : 0;
    document.getElementById('pagination-end').textContent = endIndex;
    document.getElementById('pagination-total').textContent = devices.length;
    
    // Atualizar estado dos botões de navegação
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const paginationNumbers = document.getElementById('pagination-numbers');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }
    
    const totalPages = Math.ceil(devices.length / PAGE_SIZE);
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Atualizar números de página
    if (paginationNumbers) {
        paginationNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.className = 'page-number';
            
            if (i === currentPage) {
                pageNumber.classList.add('active');
            }
            
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    renderDevices();
                    updatePagination();
                }
            });
            
            paginationNumbers.appendChild(pageNumber);
        }
    }
}

/**
 * Atualiza as estatísticas de dispositivos
 */
function updateDeviceStats() {
    // Contar dispositivos online
    const onlineCount = devices.filter(device => device.status === 'online' || device.status === 'warning').length;
    const totalCount = devices.length;
    
    // Atualizar contadores
    document.getElementById('online-devices-count').textContent = onlineCount;
    
    // Contar dispositivos que precisam de atualização
    const outdatedCount = devices.filter(device => device.needsUpdate).length;
    document.getElementById('outdated-devices-count').textContent = outdatedCount;
    
    // Contar dispositivos com bateria baixa
    const lowBatteryCount = devices.filter(device => device.batteryLevel !== null && device.batteryLevel < 20).length;
    document.getElementById('low-battery-count').textContent = lowBatteryCount;
}

/**
 * Abre o modal para adicionar ou editar um dispositivo
 * @param {Object} device - O dispositivo a ser editado (null para novo dispositivo)
 */
function openDeviceModal(device = null) {
    // Obter referências para elementos do formulário
    const modalTitle = document.getElementById('modalTitle');
    const deviceName = document.getElementById('deviceName');
    const deviceType = document.getElementById('deviceType');
    const deviceLocation = document.getElementById('deviceLocation');
    const deviceIP = document.getElementById('deviceIP');
    const deviceMAC = document.getElementById('deviceMAC');
    const deviceFirmware = document.getElementById('deviceFirmware');
    
    // Definir se estamos adicionando ou editando
    if (device) {
        // Modo de edição
        modalTitle.textContent = 'Editar Dispositivo';
        currentDeviceId = device.id;
        
        // Preencher formulário com dados do dispositivo
        deviceName.value = device.name;
        deviceType.value = device.typeCode;
        deviceLocation.value = device.location;
        deviceIP.value = device.ip;
        deviceMAC.value = device.mac;
        deviceFirmware.value = device.firmware;
    } else {
        // Modo de adição
        modalTitle.textContent = 'Adicionar Novo Dispositivo';
        currentDeviceId = null;
        
        // Limpar formulário
        document.getElementById('deviceForm').reset();
    }
    
    // Abrir modal
    openModal('deviceModal');
}

/**
 * Abre o modal de configuração de dispositivo
 * @param {Object} device - O dispositivo a ser configurado
 */
function openConfigModal(device) {
    if (!device) return;
    
    // Armazenar ID do dispositivo atual
    currentDeviceId = device.id;
    
    // Atualizar título do modal
    document.getElementById('configModalTitle').textContent = `Configurar ${device.name}`;
    
    // Preencher campos com dados do dispositivo
    document.getElementById('config-device-name').value = device.name;
    document.getElementById('config-device-location').value = device.location;
    
    // Preencher outros campos conforme necessário
    
    // Definir aba ativa
    document.querySelector('.tab-btn[data-tab="general-tab"]').click();
    
    // Abrir modal
    openModal('configModal');
}

/**
 * Salva um dispositivo (adição ou edição)
 */
function saveDevice() {
    // Obter valores do formulário
    const deviceName = document.getElementById('deviceName').value.trim();
    const deviceType = document.getElementById('deviceType').value;
    const deviceLocation = document.getElementById('deviceLocation').value.trim();
    const deviceIP = document.getElementById('deviceIP').value.trim();
    const deviceMAC = document.getElementById('deviceMAC').value.trim();
    const deviceFirmware = document.getElementById('deviceFirmware').value;
    
    // Validação básica
    if (!deviceName) {
        showNotification('O nome do dispositivo é obrigatório', 'error');
        return;
    }
    
    if (!deviceType) {
        showNotification('O tipo do dispositivo é obrigatório', 'error');
        return;
    }
    
    if (!deviceLocation) {
        showNotification('A localização do dispositivo é obrigatória', 'error');
        return;
    }
    
    // Criar objeto do dispositivo
    const device = {
        name: deviceName,
        typeCode: deviceType,
        type: getDeviceTypeName(deviceType),
        location: deviceLocation,
        ip: deviceIP,
        mac: deviceMAC,
        firmware: deviceFirmware,
        status: 'online',
        lastActivity: new Date().toISOString(),
        batteryLevel: deviceType === 'rfid-reader' ? 100 : null,
        signalStrength: 100,
        needsUpdate: false
    };
    
    if (currentDeviceId) {
        // Modo de edição - atualizar dispositivo existente
        const index = devices.findIndex(d => d.id === currentDeviceId);
        if (index !== -1) {
            // Preservar alguns campos
            device.id = currentDeviceId;
            device.status = devices[index].status;
            device.batteryLevel = devices[index].batteryLevel;
            device.signalStrength = devices[index].signalStrength;
            device.lastActivity = devices[index].lastActivity;
            device.needsUpdate = devices[index].needsUpdate;
            
            // Atualizar dispositivo
            devices[index] = device;
            showNotification('Dispositivo atualizado com sucesso', 'success');
        }
    } else {
        // Modo de adição - adicionar novo dispositivo
        device.id = generateUUID();
        devices.push(device);
        showNotification('Dispositivo adicionado com sucesso', 'success');
    }
    
    // Fechar modal
    closeModal('deviceModal');
    
    // Reexibir dispositivos e atualizar estatísticas
    renderDevices();
    updatePagination();
    updateDeviceStats();
}

/**
 * Salva as configurações de um dispositivo
 */
function saveDeviceConfig() {
    // Em uma aplicação real, aqui salvaríamos as configurações no servidor
    
    // Para demonstração, apenas exibir mensagem de sucesso
    showNotification('Configurações salvas com sucesso', 'success');
    
    // Fechar modal
    closeModal('configModal');
}

/**
 * Aplica filtros aos dispositivos
 */
function applyFilters() {
    // Obter valores dos filtros
    const statusFilter = document.getElementById('filter-status').value;
    const typeFilter = document.getElementById('filter-type').value;
    const firmwareFilter = document.getElementById('filter-firmware').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    // Recarregar dados mockados (substitua por chamada de API real)
    mockDevicesData();
    
    // Aplicar filtros se especificados
    if (statusFilter || typeFilter || firmwareFilter || searchText) {
        devices = devices.filter(device => {
            // Filtro de status
            if (statusFilter && device.status !== statusFilter) {
                return false;
            }
            
            // Filtro de tipo
            if (typeFilter && device.typeCode !== typeFilter) {
                return false;
            }
            
            // Filtro de firmware
            if (firmwareFilter) {
                if (firmwareFilter === 'outdated') {
                    if (!device.needsUpdate) {
                        return false;
                    }
                } else if (device.firmware !== firmwareFilter) {
                    return false;
                }
            }
            
            // Filtro de texto de pesquisa
            if (searchText && 
                !device.name.toLowerCase().includes(searchText) && 
                !device.location.toLowerCase().includes(searchText) && 
                !device.type.toLowerCase().includes(searchText)) {
                return false;
            }
            
            return true;
        });
    }
    
    // Resetar para a primeira página
    currentPage = 1;
    
    // Atualizar exibição
    renderDevices();
    updatePagination();
}

/**
 * Reseta todos os filtros
 */
function resetFilters() {
    // Limpar campos de filtro
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-firmware').value = '';
    document.getElementById('searchInput').value = '';
    
    // Recarregar e renderizar todos os dispositivos
    mockDevicesData();
}

/**
 * Abre um modal de confirmação para uma ação
 * @param {string} title - Título do modal de confirmação
 * @param {string} message - Mensagem de confirmação
 * @param {Function} onConfirm - Função a ser executada se o usuário confirmar
 * @param {string} confirmButtonText - Texto do botão de confirmação (opcional)
 */
function confirmAction(title, message, onConfirm, confirmButtonText = 'Confirmar') {
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    
    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalMessage) confirmModalMessage.textContent = message;
    
    if (confirmActionBtn) {
        confirmActionBtn.textContent = confirmButtonText;
        confirmActionBtn.onclick = onConfirm;
    }
    
    openModal('confirm-modal');
}

/**
 * Abre um modal pelo ID
 * @param {string} modalId - ID do modal a ser aberto
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Fecha um modal pelo ID
 * @param {string} modalId - ID do modal a ser fechado
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Exibe uma notificação na tela
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Verificar se existe a função global
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Implementação local caso a função global não esteja disponível
    console.log(`Notificação (${type}): ${message}`);
    
    // Obter ou criar o container de notificações
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Ícone com base no tipo
    let icon = '';
    switch (type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-times-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        case 'info': icon = '<i class="fas fa-info-circle"></i>'; break;
    }
    
    // Conteúdo da notificação
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao container
    container.appendChild(notification);
    
    // Mostrar notificação com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar evento para fechar notificação
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-fechar após o tempo definido
    const timeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Formata uma data para exibição
 * @param {Date} date - A data a ser formatada
 * @returns {string} A data formatada
 */
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        try {
            date = new Date(date);
        } catch(e) {
            return 'Data inválida';
        }
    }

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Função utilitária para debounce (evitar múltiplas chamadas)
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Gera um UUID simples
 * @returns {string} UUID gerado
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Obtém o nome do tipo de dispositivo com base no código
 * @param {string} typeCode - Código do tipo de dispositivo
 * @returns {string} Nome do tipo de dispositivo
 */
function getDeviceTypeName(typeCode) {
    switch (typeCode) {
        case 'rfid-reader': return 'Leitor RFID';
        case 'controller': return 'Controlador';
        case 'gateway': return 'Gateway IoT';
        default: return 'Desconhecido';
    }
}

/**
 * Encontra um dispositivo pelo nome
 * @param {string} name - Nome do dispositivo
 * @returns {Object} Dispositivo encontrado ou null
 */
function findDeviceByName(name) {
    return devices.find(device => device.name === name) || null;
}

/**
 * Adiciona estilos CSS para tabs no modal de configuração
 */
function setupTabStyles() {
    // Verificar se os estilos já foram adicionados
    if (document.getElementById('tab-styles')) return;
    
    // Criar elemento de estilo
    const style = document.createElement('style');
    style.id = 'tab-styles';
    style.textContent = `
        .settings-tabs {
            margin-bottom: 20px;
        }

        .tab-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }

        .tab-btn {
            background-color: white;
            border: 1px solid #dee2e6;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .tab-btn.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .tab-pane {
            display: none;
        }

        .tab-pane.active {
            display: block;
        }

        /* Ajustes para modo escuro */
        html.dark-mode .tab-btn {
            background-color: var(--dark-card-bg);
            border-color: var(--dark-border-color);
            color: var(--dark-text-primary);
        }

        html.dark-mode .tab-btn.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
    `;
    
    // Adicionar ao head
    document.head.appendChild(style);
}

// Inicializar estilos para tabs
document.addEventListener('DOMContentLoaded', setupTabStyles);