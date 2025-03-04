// controllers/logController.js
const AccessLog = require('../models/accessLog');
const User = require('../models/user');
const Door = require('../models/door');

/**
 * Listar todos os logs de acesso
 * @route GET /api/logs
 */
exports.getLogs = async (req, res) => {
  try {
    // Parâmetros de paginação
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    
    const logs = await AccessLog.getAll(limit * page);
    
    // Se houver paginação, retornar apenas os logs da página atual
    const paginatedLogs = page > 1 
      ? logs.slice((page - 1) * limit, page * limit) 
      : logs.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      page,
      limit,
      total_pages: Math.ceil(logs.length / limit),
      logs: paginatedLogs
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar logs',
      error: error.message
    });
  }
};

/**
 * Obter log específico pelo ID
 * @route GET /api/logs/:id
 */
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await AccessLog.getById(id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log não encontrado'
      });
    }
    
    // Buscar informações adicionais do usuário e porta, se disponíveis
    let userData = null;
    let doorData = null;
    
    if (log.user_id) {
      userData = await User.getById(log.user_id);
    }
    
    if (log.door_id) {
      doorData = await Door.getById(log.door_id);
    }
    
    res.status(200).json({
      success: true,
      log,
      user: userData ? {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        department: userData.department
      } : null,
      door: doorData ? {
        id: doorData.id,
        name: doorData.name,
        location: doorData.location
      } : null
    });
  } catch (error) {
    console.error('Erro ao buscar log:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar log',
      error: error.message
    });
  }
};

/**
 * Criar novo registro de log (manual)
 * @route POST /api/logs
 */
exports.createLog = async (req, res) => {
  try {
    const {
      user_id,
      door_id,
      action,
      method = 'manual',
      details,
      timestamp = new Date().toISOString()
    } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Ação é obrigatória'
      });
    }
    
    // Validar usuário, se fornecido
    if (user_id) {
      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
    }
    
    // Validar porta, se fornecida
    if (door_id) {
      const door = await Door.getById(door_id);
      if (!door) {
        return res.status(404).json({
          success: false,
          message: 'Porta não encontrada'
        });
      }
    }
    
    // Criar log
    const logData = {
      timestamp,
      user_id,
      door_id,
      action,
      method,
      details,
      created_by: req.user.id
    };
    
    const newLog = await AccessLog.create(logData);
    
    res.status(201).json({
      success: true,
      message: 'Log criado com sucesso',
      log: newLog
    });
  } catch (error) {
    console.error('Erro ao criar log:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar log',
      error: error.message
    });
  }
};

/**
 * Pesquisar logs com filtros diversos
 * @route GET /api/logs/search
 */
exports.searchLogs = async (req, res) => {
  try {
    const {
      user_id,
      door_id,
      action,
      start_date,
      end_date,
      card_uid,
      limit = 100
    } = req.query;
    
    let logs = [];
    
    // Buscar com base no filtro mais específico disponível
    if (user_id) {
      logs = await AccessLog.getByUser(user_id, limit);
    } else if (door_id) {
      logs = await AccessLog.getByDoor(door_id, limit);
    } else if (action) {
      logs = await AccessLog.getByAction(action, limit);
    } else if (start_date && end_date) {
      logs = await AccessLog.getByDateRange(start_date, end_date, limit);
    } else {
      // Se nenhum filtro específico, buscar todos (com limite)
      logs = await AccessLog.getAll(limit);
    }
    
    // Aplicar filtros adicionais na memória
    if (logs.length > 0) {
      // Filtrar por cartão, se fornecido
      if (card_uid) {
        logs = logs.filter(log => log.card_uid === card_uid);
      }
      
      // Outros filtros adicionais podem ser aplicados aqui
    }
    
    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Erro ao pesquisar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao pesquisar logs',
      error: error.message
    });
  }
};

/**
 * Obter logs por intervalo de data
 * @route GET /api/logs/date
 */
exports.getLogsByDate = async (req, res) => {
  try {
    const { start_date, end_date, limit = 100 } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      });
    }
    
    const logs = await AccessLog.getByDateRange(start_date, end_date, limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      start_date,
      end_date,
      logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs por data:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs por data',
      error: error.message
    });
  }
};

/**
 * Exportar logs (CSV, PDF)
 * @route GET /api/logs/export
 */
exports.exportLogs = async (req, res) => {
  try {
    const { format = 'csv', start_date, end_date, limit = 1000 } = req.query;
    
    let logs = [];
    
    // Buscar logs com base nos filtros fornecidos
    if (start_date && end_date) {
      logs = await AccessLog.getByDateRange(start_date, end_date, limit);
    } else {
      logs = await AccessLog.getAll(limit);
    }
    
    if (format.toLowerCase() === 'csv') {
      // Gerar CSV
      const fields = [
        'id', 'timestamp', 'user_id', 'user_name', 'door_id', 'door_name',
        'action', 'method', 'card_uid', 'details'
      ];
      
      // Cabeçalho CSV
      let csv = fields.join(',') + '\n';
      
      // Dados CSV
      logs.forEach(log => {
        const row = fields.map(field => {
          // Tratar campos especiais (strings com vírgulas, etc.)
          let value = log[field] || '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += row.join(',') + '\n';
      });
      
      // Enviar resposta CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    } else if (format.toLowerCase() === 'pdf') {
      // Para PDF, retornar apenas um stub (implementar depois com biblioteca PDF)
      return res.status(501).json({
        success: false,
        message: 'Exportação para PDF ainda não implementada'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Formato não suportado. Use "csv" ou "pdf"'
      });
    }
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar logs',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de acesso
 * @route GET /api/logs/stats
 */
exports.getAccessStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await AccessLog.getAccessStats(parseInt(days));
    
    res.status(200).json({
      success: true,
      days: parseInt(days),
      stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de acesso',
      error: error.message
    });
  }
};

module.exports = exports;
