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
          if (prev.some(t => (t._id || t.id) === ((newTransaction._id || newTransaction.id) || newTransaction.id))) return prev;
          return [newTransaction, ...prev];
        });
      });

      socketRef.current.on('transaction_updated', (updatedTransaction) => {
        setTransactions(prev =>
          prev.map(t => (t._id || t.id) === ((updatedTransaction._id || updatedTransaction.id) || updatedTransaction.id) ? updatedTransaction : t)
        );
      });

      socketRef.current.on('transaction_deleted', (id) => {
        setTransactions(prev => prev.filter(t => (t._id || t.id) !== id));
      });

      // Listen for budget events
      socketRef.current.on('budget_added', (newBudget) => {
        setBudgets(prev => {
          if (prev.some(b => (b._id || b.id) === (newBudget._id || newBudget.id))) return prev;
          return [newBudget, ...prev];
        });
      });

      socketRef.current.on('budget_updated', (updatedBudget) => {
        setBudgets(prev =>
          prev.map(b => (b._id || b.id) === (updatedBudget._id || updatedBudget.id) ? updatedBudget : b)
        );
      });

      socketRef.current.on('budget_deleted', (id) => {
        setBudgets(prev => prev.filter(b => (b._id || b.id) !== id));
      });

      // Listen for notification events
      socketRef.current.on('notification_added', (newNotification) => {
        setNotifications(prev => {
          if (prev.some(n => (n._id || n.id) === (newNotification._id || newNotification.id))) return prev;
          return [newNotification, ...prev];
        });
      });

      socketRef.current.on('notification_updated', (updatedNotification) => {
        setNotifications(prev =>
          prev.map(n => (n._id || n.id) === (updatedNotification._id || updatedNotification.id) ? updatedNotification : n)
        );
      });

      socketRef.current.on('notification_deleted', (id) => {
        setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  // Load data from API when user is authenticated
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setTransactions([]);
      setBudgets([]);
      setNotifications([]);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [transactionsData, budgetsData, notificationsData] = await Promise.all([
        api.getTransactions().catch(err => {
          console.error('Failed to load transactions:', err);
          return { transactions: [] };
        }),
        api.getBudgets().catch(err => {
          console.error('Failed to load budgets:', err);
          return [];
        }),
        api.getNotifications().catch(err => {
          console.error('Failed to load notifications:', err);
          return { notifications: [] };
        })
      ]);

      setTransactions(transactionsData.transactions || transactionsData || []);
      setBudgets(budgetsData || []);
      setNotifications(notificationsData.notifications || notificationsData || []);
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
      const response = await api.createTransaction(transaction);
      // Backend wraps response: { message, transaction }
      const newTransaction = response.transaction || response;
      
      // Optimistic update - add to state
      setTransactions(prev => {
        if (prev.some(t => (t._id || t.id) === (newTransaction._id || newTransaction.id))) return prev;
        return [newTransaction, ...prev];
      });

      // Check budget and create notification if needed (fire and forget)
      if (transaction.type === 'expense') {
        checkBudgetAlert(transaction.category, transaction.amount).catch(err => {
          console.error('Budget alert check failed:', err);
        });
      }

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id, updatedTransaction) => {
    if (!id) {
      throw new Error('Transaction ID is required for update');
    }
    
    try {
      const response = await api.updateTransaction(id, updatedTransaction);
      const transaction = response.transaction || response;
      
      setTransactions(prev =>
        prev.map(t => (t._id || t.id) === id ? { ...t, ...transaction } : t)
      );
      
      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    if (!id) {
      throw new Error('Transaction ID is required for delete');
    }
    
    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => (t._id || t.id) !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const addBudget = async (budget) => {
    try {
      const response = await api.createBudget({ ...budget, spent: 0 });
      const newBudget = response.budget || response;
      setBudgets(prev => {
        if (prev.some(b => (b._id || b.id) === (newBudget._id || newBudget.id))) return prev;
        return [newBudget, ...prev];
      });
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id, updatedBudget) => {
    try {
      const response = await api.updateBudget(id, updatedBudget);
      const budget = response.budget || response;
      setBudgets(prev =>
        prev.map(b => (b._id || b.id) === id ? { ...b, ...budget } : b)
      );
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    try {
      await api.deleteBudget(id);
      setBudgets(prev => prev.filter(b => (b._id || b.id) !== id));
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

      try {
        // Update budget spent amount
        await updateBudget((budget._id || budget.id), { ...budget, spent: newSpent });

        // Create notification if over 80% or 100%
        if (percentage >= 100) {
          await addNotification({
            type: 'error',
            title: 'Budget Exceeded!',
            message: `You've exceeded your ${category} budget by ₹${(newSpent - budget.amount).toFixed(2)}`,
            category: 'budget'
          });
        } else if (percentage >= 80) {
          await addNotification({
            type: 'warning',
            title: 'Budget Alert',
            message: `You've used ${percentage.toFixed(1)}% of your ${category} budget`,
            category: 'budget'
          });
        }
      } catch (error) {
        console.error('Error checking budget alert:', error);
      }
    }
  };

  const addNotification = async (notification) => {
    try {
      const response = await api.createNotification(notification);
      // Backend wraps response: { message, notification }
      const newNotification = response.notification || response;
      setNotifications(prev => {
        if (prev.some(n => (n._id || n.id) === (newNotification._id || newNotification.id))) return prev;
        return [newNotification, ...prev];
      });
      return newNotification;
    } catch (error) {
      console.error('Error adding notification:', error);
      // Don't throw - notification failures shouldn't break the main flow
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          (notification._id || notification.id) === id ? { ...notification, read: true } : notification
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
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
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
