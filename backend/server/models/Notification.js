const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: ['info', 'success', 'warning', 'error', 'budget_alert', 'goal_achievement']
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Action button (optional)
  action: {
    type: {
      type: String,
      enum: ['link', 'button', 'none'],
      default: 'none'
    },
    label: {
      type: String,
      maxlength: [50, 'Action label cannot exceed 50 characters']
    },
    url: {
      type: String,
      maxlength: [200, 'Action URL cannot exceed 200 characters']
    }
  },
  // Metadata
  category: {
    type: String,
    enum: ['transaction', 'budget', 'goal', 'security', 'system', 'promotional'],
    default: 'system'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Related resource references
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedBudget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  // Delivery settings
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  scheduledFor: {
    type: Date
  },
  expiresAt: {
    type: Date
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

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Instance method to check if notification is expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Instance method to check if notification should be delivered
notificationSchema.methods.shouldDeliver = function() {
  if (this.isExpired()) return false;
  if (this.scheduledFor && new Date() < this.scheduledFor) return false;
  return true;
};

// Static method to create budget alert notification
notificationSchema.statics.createBudgetAlert = async function(userId, budget, percentageUsed) {
  let title, message, type;
  
  if (percentageUsed >= 100) {
    title = '🚨 Budget Exceeded!';
    message = `You've exceeded your ${budget.category} budget by ₹${Math.abs(budget.remaining)}`;
    type = 'error';
  } else if (percentageUsed >= budget.alertThreshold) {
    title = '⚠️ Budget Alert';
    message = `You've used ${Math.round(percentageUsed)}% of your ${budget.category} budget`;
    type = 'warning';
  } else {
    return null; // No alert needed
  }

  return this.create({
    userId,
    title,
    message,
    type,
    category: 'budget',
    priority: percentageUsed >= 100 ? 'high' : 'medium',
    relatedBudget: budget._id,
    tags: ['budget', budget.category.toLowerCase()]
  });
};

// Static method to get user's notification summary
notificationSchema.statics.getUserSummary = async function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$read',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$_id', false] }, '$count', 0]
          }
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$_id', true] }, '$count', 0]
          }
        }
      }
    }
  ]);
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = async function(userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    userId,
    read: true,
    createdAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);