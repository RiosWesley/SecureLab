// models/accessLog.js
const { database } = require('../config/firebase');
const { ref, get, push, query, orderByChild, equalTo, limitToLast, startAt, endAt } = require('firebase/database');
const User = require('./user');
const Door = require('./door');

class AccessLog {
  // Criar um novo registro de log
  static async create(logData) {
    try {
      // Garantir que o timestamp está presente
      if (!logData.timestamp) {
        logData.timestamp = new Date().toISOString();
      }
      
      // Se tivermos o UID do usuário, vamos buscar mais informações
      if (logData.user_id && !logData.user_name) {
        const user = await User.getById(logData.user_id);
        if (user) {
          logData.user_name = user.name;
        }
      }
      
      // Se tivermos o ID da porta, vamos buscar mais informações
      if (logData.door_id && !logData.door_name) {
        const door = await Door.getById(logData.door_id);
        if (door) {
          logData.door_name = door.name;
        }
      }
      
      const logRef = ref(database, 'access_logs');
      const newLogRef = push(logRef);
      await set(newLogRef, logData);
      
      // Verificar se é uma tentativa de acesso negado não autorizada
      if (logData.action === 'access_denied' && logData.reason === 'unauthorized_card') {
        // Criar um alerta para tentativa de acesso não autorizado
        const alertData = {
          timestamp: logData.timestamp,
          type: 'unauthorized_access',
          severity: 'medium',
          message: 'Tentativa de acesso não autorizado',
          door_id: logData.door_id,
          door_name: logData.door_name,
          device_id: logData.device_id,
          card_uid: logData.card_uid,
          resolved: false
        };
        
        const alertRef = ref(database, 'alerts');
        await push(alertRef, alertData);
      }
      
      return { id: newLogRef.key, ...logData };
    } catch (error) {
      throw new Error(`Erro ao criar registro de log: ${error.message}`);
    }
  }

  // Obter um log pelo ID
  static async getById(logId) {
    try {
      const snapshot = await get(ref(database, `access_logs/${logId}`));
      if (snapshot.exists()) {
        return { id: logId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar log: ${error.message}`);
    }
  }

  // Listar todos os logs (com limite)
  static async getAll(limit = 100) {
    try {
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('timestamp'),
        limitToLast(limit)
      );
      
      const snapshot = await get(logQuery);
      if (snapshot.exists()) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
          logs.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar logs: ${error.message}`);
    }
  }

  // Buscar logs por usuário
  static async getByUser(userId, limit = 50) {
    try {
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('user_id'),
        equalTo(userId),
        limitToLast(limit)
      );
      
      const snapshot = await get(logQuery);
      if (snapshot.exists()) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
          logs.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar logs por usuário: ${error.message}`);
    }
  }

  // Buscar logs por porta
  static async getByDoor(doorId, limit = 50) {
    try {
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('door_id'),
        equalTo(doorId),
        limitToLast(limit)
      );
      
      const snapshot = await get(logQuery);
      if (snapshot.exists()) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
          logs.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar logs por porta: ${error.message}`);
    }
  }

  // Buscar logs por tipo de ação
  static async getByAction(action, limit = 50) {
    try {
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('action'),
        equalTo(action),
        limitToLast(limit)
      );
      
      const snapshot = await get(logQuery);
      if (snapshot.exists()) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
          logs.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar logs por ação: ${error.message}`);
    }
  }

  // Buscar logs por intervalo de data
  static async getByDateRange(startDate, endDate, limit = 100) {
    try {
      // Converter datas para string ISO se necessário
      const start = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
      const end = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();
      
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('timestamp'),
        startAt(start),
        endAt(end),
        limitToLast(limit)
      );
      
      const snapshot = await get(logQuery);
      if (snapshot.exists()) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
          logs.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Ordenar por timestamp, do mais recente para o mais antigo
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar logs por intervalo de data: ${error.message}`);
    }
  }

  // Obter estatísticas de acesso para dashboard
  static async getAccessStats(days = 7) {
    try {
      // Calcular a data de início (X dias atrás)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();
      
      // Buscar logs a partir desta data
      const logQuery = query(
        ref(database, 'access_logs'),
        orderByChild('timestamp'),
        startAt(startDateStr)
      );
      
      const snapshot = await get(logQuery);
      
      // Estatísticas a serem calculadas
      const stats = {
        total: 0,
        granted: 0,
        denied: 0,
        byDoor: {},
        byDay: {},
        byHour: {}
      };
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const log = childSnapshot.val();
          stats.total++;
          
          // Contar acessos concedidos vs negados
          if (log.action === 'access_granted') {
            stats.granted++;
          } else if (log.action === 'access_denied') {
            stats.denied++;
          }
          
          // Agrupar por porta
          const doorId = log.door_id;
          if (doorId) {
            if (!stats.byDoor[doorId]) {
              stats.byDoor[doorId] = {
                name: log.door_name || doorId,
                total: 0,
                granted: 0,
                denied: 0
              };
            }
            stats.byDoor[doorId].total++;
            if (log.action === 'access_granted') {
              stats.byDoor[doorId].granted++;
            } else if (log.action === 'access_denied') {
              stats.byDoor[doorId].denied++;
            }
          }
          
          // Agrupar por dia
          const date = new Date(log.timestamp);
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          if (!stats.byDay[dayKey]) {
            stats.byDay[dayKey] = { total: 0, granted: 0, denied: 0 };
          }
          stats.byDay[dayKey].total++;
          if (log.action === 'access_granted') {
            stats.byDay[dayKey].granted++;
          } else if (log.action === 'access_denied') {
            stats.byDay[dayKey].denied++;
          }
          
          // Agrupar por hora do dia
          const hour = date.getHours();
          if (!stats.byHour[hour]) {
            stats.byHour[hour] = { total: 0, granted: 0, denied: 0 };
          }
          stats.byHour[hour].total++;
          if (log.action === 'access_granted') {
            stats.byHour[hour].granted++;
          } else if (log.action === 'access_denied') {
            stats.byHour[hour].denied++;
          }
        });
      }
      
      return stats;
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas de acesso: ${error.message}`);
    }
  }
}

module.exports = AccessLog;