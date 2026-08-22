import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { playAmcPlanSound } from '../utils/soundEffects';
import './AmcPlanButton.css';

/**
 * Animated AMC Plan Selection Button:
 * 1. Default: Shield icon + "Select AMC Plan"
 * 2. On Click:
 *    - Shield icon expands and pulses with protection glow
 *    - Warranty certification check / spark drops into the shield
 *    - Smoothly locks into emerald/navy active state displaying "✓ AMC Plan Selected"
 */
export default function AmcPlanButton({
  active = false,
  onToggle,
  defaultText = 'Select AMC Plan',
  activeText = '✓ AMC Plan Selected',
  className = '',
  style = {}
}) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (animating) return;

    if (!active) {
      playAmcPlanSound();
      setAnimating(true);
      setTimeout(() => {
        if (onToggle) onToggle(true);
      }, 700);
      setTimeout(() => {
        setAnimating(false);
      }, 1000);
    } else {
      if (onToggle) onToggle(false);
    }
  };

  return (
    <button
      type="button"
      className={`animated-amc-btn ${active ? 'is-active' : ''} ${animating ? 'is-animating' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? activeText : defaultText}
    >
      <div className="amc-btn-inner">
        {/* Animated Shield & Spark stage */}
        <div className="amc-shield-stage">
          <span className="amc-spark-drop"></span>
          <ShieldCheck size={16} className={`amc-shield-icon ${animating ? 'shield-pulse' : ''}`} />
        </div>

        {/* Text */}
        <span className="amc-btn-text">
          {active ? (
            <span className="amc-active-label">
              <Check size={14} className="amc-check-icon" />
              AMC Plan Selected
            </span>
          ) : (
            defaultText
          )}
        </span>
      </div>
    </button>
  );
}
