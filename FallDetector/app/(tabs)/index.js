import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, Maria!</Text>
        <Text style={styles.subtitle}>Tudo está funcionando bem</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});