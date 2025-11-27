// app/(tabs)/_layout.js

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../contexts/auth";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function TabLayout() {
  const { user: fbUser } = useAuth();

  useEffect(() => {
    if (!fbUser) router.replace("/login");
  }, []);

  const { data: user, isPending, isLoading } = useProfile();
  const router = useRouter();

  const isCuidador = !user?.patient;

  if (isLoading || isPending) {
    console.log("⏳ Tabs Layout: Carregando tipo de usuário...");
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        {isLoading}
        {isPending}
      </View>
    );
  }

  console.log("🎨 Renderizando Tabs Layout...");
  console.log(`📊 Estado atual isCuidador: ${isCuidador}`);
  console.log(
    `📊 Aba Contatos será ${!isCuidador ? "EXIBIDA ✅" : "OCULTADA ❌"}`,
  );
  console.log(
    `📊 href da aba Contatos: ${isCuidador ? "null (OCULTA)" : "/contacts (VISÍVEL)"}`,
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerStyle: {
          backgroundColor: "#007AFF",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* Início - Visível para TODOS */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Contatos - APENAS para PACIENTES */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contatos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          // DESABILITA a aba se for cuidador
          href: isCuidador ? null : "/contacts",
        }}
      />

      {/* Dispositivo - Visível para TODOS */}
      <Tabs.Screen
        name="device"
        options={{
          title: "Dispositivo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="watch" size={size} color={color} />
          ),
        }}
      />

      {/* Histórico - Visível para TODOS */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />

      {/* Ajustes - Visível para TODOS */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
