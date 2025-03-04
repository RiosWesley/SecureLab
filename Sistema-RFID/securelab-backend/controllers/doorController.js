// controllers/doorController.js
const Door = require('../models/door');
const Device = require('../models/device');
const Permission = require('../models/permission');
const AccessLog = require('../models/accessLog');
const mqttService = require('../services/mqttService');

/**
 * Listar todas as portas
 * @route GET /api/doors
 */
exports.getDoors = async (req, res) => {
  try {
    const doors = await Door.getAll();
    
    res.status(200).json({
      success: true,
      count: doors.length,
      doors
    });
  } catch (error) {
    console.error('Erro ao listar portas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar portas',
      error: error.message
    });
  }
};

/**
 * Obter porta específica pelo ID
 * @route GET /api/doors/:id
 */
exports.getDoorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const door = await Door.getById(id);
    
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar o dispositivo associado à porta
    let device = null;
    if (door.device_id) {
      device = await Device.getById(door.device_id);
    }
    
    res.status(200).json({
      success: true,
      door,
      device
    });
  } catch (error) {
    console.error('Erro ao buscar porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar porta',
      error: error.message
    });
  }
};

/**
 * Criar nova porta
 * @route POST /api/doors
 */
exports.createDoor = async (req, res) => {
  try {
    const { name, location, device_id, allowed_schedules, auto_lock, auto_lock_delay } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Nome e localização da porta são obrigatórios'
      });
    }
    
    // Verificar se o dispositivo existe, se fornecido
    if (device_id) {
      const device = await Device.getById(device_id);
      if (!device) {
        return res.status(400).json({
          success: false,
          message: 'Dispositivo não encontrado'
        });
      }
      
      // Verificar se o dispositivo já está associado a outra porta
      if (device.door_id && device.door_id !== '') {
        return res.status(400).json({
          success: false,
          message: 'Este dispositivo já está associado a outra porta'
        });
      }
    }
    
    // Preparar dados da porta
    const doorData = {
      name,
      location,
      status: 'locked',
      device_id: device_id || null,
      last_status_change: new Date().toISOString(),
      auto_lock: auto_lock !== undefined ? auto_lock : true,
      auto_lock_delay: auto_lock_delay || 30
    };
    
    // Adicionar horários permitidos, se fornecidos
    if (allowed_schedules) {
      doorData.allowed_schedules = allowed_schedules;
    } else {
      // Horários padrão
      doorData.allowed_schedules = {
        weekdays: {
          start: '08:00',
          end: '18:00'
        },
        weekend: {
          start: '09:00',
          end: '13:00'
        }
      };
    }
    
    // Criar porta
    const newDoor = await Door.create(doorData);
    
    // Se um dispositivo foi associado, atualizar o dispositivo
    if (device_id) {
      await Device.update(device_id, { door_id: newDoor.id });
    }
    
    res.status(201).json({
      success: true,
      message: 'Porta criada com sucesso',
      door: newDoor
    });
  } catch (error) {
    console.error('Erro ao criar porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar porta',
      error: error.message
    });
  }
};

/**
 * Atualizar porta existente
 * @route PUT /api/doors/:id
 */
exports.updateDoor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, device_id, allowed_schedules, auto_lock, auto_lock_delay } = req.body;
    
    // Verificar se a porta existe
    const existingDoor = await Door.getById(id);
    if (!existingDoor) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Preparar dados de atualização
    const doorData = {};
    
    if (name) doorData.name = name;
    if (location) doorData.location = location;
    if (auto_lock !== undefined) doorData.auto_lock = auto_lock;
    if (auto_lock_delay) doorData.auto_lock_delay = auto_lock_delay;
    if (allowed_schedules) doorData.allowed_schedules = allowed_schedules;
    
    // Verificar se está mudando o dispositivo
    if (device_id !== undefined) {
      // Remover associação do dispositivo anterior
      if (existingDoor.device_id && existingDoor.device_id !== device_id) {
        await Device.update(existingDoor.device_id, { door_id: null });
      }
      
      // Associar novo dispositivo, se fornecido
      if (device_id) {
        // Verificar se o dispositivo existe
        const device = await Device.getById(device_id);
        if (!device) {
          return res.status(400).json({
            success: false,
            message: 'Dispositivo não encontrado'
          });
        }
        
        // Verificar se o dispositivo já está associado a outra porta
        if (device.door_id && device.door_id !== id) {
          return res.status(400).json({
            success: false,
            message: 'Este dispositivo já está associado a outra porta'
          });
        }
        
        // Atualizar o dispositivo
        await Device.update(device_id, { door_id: id });
      }
      
      doorData.device_id = device_id;
    }
    
    // Atualizar porta
    const updatedDoor = await Door.update(id, doorData);
    
    res.status(200).json({
      success: true,
      message: 'Porta atualizada com sucesso',
      door: updatedDoor
    });
  } catch (error) {
    console.error('Erro ao atualizar porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar porta',
      error: error.message
    });
  }
};

/**
 * Excluir porta
 * @route DELETE /api/doors/:id
 */
exports.deleteDoor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a porta existe
    const existingDoor = await Door.getById(id);
    if (!existingDoor) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Remover associação do dispositivo, se existir
    if (existingDoor.device_id) {
      await Device.update(existingDoor.device_id, { door_id: null });
    }
    
    // Excluir porta
    await Door.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Porta excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir porta',
      error: error.message
    });
  }
};

/**
 * Trancar porta remotamente
 * @route POST /api/doors/:id/lock
 */
exports.lockDoor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // ID do usuário que está fazendo a ação
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar se a porta já está trancada
    if (door.status === 'locked') {
      return res.status(400).json({
        success: false,
        message: 'Porta já está trancada'
      });
    }
    
    // Verificar se há um dispositivo associado
    if (!door.device_id) {
      return res.status(400).json({
        success: false,
        message: 'Porta não possui dispositivo associado'
      });
    }
    
    // Verificar se o dispositivo está online
    const device = await Device.getById(door.device_id);
    if (!device || device.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Dispositivo offline. Não é possível trancar a porta remotamente'
      });
    }
    
    // Trancar a porta via MQTT
    const topic = `device/${door.device_id}/command`;
    const message = JSON.stringify({
      command: 'lock',
      door_id: id,
      timestamp: new Date().toISOString()
    });
    
    await mqttService.publish(topic, message);
    
    // Atualizar status da porta
    const updatedDoor = await Door.updateStatus(id, 'locked', userId);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: userId,
      door_id: id,
      door_name: door.name,
      action: 'door_locked',
      method: 'remote',
      device_id: door.device_id
    });
    
    res.status(200).json({
      success: true,
      message: 'Comando para trancar a porta enviado com sucesso',
      door: updatedDoor
    });
  } catch (error) {
    console.error('Erro ao trancar porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao trancar porta',
      error: error.message
    });
  }
};

/**
 * Destrancar porta remotamente
 * @route POST /api/doors/:id/unlock
 */
exports.unlockDoor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // ID do usuário que está fazendo a ação
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar se a porta já está destrancada
    if (door.status === 'unlocked') {
      return res.status(400).json({
        success: false,
        message: 'Porta já está destrancada'
      });
    }
    
    // Verificar se há um dispositivo associado
    if (!door.device_id) {
      return res.status(400).json({
        success: false,
        message: 'Porta não possui dispositivo associado'
      });
    }
    
    // Verificar se o dispositivo está online
    const device = await Device.getById(door.device_id);
    if (!device || device.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Dispositivo offline. Não é possível destrancar a porta remotamente'
      });
    }
    
    // Verificar permissão do usuário para destrancar remotamente
    const access = await Permission.checkUserAccess(userId, id);
    if (!access.allowed || !access.canUnlockRemotely) {
      return res.status(403).json({
        success: false,
        message: 'Usuário não tem permissão para destrancar esta porta remotamente'
      });
    }
    
    // Destrancar a porta via MQTT
    const topic = `device/${door.device_id}/command`;
    const message = JSON.stringify({
      command: 'unlock',
      door_id: id,
      timestamp: new Date().toISOString(),
      auto_lock: door.auto_lock,
      auto_lock_delay: door.auto_lock_delay
    });
    
    await mqttService.publish(topic, message);
    
    // Atualizar status da porta
    const updatedDoor = await Door.updateStatus(id, 'unlocked', userId);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: userId,
      door_id: id,
      door_name: door.name,
      action: 'door_unlocked',
      method: 'remote',
      device_id: door.device_id
    });
    
    res.status(200).json({
      success: true,
      message: 'Comando para destrancar a porta enviado com sucesso',
      door: updatedDoor
    });
  } catch (error) {
    console.error('Erro ao destrancar porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao destrancar porta',
      error: error.message
    });
  }
};

/**
 * Obter status atual da porta
 * @route GET /api/doors/:id/status
 */
exports.getDoorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar informações do dispositivo associado
    let device = null;
    if (door.device_id) {
      device = await Device.getById(door.device_id);
    }
    
    // Preparar resposta
    const statusInfo = {
      door_id: id,
      name: door.name,
      status: door.status,
      last_status_change: door.last_status_change,
      device_status: device ? device.status : 'no_device',
      device_last_online: device ? device.last_online : null
    };
    
    res.status(200).json({
      success: true,
      status: statusInfo
    });
  } catch (error) {
    console.error('Erro ao obter status da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status da porta',
      error: error.message
    });
  }
};

/**
 * Listar logs de acesso da porta
 * @route GET /api/doors/:id/logs
 */
exports.getDoorLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar logs de acesso
    const logs = await AccessLog.getByDoor(id, limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Erro ao listar logs da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar logs da porta',
      error: error.message
    });
  }
};

/**
 * Listar usuários com acesso à porta
 * @route GET /api/doors/:id/users
 */
exports.getDoorUsers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar permissões para esta porta
    const permissions = await Permission.getByDoor(id);
    
    // Buscar usuários baseado nas permissões
    const userPromises = permissions.map(async (permission) => {
      const user = await User.getById(permission.user_id);
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        access_level: permission.access_level,
        can_unlock_remotely: permission.can_unlock_remotely,
        granted_at: permission.granted_at,
        expires_at: permission.expires_at
      };
    });
    
    const users = (await Promise.all(userPromises)).filter(user => user !== null);
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Erro ao listar usuários com acesso à porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários com acesso à porta',
      error: error.message
    });
  }
};

/**
 * Obter horários permitidos da porta
 * @route GET /api/doors/:id/schedule
 */
exports.getDoorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Obter horários permitidos
    const schedule = door.allowed_schedules || {
      weekdays: {
        start: '08:00',
        end: '18:00'
      },
      weekend: {
        start: '09:00',
        end: '13:00'
      }
    };
    
    res.status(200).json({
      success: true,
      door_id: id,
      door_name: door.name,
      schedule
    });
  } catch (error) {
    console.error('Erro ao obter horários da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter horários da porta',
      error: error.message
    });
  }
};

/**
 * Atualizar horários permitidos da porta
 * @route PUT /api/doors/:id/schedule
 */
exports.updateDoorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { weekdays, weekend } = req.body;
    
    if (!weekdays || !weekend) {
      return res.status(400).json({
        success: false,
        message: 'Horários para dias de semana e fins de semana são obrigatórios'
      });
    }
    
    // Validar formato dos horários
    const validateTimeFormat = (time) => {
      const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Formato: 00:00 - 23:59
      return regex.test(time);
    };
    
    if (!validateTimeFormat(weekdays.start) || !validateTimeFormat(weekdays.end) ||
        !validateTimeFormat(weekend.start) || !validateTimeFormat(weekend.end)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário inválido. Use o formato HH:MM (00:00 - 23:59)'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Atualizar horários
    const allowed_schedules = {
      weekdays,
      weekend
    };
    
    await Door.update(id, { allowed_schedules });
    
    res.status(200).json({
      success: true,
      message: 'Horários atualizados com sucesso',
      door_id: id,
      schedule: allowed_schedules
    });
  } catch (error) {
    console.error('Erro ao atualizar horários da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar horários da porta',
      error: error.message
    });
  }
};