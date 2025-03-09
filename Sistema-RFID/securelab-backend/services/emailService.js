// services/emailService.js
const nodemailer = require('nodemailer');
const Settings = require('../models/settings');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = null;
    this.isInitialized = false;
    this.initializeAsync();
  }

  async initializeAsync() {
    try {
      this.settings = await Settings.getCategory('email');
      this.initializeTransporter();
      this.isInitialized = true;
      logger.info('Serviço de email inicializado com sucesso');
    } catch (error) {
      logger.error(`Erro ao inicializar serviço de email: ${error.message}`);
    }
  }

  initializeTransporter() {
    if (!this.settings.smtp_server || !this.settings.smtp_user) {
      logger.warn('Configurações de SMTP incompletas');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.settings.smtp_server,
      port: this.settings.smtp_port || 587,
      secure: this.settings.smtp_secure || false,
      auth: {
        user: this.settings.smtp_user,
        pass: this.settings.smtp_password
      }
    });
  }

  async reloadSettings() {
    this.settings = await Settings.getCategory('email');
    this.initializeTransporter();
  }

  async sendEmail({ to, subject, body, html, attachments = [], data = {} }) {
    if (!this.isInitialized) {
      await this.initializeAsync();
    }

    if (!this.transporter) {
      throw new Error('Serviço de email não configurado');
    }

    try {
      const mailOptions = {
        from: `"${this.settings.from_name}" <${this.settings.from_email}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        text: body,
        attachments
      };

      if (html) {
        mailOptions.html = html;
      } else {
        mailOptions.html = this.formatEmailHtml(body, data);
      }

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado para ${to}: ${subject}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Erro ao enviar email: ${error.message}`);
      throw error;
    }
  }

  formatEmailHtml(body, data) {
    let htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background: #f8f9fa; padding: 20px; border-bottom: 3px solid #007bff;">
          <h2 style="margin: 0; color: #007bff;">SecureLab RFID</h2>
        </div>
        <div style="padding: 20px;">
          ${body.replace(/\n/g, '<br>')}
        </div>
        <div style="background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
          <p>Esta é uma mensagem automática do sistema SecureLab RFID.</p>
        </div>
      </div>
    `;
    return htmlBody;
  }

  async sendTestEmail(recipient) {
    return this.sendEmail({
      to: recipient,
      subject: 'Teste de Email - SecureLab RFID',
      body: `Este é um email de teste do sistema SecureLab RFID.\n\nHora do envio: ${new Date().toLocaleString()}`
    });
  }

  async sendAlertEmail(recipient, alert) {
    const severity = {
      low: '🔵 Baixa',
      medium: '🟡 Média',
      high: '🟠 Alta',
      critical: '🔴 Crítica'
    };

    return this.sendEmail({
      to: recipient,
      subject: `Alerta [${severity[alert.severity] || alert.severity}] - ${alert.type}`,
      body: `Um novo alerta foi registrado no sistema:\n\nTipo: ${alert.type}\nMensagem: ${alert.message}\nSeveridade: ${severity[alert.severity] || alert.severity}\nData/Hora: ${new Date(alert.timestamp).toLocaleString()}`,
      data: { alert }
    });
  }
}

const emailService = new EmailService();
module.exports = emailService;