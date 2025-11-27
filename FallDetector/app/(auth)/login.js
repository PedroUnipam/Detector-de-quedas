// app/(auth)/login.js
console.log("🔥 VERSÃO NOVA DO CÓDIGO CARREGOU 🔥");

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "../../contexts/auth";

export default function Login() {
  const router = useRouter();
  const { login, onInitApp } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLoggedIn, setAutoLoggedIn] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        await onInitApp();
        setAutoLoggedIn(true);
      } catch (err) {
        console.error("Erro ao tentar auto login", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (autoLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    try {
      setLoading(true);

      await login(email, senha);

      // 🔀 NAVEGAÇÃO
      router.replace("/(tabs)");
    } catch (error) {
      console.error("❌ ERRO DE LOGIN REAL:", error);

      Alert.alert(
        "Erro ao entrar",
        `Código: ${error.code}\n\nMensagem: ${error.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Senha"
        secureTextEntry
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Carregando..." : "Entrar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/cadastro")}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: "center",
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 32,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#000",
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  link: {
    marginTop: 18,
    color: "#007AFF",
    textAlign: "center",
    fontSize: 15,
  },
});
