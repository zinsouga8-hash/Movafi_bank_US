import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// -------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION & NORMALIZATION
// -------------------------------------------------------------
function getCleanSupabaseUrl(): string {
  const raw = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '').trim();
}

const SUPABASE_URL = getCleanSupabaseUrl();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

console.log('[SUPABASE CONFIG CHECK]');
console.log('SUPABASE_URL configurée :', SUPABASE_URL ? 'OUI' : 'NON');
console.log('SUPABASE_KEY configurée :', SUPABASE_KEY ? 'OUI' : 'NON');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
}

export interface SupabaseOpResult<T = any> {
  success: boolean;
  data: T | null;
  error?: any;
}

/**
 * Inserts or Upserts a Profile into Supabase
 */
export async function syncProfileToSupabase(profile: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone || null,
    nationality: profile.nationality || null,
    residence_country: profile.residence_country || null,
    city: profile.city || null,
    preferred_currency: profile.preferred_currency || 'USD',
    preferred_language: profile.preferred_language || 'fr',
    account_type: profile.account_type || 'Personal',
    occupation: profile.occupation || null,
    monthly_income: profile.monthly_income || 0,
    income_bracket: profile.income_bracket || null,
    activity_duration: profile.activity_duration || null,
    id_document_name: profile.id_document_name || null,
    id_document_url: profile.id_document_url || null,
    proof_of_address_name: profile.proof_of_address_name || null,
    proof_of_address_url: profile.proof_of_address_url || null,
    is_admin: Boolean(profile.is_admin),
    admin_role: profile.admin_role || null,
    portal_password: profile.portal_password || profile.password || 'TemporaryPass2026!',
    portal_pin: profile.portal_pin || profile.pin || '123456',
    password_hash: (profile.password_hash && profile.password_hash.length >= 10)
      ? profile.password_hash
      : (profile.portal_password ? hashString(profile.portal_password) : (profile.password ? hashString(profile.password) : '')),
    pin_hash: (profile.pin_hash && profile.pin_hash.length >= 10)
      ? profile.pin_hash
      : (profile.portal_pin ? hashString(profile.portal_pin) : (profile.pin ? hashString(profile.pin) : null)),
    application_status: profile.application_status || 'pending',
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[SUPABASE_SYNC:PROFILE_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:PROFILE_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Bank Account into Supabase
 */
export async function syncAccountToSupabase(account: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: account.id,
    profile_id: account.profile_id,
    client_id: account.client_id,
    account_number: account.account_number,
    iban: account.iban,
    bic_swift: account.bic_swift || 'MOVAFUS33XXX',
    currency: account.currency || 'USD',
    balance: Number(account.balance) || 0,
    account_status: account.account_status || 'inactive',
    application_status: account.application_status || 'pending',
    is_balance_visible: account.is_balance_visible !== false,
    cat_code: account.cat_code || null,
    cot_code: account.cot_code || null,
    created_at: account.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[SUPABASE_SYNC:ACCOUNT_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:ACCOUNT_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Bank Card into Supabase and optionally syncs its delivery info
 */
export async function syncCardToSupabase(card: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: card.id,
    account_id: card.account_id,
    cardholder_name: card.cardholder_name,
    card_number_masked: card.card_number_masked,
    card_number_mock_full: card.card_number_mock_full || null,
    expiry_month: Number(card.expiry_month) || 12,
    expiry_year: Number(card.expiry_year) || 2030,
    cvc_mock: card.cvc_mock || '982',
    network: card.network || 'visa',
    tier: card.tier || 'gold',
    status: card.status || 'active',
    creation_status: card.creation_status || 'approved',
    is_active: card.is_active !== false,
    daily_limit: Number(card.daily_limit) || 5000,
    monthly_limit: Number(card.monthly_limit) || 10000,
    balance: Number(card.balance) || 0,
    allow_balance_transfer: Boolean(card.allow_balance_transfer),
    is_physical: Boolean(card.is_physical),
    created_at: card.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('cards').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[SUPABASE_SYNC:CARD_ERR]', error.message);
      return { success: false, data: null, error };
    }

    // Sync card delivery if available
    if (card.delivery) {
      await syncCardDeliveryToSupabase(card.delivery);
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:CARD_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Card Delivery record
 */
export async function syncCardDeliveryToSupabase(delivery: any): Promise<SupabaseOpResult> {
  if (!supabase || !delivery) return { success: false, data: null };

  const payload = {
    id: delivery.id || 'del_' + Date.now().toString(36),
    card_id: delivery.card_id,
    recipient_full_name: delivery.recipient_full_name || 'Recipient',
    street_address: delivery.street_address || '',
    building_unit: delivery.building_unit || null,
    city: delivery.city || 'New York',
    postal_code: delivery.postal_code || '10001',
    country: delivery.country || 'United States',
    phone: delivery.phone || '+1',
    tracking_number: delivery.tracking_number || `MVF-TRK-${Date.now()}`,
    current_stage: delivery.current_stage || 'request_received',
    created_at: delivery.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('card_delivery').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:CARD_DELIVERY_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:CARD_DELIVERY_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Loan Application into Supabase
 */
export async function syncLoanToSupabase(loan: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: loan.id,
    account_id: loan.account_id,
    borrower_name: loan.borrower_name || null,
    borrower_email: loan.borrower_email || null,
    project_type: loan.project_type || 'General Purpose',
    amount: Number(loan.amount) || 0,
    currency: loan.currency || 'USD',
    duration_months: Number(loan.duration_months) || 12,
    rate_percent: Number(loan.rate_percent) || 3.5,
    monthly_payment: Number(loan.monthly_payment) || 0,
    total_cost: Number(loan.total_cost) || 0,
    terms_accepted: loan.terms_accepted !== false,
    terms_accepted_at: loan.terms_accepted_at || new Date().toISOString(),
    credit_parameters_agreed: Boolean(loan.credit_parameters_agreed),
    credit_parameters_agreed_at: loan.credit_parameters_agreed_at || null,
    status: loan.status || 'pending',
    admin_notes: loan.admin_notes || null,
    funds_released_at: loan.funds_released_at || null,
    created_at: loan.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('loan_applications').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[SUPABASE_SYNC:LOAN_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:LOAN_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Transaction into Supabase
 * Handles unique reference collisions cleanly
 */
export async function syncTransactionToSupabase(tx: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const ref = String(tx.reference || `MOV-${Date.now()}`).trim();

  const payload: any = {
    id: tx.id,
    account_id: tx.account_id,
    user_id: tx.user_id || null,
    type: tx.type,
    category: tx.category || 'Bank Transfer',
    amount: Number(tx.amount) || 0,
    currency: tx.currency || 'USD',
    recipient_name: tx.recipient_name || null,
    recipient_account: tx.recipient_account || null,
    recipient_bank: tx.recipient_bank || null,
    reference: ref,
    description: tx.description || '',
    status: tx.status || 'completed',
    fee: Number(tx.fee) || 0,
    approved_at: tx.approved_at || null,
    approved_by: tx.approved_by || null,
    created_at: tx.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    let res = await supabase.from('transactions').upsert(payload, { onConflict: 'id' }).select();
    
    // In case of unique constraint violation on reference (e.g. sender & receiver legs), append suffix
    if (res.error && res.error.message?.includes('uq_transactions_ref')) {
      const suffix = tx.type === 'credit' ? '-CR' : `-${tx.id.slice(-4)}`;
      payload.reference = `${ref}${suffix}`;
      res = await supabase.from('transactions').upsert(payload, { onConflict: 'id' }).select();
    }

    if (res.error) {
      console.error('[SUPABASE_SYNC:TRANSACTION_ERR]', res.error.message);
      return { success: false, data: null, error: res.error };
    }
    return { success: true, data: res.data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:TRANSACTION_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Transaction Request into Supabase
 */
export async function syncTransactionRequestToSupabase(req: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: req.id,
    account_id: req.account_id,
    user_id: req.user_id || null,
    client_name: req.client_name || null,
    client_email: req.client_email || null,
    type: req.type || 'deposit',
    amount: Number(req.amount) || 0,
    currency: req.currency || 'USD',
    payment_method: req.payment_method || 'Bank Transfer',
    payout_method: req.payout_method || null,
    sender_name: req.sender_name || null,
    beneficiary_name: req.beneficiary_name || null,
    beneficiary_account: req.beneficiary_account || null,
    beneficiary_bank: req.beneficiary_bank || null,
    source_reference: req.source_reference || null,
    proof_document_url: req.proof_document_url || null,
    status: req.status || 'pending',
    admin_notes: req.admin_notes || null,
    rejection_reason: req.rejection_reason || null,
    processed_by: req.processed_by || null,
    processed_at: req.processed_at || null,
    approved_at: req.approved_at || null,
    approved_by: req.approved_by || null,
    created_at: req.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('transaction_requests').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[SUPABASE_SYNC:TX_REQUEST_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('[SUPABASE_SYNC:TX_REQUEST_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Notification into Supabase
 */
export async function syncNotificationToSupabase(notif: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: notif.id,
    profile_id: notif.profile_id || null,
    is_for_admin: Boolean(notif.is_for_admin),
    title: notif.title || 'Notification',
    message: notif.message || '',
    type: notif.type || 'info',
    is_read: Boolean(notif.is_read),
    created_at: notif.created_at || new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:NOTIF_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:NOTIF_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts an Audit Log into Supabase
 */
export async function syncAuditLogToSupabase(log: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: log.id,
    admin_email: log.admin_email || 'system@movafibank.com',
    action: log.action || 'GENERAL_ACTION',
    target_resource: log.target_resource || '',
    metadata: log.metadata || {},
    ip_address: log.ip_address || null,
    user_agent: log.user_agent || null,
    entity_type: log.entity_type || null,
    entity_id: log.entity_id || null,
    created_at: log.created_at || new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('audit_logs').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:AUDIT_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:AUDIT_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Payment Method into Supabase
 */
export async function syncPaymentMethodToSupabase(pm: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: pm.id,
    name: pm.name,
    category: pm.category || 'Bank Transfer',
    logo_key: pm.logo_key || null,
    description: pm.description || null,
    account_info: pm.account_info || '',
    instructions: pm.instructions || null,
    wallet_address: pm.wallet_address || null,
    crypto_network: pm.crypto_network || null,
    is_active: pm.is_active !== false,
    display_order: Number(pm.display_order) || 0,
    created_at: pm.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('payment_methods').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:PAYMENT_METHOD_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:PAYMENT_METHOD_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Referral Record
 */
export async function syncReferralRecordToSupabase(ref: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: ref.id,
    referrer_profile_id: ref.referrer_profile_id,
    referral_code_id: ref.referral_code_id || null,
    referral_code: ref.referral_code || '',
    referee_name_masked: ref.referee_name_masked || 'Invité',
    referee_email_masked: ref.referee_email_masked || '***@***.com',
    referee_profile_id: ref.referee_profile_id || null,
    status: ref.status || 'invitation_sent',
    last_step_reached: ref.last_step_reached || null,
    invited_at: ref.invited_at || new Date().toISOString(),
    registered_at: ref.registered_at || null,
    validated_at: ref.validated_at || null,
    created_at: ref.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('referrals').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:REFERRAL_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:REFERRAL_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Inserts or Upserts a Referral Code
 */
export async function syncReferralCodeToSupabase(refc: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };

  const payload = {
    id: refc.id,
    profile_id: refc.profile_id,
    code: refc.code,
    is_active: refc.is_active !== false,
    total_uses: Number(refc.total_uses) || 0,
    created_at: refc.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('referral_codes').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[SUPABASE_SYNC:REF_CODE_ERR]', error.message);
      return { success: false, data: null, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('[SUPABASE_SYNC:REF_CODE_EXCEPTION]', err.message);
    return { success: false, data: null, error: err };
  }
}

/**
 * Deletes an account from Supabase
 */
export async function deleteAccountFromSupabase(accountId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('accounts').delete().eq('id', accountId);
  } catch (e: any) {
    console.warn('[SUPABASE_DELETE:ACCOUNT_ERR]', e.message);
  }
}

/**
 * Deletes a profile from Supabase
 */
export async function deleteProfileFromSupabase(profileId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('profiles').delete().eq('id', profileId);
  } catch (e: any) {
    console.warn('[SUPABASE_DELETE:PROFILE_ERR]', e.message);
  }
}

/**
 * Loads all tables from Supabase on startup into memory.
 * Uses isolated queries so partial errors never fail the entire hydration!
 */
export async function loadStateFromSupabase(): Promise<{
  profiles?: any[];
  accounts?: any[];
  transactions?: any[];
  transaction_requests?: any[];
  cards?: any[];
  card_deliveries?: any[];
  loan_applications?: any[];
  loan_rates?: any[];
  notifications?: any[];
  audit_logs?: any[];
  payment_methods?: any[];
  referrals?: any[];
  referral_codes?: any[];
  bank_settings?: any;
  error?: any;
}> {
  if (!supabase) return { error: 'Supabase client non configuré' };

  console.log('[SUPABASE_HYDRATION] Starting complete database load from PostgreSQL...');

  const safeQuery = async (table: string, orderCol?: string) => {
    try {
      let q = supabase!.from(table).select('*');
      if (orderCol) q = q.order(orderCol, { ascending: false });
      const { data, error } = await q;
      if (error) {
        console.warn(`[SUPABASE_HYDRATION:TABLE_WARNING] ${table}:`, error.message);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn(`[SUPABASE_HYDRATION:TABLE_EXCEPTION] ${table}:`, err.message);
      return [];
    }
  };

  const [
    profiles,
    accounts,
    transactions,
    transaction_requests,
    cards,
    card_deliveries,
    loan_applications,
    loan_rates,
    notifications,
    audit_logs,
    payment_methods,
    referrals,
    referral_codes
  ] = await Promise.all([
    safeQuery('profiles', 'created_at'),
    safeQuery('accounts', 'created_at'),
    safeQuery('transactions', 'created_at'),
    safeQuery('transaction_requests', 'created_at'),
    safeQuery('cards', 'created_at'),
    safeQuery('card_delivery', 'created_at'),
    safeQuery('loan_applications', 'created_at'),
    safeQuery('loan_rates'),
    safeQuery('notifications', 'created_at'),
    safeQuery('audit_logs', 'created_at'),
    safeQuery('payment_methods', 'display_order'),
    safeQuery('referrals', 'created_at'),
    safeQuery('referral_codes', 'created_at')
  ]);

  // Settings single record
  let bankSettings: any = null;
  try {
    const { data } = await supabase.from('bank_settings').select('*').limit(1).maybeSingle();
    bankSettings = data;
  } catch (e) {
    // Ignore if not present
  }

  console.log('[SUPABASE_HYDRATION:SUMMARY]', {
    profiles: profiles.length,
    accounts: accounts.length,
    transactions: transactions.length,
    transaction_requests: transaction_requests.length,
    cards: cards.length,
    card_deliveries: card_deliveries.length,
    loans: loan_applications.length,
    notifications: notifications.length
  });

  // Re-link delivery records to cards
  const cardsWithDelivery = cards.map((c: any) => {
    const delivery = card_deliveries.find((d: any) => d.card_id === c.id);
    return {
      ...c,
      delivery: delivery || c.delivery || null
    };
  });

  const sanitizedProfiles = profiles.map((p: any) => {
    const pass = p.portal_password || p.password;
    const pin = p.portal_pin || p.pin;
    const passHash = (p.password_hash && p.password_hash.length >= 10)
      ? p.password_hash
      : (pass ? hashString(pass) : '');
    const pinHash = (p.pin_hash && p.pin_hash.length >= 10)
      ? p.pin_hash
      : (pin ? hashString(pin) : null);
    return {
      ...p,
      password_hash: passHash,
      pin_hash: pinHash,
      portal_password: pass || '',
      portal_pin: pin || '123456'
    };
  });

  return {
    profiles: sanitizedProfiles,
    accounts,
    transactions,
    transaction_requests,
    cards: cardsWithDelivery,
    card_deliveries,
    loan_applications,
    loan_rates,
    notifications,
    audit_logs,
    payment_methods,
    referrals,
    referral_codes,
    bank_settings: bankSettings
  };
}
