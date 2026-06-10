import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Login({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword, registeredUsers = [], onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
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

    // Check if user is registered
    const userExists = registeredUsers.some(user => user.email === email);
    if (!userExists) {
      setError('This email is not registered. Please sign up first.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Find the registered user
      const user = registeredUsers.find(u => u.email === email);
      if (user) {
        onLoginSuccess(user);
        setEmail('');
        setPassword('');
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="auth-content">
          <h2 className="auth-title">Login to Your Account</h2>
          <p className="auth-subtitle">Access your orders and personalized experience</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="admin-hint" style={{ marginTop: '20px', padding: '12px', background: '#e0f2fe', borderRadius: '8px', fontSize: '13px', color: '#0369a1', border: '1px solid #bae6fd' }}>
            <strong>Admin Test Login:</strong><br />
            Email: admin@kami.com<br />
            Password: password123
          </div>

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
        </div>
      </div>
    </div>
  );
}
