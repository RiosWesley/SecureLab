// routes/doors.js
const express = require('express');
const router = express.Router();
const doorController = require('../controllers/doorController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rotas para portas
router.get('/', doorController.getDoors);
router.get('/:id', doorController.getDoorById);
router.post('/', doorController.createDoor);
router.put('/:id', doorController.updateDoor);
router.delete('/:id', doorController.deleteDoor);

// Rotas para controle de portas
router.post('/:id/lock', doorController.lockDoor);
router.post('/:id/unlock', doorController.unlockDoor);
router.get('/:id/status', doorController.getDoorStatus);

// Rotas para dados relacionados às portas
router.get('/:id/logs', doorController.getDoorLogs);
router.get('/:id/users', doorController.getDoorUsers);
router.get('/:id/schedule', doorController.getDoorSchedule);
router.put('/:id/schedule', doorController.updateDoorSchedule);

module.exports = router;