import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function HistoryScreen() {
  const historyData = [
    {
      date: 'Hoje',
      events: [
        { time: '14:30', title: 'Status "Estou Bem"', description: 'Confirmação enviada aos contatos' },
        { time: '08:15', title: 'Dispositivo Sincronizado', description: 'Conexão estabelecida com sucesso' },
      ]
    },
    {
      date: 'Ontem', 
      events: [
        { time: '22:00', title: 'Lembrete de Medicamento', description: 'Notificação enviada' },
        { time: '19:45', title: 'Status "Estou Bem"', description: 'Confirmação enviada aos contatos' },
      ]
    },
    {
      date: '08 Out',
      events: [
        { time: '15:20', title: 'Alerta de Inatividade', description: 'Contatos notificados - Resolvido' },
        { time: '10:00', title: 'Dispositivo Sincronizado', description: 'Atualização de software concluída' },
      ]
    },
    {
      date: '07 Out',
      events: [
        { time: '16:30', title: 'Status "Estou Bem"', description: 'Confirmação enviada aos contatos' },
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Eventos</Text>
        <Text style={styles.subtitle}>Todas as suas atividades</Text>
      </View>

      <View style={styles.historyList}>
        {historyData.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day.date}</Text>
            
            {day.events.map((event, eventIndex) => (
              <View key={eventIndex} style={styles.eventItem}>
                <View style={styles.eventTime}>
                  <Text style={styles.eventTimeText}>{event.time}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
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
  historyList: {
    padding: 10,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventTime: {
    width: 60,
    marginRight: 15,
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
  },
});