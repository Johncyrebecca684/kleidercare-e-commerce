import mongoose from 'mongoose';

const employeeNotificationSchema = new mongoose.Schema({
  recipientEmployeeId: {
    type: String,
    default: 'ALL' // or specific employee ID
  },
  recipientRole: {
    type: String,
    default: 'ALL'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ORDER', 'PAYMENT', 'DELIVERY', 'TASK', 'CRM', 'EXPENSE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  link: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const EmployeeNotification = mongoose.model('EmployeeNotification', employeeNotificationSchema);
export default EmployeeNotification;
