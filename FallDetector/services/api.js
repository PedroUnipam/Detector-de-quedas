// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==================== CONFIGURAÇÃO AUTOMÁTICA DO ENDPOINT ====================

// Função para detectar a URL base da API conforme o ambiente
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  }

  // 👇 Novo caso: web
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // fallback para celular físico (Expo Go)
  return 'http://192.168.0.10:3000/api';
};


// URL base dinâmica
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

// Adiciona o token JWT automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao buscar token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Trata erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
    const response = await api.post('/auth/login', { email, senha });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
  // Aqui renomeamos os campos para o formato que o backend espera
  const payload = {
    name: userData.nome,
    email: userData.email,
    phone: userData.telefone,
    password: userData.senha,
  };

  const response = await api.post('/auth/register', payload);
  return response.data;
},


  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
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
      return error.response.data?.message || 'Erro no servidor';
    } else if (error.request) {
      return 'Erro de conexão. Verifique sua internet.';
    } else {
      return error.message || 'Erro desconhecido';
    }
  },
};

export default api;
