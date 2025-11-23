import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function registerExpoToken(userId) {
  // Pedir permissão
  const perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== "granted") return;

  // Gerar token
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: "2880f5ae-7ae2-4edf-ba39-9d9e397c6425"
  });

  // SALVAR EM expoTokens
  await setDoc(
    doc(db, "expoTokens", token),
    {
      userId,
      createdAt: new Date()
    },
    { merge: true }
  );

  console.log("📲 Token salvo no Firestore:", token);
}
