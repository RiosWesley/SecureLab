// controllers/deviceController.js
const Device = require('../models/device');
const Door = require('../models/door');
const AccessLog = require('../models/accessLog');
const Alert = require('../models/alert');
const mqttService = require('../services/mqttService');

/**
 * Listar todos os dispositivos
 * @route GET /api/devices
 */
exports.getDevices = async (req, res) => {
  try {
    // Parâmetros opcionais de consulta
    const { status } = req.query;
    
    let devices;
    if (status) {
      devices = await Device.getByStatus(status);
    } else {
      devices = await Device.getAll();
    }
    
    res.status(200).json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Erro ao listar dispositivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar dispositivos',
      error: error.message
    });
  }
};

/**
 * Obter dispositivo específico pelo ID
 * @route GET /api/devices/:id
 */
exports.getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await Device.getById(id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Buscar porta associada, se houver
    let door = null;
    if (device.door_id) {
      door = await Door.getById(device.door_id);
    }
    
    res.status(200).json({
      success: true,
      device,
      door
    });
  } catch (error) {
    console.error('Erro ao buscar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dispositivo',
      error: error.message
    });
  }
};

/**
 * Registrar novo dispositivo
 * @route POST /api/devices
 */
exports.createDevice = async (req, res) => {
  try {
    const { 
      name, 
      type = 'ESP32-RFID', 
      mac_address, 
      firmware_version, 
      location, 
      door_id = null 
    } = req.body;
    
    if (!name || !mac_address) {
      return res.status(400).json({
        success: false,
        message: 'Nome e endereço MAC são obrigatórios'
      });
    }
    
    // Verificar se já existe um dispositivo com este MAC
    const existingDevice = await Device.getByMacAddress(mac_address);
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um dispositivo registrado com este endereço MAC'
      });
    }
    
    // Verificar se a porta existe, se for fornecida
    if (door_id) {
      const door = await Door.getById(door_id);
      if (!door) {
        return res.status(400).json({
          success: false,
          message: 'Porta informada não encontrada'
        });
      }
      
      // Verificar se a porta já tem um dispositivo associado
      if (door.device_id && door.device_id !== '') {
        return res.status(400).json({
          success: false,
          message: 'A porta informada já possui um dispositivo associado'
        });
      }
    }
    
    // Criar dispositivo
    const deviceData = {
      name,
      type,
      mac_address,
      firmware_version: firmware_version || '1.0.0',
      location: location || '',
      status: 'offline', // Inicialmente offline
      registration_date: new Date().toISOString(),
      last_online: null,
      door_id
    };
    
    const newDevice = await Device.create(deviceData);
    
    // Se uma porta foi associada, atualizar a porta
    if (door_id) {
      await Door.update(door_id, { device_id: newDevice.id });
    }
    
    res.status(201).json({
      success: true,
      message: 'Dispositivo registrado com sucesso',
      device: newDevice
    });
  } catch (error) {
    console.error('Erro ao registrar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar dispositivo',
      error: error.message
    });
  }
};

/**
 * Atualizar dispositivo existente
 * @route PUT /api/devices/:id
 */
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      type, 
      mac_address, 
      firmware_version, 
      location, 
      door_id 
    } = req.body;
    
    // Verificar se o dispositivo existe
    const existingDevice = await Device.getById(id);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (type) updates.type = type;
    if (mac_address) updates.mac_address = mac_address;
    if (firmware_version) updates.firmware_version = firmware_version;
    if (location !== undefined) updates.location = location;
    
    // Tratar associação/desassociação de porta
    if (door_id !== undefined) {
      // Se está mudando a porta
      if (existingDevice.door_id !== door_id) {
        // Remover associação da porta anterior, se existir
        if (existingDevice.door_id) {
          await Door.update(existingDevice.door_id, { device_id: null });
        }
        
        // Associar nova porta, se fornecida
        if (door_id) {
          // Verificar se a porta existe
          const door = await Door.getById(door_id);
          if (!door) {
            return res.status(400).json({
              success: false,
              message: 'Porta informada não encontrada'
            });
          }
          
          // Verificar se a porta já tem um dispositivo associado
          if (door.device_id && door.device_id !== id) {
            return res.status(400).json({
              success: false,
              message: 'A porta informada já possui um dispositivo associado'
            });
          }
          
          // Atualizar a porta com este dispositivo
          await Door.update(door_id, { device_id: id });
        }
        
        updates.door_id = door_id;
      }
    }
    
    // Atualizar dispositivo
    const updatedDevice = await Device.update(id, updates);
    
    res.status(200).json({
      success: true,
      message: 'Dispositivo atualizado com sucesso',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Erro ao atualizar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar dispositivo',
      error: error.message
    });
  }
};

/**
 * Remover dispositivo
 * @route DELETE /api/devices/:id
 */
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o dispositivo existe
    const existingDevice = await Device.getById(id);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Remover associação da porta, se existir
    if (existingDevice.door_id) {
      await Door.update(existingDevice.door_id, { device_id: null });
    }
    
    // Excluir dispositivo
    await Device.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Dispositivo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover dispositivo',
      error: error.message
    });
  }
};

/**
 * Obter status atual do dispositivo
 * @route GET /api/devices/:id/status
 */
exports.getDeviceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o dispositivo existe
    const device = await Device.getById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Buscar porta associada, se houver
    let door = null;
    if (device.door_id) {
      door = await Door.getById(device.door_id);
    }
    
    // Preparar resposta de status
    const statusInfo = {
      device_id: id,
      name: device.name,
      status: device.status,
      last_online: device.last_online,
      firmware_version: device.firmware_version,
      door_id: device.door_id,
      door_name: door ? door.name : null,
      door_status: door ? door.status : null
    };
    
    res.status(200).json({
      success: true,
      status: statusInfo
    });
  } catch (error) {
    console.error('Erro ao obter status do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do dispositivo',
      error: error.message
    });
  }
};

/**
 * Reiniciar dispositivo remotamente
 * @route POST /api/devices/:id/restart
 */
exports.restartDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // ID do usuário que está iniciando a reinicialização
    
    // Verificar se o dispositivo existe
    const device = await Device.getById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Verificar se o dispositivo está online
    if (device.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Dispositivo está offline. Não é possível reiniciar remotamente'
      });
    }
    
    // Enviar comando de reinicialização via MQTT
    const topic = `device/${id}/command`;
    const message = JSON.stringify({
      command: 'restart',
      initiated_by: userId,
      timestamp: new Date().toISOString()
    });
    
    await mqttService.publish(topic, message);
    
    // Registrar o comando no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: userId,
      action: 'device_restart',
      device_id: id,
      device_name: device.name,
      method: 'remote'
    });
    
    res.status(200).json({
      success: true,
      message: 'Comando de reinicialização enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao reiniciar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reiniciar dispositivo',
      error: error.message
    });
  }
};

/**
 * Atualizar firmware do dispositivo
 * @route POST /api/devices/:id/update-firmware
 */
exports.updateFirmware = async (req, res) => {
  try {
    const { id } = req.params;
    const { firmwareVersion, firmwareUrl, userId } = req.body;
    
    if (!firmwareVersion || !firmwareUrl) {
      return res.status(400).json({
        success: false,
        message: 'Versão e URL do firmware são obrigatórios'
      });
    }
    
    // Verificar se o dispositivo existe
    const device = await Device.getById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Verificar se o dispositivo está online
    if (device.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Dispositivo está offline. Não é possível atualizar firmware remotamente'
      });
    }
    
    // Enviar comando de atualização de firmware via MQTT
    const topic = `device/${id}/command`;
    const message = JSON.stringify({
      command: 'update_firmware',
      firmware_version: firmwareVersion,
      firmware_url: firmwareUrl,
      initiated_by: userId,
      timestamp: new Date().toISOString()
    });
    
    await mqttService.publish(topic, message);
    
    // Registrar o comando no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: userId,
      action: 'firmware_update',
      device_id: id,
      device_name: device.name,
      method: 'remote',
      details: `Atualização para versão ${firmwareVersion}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Comando de atualização de firmware enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar firmware:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar firmware',
      error: error.message
    });
  }
};

/**
 * Listar logs do dispositivo
 * @route GET /api/devices/:id/logs
 */
exports.getDeviceLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verificar se o dispositivo existe
    const device = await Device.getById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    // Buscar logs relacionados ao dispositivo
    const logs = await AccessLog.getByDevice(id, limit);
    
    // Buscar alertas relacionados ao dispositivo
    const alerts = await Alert.getByDevice(id, limit);
    
    res.status(200).json({
      success: true,
      device_id: id,
      device_name: device.name,
      logs: {
        count: logs.length,
        data: logs
      },
      alerts: {
        count: alerts.length,
        data: alerts
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs do dispositivo',
      error: error.message
    });
  }
};

/**
 * Obter dispositivo associado a uma porta
 * @route GET /api/devices/door/:doorId
 */
exports.getDoorDevice = async (req, res) => {
  try {
    const { doorId } = req.params;
    
    // Verificar se a porta existe
    const door = await Door.getById(doorId);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar dispositivo associado à porta
    if (!door.device_id) {
      return res.status(404).json({
        success: false,
        message: 'Porta não possui dispositivo associado'
      });
    }
    
    const device = await Device.getById(door.device_id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo associado não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      door_id: doorId,
      door_name: door.name,
      device
    });
  } catch (error) {
    console.error('Erro ao buscar dispositivo da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dispositivo da porta',
      error: error.message
    });
  }
};

// Métodos internos usados por outros controladores ou serviços

/**
 * Atualizar status do dispositivo (usado pelo serviço MQTT)
 * @param {Object} data - Dados de status
 */
exports.updateDeviceStatus = async (data) => {
  try {
    const { deviceId, status, stats } = data;
    
    // Atualizar dados no model
    const updates = {
      status,
      last_status_update: new Date().toISOString()
    };
    
    if (status === 'online') {
      updates.last_online = new Date().toISOString();
    }
    
    if (stats) {
      updates.stats = stats;
    }
    
    await Device.update(deviceId, updates);
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do dispositivo:', error);
    return false;
  }
};

/**
 * Registrar evento do dispositivo (usado pelo serviço MQTT)
 * @param {Object} data - Dados do evento
 */
exports.logDeviceEvent = async (data) => {
  try {
    const { deviceId, eventType, details, timestamp } = data;
    
    // Obter informações do dispositivo
    const device = await Device.getById(deviceId);
    if (!device) {
      throw new Error('Dispositivo não encontrado');
    }
    
    // Criar log de evento
    await AccessLog.create({
      timestamp: timestamp || new Date().toISOString(),
      device_id: deviceId,
      device_name: device.name,
      action: `device_event_${eventType}`,
      door_id: device.door_id,
      details: JSON.stringify(details)
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao registrar evento do dispositivo:', error);
    return false;
  }
};

/**
 * Atualizar firmware (usado pelo serviço MQTT para atualizar após confirmação de sucesso)
 * @param {Object} data - Dados da atualização de firmware
 */
exports.updateFirmwareVersion = async (data) => {
  try {
    const { deviceId, version, success, details } = data;
    
    if (success) {
      // Atualizar versão do firmware
      await Device.update(deviceId, {
        firmware_version: version,
        last_firmware_update: new Date().toISOString()
      });
      
      // Registrar evento de sucesso
      await AccessLog.create({
        timestamp: new Date().toISOString(),
        device_id: deviceId,
        action: 'firmware_update_success',
        details: `Atualizado para versão ${version}`
      });
    } else {
      // Registrar falha na atualização
      await AccessLog.create({
        timestamp: new Date().toISOString(),
        device_id: deviceId,
        action: 'firmware_update_failed',
        details: details || 'Falha na atualização do firmware'
      });
      
      // Criar alerta
      await Alert.create({
        timestamp: new Date().toISOString(),
        type: 'firmware_update_failed',
        severity: 'warning',
        message: `Falha na atualização do firmware do dispositivo`,
        device_id: deviceId,
        resolved: false,
        details: details || 'Erro durante a atualização'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar versão do firmware:', error);
    return false;
  }
};