const admin = require('firebase-admin');
const db = admin.firestore();

const DISPOSITIVOS = 'dispositivos';

exports.getUserDevices = async (req, res) => {
  try {
    const snap = await db.collection(DISPOSITIVOS)
      .where('usuarioId', '==', req.user.id)
      .orderBy('data_vinculacao', 'desc')
      .get();

    const devices = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        usuario_id: d.usuarioId,
        nome: d.numero_serie,
        tipo: d.tipo_conexao || 'wifi',
        config: d.config || null,
        ativo: d.status_conectividade === 'conectado',
        data_criacao: d.data_vinculacao
      };
    });

    res.json({ success: true, devices });
  } catch (err) {
    console.error('Erro ao listar dispositivos (Firestore):', err);
    res.status(500).json({ success: false, message: 'Erro ao listar dispositivos.' });
  }
};

exports.addDevice = async (req, res) => {
  try {
    const { nome, tipo, config, ativo = true } = req.body;

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

    const numeroSerie = nome; // ou gerar como antes

    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection(DISPOSITIVOS).add({
      usuarioId: req.user.id,
      numero_serie: numeroSerie,
      data_vinculacao: now,
      ultimo_sincronismo: null,
      nivel_bateria: 100,
      status_conectividade: ativo ? 'conectado' : 'desconectado',
      tipo_conexao: tipo,
      config: config || null
    });

    let configInstructions = '';
    if (tipo === 'wifi' && config) {
      configInstructions = `
// ==================== CONFIGURAÇÕES WiFi ====================
const char* ssid = "${config.ssid}";
const char* password = "${config.password}";
const char* serverUrl = "${config.serverUrl}";
const int deviceId = ${JSON.stringify(docRef.id)};
      `;
    }

    res.status(201).json({
      success: true,
      message: 'Dispositivo adicionado com sucesso.',
      deviceId: docRef.id,
      numeroSerie,
      config,
      esp32Code: configInstructions
    });
  } catch (err) {
    console.error('Erro ao adicionar dispositivo (Firestore):', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar dispositivo.',
      error: err.message
    });
  }
};
