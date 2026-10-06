import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Store,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { erpLogin, isErpAuthenticated } from '../services/erpService';
import '../components/Login.css';
import './EmployeeLoginPage.css';

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('login'); // 'login' | 'success'
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated as employee, redirect directly to portal
  useEffect(() => {
    if (isErpAuthenticated()) {
      navigate('/employee/portal', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrMobile.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await erpLogin({
        emailOrMobile: emailOrMobile.trim(),
        password: password.trim()
      });

      if (response && response.success) {
        setStep('success');
        setTimeout(() => {
          navigate('/employee/portal', { replace: true });
        }, 1000);
      } else {
        setError(response.message || 'Invalid employee credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 2200);
  };

  return (
    <div className="emp-page-overlay">
      <div className="emp-auth-card">
        {/* Mobile Pull Handle Indicator */}
        <div className="mobile-sheet-pull-bar" />

        <div className="emp-auth-content">
          {step === 'login' ? (
            <>
              <div className="emp-header-block">
                <span className="emp-brand-pill">
                  <ShieldCheck size={14} /> Kleider Care Staff & ERP
                </span>
                <h2 className="auth-title">Employee Login</h2>
                <p className="auth-subtitle">
                  Sign in to access order dispatch, inventory, CRM & management
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="emp-identifier">Email Address or Mobile</label>
                  <input
                    type="text"
                    id="emp-identifier"
                    value={emailOrMobile}
                    onChange={(e) => setEmailOrMobile(e.target.value)}
                    placeholder="kleidercare@gmail.com or Mobile"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emp-password">Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="emp-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter employee security password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="emp-options-row">
                  <label className="emp-checkbox-wrap">
                    <input type="checkbox" defaultChecked />
                    <span>Keep session active</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <Loader2 size={18} className="spin" />
                      Verifying Access...
                    </span>
                  ) : (
                    'Sign In to ERP Portal'
                  )}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Authorized staff & management only.
                </p>
                <Link to="/" className="emp-store-link">
                  <Store size={14} /> Back to Customer E-Commerce Store
                </Link>
              </div>
            </>
          ) : (
            <div className="success-container">
              <div className="success-checkmark">
                <svg viewBox="0 0 52 52" className="checkmark-svg">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h2 className="success-title">Welcome Back!</h2>
              <p className="success-text">Authentication verified. Loading Reach ERP workspace...</p>
            </div>
          )}
        </div>
      </div>

      {/* Forgot password modal */}
      {isForgotModalOpen && (
        <div className="auth-overlay" onClick={() => setIsForgotModalOpen(false)}>
          <div className="auth-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsForgotModalOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
            <div className="auth-content">
              <h2 className="auth-title" style={{ fontSize: '20px' }}>Staff Password Reset</h2>
              <p className="auth-subtitle">
                Enter your registered official email to receive password reset instructions.
              </p>

              {forgotSent ? (
                <div style={{ padding: '14px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderLeft: '4px solid #10b981', borderRadius: '10px', color: '#065f46', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Reset link has been forwarded to Super Admin and your registered email.</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="auth-form">
                  <div className="form-group">
                    <label>Employee Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. kleidercare@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="auth-btn">
                    Send Reset Instructions
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
