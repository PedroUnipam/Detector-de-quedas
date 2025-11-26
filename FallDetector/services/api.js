// services/api.js (Firebase puro)
// Camada de serviços usando apenas Firebase (Auth + Firestore),
// sem qualquer backend próprio (Express / API local).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import {
  signOut,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';

// ==================== HELPERS ====================

async function getCurrentUid() {
  // Tenta pegar do Firebase Auth primeiro
  const user = auth.currentUser;
  if (user?.uid) return user.uid;

  // Fallback para AsyncStorage (caso tenha sido salvo manualmente)
  const storedUid = await AsyncStorage.getItem('uid');
  return storedUid;
}

// ==================== AUTENTICAÇÃO ====================
// No app você já faz login com Firebase direto em app/(auth)/login.js.
// Aqui mantemos apenas o logout para ser usado na Home.

export const authAPI = {
  logout: async () => {
    try {
      // Deslogar do Firebase Auth
      await signOut(auth);
    } catch (e) {
      console.error('❌ Erro ao sair do Firebase:', e);
    }

    try {
      // Limpar dados locais
      await AsyncStorage.multiRemove([
        'userToken',
        'userData',
        'authToken',
        'uid',
        'userEmail',
      ]);
      console.log('👋 Logout realizado (Firebase + AsyncStorage limpados)');
    } catch (error) {
      console.error('❌ Erro ao limpar AsyncStorage no logout:', error);
    }
  },
};

// ==================== USUÁRIO (PERFIL + CUIDADORES) ====================

export const userAPI = {
  // Buscar perfil do usuário logado na coleção "usuarios/{uid}"
  getProfile: async () => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.', user: null };
      }

      const ref = doc(db, 'usuarios', uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // Se não existir, monta um perfil básico a partir do Firebase Auth
        const user = auth.currentUser;
        const basicUser = user
          ? {
            id: uid,
            nome: user.displayName || '',
            email: user.email || '',
            telefone: '',
          }
          : null;

        return {
          success: !!basicUser,
          user: basicUser,
          message: basicUser
            ? 'Perfil básico montado a partir do Firebase Auth.'
            : 'Perfil não encontrado.',
        };
      }

      const data = snap.data() || {};
      const user = {
        id: uid,
        ...data,
      };

      return { success: true, user };
    } catch (error) {
      console.error('❌ Erro em userAPI.getProfile:', error);
      return {
        success: false,
        user: null,
        message: error.message || 'Erro ao carregar perfil.',
      };
    }
  },

  // Atualizar dados de perfil em "usuarios/{uid}"
  updateProfile: async (userData) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const ref = doc(db, 'usuarios', uid);

      // Faz merge dos dados
      await setDoc(ref, userData, { merge: true });

      // Se o e-mail mudou, tentar atualizar também no Firebase Auth
      if (userData.email && auth.currentUser) {
        try {
          if (auth.currentUser.email !== userData.email) {
            await updateEmail(auth.currentUser, userData.email);
          }
        } catch (emailError) {
          console.error('⚠ Erro ao atualizar e-mail no Firebase Auth:', emailError);
        }
      }

      return {
        success: true,
        message: 'Perfil atualizado com sucesso.',
        user: { id: uid, ...userData },
      };
    } catch (error) {
      console.error('❌ Erro em userAPI.updateProfile:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar perfil.',
      };
    }
  },

  // Trocar senha do usuário logado
  changePassword: async (senhaAtual, novaSenha) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      // Reautenticar se senhaAtual foi informada
      if (senhaAtual) {
        const credential = EmailAuthProvider.credential(user.email, senhaAtual);
        await reauthenticateWithCredential(user, credential);
      }

      await updatePassword(user, novaSenha);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro em userAPI.changePassword:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar senha.',
      };
    }
  },

  // "Upload" de foto de perfil
  // Aqui estamos apenas salvando a URI da imagem no Firestore + AsyncStorage.
  // Em produção, o ideal seria usar Firebase Storage.
  uploadPhoto: async (imageUri) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const ref = doc(db, 'usuarios', uid);

      await setDoc(
        ref,
        {
          foto_perfil: imageUri,
        },
        { merge: true }
      );

      // Também guarda localmente
      await AsyncStorage.setItem('profileImage', imageUri);

      // Mantém formato esperado pela tela (response.data.url)
      return {
        success: true,
        data: {
          url: imageUri,
        },
      };
    } catch (error) {
      console.error('❌ Erro em userAPI.uploadPhoto:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar foto.',
      };
    }
  },

  // ==================== CUIDADORES ====================

  // Lista cuidadores na subcoleção "usuarios/{uid}/cuidadores"
  getCuidadores: async () => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const cuidadoresRef = collection(db, 'usuarios', uid, 'cuidadores');
      const snap = await getDocs(cuidadoresRef);

      const cuidadores = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      return { success: true, cuidadores };
    } catch (error) {
      console.error('❌ Erro em userAPI.getCuidadores:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar cuidadores.',
        cuidadores: [],
      };
    }
  },

  // Adiciona um cuidador
  addCuidador: async (cuidadorData) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const cuidadoresRef = collection(db, 'usuarios', uid, 'cuidadores');
      const docRef = await addDoc(cuidadoresRef, {
        ...cuidadorData,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error('❌ Erro em userAPI.addCuidador:', error);
      return {
        success: false,
        message: error.message || 'Erro ao adicionar cuidador.',
      };
    }
  },

  // Lista tipos de cuidador a partir da coleção "tiposCuidador"
  addCuidador: async (cuidadorData) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const cuidadoresRef = collection(db, 'usuarios', uid, 'cuidadores');

      // cuidadorData já vem com 'parentesco' como string livre
      const docRef = await addDoc(cuidadoresRef, {
        nome: cuidadorData.nome,
        telefone: cuidadorData.telefone,
        parentesco: cuidadorData.parentesco, // Texto livre
        email: cuidadorData.email || null,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error('❌ Erro em userAPI.addCuidador:', error);
      return {
        success: false,
        message: error.message || 'Erro ao adicionar cuidador.',
      };
    }
  },

  // Atualiza um cuidador
  updateCuidador: async (cuidadorId, cuidadorData) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const ref = doc(db, 'usuarios', uid, 'cuidadores', cuidadorId);
      await updateDoc(ref, {
        ...cuidadorData,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erro em userAPI.updateCuidador:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar cuidador.',
      };
    }
  }, updateCuidador: async (cuidadorId, cuidadorData) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const ref = doc(db, 'usuarios', uid, 'cuidadores', cuidadorId);

      await updateDoc(ref, {
        nome: cuidadorData.nome,
        telefone: cuidadorData.telefone,
        parentesco: cuidadorData.parentesco, // Texto livre
        email: cuidadorData.email || null,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erro em userAPI.updateCuidador:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar cuidador.',
      };
    }
  },

  // Remove um cuidador
  removeCuidador: async (cuidadorId) => {
    try {
      const uid = await getCurrentUid();
      if (!uid) {
        return { success: false, message: 'Usuário não autenticado.' };
      }

      const ref = doc(db, 'usuarios', uid, 'cuidadores', cuidadorId);
      await deleteDoc(ref);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro em userAPI.removeCuidador:', error);
      return {
        success: false,
        message: error.message || 'Erro ao remover cuidador.',
      };
    }
  },
};

// ==================== UTILITÁRIOS ====================

export const utils = {
  isAuthenticated: async () => {
    try {
      const user = auth.currentUser;
      if (user?.uid) return true;

      const uid = await AsyncStorage.getItem('uid');
      return !!uid;
    } catch {
      return false;
    }
  },

  getUserData: async () => {
    try {
      // Primeiro tenta usar cache local
      const cached = await AsyncStorage.getItem('userData');
      if (cached) {
        return JSON.parse(cached);
      }

      // Se não tem cache, buscar no Firestore
      const profile = await userAPI.getProfile();
      if (profile.success && profile.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(profile.user));
        return profile.user;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro em utils.getUserData:', error);
      return null;
    }
  },

  formatError: (error) => {
    if (!error) return 'Erro desconhecido';

    // Caso ainda exista algum erro vindo de Axios em outro ponto
    if (error.response) {
      return (
        error.response.data?.message ||
        error.response.data?.error ||
        'Erro no servidor'
      );
    }

    if (error.message) return error.message;

    return 'Erro de conexão ou desconhecido.';
  },
};

