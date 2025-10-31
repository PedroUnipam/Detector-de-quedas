import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [sounds, setSounds] = React.useState(true);
  const [nightMode, setNightMode] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize seu aplicativo</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileInitial}>M</Text>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>Maria Santos</Text>
            <Text style={styles.profileAction}>Ver perfil</Text>
          </View>
        </View>
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
            onValueChange={setNotifications}
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
            onValueChange={setSounds}
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
            onValueChange={setNightMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={nightMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outras Opções</Text>
        
        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>🔒 Privacidade e Segurança</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>❓ Ajuda e Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>📋 Termos de Uso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>🔄 Atualizar Aplicativo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>[+] Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Versão 1.0.0</Text>
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
  profileSection: {
    backgroundColor: '#fff',
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
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileAction: {
    fontSize: 14,
    color: '#007AFF',
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
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
    color: '#999',
  },
});