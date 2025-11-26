import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, utils } from '../../services/api';
import { findPessoaByEmail } from '../../services/firestorePessoas';
import { auth } from '../../services/firebase';
import {
  getCuidadorByEmail,
  vincularCuidadorAUsuario
} from '../../services/firestoreVinculos';

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
      const response = await userAPI.getTiposCuidador();
      if (response.success && response.tipos) {
        setTiposCuidador(response.tipos);
      } else {
        useFallbackTipos();
      }
    } catch {
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
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCuidadores();
      setContacts(response.success ? response.cuidadores || [] : []);
    } catch (error) {
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

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormData({
      id: null,
      nome: '',
      telefone: '',
      parentesco: '',
      id_tipocuidador: tiposCuidador[0]?.id_tipocuidador,
      email: '',
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (contact) => {
    const tipoEncontrado = tiposCuidador.find(
      t => t.descricao.toLowerCase() === contact.parentesco?.toLowerCase()
    );
    setEditMode(true);
    setFormData({
      id: contact.id,
      nome: contact.nome,
      telefone: contact.telefone,
      parentesco: contact.parentesco,
      id_tipocuidador: tipoEncontrado?.id_tipocuidador,
      email: contact.email,
    });
    setModalVisible(true);
  };

  const handleSelectTipo = (tipo) => {
    setFormData({
      ...formData,
      id_tipocuidador: tipo.id_tipocuidador,
      parentesco: tipo.descricao
    });
    setPickerVisible(false);
  };

  // ==========================================
  //  🔗 VINCULAR CUIDADOR (FUNÇÃO SEPARADA)
  // ==========================================
  const handleVincularCuidador = async () => {
    if (!formData.email?.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail do cuidador');
      return;
    }

    try {
      console.log("🔗 Tentando vincular cuidador com email:", formData.email.trim());

      // 1. Verificar se o email é de um cuidador
      const result = await getCuidadorByEmail(formData.email.trim());

      if (!result.success) {
        Alert.alert('Erro', result.message || 'Este email não pertence a um cuidador cadastrado.');
        return;
      }

      console.log("✅ Cuidador encontrado:", result.cuidador);

      // 2. Vincular o cuidador ao usuário atual
      const usuarioAtual = auth.currentUser;
      if (!usuarioAtual) {
        Alert.alert('Erro', 'Você precisa estar logado.');
        return;
      }

      console.log("🔗 Vinculando cuidador", result.cuidador.uid, "ao paciente", usuarioAtual.uid);

      const vinculoResult = await vincularCuidadorAUsuario(
        usuarioAtual.uid,
        result.cuidador.uid
      );

      if (vinculoResult.success) {
        Alert.alert(
          'Sucesso! 🎉',
          `O cuidador ${result.cuidador.nome} foi vinculado à sua conta!\n\nEle agora poderá visualizar suas quedas e localização.`
        );

        // Preencher nome automaticamente se estava vazio
        if (!formData.nome?.trim()) {
          setFormData(prev => ({
            ...prev,
            nome: result.cuidador.nome
          }));
        }
      } else {
        Alert.alert('Erro', vinculoResult.error || 'Não foi possível vincular o cuidador.');
      }

    } catch (error) {
      console.error('❌ Erro ao vincular cuidador:', error);
      Alert.alert('Erro', 'Falha ao vincular cuidador: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // ==========================================
  //  🔍 VALIDAÇÃO DE EMAIL
  // ==========================================
  const validateEmailInFirestore = async () => {
    if (!formData.email?.trim()) return true;

    const email = formData.email.trim();
    
    try {
      const result = await findPessoaByEmail(email);

      if (!result.ok) {
        if (result.reason === "not_found") {
          Alert.alert("E-mail não encontrado", "Nenhum usuário registrado com este e-mail.");
        } else if (result.reason === "inactive") {
          Alert.alert("Usuário inativo", "Este usuário existe, mas não está ativo.");
        } else {
          Alert.alert("Erro", "Falha ao validar o e-mail.");
        }
        return false;
      }

      // Se usuário existe, usa nome real caso campo nome esteja vazio
      if (!formData.nome?.trim() && result.user?.nome) {
        setFormData(prev => ({
          ...prev,
          nome: result.user.nome
        }));
      }

      return true;
    } catch (error) {
      console.error("Erro ao validar email:", error);
      // Se der erro na validação, não bloqueia o salvamento
      return true;
    }
  };

  // ==========================================
  //  💾 SALVAR CONTATO
  // ==========================================
  const handleSaveContact = async () => {
    if (!formData.nome?.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome');
      return;
    }
    if (!formData.telefone?.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o telefone');
      return;
    }

    // 🔍 Valida email no Firestore (se a função existir)
    if (typeof findPessoaByEmail === 'function') {
      const emailIsValid = await validateEmailInFirestore();
      if (!emailIsValid) return;
    }

    const tipoSelecionado = tiposCuidador.find(
      tipo => tipo.id_tipocuidador === formData.id_tipocuidador
    );

    const dataToSend = {
      nome: formData.nome.trim(),
      telefone: formData.telefone.trim(),
      parentesco: tipoSelecionado?.descricao || formData.parentesco,
      id_tipocuidador: formData.id_tipocuidador,
      email: formData.email?.trim() || null,
    };

    try {
      let response;
      if (editMode) {
        response = await userAPI.updateCuidador(formData.id, dataToSend);
      } else {
        response = await userAPI.addCuidador(dataToSend);
      }

      if (response.success) {
        Alert.alert('Sucesso', editMode ? 'Contato atualizado!' : 'Contato adicionado!');
        setModalVisible(false);
        await loadContacts();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao salvar contato');
      }
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      Alert.alert('Erro', utils.formatError(error));
    }
  };

  const handleRemoveContact = (contact) => {
    Alert.alert(
      'Remover Contato',
      `Deseja realmente remover ${contact.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const response = await userAPI.removeCuidador(contact.id);
            if (response.success) {
              Alert.alert('Sucesso', 'Contato removido!');
              loadContacts();
            } else {
              Alert.alert('Erro', response.message);
            }
          }
        }
      ]
    );
  };

  const getSelectedTipoLabel = () => {
    const tipo = tiposCuidador.find(t => t.id_tipocuidador === formData.id_tipocuidador);
    return tipo?.descricao || "Selecione o tipo";
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
          {contacts.length} cadastrados
        </Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
        <Text style={styles.addButtonText}>➕ Adicionar Contato</Text>
      </TouchableOpacity>

      {contacts.map((contact) => (
        <View key={contact.id} style={styles.contactItem}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.nome}</Text>
            <Text style={styles.contactPhone}>{contact.telefone}</Text>
            <Text style={styles.contactRelationship}>{contact.parentesco}</Text>
            {contact.email && <Text style={styles.contactEmail}>📧 {contact.email}</Text>}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => handleOpenEditModal(contact)}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleRemoveContact(contact)}>
              <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* MODAL ADICIONAR/EDITAR */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Editar Contato' : 'Novo Contato'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={formData.nome}
              onChangeText={v => setFormData({ ...formData, nome: v })}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone"
              keyboardType="phone-pad"
              value={formData.telefone}
              onChangeText={v => setFormData({ ...formData, telefone: formatPhone(v) })}
            />

            <TouchableOpacity
              style={styles.customPicker}
              onPress={() => setPickerVisible(true)}
            >
              <Text>{getSelectedTipoLabel()}</Text>
              <Text>▼</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="E-mail (opcional)"
              value={formData.email}
              onChangeText={v => setFormData({ ...formData, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* BOTÃO DE VINCULAR CUIDADOR */}
            <TouchableOpacity
              style={styles.vinculateButton}
              onPress={handleVincularCuidador}
            >
              <Text style={styles.vinculateButtonText}>
                🔗 Vincular como Cuidador
              </Text>
            </TouchableOpacity>

            <Text style={styles.vinculateHint}>
              💡 Se este email for de um cuidador cadastrado, clique acima para vinculá-lo.
              Assim ele poderá acompanhar suas quedas e localização.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PICKER */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerModalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Selecione o tipo</Text>

            <ScrollView>
              {tiposCuidador.map((t) => (
                <TouchableOpacity
                  key={t.id_tipocuidador}
                  style={styles.pickerItem}
                  onPress={() => handleSelectTipo(t)}
                >
                  <Text>{t.descricao}</Text>
                  {formData.id_tipocuidador === t.id_tipocuidador && <Text>✓</Text>}
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

const getStyles = (nightMode) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: nightMode ? "#1a1a1a" : "#f5f5f5" },
    centerContainer: { 
      flex: 1, 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: nightMode ? "#1a1a1a" : "#f5f5f5"
    },
    loadingText: {
      marginTop: 10,
      color: nightMode ? "#fff" : "#666",
    },
    header: { 
      padding: 20, 
      backgroundColor: nightMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: nightMode ? "#444" : "#e0e0e0"
    },
    title: { 
      fontSize: 22, 
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333"
    },
    subtitle: { 
      color: nightMode ? "#aaa" : "#555", 
      marginTop: 5 
    },
    addButton: {
      backgroundColor: "#007AFF",
      margin: 20,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    contactItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: nightMode ? "#2a2a2a" : "#fff",
      padding: 15,
      margin: 10,
      marginHorizontal: 20,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    contactInfo: { flex: 1 },
    contactName: { 
      fontSize: 16, 
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333"
    },
    contactPhone: { 
      color: nightMode ? "#bbb" : "#555",
      marginTop: 4
    },
    contactRelationship: { 
      fontStyle: "italic", 
      color: nightMode ? "#999" : "#777",
      marginTop: 4
    },
    contactEmail: { 
      marginTop: 6, 
      color: nightMode ? "#aaa" : "#333",
      fontSize: 13
    },
    actionButtons: { 
      justifyContent: "center",
      flexDirection: "row",
      gap: 15
    },
    editButtonText: { fontSize: 22 },
    removeButtonText: { fontSize: 22 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: nightMode ? "#2a2a2a" : "#fff",
      padding: 20,
      borderRadius: 16,
      width: "90%",
      maxHeight: "80%",
    },
    modalTitle: { 
      fontSize: 20, 
      fontWeight: "bold", 
      marginBottom: 15,
      color: nightMode ? "#fff" : "#333"
    },
    input: {
      backgroundColor: nightMode ? "#1a1a1a" : "#f1f1f1",
      color: nightMode ? "#fff" : "#333",
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontSize: 16,
    },
    customPicker: {
      backgroundColor: nightMode ? "#1a1a1a" : "#f1f1f1",
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    vinculateButton: {
      backgroundColor: "#28a745",
      padding: 14,
      borderRadius: 8,
      marginVertical: 10,
      alignItems: "center",
    },
    vinculateButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
    },
    vinculateHint: {
      fontSize: 12,
      color: nightMode ? "#999" : "#666",
      fontStyle: "italic",
      marginBottom: 15,
      lineHeight: 18,
      textAlign: "center",
    },
    modalButtons: { 
      flexDirection: "row", 
      justifyContent: "space-between",
      marginTop: 10
    },
    cancelButton: {
      backgroundColor: nightMode ? "#444" : "#ccc",
      padding: 14,
      borderRadius: 8,
      flex: 1,
      marginRight: 8,
      alignItems: "center",
    },
    cancelButtonText: { 
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333"
    },
    saveButton: {
      backgroundColor: "#007AFF",
      padding: 14,
      borderRadius: 8,
      flex: 1,
      marginLeft: 8,
      alignItems: "center",
    },
    saveButtonText: { color: "#fff", fontWeight: "bold" },
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    pickerModalContent: {
      backgroundColor: nightMode ? "#2a2a2a" : "#fff",
      padding: 20,
      borderRadius: 16,
      width: "80%",
      maxHeight: "70%",
    },
    pickerModalTitle: { 
      fontSize: 18, 
      textAlign: "center", 
      marginBottom: 15,
      fontWeight: "600",
      color: nightMode ? "#fff" : "#333"
    },
    pickerItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: nightMode ? "#444" : "#f0f0f0",
    },
    pickerCloseButton: {
      backgroundColor: "#007AFF",
      padding: 12,
      borderRadius: 8,
      marginTop: 15,
    },
    pickerCloseButtonText: { 
      color: "#fff", 
      textAlign: "center",
      fontWeight: "600"
    },
  });