import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CWD = process.cwd();
const ROOT_DIR = fs.existsSync(path.resolve(CWD, 'movafi_database.json'))
  ? CWD
  : (fs.existsSync(path.resolve(__dirname, '../../movafi_database.json'))
      ? path.resolve(__dirname, '../../')
      : CWD);

const DB_FILE_PATH = path.resolve(ROOT_DIR, 'movafi_database.json');
const DB_BACKUP_PATH = path.resolve(ROOT_DIR, 'movafi_database.backup.json');
import {
  isSupabaseConfigured,
  loadStateFromSupabase,
  syncProfileToSupabase,
  syncAccountToSupabase
} from './supabase';
import {
  UserProfile,
  BankAccount,
  Transaction,
  TransactionRequest,
  PaymentMethod,
  BankCard,
  CardDelivery,
  LoanRate,
  LoanApplication,
  NotificationItem,
  EmailTemplate,
  EmailLog,
  BankSettings,
  BlockedIP,
  AuditLog,
  ReferralProgramSettings,
  ReferralCode,
  ReferralRecord,
  ReferralStatus,
  ReferralRewardType,
  ReferralStats
} from '../types/banking';

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateReferralCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MOV-${random}`;
}

export function generateCatCode(): string {
  return `CAT-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateCotCode(): string {
  return `COT-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function createDefaultReferralSettings(): ReferralProgramSettings {
  return {
    is_enabled: true,
    invitation_validity_days: 30,
    max_referrals_per_user: 50,
    max_invitations_per_user: 100,
    validation_condition: 'account_approved',
    reward_type: 'points',
    reward_value: 25,
    reward_currency: 'USD',
    tiers: [
      {
        id: 'tier_1',
        name: 'Niveau 1 — Initié',
        min_referrals: 1,
        max_referrals: 5,
        badge: 'Bronze Sovereign',
        reward_description: '25 points Privilège par recommandation validée'
      },
      {
        id: 'tier_2',
        name: 'Niveau 2 — Ambassadeur',
        min_referrals: 6,
        max_referrals: 20,
        badge: 'Silver Ambassador',
        reward_description: '50 points Privilège par recommandation validée + Exonération de frais'
      },
      {
        id: 'tier_3',
        name: 'Niveau 3 — Cercle Privilège',
        min_referrals: 21,
        badge: 'Gold Sovereign Elite',
        reward_description: '100 points Privilège par recommandation validée + Concierge dédié'
      }
    ],
    explanatory_text: "Invitez de nouveaux clients à découvrir l'expérience Movafi Bank et profitez de nos privilèges exclusifs.",
    terms_and_conditions: "Programme de parrainage et privilèges Movafi Bank. Les avantages sont attribués aux clients vérifiés sous réserve de validation de conformité des comptes parrainés.",
    default_share_message: "Découvrez Movafi Bank et ouvrez votre compte digital privé via mon lien d'invitation : {link}",
    updated_at: new Date().toISOString()
  };
}

export interface DatabaseState {
  profiles: (UserProfile & { password_hash: string; pin_hash: string })[];
  accounts: BankAccount[];
  transactions: Transaction[];
  transaction_requests: TransactionRequest[];
  payment_methods: PaymentMethod[];
  cards: BankCard[];
  card_deliveries: CardDelivery[];
  loan_rates: LoanRate[];
  loan_applications: LoanApplication[];
  notifications: NotificationItem[];
  email_templates: EmailTemplate[];
  email_logs: EmailLog[];
  bank_settings: BankSettings;
  blocked_ips: BlockedIP[];
  audit_logs: AuditLog[];
  otp_records: { email: string; otp_hash: string; expires_at: number }[];
  referral_settings: ReferralProgramSettings;
  referral_codes: ReferralCode[];
  referrals: ReferralRecord[];
}

function createInitialState(): DatabaseState {
  const adminId = 'prof_admin_001';

  return {
    profiles: [
      {
        id: adminId,
        email: 'support@movafi-groupes.com',
        first_name: 'Genevieve',
        last_name: 'Rothschild',
        phone: '+1 (212) 555-0100',
        nationality: 'United States',
        residence_country: 'United States',
        city: 'New York',
        preferred_currency: 'USD',
        preferred_language: 'en',
        account_type: 'Business',
        occupation: 'Managing Director & Chief Risk Officer',
        monthly_income: 95000,
        activity_duration: '14 years',
        is_admin: true,
        admin_role: 'admin',
        password_hash: hashString('AdminPass2026!'),
        pin_hash: hashString('998877'),
        portal_password: 'AdminPass2026!',
        portal_pin: '998877',
        application_status: 'approved',
        created_at: '2026-01-15T09:00:00.000Z'
      }
    ],
    accounts: [
      {
        id: 'acc_admin_usd',
        profile_id: adminId,
        client_id: 'EXECUTIVE-01',
        account_number: '984000100201',
        iban: 'US94MOVA021000021984000100201',
        bic_swift: 'MOVAFUS33XXX',
        currency: 'USD',
        balance: 50000000.00,
        account_status: 'active',
        is_balance_visible: true,
        created_at: '2026-01-15T09:00:00.000Z'
      }
    ],
    transactions: [],
    transaction_requests: [],
    payment_methods: [
      {
        id: 'pm_001',
        name: 'Fedwire Domestic Direct (USD)',
        category: 'Bank Transfer',
        description: 'Virement direct instantané Fedwire avec confirmation en temps réel.',
        account_info: 'Routing: 021000021 · Movafi Bank US Treasury Desk',
        instructions: 'Mentionnez votre identifiant client (Client ID) dans le motif du virement.',
        is_active: true,
        display_order: 1
      },
      {
        id: 'pm_002',
        name: 'SWIFT International Multi-Devises',
        category: 'Bank Transfer',
        description: 'Règlement bancaire international compatible EUR, USD, GBP, CHF et CAD.',
        account_info: 'BIC/SWIFT: MOVAFUS33XXX · Movafi Bank New York',
        instructions: 'Précisez votre numéro de compte et nom complet en tant que bénéficiaire.',
        is_active: true,
        display_order: 2
      },
      {
        id: 'pm_003',
        name: 'Bitcoin (BTC) - Dépôt Sécurisé',
        category: 'Digital Assets',
        description: 'Dépôt direct de Bitcoin sécurisé sur le cold storage de la trésorerie Movafi.',
        account_info: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        wallet_address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        crypto_network: 'Bitcoin Mainnet',
        instructions: 'Envoyez uniquement des BTC sur cette adresse. Le crédit sera effectif après 2 confirmations du réseau.',
        is_active: true,
        display_order: 3
      },
      {
        id: 'pm_004',
        name: 'USDT (Tether USD - TRC-20)',
        category: 'Digital Assets',
        description: 'Dépôt direct de stablecoins Tether (USDT) avec frais de réseau réduits.',
        account_info: 'TX7n9QZkMvd8L7bY8P92U9dK3Z4aM1qW8x',
        wallet_address: 'TX7n9QZkMvd8L7bY8P92U9dK3Z4aM1qW8x',
        crypto_network: 'TRC-20 (Tron Network)',
        instructions: 'Veillez à sélectionner impérativement le réseau TRC-20 (Tron) lors du transfert pour éviter toute perte de fonds.',
        is_active: true,
        display_order: 4
      },
      {
        id: 'pm_005',
        name: 'PayPal International',
        category: 'Fintech',
        description: 'Règlement instantané via solde PayPal vérifié ou carte liée.',
        account_info: 'paypal-treasury@movafi-groupes.com',
        instructions: 'Transférez le montant à notre compte trésorerie PayPal en indiquant votre Identifiant Client (Client ID) dans la note.',
        is_active: true,
        display_order: 5
      },
      {
        id: 'pm_006',
        name: 'MoneyGram International',
        category: 'Cash / Agency',
        description: 'Transfert international d\'espèces ou en ligne via le réseau MoneyGram.',
        account_info: 'Bénéficiaire : MOVAFI BANK TREASURY DESK / Agent Code : MG-994021',
        instructions: 'Rendez-vous dans une agence MoneyGram ou sur le portail en ligne. Indiquez le code référence de la transaction après envoi.',
        is_active: true,
        display_order: 6
      },
      {
        id: 'pm_007',
        name: 'Western Union International',
        category: 'Cash / Agency',
        description: 'Envoi d\'argent rapide et sécurisé via le réseau Western Union mondial.',
        account_info: 'Bénéficiaire : MOVAFI TREASURY SERVICES / MTCN Tracking Required',
        instructions: 'Après transmission des fonds, déclarez le numéro de contrôle MTCN à 10 chiffres dans le formulaire de déclaration.',
        is_active: true,
        display_order: 7
      },
      {
        id: 'pm_008',
        name: 'Service Conciergerie Privée & Dépôt Agence',
        category: 'Cash / Agency',
        description: 'Prise en charge personnalisée et dépôt haute sécurité en agence privée.',
        account_info: 'Desk Privé: 540 Madison Avenue, New York, NY 10022',
        instructions: 'Prenez contact avec votre banquier privé dédié pour planifier votre dépôt.',
        is_active: true,
        display_order: 8
      }
    ],
    cards: [],
    card_deliveries: [],
    loan_rates: [
      {
        id: 'lr_1',
        category: 'Real Estate',
        annual_rate_percent: 2.45,
        min_amount: 50000,
        max_amount: 1000000,
        min_duration_months: 12,
        max_duration_months: 360
      },
      {
        id: 'lr_2',
        category: 'Automobile',
        annual_rate_percent: 3.80,
        min_amount: 5000,
        max_amount: 150000,
        min_duration_months: 6,
        max_duration_months: 84
      },
      {
        id: 'lr_3',
        category: 'Renovation',
        annual_rate_percent: 2.90,
        min_amount: 10000,
        max_amount: 300000,
        min_duration_months: 6,
        max_duration_months: 120
      },
      {
        id: 'lr_4',
        category: 'Business',
        annual_rate_percent: 3.20,
        min_amount: 25000,
        max_amount: 1000000,
        min_duration_months: 12,
        max_duration_months: 240
      },
      {
        id: 'lr_5',
        category: 'Working Capital',
        annual_rate_percent: 4.50,
        min_amount: 5000,
        max_amount: 500000,
        min_duration_months: 3,
        max_duration_months: 60
      },
      {
        id: 'lr_6',
        category: 'Education',
        annual_rate_percent: 1.90,
        min_amount: 2000,
        max_amount: 100000,
        min_duration_months: 6,
        max_duration_months: 120
      },
      {
        id: 'lr_7',
        category: 'Other',
        annual_rate_percent: 3.50,
        min_amount: 2000,
        max_amount: 250000,
        min_duration_months: 3,
        max_duration_months: 120
      }
    ],
    loan_applications: [],
    notifications: [],
    email_templates: [
      {
        id: 'tmpl_otp',
        template_key: 'otp_verification',
        name: 'Vérification de Sécurité (Code OTP)',
        language: 'fr',
        subject: 'Movafi Bank · Votre code de sécurité confidentiel : {{code}}',
        body_text: 'Cher Client,\n\nVoici votre code confidentiel de vérification Movafi Bank : {{code}}\n\nCe code expire dans 15 minutes. Ne le communiquez à personne.',
        updated_at: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'tmpl_01',
        template_key: 'account_created',
        name: 'Account Application Received',
        language: 'en',
        subject: 'Your Movafi Bank Account is Ready',
        body_text: 'Dear {{first_name}},\n\nThank you for choosing Movafibank. Your digital bank account is officially created. Your assigned Client ID is {{client_id}}.',
        updated_at: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'tmpl_02',
        template_key: 'account_approved',
        name: 'Account Approved & Ready',
        language: 'en',
        subject: 'Welcome to Movafi Bank — Account Activated',
        body_text: 'Dear {{first_name}},\n\nWe are pleased to inform you that your Movafi Bank account has been approved and activated. Your IBAN is {{iban}}.',
        updated_at: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'tmpl_03',
        template_key: 'transfer_completed',
        name: 'Transfer Settlement Notice',
        language: 'en',
        subject: 'Wire Settlement Confirmation: {{reference}}',
        body_text: 'Dear {{first_name}},\n\nYour transfer of {{currency}} {{amount}} with reference {{reference}} has been executed successfully from account {{account_id}}.',
        updated_at: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'tmpl_04',
        template_key: 'loan_disbursed',
        name: 'Credit Facility Released',
        language: 'en',
        subject: 'Credit Facility Disbursement: {{currency}} {{amount}}',
        body_text: 'Dear {{first_name}},\n\nYour credit facility of {{currency}} {{amount}} for project {{project_type}} has been released to your primary ledger.',
        updated_at: '2026-01-01T00:00:00.000Z'
      }
    ],
    email_logs: [],
    bank_settings: {
      id: 'current_settings',
      bank_name: 'MOVAFI BANK UNITED STATES',
      short_name: 'Movafi Bank',
      city: 'New York',
      country: 'United States',
      support_email: process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com',
      support_phone: '+1 (212) 555-0198',
      disclaimer_notice: 'Movafi Bank est une banque privée digitale internationale et une plateforme de trésorerie institutionnelle. Comptes sous ségrégation d\'actifs et rails de paiement sécurisés.',
      updated_at: '2026-01-01T00:00:00.000Z'
    },
    blocked_ips: [],
    audit_logs: [],
    otp_records: [],
    referral_settings: createDefaultReferralSettings(),
    referral_codes: [],
    referrals: []
  };
}

class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    let parsed: any = null;

    // 1. Try reading the main database file
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        if (data && data.trim().length > 0) {
          parsed = JSON.parse(data);
        }
      } catch (err) {
        console.error('[DB] Primary database read failed, checking backup:', err);
      }
    }

    // 2. If primary failed or corrupt, try backup file
    if (!parsed && fs.existsSync(DB_BACKUP_PATH)) {
      try {
        const backupData = fs.readFileSync(DB_BACKUP_PATH, 'utf-8');
        if (backupData && backupData.trim().length > 0) {
          parsed = JSON.parse(backupData);
          console.log('[DB] Restored database from backup file.');
        }
      } catch (err) {
        console.error('[DB] Backup read failed:', err);
      }
    }

    if (parsed) {
      let modified = false;

      if (!parsed.referral_settings) {
        parsed.referral_settings = createDefaultReferralSettings();
        modified = true;
      }
      if (!parsed.referral_codes) {
        parsed.referral_codes = [];
        modified = true;
      }
      if (!parsed.referrals) {
        parsed.referrals = [];
        modified = true;
      }

      parsed.profiles?.forEach((p: any) => {
        if (!p.portal_password) {
          p.portal_password = p.is_admin ? 'AdminPass2026!' : 'ClientPass2026!';
          modified = true;
        }
        if (!p.portal_pin) {
          p.portal_pin = p.is_admin ? '998877' : '492815';
          modified = true;
        }
        if (!p.application_status) {
          p.application_status = p.is_admin ? 'approved' : 'pending';
          modified = true;
        }
        if ((!p.password_hash || p.password_hash.length < 10) && p.portal_password) {
          p.password_hash = hashString(p.portal_password);
          modified = true;
        }
        if ((!p.pin_hash || p.pin_hash.length < 10) && p.portal_pin) {
          p.pin_hash = hashString(p.portal_pin);
          modified = true;
        }
      });

      parsed.accounts?.forEach((acc: any) => {
        if (!acc.cat_code) {
          acc.cat_code = generateCatCode();
          modified = true;
        }
        if (!acc.cot_code) {
          acc.cot_code = generateCotCode();
          modified = true;
        }
        if (!acc.application_status) {
          acc.application_status = acc.account_status === 'active' ? 'approved' : 'pending';
          modified = true;
        }
      });

      if (parsed.bank_settings) {
        if (!parsed.bank_settings.support_email || parsed.bank_settings.support_email.includes('versal') || parsed.bank_settings.support_email === 'concierge@movafibank.com') {
          parsed.bank_settings.support_email = process.env.SUPPORT_EMAIL || 'support@movafi-groupes.com';
          modified = true;
        }
      }

      if (!parsed.email_templates) {
        parsed.email_templates = [];
        modified = true;
      }

      if (!parsed.email_templates.some((t: any) => t.template_key === 'otp_verification')) {
        parsed.email_templates.unshift({
          id: 'tmpl_otp',
          template_key: 'otp_verification',
          name: 'Vérification de Sécurité (Code OTP)',
          language: 'fr',
          subject: 'Movafi Bank · Votre code de sécurité confidentiel : {{code}}',
          body_text: 'Cher Client,\n\nVoici votre code confidentiel de vérification Movafi Bank : {{code}}\n\nCe code expire dans 15 minutes. Ne le communiquez à personne.',
          updated_at: '2026-01-01T00:00:00.000Z'
        });
        modified = true;
      }

      if (modified) {
        this.save(parsed);
      }
      return parsed;
    }

    const initial = createInitialState();
    this.save(initial);
    return initial;
  }

  public save(data: DatabaseState = this.state): void {
    this.state = data;
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const tempPath = `${DB_FILE_PATH}.tmp.${Date.now()}`;
      // Write to temp file first
      fs.writeFileSync(tempPath, jsonStr, 'utf-8');
      // Atomic rename to primary DB file
      fs.renameSync(tempPath, DB_FILE_PATH);
      // Redundant backup copy
      fs.writeFileSync(DB_BACKUP_PATH, jsonStr, 'utf-8');
    } catch (err) {
      console.error('[DB] Primary atomic save error, attempting direct write:', err);
      try {
        const jsonStr = JSON.stringify(data, null, 2);
        fs.writeFileSync(DB_FILE_PATH, jsonStr, 'utf-8');
        fs.writeFileSync(DB_BACKUP_PATH, jsonStr, 'utf-8');
      } catch (fallbackErr) {
        console.error('[DB] Critical fallback write failed:', fallbackErr);
      }
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public async hydrateFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const supa = await loadStateFromSupabase();
      if (!supa || supa.error) {
        if (supa?.error?.code === '42501') {
          console.warn('[SUPABASE_PERMISSION_ALERT] Supabase returned 42501 (permission denied). The PostgreSQL schema requires GRANT permissions.');
        }
        return;
      }

      let countAdded = 0;
      if (supa.profiles && supa.profiles.length > 0) {
        for (const sp of supa.profiles) {
          const pass = sp.portal_password || sp.password;
          const pin = sp.portal_pin || sp.pin;
          const computedPassHash = pass ? hashString(pass) : '';
          const computedPinHash = pin ? hashString(pin) : null;

          const idx = this.state.profiles.findIndex(
            (p) => p.id === sp.id || (p.email && sp.email && p.email.toLowerCase() === sp.email.toLowerCase())
          );
          if (idx !== -1) {
            const existing = this.state.profiles[idx];
            const finalPassHash = (sp.password_hash && sp.password_hash.length >= 10)
              ? sp.password_hash
              : ((existing.password_hash && existing.password_hash.length >= 10)
                  ? existing.password_hash
                  : computedPassHash);

            const finalPinHash = (sp.pin_hash && sp.pin_hash.length >= 10)
              ? sp.pin_hash
              : ((existing.pin_hash && existing.pin_hash.length >= 10)
                  ? existing.pin_hash
                  : computedPinHash);

            this.state.profiles[idx] = {
              ...existing,
              ...sp,
              password_hash: finalPassHash,
              pin_hash: finalPinHash,
              portal_password: pass || existing.portal_password || '',
              portal_pin: pin || existing.portal_pin || '123456'
            };
          } else {
            const newSp = {
              ...sp,
              password_hash: (sp.password_hash && sp.password_hash.length >= 10) ? sp.password_hash : computedPassHash,
              pin_hash: (sp.pin_hash && sp.pin_hash.length >= 10) ? sp.pin_hash : computedPinHash,
              portal_password: pass || '',
              portal_pin: pin || '123456'
            };
            this.state.profiles.push(newSp);
            countAdded++;
          }
        }
      }

      if (supa.accounts && supa.accounts.length > 0) {
        for (const sa of supa.accounts) {
          const idx = this.state.accounts.findIndex(
            (a) => a.id === sa.id || (a.account_number && sa.account_number && a.account_number === sa.account_number)
          );
          if (idx !== -1) {
            this.state.accounts[idx] = { ...this.state.accounts[idx], ...sa };
          } else {
            this.state.accounts.push(sa);
            countAdded++;
          }
        }
      }

      if (supa.cards && supa.cards.length > 0) {
        for (const sc of supa.cards) {
          const idx = this.state.cards.findIndex((c) => c.id === sc.id);
          if (idx !== -1) {
            this.state.cards[idx] = { ...this.state.cards[idx], ...sc };
          } else {
            this.state.cards.push(sc);
            countAdded++;
          }
        }
      }

      if (supa.loan_applications && supa.loan_applications.length > 0) {
        for (const sl of supa.loan_applications) {
          const idx = this.state.loan_applications.findIndex((l) => l.id === sl.id);
          if (idx !== -1) {
            this.state.loan_applications[idx] = { ...this.state.loan_applications[idx], ...sl };
          } else {
            this.state.loan_applications.push(sl);
            countAdded++;
          }
        }
      }

      if (supa.transactions && supa.transactions.length > 0) {
        for (const st of supa.transactions) {
          const idx = this.state.transactions.findIndex(
            (t) => t.id === st.id || (t.reference && st.reference && t.reference === st.reference)
          );
          if (idx !== -1) {
            this.state.transactions[idx] = { ...this.state.transactions[idx], ...st };
          } else {
            this.state.transactions.push(st);
            countAdded++;
          }
        }
      }

      if (supa.transaction_requests && supa.transaction_requests.length > 0) {
        for (const str of supa.transaction_requests) {
          const idx = this.state.transaction_requests.findIndex((tr) => tr.id === str.id);
          if (idx !== -1) {
            this.state.transaction_requests[idx] = { ...this.state.transaction_requests[idx], ...str };
          } else {
            this.state.transaction_requests.push(str);
            countAdded++;
          }
        }
      }

      this.save();
      console.log(`[DB] Successfully hydrated from Supabase (${countAdded} new records merged, state saved).`);
    } catch (err: any) {
      console.warn('[DB] Supabase hydration error:', err.message);
    }
  }

  public addAuditLog(
    action: string,
    target: string,
    adminEmail?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    entityType?: string,
    entityId?: string
  ): void {
    const log: AuditLog = {
      id: 'aud_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      admin_email: adminEmail || 'system@movafibank.com',
      action,
      target_resource: target,
      metadata: metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
      entity_type: entityType,
      entity_id: entityId,
      created_at: new Date().toISOString()
    };
    this.state.audit_logs.unshift(log);
    this.save();
  }

  public getOrCreateReferralCode(profileId: string): ReferralCode {
    let existing = this.state.referral_codes.find((c) => c.profile_id === profileId && c.is_active);
    if (!existing) {
      let code = generateReferralCode();
      while (this.state.referral_codes.some((c) => c.code === code)) {
        code = generateReferralCode();
      }
      existing = {
        id: 'refc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        profile_id: profileId,
        code,
        is_active: true,
        total_uses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.state.referral_codes.push(existing);
      this.save();
    }
    return existing;
  }

  public regenerateReferralCode(profileId: string): ReferralCode {
    this.state.referral_codes.forEach((c) => {
      if (c.profile_id === profileId) c.is_active = false;
    });

    let code = generateReferralCode();
    while (this.state.referral_codes.some((c) => c.code === code)) {
      code = generateReferralCode();
    }

    const newCode: ReferralCode = {
      id: 'refc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      profile_id: profileId,
      code,
      is_active: true,
      total_uses: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.state.referral_codes.push(newCode);
    this.save();
    return newCode;
  }

  public findReferralCode(code: string): ReferralCode | undefined {
    return this.state.referral_codes.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.is_active);
  }

  public getReferralStats(profileId: string): ReferralStats {
    const list = this.state.referrals.filter((r) => r.referrer_profile_id === profileId);
    const validated = list.filter((r) => r.status === 'referral_validated').length;
    const pending = list.filter((r) => r.status === 'verification_pending' || r.status === 'registration_completed').length;
    const started = list.filter((r) => r.status === 'registration_started').length;
    const completed = list.filter((r) => r.status === 'registration_completed' || r.status === 'verification_pending' || r.status === 'account_approved' || r.status === 'referral_validated').length;
    const verified = list.filter((r) => r.status === 'account_approved' || r.status === 'referral_validated').length;
    const rejected = list.filter((r) => r.status === 'referral_rejected' || r.status === 'expired').length;
    const sent = list.length;

    const settings = this.state.referral_settings || createDefaultReferralSettings();
    const pointsPerValidated = settings.reward_type === 'points' ? settings.reward_value : 10;
    const totalPoints = validated * pointsPerValidated;

    let currentTier = 'Niveau 1 — Initié';
    let tierBadge = 'Bronze Sovereign';
    if (settings.tiers && settings.tiers.length > 0) {
      for (const tier of settings.tiers) {
        if (validated >= tier.min_referrals) {
          currentTier = tier.name;
          tierBadge = tier.badge;
        }
      }
    }

    return {
      invitations_sent: sent,
      registrations_started: started + completed,
      registrations_completed: completed,
      accounts_verified: verified,
      referrals_validated: validated,
      referrals_pending: pending,
      referrals_rejected: rejected,
      total_points: totalPoints,
      current_tier: currentTier,
      tier_badge: tierBadge
    };
  }
}

export const db = new DatabaseService();
