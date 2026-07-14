import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'password_reset'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes (TTL index)
  }
});

// Hash OTP before saving
otpSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) return next();
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
  next();
});

// Compare OTP method
otpSchema.methods.compareOtp = async function(candidateOtp) {
  return bcrypt.compare(candidateOtp, this.otp);
};

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
