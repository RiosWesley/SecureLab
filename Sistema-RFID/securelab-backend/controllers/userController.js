// controllers/userController.js
const User = require('../models/user');
const Permission = require('../models/permission');
const AccessLog = require('../models/accessLog');
const Group = require('../models/group');
const admin = require('../config/firebase-admin');

/**
 * Listar todos os usuários
 * @route GET /api/users
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    
    // Remover informações sensíveis antes de enviar a resposta
    const sanitizedUsers = users.map(user => {
      // Remover os detalhes dos cartões RFID, manter apenas a contagem
      const cardCount = user.rfid_cards ? Object.keys(user.rfid_cards).length : 0;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login,
        card_count: cardCount
      };
    });
    
    res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: error.message
    });
  }
};

/**
 * Obter usuário específico pelo ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.getById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Remover informações sensíveis antes de enviar a resposta
    const { rfid_cards, ...userWithoutCards } = user;
    
    // Adicionar a contagem de cartões
    const cardCount = rfid_cards ? Object.keys(rfid_cards).length : 0;
    
    res.status(200).json({
      success: true,
      user: {
        ...userWithoutCards,
        card_count: cardCount
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message
    });
  }
};

/**
 * Criar novo usuário
 * @route POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, department, role = 'user' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Os campos email, password e name são obrigatórios'
      });
    }
    
    // Verificar se o email já está em uso
    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso'
      });
    }
    
    // Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });
    
    const uid = userRecord.uid;
    
    // Dados do usuário para o Realtime Database
    const userData = {
      name,
      email,
      role,
      department: department || '',
      created_at: new Date().toISOString(),
      last_login: null,
      status: 'active'
    };
    
    // Salvar no Realtime Database
    await User.create(uid, userData);
    
    // Criar claims personalizadas para o usuário (roles)
    await admin.auth().setCustomUserClaims(uid, { role });
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      userId: uid
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    // Mensagens de erro mais amigáveis
    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso'
      });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'A senha é muito fraca. Use pelo menos 6 caracteres'
      });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'O formato do email é inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: error.message
    });
  }
};

/**
 * Atualizar usuário existente
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, status } = req.body;
    
    // Verificar se o usuário existe
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Dados do usuário para atualização
    const userData = {};
    
    if (name) userData.name = name;
    if (department) userData.department = department;
    if (status) userData.status = status;
    
    // Atualizar papel do usuário (role) se fornecido
    if (role) {
      userData.role = role;
      
      // Atualizar claims no Firebase Auth
      await admin.auth().setCustomUserClaims(id, { role });
    }
    
    // Atualizar no Realtime Database
    await User.update(id, userData);
    
    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      userId: id
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message
    });
  }
};

/**
 * Excluir usuário
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Excluir do Firebase Auth
    await admin.auth().deleteUser(id);
    
    // Excluir do Realtime Database
    await User.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir usuário',
      error: error.message
    });
  }
};

/**
 * Listar cartões RFID do usuário
 * @route GET /api/users/:id/cards
 */
exports.getUserCards = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Extrair cartões RFID
    const cards = [];
    if (user.rfid_cards) {
      Object.entries(user.rfid_cards).forEach(([cardId, cardData]) => {
        cards.push({
          id: cardId,
          ...cardData
        });
      });
    }
    
    res.status(200).json({
      success: true,
      count: cards.length,
      cards
    });
  } catch (error) {
    console.error('Erro ao listar cartões do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cartões do usuário',
      error: error.message
    });
  }
};

/**
 * Adicionar cartão RFID ao usuário
 * @route POST /api/users/:id/cards
 */
exports.addUserCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, label } = req.body;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID do cartão é obrigatório'
      });
    }
    
    // Verificar se o usuário existe
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o cartão já está registrado para outro usuário
    const cardInUse = await User.findCardByUid(uid);
    if (cardInUse && cardInUse.userId !== id) {
      return res.status(400).json({
        success: false,
        message: 'Este cartão já está registrado para outro usuário',
        user: cardInUse.userInfo
      });
    }
    
    // Preparar dados do cartão
    const cardData = {
      uid,
      label: label || 'Cartão RFID',
      issued_date: new Date().toISOString(),
      status: 'active'
    };
    
    // Adicionar cartão ao usuário
    await User.addCard(id, cardData);
    
    res.status(201).json({
      success: true,
      message: 'Cartão adicionado com sucesso',
      card: cardData
    });
  } catch (error) {
    console.error('Erro ao adicionar cartão ao usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar cartão ao usuário',
      error: error.message
    });
  }
};

/**
 * Remover cartão RFID do usuário
 * @route DELETE /api/users/:id/cards/:cardId
 */
exports.removeUserCard = async (req, res) => {
  try {
    const { id, cardId } = req.params;
    
    // Verificar se o usuário existe
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o cartão existe para este usuário
    if (!existingUser.rfid_cards || !existingUser.rfid_cards[cardId]) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado para este usuário'
      });
    }
    
    // Remover cartão do usuário
    await User.removeCard(id, cardId);
    
    res.status(200).json({
      success: true,
      message: 'Cartão removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover cartão do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover cartão do usuário',
      error: error.message
    });
  }
};

/**
 * Listar permissões do usuário
 * @route GET /api/users/:id/permissions
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar permissões do usuário
    const permissions = await Permission.getByUser(id);
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      permissions
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
 * Listar grupos do usuário
 * @route GET /api/users/:id/groups
 */
exports.getUserGroups = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar grupos do usuário
    const groups = await Group.getUserGroups(id);
    
    res.status(200).json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    console.error('Erro ao listar grupos do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar grupos do usuário',
      error: error.message
    });
  }
};

/**
 * Listar logs de acesso do usuário
 * @route GET /api/users/:id/logs
 */
exports.getUserLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verificar se o usuário existe
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar logs de acesso do usuário
    const logs = await AccessLog.getByUser(id, limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Erro ao listar logs de acesso do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar logs de acesso do usuário',
      error: error.message
    });
  }
};