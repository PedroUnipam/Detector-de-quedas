// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ==================== REGISTRAR NOVO USUÁRIO ====================
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Dados recebidos:', req.body);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const {
      nome, cpf, email, telefone, dataNascimento, senha,
      cep, logradouro, numero, complemento, bairro, cidade, uf
    } = req.body;

    // Validações básicas
    if (!nome || !cpf || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome, CPF, email e senha são obrigatórios'
      });
    }

    console.log('✅ Validação inicial passou');

    // Verificar se usuário já existe
    const [existingPessoa] = await connection.query(
      'SELECT id_pessoa FROM pessoa WHERE cpf = ? OR email = ?',
      [cpf, email]
    );

    if (existingPessoa.length > 0) {
      console.log('⚠️ Usuário já existe');
      return res.status(409).json({
        success: false,
        message: 'CPF ou email já cadastrado'
      });
    }

    console.log('✅ Usuário não existe, iniciando transação...');
    await connection.beginTransaction();

    try {
      // 1. Hash da senha
      console.log('🔐 Gerando hash da senha...');
      const senhaHash = await bcrypt.hash(senha, 10);

      // 2. Inserir na tabela PESSOA
      console.log('💾 Inserindo na tabela pessoa...');
      const [pessoaResult] = await connection.query(
        `INSERT INTO pessoa (nome, cpf, email, telefone, senha_hash, data_cadastro, status_ativo)
         VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
        [nome, cpf, email, telefone || null, senhaHash]
      );

      const idPessoa = pessoaResult.insertId;
      console.log('✅ Pessoa inserida com ID:', idPessoa);

      // 3. Inserir ENDEREÇO (se fornecido)
      let idEndereco = null;
      
      if (cep && logradouro && cidade && uf) {
        console.log('📍 Inserindo endereço...');
        
        // Buscar id_estado pela sigla
        const [estadoResult] = await connection.query(
          'SELECT id_estado FROM uf WHERE sigla = ?',
          [uf]
        );

        if (estadoResult.length === 0) {
          throw new Error(`Estado com sigla "${uf}" não encontrado`);
        }

        const idEstado = estadoResult[0].id_estado;

        const [enderecoResult] = await connection.query(
          `INSERT INTO endereco (cep, logradouro, numero, bairro, cidade, complemento, id_estado)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cep, logradouro, numero || 'S/N', bairro || '', cidade, complemento || null, idEstado]
        );

        idEndereco = enderecoResult.insertId;
        console.log('✅ Endereço inserido com ID:', idEndereco);
      } else {
        // Criar endereço padrão se não fornecido
        console.log('⚠️ Endereço não fornecido, criando endereço padrão...');
        const [enderecoResult] = await connection.query(
          `INSERT INTO endereco (cep, logradouro, numero, bairro, cidade, complemento, id_estado)
           VALUES ('00000-000', 'Não informado', 'S/N', 'Não informado', 'Não informado', NULL, 1)`,
        );
        idEndereco = enderecoResult.insertId;
      }

      // 4. Inserir na tabela USUARIO
      console.log('👤 Inserindo na tabela usuario...');
      const [usuarioResult] = await connection.query(
        `INSERT INTO usuario (id_pessoa, id_endereco, data_nascimento, consentimento_lgpd)
         VALUES (?, ?, ?, 1)`,
        [idPessoa, idEndereco, dataNascimento || null]
      );

      const idUsuario = usuarioResult.insertId;
      console.log('✅ Usuário inserido com ID:', idUsuario);

      await connection.commit();
      console.log('✅ Transação commitada com sucesso');

      // 5. Gerar token JWT
      const token = jwt.sign(
        { id: idUsuario, email, idPessoa },
        process.env.JWT_SECRET || 'falldetector_secret_key_2024',
        { expiresIn: '7d' }
      );

      console.log('🎉 Registro concluído com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso',
        data: {
          token,
          user: {
            id: idUsuario,
            idPessoa: idPessoa,
            nome,
            email,
            cpf
          }
        }
      });

    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERRO DETALHADO NO REGISTRO:');
    console.error('Mensagem:', error.message);
    console.error('SQL:', error.sql);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar usuário',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.sql : undefined
    });
  } finally {
    connection.release();
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    console.log('🔐 Tentativa de login:', email);

    // Buscar pessoa e usuário
    const [results] = await db.query(
      `SELECT 
        p.id_pessoa, 
        p.nome, 
        p.email, 
        p.cpf, 
        p.senha_hash, 
        p.status_ativo,
        u.id_usuario
       FROM pessoa p
       INNER JOIN usuario u ON u.id_pessoa = p.id_pessoa
       WHERE p.email = ?`,
      [email]
    );

    if (results.length === 0) {
      console.log('⚠️ Usuário não encontrado');
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    const user = results[0];

    // Verificar se está ativo
    if (!user.status_ativo) {
      console.log('⚠️ Usuário inativo');
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      console.log('⚠️ Senha inválida');
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Atualizar último acesso
    await db.query(
      'UPDATE pessoa SET ultimo_acesso = NOW() WHERE id_pessoa = ?',
      [user.id_pessoa]
    );

    // Gerar token
    const token = jwt.sign(
      { id: user.id_usuario, email: user.email, idPessoa: user.id_pessoa },
      process.env.JWT_SECRET || 'falldetector_secret_key_2024',
      { expiresIn: '7d' }
    );

    console.log('✅ Login realizado com sucesso');

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id_usuario,
          idPessoa: user.id_pessoa,
          nome: user.nome,
          email: user.email,
          cpf: user.cpf
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login',
      error: error.message
    });
  }
};

// ==================== VERIFICAR TOKEN ====================
exports.verifyToken = async (req, res) => {
  try {
    // O middleware já validou o token e adicionou req.user
    const [results] = await db.query(
      `SELECT 
        p.id_pessoa, 
        p.nome, 
        p.email, 
        p.cpf,
        u.id_usuario
       FROM pessoa p
       INNER JOIN usuario u ON u.id_pessoa = p.id_pessoa
       WHERE u.id_usuario = ?`,
      [req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: results[0]
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar token',
      error: error.message
    });
  }
};