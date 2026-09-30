-- ==============================================================================
-- MOVAFI BANK UNITED STATES — SUPABASE DATABASE SCHEMA
-- Fully relational PostgreSQL schema for prototype / production-grade demonstrator
-- Includes RLS (Row Level Security), triggers, indexes, and initial seed configuration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE account_status_type AS ENUM ('pending', 'active', 'inactive', 'suspended', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Ensure 'rejected' is present if enum already exists
DO $$ BEGIN
    ALTER TYPE account_status_type ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer', 'credit', 'debit', 'card_funding', 'loan_disbursement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_type AS ENUM ('pending', 'processing', 'completed', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE card_network_type AS ENUM ('visa', 'mastercard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE card_tier_type AS ENUM ('standard', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE card_status_type AS ENUM ('pending', 'active', 'blocked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_stage_type AS ENUM (
        'request_received', 
        'processing', 
        'preparation', 
        'transit', 
        'customs', 
        'delivered'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_status_type AS ENUM ('pending', 'approved', 'rejected', 'funds_released', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Associated with auth.users or internal users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    nationality VARCHAR(100),
    residence_country VARCHAR(100),
    city VARCHAR(100),
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    preferred_language VARCHAR(10) DEFAULT 'fr',
    account_type VARCHAR(50) DEFAULT 'Individual',
    occupation VARCHAR(150),
    monthly_income NUMERIC(15, 2) DEFAULT 0.00,
    income_bracket VARCHAR(100),
    activity_duration VARCHAR(100),
    password_hash TEXT NOT NULL DEFAULT '',
    pin_hash TEXT,
    id_document_name TEXT,
    id_document_url TEXT,
    proof_of_address_name TEXT,
    proof_of_address_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    admin_role VARCHAR(20) DEFAULT NULL, -- 'admin' or 'moderator'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Migration helpers if profiles table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS income_bracket VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS proof_of_address_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT;

-- 4. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL UNIQUE,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    iban VARCHAR(60) NOT NULL UNIQUE,
    bic_swift VARCHAR(20) NOT NULL DEFAULT 'MOVAFUS33XXX',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    account_status account_status_type NOT NULL DEFAULT 'inactive',
    is_balance_visible BOOLEAN DEFAULT TRUE,
    cat_code VARCHAR(30),
    cot_code VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Migration helpers if accounts table already existed
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS cat_code VARCHAR(30);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS cot_code VARCHAR(30);

-- 5. ACCOUNT APPLICATIONS
CREATE TABLE IF NOT EXISTS account_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status application_status_type NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. KYC DOCUMENTS
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'id_card', 'passport', 'proof_of_residence'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    recipient_name VARCHAR(150),
    recipient_account VARCHAR(100),
    recipient_bank VARCHAR(100),
    reference VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status transaction_status_type NOT NULL DEFAULT 'completed',
    fee NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. TRANSACTION REQUESTS (For deposits / recharges requiring admin verification)
CREATE TABLE IF NOT EXISTS transaction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'deposit',
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(100) NOT NULL,
    sender_name VARCHAR(150),
    source_reference VARCHAR(150),
    proof_document_url TEXT,
    status transaction_status_type NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PAYMENT METHODS (Configured by Admin)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Bank Transfer', 'Fintech', 'Cryptocurrency Demo', 'Digital Wallet', 'Cash / Agency'
    logo_key VARCHAR(50),
    description TEXT,
    account_info TEXT NOT NULL, -- e.g. IBAN, account number, or demo wallet address
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. CARDS (Virtual & Physical)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    cardholder_name VARCHAR(150) NOT NULL,
    card_number_masked VARCHAR(30) NOT NULL, -- e.g. 4532 •••• •••• 8821
    card_number_mock_full VARCHAR(30) NOT NULL, -- Non-routable 16-digit demo card
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    cvc_mock VARCHAR(4) NOT NULL,
    network card_network_type NOT NULL DEFAULT 'visa',
    tier card_tier_type NOT NULL DEFAULT 'gold',
    status card_status_type NOT NULL DEFAULT 'active',
    balance NUMERIC(18, 2) DEFAULT 0.00,
    monthly_limit NUMERIC(18, 2) DEFAULT 10000.00,
    allow_balance_transfer BOOLEAN DEFAULT FALSE,
    is_physical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. CARD DELIVERY (Physical card shipping tracking)
CREATE TABLE IF NOT EXISTS card_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    recipient_full_name VARCHAR(150) NOT NULL,
    street_address TEXT NOT NULL,
    building_unit VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    current_stage delivery_stage_type NOT NULL DEFAULT 'request_received',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. LOAN RATES (Admin-Configurable Dynamic Rates)
CREATE TABLE IF NOT EXISTS loan_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL UNIQUE,
    annual_rate_percent NUMERIC(5, 2) NOT NULL,
    min_amount NUMERIC(15, 2) DEFAULT 2000.00,
    max_amount NUMERIC(15, 2) DEFAULT 1000000.00,
    min_duration_months INT DEFAULT 3,
    max_duration_months INT DEFAULT 360,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. LOAN APPLICATIONS
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    project_type VARCHAR(100) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    duration_months INT NOT NULL,
    rate_percent NUMERIC(5, 2) NOT NULL,
    monthly_payment NUMERIC(15, 2) NOT NULL,
    total_cost NUMERIC(18, 2) NOT NULL,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    terms_accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    credit_parameters_agreed BOOLEAN DEFAULT FALSE,
    credit_parameters_agreed_at TIMESTAMPTZ,
    status loan_status_type NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    funds_released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_for_admin BOOLEAN DEFAULT FALSE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'action_required'
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. EMAIL LOGS (Resend Integration & audit)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_key VARCHAR(100),
    resend_message_id VARCHAR(150),
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'mock_delivered'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. BANK SETTINGS
CREATE TABLE IF NOT EXISTS bank_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current_settings',
    bank_name VARCHAR(150) DEFAULT 'MOVAFI BANK UNITED STATES',
    short_name VARCHAR(100) DEFAULT 'Movafi Bank',
    city VARCHAR(100) DEFAULT 'New York',
    country VARCHAR(100) DEFAULT 'United States',
    support_email VARCHAR(255) DEFAULT 'support@movafi-groupes.com',
    support_phone VARCHAR(50) DEFAULT '+1 (212) 847-9200',
    disclaimer_notice TEXT DEFAULT 'Movafi Bank est une banque privée digitale internationale et une plateforme de trésorerie institutionnelle. Comptes sous ségrégation d''actifs et rails de paiement sécurisés.',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. BLOCKED IPS
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(50) NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 20. OTP VERIFICATIONS
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_profile_id ON accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_account_id ON loan_applications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view & update their own profile; admins can view all.
CREATE POLICY "Profiles self access" ON profiles
    FOR ALL USING (
        auth.uid() = auth_user_id 
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Accounts: Users can only see their own accounts; admins can view all.
CREATE POLICY "Accounts user isolation" ON accounts
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Transactions: Isolated to account owner or admin
CREATE POLICY "Transactions user isolation" ON transactions
    FOR SELECT USING (
        account_id IN (
            SELECT a.id FROM accounts a 
            JOIN profiles p ON a.profile_id = p.id 
            WHERE p.auth_user_id = auth.uid()
        )
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Cards: Isolated to cardholder or admin
CREATE POLICY "Cards user isolation" ON cards
    FOR ALL USING (
        account_id IN (
            SELECT a.id FROM accounts a 
            JOIN profiles p ON a.profile_id = p.id 
            WHERE p.auth_user_id = auth.uid()
        )
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Loan Applications: Isolated to borrower or admin
CREATE POLICY "Loan applications user isolation" ON loan_applications
    FOR ALL USING (
        account_id IN (
            SELECT a.id FROM accounts a 
            JOIN profiles p ON a.profile_id = p.id 
            WHERE p.auth_user_id = auth.uid()
        )
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Notifications: Only visible to targeted recipient or admins if marked is_for_admin
CREATE POLICY "Notifications user isolation" ON notifications
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        OR (is_for_admin = TRUE AND (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE)
    );

-- ==============================================================================
-- SEED INITIAL DATA
-- ==============================================================================
INSERT INTO bank_settings (id, bank_name, short_name, city, country, support_email, support_phone, disclaimer_notice)
VALUES ('current_settings', 'MOVAFI BANK UNITED STATES', 'Movafi Bank', 'New York', 'United States', 'support@movafi-groupes.com', '+1 (212) 847-9200', 'Movafi Bank est une banque privée digitale internationale et une plateforme de trésorerie institutionnelle. Comptes sous ségrégation d''actifs et rails de paiement sécurisés.')
ON CONFLICT (id) DO UPDATE SET 
    support_email = EXCLUDED.support_email,
    support_phone = EXCLUDED.support_phone,
    disclaimer_notice = EXCLUDED.disclaimer_notice;

INSERT INTO loan_rates (category, annual_rate_percent, min_amount, max_amount, min_duration_months, max_duration_months)
VALUES 
    ('Real Estate', 2.45, 50000.00, 1000000.00, 12, 360),
    ('Automobile', 3.80, 5000.00, 150000.00, 6, 84),
    ('Renovation', 2.90, 10000.00, 300000.00, 6, 120),
    ('Business', 3.20, 25000.00, 1000000.00, 12, 240),
    ('Working Capital', 4.50, 5000.00, 500000.00, 3, 60),
    ('Education', 1.90, 2000.00, 100000.00, 6, 120),
    ('Other', 3.50, 2000.00, 250000.00, 3, 120)
ON CONFLICT (category) DO NOTHING;

INSERT INTO payment_methods (name, category, description, account_info, instructions, is_active, display_order)
VALUES
    ('Fedwire / ACH Domestic', 'Bank Transfer', 'Direct domestic USD transfer via Federal Reserve routing', 'Routing: 021000021 / Account: 984029148201', 'Include your Client ID in the wire memo.', TRUE, 1),
    ('SWIFT International Wire', 'Bank Transfer', 'High-value multi-currency cross-border settlement', 'IBAN: US94MOVA0210000219840291482 / BIC: MOVAFUS33XXX', 'Standard international settlement within 24 hours.', TRUE, 2),
    ('Institutional Crypto Gateway (Demo)', 'Cryptocurrency Demo', 'Simulated on-chain liquidity gateway for demonstration', 'USDT / USDC ERC-20 Demo: 0x71C...89A9 | BTC Demo: bc1q...demo', 'Purely simulated cryptographic ledger credit for testing.', TRUE, 3),
    ('Movafi Private Courier / Agency', 'Cash / Agency', 'Private armored courier deposit service for accredited institutions', 'Agency Desk: 540 Madison Ave, New York, NY 10022', 'Appointment required with your designated wealth manager.', TRUE, 4)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 21. REFERRAL PROGRAM / PARRAINAGE (Supabase Backend Integration)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE referral_status_type AS ENUM (
        'invitation_created',
        'invitation_sent',
        'registration_started',
        'registration_completed',
        'verification_pending',
        'account_approved',
        'referral_validated',
        'referral_rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_reward_type AS ENUM (
        'points',
        'fixed_amount',
        'bonus',
        'tier_upgrade',
        'badge',
        'none'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Referral Program Global Configuration & Rules (Managed by Admin)
CREATE TABLE IF NOT EXISTS referral_programs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_program',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_validity_days INT NOT NULL DEFAULT 30,
    max_referees_per_user INT NOT NULL DEFAULT 50,
    max_invitations_per_user INT NOT NULL DEFAULT 100,
    validation_condition VARCHAR(100) NOT NULL DEFAULT 'account_approved',
    reward_type referral_reward_type NOT NULL DEFAULT 'points',
    reward_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    reward_currency VARCHAR(10) DEFAULT 'USD',
    explanatory_text TEXT NOT NULL DEFAULT 'Invitez de nouveaux utilisateurs à découvrir l''expérience numérique de Movafi Bank et suivez vos invitations depuis votre espace personnel.',
    terms_and_conditions TEXT NOT NULL DEFAULT 'Programme de parrainage fictif — fonctionnalité de démonstration du prototype. Toute récompense, point ou bonus est purement indicatif et ne constitue aucun avantage bancaire réel.',
    default_share_message TEXT NOT NULL DEFAULT 'Découvrez Movafi Bank et créez votre accès via mon lien de démonstration : {link}',
    tiers JSONB DEFAULT '[
        {"id": "tier_1", "name": "Niveau 1 — Initié", "min_validated": 1, "max_validated": 5, "badge": "Bronze Sovereign", "fictional_reward": "10 points / parrainage"},
        {"id": "tier_2", "name": "Niveau 2 — Partenaire", "min_validated": 6, "max_validated": 20, "badge": "Silver Prestige", "fictional_reward": "25 points / parrainage"},
        {"id": "tier_3", "name": "Niveau 3 — Ambassadeur", "min_validated": 21, "max_validated": 999999, "badge": "Gold Excellence", "fictional_reward": "50 points / parrainage"}
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unique Referral Codes assigned to accounts/profiles
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_uses INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Referral Relationships & Tracking Records
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referee_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referee_name VARCHAR(150),
    referee_name_masked VARCHAR(50) NOT NULL,
    referee_email VARCHAR(255),
    code_used VARCHAR(30) NOT NULL,
    status referral_status_type NOT NULL DEFAULT 'invitation_created',
    last_step_reached VARCHAR(150) NOT NULL DEFAULT 'Invitation créée',
    reward_type referral_reward_type NOT NULL DEFAULT 'points',
    reward_value NUMERIC(10, 2) DEFAULT 10.00,
    reward_description VARCHAR(150) DEFAULT '10 points fictifs',
    notes TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    activity_history JSONB DEFAULT '[]'::jsonb,
    validated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs for referral milestone audits
CREATE TABLE IF NOT EXISTS referral_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Referral Tables
CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON referral_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code_used);

-- RLS for Referrals
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referral programs public read" ON referral_programs
    FOR SELECT USING (TRUE);

CREATE POLICY "Referral codes self access" ON referral_codes
    FOR ALL USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

CREATE POLICY "Referrals referrer access" ON referrals
    FOR ALL USING (
        referrer_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        OR (SELECT is_admin FROM profiles WHERE auth_user_id = auth.uid()) = TRUE
    );

-- Seed Default Referral Program & Sample Code
INSERT INTO referral_programs (id, is_enabled, invitation_validity_days, max_referees_per_user, max_invitations_per_user, validation_condition, reward_type, reward_value, reward_currency)
VALUES ('default_program', TRUE, 30, 50, 100, 'account_approved', 'points', 10.00, 'USD')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 22. SEED DEFAULT EMAIL TEMPLATES
-- ==============================================================================
INSERT INTO email_templates (id, template_key, name, language, subject, body_text)
VALUES
    (gen_random_uuid(), 'otp_verification', 'Vérification de Sécurité (Code OTP)', 'fr', 'Movafi Bank · Votre code de sécurité confidentiel : {{code}}', 'Cher Client,\n\nVoici votre code confidentiel de vérification Movafi Bank : {{code}}\n\nCe code expire dans 15 minutes. Ne le communiquez à personne.'),
    (gen_random_uuid(), 'account_created', 'Demande d''ouverture enregistrée', 'fr', 'Movafi Bank · Demande d''ouverture de compte déposée ({{client_id}})', 'Bonjour {{first_name}},\n\nVotre demande d''ouverture de compte a été reçue. Un administrateur va examiner votre dossier. Votre compte restera inactif jusqu''à son approbation.'),
    (gen_random_uuid(), 'account_approved', 'Compte Bancaire Activé', 'fr', 'Movafi Bank · Votre compte bancaire est désormais actif', 'Bonjour {{first_name}},\n\nVotre compte Movafi Bank a été validé et activé. Vos coordonnées : {{iban}}. Vous pouvez vous connecter à votre espace client.'),
    (gen_random_uuid(), 'transfer_completed', 'Avis d''exécution de virement', 'fr', 'Movafi Bank · Avis d''exécution d''opération : {{reference}}', 'Bonjour {{first_name}},\n\nVotre virement de {{amount}} {{currency}} (Réf: {{reference}}) a été exécuté avec succès.')
ON CONFLICT (template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_text = EXCLUDED.body_text;

-- ==============================================================================
-- 23. SEED INITIAL EXECUTIVE ADMINISTRATOR
-- Credentials: support@movafigroupes.com / AdminPass2026! / PIN: 998877
-- ==============================================================================
INSERT INTO profiles (
    id, email, first_name, last_name, phone, nationality, residence_country, city, 
    preferred_currency, preferred_language, account_type, occupation, monthly_income, 
    is_admin, admin_role, password_hash, pin_hash
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'support@movafigroupes.com',
    'Genevieve',
    'Rothschild',
    '+1 (212) 555-0100',
    'United States',
    'United States',
    'New York',
    'USD',
    'fr',
    'Business',
    'Managing Director & Chief Risk Officer',
    95000.00,
    TRUE,
    'admin',
    encode(digest('AdminPass2026!', 'sha256'), 'hex'),
    encode(digest('998877', 'sha256'), 'hex')
) ON CONFLICT (email) DO UPDATE SET
    is_admin = TRUE,
    admin_role = 'admin',
    password_hash = encode(digest('AdminPass2026!', 'sha256'), 'hex'),
    pin_hash = encode(digest('998877', 'sha256'), 'hex');

INSERT INTO accounts (
    id, profile_id, client_id, account_number, iban, bic_swift, currency, balance, account_status, is_balance_visible, cat_code, cot_code
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'EXECUTIVE-01',
    '984000100201',
    'US94MOVA021000021984000100201',
    'MOVAFUS33XXX',
    'USD',
    50000000.00,
    'active',
    TRUE,
    'CAT-984001',
    'COT-552019'
) ON CONFLICT (client_id) DO NOTHING;

-- ==============================================================================
-- 24. STORAGE BUCKET FOR KYC DOCUMENTS (Private, Isolated)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

