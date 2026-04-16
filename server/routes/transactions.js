const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

// Get all transactions (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new transaction (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const savedTransaction = await transaction.save();
    
    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('transaction_added', savedTransaction);
    }
    
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a transaction (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('transaction_updated', transaction);
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a transaction (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('transaction_deleted', req.params.id);
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
