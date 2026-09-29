import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRight, Sliders, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { LoanRate, SupportedCurrency } from '../types/banking';
import { formatCurrency, calculateAmortization } from '../utils/formatters';

interface LoanSimulatorPreviewProps {
  onOpenRegister: () => void;
  currency?: SupportedCurrency;
}

export const LoanSimulatorPreview: React.FC<LoanSimulatorPreviewProps> = ({
  onOpenRegister,
  currency = 'USD'
}) => {
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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Institutional Credit Facilities
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Private Credit & Project Financing Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live indicative parameters powered by the Movafi Core Underwriting Engine.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-xs">
            Dynamic Indicative Rate: {currentRate.toFixed(2)}% p.a.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Financing Category
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Real Estate',
                  'Automobile',
                  'Renovation',
                  'Business',
                  'Working Capital',
                  'Education',
                  'Other'
                ].map((cat) => (
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
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Principal Facility Amount</span>
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
                <span className="font-medium text-slate-700 dark:text-slate-300">Amortization Period</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {months} Months ({Math.round(months / 12)} Years)
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
              Indicative Monthly Amortization
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 tabular-nums">
              {formatCurrency(result.monthlyPayment, currency)}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Total Interest</span>
                <div className="font-mono font-bold mt-0.5">
                  {formatCurrency(result.totalInterest, currency)}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Total Commitment</span>
                <div className="font-mono font-bold mt-0.5">
                  {formatCurrency(result.totalCost, currency)}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenRegister}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
            >
              <span>Open an Account to Apply</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
