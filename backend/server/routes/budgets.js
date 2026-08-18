const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { authMiddleware } = require('../middleware/auth');

// Get all budgets for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const budgets = await Budget.find(query).sort({ year: -1, month: -1, createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create a new budget
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check for existing budget for same category/month/year
    const existingBudget = await Budget.findOne({
      userId: req.user.userId,
      category: req.body.category,
      month: req.body.month,
      year: req.body.year
    });

    if (existingBudget) {
      return res.status(409).json({
        error: 'Budget already exists',
        message: `Budget for ${req.body.category} in ${req.body.month}/${req.body.year} already exists`
      });
    }

    const budget = new Budget({
      ...req.body,
      userId: req.user.userId
    });

    const savedBudget = await budget.save();

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('budget_added', savedBudget);
    }

    res.status(201).json({
      message: 'Budget created successfully',
      budget: savedBudget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update a budget
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('budget_updated', budget);
    }

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete a budget
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Emit real-time update
    if (req.io) {
      req.io.to(req.user.userId.toString()).emit('budget_deleted', req.params.id);
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get budget summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    const budgets = await Budget.find({
      userId: req.user.userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    const summary = {
      totalBudget: 0,
      totalSpent: 0,
      categories: budgets.length,
      budgets: budgets.map(budget => ({
        ...budget.toJSON(),
        remaining: budget.amount - (budget.spent || 0),
        percentUsed: budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0
      }))
    };

    summary.totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    summary.totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    summary.totalRemaining = summary.totalBudget - summary.totalSpent;
    summary.overallPercentUsed = summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0;

    res.json(summary);
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

module.exports = router;
