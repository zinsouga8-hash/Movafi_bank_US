-- ==============================================================================
-- MOVAFI BANK UNITED STATES — SUPABASE DATABASE RESET & INSTALLATION TOTALE
-- Version: 5.0 Clean Rebuild / Fresh Schema / Zero Error Guarantee
-- 
-- Ce script :
-- 1. Supprime proprement TOUTES les anciennes tables existantes (DROP TABLE ... CASCADE)
-- 2. Supprime les anciens triggers, fonctions et types obsolètes
-- 3. Recrée l'ensemble des 22 tables avec types TEXT universels et contraintes explicites
-- 4. Active les politiques RLS ouvertes pour le portail bancaire et l'administration
-- 5. Attribue tous les droits GRANT (anon, authenticated, service_role)
-- 6. Insère les données initiales indispensables (Admin, Paramètres, Grilles de taux)
-- ==============================================================================

-- 1. EXTENSIONS POSTGRESQL NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. NETTOYAGE COMPLET DES ANCIENNES TABLES ET OBJETS EXISTANTS
-- ==============================================================================
DROP TABLE IF EXISTS referral_activity_logs CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS referral_programs CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS blocked_ips CASCADE;
DROP TABLE IF EXISTS bank_settings CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS loan_rates CASCADE;
DROP TABLE IF EXISTS card_delivery CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS transaction_requests CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS account_applications CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Suppression de tables héritées potentielles
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Suppression d'anciens types énumérés
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Suppression d'anciens triggers et fonctions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==============================================================================
-- 3. CRÉATION DES TABLES DÉFINITIVES
-- ==============================================================================

-- TABLE 1 : PROFILES (Profils clients et administrateurs)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    auth_user_id UUID,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    nationality VARCHAR(100),
    residence_country VARCHAR(100),
    city VARCHAR(100),
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    preferred_language VARCHAR(10) DEFAULT 'fr',
    account_type VARCHAR(50) DEFAULT 'Personal',
    occupation VARCHAR(150),
    monthly_income NUMERIC(15, 2) DEFAULT 0.00,
    income_bracket VARCHAR(100),
    activity_duration VARCHAR(100),
    password_hash TEXT NOT NULL DEFAULT '',
    portal_password TEXT DEFAULT '',
    pin_hash TEXT,
    portal_pin TEXT DEFAULT '',
    id_document_name TEXT,
    id_document_url TEXT,
    proof_of_address_name TEXT,
    proof_of_address_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    admin_role VARCHAR(20) DEFAULT NULL,
    application_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_profiles_email UNIQUE (email),
    CONSTRAINT uq_profiles_auth_user_id UNIQUE (auth_user_id)
);

-- TABLE 2 : ACCOUNTS (Comptes bancaires / Soldes / IBAN)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    iban VARCHAR(60) NOT NULL,
    bic_swift VARCHAR(20) NOT NULL DEFAULT 'MOVAFUS33XXX',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    account_status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    application_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    is_balance_visible BOOLEAN DEFAULT TRUE,
    cat_code VARCHAR(30),
    cot_code VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_accounts_client_id UNIQUE (client_id),
    CONSTRAINT uq_accounts_account_number UNIQUE (account_number),
    CONSTRAINT uq_accounts_iban UNIQUE (iban)
);

-- TABLE 3 : ACCOUNT APPLICATIONS (Dossiers d'ouverture de compte)
CREATE TABLE account_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 4 : KYC DOCUMENTS (Pièces justificatives)
CREATE TABLE kyc_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 5 : TRANSACTIONS (Opérations bancaires)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    recipient_name VARCHAR(150),
    recipient_account VARCHAR(100),
    recipient_bank VARCHAR(100),
    reference VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    fee NUMERIC(10, 2) DEFAULT 0.00,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_transactions_ref UNIQUE (reference)
);

-- TABLE 6 : TRANSACTION REQUESTS (Demandes de rechargement/virement soumises à validation)
CREATE TABLE transaction_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id TEXT,
    client_name VARCHAR(150),
    client_email VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'deposit',
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(100) NOT NULL,
    payout_method VARCHAR(100),
    sender_name VARCHAR(150),
    beneficiary_name VARCHAR(150),
    beneficiary_account VARCHAR(100),
    beneficiary_bank VARCHAR(100),
    source_reference VARCHAR(150),
    proof_document_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    rejection_reason TEXT,
    processed_by TEXT,
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 7 : PAYMENT METHODS (Méthodes de dépôt institutionnelles)
CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    logo_key VARCHAR(50),
    description TEXT,
    account_info TEXT NOT NULL,
    instructions TEXT,
    wallet_address TEXT,
    crypto_network VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 8 : CARDS (Cartes physiques et virtuelles)
CREATE TABLE cards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    cardholder_name VARCHAR(150) NOT NULL,
    card_number_masked VARCHAR(30) NOT NULL,
    card_number_mock_full VARCHAR(30),
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    cvc_mock VARCHAR(4),
    network VARCHAR(30) NOT NULL DEFAULT 'visa',
    tier VARCHAR(30) NOT NULL DEFAULT 'gold',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    creation_status VARCHAR(30) DEFAULT 'approved',
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit NUMERIC(18, 2) DEFAULT 5000.00,
    monthly_limit NUMERIC(18, 2) DEFAULT 10000.00,
    balance NUMERIC(18, 2) DEFAULT 0.00,
    allow_balance_transfer BOOLEAN DEFAULT FALSE,
    is_physical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 9 : CARD DELIVERY (Livraison des cartes)
CREATE TABLE card_delivery (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    recipient_full_name VARCHAR(150) NOT NULL,
    street_address TEXT NOT NULL,
    building_unit VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'request_received',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 10 : LOAN RATES (Grille des taux de crédit)
CREATE TABLE loan_rates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category VARCHAR(50) NOT NULL,
    annual_rate_percent NUMERIC(5, 2) NOT NULL,
    min_amount NUMERIC(15, 2) DEFAULT 2000.00,
    max_amount NUMERIC(15, 2) DEFAULT 1000000.00,
    min_duration_months INT DEFAULT 3,
    max_duration_months INT DEFAULT 360,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loan_rates_category UNIQUE (category)
);

-- TABLE 11 : LOAN APPLICATIONS (Demandes de crédit)
CREATE TABLE loan_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    borrower_name VARCHAR(150),
    borrower_email VARCHAR(255),
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
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    funds_released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 12 : NOTIFICATIONS (Notifications clients et alertes internes)
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    is_for_admin BOOLEAN DEFAULT FALSE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 13 : EMAIL TEMPLATES (Modèles d'emails)
CREATE TABLE email_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_key VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_email_templates_key UNIQUE (template_key)
);

-- TABLE 14 : EMAIL LOGS (Historique des envois d'emails)
CREATE TABLE email_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_key VARCHAR(100),
    resend_message_id VARCHAR(150),
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 15 : BANK SETTINGS (Paramètres globaux de la banque)
CREATE TABLE bank_settings (
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

-- TABLE 16 : BLOCKED IPS (Sécurité & blocage anti-fraude)
CREATE TABLE blocked_ips (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ip_address VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    blocked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_blocked_ips_ip UNIQUE (ip_address)
);

-- TABLE 17 : AUDIT LOGS (Journal d'audit de sécurité)
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_id TEXT,
    admin_id TEXT,
    admin_email VARCHAR(255),
    user_id TEXT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id TEXT,
    target_resource VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 18 : OTP VERIFICATIONS (Codes de validation)
CREATE TABLE otp_verifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 19 : REFERRAL PROGRAMS (Programme de parrainage)
CREATE TABLE referral_programs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_program',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_validity_days INT NOT NULL DEFAULT 30,
    max_referees_per_user INT NOT NULL DEFAULT 50,
    max_invitations_per_user INT NOT NULL DEFAULT 100,
    validation_condition VARCHAR(100) NOT NULL DEFAULT 'account_approved',
    reward_type VARCHAR(50) NOT NULL DEFAULT 'points',
    reward_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    reward_currency VARCHAR(10) DEFAULT 'USD',
    explanatory_text TEXT NOT NULL DEFAULT 'Invitez de nouveaux utilisateurs à découvrir l''expérience numérique de Movafi Bank et suivez vos invitations depuis votre espace personnel.',
    terms_and_conditions TEXT NOT NULL DEFAULT 'Programme de parrainage — fonctionnalité officielle du portail Movafi Bank.',
    default_share_message TEXT NOT NULL DEFAULT 'Découvrez Movafi Bank et créez votre accès sécurisé : {link}',
    tiers JSONB DEFAULT '[
        {"id": "tier_1", "name": "Niveau 1 — Initié", "min_validated": 1, "max_validated": 5, "badge": "Bronze Sovereign", "fictional_reward": "10 points / parrainage"},
        {"id": "tier_2", "name": "Niveau 2 — Partenaire", "min_validated": 6, "max_validated": 20, "badge": "Silver Prestige", "fictional_reward": "25 points / parrainage"},
        {"id": "tier_3", "name": "Niveau 3 — Ambassadeur", "min_validated": 21, "max_validated": 999999, "badge": "Gold Excellence", "fictional_reward": "50 points / parrainage"}
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 20 : REFERRAL CODES (Codes de parrainage des clients)
CREATE TABLE referral_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_uses INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_referral_codes_code UNIQUE (code)
);

-- TABLE 21 : REFERRALS (Suivi des filleuls)
CREATE TABLE referrals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    referrer_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referee_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    referee_name VARCHAR(150),
    referee_name_masked VARCHAR(50) NOT NULL,
    referee_email VARCHAR(255),
    code_used VARCHAR(30) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'invitation_created',
    last_step_reached VARCHAR(150) NOT NULL DEFAULT 'Invitation créée',
    reward_type VARCHAR(50) NOT NULL DEFAULT 'points',
    reward_value NUMERIC(10, 2) DEFAULT 10.00,
    reward_description VARCHAR(150) DEFAULT '10 points Privilège',
    notes TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    activity_history JSONB DEFAULT '[]'::jsonb,
    validated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 22 : REFERRAL ACTIVITY LOGS (Historique des étapes de parrainage)
CREATE TABLE referral_activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    referral_id TEXT NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. INDEX DE PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_accounts_profile_id ON accounts(profile_id);
CREATE INDEX idx_accounts_client_id ON accounts(client_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_tx_requests_account_id ON transaction_requests(account_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_loan_applications_account_id ON loan_applications(account_id);
CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_referral_codes_profile_id ON referral_codes(profile_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_profile_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_profile_id);
CREATE INDEX idx_referrals_code ON referrals(code_used);

-- ==============================================================================
-- 5. POLITIQUES RLS (ROW LEVEL SECURITY) COMPLÈTES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_profiles" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_accounts" ON accounts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_account_applications" ON account_applications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_kyc_documents" ON kyc_documents FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transaction_requests" ON transaction_requests FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payment_methods" ON payment_methods FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cards" ON cards FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_card_delivery" ON card_delivery FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loan_rates" ON loan_rates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_loan_applications" ON loan_applications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_templates" ON email_templates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_logs" ON email_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bank_settings" ON bank_settings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_blocked_ips" ON blocked_ips FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs" ON audit_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_otp_verifications" ON otp_verifications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_referral_programs" ON referral_programs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_referral_codes" ON referral_codes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_referrals" ON referrals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_referral_activity_logs" ON referral_activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Attribution explicite des droits GRANT sur tous les rôles de Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- 6. DONNÉES INITIALES (SEEDS INDISPENSABLES)
-- ==============================================================================

-- 6.1 Paramètres institutionnels
INSERT INTO bank_settings (id, bank_name, short_name, city, country, support_email, support_phone, disclaimer_notice)
VALUES (
    'current_settings', 
    'MOVAFI BANK UNITED STATES', 
    'Movafi Bank', 
    'New York', 
    'United States', 
    'support@movafi-groupes.com', 
    '+1 (212) 847-9200', 
    'Movafi Bank est une banque privée digitale internationale et une plateforme de trésorerie institutionnelle. Comptes sous ségrégation d''actifs et rails de paiement sécurisés.'
)
ON CONFLICT (id) DO UPDATE SET 
    support_email = EXCLUDED.support_email,
    support_phone = EXCLUDED.support_phone,
    disclaimer_notice = EXCLUDED.disclaimer_notice;

-- 6.2 Grille des taux de crédit (category est UNIQUE grâce à uq_loan_rates_category)
INSERT INTO loan_rates (id, category, annual_rate_percent, min_amount, max_amount, min_duration_months, max_duration_months)
VALUES 
    ('rate_real_estate', 'Real Estate', 2.45, 50000.00, 1000000.00, 12, 360),
    ('rate_automobile', 'Automobile', 3.80, 5000.00, 150000.00, 6, 84),
    ('rate_renovation', 'Renovation', 2.90, 10000.00, 300000.00, 6, 120),
    ('rate_business', 'Business', 3.20, 25000.00, 1000000.00, 12, 240),
    ('rate_working_capital', 'Working Capital', 4.50, 5000.00, 500000.00, 3, 60),
    ('rate_education', 'Education', 1.90, 2000.00, 100000.00, 6, 120),
    ('rate_other', 'Other', 3.50, 2000.00, 250000.00, 3, 120)
ON CONFLICT (category) DO UPDATE SET
    annual_rate_percent = EXCLUDED.annual_rate_percent,
    min_amount = EXCLUDED.min_amount,
    max_amount = EXCLUDED.max_amount;

-- 6.3 Méthodes de dépôt
INSERT INTO payment_methods (id, name, category, description, account_info, instructions, is_active, display_order)
VALUES
    ('pm_fedwire', 'Fedwire / ACH Domestic', 'Bank Transfer', 'Direct domestic USD transfer via Federal Reserve routing', 'Routing: 021000021 / Account: 984029148201', 'Include your Client ID in the wire memo.', TRUE, 1),
    ('pm_swift', 'SWIFT International Wire', 'Bank Transfer', 'High-value multi-currency cross-border settlement', 'IBAN: US94MOVA0210000219840291482 / BIC: MOVAFUS33XXX', 'Standard international settlement within 24 hours.', TRUE, 2),
    ('pm_crypto', 'Institutional Crypto Gateway (Demo)', 'Cryptocurrency Demo', 'Simulated on-chain liquidity gateway for demonstration', 'USDT / USDC ERC-20 Demo: 0x71C...89A9 | BTC Demo: bc1q...demo', 'Purely simulated cryptographic ledger credit for testing.', TRUE, 3),
    ('pm_courier', 'Movafi Private Courier / Agency', 'Cash / Agency', 'Private armored courier deposit service for accredited institutions', 'Agency Desk: 540 Madison Ave, New York, NY 10022', 'Appointment required with your designated wealth manager.', TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- 6.4 Modèles d'emails (template_key est UNIQUE grâce à uq_email_templates_key)
INSERT INTO email_templates (id, template_key, name, language, subject, body_text)
VALUES
    ('tmpl_otp', 'otp_verification', 'Vérification de Sécurité (Code OTP)', 'fr', 'Movafi Bank · Votre code de sécurité confidentiel : {{code}}', 'Cher Client,\n\nVoici votre code confidentiel de vérification Movafi Bank : {{code}}\n\nCe code expire dans 15 minutes. Ne le communiquez à personne.'),
    ('tmpl_created', 'account_created', 'Demande d''ouverture enregistrée', 'fr', 'Movafi Bank · Demande d''ouverture de compte déposée ({{client_id}})', 'Bonjour {{first_name}},\n\nVotre demande d''ouverture de compte a été reçue. Un administrateur va examiner votre dossier. Votre compte restera inactif jusqu''à son approbation.'),
    ('tmpl_approved', 'account_approved', 'Compte Bancaire Activé', 'fr', 'Movafi Bank · Votre compte bancaire est désormais actif', 'Bonjour {{first_name}},\n\nVotre compte Movafi Bank a été validé et activé. Vos coordonnées : {{iban}}. Vous pouvez vous connecter à votre espace client.'),
    ('tmpl_transfer', 'transfer_completed', 'Avis d''exécution de virement', 'fr', 'Movafi Bank · Avis d''exécution d''opération : {{reference}}', 'Bonjour {{first_name}},\n\nVotre virement de {{amount}} {{currency}} (Réf: {{reference}}) a été exécuté avec succès.')
ON CONFLICT (template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_text = EXCLUDED.body_text;

-- 6.5 Programme de parrainage par défaut
INSERT INTO referral_programs (id, is_enabled, invitation_validity_days, max_referees_per_user, max_invitations_per_user, validation_condition, reward_type, reward_value, reward_currency)
VALUES ('default_program', TRUE, 30, 50, 100, 'account_approved', 'points', 10.00, 'USD')
ON CONFLICT (id) DO NOTHING;

-- 6.6 Profil Administrateur Initial
-- Identifiants : support@movafigroupes.com / AdminPass2026! / Code PIN : 998877
INSERT INTO profiles (
    id, email, first_name, last_name, phone, nationality, residence_country, city, 
    preferred_currency, preferred_language, account_type, occupation, monthly_income, 
    is_admin, admin_role, portal_password, portal_pin, password_hash, pin_hash, application_status
) VALUES (
    'prof_admin_001',
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
    'AdminPass2026!',
    '998877',
    encode(digest('AdminPass2026!', 'sha256'), 'hex'),
    encode(digest('998877', 'sha256'), 'hex'),
    'approved'
) ON CONFLICT (email) DO UPDATE SET
    is_admin = TRUE,
    admin_role = 'admin',
    portal_password = 'AdminPass2026!',
    portal_pin = '998877',
    password_hash = encode(digest('AdminPass2026!', 'sha256'), 'hex'),
    pin_hash = encode(digest('998877', 'sha256'), 'hex'),
    application_status = 'approved';

-- Compte bancaire administrateur
INSERT INTO accounts (
    id, profile_id, client_id, account_number, iban, bic_swift, currency, balance, account_status, application_status, is_balance_visible, cat_code, cot_code
) VALUES (
    'acc_admin_usd',
    'prof_admin_001',
    'EXECUTIVE-01',
    '984000100201',
    'US94MOVA021000021984000100201',
    'MOVAFUS33XXX',
    'USD',
    50000000.00,
    'active',
    'approved',
    TRUE,
    'CAT-984001',
    'COT-552019'
) ON CONFLICT (client_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    account_status = 'active';

-- Code de parrainage de l'administrateur
INSERT INTO referral_codes (id, profile_id, code, is_active, total_uses)
VALUES ('refc_admin_001', 'prof_admin_001', 'MOV-ADMIN99', TRUE, 0)
ON CONFLICT (code) DO NOTHING;

-- 6.7 Bucket de Stockage KYC (sécurisé dans un bloc de protection)
DO $$ BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('kyc-documents', 'kyc-documents', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "kyc_allow_all" ON storage.objects;
    CREATE POLICY "kyc_allow_all" ON storage.objects FOR ALL TO public USING (bucket_id = 'kyc-documents') WITH CHECK (bucket_id = 'kyc-documents');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- FIN DU SCRIPT DE RÉINITIALISATION ET MIGRATION TOTALE
-- ==============================================================================
