import React, { useId } from 'react';

interface MovafiLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'icon' | 'stacked';
  monochrome?: boolean;
  textColor?: 'auto' | 'white' | 'dark';
  subText?: string;
  onClick?: () => void;
}

export const MovafiLogo: React.FC<MovafiLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  layout = 'horizontal',
  monochrome = false,
  textColor = 'auto',
  subText,
  onClick
}) => {
  const rawId = useId();
  // Safe sanitized unique suffix
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const goldGradId = `movafiGoldGrad_${uid}`;
  const goldReflectId = `movafiGoldReflect_${uid}`;
  const vaultGradId = `movafiVaultGrad_${uid}`;

  const sizeMap = {
    sm: { icon: 34, text: 'text-sm font-bold', sub: 'text-[8.5px] tracking-[0.2em]' },
    md: { icon: 42, text: 'text-base font-extrabold', sub: 'text-[9.5px] tracking-[0.22em]' },
    lg: { icon: 54, text: 'text-xl font-black', sub: 'text-[11px] tracking-[0.24em]' },
    xl: { icon: 70, text: 'text-2xl font-black', sub: 'text-xs tracking-[0.26em]' }
  };

  const { icon, text, sub } = sizeMap[size];
  const isStacked = layout === 'stacked';
  const isIconOnly = layout === 'icon' || !showText;

  // Determine text color classes
  let titleColorClass = 'text-slate-900 dark:text-white';
  let subColorClass = 'text-amber-600 dark:text-amber-400';

  if (textColor === 'white') {
    titleColorClass = 'text-white';
    subColorClass = 'text-amber-400';
  } else if (textColor === 'dark') {
    titleColorClass = 'text-slate-900';
    subColorClass = 'text-amber-600';
  }

  // Localized default subtitle: "Digital Banking" without "United States"
  const currentLang = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
  const defaultSub = subText || (
    currentLang === 'fr'
      ? 'Digital Banking'
      : currentLang === 'es'
      ? 'Digital Banking'
      : currentLang === 'ar'
      ? 'الخدمات المصرفية الرقمية'
      : 'Digital Banking'
  );

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${isStacked ? 'flex-col items-center text-center' : 'items-center'} gap-2.5 sm:gap-3 select-none group transition-transform duration-200 ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick();
      }}
      aria-label="Movafibank"
    >
      {/* High-Fidelity Sovereign Banking Vault Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
        >
          <defs>
            {/* Bullion Gold 24K Gradient */}
            <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Inner Metallic Reflection Gradient */}
            <linearGradient id={goldReflectId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Obsidian Vault Depth Gradient */}
            <linearGradient id={vaultGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>

          {/* Squircle Vault Housing with Bullion Bezel (Solid base fill for 100% fail-safe display) */}
          <rect
            x="6"
            y="6"
            width="116"
            height="116"
            rx="28"
            fill="#0F172A"
          />
          <rect
            x="6"
            y="6"
            width="116"
            height="116"
            rx="28"
            fill={monochrome ? 'currentColor' : `url(#${vaultGradId})`}
            stroke={monochrome ? 'transparent' : `url(#${goldGradId})`}
            strokeWidth="3.5"
          />

          {/* Inner Geometric Concentric Rim */}
          <rect
            x="14"
            y="14"
            width="100"
            height="100"
            rx="22"
            fill="none"
            stroke={monochrome ? 'currentColor' : `url(#${goldGradId})`}
            strokeWidth="1.2"
            strokeOpacity={monochrome ? 0.3 : 0.4}
          />

          {/* Prestigious Architectural Banking Crest */}
          <g>
            {/* Top Vault Triangular Pediment / Apex */}
            <path
              d="M64 24 L94 44 H34 Z"
              fill={monochrome ? '#ffffff' : `url(#${goldGradId})`}
            />

            {/* Pediment Base Beam */}
            <rect
              x="30"
              y="46"
              width="68"
              height="5"
              rx="2.5"
              fill={monochrome ? '#ffffff' : `url(#${goldReflectId})`}
            />

            {/* 4 Architectural Treasury Columns (Stability, Growth, Trust, Security) */}
            {/* Column 1 (Left Outer) */}
            <rect
              x="35"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : `url(#${goldGradId})`}
            />
            {/* Column 2 (Left Inner) */}
            <rect
              x="49"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : `url(#${goldReflectId})`}
            />
            {/* Column 3 (Right Inner) */}
            <rect
              x="70"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : `url(#${goldReflectId})`}
            />
            {/* Column 4 (Right Outer) */}
            <rect
              x="84"
              y="54"
              width="9"
              height="36"
              rx="2"
              fill={monochrome ? '#ffffff' : `url(#${goldGradId})`}
            />

            {/* Sub-Base Plinth Beam */}
            <rect
              x="30"
              y="92"
              width="68"
              height="5"
              rx="2.5"
              fill={monochrome ? '#ffffff' : `url(#${goldReflectId})`}
            />

            {/* Master Foundation Pedestal */}
            <path
              d="M26 99 H102 L98 106 H30 Z"
              fill={monochrome ? '#ffffff' : `url(#${goldGradId})`}
            />

            {/* Central Diamond Star of Excellence */}
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
              className={`tracking-tight leading-none ${text} ${titleColorClass} font-serif font-black`}
            >
              Movafibank
            </span>
          </div>
          <span
            className={`font-bold uppercase mt-1 ${sub} ${subColorClass}`}
          >
            {defaultSub}
          </span>
        </div>
      )}
    </div>
  );
};
