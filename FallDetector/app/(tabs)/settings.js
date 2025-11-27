// app/(tabs)/settings.js

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";

import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../contexts/auth";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const { profile: userProfile, loading, error } = useProfile();

  if (loading) {
    console.log("⏳ Renderizando tela de loading...");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Tela de erro
  if (error) {
    console.log("❌ Renderizando tela de erro:", error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      console.log("Iniciando logout...");

      await logout();
      console.log("Firebase signOut concluído");

      try {
        await AsyncStorage.removeItem("token");
        console.log("AsyncStorage limpo");
      } catch (storageError) {
        console.log("Erro ao limpar storage:", storageError);
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro completo no logout:", error);
      Alert.alert("Erro", "Não foi possível sair da conta.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize seu aplicativo</Text>
      </View>

      {/* PERFIL */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.profileInfo}
          onPress={() => router.push("/profile/edit")}
        >
          <View>
            <Text style={styles.profileName}>{userProfile?.name}</Text>
            <Text style={styles.profileAction}>Ver Perfil</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* OUTRAS OPÇÕES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outras opções</Text>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => router.push("/profile/security")}
        >
          <Text style={styles.optionText}>🔒 Privacidade e Segurança</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => router.push("/profile/terms")}
        >
          <Text style={styles.optionText}>📋 Termos de Uso</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Versão 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// =======================
// 🎨 ESTILOS (MANTIDOS IGUAIS AOS ANTIGOS)
// =======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { marginTop: 10 },

  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 5,
  },

  profileSection: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInitial: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    color: "#fff",
    textAlign: "center",
    lineHeight: 60,
    fontSize: 28,
    fontWeight: "bold",
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileAction: {
    fontSize: 14,
    color: "#007AFF",
  },

  section: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
  },

  logoutButton: {
    backgroundColor: "#dc3545",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  versionInfo: {
    alignItems: "center",
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#777",
  },
});
