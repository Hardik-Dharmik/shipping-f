import config from '../config/env.js';

const API_BASE_URL = config.api.baseUrl;
let forbiddenHandler;
export function setForbiddenHandler(handler) { forbiddenHandler = handler; }

// Helper function to get token from localStorage
export function getToken() {
  return localStorage.getItem('token');
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const { anonymous = false, ...fetchOptions } = options;
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
  const token = anonymous ? null : getToken();
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const requestConfig = {
    ...defaultOptions,
    ...fetchOptions,
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
    
    if (response.status === 403 && token && token === getToken() && endpoint !== '/api/auth/me') await forbiddenHandler?.();
    if (!response.ok || data.success === false) {
      // Handle different error response formats
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      const isAuthError = response.status === 401 || errorMessage === 'Token expired';
      if (isAuthError && !anonymous) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
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
  getMe: () => apiRequest('/api/auth/me'),
  getEmployeePages: () => apiRequest('/api/admin/employees/pages'),
  getEmployees: () => apiRequest('/api/admin/employees'),
  getEmployee: (id) => apiRequest('/api/admin/employees/' + encodeURIComponent(id)),
  createEmployee: (body) => apiRequest('/api/admin/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateEmployee: (id, body) => apiRequest('/api/admin/employees/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEmployee: (id) => apiRequest('/api/admin/employees/' + encodeURIComponent(id), { method: 'DELETE' }),
  createCustomer: (customer) => apiRequest('/api/customers', { method: 'POST', body: JSON.stringify(customer) }),
  getCustomers: (params = {}) => apiRequest('/api/customers' + buildQueryString(params)),
  getCustomerSuggestions: (query = '', limit = 10) => apiRequest('/api/customers/suggestions' + buildQueryString({ query, limit })),
  getCustomer: (id) => apiRequest('/api/customers/' + encodeURIComponent(id)),
  getOrder: (id) => apiRequest('/api/shipping/orders/' + encodeURIComponent(id)),
  createAddressForm: (payload) => apiRequest('/api/address/address-forms', { method: 'POST', body: JSON.stringify(payload) }),

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
    return apiRequest('/api/shipping/quote/validated', {
      method: 'POST',
      body: JSON.stringify(rateData),
    });
  },
  // Calculate rate
  calculateRate1: async (rateData) => {
    return apiRequest('/api/shipping/quote', {
      method: 'POST',
      body: JSON.stringify(rateData),
    });
  },

  createManualOrder: (body) => apiRequest('/api/shipping/order/manual', { method: 'POST', body }),

  createOrder: async (orderData) => {
    const isFormData = orderData instanceof FormData;
    return apiRequest('/api/shipping/order', {
      method: 'POST',
      body: isFormData ? orderData : JSON.stringify(orderData),
    });
  },

  // Address form links
  getAddressFormServices: async () => {
    return apiRequest('/api/address/address-forms/services', { method: 'GET' });
  },

  createOrderAddressLink: async (order) => {
    return apiRequest('/api/address/address-forms/order-link', {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  },

  getPickups: async (params = {}) => {
    return apiRequest(`/api/shipping/pickups${buildQueryString(params)}`, { method: 'GET' });
  },

  getPickupOrderDetails: async (awbNumber) => {
    return apiRequest(`/api/shipping/pickups/order-details/${encodeURIComponent(awbNumber)}`, { method: 'GET' });
  },

  createPickup: async (pickupData) => {
    return apiRequest('/api/shipping/pickups', {
      method: 'POST',
      body: JSON.stringify(pickupData),
    });
  },

  updatePickup: async (pickupId, pickupData) => {
    return apiRequest(`/api/shipping/pickups/${encodeURIComponent(pickupId)}`, {
      method: 'PUT',
      body: JSON.stringify(pickupData),
    });
  },

  cancelPickup: async (pickupId) => {
    return apiRequest(`/api/shipping/pickups/${encodeURIComponent(pickupId)}`, { method: 'DELETE' });
  },

  getPublicAddressForm: async (code) => {
    return apiRequest(`/api/address/address-forms/public/${code}`, {
      method: 'GET', anonymous: true,
    });
  },

  submitPublicAddressForm: async (code, payload) => {
    return apiRequest(`/api/address/address-forms/public/${code}`, {
      method: 'POST', anonymous: true,
      body: JSON.stringify(payload),
    });
  },

  getAddressForms: async (params = {}) => {
    return apiRequest(`/api/address/address-forms${buildQueryString(params)}`, {
      method: 'GET',
    });
  },

  saveRateCalculatorDetails: async (rateData) => {
    return apiRequest('/api/shipping/rate-calculator/save', {
      method: 'POST',
      body: JSON.stringify(rateData),
    });
  },

  getRateCalculatorDetails: async (code) => {
    return apiRequest(`/api/shipping/rate-calculator/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  },

  getSavedRateCalculatorDetails: async () => {
    return apiRequest('/api/shipping/rate-calculator/saved', {
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

  getCountrySuggestions: async (text, limit = 10) => {
    return apiRequest(`/api/locations/country-suggestions${buildQueryString({ text, limit })}`, {
      method: 'GET',
    });
  },

  getCitySuggestions: async (text, countrycode = 'in', limit = 10) => {
    return apiRequest(`/api/locations/city-suggestions${buildQueryString({ text, countrycode, limit })}`, {
      method: 'GET',
    });
  },

  getPincodeSuggestions: async (text, countrycode = 'in', limit = 10) => {
    return apiRequest(`/api/locations/pincode-suggestions${buildQueryString({ text, countrycode, limit })}`, {
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

  extractText: async(formData) =>{
    return apiRequest("/api/ai/extract-text", {
        method: "POST",
        body: formData
    });
  }
  
};

export default api;


// Quotes require authentication; location suggestions remain public.
export const publicCalculatorApi = {
  calculateRate: (rateData) => apiRequest('/api/shipping/quote/validated', {
    method: 'POST', body: JSON.stringify(rateData),
  }),
  getCountrySuggestions: (text, limit = 10) => apiRequest(
    '/api/locations/country-suggestions' + buildQueryString({ text, limit }),
    { method: 'GET', anonymous: true },
  ),
  getPincodeSuggestions: (text, countrycode = 'in', limit = 10) => apiRequest(
    '/api/locations/pincode-suggestions' + buildQueryString({ text, countrycode, limit }),
    { method: 'GET', anonymous: true },
  ),
};
