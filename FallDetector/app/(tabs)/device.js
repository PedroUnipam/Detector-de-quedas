import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../services/firebase";
import {
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
} from "firebase/firestore";

export default function DeviceScreen() {
  // ==========================
  // ESTADOS ESP32 (CONFIG Wi-Fi)
  // ==========================
  const [espIP, setEspIP] = useState("192.168.4.1"); // IP do AP do ESP
  const [espStatus, setEspStatus] = useState("Aguardando teste...");
  const [espOnline, setEspOnline] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [configuringWifi, setConfiguringWifi] = useState(false);
  const [resettingWifi, setResettingWifi] = useState(false);

  // ==========================
  // ESTADOS DISPOSITIVO / FIRESTORE
  // ==========================
  const [deviceId, setDeviceId] = useState("esp32-1");
  const [deviceName, setDeviceName] = useState("Sensor de Quedas");
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState(null);

  // ==========================
  // CARREGAR DISPOSITIVOS AO ABRIR TELA
  // ==========================
  useEffect(() => {
    carregarDispositivos();
  }, []);

  const getUid = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.uid;
  };

  const carregarDispositivos = async () => {
    try {
      const uid = getUid();
      if (!uid) return;

      setLoadingDevices(true);

      const colRef = collection(db, "usuarios", uid, "dispositivos");
      const snapshot = await getDocs(colRef);
      const lista = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setDevices(lista);
    } catch (error) {
      console.error("❌ Erro ao carregar dispositivos:", error);
      Alert.alert("Erro", "Não foi possível carregar seus dispositivos.");
    } finally {
      setLoadingDevices(false);
    }
  };

  // ==========================
  // STATUS DO ESP32 (/status)
  // ==========================
  const checkEspStatus = async () => {
    setCheckingStatus(true);
    try {
      const resp = await fetch(`http://${espIP}/status`, {
        method: "GET",
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const text = await resp.text();
      setEspStatus(text);
      setEspOnline(true);
    } catch (error) {
      console.log("Erro ao consultar status do ESP:", error);
      setEspStatus("ESP32 Offline ou inalcançável.");
      setEspOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  // ==========================
  // RESET WI-FI DO ESP32 (/reset_wifi)
  // ==========================
  const resetEspWifi = async () => {
    Alert.alert(
      "Confirmar",
      "Isso apagará as credenciais salvas no ESP32 e o colocará em modo de configuração. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: async () => {
            setResettingWifi(true);
            try {
              const resp = await fetch(`http://${espIP}/reset_wifi`, {
                method: "POST",
              });

              if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
              }

              const text = await resp.text();
              Alert.alert("ESP32", text || "Reset Wi-Fi enviado.");
              setEspStatus("Modo de configuração (AP) provavelmente ativo.");
              setEspOnline(false);
            } catch (error) {
              console.error("Erro ao resetar Wi-Fi do ESP:", error);
              Alert.alert(
                "Erro",
                "Não foi possível enviar comando de reset. Confira se o IP está correto e se você está na rede do ESP."
              );
            } finally {
              setResettingWifi(false);
            }
          },
        },
      ]
    );
  };

  // ==========================
  // CONFIGURAR WI-FI DO ESP32 (/config_wifi)
  // ==========================
  const enviarWifiParaEsp = async () => {
    if (!ssid || !password) {
      Alert.alert("Atenção", "Preencha SSID e senha da rede principal.");
      return;
    }

    setConfiguringWifi(true);
    try {
      // Aqui assumimos que o celular está conectado no AP do ESP (FallDetector-Setup)
      const resp = await fetch(`http://${espIP}/config_wifi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ssid,
          password,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      let json = {};
      try {
        json = await resp.json();
      } catch (e) {
        // Se não for JSON, tentamos só texto
        const text = await resp.text();
        console.log("Resposta texto /config_wifi:", text);
      }

      if (json.success === false) {
        Alert.alert(
          "Falha",
          "O ESP32 não conseguiu conectar na rede informada."
        );
      } else {
        Alert.alert(
          "Sucesso",
          "Wi-Fi enviado. O ESP32 deve reiniciar e tentar conectar à nova rede."
        );
      }
    } catch (error) {
      console.error("Erro ao enviar Wi-Fi para ESP:", error);
      Alert.alert(
        "Erro",
        "Não foi possível enviar as credenciais. Verifique se está conectado ao Wi-Fi do ESP (FallDetector-Setup) e se o IP está correto."
      );
    } finally {
      setConfiguringWifi(false);
    }
  };

  // ==========================
  // REGISTRAR DISPOSITIVO NO FIRESTORE
  // ==========================
  const registrarDispositivo = async () => {
    const uid = getUid();
    if (!uid) {
      Alert.alert("Atenção", "Você precisa estar logado para registrar um dispositivo.");
      return;
    }

    if (!deviceId || !deviceName || !ssid) {
      Alert.alert(
        "Atenção",
        "Informe o ID do dispositivo, o nome amigável e o SSID em que ele ficará."
      );
      return;
    }

    try {
      setSavingDevice(true);
      const ref = doc(db, "usuarios", uid, "dispositivos", deviceId.trim());

      await setDoc(ref, {
        deviceId: deviceId.trim(),
        nome: deviceName.trim(),
        wifiSsid: ssid.trim(),
        ownerUid: uid,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Sucesso", "Dispositivo registrado com sucesso!");
      carregarDispositivos();
    } catch (error) {
      console.error("Erro ao registrar dispositivo:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível registrar o dispositivo."
      );
    } finally {
      setSavingDevice(false);
    }
  };

  // ==========================
  // REMOVER DISPOSITIVO DO FIRESTORE
  // ==========================
  const removerDispositivo = (id) => {
    Alert.alert(
      "Confirmar",
      "Deseja realmente remover este dispositivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const uid = getUid();
            if (!uid) return;

            try {
              setRemovingDeviceId(id);
              const ref = doc(db, "usuarios", uid, "dispositivos", id);
              await deleteDoc(ref);
              carregarDispositivos();
            } catch (error) {
              console.error("Erro ao remover dispositivo:", error);
              Alert.alert(
                "Erro",
                error.message || "Não foi possível remover o dispositivo."
              );
            } finally {
              setRemovingDeviceId(null);
            }
          },
        },
      ]
    );
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ======================= STATUS DO ESP ======================= */}
      <Text style={styles.title}>Status do ESP32</Text>

      <Text style={styles.label}>IP do ESP32</Text>
      <TextInput
        style={styles.input}
        value={espIP}
        onChangeText={setEspIP}
        autoCapitalize="none"
        placeholder="Ex: 192.168.4.1 (modo AP) ou IP na rede"
      />

      <Text
        style={[
          styles.status,
          espOnline ? styles.online : styles.offline,
        ]}
      >
        {espStatus}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={checkEspStatus}
        disabled={checkingStatus}
      >
        {checkingStatus ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Testar Status</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#f44336" }]}
        onPress={resetEspWifi}
        disabled={resettingWifi}
      >
        {resettingWifi ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Wi-Fi do ESP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ======================= CONFIGURAR WIFI NO ESP ======================= */}
      <Text style={styles.title}>Configurar Wi-Fi do ESP32</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          1. Ligue o ESP32 sem Wi-Fi salvo (ou após Reset).
        </Text>
        <Text style={styles.infoText}>
          2. No celular, conecte ao Wi-Fi:{" "}
          <Text style={{ fontWeight: "bold" }}>FallDetector-Setup</Text>
        </Text>
        <Text style={styles.infoText}>
          3. Volte para o app e informe abaixo a rede principal.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="SSID da rede principal"
        value={ssid}
        onChangeText={setSsid}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha da rede principal"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ff9800" }]}
        onPress={enviarWifiParaEsp}
        disabled={configuringWifi}
      >
        {configuringWifi ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar Wi-Fi para ESP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ======================= REGISTRAR DISPOSITIVO NO FIRESTORE ======================= */}
      <Text style={styles.title}>Registrar Dispositivo</Text>

      <Text style={styles.label}>ID do Dispositivo (firmware)</Text>
      <TextInput
        style={styles.input}
        value={deviceId}
        onChangeText={setDeviceId}
        placeholder="ex: esp32-1"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Nome amigável</Text>
      <TextInput
        style={styles.input}
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder="ex: Sensor Quarto"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4caf50" }]}
        onPress={registrarDispositivo}
        disabled={savingDevice}
      >
        {savingDevice ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar Dispositivo</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ======================= LISTA DE DISPOSITIVOS ======================= */}
      <Text style={styles.title}>Meus Dispositivos</Text>

      {loadingDevices ? (
        <ActivityIndicator size="large" color="#000" />
      ) : devices.length === 0 ? (
        <Text style={{ marginTop: 10 }}>Nenhum dispositivo registrado.</Text>
      ) : (
        devices.map((dev) => (
          <View key={dev.id} style={styles.deviceCard}>
            <Text style={styles.deviceTitle}>{dev.nome || dev.deviceId}</Text>
            <Text style={styles.deviceText}>ID: {dev.deviceId}</Text>
            {dev.wifiSsid ? (
              <Text style={styles.deviceText}>Wi-Fi: {dev.wifiSsid}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.button, { marginTop: 10, backgroundColor: "#e11d48" }]}
              onPress={() => removerDispositivo(dev.id)}
              disabled={removingDeviceId === dev.id}
            >
              {removingDeviceId === dev.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Remover</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    fontSize: 16,
  },
  status: {
    fontSize: 16,
    marginBottom: 15,
  },
  online: {
    color: "green",
  },
  offline: {
    color: "red",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginVertical: 25,
  },
  infoBox: {
    backgroundColor: "#eef2ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 3,
  },
  deviceCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  deviceText: {
    fontSize: 13,
    marginTop: 2,
  },
});
