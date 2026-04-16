import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

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
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (user && user.id) {
      // Connect to socket
      socketRef.current = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');

      // Join user-specific room
      socketRef.current.emit('join_user_room', user.id);

      // Listen for transaction events
      socketRef.current.on('transaction_added', (newTransaction) => {
        setTransactions(prev => {
          // Avoid duplicates if this client initiated the add
          if (prev.some(t => t._id === newTransaction._id)) return prev;
          return [newTransaction, ...prev];
        });
      });

      socketRef.current.on('transaction_updated', (updatedTransaction) => {
        setTransactions(prev =>
          prev.map(t => t._id === updatedTransaction._id ? updatedTransaction : t)
        );
      });

      socketRef.current.on('transaction_deleted', (id) => {
        setTransactions(prev => prev.filter(t => t._id !== id));
      });

      // Listen for budget events
      socketRef.current.on('budget_added', (newBudget) => {
        setBudgets(prev => {
          if (prev.some(b => b._id === newBudget._id)) return prev;
          return [newBudget, ...prev];
        });
      });

      socketRef.current.on('budget_updated', (updatedBudget) => {
        setBudgets(prev =>
          prev.map(b => b._id === updatedBudget._id ? updatedBudget : b)
        );
      });

      socketRef.current.on('budget_deleted', (id) => {
        setBudgets(prev => prev.filter(b => b._id !== id));
      });

      // Listen for notification events
      socketRef.current.on('notification_added', (newNotification) => {
        setNotifications(prev => {
          if (prev.some(n => n._id === newNotification._id)) return prev;
          return [newNotification, ...prev];
        });
      });

      socketRef.current.on('notification_updated', (updatedNotification) => {
        setNotifications(prev =>
          prev.map(n => n._id === updatedNotification._id ? updatedNotification : n)
        );
      });

      socketRef.current.on('notification_deleted', (id) => {
        setNotifications(prev => prev.filter(n => n._id !== id));
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, budgetsData, notificationsData] = await Promise.all([
        api.getTransactions(),
        api.getBudgets(),
        api.getNotifications()
      ]);

      if (transactionsData.length === 0) {
        // Initialize with sample data
        const sampleTransactions = [
          {
            type: 'expense',
            amount: 85.50,
            category: 'Food',
            description: 'Groceries',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          },
          {
            type: 'income',
            amount: 2500.00,
            category: 'Income',
            description: 'Salary',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          },
          {
            type: 'expense',
            amount: 15.99,
            category: 'Entertainment',
            description: 'Online Subscription',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          },
          {
            type: 'expense',
            amount: 5.25,
            category: 'Food',
            description: 'Coffee Shop',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          }
        ];

        // Create sample transactions in database
        for (const transaction of sampleTransactions) {
          await api.createTransaction(transaction);
        }
        setTransactions(sampleTransactions);
      } else {
        setTransactions(transactionsData);
      }

      if (budgetsData.length === 0) {
        // Initialize with sample budget
        const sampleBudgets = [
          {
            category: 'Food',
            amount: 500,
            spent: 90.75,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          {
            category: 'Entertainment',
            amount: 200,
            spent: 15.99,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }
        ];

        // Create sample budgets in database
        for (const budget of sampleBudgets) {
          await api.createBudget(budget);
        }
        setBudgets(sampleBudgets);
      } else {
        setBudgets(budgetsData);
      }

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save to API whenever data changes
  useEffect(() => {
    // Data is automatically saved when API calls are made
    // No need for localStorage anymore
  }, [transactions, budgets, notifications]);

  const addTransaction = async (transaction) => {
    try {
      const newTransaction = await api.createTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);

      // Check budget and create notification if needed
      if (transaction.type === 'expense') {
        await checkBudgetAlert(transaction.category, transaction.amount);
      }

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id, updatedTransaction) => {
    try {
      const transaction = await api.updateTransaction(id, updatedTransaction);
      setTransactions(prev =>
        prev.map(t => t._id === id ? { ...t, ...transaction } : t)
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const addBudget = async (budget) => {
    try {
      const newBudget = await api.createBudget({ ...budget, spent: 0 });
      setBudgets(prev => [newBudget, ...prev]);
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id, updatedBudget) => {
    try {
      const budget = await api.updateBudget(id, updatedBudget);
      setBudgets(prev =>
        prev.map(b => b._id === id ? { ...b, ...budget } : b)
      );
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    try {
      await api.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b._id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  const checkBudgetAlert = async (category, amount) => {
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
      await updateBudget(budget._id, { ...budget, spent: newSpent });

      // Create notification if over 80% or 100%
      if (percentage >= 100) {
        await addNotification({
          type: 'error',
          title: 'Budget Exceeded!',
          message: `You've exceeded your ${category} budget by $${(newSpent - budget.amount).toFixed(2)}`,
          category: category
        });
      } else if (percentage >= 80) {
        await addNotification({
          type: 'warning',
          title: 'Budget Alert',
          message: `You've used ${percentage.toFixed(1)}% of your ${category} budget`,
          category: category
        });
      }
    }
  };

  const addNotification = async (notification) => {
    try {
      const newNotification = await api.createNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      return newNotification;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
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
