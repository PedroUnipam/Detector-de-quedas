// app/(tabs)/index.js

import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HomeCuidador from "../../components/HomeCuidador";
import { useCreateEvent } from "../../hooks/useCreateEvent";
import { useEvents } from "../../hooks/useEvents";
import { useProfile } from "../../hooks/useProfile";

// ==========================
// Ajuda visual para intensidade
// ==========================
const classifyFallEmoji = (type) => {
  const map = {
    fall_1: "🟡 Movimento brusco",
    fall_2: "🟠 Impacto moderado",
    fall_3: "🔴 Queda forte",
    need_help: "🔴 Pedido de ajuda",
    ok: "🟢 Estou bem",
  };
  return map[type] || "⚪ Evento";
};

const formatHoraCurta = (date) => {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function HomeScreen() {
  const { createEvent, loading: isCreatingEvent } = useCreateEvent();

  const {
    profile: userProfile,
    loading: isLoadingProfile,
    error: profileError,
  } = useProfile();

  const { events, loading: isLoadingEvents, error: eventsError } = useEvents();

  const loading = isLoadingProfile || isLoadingEvents;
  const error = profileError ?? eventsError;

  const { totalHoje, totalSemana, ultimaQueda } = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalHoje: 0,
        totalSemana: 0,
        ultimaQueda: null,
      };
    }

    // Filter events that start with "fall"
    const fallEvents = events.filter(
      (event) =>
        event.type &&
        typeof event.type === "string" &&
        event.type.toLowerCase().startsWith("fall"),
    );

    if (fallEvents.length === 0) {
      return {
        totalHoje: 0,
        totalSemana: 0,
        ultimaQueda: null,
      };
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Count events today
    const totalHoje = fallEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfToday;
    }).length;

    // Count events in last 7 days
    const totalSemana = fallEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= sevenDaysAgo;
    }).length;

    // Get the last (most recent) event
    const sortedEvents = [...fallEvents].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Most recent first
    });

    const ultimaQueda =
      sortedEvents.length > 0
        ? (() => {
          const lastEvent = sortedEvents[0];
          const eventDate = new Date(lastEvent.date);

          return {
            date: eventDate,
            accMag: lastEvent.accMag || null,
            type: lastEvent.type,
          };
        })()
        : null;

    return {
      totalHoje,
      totalSemana,
      ultimaQueda,
    };
  }, [events]);

  const handleCreateEvent = async (type) => {
    await createEvent(type);
    Alert.alert("Comando enviado. Cuidadores notificados!");
  };

  // Tela de loading
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
        <TouchableOpacity style={styles.retryButton} onPress={loadAll}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCuidador = userProfile !== undefined && !userProfile?.patient;

  console.log(`🎨 Renderizando tela... É cuidador? ${isCuidador}`);

  if (isCuidador) {
    console.log("✅ 👨‍⚕️ Renderizando TELA DE CUIDADOR");
    return <HomeCuidador userData={userProfile} />;
  }

  return (
    <ScrollView style={styles.container}>
      {isCreatingEvent && (
        <View style={styles.isCreatingEvent}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {/* Cabeçalho / Usuário */}
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {userProfile?.name || "Usuário"}!</Text>
      </View>

      {/* Comandos Rápidos - APENAS PARA PACIENTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comandos Rápidos</Text>
        <TouchableOpacity
          style={styles.quickAction}
          disabled={isCreatingEvent}
          onPress={() => handleCreateEvent("ok")}
        >
          <Text style={styles.quickActionText}>✅ Estou Bem</Text>
          <Text style={styles.quickActionHint}>
            Use para avisar que está tudo bem após um alerta.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          disabled={isCreatingEvent}
          onPress={() => handleCreateEvent("need_help")}
        >
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

      {/* Resumo de Quedas */}
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
              {classifyFallEmoji(ultimaQueda.type)} •{" "}
              {formatHoraCurta(ultimaQueda.date)}
            </Text>
          </View>
        ) : (
          <Text style={styles.noFallText}>
            Nenhuma queda registrada ainda no sistema.
          </Text>
        )}
      </View>

      {/* Info de Debug */}
      {/* <View style={styles.devInfo}>
        <Text style={styles.devTitle}>🐛 DEBUG INFO</Text>
        <Text style={styles.devText}>ID: {userData?.id}</Text>
        <Text style={styles.devText}>UID: {userData?.uid}</Text>
        <Text style={styles.devText}>Email: {userData?.email}</Text>
        <Text style={styles.devText}>Tipo Pessoa: {userData?.tipoPessoa}</Text>
        <Text style={[styles.devText, styles.devImportant]}>
          É CUIDADOR: {isCuidador ? "SIM ✅" : "NÃO ❌"}
        </Text>
      </View> */}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6c757d",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "#fff3cd",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffc107",
  },
  devTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 10,
  },
  devText: {
    fontSize: 13,
    color: "#856404",
    marginVertical: 2,
  },
  devImportant: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 8,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 5,
  },
  isCreatingEvent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
