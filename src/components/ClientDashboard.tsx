import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Landmark,
  Shield,
  Clock,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  Truck,
  FileText,
  Send,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Printer,
  Headphones,
  Sliders,
  DollarSign,
  Gift
} from 'lucide-react';
import {
  UserProfile,
  BankAccount,
  Transaction,
  BankCard,
  LoanApplication,
  PaymentMethod,
  NotificationItem,
  SupportedLanguage,
  SupportedCurrency,
  BankSettings,
  LoanRate,
  DeliveryStage
} from '../types/banking';
import { api } from '../services/api';
import { formatCurrency, formatDateTime, calculateAmortization, AmortizationRow } from '../utils/formatters';
import { generateTransactionReceiptPdf, generateAmortizationPdf, generateLoanTermsPdf } from '../utils/pdfGenerator';
import { translations } from '../i18n/translations';
import { ReferralSection } from './ReferralSection';

interface ClientDashboardProps {
  user: UserProfile;
  initialAccount: BankAccount;
  currentLang: SupportedLanguage;
  onLogout: () => void;
  settings?: BankSettings;
  initialTab?: 'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals';
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  initialAccount,
  currentLang,
  onLogout,
  settings,
  initialTab
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals'>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Core Data States
  const [account, setAccount] = useState<BankAccount>(initialAccount);
  const [allAccounts, setAllAccounts] = useState<BankAccount[]>([initialAccount]);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccCurrency, setNewAccCurrency] = useState<SupportedCurrency>('EUR');
  const [newAccType, setNewAccType] = useState('Personal');
  const [showRibModal, setShowRibModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [rates, setRates] = useState<LoanRate[]>([]);
  const [rechargeMethods, setRechargeMethods] = useState<PaymentMethod[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all user ledger data
  const refreshData = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        if (res.accounts && res.accounts.length > 0) {
          setAllAccounts(res.accounts);
          setAccount((prev) => res.accounts?.find((a) => a.id === prev?.id) || res.accounts![0]);
        } else if (res.account) {
          setAccount(res.account);
          setAllAccounts([res.account]);
        }
        if (res.cards) setCards(res.cards);
        if (res.transactions) setTransactions(res.transactions);
        if (res.loans) setLoans(res.loans);
        if (res.notifications) setNotifications(res.notifications);
      }
      const ratesRes = await api.getLoanRates();
      if (ratesRes.success) setRates(ratesRes.rates);

      const methodsRes = await api.getRechargeMethods();
      if (methodsRes.success) setRechargeMethods(methodsRes.payment_methods);
    } catch (e) {
      console.error('Failed refreshing portal data:', e);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createSubAccount({ currency: newAccCurrency, account_type: newAccType });
      if (res.success && res.account) {
        setAllAccounts((prev) => [...prev, res.account!]);
        setAccount(res.account);
        setShowNewAccountModal(false);
        flash(`Nouveau compte ${newAccCurrency} ouvert avec succès !`);
        refreshData();
      } else {
        flash(res.message || 'Erreur lors de la création du compte.', 'error');
      }
    } catch (err: any) {
      flash(err.message || 'Erreur de connexion.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Flash message helper
  const flash = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  // -------------------------------------------------------------
  // TRANSFER LOGIC
  // -------------------------------------------------------------
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAccount, setTransferAccount] = useState('');
  const [transferBank, setTransferBank] = useState('');
  const [transferCategory, setTransferCategory] = useState('Bank Transfer');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [showTransferPinModal, setShowTransferPinModal] = useState(false);

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (account.account_status !== 'active') {
      flash('Account inactive — please contact customer service.', 'error');
      return;
    }
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      flash('Please specify a valid transfer amount.', 'error');
      return;
    }
    if (account.balance < amt) {
      flash('Insufficient available balance.', 'error');
      return;
    }
    if (!transferPin) setTransferPin('123456');
    setShowTransferPinModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (transferPin.length !== 6) {
      flash('Please enter your 6-digit transaction PIN.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.executeTransfer({
        recipient_name: transferRecipient,
        recipient_account: transferAccount,
        recipient_bank: transferBank,
        category: transferCategory,
        amount: Number(transferAmount),
        currency: account.currency,
        reference: transferRef,
        description: transferDesc,
        pin: transferPin
      });

      if (res.success && res.transaction) {
        setShowTransferPinModal(false);
        setTransferPin('');
        setTransferAmount('');
        setTransferRecipient('');
        setTransferAccount('');
        setTransferDesc('');
        flash(`Transfer of ${account.currency} ${res.transaction.amount.toLocaleString()} executed successfully.`);
        await refreshData();
      } else {
        flash(res.message || 'Transfer failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Transfer execution failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // RECHARGE LOGIC
  // -------------------------------------------------------------
  const [rechargeMethod, setRechargeMethod] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeSender, setRechargeSender] = useState(`${user.first_name} ${user.last_name}`);
  const [rechargeRef, setRechargeRef] = useState('');

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(rechargeAmount);
    if (!amt || amt <= 0) {
      flash('Please provide a valid deposit amount.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitRecharge({
        amount: amt,
        currency: account.currency,
        payment_method: rechargeMethod || (rechargeMethods[0]?.name || 'Fedwire Domestic Direct'),
        sender_name: rechargeSender,
        source_reference: rechargeRef || `DEP-REF-${Date.now().toString(36).toUpperCase()}`
      });

      if (res.success) {
        flash(t.depositRequestSubmitted, 'success');
        setRechargeAmount('');
        setRechargeRef('');
        await refreshData();
      } else {
        flash(res.message || 'Deposit notification failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Submission failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // WITHDRAWAL LOGIC
  // -------------------------------------------------------------
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState(account.currency);
  const [withdrawRail, setWithdrawRail] = useState('SEPA / International Wire (IBAN/BIC)');
  const [withdrawBeneficiaryName, setWithdrawBeneficiaryName] = useState(`${user.first_name} ${user.last_name}`);
  const [withdrawBeneficiaryAccount, setWithdrawBeneficiaryAccount] = useState('');
  const [withdrawBeneficiaryBank, setWithdrawBeneficiaryBank] = useState('');
  const [withdrawBeneficiaryCountry, setWithdrawBeneficiaryCountry] = useState(user.residence_country || 'United States');
  const [withdrawRef, setWithdrawRef] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [showWithdrawPinModal, setShowWithdrawPinModal] = useState(false);

  const handleInitiateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (account.account_status !== 'active') {
      flash('Account pending compliance review or inactive — withdrawal operations restricted.', 'error');
      return;
    }
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      flash('Please enter a valid positive withdrawal amount.', 'error');
      return;
    }
    if (amt > account.balance) {
      flash(`Insufficient balance. Maximum available: ${formatCurrency(account.balance, account.currency)}`, 'error');
      return;
    }
    if (!withdrawBeneficiaryName.trim() || !withdrawBeneficiaryAccount.trim()) {
      flash('Beneficiary full name and account/IBAN details are mandatory.', 'error');
      return;
    }
    if (!withdrawPin) setWithdrawPin('123456');
    setShowWithdrawPinModal(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (withdrawPin.length !== 6) {
      flash('Please enter your 6-digit transaction PIN.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitWithdrawal({
        amount: Number(withdrawAmount),
        currency: withdrawCurrency || account.currency,
        payout_method: withdrawRail,
        beneficiary_name: withdrawBeneficiaryName,
        beneficiary_account: withdrawBeneficiaryAccount,
        beneficiary_bank: withdrawBeneficiaryBank,
        beneficiary_country: withdrawBeneficiaryCountry,
        reference: withdrawRef || undefined,
        description: `Withdrawal via ${withdrawRail}`,
        pin: withdrawPin
      });
      if (res.success) {
        flash(res.message || 'Withdrawal request recorded in ledger. Awaiting treasury clearance.', 'success');
        setShowWithdrawPinModal(false);
        setWithdrawPin('');
        setWithdrawAmount('');
        setWithdrawBeneficiaryAccount('');
        setWithdrawBeneficiaryBank('');
        setWithdrawRef('');
        await refreshData();
      } else {
        flash(res.message || 'Withdrawal submission failed.', 'error');
      }
    } catch (err: any) {
      flash(err.message || 'System error processing withdrawal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CARDS LOGIC
  // -------------------------------------------------------------
  const [newCardNetwork, setNewCardNetwork] = useState<'visa' | 'mastercard'>('visa');
  const [newCardTier, setNewCardTier] = useState<'standard' | 'gold' | 'platinum'>('gold');
  const [revealedCardNumbers, setRevealedCardNumbers] = useState<Record<string, boolean>>({});
  const [revealedCardCvc, setRevealedCardCvc] = useState<Record<string, boolean>>({});

  // Transfer from Balance to Card Modal
  const [cardFundingId, setCardFundingId] = useState<string | null>(null);
  const [cardFundingAmount, setCardFundingAmount] = useState('');
  const [cardFundingPin, setCardFundingPin] = useState('');

  // Physical card delivery order form
  const [orderingPhysicalForCard, setOrderingPhysicalForCard] = useState<string | null>(null);
  const [physStreet, setPhysStreet] = useState('');
  const [physCity, setPhysCity] = useState(user.city || 'New York');
  const [physPostal, setPhysPostal] = useState('10001');
  const [physCountry, setPhysCountry] = useState(user.residence_country || 'United States');
  const [physPhone, setPhysPhone] = useState(user.phone || '+1 (555) 000-0000');

  const handleRequestNewCard = async () => {
    setLoading(true);
    try {
      const res = await api.requestCard({
        cardholder_name: `${user.first_name} ${user.last_name}`,
        network: newCardNetwork,
        tier: newCardTier
      });
      if (res.success) {
        flash(`Bespoke ${newCardTier.toUpperCase()} card issued.`);
        await refreshData();
      } else {
        flash(res.message || 'Card generation failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Error creating card.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardFundingSubmit = async () => {
    if (!cardFundingId || !cardFundingAmount || cardFundingPin.length !== 6) {
      flash('Please enter amount and 6-digit authorization PIN.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.transferToCard({
        card_id: cardFundingId,
        amount: Number(cardFundingAmount),
        pin: cardFundingPin
      });
      if (res.success) {
        flash('Card balance topped up successfully.');
        setCardFundingId(null);
        setCardFundingAmount('');
        setCardFundingPin('');
        await refreshData();
      } else {
        flash(res.message || 'Transfer to card failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Funding error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPhysicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingPhysicalForCard || !physStreet) {
      flash('Please provide complete shipping address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.orderPhysicalCard({
        card_id: orderingPhysicalForCard,
        recipient_full_name: `${user.first_name} ${user.last_name}`,
        street_address: physStreet,
        city: physCity,
        postal_code: physPostal,
        country: physCountry,
        phone: physPhone
      });

      if (res.success) {
        flash('Bespoke metal card fabrication initiated. Tracking dispatched.');
        setOrderingPhysicalForCard(null);
        await refreshData();
      } else {
        flash(res.message || 'Order failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Card logistics order failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // FINANCING & LOANS LOGIC
  // -------------------------------------------------------------
  const [loanProject, setLoanProject] = useState('Real Estate');
  const [loanAmount, setLoanAmount] = useState(250000);
  const [loanDuration, setLoanDuration] = useState(120);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Active rate for selected project
  const currentLoanRate =
    rates.find((r) => r.category.toLowerCase() === loanProject.toLowerCase())?.annual_rate_percent || 3.0;

  const amortizationCalculation = calculateAmortization(loanAmount, currentLoanRate, loanDuration);

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      flash(t.acceptTermsFirst, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.applyForLoan({
        project_type: loanProject,
        amount: loanAmount,
        duration_months: loanDuration,
        terms_accepted: true
      });

      if (res.success) {
        flash('Financing application submitted for committee review.');
        await refreshData();
      } else {
        flash(res.message || 'Loan submission failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Submission failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeParameters = async (loanId: string) => {
    setLoading(true);
    try {
      const res = await api.agreeCreditParameters(loanId);
      if (res.success) {
        flash('Credit parameters electronically accepted.');
        await refreshData();
      }
    } catch (e: any) {
      flash(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PROFILE & PREFERENCES
  // -------------------------------------------------------------
  const [prefCurrency, setPrefCurrency] = useState<SupportedCurrency>(user.preferred_currency);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateProfile({
        preferred_currency: prefCurrency
      });
      if (res.success) {
        flash('Preferences saved.');
        await refreshData();
      }
    } catch (e: any) {
      flash(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 6 || newPinInput !== confirmNewPinInput) {
      flash('New PIN must be 6 digits and match confirmation.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.changePin(currentPinInput, newPinInput);
      if (res.success) {
        flash('Security PIN updated successfully.');
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmNewPinInput('');
      } else {
        flash(res.message || 'PIN change failed.', 'error');
      }
    } catch (e: any) {
      flash(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Total credits and debits calculation
  const totalCredits = transactions
    .filter((t) => t.type === 'deposit' || t.type === 'credit' || t.type === 'loan_disbursement')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'transfer' || t.type === 'debit' || t.type === 'card_funding')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {t.active}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            {t.pending}
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            {t.suspended}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
            {t.inactive}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 md:pb-16 w-full max-w-full overflow-x-hidden">
      {/* Top Banner Alert / Status */}
      {message && (
        <div
          className={`sticky top-18 z-30 px-6 py-3 text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            message.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Client Header Kicker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.greeting} {user.first_name} {user.last_name}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {currentTime.toLocaleDateString(
                  currentLang === 'fr' ? 'fr-FR' : currentLang === 'es' ? 'es-ES' : currentLang === 'ar' ? 'ar-SA' : 'en-US',
                  {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }
                )}
              </span>
              <span>·</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`mailto:${settings?.support_email || 'concierge@movafibank.com'}?subject=Private%20Client%20Request%20(${account.client_id})`}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.customerService}</span>
            </a>

            <button
              onClick={refreshData}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh ledger state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <div className="hidden md:flex items-center gap-2 pt-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard & Ledger', icon: Wallet },
            { id: 'transfer', label: 'Wire Transfer', icon: ArrowUpRight },
            { id: 'recharge', label: 'Account Deposit', icon: ArrowDownLeft },
            { id: 'withdraw', label: t.menuWithdraw || 'Withdrawal', icon: Download },
            { id: 'cards', label: 'Prestige Cards', icon: CreditCard },
            { id: 'financing', label: 'Structured Credit', icon: Landmark },
            { id: 'referrals', label: t.navReferrals || 'Parrainage', icon: Gift },
            { id: 'profile', label: 'Profile & Security', icon: Shield }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Viewport */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & LEDGER */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Account Switcher & Management Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
                  Mes Comptes :
                </span>
                {allAccounts.map((acc) => {
                  const isSelected = acc.id === account.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setAccount(acc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-mono">{acc.currency}</span>
                      <span className="text-[11px] opacity-80">••• {acc.account_number.slice(-4)}</span>
                      <span className="font-mono text-[11px]">{formatCurrency(acc.balance, acc.currency)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRibModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>RIB / IBAN</span>
                </button>

                <button
                  onClick={() => setShowNewAccountModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nouveau Compte</span>
                </button>
              </div>
            </div>

            {/* Balance Card (Section 18) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      {t.availableBalance}
                    </span>
                    <button
                      onClick={() => setHideBalance(!hideBalance)}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={hideBalance ? t.showBalance : t.hideBalance}
                    >
                      {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    {renderStatusBadge(account.account_status)}
                  </div>

                  <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono tabular-nums tracking-tight">
                    {hideBalance ? '••••••••••' : formatCurrency(account.balance, account.currency)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-300">
                    <div>
                      <div className="text-slate-400 text-[11px]">{t.accountNumber}</div>
                      <div className="font-mono font-bold mt-0.5">{account.account_number}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">{t.iban}</div>
                      <div className="font-mono font-bold mt-0.5 text-[11px] break-all">{account.iban}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">{t.bicSwift}</div>
                      <div className="font-mono font-bold mt-0.5">{account.bic_swift}</div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap sm:flex-col gap-3 shrink-0">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Execute Transfer</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recharge')}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Deposit Liquidity</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.menuWithdraw || 'Withdrawal'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{t.navReferrals || 'Parrainage'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Analytics & Statistics (Section 19) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 uppercase">{t.creditsTotal}</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {hideBalance ? '••••••' : formatCurrency(totalCredits, account.currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Total reconciled liquidity inflows</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 uppercase">{t.debitsTotal}</div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                  {hideBalance ? '••••••' : formatCurrency(totalDebits, account.currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Disbursed transfers and card top-ups</div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 uppercase">{t.movementCount}</div>
                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  {transactions.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Recorded ledger events in this cycle</div>
              </div>
            </div>

            {/* Recent Transactions Table (Section 24) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {t.recentTransactions}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time transactional ledger events with downloadable PDF audit receipts.
                  </p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {t.noTransactions}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === 'credit' || tx.type === 'deposit' || tx.type === 'loan_disbursement';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                              {formatDateTime(tx.created_at)}
                            </td>
                            <td className="py-3.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                              {tx.reference}
                            </td>
                            <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                              {tx.category}
                            </td>
                            <td className="py-3.5 px-3 max-w-xs truncate text-slate-800 dark:text-slate-200 font-medium">
                              {tx.description}
                            </td>
                            <td className={`py-3.5 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                              isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                {tx.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => generateTransactionReceiptPdf(tx, account, user, settings)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1 text-slate-700 dark:text-slate-300"
                              >
                                <Download className="w-3 h-3 text-amber-500" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TRANSFER / SETTLEMENTS */}
        {/* ======================================================== */}
        {activeTab === 'transfer' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.transferTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.transferSubtitle}
                </p>
              </div>

              {account.account_status !== 'active' && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <div className="font-bold">Account Verification Notice</div>
                    <div className="mt-0.5">
                      Account status is currently <strong>{account.account_status.toUpperCase()}</strong>. Outgoing settlements are restricted until compliance activation.
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleInitiateTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.transferCategory}
                  </label>
                  <select
                    value={transferCategory}
                    onChange={(e) => setTransferCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Bank Transfer">Domestic Fedwire Wire (USD)</option>
                    <option value="International Transfer">International SWIFT Settlement</option>
                    <option value="Multi-currency Transfer">Multi-Currency Cross-Border Clearing</option>
                    <option value="Digital Wallet">Digital Institutional Wallet</option>
                    <option value="Digital Assets Rail">Institutional Digital Asset Rail (USDC / EURC Settlement)</option>
                    <option value="Other">Other Escrow Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.recipientName}
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="e.g. Meridian Maritime Holdings LLC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.recipientAccount}
                    </label>
                    <input
                      type="text"
                      required
                      value={transferAccount}
                      onChange={(e) => setTransferAccount(e.target.value)}
                      placeholder="Account # or IBAN"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.recipientBank}
                    </label>
                    <input
                      type="text"
                      value={transferBank}
                      onChange={(e) => setTransferBank(e.target.value)}
                      placeholder="BIC / SWIFT or Routing"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.amount} ({account.currency})
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={account.balance}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="text-[11px] text-slate-400 mt-1">
                      Available: {formatCurrency(account.balance, account.currency)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.reference}
                    </label>
                    <input
                      type="text"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="e.g. INV-984021"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.description}
                  </label>
                  <input
                    type="text"
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    placeholder="Commercial escrow settlement"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={account.account_status !== 'active'}
                  className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Review Settlement</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TRANSFER PIN CONFIRMATION MODAL */}
        {showTransferPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  Confirm Transaction
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Settling <strong>{formatCurrency(Number(transferAmount), account.currency)}</strong> to {transferRecipient}.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                Please enter your 6-digit transaction PIN to cryptographically sign this transfer.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Enter 6-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={transferPin}
                  onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest font-mono text-2xl py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmTransfer}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                >
                  {loading ? 'Executing...' : 'Sign & Settle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WITHDRAWAL PIN CONFIRMATION MODAL */}
        {showWithdrawPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  Authorize Capital Payout
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Disbursing <strong>{formatCurrency(Number(withdrawAmount), withdrawCurrency || account.currency)}</strong> to {withdrawBeneficiaryName}.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                Please enter your 6-digit transaction PIN to cryptographically sign this withdrawal request.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Enter 6-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={withdrawPin}
                  onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest font-mono text-2xl py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Authorizing...' : 'Authorize Payout'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RECHARGE / LIQUIDITY INFLOW */}
        {/* ======================================================== */}
        {activeTab === 'recharge' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Approved Deposit Rails List (Section 25, 27) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.rechargeTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.rechargeSubtitle} Coordinated via executive treasury operations.
                </p>
              </div>

              <div className="space-y-4">
                {rechargeMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-amber-500" />
                        <span>{pm.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {pm.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{pm.description}</p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 break-all select-all">
                      {pm.account_info}
                    </div>

                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Instructions: {pm.instructions}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inflow Declaration Form (Section 26) */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Submit Deposit Notice
                </h4>
                <p className="text-xs text-slate-500">
                  After initiating funds from your external bank or vault, declare the wire memo here for immediate reconciliation.
                </p>

                <form onSubmit={handleRechargeSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.paymentMethod}
                    </label>
                    <select
                      value={rechargeMethod}
                      onChange={(e) => setRechargeMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      {rechargeMethods.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.amount} ({account.currency})
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="50,000.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.senderName}
                    </label>
                    <input
                      type="text"
                      required
                      value={rechargeSender}
                      onChange={(e) => setRechargeSender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.sourceReference}
                    </label>
                    <input
                      type="text"
                      value={rechargeRef}
                      onChange={(e) => setRechargeRef(e.target.value)}
                      placeholder="e.g. FED-WIRE-982014"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
                  >
                    <span>{loading ? 'Submitting...' : 'Register Deposit Notice'}</span>
                    <ArrowDownLeft className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3B: CAPITAL WITHDRAWAL & PAYOUTS */}
        {/* ======================================================== */}
        {activeTab === 'withdraw' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.withdrawTitle || 'Capital Withdrawal & Payouts'}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.withdrawSubtitle || 'Submit verified private treasury payouts with cryptographic authorization.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Available Balance:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrency(account.balance, account.currency)}
                </span>
              </div>
            </div>

            {/* Regulatory & PSP Notice (Requirement 9) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-semibold block">{t.noExternalPayoutNotice || 'External payout provider not configured'}</strong>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {t.withdrawPendingNotice || 'Withdrawal requests are recorded directly in the official ledger and queued for treasury verification & compliance sign-off. External bank rails will be dispatched following manual authorization.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Withdrawal Request Form (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span>Initiate Capital Payout</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Dual-Key Authorized
                  </span>
                </div>

                <form onSubmit={handleInitiateWithdrawal} className="space-y-4">
                  {/* Debiting Account Info */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Debiting Account</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {account.account_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Available Funds</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(account.balance, account.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Payout Rail */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.payoutRail || 'Payout Settlement Rail'}
                    </label>
                    <select
                      value={withdrawRail}
                      onChange={(e) => setWithdrawRail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="SEPA / International Wire (IBAN/BIC)">SEPA / International Wire (IBAN/BIC)</option>
                      <option value="SWIFT Institutional Wire Settlement">SWIFT Institutional Wire Settlement</option>
                      <option value="Fedwire / Direct Domestic (ABA Routing)">Fedwire / Direct Domestic (ABA Routing)</option>
                      <option value="Digital Assets Rail (USDC / EURC Treasury Settlement)">Digital Assets Rail (USDC / EURC Treasury Settlement)</option>
                    </select>
                  </div>

                  {/* Currency & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={withdrawCurrency}
                        onChange={(e) => setWithdrawCurrency(e.target.value as SupportedCurrency)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={account.currency}>{account.currency} (Account Default)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CHF">CHF (₣)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="SAR">SAR (ر.س / SAR)</option>
                        <option value="AED">AED (د.إ / AED)</option>
                        <option value="BHD">BHD (د.ب / BHD)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {t.withdrawAmount || 'Withdrawal Amount'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(account.balance.toString())}
                          className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                        >
                          Max Balance
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        max={account.balance}
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Beneficiary Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Beneficiary Full Legal Name / Corporate Entity
                    </label>
                    <input
                      type="text"
                      required
                      value={withdrawBeneficiaryName}
                      onChange={(e) => setWithdrawBeneficiaryName(e.target.value)}
                      placeholder="e.g. Jean Dupont"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Beneficiary IBAN / Account Number */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.beneficiaryIban || 'Beneficiary IBAN / Account'}
                    </label>
                    <input
                      type="text"
                      required
                      value={withdrawBeneficiaryAccount}
                      onChange={(e) => setWithdrawBeneficiaryAccount(e.target.value)}
                      placeholder="e.g. GB29NWBK60161331926819 or 0x98A9... or US021000..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Beneficiary Bank / BIC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.beneficiaryBic || 'Beneficiary BIC / Routing Code'}
                      </label>
                      <input
                        type="text"
                        value={withdrawBeneficiaryBank}
                        onChange={(e) => setWithdrawBeneficiaryBank(e.target.value)}
                        placeholder="e.g. BARCGB22 or 021000021"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Beneficiary Country
                      </label>
                      <input
                        type="text"
                        value={withdrawBeneficiaryCountry}
                        onChange={(e) => setWithdrawBeneficiaryCountry(e.target.value)}
                        placeholder="e.g. United Kingdom"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Remittance Reference / Memo (Optional)
                    </label>
                    <input
                      type="text"
                      value={withdrawRef}
                      onChange={(e) => setWithdrawRef(e.target.value)}
                      placeholder="e.g. WDR-OCT-SETTLEMENT"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Payout Fee summary */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Institutional Processing Fee:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      0.00 {withdrawCurrency} (Included)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || account.account_status !== 'active'}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4 disabled:opacity-50"
                  >
                    <span>{t.confirmWithdraw || 'Submit Withdrawal Request'}</span>
                    <Download className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Right Column: Information & Live Withdrawal History (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Security Protocol Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Treasury Payout Verification</span>
                  </h4>
                  <ul className="text-xs text-slate-500 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Funds are placed in a secured escrow pending treasury clearance.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Full audit trail with client IP, timestamp, and device fingerprint.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>If rejected by compliance, funds are refunded to your balance immediately.</span>
                    </li>
                  </ul>
                </div>

                {/* Live Withdrawal Request History */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Payout Request History
                    </h4>
                    <span className="text-[10px] text-slate-400">Live Ledger</span>
                  </div>

                  {transactions.filter((t) => t.type === 'withdrawal' || t.category?.toLowerCase().includes('withdraw')).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No withdrawal requests recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {transactions
                        .filter((t) => t.type === 'withdrawal' || t.category?.toLowerCase().includes('withdraw'))
                        .map((w) => (
                          <div
                            key={w.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {formatCurrency(w.amount, w.currency)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                  w.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : w.status === 'rejected' || w.status === 'failed'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                }`}
                              >
                                {w.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>To: {w.recipient_name || 'Beneficiary'}</span>
                              <span className="font-mono">{formatDateTime(w.created_at)}</span>
                            </div>

                            {w.reference && (
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                Ref: {w.reference}
                              </div>
                            )}

                            {w.description && (
                              <div className="text-[10px] text-slate-400 italic">
                                {w.description}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PRESTIGE CARDS (Sections 28, 29, 30, 31) */}
        {/* ======================================================== */}
        {activeTab === 'cards' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.cardsTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.cardsSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRequestNewCard}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Issue New Prestige Card</span>
                </button>
              </div>
            </div>

            {/* Regulatory & Card Processor Status Banner (Requirement 12) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-semibold block">{t.cardProviderNotice || 'Card Processing Partner Not Configured'}</strong>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Virtual and physical cards operate under compliance sandbox parameters. Full PAN (Primary Account Number) and CVC are securely tokenized via PCI-DSS standards. Live card settlement across Visa/Mastercard networks is activated upon integration with licensed card processing partners.
                </p>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((c) => {
                return (
                  <div
                    key={c.id}
                    className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700 shadow-xl space-y-6 relative overflow-hidden"
                  >
                    {/* Metal Sheen Corner Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          M
                        </div>
                        <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                          {c.tier} {c.network}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {c.status}
                      </span>
                    </div>

                    {/* Chip Graphic */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200/50 shadow-xs" />

                    {/* Masked Card Number with Tokenized Badge */}
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg tracking-widest font-semibold text-slate-100">
                        {c.card_number_masked}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Tokenized
                      </span>
                    </div>

                    {/* Cardholder, Expiry, CVV */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">{t.cardholder}</div>
                        <div className="font-semibold text-slate-200 truncate max-w-[140px]">
                          {c.cardholder_name}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">{t.expires}</div>
                        <div className="font-mono font-medium">
                          {String(c.expiry_month).padStart(2, '0')}/{c.expiry_year % 100}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">CVV</div>
                        <div className="flex items-center gap-1 font-mono font-medium text-slate-400">
                          <span>•••</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance & Limit */}
                    <div className="flex items-center justify-between text-xs pt-2 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div>
                        <div className="text-[10px] text-slate-400">{t.cardBalance}</div>
                        <div className="font-mono font-bold text-amber-400">
                          {formatCurrency(c.balance, account.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">{t.cardLimit}</div>
                        <div className="font-mono font-semibold text-slate-300">
                          {formatCurrency(c.monthly_limit, account.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="space-y-2 pt-1">
                      {c.allow_balance_transfer ? (
                        <button
                          onClick={() => setCardFundingId(c.id)}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          {t.transferToCard}
                        </button>
                      ) : (
                        <div className="text-[11px] text-center text-slate-500 italic">
                          Balance funding disabled by administrator
                        </div>
                      )}

                      {!c.is_physical && (
                        <button
                          onClick={() => setOrderingPhysicalForCard(c.id)}
                          className="w-full py-2 rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          {t.orderPhysical}
                        </button>
                      )}
                    </div>

                    {/* 6-Stage Physical Logistics Tracker (Section 31) */}
                    {c.delivery && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-amber-400 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Physical Shipping</span>
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {c.delivery.tracking_number}
                          </span>
                        </div>

                        {/* 6 Stages indicators */}
                        {(() => {
                          const stages: DeliveryStage[] = [
                            'request_received',
                            'processing',
                            'preparation',
                            'transit',
                            'customs',
                            'delivered'
                          ];
                          const currentIndex = stages.indexOf(c.delivery.current_stage);

                          return (
                            <div className="space-y-1">
                              <div className="grid grid-cols-6 gap-1">
                                {stages.map((st, idx) => (
                                  <div
                                    key={st}
                                    className={`h-1.5 rounded-full ${
                                      idx <= currentIndex ? 'bg-amber-400' : 'bg-slate-700'
                                    }`}
                                    title={st.replace('_', ' ')}
                                  />
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                Stage {currentIndex + 1} of 6: {c.delivery.current_stage.replace('_', ' ')}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Top Up Card Modal */}
            {cardFundingId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {t.transferToCard}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Debit main ledger balance and instantly credit this card.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Funding Amount ({account.currency})
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={account.balance}
                      value={cardFundingAmount}
                      onChange={(e) => setCardFundingAmount(e.target.value)}
                      placeholder="5,000.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        6-Digit Security PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setCardFundingPin('123456')}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
                      >
                        Auto Fill (123456)
                      </button>
                    </div>
                    <input
                      type="password"
                      maxLength={6}
                      value={cardFundingPin}
                      onChange={(e) => setCardFundingPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-widest font-mono text-xl py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCardFundingId(null)}
                      className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCardFundingSubmit}
                      className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {loading ? 'Funding...' : 'Confirm Load'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Physical Card Modal */}
            {orderingPhysicalForCard && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {t.orderPhysical}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bespoke laser-engraved metal card dispatched via priority armored logistics.
                  </p>

                  <form onSubmit={handleOrderPhysicalSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Street Address & Suite #
                      </label>
                      <input
                        type="text"
                        required
                        value={physStreet}
                        onChange={(e) => setPhysStreet(e.target.value)}
                        placeholder="540 Madison Ave, Penthouse 40"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={physCity}
                          onChange={(e) => setPhysCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          required
                          value={physPostal}
                          onChange={(e) => setPhysPostal(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOrderingPhysicalForCard(null)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {loading ? 'Submitting...' : 'Dispatch Card'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: FINANCING & LOANS (Sections 32-40) */}
        {/* ======================================================== */}
        {activeTab === 'financing' && (
          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.financingTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.financingSubtitle}
              </p>
            </div>

            {/* Interactive Simulator (Section 34) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="font-bold text-base text-slate-900 dark:text-white">
                  {t.simulatorTitle}
                </div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Indicative Rate: {currentLoanRate.toFixed(2)}% p.a.
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sliders & Controls */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.projectType}
                    </label>
                    <select
                      value={loanProject}
                      onChange={(e) => setLoanProject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      {rates.map((r) => (
                        <option key={r.id} value={r.category}>
                          {r.category} ({r.annual_rate_percent}% p.a.)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Slider & Manual Input */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{t.desiredAmount}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatCurrency(loanAmount, account.currency)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={1000000}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min={2000}
                      max={1000000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>

                  {/* Duration Slider & Manual Input */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{t.durationMonths}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {loanDuration} Months ({Math.round(loanDuration / 12)} Yrs)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={360}
                      step={3}
                      value={loanDuration}
                      onChange={(e) => setLoanDuration(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min={3}
                      max={360}
                      value={loanDuration}
                      onChange={(e) => setLoanDuration(Number(e.target.value))}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAmortizationModal(true)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.viewAmortization}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.viewTerms}</span>
                    </button>
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Structure Financière & Amortissement
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">{t.monthlyPayment}</div>
                    <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatCurrency(amortizationCalculation.monthlyPayment, account.currency)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-slate-400">{t.totalInterest}</div>
                      <div className="font-mono font-bold mt-0.5">
                        {formatCurrency(amortizationCalculation.totalInterest, account.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">{t.totalCost}</div>
                      <div className="font-mono font-bold mt-0.5">
                        {formatCurrency(amortizationCalculation.totalCost, account.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Submission Form with Mandatory Terms Acceptance (Section 37) */}
                  <form onSubmit={handleLoanSubmit} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span>
                        I have reviewed the structured Institutional Loan Terms and formally accept credit parameters.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!termsAccepted || loading}
                      className="w-full py-3 rounded-xl bg-slate-950 dark:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Landmark className="w-4 h-4" />
                      <span>{loading ? 'Submitting...' : t.submitApplication}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* My Financing Applications (Section 38, 39, 40) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {t.myLoans}
              </h4>

              {loans.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No financing dossiers currently submitted.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Term</th>
                        <th className="py-2.5 px-3">Rate</th>
                        <th className="py-2.5 px-3">Monthly</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loans.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            {l.project_type}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {formatCurrency(l.amount, l.currency)}
                          </td>
                          <td className="py-3 px-3">{l.duration_months} Mos</td>
                          <td className="py-3 px-3 font-mono">{l.rate_percent}%</td>
                          <td className="py-3 px-3 font-mono">
                            {formatCurrency(l.monthly_payment, l.currency)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              {l.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                            {l.status === 'approved' && !l.credit_parameters_agreed && (
                              <button
                                onClick={() => handleAgreeParameters(l.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Agree Parameters
                              </button>
                            )}

                            <button
                              onClick={() =>
                                generateLoanTermsPdf(
                                  l.project_type,
                                  l.amount,
                                  l.currency,
                                  l.duration_months,
                                  l.rate_percent,
                                  user,
                                  settings
                                )
                              }
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Download Terms
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Amortization Modal (Section 35) */}
            {showAmortizationModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                      {t.viewAmortization} — {loanProject}
                    </h4>
                    <button
                      onClick={() => setShowAmortizationModal(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2 px-2">Month</th>
                          <th className="py-2 px-2">Payment</th>
                          <th className="py-2 px-2">Principal</th>
                          <th className="py-2 px-2">Interest</th>
                          <th className="py-2 px-2 text-right">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {amortizationCalculation.schedule.slice(0, 48).map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-1.5 px-2">{row.month}</td>
                            <td className="py-1.5 px-2">{formatCurrency(row.payment, account.currency)}</td>
                            <td className="py-1.5 px-2">{formatCurrency(row.principal, account.currency)}</td>
                            <td className="py-1.5 px-2 text-amber-600 dark:text-amber-400">{formatCurrency(row.interest, account.currency)}</td>
                            <td className="py-1.5 px-2 text-right">{formatCurrency(row.remainingBalance, account.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() =>
                        generateAmortizationPdf(
                          loanProject,
                          loanAmount,
                          account.currency,
                          currentLoanRate,
                          loanDuration,
                          amortizationCalculation.monthlyPayment,
                          amortizationCalculation.totalCost,
                          amortizationCalculation.schedule
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Schedule</span>
                    </button>

                    <button
                      onClick={() => setShowAmortizationModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loan Terms Review Modal (Section 36) */}
            {showTermsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                      Structured Credit Facility Terms & Conditions
                    </h4>
                    <button onClick={() => setShowTermsModal(false)} className="cursor-pointer">
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                    <p className="font-bold text-slate-900 dark:text-white">
                      ARTICLE 1 — GENERAL UNDERWRITING & CREDIT FACILITY
                    </p>
                    <p>
                      The Borrower agrees to the facility amount of {formatCurrency(loanAmount, account.currency)} for project {loanProject}, amortized over {loanDuration} monthly intervals at an annual indicative rate of {currentLoanRate}%.
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      ARTICLE 2 — REPAYMENT PROTOCOL
                    </p>
                    <p>
                      Monthly repayments of {formatCurrency(amortizationCalculation.monthlyPayment, account.currency)} will be debited from primary account #{account.account_number}.
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      ARTICLE 3 — REGULATORY & CREDIT UNDERWRITING
                    </p>
                    <p>
                      Facility approval and disbursement are subject to institutional underwriting, collateral assessment, and treasury credit clearance by participating liquidity providers.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setTermsAccepted(true);
                        setShowTermsModal(false);
                        flash('Loan terms reviewed and agreed.');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Accept Terms & Continue
                    </button>

                    <button
                      onClick={() =>
                        generateLoanTermsPdf(
                          loanProject,
                          loanAmount,
                          account.currency,
                          loanDuration,
                          currentLoanRate,
                          user,
                          settings
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Download Terms PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: PROFILE & SECURITY */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Profile Overview */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Client Profile & Entity Identity
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Full Legal Name</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user.first_name} {user.last_name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Executive Email</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user.email}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Phone Contact</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user.phone}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Account Structure</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user.account_type}
                  </div>
                </div>
              </div>

              {/* Currency Preference Form */}
              <form onSubmit={handleSavePreferences} className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Primary Ledger Currency
                  </label>
                  <select
                    value={prefCurrency}
                    onChange={(e) => setPrefCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="CAD">CAD — Canadian Dollar (C$)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="SAR">SAR — Saudi Riyal (ر.س / SAR)</option>
                    <option value="AED">AED — UAE Dirham (د.إ / AED)</option>
                    <option value="BHD">BHD — Bahraini Dinar (د.ب / BHD)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Save Currency
                </button>
              </form>
            </div>

            {/* Programme de Parrainage Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {t.navReferrals || 'Programme de parrainage'}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  Privilège Client
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t.referralHeroSubtitle || "Invitez de nouveaux utilisateurs à découvrir l'expérience numérique de Movafi Bank et suivez vos invitations depuis votre espace personnel."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('referrals')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Accéder à l'espace Parrainage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Change 6-Digit PIN Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Update 6-Digit Transaction PIN
              </h3>
              <p className="text-xs text-slate-500">
                Ensure your authorization PIN is confidential and distinct from your account password.
              </p>

              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Current PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tracking-widest text-center"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      New PIN (6 Digits)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tracking-widest text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-sm mt-2"
                >
                  Update Security PIN
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: REFERRALS / PROGRAMME DE PARRAINAGE */}
        {/* ======================================================== */}
        {activeTab === 'referrals' && (
          <ReferralSection user={user} currentLang={currentLang} />
        )}

        {/* MODAL: OPEN NEW SUB-ACCOUNT */}
        {showNewAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Ouvrir un nouveau compte
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewAccountModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Devise du compte
                  </label>
                  <select
                    value={newAccCurrency}
                    onChange={(e) => setNewAccCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                    <option value="CHF">CHF — Swiss Franc (CHF)</option>
                    <option value="CAD">CAD — Canadian Dollar (C$)</option>
                    <option value="BHD">BHD — Bahraini Dinar (د.ب / BHD)</option>
                    <option value="SAR">SAR — Saudi Riyal (ر.س / SAR)</option>
                    <option value="AED">AED — UAE Dirham (د.إ / AED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Type de compte
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Personal">Compte Courant Privé</option>
                    <option value="Savings">Compte Épargne & Liquidité</option>
                    <option value="Business">Compte Commercial / Société</option>
                    <option value="Treasury">Compte Trésorerie & Investissement</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Génération instantanée d'IBAN
                  </span>
                  <p>
                    Votre nouveau sous-compte disposera de son propre numéro de compte et IBAN international pour recevoir et émettre des virements directement.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAccountModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                  >
                    {loading ? 'Création...' : 'Confirmer l’ouverture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RELEVÉ D'IDENTITÉ BANCAIRE (RIB) */}
        {showRibModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Relevé d'Identité Bancaire (RIB)
                    </h3>
                    <p className="text-[11px] text-slate-400">Certificat d’identification de compte</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRibModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* RIB Certificate Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="font-extrabold tracking-wider text-slate-900 dark:text-white uppercase text-sm">
                      MOVAFI BANK UNITED STATES
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      New York Desk · 540 Madison Avenue, New York, NY 10022
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    VÉRIFIÉ & ACTIF
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400">Titulaire du compte :</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {user.first_name} {user.last_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Identifiant Client :</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {account.client_id}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Devise de tenue :</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {account.currency}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Numéro de Compte :</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {account.account_number}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400">Numéro IBAN International :</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-all select-all">
                      {account.iban}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400">Code BIC / SWIFT :</span>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {account.bic_swift}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Code Banque / Guichet :</span>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        02100 / 00021
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(
                        `Titulaire: ${user.first_name} ${user.last_name}\nBanque: Movafi Bank US\nIBAN: ${account.iban}\nBIC: ${account.bic_swift}\nCompte: ${account.account_number}`
                      );
                      flash('Coordonnées bancaires copiées dans le presse-papier !');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Copier le RIB</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le RIB</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Equal size per tab contract - Request 4) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1 shadow-lg">
        <div className="grid grid-cols-7 w-full items-stretch gap-0.5">
          {[
            {
              id: 'overview',
              label: currentLang === 'fr' ? 'Accueil' : currentLang === 'es' ? 'Inicio' : currentLang === 'ar' ? 'الرئيسية' : 'Home',
              icon: Wallet
            },
            {
              id: 'transfer',
              label: currentLang === 'fr' ? 'Virement' : currentLang === 'es' ? 'Envío' : currentLang === 'ar' ? 'تحويل' : 'Transfer',
              icon: ArrowUpRight
            },
            {
              id: 'recharge',
              label: currentLang === 'fr' ? 'Dépôt' : currentLang === 'es' ? 'Depósito' : currentLang === 'ar' ? 'إيداع' : 'Deposit',
              icon: ArrowDownLeft
            },
            {
              id: 'withdraw',
              label: currentLang === 'fr' ? 'Retrait' : currentLang === 'es' ? 'Retiro' : currentLang === 'ar' ? 'سحب' : 'Payout',
              icon: Download
            },
            {
              id: 'cards',
              label: currentLang === 'fr' ? 'Cartes' : currentLang === 'es' ? 'Tarjetas' : currentLang === 'ar' ? 'بطاقات' : 'Cards',
              icon: CreditCard
            },
            {
              id: 'financing',
              label: currentLang === 'fr' ? 'Crédit' : currentLang === 'es' ? 'Crédito' : currentLang === 'ar' ? 'تمويل' : 'Credit',
              icon: Landmark
            },
            {
              id: 'referrals',
              label: currentLang === 'fr' ? 'Parrain' : currentLang === 'es' ? 'Invitar' : currentLang === 'ar' ? 'إحالة' : 'Affiliate',
              icon: Gift
            }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center w-full min-w-0 h-13 py-1 px-0.5 rounded-xl transition-all cursor-pointer text-center ${
                  active
                    ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/15'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'scale-110' : ''}`} />
                <div className="w-full h-3.5 flex items-center justify-center text-center overflow-hidden mt-0.5 px-0.5">
                  <span className="w-full text-center truncate text-[9px] font-semibold leading-none tracking-tighter block">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
