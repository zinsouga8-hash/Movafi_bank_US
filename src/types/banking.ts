export type SupportedCurrency = 'USD' | 'CAD' | 'EUR' | 'SAR' | 'AED' | 'BHD' | 'MXN';
export type SupportedLanguage = 'en' | 'fr' | 'es' | 'ar';

export type ReferralStatus =
  | 'invitation_created'
  | 'invitation_sent'
  | 'registration_started'
  | 'registration_completed'
  | 'verification_pending'
  | 'account_approved'
  | 'referral_validated'
  | 'referral_rejected'
  | 'expired';

export type ReferralRewardType = 'points' | 'fixed_amount' | 'bonus' | 'badge' | 'none';

export interface ReferralTier {
  id: string;
  name: string;
  min_referrals: number;
  max_referrals?: number;
  badge: string;
  reward_description: string;
}

export interface ReferralProgramSettings {
  is_enabled: boolean;
  invitation_validity_days: number;
  max_referrals_per_user: number;
  max_invitations_per_user: number;
  validation_condition: 'registration_completed' | 'account_approved' | 'first_deposit';
  reward_type: ReferralRewardType;
  reward_value: number;
  reward_currency?: SupportedCurrency;
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

export interface ReferralActivityLog {
  stage: ReferralStatus;
  label: string;
  timestamp: string;
  note?: string;
}

export interface ReferralRecord {
  id: string;
  referrer_profile_id: string;
  referrer_name?: string;
  referrer_email?: string;
  referee_profile_id?: string;
  referee_name?: string;
  referee_email?: string;
  referee_name_masked?: string;
  code_used: string;
  status: ReferralStatus;
  last_step_reached: string;
  reward_type: ReferralRewardType;
  reward_value: number;
  reward_description?: string;
  validated_at?: string;
  ip_address?: string;
  notes?: string;
  activity_history: ReferralActivityLog[];
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  invitations_sent: number;
  registrations_started: number;
  registrations_completed: number;
  accounts_verified: number;
  referrals_validated: number;
  referrals_pending: number;
  referrals_rejected: number;
  total_points: number;
  current_tier: string;
  tier_badge: string;
}

export type AccountStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'credit'
  | 'debit'
  | 'card_funding'
  | 'loan_credit'
  | 'fee'
  | 'adjustment'
  | 'loan_disbursement';

export type TransactionStatus =
  | 'draft'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'failed';

export type CardNetwork = 'visa' | 'mastercard';
export type CardTier = 'standard' | 'gold' | 'platinum';
export type CardStatus = 'pending' | 'active' | 'blocked' | 'cancelled';
export type DeliveryStage = 'request_received' | 'processing' | 'preparation' | 'transit' | 'customs' | 'delivered';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'funds_released' | 'completed';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  nationality: string;
  residence_country: string;
  city: string;
  preferred_currency: SupportedCurrency;
  preferred_language: SupportedLanguage;
  account_type: 'Personal' | 'Business';
  occupation: string;
  monthly_income: number;
  income_bracket?: string;
  activity_duration: string;
  id_document_name?: string;
  id_document_url?: string;
  proof_of_address_name?: string;
  proof_of_address_url?: string;
  is_admin: boolean;
  admin_role?: 'admin' | 'moderator' | 'support' | 'client' | null;
  portal_password?: string;
  portal_pin?: string;
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
  currency: SupportedCurrency;
  balance: number;
  account_status: AccountStatus;
  application_status?: ApplicationStatus;
  is_balance_visible: boolean;
  cat_code?: string;
  cot_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  account_id: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: SupportedCurrency;
  recipient_name?: string;
  recipient_account?: string;
  recipient_bank?: string;
  reference: string;
  description: string;
  status: TransactionStatus;
  fee: number;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface TransactionRequest {
  id: string;
  user_id?: string;
  account_id: string;
  client_name?: string;
  client_email?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: SupportedCurrency;
  payment_method: string;
  payout_method?: string;
  sender_name?: string;
  beneficiary_name?: string;
  beneficiary_account?: string;
  beneficiary_bank?: string;
  source_reference: string;
  proof_document_url?: string;
  status: TransactionStatus;
  admin_notes?: string;
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: 'Bank Transfer' | 'Fintech' | 'Digital Assets' | 'Cryptocurrency Demo' | 'Digital Wallet' | 'Cash / Agency';
  logo_key?: string;
  description: string;
  account_info: string;
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
  expiry_month: number;
  expiry_year: number;
  cvc_mock?: string;
  network: CardNetwork;
  tier: CardTier;
  status: CardStatus;
  balance: number;
  monthly_limit: number;
  allow_balance_transfer: boolean;
  is_physical: boolean;
  delivery?: CardDelivery;
  created_at: string;
}

export interface CardDelivery {
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
  current_stage: DeliveryStage;
  updated_at: string;
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
  currency: SupportedCurrency;
  duration_months: number;
  rate_percent: number;
  monthly_payment: number;
  total_cost: number;
  terms_accepted: boolean;
  terms_accepted_at: string;
  credit_parameters_agreed: boolean;
  credit_parameters_agreed_at?: string;
  status: LoanStatus;
  admin_notes?: string;
  funds_released_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  profile_id?: string;
  is_for_admin: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  language: 'en' | 'fr';
  subject: string;
  body_text: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_key?: string;
  resend_message_id?: string;
  status: 'sent' | 'failed' | 'queued_internal' | 'mock_delivered';
  error_message?: string;
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

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  admin_id?: string;
  admin_email?: string;
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

export interface KycDocument {
  id: string;
  profile_id: string;
  document_type: 'id_card' | 'passport' | 'proof_of_residence';
  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
