import React, { useEffect, useRef } from 'react';

/**
 * Robust inline Animated Cart Checkmark that always works immediately
 * without requiring external network connectivity or heavy bundles.
 */
export default function LottieAnimation({
  style = { width: '22px', height: '22px' },
  className = ''
}) {
  return (
    <span
      className={`lottie-cart-anim-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <svg
        viewBox="0 0 52 52"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      >
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          style={{
            strokeDasharray: 150,
            strokeDashoffset: 0,
            animation: 'lottieCircleDraw 0.6s ease forwards'
          }}
        />
        <path
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27 l8 8 l16 -16"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: 48,
            animation: 'lottieCheckDraw 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards'
          }}
        />
      </svg>
      <style>{`
        @keyframes lottieCircleDraw {
          0% {
            stroke-dashoffset: 150;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
          }
          100% {
            stroke-dashoffset: 0;
            transform: rotate(0deg);
            transform-origin: 50% 50%;
          }
        }
        @keyframes lottieCheckDraw {
          0% {
            stroke-dashoffset: 48;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </span>
  );
}
