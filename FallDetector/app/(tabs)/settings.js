import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { authAPI, userAPI, utils } from '../../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [nightMode, setNightMode] = useState(false);

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  const loadUserData = async () => {
  try {
    console.log('🔄 Carregando perfil do usuário...');
    const response = await userAPI.getProfile();
    
    if (response.success && response.user) {
      setUserData(response.user);
      console.log('✅ Dados do usuário carregados:', response.user.nome);
      
      // Carregar foto de perfil
      if (response.user.foto_perfil) {
        // Se for URL relativa, converter para absoluta
        const photoUrl = response.user.foto_perfil.startsWith('http')
          ? response.user.foto_perfil
          : `http://localhost:3000${response.user.foto_perfil}`;
        
        setProfileImage(photoUrl);
        await AsyncStorage.setItem('profileImage', photoUrl);
        console.log('📷 Foto carregada:', photoUrl);
      } else {
        // Limpar foto local se não houver no servidor
        await AsyncStorage.removeItem('profileImage');
        setProfileImage(null);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar perfil:', error);
    try {
      const localUserData = await AsyncStorage.getItem('userData');
      if (localUserData) {
        const parsedData = JSON.parse(localUserData);
        setUserData(parsedData);
        
        // Tentar carregar foto local
        const savedImage = await AsyncStorage.getItem('profileImage');
        if (savedImage) {
          setProfileImage(savedImage);
        }
      }
    } catch (storageError) {
      console.error('❌ Erro ao carregar do AsyncStorage:', storageError);
    }
    Alert.alert('Erro', 'Não foi possível carregar seus dados.');
  } finally {
    setLoading(false);
  }
};

  const loadPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (prefs) {
        const { notifications: notif, sounds: snd, nightMode: night } = JSON.parse(prefs);
        setNotifications(notif ?? true);
        setSounds(snd ?? true);
        setNightMode(night ?? false);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preferências:', error);
    }
  };

  const savePreferences = async (key, value) => {
    try {
      const prefs = {
        notifications,
        sounds,
        nightMode,
        [key]: value
      };
      await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
      console.log('✅ Preferência salva:', key, value);
    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error);
      Alert.alert('Erro', 'Não foi possível salvar a preferência.');
    }
  };

  const handleNotificationToggle = (value) => {
    setNotifications(value);
    savePreferences('notifications', value);
    Alert.alert(
      'Notificações',
      value ? 'Notificações ativadas' : 'Notificações desativadas'
    );
  };

  const handleSoundsToggle = (value) => {
    setSounds(value);
    savePreferences('sounds', value);
    Alert.alert(
      'Sons de Alerta',
      value ? 'Sons ativados' : 'Sons desativados'
    );
  };

  const handleNightModeToggle = (value) => {
    setNightMode(value);
    savePreferences('nightMode', value);
  };

  const handleViewProfile = () => {
    router.push('/profile/edit');
  };

  const handlePrivacySecurity = () => {
    router.push('/profile/security');
  };

  const handleHelpSupport = () => {
    Alert.alert('Ajuda e Suporte', 'Entre em contato: suporte@falldetector.com\n\nTelefone: (11) 99999-9999\n\nHorário: Seg-Sex, 8h às 18h');
  };

  const handleTermsOfUse = () => {
    console.log('📋 Navegando para Termos de Uso');
    router.push('/profile/terms');
  };

  const handleUpdateApp = () => {
    Alert.alert('Atualizar Aplicativo', 'Você está usando a versão mais recente!\n\nVersão: 1.0.0');
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Saída',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              router.replace('/login');
            } catch (error) {
              console.error('❌ Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair da conta.');
            }
          }
        }
      ]
    );
  };

  const getProfileInitial = () => {
    if (!userData?.nome) return '?';
    return userData.nome.charAt(0).toUpperCase();
  };

  const styles = getStyles(nightMode);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize seu aplicativo</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.profileInfo} onPress={handleViewProfile}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.profileInitial}>{getProfileInitial()}</Text>
          )}
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {userData?.nome || 'Usuário'}
            </Text>
            <Text style={styles.profileAction}>Ver perfil</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
       
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Notificações Push</Text>
            <Text style={styles.settingDescription}>Receber alertas e notificações</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notifications ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Sons de Alerta</Text>
            <Text style={styles.settingDescription}>Ativar sons para emergências</Text>
          </View>
          <Switch
            value={sounds}
            onValueChange={handleSoundsToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={sounds ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Modo Noturno</Text>
            <Text style={styles.settingDescription}>Interface com cores escuras</Text>
          </View>
          <Switch
            value={nightMode}
            onValueChange={handleNightModeToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={nightMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outras Opções</Text>
       
        <TouchableOpacity style={styles.optionItem} onPress={handlePrivacySecurity}>
          <Text style={styles.optionText}>🔒 Privacidade e Segurança</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleHelpSupport}>
          <Text style={styles.optionText}>❓ Ajuda e Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleTermsOfUse}>
          <Text style={styles.optionText}>📋 Termos de Uso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleUpdateApp}>
          <Text style={styles.optionText}>🔄 Atualizar Aplicativo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Versão 1.0.0</Text>
        {userData?.email && (
          <Text style={styles.versionText}>{userData.email}</Text>
        )}
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  subtitle: {
    fontSize: 16,
    color: nightMode ? '#aaa' : '#666',
    marginTop: 5,
  },
  profileSection: {
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  profileAction: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: nightMode ? '#333' : '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: nightMode ? '#fff' : '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: nightMode ? '#aaa' : '#666',
    marginTop: 2,
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: nightMode ? '#333' : '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: nightMode ? '#fff' : '#333',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: nightMode ? '#666' : '#999',
    marginTop: 5,
  },
});