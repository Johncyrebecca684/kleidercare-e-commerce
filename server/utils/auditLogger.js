import AuditLog from '../models/AuditLog.js';

/**
 * Log employee action into AuditLog collection
 */
export async function logAudit({
  employee,
  action,
  module,
  recordId = '',
  oldValue = null,
  newValue = null,
  description = '',
  req = null
}) {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    
    const employeeId = employee?._id || employee?.id || null;
    const employeeName = employee ? `${employee.name || employee.firstName || 'Employee'} (${employee.role || 'Staff'})` : 'System';
    const employeeEmail = employee?.email || '';
    const employeeRole = employee?.role || 'ADMIN';

    const logEntry = new AuditLog({
      employee: employeeId,
      employeeName,
      employeeEmail,
      employeeRole,
      action,
      module,
      recordId: String(recordId || ''),
      oldValue,
      newValue,
      ipAddress: String(ipAddress),
      description: description || `${action} in ${module}`
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('⚠️ Failed to save audit log entry:', error.message);
    return null;
  }
}
