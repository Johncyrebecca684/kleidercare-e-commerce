import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  deliveryId: {
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    address: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'COD', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    default: 'COD'
  },
  deliveryDate: {
    type: Date,
    default: Date.now
  },
  timeSlot: {
    type: String,
    default: '10:00 AM - 01:00 PM'
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
  status: {
    type: String,
    enum: ['READY', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED'],
    default: 'READY'
  },
  branch: {
    type: String,
    default: 'Main Branch - Mumbai'
  },
  notes: {
    type: String,
    default: ''
  },
  history: [
    {
      status: { type: String, required: true },
      updatedBy: { type: String, default: 'System' },
      employeeId: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
      remarks: { type: String, default: '' }
    }
  ]
}, {
  timestamps: true
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
