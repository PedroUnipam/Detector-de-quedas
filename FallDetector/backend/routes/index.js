// routes/index.js
const express = require('express');
const router = express.Router();

// Importar controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const deviceController = require('../controllers/deviceController');
const fallController = require('../controllers/fallController');
const notificationController = require('../controllers/notificationController');    

// Importar middleware
const verifyToken = require('../middleware/authMiddleware');

// ==================== ROTAS PÚBLICAS ====================

// Autenticação
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Registro de queda (chamado pelo dispositivo IoT)
router.post('/falls/register', fallController.registerFall);

// ==================== ROTAS PROTEGIDAS ====================

// Verificar token
router.get('/auth/verify', verifyToken, authController.verifyToken);

// --- Usuário ---
router.get('/user/profile', verifyToken, userController.getProfile);
router.put('/user/profile', verifyToken, userController.updateProfile);
router.put('/user/password', verifyToken, userController.changePassword);

// NOVA ROTA: Upload de foto de perfil
router.post('/user/upload-photo', verifyToken, (req, res, next) => {
  // Obter o upload do app.locals
  const upload = req.app.locals.upload;
  
  // Processar upload de um único arquivo com nome 'photo'
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.error('❌ Erro no upload:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao fazer upload da imagem'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    // Gerar URL da imagem
    const imageUrl = `/img/${req.file.filename}`;
    
    console.log('✅ Imagem salva:', {
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.path,
      url: imageUrl
    });
    
    res.json({
      success: true,
      message: 'Imagem enviada com sucesso',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${imageUrl}`
      }
    });
  });
});

// -- Cuidadores --
router.get('/user/tipos-cuidador', verifyToken, userController.getTiposCuidador);
router.get('/user/cuidadores', verifyToken, userController.getCuidadores);
router.post('/user/cuidadores', verifyToken, userController.addCuidador);
router.put('/user/cuidadores/:cuidadorId', verifyToken, userController.updateCuidador);
router.delete('/user/cuidadores/:cuidadorId', verifyToken, userController.removeCuidador);

// --- Dispositivos ---
router.get('/devices', verifyToken, deviceController.getUserDevices);
router.get('/devices/scan', verifyToken, deviceController.scanDevices);
router.get('/devices/:deviceId', verifyToken, deviceController.getDeviceDetails);
router.post('/devices', verifyToken, deviceController.addDevice);
router.put('/devices/:deviceId', verifyToken, deviceController.updateDevice);
router.put('/devices/:deviceId/toggle', verifyToken, deviceController.toggleDeviceStatus);
router.delete('/devices/:deviceId', verifyToken, deviceController.deleteDevice);
router.get('/devices/:deviceId/code', verifyToken, deviceController.getESP32Code);

// --- Quedas ---
router.get('/falls', verifyToken, fallController.getUserFalls);
router.get('/falls/stats', verifyToken, fallController.getFallStatistics);
router.get('/falls/:fallId', verifyToken, fallController.getFallDetails);
router.delete('/falls/:fallId', verifyToken, fallController.deleteFall);

// --- Notificações ---
router.get('/notifications', verifyToken, notificationController.getUserNotifications);
router.put('/notifications/:notificationId/read', verifyToken, notificationController.markAsRead);

// ==================== ROTA DE TESTE ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Fall Detector funcionando!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;