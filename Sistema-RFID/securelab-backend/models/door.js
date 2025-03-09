// models/door.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, query, orderByChild, equalTo } = require('firebase/database');

class Door {
  // Criar uma nova porta
  static async create(doorData) {
    try {
      const doorRef = ref(database, 'doors');
      const newDoorRef = push(doorRef);
      const doorId = newDoorRef.key;
      
      await set(ref(database, `doors/${doorId}`), {
        ...doorData,
        status: doorData.status || 'locked',
        last_status_change: new Date().toISOString()
      });
      
      return { id: doorId, ...doorData };
    } catch (error) {
      throw new Error(`Erro ao criar porta: ${error.message}`);
    }
  }

  // Obter uma porta pelo ID
  static async getById(doorId) {
    try {
      const snapshot = await get(ref(database, `doors/${doorId}`));
      if (snapshot.exists()) {
        return { id: doorId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar porta: ${error.message}`);
    }
  }

  // Atualizar uma porta
  static async update(doorId, doorData) {
    try {
      // Se o status estiver sendo atualizado, registramos a hora da mudança
      if (doorData.status) {
        doorData.last_status_change = new Date().toISOString();
      }
      
      await update(ref(database, `doors/${doorId}`), doorData);
      return { id: doorId, ...doorData };
    } catch (error) {
      throw new Error(`Erro ao atualizar porta: ${error.message}`);
    }
  }

  // Alterar status da porta (trancar/destrancar)
  static async updateStatus(doorId, status, userId) {
    try {
      const doorRef = ref(database, `doors/${doorId}`);
      const snapshot = await get(doorRef);
      
      if (!snapshot.exists()) {
        throw new Error('Porta não encontrada');
      }
      
      const updates = {
        status: status,
        last_status_change: new Date().toISOString(),
        last_modified_by: userId
      };
      
      await update(doorRef, updates);
      
      // Registrar a mudança de status no log
      const logData = {
        timestamp: new Date().toISOString(),
        user_id: userId,
        door_id: doorId,
        door_name: snapshot.val().name,
        action: status === 'locked' ? 'door_locked' : 'door_unlocked',
        method: 'remote'
      };
      
      const logRef = ref(database, 'access_logs');
      await push(logRef, logData);
      
      return { id: doorId, ...snapshot.val(), ...updates };
    } catch (error) {
      throw new Error(`Erro ao alterar status da porta: ${error.message}`);
    }
  }

  // Excluir uma porta
  static async delete(doorId) {
    try {
      await remove(ref(database, `doors/${doorId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir porta: ${error.message}`);
    }
  }

  // Listar todas as portas
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'doors'));
      if (snapshot.exists()) {
        const doors = [];
        snapshot.forEach((childSnapshot) => {
          doors.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return doors;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar portas: ${error.message}`);
    }
  }

  // Buscar portas por localização
  static async getByLocation(location) {
    try {
      const doorQuery = query(
        ref(database, 'doors'),
        orderByChild('location'),
        equalTo(location)
      );
      
      const snapshot = await get(doorQuery);
      if (snapshot.exists()) {
        const doors = [];
        snapshot.forEach((childSnapshot) => {
          doors.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return doors;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar portas por localização: ${error.message}`);
    }
  }

  // Buscar portas por status
  static async getByStatus(status) {
    try {
      const doorQuery = query(
        ref(database, 'doors'),
        orderByChild('status'),
        equalTo(status)
      );
      
      const snapshot = await get(doorQuery);
      if (snapshot.exists()) {
        const doors = [];
        snapshot.forEach((childSnapshot) => {
          doors.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return doors;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar portas por status: ${error.message}`);
    }
  }

  // Verificar acesso de um usuário a uma porta específica
  static async checkAccess(doorId, userId, cardUid) {
    try {
      // Verificar se a porta existe
      const doorSnapshot = await get(ref(database, `doors/${doorId}`));
      if (!doorSnapshot.exists()) {
        return { granted: false, reason: 'door_not_found' };
      }
      
      const door = doorSnapshot.val();
      
      // Verificar se o dispositivo está online
      const deviceSnapshot = await get(ref(database, `devices/${door.device_id}`));
      if (!deviceSnapshot.exists() || deviceSnapshot.val().status !== 'online') {
        return { granted: false, reason: 'device_offline' };
      }
      
      // Verificar permissões do usuário
      const permQuery = query(
        ref(database, 'permissions'),
        orderByChild('user_id'),
        equalTo(userId)
      );
      
      const permSnapshot = await get(permQuery);
      let hasPermission = false;
      
      if (permSnapshot.exists()) {
        permSnapshot.forEach((childSnapshot) => {
          const perm = childSnapshot.val();
          if (perm.door_id === doorId) {
            hasPermission = true;
          }
        });
      }
      
      if (!hasPermission) {
        return { granted: false, reason: 'no_permission' };
      }
      
      // Verificar horário permitido
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = `${now.getHours()}:${now.getMinutes()}`;
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const scheduleKey = isWeekend ? 'weekend' : 'weekdays';
      
      if (door.allowed_schedules && door.allowed_schedules[scheduleKey]) {
        const schedule = door.allowed_schedules[scheduleKey];
        if (currentTime < schedule.start || currentTime > schedule.end) {
          return { granted: false, reason: 'outside_schedule' };
        }
      }
      
      return { granted: true };
    } catch (error) {
      throw new Error(`Erro ao verificar acesso: ${error.message}`);
    }
  }
}

module.exports = Door;