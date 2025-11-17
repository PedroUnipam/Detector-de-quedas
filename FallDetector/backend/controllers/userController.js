// controllers/userController.js - VERSÃO COMPLETA COM TODAS AS FUNÇÕES

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// ==================== OBTER PERFIL DO USUÁRIO ====================
exports.getProfile = async (req, res) => {
  try {
    console.log('📋 Buscando perfil do usuário ID:', req.user.id);
   
    const [rows] = await pool.query(
      `SELECT
        u.id_usuario as id,
        p.id_pessoa,
        p.nome,
        p.email,
        p.cpf,
        p.telefone,
        u.data_nascimento,
        u.foto_perfil,
        u.id_endereco,
        e.cep,
        e.logradouro,
        e.numero,
        e.bairro,
        e.cidade,
        e.complemento,
        uf.sigla as uf,
        p.data_cadastro,
        p.ultimo_acesso
       FROM usuario u
       INNER JOIN pessoa p ON u.id_pessoa = p.id_pessoa
       LEFT JOIN endereco e ON u.id_endereco = e.id_endereco
       LEFT JOIN uf ON e.id_estado = uf.id_estado
       WHERE u.id_usuario = ? AND p.status_ativo = 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      console.log('⚠️ Usuário não encontrado para ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    console.log('✅ Perfil encontrado:', rows[0].nome);
    res.json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    console.error('❌ Erro ao obter perfil:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==================== ATUALIZAR PERFIL ====================
exports.updateProfile = async (req, res) => {
  const connection = await pool.getConnection();
 
  try {
    const {
      nome,
      email,
      telefone,
      data_nascimento,
      foto_perfil,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      uf,
      complemento
    } = req.body;

    console.log('✏️ ========== INÍCIO ATUALIZAÇÃO PERFIL ==========');
    console.log('👤 Usuário ID:', req.user.id);

    // Validar campos obrigatórios
    if (!nome || !nome.trim()) {
      console.log('❌ Nome não fornecido ou vazio');
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório.'
      });
    }

    await connection.beginTransaction();

    try {
      // Buscar dados atuais do usuário
      const [userRows] = await connection.query(
        `SELECT p.email, u.id_endereco, u.id_pessoa
         FROM pessoa p
         INNER JOIN usuario u ON p.id_pessoa = u.id_pessoa
         WHERE u.id_usuario = ?`,
        [req.user.id]
      );

      if (userRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      const emailToUpdate = email || userRows[0].email;
      const idEnderecoAtual = userRows[0].id_endereco;
      const idPessoa = userRows[0].id_pessoa;

      // Atualizar dados na tabela pessoa
      await connection.query(
        `UPDATE pessoa
         SET nome = ?, email = ?, telefone = ?
         WHERE id_pessoa = ?`,
        [nome.trim(), emailToUpdate, telefone || null, idPessoa]
      );

      // Atualizar data de nascimento e foto de perfil se fornecidos
      const updateUserFields = [];
      const updateUserValues = [];

      if (data_nascimento) {
        updateUserFields.push('data_nascimento = ?');
        updateUserValues.push(data_nascimento);
      }

      if (foto_perfil !== undefined) {
        if (foto_perfil && foto_perfil.startsWith('/img/')) {
          updateUserFields.push('foto_perfil = ?');
          updateUserValues.push(foto_perfil);
        } else if (foto_perfil === null || foto_perfil === '') {
          updateUserFields.push('foto_perfil = ?');
          updateUserValues.push(null);
        }
      }

      if (updateUserFields.length > 0) {
        updateUserValues.push(req.user.id);
        await connection.query(
          `UPDATE usuario SET ${updateUserFields.join(', ')} WHERE id_usuario = ?`,
          updateUserValues
        );
      }

      // Atualizar ou criar endereço
      const hasCompleteAddress = cep && logradouro && numero && cidade && uf;
     
      if (hasCompleteAddress) {
        const [ufRows] = await connection.query(
          'SELECT id_estado FROM uf WHERE sigla = ?',
          [uf.toUpperCase().trim()]
        );

        if (ufRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `UF inválida: ${uf}`
          });
        }

        const idEstado = ufRows[0].id_estado;

        const enderecoData = {
          cep: cep.trim(),
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          bairro: bairro?.trim() || '',
          cidade: cidade.trim(),
          complemento: complemento?.trim() || null,
          id_estado: idEstado
        };

        if (idEnderecoAtual) {
          await connection.query(
            `UPDATE endereco
             SET cep = ?, logradouro = ?, numero = ?, bairro = ?, cidade = ?, complemento = ?, id_estado = ?
             WHERE id_endereco = ?`,
            [
              enderecoData.cep,
              enderecoData.logradouro,
              enderecoData.numero,
              enderecoData.bairro,
              enderecoData.cidade,
              enderecoData.complemento,
              enderecoData.id_estado,
              idEnderecoAtual
            ]
          );
        } else {
          const [enderecoResult] = await connection.query(
            `INSERT INTO endereco (cep, logradouro, numero, bairro, cidade, complemento, id_estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              enderecoData.cep,
              enderecoData.logradouro,
              enderecoData.numero,
              enderecoData.bairro,
              enderecoData.cidade,
              enderecoData.complemento,
              enderecoData.id_estado
            ]
          );

          const novoIdEndereco = enderecoResult.insertId;
          await connection.query(
            'UPDATE usuario SET id_endereco = ? WHERE id_usuario = ?',
            [novoIdEndereco, req.user.id]
          );
        }
      }

      await connection.commit();
      console.log('✅ Perfil atualizado com sucesso');

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso.'
      });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (err) {
    console.error('❌ Erro ao atualizar perfil:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil.',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
    });
  } finally {
    connection.release();
  }
};

// ==================== ALTERAR SENHA ====================
exports.changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias.'
      });
    }

    console.log('🔐 Alterando senha do usuário ID:', req.user.id);

    const [rows] = await pool.query(
      `SELECT p.senha_hash
       FROM pessoa p
       INNER JOIN usuario u ON p.id_pessoa = u.id_pessoa
       WHERE u.id_usuario = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const senhaValida = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
   
    if (!senhaValida) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta.'
      });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      `UPDATE pessoa p
       INNER JOIN usuario u ON p.id_pessoa = u.id_pessoa
       SET p.senha_hash = ?
       WHERE u.id_usuario = ?`,
      [novaSenhaHash, req.user.id]
    );

    console.log('✅ Senha alterada com sucesso');

    res.json({
      success: true,
      message: 'Senha alterada com sucesso.'
    });
  } catch (err) {
    console.error('❌ Erro ao alterar senha:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha.',
      error: err.message
    });
  }
};

// ==================== LISTAR TIPOS DE CUIDADOR ====================
exports.getTiposCuidador = async (req, res) => {
  try {
    console.log('📋 Listando tipos de cuidador');

    const [tipos] = await pool.query(
      `SELECT id_tipocuidador, descricao 
       FROM tipocuidador 
       ORDER BY descricao ASC`
    );

    console.log(`✅ ${tipos.length} tipos encontrados`);

    res.json({
      success: true,
      tipos: tipos
    });

  } catch (err) {
    console.error('❌ Erro ao listar tipos de cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de cuidador.',
      error: err.message
    });
  }
};

// ==================== LISTAR CUIDADORES ====================
exports.getCuidadores = async (req, res) => {
  try {
    console.log('📋 Listando cuidadores do usuário ID:', req.user.id);

    const [cuidadores] = await pool.query(
      `SELECT
        c.id_cuidador as id,
        p.nome,
        p.email,
        p.telefone,
        tc.descricao as parentesco,
        uc.data_vinculo,
        uc.ativo
       FROM usuario_cuidador uc
       INNER JOIN cuidador c ON uc.id_cuidador = c.id_cuidador
       INNER JOIN pessoa p ON c.id_pessoa = p.id_pessoa
       INNER JOIN tipocuidador tc ON c.id_tipocuidador = tc.id_tipocuidador
       WHERE uc.id_usuario = ? AND uc.ativo = 1
       ORDER BY uc.data_vinculo DESC`,
      [req.user.id]
    );

    console.log(`✅ Encontrados ${cuidadores.length} cuidadores`);

    res.json({
      success: true,
      cuidadores: cuidadores
    });
  } catch (err) {
    console.error('❌ Erro ao listar cuidadores:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cuidadores.',
      error: err.message
    });
  }
};

// ==================== ADICIONAR CUIDADOR ====================
exports.addCuidador = async (req, res) => {
  const connection = await pool.getConnection();
 
  try {
    const { nome, cpf, email, telefone, parentesco, id_tipocuidador } = req.body;

    // Validação básica
    if (!nome || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios.'
      });
    }

    console.log('➕ Adicionando cuidador para usuário ID:', req.user.id);

    await connection.beginTransaction();

    try {
      // Gerar CPF e email fictícios se não fornecidos
      const cpfGerado = cpf || `999${Date.now()}`.slice(0, 11);
      const emailGerado = email || `cuidador${Date.now()}@falldetector.temp`;

      // Verificar se a pessoa já existe (por telefone)
      let [existingPessoa] = await connection.query(
        'SELECT id_pessoa FROM pessoa WHERE telefone = ?',
        [telefone]
      );

      let idPessoa;

      if (existingPessoa.length > 0) {
        idPessoa = existingPessoa[0].id_pessoa;
        await connection.query(
          'UPDATE pessoa SET nome = ?, email = ? WHERE id_pessoa = ?',
          [nome, emailGerado, idPessoa]
        );
      } else {
        const senhaTemporaria = Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

        const [pessoaResult] = await connection.query(
          `INSERT INTO pessoa (nome, cpf, email, telefone, senha_hash, status_ativo)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [nome, cpfGerado, emailGerado, telefone, senhaHash]
        );

        idPessoa = pessoaResult.insertId;
      }

      // Determinar id_tipocuidador
      let tipoFinal = id_tipocuidador || 1;

      // Verificar se já é cuidador
      const [existingCuidador] = await connection.query(
        'SELECT id_cuidador FROM cuidador WHERE id_pessoa = ?',
        [idPessoa]
      );

      let idCuidador;

      if (existingCuidador.length > 0) {
        idCuidador = existingCuidador[0].id_cuidador;
        await connection.query(
          'UPDATE cuidador SET id_tipocuidador = ? WHERE id_cuidador = ?',
          [tipoFinal, idCuidador]
        );
      } else {
        const [cuidadorResult] = await connection.query(
          'INSERT INTO cuidador (id_pessoa, id_tipocuidador) VALUES (?, ?)',
          [idPessoa, tipoFinal]
        );

        idCuidador = cuidadorResult.insertId;
      }

      // Verificar se o vínculo já existe
      const [existingVinculo] = await connection.query(
        'SELECT id_vinculo, ativo FROM usuario_cuidador WHERE id_usuario = ? AND id_cuidador = ?',
        [req.user.id, idCuidador]
      );

      if (existingVinculo.length > 0) {
        if (existingVinculo[0].ativo === 0) {
          await connection.query(
            'UPDATE usuario_cuidador SET ativo = 1 WHERE id_vinculo = ?',
            [existingVinculo[0].id_vinculo]
          );
        } else {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Este cuidador já está vinculado ao usuário.'
          });
        }
      } else {
        await connection.query(
          'INSERT INTO usuario_cuidador (id_usuario, id_cuidador, ativo) VALUES (?, ?, 1)',
          [req.user.id, idCuidador]
        );
      }

      await connection.commit();
      console.log('✅ Cuidador adicionado com sucesso');

      res.status(201).json({
        success: true,
        message: 'Cuidador adicionado com sucesso.',
        data: {
          id_cuidador: idCuidador,
          nome,
          telefone,
          parentesco
        }
      });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (err) {
    console.error('❌ Erro ao adicionar cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar cuidador.',
      error: err.message
    });
  } finally {
    connection.release();
  }
};

// ==================== ATUALIZAR CUIDADOR ====================
exports.updateCuidador = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { cuidadorId } = req.params;
    const { nome, telefone, parentesco, id_tipocuidador, email } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios.'
      });
    }

    console.log('✏️ Atualizando cuidador ID:', cuidadorId, 'pelo usuário:', req.user.id);

    await connection.beginTransaction();

    try {
      const [vinculo] = await connection.query(
        `SELECT uc.id_vinculo, c.id_pessoa, c.id_tipocuidador
         FROM usuario_cuidador uc
         INNER JOIN cuidador c ON uc.id_cuidador = c.id_cuidador
         WHERE uc.id_usuario = ? AND uc.id_cuidador = ? AND uc.ativo = 1`,
        [req.user.id, cuidadorId]
      );

      if (vinculo.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Cuidador não encontrado ou não pertence a este usuário.'
        });
      }

      const idPessoa = vinculo[0].id_pessoa;

      await connection.query(
        `UPDATE pessoa
         SET nome = ?, telefone = ?, email = ?
         WHERE id_pessoa = ?`,
        [nome.trim(), telefone.trim(), email?.trim() || null, idPessoa]
      );

      const tipoFinal = id_tipocuidador || vinculo[0].id_tipocuidador;

      await connection.query(
        'UPDATE cuidador SET id_tipocuidador = ? WHERE id_cuidador = ?',
        [tipoFinal, cuidadorId]
      );

      await connection.commit();
      console.log('✅ Cuidador atualizado com sucesso');

      res.json({
        success: true,
        message: 'Cuidador atualizado com sucesso.'
      });

    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }

  } catch (err) {
    console.error('❌ Erro ao atualizar cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cuidador.',
      error: err.message
    });
  } finally {
    connection.release();
  }
};

// ==================== REMOVER CUIDADOR ====================
exports.removeCuidador = async (req, res) => {
  try {
    const { cuidadorId } = req.params;

    console.log('🗑️ Removendo cuidador ID:', cuidadorId, 'do usuário:', req.user.id);

    const [vinculo] = await pool.query(
      'SELECT id_vinculo FROM usuario_cuidador WHERE id_usuario = ? AND id_cuidador = ? AND ativo = 1',
      [req.user.id, cuidadorId]
    );

    if (vinculo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vínculo não encontrado ou já foi removido.'
      });
    }

    await pool.query(
      'UPDATE usuario_cuidador SET ativo = 0 WHERE id_usuario = ? AND id_cuidador = ?',
      [req.user.id, cuidadorId]
    );

    console.log('✅ Cuidador removido com sucesso');

    res.json({
      success: true,
      message: 'Cuidador removido com sucesso.'
    });
  } catch (err) {
    console.error('❌ Erro ao remover cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover cuidador.',
      error: err.message
    });
  }
};