// controllers/groupController.js
const Group = require('../models/group');
const User = require('../models/user');
const Door = require('../models/door');
const Permission = require('../models/permission');
const AccessLog = require('../models/accessLog');

/**
 * Listar todos os grupos
 * @route GET /api/groups
 */
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.getAll();
    
    // Contar quantidade de membros em cada grupo
    const enrichedGroups = groups.map(group => {
      const memberCount = group.members ? Object.keys(group.members).length : 0;
      const doorCount = group.doors ? Object.keys(group.doors).length : 0;
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        created_by: group.created_by,
        member_count: memberCount,
        door_count: doorCount
      };
    });
    
    res.status(200).json({
      success: true,
      count: enrichedGroups.length,
      groups: enrichedGroups
    });
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar grupos',
      error: error.message
    });
  }
};

/**
 * Obter grupo específico pelo ID
 * @route GET /api/groups/:id
 */
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.getById(id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Contar membros e portas
    const memberCount = group.members ? Object.keys(group.members).length : 0;
    const doorCount = group.doors ? Object.keys(group.doors).length : 0;
    
    // Adicionar contagens ao grupo
    const enrichedGroup = {
      ...group,
      member_count: memberCount,
      door_count: doorCount
    };
    
    res.status(200).json({
      success: true,
      group: enrichedGroup
    });
  } catch (error) {
    console.error('Erro ao buscar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar grupo',
      error: error.message
    });
  }
};

/**
 * Criar novo grupo
 * @route POST /api/groups
 */
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members = [], doors = {} } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome do grupo é obrigatório'
      });
    }
    
    // Criar grupo
    const groupData = {
      name,
      description: description || '',
      created_by: req.user.id,
      members,
      doors
    };
    
    const newGroup = await Group.create(groupData);
    
    // Registrar criação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_created',
      details: `Grupo criado: ${name}`
    });
    
    res.status(201).json({
      success: true,
      message: 'Grupo criado com sucesso',
      group: newGroup
    });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar grupo',
      error: error.message
    });
  }
};

/**
 * Atualizar grupo existente
 * @route PUT /api/groups/:id
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Preparar dados para atualização
    const updates = {};
    
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    
    // Atualizar grupo (apenas nome e descrição, não membros ou portas)
    const updatedGroup = await Group.update(id, updates);
    
    // Registrar atualização no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_updated',
      details: `Grupo atualizado: ${name || group.name}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Grupo atualizado com sucesso',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar grupo',
      error: error.message
    });
  }
};

/**
 * Excluir grupo
 * @route DELETE /api/groups/:id
 */
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Excluir grupo
    await Group.delete(id);
    
    // Registrar exclusão no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_deleted',
      details: `Grupo excluído: ${group.name}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Grupo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir grupo',
      error: error.message
    });
  }
};

/**
 * Listar membros de um grupo
 * @route GET /api/groups/:id/members
 */
exports.getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Lista de membros vazia se não houver membros
    if (!group.members) {
      return res.status(200).json({
        success: true,
        group_id: id,
        group_name: group.name,
        count: 0,
        members: []
      });
    }
    
    // Buscar detalhes de cada membro
    const memberPromises = Object.keys(group.members).map(async (userId) => {
      try {
        const user = await User.getById(userId);
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
            status: user.status
          };
        }
        return null;
      } catch (error) {
        console.error(`Erro ao buscar detalhes do membro ${userId}:`, error);
        return null;
      }
    });
    
    const members = (await Promise.all(memberPromises)).filter(member => member !== null);
    
    res.status(200).json({
      success: true,
      group_id: id,
      group_name: group.name,
      count: members.length,
      members
    });
  } catch (error) {
    console.error('Erro ao listar membros do grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar membros do grupo',
      error: error.message
    });
  }
};

/**
 * Adicionar membro ao grupo
 * @route POST /api/groups/:id/members
 */
exports.addGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }
    
    // Verificar se o usuário existe
    const user = await User.getById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Adicionar membro ao grupo
    const result = await Group.addMember(id, userId);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_member_added',
      details: `Usuário ${user.name} adicionado ao grupo`
    });
    
    res.status(200).json({
      success: true,
      message: 'Membro adicionado ao grupo com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao adicionar membro ao grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar membro ao grupo',
      error: error.message
    });
  }
};

/**
 * Remover membro do grupo
 * @route DELETE /api/groups/:id/members/:userId
 */
exports.removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Verificar se o usuário é membro do grupo
    if (!group.members || !group.members[userId]) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não é membro deste grupo'
      });
    }
    
    // Remover membro do grupo
    const result = await Group.removeMember(id, userId);
    
    // Buscar detalhes do usuário para o log
    const user = await User.getById(userId);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_member_removed',
      details: `Usuário ${user ? user.name : userId} removido do grupo ${group.name}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Membro removido do grupo com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao remover membro do grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover membro do grupo',
      error: error.message
    });
  }
};

/**
 * Listar portas acessíveis pelo grupo
 * @route GET /api/groups/:id/doors
 */
exports.getGroupDoors = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Lista de portas vazia se não houver portas
    if (!group.doors) {
      return res.status(200).json({
        success: true,
        group_id: id,
        group_name: group.name,
        count: 0,
        doors: []
      });
    }
    
    // Buscar detalhes de cada porta
    const doorPromises = Object.entries(group.doors).map(async ([doorId, accessConfig]) => {
      try {
        const door = await Door.getById(doorId);
        if (door) {
          return {
            id: door.id,
            name: door.name,
            location: door.location,
            status: door.status,
            access_level: accessConfig.access_level || 'user',
            can_unlock_remotely: accessConfig.can_unlock_remotely || false,
            schedule_override: accessConfig.schedule_override || false
          };
        }
        return null;
      } catch (error) {
        console.error(`Erro ao buscar detalhes da porta ${doorId}:`, error);
        return null;
      }
    });
    
    const doors = (await Promise.all(doorPromises)).filter(door => door !== null);
    
    res.status(200).json({
      success: true,
      group_id: id,
      group_name: group.name,
      count: doors.length,
      doors
    });
  } catch (error) {
    console.error('Erro ao listar portas do grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar portas do grupo',
      error: error.message
    });
  }
};

/**
 * Adicionar acesso do grupo a uma porta
 * @route POST /api/groups/:id/doors
 */
exports.addGroupDoorAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      doorId, 
      access_level = 'user', 
      can_unlock_remotely = false, 
      schedule_override = false 
    } = req.body;
    
    if (!doorId) {
      return res.status(400).json({
        success: false,
        message: 'ID da porta é obrigatório'
      });
    }
    
    // Verificar se a porta existe
    const door = await Door.getById(doorId);
    if (!door) {
      return res.status(404).json({
        success: false,
        message: 'Porta não encontrada'
      });
    }
    
    // Validar nível de acesso
    const validAccessLevels = ['user', 'manager', 'admin'];
    if (!validAccessLevels.includes(access_level)) {
      return res.status(400).json({
        success: false,
        message: 'Nível de acesso inválido. Use: user, manager ou admin'
      });
    }
    
    // Adicionar acesso do grupo à porta
    const accessConfig = {
      access_level,
      can_unlock_remotely,
      schedule_override
    };
    
    const result = await Group.addDoorAccess(id, doorId, accessConfig);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_door_access_added',
      details: `Acesso à porta ${door.name} adicionado ao grupo`,
      door_id: doorId
    });
    
    res.status(200).json({
      success: true,
      message: 'Acesso à porta adicionado ao grupo com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao adicionar acesso à porta para o grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar acesso à porta para o grupo',
      error: error.message
    });
  }
};

/**
 * Remover acesso do grupo a uma porta
 * @route DELETE /api/groups/:id/doors/:doorId
 */
exports.removeGroupDoorAccess = async (req, res) => {
  try {
    const { id, doorId } = req.params;
    
    // Verificar se o grupo existe
    const group = await Group.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }
    
    // Verificar se o grupo tem acesso à porta
    if (!group.doors || !group.doors[doorId]) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não tem acesso a esta porta'
      });
    }
    
    // Buscar detalhes da porta para o log
    const door = await Door.getById(doorId);
    
    // Remover acesso do grupo à porta
    const result = await Group.removeDoorAccess(id, doorId);
    
    // Registrar ação no log
    await AccessLog.create({
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      action: 'group_door_access_removed',
      details: `Acesso à porta ${door ? door.name : doorId} removido do grupo ${group.name}`,
      door_id: doorId
    });
    
    res.status(200).json({
      success: true,
      message: 'Acesso à porta removido do grupo com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao remover acesso à porta do grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover acesso à porta do grupo',
      error: error.message
    });
  }
};

module.exports = exports;