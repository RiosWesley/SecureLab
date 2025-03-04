// models/settings.js
const { database } = require('../config/firebase');
const { ref, set, get, update } = require('firebase/database');

class Settings {
  // Obter todas as configurações
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'settings'));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return this.getDefaultSettings();
    } catch (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }
  }

  // Obter uma categoria específica de configurações
  static async getCategory(category) {
    try {
      const snapshot = await get(ref(database, `settings/${category}`));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Retornar configurações padrão para esta categoria
      const defaults = this.getDefaultSettings();
      return defaults[category] || {};
    } catch (error) {
      throw new Error(`Erro ao buscar categoria de configurações: ${error.message}`);
    }
  }

  // Atualizar configurações (categoria completa)
  static async updateCategory(category, data) {
    try {
      await set(ref(database, `settings/${category}`), data);
      
      // Registrar atualização
      await this.logSettingsChange(category, data);
      
      return { category, ...data };
    } catch (error) {
      throw new Error(`Erro ao atualizar configurações: ${error.message}`);
    }
  }

  // Atualizar configuração específica dentro de uma categoria
  static async updateSetting(category, key, value) {
    try {
      await update(ref(database, `settings/${category}`), { [key]: value });
      
      // Registrar atualização
      await this.logSettingsChange(category, { [key]: value });
      
      return { category, key, value };
    } catch (error) {
      throw new Error(`Erro ao atualizar configuração: ${error.message}`);
    }
  }

  // Redefinir configurações para valores padrão
  static async resetToDefault(category = null) {
    try {
      const defaults = this.getDefaultSettings();
      
      if (category) {
        // Redefinir apenas uma categoria
        if (defaults[category]) {
          await set(ref(database, `settings/${category}`), defaults[category]);
          return { [category]: defaults[category] };
        }
        throw new Error(`Categoria de configurações inválida: ${category}`);
      } else {
        // Redefinir todas as configurações
        await set(ref(database, 'settings'), defaults);
        return defaults;
      }
    } catch (error) {
      throw new Error(`Erro ao redefinir configurações: ${error.message}`);
    }
  }

  // Registrar alterações de configurações
  static async logSettingsChange(category, changes) {
    try {
      const now = new Date().toISOString();
      const logData = {
        timestamp: now,
        category,
        changes
      };
      
      // Registrar no histórico de configurações
      await set(ref(database, `settings_history/${now.replace(/[.:]/g, '_')}`), logData);
      
      return true;
    } catch (error) {
      console.error(`Erro ao registrar alteração de configurações: ${error.message}`);
      return false;
    }
  }

  // Obter histórico de alterações de configurações
  static async getChangeHistory(limit = 20) {
    try {
      const snapshot = await get(ref(database, 'settings_history'));
      if (snapshot.exists()) {
        const history = [];
        snapshot.forEach((childSnapshot) => {
          history.push(childSnapshot.val());
        });
        
        // Ordenar por timestamp (mais recente primeiro) e limitar quantidade
        return history
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar histórico de configurações: ${error.message}`);
    }
  }

  // Configurações padrão do sistema
  static getDefaultSettings() {
    return {
      // Configurações gerais
      general: {
        system_name: 'SecureLab RFID',
        organization_name: 'SecureLab',
        timezone: 'America/Sao_Paulo',
        date_format: 'DD/MM/YYYY',
        time_format: '24h'
      },
      
      // Configurações de segurança
      security: {
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_number: true,
        password_require_special: true,
        account_lock_attempts: 5,
        account_lock_duration: 30, // minutos
        session_timeout: 60, // minutos
        jwt_expiration: 24, // horas
        enable_2fa: false
      },
      
      // Configurações de email
      email: {
        smtp_server: '',
        smtp_port: 587,
        smtp_secure: true,
        smtp_user: '',
        smtp_password: '',
        from_name: 'SecureLab RFID',
        from_email: 'noreply@securelab.com',
        admin_notifications: false,
        notify_on_access_denied: false,
        notify_on_device_offline: true
      },
      
      // Configurações de acesso
      access: {
        default_auto_lock_delay: 30, // segundos
        default_access_schedule_weekdays: {
          start: '08:00',
          end: '18:00'
        },
        default_access_schedule_weekend: {
          start: '09:00',
          end: '13:00'
        },
        require_confirmation_for_remote_unlock: true,
        log_retention_days: 90,
        alert_on_multiple_denials: true,
        multiple_denials_threshold: 3
      },
      
      // Configurações MQTT
      mqtt: {
        broker_url: 'mqtt://localhost:1883',
        username: '',
        password: '',
        topic_prefix: 'securelab',
        qos: 1,
        retain: false,
        clean_session: true,
        heartbeat_interval: 60, // segundos
        offline_threshold: 180 // segundos
      },
      
      // Configurações de notificações
      notifications: {
        enable_push: false,
        enable_email: false,
        enable_web: true,
        notify_on_access_denied: true,
        notify_on_device_offline: true,
        notify_on_low_battery: true,
        notify_on_door_left_open: true,
        door_left_open_threshold: 60 // segundos
      },
      
      // Configurações de interface
      ui: {
        theme: 'light',
        sidebar_collapsed: false,
        items_per_page: 10,
        dashboard_refresh_interval: 60, // segundos
        enable_animations: true
      }
    };
  }
}

module.exports = Settings;