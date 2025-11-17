import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../../services/api';

export default function SecurityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Estados para alteração de email
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  // Estados para alteração de senha
  const [changingPassword, setChangingPassword] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Controle de visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadUserData();
    loadNightMode();
  }, []);

  const loadNightMode = async () => {
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (prefs) {
        const { nightMode: night } = JSON.parse(prefs);
        setNightMode(night ?? false);
      }
    } catch (error) {
      console.error('Erro ao carregar modo noturno:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.success && response.user) {
        setUserData(response.user);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Atenção', 'Digite o novo e-mail.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    setChangingEmail(true);
    try {
      const response = await userAPI.updateProfile({
        nome: userData.nome,
        email: newEmail,
        telefone: userData.telefone,
      });

      if (response.success) {
        Alert.alert('Sucesso', 'E-mail atualizado com sucesso!');
        setNewEmail('');
        loadUserData();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao atualizar e-mail.');
      }
    } catch (error) {
      console.error('Erro ao alterar e-mail:', error);
      Alert.alert('Erro', 'Não foi possível alterar o e-mail.');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos de senha.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await userAPI.changePassword(senhaAtual, novaSenha);

      if (response.success) {
        Alert.alert('Sucesso', 'Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        Alert.alert('Erro', response.message || 'Erro ao alterar senha.');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      const errorMessage = error.response?.data?.message || 'Não foi possível alterar a senha.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const styles = getStyles(nightMode);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacidade e Segurança</Text>
      </View>

      {/* Seção de E-mail */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Alterar E-mail</Text>
        
        <Text style={styles.label}>E-mail Atual</Text>
        <View style={styles.currentEmailContainer}>
          <Text style={styles.currentEmailText}>{userData?.email || 'Não informado'}</Text>
        </View>

        <Text style={styles.label}>Novo E-mail</Text>
        <TextInput
          style={styles.input}
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="Digite o novo e-mail"
          placeholderTextColor={nightMode ? '#666' : '#999'}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.button, changingEmail && styles.buttonDisabled]} 
          onPress={handleChangeEmail}
          disabled={changingEmail}
        >
          {changingEmail ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Alterar E-mail</Text>
          )}
        </TouchableOpacity>
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
            placeholderTextColor={nightMode ? '#666' : '#999'}
            secureTextEntry={!showCurrentPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nova Senha *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Digite a nova senha (mín. 6 caracteres)"
            placeholderTextColor={nightMode ? '#666' : '#999'}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar Nova Senha *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Confirme a nova senha"
            placeholderTextColor={nightMode ? '#666' : '#999'}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
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
        <Text style={styles.infoText}>• Use uma senha forte com no mínimo 6 caracteres</Text>
        <Text style={styles.infoText}>• Não compartilhe sua senha com ninguém</Text>
        <Text style={styles.infoText}>• Altere sua senha regularmente</Text>
        <Text style={styles.infoText}>• Use senhas diferentes para cada serviço</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (nightMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: nightMode ? '#121212' : '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: nightMode ? '#121212' : '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: nightMode ? '#aaa' : '#666',
  },
  header: {
    padding: 20,
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: nightMode ? '#333' : '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  section: {
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: nightMode ? '#fff' : '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: nightMode ? '#aaa' : '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  currentEmailContainer: {
    backgroundColor: nightMode ? '#2a2a2a' : '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  currentEmailText: {
    fontSize: 16,
    color: nightMode ? '#fff' : '#333',
  },
  input: {
    backgroundColor: nightMode ? '#2a2a2a' : '#f9f9f9',
    borderWidth: 1,
    borderColor: nightMode ? '#444' : '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: nightMode ? '#fff' : '#333',
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: nightMode ? '#2a2a2a' : '#f9f9f9',
    borderWidth: 1,
    borderColor: nightMode ? '#444' : '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: nightMode ? '#fff' : '#333',
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6ca5dd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: nightMode ? '#aaa' : '#666',
    marginBottom: 5,
  },
});