import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
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

// ─────────────────────────────────────────────
// IN-MEMORY PENDING SIGNUP STORE
// Stores pending signup data + OTP hash until email is verified.
// No MongoDB touch during signup — response is instant.
// Entries auto-expire after 5 minutes.
// ─────────────────────────────────────────────
const pendingSignups = new Map();

function setPendingSignup(email, data) {
  // Clear any previous pending signup for this email
  clearPendingSignup(email);
  const entry = {
    ...data,
    otpHash: crypto.createHash('sha256').update(data.otp).digest('hex'),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };
  delete entry.otp; // never store plaintext OTP
  pendingSignups.set(email, entry);
  // Auto-delete after 5 minutes
  entry._timer = setTimeout(() => pendingSignups.delete(email), 5 * 60 * 1000);
}

function getPendingSignup(email) {
  const entry = pendingSignups.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    clearPendingSignup(email);
    return null;
  }
  return entry;
}

function clearPendingSignup(email) {
  const entry = pendingSignups.get(email);
  if (entry?._timer) clearTimeout(entry._timer);
  pendingSignups.delete(email);
}

function verifyPendingOtp(email, otp) {
  const entry = getPendingSignup(email);
  if (!entry) return false;
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return hash === entry.otpHash;
}

// ─────────────────────────────────────────────
// EMAIL DELIVERY (Resend with Nodemailer SMTP Fallback)
// ─────────────────────────────────────────────
const EMAIL_FROM = process.env.RESEND_FROM || 'Kleider Care <onboarding@resend.dev>';

const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'thesalavailaundry@gmail.com';
  const pass = process.env.SMTP_PASS || 'seue jwpf jkth qqyw';

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass: pass.replace(/\s+/g, '') // remove spaces from Gmail app passwords
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

async function sendMail({ to, subject, text, html }) {
  // 1. Try Resend if a real API key is configured
  const hasResendKey = process.env.RESEND_API_KEY &&
                       process.env.RESEND_API_KEY !== 're_REPLACE_WITH_YOUR_API_KEY' &&
                       process.env.RESEND_API_KEY.startsWith('re_');

  if (hasResendKey) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html
      });
      if (!error) {
        console.log(`📧 [Resend] Email successfully sent to ${to}`);
        return true;
      }
      console.warn(`⚠️ [Resend] ${error.message || JSON.stringify(error)}. Trying SMTP fallback...`);
    } catch (err) {
      console.warn(`⚠️ [Resend] ${err.message}. Trying SMTP fallback...`);
    }
  }

  // 2. Try Nodemailer / Gmail SMTP fallback
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const mailUser = process.env.SMTP_USER || 'thesalavailaundry@gmail.com';
      await transporter.sendMail({
        from: `"Kleider Care" <${mailUser}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`📧 [SMTP] Email successfully delivered to ${to}`);
      return true;
    } catch (smtpErr) {
      console.error(`❌ [SMTP] Error sending email to ${to}:`, smtpErr.message);
    }
  }

  console.log(`📧 [FALLBACK] Email delivery failed or unconfigured for ${to}.`);
  return false;
}

// ─── OTP digit boxes helper ────────────────────────────────────────────────
function otpDigitBoxes(otp) {
  return otp.split('').map(d =>
    `<td style="padding:0 5px;"><div style="width:44px;height:52px;line-height:52px;text-align:center;font-size:26px;font-weight:700;color:#1e3a8a;background:#eef4ff;border:2px solid #c7d9ff;border-radius:10px;display:inline-block;">${d}</div></td>`
  ).join('');
}

// Send OTP to client's email address
async function sendOtpEmail(email, otp) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Kleider Care Account</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);padding:40px 48px 36px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.10);border:1.5px solid rgba(255,255,255,0.18);border-radius:12px;padding:10px 22px;margin-bottom:18px;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">👔 Kleider Care</span>
            </div>
            <p style="margin:0;font-size:13px;color:#93c5fd;letter-spacing:1px;text-transform:uppercase;">Laundry Solutions &amp; E-Commerce</p>
            <h1 style="margin:22px 0 0;font-size:26px;font-weight:700;color:#ffffff;">Verify Your Account</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;">One-Time Password (OTP) Verification</p>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="background:#ffffff;padding:44px 48px 36px;">
            <p style="margin:0 0 10px;font-size:16px;color:#1e293b;font-weight:600;">Hello,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
              Thank you for signing up with <strong style="color:#1e3a8a;">Kleider Care</strong>. To complete your account verification, use the OTP code below. This code is valid for <strong>5 minutes</strong>.
            </p>

            <!-- OTP BOX -->
            <div style="background:#f8faff;border:1.5px solid #dbeafe;border-radius:14px;padding:28px 20px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Your Verification Code</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>${otpDigitBoxes(otp)}</tr>
              </table>
              <p style="margin:0;font-size:12px;color:#94a3b8;">Enter this code in the verification screen</p>
            </div>

            <!-- STEPS -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:32px;">
                  <div style="width:26px;height:26px;background:#dbeafe;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#1e3a8a;">1</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Copy the 6-digit code shown above.</td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <div style="width:26px;height:26px;background:#dbeafe;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#1e3a8a;">2</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Return to the Kleider Care app and enter the OTP.</td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <div style="width:26px;height:26px;background:#dbeafe;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#1e3a8a;">3</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Your account will be verified and you can start shopping!</td>
              </tr>
            </table>

            <!-- SECURITY NOTE -->
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:0;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                <strong>&#9888; Security Notice:</strong> Kleider Care will <strong>never</strong> ask for this code via phone or chat. Do not share this OTP with anyone.
              </p>
            </div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If you did not create a Kleider Care account, you can safely ignore this email.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; 2026 Kleider Care. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: '✅ Your Kleider Care Verification Code',
    text: `Your Kleider Care verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    html
  });
}

// Send Password Reset OTP to client's email address
async function sendResetPasswordEmail(email, otp) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Kleider Care Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0000 0%,#7f1d1d 55%,#dc2626 100%);padding:40px 48px 36px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.10);border:1.5px solid rgba(255,255,255,0.18);border-radius:12px;padding:10px 22px;margin-bottom:18px;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">👔 Kleider Care</span>
            </div>
            <p style="margin:0;font-size:13px;color:#fca5a5;letter-spacing:1px;text-transform:uppercase;">Laundry Solutions &amp; E-Commerce</p>
            <h1 style="margin:22px 0 0;font-size:26px;font-weight:700;color:#ffffff;">Password Reset Request</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#fecaca;">Use the code below to reset your password</p>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="background:#ffffff;padding:44px 48px 36px;">
            <p style="margin:0 0 10px;font-size:16px;color:#1e293b;font-weight:600;">Hello,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
              We received a request to reset the password for your <strong style="color:#991b1b;">Kleider Care</strong> account. Enter the OTP code below to proceed. This code expires in <strong>5 minutes</strong>.
            </p>

            <!-- OTP BOX -->
            <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:14px;padding:28px 20px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Your Password Reset Code</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>${otp.split('').map(d =>
                  `<td style="padding:0 5px;"><div style="width:44px;height:52px;line-height:52px;text-align:center;font-size:26px;font-weight:700;color:#991b1b;background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;display:inline-block;">${d}</div></td>`
                ).join('')}</tr>
              </table>
              <p style="margin:0;font-size:12px;color:#94a3b8;">Enter this code in the password reset screen</p>
            </div>

            <!-- STEPS -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:32px;">
                  <div style="width:26px;height:26px;background:#fee2e2;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#991b1b;">1</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Copy the 6-digit reset code above.</td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <div style="width:26px;height:26px;background:#fee2e2;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#991b1b;">2</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Return to Kleider Care and enter the OTP on the reset screen.</td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <div style="width:26px;height:26px;background:#fee2e2;border-radius:50%;text-align:center;line-height:26px;font-size:13px;font-weight:700;color:#991b1b;">3</div>
                </td>
                <td style="padding:10px 0 10px 12px;font-size:14px;color:#475569;">Set your new password and log in securely.</td>
              </tr>
            </table>

            <!-- SECURITY NOTE -->
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                <strong>&#9888; Security Notice:</strong> If you did not request a password reset, your account may be at risk. Please <strong>ignore this email</strong> — your password will not change.
              </p>
            </div>

            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#15803d;">
                <strong>&#128274; Tip:</strong> Never share this code with anyone. Kleider Care support will <strong>never</strong> ask for your OTP.
              </p>
            </div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">This is an automated message. Please do not reply to this email.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; 2026 Kleider Care. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: '🔐 Your Kleider Care Password Reset Code',
    text: `Your Kleider Care password reset code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    html
  });
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
// Pure in-memory: zero DB calls, responds in <10ms.
// User record is ONLY created after OTP is verified.
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, role, mobileNumber } = req.body;

  // --- Synchronous validation ---
  if (!firstName || !email || !password || !mobileNumber) {
    return res.status(400).json({ message: 'First name, email, password, and mobile number are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
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

  try {
    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Email is already registered and verified. Please log in.' });
    }

    // Generate OTP and store everything in memory
    const otpCode = generateOtp();
    setPendingSignup(email.toLowerCase(), {
      otp: otpCode,
      firstName,
      lastName: lastName || '',
      password,
      role: normalizedRole,
      mobileNumber
    });

    console.log(`📧 [DEV] Signup OTP for ${email}: ${otpCode}`);

    // Respond that verification email is sent
    res.status(201).json({
      success: true,
      message: 'Verification email sent! Please check your inbox for the OTP.',
      email: email.toLowerCase()
    });

    // Send OTP email in background
    sendOtpEmail(email.toLowerCase(), otpCode).catch(err =>
      console.error('❌ Background OTP email error:', err.message)
    );
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
// For signup: checks in-memory store, creates User on success.
// For other flows: checks MongoDB OTP.
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase();
    let user;

    // --- SIGNUP FLOW: use in-memory store ---
    const pendingSignup = getPendingSignup(normalizedEmail);
    if (pendingSignup || purpose === 'signup') {
      if (!pendingSignup) {
        return res.status(400).json({ message: 'Signup session expired. Please sign up again.' });
      }

      // Verify OTP from memory
      if (!verifyPendingOtp(normalizedEmail, otp)) {
        return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
      }

      // OTP valid — now create the User in DB for the first time
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing.isVerified) {
        user = existing;
      } else {
        await User.deleteOne({ email: normalizedEmail, isVerified: false }); // clean stale
        user = new User({
          firstName: pendingSignup.firstName,
          lastName: pendingSignup.lastName || '',
          email: normalizedEmail,
          password: pendingSignup.password, // plain — bcrypt-hashed by User pre-save hook
          role: pendingSignup.role || 'customer',
          mobileNumber: pendingSignup.mobileNumber,
          isVerified: true
        });
        await user.save();
        console.log(`✅ New user created after OTP verification: ${normalizedEmail}`);
      }

      clearPendingSignup(normalizedEmail); // cleanup memory

    } else {
      // --- OTHER FLOWS (password_reset, login): use MongoDB OTP ---
      const { default: Otp } = await import('../models/Otp.js');
      const otpDoc = await Otp.findOne({
        email: normalizedEmail,
        ...(purpose && { purpose })
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        return res.status(400).json({ message: 'OTP has expired or does not exist. Please request a new one.' });
      }
      if (!otpDoc.compareOtp(otp)) {
        return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
      }

      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
      await Otp.deleteMany({ email: normalizedEmail });
    }

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

    const normalizedEmail = email.toLowerCase();
    const otpCode = generateOtp();

    // 1. If this is a pending signup (in-memory flow)
    const pendingSignup = getPendingSignup(normalizedEmail);
    if (pendingSignup || purpose === 'signup') {
      if (!pendingSignup) {
        return res.status(400).json({ message: 'Signup session expired. Please sign up again.' });
      }

      // Update in-memory OTP
      setPendingSignup(normalizedEmail, {
        ...pendingSignup,
        otp: otpCode
      });

      console.log(`📧 [DEV] Resent Signup OTP for ${normalizedEmail}: ${otpCode}`);

      res.json({
        success: true,
        message: 'New OTP code sent to your email!',
        email: normalizedEmail
      });

      sendOtpEmail(normalizedEmail, otpCode).catch(err =>
        console.error('❌ Background resend OTP email error:', err.message)
      );
      return;
    }

    // 2. For existing user flows (password reset / login verification)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Remove old OTPs
    await Otp.deleteMany({ email: normalizedEmail });

    // Save new OTP
    const otpDoc = new Otp({
      email: normalizedEmail,
      otp: otpCode,
      purpose: purpose || 'login'
    });
    await otpDoc.save();

    console.log(`📧 [DEV] Resent OTP for ${normalizedEmail}: ${otpCode}`);

    res.json({
      success: true,
      message: 'New OTP code sent to your email!',
      email: normalizedEmail
    });

    sendOtpEmail(normalizedEmail, otpCode).catch(err =>
      console.error('❌ Background resend OTP email error:', err.message)
    );

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

    // Respond immediately — don't wait for email to send
    res.json({
      success: true,
      message: 'Password reset OTP code sent to your email!',
      email: email.toLowerCase()
    });

    // Send email in the background (fire-and-forget)
    sendResetPasswordEmail(email.toLowerCase(), otpCode).catch(err =>
      console.error('❌ Background reset email error:', err.message)
    );
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
