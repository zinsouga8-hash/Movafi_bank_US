export type AccountType = 'Individual' | 'Business' | 'Private Wealth' | 'Corporate' | 'Trust' | string;
export type AccountStatus = 'active' | 'inactive' | 'dormant' | 'frozen' | 'suspended' | 'rejected' | string;
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | string;
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'MXN' | 'AED' | string;

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  nationality?: string;
  residence_country?: string;
  city?: string;
  preferred_currency?: string;
  preferred_language?: string;
  account_type?: string;
  occupation?: string;
  monthly_income?: number;
  income_bracket?: string;
  activity_duration?: string;
  password_hash?: string;
  portal_password?: string;
  pin_hash?: string;
  portal_pin?: string;
  id_document_name?: string;
  id_document_url?: string;
  proof_of_address_name?: string;
  proof_of_address_url?: string;
  is_admin: boolean;
  admin_role?: 'superadmin' | 'admin' | 'compliance' | 'treasury' | null;
  application_status?: ApplicationStatus;
  created_at: string;
  updated_at?: string;
}

export interface BankAccount {
  id: string;
  profile_id: string;
  client_id: string;
  account_number: string;
  iban: string;
  bic_swift: string;
  currency: string;
  balance: number;
  account_status: AccountStatus;
  application_status?: ApplicationStatus;
  is_balance_visible?: boolean;
  cat_code?: string;
  cot_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  user_id?: string;
  type: any;
  category?: string;
  amount: number;
  currency: string;
  recipient_name?: string;
  recipient_account?: string;
  recipient_bank?: string;
  reference?: string;
  description?: string;
  status: any;
  fee?: number;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionRequest {
  id: string;
  account_id: string;
  user_id?: string;
  client_name?: string;
  client_email?: string;
  type: 'deposit' | 'withdrawal' | string;
  amount: number;
  currency: string;
  payment_method: string;
  payout_method?: string;
  sender_name?: string;
  beneficiary_name?: string;
  beneficiary_account?: string;
  beneficiary_bank?: string;
  source_reference?: string;
  proof_document_url?: string;
  status: any;
  admin_notes?: string;
  rejection_reason?: string;
  processed_by?: string;
  processed_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: string;
  description: string;
  account_info: string;
  wallet_address?: string;
  crypto_network?: string;
  instructions: string;
  is_active: boolean;
  display_order: number;
}

export interface BankCard {
  id: string;
  account_id: string;
  cardholder_name: string;
  card_number_masked: string;
  card_number_mock_full?: string;
  expiry_month: any;
  expiry_year: any;
  cvc_mock?: string;
  network: any;
  tier: any;
  status: any;
  creation_status: any;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  balance: number;
  allow_balance_transfer?: boolean;
  is_physical?: boolean;
  delivery?: {
    id: string;
    card_id: string;
    recipient_full_name: string;
    street_address: string;
    building_unit?: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
    tracking_number: string;
    current_stage: string;
    updated_at: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface LoanRate {
  id: string;
  category: string;
  annual_rate_percent: number;
  min_amount: number;
  max_amount: number;
  min_duration_months: number;
  max_duration_months: number;
}

export interface LoanApplication {
  id: string;
  account_id: string;
  borrower_name?: string;
  borrower_email?: string;
  project_type: string;
  amount: number;
  currency: string;
  duration_months: number;
  rate_percent: number;
  monthly_payment: number;
  total_cost: number;
  terms_accepted: boolean;
  terms_accepted_at: string;
  credit_parameters_agreed?: boolean;
  credit_parameters_agreed_at?: string | null;
  status: any;
  admin_notes?: string | null;
  funds_released_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  profile_id?: string;
  is_for_admin?: boolean;
  title: string;
  message: string;
  type: any;
  category?: 'account' | 'transactions' | 'cards' | 'financing' | 'security' | 'admin';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  link?: string | null;
  email_sent?: boolean;
  sms_sent?: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  admin_id?: string;
  admin_email: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  target_resource: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface BankSettings {
  id: string;
  bank_name: string;
  short_name: string;
  city: string;
  country: string;
  support_email: string;
  support_phone: string;
  disclaimer_notice: string;
  updated_at: string;
}

export interface ReferralTier {
  id: string;
  name: string;
  min_referrals: number;
  max_referrals?: number;
  badge: string;
  reward_description: string;
}

export interface ReferralSettings {
  is_enabled: boolean;
  invitation_validity_days: number;
  max_referrals_per_user: number;
  max_invitations_per_user: number;
  validation_condition: string;
  reward_type: string;
  reward_value: number;
  reward_currency: string;
  tiers: ReferralTier[];
  explanatory_text: string;
  terms_and_conditions: string;
  default_share_message: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  profile_id: string;
  code: string;
  is_active: boolean;
  total_uses: number;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_profile_id: string;
  referrer_name?: string;
  referrer_email?: string;
  referee_profile_id?: string;
  referee_name?: string;
  referee_name_masked?: string;
  referee_email?: string;
  referred_email?: string;
  referred_name?: string;
  referral_code?: string;
  code_used?: string;
  status: any;
  last_step_reached?: string;
  reward_type?: string;
  reward_value?: number;
  reward_description?: string;
  reward_claimed?: boolean;
  reward_points?: number;
  ip_address?: any;
  activity_history?: any[];
  notes?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}
