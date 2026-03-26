import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('fintrack_transactions');
    const savedBudgets = localStorage.getItem('fintrack_budgets');
    const savedNotifications = localStorage.getItem('fintrack_notifications');

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      // Initialize with sample data
      const sampleTransactions = [
        {
          id: 1,
          type: 'expense',
          amount: 85.50,
          category: 'Food',
          description: 'Groceries',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          type: 'income',
          amount: 2500.00,
          category: 'Income',
          description: 'Salary',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          type: 'expense',
          amount: 15.99,
          category: 'Entertainment',
          description: 'Online Subscription',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          type: 'expense',
          amount: 5.25,
          category: 'Food',
          description: 'Coffee Shop',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        }
      ];
      setTransactions(sampleTransactions);
    }

    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    } else {
      // Initialize with sample budget
      const sampleBudgets = [
        {
          id: 1,
          category: 'Food',
          amount: 500,
          spent: 90.75,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        },
        {
          id: 2,
          category: 'Entertainment',
          amount: 200,
          spent: 15.99,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      ];
      setBudgets(sampleBudgets);
    }

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fintrack_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('fintrack_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // Check budget and create notification if needed
    if (transaction.type === 'expense') {
      checkBudgetAlert(transaction.category, transaction.amount);
    }

    return newTransaction;
  };

  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      )
    );
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const addBudget = (budget) => {
    const newBudget = {
      ...budget,
      id: Date.now(),
      spent: 0
    };
    setBudgets(prev => [newBudget, ...prev]);
    return newBudget;
  };

  const updateBudget = (id, updatedBudget) => {
    setBudgets(prev =>
      prev.map(budget =>
        budget.id === id ? { ...budget, ...updatedBudget } : budget
      )
    );
  };

  const deleteBudget = (id) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const checkBudgetAlert = (category, amount) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const budget = budgets.find(b => 
      b.category === category && 
      b.month === currentMonth && 
      b.year === currentYear
    );

    if (budget) {
      const newSpent = budget.spent + amount;
      const percentage = (newSpent / budget.amount) * 100;

      // Update budget spent amount
      updateBudget(budget.id, { ...budget, spent: newSpent });

      // Create notification if over 80% or 100%
      if (percentage >= 100) {
        addNotification({
          type: 'error',
          title: 'Budget Exceeded!',
          message: `You've exceeded your ${category} budget by $${(newSpent - budget.amount).toFixed(2)}`,
          category: category
        });
      } else if (percentage >= 80) {
        addNotification({
          type: 'warning',
          title: 'Budget Alert',
          message: `You've used ${percentage.toFixed(1)}% of your ${category} budget`,
          category: category
        });
      }
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Calculate totals
  const getTotalBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTransactionsByCategory = () => {
    const categories = {};
    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          income: 0,
          expense: 0,
          total: 0
        };
      }
      categories[transaction.category][transaction.type] += transaction.amount;
      categories[transaction.category].total += transaction.type === 'income' 
        ? transaction.amount 
        : -transaction.amount;
    });
    return categories;
  };

  const value = {
    transactions,
    budgets,
    notifications,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
    getTransactionsByCategory
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
