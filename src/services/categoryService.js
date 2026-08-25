import { API_URL } from '../config';
const API_BASE = `${API_URL}/api/categories`;

function getToken() {
  return localStorage.getItem('kc_auth_token');
}

async function apiCall(endpoint = '', options = {}) {
  try {
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

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return Array.isArray(data) ? data : (data.categories || data);
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function getAllCategories() {
  return await apiCall();
}

export async function addCategory(categoryData) {
  return await apiCall('', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  });
}

export async function deleteCategory(id) {
  return await apiCall(`/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}
