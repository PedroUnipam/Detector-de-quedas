// app/_layout.js
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    // Verifica Firebase Auth
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

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)"; // LOGIN e CADASTRO

    if (!logged && !inAuthGroup) {
      // Usuário NÃO logado tentando acessar outra área → REDIRECIONAR
      router.replace("/login");
    }

    if (logged && inAuthGroup) {
      // Usuário logado tentando abrir login/cadastro → mandar para home
      router.replace("/(tabs)");
    }
  }, [logged, loading, segments]);

  if (loading) return null; // evita flickering

  return <Stack screenOptions={{ headerShown: false }} />;
}
