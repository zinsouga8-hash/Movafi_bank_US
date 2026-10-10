export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface AmortizationCalculation {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function formatCurrency(amount: number | undefined | null, currency: string = 'USD'): string {
  const numeric = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numeric);
  } catch {
    return `${numeric.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function maskCardNumber(cardNumber?: string): string {
  if (!cardNumber) return '•••• •••• •••• ••••';
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 4) return cardNumber;
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function calculateAmortization(
  principal: number,
  annualRatePercent: number,
  durationMonths: number
): AmortizationCalculation {
  const p = Math.max(0, principal);
  const n = Math.max(1, durationMonths);
  const r = annualRatePercent > 0 ? annualRatePercent / 100 / 12 : 0;

  let monthlyPayment = 0;
  if (r === 0) {
    monthlyPayment = p / n;
  } else {
    monthlyPayment = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  }

  const schedule: AmortizationRow[] = [];
  let remaining = p;
  let totalInterest = 0;

  for (let m = 1; m <= n; m++) {
    const interest = remaining * r;
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
    totalCost: Number((p + totalInterest).toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    schedule
  };
}

export function calculateLoanDetails(
  amount: number,
  ratePercent: number,
  months: number
) {
  return calculateAmortization(amount, ratePercent, months);
}
