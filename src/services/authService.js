const API_BASE = '/api/auth';

// Store token in localStorage
function setToken(token) {
  localStorage.setItem('kc_auth_token', token);
}

function getToken() {
  return localStorage.getItem('kc_auth_token');
}

function removeToken() {
  localStorage.removeItem('kc_auth_token');
}

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ─── Auth API Functions ───

export async function signup({ firstName, lastName, email, password, role, mobileNumber }) {
  const data = await apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password, role, mobileNumber })
  });
  return data;
}

export async function login({ email, password }) {
  const data = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
}

export async function verifyOtp({ email, otp, purpose }) {
  const data = await apiCall('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp, purpose })
  });

  // Store JWT token on successful verification
  if (data.token) {
    setToken(data.token);
  }

  return data;
}

export async function resendOtp({ email, purpose }) {
  const data = await apiCall('/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose })
  });
  return data;
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const data = await apiCall('/me');
    return data.user;
  } catch {
    // Token expired or invalid
    removeToken();
    return null;
  }
}

export async function updateCartWishlist({ cart, wishlist }) {
  try {
    const data = await apiCall('/cart-wishlist', {
      method: 'POST',
      body: JSON.stringify({ cart, wishlist })
    });
    return data;
  } catch (error) {
    console.error('Error in updateCartWishlist api call:', error);
    throw error;
  }
}

export function logout() {
  removeToken();
}

export function isAuthenticated() {
  return !!getToken();
}
