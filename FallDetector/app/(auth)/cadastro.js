import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI, utils } from '../../services/api'; // ajuste o caminho se sua pasta for diferente

export default function CadastroScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
  });


  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  const validarFormulario = () => {
    if (!formData.nome || !formData.email || !formData.telefone || !formData.senha || !formData.confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return false;
    }

    return true;
  };

  const handleCadastro = async () => {
    if (!validarFormulario()) return;
    setLoading(true);
console.log('📦 Enviando para API:', formData);

    try {
      const response = await authAPI.register({
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf,
        telefone: formData.telefone,
        senha: formData.senha,
      });


      if (response.success) {
        Alert.alert(
          '🎉 Cadastro Realizado!',
          'Sua conta foi criada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Erro', response.message || 'Erro ao realizar cadastro.');
      }
    } catch (error) {
      console.error('❌ Erro no cadastro:', error.response?.data || error.message);
      console.error('Erro no cadastro:', error);
      Alert.alert('Erro', utils.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={formData.nome}
        onChangeText={(text) => handleChange('nome', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={formData.cpf}
        onChangeText={(text) => handleChange('cpf', text)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={formData.telefone}
        onChangeText={(text) => handleChange('telefone', text)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={formData.senha}
        onChangeText={(text) => handleChange('senha', text)}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        value={formData.confirmarSenha}
        onChangeText={(text) => handleChange('confirmarSenha', text)}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Já tem uma conta? Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: '#007bff',
    fontSize: 16,
  },
});
