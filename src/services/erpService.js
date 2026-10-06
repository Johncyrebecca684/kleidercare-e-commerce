import { API_URL } from '../config';

const ERP_API_BASE = `${API_URL}/api/erp`;

export function setErpToken(token) {
  localStorage.setItem('kc_erp_token', token);
}

export function getErpToken() {
  return localStorage.getItem('kc_erp_token');
}

export function removeErpToken() {
  localStorage.removeItem('kc_erp_token');
  localStorage.removeItem('kc_erp_employee');
}

export function getErpStoredEmployee() {
  try {
    const raw = localStorage.getItem('kc_erp_employee');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setErpStoredEmployee(emp) {
  localStorage.setItem('kc_erp_employee', JSON.stringify(emp));
}

export function isErpAuthenticated() {
  return !!getErpToken();
}

export function erpLogout() {
  removeErpToken();
}

// Universal API fetcher for ERP
async function erpCall(endpoint, options = {}, timeoutMs = 12000) {
  const token = getErpToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${ERP_API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('ERP request timed out. Please check network connection.');
    }
    throw new Error(err.message || 'Network error communicating with ERP server');
  } finally {
    clearTimeout(timeoutId);
  }

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
      data = { message: text || `HTTP Error ${response.status}` };
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeErpToken();
    }
    throw new Error(data.message || `Server error (${response.status})`);
  }

  return data;
}

// ─────────────────────────────────────────────
// AUTH & PROFILE
// ─────────────────────────────────────────────

export async function erpLogin({ emailOrMobile, password }) {
  const data = await erpCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrMobile, password })
  });

  if (data && data.token) {
    setErpToken(data.token);
    if (data.employee) {
      setErpStoredEmployee(data.employee);
    }
  }
  return data;
}

export async function erpGetMe() {
  const data = await erpCall('/auth/me');
  if (data && data.employee) {
    setErpStoredEmployee(data.employee);
  }
  return data;
}

export async function erpUpdateProfile(profileData) {
  const data = await erpCall('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
  if (data && data.employee) {
    setErpStoredEmployee(data.employee);
  }
  return data;
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export async function erpGetDashboardMetrics() {
  return await erpCall('/dashboard/metrics');
}

// ─────────────────────────────────────────────
// EMPLOYEES & RBAC
// ─────────────────────────────────────────────

export async function erpGetEmployees(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/employees${query ? `?${query}` : ''}`);
}

export async function erpCreateEmployee(employeeData) {
  return await erpCall('/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData)
  });
}

export async function erpUpdateEmployee(id, employeeData) {
  return await erpCall(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData)
  });
}

export async function erpDeleteEmployee(id) {
  return await erpCall(`/employees/${id}`, {
    method: 'DELETE'
  });
}

export async function erpGetRolesPermissions() {
  return await erpCall('/roles/permissions');
}

// ─────────────────────────────────────────────
// CUSTOMERS & CRM
// ─────────────────────────────────────────────

export async function erpGetCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/customers${query ? `?${query}` : ''}`);
}

export async function erpGetCustomerById(id) {
  return await erpCall(`/customers/${id}`);
}

export async function erpCreateCustomer(customerData) {
  return await erpCall('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
}

export async function erpUpdateCustomer(id, customerData) {
  return await erpCall(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
  });
}

export async function erpGetCrmFollowUps(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/crm/follow-ups${query ? `?${query}` : ''}`);
}

export async function erpCreateCrmFollowUp(data) {
  return await erpCall('/crm/follow-ups', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function erpUpdateCrmFollowUp(id, data) {
  return await erpCall(`/crm/follow-ups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function erpSendRetentionMessage(data) {
  return await erpCall('/crm/send-message', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export async function erpGetOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/orders${query ? `?${query}` : ''}`);
}

export async function erpGetOrderById(id) {
  return await erpCall(`/orders/${id}`);
}

export async function erpCreateOrder(orderData) {
  return await erpCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function erpUpdateOrderStatus(id, status, remarks = '') {
  return await erpCall(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, remarks })
  });
}

// ─────────────────────────────────────────────
// PRODUCTS & SERVICES
// ─────────────────────────────────────────────

export async function erpGetProducts() {
  return await erpCall('/products');
}

export async function erpCreateProduct(productData) {
  return await erpCall('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
}

export async function erpUpdateProduct(id, productData) {
  return await erpCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
}

export async function erpGetServices() {
  return await erpCall('/services');
}

export async function erpCreateService(serviceData) {
  return await erpCall('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData)
  });
}

export async function erpUpdateService(id, serviceData) {
  return await erpCall(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData)
  });
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export async function erpGetPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/payments${query ? `?${query}` : ''}`);
}

export async function erpRecordPayment(paymentData) {
  return await erpCall('/payments/record', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
}

export async function erpProcessRefund(refundData) {
  return await erpCall('/payments/refund', {
    method: 'POST',
    body: JSON.stringify(refundData)
  });
}

// ─────────────────────────────────────────────
// DELIVERIES
// ─────────────────────────────────────────────

export async function erpGetDeliveries(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/deliveries${query ? `?${query}` : ''}`);
}

export async function erpCreateDelivery(deliveryData) {
  return await erpCall('/deliveries', {
    method: 'POST',
    body: JSON.stringify(deliveryData)
  });
}

export async function erpAssignDelivery(id, assignmentData) {
  return await erpCall(`/deliveries/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData)
  });
}

export async function erpUpdateDeliveryStatus(id, status, remarks = '') {
  return await erpCall(`/deliveries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, remarks })
  });
}

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────

export async function erpGetTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/tasks${query ? `?${query}` : ''}`);
}

export async function erpCreateTask(taskData) {
  return await erpCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}

export async function erpUpdateTask(id, taskData) {
  return await erpCall(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
}

export async function erpDeleteTask(id) {
  return await erpCall(`/tasks/${id}`, {
    method: 'DELETE'
  });
}

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

export async function erpGetExpenses(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/expenses${query ? `?${query}` : ''}`);
}

export async function erpCreateExpense(expenseData) {
  return await erpCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData)
  });
}

export async function erpApproveExpense(id, approvalStatus, approvalRemarks = '') {
  return await erpCall(`/expenses/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approvalStatus, approvalRemarks })
  });
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

export async function erpGetReports() {
  return await erpCall('/reports/all');
}

// ─────────────────────────────────────────────
// AUDIT LOGS, NOTIFICATIONS, BRANCHES, SEARCH
// ─────────────────────────────────────────────

export async function erpGetAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/audit-logs${query ? `?${query}` : ''}`);
}

export async function erpGetNotifications() {
  return await erpCall('/notifications');
}

export async function erpMarkNotificationsRead() {
  return await erpCall('/notifications/mark-read', {
    method: 'PUT'
  });
}

export async function erpGetBranches() {
  return await erpCall('/branches');
}

export async function erpCreateBranch(branchData) {
  return await erpCall('/branches', {
    method: 'POST',
    body: JSON.stringify(branchData)
  });
}

export async function erpGlobalSearch(q) {
  return await erpCall(`/search?q=${encodeURIComponent(q)}`);
}

// ─────────────────────────────────────────────
// QUOTATIONS API CALLS
// ─────────────────────────────────────────────

export async function erpGetQuotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await erpCall(`/quotes${query ? `?${query}` : ''}`);
}

export async function erpGetQuoteById(id) {
  return await erpCall(`/quotes/${id}`);
}

export async function erpCreateQuote(quoteData) {
  return await erpCall('/quotes', {
    method: 'POST',
    body: JSON.stringify(quoteData)
  });
}

export async function erpUpdateQuote(id, quoteData) {
  return await erpCall(`/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quoteData)
  });
}

export async function erpConvertQuote(id, { convertedTo, status }) {
  return await erpCall(`/quotes/${id}/convert`, {
    method: 'PATCH',
    body: JSON.stringify({ convertedTo, status })
  });
}

export async function erpDeleteQuote(id) {
  return await erpCall(`/quotes/${id}`, {
    method: 'DELETE'
  });
}

