import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function registerExpoToken(userId) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("❌ Permissão de notificação negada");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("📱 Token Expo:", token);

    await setDoc(doc(db, "expoTokens", token), {
      userId,
      createdAt: new Date(),
    });

    console.log("✔ Token salvo automaticamente no Firestore");
  } catch (err) {
    console.error("❌ Erro ao registrar token Expo:", err);
  }
}
