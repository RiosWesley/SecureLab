// models/device.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, push, query, orderByChild, equalTo } = require('firebase/database');

class Device {
  // Criar um novo dispositivo
  static async create(deviceData) {
    try {
      const deviceRef = ref(database, 'devices');
      const newDeviceRef = push(deviceRef);
      const deviceId = newDeviceRef.key;
      
      await set(ref(database, `devices/${deviceId}`), {
        ...deviceData,
        status: 'offline',
        last_online: null,
        firmware_version: deviceData.firmware_version || '1.0.0'
      });
      
      return { id: deviceId, ...deviceData };
    } catch (error) {
      throw new Error(`Erro ao criar dispositivo: ${error.message}`);
    }
  }

  // Obter um dispositivo pelo ID
  static async getById(deviceId) {
    try {
      const snapshot = await get(ref(database, `devices/${deviceId}`));
      if (snapshot.exists()) {
        return { id: deviceId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar dispositivo: ${error.message}`);
    }
  }

  // Atualizar um dispositivo
  static async update(deviceId, deviceData) {
    try {
      await update(ref(database, `devices/${deviceId}`), deviceData);
      return { id: deviceId, ...deviceData };
    } catch (error) {
      throw new Error(`Erro ao atualizar dispositivo: ${error.message}`);
    }
  }

  // Atualizar status do dispositivo (online/offline)
  static async updateStatus(deviceId, status, additionalData = {}) {
    try {
      const now = new Date().toISOString();
      const updates = {
        status: status,
        ...additionalData
      };
      
      if (status === 'online') {
        updates.last_online = now;
      }
      
      await update(ref(database, `devices/${deviceId}`), updates);
      
      // Se o dispositivo ficou offline, gerar um alerta
      if (status === 'offline') {
        const deviceSnapshot = await get(ref(database, `devices/${deviceId}`));
        if (deviceSnapshot.exists()) {
          const device = deviceSnapshot.val();
          
          // Criar alerta para dispositivo offline
          const alertData = {
            timestamp: now,
            type: 'device_offline',
            severity: 'warning',
            message: `Dispositivo offline: ${device.name}`,
            device_id: deviceId,
            resolved: false
          };
          
          const alertRef = ref(database, 'alerts');
          await push(alertRef, alertData);
        }
      }
      
      return { id: deviceId, status, last_update: now };
    } catch (error) {
      throw new Error(`Erro ao atualizar status do dispositivo: ${error.message}`);
    }
  }

  // Excluir um dispositivo
  static async delete(deviceId) {
    try {
      await remove(ref(database, `devices/${deviceId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir dispositivo: ${error.message}`);
    }
  }

  // Listar todos os dispositivos
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'devices'));
      if (snapshot.exists()) {
        const devices = [];
        snapshot.forEach((childSnapshot) => {
          devices.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return devices;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar dispositivos: ${error.message}`);
    }
  }

  // Buscar dispositivos por status
  static async getByStatus(status) {
    try {
      const deviceQuery = query(
        ref(database, 'devices'),
        orderByChild('status'),
        equalTo(status)
      );
      
      const snapshot = await get(deviceQuery);
      if (snapshot.exists()) {
        const devices = [];
        snapshot.forEach((childSnapshot) => {
          devices.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return devices;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar dispositivos por status: ${error.message}`);
    }
  }

  // Buscar dispositivo por endereço MAC
  static async getByMacAddress(macAddress) {
    try {
      const deviceQuery = query(
        ref(database, 'devices'),
        orderByChild('mac_address'),
        equalTo(macAddress)
      );
      
      const snapshot = await get(deviceQuery);
      if (snapshot.exists()) {
        let device = null;
        snapshot.forEach((childSnapshot) => {
          device = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
        });
        return device;
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar dispositivo por endereço MAC: ${error.message}`);
    }
  }

  // Atualizar as estatísticas do dispositivo (heartbeat)
  static async updateHeartbeat(deviceId, stats) {
    try {
      const now = new Date().toISOString();
      const updates = {
        last_online: now,
        status: 'online',
        ...stats
      };
      
      await update(ref(database, `devices/${deviceId}`), updates);
      
      return { id: deviceId, ...updates };
    } catch (error) {
      throw new Error(`Erro ao atualizar heartbeat do dispositivo: ${error.message}`);
    }
  }

  // Registrar nova versão de firmware
  static async registerFirmwareUpdate(deviceId, version) {
    try {
      const updates = {
        firmware_version: version,
        last_firmware_update: new Date().toISOString()
      };
      
      await update(ref(database, `devices/${deviceId}`), updates);
      
      return { id: deviceId, ...updates };
    } catch (error) {
      throw new Error(`Erro ao registrar atualização de firmware: ${error.message}`);
    }
  }

  // Buscar dispositivos por porta
  static async getByDoor(doorId) {
    try {
      const deviceQuery = query(
        ref(database, 'devices'),
        orderByChild('door_id'),
        equalTo(doorId)
      );
      
      const snapshot = await get(deviceQuery);
      if (snapshot.exists()) {
        const devices = [];
        snapshot.forEach((childSnapshot) => {
          devices.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return devices;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar dispositivos por porta: ${error.message}`);
    }
  }
}

module.exports = Device;