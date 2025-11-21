const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = header.split(' ')[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email
    };

    next();

  } catch (err) {
    console.error('Erro ao verificar token Firebase:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
};
