const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Get all notifications (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new notification (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const savedNotification = await notification.save();

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('notification_added', savedNotification);
    }

    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark notification as read (protected)
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('notification_updated', notification);
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a notification (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('notification_deleted', req.params.id);
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
