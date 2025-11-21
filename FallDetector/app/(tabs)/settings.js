// app/(tabs)/settings.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SettingsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [nightMode, setNightMode] = useState(false);

  // ===============================
  // 🔐 VERIFICAR LOGIN
  // ===============================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      await loadUserData(user.uid);
    });

    return () => unsub();
  }, []);

  // ===============================
  // 📥 CARREGAR DADOS DO FIRESTORE
  // ===============================
  const loadUserData = async (uid) => {
    try {
      const ref = doc(db, "usuarios", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);

        if (data.foto_perfil) {
          setProfileImage(data.foto_perfil);
          await AsyncStorage.setItem("profileImage", data.foto_perfil);
        }

        await AsyncStorage.setItem("userData", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Erro ao carregar userData:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // PREFERÊNCIAS
  // ===============================
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem("userPreferences");
      if (prefs) {
        const p = JSON.parse(prefs);
        setNotifications(p.notifications ?? true);
        setSounds(p.sounds ?? true);
        setNightMode(p.nightMode ?? false);
      }
    } catch (err) {
      console.error("Erro prefs:", err);
    }
  };

  const savePreferences = async (key, value) => {
    const prefs = {
      notifications,
      sounds,
      nightMode,
      [key]: value,
    };
    await AsyncStorage.setItem("userPreferences", JSON.stringify(prefs));
  };

  // ===============================
  // 🚪 LOGOUT FUNCIONAL
  // ===============================
  const handleLogout = async () => {
    try {
      console.log("Iniciando logout...");

      // 1. Faz logout do Firebase primeiro
      await signOut(auth);
      console.log("Firebase signOut concluído");

      // 2. Limpa storage de forma segura
      try {
        await AsyncStorage.removeItem('userData');
        await AsyncStorage.removeItem('profileImage');
        await AsyncStorage.removeItem('userPreferences');
        console.log("AsyncStorage limpo");
      } catch (storageError) {
        console.log("Erro ao limpar storage:", storageError);
      }

      // 3. Força navegação com replace
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
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.profileInitial}>
              {userData?.nome?.[0]?.toUpperCase() ?? "?"}
            </Text>
          )}

          <View>
            <Text style={styles.profileName}>{userData?.nome}</Text>
            <Text style={styles.profileAction}>Ver Perfil</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* SEÇÃO: NOTIFICAÇÕES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Receber alertas</Text>
          <Switch
            value={notifications}
            onValueChange={(v) => {
              setNotifications(v);
              savePreferences("notifications", v);
            }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Sons de alerta</Text>
          <Switch
            value={sounds}
            onValueChange={(v) => {
              setSounds(v);
              savePreferences("sounds", v);
            }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Modo Noturno</Text>
          <Switch
            value={nightMode}
            onValueChange={(v) => {
              setNightMode(v);
              savePreferences("nightMode", v);
            }}
          />
        </View>
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
          onPress={() => Alert.alert("Ajuda", "Email: suporte@falldetector.com")}
        >
          <Text style={styles.optionText}>❓ Ajuda e Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => router.push("/profile/terms")}
        >
          <Text style={styles.optionText}>📋 Termos de Uso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => Alert.alert("Atualização", "Você já está na última versão!")}
        >
          <Text style={styles.optionText}>🔄 Atualizar Aplicativo</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Versão 1.0.0</Text>
        <Text style={styles.versionText}>{userData?.email}</Text>
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
