// controllers/notificationController.js
const db = require('../config/database');

// Listar todas as notificações do usuário
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    let query = `
      SELECT 
        n.id,
        n.fall_id,
        n.recipient_name,
        n.recipient_email,
        n.recipient_phone,
        n.sent_at,
        n.is_read,
        n.read_at,
        f.fall_datetime,
        f.fall_latitude,
        f.fall_longitude,
        d.device_name,
        d.device_mac
      FROM notifications n
      INNER JOIN falls f ON n.fall_id = f.id
      LEFT JOIN devices d ON f.device_id = d.id
      WHERE f.user_id = ?
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = 0';
    }

    query += ' ORDER BY n.sent_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await db.query(query, params);

    // Contar total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ?${unreadOnly === 'true' ? ' AND n.is_read = 0' : ''}`,
      [userId]
    );

    // Contar não lidas
    const [unreadResult] = await db.query(
      `SELECT COUNT(*) as unread 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ? AND n.is_read = 0`,
      [userId]
    );

    res.json({
      notifications,
      pagination: {
        total: countResult[0].total,
        unread: unreadResult[0].unread,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// Buscar detalhes de uma notificação
exports.getNotificationDetails = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const [notifications] = await db.query(
      `SELECT 
         n.*,
         f.fall_datetime,
         f.fall_latitude,
         f.fall_longitude,
         f.accel_x,
         f.accel_y,
         f.accel_z,
         d.device_name,
         d.device_mac,
         d.device_model,
         u.name as user_name,
         u.email as user_email,
         u.phone as user_phone
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       LEFT JOIN devices d ON f.device_id = d.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE n.id = ? AND f.user_id = ?`,
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({ notification: notifications[0] });

  } catch (error) {
    console.error('Erro ao buscar detalhes da notificação:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da notificação' });
  }
};

// Marcar notificação como lida
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verificar se notificação pertence ao usuário
    const [notification] = await db.query(
      `SELECT n.id, n.is_read 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE n.id = ? AND f.user_id = ?`,
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification[0].is_read) {
      return res.json({ message: 'Notificação já estava marcada como lida' });
    }

    // Marcar como lida
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notificação marcada como lida' });

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
};

// Marcar todas as notificações como lidas
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `UPDATE notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       SET n.is_read = 1, n.read_at = NOW()
       WHERE f.user_id = ? AND n.is_read = 0`,
      [userId]
    );

    res.json({ 
      message: 'Todas as notificações foram marcadas como lidas',
      updatedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas' });
  }
};

// Deletar uma notificação
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verificar se notificação pertence ao usuário
    const [notification] = await db.query(
      `SELECT n.id 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE n.id = ? AND f.user_id = ?`,
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Deletar notificação
    await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({ message: 'Notificação deletada com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
};

// Deletar notificações antigas (mais de 90 dias)
exports.cleanOldNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `DELETE n FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ? AND n.sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [userId]
    );

    res.json({ 
      message: 'Notificações antigas deletadas com sucesso',
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Erro ao limpar notificações antigas:', error);
    res.status(500).json({ error: 'Erro ao limpar notificações antigas' });
  }
};

// Estatísticas de notificações
exports.getNotificationStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total de notificações
    const [total] = await db.query(
      `SELECT COUNT(*) as total 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ?`,
      [userId]
    );

    // Notificações não lidas
    const [unread] = await db.query(
      `SELECT COUNT(*) as unread 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ? AND n.is_read = 0`,
      [userId]
    );

    // Notificações dos últimos 7 dias
    const [recent] = await db.query(
      `SELECT COUNT(*) as recent 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ? AND n.sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    // Notificações por destinatário
    const [byRecipient] = await db.query(
      `SELECT 
         n.recipient_name,
         n.recipient_email,
         COUNT(*) as notification_count,
         SUM(CASE WHEN n.is_read = 1 THEN 1 ELSE 0 END) as read_count
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE f.user_id = ?
       GROUP BY n.recipient_email, n.recipient_name
       ORDER BY notification_count DESC`,
      [userId]
    );

    res.json({
      totalNotifications: total[0].total,
      unreadNotifications: unread[0].unread,
      recentNotifications: recent[0].recent,
      notificationsByRecipient: byRecipient
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// Reenviar notificação (para casos de falha no envio)
exports.resendNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verificar se notificação existe e pertence ao usuário
    const [notification] = await db.query(
      `SELECT n.*, f.user_id 
       FROM notifications n
       INNER JOIN falls f ON n.fall_id = f.id
       WHERE n.id = ? AND f.user_id = ?`,
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Atualizar timestamp de envio
    await db.query(
      'UPDATE notifications SET sent_at = NOW(), is_read = 0, read_at = NULL WHERE id = ?',
      [notificationId]
    );

    res.json({ 
      message: 'Notificação reenviada com sucesso',
      notification: {
        id: notificationId,
        recipient_email: notification[0].recipient_email,
        recipient_phone: notification[0].recipient_phone
      }
    });

  } catch (error) {
    console.error('Erro ao reenviar notificação:', error);
    res.status(500).json({ error: 'Erro ao reenviar notificação' });
  }
};