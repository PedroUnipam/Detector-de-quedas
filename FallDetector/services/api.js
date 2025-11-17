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

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao fazer login');
      }

      if (response.data.data && response.data.data.token) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        console.log('✅ Token e dados salvos no AsyncStorage');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ Erro no authAPI.login:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('📝 Registrando usuário:', userData);
      const response = await api.post('/auth/register', userData);

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

// ==================== DISPOSITIVOS ====================
export const deviceAPI = {
  // Listar dispositivos configurados
  getDevices: async () => {
    try {
      const response = await api.get('/devices');
      console.log('📱 Dispositivos carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar dispositivos:', error);
      throw error;
    }
  },

  // Adicionar novo dispositivo
  addDevice: async (deviceData) => {
    try {
      console.log('➕ Adicionando dispositivo:', deviceData);
      const response = await api.post('/devices', deviceData);
      console.log('✅ Dispositivo adicionado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar dispositivo:', error.response?.data || error);
      throw error;
    }
  },

  // Atualizar dispositivo
  updateDevice: async (deviceId, deviceData) => {
    try {
      console.log(`✏️ Atualizando dispositivo ${deviceId}:`, deviceData);
      const response = await api.put(`/devices/${deviceId}`, deviceData);
      console.log('✅ Dispositivo atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar dispositivo:', error);
      throw error;
    }
  },

  // Remover dispositivo
  removeDevice: async (deviceId) => {
    try {
      console.log(`🗑️ Removendo dispositivo ${deviceId}`);
      const response = await api.delete(`/devices/${deviceId}`);
      console.log('✅ Dispositivo removido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao remover dispositivo:', error);
      throw error;
    }
  },

  // Obter detalhes de um dispositivo
  getDeviceDetails: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter detalhes:', error);
      throw error;
    }
  },

  // Buscar dispositivos disponíveis
  scanDevices: async (tipo) => {
    try {
      console.log(`🔍 Buscando dispositivos ${tipo}...`);
      const response = await api.get('/devices/scan', { params: { tipo } });
      console.log('📡 Dispositivos encontrados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar dispositivos:', error);
      // Fallback para mock local se API falhar
      return {
        dispositivos: tipo === 'wifi'
          ? [
            { nome: 'ESP32-WiFi-001', tipo: 'wifi', disponivel: true },
            { nome: 'Monitor-WiFi-5G', tipo: 'wifi', disponivel: true }
          ]
          : [
            { nome: 'ESP32-BT-001', tipo: 'bluetooth', macAddress: 'AA:BB:CC:DD:EE:01', disponivel: true },
            { nome: 'Monitor-BT-002', tipo: 'bluetooth', macAddress: 'AA:BB:CC:DD:EE:02', disponivel: true }
          ]
      };
    }
  },

  // Obter código ESP32 configurado
  getESP32Code: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/code`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter código ESP32:', error);
      throw error;
    }
  },

  // Toggle status do dispositivo
  toggleStatus: async (deviceId) => {
    try {
      const response = await api.put(`/devices/${deviceId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao alternar status:', error);
      throw error;
    }
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

// ==================== USUÁRIO ====================
// Adicione estas funções ao objeto userAPI no arquivo services/api.js

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
    const response = await api.put('/user/password', {
      senhaAtual,
      novaSenha,
    });
    return response.data;
  },
  uploadPhoto: async (imageUri) => {
    try {
      console.log('📤 Iniciando upload da foto...');

      // Criar FormData
      const formData = new FormData();

      // Verificar plataforma
      if (Platform.OS === 'web') {
        // Para Web: converter data URL para Blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('photo', blob, 'profile.jpg');
      } else {
        // Para Mobile: usar URI diretamente
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }

      // Fazer upload
      const uploadResponse = await api.post('/user/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload concluído:', uploadResponse.data);
      return uploadResponse.data;

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  },

  getCuidadores: async () => {
    try {
      const response = await api.get('/user/cuidadores');
      console.log('✅ Cuidadores carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar cuidadores:', error);
      throw error;
    }
  },

  addCuidador: async (cuidadorData) => {
    try {
      console.log('➕ Adicionando cuidador:', cuidadorData);
      const response = await api.post('/user/cuidadores', cuidadorData);
      console.log('✅ Cuidador adicionado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar cuidador:', error);
      throw error;
    }
  },

  getTiposCuidador: async () => {
    try {
      console.log('📋 Buscando tipos de cuidador...');
      const response = await api.get('/user/tipos-cuidador');
      console.log('✅ Tipos de cuidador carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar tipos de cuidador:', error);
      throw error;
    }
  },

  updateCuidador: async (cuidadorId, cuidadorData) => {
    try {
      console.log('✏️ Atualizando cuidador ID:', cuidadorId, 'com dados:', cuidadorData);
      const response = await api.put(`/user/cuidadores/${cuidadorId}`, cuidadorData);
      console.log('✅ Cuidador atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar cuidador:', error);
      throw error;
    }
  },
  removeCuidador: async (cuidadorId) => {
    try {
      console.log('🗑️ Removendo cuidador ID:', cuidadorId);
      const response = await api.delete(`/user/cuidadores/${cuidadorId}`);
      console.log('✅ Cuidador removido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao remover cuidador:', error);
      throw error;
    }
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
      return error.response.data?.message ||
        error.response.data?.error ||
        'Erro no servidor';
    } else if (error.request) {
      return 'Erro de conexão. Verifique sua internet e se o servidor está rodando.';
    } else {
      return error.message || 'Erro desconhecido';
    }
  },
};
exports.getTiposCuidador = async (req, res) => {
  try {
    console.log('📋 Listando tipos de cuidador');

    const [tipos] = await pool.query(
      `SELECT id_tipocuidador, descricao 
       FROM tipocuidador 
       ORDER BY descricao ASC`
    );

    console.log(`✅ ${tipos.length} tipos encontrados`);

    res.json({
      success: true,
      tipos: tipos
    });

  } catch (err) {
    console.error('❌ Erro ao listar tipos de cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de cuidador.',
      error: err.message
    });
  }
};

// ==================== ATUALIZAR CUIDADOR ====================
exports.updateCuidador = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { cuidadorId } = req.params;
    const { nome, telefone, parentesco, id_tipocuidador, email } = req.body;

    // Validação básica
    if (!nome || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios.'
      });
    }

    console.log('✏️ Atualizando cuidador ID:', cuidadorId, 'pelo usuário:', req.user.id);
    console.log('📋 Novos dados:', { nome, telefone, parentesco, id_tipocuidador });

    await connection.beginTransaction();

    try {
      // Verificar se o cuidador pertence ao usuário
      const [vinculo] = await connection.query(
        `SELECT uc.id_vinculo, c.id_pessoa, c.id_tipocuidador
         FROM usuario_cuidador uc
         INNER JOIN cuidador c ON uc.id_cuidador = c.id_cuidador
         WHERE uc.id_usuario = ? AND uc.id_cuidador = ? AND uc.ativo = 1`,
        [req.user.id, cuidadorId]
      );

      if (vinculo.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Cuidador não encontrado ou não pertence a este usuário.'
        });
      }

      const idPessoa = vinculo[0].id_pessoa;

      // Atualizar dados da pessoa
      await connection.query(
        `UPDATE pessoa
         SET nome = ?, telefone = ?, email = ?
         WHERE id_pessoa = ?`,
        [nome.trim(), telefone.trim(), email?.trim() || null, idPessoa]
      );

      console.log('✅ Dados da pessoa atualizados');

      // Atualizar tipo de cuidador
      const tipoFinal = id_tipocuidador || vinculo[0].id_tipocuidador;

      await connection.query(
        'UPDATE cuidador SET id_tipocuidador = ? WHERE id_cuidador = ?',
        [tipoFinal, cuidadorId]
      );

      console.log('✅ Tipo de cuidador atualizado para ID:', tipoFinal);

      await connection.commit();
      console.log('✅ Cuidador atualizado com sucesso');

      res.json({
        success: true,
        message: 'Cuidador atualizado com sucesso.'
      });

    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }

  } catch (err) {
    console.error('❌ Erro ao atualizar cuidador:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cuidador.',
      error: err.message
    });
  } finally {
    connection.release();
  }
};
export default api;