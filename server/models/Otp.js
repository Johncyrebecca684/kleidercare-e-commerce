import mongoose from 'mongoose';
import crypto from 'crypto';

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
  // For signup: store pending user data here until OTP is verified.
  // The real User record is only created AFTER successful OTP verification.
  pendingUser: {
    firstName: String,
    lastName: String,
    password: String,   // stored as plaintext temporarily; hashed by User model on save
    role: String,
    mobileNumber: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes (TTL index)
  }
});

// Hash OTP with SHA-256 before saving (fast, sufficient for short-lived OTPs)
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

otpSchema.pre('save', function(next) {
  if (!this.isModified('otp')) return next();
  this.otp = hashOtp(this.otp);
  next();
});

// Compare OTP method
otpSchema.methods.compareOtp = function(candidateOtp) {
  return hashOtp(candidateOtp) === this.otp;
};

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
