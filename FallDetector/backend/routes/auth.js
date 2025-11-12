// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste o caminho se seu db.js estiver em outro lugar
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
    }

    // Verifica se usuário já existe
    const [existing] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'E-mail já cadastrado.' });
    }

    // Criptografa a senha
    const hashed = await bcrypt.hash(senha, 10);

    // Insere novo usuário
    await db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hashed]);

    res.status(201).json({ success: true, message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor ao registrar usuário.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Senha incorreta.' });
    }

    // Gera token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'segredo', {
      expiresIn: '8h'
    });

    res.json({
      success: true,
      message: 'Login bem-sucedido!',
      token,
      user: { id: user.id, nome: user.nome, email: user.email }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor.' });
  }
});

module.exports = router;
