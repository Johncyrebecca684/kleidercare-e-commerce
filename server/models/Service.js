import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Wash', 'Wash + Iron', 'Dry Clean', 'Ironing', 'Pickup & Delivery', 'Laundry Packages', 'Commercial Care'],
    default: 'Wash'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    enum: ['per kg', 'per piece', 'per pair', 'per package', 'fixed'],
    default: 'per kg'
  },
  turnaroundHours: {
    type: Number,
    default: 24
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'Sparkles'
  },
  branches: {
    type: [String],
    default: ['All']
  }
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
