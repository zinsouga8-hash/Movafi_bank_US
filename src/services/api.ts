const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('movafi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Authentication
  loginStep1: (payload: { email: string; password?: string }) =>
    request('/auth/login-step1', { method: 'POST', body: JSON.stringify(payload) }),

  loginStep2: (payload: { user_id: string; pin: string }) =>
    request('/auth/login-step2', { method: 'POST', body: JSON.stringify(payload) }),

  register: (payload: any) =>
    request('/auth/onboarding', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request('/auth/me'),

  // Account & Banking
  getAccountDetails: (accountId?: string) =>
    request(`/account${accountId ? `?account_id=${accountId}` : ''}`),

  executeTransfer: (payload: {
    recipient_name: string;
    recipient_account: string;
    recipient_bank?: string;
    routing_number?: string;
    amount: number;
    currency?: string;
    description?: string;
    pin: string;
    transfer_rail?: string;
  }) => request('/transfers/execute', { method: 'POST', body: JSON.stringify(payload) }),

  submitDeposit: (payload: {
    payment_method: string;
    amount: number;
    currency: string;
    source_reference: string;
    proof_document_url?: string;
    sender_name?: string;
  }) => request('/deposits/declare', { method: 'POST', body: JSON.stringify(payload) }),

  submitWithdrawal: (payload: {
    amount: number;
    currency: string;
    payout_method: string;
    beneficiary_name: string;
    beneficiary_account: string;
    beneficiary_bank?: string;
    beneficiary_country?: string;
    reference?: string;
  }) => request('/withdrawals/request', { method: 'POST', body: JSON.stringify(payload) }),

  // Cards
  getCards: () => request('/cards/my-cards'),

  applyForCard: (payload: {
    tier: string;
    network?: string;
    cardholder_name?: string;
    currency?: string;
  }) => request('/cards/apply', { method: 'POST', body: JSON.stringify(payload) }),

  toggleCard: (cardId: string) =>
    request(`/cards/${cardId}/toggle`, { method: 'POST' }),

  fundCard: (cardId: string, amount: number, pin: string) =>
    request(`/cards/${cardId}/load`, {
      method: 'POST',
      body: JSON.stringify({ amount, pin })
    }),

  orderPhysicalCard: (payload: {
    card_id: string;
    street: string;
    city: string;
    country: string;
    postal_code: string;
  }) => request('/cards/order-physical', { method: 'POST', body: JSON.stringify(payload) }),

  // Financing & Loans
  getLoanRates: () => request('/financing/rates'),

  applyForLoan: (payload: {
    project_type: string;
    amount: number;
    duration_months: number;
    terms_accepted: boolean;
  }) => request('/financing/apply', { method: 'POST', body: JSON.stringify(payload) }),

  agreeLoanParameters: (loanId: string) =>
    request(`/financing/loans/${loanId}/agree-parameters`, { method: 'POST' }),

  // Notifications
  getNotifications: (category?: string) =>
    request(`/notifications${category ? `?category=${category}` : ''}`),

  markNotificationAsRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsAsRead: () =>
    request('/notifications/read-all', { method: 'POST' }),

  // Referrals
  getReferralStats: () => request('/referrals/stats'),

  sendReferralInvitation: (payload: { email: string; name?: string; message?: string }) =>
    request('/referrals/invite', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin Management Portal
  admin: {
    getAccounts: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/admin/accounts?${q.toString()}`);
    },

    getAccountDetail: (id: string) => request(`/admin/accounts/${id}`),

    updateAccount: (id: string, payload: any) =>
      request(`/admin/accounts/${id}/update`, { method: 'POST', body: JSON.stringify(payload) }),

    getTransactions: () => request('/admin/transactions'),

    approveDeposit: (requestId: string, action: 'approve' | 'reject') =>
      request(`/admin/transactions/${requestId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),

    getCards: () => request('/admin/cards'),

    updateCardStatus: (cardId: string, payload: any) =>
      request(`/admin/cards/${cardId}/status`, { method: 'POST', body: JSON.stringify(payload) }),

    getLoans: () => request('/admin/loans'),

    updateLoanStatus: (loanId: string, status: string, notes?: string) =>
      request(`/admin/loans/${loanId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, admin_notes: notes })
      }),

    releaseLoanFunds: (loanId: string) =>
      request(`/admin/loans/${loanId}/release-funds`, { method: 'POST' }),

    getRates: () => request('/admin/rates'),

    updateRate: (payload: any) =>
      request('/admin/rates/update', { method: 'POST', body: JSON.stringify(payload) }),

    getAuditLogs: () => request('/admin/audit-logs'),

    getReferrals: () => request('/admin/referrals'),

    getNotifications: (params?: { priority?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.priority) q.set('priority', params.priority);
      if (params?.status) q.set('status', params.status);
      return request(`/admin/notifications?${q.toString()}`);
    },

    broadcastNotification: (payload: {
      title: string;
      message: string;
      target: 'all' | 'specific';
      profile_id?: string;
      category?: string;
      priority?: string;
      send_email?: boolean;
      send_sms?: boolean;
    }) => request('/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(payload) })
  }
};
