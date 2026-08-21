import React, { useState } from 'react';
import './EmiButton.css';

/**
 * Animated "Buy with EMI" Button matching Add to Cart / Buy Now animation workflow:
 * 1. Default: Credit Card Icon + "Buy with EMI" / Monthly installment breakdown
 * 2. On Click:
 *    - Text transitions out / Button glows in vibrant blue/indigo
 *    - Credit card chip / installment token drops into the card payment reader
 *    - Card payment reader drives across to the right
 *    - "✓ Opening EMI..." / "✓ Plan Calculated"
 *    - Opens EMI modal smoothly
 */
export default function EmiButton({
  onClick,
  isOutOfStock = false,
  outOfStockText = 'Unavailable',
  defaultTitle = 'Buy with EMI',
  monthlyPrice = null,
  className = '',
  style = {},
  duration = 1200,
  disabled = false,
  size = 'lg' // 'sm', 'md', 'lg'
}) {
  const [animating, setAnimating] = useState(false);
  const [opened, setOpened] = useState(false);

  const handleClick = (e) => {
    if (disabled || isOutOfStock || animating) return;
    setAnimating(true);

    setTimeout(() => {
      setOpened(true);
    }, 850);

    setTimeout(() => {
      if (onClick) onClick(e);
    }, 1000);

    setTimeout(() => {
      setAnimating(false);
      setOpened(false);
    }, duration);
  };

  const monthlyFormatted = monthlyPrice
    ? `From ₹${Math.round(monthlyPrice).toLocaleString('en-IN')}/mo`
    : 'Easy Monthly Plans';

  return (
    <button
      type="button"
      className={`animated-emi-btn ${size} ${animating ? 'is-animating' : ''} ${opened ? 'is-opened' : ''} ${isOutOfStock ? 'is-disabled' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled || isOutOfStock}
      aria-label={isOutOfStock ? outOfStockText : `${defaultTitle} - ${monthlyFormatted}`}
    >
      <div className="emi-btn-content">
        {/* Animated EMI Credit Card Terminal Stage */}
        <div className="emi-stage">
          {/* Falling smart chip token */}
          <span className="emi-token-drop"></span>

          {/* Credit Card Reader Vehicle */}
          <div className="emi-vehicle">
            <svg
              className="emi-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>

          <span className="emi-streak"></span>
        </div>

        {/* Text Container */}
        <div className="emi-btn-text-wrap">
          {opened ? (
            <span className="emi-opened-label">
              <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Opening EMI...
            </span>
          ) : (
            <>
              <strong>{isOutOfStock ? outOfStockText : defaultTitle}</strong>
              <small>{isOutOfStock ? 'Item Out of Stock' : monthlyFormatted}</small>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
