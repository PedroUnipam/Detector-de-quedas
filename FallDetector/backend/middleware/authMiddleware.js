// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  try {
    // Buscar token no header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        success: false, 
        message: 'Formato de token inválido' 
      });
    }

    const token = parts[1];

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token inválido ou expirado' 
        });
      }

      // Adicionar informações do usuário ao request
      req.user = {
        id: decoded.id,
        email: decoded.email
      };

      next();
    });

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar token',
      error: error.message 
    });
  }
};

module.exports = verifyToken;