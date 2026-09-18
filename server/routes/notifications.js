import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications — fetch notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/broadcast — admin sends to all users
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  const { title, message, type = 'INFO' } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message are required' });
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, title, message, type }))
    });
    res.json({ success: true, sent: users.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

export default router;
