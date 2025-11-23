// app/(auth)/login.js

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../services/firebase";
import { registerExpoToken } from "../../services/notifications";  // caminho corrigido

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    try {
      setLoading(true);

      // 🔐 LOGIN NO FIREBASE
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;
      const token = await cred.user.getIdToken();

      console.log("🔐 Login bem-sucedido!", uid);

      // 💾 SALVA NO ASYNC STORAGE
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("uid", uid);

      // 📱 SALVA TOKEN EXPO NO FIRESTORE AUTOMATICAMENTE
      await registerExpoToken(uid);

      console.log("📲 Token Expo registrado!");

      // 🔀 NAVEGA PARA AS TELAS
      router.replace("/(tabs)");

    } catch (error) {
      console.error("❌ Erro login: ", error);
      Alert.alert("Erro", "Email ou senha inválidos.");
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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Carregando..." : "Entrar"}</Text>
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
    backgroundColor: '#f8f9fa',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: "center",
    marginBottom: 32
  },

  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#495057',
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  link: {
    marginTop: 18,
    color: "#007AFF",
    textAlign: "center",
    fontSize: 15
  }
});
