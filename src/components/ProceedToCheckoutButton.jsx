import React, { useState } from 'react';
import './ProceedToCheckoutButton.css';

/**
 * Animated Proceed to Checkout Button:
 * 1. Default: Secure Lock & Arrow + "Proceed to Checkout" / "Proceed to Buy"
 * 2. On Click:
 *    - Text transitions out smoothly
 *    - Secure payment lock/package token drops into the courier checkout vehicle
 *    - Checkout vehicle drives across at speed with golden/cyan trails
 *    - "✓ Securing Checkout..." / "✓ Redirecting..."
 *    - Smoothly triggers onProceed
 */
export default function ProceedToCheckoutButton({
  onClick,
  defaultText = 'Proceed to Checkout',
  proceedingText = 'Securing Checkout...',
  className = '',
  style = {},
  duration = 1300,
  disabled = false,
  size = 'lg' // 'sm', 'md', 'lg'
}) {
  const [animating, setAnimating] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  const handleClick = (e) => {
    if (disabled || animating) return;
    setAnimating(true);

    setTimeout(() => {
      setProceeding(true);
    }, 850);

    setTimeout(() => {
      if (onClick) onClick(e);
    }, 1050);

    setTimeout(() => {
      setAnimating(false);
      setProceeding(false);
    }, duration);
  };

  return (
    <button
      type="button"
      className={`animated-checkout-btn ${size} ${animating ? 'is-animating' : ''} ${proceeding ? 'is-proceeding' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled}
      aria-label={defaultText}
    >
      <div className="checkout-btn-content">
        {/* Animated Checkout Stage */}
        <div className="checkout-stage">
          <span className="checkout-token-drop"></span>

          <div className="checkout-vehicle">
            <svg
              className="checkout-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <span className="checkout-trail trail-1"></span>
          <span className="checkout-trail trail-2"></span>
        </div>

        {/* Text */}
        <span className="checkout-btn-text">
          {proceeding ? (
            <span className="proceeding-label">
              <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {proceedingText}
            </span>
          ) : (
            <>
              {defaultText}
              <svg className="checkout-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </span>
      </div>
    </button>
  );
}
