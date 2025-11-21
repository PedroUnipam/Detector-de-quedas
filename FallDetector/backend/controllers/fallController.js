const admin = require('firebase-admin');
const db = admin.firestore();

const QUEDAS = 'quedas';

exports.registerFall = async (req, res) => {
  try {
    const {
      device_id,
      accel_x,
      accel_y,
      accel_z,
      wifi_signal,
      timestamp
    } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: 'device_id é obrigatório'
      });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const accMag = Math.sqrt(
      (accel_x || 0) ** 2 +
      (accel_y || 0) ** 2 +
      (accel_z || 0) ** 2
    );

    // salvar queda no Firestore
    const docRef = await db.collection(QUEDAS).add({
      dispositivoId: String(device_id),
      data_hora: now,
      intensidade: accMag,
      confirmada: false,
      cancelada_manualmente: false,
      tempo_resposta: null,
      localizacao: null,
      accel_x,
      accel_y,
      accel_z,
      wifi_signal: wifi_signal || null,
      raw_timestamp_millis: timestamp || Date.now()
    });

    // enviar notificação via FCM (tópico "quedas")
    await admin.messaging().send({
      topic: 'quedas',
      notification: {
        title: '🚨 Queda detectada!',
        body: `Dispositivo ${device_id}: possível queda detectada`
      },
      data: {
        device_id: String(device_id),
        acc_mag: accMag.toFixed(2),
        quedaId: docRef.id
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Queda registrada e notificação enviada',
      id: docRef.id
    });
  } catch (err) {
    console.error('Erro no registerFall (Firestore):', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
};
