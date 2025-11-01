// src/controllers/notificationController.js
const prisma = require('../config/database');

async function listNotifications(req, res) {
  try {
    const userId = req.user?.userId;
    const notes = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ notifications: notes });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function markNotificationRead(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to mark read' });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user?.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to mark all read' });
  }
}

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead };
