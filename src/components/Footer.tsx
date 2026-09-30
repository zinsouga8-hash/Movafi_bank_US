import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, ExternalLink, Lock } from 'lucide-react';
import { SupportedLanguage } from '../types/banking';
import { translations } from '../i18n/translations';
import { MovafiLogo } from './MovafiLogo';

interface FooterProps {
  currentLang: SupportedLanguage;
  city?: string;
  supportEmail?: string;
  supportPhone?: string;
  onOpenAdmin?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  city = 'New York',
  supportEmail = 'concierge@movafibank.com',
  supportPhone = '+1 (212) 555-0198',
  onOpenAdmin,
  onNavigateSection
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 transition-colors pt-16 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <MovafiLogo
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm pt-2">
              {t.subTagline}
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{(t.footerOps || 'Executive Operations: {city}, United States').replace('{city}', city)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <a href={`mailto:${supportEmail}`} className="hover:text-amber-400 transition-colors">
                  {supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{supportPhone}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {t.footerSolutions || 'Solutions'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigateSection?.('wealth')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footerWealthAdvisory || 'Wealth Advisory & Escrow'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('financing')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footerCorpLiquidity || 'Corporate Liquidity Lines'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('digital')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footerMetalCards || 'Bespoke Metal & Virtual Cards'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('digital')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footerMultiTreasury || 'Multi-Currency Treasury'}
                </button>
              </li>
              <li>
                <span className="text-slate-400">{t.footerStablecoin || 'Institutional Settlement Rail'}</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {t.footerGovernance || 'Governance'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigateSection?.('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.footerBlueprint || 'Institutional Blueprint'}
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  {t.footerFramework || 'Global Clearing Framework'}
                </span>
              </li>
              <li>
                <span className="text-amber-400/90 font-medium">{t.footerCertification || 'SOC 2 Type II Certified Architecture'}</span>
              </li>
              <li>
                <span className="text-slate-400">{t.footerIso || 'ISO 27001 Security Controls'}</span>
              </li>
              {onOpenAdmin && (
                <li className="pt-2">
                  <button
                    onClick={onOpenAdmin}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{t.footerAdmin || 'Executive Administration'}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Private Concierge Desk */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {t.footerConciergeDesk || 'Private Concierge'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerConciergeAvailability || 'Available 24/7/365 to accredited institutional clients and registered corporate signatories.'}
            </p>
            <div className="pt-1">
              <a
                href={`mailto:${supportEmail}?subject=Direct%20Concierge%20Dispatch`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                <span>{t.footerDispatchConcierge || 'Dispatch Concierge Request'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {t.footerRights}
          </div>

          <div className="flex items-center gap-6">
            <span>{t.termsConditions}</span>
            <span>·</span>
            <span>{t.privacyPolicy}</span>
            <span>·</span>
            <span>{t.securityAudit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
