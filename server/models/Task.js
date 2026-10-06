import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  assignedToName: {
    type: String,
    default: 'Unassigned'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  createdByName: {
    type: String,
    default: 'Admin'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  dueDate: {
    type: Date,
    default: () => new Date(+new Date() + 3 * 24 * 60 * 60 * 1000)
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'TODO'
  },
  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  relatedCustomerName: {
    type: String,
    default: ''
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  relatedOrderNumber: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: 'Main Branch - Mumbai'
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
