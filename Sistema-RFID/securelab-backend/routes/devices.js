// routes/devices.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rotas para dispositivos
router.get('/', deviceController.getDevices);
router.get('/:id', deviceController.getDeviceById);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// Rotas para ações em dispositivos
router.get('/:id/status', deviceController.getDeviceStatus);
router.post('/:id/restart', deviceController.restartDevice);
router.post('/:id/update-firmware', deviceController.updateFirmware);
router.get('/:id/logs', deviceController.getDeviceLogs);

// Rotas específicas
router.get('/door/:doorId', deviceController.getDoorDevice);

module.exports = router;