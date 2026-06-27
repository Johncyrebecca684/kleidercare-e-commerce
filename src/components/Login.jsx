import { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { login as apiLogin, verifyOtp, resendOtp } from '../services/authService';
import './Login.css';

export default function Login({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const otpRefs = useRef([]);
  const cooldownRef = useRef(null);
  const timerRef = useRef(null);

  // Start OTP countdown timer
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('credentials');
        setEmail('');
        setPassword('');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setLoading(false);
        setResendCooldown(0);
        setOtpTimer(300);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      if (data.success && data.user) {
        setStep('success');
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
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
      const data = await verifyOtp({ email, otp: otpString, purpose: 'login' });
      if (data.success && data.user) {
        setStep('success');
        setTimeout(() => {
          onLoginSuccess(data.user);
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
      const data = await resendOtp({ email, purpose: 'login' });
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
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="auth-content">
          {/* ─── Step 1: Credentials ─── */}
          <div className={`auth-step ${step === 'credentials' ? 'step-active' : 'step-exit'}`}>
            {step === 'credentials' && (
              <>
                <h2 className="auth-title">Login to Your Account</h2>
                <p className="auth-subtitle">Access your orders and personalized experience</p>

                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="login-email">Email Address</label>
                    <input
                      type="email"
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password">Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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

                  {error && <div className="error-message">{error}</div>}

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading">
                        <Loader2 size={18} className="spin" />
                        Verifying...
                      </span>
                    ) : 'Login'}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="switch-auth-btn"
                      onClick={() => {
                        onClose();
                        onSwitchToSignup();
                      }}
                    >
                      Sign up
                    </button>
                  </p>
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => {
                      onClose();
                      onSwitchToForgotPassword();
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ─── Step 2: OTP Verification ─── */}
          <div className={`auth-step ${step === 'otp' ? 'step-active step-enter' : step === 'success' ? 'step-exit' : ''}`}>
            {step === 'otp' && (
              <>
                <button className="back-btn" onClick={() => { setStep('credentials'); setError(''); }}>
                  <ArrowLeft size={20} />
                  <span>Back</span>
                </button>

                <div className="otp-header">
                  <div className="otp-icon">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="auth-title">Verify Your Identity</h2>
                  <p className="auth-subtitle">
                    We've sent a 6-digit code to<br />
                    <strong className="otp-email">{email}</strong>
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
                <h2 className="success-title">Welcome Back!</h2>
                <p className="success-text">Login successful. Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
