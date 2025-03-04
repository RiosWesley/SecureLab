/**
 * mqttService.js
 * Serviço para gerenciar a comunicação MQTT entre o backend e os dispositivos ESP32/RFID
 */

const mqtt = require('mqtt');
const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const accessController = require('../controllers/accessController');
const deviceController = require('../controllers/deviceController');
const alertController = require('../controllers/alertController');
const config = require('../config/mqtt');

class MqttService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.reconnectTimeout = 5000; // 5 segundos
        this.deviceHeartbeats = new Map(); // Armazena o último heartbeat de cada dispositivo
        this.heartbeatInterval = 60000; // 1 minuto
        this.offlineThreshold = 3 * 60000; // 3 minutos sem heartbeat = offline
    }

    /**
     * Inicializa a conexão com o broker MQTT
     */
    async connect() {
        try {
            logger.info('Iniciando conexão com o broker MQTT...');
            
            // Configurações de conexão
            const options = {
                clientId: `securelab-server-${Math.random().toString(16).substring(2, 8)}`,
                clean: true,
                username: config.username,
                password: config.password,
                reconnectPeriod: 1000,
                connectTimeout: 10000
            };

            // Conectar ao broker MQTT
            this.client = mqtt.connect(config.brokerUrl, options);

            // Eventos de conexão
            this.client.on('connect', () => this.handleConnect());
            this.client.on('error', (err) => this.handleError(err));
            this.client.on('message', (topic, message) => this.handleMessage(topic, message));
            this.client.on('reconnect', () => this.handleReconnect());
            this.client.on('close', () => this.handleClose());

            // Iniciar monitoramento de dispositivos
            this.startDeviceMonitoring();

            return true;
        } catch (error) {
            logger.error(`Erro ao conectar ao broker MQTT: ${error.message}`);
            throw error;
        }
    }

    /**
     * Manipula o evento de conexão bem-sucedida
     */
    handleConnect() {
        this.connected = true;
        this.connectionAttempts = 0;
        logger.info('Conectado ao broker MQTT com sucesso');
        
        // Inscrever-se nos tópicos relevantes
        this.subscribeToTopics();
    }

    /**
     * Manipula erros de conexão
     */
    handleError(error) {
        logger.error(`Erro na conexão MQTT: ${error.message}`);
        this.connected = false;
        
        // Tentar reconectar se não atingiu o número máximo de tentativas
        if (this.connectionAttempts < this.maxConnectionAttempts) {
            this.connectionAttempts++;
            logger.info(`Tentando reconectar (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
            
            setTimeout(() => {
                if (!this.connected) {
                    this.connect();
                }
            }, this.reconnectTimeout);
        } else {
            logger.error('Número máximo de tentativas de reconexão atingido');
            // Criar alerta crítico no sistema
            this.createSystemAlert('MQTT_CONNECTION_FAILED', 'Falha na conexão com o broker MQTT', 'critical');
        }
    }

    /**
     * Manipula o evento de reconexão
     */
    handleReconnect() {
        logger.info('Tentando reconectar ao broker MQTT...');
        this.connected = false;
    }

    /**
     * Manipula o evento de fechamento da conexão
     */
    handleClose() {
        logger.info('Conexão com o broker MQTT fechada');
        this.connected = false;
    }

    /**
     * Inscreve-se nos tópicos MQTT relevantes
     */
    subscribeToTopics() {
        if (!this.connected || !this.client) {
            logger.error('Tentativa de inscrição em tópicos sem conexão ativa');
            return false;
        }

        try {
            // Tópicos globais
            this.client.subscribe('device/+/status', { qos: 1 });
            this.client.subscribe('device/+/heartbeat', { qos: 1 });
            this.client.subscribe('device/+/access', { qos: 2 }); // QoS 2 para garantir entrega única
            this.client.subscribe('device/+/event', { qos: 1 });
            this.client.subscribe('system/#', { qos: 1 });
            
            logger.info('Inscrito nos tópicos MQTT com sucesso');
            return true;
        } catch (error) {
            logger.error(`Erro ao inscrever-se nos tópicos MQTT: ${error.message}`);
            return false;
        }
    }

    /**
     * Processa as mensagens recebidas dos tópicos inscritos
     */
    async handleMessage(topic, message) {
        try {
            const payload = message.toString();
            logger.debug(`Mensagem recebida no tópico ${topic}: ${payload.substring(0, 100)}...`);

            // Extrair o ID do dispositivo e o tipo de mensagem do tópico
            const topicParts = topic.split('/');
            if (topicParts.length < 3) {
                logger.warn(`Formato de tópico inválido: ${topic}`);
                return;
            }

            const deviceId = topicParts[1];
            const messageType = topicParts[2];

            // Mensagem criptografada? Tentar descriptografar
            let data;
            try {
                // Assumindo que as mensagens estão no formato JSON
                data = JSON.parse(payload);
                
                // Se a mensagem contém um campo 'encrypted', descriptografar
                if (data.encrypted) {
                    const decrypted = crypto.decrypt(data.data);
                    data = JSON.parse(decrypted);
                }
            } catch (parseError) {
                logger.error(`Erro ao processar payload da mensagem: ${parseError.message}`);
                return;
            }

            // Processar com base no tipo de mensagem
            switch (messageType) {
                case 'status':
                    await this.handleStatusMessage(deviceId, data);
                    break;
                case 'heartbeat':
                    await this.handleHeartbeatMessage(deviceId, data);
                    break;
                case 'access':
                    await this.handleAccessMessage(deviceId, data);
                    break;
                case 'event':
                    await this.handleEventMessage(deviceId, data);
                    break;
                default:
                    logger.debug(`Tipo de mensagem não tratado: ${messageType}`);
            }
        } catch (error) {
            logger.error(`Erro ao processar mensagem MQTT: ${error.message}`);
        }
    }

    /**
     * Processa mensagens de status dos dispositivos
     */
    async handleStatusMessage(deviceId, data) {
        try {
            logger.info(`Status do dispositivo ${deviceId}: ${JSON.stringify(data)}`);
            
            // Atualizar status do dispositivo no banco de dados
            await deviceController.updateDeviceStatus({
                deviceId,
                status: data.status,
                details: data.details || {},
                timestamp: Date.now()
            });

            // Se o status for 'error', criar um alerta
            if (data.status === 'error') {
                await this.createDeviceAlert(deviceId, 'DEVICE_ERROR', data.details?.message || 'Erro no dispositivo', 'warning');
            }
        } catch (error) {
            logger.error(`Erro ao processar mensagem de status: ${error.message}`);
        }
    }

    /**
     * Processa mensagens de heartbeat dos dispositivos
     */
    async handleHeartbeatMessage(deviceId, data) {
        try {
            const timestamp = Date.now();
            this.deviceHeartbeats.set(deviceId, timestamp);
            
            logger.debug(`Heartbeat do dispositivo ${deviceId}`);
            
            // Atualizar o status "online" do dispositivo
            await deviceController.updateDeviceStatus({
                deviceId,
                status: 'online',
                lastHeartbeat: timestamp,
                stats: data.stats || {}
            });
        } catch (error) {
            logger.error(`Erro ao processar heartbeat: ${error.message}`);
        }
    }

    /**
     * Processa solicitações de acesso (leitura de cartão RFID)
     */
    async handleAccessMessage(deviceId, data) {
        try {
            const { cardId, doorId, timestamp } = data;
            logger.info(`Solicitação de acesso: Dispositivo ${deviceId}, Porta ${doorId}, Cartão ${cardId}`);
            
            if (!cardId || !doorId) {
                logger.error('Dados de acesso incompletos');
                this.sendCommandToDevice(deviceId, 'access_response', { 
                    granted: false, 
                    error: 'Dados incompletos'
                });
                return;
            }

            // Validar o acesso através do controlador de acesso
            const accessResult = await accessController.validateAccessInternal({
                cardId,
                doorId,
                deviceId,
                timestamp: timestamp || Date.now()
            });

            // Enviar resposta de acesso ao dispositivo
            this.sendCommandToDevice(deviceId, 'access_response', {
                cardId,
                doorId,
                granted: accessResult.granted,
                userId: accessResult.userId,
                message: accessResult.message
            });

            // Registrar o log de acesso (já é feito pelo validateAccessInternal)
        } catch (error) {
            logger.error(`Erro ao processar solicitação de acesso: ${error.message}`);
            // Enviar resposta de erro ao dispositivo
            this.sendCommandToDevice(deviceId, 'access_response', { 
                granted: false, 
                error: 'Erro interno no servidor'
            });
        }
    }

    /**
     * Processa mensagens de eventos dos dispositivos
     */
    async handleEventMessage(deviceId, data) {
        try {
            const { eventType, details, timestamp } = data;
            logger.info(`Evento do dispositivo ${deviceId}: ${eventType}`);
            
            // Processar com base no tipo de evento
            switch (eventType) {
                case 'door_forced':
                    // Alerta de porta forçada
                    await this.createDeviceAlert(deviceId, 'DOOR_FORCED', 'Porta aberta forçadamente', 'critical');
                    break;
                case 'tamper_detected':
                    // Alerta de violação do dispositivo
                    await this.createDeviceAlert(deviceId, 'TAMPER_DETECTED', 'Violação do dispositivo detectada', 'critical');
                    break;
                case 'door_left_open':
                    // Alerta de porta deixada aberta
                    await this.createDeviceAlert(deviceId, 'DOOR_LEFT_OPEN', 'Porta deixada aberta', 'warning');
                    break;
                case 'power_issue':
                    // Alerta de problema de energia
                    await this.createDeviceAlert(deviceId, 'POWER_ISSUE', details?.message || 'Problema de energia', 'warning');
                    break;
                default:
                    logger.debug(`Tipo de evento não tratado: ${eventType}`);
            }

            // Registrar o evento no banco de dados
            await deviceController.logDeviceEvent({
                deviceId,
                eventType,
                details,
                timestamp: timestamp || Date.now()
            });
        } catch (error) {
            logger.error(`Erro ao processar mensagem de evento: ${error.message}`);
        }
    }

    /**
     * Envia um comando para um dispositivo
     */
    sendCommandToDevice(deviceId, command, data) {
        if (!this.connected || !this.client) {
            logger.error('Tentativa de envio de comando sem conexão ativa');
            return false;
        }

        try {
            const topic = `device/${deviceId}/command`;
            
            // Preparar payload
            const payload = {
                command,
                data,
                timestamp: Date.now()
            };

            // Opcionalmente criptografar a mensagem para dispositivos que suportam
            let finalPayload = payload;
            
            // Verificar se o dispositivo suporta criptografia
            deviceController.getDeviceById(deviceId)
                .then(device => {
                    if (device && device.encryptionEnabled) {
                        const encryptedData = crypto.encrypt(JSON.stringify(payload));
                        finalPayload = {
                            encrypted: true,
                            data: encryptedData
                        };
                    }
                    
                    // Publicar a mensagem
                    this.client.publish(topic, JSON.stringify(finalPayload), { qos: 1 }, (err) => {
                        if (err) {
                            logger.error(`Erro ao enviar comando para o dispositivo ${deviceId}: ${err.message}`);
                        } else {
                            logger.debug(`Comando enviado para o dispositivo ${deviceId}: ${command}`);
                        }
                    });
                })
                .catch(error => {
                    logger.error(`Erro ao verificar suporte a criptografia: ${error.message}`);
                    // Enviar mesmo sem criptografia como fallback
                    this.client.publish(topic, JSON.stringify(finalPayload), { qos: 1 });
                });

            return true;
        } catch (error) {
            logger.error(`Erro ao enviar comando via MQTT: ${error.message}`);
            return false;
        }
    }

    /**
     * Iniciar monitoramento de dispositivos (heartbeat)
     */
    startDeviceMonitoring() {
        // Verificar dispositivos offline a cada intervalo
        setInterval(() => {
            const now = Date.now();
            
            // Verificar todos os dispositivos com heartbeat
            this.deviceHeartbeats.forEach(async (lastHeartbeat, deviceId) => {
                // Se o último heartbeat for mais antigo que o limiar
                if (now - lastHeartbeat > this.offlineThreshold) {
                    logger.warn(`Dispositivo ${deviceId} parece estar offline`);
                    
                    // Atualizar status do dispositivo para offline
                    await deviceController.updateDeviceStatus({
                        deviceId,
                        status: 'offline',
                        lastHeartbeat
                    });
                    
                    // Criar alerta
                    await this.createDeviceAlert(deviceId, 'DEVICE_OFFLINE', 'Dispositivo offline', 'warning');
                    
                    // Remover do mapa para não gerar alertas repetidos
                    this.deviceHeartbeats.delete(deviceId);
                }
            });
        }, this.heartbeatInterval);
    }

    /**
     * Cria um alerta relacionado a um dispositivo
     */
    async createDeviceAlert(deviceId, alertType, message, severity) {
        try {
            await alertController.createAlert({
                type: alertType,
                message,
                severity,
                source: 'device',
                sourceId: deviceId,
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error(`Erro ao criar alerta para dispositivo: ${error.message}`);
        }
    }

    /**
     * Cria um alerta relacionado ao sistema
     */
    async createSystemAlert(alertType, message, severity) {
        try {
            await alertController.createAlert({
                type: alertType,
                message,
                severity,
                source: 'system',
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error(`Erro ao criar alerta de sistema: ${error.message}`);
        }
    }

    /**
     * Desconecta do broker MQTT
     */
    disconnect() {
        if (this.client && this.connected) {
            this.client.end(true);
            this.connected = false;
            logger.info('Desconectado do broker MQTT');
        }
    }
}

// Criar e exportar uma instância única do serviço
const mqttService = new MqttService();
module.exports = mqttService;