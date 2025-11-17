// app/(tabs)/contacts.js - VERSÃO COM PICKER CUSTOMIZADO

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, utils } from '../../services/api';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [tiposCuidador, setTiposCuidador] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    telefone: '',
    parentesco: '',
    id_tipocuidador: null,
    email: '',
  });

  useEffect(() => {
    loadContacts();
    loadTiposCuidador();
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

  const loadTiposCuidador = async () => {
    try {
      console.log('📋 Carregando tipos de cuidador...');
      const response = await userAPI.getTiposCuidador();
      
      console.log('📥 Resposta tipos:', response);
      
      if (response.success && response.tipos) {
        setTiposCuidador(response.tipos);
        console.log(`✅ ${response.tipos.length} tipos carregados:`, response.tipos);
      } else {
        console.warn('⚠️ Resposta não contém tipos, usando fallback');
        useFallbackTipos();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tipos de cuidador:', error);
      useFallbackTipos();
    }
  };

  const useFallbackTipos = () => {
    const tiposFallback = [
      { id_tipocuidador: 1, descricao: 'Familiar' },
      { id_tipocuidador: 2, descricao: 'Enfermeiro' },
      { id_tipocuidador: 3, descricao: 'Cuidador Profissional' },
      { id_tipocuidador: 4, descricao: 'Médico' },
      { id_tipocuidador: 5, descricao: 'Fisioterapeuta' },
    ];
    setTiposCuidador(tiposFallback);
    console.log('✅ Tipos fallback carregados:', tiposFallback);
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      console.log('📞 Carregando contatos...');
      
      const response = await userAPI.getCuidadores();
      
      console.log('📥 Resposta:', response);
      
      if (response.success) {
        setContacts(response.cuidadores || []);
        console.log(`✅ ${response.cuidadores?.length || 0} contatos carregados`);
      } else {
        console.log('⚠️ Resposta sem sucesso:', response);
        setContacts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar contatos:', error);
      Alert.alert('Erro', utils.formatError(error));
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, []);

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormData({
      id: null,
      nome: '',
      telefone: '',
      parentesco: '',
      id_tipocuidador: tiposCuidador.length > 0 ? tiposCuidador[0].id_tipocuidador : null,
      email: '',
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (contact) => {
    console.log('✏️ Abrindo modal de edição:', contact);
    
    const tipoEncontrado = tiposCuidador.find(
      tipo => tipo.descricao.toLowerCase() === contact.parentesco?.toLowerCase()
    );
    
    setEditMode(true);
    setFormData({
      id: contact.id,
      nome: contact.nome,
      telefone: contact.telefone,
      parentesco: contact.parentesco || '',
      id_tipocuidador: tipoEncontrado?.id_tipocuidador || (tiposCuidador.length > 0 ? tiposCuidador[0].id_tipocuidador : null),
      email: contact.email || '',
    });
    setModalVisible(true);
  };

  const handleSelectTipo = (tipo) => {
    console.log('📝 Tipo selecionado:', tipo);
    setFormData({ 
      ...formData, 
      id_tipocuidador: tipo.id_tipocuidador,
      parentesco: tipo.descricao 
    });
    setPickerVisible(false);
  };

  const handleSaveContact = async () => {
    if (!formData.nome?.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome');
      return;
    }
    if (!formData.telefone?.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o telefone');
      return;
    }
    if (!formData.id_tipocuidador) {
      Alert.alert('Atenção', 'Por favor, selecione o tipo de cuidador');
      return;
    }

    const phoneNumbers = formData.telefone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      Alert.alert('Atenção', 'Telefone inválido. Digite um número completo.');
      return;
    }

    try {
      const tipoSelecionado = tiposCuidador.find(
        tipo => tipo.id_tipocuidador === formData.id_tipocuidador
      );
      
      console.log('💾 Tipo selecionado:', tipoSelecionado);
      
      const dataToSend = {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        parentesco: tipoSelecionado?.descricao || 'Familiar',
        id_tipocuidador: formData.id_tipocuidador,
        email: formData.email?.trim() || null,
      };

      console.log('📤 Dados a enviar:', dataToSend);

      if (editMode) {
        console.log('✏️ Editando contato ID:', formData.id);
        
        const response = await userAPI.updateCuidador(formData.id, dataToSend);
        
        console.log('📥 Resposta da edição:', response);
        
        if (response.success) {
          Alert.alert('Sucesso', 'Contato atualizado com sucesso!');
          setModalVisible(false);
          setFormData({ id: null, nome: '', telefone: '', parentesco: '', id_tipocuidador: null, email: '' });
          await loadContacts();
        } else {
          Alert.alert('Erro', response.message || 'Erro ao atualizar contato');
        }
      } else {
        console.log('➕ Adicionando novo contato');
        
        const response = await userAPI.addCuidador(dataToSend);
        
        console.log('📥 Resposta da adição:', response);
        
        if (response.success) {
          Alert.alert('Sucesso', 'Contato adicionado com sucesso!');
          setModalVisible(false);
          setFormData({ id: null, nome: '', telefone: '', parentesco: '', id_tipocuidador: null, email: '' });
          await loadContacts();
        } else {
          Alert.alert('Erro', response.message || 'Erro ao adicionar contato');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar contato:', error);
      Alert.alert('Erro', utils.formatError(error));
    }
  };

  const handleRemoveContact = (contact) => {
    console.log('🗑️ Tentando remover contato:', contact);
    
    Alert.alert(
      'Remover Contato',
      `Deseja realmente remover ${contact.nome}?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => console.log('❌ Remoção cancelada')
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Confirmado! Removendo contato ID:', contact.id);
              
              const response = await userAPI.removeCuidador(contact.id);
              
              console.log('📥 Resposta da remoção:', response);
              
              if (response.success) {
                Alert.alert('Sucesso', 'Contato removido com sucesso!', [
                  { text: 'OK', onPress: () => console.log('✅ Confirmação OK') }
                ]);
                await loadContacts();
              } else {
                Alert.alert('Erro', response.message || 'Erro ao remover contato');
              }
            } catch (error) {
              console.error('❌ Erro ao remover:', error);
              Alert.alert('Erro', utils.formatError(error));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getContactIcon = (parentesco) => {
    if (!parentesco) return '👤';
    
    const icons = {
      'filho': '👨',
      'filha': '👩',
      'mãe': '👵',
      'mae': '👵',
      'pai': '👴',
      'irmão': '👨‍👦',
      'irmao': '👨‍👦',
      'irmã': '👩‍👧',
      'irma': '👩‍👧',
      'emergência': '🚨',
      'emergencia': '🚨',
      'médico': '⚕️',
      'medico': '⚕️',
      'enfermeiro': '👨‍⚕️',
      'cuidador': '👨‍⚕️',
      'cuidador profissional': '👨‍⚕️',
      'fisioterapeuta': '🧑‍⚕️',
      'familiar': '👥',
    };
    
    return icons[parentesco.toLowerCase()] || '👤';
  };

  const getSelectedTipoLabel = () => {
    const tipo = tiposCuidador.find(t => t.id_tipocuidador === formData.id_tipocuidador);
    return tipo?.descricao || 'Selecione o tipo';
  };

  const styles = getStyles(nightMode);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando contatos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={nightMode ? '#fff' : '#007AFF'}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Contatos de Emergência</Text>
        <Text style={styles.subtitle}>
          {contacts.length} {contacts.length === 1 ? 'contato cadastrado' : 'contatos cadastrados'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenAddModal}
      >
        <Text style={styles.addButtonText}>➕ Adicionar Contato</Text>
      </TouchableOpacity>

      <View style={styles.contactList}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyText}>Nenhum contato cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione contatos para serem notificados em caso de emergência
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Text style={styles.contactIcon}>
                  {getContactIcon(contact.parentesco)}
                </Text>
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.nome}</Text>
                <Text style={styles.contactPhone}>📱 {contact.telefone}</Text>
                {contact.parentesco && (
                  <Text style={styles.contactRelationship}>
                    {contact.parentesco}
                  </Text>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleOpenEditModal(contact)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    console.log('👆 Botão excluir pressionado para:', contact.nome);
                    handleRemoveContact(contact);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Toque no ícone ✏️ para editar ou 🗑️ para remover um contato
        </Text>
      </View>

      {/* Modal de Adicionar/Editar Contato */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, nightMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, nightMode && styles.textDark]}>
              {editMode ? 'Editar Contato' : 'Novo Contato'}
            </Text>

            <Text style={[styles.inputLabel, nightMode && styles.textDark]}>Nome Completo *</Text>
            <TextInput
              style={[styles.input, nightMode && styles.inputDark]}
              placeholder="Ex: João Silva"
              placeholderTextColor={nightMode ? '#666' : '#999'}
              value={formData.nome}
              onChangeText={(value) => setFormData({ ...formData, nome: value })}
            />

            <Text style={[styles.inputLabel, nightMode && styles.textDark]}>Telefone *</Text>
            <TextInput
              style={[styles.input, nightMode && styles.inputDark]}
              placeholder="(00) 00000-0000"
              placeholderTextColor={nightMode ? '#666' : '#999'}
              value={formData.telefone}
              keyboardType="phone-pad"
              onChangeText={(value) => setFormData({ ...formData, telefone: formatPhone(value) })}
              maxLength={15}
            />

            <Text style={[styles.inputLabel, nightMode && styles.textDark]}>Parentesco/Tipo *</Text>
            <TouchableOpacity
              style={[styles.customPicker, nightMode && styles.customPickerDark]}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={[styles.customPickerText, nightMode && styles.textDark]}>
                {getSelectedTipoLabel()}
              </Text>
              <Text style={styles.customPickerIcon}>▼</Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, nightMode && styles.textDark]}>E-mail (Opcional)</Text>
            <TextInput
              style={[styles.input, nightMode && styles.inputDark]}
              placeholder="exemplo@email.com"
              placeholderTextColor={nightMode ? '#666' : '#999'}
              value={formData.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) => setFormData({ ...formData, email: value })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ 
                    id: null, 
                    nome: '', 
                    telefone: '', 
                    parentesco: '', 
                    id_tipocuidador: tiposCuidador.length > 0 ? tiposCuidador[0].id_tipocuidador : null,
                    email: '' 
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal do Picker Customizado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={[styles.pickerModalContent, nightMode && styles.pickerModalContentDark]}>
            <Text style={[styles.pickerModalTitle, nightMode && styles.textDark]}>
              Selecione o Tipo
            </Text>
            <ScrollView style={styles.pickerList}>
              {tiposCuidador.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id_tipocuidador}
                  style={[
                    styles.pickerItem,
                    formData.id_tipocuidador === tipo.id_tipocuidador && styles.pickerItemSelected,
                    nightMode && styles.pickerItemDark
                  ]}
                  onPress={() => handleSelectTipo(tipo)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    formData.id_tipocuidador === tipo.id_tipocuidador && styles.pickerItemTextSelected,
                    nightMode && styles.textDark
                  ]}>
                    {tipo.descricao}
                  </Text>
                  {formData.id_tipocuidador === tipo.id_tipocuidador && (
                    <Text style={styles.pickerItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.pickerCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (nightMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: nightMode ? '#121212' : '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: nightMode ? '#121212' : '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
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
  addButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactList: {
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: nightMode ? '#aaa' : '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: nightMode ? '#666' : '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: nightMode ? '#2a2a2a' : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactIcon: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: nightMode ? '#aaa' : '#666',
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: nightMode ? '#666' : '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: nightMode ? '#2a4a8f' : '#e3f2fd',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 20,
  },
  removeButton: {
    padding: 8,
    backgroundColor: nightMode ? '#4a2a2a' : '#ffebee',
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 20,
  },
  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: nightMode ? '#1e1e1e' : '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: nightMode ? '#aaa' : '#1976d2',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  textDark: {
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#fff',
  },
  customPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  customPickerDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  customPickerText: {
    fontSize: 16,
    color: '#333',
  },
  customPickerIcon: {
    fontSize: 12,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do Picker Modal Customizado
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    maxHeight: '60%',
  },
  pickerModalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  pickerItemDark: {
    backgroundColor: '#2a2a2a',
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  pickerItemCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  pickerCloseButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});