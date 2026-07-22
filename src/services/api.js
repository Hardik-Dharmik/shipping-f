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

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
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
    data.append('organization_type', formData.organizationMode);

    if (formData.organizationMode === 'new') {
      data.append('organization_action', 'create');
      data.append('organization_name', formData.organizationName);
      data.append('company_name', formData.organizationName);
    } else {
      data.append('organization_action', 'join');
      data.append('organization_id', formData.organizationId);
      data.append('org_id', formData.organizationId);
      data.append('is_employee', 'true');
      data.append('employee_of_org', 'true');
      data.append('kyc_required', 'false');
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
    return apiRequest('/api/address/address-forms', {
      method: 'POST',
    });
  },

  getPublicAddressForm: async (code) => {
    return apiRequest(`/api/address/address-forms/public/${code}`, {
      method: 'GET',
    });
  },

  submitPublicAddressForm: async (code, payload) => {
    return apiRequest(`/api/address/address-forms/public/${code}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAddressForms: async (params = {}) => {
    return apiRequest(`/api/address/address-forms${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  getAddressFormById: async (id) => {
    return apiRequest(`/api/address/address-forms/${id}`, {
      method: 'GET',
    });
  },

  saveBoxDetails: async (payload) => {
    return apiRequest('/api/box-details', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBoxDetails: async () => {
    return apiRequest('/api/box-details', {
      method: 'GET',
    });
  },

  getBoxDetailByCode: async (code) => {
    return apiRequest(`/api/box-details/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  },

  getContactDetailSuggestions: async (query, contactType) => {
    return apiRequest(
      `/api/contact-details/suggestions${buildQueryString({ query, contactType })}`,
      {
        method: 'GET',
      }
    );
  },

  getContactDetailById: async (id) => {
    return apiRequest(`/api/contact-details/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },

  saveContactDetail: async (payload) => {
    return apiRequest('/api/contact-details', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getContactDetails: async (params = {}) => {
    return apiRequest(`/api/contact-details${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  updateContactDetail: async (id, payload) => {
    return apiRequest(`/api/contact-details/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteContactDetail: async (id) => {
    return apiRequest(`/api/contact-details/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  updateAddressFormStatus: async (id, status) => {
    return apiRequest(`/api/address/address-forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getOrders: async (params = {}) => {
    return apiRequest(`/api/shipping/orders${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  // Get all users
  getUsers: async (params = {}) => {
    return apiRequest(`/api/admin/users${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  // Get users with order count
  getUsersWithOrderCount: async (params = {}) => {
    return apiRequest(`/api/admin/users-with-order-count${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  // Get orders for a specific user (admin)
  getOrdersByUser: async (userId, params = {}) => {
    return apiRequest(`/api/shipping/orders/user/${userId}${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  getUserTickets: async(params={}) => {
    return apiRequest(`/api/tickets/my-tickets${buildQueryString(params)}`, {
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

  submitKycRequest: async (formData) => {
    return apiRequest('/api/kyc/request', {
      method: 'POST',
      body: formData,
    });
  },

  getMyKyc: async () => {
    return apiRequest('/api/kyc/me', {
      method: 'GET',
    });
  },

  getKycRequests: async () => {
    return apiRequest('/api/kyc/requests', {
      method: 'GET',
    });
  },

  updateKycStatus: async (userId, status) => {
    return apiRequest(`/api/kyc/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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

