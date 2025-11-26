// components/HomeCuidador.js

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";

const classifyFallEmoji = (level) => {
    const map = {
        0: "⚪ Sem impacto",
        1: "🟡 Movimento brusco",
        2: "🟠 Impacto moderado",
        3: "🔴 Queda forte",
    };
    return map[level] || "⚪ Evento";
};

const formatHoraCurta = (date) => {
    if (!date) return "--:--";
    const d = new Date(date);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};

const formatDataCurta = (date) => {
    if (!date) return "--/--";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
};

const formatDataCompleta = (date) => {
    if (!date) return "--/--/----";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

export default function HomeCuidador({ userData }) {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        console.log("🏥 HomeCuidador montado para:", userData?.nome);
        loadPacientes();
    }, []);

    const loadPacientes = async () => {
        try {
            setLoading(true);
            console.log("📊 Carregando pacientes vinculados...");
            console.log("👨‍⚕️ UID do cuidador:", userData?.uid);

            if (!userData?.uid) {
                console.error("❌ UID do cuidador não disponível");
                setPacientes([]);
                return;
            }

            // ✨ NOVA FUNCIONALIDADE: Busca pacientes por vínculo direto E por dispositivo
            const { getTodosPacientesVinculados } = await import("../services/firestoreDeviceVinculos");
            
            const result = await getTodosPacientesVinculados(userData.uid);

            if (result.success) {
                console.log(`✅ ${result.pacientes.length} paciente(s) encontrado(s)`);
                
                // Mostrar detalhes dos vínculos
                result.pacientes.forEach(p => {
                    console.log(`   📋 ${p.nome}:`);
                    if (p.vinculoDireto) console.log(`      ✅ Vínculo direto`);
                    if (p.vinculoDispositivo) {
                        console.log(`      📱 Via dispositivo: ${p.dispositivoComum?.deviceId}`);
                    }
                });
                
                setPacientes(result.pacientes);
            } else {
                console.error("❌ Erro ao buscar pacientes:", result.error);
                Alert.alert("Erro", result.error || "Falha ao carregar pacientes");
                setPacientes([]);
            }
        } catch (error) {
            console.error("❌ Erro ao carregar pacientes:", error);
            Alert.alert("Erro", "Falha ao carregar dados dos pacientes.");
            setPacientes([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPacientes();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert("Sair", "Deseja realmente sair do aplicativo?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sair",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut(auth);
                        router.replace("/(auth)/login");
                    } catch (error) {
                        console.error("❌ Erro ao fazer logout:", error);
                    }
                },
            },
        ]);
    };

    const handleOpenMap = (paciente) => {
        if (!paciente.localizacaoHabilitada) {
            Alert.alert(
                "Localização Desabilitada",
                `${paciente.nome} não compartilhou a localização.`
            );
            return;
        }

        if (!paciente.ultimaLocalizacao) {
            Alert.alert(
                "Sem Localização",
                "Ainda não há registro de localização para este paciente."
            );
            return;
        }

        const { latitude, longitude } = paciente.ultimaLocalizacao;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        Linking.openURL(url);
    };

    const handleCallPatient = (paciente) => {
        if (!paciente.telefone) {
            Alert.alert("Sem Telefone", "Este paciente não possui telefone cadastrado.");
            return;
        }

        const phoneNumber = paciente.telefone.replace(/\D/g, "");
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const getQuedasHoje = () => {
        const hoje = new Date().toDateString();
        return pacientes.reduce((sum, p) => {
            if (!p.ultimaQueda) return sum;
            const quedaDate = new Date(p.ultimaQueda.timestamp).toDateString();
            return quedaDate === hoje ? sum + 1 : sum;
        }, 0);
    };

    const getQuedasSemana = () => {
        const agora = new Date();
        const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
        return pacientes.reduce((sum, p) => {
            if (!p.ultimaQueda) return sum;
            const quedaDate = new Date(p.ultimaQueda.timestamp);
            return agora - quedaDate <= seteDiasMs ? sum + 1 : sum;
        }, 0);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando pacientes...</Text>
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
            {/* Cabeçalho */}
            <View style={styles.header}>
                <Text style={styles.title}>👨‍⚕️ Painel do Cuidador</Text>
                <Text style={styles.subtitle}>Olá, {userData?.nome || "Cuidador"}!</Text>
                <Text style={styles.description}>
                    {pacientes.length === 0
                        ? "Nenhum paciente vinculado ainda."
                        : `Você está monitorando ${pacientes.length} paciente(s).`}
                </Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Sair 🚪</Text>
                </TouchableOpacity>
            </View>

            {/* Resumo Geral */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Resumo Geral</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{pacientes.length}</Text>
                        <Text style={styles.summaryLabel}>Pacientes</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>
                            {pacientes.filter((p) => p.localizacaoHabilitada).length}
                        </Text>
                        <Text style={styles.summaryLabel}>Com Localização</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{getQuedasHoje()}</Text>
                        <Text style={styles.summaryLabel}>Quedas Hoje</Text>
                    </View>
                </View>
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.summaryCardWide]}>
                        <Text style={styles.summaryValue}>{getQuedasSemana()}</Text>
                        <Text style={styles.summaryLabel}>Quedas nos Últimos 7 Dias</Text>
                    </View>
                </View>
            </View>

            {/* Lista de Pacientes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Meus Pacientes</Text>
                {pacientes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>👤</Text>
                        <Text style={styles.emptyText}>
                            Você ainda não tem pacientes vinculados.
                        </Text>
                        <Text style={styles.emptyHint}>
                            Pacientes podem adicionar você manualmente na aba "Contatos", ou vocês podem compartilhar o mesmo dispositivo ESP32.
                        </Text>
                    </View>
                ) : (
                    pacientes.map((paciente) => (
                        <View key={paciente.uid} style={styles.patientCard}>
                            {/* Cabeçalho do Paciente */}
                            <View style={styles.patientHeader}>
                                <View style={styles.patientInfo}>
                                    <Text style={styles.patientName}>{paciente.nome}</Text>
                                    <Text style={styles.patientEmail}>{paciente.email}</Text>
                                    {paciente.telefone && (
                                        <Text style={styles.patientPhone}>📞 {paciente.telefone}</Text>
                                    )}
                                </View>
                                {paciente.localizacaoHabilitada ? (
                                    <View style={styles.locationBadge}>
                                        <Text style={styles.locationBadgeText}>📍 Ativa</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.locationBadge, styles.locationBadgeOff]}>
                                        <Text style={styles.locationBadgeTextOff}>📍 Off</Text>
                                    </View>
                                )}
                            </View>

                            {/* Badges de Tipo de Vínculo */}
                            <View style={styles.vinculoBadgesContainer}>
                                {paciente.vinculoDireto && (
                                    <View style={styles.vinculoBadge}>
                                        <Text style={styles.vinculoBadgeText}>👤 Vínculo Direto</Text>
                                    </View>
                                )}
                                
                                {paciente.vinculoDispositivo && paciente.dispositivoComum && (
                                    <View style={[styles.vinculoBadge, styles.vinculoBadgeDispositivo]}>
                                        <Text style={styles.vinculoBadgeText}>
                                            📱 ESP32: {paciente.dispositivoComum.deviceId}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Informações de Saúde */}
                            <View style={styles.healthInfo}>
                                <Text style={styles.healthTitle}>📋 Status de Saúde</Text>
                                {/* Última Queda */}
                                {paciente.ultimaQueda ? (
                                    <View style={styles.fallInfoBox}>
                                        <View style={styles.fallInfoRow}>
                                            <Text style={styles.fallInfoLabel}>Última queda:</Text>
                                            <Text style={styles.fallInfoValue}>
                                                {formatDataCompleta(paciente.ultimaQueda.timestamp)} às{" "}
                                                {formatHoraCurta(paciente.ultimaQueda.timestamp)}
                                            </Text>
                                        </View>
                                        <View style={styles.fallInfoRow}>
                                            <Text style={styles.fallInfoLabel}>Intensidade:</Text>
                                            <Text style={styles.fallInfoValue}>
                                                {classifyFallEmoji(paciente.ultimaQueda.fallLevel)}
                                            </Text>
                                        </View>
                                        {paciente.ultimaQueda.accMag && (
                                            <View style={styles.fallInfoRow}>
                                                <Text style={styles.fallInfoLabel}>Magnitude:</Text>
                                                <Text style={styles.fallInfoValue}>
                                                    {paciente.ultimaQueda.accMag.toFixed(2)}g
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.noFallText}>✅ Nenhuma queda registrada</Text>
                                )}
                            </View>

                            {/* Dispositivos */}
                            {paciente.dispositivos && paciente.dispositivos.length > 0 && (
                                <View style={styles.deviceInfo}>
                                    <Text style={styles.deviceTitle}>⌚ Dispositivos Vinculados</Text>
                                    {paciente.dispositivos.map((dev) => (
                                        <View key={dev.id} style={styles.deviceItem}>
                                            <Text style={styles.deviceText}>
                                                • {dev.nome || dev.deviceId}
                                            </Text>
                                            {dev.bateria && (
                                                <Text style={styles.deviceBattery}>🔋 {dev.bateria}%</Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Localização */}
                            {paciente.ultimaLocalizacao && (
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationTitle}>📍 Última Localização</Text>
                                    <Text style={styles.locationCoords}>
                                        Lat: {paciente.ultimaLocalizacao.latitude.toFixed(6)},
                                        Long: {paciente.ultimaLocalizacao.longitude.toFixed(6)}
                                    </Text>
                                    {paciente.ultimaLocalizacao.timestamp && (
                                        <Text style={styles.locationTime}>
                                            Atualizado em: {formatDataCompleta(paciente.ultimaLocalizacao.timestamp)} às{" "}
                                            {formatHoraCurta(paciente.ultimaLocalizacao.timestamp)}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Ações */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        !paciente.localizacaoHabilitada && styles.actionButtonDisabled,
                                    ]}
                                    onPress={() => handleOpenMap(paciente)}
                                    disabled={!paciente.localizacaoHabilitada}
                                >
                                    <Text
                                        style={[
                                            styles.actionButtonText,
                                            !paciente.localizacaoHabilitada && styles.actionButtonTextDisabled,
                                        ]}
                                    >
                                        📍 Ver no Mapa
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionButtonSecondary]}
                                    onPress={() => handleCallPatient(paciente)}
                                >
                                    <Text style={styles.actionButtonText}>📞 Ligar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Dicas para Cuidadores */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Dicas para Cuidadores</Text>
                <View style={styles.tipCard}>
                    <Text style={styles.tipText}>
                        ✓ Mantenha contato regular com seus pacientes
                    </Text>
                    <Text style={styles.tipText}>
                        ✓ Verifique diariamente se há alertas de queda
                    </Text>
                    <Text style={styles.tipText}>
                        ✓ Oriente sobre o uso correto do dispositivo
                    </Text>
                    <Text style={styles.tipText}>
                        ✓ Certifique-se que a localização está ativa
                    </Text>
                    <Text style={styles.tipText}>
                        ✓ Monitore a bateria dos dispositivos
                    </Text>
                    <Text style={styles.tipText}>
                        ✓ Pacientes podem compartilhar o mesmo ESP32 com você
                    </Text>
                </View>
            </View>

            {/* Debug Info */}
            <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>🐛 DEBUG - HomeCuidador</Text>
                <Text style={styles.debugText}>Usuário: {userData?.nome}</Text>
                <Text style={styles.debugText}>Email: {userData?.email}</Text>
                <Text style={styles.debugText}>Pacientes: {pacientes.length}</Text>
                <Text style={styles.debugText}>
                    - Com vínculo direto: {pacientes.filter(p => p.vinculoDireto).length}
                </Text>
                <Text style={styles.debugText}>
                    - Via dispositivo: {pacientes.filter(p => p.vinculoDispositivo).length}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6c757d",
    },
    header: {
        padding: 20,
        backgroundColor: "#007AFF",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: "#fff",
        opacity: 0.9,
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: "#fff",
        opacity: 0.8,
    },
    logoutButton: {
        marginTop: 15,
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#fff",
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    section: {
        backgroundColor: "#fff",
        margin: 10,
        padding: 15,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#333",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: "center",
        borderLeftWidth: 4,
        borderLeftColor: "#007AFF",
    },
    summaryCardWide: {
        marginHorizontal: 4,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007AFF",
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    emptyState: {
        padding: 30,
        alignItems: "center",
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 15,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        fontStyle: "italic",
    },
    patientCard: {
        backgroundColor: "#f8f9fa",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: "#28a745",
    },
    patientHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#dee2e6",
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    patientEmail: {
        fontSize: 13,
        color: "#666",
        marginBottom: 4,
    },
    patientPhone: {
        fontSize: 13,
        color: "#007AFF",
    },
    locationBadge: {
        backgroundColor: "#28a745",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    locationBadgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },
    locationBadgeOff: {
        backgroundColor: "#6c757d",
    },
    locationBadgeTextOff: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },
    vinculoBadgesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    vinculoBadge: {
        backgroundColor: "#3b82f6",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    vinculoBadgeDispositivo: {
        backgroundColor: "#10b981",
    },
    vinculoBadgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },
    healthInfo: {
        marginBottom: 15,
    },
    healthTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#495057",
        marginBottom: 10,
    },
    fallInfoBox: {
        backgroundColor: "#fff3cd",
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#ffc107",
    },
    fallInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    fallInfoLabel: {
        fontSize: 13,
        color: "#856404",
        fontWeight: "500",
    },
    fallInfoValue: {
        fontSize: 13,
        color: "#856404",
        fontWeight: "600",
    },
    noFallText: {
        fontSize: 14,
        color: "#28a745",
        fontWeight: "500",
        fontStyle: "italic",
        padding: 10,
        backgroundColor: "#d4edda",
        borderRadius: 8,
    },
    deviceInfo: {
        marginBottom: 15,
        padding: 12,
        backgroundColor: "#e7f3ff",
        borderRadius: 8,
    },
    deviceTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#495057",
        marginBottom: 8,
    },
    deviceItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    deviceText: {
        fontSize: 13,
        color: "#333",
    },
    deviceBattery: {
        fontSize: 12,
        color: "#28a745",
        fontWeight: "500",
    },
    locationInfo: {
        marginBottom: 15,
        padding: 12,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#007AFF",
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#495057",
        marginBottom: 6,
    },
    locationCoords: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    locationTime: {
        fontSize: 11,
        color: "#999",
        fontStyle: "italic",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    actionButton: {
        flex: 1,
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: "center",
    },
    actionButtonSecondary: {
        backgroundColor: "#28a745",
    },
    actionButtonDisabled: {
        backgroundColor: "#dee2e6",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    actionButtonTextDisabled: {
        color: "#6c757d",
    },
    tipCard: {
        backgroundColor: "#e7f3ff",
        padding: 15,
        borderRadius: 10,
    },
    tipText: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
        lineHeight: 20,
    },
    debugInfo: {
        margin: 10,
        padding: 15,
        backgroundColor: "#fff3cd",
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#ffc107",
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#856404",
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: "#856404",
        marginBottom: 4,
    },
});