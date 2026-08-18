import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Target, Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import './SetBudget.css';
import { formatINR } from '../utils/format';

const SetBudget = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const categories = [
    'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 
    'Healthcare', 'Education', 'Travel', 'Other'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingBudget) {
      updateBudget(editingBudget._id || editingBudget.id, budgetData);
    } else {
      addBudget(budgetData);
    }

    // Reset form
    setFormData({
      category: '',
      amount: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      month: budget.month,
      year: budget.year
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({
      category: '',
      amount: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
  };

  // Calculate spent amount for each budget
  const budgetsWithSpent = budgets.map(budget => {
    const spent = transactions
      .filter(t => 
        t.type === 'expense' &&
        t.category === budget.category &&
        new Date(t.date).getMonth() + 1 === budget.month &&
        new Date(t.date).getFullYear() === budget.year
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return { ...budget, spent };
  });

  // Group budgets by month/year
  const groupedBudgets = budgetsWithSpent.reduce((groups, budget) => {
    const key = `${budget.year}-${budget.month}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(budget);
    return groups;
  }, {});

  return (
    <div className="set-budget">
      <div className="budget-header">
        <div>
          <h1>Budget Management</h1>
          <p>Set and track your monthly spending limits</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Add Budget
        </button>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="budget-form-overlay">
          <div className="budget-form-modal">
            <div className="form-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h3>
              <button
                className="close-btn"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="budget-form">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Budget Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="form-select"
                    required
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="form-select"
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="budgets-container">
        {Object.keys(groupedBudgets).length > 0 ? (
          Object.entries(groupedBudgets)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([periodKey, periodBudgets]) => {
              const [year, month] = periodKey.split('-');
              const monthName = months[parseInt(month) - 1];
              
              return (
                <div key={periodKey} className="budget-period">
                  <h3 className="period-title">{monthName} {year}</h3>
                  
                  <div className="budgets-grid">
                    {periodBudgets.map(budget => {
                      const percentage = (budget.spent / budget.amount) * 100;
                      const isOverBudget = percentage > 100;
                      const isNearLimit = percentage > 80 && percentage <= 100;
                      
                      return (
                        <div key={budget.id} className="budget-card">
                          <div className="budget-card-header">
                            <div className="budget-category">
                              <Target size={20} />
                              <span>{budget.category}</span>
                            </div>
                            <div className="budget-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(budget)}
                                title="Edit budget"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(budget._id || budget.id)}
                                title="Delete budget"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="budget-amounts">
                            <div className="amount-item">
                              <span className="amount-label">Budget</span>
                              <span className="amount-value">{formatINR(budget.amount)}</span>
                            </div>
                            <div className="amount-item">
                              <span className="amount-label">Spent</span>
                              <span className={`amount-value ${isOverBudget ? 'over-budget' : ''}`}>
                                {formatINR(budget.spent)}
                              </span>
                            </div>
                            <div className="amount-item">
                              <span className="amount-label">Remaining</span>
                              <span className={`amount-value ${isOverBudget ? 'over-budget' : ''}`}>
                                {formatINR(Math.max(0, budget.amount - budget.spent))}
                              </span>
                            </div>
                          </div>

                          <div className="budget-progress">
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill ${isOverBudget ? 'over-budget' : isNearLimit ? 'near-limit' : ''}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <div className="progress-info">
                              <span className={`progress-percentage ${isOverBudget ? 'over-budget' : ''}`}>
                                {percentage.toFixed(1)}%
                              </span>
                              {isOverBudget && (
                                <div className="budget-status over">
                                  <AlertTriangle size={16} />
                                  <span>Over Budget</span>
                                </div>
                              )}
                              {isNearLimit && (
                                <div className="budget-status warning">
                                  <AlertTriangle size={16} />
                                  <span>Near Limit</span>
                                </div>
                              )}
                              {percentage < 80 && (
                                <div className="budget-status good">
                                  <CheckCircle size={16} />
                                  <span>On Track</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Target size={48} />
            </div>
            <h3>No budgets set</h3>
            <p>Start by creating your first budget to track your spending</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <Plus size={20} />
              Create Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetBudget;
