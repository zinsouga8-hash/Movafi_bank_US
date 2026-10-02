import { SupportedCurrency } from '../types/banking';

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'USD',
  lang?: string
): string {
  const currentDocLang = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
  const activeLang = lang || currentDocLang;
  const isAr = activeLang === 'ar';

  if (isAr) {
    const arabicLocales: Record<string, string> = {
      SAR: 'ar-SA',
      AED: 'ar-AE',
      BHD: 'ar-BH',
      TND: 'ar-TN',
      USD: 'ar-US',
      EUR: 'ar-FR',
      CAD: 'ar-CA',
      JPY: 'ar-JP',
      MXN: 'ar-MX'
    };
    try {
      return new Intl.NumberFormat(arabicLocales[currency] || 'ar-SA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  // Non-Arabic: Never display Arabic letters. Display standard symbol or international currency code
  const numFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2
  }).format(amount);

  if (currency === 'USD') return `$${numFormatted}`;
  if (currency === 'EUR') return `€${numFormatted}`;
  if (currency === 'CAD') return `CA$${numFormatted}`;

  // For AED, TND, JPY, SAR, BHD, MXN, etc., use international code: "1,250.00 AED", "5,000.00 TND"
  return `${numFormatted} ${currency}`;
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return isoString;
  }
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

/**
 * Calculates standard monthly amortizing payment:
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateAmortization(
  principal: number,
  annualRatePercent: number,
  months: number
): {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  schedule: AmortizationRow[];
} {
  const monthlyRate = annualRatePercent / 100 / 12;
  let monthlyPayment = 0;

  if (monthlyRate === 0) {
    monthlyPayment = principal / months;
  } else {
    monthlyPayment = (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  let remaining = principal;
  let totalInterest = 0;
  const schedule: AmortizationRow[] = [];

  for (let m = 1; m <= months; m++) {
    const interest = remaining * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    remaining = Math.max(0, remaining - principalPaid);
    totalInterest += interest;

    schedule.push({
      month: m,
      payment: Number(monthlyPayment.toFixed(2)),
      principal: Number(principalPaid.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      remainingBalance: Number(remaining.toFixed(2))
    });
  }

  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalCost: Number((principal + totalInterest).toFixed(2)),
    schedule
  };
}
