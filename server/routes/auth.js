import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

const router = express.Router();

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

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user (unverified)
    const user = new User({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
      mobileNumber,
      isVerified: false
    });
    await user.save();

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

export default router;
