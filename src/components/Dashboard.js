import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { 
    transactions, 
    budgets, 
    getTotalBalance, 
    getTotalIncome, 
    getTotalExpenses,
    getTransactionsByCategory 
  } = useData();

  const totalBalance = getTotalBalance();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date === date);
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income,
      expenses
    };
  });

  // Prepare pie chart data for expenses by category
  const categoryData = Object.entries(getTransactionsByCategory())
    .filter(([_, data]) => data.expense > 0)
    .map(([category, data]) => ({
      name: category,
      value: data.expense
    }));

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  // Budget progress
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card balance">
          <div className="stat-icon">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Balance</h3>
            <p className="stat-value">${totalBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card income">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Income</h3>
            <p className="stat-value">${totalIncome.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>Expenses</h3>
            <p className="stat-value">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card quick-add">
          <Link to="/add-transaction" className="quick-add-link">
            <div className="stat-icon">
              <Plus size={24} />
            </div>
            <div className="stat-content">
              <h3>Add Transaction</h3>
              <p>Quick add</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card chart-card">
          <h3>Spending Trends</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3>Budget vs. Actual</h3>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">
                <p>No expense data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Progress & Recent Transactions */}
      <div className="bottom-row">
        <div className="card budget-progress">
          <div className="card-header">
            <h3>Budget Progress</h3>
            <Link to="/budget" className="view-all-link">View All</Link>
          </div>
          <div className="budget-list">
            {currentBudgets.length > 0 ? (
              currentBudgets.map(budget => {
                const percentage = (budget.spent / budget.amount) * 100;
                const isOverBudget = percentage > 100;
                
                return (
                  <div key={budget.id} className="budget-item">
                    <div className="budget-info">
                      <span className="budget-category">{budget.category}</span>
                      <span className="budget-amount">
                        ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="budget-progress-bar">
                      <div 
                        className={`budget-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className={`budget-percentage ${isOverBudget ? 'over-budget' : ''}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No budgets set for this month</p>
                <Link to="/budget" className="btn btn-primary">Set Budget</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card recent-transactions">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <Link to="/transactions" className="view-all-link">View All</Link>
          </div>
          <div className="transaction-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">
                    {transaction.type === 'income' ? (
                      <ArrowUpRight size={20} className="income-icon" />
                    ) : (
                      <ArrowDownRight size={20} className="expense-icon" />
                    )}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-description">{transaction.description}</span>
                    <span className="transaction-category">{transaction.category}</span>
                  </div>
                  <div className="transaction-amount">
                    <span className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </span>
                    <span className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No transactions yet</p>
                <Link to="/add-transaction" className="btn btn-primary">Add Transaction</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
