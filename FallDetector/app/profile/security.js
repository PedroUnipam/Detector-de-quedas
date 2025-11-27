import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { userAPI } from "../../services/api";

export default function SecurityScreen() {
  const router = useRouter();
  const loading = false;
  const nightMode = false;

  // Estados para alteração de senha
  const [changingPassword, setChangingPassword] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Controle de visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos de senha.");
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await userAPI.changePassword(senhaAtual, novaSenha);

      if (response.success) {
        Alert.alert("Sucesso", "Senha alterada com sucesso!");
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      } else {
        Alert.alert("Erro", response.message || "Erro ao alterar senha.");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      const errorMessage =
        error.response?.data?.message || "Não foi possível alterar a senha.";
      Alert.alert("Erro", errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const styles = getStyles(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacidade e Segurança</Text>
      </View>

      {/* Seção de Senha */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 Alterar Senha</Text>

        <Text style={styles.label}>Senha Atual *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            placeholder="Digite sua senha atual"
            placeholderTextColor={nightMode ? "#666" : "#999"}
            secureTextEntry={!showCurrentPassword}
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>
              {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nova Senha *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Digite a nova senha (mín. 6 caracteres)"
            placeholderTextColor={nightMode ? "#666" : "#999"}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showNewPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar Nova Senha *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Confirme a nova senha"
            placeholderTextColor={nightMode ? "#666" : "#999"}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, changingPassword && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={changingPassword}
        >
          {changingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Alterar Senha</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Informações de Segurança */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Dicas de Segurança</Text>
        <Text style={styles.infoText}>
          • Use uma senha forte com no mínimo 6 caracteres
        </Text>
        <Text style={styles.infoText}>
          • Não compartilhe sua senha com ninguém
        </Text>
        <Text style={styles.infoText}>• Altere sua senha regularmente</Text>
        <Text style={styles.infoText}>
          • Use senhas diferentes para cada serviço
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (nightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: nightMode ? "#121212" : "#f5f5f5",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: nightMode ? "#121212" : "#f5f5f5",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: nightMode ? "#aaa" : "#666",
    },
    header: {
      padding: 20,
      backgroundColor: nightMode ? "#1e1e1e" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: nightMode ? "#333" : "#e0e0e0",
    },
    backButton: {
      marginBottom: 10,
    },
    backButtonText: {
      fontSize: 16,
      color: "#007AFF",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333",
    },
    section: {
      backgroundColor: nightMode ? "#1e1e1e" : "#fff",
      margin: 10,
      padding: 15,
      borderRadius: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      color: nightMode ? "#fff" : "#333",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: nightMode ? "#aaa" : "#666",
      marginBottom: 5,
      marginTop: 10,
    },
    currentEmailContainer: {
      backgroundColor: nightMode ? "#2a2a2a" : "#f0f0f0",
      borderRadius: 8,
      padding: 12,
      marginBottom: 5,
    },
    currentEmailText: {
      fontSize: 16,
      color: nightMode ? "#fff" : "#333",
    },
    input: {
      backgroundColor: nightMode ? "#2a2a2a" : "#f9f9f9",
      borderWidth: 1,
      borderColor: nightMode ? "#444" : "#ddd",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: nightMode ? "#fff" : "#333",
      marginBottom: 10,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: nightMode ? "#2a2a2a" : "#f9f9f9",
      borderWidth: 1,
      borderColor: nightMode ? "#444" : "#ddd",
      borderRadius: 8,
      marginBottom: 10,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: nightMode ? "#fff" : "#333",
    },
    eyeButton: {
      padding: 12,
    },
    eyeIcon: {
      fontSize: 20,
    },
    button: {
      backgroundColor: "#007AFF",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: "#6ca5dd",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    infoSection: {
      backgroundColor: nightMode ? "#1e1e1e" : "#fff",
      margin: 10,
      padding: 15,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: "#007AFF",
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333",
      marginBottom: 10,
    },
    infoText: {
      fontSize: 14,
      color: nightMode ? "#aaa" : "#666",
      marginBottom: 5,
    },
  });
