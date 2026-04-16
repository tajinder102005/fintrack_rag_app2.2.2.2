const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/auth');

// Get all budgets (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new budget (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const budget = new Budget(req.body);
    const savedBudget = await budget.save();

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('budget_added', savedBudget);
    }

    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a budget (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('budget_updated', budget);
    }

    res.json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a budget (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Emit real-time update
    if (req.io && req.user && req.user.userId) {
      req.io.to(req.user.userId).emit('budget_deleted', req.params.id);
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
