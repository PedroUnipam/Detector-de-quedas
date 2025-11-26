const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Expo } = require("expo-server-sdk");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const expo = new Expo();
const db = admin.firestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_REGEX = /^ExponentPushToken\[/;

// ========================================================
// 🔔 FUNÇÃO 1 — Notificação usando expo-server-sdk (OFICIAL)
// ========================================================
exports.notificarQueda = onDocumentCreated("quedas/{quedaId}", async (event) => {
  const data = event.data.data();

  logger.info("🔥 Nova queda detectada:", data);

  // Buscar tokens
  const tokensSnap = await db.collection("expoTokens").get();
  if (tokensSnap.empty) {
    logger.warn("⚠ Nenhum token registrado.");
    return;
  }

  const messages = [];

  tokensSnap.forEach((doc) => {
    const token = doc.id;

    if (!Expo.isExpoPushToken(token)) {
      logger.warn("⚠ Token inválido:", token);
      return;
    }

    messages.push({
      to: token,
      sound: "default",
      title: "🚨 Queda detectada!",
      body: `O dispositivo ${data.deviceId} detectou uma queda.`,
      data: { queda: data },
    });
  });

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const response = await expo.sendPushNotificationsAsync(chunk);
      logger.info("📨 Resposta Expo:", response);
    } catch (err) {
      logger.error("❌ Erro ao enviar notificação:", err);
    }
  }
});

// ======================================================================
// 🔥 FUNÇÃO 2 — Notificação manual (via fetch) com mais informações
// ======================================================================
exports.notificarQuedaGlobal = onDocumentCreated("quedas/{docId}", async (event) => {
  const data = event.data.data();

  const deviceId = data.deviceId || "desconhecido";
  const nivel = data.fallLevel || 0;
  const intensidade = data.accMag || 0;
  const timestamp = data.timestamp || "";

  logger.info("🔥 Nova queda detectada (GLOBAL):", data);

  const snap = await db.collection("expoTokens").get();
  if (snap.empty) {
    logger.warn("⚠ Nenhum token encontrado.");
    return;
  }

  // Filtrar tokens válidos
  const tokens = snap.docs
    .map((d) => d.id)
    .filter((token) => {
      if (!EXPO_TOKEN_REGEX.test(token)) {
        logger.warn("⚠ Token inválido ignorado:", token);
        return false;
      }
      return true;
    });

  if (tokens.length === 0) {
    logger.warn("⚠ Nenhum token válido disponível.");
    return;
  }

  logger.info("📨 Tokens válidos:", tokens);

  // Envio individual
  for (const token of tokens) {
    const message = {
      to: token,
      sound: "default",
      title: "🚨 Queda detectada!",
      body: `Dispositivo: ${deviceId} • Nível: ${nivel} • Intensidade: ${intensidade.toFixed(
        2
      )}`,
      data: { deviceId, nivel, intensidade, timestamp },
    };

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      const respText = await response.text();
      logger.info(`📬 Resposta Expo (${token}):`, respText);
    } catch (err) {
      logger.error(`❌ Erro ao enviar para ${token}:`, err);
    }
  }
});
