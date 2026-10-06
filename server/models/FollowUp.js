import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  followUpId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerMobile: {
    type: String,
    default: ''
  },
  customerEmail: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  assignedEmployeeName: {
    type: String,
    default: 'Unassigned'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  taskDetails: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    default: () => new Date(+new Date() + 2 * 24 * 60 * 60 * 1000)
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  category: {
    type: String,
    enum: ['General Follow-up', 'Package Inquiries', 'Payment Reminder', 'Service Feedback', 'Win-back Inactive', 'Abandoned Cart Follow-up'],
    default: 'General Follow-up'
  },
  channel: {
    type: String,
    enum: ['WhatsApp', 'Email', 'SMS', 'Phone Call', 'In-Person'],
    default: 'WhatsApp'
  },
  messageContent: {
    type: String,
    default: ''
  },
  dispatchStatus: {
    type: String,
    enum: ['Not Sent', 'Sent', 'Delivered', 'Read', 'Failed'],
    default: 'Not Sent'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const FollowUp = mongoose.model('FollowUp', followUpSchema);
export default FollowUp;
