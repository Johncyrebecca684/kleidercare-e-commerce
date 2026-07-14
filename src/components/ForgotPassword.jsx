import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { forgotPassword, resetPassword } from '../services/authService';
import './ForgotPassword.css';

export default function ForgotPassword({ isOpen, onClose, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Reset with OTP & password

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setSuccess(response.message || 'OTP sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    if (!password) {
      setError('Please enter your new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ email, otp, password });
      setSuccess(response.message || 'Password reset successfully!');
      setTimeout(() => {
        handleBack();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setEmail('');
    setOtp('');
    setPassword('');
    setError('');
    setSuccess('');
    setStep(1);
    onClose();
    onSwitchToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleBack}>
          <X size={24} />
        </button>

        <div className="auth-content">
          <h2 className="auth-title">Reset Your Password</h2>
          <p className="auth-subtitle">
            {step === 1 
              ? 'Enter your email address and we\'ll send you an OTP to reset your password'
              : 'Enter the OTP sent to your email and your new password'
            }
          </p>

          {step === 1 ? (
            <form onSubmit={handleSubmitEmail} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  required
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  disabled={loading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">OTP Verification Code</label>
                <input
                  required
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  required
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  disabled={loading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="auth-footer forgot-footer">
            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
            >
              <ArrowLeft size={18} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
