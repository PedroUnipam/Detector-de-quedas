import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useEvents } from "../../hooks/useEvents";
import { useProfile } from "../../hooks/useProfile";

// ============================================================
// Funções auxiliares (SEM NOTIFICAÇÕES)
// ============================================================

// Timestamp formatado
const formatTimestamp = (date) => {
  const local = new Date(date);

  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const hora = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");

  if (local.toDateString() === hoje.toDateString()) {
    return `Hoje às ${hora}:${min}`;
  }

  if (local.toDateString() === ontem.toDateString()) {
    return `Ontem às ${hora}:${min}`;
  }

  return `${String(local.getDate()).padStart(2, "0")}/${String(
    local.getMonth() + 1,
  ).padStart(2, "0")} às ${hora}:${min}`;
};

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

const classifyHora = (date) => {
  const h = new Date(date).getHours();
  if (h < 6) return "Madrugada";
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
};

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const formatDate = (d) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

/**
 * Organizes events by local date
 * @param {Array} events - Array of events from the API
 * @returns {Array} Array of objects with date label and events array
 */
const organizeEventsByDate = (events) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const groups = {};

  events.forEach((event) => {
    const localDate = new Date(event.date);
    let label = formatDate(localDate);

    if (isSameDay(localDate, today)) label = "Hoje";
    else if (isSameDay(localDate, yesterday)) label = "Ontem";

    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  });

  return Object.keys(groups).map((day) => ({
    date: day,
    events: groups[day],
  }));
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function HistoryScreen() {
  const [expanded, setExpanded] = useState([]);
  const { events, loading: loadingEvents, refetchEvents } = useEvents();

  const { profile, loading: loadingProfile } = useProfile();

  const loading = loadingEvents || loadingProfile;
  const isCuidador = profile && !profile.patient;

  const formattedHistory = organizeEventsByDate(events);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Carregando histórico...</Text>
      </View>
    );
  }

  const toggleExpanded = (id) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => refetchEvents()}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Eventos</Text>
      </View>

      {/**<Text> {JSON.stringify(formattedHistory)}</Text> */}

      {formattedHistory.map((day, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{day.date}</Text>

          {day.events.map((event, j) => {
            const localDate = new Date(event.date);
            const isExpanded = expanded.includes(event.id);
            const { patientInfo: pi } = event.patient;

            return (
              <>
                <TouchableOpacity
                  disabled={!isCuidador}
                  onPress={() => toggleExpanded(event.id)}
                >
                  <View key={j} style={styles.card}>
                    <Text style={styles.time}>
                      {formatTimestamp(localDate)}
                    </Text>
                    <Text style={styles.intensity}>
                      {classifyFallEmoji(event.type)}
                    </Text>
                    <Text style={styles.smallInfo}>
                      Período: {classifyHora(localDate)}
                    </Text>

                    {isExpanded && (
                      <View style={styles.expandedBox}>
                        <Text style={styles.expandedLabel}>Endereço</Text>
                        <Text>Rua: {pi.street}</Text>
                        <Text>Bairro: {pi.state}</Text>
                        <Text>Cidade: {pi.city}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#555", marginTop: 5 },

  section: { padding: 15 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
  },

  time: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  intensity: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  smallInfo: { color: "#555", fontSize: 13, marginBottom: 6 },

  expandBtn: { marginTop: 6, paddingVertical: 5 },
  expandText: { color: "#007AFF", fontWeight: "600" },

  expandedBox: {},

  label: { marginTop: 10, fontWeight: "600" },
  expandedLabel: { fontWeight: 600 },
});
