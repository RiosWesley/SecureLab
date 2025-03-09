// routes/auth.js
const express = require('express');
const router = express.Router();

// Rota temporária simplificada
router.post('/login', (req, res) => {
  // Simulação de resposta de login bem-sucedido
  res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso',
    token: 'token-simulado-123456',
    user: {
      id: '1',
      email: req.body.email || 'admin@example.com',
      name: 'Administrador',
      role: 'admin'
    }
  });
});

router.post('/register', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Usuário registrado com sucesso',
    userId: '1'
  });
});

router.get('/check', (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Administrador',
      role: 'admin'
    }
  });
});

module.exports = router;