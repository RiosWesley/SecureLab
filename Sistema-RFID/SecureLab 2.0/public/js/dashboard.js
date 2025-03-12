// Função principal para carregar os dados do dashboard
function loadDashboardData() {
    // Obter nome do usuário atual
    const user = auth.currentUser;
    if (user) {
      database.ref('users').once('value')
        .then(snapshot => {
          const users = snapshot.val();
          // Procurar pelo usuário atual baseado no email
          const currentUser = Object.values(users).find(u => u.email === user.email);
          if (currentUser) {
            document.getElementById('current-user-name').textContent = currentUser.name;
          }
        })
        .catch(error => console.error('Erro ao carregar dados do usuário:', error));
    }
  
    // Carregar estatísticas de usuários
    loadUserStats();
    
    // Carregar status das portas
    loadDoorStats();
    
    // Carregar status dos dispositivos
    loadDeviceStats();
    
    // Carregar logs de acesso recentes
    loadRecentActivity();
    
    // Carregar alertas (se houver)
    loadAlerts();
  }
  
  // Função para carregar estatísticas de usuários
  function loadUserStats() {
    database.ref('users').once('value')
      .then(snapshot => {
        const users = snapshot.val();
        if (users) {
          const userCount = Object.keys(users).length;
          const activeUsers = Object.values(users).filter(user => user.status === 'active').length;
          
          // Atualizar contador de usuários ativos
          document.getElementById('active-users-count').textContent = activeUsers;
          document.getElementById('users-label').textContent = `de ${userCount} usuários`;
          
          // Simulação de tendência (em uma aplicação real, isso viria do banco de dados)
          document.getElementById('users-trend').textContent = '5%';
        }
      })
      .catch(error => console.error('Erro ao carregar estatísticas de usuários:', error));
  }
  
  // Função para carregar estatísticas das portas
  function loadDoorStats() {
    database.ref('doors').limitToLast(7).once('value')
      .then(snapshot => {
        const doors = snapshot.val();
        if (doors) {
          const doorCount = Object.keys(doors).length;
          document.getElementById('doors-count').textContent = doorCount;
          
          // Contar portas trancadas e destrancadas
          const lockedDoors = Object.values(doors).filter(door => door.status === 'locked').length;
          const unlockedDoors = doorCount - lockedDoors;
          
          document.getElementById('locked-doors-count').textContent = lockedDoors;
          document.getElementById('unlocked-doors-count').textContent = unlockedDoors;
          
          // Converter para array com IDs
          const doorsArray = Object.entries(doors).map(([id, door]) => ({
            id,
            ...door
          }));
          
          // Ordenar por nome em ordem alfabética
          doorsArray.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          
          // Converter de volta para objeto
          const orderedDoors = {};
          doorsArray.forEach(door => {
            orderedDoors[door.id] = door;
          });
          
          // Atualizar lista de portas
          updateDoorList(orderedDoors);
        }
      })
      .catch(error => console.error('Erro ao carregar estatísticas de portas:', error));
  }
  // Função para carregar estatísticas de dispositivos
  function loadDeviceStats() {
    database.ref('devices').once('value')
      .then(snapshot => {
        const devices = snapshot.val();
        if (devices) {
          const deviceCount = Object.keys(devices).length;
          const onlineDevices = Object.values(devices).filter(device => device.status === 'online').length;
          
          // Atualizar contador de dispositivos
          document.getElementById('devices-status').textContent = `${onlineDevices}/${deviceCount}`;
          
          // Calcular porcentagem de dispositivos online
          const onlinePercentage = Math.round((onlineDevices / deviceCount) * 100);
          document.getElementById('devices-progress').style.width = `${onlinePercentage}%`;
          document.getElementById('devices-percentage').textContent = `${onlinePercentage}% online`;
          
          // Atualizar estatísticas detalhadas de dispositivos
          document.getElementById('online-devices').textContent = `${onlineDevices}/${deviceCount}`;
          document.getElementById('offline-devices').textContent = deviceCount - onlineDevices;
          
          // Obter versão do firmware (assumindo que todos usam a mesma versão)
          if (Object.values(devices).length > 0) {
            document.getElementById('firmware-version').textContent = 
              Object.values(devices)[0].firmware_version || '-';
          }
          
          // Atualizar gráfico de rosca (donut chart)
          updateDeviceDonutChart(onlinePercentage);
        }
      })
      .catch(error => console.error('Erro ao carregar estatísticas de dispositivos:', error));
  }
  
  // Função para carregar logs de atividade recente
  function loadRecentActivity() {
    database.ref('access_logs').orderByChild('timestamp').limitToLast(7).once('value')
      .then(snapshot => {
        const logs = snapshot.val();
        const activityList = document.getElementById('activity-list');

        // Limpar lista atual
        activityList.innerHTML = '';

        if (logs) {
          // Converter para array e ordenar por timestamp (mais recente primeiro)
          const logsArray = Object.values(logs);
          logsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Contar acessos do dia
          const today = new Date().toISOString().split('T')[0];
          const todayLogs = logsArray.filter(log => log.timestamp.startsWith(today));
          const todayAccess = todayLogs.length;
          const todayDenied = todayLogs.filter(log => log.action === 'access_denied' || log.action === 'door_locked').length; // Conta door_locked como negado

          document.getElementById('today-access-count').textContent = todayAccess;
          document.getElementById('today-denied-count').textContent = `${todayDenied} acessos negados`;

          // Simulação de tendência (em uma aplicação real, isso viria do banco de dados)
          document.getElementById('access-trend').textContent = '8%';

          // Preencher lista de atividades recentes
          logsArray.forEach(log => {
            const li = document.createElement('li');
            const timestamp = new Date(log.timestamp);
            const timeFormatted = timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dateFormatted = timestamp.toLocaleDateString('pt-BR');

            let actionClass = '';
            let actionIcon = '';
            let actionText = ''; // Variável para armazenar o texto da ação

            // Usando switch para lidar com todas as ações
            switch (log.action) {
                case 'access_granted':
                    actionClass = 'success';
                    actionIcon = 'fas fa-check-circle';
                    actionText = 'acesso permitido';
                    break;
                case 'access_denied':
                    actionClass = 'danger';
                    actionIcon = 'fas fa-times-circle';
                    actionText = 'acesso negado';
                    break;
                case 'door_locked':
                    actionClass = 'warning'; // Ou outra classe CSS que você preferir
                    actionIcon = 'fas fa-lock'; // Ícone de cadeado
                    actionText = 'porta trancada';
                    break;
                case 'door_unlocked':
                    actionClass = 'info';  // Ou outra classe CSS
                    actionIcon = 'fas fa-lock-open'; // Ícone de cadeado aberto
                    actionText = 'porta destrancada';
                    break;
                default:
                    actionClass = 'secondary'; // Classe padrão
                    actionIcon = 'fas fa-question-circle'; // Ícone de interrogação
                    actionText = 'ação desconhecida';
            }


            li.innerHTML = `
              <div class="activity-icon ${actionClass}">
                <i class="${actionIcon}"></i>
              </div>
              <div class="activity-info">
                <div class="activity-title">
                  <span class="user-name">${log.user_name}</span> 
                  <span class="${actionClass}-text">${actionText}</span> 
                </div>
                <div class="activity-details">
                  ${log.door_name} - ${timeFormatted}, ${dateFormatted}
                </div>
                ${log.reason ? `<div class="activity-reason">Motivo: ${log.reason}</div>` : ''}
              </div>
            `;

            activityList.appendChild(li);
          });
        } else {
          activityList.innerHTML = '<li class="no-data">Nenhuma atividade recente</li>';
        }
      })
      .catch(error => console.error('Erro ao carregar logs de atividade:', error));
  }
  
  // Função para atualizar a lista de portas
  function updateDoorList(doors) {
    const doorList = document.getElementById('door-list');
    
    // Limpar lista atual
    doorList.innerHTML = '';
    
    if (doors) {
      // Converter para array
      const doorsArray = Object.entries(doors).map(([id, door]) => ({id, ...door}));
      
      // Preencher lista de portas
      doorsArray.forEach(door => {
        const li = document.createElement('li');
        const statusClass = door.status === 'locked' ? 'locked' : 'unlocked';
        const statusIcon = door.status === 'locked' ? 'fa-lock' : 'fa-lock-open';
        
        li.innerHTML = `
          <div class="door-info">
            <div class="door-name">${door.name}</div>
            <div class="door-location">${door.location}</div>
          </div>
          <div class="door-status ${statusClass}">
            <i class="fas ${statusIcon}"></i>
            <span>${door.status === 'locked' ? 'Trancada' : 'Destrancada'}</span>
          </div>
          <div class="door-action">
            <button class="btn btn-sm btn-${door.status === 'locked' ? 'success' : 'danger'}" data-door-id="${door.id}" data-action="${door.status === 'locked' ? 'unlock' : 'lock'}">
              ${door.status === 'locked' ? 'Destrancar' : 'Trancar'}
            </button>
          </div>
        `;
        
        doorList.appendChild(li);
      });
      
      // Adicionar event listeners aos botões
      setupDoorActionButtons();
    } else {
      doorList.innerHTML = '<li class="no-data">Nenhuma porta encontrada</li>';
    }
  }
  
  // Função para configurar botões de ação das portas
  function setupDoorActionButtons() {
    const buttons = document.querySelectorAll('[data-door-id]');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        const doorId = this.getAttribute('data-door-id');
        const action = this.getAttribute('data-action');
        
        toggleDoorLock(doorId, action);
      });
    });
  }
  
  // Função para alternar estado de tranca da porta
  // Função para alternar estado de tranca da porta com registro de logs
function toggleDoorLock(doorId, action) {
  const newStatus = action === 'lock' ? 'locked' : 'unlocked';
  
  // Primeiro obter o nome da porta para usar no log
  let doorName = '';
  database.ref(`doors/${doorId}`).once('value')
      .then(snapshot => {
          const door = snapshot.val();
          doorName = door ? door.name : 'Porta';
          
          // Atualizar status da porta
          return database.ref(`doors/${doorId}`).update({
              status: newStatus,
              last_status_change: new Date().toISOString()
          });
      })
      .then(() => {
          // Registrar log de acesso
          const user = firebase.auth().currentUser;
          if (user) {
              // Buscar o nome do usuário no banco de dados
              return database.ref('users').orderByChild('email').equalTo(user.email).once('value')
                  .then(snapshot => {
                      let userName = user.email; // Fallback para o email

                      // Se encontrou o usuário, usar o nome dele
                      if (snapshot.exists()) {
                          const userData = Object.values(snapshot.val())[0];
                          if (userData && userData.name) {
                              userName = userData.name;
                          }
                      }

                      const logData = {
                          user_id: user.uid,
                          user_name: userName,
                          door_id: doorId,
                          door_name: doorName,
                          action: action === 'lock' ? 'door_locked' : 'access_granted',
                          method: 'web',
                          timestamp: new Date().toISOString()
                      };

                      return database.ref('access_logs').push(logData);
                  });
          }
          return Promise.resolve();
      })
      .then(() => {
          console.log(`Porta ${doorId} ${action === 'lock' ? 'trancada' : 'destrancada'} com sucesso`);
          // Recarregar estatísticas de portas
          loadDoorStats();
          
          // Opcional: mostrar notificação como na página de portas
          showNotification(`Porta ${action === 'lock' ? 'trancada' : 'destrancada'} com sucesso`, 'success');
      })
      .catch(error => {
          console.error(`Erro ao ${action} porta:`, error);
          showNotification(`Erro ao controlar porta: ${error.message}`, 'error');
      });
}
  
  // Função para atualizar o gráfico de rosca (donut) de dispositivos
  function updateDeviceDonutChart(percentage) {
    // Calcular o ângulo com base na porcentagem
    const angle = 3.6 * percentage;
    
    // Atualizar gráfico de rosca
    const donutSegment = document.getElementById('device-donut-segment');
    const donutText = document.getElementById('device-percentage');
    
    // Aplicar clip-path baseado no ângulo
    donutSegment.style.clipPath = getDonutClipPath(angle);
    
    // Atualizar texto
    donutText.textContent = `${percentage}%`;
  }
  
  // Função para gerar clip-path baseado em ângulo para o gráfico de rosca
  function getDonutClipPath(angle) {
    // Garantir que o ângulo esteja entre 0 e 360
    angle = Math.min(360, Math.max(0, angle));
    
    if (angle <= 90) {
      // Primeiro quadrante
      return `polygon(50% 50%, 100% 50%, 100% ${50 - 50 * Math.tan(angle * Math.PI / 180)}%)`;
    } else if (angle <= 180) {
      // Segundo quadrante
      return `polygon(50% 50%, 100% 50%, 100% 0%, ${50 + 50 * Math.tan((angle - 90) * Math.PI / 180)}% 0%)`;
    } else if (angle <= 270) {
      // Terceiro quadrante
      return `polygon(50% 50%, 100% 50%, 100% 0%, 0% 0%, 0% ${50 - 50 * Math.tan((angle - 180) * Math.PI / 180)}%)`;
    } else {
      // Quarto quadrante
      return `polygon(50% 50%, 100% 50%, 100% 0%, 0% 0%, 0% 100%, ${50 - 50 * Math.tan((angle - 270) * Math.PI / 180)}% 100%)`;
    }
  }
  
  // Função para carregar alertas
  function loadAlerts() {
    // Este é um exemplo - em um sistema real, você teria uma coleção de alertas no Firebase
    // Por enquanto, vamos simular com base nos dispositivos offline
    database.ref('devices').once('value')
      .then(snapshot => {
        const devices = snapshot.val();
        const alertsList = document.getElementById('alerts-list');
        
        // Limpar lista atual
        alertsList.innerHTML = '';
        
        if (devices) {
          const offlineDevices = Object.entries(devices)
            .filter(([_, device]) => device.status === 'offline')
            .map(([id, device]) => ({id, ...device}));
          
          // Atualizar contador de alertas
          const alertCount = offlineDevices.length;
          document.getElementById('alerts-count').textContent = alertCount;
          document.getElementById('header-alerts-count').textContent = alertCount;
          document.getElementById('alert-count-badge').textContent = alertCount;
          
          if (alertCount > 0) {
            // Preencher lista de alertas
            offlineDevices.forEach(device => {
              const li = document.createElement('li');
              li.innerHTML = `
                <div class="alert-icon danger">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-info">
                  <div class="alert-title">Dispositivo Offline</div>
                  <div class="alert-details">
                    ${device.name} está offline desde ${formatDateTime(device.last_online)}
                  </div>
                </div>
                <div class="alert-action">
                  <button class="btn btn-sm btn-outline-primary" data-device-id="${device.id}">
                    Verificar
                  </button>
                </div>
              `;
              
              alertsList.appendChild(li);
            });
          } else {
            alertsList.innerHTML = '<li class="no-data">Nenhum alerta ativo</li>';
          }
        } else {
          alertsList.innerHTML = '<li class="no-data">Nenhum alerta ativo</li>';
        }
      })
      .catch(error => console.error('Erro ao carregar alertas:', error));
  }
  
  // Função auxiliar para formatar data e hora
  function formatDateTime(isoString) {
    if (!isoString) return 'Desconhecido';
    
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Event listeners para botões de atualização
  document.getElementById('refresh-activity')?.addEventListener('click', loadRecentActivity);
  document.getElementById('refresh-doors')?.addEventListener('click', loadDoorStats);
  
  // Carregar dados ao inicializar
  document.addEventListener('DOMContentLoaded', () => {
    // Esse código será executado quando a página carregar completamente
    // Se o usuário já estiver autenticado, loadDashboardData será chamado via onAuthStateChanged
    
    // Alternar menu lateral
    document.getElementById('sidebar-toggle')?.addEventListener('click', function() {
      document.querySelector('.app-container').classList.toggle('sidebar-collapsed');
    });
  });