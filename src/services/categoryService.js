import { API_URL } from '../config';
import { categories as defaultCategoriesList } from '../data/products';

const API_BASE = `${API_URL}/api/categories`;

function getToken() {
  try {
    return localStorage.getItem('kc_auth_token');
  } catch {
    return null;
  }
}

async function apiCall(endpoint = '', options = {}, timeoutMs = 8000) {
  try {
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

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return Array.isArray(data) ? data : (data.categories || data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAllCategories() {
  const data = await apiCall();
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  // Return formatted default categories on fallback
  return defaultCategoriesList.filter(c => c !== 'All').map(c => ({
    name: c,
    slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: `Commercial catalog category for ${c}`
  }));
}

export async function addCategory(categoryData) {
  return await apiCall('', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }, 10000);
}

export async function deleteCategory(id) {
  return await apiCall(`/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }, 10000);
}
