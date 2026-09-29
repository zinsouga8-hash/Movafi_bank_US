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
  const t = translations[currentLang];

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 transition-colors pt-16 pb-12">
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
                <span>Executive Operations: {city}, United States</span>
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
              Solutions
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigateSection?.('wealth')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Wealth Advisory & Escrow
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('financing')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Corporate Liquidity Lines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('digital')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Bespoke Metal & Virtual Cards
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection?.('digital')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Multi-Currency Treasury
                </button>
              </li>
              <li>
                <span className="text-slate-400">Institutional Stablecoin Rail</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Governance
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigateSection?.('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Institutional Blueprint
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Global Clearing Framework
                </span>
              </li>
              <li>
                <span className="text-amber-400/90 font-medium">SOC 2 Type II Certified Architecture</span>
              </li>
              <li>
                <span className="text-slate-400">ISO 27001 Security Controls</span>
              </li>
              {onOpenAdmin && (
                <li className="pt-2">
                  <button
                    onClick={onOpenAdmin}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Executive Administration</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Private Concierge Desk */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Private Concierge
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Available 24/7/365 to accredited institutional clients and registered corporate signatories.
            </p>
            <div className="pt-1">
              <a
                href={`mailto:${supportEmail}?subject=Direct%20Concierge%20Dispatch`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                <span>Dispatch Concierge Request</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Institutional Regulatory & Compliance Statement */}
        <div className="py-6 border-b border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>INSTITUTIONAL REGULATORY & COMPLIANCE DISCLOSURE</span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[11.5px]">
            {t.demoDisclaimer}
          </p>
          <p className="leading-relaxed text-slate-500 text-[11px]">
            MOVAFI BANK UNITED STATES delivers premier wealth management, multi-currency liquidity reserves, and customized private corporate financing under rigorous fiduciary oversight and 256-bit quantum-resistant security architectures.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 Movafi Bank Corporation. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">{t.privacyPolicy}</span>
            <span className="text-slate-700">·</span>
            <span className="hover:text-slate-400 cursor-pointer">{t.termsConditions}</span>
            <span className="text-slate-700">·</span>
            <span className="hover:text-slate-400 cursor-pointer">{t.securityAudit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
