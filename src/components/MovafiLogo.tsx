import React from 'react';

interface MovafiLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const MovafiLogo: React.FC<MovafiLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  onClick
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-sm', sub: 'text-[8.5px]' },
    md: { icon: 42, text: 'text-base font-extrabold', sub: 'text-[9.5px]' },
    lg: { icon: 54, text: 'text-xl font-extrabold', sub: 'text-[11px]' },
    xl: { icon: 68, text: 'text-2xl font-black', sub: 'text-xs' }
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 cursor-pointer select-none group transition-transform duration-200 active:scale-95 ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      aria-label="MOVAFI BANK UNITED STATES - Home / Dashboard"
    >
      {/* Bespoke Regal Financial Insignia */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-300 group-hover:scale-105 group-hover:rotate-1"
        >
          <defs>
            {/* 24K Royal Gold Gradient */}
            <linearGradient id="movafiGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Deep Sovereign Obsidian Navy Shield */}
            <linearGradient id="movafiShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* High-End Glow */}
            <filter id="royalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#D97706" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Outer Octagonal Crest Shield */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="24"
            fill="url(#movafiShieldGrad)"
            stroke="url(#movafiGoldGrad)"
            strokeWidth="3.2"
            filter="url(#royalGlow)"
          />

          {/* Inner Filigree Border */}
          <rect
            x="11"
            y="11"
            width="78"
            height="78"
            rx="18"
            fill="none"
            stroke="url(#movafiGoldGrad)"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeDasharray="4 2"
          />

          {/* Neoclassical Architectural Pediment / Triangular Architrave */}
          <polygon
            points="50,20 74,34 26,34"
            fill="url(#movafiGoldGrad)"
          />

          {/* Radiant Vault Star in Pediment */}
          <circle cx="50" cy="28" r="2.5" fill="#0F172A" />

          {/* Classical Pillars / Twin Sovereign Columns */}
          {/* Pillar 1: Left */}
          <rect x="30" y="38" width="8" height="34" rx="2" fill="url(#movafiGoldGrad)" />
          {/* Pillar 2: Central Left */}
          <rect x="42" y="38" width="6" height="34" rx="1.5" fill="#FDE68A" opacity="0.95" />
          {/* Pillar 3: Central Right */}
          <rect x="52" y="38" width="6" height="34" rx="1.5" fill="#FDE68A" opacity="0.95" />
          {/* Pillar 4: Right */}
          <rect x="62" y="38" width="8" height="34" rx="2" fill="url(#movafiGoldGrad)" />

          {/* Capital trims */}
          <line x1="28" y1="38" x2="72" y2="38" stroke="url(#movafiGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Base pedestal line */}
          <line x1="24" y1="74" x2="76" y2="74" stroke="url(#movafiGoldGrad)" strokeWidth="3.2" strokeLinecap="round" />
          {/* Foundation tier */}
          <line x1="20" y1="80" x2="80" y2="80" stroke="url(#movafiGoldGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`tracking-tight text-slate-900 dark:text-white leading-none ${text} font-serif`}>
              MOVAFI BANK
            </span>
          </div>
          <span className={`tracking-[0.28em] font-bold text-amber-600 dark:text-amber-400 uppercase mt-1 ${sub}`}>
            UNITED STATES
          </span>
        </div>
      )}
    </div>
  );
};
