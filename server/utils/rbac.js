// Role-Based Access Control (RBAC) definitions and middleware

export const ALL_PERMISSIONS = [
  'CUSTOMER_VIEW',
  'CUSTOMER_CREATE',
  'CUSTOMER_EDIT',
  'CUSTOMER_DELETE',
  'ORDER_VIEW',
  'ORDER_CREATE',
  'ORDER_EDIT',
  'ORDER_CANCEL',
  'PRODUCT_VIEW',
  'PRODUCT_CREATE',
  'PRODUCT_EDIT',
  'PRODUCT_DELETE',
  'SERVICE_VIEW',
  'SERVICE_CREATE',
  'SERVICE_EDIT',
  'PAYMENT_VIEW',
  'PAYMENT_CREATE',
  'PAYMENT_REFUND',
  'DELIVERY_VIEW',
  'DELIVERY_ASSIGN',
  'DELIVERY_UPDATE',
  'CRM_VIEW',
  'CRM_MANAGE',
  'REPORT_VIEW',
  'REPORT_EXPORT',
  'EXPENSE_VIEW',
  'EXPENSE_CREATE',
  'EXPENSE_APPROVE',
  'EMPLOYEE_VIEW',
  'EMPLOYEE_CREATE',
  'EMPLOYEE_EDIT',
  'EMPLOYEE_DELETE',
  'SETTINGS_VIEW',
  'SETTINGS_EDIT'
];

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  MANAGER: [
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
    'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_EDIT', 'ORDER_CANCEL',
    'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT',
    'SERVICE_VIEW', 'SERVICE_CREATE', 'SERVICE_EDIT',
    'PAYMENT_VIEW', 'PAYMENT_CREATE',
    'DELIVERY_VIEW', 'DELIVERY_ASSIGN', 'DELIVERY_UPDATE',
    'CRM_VIEW', 'CRM_MANAGE',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'EXPENSE_VIEW', 'EXPENSE_CREATE',
    'EMPLOYEE_VIEW',
    'SETTINGS_VIEW'
  ],
  RECEPTIONIST: [
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
    'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_EDIT',
    'SERVICE_VIEW',
    'PAYMENT_VIEW', 'PAYMENT_CREATE',
    'DELIVERY_VIEW',
    'CRM_VIEW'
  ],
  SALES_EXECUTIVE: [
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
    'ORDER_VIEW', 'ORDER_CREATE',
    'PRODUCT_VIEW',
    'SERVICE_VIEW',
    'PAYMENT_VIEW',
    'CRM_VIEW', 'CRM_MANAGE'
  ],
  CUSTOMER_SUPPORT: [
    'CUSTOMER_VIEW', 'CUSTOMER_EDIT',
    'ORDER_VIEW',
    'PRODUCT_VIEW',
    'SERVICE_VIEW',
    'DELIVERY_VIEW',
    'CRM_VIEW', 'CRM_MANAGE'
  ],
  ACCOUNTANT: [
    'CUSTOMER_VIEW',
    'ORDER_VIEW',
    'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_REFUND',
    'EXPENSE_VIEW', 'EXPENSE_CREATE', 'EXPENSE_APPROVE',
    'REPORT_VIEW', 'REPORT_EXPORT'
  ],
  DELIVERY_MANAGER: [
    'CUSTOMER_VIEW',
    'ORDER_VIEW',
    'DELIVERY_VIEW', 'DELIVERY_ASSIGN', 'DELIVERY_UPDATE',
    'REPORT_VIEW'
  ],
  DELIVERY_EXECUTIVE: [
    'DELIVERY_VIEW', 'DELIVERY_UPDATE'
  ],
  MARKETING_EXECUTIVE: [
    'CUSTOMER_VIEW',
    'CRM_VIEW', 'CRM_MANAGE',
    'PRODUCT_VIEW',
    'SERVICE_VIEW',
    'REPORT_VIEW'
  ],
  INVENTORY_MANAGER: [
    'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE',
    'SERVICE_VIEW',
    'REPORT_VIEW'
  ]
};

/**
 * Check if an employee has a specific permission
 */
export function hasPermission(employee, requiredPermission) {
  if (!employee) return false;

  // Super Admin / Owner / Admin have full access
  const role = employee.role || '';
  if (role === 'SUPER_ADMIN' || role === 'OWNER' || role === 'ADMIN' || role === 'admin') {
    return true;
  }

  // Check custom granted permissions on the employee record
  if (Array.isArray(employee.permissions) && employee.permissions.includes(requiredPermission)) {
    return true;
  }

  // Check role-based default permissions
  const defaultRolePerms = ROLE_PERMISSIONS[role] || [];
  return defaultRolePerms.includes(requiredPermission);
}

/**
 * Express middleware to enforce permission on backend routes
 */
export function requirePermission(requiredPermission) {
  return (req, res, next) => {
    const employee = req.employee || req.user;
    if (!employee) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(employee, requiredPermission)) {
      return res.status(403).json({
        message: `Forbidden: Missing required permission [${requiredPermission}]`,
        requiredPermission
      });
    }

    next();
  };
}
