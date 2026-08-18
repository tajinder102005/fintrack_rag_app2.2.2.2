const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [100, 'Description cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 
      'Healthcare', 'Education', 'Travel', 'Investment', 'Salary',
      'Freelance', 'Business', 'Gift', 'Other'
    ]
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // For recurring transactions
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function() {
        return this.recurring.enabled;
      }
    },
    nextDate: {
      type: Date
    }
  },
  // Transaction metadata
  source: {
    type: String,
    enum: ['manual', 'import', 'recurring', 'api'],
    default: 'manual'
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }]
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

// Indexes for performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.amount);
});

// Instance method to check if transaction is recent
transactionSchema.methods.isRecent = function(days = 7) {
  const daysDiff = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  return daysDiff <= days;
};

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId, startDate, endDate) {
  const matchConditions = { userId };
  
  if (startDate || endDate) {
    matchConditions.date = {};
    if (startDate) matchConditions.date.$gte = new Date(startDate);
    if (endDate) matchConditions.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);