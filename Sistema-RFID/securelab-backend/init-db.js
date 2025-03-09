// init-db.js
require('dotenv').config();
const { database } = require('./config/firebase');
const { ref, set } = require('firebase/database');

async function initializeDatabase() {
  console.log('Inicializando banco de dados com dados de exemplo...');

  // Dados de exemplo
  const mockData = {
    users: {
      user1: {
        name: "Administrador",
        email: "admin@securelab.com",
        role: "admin",
        department: "TI",
        status: "active",
        created_at: "2025-03-09T00:00:00Z"
      },
      user2: {
        name: "Ana Silva",
        email: "ana@securelab.com",
        role: "user",
        department: "Pesquisa",
        status: "active",
        created_at: "2025-03-09T00:00:00Z"
      },
      user3: {
        name: "Carlos Souza",
        email: "carlos@securelab.com",
        role: "user",
        department: "Laboratório",
        status: "active",
        created_at: "2025-03-09T00:00:00Z"
      }
    },
    doors: {
      door1: {
        name: "Entrada Principal",
        location: "Térreo",
        status: "locked",
        device_id: "device1",
        last_status_change: "2025-03-09T14:30:00Z"
      },
      door2: {
        name: "Laboratório 1",
        location: "1º Andar",
        status: "unlocked",
        device_id: "device2",
        last_status_change: "2025-03-09T13:15:00Z"
      },
      door3: {
        name: "Laboratório 2",
        location: "1º Andar",
        status: "locked",
        device_id: "device3",
        last_status_change: "2025-03-09T12:45:00Z"
      }
    },
    devices: {
      device1: {
        name: "Leitor Entrada Principal",
        status: "online",
        door_id: "door1",
        firmware_version: "1.1.0",
        last_online: "2025-03-09T16:25:00Z"
      },
      device2: {
        name: "Leitor Laboratório 1",
        status: "online",
        door_id: "door2",
        firmware_version: "1.1.0",
        last_online: "2025-03-09T16:24:00Z"
      },
      device3: {
        name: "Leitor Laboratório 2",
        status: "online",
        door_id: "door3",
        firmware_version: "1.1.0",
        last_online: "2025-03-09T16:23:00Z"
      }
    },
    access_logs: {
      log1: {
        timestamp: "2025-03-09T16:20:00Z",
        user_id: "user2",
        user_name: "Ana Silva",
        door_id: "door1",
        door_name: "Entrada Principal",
        action: "access_granted",
        method: "rfid"
      },
      log2: {
        timestamp: "2025-03-09T16:05:00Z",
        user_id: "user3",
        user_name: "Carlos Souza",
        door_id: "door2",
        door_name: "Laboratório 1",
        action: "access_granted",
        method: "rfid"
      },
      log3: {
        timestamp: "2025-03-09T15:45:00Z",
        user_id: "user3",
        user_name: "Carlos Souza",
        door_id: "door3",
        door_name: "Laboratório 2",
        action: "access_denied",
        reason: "unauthorized",
        method: "rfid"
      }
    }
  };

  try {
    // Inserir dados no Firebase
    for (const [key, value] of Object.entries(mockData)) {
      await set(ref(database, key), value);
      console.log(`Dados inseridos para: ${key}`);
    }

    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
}

// Executar a inicialização
initializeDatabase()
  .then(() => {
    console.log('Processo de inicialização concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('Falha no processo de inicialização:', error);
    process.exit(1);
  });