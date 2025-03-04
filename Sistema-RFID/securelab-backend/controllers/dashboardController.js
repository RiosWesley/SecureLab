// controllers/dashboardController.js
const User = require('../models/user');
const Door = require('../models/door');
const Device = require('../models/device');
const AccessLog = require('../models/accessLog');
const Alert = require('../models/alert');

/**
 * Obter resumo geral para os cards principais do dashboard
 * @route GET /api/dashboard/summary
 */
exports.getSummary = async (req, res) => {
  try {
    // Obter contagem de usuários ativos
    const users = await User.getAll();
    const activeUsers = users.filter(user => user.status === 'active').length;
    
    // Obter contagem de portas
    const doors = await Door.getAll();
    const doorCount = doors.length;
    
    // Obter contagem de dispositivos online/offline
    const devices = await Device.getAll();
    const onlineDevices = devices.filter(device => device.status === 'online').length;
    
    // Obter acessos do dia atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStart = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    const todayLogs = await AccessLog.getByDateRange(todayStart, todayEnd);
    const todayAccess = todayLogs.filter(log => log.action === 'access_granted').length;
    
    // Obter acessos negados do dia atual
    const todayDenied = todayLogs.filter(log => log.action === 'access_denied').length;
    
    // Obter alertas não resolvidos
    const unresolvedAlerts = await Alert.getUnresolvedCount();
    
    // Calcular a utilização da porta mais acessada
    const doorUsage = {};
    todayLogs.forEach(log => {
      if (log.door_id) {
        if (!doorUsage[log.door_id]) {
          doorUsage[log.door_id] = {
            id: log.door_id,
            name: log.door_name || 'Porta desconhecida',
            count: 0
          };
        }
        doorUsage[log.door_id].count++;
      }
    });
    
    // Ordenar portas por número de acessos
    const topDoors = Object.values(doorUsage).sort((a, b) => b.count - a.count);
    const mostUsedDoor = topDoors.length > 0 ? topDoors[0] : null;
    
    // Calcular variação em relação ao dia anterior
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStart = yesterday.toISOString();
    const yesterdayEnd = today.toISOString();
    
    const yesterdayLogs = await AccessLog.getByDateRange(yesterdayStart, yesterdayEnd);
    const yesterdayAccess = yesterdayLogs.filter(log => log.action === 'access_granted').length;
    
    const accessChange = yesterdayAccess > 0 
      ? Math.round(((todayAccess - yesterdayAccess) / yesterdayAccess) * 100) 
      : 100;
    
    res.status(200).json({
      success: true,
      summary: {
        active_users: activeUsers,
        total_users: users.length,
        doors: doorCount,
        devices: {
          total: devices.length,
          online: onlineDevices,
          offline: devices.length - onlineDevices
        },
        today: {
          access: todayAccess,
          denied: todayDenied,
          change: accessChange
        },
        alerts: unresolvedAlerts,
        most_used_door: mostUsedDoor
      }
    });
  } catch (error) {
    console.error('Erro ao obter resumo do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo do dashboard',
      error: error.message
    });
  }
};

/**
 * Obter contagem de acessos diários (últimos 7 dias)
 * @route GET /api/dashboard/daily-access
 */
exports.getDailyAccessCount = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Calcular a data de início (X dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate.toISOString(), endDate.toISOString());
    
    // Inicializar o array de dias
    const dailyData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
      
      dailyData.push({
        date: dateStr,
        day: dayName,
        granted: 0,
        denied: 0,
        total: 0
      });
    }
    
    // Agrupar logs por dia
    logs.forEach(log => {
      const dateStr = log.timestamp.split('T')[0]; // YYYY-MM-DD
      const day = dailyData.find(d => d.date === dateStr);
      
      if (day) {
        day.total++;
        
        if (log.action === 'access_granted') {
          day.granted++;
        } else if (log.action === 'access_denied') {
          day.denied++;
        }
      }
    });
    
    res.status(200).json({
      success: true,
      days,
      data: dailyData
    });
  } catch (error) {
    console.error('Erro ao obter contagem de acessos diários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter contagem de acessos diários',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de uso por porta
 * @route GET /api/dashboard/door-usage
 */
exports.getDoorUsageStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Calcular a data de início (X dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate.toISOString(), endDate.toISOString());
    
    // Obter todas as portas
    const doors = await Door.getAll();
    
    // Inicializar dados de uso por porta
    const doorUsage = {};
    
    doors.forEach(door => {
      doorUsage[door.id] = {
        id: door.id,
        name: door.name,
        location: door.location,
        granted: 0,
        denied: 0,
        total: 0,
        percentage: 0
      };
    });
    
    // Contar acessos por porta
    let totalAccess = 0;
    
    logs.forEach(log => {
      if (log.door_id && doorUsage[log.door_id]) {
        doorUsage[log.door_id].total++;
        totalAccess++;
        
        if (log.action === 'access_granted') {
          doorUsage[log.door_id].granted++;
        } else if (log.action === 'access_denied') {
          doorUsage[log.door_id].denied++;
        }
      }
    });
    
    // Calcular percentagens e ordenar por uso
    const doorStats = Object.values(doorUsage).map(door => {
      door.percentage = totalAccess > 0 ? Math.round((door.total / totalAccess) * 100) : 0;
      return door;
    }).sort((a, b) => b.total - a.total);
    
    res.status(200).json({
      success: true,
      days,
      total_access: totalAccess,
      doors: doorStats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso por porta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de uso por porta',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de acesso por usuário
 * @route GET /api/dashboard/user-access
 */
exports.getUserAccessStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 10;
    
    // Calcular a data de início (X dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate.toISOString(), endDate.toISOString());
    
    // Inicializar dados de acesso por usuário
    const userAccess = {};
    
    logs.forEach(log => {
      if (log.user_id) {
        if (!userAccess[log.user_id]) {
          userAccess[log.user_id] = {
            id: log.user_id,
            name: log.user_name || 'Usuário desconhecido',
            granted: 0,
            denied: 0,
            total: 0,
            doors: {}
          };
        }
        
        userAccess[log.user_id].total++;
        
        if (log.action === 'access_granted') {
          userAccess[log.user_id].granted++;
        } else if (log.action === 'access_denied') {
          userAccess[log.user_id].denied++;
        }
        
        // Contabilizar portas acessadas pelo usuário
        if (log.door_id) {
          if (!userAccess[log.user_id].doors[log.door_id]) {
            userAccess[log.user_id].doors[log.door_id] = {
              id: log.door_id,
              name: log.door_name || 'Porta desconhecida',
              count: 0
            };
          }
          userAccess[log.user_id].doors[log.door_id].count++;
        }
      }
    });
    
    // Ordenar usuários por número de acessos e limitar
    const userStats = Object.values(userAccess)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map(user => {
        // Converter o objeto doors em um array ordenado por contagem
        user.doors = Object.values(user.doors).sort((a, b) => b.count - a.count);
        return user;
      });
    
    res.status(200).json({
      success: true,
      days,
      limit,
      users: userStats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de acesso por usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de acesso por usuário',
      error: error.message
    });
  }
};

/**
 * Obter atividades recentes
 * @route GET /api/dashboard/recent-activity
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Buscar logs mais recentes
    const logs = await AccessLog.getAll(limit);
    
    // Buscar alertas mais recentes
    const alerts = await Alert.getAll(limit);
    
    // Combinar logs e alertas em uma única lista de atividades
    const activities = [];
    
    logs.forEach(log => {
      activities.push({
        type: 'log',
        id: log.id,
        timestamp: log.timestamp,
        user_id: log.user_id,
        user_name: log.user_name,
        door_id: log.door_id,
        door_name: log.door_name,
        action: log.action,
        reason: log.reason
      });
    });
    
    alerts.forEach(alert => {
      activities.push({
        type: 'alert',
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        message: alert.message,
        door_id: alert.door_id,
        door_name: alert.door_name,
        resolved: alert.resolved
      });
    });
    
    // Ordenar todas as atividades por timestamp (mais recentes primeiro)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limitar o número total de atividades
    const limitedActivities = activities.slice(0, limit);
    
    res.status(200).json({
      success: true,
      limit,
      count: limitedActivities.length,
      activities: limitedActivities
    });
  } catch (error) {
    console.error('Erro ao obter atividades recentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter atividades recentes',
      error: error.message
    });
  }
};

/**
 * Obter status do sistema (dispositivos online/offline)
 * @route GET /api/dashboard/system-status
 */
exports.getSystemStatus = async (req, res) => {
  try {
    // Obter todos os dispositivos
    const devices = await Device.getAll();
    
    // Separar dispositivos por status
    const onlineDevices = devices.filter(device => device.status === 'online');
    const offlineDevices = devices.filter(device => device.status !== 'online');
    
    // Obter portas associadas aos dispositivos
    const doorPromises = devices.map(async device => {
      if (device.door_id) {
        const door = await Door.getById(device.door_id);
        return { ...device, door };
      }
      return device;
    });
    
    const devicesWithDoors = await Promise.all(doorPromises);
    
    // Obter alertas relacionados a dispositivos
    const alerts = await Alert.getAll(50);
    const deviceAlerts = alerts.filter(alert => 
      alert.type === 'device_offline' || 
      alert.type === 'device_error' ||
      alert.type === 'connectivity_issue'
    );
    
    // Preparar estatísticas do sistema
    const systemStatus = {
      devices: {
        total: devices.length,
        online: onlineDevices.length,
        offline: offlineDevices.length,
        percentage: devices.length > 0 
          ? Math.round((onlineDevices.length / devices.length) * 100) 
          : 0
      },
      memory_usage: 43, // Valores fixos para exemplo
      storage_usage: 21, // Valores fixos para exemplo
      cpu_usage: 12,     // Valores fixos para exemplo
      uptime: '7 dias, 5 horas', // Valor fixo para exemplo
      device_list: devicesWithDoors.map(device => ({
        id: device.id,
        name: device.name,
        status: device.status,
        last_online: device.last_online,
        door_id: device.door_id,
        door_name: device.door ? device.door.name : null
      })),
      recent_alerts: deviceAlerts.slice(0, 5)
    };
    
    res.status(200).json({
      success: true,
      system_status: systemStatus
    });
  } catch (error) {
    console.error('Erro ao obter status do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do sistema',
      error: error.message
    });
  }
};

/**
 * Obter distribuição de acessos
 * @route GET /api/dashboard/access-distribution
 */
exports.getAccessDistribution = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Calcular a data de início (X dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Obter estatísticas de acesso
    const stats = await AccessLog.getAccessStats(days);
    
    res.status(200).json({
      success: true,
      days,
      distribution: {
        total: stats.total,
        granted: stats.granted,
        denied: stats.denied,
        by_door: stats.byDoor,
        by_day: stats.byDay,
        by_hour: stats.byHour
      }
    });
  } catch (error) {
    console.error('Erro ao obter distribuição de acessos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter distribuição de acessos',
      error: error.message
    });
  }
};

/**
 * Obter atividade por hora do dia
 * @route GET /api/dashboard/hourly-activity
 */
exports.getHourlyActivity = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Calcular a data de início (X dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate.toISOString(), endDate.toISOString());
    
    // Inicializar array de horas
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      granted: 0,
      denied: 0,
      total: 0
    }));
    
    // Agrupar logs por hora
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const hour = date.getHours();
      
      hourlyData[hour].total++;
      
      if (log.action === 'access_granted') {
        hourlyData[hour].granted++;
      } else if (log.action === 'access_denied') {
        hourlyData[hour].denied++;
      }
    });
    
    res.status(200).json({
      success: true,
      days,
      data: hourlyData
    });
  } catch (error) {
    console.error('Erro ao obter atividade por hora:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter atividade por hora',
      error: error.message
    });
  }
};

/**
 * Obter atividade semanal
 * @route GET /api/dashboard/weekly-activity
 */
exports.getWeeklyActivity = async (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks) || 4;
    
    // Calcular a data de início (X semanas atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));
    
    // Buscar logs no intervalo de datas
    const logs = await AccessLog.getByDateRange(startDate.toISOString(), endDate.toISOString());
    
    // Inicializar array de semanas
    const weeklyData = [];
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeklyData.push({
        week: i + 1,
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
        label: `Semana ${i + 1}`,
        granted: 0,
        denied: 0,
        total: 0,
        doors: {}
      });
    }
    
    // Agrupar logs por semana
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      
      for (let weekData of weeklyData) {
        const weekStart = new Date(weekData.start_date);
        const weekEnd = new Date(weekData.end_date);
        weekEnd.setHours(23, 59, 59, 999);
        
        if (logDate >= weekStart && logDate <= weekEnd) {
          weekData.total++;
          
          if (log.action === 'access_granted') {
            weekData.granted++;
          } else if (log.action === 'access_denied') {
            weekData.denied++;
          }
          
          // Contabilizar portas
          if (log.door_id) {
            if (!weekData.doors[log.door_id]) {
              weekData.doors[log.door_id] = {
                id: log.door_id,
                name: log.door_name || 'Porta desconhecida',
                count: 0
              };
            }
            weekData.doors[log.door_id].count++;
          }
          
          break;
        }
      }
    });
    
    // Converter objetos de porta em arrays ordenados
    weeklyData.forEach(weekData => {
      weekData.doors = Object.values(weekData.doors).sort((a, b) => b.count - a.count);
    });
    
    res.status(200).json({
      success: true,
      weeks,
      data: weeklyData
    });
  } catch (error) {
    console.error('Erro ao obter atividade semanal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter atividade semanal',
      error: error.message
    });
  }
};

module.exports = exports;