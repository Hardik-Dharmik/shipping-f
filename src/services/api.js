import config from '../config/env.js';

const API_BASE_URL = config.api.baseUrl;

// Helper function to get token from localStorage
export function getToken() {
  return localStorage.getItem('token');
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData - if so, don't set Content-Type header
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions = {
    headers: {},
  };

  // Only set Content-Type for JSON requests
  if (!isFormData) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }

  // Add authorization token if available
  const token = getToken();
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const requestConfig = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, requestConfig);
    
    // Check if response has content before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, try to get text or return empty object
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    }
    
    if (!response.ok) {
      // Handle different error response formats
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      const isAuthError = response.status === 401 || errorMessage === 'Token expired';
      if (isAuthError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

// API functions
export const api = {
  // Login
  login: async (email, password) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Signup
  signup: async (formData) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('company_name', formData.companyName);
    if (formData.file) {
      data.append('file', formData.file);
    }

    return apiRequest('/api/register', {
      method: 'POST',
      body: data,
      // Don't set Content-Type header - let the browser set it automatically with boundary
    });
  },

  // Calculate rate
  calculateRate: async (rateData) => {
    return apiRequest('/api/shipping/quote', {
      method: 'POST',
      body: JSON.stringify(rateData),
    });
  },

  createOrder: async (orderData) => {
    const isFormData = orderData instanceof FormData;
    return apiRequest('/api/shipping/order', {
      method: 'POST',
      body: isFormData ? orderData : JSON.stringify(orderData),
    });
  },

  // Address form links
  createAddressForm: async () => {
    return apiRequest('/api/shipping/address-forms', {
      method: 'POST',
    });
  },

  getPublicAddressForm: async (code) => {
    return apiRequest(`/api/shipping/address-forms/public/${code}`, {
      method: 'GET',
    });
  },

  submitPublicAddressForm: async (code, payload) => {
    return apiRequest(`/api/shipping/address-forms/public/${code}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAddressForms: async () => {
    return apiRequest('/api/shipping/address-forms', {
      method: 'GET',
    });
  },

  getAddressFormById: async (id) => {
    return apiRequest(`/api/shipping/address-forms/${id}`, {
      method: 'GET',
    });
  },

  getOrders: async () => {
    return apiRequest('/api/shipping/orders', {
      method: 'GET',
    });
  },

  // Get pending signups
  getPendingSignups: async () => {
    return apiRequest('/api/admin/pending', {
      method: 'GET',
    });
  },

  // Approve user
  approveUser: async (userId) => {
    return apiRequest(`/api/admin/approve/${userId}`, {
      method: 'PATCH',
    });
  },

  // Reject user
  rejectUser: async (userId) => {
    return apiRequest(`/api/admin/reject/${userId}`, {
      method: 'PATCH',
    });
  },

  // Get all users
  getUsers: async () => {
    return apiRequest('/api/admin/users', {
      method: 'GET',
    });
  },

  // Get users with order count
  getUsersWithOrderCount: async () => {
    return apiRequest('/api/admin/users-with-order-count', {
      method: 'GET',
    });
  },

  // Get orders for a specific user (admin)
  getOrdersByUser: async (userId) => {
    return apiRequest(`/api/shipping/orders/user/${userId}`, {
      method: 'GET',
    });
  },

  getUserTickets: async() => {
    return apiRequest('/api/tickets/my-tickets', {
      method: 'GET',
    });
  },

  getTicketMessages: async (ticketId) => {
    return apiRequest(`/api/tickets/${ticketId}/messages`, {
      method: 'GET',
    });
  },

  sendTicketMessage: async (ticketId, formData) => {
  return apiRequest(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: formData, // ✅ send as-is
  });
},

  createTicket: async (payload) => {
  return apiRequest('/api/tickets/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  });
},

  uploadBilling: async (formData) => {
    return apiRequest('/api/billing/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getBillingUploads: async () => {
    return apiRequest('/api/billing/uploads', {
      method: 'GET',
    });
  },

  getNotifications: async () => {
    return apiRequest('/api/notifications', {
      method: 'GET',
    });
  },

  
};

export default api;

