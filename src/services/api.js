const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get JWT token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('fintrack_token');
};

// API helper function with authentication support
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  // Handle 401 Unauthorized (token expired)
  if (response.status === 401) {
    if (token) {
      localStorage.removeItem('fintrack_token');
      localStorage.removeItem('fintrack_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    throw new Error('Invalid JSON response from server');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

export const api = {
  // Transactions
  getTransactions: async () => {
    return apiRequest('/transactions');
  },

  createTransaction: async (transaction) => {
    return apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  updateTransaction: async (id, transaction) => {
    return apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  },

  deleteTransaction: async (id) => {
    return apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Budgets
  getBudgets: async () => {
    return apiRequest('/budgets');
  },

  createBudget: async (budget) => {
    return apiRequest('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  },

  updateBudget: async (id, budget) => {
    return apiRequest(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
  },

  deleteBudget: async (id) => {
    return apiRequest(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: async () => {
    return apiRequest('/notifications');
  },

  createNotification: async (notification) => {
    return apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },

  markNotificationAsRead: async (id) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  deleteNotification: async (id) => {
    return apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Auth
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // AI advisor (Gemini via backend)
  askAdvisor: async ({ message, history = [], context }) => {
    return apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, context }),
    });
  },

  askAdvisorPublic: async ({ message, history = [] }) => {
    const response = await fetch(`${API_BASE_URL}/ai/chat/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'AI request failed');
    }

    return data;
  },

  getAiStatus: async () => {
    return apiRequest('/ai/status');
  },
};
