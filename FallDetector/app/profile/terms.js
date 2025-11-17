import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TermsOfUseScreen() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState(false);

  useEffect(() => {
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

  const styles = getStyles(nightMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Termos de Uso</Text>
        <Text style={styles.subtitle}>Fall Detector - Versão 1.0.0</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 1. ACEITAÇÃO DOS TERMOS</Text>
          <Text style={styles.paragraph}>
            Ao utilizar o aplicativo Fall Detector ("Aplicativo"), você concorda com estes Termos de Uso. 
            Se você não concordar com algum termo aqui estabelecido, não utilize o Aplicativo.
          </Text>
          <Text style={styles.paragraph}>
            Estes termos podem ser atualizados periodicamente. O uso continuado do Aplicativo após 
            alterações constitui aceitação dos novos termos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 2. DESCRIÇÃO DO SERVIÇO</Text>
          <Text style={styles.paragraph}>
            O Fall Detector é um sistema de monitoramento de quedas que:
          </Text>
          <Text style={styles.bulletPoint}>• Se conecta a dispositivos detectores de quedas via Bluetooth ou Wi-Fi</Text>
          <Text style={styles.bulletPoint}>• Envia notificações instantâneas ao paciente e cuidadores cadastrados quando uma queda é detectada</Text>
          <Text style={styles.bulletPoint}>• Permite visualizar a localização do dispositivo, mediante autorização prévia do usuário</Text>
          <Text style={styles.bulletPoint}>• Armazena histórico de eventos e estatísticas de uso</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 3. LIMITAÇÕES E ISENÇÕES DE RESPONSABILIDADE</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1. DISPOSITIVO MÉDICO:</Text> O Fall Detector NÃO é um dispositivo médico certificado 
            e não substitui cuidados médicos profissionais, equipamentos médicos homologados ou supervisão humana.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2. PRECISÃO:</Text> Embora nos esforcemos para fornecer detecção precisa, o sistema 
            pode apresentar falsos positivos (alertas sem queda real) ou falsos negativos (não detectar quedas reais).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3. CONECTIVIDADE:</Text> O funcionamento depende de conexão estável à internet, 
            bateria carregada e funcionamento adequado do dispositivo. Não garantimos disponibilidade ininterrupta.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.4. EMERGÊNCIAS:</Text> Em caso de emergência médica, SEMPRE acione serviços de 
            emergência (SAMU 192, Bombeiros 193) imediatamente. Não dependa exclusivamente do Aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 4. RESPONSABILIDADES DO USUÁRIO</Text>
          <Text style={styles.paragraph}>
            Ao utilizar o Aplicativo, você concorda em:
          </Text>
          <Text style={styles.bulletPoint}>• Fornecer informações verdadeiras e atualizadas</Text>
          <Text style={styles.bulletPoint}>• Manter seus dados de acesso seguros e confidenciais</Text>
          <Text style={styles.bulletPoint}>• Utilizar o dispositivo conforme as instruções fornecidas</Text>
          <Text style={styles.bulletPoint}>• Manter o dispositivo carregado e em bom estado de funcionamento</Text>
          <Text style={styles.bulletPoint}>• Testar regularmente o sistema para garantir seu funcionamento</Text>
          <Text style={styles.bulletPoint}>• Notificar imediatamente sobre qualquer falha ou comportamento anormal</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 5. COLETA E USO DE DADOS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1. DADOS COLETADOS:</Text> Coletamos informações pessoais (nome, CPF, e-mail, 
            telefone), dados de saúde (histórico de quedas), dados de localização (quando autorizado) e dados técnicos 
            (conectividade, bateria, logs de sistema).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2. FINALIDADE:</Text> Os dados são utilizados exclusivamente para:
          </Text>
          <Text style={styles.bulletPoint}>• Funcionamento do sistema de detecção e notificação</Text>
          <Text style={styles.bulletPoint}>• Comunicação com usuários e cuidadores em casos de emergência</Text>
          <Text style={styles.bulletPoint}>• Melhoria dos serviços e algoritmos de detecção</Text>
          <Text style={styles.bulletPoint}>• Cumprimento de obrigações legais</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3. LOCALIZAÇÃO:</Text> A funcionalidade de rastreamento de localização é OPCIONAL 
            e requer autorização explícita. Você pode desativar a qualquer momento nas configurações do dispositivo.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.4. COMPARTILHAMENTO:</Text> Seus dados são compartilhados apenas com os cuidadores 
            que você cadastrar no sistema. Não vendemos ou compartilhamos dados com terceiros para fins publicitários.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.5. LGPD:</Text> Respeitamos a Lei Geral de Proteção de Dados (Lei 13.709/2018). 
            Você tem direito a acessar, corrigir, excluir e portar seus dados a qualquer momento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 6. SEGURANÇA E PRIVACIDADE</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de segurança para proteger seus dados, incluindo criptografia, 
            autenticação e controles de acesso. No entanto, nenhum sistema é 100% seguro.
          </Text>
          <Text style={styles.paragraph}>
            Você é responsável por manter a confidencialidade de suas credenciais de acesso.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 7. CUIDADORES E COMPARTILHAMENTO</Text>
          <Text style={styles.paragraph}>
            Ao adicionar cuidadores ao sistema, você autoriza o compartilhamento de:
          </Text>
          <Text style={styles.bulletPoint}>• Alertas de quedas em tempo real</Text>
          <Text style={styles.bulletPoint}>• Histórico de eventos</Text>
          <Text style={styles.bulletPoint}>• Localização do dispositivo (se autorizado)</Text>
          <Text style={styles.bulletPoint}>• Status de conectividade e bateria</Text>
          <Text style={styles.paragraph}>
            Você pode remover cuidadores a qualquer momento através do aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 8. PAGAMENTO E CANCELAMENTO</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.1. GRATUIDADE:</Text> Atualmente, o aplicativo é oferecido gratuitamente. 
            Reservamo-nos o direito de implementar cobranças no futuro, com aviso prévio de 30 dias.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.2. CANCELAMENTO:</Text> Você pode cancelar sua conta a qualquer momento 
            através das configurações do aplicativo. A exclusão é irreversível.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ 9. LIMITAÇÃO DE RESPONSABILIDADE</Text>
          <Text style={styles.paragraph}>
            EM NENHUMA HIPÓTESE A FALL DETECTOR OU SEUS DESENVOLVEDORES SERÃO RESPONSÁVEIS POR:
          </Text>
          <Text style={styles.bulletPoint}>• Danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou 
          impossibilidade de uso do aplicativo</Text>
          <Text style={styles.bulletPoint}>• Lesões, quedas não detectadas ou falhas na notificação</Text>
          <Text style={styles.bulletPoint}>• Perda ou dano de dados</Text>
          <Text style={styles.bulletPoint}>• Problemas relacionados à conectividade, bateria ou hardware</Text>
          <Text style={styles.bulletPoint}>• Ações ou omissões de terceiros (incluindo cuidadores)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 10. REQUISITOS TÉCNICOS</Text>
          <Text style={styles.paragraph}>
            Para utilizar o aplicativo, você precisa:
          </Text>
          <Text style={styles.bulletPoint}>• Smartphone com iOS 13+ ou Android 8.0+</Text>
          <Text style={styles.bulletPoint}>• Conexão estável à internet (Wi-Fi ou dados móveis)</Text>
          <Text style={styles.bulletPoint}>• Bluetooth ativado (para conexão com dispositivos)</Text>
          <Text style={styles.bulletPoint}>• Permissões de notificação habilitadas</Text>
          <Text style={styles.bulletPoint}>• Permissão de localização (opcional, para rastreamento)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 11. ATUALIZAÇÕES E MODIFICAÇÕES</Text>
          <Text style={styles.paragraph}>
            Podemos atualizar o aplicativo para corrigir bugs, melhorar funcionalidades e adicionar novos recursos. 
            Recomendamos manter o aplicativo sempre atualizado para melhor desempenho e segurança.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 12. SUSPENSÃO E ENCERRAMENTO</Text>
          <Text style={styles.paragraph}>
            Reservamo-nos o direito de suspender ou encerrar sua conta se:
          </Text>
          <Text style={styles.bulletPoint}>• Violar estes Termos de Uso</Text>
          <Text style={styles.bulletPoint}>• Fornecer informações falsas</Text>
          <Text style={styles.bulletPoint}>• Usar o serviço de forma fraudulenta ou ilegal</Text>
          <Text style={styles.bulletPoint}>• Comprometer a segurança ou integridade do sistema</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 13. CONTATO E SUPORTE</Text>
          <Text style={styles.paragraph}>
            Para dúvidas, sugestões ou suporte técnico:
          </Text>
          <Text style={styles.bulletPoint}>• E-mail: suporte@falldetector.com</Text>
          <Text style={styles.bulletPoint}>• Telefone: (11) 99999-9999</Text>
          <Text style={styles.bulletPoint}>• Horário: Segunda a Sexta, 8h às 18h</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ 14. LEGISLAÇÃO APLICÁVEL</Text>
          <Text style={styles.paragraph}>
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
            Quaisquer disputas serão resolvidas no foro da comarca de seu domicílio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ 15. CONSENTIMENTO</Text>
          <Text style={styles.paragraph}>
            Ao utilizar o Fall Detector, você declara ter lido, compreendido e concordado com todos os 
            termos aqui estabelecidos.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Última atualização: 16 de novembro de 2025
          </Text>
          <Text style={styles.footerText}>
            Fall Detector © 2025 - Todos os direitos reservados
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (nightMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: nightMode ? '#121212' : '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: nightMode ? '#333' : '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  subtitle: {
    fontSize: 14,
    color: nightMode ? '#aaa' : '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 14,
    color: nightMode ? '#ccc' : '#555',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 14,
    color: nightMode ? '#ccc' : '#555',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  bold: {
    fontWeight: 'bold',
    color: nightMode ? '#fff' : '#333',
  },
  footer: {
    backgroundColor: nightMode ? '#1e1e1e' : '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: nightMode ? '#666' : '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});