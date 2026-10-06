import { db } from './db';
import { EmailLog } from '../types/banking';

interface EmailTemplatePayload {
  to: string;
  subject?: string;
  templateKey?: string;
  variables?: Record<string, string | number>;
  html?: string;
  text?: string;
  lang?: string;
}

export function buildBankEmailHtml({
  title,
  preheader,
  contentHtml,
  supportEmail = 'support@movafi-groupes.com',
  lang = 'es'
}: {
  title: string;
  preheader?: string;
  contentHtml: string;
  supportEmail?: string;
  lang?: string;
}): string {
  const isEs = lang === 'es';
  const isFr = lang === 'fr';

  const subtitleText = isEs
    ? 'División Estados Unidos · Banca Privada y Tesorería'
    : isFr
    ? 'United States Division · Banque Privée & Trésorerie'
    : 'United States Division · Private Banking & Treasury';

  const conciergeLabel = isEs
    ? 'Atención al Cliente y Seguridad:'
    : isFr
    ? 'Service Clientèle & Sécurité :'
    : 'Client Services & Security:';

  const conciergeText = isEs
    ? 'Para cualquier consulta sobre su expediente, contacte a nuestro desk dedicado:'
    : isFr
    ? 'Pour toute question relative à votre dossier, écrivez directement à notre desk dédié :'
    : 'For any inquiry regarding your file, contact our dedicated desk:';

  const disclaimerText = isEs
    ? 'Este mensaje electrónico y los documentos adjuntos son estrictamente confidenciales y están protegidos por el secreto profesional y bancario. Si no es el destinatario previsto, notifíquelo de inmediato y destruya este mensaje.'
    : isFr
    ? 'Ce message électronique ainsi que tous les documents y afférents sont strictement confidentiels et protégés par le secret professionnel et bancaire. Si vous n\'êtes pas le destinataire désigné, veuillez en informer immédiatement l\'expéditeur et détruire ce message sans en divulguer le contenu.'
    : 'This electronic transmission and any attachments are confidential and legally privileged. If you are not the intended recipient, please notify the sender immediately and delete this message.';

  const rightsText = isEs
    ? '© 2026 MOVAFI BANK. Todos los derechos reservados.'
    : isFr
    ? '© 2026 Movafi Bank. Tous droits réservés.'
    : '© 2026 Movafi Bank. All rights reserved.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050811;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050811; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050811; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0c1322; border: 1px solid #23314d; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Top Gold Decorative Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #92400e 100%);"></td>
          </tr>

          <!-- Header with Movafi Bank Monogram -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #1a263d;">
              <!-- Architectural Bank Emblem Badge -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
                <tr>
                  <td style="width: 54px; height: 54px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1.5px solid #d97706; border-radius: 14px; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                      <path d="M50 18 L76 34 H24 Z" fill="#fbbf24" />
                      <rect x="22" y="36" width="56" height="4" rx="2" fill="#f59e0b" />
                      <rect x="26" y="42" width="7" height="30" rx="1.5" fill="#fbbf24" />
                      <rect x="38" y="42" width="7" height="30" rx="1.5" fill="#f59e0b" />
                      <rect x="55" y="42" width="7" height="30" rx="1.5" fill="#f59e0b" />
                      <rect x="67" y="42" width="7" height="30" rx="1.5" fill="#fbbf24" />
                      <rect x="22" y="74" width="56" height="4" rx="2" fill="#f59e0b" />
                      <path d="M18 80 H82 L79 86 H21 Z" fill="#fbbf24" />
                      <polygon points="50,51 53,58 50,65 47,58" fill="#ffffff" />
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="font-size: 15px; font-weight: 800; letter-spacing: 3px; color: #ffffff; text-transform: uppercase; margin-bottom: 4px;">
                MOVAFI BANK
              </div>
              <div style="font-size: 10px; font-weight: 600; letter-spacing: 2px; color: #d97706; text-transform: uppercase;">
                ${subtitleText}
              </div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 40px; font-size: 14px; line-height: 1.65; color: #cbd5e1;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Assistance / Concierge Strip -->
          <tr>
            <td style="padding: 20px 40px; background-color: #080d1a; border-top: 1px solid #1a263d; border-bottom: 1px solid #1a263d;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8;">
                    <strong style="color: #e2e8f0;">${conciergeLabel}</strong><br>
                    ${conciergeText}
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <a href="mailto:${supportEmail}" style="display: inline-block; padding: 8px 14px; background-color: rgba(217, 119, 6, 0.15); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 8px; color: #fbbf24; text-decoration: none; font-size: 12px; font-weight: 700; white-space: nowrap;">
                      ${supportEmail}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Institutional & Legal Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; font-size: 11px; line-height: 1.6; color: #64748b;">
              <div style="font-weight: 700; color: #94a3b8; margin-bottom: 4px;">
                MOVAFI BANK CORPORATION — UNITED STATES
              </div>
              <div style="margin-bottom: 12px;">
                Manhattan Financial District, 540 Madison Avenue, New York, NY 10022, United States
              </div>
              <div style="font-size: 10px; color: #475569; max-width: 480px; margin: 0 auto; line-height: 1.5;">
                ${disclaimerText}
              </div>
              <div style="margin-top: 14px; font-size: 10px; color: #334155;">
                ${rightsText}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  templateKey,
  variables = {},
  html,
  text,
  lang = 'es'
}: EmailTemplatePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const state = db.getState();
  const apiKey = process.env.RESEND_API_KEY;

  // Strict Permanent Sender Name: always "MOVAFI BANK" from "support@movafi-groupes.com"
  const fromEmail = 'MOVAFI BANK <support@movafi-groupes.com>';
  const replyToEmail = 'support@movafi-groupes.com';

  const isEs = lang === 'es';
  const isFr = lang === 'fr';

  let finalSubject = subject || (isEs ? 'Notificación de MOVAFI BANK' : 'Notification Movafi Bank');
  let finalHtml = html || '';
  let finalText = text || '';

  // 1. SPECIFIC HIGH-END TEMPLATES
  if (templateKey === 'otp_verification') {
    const code = String(variables.code || '').trim();
    if (isEs) {
      finalSubject = `MOVAFI BANK · Su código de seguridad confidencial: ${code}`;
      finalText = `===============================================================
MOVAFI BANK — AUTENTICACIÓN SEGURA
===============================================================

Estimado/a Cliente,

Está realizando una solicitud de apertura de cuenta digital en MOVAFI BANK.
Para validar su dirección de correo electrónico y continuar con su expediente, aquí tiene su código confidencial de 6 dígitos:

                  >>>  ${code}  <<<

Este código de un solo uso es ESTRICTAMENTE PERSONAL y caduca en 15 minutos.

INSTRUCCIONES DE SEGURIDAD:
- No comparta NUNCA este código con ninguna persona.
- Ningún asesor o colaborador de MOVAFI BANK le solicitará jamás su código de verificación.
- Si no encuentra este mensaje en su bandeja de entrada principal, revise sus carpetas de Spam, Correo no deseado o Promociones.
- Si no ha solicitado este código, avise de inmediato a nuestro servicio de seguridad: ${replyToEmail}

MOVAFI BANK United States
División Banca Privada y Gestión de Tesorería
Asistencia: ${replyToEmail}
===============================================================`;

      const contentHtml = `
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 4px 12px; background-color: rgba(217, 119, 6, 0.15); border: 1px solid rgba(217, 119, 6, 0.3); border-radius: 20px; font-size: 10px; font-weight: 800; color: #fbbf24; letter-spacing: 1.5px; text-transform: uppercase;">
            Verificación de Seguridad Obligatoria
          </span>
          <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 14px 0 6px; letter-spacing: -0.5px;">
            Validación de su correo electrónico
          </h1>
          <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
            Se ha generado un código de verificación exclusivo para validar la apertura de su cuenta digital MOVAFI BANK.
          </p>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <div style="max-width: 360px; padding: 24px 20px; background: linear-gradient(180deg, #131d31 0%, #0a101d 100%); border: 2px solid #d97706; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.25);">
                <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase; margin-bottom: 10px;">
                  SU CÓDIGO CONFIDENCIAL (OTP)
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(251, 191, 36, 0.6); padding: 4px 0 8px 10px;">
                  ${code}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 6px;">
                  ⏱ Válido por 15 minutos · Entrada manual de 6 dígitos
                </div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Instrucciones de Seguridad Bancaria
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
            <li style="margin-bottom: 6px;"><strong style="color: #e2e8f0;">Estrictamente confidencial:</strong> No comparta este código con nadie. Ningún colaborador de MOVAFI BANK le pedirá su código OTP.</li>
            <li style="margin-bottom: 6px;"><strong style="color: #e2e8f0;">Carpetas de correo:</strong> Si no encuentra nuestros correos, recuerde revisar su carpeta de <em>Spam</em> o <em>Correo no deseado</em>.</li>
            <li><strong style="color: #e2e8f0;">Alerta de fraude:</strong> Si no ha solicitado este código, infórmelo inmediatamente a <a href="mailto:${replyToEmail}" style="color: #fbbf24; text-decoration: underline;">${replyToEmail}</a>.</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
          Gracias por su confianza en MOVAFI BANK United States.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Su código confidencial de MOVAFI BANK es ${code} (válido 15 minutos).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Votre code de sécurité confidentiel : ${code}`;
      finalText = `===============================================================
MOVAFI BANK — AUTHENTIFICATION SÉCURISÉE
===============================================================

Cher Client,

Vous effectuez une demande d'ouverture de compte auprès de Movafi Bank.
Pour valider votre adresse e-mail et poursuivre votre dossier, voici votre code confidentiel à 6 chiffres :

                  >>>  ${code}  <<<

Ce code à usage unique est STRICTEMENT PERSONNEL et expire dans 15 minutes.

CONSIGNES DE SÉCURITÉ :
- Ne communiquez JAMAIS ce code à qui que ce soit.
- Aucun conseiller ou collaborateur de Movafi Bank ne vous demandera votre code de vérification.
- Si vous ne trouvez pas ce message dans votre boîte de réception principale, veuillez vérifier vos dossiers Spam, Courrier indésirable ou Promotions.
- Si vous n'êtes pas à l'origine de cette demande, prévenez immédiatement notre service de sécurité : ${replyToEmail}

Movafi Bank United States
Division Banque Privée & Gestion de Trésorerie
Assistance : ${replyToEmail}
===============================================================`;

      const contentHtml = `
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 4px 12px; background-color: rgba(217, 119, 6, 0.15); border: 1px solid rgba(217, 119, 6, 0.3); border-radius: 20px; font-size: 10px; font-weight: 800; color: #fbbf24; letter-spacing: 1.5px; text-transform: uppercase;">
            Vérification de Sécurité Obligatoire
          </span>
          <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 14px 0 6px; letter-spacing: -0.5px;">
            Validation de votre adresse e-mail
          </h1>
          <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
            Un code de vérification à usage unique a été généré pour valider l'ouverture de votre compte digital Movafi Bank.
          </p>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <div style="max-width: 360px; padding: 24px 20px; background: linear-gradient(180deg, #131d31 0%, #0a101d 100%); border: 2px solid #d97706; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.25);">
                <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase; margin-bottom: 10px;">
                  VOTRE CODE CONFIDENTIEL (OTP)
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(251, 191, 36, 0.6); padding: 4px 0 8px 10px;">
                  ${code}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 6px;">
                  ⏱ Valable 15 minutes · Saisie manuelle à 6 chiffres
                </div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Instructions de Sécurité Bancaire
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
            <li style="margin-bottom: 6px;"><strong style="color: #e2e8f0;">Strictement confidentiel :</strong> Ne partagez ce code avec personne. Aucun collaborateur Movafi Bank ne vous demandera votre code OTP.</li>
            <li style="margin-bottom: 6px;"><strong style="color: #e2e8f0;">Dossiers de messagerie :</strong> Si vous ne trouvez pas nos e-mails, pensez à vérifier vos dossiers <em>Spam</em>, <em>Indésirables</em> ou <em>Promotions</em>.</li>
            <li><strong style="color: #e2e8f0;">Alerte fraude :</strong> Si vous n'avez pas sollicité ce code, signalez-le sans délai à <a href="mailto:${replyToEmail}" style="color: #fbbf24; text-decoration: underline;">${replyToEmail}</a>.</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
          Merci de votre confiance envers Movafi Bank United States.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Votre code confidentiel Movafi Bank est ${code} (valable 15 minutes).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else if (templateKey === 'account_created') {
    const firstName = String(variables.first_name || 'Client');
    const clientId = String(variables.client_id || 'DOSSIER-EN-COURS');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Solicitud de apertura de cuenta registrada (${clientId})`;
      finalText = `Estimado/a ${firstName},

Su solicitud de apertura de cuenta ha sido registrada con éxito en MOVAFI BANK.
Identificador de expediente: ${clientId}

ESTADO DE LA CUENTA: INACTIVO
Un administrador examinará su expediente y procesará su solicitud.
Su cuenta permanecerá inactiva hasta su aprobación y activación administrativa.

Para cualquier consulta sobre su expediente, contacte a atención al cliente: ${replyToEmail}

MOVAFI BANK United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Solicitud de apertura de cuenta registrada
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Acusamos recibo de su expediente de solicitud de apertura de cuenta en MOVAFI BANK United States.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 10px;">
            Datos de su expediente
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">
            Identificador de Cliente: <strong style="color: #ffffff; font-family: monospace;">${clientId}</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Estado actual: <span style="display: inline-block; padding: 2px 8px; background-color: rgba(217, 119, 6, 0.2); color: #fbbf24; border-radius: 4px; font-weight: 700; font-size: 11px;">Inactivo — En espera de revisión</span>
          </div>
        </div>

        <div style="background-color: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          « Su solicitud de apertura de cuenta ha sido enviada. Un administrador revisará su expediente y procesará su solicitud. Su cuenta permanecerá inactiva hasta su aprobación y activación. »
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          Recibirá una notificación por correo electrónico tan pronto como nuestro departamento de conformidad emita su decisión.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Su expediente de apertura de cuenta en MOVAFI BANK ha sido registrado (ID: ${clientId}).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Demande d’ouverture de compte déposée (${clientId})`;
      finalText = `Cher(e) ${firstName},

Votre demande d'ouverture de compte a été enregistrée avec succès auprès de Movafi Bank.
Identifiant de dossier : ${clientId}

STATUT DU COMPTE : INACTIF
Un administrateur va examiner votre dossier et traiter votre demande.
Votre compte restera inactif jusqu'à son approbation et son activation administrative.

Pour toute question concernant votre dossier, contactez le service client : ${replyToEmail}

Movafi Bank United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Demande d'ouverture de compte déposée
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Nous accusons bonne réception de votre dossier d'ouverture de compte au sein de Movafi Bank United States.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 10px;">
            Coordonnées de votre dossier
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">
            Identifiant Client : <strong style="color: #ffffff; font-family: monospace;">${clientId}</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Statut actuel : <span style="display: inline-block; padding: 2px 8px; background-color: rgba(217, 119, 6, 0.2); color: #fbbf24; border-radius: 4px; font-weight: 700; font-size: 11px;">Inactif — En attente d'approbation</span>
          </div>
        </div>

        <div style="background-color: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          « Votre demande d’ouverture de compte a été envoyée. Un administrateur va examiner votre dossier et traiter votre demande. Votre compte restera inactif jusqu’à son approbation et son activation. »
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          Vous recevrez une notification par e-mail dès que la décision aura été rendue par notre département de conformité.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Votre dossier d'ouverture Movafi Bank a été déposé avec succès (ID: ${clientId}).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  // 2. DISTINCT NOTIFICATION 1: APPLICATION APPROVED (Account stays inactive until activated!)
  } else if (templateKey === 'application_approved') {
    const firstName = String(variables.first_name || 'Client');
    const clientId = String(variables.client_id || '');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Solicitud de apertura de cuenta aprobada`;
      finalText = `Estimado/a ${firstName},

Nos complace informarle que su solicitud de apertura de cuenta ha sido formalmente APROBADA por el comité de administración de MOVAFI BANK.

ESTADO DEL COMPTE: INACTIVO POR DEFECTO
Por medidas de seguridad y protocolo bancario, su cuenta bancaria permanece actualmente inactiva por defecto hasta que el administrador proceda a su activación operativa.
Recibirá una notificación y un correo de confirmación tan pronto como su cuenta sea activada para operar con total normalidad.

Atención al Cliente: ${replyToEmail}
MOVAFI BANK United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Solicitud de apertura aprobada
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Su solicitud de apertura de cuenta bancaria ha sido evaluada y <strong>aprobada con éxito</strong> por nuestra dirección de cumplimiento.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
            Decisión Administrativa
          </div>
          <div style="font-size: 13px; color: #e2e8f0; margin-bottom: 6px;">
            Decisión: <strong style="color: #34d399;">Aprobada</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Estado de la cuenta: <span style="display: inline-block; padding: 2px 8px; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border-radius: 4px; font-weight: 700;">Inactivo por defecto (en espera de activación)</span>
          </div>
        </div>

        <div style="background-color: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          Su expediente ha sido validado. Conforme a las normas bancarias, su cuenta permanece inactiva por defecto y será activada próximamente por un administrador para permitir depósitos, transferencias y retiros.
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Su solicitud de apertura en MOVAFI BANK ha sido aprobada. Su cuenta será activada próximamente.`,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Demande d’ouverture de compte approuvée`;
      finalText = `Cher(e) ${firstName},

Nous avons le plaisir de vous informer que votre demande d'ouverture de compte a été formellement APPROUVÉE par l'administration de Movafi Bank.

STATUT DU COMPTE : INACTIF PAR DÉFAUT
Par mesure de conformité et de sécurité, votre compte bancaire demeure actuellement inactif par défaut jusqu'à ce que l'administrateur procède à son activation opérationnelle.
Vous recevrez un avis d'activation dès que votre compte sera prêt pour toutes vos opérations.

Assistance : ${replyToEmail}
Movafi Bank United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Demande d'ouverture de compte approuvée
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Votre dossier d'ouverture de compte a été examiné et <strong>approuvé avec succès</strong> par notre service de conformité.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
            Décision Administrative
          </div>
          <div style="font-size: 13px; color: #e2e8f0; margin-bottom: 6px;">
            Décision : <strong style="color: #34d399;">Approuvée</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Statut du compte : <span style="display: inline-block; padding: 2px 8px; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border-radius: 4px; font-weight: 700;">Inactif par défaut (en attente d'activation)</span>
          </div>
        </div>

        <div style="background-color: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          Votre dossier a été validé. Conformément aux protocoles bancaires, le statut de votre compte demeure inactif par défaut jusqu’à son activation officielle par un administrateur.
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Votre demande d'ouverture Movafi Bank a été approuvée. Activation en cours.`,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  // 3. DISTINCT NOTIFICATION 2: ACCOUNT ACTIVATED (Account is now active and operational!)
  } else if (templateKey === 'account_activated' || templateKey === 'account_approved') {
    const firstName = String(variables.first_name || 'Client');
    const iban = String(variables.iban || variables.account_id || '');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Su cuenta bancaria ya está ACTIVA`;
      finalText = `Estimado/a ${firstName},

¡Enhorabuena! Su cuenta bancaria en MOVAFI BANK ha sido formalmente ACTIVADA por la administración.
Datos bancarios : ${iban}

Ya puede iniciar sesión en su banca digital privada con sus credenciales y código PIN de 6 dígitos para emitir y recibir transferencias y realizar operaciones completas.

Atención al Cliente: ${replyToEmail}
MOVAFI BANK United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Cuenta Bancaria Activada y Operativa
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Le confirmamos que su cuenta bancaria en MOVAFI BANK ha sido <strong>activada</strong> por la administración. Su cuenta ya está plenamente operativa.
        </p>

        <div style="background-color: #080d19; border: 1px solid #059669; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 8px;">
            Identificador y Coordenadas Validadas
          </div>
          <div style="font-size: 13px; font-family: monospace; color: #ffffff; word-break: break-all;">
            ${iban}
          </div>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">
          Ya puede consultar sus saldos, emitir transferencias bancarias y recargar su cuenta a través de nuestras pasarelas seguras.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Su cuenta bancaria en MOVAFI BANK ha sido activada con éxito.`,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Votre compte bancaire est désormais ACTIF`;
      finalText = `Cher(e) ${firstName},

Nous avons le plaisir de vous informer que votre compte Movafi Bank a été officiellement ACTIVÉ par l'administration.
Coordonnées : ${iban}

Vous pouvez dès à présent vous connecter à votre espace bancaire privé avec vos identifiants agréés et votre code PIN à 6 chiffres.

Assistance Conciergerie : ${replyToEmail}
Movafi Bank United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Compte Bancaire Activé & Pleinement Opérationnel
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Votre compte bancaire Movafi Bank est désormais <strong>activé</strong> par l'administration et opérationnel pour toutes vos opérations.
        </p>

        <div style="background-color: #080d19; border: 1px solid #059669; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 8px;">
            Coordonnées Validées
          </div>
          <div style="font-size: 13px; font-family: monospace; color: #ffffff; word-break: break-all;">
            ${iban}
          </div>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">
          Vous pouvez dès à présent accéder à vos relevés, émettre des règlements par virement et approvisionner votre compte via nos passerelles sécurisées.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Votre compte Movafi Bank a été activé avec succès.`,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else if (templateKey === 'transfer_completed') {
    const firstName = String(variables.first_name || 'Client');
    const amount = String(variables.amount || '0.00');
    const currency = String(variables.currency || 'USD');
    const ref = String(variables.reference || '');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Aviso de ejecución de transferencia: ${ref}`;
      finalText = `Estimado/a ${firstName},

Su operación de transferencia se ha ejecutado con éxito en el libro mayor de MOVAFI BANK.
Monto: ${currency} ${amount}
Referencia oficial: ${ref}

Un recibo bancario certificado en formato PDF está disponible en su área de cliente.

Atención al Cliente: ${replyToEmail}
MOVAFI BANK United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Aviso de Ejecución de Operación Bancaria
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Su orden de transferencia ha sido registrada y procesada conforme a las reglas de liquidación bancaria.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
            Detalles de la Operación
          </div>
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px;">
            Monto liquidado: <strong style="color: #ffffff; font-size: 16px;">${amount} ${currency}</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8; font-family: monospace;">
            Referencia: ${ref}
          </div>
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Aviso de ejecución MOVAFI BANK: ${amount} ${currency} (Réf: ${ref}).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Avis d'exécution d'opération : ${ref}`;
      finalText = `Cher(e) ${firstName},

Votre opération de transfert a été exécutée avec succès sur le grand livre Movafi Bank.
Montant : ${currency} ${amount}
Référence officielle : ${ref}

Un bordereau certifié au format PDF est disponible dans votre espace client.

Assistance : ${replyToEmail}
Movafi Bank United States`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Avis d'Exécution d'Opération de Trésorerie
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Votre ordre de virement a été enregistré et traité conformément aux règles de compensation de notre grand livre institutionnel.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1a273f; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
            Détails de la Transaction
          </div>
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px;">
            Montant réglé : <strong style="color: #ffffff; font-size: 16px;">${amount} ${currency}</strong>
          </div>
          <div style="font-size: 12px; color: #94a3b8; font-family: monospace;">
            Référence : ${ref}
          </div>
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        preheader: `Avis d'exécution Movafi Bank : ${amount} ${currency} (Réf: ${ref}).`,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else if (templateKey === 'loan_applied') {
    const firstName = String(variables.first_name || 'Client');
    const amount = String(variables.amount || '0');
    const currency = String(variables.currency || 'USD');
    const projectType = String(variables.project_type || 'Crédit');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Confirmación de recepción de su solicitud de préstamo (${currency} ${amount})`;
      finalText = `Estimado/a ${firstName},

Le confirmamos la recepción de su solicitud de financiación por un monto de ${currency} ${amount} (${projectType}).

Su expediente está siendo examinado por nuestro comité de crédito. Recibirá una notificación por correo electrónico tan pronto como la administración emita su decisión de aprobación.

Atentamente,
Departamento de Crédito y Financiación — MOVAFI BANK
Atención al Cliente: ${replyToEmail}`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Solicitud de Préstamo Registrada
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Acusamos recibo de su solicitud de crédito de <strong>${currency} ${amount}</strong> para el proyecto <em>${projectType}</em>.
        </p>
        <div style="background-color: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          Su expediente está en proceso de evaluación por nuestro departamento de crédito. Se le notificará inmediatamente cuando sea aprobada.
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Confirmation de dépôt de votre demande de prêt (${currency} ${amount})`;
      finalText = `Bonjour ${firstName},\n\nNous vous confirmons la bonne réception de votre demande de financement pour un montant de ${currency} ${amount} (${projectType}).\n\nVotre dossier est actuellement en cours d'examen par notre direction de crédit.\n\nCordialement,\nService Crédit — Movafi Bank`;
      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
          Demande de Financement Enregistrée
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Nous accusons bonne réception de votre demande de prêt de <strong>${currency} ${amount}</strong> (${projectType}).
        </p>
      `;
      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else if (templateKey === 'loan_approved') {
    const firstName = String(variables.first_name || 'Client');
    const amount = String(variables.amount || '0');
    const currency = String(variables.currency || 'USD');
    const projectType = String(variables.project_type || 'Crédit');
    const loanId = String(variables.loan_id || '');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Su solicitud de préstamo ha sido APROBADA (${currency} ${amount})`;
      finalText = `Estimado/a ${firstName},

Nos complace informarle que su solicitud de préstamo (${projectType}) por un monto de ${currency} ${amount} ha sido APROBADA por la administración de MOVAFI BANK.

Acceda a su área privada de banca, pestaña Financiación, para consultar sus parámetros de crédito y confirmar su acuerdo en línea a fin de autorizar el desembolso de los fondos en su cuenta.

Atentamente,
Departamento de Crédito y Financiación — MOVAFI BANK
Atención al Cliente: ${replyToEmail}`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Solicitud de Préstamo Aprobada
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Su solicitud de crédito de <strong>${currency} ${amount}</strong> ha sido <strong>aprobada con éxito</strong>.
        </p>
        <div style="background-color: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
          Por favor, ingrese en su banca digital (sección Financiación) para revisar los parámetros oficiales del crédito y dar su conformidad con un solo clic para liberar los fondos.
        </div>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Votre demande de prêt a été approuvée (${currency} ${amount})`;
      finalText = `Cher(e) ${firstName},\n\nVotre demande de prêt (${projectType}) de ${currency} ${amount} a été approuvée par l'administration.\n\nConnectez-vous à votre espace client pour consulter vos paramètres et donner votre accord.\n\nService Crédit — Movafi Bank`;
      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Demande de Prêt Approuvée
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Votre dossier de financement a été validé. Veuillez confirmer vos paramètres de crédit pour autoriser le versement des fonds.
        </p>
      `;
      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else if (templateKey === 'loan_disbursed') {
    const firstName = String(variables.first_name || 'Client');
    const amount = String(variables.amount || '0');
    const currency = String(variables.currency || 'USD');

    if (isEs) {
      finalSubject = `MOVAFI BANK · Fondos de préstamo acreditados (${currency} ${amount})`;
      finalText = `Estimado/a ${firstName},

Los fondos correspondientes a su préstamo por un monto de ${currency} ${amount} acaban de ser acreditados en su saldo bancario principal en MOVAFI BANK.

Ya puede disponer de su liquidez para sus operaciones y transferencias.

Atentamente,
Departamento de Tesorería y Crédito — MOVAFI BANK
Atención al Cliente: ${replyToEmail}`;

      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Fondos del Préstamo Acreditados
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Hola <strong>${firstName}</strong>,<br><br>
          Le confirmamos que el desembolso de su financiación por <strong>${currency} ${amount}</strong> se ha completado y los fondos ya están disponibles en su cuenta.
        </p>
      `;

      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang
      });
    } else {
      finalSubject = `Movafi Bank · Déblocage des fonds de votre prêt (${currency} ${amount})`;
      finalText = `Bonjour ${firstName},\n\nLes fonds de votre prêt (${currency} ${amount}) ont été crédités sur votre compte bancaire.\n\nService Trésorerie — Movafi Bank`;
      const contentHtml = `
        <h2 style="font-size: 18px; font-weight: 800; color: #10b981; margin: 0 0 12px;">
          Déblocage des Fonds Effectué
        </h2>
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Le montant de votre crédit de <strong>${currency} ${amount}</strong> a été versé sur votre compte.
        </p>
      `;
      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml,
        supportEmail: replyToEmail,
        lang: 'fr'
      });
    }

  } else {
    // Custom or stored template fallback
    if (!finalText) {
      finalText = isEs
        ? `Estimado/a Cliente,\n\nGracias por su confianza en MOVAFI BANK.\n\nAtención al Cliente: ${replyToEmail}`
        : `Cher Client,\n\nMerci de votre confiance envers Movafi Bank.\n\nAssistance : ${replyToEmail}`;
    }
    // Replace dynamic variables in custom text/html
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalSubject = finalSubject.replace(regex, String(val));
      finalText = finalText.replace(regex, String(val));
      if (finalHtml) finalHtml = finalHtml.replace(regex, String(val));
    }
    if (!finalHtml) {
      finalHtml = buildBankEmailHtml({
        title: finalSubject,
        contentHtml: `<p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">${finalText.replace(/\n/g, '<br>')}</p>`,
        supportEmail: replyToEmail,
        lang
      });
    }
  }

  let messageId = 'msg_local_' + Math.random().toString(36).substring(2, 10);
  let status: 'sent' | 'failed' | 'queued_internal' = 'queued_internal';
  let errorMsg: string | undefined = undefined;

  // Real Resend API dispatch if valid key is supplied
  if (apiKey && apiKey.startsWith('re_') && !apiKey.includes('sample')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          reply_to: replyToEmail,
          to: [to],
          subject: finalSubject,
          html: finalHtml,
          text: finalText
        })
      });

      if (response.ok) {
        const data = await response.json();
        messageId = data.id || messageId;
        status = 'sent';
      } else {
        const errorData = await response.text();
        status = 'failed';
        errorMsg = errorData;
      }
    } catch (e: any) {
      status = 'failed';
      errorMsg = e.message;
    }
  }

  const logEntry: EmailLog = {
    id: 'elog_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    recipient_email: to,
    subject: finalSubject,
    template_key: templateKey,
    resend_message_id: messageId,
    status: status,
    error_message: errorMsg,
    created_at: new Date().toISOString()
  };

  state.email_logs.unshift(logEntry);
  db.save();

  return {
    success: status !== 'failed',
    messageId,
    error: errorMsg
  };
}
