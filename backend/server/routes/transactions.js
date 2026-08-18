const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/auth');

// Get all transactions for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, type, startDate, endDate } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create a new transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      userId: req.user.userId
    });

    const savedTransaction = await transaction.save();
    
    // Emit real-time update to user's room
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('transaction_added', savedTransaction);
    }
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: savedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update a transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('transaction_updated', transaction);
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('transaction_deleted', req.params.id);
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get transaction statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      income: 0,
      expenses: 0,
      balance: 0,
      transactionCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        formattedStats.income = stat.total;
        formattedStats.transactionCount += stat.count;
      } else if (stat._id === 'expense') {
        formattedStats.expenses = stat.total;
        formattedStats.transactionCount += stat.count;
      }
    });

    formattedStats.balance = formattedStats.income - formattedStats.expenses;

    res.json(formattedStats);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

module.exports = router;
