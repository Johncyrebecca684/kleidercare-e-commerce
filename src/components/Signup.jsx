import { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { signup as apiSignup, verifyOtp, resendOtp } from '../services/authService';
import './Signup.css';

export default function Signup({ isOpen, onClose, onSwitchToLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP state
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [signupEmail, setSignupEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpTimer, setOtpTimer] = useState(300);
  const otpRefs = useRef([]);
  const cooldownRef = useRef(null);
  const timerRef = useRef(null);

  // OTP countdown timer
  useEffect(() => {
    if (step === 'otp') {
      setOtpTimer(300);
      timerRef.current = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [resendCooldown]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form');
        setFormData({ firstName: '', email: '', mobileNumber: '', password: '', confirmPassword: '', role: 'customer' });
        setOtp(['', '', '', '', '', '']);
        setSignupEmail('');
        setError('');
        setLoading(false);
        setAgreedToTerms(false);
        setResendCooldown(0);
        setOtpTimer(300);
      }, 300);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { firstName, email, password, confirmPassword, role, mobileNumber } = formData;

    if (!firstName || !email || !password || !confirmPassword || !role || !mobileNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to Terms and Conditions');
      return;
    }

    setLoading(true);
    try {
      const data = await apiSignup({
        firstName,
        lastName: '',
        email,
        password,
        role,
        mobileNumber
      });

      if (data.success) {
        setSignupEmail(data.email || email);
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setResendCooldown(30);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 400);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      } else {
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
    }
  };

  const handleVerifyOtp = async (otpString) => {
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp({ email: signupEmail, otp: otpString, purpose: 'signup' });
      if (data.success && data.user) {
        setStep('success');
        setTimeout(() => {
          onSignupSuccess(data.user);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      const data = await resendOtp({ email: signupEmail, purpose: 'signup' });
      if (data.success) {
        setResendCooldown(30);
        setOtpTimer(300);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal signup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="auth-content">
          {/* ─── Step 1: Signup Form ─── */}
          <div className={`auth-step ${step === 'form' ? 'step-active' : 'step-exit'}`}>
            {step === 'form' && (
              <>
                <h2 className="auth-title">Create Your Account</h2>
                <p className="auth-subtitle">Join us and enjoy exclusive benefits</p>

                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="signup-firstName">First Name</label>
                      <input
                        type="text"
                        id="signup-firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-role">Account Type</label>
                      <select
                        id="signup-role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={loading}
                        className="role-select"
                      >
                        <option value="customer">Customer</option>
                        <option value="reseller">Reseller</option>
                        <option value="admin">Store Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="signup-email">Email Address</label>
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-mobile">Mobile Number</label>
                      <input
                        type="tel"
                        id="signup-mobile"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-password">Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="signup-password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-confirmPassword">Confirm Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="signup-confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="signup-terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={loading}
                    />
                    <label htmlFor="signup-terms">
                      I agree to the <a href="#" className="terms-link">Terms and Conditions</a>
                    </label>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading">
                        <Loader2 size={18} className="spin" />
                        Creating Account...
                      </span>
                    ) : 'Create Account'}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="switch-auth-btn"
                      onClick={() => {
                        onClose();
                        onSwitchToLogin();
                      }}
                    >
                      Login
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ─── Step 2: OTP Verification ─── */}
          <div className={`auth-step ${step === 'otp' ? 'step-active step-enter' : step === 'success' ? 'step-exit' : ''}`}>
            {step === 'otp' && (
              <>
                <button className="back-btn" onClick={() => { setStep('form'); setError(''); }}>
                  <ArrowLeft size={20} />
                  <span>Back</span>
                </button>

                <div className="otp-header">
                  <div className="otp-icon">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="auth-title">Verify Your Email</h2>
                  <p className="auth-subtitle">
                    We've sent a 6-digit verification code to<br />
                    <strong className="otp-email">{signupEmail}</strong>
                  </p>
                </div>

                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`otp-input ${digit ? 'otp-filled' : ''} ${error ? 'otp-error' : ''}`}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading && (
                  <div className="otp-verifying">
                    <Loader2 size={20} className="spin" />
                    <span>Verifying OTP...</span>
                  </div>
                )}

                <div className="otp-footer">
                  <div className="otp-timer">
                    {otpTimer > 0 ? (
                      <>Code expires in <strong>{formatTime(otpTimer)}</strong></>
                    ) : (
                      <span className="timer-expired">OTP expired</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`resend-btn ${resendCooldown > 0 ? 'resend-disabled' : ''}`}
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ─── Step 3: Success ─── */}
          <div className={`auth-step ${step === 'success' ? 'step-active step-enter' : ''}`}>
            {step === 'success' && (
              <div className="success-container">
                <div className="success-checkmark">
                  <svg viewBox="0 0 52 52" className="checkmark-svg">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
                <h2 className="success-title">Account Verified!</h2>
                <p className="success-text">Your account has been created. Welcome aboard!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
