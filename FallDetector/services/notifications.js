import * as Notifications from "expo-notifications";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function registerPushToken(userId) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo token:", token);

  // Salva o token por usuário
  await setDoc(
    doc(collection(db, "expoTokens"), userId),
    { token },
    { merge: true }
  );

  return token;
}
