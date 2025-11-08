import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Switch, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';

export default function CadastroScreen() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    consentimento_lgpd: false
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validarFormulario = () => {
    const { nome, email, senha, confirmarSenha, consentimento_lgpd } = formData;

    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Por favor, digite um email válido');
      return false;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    if (!consentimento_lgpd) {
      Alert.alert('Atenção', 'Você precisa aceitar os termos de uso');
      return false;
    }

    return true;
  };

  const handleCadastro = async () => {
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      // Simulação de cadastro
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        '🎉 Cadastro Realizado!', 
        'Sua conta foi criada com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Volta para o login
              router.back();
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Erro', 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            value={formData.nome}
            onChangeText={(value) => handleChange('nome', value)}
            editable={!loading}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            value={formData.telefone}
            onChangeText={(value) => handleChange('telefone', value)}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            value={formData.senha}
            onChangeText={(value) => handleChange('senha', value)}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirmar Senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite novamente sua senha"
            value={formData.confirmarSenha}
            onChangeText={(value) => handleChange('confirmarSenha', value)}
            secureTextEntry
            editable={!loading}
          />

          {/* Termos e Condições */}
          <View style={styles.consentContainer}>
            <Switch
              value={formData.consentimento_lgpd}
              onValueChange={(value) => handleChange('consentimento_lgpd', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.consentimento_lgpd ? '#007AFF' : '#f4f3f4'}
              disabled={loading}
            />
            <Text style={styles.consentText}>
              Aceito os termos de uso e política de privacidade *
            </Text>
          </View>

          {/* Botão de Cadastro */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          {/* Link para Login */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              Já tem uma conta? <Text style={styles.loginTextBold}>Faça login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#495057',
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  consentText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    padding: 8,
  },
  loginText: {
    color: '#6c757d',
    fontSize: 14,
  },
  loginTextBold: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});