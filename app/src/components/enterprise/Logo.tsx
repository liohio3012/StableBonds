"use client";

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'primary' | 'icon' | 'monochrome' | 'white';
}

/**
 * StablePay Brand Logo Component
 * Designed under the "Swiss-Institutional Monolith" design system.
 * Concept: The Continuous Bond (Infinity Link)
 * A custom geometric construction representing funds that earn interest (looping)
 * while moving forward to settlement (linear progression).
 */
export default function Logo({ className = '', size = 28, variant = 'primary' }: LogoProps) {
  // Color configuration based on brand variant
  const getColors = () => {
    switch (variant) {
      case 'monochrome':
        return {
          bg: 'fill-neutral-900 dark:fill-white',
          stroke1: 'stroke-neutral-900 dark:stroke-white',
          stroke2: 'stroke-neutral-900 dark:stroke-white',
          accent: 'fill-neutral-500',
        };
      case 'white':
        return {
          bg: 'fill-white',
          stroke1: 'stroke-white',
          stroke2: 'stroke-white',
          accent: 'fill-white/80',
        };
      case 'primary':
      default:
        return {
          bg: 'fill-[#18181b]',
          stroke1: 'stroke-[#18181b]',
          stroke2: 'stroke-[#059669]', // Accented emerald for yielding link
          accent: 'fill-[#059669]',
        };
    }
  };

  const colors = getColors();

  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* The Monolithic Vault Shield - Swiss Grid Proportion */}
        <rect x="2" y="2" width="28" height="28" rx="7" className="fill-neutral-50 dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />
        
        {/* The Yielding Mobius Link (S + P Monogram) */}
        <path
          d="M10 13C10 11.3431 11.3431 10 13 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22C10 24.2091 11.7909 26 14 26H19C20.6569 26 22 24.6569 22 23"
          strokeWidth="3.2"
          strokeLinecap="round"
          className={colors.stroke1}
        />
        
        {/* Accent dot indicating the settlement release trigger (precision point) */}
        <circle cx="19" cy="23" r="2.2" className={colors.accent} />
        <circle cx="13" cy="10" r="2.2" className="fill-neutral-400" />
      </svg>
    );
  }

  const fontClass = size >= 36 ? 'text-[17px] font-bold' : (size >= 30 ? 'text-base font-semibold' : 'text-sm font-semibold');
  const gapClass = size >= 36 ? 'gap-3' : 'gap-2.5';

  return (
    <div className={`flex items-center ${gapClass} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer squircle outline */}
        <rect x="1" y="1" width="30" height="30" rx="8" className="fill-neutral-50 dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />
        
        {/* The Continuous Link (represents the yield-bearing connection between deposit & settlement) */}
        <path
          d="M10 13C10 11.3431 11.3431 10 13 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22C10 24.2091 11.7909 26 14 26H19C20.6569 26 22 24.6569 22 23"
          strokeWidth="3.2"
          strokeLinecap="round"
          className={colors.stroke1}
        />
        <circle cx="19" cy="23" r="2.2" className={colors.accent} />
        <circle cx="13" cy="10" r="2.2" className="fill-neutral-400" />
      </svg>
      <span className={`tracking-tight text-neutral-950 dark:text-white ${fontClass}`}>
        StablePay
      </span>
    </div>
  );
}
