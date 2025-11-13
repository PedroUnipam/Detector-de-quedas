import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceAPI } from '../../services/api';

export default function DeviceScreen() {
  const [devices, setDevices] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState('bluetooth');
  const [scanning, setScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);
  
  // Configurações WiFi
  const [wifiConfig, setWifiConfig] = useState({
    ssid: '',
    password: '',
    serverUrl: '',
    deviceId: ''
  });

  // Configurações Bluetooth
  const [bluetoothConfig, setBluetoothConfig] = useState({
    deviceName: '',
    macAddress: '',
    deviceId: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      setDevices(response.devices || []);
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
    }
  };

  const scanForDevices = async () => {
    setScanning(true);
    try {
      const response = await deviceAPI.scanDevices(selectedConnection);
      setAvailableDevices(response.dispositivos || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar dispositivos');
    } finally {
      setScanning(false);
    }
  };

  const openConfigModal = (device = null) => {
    if (device) {
      setCurrentDevice(device);
      if (device.tipo === 'wifi') {
        setWifiConfig({
          ssid: device.config?.ssid || '',
          password: '',
          serverUrl: device.config?.serverUrl || 'http://192.168.0.10:3000/api/falls/register',
          deviceId: device.config?.deviceId || ''
        });
      } else {
        setBluetoothConfig({
          deviceName: device.config?.deviceName || '',
          macAddress: device.config?.macAddress || '',
          deviceId: device.config?.deviceId || ''
        });
      }
    } else {
      setCurrentDevice(null);
      setWifiConfig({ ssid: '', password: '', serverUrl: 'http://192.168.0.10:3000/api/falls/register', deviceId: '' });
      setBluetoothConfig({ deviceName: '', macAddress: '', deviceId: '' });
    }
    setShowConfigModal(true);
  };

  const saveDeviceConfig = async () => {
    try {
      const config = selectedConnection === 'wifi' ? wifiConfig : bluetoothConfig;
      
      // Validações
      if (selectedConnection === 'wifi') {
        if (!config.ssid || !config.password || !config.serverUrl || !config.deviceId) {
          Alert.alert('Erro', 'Preencha todos os campos WiFi');
          return;
        }
      } else {
        if (!config.deviceName || !config.macAddress || !config.deviceId) {
          Alert.alert('Erro', 'Preencha todos os campos Bluetooth');
          return;
        }
      }

      const deviceData = {
        nome: selectedConnection === 'wifi' ? config.ssid : config.deviceName,
        tipo: selectedConnection,
        config: config,
        ativo: true
      };

      if (currentDevice) {
        await deviceAPI.updateDevice(currentDevice.id, deviceData);
        Alert.alert('Sucesso', 'Dispositivo atualizado!');
      } else {
        await deviceAPI.addDevice(deviceData);
        Alert.alert('Sucesso', 'Dispositivo adicionado! Agora atualize o código do ESP32 com as configurações.');
      }

      setShowConfigModal(false);
      loadDevices();
      showESP32Instructions();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o dispositivo');
    }
  };

  const showESP32Instructions = () => {
    const config = selectedConnection === 'wifi' ? wifiConfig : bluetoothConfig;
    
    let instructions = '';
    
    if (selectedConnection === 'wifi') {
      instructions = `
📱 CONFIGURAÇÕES SALVAS!

Agora atualize o código do ESP32 com estas informações:

const char* ssid = "${config.ssid}";
const char* password = "${config.password}";
const char* serverUrl = "${config.serverUrl}";
const int deviceId = ${config.deviceId};

Cole essas linhas no início do código Main.cpp do ESP32.
      `;
    } else {
      instructions = `
📱 CONFIGURAÇÕES SALVAS!

Dispositivo Bluetooth configurado:
Nome: ${config.deviceName}
MAC: ${config.macAddress}
ID: ${config.deviceId}

O dispositivo aparecerá na lista de pareamento Bluetooth.
      `;
    }

    Alert.alert('Instruções ESP32', instructions);
  };

  const deleteDevice = async (deviceId) => {
    Alert.alert(
      'Confirmar',
      'Deseja realmente remover este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deviceAPI.removeDevice(deviceId);
              Alert.alert('Sucesso', 'Dispositivo removido');
              loadDevices();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o dispositivo');
            }
          }
        }
      ]
    );
  };

  const toggleDeviceStatus = async (device) => {
    try {
      await deviceAPI.updateDevice(device.id, { ...device, ativo: !device.ativo });
      loadDevices();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar status');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Dispositivos</Text>
        <Text style={styles.subtitle}>Configure WiFi ou Bluetooth</Text>
      </View>

      {/* Tipo de Conexão */}
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

      {/* Botão Adicionar Dispositivo */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openConfigModal()}
        >
          <Text style={styles.addButtonText}>+ Adicionar Dispositivo {selectedConnection === 'wifi' ? 'WiFi' : 'Bluetooth'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Dispositivos Configurados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivos Configurados</Text>
        
        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum dispositivo configurado</Text>
            <Text style={styles.emptySubtext}>Adicione um dispositivo para começar</Text>
          </View>
        ) : (
          devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {device.tipo === 'wifi' ? '📶' : '📱'} {device.nome}
                  </Text>
                  <Text style={styles.deviceType}>
                    {device.tipo === 'wifi' ? 'WiFi' : 'Bluetooth'}
                    {device.config?.deviceId && ` • ID: ${device.config.deviceId}`}
                  </Text>
                </View>
                <Switch
                  value={device.ativo}
                  onValueChange={() => toggleDeviceStatus(device)}
                  trackColor={{ false: '#ccc', true: '#34C759' }}
                />
              </View>
              
              {device.tipo === 'wifi' && device.config && (
                <View style={styles.deviceDetails}>
                  <Text style={styles.detailText}>📡 SSID: {device.config.ssid}</Text>
                  <Text style={styles.detailText}>🌐 Server: {device.config.serverUrl}</Text>
                </View>
              )}
              
              {device.tipo === 'bluetooth' && device.config && (
                <View style={styles.deviceDetails}>
                  <Text style={styles.detailText}>📱 MAC: {device.config.macAddress}</Text>
                </View>
              )}

              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openConfigModal(device)}
                >
                  <Text style={styles.editButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteDevice(device.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Dicas */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Como Funciona</Text>
        <Text style={styles.tip}>1. Escolha entre WiFi ou Bluetooth</Text>
        <Text style={styles.tip}>2. Adicione um novo dispositivo</Text>
        <Text style={styles.tip}>3. Preencha as configurações</Text>
        <Text style={styles.tip}>4. Use as configurações no código ESP32</Text>
        <Text style={styles.tip}>5. Grave o código no dispositivo</Text>
      </View>

      {/* Modal de Configuração */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {currentDevice ? 'Editar' : 'Adicionar'} Dispositivo {selectedConnection === 'wifi' ? 'WiFi' : 'Bluetooth'}
              </Text>

              {selectedConnection === 'wifi' ? (
                <>
                  <Text style={styles.label}>Nome da Rede (SSID) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: MinhaRedeWiFi"
                    value={wifiConfig.ssid}
                    onChangeText={(text) => setWifiConfig({ ...wifiConfig, ssid: text })}
                  />

                  <Text style={styles.label}>Senha do WiFi *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite a senha"
                    value={wifiConfig.password}
                    onChangeText={(text) => setWifiConfig({ ...wifiConfig, password: text })}
                    secureTextEntry
                  />

                  <Text style={styles.label}>URL do Servidor *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="http://192.168.0.10:3000/api/falls/register"
                    value={wifiConfig.serverUrl}
                    onChangeText={(text) => setWifiConfig({ ...wifiConfig, serverUrl: text })}
                  />

                  <Text style={styles.label}>ID do Dispositivo *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 1"
                    value={wifiConfig.deviceId}
                    onChangeText={(text) => setWifiConfig({ ...wifiConfig, deviceId: text })}
                    keyboardType="numeric"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Nome do Dispositivo *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Monitor-001"
                    value={bluetoothConfig.deviceName}
                    onChangeText={(text) => setBluetoothConfig({ ...bluetoothConfig, deviceName: text })}
                  />

                  <Text style={styles.label}>Endereço MAC *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: AA:BB:CC:DD:EE:FF"
                    value={bluetoothConfig.macAddress}
                    onChangeText={(text) => setBluetoothConfig({ ...bluetoothConfig, macAddress: text })}
                  />

                  <Text style={styles.label}>ID do Dispositivo *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 1"
                    value={bluetoothConfig.deviceId}
                    onChangeText={(text) => setBluetoothConfig({ ...bluetoothConfig, deviceId: text })}
                    keyboardType="numeric"
                  />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowConfigModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveDeviceConfig}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    color: '#666',
  },
  connectionButtonTextActive: {
    color: '#fff',
  },
  section: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  deviceCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceDetails: {
    marginVertical: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  deviceActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 6,
    marginRight: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 6,
    marginLeft: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});