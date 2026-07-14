const API_BASE = '/api/products';

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
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

export async function deleteProduct(id) {
  return await apiCall(`/${id}`, {
    method: 'DELETE'
  });
}
