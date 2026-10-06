import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Rent',
      'Electricity',
      'Water',
      'Transport',
      'Marketing',
      'Packaging',
      'Maintenance',
      'Salary',
      'Office',
      'Other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  branch: {
    type: String,
    default: 'Main Branch - Mumbai'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'],
    default: 'UPI'
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  employeeName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  approvedByName: {
    type: String,
    default: ''
  },
  approvalRemarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
