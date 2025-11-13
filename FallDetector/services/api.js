// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==================== CONFIGURAÇÃO AUTOMÁTICA DO ENDPOINT ====================
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  // Para dispositivo físico, substitua pelo seu IP local
  return 'http://192.168.0.10:3000/api';
};

const API_URL = getBaseUrl();

// ==================== CONFIGURAÇÃO BASE DO AXIOS ====================
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== INTERCEPTORES ====================
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('Erro ao buscar token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta: ${response.config.url}`, response.status);
    return response;
  },
  async (error) => {
    console.error(`❌ Erro na requisição:`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTENTICAÇÃO ====================
export const authAPI = {
  login: async (email, senha) => {
    try {
      console.log('🔐 Tentando login com:', email);
      
      const response = await api.post('/auth/login', { email, senha });
      
      console.log('📦 Resposta completa do login:', response.data);
      
      // Verificar estrutura da resposta
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao fazer login');
      }
      
      // Salvar token e dados do usuário
      if (response.data.data && response.data.data.token) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        console.log('✅ Token e dados salvos no AsyncStorage');
      }
      
      // Retornar dados do usuário e token
      return response.data.data; // Retorna { token, user: {...} }
      
    } catch (error) {
      console.error('❌ Erro no authAPI.login:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('📝 Registrando usuário:', userData);
      
      const response = await api.post('/auth/register', {
        nome: userData.nome,
        email: userData.email,
        cpf: userData.cpf,
        telefone: userData.telefone,
        senha: userData.senha,
        // Campos opcionais de endereço
        cep: userData.cep,
        logradouro: userData.logradouro,
        numero: userData.numero,
        complemento: userData.complemento,
        bairro: userData.bairro,
        cidade: userData.cidade,
        uf: userData.uf,
      });
      
      console.log('📦 Resposta do registro:', response.data);
      
      // Salvar token automaticamente após registro
      if (response.data.success && response.data.data?.token) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        console.log('✅ Usuário registrado e autenticado');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro no authAPI.register:', error.response?.data || error.message);
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      console.log('✅ Token verificado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      console.log('👋 Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  },
};

// ==================== USUÁRIO ====================
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/user/profile', userData);
    return response.data;
  },

  changePassword: async (senhaAtual, novaSenha) => {
    const response = await api.post('/user/change-password', {
      senhaAtual,
      novaSenha,
    });
    return response.data;
  },

  getCuidadores: async () => {
    const response = await api.get('/user/cuidadores');
    return response.data;
  },

  addCuidador: async (cuidadorData) => {
    const response = await api.post('/user/cuidadores', cuidadorData);
    return response.data;
  },

  removeCuidador: async (cuidadorId) => {
    const response = await api.delete(`/user/cuidadores/${cuidadorId}`);
    return response.data;
  },
};

// ==================== DISPOSITIVOS ====================
export const deviceAPI = {
  getDevices: async () => {
    const response = await api.get('/devices');
    return response.data;
  },

  addDevice: async (deviceData) => {
    const response = await api.post('/devices', deviceData);
    return response.data;
  },

  updateDevice: async (deviceId, deviceData) => {
    const response = await api.put(`/devices/${deviceId}`, deviceData);
    return response.data;
  },

  removeDevice: async (deviceId) => {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  },

  scanDevices: async (tipo) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          dispositivos: [
            { nome: 'Monitor SG-001', tipo: 'wifi', bateria: 88, disponivel: true },
            { nome: 'Guardian-5G', tipo: 'bluetooth', bateria: 95, disponivel: true },
          ],
        });
      }, 1500);
    });
  },
};

// ==================== QUEDAS ====================
export const fallAPI = {
  registerFall: async (fallData) => {
    const response = await api.post('/falls', fallData);
    return response.data;
  },

  getFallHistory: async () => {
    const response = await api.get('/falls/history');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/falls/statistics');
    return response.data;
  },
};

// ==================== NOTIFICAÇÕES ====================
export const notificationAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

// ==================== UTILITÁRIOS ====================
export const utils = {
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch {
      return false;
    }
  },

  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  formatError: (error) => {
    if (error.response) {
      // Erro da API
      return error.response.data?.message || 
             error.response.data?.error || 
             'Erro no servidor';
    } else if (error.request) {
      // Erro de conexão
      return 'Erro de conexão. Verifique sua internet e se o servidor está rodando.';
    } else {
      // Outro erro
      return error.message || 'Erro desconhecido';
    }
  },
};

export default api;