import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

import { getQuedasFromFirestore } from "../../services/firestoreQuedas";

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
    local.getMonth() + 1
  ).padStart(2, "0")} às ${hora}:${min}`;
};

const classifyFallEmoji = (level) => {
  const map = {
    0: "⚪ Normal",
    1: "🟡 Movimento brusco",
    2: "🟠 Impacto moderado",
    3: "🔴 Queda forte",
  };
  return map[level] || "⚪ Evento";
};

const classifyHora = (date) => {
  const h = new Date(date).getHours();
  if (h < 6) return "Madrugada";
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const quedas = await getQuedasFromFirestore();
      const grouped = organizeByDate(quedas);
      setHistoryData(grouped);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ----------------------------------------------------------
  // Agrupamento por data
  // ----------------------------------------------------------

  const organizeByDate = (quedas) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const groups = {};

    quedas.forEach((item) => {
      const date = new Date(item.date);
      let label = formatDate(date);

      if (isSameDay(date, today)) label = "Hoje";
      else if (isSameDay(date, yesterday)) label = "Ontem";

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return Object.keys(groups).map((day) => ({
      date: day,
      events: groups[day],
    }));
  };

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const formatDate = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Eventos</Text>
        <Text style={styles.subtitle}>Detectados pelo dispositivo</Text>
      </View>

      {historyData.map((day, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{day.date}</Text>

          {day.events.map((event, j) => {
            const localDate = new Date(event.date);
            const isExpanded = expanded[event.id];

            return (
              <View key={j} style={styles.card}>
                <Text style={styles.time}>{formatTimestamp(localDate)}</Text>

                <Text style={styles.intensity}>{classifyFallEmoji(event.fallLevel)}</Text>

                <Text style={styles.smallInfo}>Período: {classifyHora(localDate)}</Text>

                <TouchableOpacity
                  onPress={() => toggleExpand(event.id)}
                  style={styles.expandBtn}
                >
                  <Text style={styles.expandText}>
                    {isExpanded ? "Ver menos ▲" : "Ver mais ▼"}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedBox}>
                    <Text style={styles.label}>Aceleração:</Text>
                    <Text>Mag: {event.accMag.toFixed(2)}</Text>
                    <Text>X: {event.accX.toFixed(2)}</Text>
                    <Text>Y: {event.accY.toFixed(2)}</Text>
                    <Text>Z: {event.accZ.toFixed(2)}</Text>

                    <Text style={styles.label}>Device ID:</Text>
                    <Text>{event.deviceId}</Text>

                    <Text style={styles.label}>Timestamp completo:</Text>
                    <Text>{localDate.toString()}</Text>
                  </View>
                )}
              </View>
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

  expandedBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  label: { marginTop: 10, fontWeight: "600" },
});
