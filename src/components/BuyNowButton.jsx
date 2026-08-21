import React, { useState } from 'react';
import './BuyNowButton.css';

/**
 * Animated Buy Now Button with dynamic express checkout / rocket-speed delivery animation:
 * 1. Default: Lightning Zap / Fast Checkout Icon + "Buy Now at ₹..."
 * 2. On Click:
 *    - Text transitions out / Button glows with high energy orange/amber gradient
 *    - Lightning energy spark drops into the express courier / delivery vehicle
 *    - Delivery rig drives across at lightning speed with speed lines
 *    - "✓ Proceeding..." / "Order Instant..." check state
 *    - Executes onCheckout callback smoothly
 */
export default function BuyNowButton({
  onClick,
  isOutOfStock = false,
  outOfStockText = 'Out of Stock',
  defaultText = 'Buy Now',
  processingText = 'Proceeding to Buy...',
  price = null,
  className = '',
  style = {},
  duration = 1400,
  disabled = false,
  size = 'lg' // 'sm', 'md', 'lg'
}) {
  const [animating, setAnimating] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  const handleClick = (e) => {
    if (disabled || isOutOfStock || animating) return;
    setAnimating(true);

    // After animation zooms across (900ms), show proceeding state
    setTimeout(() => {
      setProceeding(true);
    }, 900);

    // Trigger action after smooth animation
    setTimeout(() => {
      if (onClick) onClick(e);
    }, 1100);

    // Reset back
    setTimeout(() => {
      setAnimating(false);
      setProceeding(false);
    }, duration);
  };

  const formattedLabel = isOutOfStock
    ? outOfStockText
    : price
    ? `${defaultText} at ₹${Number(price).toLocaleString('en-IN')}`
    : defaultText;

  return (
    <button
      type="button"
      className={`animated-buynow-btn ${size} ${animating ? 'is-animating' : ''} ${proceeding ? 'is-proceeding' : ''} ${isOutOfStock ? 'is-disabled' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled || isOutOfStock}
      aria-label={formattedLabel}
    >
      <div className="buynow-btn-content">
        {/* Animated Express Delivery Stage */}
        <div className="buynow-stage">
          {/* Energy Zap particle dropping in */}
          <span className="buynow-energy-drop"></span>

          {/* Express Vehicle / Zap Icon */}
          <div className="buynow-vehicle">
            <svg
              className="buynow-icon-svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          {/* Speed line streaks */}
          <span className="speed-streak streak-1"></span>
          <span className="speed-streak streak-2"></span>
        </div>

        {/* Button Label */}
        <span className="buynow-btn-text">
          {proceeding ? (
            <span className="proceeding-label">
              <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {processingText}
            </span>
          ) : (
            formattedLabel
          )}
        </span>
      </div>
    </button>
  );
}
