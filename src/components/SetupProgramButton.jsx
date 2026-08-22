import React, { useState } from 'react';
import { Settings, Check, Plus } from 'lucide-react';
import { playProgramSetupSound } from '../utils/soundEffects';
import './SetupProgramButton.css';

/**
 * Animated Setup / Calibration Add-on Button:
 * 1. Default: Settings / Gear icon + "Add Machine Program Setup"
 * 2. On Click:
 *    - Gear icon starts spinning rapidly
 *    - Micro calibration chips / parameters drop into the gear module
 *    - Module pulses smoothly into emerald active state
 *    - Displays "✓ Program Setup Added"
 */
export default function SetupProgramButton({
  active = false,
  onToggle,
  defaultText = 'Add Machine Program Setup',
  activeText = '✓ Program Setup Added',
  className = '',
  style = {}
}) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (animating) return;

    if (!active) {
      playProgramSetupSound();
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
      className={`animated-setup-btn ${active ? 'is-active' : ''} ${animating ? 'is-animating' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? activeText : defaultText}
    >
      <div className="setup-btn-inner">
        {/* Animated Gear & Spark calibration stage */}
        <div className="setup-stage">
          <span className="setup-chip-drop"></span>
          <Settings size={15} className={`setup-gear-icon ${animating ? 'gear-spin' : ''}`} />
        </div>

        {/* Text */}
        <span className="setup-btn-text">
          {active ? (
            <span className="setup-active-label">
              <Check size={14} className="setup-check-icon" />
              Program Setup Added
            </span>
          ) : (
            defaultText
          )}
        </span>
      </div>
    </button>
  );
}
