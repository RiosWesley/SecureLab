// services/notificationService.js
const AccessLog = require('../models/accessLog');
const User = require('../models/user');
const Settings = require('../models/settings');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.isProcessing = false;
    this.settings = null;
    this.initSettings();
  }

  async initSettings() {
    try {
      this.settings = await Settings.getCategory('notifications');
    } catch (error) {
      logger.error(`Erro ao carregar configurações de notificação: ${error.message}`);
      this.settings = {
        enable_push: false,
        enable_email: false,
        enable_web: true
      };
    }
  }

  async notify(type, message, data = {}, recipients = [], options = {}) {
    try {
      if (!this.settings) await this.initSettings();
      
      const notification = {
        id: Date.now().toString(),
        type,
        message,
        data,
        recipients,
        options,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      this.notificationQueue.push(notification);
      this.processQueue();
      
      return { success: true, notification_id: notification.id };
    } catch (error) {
      logger.error(`Erro ao criar notificação: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const notification = this.notificationQueue.shift();
      
      // Processar notificação com base em seu tipo e configurações
      if (this.settings.enable_web) {
        await this.sendWebNotification(notification);
      }
      
      if (this.settings.enable_email) {
        await this.sendEmailNotification(notification);
      }
      
      if (this.settings.enable_push) {
        await this.sendPushNotification(notification);
      }
      
      // Registrar notificação
      await AccessLog.create({
        timestamp: new Date().toISOString(),
        action: 'notification_sent',
        details: `Notificação enviada: ${notification.message}`
      });
      
    } catch (error) {
      logger.error(`Erro ao processar notificação: ${error.message}`);
    } finally {
      this.isProcessing = false;
      if (this.notificationQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  async sendWebNotification(notification) {
    // Implementação de notificação web
    logger.info(`Notificação web enviada: ${notification.message}`);
    return true;
  }

  async sendEmailNotification(notification) {
    if (!emailService) {
      logger.warn('Serviço de e-mail não disponível');
      return false;
    }
    
    try {
      const recipients = notification.recipients.length > 0 
        ? notification.recipients 
        : await this.getDefaultRecipients();
      
      for (const recipient of recipients) {
        await emailService.sendEmail({
          to: recipient.email,
          subject: `[SecureLab RFID] ${notification.type}`,
          body: notification.message,
          data: notification.data
        });
      }
      
      return true;
    } catch (error) {
      logger.error(`Erro ao enviar notificação por e-mail: ${error.message}`);
      return false;
    }
  }

  async sendPushNotification(notification) {
    // Stub para implementação futura
    logger.info(`Notificação push enviada: ${notification.message}`);
    return true;
  }

  async getDefaultRecipients() {
    try {
      // Buscar usuários administradores
      const users = await User.getAll();
      return users.filter(user => user.role === 'admin' && user.status === 'active');
    } catch (error) {
      logger.error(`Erro ao buscar destinatários padrão: ${error.message}`);
      return [];
    }
  }
}

// Criar e exportar instância única
const notificationService = new NotificationService();
module.exports = notificationService;