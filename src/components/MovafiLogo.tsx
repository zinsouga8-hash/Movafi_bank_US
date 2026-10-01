import React from 'react';

interface MovafiLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'icon' | 'stacked';
  monochrome?: boolean;
  onClick?: () => void;
}

export const MovafiLogo: React.FC<MovafiLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  layout = 'horizontal',
  monochrome = false,
  onClick
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-sm font-bold', sub: 'text-[8px] tracking-[0.25em]' },
    md: { icon: 42, text: 'text-base font-extrabold', sub: 'text-[9.5px] tracking-[0.28em]' },
    lg: { icon: 54, text: 'text-xl font-black', sub: 'text-[11px] tracking-[0.3em]' },
    xl: { icon: 70, text: 'text-2xl font-black', sub: 'text-xs tracking-[0.32em]' }
  };

  const { icon, text, sub } = sizeMap[size];
  const isStacked = layout === 'stacked';
  const isIconOnly = layout === 'icon' || !showText;

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${isStacked ? 'flex-col items-center text-center' : 'items-center'} gap-2.5 sm:gap-3 cursor-pointer select-none group transition-transform duration-200 active:scale-95 ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick();
      }}
      aria-label="MOVAFI BANK UNITED STATES"
    >
      {/* Designer-grade Architectural Vault Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* 24K Bullion Gold Gradient */}
            <linearGradient id="movafiGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Inner Metallic Reflection Gradient */}
            <linearGradient id="movafiGoldReflect" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Obsidian Vault Depth Gradient */}
            <linearGradient id="movafiVaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="movafiGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#D97706" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Squircle Vault Housing with Bullion Bezel */}
          <rect
            x="6"
            y="6"
            width="116"
            height="116"
            rx="30"
            fill={monochrome ? 'currentColor' : 'url(#movafiVaultGrad)'}
            stroke={monochrome ? 'transparent' : 'url(#movafiGoldGrad)'}
            strokeWidth="3.5"
            filter={monochrome ? undefined : 'url(#movafiGlow)'}
          />

          {/* Inner Geometric Concentric Rim */}
          <rect
            x="14"
            y="14"
            width="100"
            height="100"
            rx="24"
            fill="none"
            stroke="url(#movafiGoldGrad)"
            strokeWidth="1"
            strokeOpacity="0.25"
          />

          {/* Prestigious Architectural Banking Crest */}
          <g filter={monochrome ? undefined : 'url(#movafiGlow)'}>
            {/* Top Vault Triangular Pediment / Apex */}
            <path
              d="M64 24 L94 44 H34 Z"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldGrad)'}
            />

            {/* Pediment Base Beam */}
            <rect
              x="30"
              y="46"
              width="68"
              height="5"
              rx="2.5"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldReflect)'}
            />

            {/* 4 Architectural Treasury Columns (Representing Stability, Growth, Trust, Security) */}
            {/* Column 1 (Left Outer) */}
            <rect
              x="35"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldGrad)'}
            />
            {/* Column 2 (Left Inner) */}
            <rect
              x="49"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldReflect)'}
            />
            {/* Column 3 (Right Inner) */}
            <rect
              x="70"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldReflect)'}
            />
            {/* Column 4 (Right Outer) */}
            <rect
              x="84"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldGrad)'}
            />

            {/* Sub-Base Plinth Beam */}
            <rect
              x="30"
              y="92"
              width="68"
              height="5"
              rx="2.5"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldReflect)'}
            />

            {/* Master Foundation Pedestal */}
            <path
              d="M26 99 H102 L98 106 H30 Z"
              fill={monochrome ? '#ffffff' : 'url(#movafiGoldGrad)'}
            />

            {/* Central Diamond Star of Excellence (Between Columns) */}
            <polygon
              points="64,63 68,72 64,81 60,72"
              fill={monochrome ? '#0F172A' : '#FFFBEB'}
            />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {!isIconOnly && (
        <div className={`flex flex-col ${isStacked ? 'items-center text-center' : 'text-left'}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`tracking-tight text-slate-900 dark:text-white leading-none ${text} font-serif`}
            >
              MOVAFI BANK
            </span>
          </div>
          <span
            className={`font-bold text-amber-600 dark:text-amber-400 uppercase mt-1 ${sub}`}
          >
            UNITED STATES
          </span>
        </div>
      )}
    </div>
  );
};
