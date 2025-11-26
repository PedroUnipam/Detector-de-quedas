// app/(tabs)/_layout.js

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const [isCuidador, setIsCuidador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (!user) {
        console.log('⚠️ Nenhum usuário autenticado');
        setLoading(false);
        setVerificado(true);
        return;
      }

      // Só verifica se ainda não foi verificado
      if (!verificado) {
        await verificarTipoUsuario(user);
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [verificado]);

  const verificarTipoUsuario = async (user) => {
    try {
      console.log('='.repeat(50));
      console.log('🔍 VERIFICANDO TIPO DE USUÁRIO PARA TABS');
      console.log('='.repeat(50));
      console.log('👤 UID:', user.uid);

      // Buscar documento do usuário
      const userRef = doc(db, 'usuarios', user.uid);
      const usuarioSnap = await getDoc(userRef);

      if (!usuarioSnap.exists()) {
        console.log('❌ Documento do usuário não encontrado');
        setLoading(false);
        setVerificado(true);
        return;
      }

      const usuarioData = usuarioSnap.data();
      console.log('📋 Dados do usuário:', JSON.stringify({
        nome: usuarioData.nome,
        email: usuarioData.email,
        tipoPessoa: usuarioData.tipoPessoa
      }, null, 2));
      
      // MÉTODO 1: Verificar pelo campo tipoPessoa
      const ehCuidadorPorTipo = usuarioData.tipoPessoa === 'cuidador';
      console.log('📌 Campo tipoPessoa:', usuarioData.tipoPessoa);
      console.log('📌 Tipo do campo:', typeof usuarioData.tipoPessoa);
      console.log(`📊 É cuidador por tipoPessoa? ${ehCuidadorPorTipo ? 'SIM ✅' : 'NÃO ❌'}`);
      
      // MÉTODO 2: Verificar na coleção cuidadores (backup)
      console.log('\n🔍 Verificando na coleção cuidadores...');
      const cuidadoresRef = collection(db, 'cuidadores');
      const cuidadorQuery = query(cuidadoresRef, where('uid', '==', user.uid));
      const cuidadorSnap = await getDocs(cuidadorQuery);
      const ehCuidadorPorColecao = !cuidadorSnap.empty;
      console.log(`📊 Documentos encontrados na coleção: ${cuidadorSnap.size}`);
      console.log(`📊 É cuidador por coleção? ${ehCuidadorPorColecao ? 'SIM ✅' : 'NÃO ❌'}`);

      const ehCuidador = ehCuidadorPorTipo || ehCuidadorPorColecao;

      console.log('\n' + '='.repeat(50));
      console.log(`🎯 DECISÃO FINAL: ${ehCuidador ? 'É CUIDADOR ✅' : 'É PACIENTE ❌'}`);
      console.log(`🎯 Estado isCuidador será: ${ehCuidador}`);
      console.log('='.repeat(50));
      
      setIsCuidador(ehCuidador);
      setLoading(false);
      setVerificado(true);
    } catch (error) {
      console.error('❌ Erro ao verificar tipo de usuário:', error);
      setLoading(false);
      setVerificado(true);
    }
  };

  if (loading || !verificado) {
    console.log('⏳ Tabs Layout: Carregando tipo de usuário...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  console.log('🎨 Renderizando Tabs Layout...');
  console.log(`📊 Estado atual isCuidador: ${isCuidador}`);
  console.log(`📊 Aba Contatos será ${!isCuidador ? 'EXIBIDA ✅' : 'OCULTADA ❌'}`);
  console.log(`📊 href da aba Contatos: ${isCuidador ? 'null (OCULTA)' : '/contacts (VISÍVEL)'}`);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Início - Visível para TODOS */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* Contatos - APENAS para PACIENTES */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contatos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          // DESABILITA a aba se for cuidador
          href: isCuidador ? null : '/contacts',
        }}
      />
      
      {/* Dispositivo - Visível para TODOS */}
      <Tabs.Screen
        name="device"
        options={{
          title: 'Dispositivo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="watch" size={size} color={color} />
          ),
        }}
      />
      
      {/* Histórico - Visível para TODOS */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      
      {/* Ajustes - Visível para TODOS */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}