// app/(tabs)/index.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // DADOS DO ESP32
  const [deviceStatus, setDeviceStatus] = useState({
    online: false,
    battery: 0,
    wifi: 0,
    last_update: null,
    last_fall: null,
    monitoring: false,
  });

  // =====================================================
  // 🔐 GARANTE QUE O USUÁRIO ESTÁ AUTENTICADO
  // =====================================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      await loadUserData(user.uid);
      listenToESP32Status(user.uid);
    });

    return () => unsub();
  }, []);

  // =====================================================
  // 👤 CARREGAR DADOS DO USUÁRIO
  // =====================================================
  const loadUserData = async (uid) => {
    try {
      const ref = doc(db, "usuarios", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        await AsyncStorage.setItem("userData", JSON.stringify(data));
      } else {
        console.warn("⚠ Usuário não existe no Firestore.");
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);

      // fallback offline
      const cached = await AsyncStorage.getItem("userData");
      if (cached) setUserData(JSON.parse(cached));

      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 🔌 ESCUTAR STATUS DO ESP32 (com tratamento de erro)
  // =====================================================
  const listenToESP32Status = (uid) => {
    const ref = doc(db, "dispositivos", uid);

    return onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setDeviceStatus(snapshot.data());
        }
      },
      (error) => {
        console.error("❌ Erro no snapshot do dispositivo:", error);

        if (error.code === "permission-denied") {
          Alert.alert(
            "Permissão Negada",
            "O dispositivo não está autorizado a acessar esses dados."
          );
        }
      }
    );
  };

  // =====================================================
  // 🚪 LOGOUT
  // =====================================================
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          await AsyncStorage.clear();
          router.replace("/login");
        },
      },
    ]);
  };

  // Loading
  if (loading || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("pt-BR");
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {userData.nome} 👋</Text>
        <Text style={styles.subtitle}>
          Seu dispositivo está {deviceStatus.online ? "online" : "offline"}
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* COMANDOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comandos Rápidos</Text>

        <TouchableOpacity style={styles.quickButton}>
          <Text style={styles.quickText}>✅ Estou Bem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickButton}>
          <Text style={styles.quickText}>🆘 Pedir Ajuda</Text>
        </TouchableOpacity>
      </View>

      {/* STATUS DO DISPOSITIVO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status do dispositivo</Text>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Bateria</Text>
            <Text style={styles.statusValue}>{deviceStatus.battery}%</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>WiFi</Text>
            <Text style={styles.statusValue}>{deviceStatus.wifi} dBm</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Monitoramento</Text>
            <Text style={styles.statusValue}>
              {deviceStatus.monitoring ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          Última atualização: {formatDate(deviceStatus.last_update)}
        </Text>
        <Text style={styles.infoText}>
          Última queda: {formatDate(deviceStatus.last_fall)}
        </Text>
      </View>

      {/* ATIVIDADE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>

        {deviceStatus.last_fall && (
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>🚨 Queda detectada</Text>
            <Text style={styles.activityTime}>
              {formatDate(deviceStatus.last_fall)}
            </Text>
          </View>
        )}

        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Dispositivo atualizado</Text>
          <Text style={styles.activityTime}>
            {formatDate(deviceStatus.last_update)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// =====================================================
// 🎨 ESTILOS
// =====================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { marginTop: 10, color: "#555" },

  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { marginTop: 5, fontSize: 15, color: "#666" },

  logoutButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  logoutButtonText: {
    color: "#dc3545",
    fontWeight: "bold",
  },

  section: {
    margin: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  quickButton: {
    padding: 14,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  quickText: { fontSize: 16, fontWeight: "500" },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  statusItem: { alignItems: "center" },
  statusLabel: { fontSize: 12, color: "#777" },
  statusValue: { fontSize: 15, fontWeight: "bold" },

  infoText: { marginTop: 5, fontSize: 13, color: "#555" },

  activityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activityText: { fontSize: 15 },
  activityTime: { fontSize: 12, color: "#666" },
});
