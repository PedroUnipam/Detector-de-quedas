import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Registra o token Expo e salva no Firestore
export async function registerExpoToken(userId) {
  try {
    // Solicita permissão
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("❌ Permissão de notificação negada");
      return null;
    }

    // Obtém token Expo
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("📱 Token Expo:", token);

    // Salva no Firestore
    await setDoc(
      doc(db, "expoTokens", token),
      {
        userId,
        createdAt: new Date(),
      },
      { merge: true }
    );

    console.log("✔ Token salvo automaticamente no Firestore");

    return token;

  } catch (err) {
    console.error("❌ Erro ao registrar token Expo:", err);
    return null;
  }
}
