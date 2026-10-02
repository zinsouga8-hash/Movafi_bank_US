import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Building2, Sparkles, Award } from 'lucide-react';
import { SupportedLanguage } from '../types/banking';
import { translations } from '../i18n/translations';
import heroBuildingImg from '../assets/images/movafi_hero_building_1790347338293.jpg';

interface HeroProps {
  currentLang: SupportedLanguage;
  city?: string;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentLang,
  city = 'New York',
  onOpenRegister,
  onOpenLogin
}) => {
  const t = translations[currentLang];

  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Background Architectural Image with Luxury Multilayer Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBuildingImg}
          alt="Movafibank Headquarters Tower"
          className="w-full h-full object-cover object-center opacity-25 dark:opacity-20 scale-102 transform transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/95 to-slate-50/80 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/80" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-7">
          {/* Institutional Jurisdiction Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase">
            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>MOVAFIBANK</span>
            <span className="text-amber-500/40">·</span>
            <span className="text-slate-700 dark:text-slate-300">{city} Desk</span>
          </div>

          {/* Main Title with strict typography & text-wrap: balance */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12] text-balance">
            {t.tagline}
          </h1>

          {/* Body Prose */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
            {t.subTagline} {t.heroSubText}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>{t.navOpenAccount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-semibold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{t.navPortal}</span>
            </button>
          </div>

          {/* Trust Separators */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.heroTrustLedger || 'Cryptographic Multi-Factor Ledger'}</span>
            </div>
            <span>·</span>
            <span>{t.heroTrustTreasury || 'Multi-Currency Treasury (USD / CAD / EUR / BHD / SAR / AED)'}</span>
            <span>·</span>
            <span>{t.heroTrustCustody || 'Institutional Escrow & Custody'}</span>
          </div>
        </div>

        {/* Demonstration Metrics Grid (Prompt Section 7) */}
        <div className="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6">
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-500/30 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums tracking-tight">
                {t.statAum}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.statAumLabel}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-500/30 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums tracking-tight">
                {t.statCountries}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.statCountriesLabel}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-500/30 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums tracking-tight">
                {t.statClients}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.statClientsLabel}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-500/30 transition-colors">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {t.statAvailability}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.statAvailabilityLabel}
              </div>
            </div>
          </div>

          <div className="mt-4 text-right text-[11px] text-slate-400 dark:text-slate-500 italic">
            {t.statDisclaimer}
          </div>
        </div>
      </div>
    </section>
  );
};
