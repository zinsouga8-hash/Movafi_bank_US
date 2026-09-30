import React, { useState } from 'react';
import {
  TrendingUp,
  Building,
  CreditCard,
  Globe2,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SupportedLanguage } from '../types/banking';
import { translations } from '../i18n/translations';
import privateDeskImg from '../assets/images/movafi_wealth_vault_1790347351259.jpg';
import { AboutSection } from './AboutSection';

interface SolutionsProps {
  currentLang: SupportedLanguage;
  onOpenRegister: () => void;
  onOpenFinancingSimulator: () => void;
  supportEmail?: string;
  supportPhone?: string;
}

export const Solutions: React.FC<SolutionsProps> = ({
  currentLang,
  onOpenRegister,
  onOpenFinancingSimulator,
  supportEmail,
  supportPhone
}) => {
  const t = translations[currentLang] || translations.en;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="py-20 space-y-24">
      {/* Section 1: Wealth Management */}
      <section id="wealth" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              {t.solutionWealthSub || '01. Bespoke Wealth Advisory'}
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t.solutionWealthTitle || `${t.navWealth} & Sovereign Family Office Reserves`}
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.solutionWealthDesc || 'We structure personalized multi-asset allocations designed to preserve, defend, and optimize capital across global economic shifts.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs">
                <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.solutionAllocTitle || 'Custom Allocation'}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {t.solutionAllocDesc || 'Tailored mandate models aligned with your risk tolerance and governance philosophy.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs">
                <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.solutionRealEstateTitle || 'Prime Real Estate'}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {t.solutionRealEstateDesc || 'Cross-border commercial and luxury residential portfolio financing and escrow.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs">
                <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.solutionDigitalTreasuryTitle || 'Digital Assets & Treasury'}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {t.solutionDigitalTreasuryDesc || 'Institutional settlement gateways for secure cryptographic liquidity and treasury management.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs">
                <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.solutionBankerTitle || 'Dedicated Banker'}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {t.solutionBankerDesc || 'Direct access to an executive private banker for confidential mandates.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenRegister}
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <span>{t.solutionRequestDossier || 'Request Private Advisory Dossier'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 aspect-4/3 group bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
              {!imageError && (
                <img
                  src={privateDeskImg}
                  alt="Movafi Private Wealth Management Lounge"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700"
                />
              )}
              {imageError && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Building className="w-8 h-8" />
                  </div>
                  <div className="text-white font-bold text-lg">MOVAFI PRIVATE DESK</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Executive private client salon & multi-family governance suites.
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-6">
                <div className="text-white">
                  <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                    {t.solutionPrivateDeskTitle || 'Manhattan Private Desk'}
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {t.solutionPrivateDeskDesc || 'Confidential executive client salon & multi-family governance suites.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Corporate Financing */}
      <section id="financing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
            {t.solutionFinancingSub || '02. Institutional Liquidity'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.solutionFinancingTitle || `${t.navFinancing} & Structured Credit Facilities`}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.solutionFinancingDesc || 'From working capital revolvers to major corporate acquisitions, Movafi Bank deploys custom liquidity structured around your corporate balance sheet.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              {t.solutionWorkingCapTitle || 'Working Capital'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.solutionWorkingCapDesc || 'Flexible revolving facilities engineered for supply chain stabilization and rapid operational expansion.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              {t.solutionAcquisitionTitle || 'M&A Acquisition Lines'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.solutionAcquisitionDesc || 'Discreet bridge facilities and buyout financing backed by cross-jurisdictional securities.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              {t.solutionFactoringTitle || 'Factoring & Receivables'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.solutionFactoringDesc || 'Immediate monetization of verified institutional receivables with zero recourse options.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              04
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              {t.solutionTreasuryLinesTitle || 'Treasury Credit Lines'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.solutionTreasuryLinesDesc || 'Overdraft and liquidity cushions linked dynamically to your primary treasury account.'}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onOpenFinancingSimulator}
            className="px-6 py-3 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>{t.solutionLaunchSimulator || 'Launch Interactive Credit Simulator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Section 3: Digital Solutions */}
      <section id="digital" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl">
          <div className="max-w-2xl space-y-4">
            <div className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
              {t.solutionRailsSub || '03. Next-Gen Banking Rails'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t.solutionRailsTitle || `${t.navDigital} & Global Settlements`}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t.solutionRailsDesc || 'Native multi-currency accounts (USD, EUR, CAD, BHD, SAR, AED), instant virtual cards, physical engraved metal cards, and automated PDF ledger reconciliation.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <CreditCard className="w-6 h-6 text-amber-400" />
              <h4 className="font-semibold text-base">{t.solutionCardFeatureTitle || 'Virtual & Metal Cards'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.solutionCardFeatureDesc || 'Visa & Mastercard issuance in Gold and Platinum tiers with customizable spending caps and instant freezing.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <Globe2 className="w-6 h-6 text-amber-400" />
              <h4 className="font-semibold text-base">{t.solutionWireFeatureTitle || 'International Wire Rails'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.solutionWireFeatureDesc || 'Direct domestic Fedwire/ACH routing and SWIFT messaging with automated cryptographic transaction receipts.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <Cpu className="w-6 h-6 text-amber-400" />
              <h4 className="font-semibold text-base">{t.solutionAssetFeatureTitle || 'Digital Asset Infrastructure'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.solutionAssetFeatureDesc || 'Seamless institutional integration for enterprise USDC and digital liquidity settlement verification.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Full Institutional About Movafi Bank */}
      <AboutSection
        currentLang={currentLang}
        supportEmail={supportEmail}
        supportPhone={supportPhone}
        onOpenRegister={onOpenRegister}
      />
    </div>
  );
};
