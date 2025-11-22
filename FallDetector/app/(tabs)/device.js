import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";

export default function DeviceScreen() {
  // Estado SIMULADO
  const [espIP, setEspIP] = useState("192.168.XX.XX");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Aguardando teste...");

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  // SIMULAÇÃO DE STATUS DO ESP32
  useEffect(() => {
    const interval = setInterval(() => {
      fakeCheckStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const fakeCheckStatus = () => {
    // alterna entre online e offline só para simular animação
    setConnected((old) => !old);

    if (!connected) {
      setStatus("ESP32 Online — IP: 192.168.12.5 | RSSI: -61");
    } else {
      setStatus("ESP32 Offline");
    }
  };

  const fakeWifiSend = () => {
    if (!ssid || !password) {
      Alert.alert("Simulação", "Preencha SSID e senha (simulado)");
      return;
    }

    Alert.alert(
      "Simulação",
      `Configurações enviadas:\nSSID: ${ssid}\nSenha: ${password}\n\n(Esse envio é apenas visual no Expo Go)`
    );
  };

  const fakeResetWifi = () => {
    Alert.alert(
      "Simulação",
      "Comando /reset_wifi enviado (simulado, não é real)."
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Status do ESP32</Text>

      <Text style={styles.label}>IP do ESP32</Text>
      <TextInput
        style={styles.input}
        value={espIP}
        onChangeText={setEspIP}
        autoCapitalize="none"
      />

      {/* STATUS VISUAL */}
      <Text
        style={[
          styles.status,
          connected ? styles.online : styles.offline,
        ]}
      >
        {status}
      </Text>

      {/* Botões */}
      <TouchableOpacity style={styles.button} onPress={fakeCheckStatus}>
        <Text style={styles.buttonText}>Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#f44336" }]}
        onPress={fakeResetWifi}
      >
        <Text style={styles.buttonText}>Reset Wi-Fi</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.title}>Configurar Wi-Fi</Text>

      <TextInput
        style={styles.input}
        placeholder="SSID"
        value={ssid}
        onChangeText={setSsid}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ff9800" }]}
        onPress={fakeWifiSend}
      >
        <Text style={styles.buttonText}>Simular Envio</Text>
      </TouchableOpacity>
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
});
