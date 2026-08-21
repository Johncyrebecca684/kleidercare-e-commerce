import React, { useState } from 'react';
import './AddToCartButton.css';

/**
 * Animated Add To Cart Button matching reference animation:
 * 1. Default: Cart Icon + "Add to Cart"
 * 2. On Click:
 *    - Text fades out / button morphs
 *    - Cart centers, Item dot/box drops into the cart
 *    - Cart drives off to the right
 *    - Success "✓ Added!" state displays
 *    - Resets back to idle after completion
 */
export default function AddToCartButton({
  onClick,
  isOutOfStock = false,
  outOfStockText = 'Out of Stock',
  defaultText = 'Add to Cart',
  addedText = 'Added to Cart!',
  className = '',
  style = {},
  duration = 1800,
  disabled = false,
  size = 'md', // 'sm', 'md', 'lg'
}) {
  const [animating, setAnimating] = useState(false);
  const [added, setAdded] = useState(false);

  const handleClick = (e) => {
    if (disabled || isOutOfStock || animating) return;
    setAnimating(true);

    if (onClick) {
      onClick(e);
    }

    // After animation sequence completes (1.6s), show added state
    setTimeout(() => {
      setAdded(true);
    }, 1200);

    // Reset back to idle
    setTimeout(() => {
      setAnimating(false);
      setAdded(false);
    }, duration);
  };

  return (
    <button
      type="button"
      className={`animated-cart-btn ${size} ${animating ? 'is-animating' : ''} ${added ? 'is-added' : ''} ${isOutOfStock ? 'is-disabled' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled || isOutOfStock}
      aria-label={isOutOfStock ? outOfStockText : defaultText}
    >
      <div className="btn-content">
        {/* Animated Cart & Item Stage */}
        <div className="cart-stage">
          {/* Falling Item Box */}
          <span className="cart-item-drop"></span>

          {/* Cart SVG */}
          <div className="cart-vehicle">
            <svg
              className="cart-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>

        {/* Text / Status Label */}
        <span className="btn-text">
          {isOutOfStock ? outOfStockText : added ? (
            <span className="added-label">
              <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {addedText}
            </span>
          ) : (
            defaultText
          )}
        </span>
      </div>
    </button>
  );
}
