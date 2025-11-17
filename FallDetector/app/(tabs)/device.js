import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Device() {
  const [connected, setConnected] = useState(false);
  const [ip] = useState("192.168.12.5"); // IP do ESP32
  const [status, setStatus] = useState("Aguardando conexão...");

  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  async function checkConnection() {
    try {
      const response = await fetch(`http://${ip}/status`, { method: "GET" });

      if (response.ok) {
        const text = await response.text();

        setConnected(true);
        setStatus("ESP32 Online — Status: " + text);
      } else {
        setConnected(false);
        setStatus("ESP32 Offline");
      }
    } catch (error) {
      setConnected(false);
      setStatus("ESP32 Offline");
    }
  }

  async function reconnect() {
    setStatus("Tentando reconectar...");
    checkConnection();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitoramento do ESP32</Text>

      <Text style={[styles.status, connected ? styles.online : styles.offline]}>
        {status}
      </Text>

      <TouchableOpacity style={styles.button} onPress={reconnect}>
        <Text style={styles.buttonText}>Recarregar Status</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
  online: {
    color: "green",
  },
  offline: {
    color: "red",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
