// controllers/alertController.js
const Alert = require('../models/alert');
const Device = require('../models/device');
const Door = require('../models/door');
const User = require('../models/user');
const AccessLog = require('../models/accessLog');

/**
 * Listar todos os alertas
 * @route GET /api/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    // Parâmetros opcionais de consulta
    const limit = parseInt(req.query.limit) || 50;
    const resolved = req.query.resolved === 'true';
    
    let alerts;
    if (req.query.resolved) {
      // Filtrar por status de resolução
      if (resolved) {
        // Buscar apenas alertas resolvidos
        const allAlerts = await Alert.getAll(limit * 2); // Buscar o dobro para ter margem de filtro
        alerts = allAlerts.filter(alert => alert.resolved).slice(0, limit);
      } else {
        // Buscar alertas não resolvidos
        alerts = await Alert.getUnresolved(limit);
      }
    } else {
      // Buscar todos os alertas
      alerts = await Alert.getAll(limit);
    }
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alertas',
      error: error.message
    });
  }
};

/**
 * Obter alerta específico pelo ID
 * @route GET /api/alerts/:id
 */
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await Alert.getById(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
    }
    
    // Buscar informações adicionais relacionadas ao alerta
    let additionalInfo = {};
    
    if (alert.device_id) {
      const device = await Device.getById(alert.device_id);
      if (device) {
        additionalInfo.device = {
          id: device.id,
          name: device.name,
          type: device.type,
          status: device.status
        };
      }
    }
    
    if (alert.door_id) {
      const door = await Door.getById(alert.door_id);
      if (door) {
        additionalInfo.door = {
          id: door.id,
          name: door.name,
          location: door.location,
          status: door.status
        };
      }
    }
    
    if (alert.resolved_by) {
      const user = await User.getById(alert.resolved_by);
      if (user) {
        additionalInfo.resolved_by_user = {
          id: user.id,
          name: user.name,
          email: user.email
        };
      }
    }
    
    res.status(200).json({
      success: true,
      alert: {
        ...alert,
        ...additionalInfo
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar alerta',
      error: error.message
    });
  }
};

/**
 * Criar novo alerta
 * @route POST /api/alerts
 */
exports.createAlert = async (req, res) => {
  try {
    const {
      type,
      message,
      severity = 'medium',
      device_id,
      door_id,
      details,
      timestamp = new Date().toISOString()
    } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tipo e mensagem do alerta são obrigatórios'
      });
    }
    
    // Validar severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severidade inválida. Use: low, medium, high ou critical'
      });
    }
    
    // Validar device_id, se fornecido
    if (device_id) {
      const device = await Device.getById(device_id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo não encontrado'
        });
      }
    }
    
    // Validar door_id, se fornecido
    if (door_id) {
      const door = await Door.getById(door_id);
      if (!door) {
        return res.status(404).json({
          success: false,
          message: 'Porta não encontrada'
        });
      }
    }
    
    // Criar alerta
    const alertData = {
      type,
      message,
      severity,
      device_id,
      door_id,
      details,
      timestamp,
      resolved: false,
      created_by: req.user.id
    };
    
    const newAlert = await Alert.create(alertData);
    
    // Registrar a criação do alerta no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'alert_created',
      details: `Alerta criado: ${message}`,
      device_id,
      door_id
    });
    
    res.status(201).json({
      success: true,
      message: 'Alerta criado com sucesso',
      alert: newAlert
    });
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar alerta',
      error: error.message
    });
  }
};

/**
 * Atualizar alerta existente
 * @route PUT /api/alerts/:id
 */
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      message,
      severity,
      details
    } = req.body;
    
    // Verificar se o alerta existe
    const alert = await Alert.getById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
    }
    
    // Não permitir atualização de alertas já resolvidos
    if (alert.resolved) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível atualizar um alerta já resolvido'
      });
    }
    
    // Preparar dados para atualização
    const updates = {};
    
    if (message) updates.message = message;
    if (severity) {
      // Validar severity
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: 'Severidade inválida. Use: low, medium, high ou critical'
        });
      }
      updates.severity = severity;
    }
    if (details !== undefined) updates.details = details;
    
    updates.updated_at = new Date().toISOString();
    updates.updated_by = req.user.id;
    
    // Atualizar alerta
    const updatedAlert = await Alert.update(id, updates);
    
    // Registrar a atualização do alerta no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'alert_updated',
      details: `Alerta atualizado: ${updatedAlert.message}`,
      device_id: alert.device_id,
      door_id: alert.door_id
    });
    
    res.status(200).json({
      success: true,
      message: 'Alerta atualizado com sucesso',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar alerta',
      error: error.message
    });
  }
};

/**
 * Excluir alerta
 * @route DELETE /api/alerts/:id
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o alerta existe
    const alert = await Alert.getById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
    }
    
    // Excluir alerta
    await Alert.delete(id);
    
    // Registrar a exclusão do alerta no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'alert_deleted',
      details: `Alerta excluído: ${alert.message}`,
      device_id: alert.device_id,
      door_id: alert.door_id
    });
    
    res.status(200).json({
      success: true,
      message: 'Alerta excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir alerta',
      error: error.message
    });
  }
};

/**
 * Marcar alerta como resolvido
 * @route PUT /api/alerts/:id/resolve
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;
    
    // Resolver o alerta
    const resolvedAlert = await Alert.resolve(id, req.user.id, resolution_notes);
    
    if (!resolvedAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
    }
    
    // Se o alerta já estava resolvido
    if (resolvedAlert.already_resolved) {
      return res.status(200).json({
        success: true,
        message: 'Alerta já estava resolvido',
        alert: resolvedAlert
      });
    }
    
    // Registrar a resolução do alerta no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'alert_resolved',
      details: `Alerta resolvido: ${resolvedAlert.message}`,
      device_id: resolvedAlert.device_id,
      door_id: resolvedAlert.door_id
    });
    
    res.status(200).json({
      success: true,
      message: 'Alerta marcado como resolvido',
      alert: resolvedAlert
    });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver alerta',
      error: error.message
    });
  }
};

/**
 * Resolver vários alertas de uma vez
 * @route POST /api/alerts/bulk-resolve
 */
exports.bulkResolveAlerts = async (req, res) => {
  try {
    const { alertIds, resolution_notes } = req.body;
    
    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs de alertas é obrigatória'
      });
    }
    
    // Resolver alertas em massa
    const results = await Alert.resolveBulk(alertIds, req.user.id, resolution_notes);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'alerts_bulk_resolved',
      details: `${results.success.length} alertas resolvidos em massa`
    });
    
    res.status(200).json({
      success: true,
      message: `${results.success.length} alertas resolvidos, ${results.errors.length} erros`,
      results
    });
  } catch (error) {
    console.error('Erro ao resolver alertas em massa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver alertas em massa',
      error: error.message
    });
  }
};

/**
 * Listar alertas não resolvidos
 * @route GET /api/alerts/unresolved
 */
exports.getUnresolvedAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const alerts = await Alert.getUnresolved(limit);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Erro ao listar alertas não resolvidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alertas não resolvidos',
      error: error.message
    });
  }
};

/**
 * Listar alertas por tipo
 * @route GET /api/alerts/type/:type
 */
exports.getAlertsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const alerts = await Alert.getByType(type, limit);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      type,
      alerts
    });
  } catch (error) {
    console.error('Erro ao listar alertas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alertas por tipo',
      error: error.message
    });
  }
};

/**
 * Listar alertas por severidade
 * @route GET /api/alerts/severity/:severity
 */
exports.getAlertsBySeverity = async (req, res) => {
  try {
    const { severity } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Validar severidade
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severidade inválida. Use: low, medium, high ou critical'
      });
    }
    
    const alerts = await Alert.getBySeverity(severity, limit);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      severity,
      alerts
    });
  } catch (error) {
    console.error('Erro ao listar alertas por severidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alertas por severidade',
      error: error.message
    });
  }
};

/**
 * Método usado internamente para criar alertas pelo sistema
 * (não exposto como rota HTTP)
 */
exports.createAlertInternal = async (alertData) => {
  try {
    // Garantir que o timestamp está presente
    if (!alertData.timestamp) {
      alertData.timestamp = new Date().toISOString();
    }
    
    // Por padrão, o alerta não está resolvido
    alertData.resolved = false;
    
    return await Alert.create(alertData);
  } catch (error) {
    console.error('Erro ao criar alerta interno:', error);
    return null;
  }
};

module.exports = exports;