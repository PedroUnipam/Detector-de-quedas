const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { Expo } = require("expo-server-sdk");
const admin = require("firebase-admin");

admin.initializeApp();
const expo = new Expo();

// Firestore ADMIN (certo!)
const db = admin.firestore();

exports.notificarQueda = onDocumentCreated("quedas/{quedaId}", async (event) => {
  const data = event.data.data();

  console.log("🔥 Nova queda detectada:", data);

  // Buscar todos tokens
  const tokensSnap = await db.collection("expoTokens").get();
  if (tokensSnap.empty) {
    console.log("⚠ Nenhum token registrado.");
    return;
  }

  const messages = [];

  tokensSnap.forEach((doc) => {
    const token = doc.id;

    if (!Expo.isExpoPushToken(token)) {
      console.log("⚠ Token inválido:", token);
      return;
    }

    messages.push({
      to: token,
      sound: "default",
      title: "🚨 Queda detectada!",
      body: `O dispositivo ${data.deviceId} detectou uma queda.`,
      data: { queda: data }
    });
  });

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const response = await expo.sendPushNotificationsAsync(chunk);
      console.log("📨 Resposta Expo:", response);
    } catch (err) {
      console.error("❌ Erro ao enviar notificação:", err);
    }
  }
});
