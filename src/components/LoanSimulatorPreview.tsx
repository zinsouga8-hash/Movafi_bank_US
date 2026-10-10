import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRight, Sliders, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { LoanRate, SupportedCurrency, SupportedLanguage } from '../types/banking';
import { formatCurrency, calculateAmortization } from '../utils/formatters';
import { translations } from '../i18n/translations';

interface LoanSimulatorPreviewProps {
  onOpenRegister: () => void;
  currency?: SupportedCurrency;
  currentLang?: SupportedLanguage;
}

export const LoanSimulatorPreview: React.FC<LoanSimulatorPreviewProps> = ({
  onOpenRegister,
  currency = 'USD',
  currentLang = 'es'
}) => {
  const t = translations[currentLang] || translations.es || translations.en;
  const isRtl = currentLang === 'ar';
  const [rates, setRates] = useState<LoanRate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Real Estate');
  const [amount, setAmount] = useState(350000);
  const [months, setMonths] = useState(180);

  useEffect(() => {
    api.getLoanRates().then((res) => {
      if (res.success && res.rates.length > 0) {
        setRates(res.rates);
      }
    }).catch(() => {});
  }, []);

  const currentRate =
    rates.find((r) => r.category.toLowerCase() === selectedCategory.toLowerCase())?.annual_rate_percent || 2.45;

  const result = calculateAmortization(amount, currentRate, months);

  const categoryLabels: Record<string, { en: string; fr: string; es: string; ar: string }> = {
    'Real Estate': { en: 'Real Estate', fr: 'Immobilier', es: 'Bienes Raíces', ar: 'عقارات' },
    'Automobile': { en: 'Automobile', fr: 'Automobile', es: 'Automóvil', ar: 'مركبات' },
    'Renovation': { en: 'Renovation', fr: 'Rénovation', es: 'Renovación', ar: 'تجديد' },
    'Business': { en: 'Business Expansion', fr: 'Développement Entreprise', es: 'Expansión Empresarial', ar: 'تطوير أعمال' },
    'Working Capital': { en: 'Working Capital', fr: 'Fonds de Roulement', es: 'Capital de Trabajo', ar: 'رأس مال عامل' },
    'Education': { en: 'Family Office / Education', fr: 'Family Office / Études', es: 'Educación / Patrimonio', ar: 'تعليم ومؤسسات' },
    'Other': { en: 'Other Structured Credit', fr: 'Autre Crédit Structuré', es: 'Otro Crédito Estructurado', ar: 'تمويل منظم آخر' }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {currentLang === 'fr'
                ? 'Facilités de Crédit Institutionnelles'
                : currentLang === 'es'
                ? 'Líneas de Crédito Institucionales'
                : currentLang === 'ar'
                ? 'تسهيلات ائتمانية مؤسسية'
                : 'Institutional Credit Facilities'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              {t.simulatorTitle || 'Calculateur de Financement Privé & Lignes de Crédit'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {currentLang === 'fr'
                ? 'Paramètres indicatifs en temps réel gérés par le moteur d\'octroi de Movafi Bank.'
                : currentLang === 'es'
                ? 'Parámetros indicativos en tiempo real gestionados por el motor de concesión de Movafi Bank.'
                : currentLang === 'ar'
                ? 'معايير إرشادية فورية مدعومة بنظام التدقيق الائتماني لموفافي بنك.'
                : 'Live indicative parameters powered by the Movafi Core Underwriting Engine.'}
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-xs whitespace-nowrap">
            {currentLang === 'fr'
              ? `Taux indicatif : ${currentRate.toFixed(2)}% / an`
              : currentLang === 'es'
              ? `Tasa indicativa: ${currentRate.toFixed(2)}% anual`
              : currentLang === 'ar'
              ? `معدل سنوي إرشادي: ${currentRate.toFixed(2)}%`
              : `Dynamic Indicative Rate: ${currentRate.toFixed(2)}% p.a.`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t.projectType || 'Catégorie de Financement'}
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(categoryLabels).map((cat) => {
                  const label = categoryLabels[cat][currentLang] || cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t.desiredAmount || 'Montant du Financement'}
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={1000000}
                step={5000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t.durationMonths || 'Durée d\'amortissement (Mois)'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {months} {currentLang === 'fr' ? 'Mois' : currentLang === 'es' ? 'Meses' : currentLang === 'ar' ? 'شهراً' : 'Months'} ({Math.round(months / 12)} {currentLang === 'fr' ? 'Ans' : currentLang === 'es' ? 'Años' : currentLang === 'ar' ? 'سنوات' : 'Years'})
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={360}
                step={6}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {t.monthlyPayment || 'Mensualité Indicative'}
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 tabular-nums">
              {formatCurrency(result.monthlyPayment, currency)}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">{t.totalInterest || 'Total Intérêts'}</span>
                <div className="font-mono font-bold mt-0.5">
                  {formatCurrency(result.totalInterest, currency)}
                </div>
              </div>
              <div>
                <span className="text-slate-400">{t.totalCost || 'Engagement Total'}</span>
                <div className="font-mono font-bold mt-0.5">
                  {formatCurrency(result.totalCost, currency)}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenRegister}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
            >
              <span>{t.navOpenAccount || 'Ouvrir un compte pour déposer votre dossier'}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
