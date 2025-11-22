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
import { authAPI, utils } from "../../services/api";
import { getQuedasFromFirestore } from "../../services/firestoreQuedas";

// ==========================
// Ajuda visual para intensidade
// ==========================
const classifyFallEmoji = (level) => {
  const map = {
    0: "⚪ Sem impacto",
    1: "🟡 Movimento brusco",
    2: "🟠 Impacto moderado",
    3: "🔴 Queda forte",
  };
  return map[level] || "⚪ Evento";
};

const formatHoraCurta = (date) => {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [resumoQuedas, setResumoQuedas] = useState({
    totalHoje: 0,
    totalSemana: 0,
    ultimaQueda: null,
  });
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUserData(), loadResumoQuedas()]);
    } catch (err) {
      console.error("Erro geral na Home:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const data = await utils.getUserData();
      console.log("👤 Dados do usuário carregados:", data);
      setUserData(data);
    } catch (error) {
      console.error("❌ Erro ao carregar dados do usuário:", error);
      Alert.alert("Erro", "Não foi possível carregar seus dados");
    }
  };

  const loadResumoQuedas = async () => {
    try {
      const quedas = await getQuedasFromFirestore(); // já usado na History

      if (!quedas || quedas.length === 0) {
        setResumoQuedas({
          totalHoje: 0,
          totalSemana: 0,
          ultimaQueda: null,
        });
        return;
      }

      // Ordena da mais recente para a mais antiga
      const ordenadas = [...quedas].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      const agora = new Date();
      const hojeStr = agora.toDateString();
      const seteDiasMs = 7 * 24 * 60 * 60 * 1000;

      let totalHoje = 0;
      let totalSemana = 0;

      ordenadas.forEach((q) => {
        const d = new Date(q.date);
        if (d.toDateString() === hojeStr) totalHoje++;
        if (agora - d <= seteDiasMs) totalSemana++;
      });

      setResumoQuedas({
        totalHoje,
        totalSemana,
        ultimaQueda: ordenadas[0],
      });
    } catch (error) {
      console.error("❌ Erro ao carregar resumo de quedas:", error);
      // Não quebra a tela, só zera o resumo
      setResumoQuedas({
        totalHoje: 0,
        totalSemana: 0,
        ultimaQueda: null,
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await authAPI.logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleEstouBem = () => {
    Alert.alert(
      "Status enviado",
      "Seu status 'Estou Bem' foi registrado (simulado)."
    );
  };

  const handlePedirAjuda = () => {
    Alert.alert(
      "Ajuda solicitada",
      "Um pedido de ajuda foi enviado para os contatos de emergência (simulado)."
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const { totalHoje, totalSemana, ultimaQueda } = resumoQuedas;

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho / Usuário */}
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {userData?.nome || "Usuário"}!</Text>
        <Text style={styles.subtitle}>
          {totalHoje === 0
            ? "Nenhuma queda registrada hoje."
            : `Foram registradas ${totalHoje} queda(s) hoje.`}
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Comandos Rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comandos Rápidos</Text>

        <TouchableOpacity style={styles.quickAction} onPress={handleEstouBem}>
          <Text style={styles.quickActionText}>✅ Estou Bem</Text>
          <Text style={styles.quickActionHint}>
            Use para avisar que está tudo bem após um alerta.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handlePedirAjuda}>
          <Text style={styles.quickActionText}>🆘 Pedir Ajuda</Text>
          <Text style={styles.quickActionHint}>
            Simulação de envio de alerta para seus contatos de emergência.
          </Text>
        </TouchableOpacity>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Localização</Text>
          <Text style={styles.locationAddress}>
            Localização em breve integrada ao dispositivo.
          </Text>
          <Text style={styles.locationNote}>
            Por enquanto esta informação é apenas ilustrativa.
          </Text>
        </View>
      </View>

      {/* Resumo de Quedas (dados reais da coleção "quedas") */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo de Quedas</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Hoje</Text>
            <Text style={styles.summaryValue}>{totalHoje}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Últimos 7 dias</Text>
            <Text style={styles.summaryValue}>{totalSemana}</Text>
          </View>
        </View>

        {ultimaQueda ? (
          <View style={styles.lastFallBox}>
            <Text style={styles.lastFallTitle}>Última queda registrada</Text>
            <Text style={styles.lastFallText}>
              {classifyFallEmoji(ultimaQueda.fallLevel)} •{" "}
              {formatHoraCurta(ultimaQueda.date)}
            </Text>
            <Text style={styles.lastFallSub}>
              Intensidade: {ultimaQueda.accMag?.toFixed(2)}g
            </Text>
          </View>
        ) : (
          <Text style={styles.noFallText}>
            Nenhuma queda registrada ainda no sistema.
          </Text>
        )}
      </View>

      {/* Status do Dispositivo (simulado) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status do Dispositivo</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Bateria</Text>
            <Text style={styles.statusValue}>85%</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Conexão</Text>
            <Text style={[styles.statusValue, styles.connected]}>Ativa</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Monitor</Text>
            <Text style={[styles.statusValue, styles.monitoring]}>Ativo</Text>
          </View>
        </View>
        <Text style={styles.deviceNote}>
          🔧 Esses dados ainda são simulados e serão integrados ao ESP32 na
          versão final.
        </Text>
      </View>

      {/* Atividade Recente (mistura de simulado + resumo) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>

        {ultimaQueda && (
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>
              {classifyFallEmoji(ultimaQueda.fallLevel)} detectada
            </Text>
            <Text style={styles.activityTime}>
              Hoje às {formatHoraCurta(ultimaQueda.date)}
            </Text>
          </View>
        )}

        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Status "Estou Bem" enviado</Text>
          <Text style={styles.activityTime}>Simulado</Text>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Dispositivo encontrado</Text>
          <Text style={styles.activityTime}>Simulado</Text>
        </View>
      </View>

      {__DEV__ && userData && (
        <View style={styles.devInfo}>
          <Text style={styles.devTitle}>📋 Dados do Usuário (DEV)</Text>
          <Text style={styles.devText}>ID: {userData.id}</Text>
          <Text style={styles.devText}>Email: {userData.email}</Text>
          <Text style={styles.devText}>CPF: {userData.cpf}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6c757d",
  },
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
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  logoutButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  logoutButtonText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  quickAction: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: "#e7f3ff",
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    marginTop: 10,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  locationAddress: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  locationNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  statusItem: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  connected: {
    color: "#28a745",
  },
  monitoring: {
    color: "#28a745",
  },
  deviceNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  lastFallBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  lastFallTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#856404",
  },
  lastFallText: {
    fontSize: 14,
    color: "#856404",
  },
  lastFallSub: {
    fontSize: 12,
    color: "#856404",
    marginTop: 2,
  },
  noFallText: {
    fontSize: 13,
    color: "#666",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityText: {
    fontSize: 14,
    color: "#333",
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
  },
  devInfo: {
    margin: 10,
    padding: 15,
    backgroundColor: "#e7f3ff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  devTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 10,
  },
  devText: {
    fontSize: 12,
    color: "#495057",
    marginVertical: 2,
  },
});
