const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills',
      'Healthcare', 'Education', 'Travel', 'Investment', 'Other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount must be positive']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2030, 'Year must be 2030 or earlier']
  },
  // Alert settings
  alertThreshold: {
    type: Number,
    default: 80,
    min: [1, 'Alert threshold must be between 1 and 100'],
    max: [100, 'Alert threshold must be between 1 and 100']
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  // Budget metadata
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to ensure unique budget per category per month/year per user
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

// Indexes for performance
budgetSchema.index({ userId: 1, year: -1, month: -1 });
budgetSchema.index({ userId: 1, status: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(function() {
  return this.amount > 0 ? Math.round((this.spent / this.amount) * 100) : 0;
});

// Virtual for budget status
budgetSchema.virtual('budgetStatus').get(function() {
  const percentage = this.percentageUsed;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'good';
});

// Virtual for formatted amounts
budgetSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

budgetSchema.virtual('formattedSpent').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.spent);
});

budgetSchema.virtual('formattedRemaining').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.remaining);
});

// Instance method to check if budget needs alert
budgetSchema.methods.needsAlert = function() {
  return !this.alertSent && this.percentageUsed >= this.alertThreshold;
};

// Instance method to update spent amount
budgetSchema.methods.updateSpent = async function(amount, operation = 'add') {
  if (operation === 'add') {
    this.spent += amount;
  } else if (operation === 'subtract') {
    this.spent = Math.max(0, this.spent - amount);
  }
  
  // Reset alert if spent goes below threshold
  if (this.percentageUsed < this.alertThreshold) {
    this.alertSent = false;
  }
  
  return this.save();
};

// Static method to get budget summary for user
budgetSchema.statics.getUserBudgetSummary = async function(userId, month, year) {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  return this.aggregate([
    {
      $match: {
        userId,
        month: targetMonth,
        year: targetYear,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalBudget: { $sum: '$amount' },
        totalSpent: { $sum: '$spent' },
        categoryCount: { $sum: 1 },
        budgets: { $push: '$$ROOT' }
      }
    },
    {
      $addFields: {
        totalRemaining: { $subtract: ['$totalBudget', '$totalSpent'] },
        overallPercentage: {
          $cond: {
            if: { $gt: ['$totalBudget', 0] },
            then: { $multiply: [{ $divide: ['$totalSpent', '$totalBudget'] }, 100] },
            else: 0
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Budget', budgetSchema);