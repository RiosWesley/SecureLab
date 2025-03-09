// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// Para desenvolvimento, vamos comentar a autenticação temporariamente
// router.use(authMiddleware);

// Rotas do dashboard
router.get('/summary', dashboardController.getSummary);
router.get('/daily-access', dashboardController.getDailyAccessCount);
router.get('/door-usage', dashboardController.getDoorUsageStats);
router.get('/user-access', dashboardController.getUserAccessStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/system-status', dashboardController.getSystemStatus);
router.get('/access-distribution', dashboardController.getAccessDistribution);
router.get('/hourly-activity', dashboardController.getHourlyActivity);
router.get('/weekly-activity', dashboardController.getWeeklyActivity);

module.exports = router;