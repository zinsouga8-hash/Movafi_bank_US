import { jsPDF } from 'jspdf';
import { formatCurrency, formatDateTime, calculateAmortization } from './formatters';

export function generateTransactionReceiptPdf(tx: any, user: any, account: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MOVAFI BANK UNITED STATES', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('REÇU OFFICIEL DE TRANSACTION BANCAIRE', 20, 30);
  
  // Transaction info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails de l\'opération', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Référence : ${tx.reference || tx.id}`, 20, 65);
  doc.text(`Date & Heure : ${formatDateTime(tx.created_at)}`, 20, 72);
  doc.text(`Type d'opération : ${tx.type?.toUpperCase() || 'VIREMENT'}`, 20, 79);
  doc.text(`Catégorie : ${tx.category || 'Virement bancaire'}`, 20, 86);
  doc.text(`Statut : ${tx.status?.toUpperCase() || 'COMPLÉTÉ'}`, 20, 93);
  
  // Financial info
  doc.line(20, 100, 190, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(`Montant : ${formatCurrency(tx.amount, tx.currency || account?.currency)}`, 20, 110);
  doc.text(`Frais bancaires : ${formatCurrency(tx.fee || 0, tx.currency || account?.currency)}`, 20, 117);
  
  // Accounts
  doc.line(20, 125, 190, 125);
  doc.setFont('helvetica', 'bold');
  doc.text('Parties prenantes', 20, 135);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Émetteur : ${user?.first_name || ''} ${user?.last_name || ''}`, 20, 145);
  doc.text(`Compte source : ${account?.account_number || '—'} (IBAN: ${account?.iban || '—'})`, 20, 152);
  doc.text(`Bénéficiaire : ${tx.recipient_name || 'Trésorerie Movafi Bank'}`, 20, 159);
  if (tx.recipient_account) {
    doc.text(`Compte bénéficiaire : ${tx.recipient_account}`, 20, 166);
  }
  if (tx.recipient_bank) {
    doc.text(`Banque réceptrice : ${tx.recipient_bank}`, 20, 173);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document généré sous cryptographie bancaire sécurisée — Movafi Bank United States.', 20, 270);
  doc.text('540 Madison Avenue, New York, NY 10022 — https://movafi-groupes.com', 20, 275);
  
  doc.save(`Recu_Transaction_${tx.reference || tx.id}.pdf`);
}

export function generateAmortizationPdf(
  projectType: string,
  amount: number,
  currency: string,
  months: number,
  rate: number,
  user: any
) {
  const doc = new jsPDF();
  const calculation = calculateAmortization(amount, rate, months);
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MOVAFI BANK · TABLEAU D\'AMORTISSEMENT', 20, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Simulation de Prêt : ${projectType} · Client : ${user?.first_name || ''} ${user?.last_name || ''}`, 20, 27);
  
  // Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Capital emprunté : ${formatCurrency(amount, currency)}`, 20, 45);
  doc.text(`Taux annuel fixe : ${rate}%`, 20, 52);
  doc.text(`Durée : ${months} mois (${Math.round(months / 12)} ans)`, 20, 59);
  doc.text(`Mensualité : ${formatCurrency(calculation.monthlyPayment, currency)}`, 110, 45);
  doc.text(`Coût total du crédit : ${formatCurrency(calculation.totalCost, currency)}`, 110, 52);
  doc.text(`Intérêts totaux : ${formatCurrency(calculation.totalInterest, currency)}`, 110, 59);
  
  doc.line(20, 65, 190, 65);
  
  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Mois', 20, 72);
  doc.text('Mensualité', 45, 72);
  doc.text('Principal', 85, 72);
  doc.text('Intérêts', 125, 72);
  doc.text('Capital restant', 160, 72);
  
  let y = 78;
  doc.setFont('helvetica', 'normal');
  
  calculation.schedule.slice(0, 40).forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${row.month}`, 20, y);
    doc.text(formatCurrency(row.payment, currency), 45, y);
    doc.text(formatCurrency(row.principal, currency), 85, y);
    doc.text(formatCurrency(row.interest, currency), 125, y);
    doc.text(formatCurrency(row.remainingBalance, currency), 160, y);
    y += 6;
  });
  
  doc.save(`Amortissement_${projectType}_${amount}${currency}.pdf`);
}

export function generateLoanTermsPdf(user?: any) {
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS GÉNÉRALES DE CRÉDIT ET FINANCEMENT', 20, 20);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const text = [
    'Article 1 : Objet du financement',
    'Movafi Bank accorde des facilités de crédit à taux fixe pour particuliers et professionnels.',
    '',
    'Article 2 : Modalités de remboursement',
    'Les échéances sont prélevées mensuellement sur le compte de dépôt du client.',
    '',
    'Article 3 : Taux d\'intérêt et coût global',
    'Le taux d\'intérêt annuel effectif global (TAEG) est fixé au jour de la validation du dossier.',
    '',
    'Article 4 : Déblocage des fonds',
    'Après examen et approbation du comité de crédit, les fonds sont crédités sur le compte client.'
  ];
  
  let y = 50;
  text.forEach((t) => {
    doc.text(t, 20, y);
    y += 10;
  });
  
  doc.save('Conditions_Generales_Credit_MovafiBank.pdf');
}

export function generateLoanParametersPdf(
  projectType: string,
  amount: number,
  currency: string,
  durationMonths: number,
  rate: number,
  user: any,
  _settings?: any
) {
  generateAmortizationPdf(projectType, amount, currency, durationMonths, rate, user);
}
