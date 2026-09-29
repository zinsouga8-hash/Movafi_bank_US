import { SupportedCurrency } from '../types/banking';

export function formatCurrency(amount: number, currency: SupportedCurrency = 'USD'): string {
  const currencyLocales: Record<SupportedCurrency, string> = {
    USD: 'en-US',
    CAD: 'en-CA',
    EUR: 'de-DE',
    SAR: 'ar-SA',
    AED: 'ar-AE',
    BHD: 'ar-BH'
  };

  try {
    return new Intl.NumberFormat(currencyLocales[currency] || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
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
