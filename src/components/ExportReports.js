import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FileText, Download, Calendar, Filter, BarChart3 } from 'lucide-react';
import './ExportReports.css';

const ExportReports = () => {
  const { transactions, budgets, getTotalBalance, getTotalIncome, getTotalExpenses } = useData();
  const [reportType, setReportType] = useState('transactions');
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories
  const categories = [...new Set(transactions.map(t => t.category))].sort();

  // Filter transactions based on criteria
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    const now = new Date();

    // Date filtering
    if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    } else if (dateRange === 'year') {
      const yearAgo = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(t => new Date(t.date) >= yearAgo);
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(customStartDate) && date <= new Date(customEndDate);
      });
    }

    // Category filtering
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Generate CSV content
  const generateCSV = (data, type) => {
    if (type === 'transactions') {
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
      const rows = data.map(t => [
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount.toFixed(2)
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } else if (type === 'summary') {
      const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netAmount = totalIncome - totalExpenses;

      const categoryBreakdown = data.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { income: 0, expense: 0 };
        }
        acc[t.category][t.type] += t.amount;
        return acc;
      }, {});

      let csv = 'Financial Summary Report\n\n';
      csv += 'Overall Summary\n';
      csv += 'Metric,Amount\n';
      csv += `Total Income,${totalIncome.toFixed(2)}\n`;
      csv += `Total Expenses,${totalExpenses.toFixed(2)}\n`;
      csv += `Net Amount,${netAmount.toFixed(2)}\n\n`;
      
      csv += 'Category Breakdown\n';
      csv += 'Category,Income,Expenses,Net\n';
      
      Object.entries(categoryBreakdown).forEach(([category, amounts]) => {
        const net = amounts.income - amounts.expense;
        csv += `${category},${amounts.income.toFixed(2)},${amounts.expense.toFixed(2)},${net.toFixed(2)}\n`;
      });

      return csv;
    }
  };

  // Download file
  const downloadFile = (content, filename, type = 'csv') => {
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let filename, content;

    if (reportType === 'transactions') {
      filename = `transactions-${dateRange}-${dateStr}.csv`;
      content = generateCSV(filteredTransactions, 'transactions');
    } else if (reportType === 'summary') {
      filename = `financial-summary-${dateRange}-${dateStr}.csv`;
      content = generateCSV(filteredTransactions, 'summary');
    } else if (reportType === 'budgets') {
      filename = `budgets-${dateStr}.csv`;
      const headers = ['Category', 'Budget Amount', 'Spent', 'Remaining', 'Month', 'Year'];
      const rows = budgets.map(b => [
        b.category,
        b.amount.toFixed(2),
        b.spent.toFixed(2),
        (b.amount - b.spent).toFixed(2),
        b.month,
        b.year
      ]);
      content = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }

    downloadFile(content, filename);
  };

  // Calculate statistics
  const stats = {
    totalTransactions: filteredTransactions.length,
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    netAmount: 0
  };
  stats.netAmount = stats.totalIncome - stats.totalExpenses;

  return (
    <div className="export-reports">
      <div className="reports-header">
        <div>
          <h1>Export Reports</h1>
          <p>Generate and download financial reports</p>
        </div>
      </div>

      <div className="reports-container">
        {/* Report Configuration */}
        <div className="report-config">
          <h3>Report Configuration</h3>
          
          <div className="config-section">
            <label className="form-label">Report Type</label>
            <div className="report-type-options">
              <label className={`report-option ${reportType === 'transactions' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="reportType"
                  value="transactions"
                  checked={reportType === 'transactions'}
                  onChange={(e) => setReportType(e.target.value)}
                />
                <div className="option-content">
                  <FileText size={20} />
                  <span>Transactions</span>
                  <small>Detailed transaction list</small>
                </div>
              </label>

              <label className={`report-option ${reportType === 'summary' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  checked={reportType === 'summary'}
                  onChange={(e) => setReportType(e.target.value)}
                />
                <div className="option-content">
                  <BarChart3 size={20} />
                  <span>Summary</span>
                  <small>Financial overview & analysis</small>
                </div>
              </label>

              <label className={`report-option ${reportType === 'budgets' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="reportType"
                  value="budgets"
                  checked={reportType === 'budgets'}
                  onChange={(e) => setReportType(e.target.value)}
                />
                <div className="option-content">
                  <Calendar size={20} />
                  <span>Budgets</span>
                  <small>Budget tracking report</small>
                </div>
              </label>
            </div>
          </div>

          {reportType !== 'budgets' && (
            <>
              <div className="config-section">
                <label className="form-label">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="form-select"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <div className="config-section">
                  <div className="date-range-inputs">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="config-section">
                <label className="form-label">Category Filter</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleExport}
            className="btn btn-primary export-btn"
            disabled={reportType !== 'budgets' && filteredTransactions.length === 0}
          >
            <Download size={20} />
            Export Report
          </button>
        </div>

        {/* Report Preview */}
        <div className="report-preview">
          <h3>Report Preview</h3>
          
          {reportType !== 'budgets' ? (
            <>
              <div className="preview-stats">
                <div className="stat-card">
                  <span className="stat-label">Transactions</span>
                  <span className="stat-value">{stats.totalTransactions}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Income</span>
                  <span className="stat-value positive">${stats.totalIncome.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Expenses</span>
                  <span className="stat-value negative">${stats.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Net Amount</span>
                  <span className={`stat-value ${stats.netAmount >= 0 ? 'positive' : 'negative'}`}>
                    ${stats.netAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {reportType === 'transactions' && (
                <div className="preview-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Category</span>
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="table-body">
                    {filteredTransactions.slice(0, 5).map(transaction => (
                      <div key={transaction.id} className="table-row">
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        <span className={`transaction-type ${transaction.type}`}>
                          {transaction.type}
                        </span>
                        <span>{transaction.category}</span>
                        <span>{transaction.description}</span>
                        <span className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {filteredTransactions.length > 5 && (
                    <div className="table-footer">
                      And {filteredTransactions.length - 5} more transactions...
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="preview-stats">
              <div className="stat-card">
                <span className="stat-label">Total Budgets</span>
                <span className="stat-value">{budgets.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Budget Amount</span>
                <span className="stat-value">${budgets.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Spent</span>
                <span className="stat-value">${budgets.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {(reportType !== 'budgets' && filteredTransactions.length === 0) && (
            <div className="empty-preview">
              <Filter size={32} />
              <p>No data matches your current filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportReports;
