const pool = require('../config/database');

// Obter perfil do usuário
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, email FROM usuarios WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    res.status(500).json({ success: false, message: 'Erro ao obter perfil.' });
  }
};

// Atualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { nome, email } = req.body;
    await pool.query('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [nome, email, req.user.id]);
    res.json({ success: true, message: 'Perfil atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil.' });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const [rows] = await pool.query('SELECT senha FROM usuarios WHERE id = ?', [req.user.id]);

    if (rows.length === 0 || rows[0].senha !== senhaAtual) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta.' });
    }

    await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenha, req.user.id]);
    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ success: false, message: 'Erro ao alterar senha.' });
  }
};

// Adicionar cuidador
exports.addCaregiver = async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    await pool.query('INSERT INTO cuidadores (usuario_id, nome, telefone) VALUES (?, ?, ?)', [req.user.id, nome, telefone]);
    res.json({ success: true, message: 'Cuidador adicionado com sucesso.' });
  } catch (err) {
    console.error('Erro ao adicionar cuidador:', err);
    res.status(500).json({ success: false, message: 'Erro ao adicionar cuidador.' });
  }
};

// Remover cuidador
exports.removeCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    await pool.query('DELETE FROM cuidadores WHERE id = ? AND usuario_id = ?', [caregiverId, req.user.id]);
    res.json({ success: true, message: 'Cuidador removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover cuidador:', err);
    res.status(500).json({ success: false, message: 'Erro ao remover cuidador.' });
  }
};
