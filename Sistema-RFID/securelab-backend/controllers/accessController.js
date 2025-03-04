// controllers/accessController.js
const User = require('../models/user');
const Door = require('../models/door');
const Device = require('../models/device');
const Permission = require('../models/permission');
const AccessLog = require('../models/accessLog');
const Alert = require('../models/alert');
const mqttService = require('../services/mqttService');

/**
 * Validar tentativa de acesso (RFID)
 * @route POST /api/access/validate
 */
exports.validateAccess = async (req, res) => {
  try {
    const { card_uid, door_id, device_id } = req.body;
    
    if (!card_uid || !door_id) {
      return res.status(400).json({
        success: false,
        message: 'UID do cartão e ID da porta são obrigatórios'
      });
    }
    
    // Registrar a tentativa de acesso
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      card_uid,
      door_id,
      device_id,
      action: 'access_attempted'
    };
    
    // Verificar se a porta existe
    const door = await Door.getById(door_id);
    if (!door) {
      logData.action = 'access_denied';
      logData.reason = 'door_not_found';
      
      await AccessLog.create(logData);
      
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada',
        access: false
      });
    }
    
    logData.door_name = door.name;
    
    // Buscar usuário pelo cartão RFID
    const user = await User.findUserByCardUid(card_uid);
    
    if (!user) {
      // Cartão não registrado
      logData.action = 'access_denied';
      logData.reason = 'unauthorized_card';
      
      await AccessLog.create(logData);
      
      // Criar alerta para tentativa não autorizada
      await Alert.create({
        timestamp,
        type: 'unauthorized_access',
        severity: 'medium',
        message: `Tentativa de acesso não autorizada na porta ${door.name}`,
        door_id,
        door_name: door.name,
        device_id,
        card_uid,
        resolved: false
      });
      
      return res.status(401).json({
        success: false,
        message: 'Cartão não autorizado',
        access: false
      });
    }
    
    // Adicionar informações do usuário ao log
    logData.user_id = user.id;
    logData.user_name = user.name;
    
    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      logData.action = 'access_denied';
      logData.reason = 'user_inactive';
      
      await AccessLog.create(logData);
      
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo',
        access: false
      });
    }
    
    // Verificar permissão do usuário
    const access = await Permission.checkUserAccess(user.id, door_id);
    
    if (!access.allowed) {
      logData.action = 'access_denied';
      logData.reason = access.reason || 'no_permission';
      
      await AccessLog.create(logData);
      
      return res.status(403).json({
        success: false,
        message: `Acesso negado: ${access.reason || 'sem permissão'}`,
        access: false
      });
    }
    
    // Verificar horário permitido (exceto se o usuário tiver override de horário)
    if (!access.scheduleOverride) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const scheduleKey = isWeekend ? 'weekend' : 'weekdays';
      
      if (door.allowed_schedules && door.allowed_schedules[scheduleKey]) {
        const schedule = door.allowed_schedules[scheduleKey];
        if (currentTime < schedule.start || currentTime > schedule.end) {
          logData.action = 'access_denied';
          logData.reason = 'outside_schedule';
          
          await AccessLog.create(logData);
          
          return res.status(403).json({
            success: false,
            message: 'Acesso negado: fora do horário permitido',
            access: false
          });
        }
      }
    }
    
    // Acesso concedido
    logData.action = 'access_granted';
    
    await AccessLog.create(logData);
    
    // Enviar comando para destrancar a porta via MQTT
    if (device_id) {
      const topic = `device/${device_id}/command`;
      const message = JSON.stringify({
        command: 'unlock',
        door_id,
        user_id: user.id,
        timestamp,
        auto_lock: door.auto_lock,
        auto_lock_delay: door.auto_lock_delay
      });
      
      await mqttService.publish(topic, message);
    }
    
    // Atualizar status da porta
    await Door.updateStatus(door_id, 'unlocked', user.id);
    
    res.status(200).json({
      success: true,
      message: 'Acesso concedido',
      access: true,
      user: {
        id: user.id,
        name: user.name
      },
      door: {
        id: door_id,
        name: door.name
      },
      timestamp
    });
  } catch (error) {
    console.error('Erro ao validar acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar acesso',
      error: error.message,
      access: false
    });
  }
};

/**
 * Verificar se usuário tem acesso a uma porta
 * @route GET /api/access/check
 */
exports.checkUserAccess = async (req, res) => {
  try {
    const { user_id, door_id } = req.query;
    
    if (!user_id || !door_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário e ID da porta são obrigatórios'
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.getById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(door_id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar permissão
    const access = await Permission.checkUserAccess(user_id, door_id);
    
    res.status(200).json({
      success: true,
      user_id,
      door_id,
      access
    });
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar acesso',
      error: error.message
    });
  }
};

/**
 * Conceder acesso temporário
 * @route POST /api/access/grant-temporary
 */
exports.grantTemporaryAccess = async (req, res) => {
  try {
    const { user_id, door_id, duration, granted_by, can_unlock_remotely = false } = req.body;
    
    if (!user_id || !door_id || !duration || !granted_by) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário, ID da porta, duração e ID do administrador são obrigatórios'
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.getById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(door_id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar se quem está concedendo o acesso existe e tem permissão administrativa
    const admin = await User.getById(granted_by);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem conceder acesso temporário'
      });
    }
    
    // Calcular data de expiração
    const now = new Date();
    const expires_at = new Date(now.getTime() + duration * 60 * 60 * 1000); // Duração em horas
    
    // Verificar se já existe uma permissão para este usuário/porta
    const existingPermission = await Permission.getByUserAndDoor(user_id, door_id);
    
    if (existingPermission) {
      // Atualizar permissão existente
      await Permission.update(existingPermission.id, {
        expires_at: expires_at.toISOString(),
        granted_by,
        granted_at: now.toISOString(),
        can_unlock_remotely
      });
    } else {
      // Criar nova permissão
      await Permission.create({
        user_id,
        door_id,
        access_level: 'user',
        can_unlock_remotely,
        schedule_override: false,
        granted_by,
        granted_at: now.toISOString(),
        expires_at: expires_at.toISOString()
      });
    }
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: now.toISOString(),
      user_id: granted_by,
      door_id,
      door_name: door.name,
      action: 'temporary_access_granted',
      details: `Acesso temporário concedido para ${user.name} até ${expires_at.toISOString()}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Acesso temporário concedido com sucesso',
      user_id,
      door_id,
      expires_at: expires_at.toISOString(),
      duration
    });
  } catch (error) {
    console.error('Erro ao conceder acesso temporário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao conceder acesso temporário',
      error: error.message
    });
  }
};

/**
 * Revogar acesso de usuário a uma porta
 * @route DELETE /api/access/revoke
 */
exports.revokeAccess = async (req, res) => {
  try {
    const { user_id, door_id, revoked_by } = req.body;
    
    if (!user_id || !door_id || !revoked_by) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário, ID da porta e ID do administrador são obrigatórios'
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.getById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(door_id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar se quem está revogando o acesso existe e tem permissão administrativa
    const admin = await User.getById(revoked_by);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem revogar acesso'
      });
    }
    
    // Verificar se existe uma permissão para este usuário/porta
    const permission = await Permission.getByUserAndDoor(user_id, door_id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permissão não encontrada para este usuário/porta'
      });
    }
    
    // Excluir a permissão
    await Permission.delete(permission.id);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: revoked_by,
      door_id,
      door_name: door.name,
      action: 'access_revoked',
      details: `Acesso revogado para ${user.name}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Acesso revogado com sucesso',
      user_id,
      door_id
    });
  } catch (error) {
    console.error('Erro ao revogar acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao revogar acesso',
      error: error.message
    });
  }
};

/**
 * Listar tentativas recentes de acesso
 * @route GET /api/access/attempts
 */
exports.getAccessAttempts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const door_id = req.query.door_id;
    
    let logs;
    
    if (door_id) {
      // Filtrar por porta específica
      logs = await AccessLog.getByDoor(door_id, limit);
    } else {
      // Todos os logs
      logs = await AccessLog.getAll(limit);
    }
    
    res.status(200).json({
      success: true,
      count: logs.length,
      attempts: logs
    });
  } catch (error) {
    console.error('Erro ao listar tentativas de acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tentativas de acesso',
      error: error.message
    });
  }
};

/**
 * Listar tentativas negadas de acesso
 * @route GET /api/access/denied
 */
exports.getDeniedAttempts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Buscar logs de acesso negado
    const logs = await AccessLog.getByAction('access_denied', limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      attempts: logs
    });
  } catch (error) {
    console.error('Erro ao listar tentativas negadas de acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tentativas negadas de acesso',
      error: error.message
    });
  }
};