import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function AdminScreen() {
  const stats = {
    totalUsers: 5,
    activeUsers: 3,
    alerts: 1,
    offlineUsers: 1,
    todayEvents: 24,
    criticalAlerts: 3,
    checkins: 18,
    synchronizations: 15
  };

  const activities = [
    { user: 'João Silva', action: 'Bateria crítica detectada (15%)', time: '2 min atrás' },
    { user: 'Maria Santos', action: 'Status "Estou Bem" enviado', time: '5 min atrás' },
    { user: 'Ana Oliveira', action: 'Dispositivo sincronizado com sucesso', time: '8 min atrás' },
    { user: 'Lucia Costa', action: 'Check-in automático realizado', time: '10 min atrás' },
    { user: 'Carlos Souza', action: 'Dispositivo offline há mais de 1 hora', time: '15 min atrás' },
    { user: 'João Silva', action: 'Alerta de queda detectado', time: '1 hora atrás' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel Administrativo</Text>
        <Text style={styles.subtitle}>Monitoramento e gestão do sistema</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Usuários</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={[styles.statCard, styles.alertCard]}>
          <Text style={styles.statNumber}>{stats.alerts}</Text>
          <Text style={styles.statLabel}>Alertas</Text>
        </View>
        <View style={[styles.statCard, styles.offlineCard]}>
          <Text style={styles.statNumber}>{stats.offlineUsers}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registro de Atividades</Text>
        
        <View style={styles.activityList}>
          {activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.userName}>{activity.user}</Text>
                <Text style={styles.userAction}>{activity.action}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estatísticas Recentes</Text>
        
        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Total de eventos hoje:</Text>
            <Text style={styles.statValue}>{stats.todayEvents}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Alertas críticos:</Text>
            <Text style={[styles.statValue, styles.criticalValue]}>{stats.criticalAlerts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Check-ins realizados:</Text>
            <Text style={styles.statValue}>{stats.checkins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Sincronizações:</Text>
            <Text style={styles.statValue}>{stats.synchronizations}</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  alertCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  offlineCard: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
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
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userAction: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  statsList: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statName: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  criticalValue: {
    color: '#dc3545',
  },
});