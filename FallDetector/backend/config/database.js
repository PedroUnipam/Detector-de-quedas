// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123mudar',
  database: process.env.DB_NAME || 'sistema_detector_quedas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Teste de conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado ao banco de dados MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  });

module.exports = pool;