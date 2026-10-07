import { jsPDF } from 'jspdf';
import { Transaction, BankAccount, UserProfile, BankSettings } from '../types/banking';
import { formatCurrency, formatDateTime, AmortizationRow, calculateLoanDetails, DetailedAmortizationRow } from './formatters';

// Colors based on the provided reference documents
const COLOR_PRIMARY_BLUE = [29, 78, 216]; // #1D4ED8
const COLOR_DARK_TEXT = [30, 41, 59];    // #1E293B
const COLOR_MUTED_TEXT = [100, 116, 139]; // #64748B
const COLOR_GREEN_BG = [235, 248, 238];  // Light green box
const COLOR_GREEN_BORDER = [134, 239, 172];
const COLOR_GREEN_TEXT = [21, 128, 61];   // #15803D
const COLOR_AMBER_BG = [254, 243, 199];  // Light amber warning box
const COLOR_AMBER_BORDER = [245, 158, 11];
const COLOR_AMBER_TEXT = [146, 64, 14];
const COLOR_LIGHT_BLUE_BG = [239, 246, 255]; // Light blue acceptance box
const COLOR_LIGHT_BLUE_BORDER = [191, 219, 254];
const COLOR_STAMP_RED = [190, 24, 24];   // Confidential stamp

/**
 * Draws the official Movafi Bank letterhead header
 */
function drawDocumentHeader(doc: jsPDF): void {
  // Left: Logo and branding
  // Stylized modern bank crest/emblem
  doc.setFillColor(29, 78, 216);
  doc.circle(26, 18, 5.5, 'F');
  doc.setFillColor(16, 185, 129);
  doc.circle(28.5, 20.5, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('MOVAFI BANK', 37, 18);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Services de Facilitation et Financement de Crédit', 20, 27);

  // Right: Institution legal details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('MOVAFI BANK', 190, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NIF / CIF : B-88492011', 190, 18, { align: 'right' });
  doc.text('Numéro de TVA intracommunautaire : US88492011', 190, 21.5, { align: 'right' });
  doc.text('540 Madison Avenue · New York, NY 10022, USA', 190, 25, { align: 'right' });
  doc.text('contact@movafi-groupes.com', 190, 28.5, { align: 'right' });
  doc.text('+1 (212) 555-0100', 190, 32, { align: 'right' });
}

/**
 * Draws the official legal footer on every page
 */
function drawDocumentFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 277, 190, 277);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MOVAFI BANK', 105, 281, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NIF / CIF : B-88492011 | Numéro de TVA intracommunautaire: US88492011', 105, 284.5, { align: 'center' });
  doc.text('Registre Fédéral Bancaire — Licence US-88492, Desk Privé, 540 Madison Avenue, New York', 105, 288, { align: 'center' });
  doc.text(`Tous droits réservés © 2026 MOVAFI BANK · Page ${pageNumber} sur ${totalPages}`, 105, 291.5, { align: 'center' });
}

/**
 * Draws the prominent blue banner (e.g. CONDITIONS DE PRÊT, PARAMÈTRES DE PRÊT)
 */
function drawBlueBanner(doc: jsPDF, title: string, yPos: number = 38): void {
  doc.setFillColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.rect(20, yPos, 170, 13, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 105, yPos + 8.5, { align: 'center' });
}

/**
 * Draws the authentic red diagonal CONFIDENTIAL stamp
 */
function drawConfidentialStamp(doc: jsPDF, x: number, y: number): void {
  doc.saveGraphicsState();
  doc.setTextColor(COLOR_STAMP_RED[0], COLOR_STAMP_RED[1], COLOR_STAMP_RED[2]);
  doc.setDrawColor(COLOR_STAMP_RED[0], COLOR_STAMP_RED[1], COLOR_STAMP_RED[2]);
  doc.setLineWidth(1.4);

  // Outer border with angle
  doc.roundedRect(x - 38, y - 7, 76, 17, 2, 2, 'S');
  doc.setLineWidth(0.6);
  doc.roundedRect(x - 36.5, y - 5.5, 73, 14, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('CONFIDENTIAL', x, y + 4.5, { align: 'center' });
  doc.restoreGraphicsState();
}

/**
 * Draws signatures table block
 */
function drawSignatureBlock(doc: jsPDF, borrowerName: string, yPos: number): void {
  const colW = 85;
  const h = 45;

  // Outer box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(20, yPos, 170, h, 'S');
  doc.line(105, yPos, 105, yPos + h);
  doc.line(20, yPos + 12, 190, yPos + 12);
  doc.line(20, yPos + 37, 190, yPos + 37);

  // Header 1: Emprunteur
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Emprunteur', 62.5, yPos + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(borrowerName, 62.5, yPos + 9.5, { align: 'center' });

  // Header 2: Institution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Institution prêteuse', 147.5, yPos + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('MOVAFI BANK', 147.5, yPos + 9.5, { align: 'center' });

  // Simulated signatures
  // Bank Signature (Calligraphic fluid curve)
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.8);
  doc.lines(
    [
      [8, -6, 12, -4, 16, -1],
      [-5, 4, -8, 7, -10, 8],
      [6, -3, 14, -8, 20, -2],
      [-4, 3, -12, 5, -8, 6],
      [10, -5, 18, -3, 24, 0]
    ],
    135,
    yPos + 26
  );

  // Borrower signature mark
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.6);
  doc.lines(
    [
      [6, -4, 10, -3, 14, 0],
      [-3, 3, -6, 5, -8, 6],
      [8, -4, 15, -6, 20, -1]
    ],
    52,
    yPos + 26
  );

  // Bottom text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Signature', 62.5, yPos + 42, { align: 'center' });
  doc.text('Signature', 147.5, yPos + 42, { align: 'center' });
}

// -------------------------------------------------------------
// 1. GENERATE OFFICIAL CONDITIONS DE PRÊT (Document 1, 5 Pages)
// -------------------------------------------------------------
export function generateLoanTermsPdf(
  projectName: string,
  amount: number,
  currency: string,
  months: number,
  rate: number,
  profile?: UserProfile,
  settings?: BankSettings,
  loanId?: string,
  createdAt?: string,
  lang?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const targetLang = (lang || profile?.preferred_language || (typeof document !== 'undefined' ? document.documentElement.lang : 'es') || 'es') as string;
  const isEs = targetLang === 'es';

  const borrowerName = profile ? `${profile.first_name} ${profile.last_name}` : (isEs ? 'Carlos Mendoza' : 'Christiane Leu');
  const borrowerCountry = profile?.nationality || profile?.residence_country || (isEs ? 'México' : 'France');
  const borrowerEmail = profile?.email || 'client@movafi-groupes.com';

  const loanCalc = calculateLoanDetails(amount, rate, months, createdAt);

  const docDate = createdAt
    ? new Date(createdAt).toLocaleDateString(isEs ? 'es-ES' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString(isEs ? 'es-ES' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const refCode = loanId
    ? `LS-${loanId.replace(/\D/g, '').slice(-3) || '380'}-2026`
    : `LS-380-2026`;

  const totalPages = 4;

  // ==========================================
  // PAGE 1 : Header, Banner, Section 1 & 2.1
  // ==========================================
  drawDocumentHeader(doc);
  drawBlueBanner(doc, isEs ? 'CONDICIONES DEL PRÉSTAMO' : 'CONDITIONS DE PRÊT', 38);

  let y = 57;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(isEs ? `Fecha del documento: ${docDate}` : `Date du document: ${docDate}`, 20, y);
  y += 6;
  doc.text(isEs ? `Número de referencia: ${refCode}` : `Numéro de référence: ${refCode}`, 20, y);

  y += 12;
  // 1. CONDITIONS GÉNÉRALES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '1. CONDICIONES GENERALES' : '1. CONDITIONS GÉNÉRALES', 20, y);

  y += 8;
  doc.setFontSize(9.5);
  doc.text(isEs ? '1.1 Partes contratantes' : '1.1 Parties', 20, y);

  y += 4;
  // Parties Table
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(20, y, 170, 24, 'S');
  doc.line(20, y + 8, 190, y + 8);
  doc.line(65, y, 65, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(isEs ? 'Prestamista:' : 'Prêteur:', 24, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('MOVAFI BANK - TVA/NIF: US88492011', 70, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(isEs ? 'Prestatario:' : 'Emprunteur:', 24, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(borrowerName, 70, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(borrowerCountry, 70, y + 17);
  doc.text(borrowerEmail, 70, y + 21);

  y += 30;
  // 1.2 Détails du prêt
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '1.2 Detalles del préstamo' : '1.2 Détails du prêt', 20, y);

  y += 4;
  const detailsRows = [
    [isEs ? 'Monto del préstamo:' : 'Montant du prêt:', `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
    [isEs ? 'Plazo:' : 'Durée:', isEs ? `${months} meses (${Math.round(months / 12)} años)` : `${months} mois (${Math.round(months / 12)} ans)`],
    [isEs ? 'Tasa de interés anual:' : "Taux d'intérêt annuel:", `${rate.toFixed(2)}%`],
    [isEs ? 'Mensualidad:' : 'Mensualité:', `${loanCalc.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
    [isEs ? 'Fecha del primer pago:' : 'Date du premier paiement:', loanCalc.firstPaymentDate],
    [isEs ? 'Monto total a reembolsar:' : 'Montant total à rembourser:', `${loanCalc.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`]
  ];

  const tableH = detailsRows.length * 7;
  doc.rect(20, y, 170, tableH, 'S');
  doc.line(80, y, 80, y + tableH);

  detailsRows.forEach(([lbl, val], idx) => {
    const rowY = y + idx * 7;
    if (idx > 0) doc.line(20, rowY, 190, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, 24, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 85, rowY + 5);
  });

  y += tableH + 12;
  // 2. TAUX D'INTÉRÊT ET FRAIS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '2. TASA DE INTERÉS Y GASTOS' : "2. TAUX D'INTÉRÊT ET FRAIS", 20, y);

  y += 8;
  doc.setFontSize(9.5);
  doc.text(isEs ? '2.1 Tasa de interés fija' : "2.1 Taux d'intérêt", 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? `La tasa de interés anual aplicada a este préstamo se fija en ${rate.toFixed(2)}% durante toda la vigencia del contrato.`
      : `Le taux d'intérêt annuel appliqué à ce prêt est fixé à ${rate.toFixed(2)}% pour toute la durée du contrat.`,
    20,
    y
  );

  drawDocumentFooter(doc, 1, totalPages);

  // ==========================================
  // PAGE 2 : Subvention Green Box, Section 3
  // ==========================================
  doc.addPage();
  drawDocumentHeader(doc);

  y = 42;
  // Encadré Vert : Facilitation de Crédit & Subvention MOVAFI BANK
  doc.setFillColor(COLOR_GREEN_BG[0], COLOR_GREEN_BG[1], COLOR_GREEN_BG[2]);
  doc.setDrawColor(COLOR_GREEN_BORDER[0], COLOR_GREEN_BORDER[1], COLOR_GREEN_BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, y, 170, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
  doc.text(isEs ? '🗎 Facilitación de Crédito y Subvención MOVAFI BANK' : '🗎 Facilitation de Crédit & Subvention MOVAFI BANK', 25, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'MOVAFI BANK actúa como facilitador de crédito y proporciona una subvención del 2% sobre la tasa de interés para que la financiación sea accesible y asequible.'
      : 'MOVAFI BANK agit en tant que facilitateur de crédit et fournit une subvention de 2% sur le taux d\'intérêt pour rendre le financement plus abordable et accessible.',
    25,
    y + 12,
    { maxWidth: 160 }
  );

  doc.text(isEs ? 'Tasa de interés bancaria original:' : "Taux d'intérêt bancaire d'origine:", 25, y + 20);
  doc.text(`${loanCalc.baseRatePercent.toFixed(2)}%`, 180, y + 20, { align: 'right' });

  doc.text(isEs ? 'Tasa de subvención MOVAFI BANK:' : 'Taux de subvention MOVAFI BANK:', 25, y + 24);
  doc.text('-2.00%', 180, y + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(isEs ? 'Tasa final aplicada a su préstamo:' : 'Taux final appliqué à votre prêt:', 25, y + 28);
  doc.text(`${rate.toFixed(2)}%`, 180, y + 28, { align: 'right' });

  doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
  doc.text(
    isEs
      ? `Usted ahorra ${loanCalc.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} durante la duración del préstamo gracias a la subvención MOVAFI BANK.`
      : `Vous économisez ${loanCalc.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} sur toute la durée du prêt grâce à la subvention MOVAFI BANK.`,
    25,
    y + 33
  );

  y += 44;
  // 2.2 Frais supplémentaires
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '2.2 Gastos y comisiones adicionales' : '2.2 Frais supplémentaires', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(isEs ? '•  Gastos de tramitación de la solicitud: Ninguno' : '•  Frais de traitement de la demande: Aucun', 25, y);
  y += 5;
  doc.text(isEs ? '•  Gastos de administración mensual: Ninguno' : '•  Frais de gestion mensuelle: Aucun', 25, y);
  y += 5;
  doc.text(isEs ? '•  Gastos de reembolso anticipado: Véase sección 4.1' : '•  Frais de remboursement anticipé: Voir section 4.1', 25, y);

  y += 12;
  // 3. CONDITIONS DE PAIEMENT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '3. CONDICIONES DE PAGO' : '3. CONDITIONS DE PAIEMENT', 20, y);

  y += 8;
  doc.setFontSize(9.5);
  doc.text(isEs ? '3.1 Calendario de pagos' : '3.1 Échéancier de paiement', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? `El prestatario se compromete a realizar pagos mensuales de ${loanCalc.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} a partir del ${loanCalc.firstPaymentDate}.`
      : `L'emprunteur s'engage à effectuer des paiements mensuels de ${loanCalc.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} à partir du ${loanCalc.firstPaymentDate}.`,
    20,
    y
  );

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '3.2 Modalidad de pago' : '3.2 Mode de paiement', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'Los pagos deben realizarse por transferencia bancaria a los datos bancarios facilitados por MOVAFI BANK.'
      : 'Les paiements doivent être effectués par virement bancaire sur les coordonnées bancaires fournies par MOVAFI BANK.',
    20,
    y,
    { maxWidth: 170 }
  );

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '3.3 Retraso en el pago' : '3.3 Retard de paiement', 20, y);

  y += 5;
  // Amber Box Retard
  doc.setFillColor(COLOR_AMBER_BG[0], COLOR_AMBER_BG[1], COLOR_AMBER_BG[2]);
  doc.setDrawColor(COLOR_AMBER_BORDER[0], COLOR_AMBER_BORDER[1], COLOR_AMBER_BORDER[2]);
  doc.roundedRect(20, y, 170, 15, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_AMBER_TEXT[0], COLOR_AMBER_TEXT[1], COLOR_AMBER_TEXT[2]);
  doc.text(
    isEs
      ? 'En caso de retraso en el pago, se aplicarán intereses de demora del 1,5% mensual sobre el importe pendiente.'
      : 'En cas de retard de paiement, des intérêts de pénalité de 1,5% par mois seront appliqués sur le montant impayé.',
    25,
    y + 6,
    { maxWidth: 160 }
  );

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'Tras 30 días de impago, el prestamista se reserva el derecho de exigir el reembolso inmediato de la totalidad del saldo pendiente.'
      : "Après 30 jours de non-paiement, le prêteur se réserve le droit d'exiger le remboursement immédiat de l'intégralité du solde restant.",
    20,
    y,
    { maxWidth: 170 }
  );

  y += 14;
  // 4. REMBOURSEMENT ANTICIPÉ (Heading on Page 2)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '4. REEMBOLSO ANTICIPADO' : '4. REMBOURSEMENT ANTICIPÉ', 20, y);

  drawDocumentFooter(doc, 2, totalPages);

  // ==========================================
  // PAGE 3 : Sections 4, 5, 6, 7
  // ==========================================
  doc.addPage();
  drawDocumentHeader(doc);

  y = 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '4.1 Condiciones de amortización anticipada' : '4.1 Conditions de remboursement anticipé', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'El prestatario puede amortizar el préstamo anticipadamente, en su totalidad o en parte, en cualquier momento sin penalización si:'
      : "L'emprunteur peut rembourser le prêt par anticipation, en totalité ou en partie, à tout moment sans pénalité si :",
    20,
    y
  );
  y += 6;
  doc.text(isEs ? '•  Se da notificación escrita con al menos 30 días de antelación' : '•  Un préavis écrit est donné au moins 30 jours à l\'avance', 25, y);
  y += 5;
  doc.text(isEs ? '•  Se han realizado al menos 6 pagos mensuales' : '•  Au moins 6 paiements mensuels ont été effectués', 25, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '4.2 Gastos de reembolso anticipado' : '4.2 Frais de remboursement anticipé', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'Para un reembolso anticipado en los primeros 6 meses, se aplicará una comisión del 1% del capital restante.'
      : 'Pour un remboursement anticipé dans les 6 premiers mois, des frais de 1% du capital restant seront appliqués.',
    20,
    y
  );

  y += 14;
  // 5. OBLIGATIONS DE L'EMPRUNTEUR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? "5. OBLIGACIONES DEL PRESTATARIO" : "5. OBLIGATIONS DE L'EMPRUNTEUR", 20, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(isEs ? "El prestatario se compromete a:" : "L'emprunteur s'engage à :", 20, y);

  const obligations = isEs ? [
    'Realizar todos los pagos a tiempo según el calendario acordado',
    'Informar a MOVAFI BANK de cualquier cambio de situación personal o financiera',
    'Notificar cualquier cambio de domicilio o datos de contacto en un plazo de 15 días',
    'Mantener una cobertura de seguro adecuada si fuera necesario',
    'No utilizar los fondos del préstamo para fines ilícitos'
  ] : [
    'Effectuer tous les paiements à temps selon l\'échéancier convenu',
    'Informer MOVAFI BANK de tout changement de situation personnelle ou financière',
    'Notifier tout changement d\'adresse ou de coordonnées dans les 15 jours',
    'Maintenir une couverture d\'assurance adéquate si nécessaire',
    'Ne pas utiliser le prêt à des fins illégales'
  ];

  obligations.forEach((ob) => {
    y += 5.5;
    doc.text(`•  ${ob}`, 25, y);
  });

  y += 14;
  // 6. DROITS DU PRÊTEUR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '6. DERECHOS DEL PRESTAMISTA' : '6. DROITS DU PRÊTEUR', 20, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(isEs ? 'MOVAFI BANK se reserva el derecho de:' : 'MOVAFI BANK se réserve le droit de :', 20, y);

  const rights = isEs ? [
    'Solicitar justificantes de ingresos o de situación financiera en cualquier momento',
    'Modificar la tasa en caso de cambio significativo del mercado (previo aviso de 60 días)',
    'Rescindir el contrato en caso de fraude o falsedad en las declaraciones',
    'Iniciar acciones legales para recuperar los importes debidos e impagados'
  ] : [
    'Demander une preuve de revenus ou de situation financière à tout moment',
    'Modifier le taux d\'intérêt en cas de changement significatif des conditions du marché (avec un préavis de 60 jours)',
    'Résilier le contrat en cas de fraude ou de fausse déclaration',
    'Entreprendre des actions en justice pour récupérer les montants impayés'
  ];

  rights.forEach((rg) => {
    y += 5.5;
    doc.text(`•  ${rg}`, 25, y, { maxWidth: 165 });
  });

  y += 14;
  // 7. DÉFAUT ET CONSÉQUENCES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '7. INCUMPLIMIENTO Y CONSECUENCIAS' : '7. DÉFAUT ET CONSÉQUENCES', 20, y);

  y += 8;
  doc.setFontSize(9.5);
  doc.text(isEs ? '7.1 Supuestos de incumplimiento' : '7.1 Événements de défaut', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(isEs ? 'El préstamo se considerará en incumplimiento si:' : 'Le prêt sera considéré en défaut si :', 20, y);
  y += 5.5;
  doc.text(isEs ? '•  El pago tiene más de 30 días de retraso' : '•  Le paiement a plus de 30 jours de retard', 25, y);

  drawDocumentFooter(doc, 3, totalPages);

  // ==========================================
  // PAGE 4 : Défaut suite, 8, 9, 10
  // ==========================================
  doc.addPage();
  drawDocumentHeader(doc);

  y = 42;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(isEs ? '•  El prestatario se declara en quiebra o concurso' : '•  L\'emprunteur déclare faillite', 25, y);
  y += 5.5;
  doc.text(isEs ? '•  Se proporcionaron datos falsos en la solicitud' : '•  De fausses informations ont été fournies dans la demande', 25, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '7.2 Consecuencias del incumplimiento' : '7.2 Conséquences du défaut', 20, y);

  y += 5;
  // Amber Box Conséquences défaut
  doc.setFillColor(COLOR_AMBER_BG[0], COLOR_AMBER_BG[1], COLOR_AMBER_BG[2]);
  doc.setDrawColor(COLOR_AMBER_BORDER[0], COLOR_AMBER_BORDER[1], COLOR_AMBER_BORDER[2]);
  doc.roundedRect(20, y, 170, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_AMBER_TEXT[0], COLOR_AMBER_TEXT[1], COLOR_AMBER_TEXT[2]);
  doc.text(
    isEs
      ? 'En caso de incumplimiento, el prestamista puede exigir el reembolso inmediato de todas las cantidades impagadas, más las penalizaciones y costas judiciales.'
      : 'En cas de défaut, le prêteur peut exiger le remboursement immédiat de tous les montants impayés, plus les pénalités et frais juridiques.',
    25,
    y + 6.5,
    { maxWidth: 160 }
  );

  y += 24;
  // 8. CONFIDENTIALITÉ ET PROTECTION DES DONNÉES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '8. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS' : '8. CONFIDENTIALITÉ ET PROTECTION DES DONNÉES', 20, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'MOVAFI BANK se compromete a proteger los datos personales de los prestatarios conforme al RGPD y normativas internacionales. La información solo se utilizará para la gestión del préstamo y no se compartirá con terceros sin consentimiento, salvo imperativo legal.'
      : 'MOVAFI BANK s\'engage à protéger les données personnelles des emprunteurs conformément au RGPD. Les informations personnelles ne seront utilisées qu\'à des fins de gestion de prêt et ne seront pas partagées avec des tiers sans consentement, sauf si la loi l\'exige.',
    20,
    y,
    { maxWidth: 170 }
  );

  y += 20;
  // 9. RÈGLEMENT DES LITIGES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '9. RESOLUCIÓN DE CONFLICTOS' : '9. RÈGLEMENT DES LITIGES', 20, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'Cualquier litigio derivado de este acuerdo de préstamo se someterá a la jurisdicción competente de los tribunales de Nueva York, Estados Unidos.'
      : 'Tout litige découlant de cet accord de prêt sera soumis à la juridiction compétente des tribunaux de New York, United States.',
    20,
    y,
    { maxWidth: 170 }
  );
  y += 6;
  doc.text(
    isEs
      ? 'Las partes se comprometen a intentar primero resolver cualquier conflicto mediante mediación antes de recurrir a la vía judicial.'
      : 'Les parties s\'engagent à tenter d\'abord de résoudre tout litige par médiation avant de recourir à une action en justice.',
    20,
    y,
    { maxWidth: 170 }
  );

  y += 18;
  // 10. ACCEPTATION ET ACCORD EN LIGNE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? '10. ACEPTACIÓN Y ACUERDO EN LÍNEA' : '10. ACCEPTATION ET ACCORD EN LIGNE', 20, y);

  y += 6;
  // Blue Box Acceptation
  doc.setFillColor(COLOR_LIGHT_BLUE_BG[0], COLOR_LIGHT_BLUE_BG[1], COLOR_LIGHT_BLUE_BG[2]);
  doc.setDrawColor(COLOR_LIGHT_BLUE_BORDER[0], COLOR_LIGHT_BLUE_BORDER[1], COLOR_LIGHT_BLUE_BORDER[2]);
  doc.roundedRect(20, y, 170, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text(
    isEs
      ? 'Al validar este documento en línea, el prestatario reconoce haber leído, comprendido y aceptado la totalidad de las condiciones establecidas en este acuerdo de préstamo. No se requiere firma manuscrita: la validación electrónica certificada da plena fe.'
      : 'En validant ce document en ligne, l\'emprunteur reconnaît avoir lu, compris et accepté l\'ensemble des conditions énoncées dans cet accord de prêt. Aucune signature manuscrite n\'est requise : la validation électronique certifiée fait foi.',
    25,
    y + 6,
    { maxWidth: 160 }
  );

  y += 28;
  // Certification Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, 170, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(isEs ? 'Certificación y Registro Central MOVAFI BANK' : 'Certification et Enregistrement Central MOVAFI BANK', 105, y + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isEs
      ? 'Expediente validado por consentimiento digital certificado. Archivado bajo sello bancario sin firma física.'
      : 'Dossier validé par consentement numérique certifié. Archivé sous sceau bancaire sans signature physique.',
    105,
    y + 11.5,
    { align: 'center' }
  );

  y += 24;
  // Confidential Stamp centered
  drawConfidentialStamp(doc, 105, y + 10);

  drawDocumentFooter(doc, 4, totalPages);

  doc.save(isEs ? `Movafi_Condiciones_Prestamo_${refCode}.pdf` : `Movafi_Conditions_Pret_${refCode}.pdf`);
}

// -------------------------------------------------------------
// 2. GENERATE OFFICIAL PARAMÈTRES DE PRÊT (Document 2)
// -------------------------------------------------------------
export function generateLoanParametersPdf(
  projectName: string,
  amount: number,
  currency: string,
  months: number,
  rate: number,
  profile?: UserProfile,
  settings?: BankSettings,
  loanId?: string,
  createdAt?: string,
  lang?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const targetLang = (lang || profile?.preferred_language || (typeof document !== 'undefined' ? document.documentElement.lang : 'es') || 'es') as string;
  const isEs = targetLang === 'es';

  const borrowerName = profile ? `${profile.first_name} ${profile.last_name}` : (isEs ? 'Carlos Mendoza' : 'Christiane Leu');
  const loanCalc = calculateLoanDetails(amount, rate, months, createdAt);

  const refCode = loanId
    ? `LS-${loanId.replace(/\D/g, '').slice(-3) || '380'}-2026`
    : `LS-380-2026`;

  // Calculate pages required
  const rowsPerPage = 32;
  const firstPageRowsCount = 1;
  const remainingRows = loanCalc.schedule.slice(firstPageRowsCount);
  const additionalPagesCount = Math.ceil(remainingRows.length / rowsPerPage);
  const totalPages = Math.max(2, 1 + additionalPagesCount + 1); // Ensure final signature page

  // ==========================================
  // PAGE 1 : Header, Blue Banner, Loan Details, Subsidy Box, Legal Notice
  // ==========================================
  drawDocumentHeader(doc);
  drawBlueBanner(doc, isEs ? 'PARÁMETROS DEL PRÉSTAMO' : 'PARAMÈTRES DE PRÊT', 38);

  let y = 57;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? 'Detalles del préstamo' : 'Détails du prêt', 20, y);

  y += 4;
  const loanParamRows = [
    [isEs ? 'Monto del préstamo:' : 'Montant du prêt:', `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
    [isEs ? 'Mensualidad:' : 'Mensualité:', `${loanCalc.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
    [isEs ? 'Plazo del préstamo:' : 'Durée du prêt:', `${months} ${isEs ? 'meses' : 'mois'}`],
    [isEs ? 'Intereses pagados:' : 'Intérêts payés:', `${loanCalc.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
    [isEs ? 'Tasa de interés:' : "Taux d'intérêt:", `${rate.toFixed(2)}% / ${isEs ? 'año' : 'année'}`],
    [isEs ? 'Coste total del préstamo:' : 'Coût total du prêt:', `${loanCalc.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`]
  ];

  const tableH = loanParamRows.length * 7;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(20, y, 170, tableH, 'S');
  doc.line(80, y, 80, y + tableH);

  loanParamRows.forEach(([lbl, val], idx) => {
    const rowY = y + idx * 7;
    if (idx > 0) doc.line(20, rowY, 190, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, 24, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, 85, rowY + 5);
  });

  y += tableH + 8;
  // PROGRAMME DE SUBVENTION MOVAFI BANK
  doc.setFillColor(COLOR_GREEN_BG[0], COLOR_GREEN_BG[1], COLOR_GREEN_BG[2]);
  doc.setDrawColor(COLOR_GREEN_BORDER[0], COLOR_GREEN_BORDER[1], COLOR_GREEN_BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, y, 170, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
  doc.text(isEs ? '🗎 PROGRAMA DE SUBVENCIÓN MOVAFI BANK' : '🗎 PROGRAMME DE SUBVENTION MOVAFI BANK', 25, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'MOVAFI BANK actúa como facilitador de crédito y subvenciona el 2% de la tasa de interés para brindarle un financiamiento accesible y asequible.'
      : 'MOVAFI BANK agit en tant que facilitateur de crédit et subventionne 2% du taux d\'intérêt pour vous aider à accéder à un financement abordable.',
    25,
    y + 12,
    { maxWidth: 160 }
  );

  doc.text(isEs ? "Tasa de interés inicial del banco:" : "Taux d'intérêt initial de la banque:", 25, y + 20);
  doc.text(`${loanCalc.baseRatePercent.toFixed(2)}%`, 180, y + 20, { align: 'right' });

  doc.text(isEs ? 'Subvención MOVAFI BANK:' : 'Subvention MOVAFI BANK:', 25, y + 24);
  doc.text('-2.00%', 180, y + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(isEs ? 'Su tasa de interés reducida:' : 'Votre taux d\'intérêt réduit:', 25, y + 28);
  doc.text(`${rate.toFixed(2)}%`, 180, y + 28, { align: 'right' });

  doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
  doc.text(
    isEs
      ? `Ahorro total durante la duración del préstamo: ${loanCalc.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
      : `Économie totale sur la durée du prêt : ${loanCalc.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`,
    25,
    y + 33
  );

  y += 42;
  // Avertissement légal encadré bleu clair
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, 170, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isEs
      ? 'Este documento no detalla el reembolso anticipado del expediente. En caso de aplazamiento de pago, el capital pendiente de este cuadro no tiene en cuenta pagos diferidos. Es preciso añadir cualquier pago diferido al capital pendiente indicado.'
      : 'Ce document ne fournit pas le détail du remboursement anticipé du dossier. En cas de report de paiement, le capital restant indiqué dans ce tableau ne tient pas compte des paiements différés. Il est donc nécessaire d\'ajouter tout paiement différé au capital restant indiqué.',
    24,
    y + 6,
    { maxWidth: 162 }
  );

  y += 24;
  // Échéancier d'amortissement Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(isEs ? "Calendario de amortización" : "Échéancier d'amortissement", 20, y);

  y += 5;
  // Table Header
  function drawAmortTableHeader(currentY: number): void {
    doc.setFillColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
    doc.rect(20, currentY, 170, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(isEs ? 'Nº' : 'N°', 24, currentY + 5);
    doc.text(isEs ? 'Fecha de pago' : 'Date de paiement', 45, currentY + 5);
    doc.text(isEs ? 'Cuota mensual' : 'Mensualité', 80, currentY + 5);
    doc.text(isEs ? 'Intereses pagados' : 'Intérêts payés', 115, currentY + 5);
    doc.text(isEs ? 'Capital amortizado' : 'Capital remboursé', 148, currentY + 5);
    doc.text(isEs ? 'Saldo restante' : 'Solde restant', 188, currentY + 5, { align: 'right' });
  }

  drawAmortTableHeader(y);
  y += 7.5;

  // First row on page 1
  if (loanCalc.schedule.length > 0) {
    const r1 = loanCalc.schedule[0];
    doc.setFillColor(255, 255, 255);
    doc.rect(20, y, 170, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(20, y + 6, 190, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(String(r1.month), 24, y + 4.5);
    doc.text(r1.date, 45, y + 4.5);
    doc.text(r1.payment.toFixed(2), 80, y + 4.5);
    doc.text(r1.interest.toFixed(2), 115, y + 4.5);
    doc.text(r1.principal.toFixed(2), 148, y + 4.5);
    doc.text(r1.remainingBalance.toFixed(2), 188, y + 4.5, { align: 'right' });
  }

  drawDocumentFooter(doc, 1, totalPages);

  // ==========================================
  // PAGES SUIVANTES : Amortization rows
  // ==========================================
  let currentPage = 2;
  let rowIdx = 1;

  while (rowIdx < loanCalc.schedule.length && currentPage < totalPages) {
    doc.addPage();
    drawDocumentHeader(doc);
    y = 42;
    drawAmortTableHeader(y);
    y += 7.5;

    const endIdx = Math.min(rowIdx + rowsPerPage, loanCalc.schedule.length);
    for (let i = rowIdx; i < endIdx; i++) {
      const row = loanCalc.schedule[i];
      const isAlt = i % 2 === 1;

      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, 170, 6, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(20, y + 6, 190, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(String(row.month), 24, y + 4.5);
      doc.text(row.date, 45, y + 4.5);
      doc.text(row.payment.toFixed(2), 80, y + 4.5);
      doc.text(row.interest.toFixed(2), 115, y + 4.5);
      doc.text(row.principal.toFixed(2), 148, y + 4.5);
      doc.text(row.remainingBalance.toFixed(2), 188, y + 4.5, { align: 'right' });

      y += 6;
    }

    drawDocumentFooter(doc, currentPage, totalPages);
    rowIdx = endIdx;
    currentPage++;
  }

  // ==========================================
  // DERNIÈRE PAGE : Finalisation, Signatures, Confidential Stamp
  // ==========================================
  doc.addPage();
  drawDocumentHeader(doc);

  y = 48;
  // Official digital approval notice
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, 170, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text(
    isEs
      ? 'Validación y Aprobación Electrónica de los Parámetros de Crédito'
      : 'Validation et Approbation Électronique des Paramètres de Crédit',
    105,
    y + 7,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isEs
      ? 'El prestatario ha validado electrónicamente los parámetros financieros y el calendario de amortización en línea.'
      : 'L\'emprunteur a validé électroniquement les paramètres financiers et l\'échéancier d\'amortissement en ligne.',
    105,
    y + 13,
    { align: 'center' }
  );
  doc.text(
    isEs
      ? 'No se requiere firma manuscrita. Este documento certificado da fe para el desembolso de los fondos.'
      : 'Aucune signature manuscrite n\'est requise. Ce document certifié fait foi pour le déblocage immédiat des liquidités.',
    105,
    y + 18,
    { align: 'center' }
  );

  y += 42;
  // Big Red Confidential Stamp
  drawConfidentialStamp(doc, 105, y + 25);

  drawDocumentFooter(doc, totalPages, totalPages);

  doc.save(isEs ? `Movafi_Parametros_Pret_${refCode}.pdf` : `Movafi_Parametres_Pret_${refCode}.pdf`);
}

// Backward-compatible alias
export const generateAmortizationPdf = generateLoanParametersPdf;

// -------------------------------------------------------------
// 3. GENERATE TRANSACTION RECEIPT (Récépissé d'Opération)
// -------------------------------------------------------------
export function generateTransactionReceiptPdf(
  tx: Transaction,
  account: BankAccount,
  user: UserProfile,
  settings?: BankSettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawDocumentHeader(doc);
  drawBlueBanner(doc, "RÉCÉPISSÉ D'OPÉRATION BANCAIRE", 38);

  let y = 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date de valeur: ${formatDateTime(tx.created_at)}`, 20, y);
  y += 6;
  doc.text(`Référence d'audit: ${tx.reference || tx.id}`, 20, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text("Détails de l'opération", 20, y);

  y += 4;
  const isCredit = tx.type === 'credit' || tx.type === 'deposit';
  const txRows = [
    ['Titulaire du compte:', `${user.first_name} ${user.last_name}`],
    ['Compte bancaire:', account.account_number],
    ['IBAN international:', account.iban],
    ['Type de transaction:', tx.type.toUpperCase()],
    ['Montant:', `${isCredit ? '+' : '-'}${formatCurrency(tx.amount, tx.currency || account.currency)}`],
    ['Statut comptable:', tx.status ? tx.status.toUpperCase() : 'COMPLÉTÉ (VALEUR ACQUISE)'],
    ['Description / Libellé:', tx.description || 'Virement bancaire certifié'],
    ['Bénéficiaire / Donneur d\'ordre:', tx.recipient_name || 'MOVAFI BANK Central Clearing']
  ];

  const tableH = txRows.length * 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(20, y, 170, tableH, 'S');
  doc.line(75, y, 75, y + tableH);

  txRows.forEach(([lbl, val], idx) => {
    const rowY = y + idx * 8;
    if (idx > 0) doc.line(20, rowY, 190, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, 24, rowY + 5.5);

    doc.setFont('helvetica', lbl.startsWith('Montant') ? 'bold' : 'normal');
    doc.setTextColor(lbl.startsWith('Montant') ? (isCredit ? 21 : 190) : 15, lbl.startsWith('Montant') ? (isCredit ? 128 : 24) : 23, lbl.startsWith('Montant') ? (isCredit ? 61 : 24) : 42);
    doc.text(String(val), 80, rowY + 5.5);
  });

  y += tableH + 15;
  // Encadré de certification bancaire
  doc.setFillColor(COLOR_LIGHT_BLUE_BG[0], COLOR_LIGHT_BLUE_BG[1], COLOR_LIGHT_BLUE_BG[2]);
  doc.setDrawColor(COLOR_LIGHT_BLUE_BORDER[0], COLOR_LIGHT_BLUE_BORDER[1], COLOR_LIGHT_BLUE_BORDER[2]);
  doc.roundedRect(20, y, 170, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.text('Certification électronique de virement bancaire', 25, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Ce récépissé atteste de l\'enregistrement irrévocable de l\'opération dans le grand livre de MOVAFI BANK. ' +
    'Les fonds sont compensés et garantis conformément aux règles du système bancaire international.',
    25,
    y + 12,
    { maxWidth: 160 }
  );

  y += 35;
  drawSignatureBlock(doc, `${user.first_name} ${user.last_name}`, y);

  drawConfidentialStamp(doc, 105, y + 65);
  drawDocumentFooter(doc, 1, 1);

  doc.save(`Movafi_Receipt_${tx.reference || tx.id}.pdf`);
}
