// server.js - ADICIONE estas linhas no início, após os requires existentes

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // ADICIONAR: npm install multer
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CRIAR PASTA DE IMAGENS ====================
const uploadDir = path.join(__dirname, 'img');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Pasta de imagens criada:', uploadDir);
}

// ==================== CONFIGURAÇÃO DO MULTER (UPLOAD) ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único: userid_timestamp.extensao
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `profile_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WEBP'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// -=================== FIREBASE =======================
app.locals.db = db;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Exportar para usar nas rotas
app.locals.upload = upload;

// ==================== MIDDLEWARES ====================

// Segurança - MODIFICAR helmet para permitir servir imagens
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==================== CORS ====================
const allowedOrigins = [
  'http://localhost:19006', // Expo web
  'http://localhost:8081',  // Metro bundler (React Native)
  'http://localhost:3000',  // Backend local
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`🚫 CORS bloqueado para origem: ${origin}`);
        return callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
  })
);

// Body parser com limite aumentado
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});
app.use('/api/', limiter);

// ==================== SERVIR ARQUIVOS ESTÁTICOS (IMAGENS) ====================
app.use('/img', express.static(path.join(__dirname, 'img')));
console.log('🖼️ Servindo imagens em: /img');

// ==================== ROTAS ====================
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fall Detector API v1.0',
    version: '1.0.0',
    docs: '/api/health',
    images: '/img'
  });
});

// ==================== TRATAMENTO DE ERROS ====================

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path
  });
});

// Erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  
  // Tratar erro de payload muito grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Arquivo muito grande. O tamanho máximo permitido é 10MB.',
      error: 'Payload too large'
    });
  }
  
  // Tratar erro do Multer (upload)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. O tamanho máximo é 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Fall Detector API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🖼️ Imagens: http://localhost:${PORT}/img`);
  console.log(`📦 Limite de upload: 5MB`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});

module.exports = app;