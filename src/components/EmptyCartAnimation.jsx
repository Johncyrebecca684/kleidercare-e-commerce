import React from 'react';
import './EmptyCartAnimation.css';

/**
 * Modern, rich interactive Empty Cart Animation component.
 * Features:
 * - Floating cart basket with smooth wheel spin & suspension bounce
 * - Floating tumbling ghost items / floating sparkle orbs
 * - Interactive hover & continuous smooth micro-animations
 * - Sleek Kleider Care branded navy & cyan aesthetic
 */
export default function EmptyCartAnimation() {
  return (
    <div className="empty-cart-stage" aria-hidden="true">
      {/* Ambient background glow & orbital ripples */}
      <div className="empty-cart-glow"></div>
      <div className="empty-cart-orbit orbit-1"></div>
      <div className="empty-cart-orbit orbit-2"></div>

      {/* Floating particles / sparks */}
      <span className="floating-bubble bubble-1"></span>
      <span className="floating-bubble bubble-2"></span>
      <span className="floating-bubble bubble-3"></span>
      <span className="floating-bubble bubble-4"></span>

      {/* Main Animated SVG */}
      <svg
        className="empty-cart-main-svg"
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f2b5c" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="cartShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f2b5c" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Floating Ground Shadow */}
        <ellipse cx="120" cy="205" rx="55" ry="10" className="cart-ground-shadow" fill="#cbd5e1" opacity="0.6" />

        {/* Floating Cart Structure */}
        <g className="cart-floating-rig" filter="url(#cartShadow)">
          {/* Main Handle & Chassis */}
          <path
            d="M50 70 L72 70 L90 152 L172 152 L190 92 L78 92"
            stroke="url(#cartGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Handle Grip accent */}
          <path
            d="M46 70 L62 70"
            stroke="url(#accentGrad)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Wire Grid Matrix */}
          <line x1="104" y1="96" x2="100" y2="148" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 1" />
          <line x1="132" y1="96" x2="130" y2="148" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="160" y1="96" x2="158" y2="148" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="82" y1="120" x2="182" y2="120" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />

          {/* Left Wheel */}
          <g className="wheel-spin wheel-left">
            <circle cx="95" cy="176" r="14" fill="#0f2b5c" />
            <circle cx="95" cy="176" r="8" fill="#ffffff" />
            <circle cx="95" cy="176" r="4" fill="#38bdf8" />
            <line x1="95" y1="162" x2="95" y2="190" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="81" y1="176" x2="109" y2="176" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* Right Wheel */}
          <g className="wheel-spin wheel-right">
            <circle cx="165" cy="176" r="14" fill="#0f2b5c" />
            <circle cx="165" cy="176" r="8" fill="#ffffff" />
            <circle cx="165" cy="176" r="4" fill="#38bdf8" />
            <line x1="165" y1="162" x2="165" y2="190" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="151" y1="176" x2="179" y2="176" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* Floating question mark / hollow laundry tumble icon inside cart */}
          <g className="floating-cart-spirit">
            <circle cx="135" cy="62" r="18" fill="url(#accentGrad)" opacity="0.15" />
            <path
              d="M130 52 C130 46 142 46 142 54 C142 60 135 62 135 67"
              stroke="#0284c7"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="135" cy="74" r="2.5" fill="#0284c7" />
          </g>
        </g>
      </svg>
    </div>
  );
}
