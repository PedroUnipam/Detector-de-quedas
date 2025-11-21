// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI, utils } from '../../services/api';

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await utils.getUserData();
      console.log('👤 Dados do usuário carregados:', data);
      setUserData(data);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await authAPI.logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

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
        <Text style={styles.title}>Olá, {userData?.nome || 'Usuário'}!</Text>
        <Text style={styles.subtitle}>Tudo está funcionando bem</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sair 🚪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comandos Rápidos</Text>
        
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>✅ Estou Bem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>🆘 Pedir Ajuda</Text>
        </TouchableOpacity>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Localização</Text>
          <Text style={styles.locationAddress}>Av. Paulista, 1578 - São Paulo, SP</Text>
          <Text style={styles.locationNote}>Localização compartilhada apenas com contatos de emergência</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status do Dispositivo</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Bateria</Text>
            <Text style={styles.statusValue}>85%</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Conexão</Text>
            <Text style={[styles.statusValue, styles.connected]}>Ativa</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Monitor</Text>
            <Text style={[styles.statusValue, styles.monitoring]}>Ativo</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Status "Estou Bem" enviado</Text>
          <Text style={styles.activityTime}>Há 5 minutos</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Dispositivo encontrado</Text>
          <Text style={styles.activityTime}>Há 15 minutos</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Bateria carregada completamente</Text>
          <Text style={styles.activityTime}>Há 2 horas</Text>
        </View>
      </View>

      {__DEV__ && userData && (
        <View style={styles.devInfo}>
          <Text style={styles.devTitle}>📋 Dados do Usuário</Text>
          <Text style={styles.devText}>ID: {userData.id}</Text>
          <Text style={styles.devText}>Email: {userData.email}</Text>
          <Text style={styles.devText}>CPF: {userData.cpf}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  quickAction: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  locationNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  connected: {
    color: '#28a745',
  },
  monitoring: {
    color: '#28a745',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  devInfo: {
    margin: 10,
    padding: 15,
    backgroundColor: '#e7f3ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  devTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  devText: {
    fontSize: 12,
    color: '#495057',
    marginVertical: 2,
  },
});
