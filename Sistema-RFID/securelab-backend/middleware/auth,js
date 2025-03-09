// middleware/auth.js
const admin = require('../config/firebase-admin');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token de autenticação não fornecido' 
      });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido ou expirado' 
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
};