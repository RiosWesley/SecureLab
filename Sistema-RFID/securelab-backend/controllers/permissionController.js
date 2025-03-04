// controllers/permissionController.js
const Permission = require('../models/permission');
const User = require('../models/user');
const Door = require('../models/door');
const AccessLog = require('../models/accessLog');

/**
 * Listar todas as permissões
 * @route GET /api/permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.getAll();
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      permissions
    });
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar permissões',
      error: error.message
    });
  }
};

/**
 * Obter permissão específica pelo ID
 * @route GET /api/permissions/:id
 */
exports.getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.getById(id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permissão não encontrada'
      });
    }
    
    // Buscar informações do usuário e da porta
    const user = await User.getById(permission.user_id);
    const door = await Door.getById(permission.door_id);
    
    res.status(200).json({
      success: true,
      permission,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department
      } : null,
      door: door ? {
        id: door.id,
        name: door.name,
        location: door.location
      } : null
    });
  } catch (error) {
    console.error('Erro ao buscar permissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar permissão',
      error: error.message
    });
  }
};

/**
 * Criar nova permissão
 * @route POST /api/permissions
 */
exports.createPermission = async (req, res) => {
  try {
    const {
      user_id,
      door_id,
      access_level = 'user',
      can_unlock_remotely = false,
      schedule_override = false,
      expires_at = null
    } = req.body;
    
    // Validar campos obrigatórios
    if (!user_id || !door_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário e ID da porta são obrigatórios'
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.getById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(door_id);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Verificar se já existe uma permissão para este par usuário/porta
    const existingPermission = await Permission.getByUserAndDoor(user_id, door_id);
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma permissão para este usuário nesta porta'
      });
    }
    
    // Criar permissão
    const permissionData = {
      user_id,
      door_id,
      access_level,
      can_unlock_remotely,
      schedule_override,
      expires_at,
      granted_by: req.user.id,
      granted_at: new Date().toISOString()
    };
    
    const newPermission = await Permission.create(permissionData);
    
    // Registrar a concessão de permissão no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'permission_granted',
      details: `Permissão concedida para ${user.name} na porta ${door.name}`,
      door_id: door_id,
      door_name: door.name
    });
    
    res.status(201).json({
      success: true,
      message: 'Permissão criada com sucesso',
      permission: newPermission
    });
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar permissão',
      error: error.message
    });
  }
};

/**
 * Atualizar permissão existente
 * @route PUT /api/permissions/:id
 */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      access_level,
      can_unlock_remotely,
      schedule_override,
      expires_at
    } = req.body;
    
    // Verificar se a permissão existe
    const permission = await Permission.getById(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permissão não encontrada'
      });
    }
    
    // Preparar dados para atualização
    const updates = {};
    
    if (access_level !== undefined) updates.access_level = access_level;
    if (can_unlock_remotely !== undefined) updates.can_unlock_remotely = can_unlock_remotely;
    if (schedule_override !== undefined) updates.schedule_override = schedule_override;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    
    updates.last_modified = new Date().toISOString();
    updates.modified_by = req.user.id;
    
    // Atualizar permissão
    const updatedPermission = await Permission.update(id, updates);
    
    // Buscar detalhes do usuário e porta para o log
    const user = await User.getById(permission.user_id);
    const door = await Door.getById(permission.door_id);
    
    // Registrar a atualização de permissão no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'permission_updated',
      details: `Permissão atualizada para ${user.name} na porta ${door.name}`,
      door_id: permission.door_id,
      door_name: door.name
    });
    
    res.status(200).json({
      success: true,
      message: 'Permissão atualizada com sucesso',
      permission: updatedPermission
    });
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar permissão',
      error: error.message
    });
  }
};

/**
 * Excluir permissão
 * @route DELETE /api/permissions/:id
 */
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a permissão existe
    const permission = await Permission.getById(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permissão não encontrada'
      });
    }
    
    // Buscar detalhes do usuário e porta para o log
    const user = await User.getById(permission.user_id);
    const door = await Door.getById(permission.door_id);
    
    // Excluir permissão
    await Permission.delete(id);
    
    // Registrar a remoção de permissão no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'permission_revoked',
      details: `Permissão revogada para ${user.name} na porta ${door.name}`,
      door_id: permission.door_id,
      door_name: door.name
    });
    
    res.status(200).json({
      success: true,
      message: 'Permissão excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir permissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir permissão',
      error: error.message
    });
  }
};

/**
 * Listar permissões de um usuário
 * @route GET /api/permissions/user/:userId
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.getById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar permissões do usuário
    const permissions = await Permission.getByUser(userId);
    
    // Buscar detalhes das portas associadas
    const doorPromises = permissions.map(async permission => {
      const door = await Door.getById(permission.door_id);
      return {
        ...permission,
        door_name: door ? door.name : 'Porta desconhecida',
        door_location: door ? door.location : ''
      };
    });
    
    const enrichedPermissions = await Promise.all(doorPromises);
    
    res.status(200).json({
      success: true,
      count: enrichedPermissions.length,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      permissions: enrichedPermissions
    });
  } catch (error) {
    console.error('Erro ao listar permissões do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar permissões do usuário',
      error: error.message
    });
  }
};

/**
 * Listar permissões para uma porta
 * @route GET /api/permissions/door/:doorId
 */
exports.getDoorPermissions = async (req, res) => {
  try {
    const { doorId } = req.params;
    
    // Verificar se a porta existe
    const door = await Door.getById(doorId);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Buscar permissões da porta
    const permissions = await Permission.getByDoor(doorId);
    
    // Buscar detalhes dos usuários associados
    const userPromises = permissions.map(async permission => {
      const user = await User.getById(permission.user_id);
      return {
        ...permission,
        user_name: user ? user.name : 'Usuário desconhecido',
        user_email: user ? user.email : '',
        user_department: user ? user.department : ''
      };
    });
    
    const enrichedPermissions = await Promise.all(userPromises);
    
    res.status(200).json({
      success: true,
      count: enrichedPermissions.length,
      door: {
        id: door.id,
        name: door.name,
        location: door.location
      },
      permissions: enrichedPermissions
    });
  } catch (error) {
    console.error('Erro ao listar permissões da porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar permissões da porta',
      error: error.message
    });
  }
};

/**
 * Criar várias permissões de uma vez
 * @route POST /api/permissions/bulk
 */
exports.bulkCreatePermissions = async (req, res) => {
  try {
    const { permissions, grantedBy } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um array de permissões'
      });
    }
    
    // Usar o ID do usuário autenticado ou o ID fornecido
    const adminId = grantedBy || req.user.id;
    
    // Criar as permissões em massa
    const results = await Permission.grantBulkPermissions(permissions, adminId);
    
    res.status(200).json({
      success: true,
      message: `${results.success.length} permissões criadas, ${results.errors.length} erros`,
      created: results.success,
      errors: results.errors
    });
  } catch (error) {
    console.error('Erro ao criar permissões em massa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar permissões em massa',
      error: error.message
    });
  }
};

/**
 * Excluir várias permissões de uma vez
 * @route DELETE /api/permissions/bulk
 */
exports.bulkDeletePermissions = async (req, res) => {
  try {
    const { permissionIds } = req.body;
    
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um array de IDs de permissões'
      });
    }
    
    const results = {
      success: [],
      errors: []
    };
    
    // Processar cada permissão
    for (const id of permissionIds) {
      try {
        // Verificar se a permissão existe
        const permission = await Permission.getById(id);
        if (!permission) {
          results.errors.push({
            id,
            error: 'Permissão não encontrada'
          });
          continue;
        }
        
        // Excluir a permissão
        await Permission.delete(id);
        results.success.push(id);
        
        // Registrar no log
        await AccessLog.create({
          timestamp: new Date().toISOString(),
          user_id: req.user.id,
          action: 'permission_bulk_deleted',
          details: `Permissão removida no processo em massa`
        });
      } catch (error) {
        results.errors.push({
          id,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${results.success.length} permissões removidas, ${results.errors.length} erros`,
      removed: results.success,
      errors: results.errors
    });
  } catch (error) {
    console.error('Erro ao excluir permissões em massa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir permissões em massa',
      error: error.message
    });
  }
};