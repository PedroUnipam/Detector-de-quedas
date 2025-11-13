const pool = require('../config/database');

// Listar dispositivos do usuário com configurações
exports.getUserDevices = async (req, res) => {
  try {
    console.log('📱 Buscando dispositivos do usuário:', req.user.id);
    
    const [rows] = await pool.query(
      `SELECT 
        id_dispositivo as id, 
        fk_dispositivo_usuario as usuario_id, 
        numero_serie as nome, 
        tipo_conexao as tipo,
        ultimo_sincronismo,
        nivel_bateria,
        status_conectividade as ativo
      FROM dispositivo 
      WHERE fk_dispositivo_usuario = ?
      ORDER BY data_vinculacao DESC`,
      [req.user.id]
    );
    
    console.log('✅ Dispositivos encontrados:', rows.length);
    
    // Adaptar para o formato esperado pelo app
    const devices = rows.map(device => ({
      id: device.id,
      usuario_id: device.usuario_id,
      nome: device.nome,
      tipo: device.tipo || 'wifi',
      config: null, // Será adicionado em próxima atualização
      ativo: device.ativo === 'conectado',
      data_criacao: device.ultimo_sincronismo
    }));
    
    res.json({ success: true, devices });
  } catch (err) {
    console.error('❌ Erro ao listar dispositivos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar dispositivos.',
      error: err.message 
    });
  }
};

// Detalhes de um dispositivo específico
exports.getDeviceDetails = async (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log('📱 Buscando dispositivo:', deviceId);
    
    const [rows] = await pool.query(
      `SELECT * FROM dispositivo 
      WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?`, 
      [deviceId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispositivo não encontrado.' });
    }

    const device = {
      id: rows[0].id_dispositivo,
      usuario_id: rows[0].fk_dispositivo_usuario,
      nome: rows[0].numero_serie,
      tipo: rows[0].tipo_conexao || 'wifi',
      config: null,
      ativo: rows[0].status_conectividade === 'conectado'
    };

    res.json({ success: true, device });
  } catch (err) {
    console.error('❌ Erro ao obter dispositivo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter dispositivo.',
      error: err.message 
    });
  }
};

// Adicionar novo dispositivo
exports.addDevice = async (req, res) => {
  try {
    console.log('📱 Adicionando dispositivo...');
    console.log('Body recebido:', req.body);
    console.log('Usuário:', req.user.id);
    
    const { nome, tipo, config, ativo = true } = req.body;

    // Validações
    if (!nome || !tipo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e tipo são obrigatórios.' 
      });
    }

    if (!['wifi', 'bluetooth'].includes(tipo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo deve ser "wifi" ou "bluetooth".' 
      });
    }

    // Gerar número de série único
    const numeroSerie = `${tipo.toUpperCase()}-${Date.now()}`;
    
    console.log('💾 Salvando no banco:', { nome, tipo, numeroSerie });

    const [result] = await pool.query(
      `INSERT INTO dispositivo 
      (fk_dispositivo_usuario, numero_serie, tipo_conexao, status_conectividade, data_vinculacao) 
      VALUES (?, ?, ?, ?, NOW())`,
      [req.user.id, numeroSerie, tipo, ativo ? 'conectado' : 'desconectado']
    );

    console.log('✅ Dispositivo adicionado com ID:', result.insertId);

    // Retornar as configurações para o usuário copiar
    let configInstructions = '';
    if (tipo === 'wifi' && config) {
      configInstructions = `
// ==================== CONFIGURAÇÕES WiFi ====================
const char* ssid = "${config.ssid}";
const char* password = "${config.password}";
const char* serverUrl = "${config.serverUrl}";
const int deviceId = ${result.insertId};
      `;
    }

    res.status(201).json({ 
      success: true, 
      message: 'Dispositivo adicionado com sucesso.',
      deviceId: result.insertId,
      numeroSerie: numeroSerie,
      config: config,
      esp32Code: configInstructions
    });
  } catch (err) {
    console.error('❌ Erro ao adicionar dispositivo:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar dispositivo.',
      error: err.message 
    });
  }
};

// Atualizar dispositivo
exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { nome, tipo, config, ativo } = req.body;
    
    console.log('📝 Atualizando dispositivo:', deviceId);
    console.log('Dados:', { nome, tipo, config, ativo });

    // Verificar se dispositivo existe e pertence ao usuário
    const [existing] = await pool.query(
      'SELECT id_dispositivo FROM dispositivo WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?',
      [deviceId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dispositivo não encontrado.' 
      });
    }

    const updates = [];
    const values = [];

    if (nome !== undefined) {
      updates.push('numero_serie = ?');
      values.push(nome);
    }
    if (tipo !== undefined) {
      updates.push('tipo_conexao = ?');
      values.push(tipo);
    }
    if (ativo !== undefined) {
      updates.push('status_conectividade = ?');
      values.push(ativo ? 'conectado' : 'desconectado');
    }

    updates.push('ultimo_sincronismo = NOW()');
    values.push(deviceId, req.user.id);

    await pool.query(
      `UPDATE dispositivo 
      SET ${updates.join(', ')} 
      WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?`,
      values
    );

    res.json({ success: true, message: 'Dispositivo atualizado com sucesso.' });
  } catch (err) {
    console.error('❌ Erro ao atualizar dispositivo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar dispositivo.',
      error: err.message 
    });
  }
};

// Deletar dispositivo
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM dispositivo WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?',
      [deviceId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dispositivo não encontrado.' 
      });
    }

    res.json({ success: true, message: 'Dispositivo removido com sucesso.' });
  } catch (err) {
    console.error('❌ Erro ao deletar dispositivo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar dispositivo.',
      error: err.message 
    });
  }
};

// Ativar/desativar dispositivo
exports.toggleDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Buscar status atual
    const [rows] = await pool.query(
      'SELECT status_conectividade FROM dispositivo WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?',
      [deviceId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispositivo não encontrado.' });
    }

    const novoStatus = rows[0].status_conectividade === 'conectado' ? 'desconectado' : 'conectado';

    await pool.query(
      `UPDATE dispositivo 
      SET status_conectividade = ?, ultimo_sincronismo = NOW() 
      WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?`,
      [novoStatus, deviceId, req.user.id]
    );

    res.json({ success: true, message: 'Status do dispositivo atualizado.' });
  } catch (err) {
    console.error('❌ Erro ao atualizar status do dispositivo:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar status do dispositivo.',
      error: err.message 
    });
  }
};

// Buscar dispositivos disponíveis (mock)
exports.scanDevices = async (req, res) => {
  try {
    const { tipo } = req.query;

    const mockDevices = tipo === 'wifi' 
      ? [
          { nome: 'ESP32-WiFi-001', tipo: 'wifi', disponivel: true },
          { nome: 'Monitor-WiFi-5G', tipo: 'wifi', disponivel: true }
        ]
      : [
          { nome: 'ESP32-BT-001', tipo: 'bluetooth', macAddress: 'AA:BB:CC:DD:EE:01', disponivel: true },
          { nome: 'Monitor-BT-002', tipo: 'bluetooth', macAddress: 'AA:BB:CC:DD:EE:02', disponivel: true }
        ];

    res.json({ 
      success: true, 
      dispositivos: mockDevices 
    });
  } catch (err) {
    console.error('❌ Erro ao buscar dispositivos:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dispositivos.',
      error: err.message 
    });
  }
};

// Obter código ESP32 configurado
exports.getESP32Code = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const [device] = await pool.query(
      'SELECT * FROM dispositivo WHERE id_dispositivo = ? AND fk_dispositivo_usuario = ?',
      [deviceId, req.user.id]
    );

    if (device.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dispositivo não encontrado.' 
      });
    }

    // Por enquanto, retorna configuração padrão
    // TODO: Armazenar config em campo JSON na tabela
    const code = `
// ==================== CONFIGURAÇÕES WiFi ====================
const char* ssid = "SEU_WIFI_SSID";
const char* password = "SUA_SENHA_WIFI";
const char* serverUrl = "http://192.168.0.10:3000/api/falls/register";
const int deviceId = ${deviceId};

// Cole este código no início do arquivo Main.cpp do ESP32
    `;

    res.json({ 
      success: true, 
      code,
      device: device[0]
    });
  } catch (err) {
    console.error('❌ Erro ao gerar código ESP32:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar código ESP32.',
      error: err.message 
    });
  }
};

module.exports = exports;