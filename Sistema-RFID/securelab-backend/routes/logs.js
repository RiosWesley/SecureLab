// routes/logs.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rotas para logs
router.get('/', logController.getLogs);
router.get('/search', logController.searchLogs);
router.get('/date', logController.getLogsByDate);
router.get('/stats', logController.getAccessStats);
router.get('/export', logController.exportLogs);
router.get('/:id', logController.getLogById);
router.post('/', logController.createLog);

module.exports = router;