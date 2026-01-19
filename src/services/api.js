const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://shipping-b.vercel.app';

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

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
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
    return apiRequest('/api/calculate-rate', {
      method: 'POST',
      body: JSON.stringify(rateData),
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
};

export default api;

