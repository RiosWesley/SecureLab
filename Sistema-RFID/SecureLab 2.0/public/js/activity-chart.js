// Variável global para armazenar a instância do gráfico
let activityChartInstance = null;

/**
 * Função para inicializar e configurar o gráfico de atividade diária
 * Mostra acessos por sala em barras empilhadas por dia da semana
 */
function initActivityChart() {
    // Verifica se já está inicializado para evitar inicializações múltiplas
    if (window.activityChartInitialized) {
        console.log('Gráfico de atividade já inicializado');
        return;
    }

    // Marcar como inicializado
    window.activityChartInitialized = true;

    // Referência para o elemento onde o gráfico será renderizado
    const chartContainer = document.querySelector('.chart-placeholder');
    
    if (!chartContainer) {
        console.error('Container do gráfico não encontrado');
        return;
    }
    
    // Substituir o placeholder por um canvas para o gráfico
    chartContainer.innerHTML = '<canvas id="activityChart"></canvas>';
    
    // Carregar dados de atividade
    loadActivityData();
}

/**
 * Carrega e processa os dados de atividade do Firebase
 */
function loadActivityData() {
    // Obter referência para logs de acesso no Firebase
    const accessLogsRef = firebase.database().ref('access_logs');
    
    // Calcular a data de 7 dias atrás (para filtrar logs)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();
    
    // Buscar logs filtrados por data (últimos 7 dias)
    accessLogsRef.orderByChild('timestamp')
        .startAt(sevenDaysAgoStr)
        .once('value')
        .then(snapshot => {
            const accessLogs = snapshot.val() || {};
            
            // Processar dados agrupando por dia e por porta
            const processedData = processActivityData(accessLogs);
            
            // Criar o gráfico com os dados processados
            createActivityChart(processedData);
        })
        .catch(error => {
            console.error('Erro ao carregar logs de atividade:', error);
            // Mostrar mensagem de erro no lugar do gráfico
            const chartContainer = document.querySelector('.chart-placeholder');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="chart-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar dados do gráfico. Tente novamente mais tarde.</p>
                    </div>
                `;
            }
        });
}

/**
 * Processa os logs de acesso agrupando por dia e por porta
 * @param {Object} accessLogs - Logs de acesso do Firebase
 * @return {Object} Dados processados para o gráfico
 */
function processActivityData(accessLogs) {
    // Armazenar informações das portas para uso posterior
    const doorInfo = {};
    
    // Converter objeto de logs para array
    const logsArray = Object.values(accessLogs);
    
    // Definir os últimos 7 dias como labels
    const days = [];
    const labels = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Formatar a data como YYYY-MM-DD para agrupamento
        const dateKey = date.toISOString().split('T')[0];
        days.push(dateKey);
        
        // Formatar a data como DD/MM para exibição
        const dateLabel = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        labels.push(dateLabel);
    }
    
    // Armazenar contagens por porta e por dia
    const doorCounts = {};
    const doorIds = new Set();
    
    // Processar cada log
    logsArray.forEach(log => {
        // Verificar se é um acesso concedido (queremos apenas acessos bem-sucedidos)
        if (log.action === 'access_granted' || log.action === 'door_unlocked') {
            // Extrair data do timestamp (YYYY-MM-DD)
            const date = new Date(log.timestamp);
            const dateKey = date.toISOString().split('T')[0];
            
            // Verificar se o log está dentro do período de 7 dias
            if (days.includes(dateKey)) {
                // Registrar info da porta para uso posterior
                if (log.door_id && log.door_name) {
                    doorInfo[log.door_id] = {
                        name: log.door_name,
                        id: log.door_id
                    };
                }
                
                // Adicionar ID da porta ao conjunto de portas
                doorIds.add(log.door_id);
                
                // Inicializar contagem para esta porta se necessário
                if (!doorCounts[log.door_id]) {
                    doorCounts[log.door_id] = {};
                    days.forEach(day => {
                        doorCounts[log.door_id][day] = 0;
                    });
                }
                
                // Incrementar contagem para esta porta e dia
                doorCounts[log.door_id][dateKey]++;
            }
        }
    });
    
    // Se não encontramos informações de porta nos logs, buscar no Firebase
    if (Object.keys(doorInfo).length === 0) {
        return {
            labels,
            days,
            doorCounts,
            doorInfo, 
            doorIds: Array.from(doorIds)
        };
    }
    
    // Retornar dados processados
    return {
        labels,
        days,
        doorCounts,
        doorInfo,
        doorIds: Array.from(doorIds)
    };
}

/**
 * Determina as cores e opções do gráfico com base no tema atual
 * @return {Object} Objeto com cores e opções de tema
 */
function getChartThemeOptions() {
    // Verificar se o tema atual é escuro
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    
    // Definir cores base
    return {
        backgroundColor: isDarkMode ? '#252931' : '#fff',
        textColor: isDarkMode ? '#e4e6eb' : '#333',
        gridColor: isDarkMode ? '#3d434e' : '#ddd',
        borderColor: isDarkMode ? '#3d434e' : '#ddd'
    };
}

/**
 * Cria ou atualiza o gráfico com os dados processados
 * @param {Object} data - Dados processados para o gráfico
 */
function createActivityChart(data) {
    // Referência para o canvas do gráfico
    const chartCanvas = document.getElementById('activityChart');
    
    if (!chartCanvas) {
        console.error('Canvas do gráfico não encontrado');
        return;
    }
    
    // Verificar se temos portas para mostrar
    if (data.doorIds.length === 0) {
        // Sem dados, mostrar mensagem
        const chartContainer = document.querySelector('.chart-placeholder');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>Não há dados de atividade para exibir.</p>
                </div>
            `;
        }
        return;
    }
    
    // Destruir o gráfico existente se houver um
    if (activityChartInstance) {
        activityChartInstance.destroy();
        activityChartInstance = null;
    }
    
    // Se o canvas foi destruído ao destruir o gráfico, recriá-lo
    if (!document.getElementById('activityChart')) {
        const chartContainer = document.querySelector('.chart-placeholder');
        if (chartContainer) {
            chartContainer.innerHTML = '<canvas id="activityChart"></canvas>';
            chartCanvas = document.getElementById('activityChart');
        }
    }
    
    // Gerar cores para cada porta
    const doorColors = generateDoorColors(data.doorIds.length);
    
    // Preparar datasets para o gráfico (um para cada porta)
    const datasets = data.doorIds.map((doorId, index) => {
        // Dados para esta porta por dia
        const doorData = data.days.map(day => {
            return data.doorCounts[doorId] ? (data.doorCounts[doorId][day] || 0) : 0;
        });
        
        // Nome da porta ou ID se não tivermos o nome
        const doorName = data.doorInfo[doorId] ? 
            data.doorInfo[doorId].name : 
            `Porta ${doorId.substring(0, 4)}...`;
        
        return {
            label: doorName,
            data: doorData,
            backgroundColor: doorColors[index],
            borderColor: adjustColorBrightness(doorColors[index], -20),
            borderWidth: 1
        };
    });
    
    // Configuração do gráfico
    const chartConfig = {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Dia ${context[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} acessos`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Dia'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Número de acessos'
                    },
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    };
    
    try {
        // Criar o gráfico Chart.js e armazenar a instância
        activityChartInstance = new Chart(chartCanvas, chartConfig);
    } catch (error) {
        console.error('Erro ao criar o gráfico:', error);
        // Tentar recuperar de erros
        const chartContainer = document.querySelector('.chart-placeholder');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="chart-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao renderizar o gráfico: ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Gera um array de cores para as portas
 * @param {number} count - Número de cores a gerar
 * @return {Array} Array de cores em formato hex
 */
function generateDoorColors(count) {
    // Paleta de cores predefinida para até 10 portas
    const predefinedColors = [
        '#4a6cf7', // Azul (cor primária do tema)
        '#2ecc71', // Verde
        '#e74c3c', // Vermelho
        '#f39c12', // Laranja
        '#9b59b6', // Roxo
        '#1abc9c', // Verde água
        '#34495e', // Azul escuro
        '#d35400', // Laranja escuro
        '#27ae60', // Verde escuro
        '#8e44ad'  // Roxo escuro
    ];
    
    // Se temos menos de 10 portas, usar as cores predefinidas
    if (count <= predefinedColors.length) {
        return predefinedColors.slice(0, count);
    }
    
    // Caso contrário, gerar cores programaticamente
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Gerar uma cor HSL com boa distribuição de matiz
        const hue = (i * (360 / count)) % 360;
        const color = hslToHex(hue, 65, 65);
        colors.push(color);
    }
    
    return colors;
}

/**
 * Converte uma cor HSL para formato hexadecimal
 * @param {number} h - Matiz (0-360)
 * @param {number} s - Saturação (0-100)
 * @param {number} l - Luminosidade (0-100)
 * @return {string} Cor em formato hexadecimal
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c/2;
    
    let r, g, b;
    
    if (0 <= h && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (60 <= h && h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (120 <= h && h < 180) {
        [r, g, b] = [0, c, x];
    } else if (180 <= h && h < 240) {
        [r, g, b] = [0, x, c];
    } else if (240 <= h && h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }
    
    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
}

/**
 * Ajusta o brilho de uma cor hexadecimal
 * @param {string} hexColor - Cor em formato hexadecimal
 * @param {number} percent - Porcentagem de ajuste (-100 a 100)
 * @return {string} Cor ajustada em formato hexadecimal
 */
function adjustColorBrightness(hexColor, percent) {
    // Converter hex para RGB
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);
    
    // Ajustar brilho
    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));
    
    // Converter de volta para hex
    r = Math.round(r).toString(16).padStart(2, '0');
    g = Math.round(g).toString(16).padStart(2, '0');
    b = Math.round(b).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
}

// Adicionar esta inicialização à função loadDashboardData existente
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o gráfico quando o DOM estiver carregado e pronto
    // Verificar se estamos na página do dashboard verificando elementos específicos
    const isDashboardPage = document.querySelector('.chart-placeholder') !== null;
    
    if (isDashboardPage) {
        // Adicionar script Chart.js dinamicamente se não estiver presente
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = initActivityChart;
            document.head.appendChild(script);
        } else {
            initActivityChart();
        }
    }
});