import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";

import { getQuedasFromFirestore } from "../../services/firestoreQuedas";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Audio } from "expo-av";

// ============================================================
// Funções auxiliares
// ============================================================

// Timestamp humanizado
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

// Emoji por intensidade
const classifyFallEmoji = (level) => {
  const map = {
    0: "⚪ Normal",
    1: "🟡 Movimento brusco",
    2: "🟠 Impacto moderado",
    3: "🔴 Queda forte",
  };
  return map[level] || "⚪ Queda Detectada";
};

// Classificação do período do dia
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
  `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;

// ============================================================
// Pequeno componente para animação dos cards
// ============================================================
const FadeInCard = ({ delay = 0, style, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expanded, setExpanded] = useState({});
  const [filterLevel, setFilterLevel] = useState(0); // 0 = todas, 1–3 = intensidade

  const lastAlertedIdRef = useRef(null);
  const soundRef = useRef(null);
  const soundTimeoutRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadHistory();
    return () => stopAlertSound();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("falls", {
        name: "Alertas de Queda",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);

      const quedas = await getQuedasFromFirestore();
      const grouped = organizeByDate(quedas);
      setHistoryData(grouped);

      if (quedas.length > 0) {
        handlePossibleAlert(quedas[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePossibleAlert = async (event) => {
    if (!event) return;

    const isStrongFall = event.fallLevel >= 3;
    const alreadyAlerted =
      lastAlertedIdRef.current === event.id;

    if (isStrongFall && !alreadyAlerted) {
      lastAlertedIdRef.current = event.id;
      await triggerNotificationAndSound(event);
    }
  };

  const triggerNotificationAndSound = async (event) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Queda forte detectada!",
          body: `Intensidade: ${event.accMag.toFixed(
            2
          )}g - ${formatTimestamp(event.date)}`,
        },
        trigger: null,
      });
    } catch {}

    await startAlertSound();
  };

  const startAlertSound = async () => {
    try {
      if (soundRef.current) return;

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alert.mp3"),
        {
          shouldPlay: true,
          isLooping: true,
        }
      );

      soundRef.current = sound;
      await soundRef.current.playAsync();

      soundTimeoutRef.current = setTimeout(() => {
        stopAlertSound();
      }, 60000);
    } catch (err) {
      console.log("Erro som:", err);
    }
  };

  const stopAlertSound = async () => {
    try {
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
        soundTimeoutRef.current = null;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ----------------------------------------------------------
  // Organizar por data
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  // ----------------------------------------------------------
  // Dados do gráfico (quedas por dia, respeitando filtro)
  // ----------------------------------------------------------
  const chartData = historyData
    .map((day) => {
      const eventsFiltered = day.events.filter(
        (e) =>
          filterLevel === 0 || e.fallLevel >= filterLevel
      );
      return {
        label: day.date,
        count: eventsFiltered.length,
      };
    })
    .filter((d) => d.count > 0);

  const maxCount =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.count))
      : 1;

  // ----------------------------------------------------------
  // Tela principal
  // ----------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>
          Carregando histórico...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Eventos</Text>
        <Text style={styles.subtitle}>
          Detectados pelo dispositivo
        </Text>
      </View>

      {/* Filtros por intensidade */}
      <View style={styles.filterContainer}>
        {[
          { label: "Todas", value: 0 },
          { label: "🟡+", value: 1 },
          { label: "🟠+", value: 2 },
          { label: "🔴", value: 3 },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.filterBtn,
              filterLevel === opt.value &&
                styles.filterBtnActive,
            ]}
            onPress={() => setFilterLevel(opt.value)}
          >
            <Text
              style={[
                styles.filterText,
                filterLevel === opt.value && {
                  color: "#fff",
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gráfico simples de quedas por dia */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          Quedas por dia
        </Text>
        {chartData.length === 0 ? (
          <Text style={styles.chartEmpty}>
            Nenhum evento encontrado com esse filtro.
          </Text>
        ) : (
          <View style={styles.chartRow}>
            {chartData.map((d, idx) => {
              const barHeight =
                20 + (d.count / maxCount) * 80;
              return (
                <View
                  key={idx}
                  style={styles.chartItem}
                >
                  <View
                    style={[
                      styles.chartBar,
                      { height: barHeight },
                    ]}
                  />
                  <Text style={styles.chartLabel}>
                    {d.label}
                  </Text>
                  <Text style={styles.chartValue}>
                    {d.count}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Lista de dias / eventos */}
      {historyData.map((day, i) => {
        // aplica filtro por intensidade
        const eventsFiltered = day.events.filter(
          (e) =>
            filterLevel === 0 || e.fallLevel >= filterLevel
        );

        if (eventsFiltered.length === 0) return null;

        return (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {day.date}
            </Text>

            {eventsFiltered.map((event, j) => {
              const localDate = new Date(event.date);
              const isExpanded = expanded[event.id];
              const key = event.id || `${day.date}-${j}`;

              return (
                <FadeInCard
                  key={key}
                  delay={j * 80}
                  style={styles.card}
                >
                  <Text style={styles.time}>
                    {formatTimestamp(localDate)}
                  </Text>

                  <Text style={styles.intensity}>
                    {classifyFallEmoji(event.fallLevel)}
                  </Text>

                  <Text style={styles.smallInfo}>
                    Período: {classifyHora(localDate)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => toggleExpand(event.id)}
                    style={styles.expandBtn}
                  >
                    <Text style={styles.expandText}>
                      {isExpanded
                        ? "Ver menos ▲"
                        : "Ver mais ▼"}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedBox}>
                      <Text style={styles.label}>
                        Aceleração:
                      </Text>
                      <Text>
                        Mag: {event.accMag.toFixed(2)}
                      </Text>
                      <Text>
                        X: {event.accX.toFixed(2)}
                      </Text>
                      <Text>
                        Y: {event.accY.toFixed(2)}
                      </Text>
                      <Text>
                        Z: {event.accZ.toFixed(2)}
                      </Text>

                      <Text style={styles.label}>
                        Device ID:
                      </Text>
                      <Text>{event.deviceId}</Text>

                      <Text style={styles.label}>
                        Timestamp completo:
                      </Text>
                      <Text>{localDate.toString()}</Text>
                    </View>
                  )}
                </FadeInCard>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ============================================================
// ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#555", marginTop: 5 },

  // Filtros
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#fff",
  },
  filterBtnActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },

  // Gráfico
  chartContainer: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  chartEmpty: {
    fontSize: 13,
    color: "#777",
    marginTop: 8,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    marginTop: 10,
  },
  chartItem: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  chartBar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
  },
  chartLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#333",
  },
  chartValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Lista
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

  intensity: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  smallInfo: {
    color: "#555",
    fontSize: 13,
    marginBottom: 6,
  },

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
