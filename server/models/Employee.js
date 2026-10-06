import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  employeeId: {
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Operations',
    trim: true
  },
  designation: {
    type: String,
    default: 'Staff',
    trim: true
  },
  role: {
    type: String,
    enum: [
      'SUPER_ADMIN',
      'OWNER',
      'ADMIN',
      'MANAGER',
      'RECEPTIONIST',
      'SALES_EXECUTIVE',
      'CUSTOMER_SUPPORT',
      'ACCOUNTANT',
      'DELIVERY_MANAGER',
      'DELIVERY_EXECUTIVE',
      'MARKETING_EXECUTIVE',
      'INVENTORY_MANAGER'
    ],
    default: 'MANAGER'
  },
  branches: {
    type: [String],
    default: ['Main Branch - Mumbai']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  permissions: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password before saving
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
