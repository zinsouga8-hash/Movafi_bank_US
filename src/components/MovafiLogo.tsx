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
    sm: { icon: 32, text: 'text-sm font-bold', sub: 'text-[8px] tracking-[0.25em]' },
    md: { icon: 40, text: 'text-base font-extrabold', sub: 'text-[9.5px] tracking-[0.28em]' },
    lg: { icon: 52, text: 'text-xl font-black', sub: 'text-[11px] tracking-[0.3em]' },
    xl: { icon: 68, text: 'text-2xl font-black', sub: 'text-xs tracking-[0.32em]' }
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
      {/* Designer-grade Integrated "MB" Monogram Insignia */}
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
            <linearGradient id="mbGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Obsidian Navy Vault Gradient */}
            <linearGradient id="mbShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Subtle Drop Shadow */}
            <filter id="mbShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#D97706" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Squircle Housing with Bullion Border */}
          <rect
            x="6"
            y="6"
            width="116"
            height="116"
            rx="28"
            fill={monochrome ? 'currentColor' : 'url(#mbShieldGrad)'}
            stroke={monochrome ? 'transparent' : 'url(#mbGoldGrad)'}
            strokeWidth="3.5"
            filter={monochrome ? undefined : 'url(#mbShadow)'}
          />

          {/* Integrated MB Graphic Symbol */}
          {/* Left Vertical Pillar (Stem of both M and B) */}
          <rect
            x="26"
            y="28"
            width="13"
            height="72"
            rx="4"
            fill={monochrome ? '#ffffff' : 'url(#mbGoldGrad)'}
          />

          {/* Diagonal Chevron of M (Dives to center waist) */}
          <path
            d="M39 28 L64 64 L52 64 L37 42 Z"
            fill={monochrome ? '#ffffff' : 'url(#mbGoldGrad)'}
          />

          {/* Ascending Chevron of M (Rises to upper right crest) */}
          <path
            d="M52 64 L64 64 L76 46 L68 34 Z"
            fill={monochrome ? '#ffffff' : 'url(#mbGoldGrad)'}
          />

          {/* Upper Rounded Lobe of B */}
          <path
            d="M39 28 H75 C88 28 97 36 97 48 C97 59 88 64 76 64 H54 L62 53 H74 C80 53 84 51 84 46 C84 40 80 38 73 38 H39 Z"
            fill={monochrome ? '#ffffff' : 'url(#mbGoldGrad)'}
          />

          {/* Lower Rounded Lobe of B */}
          <path
            d="M39 63 H78 C92 63 101 71 101 83 C101 94 91 100 76 100 H39 V89 H75 C82 89 87 87 87 82 C87 76 81 74 74 74 H39 Z"
            fill={monochrome ? '#ffffff' : 'url(#mbGoldGrad)'}
          />

          {/* Central Vault Spark at the heart of M & B */}
          <polygon
            points="64,64 68,69 64,74 60,69"
            fill={monochrome ? '#0F172A' : '#FDE68A'}
          />
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
