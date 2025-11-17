import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { userAPI } from '../../services/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    complemento: '',
  });

  useEffect(() => {
    loadUserData();
    loadNightMode();
    if (Platform.OS !== 'web') {
      requestPermissions();
    }
  }, []);

  // Função para voltar com segurança
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
        console.log('⚠️ Permissões de câmera/galeria não concedidas');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
    }
  };

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
        setFormData({
          nome: response.user.nome || '',
          email: response.user.email || '',
          telefone: response.user.telefone || '',
          cep: response.user.cep || '',
          logradouro: response.user.logradouro || '',
          numero: response.user.numero || '',
          bairro: response.user.bairro || '',
          cidade: response.user.cidade || '',
          uf: response.user.uf || '',
          complemento: response.user.complemento || '',
        });
        
        // Carregar foto de perfil do servidor
        if (response.user.foto_perfil) {
          // Se for URL relativa, converter para absoluta
          const photoUrl = response.user.foto_perfil.startsWith('http')
            ? response.user.foto_perfil
            : `http://localhost:3000${response.user.foto_perfil}`;
          
          setProfileImage(photoUrl);
          await AsyncStorage.setItem('profileImage', photoUrl);
          console.log('📷 Foto carregada:', photoUrl);
        } else {
          // Tentar carregar foto local
          const savedImage = await AsyncStorage.getItem('profileImage');
          if (savedImage) {
            setProfileImage(savedImage);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const formatCEP = (text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const searchCEP = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }
    setSearchingCep(true);
    
    try {
      console.log('🔍 Buscando CEP:', cleanCep);
      
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        Alert.alert('CEP não encontrado', 'O CEP informado não foi encontrado. Verifique e tente novamente.');
        return;
      }
      
      console.log('✅ Endereço encontrado:', data);
      
      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
        complemento: data.complemento || prev.complemento,
      }));
      
      Alert.alert('Sucesso!', 'Endereço encontrado e preenchido automaticamente.');
      
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      Alert.alert('Erro', 'Não foi possível buscar o CEP. Verifique sua conexão com a internet.');
    } finally {
      setSearchingCep(false);
    }
  };

  const handleChange = (field, value) => {
    if (field === 'cep') {
      const formattedCep = formatCEP(value);
      setFormData({ ...formData, [field]: formattedCep });
      
      const cleanCep = formattedCep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        searchCEP(cleanCep);
      }
    } else if (field === 'uf') {
      setFormData({ ...formData, [field]: value.toUpperCase().slice(0, 2) });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePhotoChange = () => {
    if (Platform.OS === 'web') {
      pickImageWeb();
    } else {
      Alert.alert(
        'Alterar Foto de Perfil',
        'Escolha uma opção:',
        [
          {
            text: '📷 Tirar Foto',
            onPress: () => takePhoto(),
          },
          {
            text: '🖼️ Escolher da Galeria',
            onPress: () => pickImage(),
          },
          {
            text: '🗑️ Remover Foto',
            onPress: () => removePhoto(),
            style: 'destructive',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const pickImageWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          Alert.alert('Erro', 'A imagem deve ter no máximo 5MB.');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageUri = reader.result;
          setProfileImage(imageUri);
          await saveProfileImage(imageUri);
          Alert.alert('Sucesso!', 'Foto selecionada! Clique em Salvar para confirmar.');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await saveProfileImage(imageUri);
        Alert.alert('Sucesso!', 'Foto capturada! Clique em Salvar para confirmar.');
      }
    } catch (error) {
      console.error('❌ Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await saveProfileImage(imageUri);
        Alert.alert('Sucesso!', 'Foto selecionada! Clique em Salvar para confirmar.');
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const removePhoto = async () => {
    Alert.alert(
      'Remover Foto',
      'Deseja realmente remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setProfileImage(null);
            await AsyncStorage.removeItem('profileImage');
            
            // Atualizar no servidor
            try {
              await userAPI.updateProfile({ foto_perfil: null });
              Alert.alert('Sucesso', 'Foto de perfil removida.');
            } catch (error) {
              console.error('Erro ao remover foto do servidor:', error);
              Alert.alert('Aviso', 'Foto removida localmente, mas houve um erro ao atualizar no servidor.');
            }
          }
        }
      ]
    );
  };

  const saveProfileImage = async (imageUri) => {
    try {
      // Salvar localmente para preview
      await AsyncStorage.setItem('profileImage', imageUri);
      console.log('✅ Foto de perfil salva localmente para preview');
      
      // Upload será feito ao salvar o perfil
    } catch (error) {
      console.error('❌ Erro ao salvar foto:', error);
    }
  };

  const handleSave = async () => {
    // Validar campos obrigatórios básicos
    if (!formData.nome.trim()) {
      Alert.alert('Atenção', 'O nome é obrigatório.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Atenção', 'O email é obrigatório.');
      return;
    }

    setSaving(true);

    try {
      // Preparar dados básicos
      const updateData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone?.trim() || null,
      };

      // Verificar se TODOS os campos obrigatórios do endereço estão preenchidos
      const hasCompleteAddress = 
        formData.cep?.trim() && 
        formData.logradouro?.trim() && 
        formData.numero?.trim() && 
        formData.cidade?.trim() && 
        formData.uf?.trim();

      if (hasCompleteAddress) {
        // Adicionar endereço completo
        updateData.cep = formData.cep.trim();
        updateData.logradouro = formData.logradouro.trim();
        updateData.numero = formData.numero.trim();
        updateData.bairro = formData.bairro?.trim() || '';
        updateData.cidade = formData.cidade.trim();
        updateData.uf = formData.uf.trim().toUpperCase();
        updateData.complemento = formData.complemento?.trim() || null;

        console.log('📍 Endereço completo será enviado:', {
          cep: updateData.cep,
          logradouro: updateData.logradouro,
          numero: updateData.numero,
          bairro: updateData.bairro,
          cidade: updateData.cidade,
          uf: updateData.uf,
          complemento: updateData.complemento
        });
      } else {
        // Verificar se algum campo de endereço foi preenchido
        const hasPartialAddress = 
          formData.cep?.trim() || 
          formData.logradouro?.trim() || 
          formData.numero?.trim() || 
          formData.cidade?.trim() || 
          formData.uf?.trim();

        if (hasPartialAddress) {
          // Endereço incompleto - avisar usuário
          console.log('⚠️ Endereço incompleto detectado:', {
            cep: formData.cep || 'VAZIO',
            logradouro: formData.logradouro || 'VAZIO',
            numero: formData.numero || 'VAZIO',
            cidade: formData.cidade || 'VAZIO',
            uf: formData.uf || 'VAZIO'
          });

          Alert.alert(
            'Endereço Incompleto',
            'Para salvar o endereço, preencha todos os campos obrigatórios:\n\n• CEP\n• Logradouro\n• Número\n• Cidade\n• UF\n\nDeseja continuar sem salvar o endereço?',
            [
              { 
                text: 'Cancelar', 
                style: 'cancel', 
                onPress: () => setSaving(false) 
              },
              { 
                text: 'Continuar Sem Endereço', 
                onPress: () => proceedWithSave(updateData) 
              }
            ]
          );
          return;
        } else {
          console.log('ℹ️ Nenhum campo de endereço preenchido');
        }
      }

      // Salvar dados
      await proceedWithSave(updateData);

    } catch (error) {
      console.error('❌ Erro ao preparar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      setSaving(false);
    }
  };

  const proceedWithSave = async (updateData) => {
    try {
      console.log('📤 Enviando dados para API...');
      
      let photoUrl = null;
      
      // Se há uma foto nova (não é URL do servidor), fazer upload primeiro
      if (profileImage && !profileImage.startsWith('http://') && !profileImage.startsWith('https://') && !profileImage.startsWith('/img/')) {
        try {
          console.log('📷 Fazendo upload da foto...');
          const uploadResponse = await userAPI.uploadPhoto(profileImage);
          
          if (uploadResponse.success) {
            photoUrl = uploadResponse.data.url;
            console.log('✅ Foto enviada com sucesso:', photoUrl);
          }
        } catch (uploadError) {
          console.error('❌ Erro ao fazer upload da foto:', uploadError);
          
          // Perguntar se quer continuar sem foto
          const continuar = await new Promise((resolve) => {
            Alert.alert(
              'Erro no Upload',
              'Não foi possível enviar a foto. Deseja continuar salvando apenas os outros dados?',
              [
                { 
                  text: 'Cancelar', 
                  style: 'cancel', 
                  onPress: () => resolve(false) 
                },
                { 
                  text: 'Continuar Sem Foto', 
                  onPress: () => resolve(true) 
                }
              ]
            );
          });
          
          if (!continuar) {
            setSaving(false);
            return;
          }
        }
      } else if (profileImage && (profileImage.startsWith('http://') || profileImage.startsWith('https://') || profileImage.startsWith('/img/'))) {
        // Foto já é uma URL do servidor
        photoUrl = profileImage.startsWith('http') ? profileImage : profileImage;
        console.log('ℹ️ Usando foto existente:', photoUrl);
      }
      
      // Adicionar URL da foto aos dados
      if (photoUrl) {
        updateData.foto_perfil = photoUrl;
      }
      
      console.log('📤 Dados finais:', JSON.stringify(updateData, null, 2));
      
      // Atualizar perfil
      const response = await userAPI.updateProfile(updateData);
      
      console.log('📥 Resposta do servidor:', response);

      if (response.success) {
        // Atualizar dados locais no AsyncStorage
        const userData = {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          foto_perfil: photoUrl,
          // Adicionar campos de endereço se foram salvos
          ...(updateData.cep && {
            cep: updateData.cep,
            logradouro: updateData.logradouro,
            numero: updateData.numero,
            bairro: updateData.bairro,
            cidade: updateData.cidade,
            uf: updateData.uf,
            complemento: updateData.complemento
          })
        };

        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Salvar URL da foto também
        if (photoUrl) {
          // Converter para URL completa se necessário
          const fullPhotoUrl = photoUrl.startsWith('http') 
            ? photoUrl 
            : `http://localhost:3000${photoUrl}`;
          await AsyncStorage.setItem('profileImage', fullPhotoUrl);
        } else {
          await AsyncStorage.removeItem('profileImage');
        }
        
        console.log('✅ Dados salvos no AsyncStorage');

        Alert.alert(
          'Sucesso', 
          'Perfil atualizado com sucesso!', 
          [{ 
            text: 'OK', 
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/settings');
              }
            }
          }]
        );
      } else {
        Alert.alert('Erro', response.message || 'Erro ao atualizar perfil.');
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      console.error('Stack:', error.stack);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Não foi possível salvar as alterações.';
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSaving(false);
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
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handlePhotoChange} activeOpacity={0.7}>
          <View style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
            ) : (
              <Text style={styles.photoInitial}>{formData.nome.charAt(0).toUpperCase()}</Text>
            )}
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePhotoButton} onPress={handlePhotoChange}>
          <Text style={styles.changePhotoText}>
            {Platform.OS === 'web' ? '🖼️ Escolher Foto' : '📷 Alterar Foto'}
          </Text>
        </TouchableOpacity>
        {profileImage && (
          <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
            <Text style={styles.removePhotoText}>🗑️ Remover Foto</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        
        <Text style={styles.label}>Nome Completo *</Text>
        <TextInput
          style={styles.input}
          value={formData.nome}
          onChangeText={(text) => handleChange('nome', text)}
          placeholder="Digite seu nome"
          placeholderTextColor={nightMode ? '#666' : '#999'}
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          placeholder="seu@email.com"
          placeholderTextColor={nightMode ? '#666' : '#999'}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={formData.telefone}
          onChangeText={(text) => handleChange('telefone', text)}
          placeholder="(00) 00000-0000"
          placeholderTextColor={nightMode ? '#666' : '#999'}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>
        
        <Text style={styles.label}>CEP *</Text>
        <View style={styles.cepContainer}>
          <TextInput
            style={[styles.input, styles.cepInput]}
            value={formData.cep}
            onChangeText={(text) => handleChange('cep', text)}
            placeholder="00000-000"
            placeholderTextColor={nightMode ? '#666' : '#999'}
            keyboardType="numeric"
            maxLength={9}
          />
          {searchingCep && (
            <View style={styles.cepLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.cepLoaderText}>Buscando...</Text>
            </View>
          )}
        </View>
        <Text style={styles.helperText}>Digite o CEP para preencher automaticamente</Text>

        <Text style={styles.label}>Logradouro</Text>
        <TextInput
          style={styles.input}
          value={formData.logradouro}
          onChangeText={(text) => handleChange('logradouro', text)}
          placeholder="Rua, Avenida, etc."
          placeholderTextColor={nightMode ? '#666' : '#999'}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Número *</Text>
            <TextInput
              style={styles.input}
              value={formData.numero}
              onChangeText={(text) => handleChange('numero', text)}
              placeholder="123"
              placeholderTextColor={nightMode ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Complemento</Text>
            <TextInput
              style={styles.input}
              value={formData.complemento}
              onChangeText={(text) => handleChange('complemento', text)}
              placeholder="Apto, Bloco..."
              placeholderTextColor={nightMode ? '#666' : '#999'}
            />
          </View>
        </View>

        <Text style={styles.label}>Bairro</Text>
        <TextInput
          style={styles.input}
          value={formData.bairro}
          onChangeText={(text) => handleChange('bairro', text)}
          placeholder="Bairro"
          placeholderTextColor={nightMode ? '#666' : '#999'}
        />

        <View style={styles.row}>
          <View style={[styles.halfInput, { flex: 2 }]}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              value={formData.cidade}
              onChangeText={(text) => handleChange('cidade', text)}
              placeholder="Cidade"
              placeholderTextColor={nightMode ? '#666' : '#999'}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>UF</Text>
            <TextInput
              style={styles.input}
              value={formData.uf}
              onChangeText={(text) => handleChange('uf', text)}
              placeholder="SP"
              placeholderTextColor={nightMode ? '#666' : '#999'}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>💾 Salvar Alterações</Text>
        )}
      </TouchableOpacity>

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
  photoSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    marginTop: 10,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: nightMode ? '#333' : '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: nightMode ? '#1e1e1e' : '#f5f5f5',
  },
  cameraIcon: {
    fontSize: 16,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: nightMode ? '#333' : '#f0f0f0',
    borderRadius: 20,
    marginBottom: 8,
  },
  changePhotoText: {
    fontSize: 14,
    color: nightMode ? '#fff' : '#333',
  },
  removePhotoButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  removePhotoText: {
    fontSize: 12,
    color: '#dc3545',
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
  input: {
    backgroundColor: nightMode ? '#2a2a2a' : '#f9f9f9',
    borderWidth: 1,
    borderColor: nightMode ? '#444' : '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: nightMode ? '#fff' : '#333',
  },
  cepContainer: {
    position: 'relative',
  },
  cepInput: {
    paddingRight: 100,
  },
  cepLoader: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cepLoaderText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#007AFF',
  },
  helperText: {
    fontSize: 12,
    color: nightMode ? '#666' : '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#6ca5dd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});