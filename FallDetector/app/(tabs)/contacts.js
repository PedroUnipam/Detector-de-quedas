import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { userAPI, utils } from "../../services/api";
import { useRegister } from "../../hooks/useRegister";
import { useLinkToCaregiver } from "../../hooks/useLinkToCaregiver";

const formatPhone = (text) => {
  const numbers = text.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const maskCPF = (v) => {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const nightMode = false;

  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    telefone: "",
    email: "",
    password: "",
    cpf: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const { mutateAsync: register, isPending } = useRegister();
  const { linkToCaregiver, loading: linkingCaregiver } = useLinkToCaregiver();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCuidadores();
      setContacts(response.success ? response.cuidadores || [] : []);
    } catch (error) {
      Alert.alert("Erro", utils.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      id: null,
      nome: "",
      telefone: "",
      email: "",
    });
    setModalVisible(true);
  };

  const handleRemoveContact = (contact) => {
    Alert.alert(
      "Remover Contato",
      `Deseja realmente remover ${contact.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const response = await userAPI.removeCuidador(contact.id);
            if (response.success) {
              Alert.alert("Sucesso", "Contato removido!");
              loadContacts();
            } else {
              Alert.alert("Erro", response.message);
            }
          },
        },
      ],
    );
  };

  const styles = getStyles(nightMode);

  // const handleVincularCuidador = () => { };
  const handleSaveContact = async () => {
    try {
      const { data: caregiver } = await register({
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        cellphone: formData.telefone,
        name: formData.nome,
      });
      console.log({ caregiver });

      await linkToCaregiver(caregiver.id);

      setModalVisible(false);
      setFormData({
        id: null,
        nome: "",
        telefone: "",
        email: "",
        password: "",
        cpf: "",
      });
    } catch (err) {
      Alert.alert("Erro", utils.formatError(err));
    }
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={nightMode ? "#fff" : "#007AFF"}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Contatos de Emergência</Text>
        <Text style={styles.subtitle}>{contacts.length} cadastrados</Text>
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
            {contact.email && (
              <Text style={styles.contactEmail}>📧 {contact.email}</Text>
            )}
          </View>

          <View style={styles.actionButtons}>
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
            <Text style={styles.modalTitle}>Novo Contato</Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* <View style={styles.emailContainer}>

              <TouchableOpacity
                style={styles.vinculateButton}
                onPress={handleVincularCuidador}
              >
                <Text style={styles.vinculateButtonText}>🔍</Text>
              </TouchableOpacity>
            </View> 
            <Text style={styles.vinculateHint}>
              💡 Se este email for de um cuidador cadastrado, clique acima para
              vinculá-lo. Assim ele poderá acompanhar suas quedas e localização.
            </Text>

            */}

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={formData.nome}
              onChangeText={(v) => setFormData({ ...formData, nome: v })}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone"
              keyboardType="phone-pad"
              value={formData.telefone}
              onChangeText={(v) =>
                setFormData({ ...formData, telefone: formatPhone(v) })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="CPF"
              keyboardType="phone-pad"
              value={formData.cpf}
              onChangeText={(v) =>
                setFormData({ ...formData, cpf: maskCPF(v) })
              }
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(v) => {
                  setFormData({ ...formData, password: v });
                }}
                placeholder="Digite a senha"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>
                  {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveContact}
                disabled={linkingCaregiver || isPending}
              >
                <Text style={styles.saveButtonText}>
                  {linkingCaregiver || isPending ? "Salvando" : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (nightMode = false) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: nightMode ? "#1a1a1a" : "#f5f5f5" },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: nightMode ? "#1a1a1a" : "#f5f5f5",
    },
    loadingText: {
      marginTop: 10,
      color: nightMode ? "#fff" : "#666",
    },
    header: {
      padding: 20,
      backgroundColor: nightMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: nightMode ? "#444" : "#e0e0e0",
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: nightMode ? "#fff" : "#333",
    },
    subtitle: {
      color: nightMode ? "#aaa" : "#555",
      marginTop: 5,
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
      color: nightMode ? "#fff" : "#333",
    },
    contactPhone: {
      color: nightMode ? "#bbb" : "#555",
      marginTop: 4,
    },
    contactRelationship: {
      fontStyle: "italic",
      color: nightMode ? "#999" : "#777",
      marginTop: 4,
    },
    contactEmail: {
      marginTop: 6,
      color: nightMode ? "#aaa" : "#333",
      fontSize: 13,
    },
    actionButtons: {
      justifyContent: "center",
      flexDirection: "row",
      gap: 15,
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
      color: nightMode ? "#fff" : "#333",
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
    emailContainer: {
      flex: 1,
      flexDirection: "row",
      width: "100%",
      alignSelf: "stretch",
    },
    vinculateButton: {
      backgroundColor: "#28a745",
      padding: 14,
      borderRadius: 8,
      marginVertical: 10,
      alignItems: "center",
      width: "18px",
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
      marginTop: 10,
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
      color: nightMode ? "#fff" : "#333",
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
      color: nightMode ? "#fff" : "#333",
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
      fontWeight: "600",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: nightMode ? "#1a1a1a" : "#f1f1f1",
      borderColor: nightMode ? "#444" : "#ddd",
      borderRadius: 8,
      marginBottom: 10,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: nightMode ? "#fff" : "#333",
      backgroundColor: nightMode ? "#1a1a1a" : "#f1f1f1",
      color: nightMode ? "#fff" : "#333",
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontSize: 16,
    },
    eyeButton: {
      padding: 12,
    },
    eyeIcon: {
      fontSize: 20,
    },
  });
