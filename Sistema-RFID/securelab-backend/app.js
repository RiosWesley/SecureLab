// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importando rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const doorRoutes = require('./routes/doors');
const deviceRoutes = require('./routes/devices');
const logRoutes = require('./routes/logs');

// Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doors', doorRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/logs', logRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('SecureLab RFID API está funcionando!');
});

// Middleware de tratamento de erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;