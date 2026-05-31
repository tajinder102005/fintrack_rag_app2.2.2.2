import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatINR, formatINRChart } from '../utils/format';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PiggyBank
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

function getMoneyPulse({ transactions, budgets, totalExpenses, totalIncome }) {
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthBudgets = budgets.filter(b => b.month === month && b.year === year);

  if (transactions.length === 0) {
    return {
      type: 'welcome',
      message: 'Welcome! Add your first transaction to see your money pulse — balance, budgets, and AI insights in ₹.',
      action: '/add-transaction',
      actionLabel: 'Add first transaction'
    };
  }

  const over = monthBudgets.find(b => (b.spent || 0) > b.amount);
  if (over) {
    const overAmt = (over.spent || 0) - over.amount;
    return {
      type: 'warning',
      message: `You're ${formatINR(overAmt)} over your ${over.category} budget with ${daysLeft} days left this month.`,
      action: '/budget',
      actionLabel: 'Adjust budget'
    };
  }

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  if (savingsRate >= 20) {
    return {
      type: 'success',
      message: `Strong month! You're saving ${savingsRate.toFixed(0)}% of income (${formatINR(totalIncome - totalExpenses)}). ${daysLeft} days to go.`,
      action: '/reports',
      actionLabel: 'View reports'
    };
  }

  if (totalExpenses > totalIncome && totalIncome > 0) {
    return {
      type: 'warning',
      message: `Spending exceeds income by ${formatINR(totalExpenses - totalIncome)}. Review recent expenses.`,
      action: '/transactions',
      actionLabel: 'See transactions'
    };
  }

  return {
    type: 'info',
    message: `You've spent ${formatINR(totalExpenses)} this month with ${daysLeft} days left. ${monthBudgets.length ? 'Budgets on track.' : 'Set a budget to stay ahead.'}`,
    action: monthBudgets.length ? '/add-transaction' : '/budget',
    actionLabel: monthBudgets.length ? 'Log expense' : 'Set budget'
  };
}

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
  const pulse = getMoneyPulse({ transactions, budgets, totalExpenses, totalIncome });

  const recentTransactions = transactions.slice(0, 5);

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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);

  return (
    <div className="dashboard">
      <div className={`money-pulse money-pulse-${pulse.type}`}>
        <div className="money-pulse-icon">
          <Sparkles size={22} />
        </div>
        <div className="money-pulse-content">
          <span className="money-pulse-label">Money pulse</span>
          <p>{pulse.message}</p>
        </div>
        <Link to={pulse.action} className="money-pulse-btn">
          {pulse.actionLabel}
        </Link>
      </div>

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
          <Link to="/add-transaction" className="quick-add-link">
            <div className="stat-icon">
              <Plus size={24} />
            </div>
            <div className="stat-content">
              <h3>Add Transaction</h3>
              <p>Quick add in ₹</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="charts-row">
        <div className="card chart-card glass-card">
          <h3>Spending Trends</h3>
          <div className="chart-container">
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#7a9bb5" fontSize={12} />
                  <YAxis stroke="#7a9bb5" fontSize={12} tickFormatter={formatINRChart} />
                  <Tooltip
                    formatter={(value) => formatINR(value)}
                    contentStyle={{
                      background: '#0d1525',
                      border: '1px solid rgba(0,255,224,0.2)',
                      borderRadius: 8
                    }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#00ffe0" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ff4f70" strokeWidth={2} name="Expenses" />
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
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
                const percentage = budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0;
                const isOverBudget = percentage > 100;
                const key = budget._id || budget.id || budget.category;

                return (
                  <div key={key} className="budget-item">
                    <div className="budget-info">
                      <span className="budget-category">{budget.category}</span>
                      <span className="budget-amount">
                        {formatINR(budget.spent || 0)} / {formatINR(budget.amount)}
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
