// models/permission.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, push, query, orderByChild, equalTo } = require('firebase/database');
const User = require('./user');
const Door = require('./door');

class Permission {
  // Criar uma nova permissão
  static async create(permissionData) {
    try {
      // Validar se o usuário existe
      const user = await User.getById(permissionData.user_id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Validar se a porta existe
      const door = await Door.getById(permissionData.door_id);
      if (!door) {
        throw new Error('Porta não encontrada');
      }
      
      // Verificar se já existe uma permissão para este usuário/porta
      const existingPerm = await this.getByUserAndDoor(
        permissionData.user_id, 
        permissionData.door_id
      );
      
      if (existingPerm) {
        throw new Error('Permissão já existe para este usuário/porta');
      }
      
      // Adicionar timestamp e outros campos padrão
      const now = new Date().toISOString();
      const permissionWithDefaults = {
        ...permissionData,
        granted_at: now,
        last_modified: now
      };
      
      const permRef = ref(database, 'permissions');
      const newPermRef = push(permRef);
      await set(newPermRef, permissionWithDefaults);
      
      return { id: newPermRef.key, ...permissionWithDefaults };
    } catch (error) {
      throw new Error(`Erro ao criar permissão: ${error.message}`);
    }
  }

  // Obter uma permissão pelo ID
  static async getById(permissionId) {
    try {
      const snapshot = await get(ref(database, `permissions/${permissionId}`));
      if (snapshot.exists()) {
        return { id: permissionId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar permissão: ${error.message}`);
    }
  }

  // Atualizar uma permissão
  static async update(permissionId, permissionData) {
    try {
      // Adicionar timestamp de modificação
      const updatedData = {
        ...permissionData,
        last_modified: new Date().toISOString()
      };
      
      await update(ref(database, `permissions/${permissionId}`), updatedData);
      return { id: permissionId, ...updatedData };
    } catch (error) {
      throw new Error(`Erro ao atualizar permissão: ${error.message}`);
    }
  }

  // Remover uma permissão
  static async delete(permissionId) {
    try {
      await remove(ref(database, `permissions/${permissionId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir permissão: ${error.message}`);
    }
  }

  // Listar todas as permissões
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'permissions'));
      if (snapshot.exists()) {
        const permissions = [];
        snapshot.forEach((childSnapshot) => {
          permissions.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return permissions;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar permissões: ${error.message}`);
    }
  }

  // Buscar permissões por usuário
  static async getByUser(userId) {
    try {
      const permQuery = query(
        ref(database, 'permissions'),
        orderByChild('user_id'),
        equalTo(userId)
      );
      
      const snapshot = await get(permQuery);
      if (snapshot.exists()) {
        const permissions = [];
        snapshot.forEach((childSnapshot) => {
          permissions.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return permissions;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar permissões por usuário: ${error.message}`);
    }
  }

  // Buscar permissões por porta
  static async getByDoor(doorId) {
    try {
      const permQuery = query(
        ref(database, 'permissions'),
        orderByChild('door_id'),
        equalTo(doorId)
      );
      
      const snapshot = await get(permQuery);
      if (snapshot.exists()) {
        const permissions = [];
        snapshot.forEach((childSnapshot) => {
          permissions.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return permissions;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao buscar permissões por porta: ${error.message}`);
    }
  }

  // Buscar permissão específica por usuário e porta
  static async getByUserAndDoor(userId, doorId) {
    try {
      const permQuery = query(
        ref(database, 'permissions'),
        orderByChild('user_id'),
        equalTo(userId)
      );
      
      const snapshot = await get(permQuery);
      if (snapshot.exists()) {
        let foundPermission = null;
        snapshot.forEach((childSnapshot) => {
          const perm = childSnapshot.val();
          if (perm.door_id === doorId) {
            foundPermission = {
              id: childSnapshot.key,
              ...perm
            };
          }
        });
        return foundPermission;
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar permissão por usuário e porta: ${error.message}`);
    }
  }

  // Verificar se um usuário tem acesso a uma porta específica
  static async checkUserAccess(userId, doorId) {
    try {
      // Verificar permissão direta
      const permission = await this.getByUserAndDoor(userId, doorId);
      if (permission) {
        // Verificar se a permissão não expirou
        if (permission.expires_at) {
          const now = new Date();
          const expiryDate = new Date(permission.expires_at);
          if (now > expiryDate) {
            return { allowed: false, reason: 'permission_expired' };
          }
        }
        
        return { 
          allowed: true, 
          accessLevel: permission.access_level,
          canUnlockRemotely: permission.can_unlock_remotely,
          scheduleOverride: permission.schedule_override
        };
      }
      
      // Verificar permissões de grupo
      const userSnapshot = await get(ref(database, `users/${userId}`));
      if (!userSnapshot.exists()) {
        return { allowed: false, reason: 'user_not_found' };
      }
      
      const userData = userSnapshot.val();
      
      // Verificar se o usuário é um administrador (tem acesso completo)
      if (userData.role === 'admin') {
        return { 
          allowed: true, 
          accessLevel: 'admin',
          canUnlockRemotely: true,
          scheduleOverride: true,
          source: 'admin_role'
        };
      }
      
      // Verificar permissões por grupo
      const groupsRef = ref(database, 'groups');
      const groupsSnapshot = await get(groupsRef);
      
      if (groupsSnapshot.exists()) {
        let groupAccess = null;
        
        groupsSnapshot.forEach((groupSnapshot) => {
          const group = groupSnapshot.val();
          
          // Verificar se o usuário pertence a este grupo
          if (group.members && group.members[userId]) {
            // Verificar se o grupo tem acesso à porta
            if (group.doors && group.doors[doorId]) {
              const doorConfig = group.doors[doorId];
              
              groupAccess = { 
                allowed: true, 
                accessLevel: doorConfig.access_level || 'user',
                canUnlockRemotely: doorConfig.can_unlock_remotely || false,
                scheduleOverride: doorConfig.schedule_override || false,
                source: 'group_membership',
                groupId: groupSnapshot.key,
                groupName: group.name
              };
            }
          }
        });
        
        if (groupAccess) {
          return groupAccess;
        }
      }
      
      return { allowed: false, reason: 'no_permission' };
    } catch (error) {
      throw new Error(`Erro ao verificar acesso: ${error.message}`);
    }
  }

  // Conceder permissão em massa para vários usuários ou várias portas
  static async grantBulkPermissions(permissions, grantedBy) {
    try {
      const results = {
        success: [],
        errors: []
      };
      
      for (const perm of permissions) {
        try {
          const permissionData = {
            ...perm,
            granted_by: grantedBy
          };
          
          const newPermission = await this.create(permissionData);
          results.success.push(newPermission);
        } catch (error) {
          results.errors.push({
            permissionData: perm,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Erro ao conceder permissões em massa: ${error.message}`);
    }
  }
}

module.exports = Permission;