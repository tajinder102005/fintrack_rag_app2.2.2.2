import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Tag,
  DollarSign
} from 'lucide-react';
import './AllTransactions.css';
import { formatINR } from '../utils/format';

const AllTransactions = () => {
  const { transactions, deleteTransaction } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category))];
    return cats.sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort transactions (create new array to avoid mutation)
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, sortBy, sortOrder]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete transaction: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="all-transactions">
      {/* Header */}
      <div className="transactions-header">
        <div>
          <h1>All Transactions</h1>
          <p>Manage and view all your transactions</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className={`stat-value ${totalAmount >= 0 ? 'positive' : 'negative'}`}>
              {formatINR(Math.abs(totalAmount))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Income</span>
            <span className="stat-value positive">{formatINR(totalIncome)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Expenses</span>
            <span className="stat-value negative">{formatINR(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="transactions-filters">
        <div className="filter-row">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="filter-select"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="category-asc">Category (A-Z)</option>
              <option value="category-desc">Category (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {filteredTransactions.length > 0 ? (
          <>
            <div className="transactions-count">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>

            <div className="transactions-table">
              <div className="table-header">
                <div className="col-type">Type</div>
                <div className="col-description">Description</div>
                <div className="col-category">Category</div>
                <div className="col-amount">Amount</div>
                <div className="col-date">Date</div>
                <div className="col-actions">Actions</div>
              </div>

              <div className="table-body">
                {filteredTransactions.map(transaction => (
                  <div key={transaction._id || transaction.id} className="table-row">
                    <div className="col-type">
                      <div className={`transaction-type ${transaction.type}`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                        <span>{transaction.type}</span>
                      </div>
                    </div>

                    <div className="col-description">
                      <span className="description-text">{transaction.description}</span>
                    </div>

                    <div className="col-category">
                      <span className="category-tag">
                        <Tag size={12} />
                        {transaction.category}
                      </span>
                    </div>

                    <div className="col-amount">
                      <span className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatINR(transaction.amount)}
                      </span>
                    </div>

                    <div className="col-date">
                      <span className="date-text">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="col-actions">
                      <button
                        className="action-btn edit-btn"
                        title="Edit transaction"
                        onClick={() => navigate(`/add-transaction?edit=${transaction._id || transaction.id}`)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(transaction._id || transaction.id)}
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <DollarSign size={48} />
            </div>
            <h3>No transactions found</h3>
            <p>
              {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start by adding your first transaction'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
