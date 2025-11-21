// src/controllers/authController.js
import { auth, db } from "../../services/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";


// Carrega lista de tipos de cuidador
export async function getTiposCuidador() {
  const snap = await getDocs(collection(db, "tiposCuidador"));
  const arr = [];
  snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
  return arr;
}

/**
 * Cadastro completo:
 * - Firebase Auth
 * - pessoas
 * - usuarios ou cuidadores
 */
export async function registerUser({
  nome,
  cpf,
  telefone,
  email,
  senha,
  tipoPessoa,        // "usuario" ou "cuidador"
  dataNascimento,    // string dd/mm/aaaa
  tipoCuidadorId     // id do documento em tiposCuidador
}) {
  // 1) Criar usuário no Firebase Auth
  const uid = cred.user.uid;

  // cria documento no Firestore
  await setDoc(doc(db, "usuarios", uid), {
    nome,
    email,
    tipo: tipoUsuario, // "usuario" ou "cuidador"
    cpf,
    telefone,
    createdAt: new Date().toISOString(),
    foto_perfil: null,
  });

  // 2) Criar documento em "pessoas"
  const pessoaRef = await addDoc(collection(db, "pessoas"), {
    nome,
    cpf,
    email,
    telefone,
    status_ativo: true,
    data_cadastro: new Date(),
    ultimo_acesso: null,
    uid // opcional: vincular uid da Auth à pessoa
  });

  const pessoaId = pessoaRef.id;

  // 3) Criar registro de usuario ou cuidador
  if (tipoPessoa === "usuario") {
    await addDoc(collection(db, "usuarios"), {
      pessoaId,
      data_nascimento: dataNascimento,
      consentimento_lgpd: true,
      foto_perfil: null,
      uid
    });
  } else if (tipoPessoa === "cuidador") {
    await addDoc(collection(db, "cuidadores"), {
      pessoaId,
      tipoCuidadorId,
      uid
    });
  }

  return { uid, pessoaId };
}
