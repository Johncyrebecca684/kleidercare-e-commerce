import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import './ForgotPassword.css';

export default function ForgotPassword({ isOpen, onClose, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // step 1: email, step 2: reset code

  const handleSubmitEmail = (e) => {
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
    // Simulate sending reset email
    setTimeout(() => {
      setLoading(false);
      setSuccess('Password reset link has been sent to your email!');
      setStep(2);
      setTimeout(() => {
        setEmail('');
        setSuccess('');
        onClose();
        onSwitchToLogin();
      }, 2000);
    }, 1500);
  };

  const handleBack = () => {
    setEmail('');
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
              ? 'Enter your email address and we\'ll send you a link to reset your password'
              : 'Check your email for the password reset link'
            }
          </p>

          {step === 1 && (
            <form onSubmit={handleSubmitEmail} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
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
                {loading ? 'Sending...' : 'Send Reset Link'}
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
