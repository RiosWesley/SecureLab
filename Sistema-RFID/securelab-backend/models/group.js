// models/group.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, push } = require('firebase/database');
const User = require('./user');
const Door = require('./door');

class Group {
  // Criar um novo grupo
  static async create(groupData) {
    try {
      const groupRef = ref(database, 'groups');
      const newGroupRef = push(groupRef);
      const groupId = newGroupRef.key;
      
      // Formato da estrutura de membros e portas
      const formattedGroup = {
        name: groupData.name,
        description: groupData.description || '',
        created_at: new Date().toISOString(),
        created_by: groupData.created_by,
        members: {},
        doors: {}
      };
      
      // Adicionar membros ao grupo, se fornecidos
      if (groupData.members && Array.isArray(groupData.members)) {
        for (const userId of groupData.members) {
          // Verificar se o usuário existe
          const user = await User.getById(userId);
          if (user) {
            formattedGroup.members[userId] = true;
          }
        }
      }
      
      // Adicionar portas ao grupo, se fornecidas
      if (groupData.doors && typeof groupData.doors === 'object') {
        for (const [doorId, doorConfig] of Object.entries(groupData.doors)) {
          // Verificar se a porta existe
          const door = await Door.getById(doorId);
          if (door) {
            formattedGroup.doors[doorId] = {
              access_level: doorConfig.access_level || 'user',
              can_unlock_remotely: doorConfig.can_unlock_remotely || false,
              schedule_override: doorConfig.schedule_override || false
            };
          }
        }
      }
      
      await set(ref(database, `groups/${groupId}`), formattedGroup);
      
      return { id: groupId, ...formattedGroup };
    } catch (error) {
      throw new Error(`Erro ao criar grupo: ${error.message}`);
    }
  }

  // Obter um grupo pelo ID
  static async getById(groupId) {
    try {
      const snapshot = await get(ref(database, `groups/${groupId}`));
      if (snapshot.exists()) {
        return { id: groupId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar grupo: ${error.message}`);
    }
  }

  // Atualizar um grupo
  static async update(groupId, groupData) {
    try {
      // Não permitir atualização direta de membros e portas através deste método
      // para evitar sobrescrever dados acidentalmente
      const { members, doors, ...otherData } = groupData;
      
      otherData.updated_at = new Date().toISOString();
      
      await update(ref(database, `groups/${groupId}`), otherData);
      return { id: groupId, ...otherData };
    } catch (error) {
      throw new Error(`Erro ao atualizar grupo: ${error.message}`);
    }
  }

  // Excluir um grupo
  static async delete(groupId) {
    try {
      await remove(ref(database, `groups/${groupId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir grupo: ${error.message}`);
    }
  }

  // Listar todos os grupos
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'groups'));
      if (snapshot.exists()) {
        const groups = [];
        snapshot.forEach((childSnapshot) => {
          groups.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return groups;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar grupos: ${error.message}`);
    }
  }

  // Adicionar um membro ao grupo
  static async addMember(groupId, userId) {
    try {
      // Verificar se o usuário existe
      const user = await User.getById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verificar se o grupo existe
      const group = await this.getById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }
      
      await update(ref(database, `groups/${groupId}/members/${userId}`), true);
      
      return { success: true, groupId, userId };
    } catch (error) {
      throw new Error(`Erro ao adicionar membro ao grupo: ${error.message}`);
    }
  }

  // Remover um membro do grupo
  static async removeMember(groupId, userId) {
    try {
      await remove(ref(database, `groups/${groupId}/members/${userId}`));
      return { success: true, groupId, userId };
    } catch (error) {
      throw new Error(`Erro ao remover membro do grupo: ${error.message}`);
    }
  }

  // Adicionar acesso a uma porta para o grupo
  static async addDoorAccess(groupId, doorId, accessConfig) {
    try {
      // Verificar se a porta existe
      const door = await Door.getById(doorId);
      if (!door) {
        throw new Error('Porta não encontrada');
      }
      
      // Verificar se o grupo existe
      const group = await this.getById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }
      
      const doorConfig = {
        access_level: accessConfig.access_level || 'user',
        can_unlock_remotely: accessConfig.can_unlock_remotely || false,
        schedule_override: accessConfig.schedule_override || false
      };
      
      await set(ref(database, `groups/${groupId}/doors/${doorId}`), doorConfig);
      
      return { success: true, groupId, doorId, config: doorConfig };
    } catch (error) {
      throw new Error(`Erro ao adicionar acesso a porta para o grupo: ${error.message}`);
    }
  }

  // Remover acesso a uma porta para o grupo
  static async removeDoorAccess(groupId, doorId) {
    try {
      await remove(ref(database, `groups/${groupId}/doors/${doorId}`));
      return { success: true, groupId, doorId };
    } catch (error) {
      throw new Error(`Erro ao remover acesso a porta para o grupo: ${error.message}`);
    }
  }

  // Buscar grupos que um usuário pertence
  static async getUserGroups(userId) {
    try {
      const groups = await this.getAll();
      return groups.filter(group => group.members && group.members[userId]);
    } catch (error) {
      throw new Error(`Erro ao buscar grupos do usuário: ${error.message}`);
    }
  }

  // Buscar grupos que têm acesso a uma porta específica
  static async getDoorGroups(doorId) {
    try {
      const groups = await this.getAll();
      return groups.filter(group => group.doors && group.doors[doorId]);
    } catch (error) {
      throw new Error(`Erro ao buscar grupos com acesso à porta: ${error.message}`);
    }
  }
}

module.exports = Group;