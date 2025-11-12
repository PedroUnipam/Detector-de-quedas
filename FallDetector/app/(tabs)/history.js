// app/(tabs)/history.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { fallAPI, utils } from '../../services/api';

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadHistory();
    loadStatistics();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fallAPI.getFallHistory();
      
      // Organizar por data
      const organized = organizeByDate(response.quedas || []);
      setHistoryData(organized);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fallAPI.getStatistics();
      setStatistics(response.estatisticas);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const organizeByDate = (quedas) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped = {};

    quedas.forEach((queda) => {
      const quedaDate = new Date(queda.data_hora);
      let dateKey;

      if (isSameDay(quedaDate, today)) {
        dateKey = 'Hoje';
      } else if (isSameDay(quedaDate, yesterday)) {
        dateKey = 'Ontem';
      } else {
        dateKey = formatDate(quedaDate);
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push({
        time: formatTime(quedaDate),
        title: getTitleFromType(queda.tipo),
        description: queda.status || 'Evento registrado',
        severity: queda.gravidade,
      });
    });

    return Object.keys(grouped).map((date) => ({
      date,
      events: grouped[date],
    }));
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTitleFromType = (tipo) => {
    const titles = {
      'queda': '⚠️ Queda Detectada',
      'inatividade': '😴 Alerta de Inatividade',
      'status': '✅ Status "Estou Bem"',
      'sincronizacao': '🔄 Dispositivo Sincronizado',
      'medicamento': '💊 Lembrete de Medicamento',
    };
    return titles[tipo] || '📌 Evento';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'baixa': '#28a745',
      'media': '#ffc107',
      'alta': '#dc3545',
    };
    return colors[severity] || '#6c757d';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), loadStatistics()]);
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
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
        <Text style={styles.title}>Histórico de Eventos</Text>
        <Text style={styles.subtitle}>Todas as suas atividades</Text>
      </View>

      {/* Estatísticas */}
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.total_quedas || 0}</Text>
            <Text style={styles.statLabel}>Quedas Totais</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.quedas_mes || 0}</Text>
            <Text style={styles.statLabel}>Este Mês</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.dias_sem_quedas || 0}</Text>
            <Text style={styles.statLabel}>Dias Seguro</Text>
          </View>
        </View>
      )}

      <View style={styles.historyList}>
        {historyData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum evento registrado</Text>
            <Text style={styles.emptySubtext}>
              Seu histórico aparecerá aqui
            </Text>
          </View>
        ) : (
          historyData.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day.date}</Text>

              {day.events.map((event, eventIndex) => (
                <View key={eventIndex} style={styles.eventItem}>
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>{event.time}</Text>
                    {event.severity && (
                      <View
                        style={[
                          styles.severityDot,
                          { backgroundColor: getSeverityColor(event.severity) },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historyList: {
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
    alignItems: 'center',
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
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