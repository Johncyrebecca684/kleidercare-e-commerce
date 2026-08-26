import { API_URL } from '../config';
const API_BASE = `${API_URL}/api/auth`;

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

// Helper for API calls with timeout
async function apiCall(endpoint, options = {}, timeoutMs = 8000) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let data = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text || `HTTP Error ${response.status}: ${response.statusText}` };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
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

export async function forgotPassword(email) {
  const data = await apiCall('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  return data;
}

export async function resetPassword({ email, otp, password }) {
  const data = await apiCall('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password })
  });
  return data;
}

export async function updateAddresses(addresses) {
  const data = await apiCall('/addresses', {
    method: 'POST',
    body: JSON.stringify({ addresses })
  });
  return data;
}

export async function addWalletBalance(amount) {
  const data = await apiCall('/wallet', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
  return data;
}

export async function updateProfile({ firstName, lastName, mobileNumber }) {
  const data = await apiCall('/update-profile', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, mobileNumber })
  });
  return data;
}

export function logout() {
  removeToken();
}

export function isAuthenticated() {
  return !!getToken();
}
