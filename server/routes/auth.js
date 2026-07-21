import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

const router = express.Router();

const ALLOWED_RESELLER_NUMBERS = [
  '7797091919',
  '7044428460',
  '8822990080',
  '9900398532',
  '8848526033',
  '7006325301',
  '7904309363',
  '8148814205',
  '4448606351',
  '9901097311'
];

// Configure Nodemailer SMTP transporter
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not fully configured. Nodemailer will run in fallback console mode.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send OTP to client's email address
async function sendOtpEmail(email, otp) {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Kleider Care" <no-reply@kleidercare.com>',
    to: email,
    subject: 'Verify Your Kleider Care Account - OTP Code',
    text: `Your Kleider Care verification code is: ${otp}. This code is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Kleider Care</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Laundry Solutions & E-Commerce</p>
        </div>
        <div style="padding: 10px 0;">
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">To complete your verification, please use the following one-time password (OTP):</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: bold; color: #3b82f6; background-color: #eff6ff; border: 1px dashed #bfdbfe; border-radius: 6px; padding: 12px 30px; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code is valid for <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>&copy; 2026 Kleider Care. All rights reserved.</p>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`📧 [FALLBACK] Email not sent to ${email} (SMTP unconfigured). OTP code: ${otp}`);
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP successfully sent to email: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email via Nodemailer:', error);
    return false;
  }
}

// Send Password Reset OTP to client's email address
async function sendResetPasswordEmail(email, otp) {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Kleider Care" <no-reply@kleidercare.com>',
    to: email,
    subject: 'Reset Your Kleider Care Password - OTP Code',
    text: `Your Kleider Care password reset code is: ${otp}. This code is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0; font-size: 24px;">Kleider Care</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="padding: 10px 0;">
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">We received a request to reset your password. Please use the following one-time password (OTP) to complete the reset process:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: bold; color: #ef4444; background-color: #fef2f2; border: 1px dashed #fca5a5; border-radius: 6px; padding: 12px 30px; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>&copy; 2026 Kleider Care. All rights reserved.</p>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`📧 [FALLBACK] Reset password email not sent to ${email} (SMTP unconfigured). OTP code: ${otp}`);
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset OTP successfully sent to email: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send reset password email via Nodemailer:', error);
    return false;
  }
}

// Generate a random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// JWT auth middleware
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Register a new user and send OTP for verification
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, mobileNumber } = req.body;

    // Validate required fields
    if (!firstName || !email || !password || !mobileNumber) {
      return res.status(400).json({ message: 'First name, email, password, and mobile number are required' });
    }

    const normalizedRole = (role || 'customer').toLowerCase();
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const isAllowedReseller = ALLOWED_RESELLER_NUMBERS.some(num => cleanedMobile.endsWith(num));
    if (normalizedRole === 'reseller' && !isAllowedReseller) {
      return res.status(400).json({ message: 'You are not an authorized reseller. Please register as a customer.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      // If unverified, update their details and send a new OTP
      user.firstName = firstName;
      user.lastName = lastName || '';
      user.password = password;
      user.role = normalizedRole;
      user.mobileNumber = mobileNumber;
      await user.save();
    } else {
      // Create user (unverified)
      user = new User({
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(),
        password,
        role: normalizedRole,
        mobileNumber,
        isVerified: false
      });
      await user.save();
    }

    // Generate and store OTP
    const otpCode = generateOtp();
    
    // Remove any existing OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase() });
    
    // Save new OTP (will be hashed by pre-save hook)
    const otpDoc = new Otp({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'signup'
    });
    await otpDoc.save();

    console.log(`📧 [DEV] OTP for ${email}: ${otpCode}`);

    // Try sending real email
    const emailSent = await sendOtpEmail(email.toLowerCase(), otpCode);

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Verification email sent! Please check your inbox for the OTP.' 
        : 'Account created! Please verify with OTP.',
      email: email.toLowerCase(),
      // Only return devOtp if email configuration is missing
      ...((!process.env.SMTP_USER || !process.env.SMTP_PASS) && { devOtp: otpCode })
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Verify credentials and return JWT token
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email. Please sign up first.' });
    }

    // Verify reseller contact if user is logging in as reseller
    if (user.role === 'reseller') {
      const userCleanedMobile = (user.mobileNumber || '').replace(/\D/g, '');
      const isAllowedResellerLogin = ALLOWED_RESELLER_NUMBERS.some(num => userCleanedMobile.endsWith(num));
      if (!isAllowedResellerLogin) {
        return res.status(403).json({ message: 'You are not an authorized reseller. Please login as a customer.' });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp
// Verify OTP and return JWT token
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the most recent OTP for this email
    const otpDoc = await Otp.findOne({ 
      email: email.toLowerCase(),
      ...(purpose && { purpose })
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: 'OTP has expired or does not exist. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await otpDoc.compareOtp(otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // Mark user as verified (for signup flow)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Clean up used OTP
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Generate JWT
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully!',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/resend-otp
// Resend a new OTP
// ─────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otpCode = generateOtp();

    // Remove old OTPs
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    const otpDoc = new Otp({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: purpose || 'login'
    });
    await otpDoc.save();

    console.log(`📧 [DEV] Resent OTP for ${email}: ${otpCode}`);

    // Try sending real email
    const emailSent = await sendOtpEmail(email.toLowerCase(), otpCode);

    res.json({
      success: true,
      message: emailSent ? 'New OTP code sent to your email!' : 'New OTP sent!',
      email: email.toLowerCase(),
      // Only return devOtp if email configuration is missing
      ...((!process.env.SMTP_USER || !process.env.SMTP_PASS) && { devOtp: otpCode })
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Get current user from JWT token
// ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/cart-wishlist
// Save user's cart and wishlist to database
// ─────────────────────────────────────────────
router.post('/cart-wishlist', authMiddleware, async (req, res) => {
  try {
    const { cart, wishlist } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (cart !== undefined) user.cart = cart;
    if (wishlist !== undefined) user.wishlist = wishlist;

    await user.save();
    res.json({ success: true, message: 'Cart and wishlist updated successfully' });
  } catch (error) {
    console.error('Error updating cart/wishlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// Send password reset OTP
// ─────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email.' });
    }

    // Generate password reset OTP
    const otpCode = generateOtp();

    // Clean up old OTPs
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: 'password_reset' });

    // Save new OTP
    const otpDoc = new Otp({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'password_reset'
    });
    await otpDoc.save();

    console.log(`📧 [DEV] Password reset OTP for ${email}: ${otpCode}`);

    // Try sending real email
    const emailSent = await sendResetPasswordEmail(email.toLowerCase(), otpCode);

    res.json({
      success: true,
      message: emailSent ? 'Password reset OTP code sent to your email!' : 'Password reset OTP generated!',
      email: email.toLowerCase(),
      ...((!process.env.SMTP_USER || !process.env.SMTP_PASS) && { devOtp: otpCode })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// Verify OTP and reset password
// ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find OTP
    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'password_reset'
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: 'OTP has expired or does not exist. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await otpDoc.compareOtp(otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // Find and update user password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.password = password; // Will be hashed by pre-save hook
    await user.save();

    // Clean up used OTP
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: 'password_reset' });

    res.json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/addresses
// Update user's saved addresses
// ─────────────────────────────────────────────
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { addresses } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.addresses = addresses;
    await user.save();
    res.json({ success: true, message: 'Addresses updated successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Error updating addresses:', error);
    res.status(500).json({ message: 'Server error while updating addresses' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/wallet
// Update user's wallet balance
// ─────────────────────────────────────────────
router.post('/wallet', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();
    res.json({ success: true, message: 'Wallet balance updated successfully', walletBalance: user.walletBalance });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ message: 'Server error while updating wallet balance' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/update-profile
// Update user's name and mobile number
// ─────────────────────────────────────────────
router.post('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', user: user.toJSON() });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// GET /api/auth/users
// Get all users (Admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
