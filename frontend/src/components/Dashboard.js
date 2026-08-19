import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatINR, formatINRChart } from '../utils/format';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Plus
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './Dashboard.css';

// Money pulse removed as requested



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

  const recentTransactions = transactions.slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date && t.date.split('T')[0] === date);
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      income,
      expenses
    };
  });

  const categoryData = Object.entries(getTransactionsByCategory())
    .filter(([_, data]) => data.expense > 0)
    .map(([category, data]) => ({
      name: category,
      value: data.expense
    }));

  const COLORS = ['#00ffe0', '#0091ff', '#ffd166', '#ff4f70', '#8b5cf6', '#06b6d4'];

  const categoryTotals = getTransactionsByCategory();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);

  return (
    <div className="dashboard">

      <div className="stats-grid">
        <div className="stat-card balance fade-in">
          <div className="stat-icon">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Balance</h3>
            <p className="stat-value">{formatINR(totalBalance)}</p>
          </div>
        </div>

        <div className="stat-card income fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Income</h3>
            <p className="stat-value">{formatINR(totalIncome)}</p>
          </div>
        </div>

        <div className="stat-card expense fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>Expenses</h3>
            <p className="stat-value">{formatINR(totalExpenses)}</p>
          </div>
        </div>

        <div className="stat-card quick-add fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="stat-content quick-add-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0 }}>Quick Add</h3>
              <Link to="/add-transaction" className="view-all-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <Plus size={14} /> Add
              </Link>
            </div>
            <div className="quick-add-tags">
              <Link to="/add-transaction?category=Food&desc=Groceries" className="quick-add-tag">Groceries</Link>
              <Link to="/add-transaction?category=Transportation&desc=Gas" className="quick-add-tag">Gas</Link>
              <Link to="/add-transaction?category=Food&desc=Coffee" className="quick-add-tag">Coffee</Link>
              <Link to="/add-transaction?type=income&desc=Salary" className="quick-add-tag income-tag">Salary</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="card chart-card glass-card">
          <h3>Spending Trends</h3>
          <div className="chart-container">
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#7a9bb5" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#7a9bb5" fontSize={12} tickFormatter={formatINRChart} width={65} />
                  <Tooltip
                    formatter={(value) => formatINR(value)}
                    contentStyle={{
                      background: '#0d1525',
                      border: '1px solid rgba(0,255,224,0.2)',
                      borderRadius: 8
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Line type="linear" dataKey="income" stroke="#00ffe0" strokeWidth={2} name="Income" />
                  <Line type="linear" dataKey="expenses" stroke="#ff4f70" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">
                <PiggyBank size={40} strokeWidth={1.5} />
                <p>No data yet — add transactions to see trends</p>
                <Link to="/add-transaction" className="btn btn-primary">Add transaction</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card chart-card glass-card">
          <h3>Expenses by Category</h3>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={0}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatINR(value)}
                    contentStyle={{
                      background: '#0d1525',
                      border: '1px solid rgba(0,255,224,0.2)',
                      borderRadius: 8
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">
                <p>No expense categories yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-row">
        <div className="card budget-progress glass-card">
          <div className="card-header">
            <h3>Budget Progress</h3>
            <Link to="/budget" className="view-all-link">View All</Link>
          </div>
          <div className="budget-list">
            {currentBudgets.length > 0 ? (
              currentBudgets.map(budget => {
                const spent = categoryTotals[budget.category]?.expense || 0;
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const isOverBudget = percentage > 100;
                const key = budget._id || budget.id || budget.category;

                return (
                  <div key={key} className="budget-item">
                    <div className="budget-info">
                      <span className="budget-category">{budget.category}</span>
                      <span className="budget-amount">
                        {formatINR(spent)} / {formatINR(budget.amount)}
                      </span>
                    </div>
                    <div className="budget-progress-bar">
                      <div
                        className={`budget-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className={`budget-percentage ${isOverBudget ? 'over-budget' : ''}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p>No budgets for this month</p>
                <p className="empty-hint">Set limits for Food, Rent, EMI & more</p>
                <Link to="/budget" className="btn btn-primary">Set Budget</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card recent-transactions glass-card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <Link to="/transactions" className="view-all-link">View All</Link>
          </div>
          <div className="transaction-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(transaction => {
                const key = transaction._id || transaction.id;
                return (
                  <div key={key} className="transaction-item">
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
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatINR(transaction.amount)}
                      </span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <p>Your dashboard starts at ₹0</p>
                <p className="empty-hint">Log income & expenses to track every rupee</p>
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
