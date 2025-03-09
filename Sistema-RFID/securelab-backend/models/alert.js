// models/alert.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, push, query, orderByChild, equalTo, limitToLast } = require('firebase/database');

class Alert {
  // Criar um novo alerta
  static async create(alertData) {
    try {
      // Garantir que o timestamp está presente
      if (!alertData.timestamp) {
        alertData.timestamp = new Date().toISOString();
      }
      
      // Por padrão, o alerta não está resolvido
      if (alertData.resolved === undefined) {
        alertData.resolved = false;
      }
      
      const alertRef = ref(database, 'alerts');
      const newAlertRef = push(alertRef);
      
      await set(newAlertRef, alertData);
      
      return { id: newAlertRef.key, ...alertData };
    } catch (error) {
      throw new Error(`Erro ao criar alerta: ${error.message}`);
    }
  }

  // Obter um alerta pelo ID
  static async getById(alertId) {
    try {
      const snapshot = await get(ref(database, `alerts/${alertId}`));
      if (snapshot.exists()) {
        return { id: alertId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar alerta: ${error.message}`);
    }
  }

  // Atualizar um alerta
  static async update(alertId, alertData) {
    try {
      await update(ref(database, `alerts/${alertId}`), alertData);
      return { id: alertId, ...alertData };
    } catch (error) {
      throw new Error(`Erro ao atualizar alerta: ${error.message}`);
    }
  }

  // Resolver um alerta
  static async resolve(alertId, userId) {
    try {
      const alert = await this.getById(alertId);
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }
      
      if (alert.resolved) {
        return { id: alertId, already_resolved: true };
      }
      
      const now = new Date().toISOString();
      
      await update(ref(database, `alerts/${alertId}`), {
        resolved: true,
        resolved_at: now,
        resolved_by: userId
      });
      
      return { 
        id: alertId, 
        resolved: true, 
        resolved_at: now, 
        resolved_by: userId 
      };
    } catch (error) {
      throw new Error(`Erro ao resolver alerta: ${error.message}`);
    }
  }

  // Excluir um alerta
  static async delete(alertId) {
    try {
      await remove(ref(database, `alerts/${alertId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir alerta: ${error.message}`);
    }
  }

  // Listar todos os alertas (com limite)
  static async getAll(limit = 100) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('timestamp'),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar alertas: ${error.message}`);
    }
  }

  // Buscar alertas não resolvidos
  static async getUnresolved(limit = 50) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('resolved'),
        equalTo(false),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar alertas não resolvidos: ${error.message}`);
    }
  }

  // Buscar alertas por tipo
  static async getByType(type, limit = 50) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('type'),
        equalTo(type),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar alertas por tipo: ${error.message}`);
    }
  }

  // Buscar alertas por severidade
  static async getBySeverity(severity, limit = 50) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('severity'),
        equalTo(severity),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar alertas por severidade: ${error.message}`);
    }
  }

  // Buscar alertas relacionados a um dispositivo específico
  static async getByDevice(deviceId, limit = 50) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('device_id'),
        equalTo(deviceId),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar alertas por dispositivo: ${error.message}`);
    }
  }

  // Buscar alertas relacionados a uma porta específica
  static async getByDoor(doorId, limit = 50) {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('door_id'),
        equalTo(doorId),
        limitToLast(limit)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        const alerts = [];
        snapshot.forEach((childSnapshot) => {
          alerts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar alertas por porta: ${error.message}`);
    }
  }

  // Obter contagem de alertas não resolvidos (para notificações)
  static async getUnresolvedCount() {
    try {
      const alertQuery = query(
        ref(database, 'alerts'),
        orderByChild('resolved'),
        equalTo(false)
      );
      
      const snapshot = await get(alertQuery);
      if (snapshot.exists()) {
        let count = 0;
        snapshot.forEach(() => {
          count++;
        });
        return count;
      }
      return 0;
    } catch (error) {
      throw new Error(`Erro ao contar alertas não resolvidos: ${error.message}`);
    }
  }

  // Resolver vários alertas de uma vez
  static async resolveBulk(alertIds, userId) {
    try {
      const results = {
        success: [],
        errors: []
      };
      
      for (const alertId of alertIds) {
        try {
          const result = await this.resolve(alertId, userId);
          results.success.push(result);
        } catch (error) {
          results.errors.push({
            alertId,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Erro ao resolver alertas em massa: ${error.message}`);
    }
  }
}

module.exports = Alert;