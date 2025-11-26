// services/authController.js

import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  doc,
  setDoc,
} from 'firebase/firestore';

export async function registerUser({
  nome,
  cpf,
  telefone,
  email,
  senha,
  tipoPessoa,
  dataNascimento,
  tipoCuidadorDescricao,
}) {
  try {
    console.log("📝 Iniciando registro de usuário...");
    console.log("📋 Dados recebidos:", {
      nome,
      email,
      tipoPessoa,
      tipoCuidadorDescricao
    });

    if (!email || !senha) throw new Error('E-mail e senha são obrigatórios.');
    if (!nome) throw new Error('Nome é obrigatório.');

    // ============================================================
    // 1) Cria usuário no Firebase Auth
    // ============================================================
    console.log("🔐 Criando usuário no Firebase Auth...");
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const { user } = cred;
    const uid = user.uid;
    console.log("✅ Usuário criado no Auth com UID:", uid);

    // Atualiza displayName
    try {
      await updateProfile(user, { displayName: nome });
      console.log("✅ DisplayName atualizado");
    } catch (e) {
      console.warn('⚠ Não foi possível atualizar displayName:', e);
    }

    // ============================================================
    // 2) Cria documento na coleção "usuarios" usando UID como ID
    // ============================================================
    console.log("📄 Criando documento em usuarios (ID = UID)...");
   
    const usuarioData = {
      usuarioID: uid,
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone?.trim() || '',
      cpf: cpf?.trim() || '',
      tipoPessoa: tipoPessoa || 'usuario', // IMPORTANTE: Este campo define se é cuidador
      dataNascimento: dataNascimento || null,
      createdAt: new Date().toISOString(),
      localizacaoHabilitada: true,
      ultimaLocalizacao: null,
      foto_perfil: null,
    };

    console.log("💾 Salvando usuário com tipoPessoa:", usuarioData.tipoPessoa);
   
    await setDoc(doc(db, "usuarios", uid), usuarioData);
    console.log("✅ Documento criado em usuarios com sucesso!");
    console.log("✅ UID:", uid);
    console.log("✅ tipoPessoa salvo:", usuarioData.tipoPessoa);

    // ============================================================
    // 3) Se for cuidador, criar registros adicionais
    // ============================================================
    if (tipoPessoa === 'cuidador') {
      console.log("👨‍⚕️ Processando cadastro de CUIDADOR...");
     
      if (!tipoCuidadorDescricao?.trim()) {
        console.warn("⚠️ Tipo de cuidador não informado");
      }

      // 3.1) Criar documento em "tiposCuidador"
      console.log("📝 Criando tipo de cuidador...");
      const tipoCuidadorRef = await addDoc(collection(db, 'tiposCuidador'), {
        descricao: tipoCuidadorDescricao?.trim() || 'Cuidador',
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Tipo de cuidador criado com ID:", tipoCuidadorRef.id);

      // 3.2) Criar documento em "cuidadores" - ESSENCIAL PARA A VERIFICAÇÃO
      console.log("📝 Criando registro na coleção cuidadores...");
      const cuidadorData = {
        uid: uid, // IMPORTANTE: Este campo é usado na busca
        pessoaId: uid,
        tipoCuidadorId: tipoCuidadorRef.id,
        tipoCuidadorDescricao: tipoCuidadorDescricao?.trim() || 'Cuidador',
        nome: nome.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString(),
      };
     
      const cuidadorDocRef = await addDoc(collection(db, 'cuidadores'), cuidadorData);
      console.log("✅ Cuidador criado na coleção com ID:", cuidadorDocRef.id);
      console.log("✅ Dados do cuidador:", cuidadorData);
    } else {
      console.log("👤 Usuário cadastrado como PACIENTE/USUÁRIO");
    }

    // ============================================================
    // Final
    // ============================================================
    console.log("🎉 Cadastro completo realizado com sucesso!");
    console.log("📊 Resumo:");
    console.log("  - UID:", uid);
    console.log("  - Nome:", nome);
    console.log("  - Email:", email);
    console.log("  - Tipo:", tipoPessoa);
    console.log("  - É cuidador?", tipoPessoa === 'cuidador' ? "SIM ✅" : "NÃO ❌");

    return { uid };

  } catch (error) {
    console.error("❌ Erro no registerUser:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está cadastrado.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    }
    throw error;
  }
}