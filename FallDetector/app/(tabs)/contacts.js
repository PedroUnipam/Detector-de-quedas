// app/(tabs)/contacts.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal
} from 'react-native';
import { userAPI, utils } from '../../services/api';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    parentesco: '',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCuidadores();
      setContacts(response.cuidadores || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      Alert.alert('Erro', utils.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, []);

  const handleAddContact = async () => {
    if (!formData.nome || !formData.telefone) {
      Alert.alert('Erro', 'Por favor, preencha nome e telefone');
      return;
    }

    try {
      await userAPI.addCuidador(formData);
      
      Alert.alert('Sucesso', 'Contato adicionado com sucesso!');
      setModalVisible(false);
      setFormData({ nome: '', telefone: '', parentesco: '' });
      loadContacts();
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      Alert.alert('Erro', utils.formatError(error));
    }
  };

  const handleRemoveContact = (contact) => {
    Alert.alert(
      'Remover Contato',
      `Deseja remover ${contact.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.removeCuidador(contact.id);
              Alert.alert('Sucesso', 'Contato removido');
              loadContacts();
            } catch (error) {
              Alert.alert('Erro', utils.formatError(error));
            }
          },
        },
      ]
    );
  };

  const getContactIcon = (parentesco) => {
    const icons = {
      'filho': '👨',
      'filha': '👩',
      'mãe': '👵',
      'pai': '👴',
      'emergência': '🏥',
      'médico': '⚕️',
    };
    return icons[parentesco?.toLowerCase()] || '👤';
  };

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Contatos de Emergência</Text>
        <Text style={styles.subtitle}>Gerencie seus contatos</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>📌 Adicionar Contato</Text>
      </TouchableOpacity>

      <View style={styles.contactList}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum contato cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione contatos para serem notificados em emergências
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactItem}
              onLongPress={() => handleRemoveContact(contact)}
            >
              <Text style={styles.contactIcon}>
                {getContactIcon(contact.parentesco)}
              </Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.nome}</Text>
                <Text style={styles.contactPhone}>💬 {contact.telefone}</Text>
                {contact.parentesco && (
                  <Text style={styles.contactRelationship}>
                    {contact.parentesco}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Modal de Adicionar Contato */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Contato</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo *"
              value={formData.nome}
              onChangeText={(value) => setFormData({ ...formData, nome: value })}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone *"
              value={formData.telefone}
              keyboardType="phone-pad"
              onChangeText={(value) => setFormData({ ...formData, telefone: value })}
            />

            <TextInput
              style={styles.input}
              placeholder="Parentesco (ex: Filho, Médico)"
              value={formData.parentesco}
              onChangeText={(value) => setFormData({ ...formData, parentesco: value })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddContact}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
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
});