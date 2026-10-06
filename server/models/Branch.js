import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchId: {
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
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  pincode: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  managerName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
