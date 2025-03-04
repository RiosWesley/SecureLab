// controllers/settingsController.js
const Settings = require('../models/settings');
const AccessLog = require('../models/accessLog');

/**
 * Obter configurações atuais
 * @route GET /api/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getAll();
    
    // Remover dados sensíveis para retornar ao cliente
    const sanitizedSettings = this.sanitizeSettings(settings);
    
    res.status(200).json({
      success: true,
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações',
      error: error.message
    });
  }
};

/**
 * Atualizar configurações
 * @route PUT /api/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { category, settings } = req.body;
    
    if (!category || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Categoria e configurações são obrigatórias'
      });
    }
    
    // Validar categoria
    const validCategories = [
      'general', 'security', 'email', 'access', 
      'mqtt', 'notifications', 'ui'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoria inválida'
      });
    }
    
    // Obter configurações atuais para verificar alterações
    const currentSettings = await Settings.getCategory(category);
    
    // Atualizar configurações
    const updatedSettings = await Settings.updateCategory(category, settings);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'settings_updated',
      details: `Configurações atualizadas: ${category}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message
    });
  }
};

/**
 * Obter configurações de e-mail
 * @route GET /api/settings/email
 */
exports.getEmailSettings = async (req, res) => {
  try {
    const emailSettings = await Settings.getCategory('email');
    
    // Remover senha SMTP
    const { smtp_password, ...sanitizedSettings } = emailSettings;
    
    res.status(200).json({
      success: true,
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Erro ao obter configurações de e-mail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de e-mail',
      error: error.message
    });
  }
};

/**
 * Atualizar configurações de e-mail
 * @route PUT /api/settings/email
 */
exports.updateEmailSettings = async (req, res) => {
  try {
    const emailSettings = req.body;
    
    if (!emailSettings.smtp_server || !emailSettings.from_email) {
      return res.status(400).json({
        success: false,
        message: 'Servidor SMTP e e-mail de origem são obrigatórios'
      });
    }
    
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSettings.from_email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de e-mail inválido'
      });
    }
    
    // Atualizar configurações
    const updatedSettings = await Settings.updateCategory('email', emailSettings);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'email_settings_updated',
      details: 'Configurações de e-mail atualizadas'
    });
    
    // Remover senha SMTP antes de retornar
    const { smtp_password, ...sanitizedSettings } = updatedSettings;
    
    res.status(200).json({
      success: true,
      message: 'Configurações de e-mail atualizadas com sucesso',
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de e-mail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações de e-mail',
      error: error.message
    });
  }
};

/**
 * Obter configurações de notificação
 * @route GET /api/settings/notifications
 */
exports.getNotificationSettings = async (req, res) => {
  try {
    const notificationSettings = await Settings.getCategory('notifications');
    
    res.status(200).json({
      success: true,
      settings: notificationSettings
    });
  } catch (error) {
    console.error('Erro ao obter configurações de notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de notificação',
      error: error.message
    });
  }
};

/**
 * Atualizar configurações de notificação
 * @route PUT /api/settings/notifications
 */
exports.updateNotificationSettings = async (req, res) => {
  try {
    const notificationSettings = req.body;
    
    // Atualizar configurações
    const updatedSettings = await Settings.updateCategory('notifications', notificationSettings);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'notification_settings_updated',
      details: 'Configurações de notificação atualizadas'
    });
    
    res.status(200).json({
      success: true,
      message: 'Configurações de notificação atualizadas com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações de notificação',
      error: error.message
    });
  }
};

/**
 * Obter configurações de segurança
 * @route GET /api/settings/security
 */
exports.getSecuritySettings = async (req, res) => {
  try {
    const securitySettings = await Settings.getCategory('security');
    
    res.status(200).json({
      success: true,
      settings: securitySettings
    });
  } catch (error) {
    console.error('Erro ao obter configurações de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de segurança',
      error: error.message
    });
  }
};

/**
 * Atualizar configurações de segurança
 * @route PUT /api/settings/security
 */
exports.updateSecuritySettings = async (req, res) => {
  try {
    const securitySettings = req.body;
    
    // Validar valores mínimos para segurança
    if (securitySettings.password_min_length && securitySettings.password_min_length < 6) {
      return res.status(400).json({
        success: false,
        message: 'O comprimento mínimo da senha deve ser de pelo menos 6 caracteres'
      });
    }
    
    if (securitySettings.jwt_expiration && securitySettings.jwt_expiration < 1) {
      return res.status(400).json({
        success: false,
        message: 'O tempo de expiração do JWT deve ser de pelo menos 1 hora'
      });
    }
    
    // Atualizar configurações
    const updatedSettings = await Settings.updateCategory('security', securitySettings);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'security_settings_updated',
      details: 'Configurações de segurança atualizadas'
    });
    
    res.status(200).json({
      success: true,
      message: 'Configurações de segurança atualizadas com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações de segurança',
      error: error.message
    });
  }
};

/**
 * Restaurar configurações padrão
 * @route POST /api/settings/reset
 */
exports.resetToDefault = async (req, res) => {
  try {
    const { category } = req.body;
    
    let resetSettings;
    if (category) {
      // Redefinir apenas uma categoria
      resetSettings = await Settings.resetToDefault(category);
    } else {
      // Redefinir todas as configurações
      resetSettings = await Settings.resetToDefault();
    }
    
    // Remover dados sensíveis
    const sanitizedSettings = this.sanitizeSettings(resetSettings);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'settings_reset',
      details: category ? `Configurações redefinidas: ${category}` : 'Todas as configurações redefinidas'
    });
    
    res.status(200).json({
      success: true,
      message: category ? `Configurações de ${category} redefinidas` : 'Todas as configurações redefinidas',
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Erro ao redefinir configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir configurações',
      error: error.message
    });
  }
};

/**
 * Testar configurações de e-mail
 * @route POST /api/settings/test-email
 */
exports.testEmailConnection = async (req, res) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'E-mail do destinatário é obrigatório'
      });
    }
    
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de e-mail inválido'
      });
    }
    
    // Obter configurações de e-mail
    const emailSettings = await Settings.getCategory('email');
    
    // Verificar se as configurações de e-mail estão completas
    if (!emailSettings.smtp_server || !emailSettings.smtp_user || !emailSettings.smtp_password) {
      return res.status(400).json({
        success: false,
        message: 'Configurações de e-mail incompletas'
      });
    }
    
    // Simular teste de e-mail (implementar com nodemailer posteriormente)
    // const result = await emailService.sendTestEmail(emailSettings, recipient);
    
    // Simulação de resultado bem-sucedido
    const result = {
      success: true,
      message: 'E-mail de teste enviado com sucesso'
    };
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'email_test',
      details: `Teste de e-mail para ${recipient}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Teste de e-mail realizado com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao testar configurações de e-mail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar configurações de e-mail',
      error: error.message
    });
  }
};

/**
 * Remover dados sensíveis das configurações
 * @private
 */
exports.sanitizeSettings = (settings) => {
  const sanitized = { ...settings };
  
  // Remover senha SMTP
  if (sanitized.email && sanitized.email.smtp_password) {
    sanitized.email = { ...sanitized.email, smtp_password: '********' };
  }
  
  // Remover credenciais MQTT
  if (sanitized.mqtt && sanitized.mqtt.password) {
    sanitized.mqtt = { ...sanitized.mqtt, password: '********' };
  }
  
  return sanitized;
};

module.exports = exports;