import React, { useState } from 'react';
import { Lock, ShieldCheck, Check } from 'lucide-react';
import './PayAndPlaceOrderButton.css';

/**
 * Animated Pay & Place Order Button:
 * 1. Default: Secure Shield / Lock Icon + "Pay & Place Order (₹...)"
 * 2. On Click:
 *    - Text transitions out smoothly
 *    - Golden verified security token / shield drops into the transaction reader
 *    - Payment rig speeds across with green/cyan light speed trails
 *    - "✓ Authorizing Secure Payment..." / "✓ Order Placed"
 *    - Calls onSubmit/onClick smoothly
 */
export default function PayAndPlaceOrderButton({
  onClick,
  amount = null,
  disabled = false,
  isProcessing = false,
  defaultText = 'Pay & Place Order',
  processingText = 'Authorizing Payment...',
  className = '',
  style = {},
  size = 'lg'
}) {
  const [animating, setAnimating] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const handleClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (disabled || isProcessing || animating) return;

    setAnimating(true);

    setTimeout(() => {
      setAuthorized(true);
    }, 850);

    setTimeout(() => {
      if (onClick) onClick(e);
      setAnimating(false);
      setAuthorized(false);
    }, 1100);
  };

  const formattedLabel = amount !== null
    ? `${defaultText} (₹${Number(amount).toLocaleString('en-IN')})`
    : defaultText;

  return (
    <button
      type="button"
      className={`animated-pay-btn ${size} ${animating || isProcessing ? 'is-animating' : ''} ${authorized ? 'is-authorized' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      aria-label={formattedLabel}
    >
      <div className="pay-btn-content">
        {/* Animated Security & Payment Rig */}
        <div className="pay-stage">
          <span className="pay-token-drop"></span>

          <div className="pay-vehicle">
            <svg
              className="pay-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>

          <span className="pay-trail trail-1"></span>
          <span className="pay-trail trail-2"></span>
        </div>

        {/* Text */}
        <span className="pay-btn-text">
          {authorized || isProcessing ? (
            <span className="pay-authorized-label">
              <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {processingText}
            </span>
          ) : (
            <>
              <Lock size={16} className="pay-lock-icon" />
              {formattedLabel}
            </>
          )}
        </span>
      </div>
    </button>
  );
}
