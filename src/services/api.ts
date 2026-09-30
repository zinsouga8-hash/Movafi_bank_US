import {
  UserProfile,
  BankAccount,
  Transaction,
  BankCard,
  LoanApplication,
  PaymentMethod,
  NotificationItem,
  BankSettings,
  LoanRate,
  ReferralStats,
  ReferralRecord,
  ReferralProgramSettings
} from '../types/banking';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('movafi_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Public & Settings
  async getSettings(): Promise<{ success: boolean; settings: BankSettings }> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  // Auth
  async registerStep1(email: string, password: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  async submitApplication(payload: any): Promise<{
    success: boolean;
    message?: string;
    user?: UserProfile;
    account?: BankAccount;
    token?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/submit-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async loginStep1(email: string, password: string): Promise<{
    success: boolean;
    require_pin?: boolean;
    user_id?: string;
    first_name?: string;
    is_admin?: boolean;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/login-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async loginStep2(user_id: string, pin: string): Promise<{
    success: boolean;
    user?: UserProfile;
    account?: BankAccount;
    token?: string;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/login-step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, pin })
    });
    return res.json();
  },

  async getMe(): Promise<{
    success: boolean;
    user?: UserProfile;
    account?: BankAccount;
    accounts?: BankAccount[];
    cards?: BankCard[];
    transactions?: Transaction[];
    loans?: LoanApplication[];
    notifications?: NotificationItem[];
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async createSubAccount(payload: { currency: string; account_type?: string }): Promise<{
    success: boolean;
    account?: BankAccount;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/accounts/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateProfile(data: any): Promise<{ success: boolean; user?: UserProfile; account?: BankAccount }> {
    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async changePin(current_pin: string, new_pin: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/change-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ current_pin, new_pin })
    });
    return res.json();
  },

  // Transfers
  async executeTransfer(payload: any): Promise<{
    success: boolean;
    message?: string;
    transaction?: Transaction;
    updated_balance?: number;
  }> {
    const res = await fetch(`${API_BASE}/transfers/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Recharge
  async getRechargeMethods(): Promise<{ success: boolean; payment_methods: PaymentMethod[] }> {
    const res = await fetch(`${API_BASE}/recharge/methods`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async submitRecharge(payload: any): Promise<{ success: boolean; message?: string; request?: any }> {
    const res = await fetch(`${API_BASE}/recharge/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Withdrawals & Payouts
  async submitWithdrawal(payload: {
    amount: number;
    currency: string;
    payout_method: string;
    beneficiary_name: string;
    beneficiary_account: string;
    beneficiary_bank?: string;
    beneficiary_country?: string;
    reference?: string;
    description?: string;
    pin: string;
  }): Promise<{
    success: boolean;
    message?: string;
    request?: any;
    transaction?: Transaction;
    updated_balance?: number;
  }> {
    const res = await fetch(`${API_BASE}/withdrawals/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Cards
  async requestCard(payload: any): Promise<{ success: boolean; message?: string; card?: BankCard }> {
    const res = await fetch(`${API_BASE}/cards/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async transferToCard(payload: any): Promise<{
    success: boolean;
    message?: string;
    card_balance?: number;
    account_balance?: number;
  }> {
    const res = await fetch(`${API_BASE}/cards/transfer-from-balance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async orderPhysicalCard(payload: any): Promise<{ success: boolean; message?: string; delivery?: any }> {
    const res = await fetch(`${API_BASE}/cards/order-physical`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Financing
  async getLoanRates(): Promise<{ success: boolean; rates: LoanRate[] }> {
    const res = await fetch(`${API_BASE}/financing/rates`);
    return res.json();
  },

  async applyForLoan(payload: any): Promise<{ success: boolean; message?: string; loan?: LoanApplication }> {
    const res = await fetch(`${API_BASE}/financing/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async agreeCreditParameters(loanId: string): Promise<{ success: boolean; message?: string; loan?: LoanApplication }> {
    const res = await fetch(`${API_BASE}/financing/${loanId}/agree-parameters`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Notifications
  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Referral Program
  referrals: {
    async checkCode(code: string): Promise<{ success: boolean; valid: boolean; code?: string; referrer_name?: string; message?: string }> {
      const res = await fetch(`${API_BASE}/referrals/check/${encodeURIComponent(code)}`);
      return res.json();
    },
    async getMyCode(): Promise<{ success: boolean; code: string; total_uses: number; created_at: string; settings?: any }> {
      const res = await fetch(`${API_BASE}/referrals/my-code`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    async generateNewCode(): Promise<{ success: boolean; code: string; message: string }> {
      const res = await fetch(`${API_BASE}/referrals/generate-code`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    async getStats(): Promise<{
      success: boolean;
      stats: ReferralStats;
      code: string;
      referrals: ReferralRecord[];
      settings: ReferralProgramSettings;
    }> {
      const res = await fetch(`${API_BASE}/referrals/stats`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    async invite(payload: { email: string; name?: string; custom_message?: string }): Promise<{
      success: boolean;
      message: string;
      referral?: any;
    }> {
      const res = await fetch(`${API_BASE}/referrals/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  // ADMIN ENDPOINTS
  admin: {
    async getAccounts(query?: { search?: string; status?: string; page?: number; limit?: number }) {
      const q = new URLSearchParams();
      if (query?.search) q.append('search', query.search);
      if (query?.status) q.append('status', query.status);
      if (query?.page) q.append('page', String(query.page));
      if (query?.limit) q.append('limit', String(query.limit));

      const res = await fetch(`${API_BASE}/admin/accounts?${q.toString()}`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getAccountDetail(id: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async adjustBalance(id: string, type: 'credit' | 'debit', amount: number, reason: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}/adjust-balance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, amount, reason })
      });
      return res.json();
    },

    async updateAccountStatus(id: string, status: string, notes?: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes })
      });
      return res.json();
    },

    async resetPin(id: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}/reset-pin`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async deleteAccount(id: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async regenerateSecurityCodes(id: string) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}/regenerate-security-codes`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateProfile(id: string, payload: any) {
      const res = await fetch(`${API_BASE}/admin/accounts/${id}/update-profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getTransactions() {
      const res = await fetch(`${API_BASE}/admin/transactions`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async handleDepositRequest(id: string, action: 'approve' | 'reject', notes?: string) {
      const res = await fetch(`${API_BASE}/admin/transactions/requests/${id}/action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, notes })
      });
      return res.json();
    },

    async getCards() {
      const res = await fetch(`${API_BASE}/admin/cards`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateCard(id: string, payload: any) {
      const res = await fetch(`${API_BASE}/admin/cards/${id}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getLoans() {
      const res = await fetch(`${API_BASE}/admin/loans`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateLoanStatus(id: string, status: string, admin_notes?: string) {
      const res = await fetch(`${API_BASE}/admin/loans/${id}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, admin_notes })
      });
      return res.json();
    },

    async releaseLoanFunds(id: string) {
      const res = await fetch(`${API_BASE}/admin/loans/${id}/release-funds`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getRates() {
      const res = await fetch(`${API_BASE}/admin/rates`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateRate(payload: any) {
      const res = await fetch(`${API_BASE}/admin/rates/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getPaymentMethods() {
      const res = await fetch(`${API_BASE}/admin/payment-methods`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async savePaymentMethod(payload: any) {
      const res = await fetch(`${API_BASE}/admin/payment-methods/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async deletePaymentMethod(id: string) {
      const res = await fetch(`${API_BASE}/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getEmailHistory() {
      const res = await fetch(`${API_BASE}/admin/emails/history`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getEmailTemplates() {
      const res = await fetch(`${API_BASE}/admin/emails/templates`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async saveEmailTemplate(payload: any) {
      const res = await fetch(`${API_BASE}/admin/emails/templates/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async sendManualEmail(payload: any) {
      const res = await fetch(`${API_BASE}/admin/emails/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getSettings() {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateSettings(payload: any) {
      const res = await fetch(`${API_BASE}/admin/settings/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getBlockedIps() {
      const res = await fetch(`${API_BASE}/admin/security/ips`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async addBlockedIp(ip_address: string, reason: string) {
      const res = await fetch(`${API_BASE}/admin/security/ips/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ip_address, reason })
      });
      return res.json();
    },

    async deleteBlockedIp(id: string) {
      const res = await fetch(`${API_BASE}/admin/security/ips/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getTeam() {
      const res = await fetch(`${API_BASE}/admin/team`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async inviteTeamMember(payload: any) {
      const res = await fetch(`${API_BASE}/admin/team/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getAuditLogs(limit = 50) {
      const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    // Referral Program Admin
    async getReferrals() {
      const res = await fetch(`${API_BASE}/admin/referrals`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async getReferralSettings() {
      const res = await fetch(`${API_BASE}/admin/referral-settings`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },

    async updateReferralSettings(payload: any) {
      const res = await fetch(`${API_BASE}/admin/referral-settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async updateReferral(id: string, payload: any) {
      const res = await fetch(`${API_BASE}/admin/referrals/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async regenerateUserReferralCode(profile_id: string) {
      const res = await fetch(`${API_BASE}/admin/referrals/regenerate-user-code`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ profile_id })
      });
      return res.json();
    }
  }
};
