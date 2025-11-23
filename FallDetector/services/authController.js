// services/authController.js
// Versão para uso direto no app (Firebase puro)
//
// Fornece:
//  - getTiposCuidador()
//  - registerUser(formData)
//
// Usado em: app/(auth)/cadastro.js

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
  getDocs,
} from 'firebase/firestore';

// Carrega lista de tipos de cuidador da coleção "tiposCuidador"
export async function getTiposCuidador() {
  const snap = await getDocs(collection(db, 'tiposCuidador'));
  const tipos = [];
  snap.forEach((d) => {
    const data = d.data() || {};
    tipos.push({
      id_tipocuidador: data.id_tipocuidador ?? d.id,
      descricao: data.descricao || 'Sem descrição',
    });
  });
  return tipos;
}

/**
 * Cadastro completo com Firebase:
 * - Cria usuário no Firebase Auth
 * - Cria documento em "usuarios/{uid}" com dados básicos
 * - Se for cuidador, também salva o tipo de cuidador
 */
export async function registerUser({
  nome,
  cpf,
  telefone,
  email,
  senha,
  tipoPessoa,
  dataNascimento,
  tipoCuidadorId,
}) {
  if (!email || !senha) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  if (!nome) {
    throw new Error('Nome é obrigatório.');
  }

  // 1) Cria usuário no Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  const { user } = cred;
  const uid = user.uid;

  // Atualiza displayName no Auth (opcional)
  try {
    await updateProfile(user, { displayName: nome });
  } catch (e) {
    console.warn('⚠ Não foi possível atualizar displayName no Auth:', e);
  }

  // 2) Cria documento de perfil em "usuarios/{uid}"
  const usuarioDoc = {
    nome: nome.trim(),
    email: email.trim(),
    telefone: telefone?.trim() || '',
    cpf: cpf?.trim() || '',
    tipoPessoa: tipoPessoa || 'paciente',
    dataNascimento: dataNascimento || null,
    tipoCuidadorId: tipoPessoa === 'cuidador' ? tipoCuidadorId || null : null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'usuarios', uid), usuarioDoc);

  // (Opcional) Poderia também adicionar em coleções auxiliares,
  // como "cuidadores" ou "pessoas", se quiser um modelo mais complexo.

  return { uid };
}

