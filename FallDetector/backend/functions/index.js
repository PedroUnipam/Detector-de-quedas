const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_REGEX = /^ExponentPushToken\[/;

exports.notificarQuedaGlobal = onDocumentCreated("quedas/{docId}", async (event) => {
  const data = event.data.data();

  const deviceId = data.deviceId || "desconhecido";
  const nivel = data.fallLevel || 0;
  const intensidade = data.accMag || 0;
  const timestamp = data.timestamp || "";

  logger.info("🔥 Nova queda detectada:", data);

  // 1. Buscar todos tokens
  const snap = await admin.firestore().collection("expoTokens").get();
  if (snap.empty) {
    logger.warn("⚠ Nenhum token encontrado.");
    return;
  }

  // 2. Validar tokens Expo válidos
  const tokens = snap.docs
    .map((d) => d.id)
    .filter((token) => {
      if (!EXPO_TOKEN_REGEX.test(token)) {
        logger.warn("⚠ Token inválido:", token);
        return false;
      }
      return true;
    });

  if (tokens.length === 0) {
    logger.warn("⚠ Nenhum token válido para envio.");
    return;
  }

  logger.info("📨 Tokens para envio individual:", tokens);

  // 3. Enviar notificação para cada token individualmente
  for (const token of tokens) {
    const message = {
      to: token,
      sound: "default",
      title: "🚨 Queda detectada!",
      body: `Dispositivo: ${deviceId} • Nível: ${nivel} • Intensidade: ${intensidade.toFixed(2)}`,
      data: { deviceId, nivel, intensidade, timestamp }
    };

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      });

      const resp = await response.text();
      logger.info(`📬 Resposta Expo para token ${token}:`, resp);

    } catch (err) {
      logger.error(`❌ Erro ao enviar para token ${token}:`, err);
    }
  }
});
