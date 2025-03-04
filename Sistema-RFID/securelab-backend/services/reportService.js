// services/reportService.js
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const AccessLog = require('../models/accessLog');
const User = require('../models/user');
const Door = require('../models/door');
const Alert = require('../models/alert');

/**
 * Serviço para geração e gerenciamento de relatórios
 */
class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    // Criar diretório de relatórios se não existir
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    // Mapeamento de tipos de relatórios para funções geradoras
    this.reportGenerators = {
      'access': this.generateAccessReport.bind(this),
      'users': this.generateUserReport.bind(this),
      'doors': this.generateDoorReport.bind(this),
      'alerts': this.generateAlertReport.bind(this),
      'activity': this.generateActivityReport.bind(this)
    };
    
    // Cache de relatórios recentes para evitar regeneração
    this.reportsCache = new Map();
    this.cacheMaxAge = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Gerar relatório com base no tipo e parâmetros
   * @param {string} reportType - Tipo de relatório
   * @param {Object} params - Parâmetros do relatório
   * @returns {Promise<Object>} - Dados do relatório
   */
  async generateReport(reportType, params) {
    try {
      if (!this.reportGenerators[reportType]) {
        throw new Error(`Tipo de relatório não suportado: ${reportType}`);
      }
      
      // Verificar se existe em cache e não está expirado
      const cacheKey = `${reportType}-${JSON.stringify(params)}`;
      const cachedReport = this.reportsCache.get(cacheKey);
      if (cachedReport && (Date.now() - cachedReport.timestamp < this.cacheMaxAge)) {
        logger.debug(`Usando relatório em cache: ${reportType}`);
        return cachedReport.data;
      }
      
      // Gerar relatório
      logger.info(`Gerando relatório: ${reportType}`);
      const reportData = await this.reportGenerators[reportType](params);
      
      // Armazenar em cache
      this.reportsCache.set(cacheKey, {
        data: reportData,
        timestamp: Date.now()
      });
      
      return reportData;
    } catch (error) {
      logger.error(`Erro ao gerar relatório ${reportType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exportar relatório para formato específico
   * @param {string} reportType - Tipo de relatório
   * @param {string} format - Formato de exportação (pdf, csv, excel)
   * @param {Object} params - Parâmetros do relatório
   * @returns {Promise<Object>} - Informações do arquivo exportado
   */
  async exportReport(reportType, format, params) {
    try {
      // Gerar o relatório
      const reportData = await this.generateReport(reportType, params);
      
      // Exportar para o formato solicitado
      let filePath;
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.exportToCSV(reportData, reportType);
          break;
        case 'excel':
          filePath = await this.exportToExcel(reportData, reportType);
          break;
        case 'pdf':
          filePath = await this.exportToPDF(reportData, reportType);
          break;
        default:
          throw new Error(`Formato de exportação não suportado: ${format}`);
      }
      
      return {
        success: true,
        filePath,
        fileUrl: `/api/reports/download/${path.basename(filePath)}`,
        fileName: path.basename(filePath),
        format
      };
    } catch (error) {
      logger.error(`Erro ao exportar relatório: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exportar para CSV
   * @param {Object} reportData - Dados do relatório
   * @param {string} reportType - Tipo de relatório
   * @returns {Promise<string>} - Caminho do arquivo gerado
   */
  async exportToCSV(reportData, reportType) {
    try {
      const fileName = `${reportType}_${Date.now()}.csv`;
      const filePath = path.join(this.reportsDir, fileName);
      
      // Extrair os dados para o CSV
      const dataToExport = reportData.data || [];
      
      // Criar parser CSV
      const json2csvParser = new Parser();
      
      // Converter para CSV
      const csv = json2csvParser.parse(dataToExport);
      
      // Salvar arquivo
      fs.writeFileSync(filePath, csv);
      
      return filePath;
    } catch (error) {
      logger.error(`Erro ao exportar para CSV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exportar para Excel
   * @param {Object} reportData - Dados do relatório
   * @param {string} reportType - Tipo de relatório
   * @returns {Promise<string>} - Caminho do arquivo gerado
   */
  async exportToExcel(reportData, reportType) {
    try {
      const fileName = `${reportType}_${Date.now()}.xlsx`;
      const filePath = path.join(this.reportsDir, fileName);
      
      // Criar workbook e worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SecureLab RFID';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Relatório');
      
      // Extrair dados e cabeçalhos
      const dataToExport = reportData.data || [];
      
      if (dataToExport.length > 0) {
        // Definir cabeçalhos com base nas chaves do primeiro objeto
        const headers = Object.keys(dataToExport[0]);
        worksheet.columns = headers.map(header => ({
          header,
          key: header,
          width: 20
        }));
        
        // Adicionar linhas
        worksheet.addRows(dataToExport);
        
        // Estilizar cabeçalhos
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
      
      // Adicionar folha para estatísticas
      if (reportData.stats) {
        const statsSheet = workbook.addWorksheet('Estatísticas');
        const statsData = [];
        
        // Converter estatísticas em linhas
        Object.entries(reportData.stats).forEach(([key, value]) => {
          if (typeof value === 'object') {
            Object.entries(value).forEach(([subKey, subValue]) => {
              statsData.push({ Métrica: `${key}.${subKey}`, Valor: subValue });
            });
          } else {
            statsData.push({ Métrica: key, Valor: value });
          }
        });
        
        statsSheet.columns = [
          { header: 'Métrica', key: 'Métrica', width: 30 },
          { header: 'Valor', key: 'Valor', width: 20 }
        ];
        
        statsSheet.addRows(statsData);
        statsSheet.getRow(1).font = { bold: true };
      }
      
      // Salvar arquivo
      await workbook.xlsx.writeFile(filePath);
      
      return filePath;
    } catch (error) {
      logger.error(`Erro ao exportar para Excel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exportar para PDF
   * @param {Object} reportData - Dados do relatório
   * @param {string} reportType - Tipo de relatório
   * @returns {Promise<string>} - Caminho do arquivo gerado
   */
  async exportToPDF(reportData, reportType) {
    try {
      const fileName = `${reportType}_${Date.now()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);
      
      // Criar documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Stream para arquivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Título do relatório
      doc.fontSize(20).text(reportData.title || `Relatório de ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`);
      doc.moveDown();
      
      // Data de geração
      doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`);
      doc.moveDown();
      
      // Adicionar filtros/parâmetros se existirem
      if (reportData.filters || reportData.dateRange) {
        doc.fontSize(14).text('Filtros:');
        
        if (reportData.dateRange) {
          const { startDate, endDate } = reportData.dateRange;
          doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`);
        }
        
        if (reportData.filters) {
          Object.entries(reportData.filters).forEach(([key, value]) => {
            if (value) {
              doc.fontSize(12).text(`${key}: ${value}`);
            }
          });
        }
        
        doc.moveDown();
      }
      
      // Adicionar estatísticas se existirem
      if (reportData.stats) {
        doc.fontSize(14).text('Estatísticas:');
        
        Object.entries(reportData.stats).forEach(([key, value]) => {
          if (typeof value === 'object') {
            doc.fontSize(12).text(`${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              doc.fontSize(10).text(`   ${subKey}: ${subValue}`);
            });
          } else {
            doc.fontSize(12).text(`${key}: ${value}`);
          }
        });
        
        doc.moveDown();
      }
      
      // Adicionar dados
      if (reportData.data && reportData.data.length > 0) {
        doc.fontSize(14).text('Dados:');
        doc.moveDown();
        
        // Limitar quantidade de dados para o PDF
        const limitedData = reportData.data.slice(0, 50);
        
        // Criar tabela simples
        const tableTop = doc.y;
        const keys = Object.keys(limitedData[0]);
        
        // Calcular larguras das colunas
        const columnWidth = 500 / keys.length;
        
        // Cabeçalhos
        let x = 50;
        keys.forEach(key => {
          doc.fontSize(10).text(key, x, tableTop, { width: columnWidth });
          x += columnWidth;
        });
        
        // Linhas
        let y = tableTop + 20;
        limitedData.forEach(row => {
          x = 50;
          keys.forEach(key => {
            let value = row[key];
            if (typeof value === 'object') {
              value = JSON.stringify(value).substring(0, 15) + '...';
            }
            doc.fontSize(8).text(value, x, y, { width: columnWidth });
            x += columnWidth;
          });
          y += 15;
          
          // Nova página se necessário
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });
        
        // Indicar se há mais dados
        if (reportData.data.length > 50) {
          doc.moveDown();
          doc.fontSize(10).text(`... e mais ${reportData.data.length - 50} registros`);
        }
      }
      
      // Finalizar documento
      doc.end();
      
      // Retornar promessa que resolve quando o arquivo for totalmente escrito
      return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error(`Erro ao exportar para PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar se um arquivo de relatório existe
   * @param {string} fileName - Nome do arquivo
   * @returns {boolean} - Se o arquivo existe
   */
  fileExists(fileName) {
    const filePath = path.join(this.reportsDir, fileName);
    return fs.existsSync(filePath);
  }

  /**
   * Obter caminho completo de um arquivo de relatório
   * @param {string} fileName - Nome do arquivo
   * @returns {string} - Caminho completo do arquivo
   */
  getFilePath(fileName) {
    return path.join(this.reportsDir, fileName);
  }

  /**
   * Listar relatórios agendados
   * @returns {Array} - Lista de agendamentos
   */
  getScheduledReports() {
    // Implementação futura quando o sistema de agendamento estiver pronto
    return [];
  }

  /**
   * Implementação específica para relatório de acessos
   * @private
   */
  async generateAccessReport(params) {
    const { startDate, endDate, doorId, userId } = params;
    
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
    
    // Agrupar por porta
    const doorStats = {};
    filteredLogs.forEach(log => {
      if (log.door_id) {
        if (!doorStats[log.door_id]) {
          doorStats[log.door_id] = {
            id: log.door_id,
            name: log.door_name || 'Porta desconhecida',
            total: 0,
            granted: 0,
            denied: 0
          };
        }
        
        doorStats[log.door_id].total++;
        
        if (log.action === 'access_granted') {
          doorStats[log.door_id].granted++;
        } else if (log.action === 'access_denied') {
          doorStats[log.door_id].denied++;
        }
      }
    });
    
    stats.byDoor = Object.values(doorStats);
    
    return {
      title: 'Relatório de Acessos',
      dateRange: { startDate, endDate },
      filters: { doorId, userId },
      stats,
      data: filteredLogs
    };
  }

  /**
   * Implementação específica para relatório de usuários
   * @private
   */
  async generateUserReport(params) {
    const users = await User.getAll();
    const logs = await AccessLog.getAll(1000);
    
    // Calcular estatísticas por usuário
    const userStats = users.map(user => {
      const userLogs = logs.filter(log => log.user_id === user.id);
      const accessCount = userLogs.length;
      const grantedCount = userLogs.filter(log => log.action === 'access_granted').length;
      const deniedCount = userLogs.filter(log => log.action === 'access_denied').length;
      const lastAccess = userLogs.length > 0 ? 
        userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null;
      
      // Portas mais acessadas
      const doorAccess = {};
      userLogs.forEach(log => {
        if (log.door_id) {
          if (!doorAccess[log.door_id]) {
            doorAccess[log.door_id] = {
              id: log.door_id,
              name: log.door_name || 'Porta desconhecida',
              count: 0
            };
          }
          doorAccess[log.door_id].count++;
        }
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        status: user.status,
        accessCount,
        grantedCount,
        deniedCount,
        lastAccess,
        topDoors: Object.values(doorAccess).sort((a, b) => b.count - a.count).slice(0, 3)
      };
    });
    
    return {
      title: 'Relatório de Usuários',
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'active').length,
        inactiveUsers: users.filter(user => user.status !== 'active').length,
        byRole: {
          admin: users.filter(user => user.role === 'admin').length,
          user: users.filter(user => user.role === 'user').length
        }
      },
      data: userStats
    };
  }

  /**
   * Implementação específica para relatório de portas
   * @private
   */
  async generateDoorReport(params) {
    const doors = await Door.getAll();
    const logs = await AccessLog.getAll(1000);
    
    // Calcular estatísticas por porta
    const doorStats = doors.map(door => {
      const doorLogs = logs.filter(log => log.door_id === door.id);
      const accessCount = doorLogs.length;
      const grantedCount = doorLogs.filter(log => log.action === 'access_granted').length;
      const deniedCount = doorLogs.filter(log => log.action === 'access_denied').length;
      
      // Usuários que mais acessaram
      const userAccess = {};
      doorLogs.forEach(log => {
        if (log.user_id) {
          if (!userAccess[log.user_id]) {
            userAccess[log.user_id] = {
              id: log.user_id,
              name: log.user_name || 'Usuário desconhecido',
              count: 0
            };
          }
          userAccess[log.user_id].count++;
        }
      });
      
      return {
        id: door.id,
        name: door.name,
        location: door.location,
        status: door.status,
        accessCount,
        grantedCount,
        deniedCount,
        grantRate: accessCount > 0 ? Math.round((grantedCount / accessCount) * 100) : 0,
        deviceId: door.device_id,
        topUsers: Object.values(userAccess).sort((a, b) => b.count - a.count).slice(0, 5)
      };
    });
    
    return {
      title: 'Relatório de Portas',
      stats: {
        totalDoors: doors.length,
        lockedDoors: doors.filter(door => door.status === 'locked').length,
        unlockedDoors: doors.filter(door => door.status === 'unlocked').length,
        totalAccesses: logs.length,
        grantedAccesses: logs.filter(log => log.action === 'access_granted').length,
        deniedAccesses: logs.filter(log => log.action === 'access_denied').length
      },
      data: doorStats
    };
  }

  /**
   * Implementação específica para relatório de alertas
   * @private
   */
  async generateAlertReport(params) {
    const { startDate, endDate, type, severity } = params;
    
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
    
    // Agrupar por tipo
    const alertsByType = {};
    filteredAlerts.forEach(alert => {
      if (!alertsByType[alert.type]) {
        alertsByType[alert.type] = 0;
      }
      alertsByType[alert.type]++;
    });
    
    // Calcular estatísticas
    const stats = {
      total: filteredAlerts.length,
      resolved: filteredAlerts.filter(alert => alert.resolved).length,
      unresolved: filteredAlerts.filter(alert => !alert.resolved).length,
      bySeverity: {
        critical: filteredAlerts.filter(alert => alert.severity === 'critical').length,
        warning: filteredAlerts.filter(alert => alert.severity === 'warning').length,
        info: filteredAlerts.filter(alert => alert.severity === 'info').length
      },
      byType: alertsByType
    };
    
    return {
      title: 'Relatório de Alertas',
      dateRange: { startDate, endDate },
      filters: { type, severity },
      stats,
      data: filteredAlerts
    };
  }

  /**
   * Implementação específica para relatório de atividades
   * @private
   */
  async generateActivityReport(params) {
    const { startDate, endDate, interval = 'daily' } = params;
    
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
    
    return {
      title: 'Relatório de Atividades',
      dateRange: { startDate, endDate },
      interval,
      stats: {
        totalActivities: logs.length,
        grantedAccesses: logs.filter(log => log.action === 'access_granted').length,
        deniedAccesses: logs.filter(log => log.action === 'access_denied').length,
        periodCount: activityData.length
      },
      data: activityData
    };
  }
}

// Criar e exportar uma instância única do serviço
const reportService = new ReportService();
module.exports = reportService;