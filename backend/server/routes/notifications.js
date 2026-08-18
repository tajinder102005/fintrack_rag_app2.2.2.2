const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// Get all notifications for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { read, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.userId, 
      read: false 
    });

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create a new notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      userId: req.user.userId
    });

    const savedNotification = await notification.save();

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('notification_added', savedNotification);
    }

    res.status(201).json({
      message: 'Notification created successfully',
      notification: savedNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('notification_updated', notification);
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('notifications_read_all');
    }

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('notification_deleted', req.params.id);
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all read notifications
router.delete('/read', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.userId,
      read: true
    });

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('notifications_cleared');
    }

    res.json({
      message: `${result.deletedCount} read notifications deleted`
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({ error: 'Failed to delete read notifications' });
  }
});

module.exports = router;
