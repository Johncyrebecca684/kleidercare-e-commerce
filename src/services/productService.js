import { API_URL } from '../config';
import { defaultProducts } from '../data/products';

const API_BASE = `${API_URL}/api/products`;
const CACHE_KEY = 'kc_app_products';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL

let inMemoryCache = null;
let lastFetchTime = 0;

function getToken() {
  try {
    return localStorage.getItem('kc_auth_token');
  } catch {
    return null;
  }
}

/**
 * Fetch with automatic AbortController timeout to prevent hanging on slow/lossy networks
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiCall(endpoint = '', options = {}, timeoutMs = 8000) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  }, timeoutMs);

  let data = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || `HTTP Error ${response.status}: ${response.statusText}` };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }

  return data;
}

/**
 * Retrieve cached products from memory, localStorage, or bundled default catalog
 */
export function getLocalCachedProducts() {
  if (inMemoryCache && Array.isArray(inMemoryCache) && inMemoryCache.length > 0) {
    return inMemoryCache;
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading cached products from localStorage:', e);
  }

  // Fallback to bundled default catalog
  if (Array.isArray(defaultProducts) && defaultProducts.length > 0) {
    inMemoryCache = defaultProducts;
    return defaultProducts;
  }

  return [];
}

/**
 * Get all products with resilient Stale-While-Revalidate and slow network fallback
 */
export async function getAllProducts() {
  // Try network fetch with timeout
  try {
    const data = await apiCall('', {}, 8000);
    if (Array.isArray(data) && data.length > 0) {
      inMemoryCache = data;
      lastFetchTime = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save products to localStorage:', e);
      }
      return data;
    }
  } catch (error) {
    console.warn('Network fetch for products failed/timed out. Falling back to cached catalog:', error.message || error);
  }

  // Fall back to cached or bundled products on network error/timeout
  const cached = getLocalCachedProducts();
  return cached;
}

export async function addProduct(productData) {
  const result = await apiCall('', {
    method: 'POST',
    body: JSON.stringify(productData)
  }, 10000);
  
  // Invalidate in-memory cache
  inMemoryCache = null;
  return result;
}

export async function updateProduct(id, productData) {
  const result = await apiCall(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }, 10000);
  
  inMemoryCache = null;
  return result;
}

export async function updateProductStock(id, stock) {
  const result = await apiCall(`/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock })
  }, 8000);
  
  inMemoryCache = null;
  return result;
}

export async function bulkProductAction(ids, action, payload = {}) {
  const result = await apiCall('/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids, action, payload })
  }, 12000);
  
  inMemoryCache = null;
  return result;
}

export async function deleteProduct(id, deleteAllDuplicates = false) {
  const query = deleteAllDuplicates ? '?deleteAllDuplicates=true' : '';
  const result = await apiCall(`/${id}${query}`, {
    method: 'DELETE'
  }, 10000);
  
  inMemoryCache = null;
  return result;
}

export async function cleanupDuplicateProducts() {
  const result = await apiCall('/cleanup-duplicates', {
    method: 'POST'
  }, 15000);
  
  inMemoryCache = null;
  return result;
}
