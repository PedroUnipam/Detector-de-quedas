import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

export default function DeviceScreen() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Aguardando conexão...");
  const [espIP, setEspIP] = useState("192.168.12.5"); // IP DA REDE NORMAL
  const [setupIP] = useState("192.168.4.1"); // IP DO SOFTAP DO ESP32

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  // ===============================
  // Checar status do ESP32 (rede normal)
  // ===============================
  useEffect(() => {
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`http://${espIP}/status`);
      if (response.ok) {
        const txt = await response.text();
        setConnected(true);
        setStatus("ESP32 Online — " + txt);
      } else {
        setConnected(false);
        setStatus("ESP32 Offline");
      }
    } catch {
      setConnected(false);
      setStatus("ESP32 Offline");
    }
  };

  // ===============================
  // Enviar SSID + senha para o ESP32 via SoftAP
  // ===============================
  const sendWifiConfig = async () => {
    if (!ssid || !password)
      return Alert.alert("Erro", "Preencha SSID e Senha");

    try {
      const res = await fetch(`http://${setupIP}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password }),
      });

      if (res.ok) {
        Alert.alert(
          "Enviado!",
          "Configurações enviadas. O ESP32 irá reiniciar e tentar conectar."
        );
      } else {
        Alert.alert("Erro", "ESP32 não respondeu ao /config");
      }
    } catch (e) {
      Alert.alert(
        "Falha",
        "Não foi possível acessar o ESP32 no modo configuração (SoftAP)."
      );
    }
  };

  // ===============================
  // RESETAR WIFI DO ESP32 (voltar pro modo SoftAP)
  // ===============================
  const resetWifiConfig = async () => {
    Alert.alert(
      "Confirmar",
      "Deseja realmente apagar a configuração de Wi-Fi do ESP32?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `http://${espIP}/reset_wifi`,
                { method: "POST" }
              );

              if (res.ok) {
                const txt = await res.text();
                Alert.alert(
                  "Reset enviado",
                  txt || "ESP32 irá reiniciar em modo configuração."
                );
              } else {
                Alert.alert(
                  "Erro",
                  "ESP32 não respondeu ao /reset_wifi"
                );
              }
            } catch (e) {
              Alert.alert(
                "Falha",
                "Não foi possível acessar o ESP32 no IP configurado."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Status do ESP32</Text>

      <Text
        style={[
          styles.status,
          connected ? styles.online : styles.offline,
        ]}
      >
        {status}
      </Text>

      <TouchableOpacity style={styles.button} onPress={checkStatus}>
        <Text style={styles.buttonText}>Recarregar Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { marginTop: 10, backgroundColor: "#f44336" }]}
        onPress={resetWifiConfig}
      >
        <Text style={styles.buttonText}>Resetar Wi-Fi do ESP32</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.title}>Configurar Wi-Fi do ESP32</Text>
      <Text style={styles.subtitle}>
        1. Coloque o ESP32 em modo configuração (SoftAP)  
        2. Conecte seu celular na rede{" "}
        <Text style={{ fontWeight: "bold" }}>ESP-Setup</Text>
      </Text>
      <Text style={styles.subtitle}>
        IP do ESP32 no modo configuração: {setupIP}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="SSID da sua rede"
        value={ssid}
        onChangeText={setSsid}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha do Wi-Fi"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.buttonOrange}
        onPress={sendWifiConfig}
      >
        <Text style={styles.buttonText}>Enviar Configurações</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
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
  buttonOrange: {
    backgroundColor: "#ff9800",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 25,
  },
  subtitle: {
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    fontSize: 16,
  },
});
