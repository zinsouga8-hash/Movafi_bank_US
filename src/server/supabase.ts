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
