import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  orderNumber: {
    type: String,
    required: true,
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
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Online', 'Razorpay', 'COD', 'Bank Transfer'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'],
    default: 'SUCCESS'
  },
  type: {
    type: String,
    enum: ['PAYMENT', 'REFUND'],
    default: 'PAYMENT'
  },
  referenceId: {
    type: String,
    default: ''
  },
  refundOriginalTransactionId: {
    type: String,
    default: ''
  },
  refundReason: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  processedByName: {
    type: String,
    default: 'System Admin'
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
export default PaymentTransaction;
