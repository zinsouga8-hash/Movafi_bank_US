import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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

const DB_FILE_PATH = path.resolve(process.cwd(), 'movafi_database.json');

function createInitialState(): DatabaseState {
  const adminId = 'prof_admin_001';

  return {
    profiles: [
      {
        id: adminId,
        email: 'admin@movafibank.com',
        first_name: 'Genevieve',
        last_name: 'Rothschild',
        phone: '+1 (212) 555-0100',
        nationality: 'United States',
        residence_country: 'United States',
        city: 'New York',
        preferred_currency: 'USD',
        preferred_language: 'fr',
        account_type: 'Business',
        occupation: 'Managing Director & Chief Risk Officer',
        monthly_income: 95000,
        activity_duration: '14 years',
        is_admin: true,
        admin_role: 'admin',
        password_hash: hashString('AdminPass2026!'),
        pin_hash: hashString('998877'),
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
        name: 'Passerelle Actifs Numériques & Stablecoins',
        category: 'Digital Assets',
        description: 'Dépôt institutionnel en stablecoins sécurisés (USDC / USDT).',
        account_info: 'Réseau ERC-20 / TRC-20 vérifié',
        instructions: 'Génération de l\'adresse de dépôt dédiée sur confirmation de conformité.',
        is_active: true,
        display_order: 3
      },
      {
        id: 'pm_004',
        name: 'Service Conciergerie Privée & Dépôt Agence',
        category: 'Cash / Agency',
        description: 'Prise en charge personnalisée et dépôt haute sécurité en agence privée.',
        account_info: 'Desk Privé: 540 Madison Avenue, New York, NY 10022',
        instructions: 'Prenez contact avec votre banquier privé dédié pour planifier votre dépôt.',
        is_active: true,
        display_order: 4
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
        id: 'tmpl_01',
        template_key: 'account_created',
        name: 'Account Application Received',
        language: 'en',
        subject: 'Your Movafi Bank Account is Ready',
        body_text: 'Dear {{first_name}},\n\nThank you for choosing Movafi Bank United States. Your digital bank account is officially created. Your assigned Client ID is {{client_id}}.',
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
      support_email: 'concierge@movafibank.com',
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
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
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

        if (modified) {
          this.save(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading database file, resetting to initial state:', err);
    }
    const initial = createInitialState();
    this.save(initial);
    return initial;
  }

  public save(data: DatabaseState = this.state): void {
    this.state = data;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database state to disk:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
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
