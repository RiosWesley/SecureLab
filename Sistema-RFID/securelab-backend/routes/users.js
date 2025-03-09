// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas, exceto onde especificado
router.use(authMiddleware);

// Rotas para usuários
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Rotas para cartões RFID dos usuários
router.get('/:id/cards', userController.getUserCards);
router.post('/:id/cards', userController.addUserCard);
router.delete('/:id/cards/:cardId', userController.removeUserCard);

// Rotas para obter dados relacionados ao usuário
router.get('/:id/permissions', userController.getUserPermissions);
router.get('/:id/groups', userController.getUserGroups);
router.get('/:id/logs', userController.getUserLogs);

module.exports = router;