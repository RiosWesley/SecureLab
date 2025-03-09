// routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Listar tipos de relatórios disponíveis
router.get('/available', reportController.getAvailableReports);

// Gerar relatórios específicos
router.post('/access', reportController.generateAccessReport);
router.post('/users', reportController.generateUserReport);
router.post('/doors', reportController.generateDoorReport);
router.post('/alerts', reportController.generateAlertReport);
router.post('/activity', reportController.generateActivityReport);

// Exportar relatório
router.post('/export', reportController.exportReport);

// Agendar geração automática de relatório
router.post('/schedule', reportController.scheduleReport);

module.exports = router;
router.get('/download/:filename', reportController.downloadReport);