import { jsPDF } from 'jspdf';
import { Transaction, BankAccount, UserProfile, BankSettings } from '../types/banking';
import { formatCurrency, formatDateTime, AmortizationRow } from './formatters';

export function generateTransactionReceiptPdf(
  tx: Transaction,
  account: BankAccount,
  profile?: UserProfile,
  settings?: BankSettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const goldColor = [180, 130, 60];  // Luxury Gold
  const mutedColor = [100, 116, 139];

  // Header background bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings?.bank_name || 'MOVAFI BANK UNITED STATES', 20, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('OFFICIAL TRANSACTION RECEIPT & LEDGER VOUCHER (PROTOTYPE)', 20, 26);

  // Demo Stamp in corner
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SIMULATED SETTLEMENT', 150, 18);

  // Document metadata box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 45, 170, 30, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('REFERENCE ID', 25, 53);
  doc.text('DATE & TIME', 85, 53);
  doc.text('STATUS', 145, 53);

  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(tx.reference, 25, 62);
  doc.text(formatDateTime(tx.created_at), 85, 62);
  doc.setTextColor(22, 101, 52); // green
  doc.text(tx.status.toUpperCase(), 145, 62);

  // Amount Highlight Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, 85, 170, 35, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('SETTLED AMOUNT', 25, 95);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const formattedAmt = formatCurrency(tx.amount, tx.currency);
  doc.text(formattedAmt, 25, 108);

  // Transaction Breakdown Table
  let currentY = 135;
  const rows = [
    ['Transaction Type', tx.type.replace('_', ' ').toUpperCase()],
    ['Rail / Category', tx.category],
    ['Originating Account', `${account.account_number} (${account.iban})`],
    ['Client ID', account.client_id],
    ['Account Holder', profile ? `${profile.first_name} ${profile.last_name}` : 'Accredited Client'],
    ['Beneficiary Name', tx.recipient_name || 'Movafi Internal Reserve'],
    ['Beneficiary Account', tx.recipient_account || 'N/A'],
    ['Beneficiary BIC / Bank', tx.recipient_bank || account.bic_swift],
    ['Description / Memo', tx.description || 'General transfer settlement'],
    ['Network Execution Fee', formatCurrency(tx.fee || 0, tx.currency)]
  ];

  doc.setFontSize(9);
  doc.setDrawColor(241, 245, 249);

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(label, 25, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(String(value), 85, currentY);

    doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 9;
  });

  // Security Seal & Legal Disclaimer
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(
    'PROTOTYPE ADVISORY: Movafi Bank United States is an advanced financial software demonstrator. This receipt is an internal simulated transaction voucher and does not reflect real-world clearing house funds.',
    20,
    260,
    { maxWidth: 170 }
  );

  doc.text(`Official Seal & System Audit Hash: SHA256-${tx.id.replace(/-/g, '').slice(0, 24).toUpperCase()}`, 20, 275);
  doc.text(`Page 1 of 1 · Movafi Bank Private Concierge · ${settings?.city || 'New York'}, United States`, 20, 280);

  doc.save(`Movafi_Receipt_${tx.reference}.pdf`);
}

export function generateAmortizationPdf(
  projectName: string,
  principal: number,
  currency: string,
  rate: number,
  months: number,
  monthlyPayment: number,
  totalCost: number,
  schedule: AmortizationRow[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MOVAFI BANK — AMORTIZATION SCHEDULE', 20, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Project: ${projectName} · Rate: ${rate}% p.a. · Term: ${months} Months · DEMO SCHEDULE`, 20, 25);

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, 35, 170, 20, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('PRINCIPAL', 25, 42);
  doc.text('MONTHLY PAYMENT', 75, 42);
  doc.text('TOTAL INTEREST & REPAYMENT', 130, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${currency} ${principal.toLocaleString()}`, 25, 49);
  doc.text(`${currency} ${monthlyPayment.toLocaleString()}`, 75, 49);
  doc.text(`${currency} ${totalCost.toLocaleString()}`, 130, 49);

  // Table header
  let y = 63;
  doc.setFillColor(241, 245, 249);
  doc.rect(20, y, 170, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Month', 23, y + 5);
  doc.text('Payment', 55, y + 5);
  doc.text('Principal', 90, y + 5);
  doc.text('Interest', 125, y + 5);
  doc.text('Balance', 160, y + 5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Sample or all rows (if > 30, print first 30 + summary to fit on clean pages)
  const maxRowsOnPage = 28;
  const printRows = schedule.slice(0, maxRowsOnPage);

  printRows.forEach((r) => {
    doc.setTextColor(51, 65, 85);
    doc.text(String(r.month), 23, y);
    doc.text(`${currency} ${r.payment.toFixed(2)}`, 55, y);
    doc.text(`${currency} ${r.principal.toFixed(2)}`, 90, y);
    doc.text(`${currency} ${r.interest.toFixed(2)}`, 125, y);
    doc.text(`${currency} ${r.remainingBalance.toFixed(2)}`, 160, y);
    y += 6.5;
  });

  if (schedule.length > maxRowsOnPage) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`... showing first ${maxRowsOnPage} of ${schedule.length} months. Complete schedule maintained in core banking ledger.`, 20, y + 4);
    y += 10;
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Movafi Bank United States · Indicative Prototype Amortization Schedule · Non-binding demonstration', 20, 282);

  doc.save(`Movafi_Amortization_${projectName.replace(/\s+/g, '_')}.pdf`);
}

export function generateLoanTermsPdf(
  projectName: string,
  amount: number,
  currency: string,
  months: number,
  rate: number,
  profile?: UserProfile,
  settings?: BankSettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings?.bank_name || 'MOVAFI BANK UNITED STATES', 20, 16);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('STRUCTURED CREDIT TERMS & FACILITY AGREEMENT (PROTOTYPE TEMPLATE)', 20, 24);

  let y = 45;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ARTICLE 1 — FACILITY SPECIFICATIONS', 20, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const clauses = [
    `Borrower: ${profile ? `${profile.first_name} ${profile.last_name}` : 'Accredited Client'} (${profile?.email || 'N/A'})`,
    `Lender: Movafi Bank United States, Private Credit Division (${settings?.city || 'New York'})`,
    `Facility Purpose: ${projectName}`,
    `Facility Principal Amount: ${currency} ${amount.toLocaleString()}`,
    `Amortization Period: ${months} Months`,
    `Nominal Annual Interest Rate: ${rate.toFixed(2)}% per annum`,
    `Governing Law & Jurisdiction: Banking & Commercial Code, State of New York`,
    'Repayment Schedule: Monthly linear amortizing payments debited automatically from borrower ledger balance.',
    'Early Settlement: Permitted at any interval with zero early payment penalty under standard banking terms.',
    'Disbursement Condition: Requires client electronic signature of credit parameters and formal committee release.'
  ];

  clauses.forEach((c) => {
    doc.text(`•  ${c}`, 23, y, { maxWidth: 165 });
    y += 7.5;
  });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('ARTICLE 2 — REGULATORY & LEGAL ACKNOWLEDGEMENT', 20, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const disclaimerText =
    'The Borrower acknowledges that this agreement is executed in accordance with Movafi Bank private credit terms and conditions. ' +
    'The facility is subject to final committee underwriting, KYC compliance clearance, and client confirmation.';
  doc.text(disclaimerText, 23, y, { maxWidth: 165 });

  y += 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ELECTRONICALLY VERIFIED SIGNATURE', 23, y);
  doc.text('MOVAFI CREDIT COMMITTEE APPROVAL', 115, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Client: ${profile ? `${profile.first_name} ${profile.last_name}` : 'Verified Client'}`, 23, y);
  doc.text('Status: Terms Accepted Online', 23, y + 5);

  doc.text('Authorized Signatory: Movafi Treasury Desk', 115, y);
  doc.text('Status: Awaiting Verification', 115, y + 5);

  doc.save(`Movafi_Loan_Terms_${projectName.replace(/\s+/g, '_')}.pdf`);
}
