import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function DeviceScreen() {
  const [selectedConnection, setSelectedConnection] = useState('bluetooth');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parear Dispositivo</Text>
        <Text style={styles.subtitle}>Conecte seu monitor de segurança</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Como Conectar</Text>
        <View style={styles.steps}>
          <Text style={styles.step}>1. Ligue o dispositivo monitor</Text>
          <Text style={styles.step}>2. Escolha entre Bluetooth ou Wi-Fi</Text>
          <Text style={styles.step}>3. Clique em "Buscar Dispositivos"</Text>
          <Text style={styles.step}>4. Selecione seu dispositivo na lista</Text>
        </View>
      </View>

      <View style={styles.connectionType}>
        <TouchableOpacity 
          style={[
            styles.connectionButton,
            selectedConnection === 'bluetooth' && styles.connectionButtonActive
          ]}
          onPress={() => setSelectedConnection('bluetooth')}
        >
          <Text style={[
            styles.connectionButtonText,
            selectedConnection === 'bluetooth' && styles.connectionButtonTextActive
          ]}>
            📱 Bluetooth
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.connectionButton,
            selectedConnection === 'wifi' && styles.connectionButtonActive
          ]}
          onPress={() => setSelectedConnection('wifi')}
        >
          <Text style={[
            styles.connectionButtonText,
            selectedConnection === 'wifi' && styles.connectionButtonTextActive
          ]}>
            📶 Wi-Fi
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buscar Dispositivos</Text>
        
        <View style={styles.deviceList}>
          <View style={styles.deviceItem}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Monitor SG-001 (WiFi)</Text>
              <Text style={styles.deviceBattery}>🔋 88%</Text>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Conectar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.deviceItem}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Guardian-5G</Text>
              <Text style={styles.deviceBattery}>🔋 95%</Text>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Conectar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Dicas de Conexão</Text>
        <Text style={styles.tip}>• Mantenha o dispositivo próximo durante o pareamento</Text>
        <Text style={styles.tip}>• Certifique-se de que o Bluetooth/Wi-Fi está ativado</Text>
        <Text style={styles.tip}>• O dispositivo deve estar ligado e carregado</Text>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  steps: {
    paddingLeft: 10,
  },
  step: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  connectionType: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
  },
  connectionButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  connectionButtonActive: {
    backgroundColor: '#007AFF',
  },
  connectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  connectionButtonTextActive: {
    color: '#fff',
  },
  deviceList: {
    marginTop: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceBattery: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  connectButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tipsSection: {
    backgroundColor: '#e7f3ff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});