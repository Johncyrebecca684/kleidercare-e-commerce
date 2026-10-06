import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  employeeName: {
    type: String,
    required: true,
    default: 'System Admin'
  },
  employeeEmail: {
    type: String,
    default: ''
  },
  employeeRole: {
    type: String,
    default: 'ADMIN'
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: [
      'AUTH',
      'CUSTOMERS',
      'ORDERS',
      'PRODUCTS',
      'SERVICES',
      'PAYMENTS',
      'DELIVERY',
      'CRM',
      'TASKS',
      'EXPENSES',
      'EMPLOYEES',
      'BRANCHES',
      'SETTINGS',
      'REPORTS'
    ],
    required: true
  },
  recordId: {
    type: String,
    default: ''
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
