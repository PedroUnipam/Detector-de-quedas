// services/firestoreDeviceVinculos.js

import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * Busca todos os pacientes que compartilham dispositivos ESP32 com o cuidador
 * @param {string} cuidadorUid - UID do cuidador
 * @returns {Object} - { success: boolean, pacientes: Array, error?: string }
 */
export async function getPacientesCompartilhadosPorDispositivo(cuidadorUid) {
  try {
    console.log('🔍 Buscando pacientes compartilhados via ESP32...');
    console.log('👨‍⚕️ UID do cuidador:', cuidadorUid);

    // 1. Buscar todos os dispositivos do cuidador
    const cuidadorDispositivosRef = collection(db, 'usuarios', cuidadorUid, 'dispositivos');
    const cuidadorDispositivosSnap = await getDocs(cuidadorDispositivosRef);

    if (cuidadorDispositivosSnap.empty) {
      console.log('⚠️ Cuidador não tem dispositivos cadastrados');
      return { success: true, pacientes: [] };
    }

    // Extrair os deviceIds dos dispositivos do cuidador
    const deviceIdsSet = new Set();
    cuidadorDispositivosSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.deviceId) {
        deviceIdsSet.add(data.deviceId.trim());
      }
    });

    const deviceIds = Array.from(deviceIdsSet);
    console.log(`📱 Cuidador tem ${deviceIds.length} dispositivo(s):`, deviceIds);

    if (deviceIds.length === 0) {
      console.log('⚠️ Nenhum deviceId encontrado');
      return { success: true, pacientes: [] };
    }

    // 2. Buscar todos os usuários do tipo "usuario" (pacientes)
    const usuariosRef = collection(db, 'usuarios');
    const usuariosQuery = query(usuariosRef, where('tipoPessoa', '==', 'usuario'));
    const usuariosSnap = await getDocs(usuariosQuery);

    console.log(`👥 Total de pacientes no sistema: ${usuariosSnap.size}`);

    const pacientesCompartilhados = [];

    // 3. Para cada paciente, verificar se tem algum dispositivo em comum
    for (const usuarioDoc of usuariosSnap.docs) {
      const usuarioData = usuarioDoc.data();
      const pacienteUid = usuarioDoc.id;

      // Pular se for o próprio cuidador
      if (pacienteUid === cuidadorUid) {
        continue;
      }

      console.log(`  🔍 Verificando paciente: ${usuarioData.nome} (${pacienteUid})`);

      // Buscar dispositivos deste paciente
      const pacienteDispositivosRef = collection(db, 'usuarios', pacienteUid, 'dispositivos');
      const pacienteDispositivosSnap = await getDocs(pacienteDispositivosRef);

      // Verificar se há dispositivos em comum
      let dispositivoComum = null;
      
      for (const dispDoc of pacienteDispositivosSnap.docs) {
        const dispData = dispDoc.data();
        if (dispData.deviceId && deviceIds.includes(dispData.deviceId.trim())) {
          dispositivoComum = {
            id: dispDoc.id,
            deviceId: dispData.deviceId,
            nome: dispData.nome,
          };
          console.log(`    ✅ Dispositivo em comum encontrado: ${dispData.deviceId}`);
          break;
        }
      }

      // Se há dispositivo em comum, adicionar paciente à lista
      if (dispositivoComum) {
        // Buscar última localização
        const ultimaLocalizacao = usuarioData.ultimaLocalizacao || null;

        // Buscar quedas do paciente
        const quedasRef = collection(db, 'quedas');
        const quedasQuery = query(quedasRef, where('userId', '==', pacienteUid));
        const quedasSnap = await getDocs(quedasQuery);

        const quedas = [];
        quedasSnap.docs.forEach(quedaDoc => {
          const quedaData = quedaDoc.data();
          quedas.push({
            id: quedaDoc.id,
            ...quedaData,
            date: new Date(quedaData.timestamp),
          });
        });

        // Ordenar quedas por data
        quedas.sort((a, b) => b.date - a.date);

        const ultimaQueda = quedas[0] || null;

        // Contar quedas de hoje
        const hoje = new Date().toDateString();
        const quedasHoje = quedas.filter(
          q => q.date.toDateString() === hoje
        ).length;

        // Buscar todos os dispositivos do paciente
        const dispositivos = [];
        pacienteDispositivosSnap.docs.forEach(dispDoc => {
          const dispData = dispDoc.data();
          dispositivos.push({
            id: dispDoc.id,
            deviceId: dispData.deviceId,
            nome: dispData.nome,
            wifiSsid: dispData.wifiSsid,
          });
        });

        pacientesCompartilhados.push({
          uid: pacienteUid,
          docId: pacienteUid,
          nome: usuarioData.nome || 'Sem nome',
          email: usuarioData.email || '',
          telefone: usuarioData.telefone || '',
          cpf: usuarioData.cpf || '',
          dataNascimento: usuarioData.dataNascimento || '',
          foto_perfil: usuarioData.foto_perfil || null,
          localizacaoHabilitada: usuarioData.localizacaoHabilitada ?? true,
          ultimaLocalizacao,
          dispositivos,
          dispositivoComum, // Dispositivo que conecta cuidador e paciente
          ultimaQueda,
          totalQuedas: quedas.length,
          quedasHoje,
          vinculoTipo: 'dispositivo', // Identificar que é vínculo por dispositivo
        });

        console.log(`    ✅ Paciente adicionado à lista`);
      } else {
        console.log(`    ⏭️ Nenhum dispositivo em comum`);
      }
    }

    console.log(`✅ Total de pacientes compartilhados: ${pacientesCompartilhados.length}`);

    return {
      success: true,
      pacientes: pacientesCompartilhados,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar pacientes compartilhados:', error);
    return {
      success: false,
      pacientes: [],
      error: error.message,
    };
  }
}

/**
 * Busca TODOS os pacientes vinculados ao cuidador:
 * - Por vínculo direto (cuidadores_vinculados)
 * - Por dispositivo compartilhado (ESP32)
 * 
 * @param {string} cuidadorUid - UID do cuidador
 * @returns {Object} - { success: boolean, pacientes: Array, error?: string }
 */
export async function getTodosPacientesVinculados(cuidadorUid) {
  try {
    console.log('🔍 Buscando TODOS os pacientes vinculados ao cuidador...');
    console.log('👨‍⚕️ UID do cuidador:', cuidadorUid);

    // Importar função de vínculos diretos
    const { getPacientesVinculados } = await import('./firestoreVinculos');

    // 1. Buscar pacientes com vínculo direto
    const resultadoVinculoDireto = await getPacientesVinculados(cuidadorUid);
    const pacientesVinculoDireto = resultadoVinculoDireto.success 
      ? resultadoVinculoDireto.pacientes 
      : [];

    console.log(`📋 Pacientes com vínculo direto: ${pacientesVinculoDireto.length}`);

    // 2. Buscar pacientes por dispositivo compartilhado
    const resultadoDispositivo = await getPacientesCompartilhadosPorDispositivo(cuidadorUid);
    const pacientesDispositivo = resultadoDispositivo.success 
      ? resultadoDispositivo.pacientes 
      : [];

    console.log(`📱 Pacientes por dispositivo: ${pacientesDispositivo.length}`);

    // 3. Mesclar as duas listas, evitando duplicatas
    const pacientesMap = new Map();

    // Adicionar pacientes com vínculo direto
    pacientesVinculoDireto.forEach(paciente => {
      pacientesMap.set(paciente.uid, {
        ...paciente,
        vinculoDireto: true,
        vinculoDispositivo: false,
      });
    });

    // Adicionar/mesclar pacientes por dispositivo
    pacientesDispositivo.forEach(paciente => {
      if (pacientesMap.has(paciente.uid)) {
        // Paciente já existe, apenas marcar que também tem vínculo por dispositivo
        const existente = pacientesMap.get(paciente.uid);
        pacientesMap.set(paciente.uid, {
          ...existente,
          vinculoDispositivo: true,
          dispositivoComum: paciente.dispositivoComum,
        });
      } else {
        // Paciente novo, adicionar
        pacientesMap.set(paciente.uid, {
          ...paciente,
          vinculoDireto: false,
          vinculoDispositivo: true,
        });
      }
    });

    const todosPacientes = Array.from(pacientesMap.values());

    console.log(`✅ Total geral de pacientes: ${todosPacientes.length}`);
    console.log(`   - Com vínculo direto: ${todosPacientes.filter(p => p.vinculoDireto).length}`);
    console.log(`   - Com vínculo por dispositivo: ${todosPacientes.filter(p => p.vinculoDispositivo).length}`);
    console.log(`   - Com ambos os vínculos: ${todosPacientes.filter(p => p.vinculoDireto && p.vinculoDispositivo).length}`);

    return {
      success: true,
      pacientes: todosPacientes,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar todos os pacientes:', error);
    return {
      success: false,
      pacientes: [],
      error: error.message,
    };
  }
}