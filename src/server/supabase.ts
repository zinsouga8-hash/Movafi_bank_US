import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// -------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION & NORMALIZATION
// -------------------------------------------------------------
// Safely normalize SUPABASE_URL to prevent 404s if user configured trailing '/rest/v1/' or '/'
function getCleanSupabaseUrl(): string {
  const raw = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '').trim();
}

const SUPABASE_URL = getCleanSupabaseUrl();
// Prefer backend service_role key for bypass of RLS on server-side admin routes, fallback to anon key
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Diagnostic log at boot without leaking keys
console.log('[SUPABASE CONFIG CHECK]');
console.log('SUPABASE_URL configurée :', SUPABASE_URL ? 'OUI' : 'NON');
console.log('SUPABASE_KEY configurée :', SUPABASE_KEY ? 'OUI' : 'NON');
if (SUPABASE_URL) {
  console.log('URL Host:', new URL(SUPABASE_URL).host);
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

// Helper to mask emails for secure diagnostic logs
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
}

// -------------------------------------------------------------
// STEP 9: DIAGNOSTIC AUDIT LOGS & PERSISTENCE VERIFIERS
// -------------------------------------------------------------
export interface SupabaseOpResult<T = any> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details: any;
    hint: any;
    table: string;
    operation: string;
  };
}

/**
 * Inserts or Upserts a Profile into Supabase with complete error inspection
 */
export async function syncProfileToSupabase(profile: any): Promise<SupabaseOpResult> {
  if (!supabase) {
    return { success: false, data: null, error: { code: 'NO_CLIENT', message: 'Supabase client non initialisé', details: null, hint: null, table: 'profiles', operation: 'UPSERT' } };
  }

  const payload = {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone,
    nationality: profile.nationality,
    residence_country: profile.residence_country,
    city: profile.city,
    preferred_currency: profile.preferred_currency,
    preferred_language: profile.preferred_language,
    account_type: profile.account_type,
    occupation: profile.occupation,
    monthly_income: profile.monthly_income,
    income_bracket: profile.income_bracket || null,
    activity_duration: profile.activity_duration,
    id_document_name: profile.id_document_name || null,
    id_document_url: profile.id_document_url || null,
    proof_of_address_name: profile.proof_of_address_name || null,
    proof_of_address_url: profile.proof_of_address_url || null,
    is_admin: profile.is_admin || false,
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
    created_at: profile.created_at || new Date().toISOString()
  };

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();

  if (error) {
    console.error('[PROFILE_INSERT:ERROR]', {
      table: 'profiles',
      operation: 'UPSERT',
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: 'profiles',
        operation: 'UPSERT'
      }
    };
  }

  console.log('[PROFILE_INSERT:SUCCESS]', { id: profile.id, email: maskEmail(profile.email) });
  return { success: true, data };
}

/**
 * Inserts or Upserts a Bank Account into Supabase and verifies persistence via SELECT
 */
export async function syncAccountToSupabase(account: any): Promise<SupabaseOpResult> {
  if (!supabase) {
    return { success: false, data: null, error: { code: 'NO_CLIENT', message: 'Supabase client non initialisé', details: null, hint: null, table: 'accounts', operation: 'UPSERT' } };
  }

  const payload = {
    id: account.id,
    profile_id: account.profile_id,
    client_id: account.client_id,
    account_number: account.account_number,
    iban: account.iban,
    bic_swift: account.bic_swift || 'MOVAFUS33XXX',
    currency: account.currency || 'USD',
    balance: account.balance || 0,
    account_status: account.account_status || 'inactive',
    application_status: account.application_status || 'pending',
    is_balance_visible: account.is_balance_visible !== false,
    cat_code: account.cat_code || null,
    cot_code: account.cot_code || null,
    created_at: account.created_at || new Date().toISOString()
  };

  const { data, error } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' }).select();

  if (error) {
    console.error('[ACCOUNT_INSERT:ERROR]', {
      table: 'accounts',
      operation: 'UPSERT',
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: 'accounts',
        operation: 'UPSERT'
      }
    };
  }

  console.log('[ACCOUNT_INSERT:SUCCESS]', { id: account.id, client_id: account.client_id });

  // STEP 3: Mandatory verification SELECT
  const { data: verified, error: verifyErr } = await supabase
    .from('accounts')
    .select('id, client_id, balance, account_status')
    .eq('id', account.id)
    .single();

  if (verifyErr || !verified) {
    console.warn('[ACCOUNT_SELECT_VERIFY:NOT_FOUND]', { id: account.id, error: verifyErr });
    return { success: false, data: null, error: { code: verifyErr?.code || '404', message: 'Verification SELECT failed', details: verifyErr?.details, hint: verifyErr?.hint, table: 'accounts', operation: 'SELECT_VERIFY' } };
  }

  console.log('[ACCOUNT_SELECT_VERIFY:FOUND]', { id: verified.id, status: verified.account_status });
  return { success: true, data: verified };
}

/**
 * Inserts or Upserts a Bank Card into Supabase
 */
export async function syncCardToSupabase(card: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };
  const payload = {
    id: card.id,
    account_id: card.account_id,
    cardholder_name: card.cardholder_name,
    card_number_masked: card.card_number_masked,
    card_number_mock_full: card.card_number_mock_full || null,
    expiry_month: card.expiry_month,
    expiry_year: card.expiry_year,
    cvc_mock: card.cvc_mock || '982',
    network: card.network || 'visa',
    tier: card.tier || 'gold',
    status: card.status || 'active',
    creation_status: card.creation_status || 'approved',
    is_active: card.is_active !== false,
    daily_limit: card.daily_limit || 5000,
    monthly_limit: card.monthly_limit || 10000,
    balance: card.balance || 0,
    allow_balance_transfer: Boolean(card.allow_balance_transfer),
    is_physical: Boolean(card.is_physical),
    created_at: card.created_at || new Date().toISOString()
  };
  const { data, error } = await supabase.from('cards').upsert(payload, { onConflict: 'id' }).select();
  if (error) {
    console.error('[CARD_SYNC:ERROR]', error);
    return { success: false, data: null, error: { code: error.code, message: error.message, details: error.details, hint: error.hint, table: 'cards', operation: 'UPSERT' } };
  }
  return { success: true, data };
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
    project_type: loan.project_type,
    amount: loan.amount,
    currency: loan.currency || 'USD',
    duration_months: loan.duration_months,
    rate_percent: loan.rate_percent,
    monthly_payment: loan.monthly_payment,
    total_cost: loan.total_cost,
    terms_accepted: loan.terms_accepted !== false,
    terms_accepted_at: loan.terms_accepted_at || new Date().toISOString(),
    credit_parameters_agreed: Boolean(loan.credit_parameters_agreed),
    credit_parameters_agreed_at: loan.credit_parameters_agreed_at || null,
    status: loan.status || 'pending',
    admin_notes: loan.admin_notes || null,
    funds_released_at: loan.funds_released_at || null,
    created_at: loan.created_at || new Date().toISOString()
  };
  const { data, error } = await supabase.from('loan_applications').upsert(payload, { onConflict: 'id' }).select();
  if (error) {
    console.error('[LOAN_SYNC:ERROR]', error);
    return { success: false, data: null, error: { code: error.code, message: error.message, details: error.details, hint: error.hint, table: 'loan_applications', operation: 'UPSERT' } };
  }
  return { success: true, data };
}

/**
 * Inserts or Upserts a Transaction into Supabase
 */
export async function syncTransactionToSupabase(tx: any): Promise<SupabaseOpResult> {
  if (!supabase) return { success: false, data: null };
  const payload = {
    id: tx.id,
    account_id: tx.account_id,
    user_id: tx.user_id || null,
    type: tx.type,
    category: tx.category || 'Bank Transfer',
    amount: tx.amount,
    currency: tx.currency || 'USD',
    recipient_name: tx.recipient_name || null,
    recipient_account: tx.recipient_account || null,
    recipient_bank: tx.recipient_bank || null,
    reference: tx.reference,
    description: tx.description || '',
    status: tx.status || 'completed',
    fee: tx.fee || 0,
    approved_at: tx.approved_at || null,
    approved_by: tx.approved_by || null,
    created_at: tx.created_at || new Date().toISOString()
  };
  const { data, error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' }).select();
  if (error) {
    console.error('[TRANSACTION_SYNC:ERROR]', error);
    return { success: false, data: null, error: { code: error.code, message: error.message, details: error.details, hint: error.hint, table: 'transactions', operation: 'UPSERT' } };
  }
  return { success: true, data };
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
    amount: req.amount,
    currency: req.currency || 'USD',
    payment_method: req.payment_method,
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
    created_at: req.created_at || new Date().toISOString()
  };
  const { data, error } = await supabase.from('transaction_requests').upsert(payload, { onConflict: 'id' }).select();
  if (error) {
    console.error('[TX_REQUEST_SYNC:ERROR]', error);
    return { success: false, data: null, error: { code: error.code, message: error.message, details: error.details, hint: error.hint, table: 'transaction_requests', operation: 'UPSERT' } };
  }
  return { success: true, data };
}

/**
 * Loads all tables from Supabase on startup into memory
 */
export async function loadStateFromSupabase(): Promise<{
  profiles?: any[];
  accounts?: any[];
  transactions?: any[];
  transaction_requests?: any[];
  cards?: any[];
  loan_applications?: any[];
  notifications?: any[];
  referrals?: any[];
  referral_codes?: any[];
  bank_settings?: any;
  error?: any;
}> {
  if (!supabase) return { error: 'Supabase client non configuré' };

  try {
    const [
      profilesRes,
      accountsRes,
      transactionsRes,
      txRequestsRes,
      cardsRes,
      loansRes,
      notifsRes,
      referralsRes,
      refCodesRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('accounts').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('transaction_requests').select('*'),
      supabase.from('cards').select('*'),
      supabase.from('loan_applications').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('referrals').select('*'),
      supabase.from('referral_codes').select('*'),
      supabase.from('bank_settings').select('*').limit(1).maybeSingle()
    ]);

    const errors = [
      profilesRes.error,
      accountsRes.error,
      transactionsRes.error,
      cardsRes.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.warn('[SUPABASE_HYDRATION:PARTIAL_ERROR]', errors[0]);
      return { error: errors[0] };
    }

    console.log('[SUPABASE_HYDRATION:SUCCESS]', {
      profilesCount: profilesRes.data?.length || 0,
      accountsCount: accountsRes.data?.length || 0,
      transactionsCount: transactionsRes.data?.length || 0
    });

    const sanitizedProfiles = (profilesRes.data || []).map((p: any) => {
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
      accounts: accountsRes.data || [],
      transactions: transactionsRes.data || [],
      transaction_requests: txRequestsRes.data || [],
      cards: cardsRes.data || [],
      loan_applications: loansRes.data || [],
      notifications: notifsRes.data || [],
      referrals: referralsRes.data || [],
      referral_codes: refCodesRes.data || [],
      bank_settings: settingsRes.data || null
    };
  } catch (err: any) {
    console.error('[SUPABASE_HYDRATION:EXCEPTION]', err.message);
    return { error: err.message };
  }
}
