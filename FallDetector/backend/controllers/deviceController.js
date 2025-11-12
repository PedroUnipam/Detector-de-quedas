const pool = require('../config/database');

// Listar dispositivos do usuário
exports.getUserDevices = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dispositivos WHERE usuario_id = ?', [req.user.id]);
    res.json({ success: true, devices: rows });
  } catch (err) {
    console.error('Erro ao listar dispositivos:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar dispositivos.' });
  }
};

// Detalhes de um dispositivo específico
exports.getDeviceDetails = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const [rows] = await pool.query('SELECT * FROM dispositivos WHERE id = ? AND usuario_id = ?', [deviceId, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispositivo não encontrado.' });
    }
    res.json({ success: true, device: rows[0] });
  } catch (err) {
    console.error('Erro ao obter dispositivo:', err);
    res.status(500).json({ success: false, message: 'Erro ao obter dispositivo.' });
  }
};

// Adicionar novo dispositivo
exports.addDevice = async (req, res) => {
  try {
    const { nome, tipo } = req.body;
    await pool.query('INSERT INTO dispositivos (usuario_id, nome, tipo) VALUES (?, ?, ?)', [req.user.id, nome, tipo]);
    res.json({ success: true, message: 'Dispositivo adicionado com sucesso.' });
  } catch (err) {
    console.error('Erro ao adicionar dispositivo:', err);
    res.status(500).json({ success: false, message: 'Erro ao adicionar dispositivo.' });
  }
};

// Atualizar dispositivo
exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { nome, tipo } = req.body;
    await pool.query('UPDATE dispositivos SET nome = ?, tipo = ? WHERE id = ? AND usuario_id = ?', [nome, tipo, deviceId, req.user.id]);
    res.json({ success: true, message: 'Dispositivo atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar dispositivo:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar dispositivo.' });
  }
};

// Deletar dispositivo
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    await pool.query('DELETE FROM dispositivos WHERE id = ? AND usuario_id = ?', [deviceId, req.user.id]);
    res.json({ success: true, message: 'Dispositivo removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao deletar dispositivo:', err);
    res.status(500).json({ success: false, message: 'Erro ao deletar dispositivo.' });
  }
};

// Ativar/desativar dispositivo (opcional)
exports.toggleDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    await pool.query('UPDATE dispositivos SET ativo = NOT ativo WHERE id = ? AND usuario_id = ?', [deviceId, req.user.id]);
    res.json({ success: true, message: 'Status do dispositivo atualizado.' });
  } catch (err) {
    console.error('Erro ao atualizar status do dispositivo:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar status do dispositivo.' });
  }
};
