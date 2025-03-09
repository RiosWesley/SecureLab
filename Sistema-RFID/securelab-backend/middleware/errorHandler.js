// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error(err.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'production' ? 'Um erro ocorreu' : err.message
    });
  };