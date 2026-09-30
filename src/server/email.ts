import { db } from './db';
import { EmailLog } from '../types/banking';

export async function sendEmail({
  to,
  subject,
  templateKey,
  variables = {}
}: {
  to: string;
  subject?: string;
  templateKey?: string;
  variables?: Record<string, string | number>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const state = db.getState();
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SENDER_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@movafi-groupes.com';
  const replyToEmail = process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com';
  const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL || 'support@movafi-groupes.com';

  let finalSubject = subject || 'Movafi Bank Notification';
  let finalBody = 'Thank you for choosing Movafi Bank.';

  if (templateKey) {
    const template = state.email_templates.find((t) => t.template_key === templateKey);
    if (template) {
      finalSubject = template.subject;
      finalBody = template.body_text;
    }
  }

  // Replace dynamic template variables like {{first_name}}
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    finalSubject = finalSubject.replace(regex, String(val));
    finalBody = finalBody.replace(regex, String(val));
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
          text: finalBody
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
