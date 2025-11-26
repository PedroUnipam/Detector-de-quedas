// services/firestoreVinculos.js

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * Busca dados de uma pessoa pelo uid do usuário
 */
async function getPessoaByUid(uid) {
  try {
    const usuarioRef = doc(db, "usuarios", uid);
    const usuarioSnap = await getDoc(usuarioRef);
    
    if (!usuarioSnap.exists()) return null;
    
    const usuarioData = usuarioSnap.data();
    
    return {
      id: usuarioSnap.id,
      uid: uid,
      nome: usuarioData.nome,
      email: usuarioData.email,
      telefone: usuarioData.telefone,
      tipoPessoa: usuarioData.tipoPessoa,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar pessoa:", error);
    return null;
  }
}

/**
 * Busca cuidador pelo uid
 */
async function getCuidadorByUid(uid) {
  try {
    const cuidadoresRef = collection(db, "cuidadores");
    const q = query(cuidadoresRef, where("uid", "==", uid));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    return snap.docs[0];
  } catch (error) {
    console.error("❌ Erro ao buscar cuidador:", error);
    return null;
  }
}

/**
 * Vincula um cuidador a um usuário (paciente)
 * Cria documento em: usuarios/{pacienteUid}/cuidadores_vinculados/{cuidadorUid}
 */
export async function vincularCuidadorAUsuario(pacienteUid, cuidadorUid) {
  try {
    console.log("🔗 Vinculando cuidador:", { pacienteUid, cuidadorUid });

    // Buscar dados do cuidador
    const cuidadorData = await getPessoaByUid(cuidadorUid);
    if (!cuidadorData) {
      return { success: false, message: "Cuidador não encontrado" };
    }

    // Criar vínculo na subcoleção
    const vinculoRef = doc(
      db,
      "usuarios",
      pacienteUid,
      "cuidadores_vinculados",
      cuidadorUid
    );

    await setDoc(vinculoRef, {
      cuidadorUid,
      cuidadorNome: cuidadorData.nome,
      cuidadorEmail: cuidadorData.email,
      vinculadoEm: new Date().toISOString(),
      ativo: true,
    });

    console.log("✅ Vínculo criado com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao vincular cuidador:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todos os pacientes vinculados a um cuidador
 * Retorna lista com dados dos pacientes
 */
export async function getPacientesVinculados(cuidadorUid) {
  try {
    console.log("🔍 Buscando pacientes vinculados ao cuidador:", cuidadorUid);

    // Buscar todos os documentos da coleção usuarios
    const usuariosRef = collection(db, "usuarios");
    const usuariosSnap = await getDocs(usuariosRef);

    console.log(`📊 Total de usuários no sistema: ${usuariosSnap.size}`);

    const pacientes = [];

    for (const usuarioDoc of usuariosSnap.docs) {
      const usuarioData = usuarioDoc.data();
      
      // Pular se não for usuario (tipo paciente)
      if (usuarioData.tipoPessoa !== "usuario") {
        continue;
      }

      console.log(`  🔍 Verificando paciente: ${usuarioData.nome} (${usuarioDoc.id})`);

      // Verificar se tem vínculo com este cuidador
      const vinculoRef = doc(
        db,
        "usuarios",
        usuarioDoc.id,
        "cuidadores_vinculados",
        cuidadorUid
      );

      try {
        const vinculoSnap = await getDoc(vinculoRef);
        
        if (!vinculoSnap.exists() || !vinculoSnap.data()?.ativo) {
          console.log(`    ⏭️ Não vinculado ou inativo`);
          continue;
        }

        console.log(`    ✅ Paciente vinculado!`);

        // Buscar última localização
        const ultimaLocalizacao = usuarioData.ultimaLocalizacao || null;

        // Buscar quedas do paciente
        const quedasRef = collection(db, "quedas");
        const quedasQuery = query(quedasRef, where("userId", "==", usuarioDoc.id));
        const quedasSnap = await getDocs(quedasQuery);

        const quedas = [];
        quedasSnap.docs.forEach((quedaDoc) => {
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
          (q) => q.date.toDateString() === hoje
        ).length;

        // Buscar dispositivos
        const dispositivosRef = collection(db, "dispositivos");
        const dispositivosSnap = await getDocs(dispositivosRef);
        
        const dispositivos = [];
        dispositivosSnap.docs.forEach((dispDoc) => {
          const dispData = dispDoc.data();
          // Você pode adicionar filtro aqui se tiver campo userId nos dispositivos
          dispositivos.push({
            id: dispDoc.id,
            ...dispData,
          });
        });

        pacientes.push({
          uid: usuarioDoc.id,
          docId: usuarioDoc.id,
          nome: usuarioData.nome || "Sem nome",
          email: usuarioData.email || "",
          telefone: usuarioData.telefone || "",
          cpf: usuarioData.cpf || "",
          dataNascimento: usuarioData.dataNascimento || "",
          foto_perfil: usuarioData.foto_perfil || null,
          localizacaoHabilitada: usuarioData.localizacaoHabilitada ?? true,
          ultimaLocalizacao,
          dispositivos,
          ultimaQueda,
          totalQuedas: quedas.length,
          quedasHoje,
        });

      } catch (vinculoError) {
        console.error(`    ❌ Erro ao verificar vínculo:`, vinculoError);
        continue;
      }
    }

    console.log(`✅ Total de pacientes vinculados encontrados: ${pacientes.length}`);

    return { success: true, pacientes };
  } catch (error) {
    console.error("❌ Erro ao buscar pacientes vinculados:", error);
    return { success: false, pacientes: [], error: error.message };
  }
}

/**
 * Atualiza a última localização do usuário no documento usuarios
 */
export async function atualizarLocalizacao(usuarioUid, localizacao) {
  try {
    const usuarioRef = doc(db, "usuarios", usuarioUid);
    
    await updateDoc(usuarioRef, {
      ultimaLocalizacao: {
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao atualizar localização:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Habilita/desabilita compartilhamento de localização
 */
export async function toggleLocalizacao(usuarioUid, habilitada) {
  try {
    const usuarioRef = doc(db, "usuarios", usuarioUid);
    
    await updateDoc(usuarioRef, {
      localizacaoHabilitada: habilitada,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao atualizar preferência de localização:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se um email corresponde a um cuidador e retorna o UID
 */
export async function getCuidadorByEmail(email) {
  try {
    // Buscar na coleção usuarios
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", email));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return { success: false, message: "Email não encontrado" };
    }

    const usuarioDoc = snap.docs[0];
    const usuarioData = usuarioDoc.data();

    // Verificar se tem cuidador correspondente
    const cuidadoresRef = collection(db, "cuidadores");
    const cuidadorQuery = query(cuidadoresRef, where("uid", "==", usuarioDoc.id));
    const cuidadorSnap = await getDocs(cuidadorQuery);

    if (cuidadorSnap.empty) {
      return { success: false, message: "Este email não pertence a um cuidador" };
    }

    return {
      success: true,
      cuidador: {
        uid: usuarioDoc.id,
        nome: usuarioData.nome,
        email: usuarioData.email,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao buscar cuidador por email:", error);
    return { success: false, error: error.message };
  }
}