import React from 'react';

export const MovafiLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 38 : size === 'xl' ? 48 : 32;
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-base';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: iconSize, height: iconSize }}
        className="rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0"
      >
        <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center border border-amber-500/30">
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-amber-400" fill="currentColor">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8l7 3.5v7.4l-7 3.5-7-3.5V8.3l7-3.5zm-1 5.2v6h2v-6h-2z" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`font-black tracking-wider text-white ${textSize} leading-tight`}>
          MOVAFI<span className="text-amber-500">BANK</span>
        </span>
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold leading-none">
          United States · Private Wealth
        </span>
      </div>
    </div>
  );
};
