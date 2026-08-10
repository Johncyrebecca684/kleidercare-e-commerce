import { API_URL } from '../config';
const API_BASE = `${API_URL}/api/products`;

function getToken() {
  return localStorage.getItem('kc_auth_token');
}

async function apiCall(endpoint = '', options = {}) {
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

export async function getAllProducts() {
  return await apiCall();
}

export async function addProduct(productData) {
  return await apiCall('', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
}

export async function updateProduct(id, productData) {
  return await apiCall(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
}

export async function updateProductStock(id, stock) {
  return await apiCall(`/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock })
  });
}

export async function bulkProductAction(ids, action, payload = {}) {
  return await apiCall('/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids, action, payload })
  });
}

export async function deleteProduct(id) {
  return await apiCall(`/${id}`, {
    method: 'DELETE'
  });
}
