import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Landmark,
  ArrowDownLeft,
  Percent,
  Mail,
  FileCode,
  Settings,
  ShieldAlert,
  UserPlus,
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  DollarSign,
  KeyRound,
  Eye,
  RefreshCw,
  Send,
  Plus,
  ArrowLeft,
  Lock,
  Building2,
  Gift,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import {
  UserProfile,
  BankAccount,
  Transaction,
  BankCard,
  LoanApplication,
  PaymentMethod,
  EmailLog,
  EmailTemplate,
  BankSettings,
  BlockedIP,
  AuditLog,
  LoanRate
} from '../types/banking';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { MovafiLogo } from './MovafiLogo';
import { AdminReferralsTab } from './AdminReferralsTab';

interface AdminPortalProps {
  currentUser: UserProfile;
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onExit }) => {
  const [activeSection, setActiveSection] = useState<
    | 'accounts'
    | 'transactions'
    | 'cards'
    | 'loans'
    | 'rates'
    | 'payment_methods'
    | 'referrals'
    | 'email_history'
    | 'email_templates'
    | 'settings'
    | 'security_ips'
    | 'team'
    | 'audit_logs'
  >('accounts');

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // -------------------------------------------------------------
  // ACCOUNTS MANAGEMENT
  // -------------------------------------------------------------
  const [accountsList, setAccountsList] = useState<{ account: BankAccount; profile: UserProfile | null }[]>([]);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('all');
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsTotal, setAccountsTotal] = useState(0);

  // Manage Banking File Modal
  const [selectedFileAccountId, setSelectedFileAccountId] = useState<string | null>(null);
  const [fileDetail, setFileDetail] = useState<{
    account: BankAccount;
    profile: UserProfile;
    transactions: Transaction[];
    cards: BankCard[];
    loans: LoanApplication[];
  } | null>(null);

  // Profile editing in modal (Requirement 9)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editResidenceCountry, setEditResidenceCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editMonthlyIncome, setEditMonthlyIncome] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; filename: string } | null>(null);

  const handleStartEditProfile = () => {
    if (!fileDetail) return;
    setEditFirstName(fileDetail.profile.first_name || '');
    setEditLastName(fileDetail.profile.last_name || '');
    setEditPhone(fileDetail.profile.phone || '');
    setEditResidenceCountry(fileDetail.profile.residence_country || '');
    setEditCity(fileDetail.profile.city || '');
    setEditOccupation(fileDetail.profile.occupation || '');
    setEditMonthlyIncome(String(fileDetail.profile.monthly_income || ''));
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.updateProfile(selectedFileAccountId, {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        residence_country: editResidenceCountry,
        city: editCity,
        occupation: editOccupation,
        monthly_income: Number(editMonthlyIncome) || 0
      });
      if (res.success) {
        notify('Informations du client mises à jour avec succès.');
        setIsEditingProfile(false);
        await openBankingFile(selectedFileAccountId);
        await loadAccounts();
      } else {
        notify(res.message, 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = (filename: string, docTitle: string) => {
    const content = `MOVAFI BANK UNITED STATES - OFFICIAL KYC VERIFIED DOSSIER\n\nDocument Title: ${docTitle}\nDocument File: ${filename}\nClient: ${fileDetail?.profile?.first_name} ${fileDetail?.profile?.last_name}\nClient ID: ${fileDetail?.account?.client_id}\nAccount: ${fileDetail?.account?.account_number}\nIBAN: ${fileDetail?.account?.iban}\nTimestamp: ${new Date().toISOString()}\nStatus: Stored in Private Encrypted Escrow Vault`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    notify(`Document ${filename} téléchargé.`);
  };

  // Credit / Debit funds in modal
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAccounts({
        search: accountsSearch,
        status: accountsStatusFilter,
        page: accountsPage,
        limit: 10
      });
      if (res.success) {
        setAccountsList(res.accounts);
        setAccountsTotal(res.total);
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'accounts') loadAccounts();
  }, [activeSection, accountsSearch, accountsStatusFilter, accountsPage]);

  const openBankingFile = async (accountId: string) => {
    setSelectedFileAccountId(accountId);
    setLoading(true);
    try {
      const res = await api.admin.getAccountDetail(accountId);
      if (res.success) {
        setFileDetail({
          account: res.account,
          profile: res.profile,
          transactions: res.transactions,
          cards: res.cards,
          loans: res.loans
        });
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedFileAccountId || !adjustAmount || !adjustReason) {
      notify('Please provide valid amount and mandatory audit justification reason.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.admin.adjustBalance(selectedFileAccountId, adjustType, Number(adjustAmount), adjustReason);
      if (res.success) {
        notify(`Balance successfully ${adjustType}ed.`);
        setAdjustAmount('');
        setAdjustReason('');
        await openBankingFile(selectedFileAccountId);
        await loadAccounts();
      } else {
        notify(res.message, 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccountStatus = async (status: string) => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.updateAccountStatus(selectedFileAccountId, status);
      if (res.success) {
        notify(`Account status updated to ${status}.`);
        await openBankingFile(selectedFileAccountId);
        await loadAccounts();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.resetPin(selectedFileAccountId);
      if (res.success) {
        notify(`PIN reset initiated. Temporary code dispatched to client: ${res.temporaryPin}`);
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.regenerateSecurityCodes(selectedFileAccountId);
      if (res.success) {
        notify('Codes de sécurité CAT et COT régénérés avec succès.');
        await openBankingFile(selectedFileAccountId);
      } else {
        notify(res.message, 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Confirm permanent deletion of this account dossier?')) return;
    setLoading(true);
    try {
      const res = await api.admin.deleteAccount(accountId);
      if (res.success) {
        notify('Account successfully deleted.');
        if (selectedFileAccountId === accountId) setSelectedFileAccountId(null);
        await loadAccounts();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // DEPOSITS & RECHARGES
  // -------------------------------------------------------------
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const loadDeposits = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getTransactions();
      if (res.success) {
        setDepositRequests(res.requests);
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositAction = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const res = await api.admin.handleDepositRequest(requestId, action);
      if (res.success) {
        notify(`Deposit request ${action}d successfully.`);
        await loadDeposits();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CARDS MANAGEMENT
  // -------------------------------------------------------------
  const [cardsList, setCardsList] = useState<any[]>([]);
  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCards();
      if (res.success) setCardsList(res.cards);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = async (cardId: string, payload: any) => {
    setLoading(true);
    try {
      const res = await api.admin.updateCard(cardId, payload);
      if (res.success) {
        notify('Card configuration updated.');
        await loadCards();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // LOANS MANAGEMENT
  // -------------------------------------------------------------
  const [loansList, setLoansList] = useState<LoanApplication[]>([]);
  const loadLoans = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getLoans();
      if (res.success) setLoansList(res.loans);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanStatus = async (loanId: string, status: string) => {
    setLoading(true);
    try {
      const res = await api.admin.updateLoanStatus(loanId, status);
      if (res.success) {
        notify(`Loan status updated to ${status}.`);
        await loadLoans();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseLoanFunds = async (loanId: string) => {
    setLoading(true);
    try {
      const res = await api.admin.releaseLoanFunds(loanId);
      if (res.success) {
        notify('Facility liquidity disbursed into client primary balance.');
        await loadLoans();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // LOAN RATES (Section 51)
  // -------------------------------------------------------------
  const [ratesList, setRatesList] = useState<LoanRate[]>([]);
  const loadRates = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getRates();
      if (res.success) setRatesList(res.rates);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async (rate: LoanRate, newPercent: number) => {
    setLoading(true);
    try {
      const res = await api.admin.updateRate({
        id: rate.id,
        annual_rate_percent: newPercent
      });
      if (res.success) {
        notify(`Rate for ${rate.category} updated to ${newPercent}%.`);
        await loadRates();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PAYMENT METHODS
  // -------------------------------------------------------------
  const [methodsList, setMethodsList] = useState<PaymentMethod[]>([]);
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPaymentMethods();
      if (res.success) setMethodsList(res.methods);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod?.name || !editingMethod?.account_info) return;
    setLoading(true);
    try {
      const res = await api.admin.savePaymentMethod(editingMethod);
      if (res.success) {
        notify('Payment method saved.');
        setEditingMethod(null);
        await loadMethods();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!window.confirm('Delete this payment method?')) return;
    setLoading(true);
    try {
      const res = await api.admin.deletePaymentMethod(id);
      if (res.success) {
        notify('Payment method deleted.');
        await loadMethods();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // EMAILS (History & Templates)
  // -------------------------------------------------------------
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [manualRecipient, setManualRecipient] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualContent, setManualContent] = useState('');

  const loadEmails = async () => {
    setLoading(true);
    try {
      const [histRes, tmplRes] = await Promise.all([
        api.admin.getEmailHistory(),
        api.admin.getEmailTemplates()
      ]);
      if (histRes.success) setEmailLogs(histRes.logs);
      if (tmplRes.success) setEmailTemplates(tmplRes.templates);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.admin.sendManualEmail({
        recipient: manualRecipient,
        subject: manualSubject,
        content: manualContent
      });
      if (res.success) {
        notify('Email dispatched through Resend delivery queue.');
        setManualRecipient('');
        setManualSubject('');
        setManualContent('');
        await loadEmails();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SETTINGS & IP SECURITY
  // -------------------------------------------------------------
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [newIp, setNewIp] = useState('');
  const [newIpReason, setNewIpReason] = useState('');

  const loadSettingsAndSecurity = async () => {
    setLoading(true);
    try {
      const [setRes, ipRes] = await Promise.all([
        api.admin.getSettings(),
        api.admin.getBlockedIps()
      ]);
      if (setRes.success) setBankSettings(setRes.settings);
      if (ipRes.success) setBlockedIps(ipRes.blocked_ips);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankSettings) return;
    setLoading(true);
    try {
      const res = await api.admin.updateSettings(bankSettings);
      if (res.success) notify('Bank corporate parameters saved.');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlockedIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp || !newIpReason) return;
    setLoading(true);
    try {
      const res = await api.admin.addBlockedIp(newIp, newIpReason);
      if (res.success) {
        notify(`IP ${newIp} blocked.`);
        setNewIp('');
        setNewIpReason('');
        await loadSettingsAndSecurity();
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAuditLogs(100);
      if (res.success) setAuditLogsList(res.logs);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load section-specific data on tab change
  useEffect(() => {
    if (activeSection === 'transactions') loadDeposits();
    if (activeSection === 'cards') loadCards();
    if (activeSection === 'loans') loadLoans();
    if (activeSection === 'rates') loadRates();
    if (activeSection === 'payment_methods') loadMethods();
    if (activeSection === 'email_history' || activeSection === 'email_templates') loadEmails();
    if (activeSection === 'settings' || activeSection === 'security_ips') loadSettingsAndSecurity();
    if (activeSection === 'audit_logs') loadAuditLogs();
  }, [activeSection]);

  const navItems = [
    { id: 'accounts', label: 'Client Accounts', icon: Users },
    { id: 'transactions', label: 'Deposits & Reconciliations', icon: ArrowDownLeft },
    { id: 'cards', label: 'Prestige Cards Logistics', icon: CreditCard },
    { id: 'loans', label: 'Loan Requests & Release', icon: Landmark },
    { id: 'rates', label: 'Loan Interest Rates', icon: Percent },
    { id: 'payment_methods', label: 'Payment Channels', icon: DollarSign },
    { id: 'referrals', label: 'Parrainages & Affiliation', icon: Gift },
    { id: 'email_history', label: 'Email History & Dispatch', icon: Mail },
    { id: 'email_templates', label: 'Email Templates', icon: FileCode },
    { id: 'settings', label: 'Identity & Bank Settings', icon: Settings },
    { id: 'security_ips', label: 'Security & IP Blocklist', icon: ShieldAlert },
    { id: 'audit_logs', label: 'Master Audit Trail', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Admin Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MovafiLogo size="sm" showText={false} onClick={onExit} />
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>MOVAFI BANK EXECUTIVE ADMINISTRATION</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                RBAC: {currentUser.admin_role?.toUpperCase() || 'ADMIN'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Authorized Signatory: {currentUser.first_name} {currentUser.last_name} ({currentUser.email})
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Client View</span>
        </button>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Admin Body (Sidebar + Content Viewport) */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-2 sm:p-4 flex flex-row md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 sm:gap-2.5 whitespace-nowrap text-left cursor-pointer shrink-0 md:shrink ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-full overflow-x-hidden">
          {/* ======================================================= */}
          {/* 1. CLIENT ACCOUNTS */}
          {/* ======================================================= */}
          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Client Accounts Ledger</h2>
                  <p className="text-xs text-slate-400">
                    Total registered portfolios: {accountsTotal}
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={accountsSearch}
                      onChange={(e) => setAccountsSearch(e.target.value)}
                      placeholder="Search by name, email, IBAN..."
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 w-64"
                    />
                  </div>

                  <select
                    value={accountsStatusFilter}
                    onChange={(e) => setAccountsStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Account / IBAN</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {accountsList.map(({ account, profile }) => (
                      <tr key={account.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'}
                          </div>
                          <div className="text-[11px] text-slate-400">{profile?.email}</div>
                          <div className="text-[10px] text-slate-500">ID: {account.client_id}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-200">{account.account_number}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{account.iban}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(account.balance, account.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              account.account_status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : account.account_status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {account.account_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => openBankingFile(account.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                          >
                            Manage File
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manage Banking File Modal (Section 44, 45) */}
              {selectedFileAccountId && fileDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 flex flex-col overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Banking Dossier: {fileDetail.profile.first_name} {fileDetail.profile.last_name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {fileDetail.account.client_id}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Account #{fileDetail.account.account_number} · IBAN: {fileDetail.account.iban}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFileAccountId(null)}
                        className="p-2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Status & Security Actions (Requirement 9: Approve, Reject, Hold, Activate, Deactivate) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1.5 font-semibold">
                          Account Status Management ({fileDetail.account.account_status.toUpperCase()}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleUpdateAccountStatus('active')}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              fileDetail.account.account_status === 'active'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                            }`}
                            title="Approuver et activer le compte"
                          >
                            Approve / Activate
                          </button>
                          <button
                            onClick={() => handleUpdateAccountStatus('pending')}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              fileDetail.account.account_status === 'pending'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-800 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30'
                            }`}
                            title="Mettre en attente d'examen"
                          >
                            Hold / Pending
                          </button>
                          <button
                            onClick={() => handleUpdateAccountStatus('inactive')}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              fileDetail.account.account_status === 'inactive'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                            title="Désactiver le compte"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleUpdateAccountStatus('rejected')}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              fileDetail.account.account_status === 'rejected'
                                ? 'bg-rose-700 text-white'
                                : 'bg-slate-800 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30'
                            }`}
                            title="Rejeter le dossier"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateAccountStatus('suspended')}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              fileDetail.account.account_status === 'suspended'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-800 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30'
                            }`}
                            title="Suspendre pour enquête"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1.5 font-semibold">Security Credentials (PIN):</span>
                        <button
                          onClick={handleResetPin}
                          className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-semibold cursor-pointer flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Trigger Temporary PIN Reset</span>
                        </button>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1 font-semibold">Reconciled Balance:</span>
                        <div className="text-lg font-mono font-bold text-amber-400">
                          {formatCurrency(fileDetail.account.balance, fileDetail.account.currency)}
                        </div>
                      </div>
                    </div>

                    {/* CAT & COT Internal Security Codes (Requirement 10) */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Codes de Sécurité Internes (CAT & COT)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Codes de sécurité internes au workflow du prototype Movafi Bank. Ne sont jamais exposés publiquement.
                          </p>
                        </div>
                        <button
                          onClick={handleRegenerateCodes}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Régénérer CAT / COT</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Code d'Autorisation de Transfert (CAT)</span>
                          <div className="text-base font-mono font-bold text-amber-300 mt-1 select-all tracking-wider">
                            {fileDetail.account.cat_code || 'CAT-NON-GÉNÉRÉ'}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">Requis lors de l'étape 2 du transfert après activation</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Code d'Opération de Trésorerie (COT)</span>
                          <div className="text-base font-mono font-bold text-amber-300 mt-1 select-all tracking-wider">
                            {fileDetail.account.cot_code || 'COT-NON-GÉNÉRÉ'}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">Requis lors de l'étape 3 avant transmission au gestionnaire</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Profile Details & Modification (Requirement 9) */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                          Client Profile & Authorized Information
                        </h4>
                        {!isEditingProfile ? (
                          <button
                            onClick={handleStartEditProfile}
                            className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                          >
                            Modifier les informations
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsEditingProfile(false)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleSaveProfile}
                              disabled={loading}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Enregistrer
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditingProfile ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Nom & Prénom</span>
                            <span className="font-semibold text-white">{fileDetail.profile.first_name} {fileDetail.profile.last_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">E-mail</span>
                            <span className="font-semibold text-slate-300">{fileDetail.profile.email}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Téléphone</span>
                            <span className="font-semibold text-slate-300">{fileDetail.profile.phone || 'Non renseigné'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Pays & Ville</span>
                            <span className="font-semibold text-slate-300">{fileDetail.profile.residence_country} ({fileDetail.profile.city})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Structure de Compte</span>
                            <span className="font-semibold text-slate-300">{fileDetail.profile.account_type || 'Personal'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Profession</span>
                            <span className="font-semibold text-slate-300">{fileDetail.profile.occupation || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Entrées Mensuelles</span>
                            <span className="font-semibold font-mono text-amber-400">
                              {fileDetail.profile.income_bracket || formatCurrency(fileDetail.profile.monthly_income || 0, fileDetail.account.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Devise Principale</span>
                            <span className="font-semibold font-mono text-amber-400">{fileDetail.account.currency}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Prénom</label>
                            <input
                              type="text"
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Nom</label>
                            <input
                              type="text"
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Téléphone</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Pays de Résidence</label>
                            <input
                              type="text"
                              value={editResidenceCountry}
                              onChange={(e) => setEditResidenceCountry(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Ville</label>
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Profession</label>
                            <input
                              type="text"
                              value={editOccupation}
                              onChange={(e) => setEditOccupation(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Revenu Mensuel</label>
                            <input
                              type="number"
                              value={editMonthlyIncome}
                              onChange={(e) => setEditMonthlyIncome(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Financial Operation: Credit or Debit with Mandatory Audit Reason (Section 44) */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                        Execute Ledger Adjustment (Audit Enforced)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Adjustment Type</label>
                          <select
                            value={adjustType}
                            onChange={(e) => setAdjustType(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          >
                            <option value="credit">Credit Balance (+)</option>
                            <option value="debit">Debit Balance (-)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Amount ({fileDetail.account.currency})
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder="10,000.00"
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Mandatory Justification / Reason
                          </label>
                          <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="Reconciliation of wire escrow #984021"
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleAdjustBalance}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                        >
                          Submit {adjustType.toUpperCase()} Adjustment
                        </button>
                      </div>
                    </div>

                    {/* KYC Documents Preview & Download (Requirements 6 & 9) */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-300">
                          Compliance & KYC Documents (Espace Privé Sécurisé)
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Chiffrement AES-256</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* ID Document */}
                        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">1. Pièce d'identité / Passeport</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">DÉPOSÉ</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                              {fileDetail.profile.id_document_name || 'Passport_Government_ID.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => setPreviewDoc({
                                title: 'Pièce d\'identité officielle / Passeport',
                                filename: fileDetail.profile.id_document_name || 'Passport_Government_ID.pdf'
                              })}
                              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer text-center"
                            >
                              Consulter
                            </button>
                            <button
                              onClick={() => handleDownloadDoc(
                                fileDetail.profile.id_document_name || 'Passport_Government_ID.pdf',
                                'Government ID or Passport'
                              )}
                              className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer text-center"
                            >
                              Télécharger
                            </button>
                          </div>
                        </div>

                        {/* Proof of Address */}
                        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">2. Justificatif de Domicile</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">DÉPOSÉ</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                              {fileDetail.profile.proof_of_address_name || 'Proof_of_Address_Utility_Bill.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => setPreviewDoc({
                                title: 'Justificatif de domicile (Facture d\'énergie / Résidence)',
                                filename: fileDetail.profile.proof_of_address_name || 'Proof_of_Address_Utility_Bill.pdf'
                              })}
                              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer text-center"
                            >
                              Consulter
                            </button>
                            <button
                              onClick={() => handleDownloadDoc(
                                fileDetail.profile.proof_of_address_name || 'Proof_of_Address_Utility_Bill.pdf',
                                'Proof of Address / Utility Bill'
                              )}
                              className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer text-center"
                            >
                              Télécharger
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document Preview Modal */}
                    {previewDoc && (
                      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                              <h4 className="font-bold text-sm text-white">{previewDoc.title}</h4>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{previewDoc.filename}</p>
                            </div>
                            <button
                              onClick={() => setPreviewDoc(null)}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-xs font-semibold text-white">Document KYC Vérifié & Chiffré</div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Ce document est conservé dans le coffre-fort de conformité numérique de Movafi Bank avec horodatage cryptographique et accès restreint aux seuls auditeurs autorisés.
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setPreviewDoc(null)}
                              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                            >
                              Fermer
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadDoc(previewDoc.filename, previewDoc.title);
                                setPreviewDoc(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Télécharger le document
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. DEPOSITS & RECONCILIATIONS (Section 48) */}
          {/* ======================================================= */}
          {activeSection === 'transactions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Deposit Inflows & Wire Reconciliations</h2>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {depositRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 text-slate-400">{formatDateTime(req.created_at)}</td>
                        <td className="py-3 px-4 font-semibold text-white">{req.client_name || req.sender_name}</td>
                        <td className="py-3 px-4 text-slate-300">{req.payment_method}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{req.source_reference}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(req.amount, req.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleDepositAction(req.id, 'approve')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Approve & Credit
                              </button>
                              <button
                                onClick={() => handleDepositAction(req.id, 'reject')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. PRESTIGE CARDS LOGISTICS (Section 49) */}
          {/* ======================================================= */}
          {activeSection === 'cards' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Prestige Cards & Logistics</h2>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Cardholder</th>
                      <th className="py-3 px-4">Tier & Network</th>
                      <th className="py-3 px-4">Masked Number</th>
                      <th className="py-3 px-4 text-right">Card Balance</th>
                      <th className="py-3 px-4">Balance Load Allowed</th>
                      <th className="py-3 px-4">Physical Shipping Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {cardsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.cardholder_name}</div>
                          <div className="text-[10px] text-slate-400">{c.client_email}</div>
                        </td>
                        <td className="py-3 px-4 uppercase text-amber-400 font-semibold">
                          {c.tier} {c.network}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{c.card_number_masked}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ${c.balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              handleUpdateCard(c.id, { allow_balance_transfer: !c.allow_balance_transfer })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                              c.allow_balance_transfer
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {c.allow_balance_transfer ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {c.delivery ? (
                            <select
                              value={c.delivery.current_stage}
                              onChange={(e) =>
                                handleUpdateCard(c.id, { delivery_stage: e.target.value })
                              }
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
                            >
                              <option value="request_received">1. Request Received</option>
                              <option value="processing">2. Processing</option>
                              <option value="preparation">3. Preparation</option>
                              <option value="transit">4. Transit</option>
                              <option value="customs">5. Customs</option>
                              <option value="delivered">6. Delivered</option>
                            </select>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Virtual Only</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              handleUpdateCard(c.id, { status: c.status === 'active' ? 'blocked' : 'active' })
                            }
                            className="px-2 py-1 rounded border border-slate-700 text-[10px] font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                          >
                            {c.status === 'active' ? 'Block Card' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. LOAN REQUESTS & RELEASE (Section 50) */}
          {/* ======================================================= */}
          {activeSection === 'loans' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Credit Facilities & Disbursement</h2>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4 text-right">Facility Amount</th>
                      <th className="py-3 px-4">Rate</th>
                      <th className="py-3 px-4">Term</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loansList.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{loan.borrower_name}</div>
                          <div className="text-[10px] text-slate-400">{loan.borrower_email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{loan.project_type}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(loan.amount, loan.currency)}
                        </td>
                        <td className="py-3 px-4 font-mono">{loan.rate_percent}%</td>
                        <td className="py-3 px-4">{loan.duration_months} Mos</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400">
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleLoanStatus(loan.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLoanStatus(loan.id, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <button
                              onClick={() => handleReleaseLoanFunds(loan.id)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                            >
                              Release Funds
                            </button>
                          )}
                          {loan.status === 'funds_released' && (
                            <span className="text-[11px] text-emerald-400 font-semibold">Disbursed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 5. LOAN RATES MANAGEMENT (Section 51) */}
          {/* ======================================================= */}
          {activeSection === 'rates' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">Dynamic Loan Rates Matrix</h2>
                <p className="text-xs text-slate-400">
                  Modifying category rates updates the core database. Existing applications retain their historical agreed rate.
                </p>
              </div>

              <div className="space-y-3">
                {ratesList.map((rate) => (
                  <div
                    key={rate.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{rate.category}</div>
                      <div className="text-[11px] text-slate-400">
                        Term: {rate.min_duration_months}–{rate.max_duration_months} Mos · Cap: ${rate.max_amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={0.05}
                          defaultValue={rate.annual_rate_percent}
                          id={`rate_input_${rate.id}`}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white"
                        />
                        <span className="text-xs font-semibold text-slate-400">% p.a.</span>
                      </div>

                      <button
                        onClick={() => {
                          const input = document.getElementById(`rate_input_${rate.id}`) as HTMLInputElement;
                          if (input) handleSaveRate(rate, parseFloat(input.value));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Update Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 6. PAYMENT METHODS (Section 52) */}
          {/* ======================================================= */}
          {activeSection === 'payment_methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Deposit Channels & Wire Routing</h2>
                  <p className="text-xs text-slate-400">
                    Configure institutional clearing instructions visible to clients.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingMethod({
                      name: '',
                      category: 'Bank Transfer',
                      description: '',
                      account_info: '',
                      instructions: '',
                      is_active: true
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payment Channel</span>
                </button>
              </div>

              {/* Editing Form */}
              {editingMethod && (
                <form
                  onSubmit={handleSaveMethod}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 max-w-xl"
                >
                  <h4 className="font-bold text-sm text-white">Save Deposit Channel</h4>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Channel Name</label>
                    <input
                      type="text"
                      required
                      value={editingMethod.name || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                    <select
                      value={editingMethod.category || 'Bank Transfer'}
                      onChange={(e) => setEditingMethod({ ...editingMethod, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Fintech">Fintech Wire</option>
                      <option value="Digital Assets">Digital Assets / Crypto Rails</option>
                      <option value="Digital Wallet">Digital Wallet</option>
                      <option value="Cash / Agency">Cash / Agency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Routing & Account Details</label>
                    <textarea
                      required
                      rows={2}
                      value={editingMethod.account_info || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, account_info: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Save Channel
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMethod(null)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {methodsList.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-sm">{m.name}</div>
                      <button
                        onClick={() => handleDeleteMethod(m.id)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">{m.description}</div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
                      {m.account_info}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 7. EMAIL HISTORY & MANUAL DISPATCH (Sections 53 & 54) */}
          {/* ======================================================= */}
          {activeSection === 'email_history' && (
            <div className="space-y-8">
              {/* Manual Send Box */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 max-w-2xl">
                <h3 className="font-bold text-sm text-white">Manual Executive Email Dispatch (Resend)</h3>
                <form onSubmit={handleSendManualEmail} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Recipient Email</label>
                    <input
                      type="email"
                      required
                      value={manualRecipient}
                      onChange={(e) => setManualRecipient(e.target.value)}
                      placeholder="client@domain.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      placeholder="Official Notice: Portfolio Escrow Confirmation"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Message Content</label>
                    <textarea
                      required
                      rows={3}
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      placeholder="Dear Client, please find attached your ledger confirmation..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email via Resend</span>
                  </button>
                </form>
              </div>

              {/* Email Logs Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">Dispatched Communications Audit Log</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Recipient</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Resend ID</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {emailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 text-slate-400">{formatDateTime(log.created_at)}</td>
                          <td className="py-2.5 px-4 text-slate-200">{log.recipient_email}</td>
                          <td className="py-2.5 px-4 font-medium text-white">{log.subject}</td>
                          <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">{log.resend_message_id}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 uppercase">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* PARRAINAGES / REFERRALS PROGRAM (Section 18, 19) */}
          {/* ======================================================= */}
          {activeSection === 'referrals' && (
            <AdminReferralsTab notify={notify} />
          )}

          {/* ======================================================= */}
          {/* 8. EMAIL TEMPLATES (Section 55) */}
          {/* ======================================================= */}
          {activeSection === 'email_templates' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">Configurable Email Templates</h2>
                <p className="text-xs text-slate-400">
                  Dynamic variables available: {`{{first_name}}, {{last_name}}, {{account_id}}, {{amount}}, {{currency}}, {{reference}}, {{iban}}`}
                </p>
              </div>

              <div className="space-y-4">
                {emailTemplates.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t.template_key}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        defaultValue={t.subject}
                        id={`tmpl_sub_${t.id}`}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Body Text</label>
                      <textarea
                        rows={3}
                        defaultValue={t.body_text}
                        id={`tmpl_body_${t.id}`}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        const sub = (document.getElementById(`tmpl_sub_${t.id}`) as HTMLInputElement)?.value;
                        const body = (document.getElementById(`tmpl_body_${t.id}`) as HTMLTextAreaElement)?.value;
                        await api.admin.saveEmailTemplate({
                          id: t.id,
                          template_key: t.template_key,
                          name: t.name,
                          subject: sub,
                          body_text: body
                        });
                        notify(`Template ${t.name} saved.`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 9. IDENTITY & BANK SETTINGS (Section 57) */}
          {/* ======================================================= */}
          {activeSection === 'settings' && bankSettings && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Bank Institutional Settings</h2>
                <p className="text-xs text-slate-400">
                  Global parameters stored in database bank_settings.
                </p>
              </div>

              <form onSubmit={handleSaveBankSettings} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Official Bank Name</label>
                  <input
                    type="text"
                    value={bankSettings.bank_name}
                    onChange={(e) => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Operating City</label>
                    <input
                      type="text"
                      value={bankSettings.city}
                      onChange={(e) => setBankSettings({ ...bankSettings, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Representation Country</label>
                    <input
                      type="text"
                      value={bankSettings.country}
                      onChange={(e) => setBankSettings({ ...bankSettings, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={bankSettings.support_email}
                      onChange={(e) => setBankSettings({ ...bankSettings, support_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Support Telephone</label>
                    <input
                      type="text"
                      value={bankSettings.support_phone}
                      onChange={(e) => setBankSettings({ ...bankSettings, support_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Institutional Regulatory & Compliance Disclaimer Notice</label>
                  <textarea
                    rows={3}
                    value={bankSettings.disclaimer_notice}
                    onChange={(e) => setBankSettings({ ...bankSettings, disclaimer_notice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                >
                  Save Institutional Parameters
                </button>
              </form>
            </div>
          )}

          {/* ======================================================= */}
          {/* 10. SECURITY & BLOCKED IPS (Section 56) */}
          {/* ======================================================= */}
          {activeSection === 'security_ips' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">Security & Gateway Blocklist</h2>
                <p className="text-xs text-slate-400">
                  Manage blocked network IPs and brute-force mitigation logs.
                </p>
              </div>

              {/* Add IP form */}
              <form onSubmit={handleAddBlockedIp} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-400 mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="198.51.100.44"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] text-slate-400 mb-1">Reason / Justification</label>
                  <input
                    type="text"
                    required
                    value={newIpReason}
                    onChange={(e) => setNewIpReason(e.target.value)}
                    placeholder="Suspicious credential probe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Block IP
                </button>
              </form>

              {/* Blocked IPs Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-2.5 px-4">IP Address</th>
                      <th className="py-2.5 px-4">Reason</th>
                      <th className="py-2.5 px-4">Blocked Date</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {blockedIps.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5 px-4 font-mono text-rose-400">{b.ip_address}</td>
                        <td className="py-2.5 px-4 text-slate-300">{b.reason}</td>
                        <td className="py-2.5 px-4 text-slate-500">{formatDateTime(b.created_at)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={async () => {
                              await api.admin.deleteBlockedIp(b.id);
                              notify('IP unblocked.');
                              await loadSettingsAndSecurity();
                            }}
                            className="text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 11. MASTER AUDIT LOG (Section 59) */}
          {/* ======================================================= */}
          {activeSection === 'audit_logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Master Immutable Audit Trail</h2>
                  <p className="text-xs text-slate-400">
                    Chronological audit records of all administrative actions and balance movements.
                  </p>
                </div>
                <button
                  onClick={loadAuditLogs}
                  className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Operator</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Target Resource</th>
                      <th className="py-2.5 px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {auditLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 text-slate-400">{formatDateTime(log.created_at)}</td>
                        <td className="py-2.5 px-4 text-slate-200">{log.admin_email}</td>
                        <td className="py-2.5 px-4 font-bold text-amber-400">{log.action}</td>
                        <td className="py-2.5 px-4 text-slate-300">{log.target_resource}</td>
                        <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                          {JSON.stringify(log.metadata || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
