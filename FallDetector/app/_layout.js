// app/_layout.js
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ============================================================
// 🔔 CONFIGURAÇÃO GLOBAL DE NOTIFICAÇÕES
// ============================================================

// Como a notificação aparece quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // som longo será manual via expo-av
    shouldSetBadge: false,
  }),
});

async function configureNotifications() {
  try {
    if (!Device.isDevice) {
      console.log("Notificações só funcionam em dispositivo físico.");
      return;
    }

    // Verifica permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação negada.");
      return;
    }

    // Canal Android (obrigatório para som/alertas fortes)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("falls", {
        name: "Alertas de Queda",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    console.log("📌 Notificações configuradas");
  } catch (error) {
    console.error("Erro ao configurar notificações:", error);
  }
}

// ============================================================
// 🔐 ROOT LAYOUT
// ============================================================
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);

  // Autenticação Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const token = await AsyncStorage.getItem("authToken");

      if (user && token) {
        setLogged(true);
      } else {
        setLogged(false);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  // Navegação condicional
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!logged && !inAuthGroup) {
      router.replace("/login");
    }

    if (logged && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [logged, loading, segments]);

  // Configurar notificações assim que o app carregar
  useEffect(() => {
    configureNotifications();
  }, []);

  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
