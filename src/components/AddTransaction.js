import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import './AddTransaction.css';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { addTransaction } = useData();
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const expenseCategories = [
    'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 
    'Healthcare', 'Education', 'Travel', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset category when type changes
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      addTransaction(transactionData);
      setSuccess(true);

      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Show success message and redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error adding transaction:', error);
    }

    setLoading(false);
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="add-transaction">
      <div className="add-transaction-container">
        <div className="add-transaction-header">
          <div className="header-icon">
            <Plus size={24} />
          </div>
          <div>
            <h1>Add Transaction</h1>
            <p>Record your income or expense</p>
          </div>
        </div>

        {success && (
          <div className="alert alert-success">
            Transaction added successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="transaction-form">
          {/* Transaction Type */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-selector">
              <label className={`type-option ${formData.type === 'expense' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleChange}
                />
                <span className="type-label expense">Expense</span>
              </label>
              <label className={`type-option ${formData.type === 'income' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleChange}
                />
                <span className="type-label income">Income</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="input-group">
              <DollarSign size={20} className="input-icon" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="input-group">
              <Tag size={20} className="input-icon" />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <div className="input-group">
              <FileText size={20} className="input-icon" />
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter description"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <div className="input-group">
              <Calendar size={20} className="input-icon" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>

        {/* Quick Add Buttons */}
        <div className="quick-add-section">
          <h3>Quick Add</h3>
          <div className="quick-add-buttons">
            <button
              type="button"
              className="quick-add-btn expense"
              onClick={() => setFormData(prev => ({
                ...prev,
                type: 'expense',
                category: 'Food',
                description: 'Groceries'
              }))}
            >
              Groceries
            </button>
            <button
              type="button"
              className="quick-add-btn expense"
              onClick={() => setFormData(prev => ({
                ...prev,
                type: 'expense',
                category: 'Transportation',
                description: 'Gas'
              }))}
            >
              Gas
            </button>
            <button
              type="button"
              className="quick-add-btn expense"
              onClick={() => setFormData(prev => ({
                ...prev,
                type: 'expense',
                category: 'Food',
                description: 'Coffee'
              }))}
            >
              Coffee
            </button>
            <button
              type="button"
              className="quick-add-btn income"
              onClick={() => setFormData(prev => ({
                ...prev,
                type: 'income',
                category: 'Salary',
                description: 'Monthly Salary'
              }))}
            >
              Salary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
