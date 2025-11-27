// app/(tabs)/index.js

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
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
import { getQuedasFromFirestore } from "../../services/firestoreQuedas";
import HomeCuidador from "../../components/HomeCuidador";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useProfile } from "../../hooks/useProfile";

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
  const [isCuidador, setIsCuidador] = useState(false);
  const [resumoQuedas, setResumoQuedas] = useState({
    totalHoje: 0,
    totalSemana: 0,
    ultimaQueda: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const {
    profile: userProfile,
    loading: isLoading,
    error: profileError,
  } = useProfile();

  useEffect(() => {
    console.log("🚀 HomeScreen montado, iniciando loadAll...");
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      console.log("📝 Iniciando loadAll...");
      setLoading(true);
      setError(null);
      await loadUserData();
      console.log("✅ loadAll concluído com sucesso");
    } catch (err) {
      console.error("❌ Erro geral na Home:", err);
      setError(err.message);
      Alert.alert("Erro", err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log("🔐 Iniciando loadUserData...");
      const user = auth.currentUser;
      console.log("👤 Current user:", user ? user.uid : "NULL");

      if (!user) {
        console.log("⚠️ Usuário não autenticado, redirecionando...");
        Alert.alert("Erro", "Usuário não autenticado");
        router.replace("/(auth)/login");
        return;
      }

      console.log("🔍 Buscando documento do usuário no Firestore...");
      const userRef = doc(db, "usuarios", user.uid);
      const usuarioSnap = await getDoc(userRef);

      if (!usuarioSnap.exists()) {
        console.log("❌ Documento do usuário não encontrado");
        Alert.alert("Erro", "Dados do usuário não encontrados");
        return;
      }

      const usuarioData = usuarioSnap.data();
      console.log("📋 Dados do usuário carregados:", {
        nome: usuarioData.nome,
        email: usuarioData.email,
        tipoPessoa: usuarioData.tipoPessoa,
      });

      const userData = {
        id: user.uid,
        uid: user.uid,
        nome: usuarioData.nome,
        email: usuarioData.email,
        cpf: usuarioData.cpf,
        telefone: usuarioData.telefone,
        tipoPessoa: usuarioData.tipoPessoa,
        dataNascimento: usuarioData.dataNascimento,
      };

      setUserData(userData);

      console.log("=================================================");
      console.log("🔍 VERIFICAÇÃO DETALHADA - TIPO DE USUÁRIO");
      console.log("=================================================");
      console.log(
        "📋 Dados completos do Firestore:",
        JSON.stringify(usuarioData, null, 2),
      );
      console.log("📌 Campo 'tipoPessoa':", usuarioData.tipoPessoa);
      console.log("📌 Tipo do campo:", typeof usuarioData.tipoPessoa);
      console.log(
        "📌 Comparação direta:",
        usuarioData.tipoPessoa === "cuidador",
      );

      // MÉTODO 1: Verificar pelo campo tipoPessoa (mais confiável)
      const ehCuidadorPorTipo = usuarioData.tipoPessoa === "cuidador";
      console.log(
        `📊 É cuidador por tipoPessoa? ${ehCuidadorPorTipo ? "SIM ✅" : "NÃO ❌"}`,
      );

      // MÉTODO 2: Verificar na coleção cuidadores (backup)
      console.log("\n🔍 Verificando na coleção 'cuidadores'...");
      const cuidadoresRef = collection(db, "cuidadores");
      const cuidadorQuery = query(cuidadoresRef, where("uid", "==", user.uid));
      const cuidadorSnap = await getDocs(cuidadorQuery);

      const ehCuidadorPorColecao = !cuidadorSnap.empty;
      console.log(
        `📊 Quantidade de documentos encontrados: ${cuidadorSnap.size}`,
      );
      console.log(
        `📊 É cuidador por coleção? ${ehCuidadorPorColecao ? "SIM ✅" : "NÃO ❌"}`,
      );

      if (!cuidadorSnap.empty) {
        cuidadorSnap.forEach((doc) => {
          console.log("📄 Documento encontrado na coleção cuidadores:");
          console.log("   - ID do documento:", doc.id);
          console.log("   - Dados:", JSON.stringify(doc.data(), null, 2));
        });
      } else {
        console.log(
          "❌ Nenhum documento encontrado na coleção cuidadores para este UID",
        );
      }

      // Usar AMBOS os critérios para determinar se é cuidador
      // Prioriza o tipoPessoa, mas aceita qualquer um dos dois
      const ehCuidador = ehCuidadorPorTipo || ehCuidadorPorColecao;

      console.log("=================================================");
      console.log(
        `🎯 DECISÃO FINAL: ${ehCuidador ? "É CUIDADOR ✅" : "É PACIENTE ❌"}`,
      );
      console.log("=================================================");

      setIsCuidador(ehCuidador);

      // Se for usuário/paciente, carregar quedas
      if (!ehCuidador) {
        console.log("📊 Usuário é PACIENTE, carregando quedas...");
        await loadResumoQuedas();
      } else {
        console.log("✅ Usuário é CUIDADOR, NÃO carrega quedas");
      }
    } catch (error) {
      console.error("❌ Erro em loadUserData:", error);
      throw error;
    }
  };

  const loadResumoQuedas = async () => {
    try {
      console.log("📊 Carregando resumo de quedas...");
      const quedas = await getQuedasFromFirestore();

      if (!quedas || quedas.length === 0) {
        console.log("ℹ️ Nenhuma queda encontrada");
        setResumoQuedas({
          totalHoje: 0,
          totalSemana: 0,
          ultimaQueda: null,
        });
        return;
      }

      console.log(`📊 ${quedas.length} quedas encontradas`);

      const ordenadas = [...quedas].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
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

      console.log(`📊 Resumo: ${totalHoje} hoje, ${totalSemana} na semana`);

      setResumoQuedas({
        totalHoje,
        totalSemana,
        ultimaQueda: ordenadas[0],
      });
    } catch (error) {
      console.error("❌ Erro ao carregar resumo de quedas:", error);
      setResumoQuedas({
        totalHoje: 0,
        totalSemana: 0,
        ultimaQueda: null,
      });
    }
  };

  const handleEstouBem = () => {
    Alert.alert(
      "Status enviado",
      "Seu status 'Estou Bem' foi registrado (simulado).",
    );
  };

  const handlePedirAjuda = () => {
    Alert.alert(
      "Ajuda solicitada",
      "Um pedido de ajuda foi enviado para os contatos de emergência (simulado).",
    );
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

  // ==========================================
  // 🔀 RENDERIZAÇÃO CONDICIONAL POR TIPO
  // ==========================================

  console.log(`🎨 Renderizando tela... É cuidador? ${isCuidador}`);

  // Se o usuário é cuidador, mostra APENAS a tela de cuidador
  if (isCuidador) {
    console.log("✅ 👨‍⚕️ Renderizando TELA DE CUIDADOR");
    return <HomeCuidador userData={userData} />;
  }

  // Caso contrário, mostra a tela de PACIENTE
  console.log("✅ 👤 Renderizando TELA DE PACIENTE");
  const { totalHoje, totalSemana, ultimaQueda } = resumoQuedas;

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho / Usuário */}
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {userProfile?.name || "Usuário"}!</Text>
        <Text style={styles.subtitle}>
          {totalHoje === 0
            ? "Nenhuma queda registrada hoje."
            : `Foram registradas ${totalHoje} queda(s) hoje.`}
        </Text>
      </View>

      {/* Comandos Rápidos - APENAS PARA PACIENTES */}
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

      {/* Status do Dispositivo */}
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
          🔧 Esses dados ainda são simulados e serão integrados ao ESP32.
        </Text>
      </View>

      {/* Atividade Recente */}
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
});
