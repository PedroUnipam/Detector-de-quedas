import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function ContactsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contatos de Emergência</Text>
        <Text style={styles.subtitle}>Gerencie seus contatos</Text>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>📌 Adicionar Contato</Text>
      </TouchableOpacity>

      <View style={styles.contactList}>
        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>🐀</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Maria Silva</Text>
            <Text style={styles.contactPhone}>💬 (11) 98765-4321</Text>
            <Text style={styles.contactRelationship}>Filha</Text>
          </View>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>🐀</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>João Silva</Text>
            <Text style={styles.contactPhone}>💬 (11) 98765-4322</Text>
            <Text style={styles.contactRelationship}>Filho</Text>
          </View>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactIcon}>🏥</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Hospital Albert Einstein</Text>
            <Text style={styles.contactPhone}>💬 (11) 2151-1233</Text>
            <Text style={styles.contactRelationship}>Emergência</Text>
          </View>
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
});