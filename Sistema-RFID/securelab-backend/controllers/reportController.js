// controllers/reportController.js
const AccessLog = require('../models/accessLog');
const User = require('../models/user');
const Door = require('../models/door');
const Alert = require('../models/alert');

/**
 * Gerar relatório de acessos
 * @route POST /api/reports/access
 */
exports.generateAccessReport = async (req, res) => {
  try {
    const { startDate, endDate, doorId, userId, exportFormat } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de início e fim são obrigatórias'
      });
    }
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate, endDate);
    
    // Filtrar por porta, se especificado
    let filteredLogs = logs;
    if (doorId) {
      filteredLogs = filteredLogs.filter(log => log.door_id === doorId);
    }
    
    // Filtrar por usuário, se especificado
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.user_id === userId);
    }
    
    // Calcular estatísticas
    const stats = {
      total: filteredLogs.length,
      granted: filteredLogs.filter(log => log.action === 'access_granted').length,
      denied: filteredLogs.filter(log => log.action === 'access_denied').length
    };
    
    res.status(200).json({
      success: true,
      report: {
        title: 'Relatório de Acessos',
        dateRange: { startDate, endDate },
        filters: { doorId, userId },
        stats,
        data: filteredLogs
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de acessos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de acessos',
      error: error.message
    });
  }
};

/**
 * Gerar relatório de usuários
 * @route POST /api/reports/users
 */
exports.generateUserReport = async (req, res) => {
  try {
    const users = await User.getAll();
    const logs = await AccessLog.getAll(1000);
    
    // Calcular estatísticas por usuário
    const userStats = users.map(user => {
      const userLogs = logs.filter(log => log.user_id === user.id);
      const accessCount = userLogs.length;
      const lastAccess = userLogs.length > 0 ? 
        userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        status: user.status,
        accessCount,
        lastAccess
      };
    });
    
    res.status(200).json({
      success: true,
      report: {
        title: 'Relatório de Usuários',
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'active').length,
        data: userStats
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de usuários',
      error: error.message
    });
  }
};

/**
 * Gerar relatório de portas
 * @route POST /api/reports/doors
 */
exports.generateDoorReport = async (req, res) => {
  try {
    const doors = await Door.getAll();
    const logs = await AccessLog.getAll(1000);
    
    // Calcular estatísticas por porta
    const doorStats = doors.map(door => {
      const doorLogs = logs.filter(log => log.door_id === door.id);
      const accessCount = doorLogs.length;
      const grantedCount = doorLogs.filter(log => log.action === 'access_granted').length;
      const deniedCount = doorLogs.filter(log => log.action === 'access_denied').length;
      
      return {
        id: door.id,
        name: door.name,
        location: door.location,
        status: door.status,
        accessCount,
        grantedCount,
        deniedCount,
        deviceId: door.device_id
      };
    });
    
    res.status(200).json({
      success: true,
      report: {
        title: 'Relatório de Portas',
        totalDoors: doors.length,
        data: doorStats
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de portas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de portas',
      error: error.message
    });
  }
};

/**
 * Gerar relatório de alertas
 * @route POST /api/reports/alerts
 */
exports.generateAlertReport = async (req, res) => {
  try {
    const { startDate, endDate, type, severity } = req.body;
    
    // Buscar todos os alertas
    const alerts = await Alert.getAll(1000);
    
    // Filtrar por data, se especificado
    let filteredAlerts = alerts;
    if (startDate && endDate) {
      filteredAlerts = filteredAlerts.filter(alert => {
        const alertDate = new Date(alert.timestamp);
        return alertDate >= new Date(startDate) && alertDate <= new Date(endDate);
      });
    }
    
    // Filtrar por tipo, se especificado
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    // Filtrar por severidade, se especificado
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    // Calcular estatísticas
    const stats = {
      total: filteredAlerts.length,
      resolved: filteredAlerts.filter(alert => alert.resolved).length,
      unresolved: filteredAlerts.filter(alert => !alert.resolved).length,
      bySeverity: {
        critical: filteredAlerts.filter(alert => alert.severity === 'critical').length,
        warning: filteredAlerts.filter(alert => alert.severity === 'warning').length,
        info: filteredAlerts.filter(alert => alert.severity === 'info').length
      }
    };
    
    res.status(200).json({
      success: true,
      report: {
        title: 'Relatório de Alertas',
        filters: { startDate, endDate, type, severity },
        stats,
        data: filteredAlerts
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de alertas',
      error: error.message
    });
  }
};

/**
 * Gerar relatório de atividades
 * @route POST /api/reports/activity
 */
exports.generateActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'daily' } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de início e fim são obrigatórias'
      });
    }
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate, endDate);
    
    // Agrupar por intervalo (diário, semanal ou mensal)
    const groupedData = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      let key;
      
      switch (interval) {
        case 'weekly':
          // Agrupar por semana (domingo como primeiro dia)
          const firstDay = new Date(date);
          firstDay.setDate(date.getDate() - date.getDay());
          key = firstDay.toISOString().split('T')[0];
          break;
        case 'monthly':
          // Agrupar por mês
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          // Agrupar por dia
          key = date.toISOString().split('T')[0];
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          total: 0,
          granted: 0,
          denied: 0,
          doors: {}
        };
      }
      
      groupedData[key].total++;
      
      if (log.action === 'access_granted') {
        groupedData[key].granted++;
      } else if (log.action === 'access_denied') {
        groupedData[key].denied++;
      }
      
      // Contabilizar por porta
      if (log.door_id) {
        if (!groupedData[key].doors[log.door_id]) {
          groupedData[key].doors[log.door_id] = {
            id: log.door_id,
            name: log.door_name || 'Porta desconhecida',
            count: 0
          };
        }
        groupedData[key].doors[log.door_id].count++;
      }
    });
    
    // Converter para array e ordenar por data
    const activityData = Object.entries(groupedData).map(([date, data]) => ({
      date,
      ...data,
      doors: Object.values(data.doors).sort((a, b) => b.count - a.count)
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({
      success: true,
      report: {
        title: 'Relatório de Atividades',
        dateRange: { startDate, endDate },
        interval,
        totalActivities: logs.length,
        data: activityData
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de atividades',
      error: error.message
    });
  }
};

/**
 * Listar tipos de relatórios disponíveis
 * @route GET /api/reports/available
 */
exports.getAvailableReports = async (req, res) => {
  try {
    const reports = [
      {
        id: 'access',
        name: 'Relatório de Acessos',
        description: 'Análise de acessos por porta, usuário e período',
        endpoint: '/api/reports/access'
      },
      {
        id: 'users',
        name: 'Relatório de Usuários',
        description: 'Estatísticas de usuários e seus acessos',
        endpoint: '/api/reports/users'
      },
      {
        id: 'doors',
        name: 'Relatório de Portas',
        description: 'Estatísticas de uso das portas',
        endpoint: '/api/reports/doors'
      },
      {
        id: 'alerts',
        name: 'Relatório de Alertas',
        description: 'Análise de alertas do sistema',
        endpoint: '/api/reports/alerts'
      },
      {
        id: 'activity',
        name: 'Relatório de Atividades',
        description: 'Atividades do sistema agrupadas por período',
        endpoint: '/api/reports/activity'
      }
    ];
    
    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Erro ao listar relatórios disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar relatórios disponíveis',
      error: error.message
    });
  }
};

/**
 * Exportar relatório (PDF, CSV, Excel)
 * @route POST /api/reports/export
 */
exports.exportReport = async (req, res) => {
  try {
    const { reportType, format, params } = req.body;
    
    if (!reportType || !format) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de relatório e formato de exportação são obrigatórios'
      });
    }
    
    // Verificar formato de exportação
    if (!['pdf', 'csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de exportação inválido. Use pdf, csv ou excel'
      });
    }
    
    // Mock de exportação (a ser implementado com serviços reais)
    res.status(200).json({
      success: true,
      message: `Relatório do tipo ${reportType} exportado com sucesso em formato ${format}`,
      downloadUrl: `/api/reports/download/${reportType}_${Date.now()}.${format}`,
      format
    });
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar relatório',
      error: error.message
    });
  }
};

/**
 * Agendar geração automática de relatório
 * @route POST /api/reports/schedule
 */
exports.scheduleReport = async (req, res) => {
  try {
    const { reportType, frequency, emails, params, startDate } = req.body;
    
    if (!reportType || !frequency || !emails || !emails.length) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de relatório, frequência e e-mails são obrigatórios'
      });
    }
    
    // Verificar frequência válida
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Frequência inválida. Use daily, weekly ou monthly'
      });
    }
    
    // Mock de agendamento (a ser implementado com serviços reais)
    const schedule = {
      id: Date.now().toString(),
      reportType,
      frequency,
      emails,
      params,
      startDate: startDate || new Date().toISOString(),
      createdBy: req.user.id,
      status: 'scheduled'
    };
    
    res.status(200).json({
      success: true,
      message: 'Relatório agendado com sucesso',
      schedule
    });
  } catch (error) {
    console.error('Erro ao agendar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao agendar relatório',
      error: error.message
    });
  }
};
// Em reportController.js
exports.downloadReport = async (req, res) => {
  const { filename } = req.params;
  const filePath = reportService.getFilePath(filename);
  
  if (!reportService.fileExists(filename)) {
    return res.status(404).json({
      success: false,
      message: 'Relatório não encontrado'
    });
  }
  
  res.download(filePath);
};