// controllers/fallController.js
const db = require('../config/database');

// Registrar nova queda detectada
exports.registerFall = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      device_id, 
      fall_latitude, 
      fall_longitude, 
      accel_x, 
      accel_y, 
      accel_z 
    } = req.body;

    // Validações
    if (!device_id || !fall_latitude || !fall_longitude) {
      return res.status(400).json({ 
        error: 'device_id, fall_latitude e fall_longitude são obrigatórios' 
      });
    }

    await connection.beginTransaction();

    // Verificar se dispositivo existe e está ativo
    const [device] = await connection.query(
      'SELECT id, user_id, device_name FROM devices WHERE id = ? AND is_active = 1',
      [device_id]
    );

    if (device.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Dispositivo não encontrado ou inativo' });
    }

    const userId = device[0].user_id;

    // Inserir registro de queda
    const [fallResult] = await connection.query(
      `INSERT INTO falls 
       (device_id, user_id, fall_latitude, fall_longitude, accel_x, accel_y, accel_z, fall_datetime) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [device_id, userId, fall_latitude, fall_longitude, accel_x || null, accel_y || null, accel_z || null]
    );

    const fallId = fallResult.insertId;

    // Buscar cuidadores do usuário
    const [caregivers] = await connection.query(
      `SELECT c.caregiver_name, c.caregiver_email, c.caregiver_phone 
       FROM caregivers c 
       WHERE c.user_id = ? AND c.is_active = 1`,
      [userId]
    );

    // Criar notificações para cada cuidador
    const notificationPromises = caregivers.map(caregiver => 
      connection.query(
        `INSERT INTO notifications 
         (fall_id, recipient_name, recipient_email, recipient_phone, sent_at, is_read) 
         VALUES (?, ?, ?, ?, NOW(), 0)`,
        [fallId, caregiver.caregiver_name, caregiver.caregiver_email, caregiver.caregiver_phone]
      )
    );

    await Promise.all(notificationPromises);
    await connection.commit();

    res.status(201).json({
      message: 'Queda registrada com sucesso',
      fallId,
      notificationsSent: caregivers.length,
      caregivers: caregivers.map(c => ({
        name: c.caregiver_name,
        email: c.caregiver_email,
        phone: c.caregiver_phone
      }))
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao registrar queda:', error);
    res.status(500).json({ error: 'Erro ao registrar queda' });
  } finally {
    connection.release();
  }
};

// Buscar histórico de quedas do usuário
exports.getUserFalls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [falls] = await db.query(
      `SELECT 
         f.id, 
         f.fall_datetime, 
         f.fall_latitude, 
         f.fall_longitude,
         f.accel_x,
         f.accel_y,
         f.accel_z,
         d.device_name,
         d.device_mac,
         COUNT(n.id) as notifications_sent
       FROM falls f
       LEFT JOIN devices d ON f.device_id = d.id
       LEFT JOIN notifications n ON f.id = n.fall_id
       WHERE f.user_id = ?
       GROUP BY f.id
       ORDER BY f.fall_datetime DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM falls WHERE user_id = ?',
      [userId]
    );

    res.json({
      falls,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar quedas:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de quedas' });
  }
};

// Buscar detalhes de uma queda específica
exports.getFallDetails = async (req, res) => {
  try {
    const { fallId } = req.params;
    const userId = req.user.id;

    const [falls] = await db.query(
      `SELECT 
         f.*,
         d.device_name,
         d.device_mac,
         u.name as user_name,
         u.email as user_email
       FROM falls f
       LEFT JOIN devices d ON f.device_id = d.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = ? AND f.user_id = ?`,
      [fallId, userId]
    );

    if (falls.length === 0) {
      return res.status(404).json({ error: 'Queda não encontrada' });
    }

    // Buscar notificações enviadas
    const [notifications] = await db.query(
      `SELECT 
         recipient_name,
         recipient_email,
         recipient_phone,
         sent_at,
         is_read,
         read_at
       FROM notifications
       WHERE fall_id = ?
       ORDER BY sent_at DESC`,
      [fallId]
    );

    res.json({
      fall: falls[0],
      notifications
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes da queda:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da queda' });
  }
};

// Deletar uma queda (admin apenas)
exports.deleteFall = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { fallId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Verificar se a queda pertence ao usuário
    const [fall] = await connection.query(
      'SELECT id FROM falls WHERE id = ? AND user_id = ?',
      [fallId, userId]
    );

    if (fall.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Queda não encontrada' });
    }

    // Deletar notificações relacionadas
    await connection.query('DELETE FROM notifications WHERE fall_id = ?', [fallId]);

    // Deletar queda
    await connection.query('DELETE FROM falls WHERE id = ?', [fallId]);

    await connection.commit();

    res.json({ message: 'Queda deletada com sucesso' });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao deletar queda:', error);
    res.status(500).json({ error: 'Erro ao deletar queda' });
  } finally {
    connection.release();
  }
};

// Estatísticas de quedas
exports.getFallStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total de quedas
    const [totalFalls] = await db.query(
      'SELECT COUNT(*) as total FROM falls WHERE user_id = ?',
      [userId]
    );

    // Quedas nos últimos 30 dias
    const [recentFalls] = await db.query(
      `SELECT COUNT(*) as total 
       FROM falls 
       WHERE user_id = ? AND fall_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    // Quedas por dispositivo
    const [fallsByDevice] = await db.query(
      `SELECT 
         d.device_name,
         COUNT(f.id) as fall_count
       FROM falls f
       LEFT JOIN devices d ON f.device_id = d.id
       WHERE f.user_id = ?
       GROUP BY d.id, d.device_name
       ORDER BY fall_count DESC`,
      [userId]
    );

    // Quedas por mês (últimos 6 meses)
    const [fallsByMonth] = await db.query(
      `SELECT 
         DATE_FORMAT(fall_datetime, '%Y-%m') as month,
         COUNT(*) as fall_count
       FROM falls
       WHERE user_id = ? AND fall_datetime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month DESC`,
      [userId]
    );

    res.json({
      totalFalls: totalFalls[0].total,
      recentFalls: recentFalls[0].total,
      fallsByDevice,
      fallsByMonth
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};