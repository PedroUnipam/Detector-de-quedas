// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Registrar novo usuário
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const {
      nome, cpf, email, telefone, dataNascimento, senha,
      cep, logradouro, numero, complemento, bairro, cidade, uf
    } = req.body;

    // Validações
    if (!nome || !cpf || !email || !senha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, CPF, email e senha são obrigatórios' 
      });
    }

    // Verificar se usuário já existe
    const [existing] = await connection.query(
      'SELECT idusuario FROM usuario WHERE cpf = ? OR email = ?',
      [cpf, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'CPF ou email já cadastrado' 
      });
    }

    await connection.beginTransaction();

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const [userResult] = await connection.query(
      `INSERT INTO usuario (nome, cpf, email, telefone, dataNascimento, senha, datacadastro, ativo)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [nome, cpf, email, telefone, dataNascimento, senhaHash]
    );

    const userId = userResult.insertId;

    // Inserir endereço se fornecido
    if (cep && logradouro && cidade && uf) {
      const [enderecoResult] = await connection.query(
        `INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, iduf)
         VALUES (?, ?, ?, ?, ?, ?, (SELECT iduf FROM uf WHERE sigla = ?))`,
        [cep, logradouro, numero, complemento, bairro, cidade, uf]
      );

      // Relacionar usuário com endereço
      await connection.query(
        'INSERT INTO usuarioendereco (idusuario, idendereco) VALUES (?, ?)',
        [userId, enderecoResult.insertId]
      );
    }

    await connection.commit();

    // Gerar token
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: {
        token,
        user: {
          id: userId,
          nome,
          email,
          cpf
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar usuário',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário
    const [users] = await db.query(
      'SELECT idusuario, nome, email, cpf, senha, ativo FROM usuario WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha inválidos' 
      });
    }

    const user = users[0];

    // Verificar se está ativo
    if (!user.ativo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuário inativo' 
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha inválidos' 
      });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.idusuario, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.idusuario,
          nome: user.nome,
          email: user.email,
          cpf: user.cpf
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao realizar login',
      error: error.message 
    });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    // O middleware já validou o token e adicionou req.user
    const [users] = await db.query(
      'SELECT idusuario, nome, email, cpf FROM usuario WHERE idusuario = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar token',
      error: error.message 
    });
  }
};