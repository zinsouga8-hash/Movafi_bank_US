import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
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
  CardTier,
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
  onTabChange?: (tab: 'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals') => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  initialAccount,
  currentLang,
  onLogout,
  settings,
  initialTab,
  onTabChange
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals'>(() => {
    const saved = localStorage.getItem('movafi_client_tab') as any;
    if (saved && ['overview', 'transfer', 'recharge', 'withdraw', 'cards', 'financing', 'profile', 'referrals'].includes(saved)) {
      return saved;
    }
    return initialTab || 'overview';
  });

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('movafi_client_tab', activeTab);
      onTabChange?.(activeTab);
    }
  }, [activeTab, onTabChange]);

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
  // TRANSFER LOGIC (Unified Single Rail Selector)
  // -------------------------------------------------------------
  const [showDormantModal, setShowDormantModal] = useState(false);

  // International transfer methods across countries/currencies of the bank, plus Mexican local methods if MXN account
  const getAvailableTransferMethods = () => {
    const internationalMethods = [
      'Virement Bancaire International SWIFT (Tous pays - Multidevises)',
      'Virement Bancaire International (États-Unis - Fedwire / Wire Transfer)',
      'Virement Bancaire International (Canada - EFT / Interac Wire)',
      'Virement Bancaire International (Suisse - SIC / SWIFT CHF)',
      'Virement Bancaire International SEPA (Espagne / Zone Euro)',
      'Virement Bancaire International (Émirats Arabes Unis / Dubaï - UAEFTS / IPI)',
      'Virement Bancaire International (Mexique - SPEI International)',
      'PayPal International (Transfert instantané)',
      'MoneyGram (Transfert d’espèces & réseau mondial)',
      'Western Union (Réseau de transfert international)'
    ];

    const isMexicoAccount =
      account.currency === 'MXN' ||
      (user.residence_country && user.residence_country.toLowerCase().includes('mexic'));

    if (isMexicoAccount) {
      return [
        ...internationalMethods,
        'OXXO Pay (Paiement & Virement de proximité Mexique)',
        'Mercado Pago / Mercado Pay (Transfert Local Mexique)',
        'SPEI Local (Système de Paiement Électronique Interbancaire Mexique)'
      ];
    }

    return internationalMethods;
  };

  const [transferMethod, setTransferMethod] = useState<string>(
    'Virement Bancaire International SWIFT (Tous pays - Multidevises)'
  );

  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAccount, setTransferAccount] = useState('');
  const [transferBank, setTransferBank] = useState('');
  const [transferCategory, setTransferCategory] = useState('Virement Bancaire SWIFT');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [showTransferPinModal, setShowTransferPinModal] = useState(false);

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    // Rule: Outgoing transfers restricted only at authorization stage by notifying dormant account
    if (account.account_status !== 'active') {
      setShowDormantModal(true);
      return;
    }
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      flash(currentLang === 'fr' ? 'Veuillez indiquer un montant de virement valide.' : 'Please specify a valid transfer amount.', 'error');
      return;
    }
    if (account.balance < amt) {
      flash(currentLang === 'fr' ? 'Solde principal insuffisant pour exécuter ce virement.' : 'Insufficient available balance.', 'error');
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
      setShowDormantModal(true);
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
  const [showRequestCardModal, setShowRequestCardModal] = useState(false);
  const [cardRequestStep, setCardRequestStep] = useState<1 | 2>(1);
  const [newCardNetwork, setNewCardNetwork] = useState<'visa' | 'mastercard'>('visa');
  const [newCardTier, setNewCardTier] = useState<CardTier>('gold');
  const [revealedCardNumbers, setRevealedCardNumbers] = useState<Record<string, boolean>>({});
  const [revealedCardCvc, setRevealedCardCvc] = useState<Record<string, boolean>>({});

  // Modals for pop-up messages
  const [cardRequestSuccessModal, setCardRequestSuccessModal] = useState<{ title: string; message: string } | null>(null);
  const [cardActionModal, setCardActionModal] = useState<{ title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success' } | null>(null);
  const [transferSuccessModal, setTransferSuccessModal] = useState<{ title: string; message: string } | null>(null);

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

  const openNewCardModal = () => {
    setNewCardNetwork('visa');
    setNewCardTier('gold');
    setCardRequestStep(1);
    setShowRequestCardModal(true);
  };

  const submitCardRequest = async () => {
    setLoading(true);
    try {
      const res = await api.requestCard({
        cardholder_name: `${user.first_name} ${user.last_name}`,
        network: newCardNetwork,
        tier: newCardTier
      });
      if (res.success) {
        setShowRequestCardModal(false);
        setCardRequestSuccessModal({
          title: 'Demande de carte envoyée',
          message: 'Votre demande de création de carte a été enregistrée avec succès. Veuillez patienter pendant que le service de l\'administration approuve votre demande de création de carte dans les plus brefs délais.'
        });
        await refreshData();
      } else {
        flash(res.message || 'Échec de la demande de carte.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Erreur lors de la création de la carte.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRevealCvc = (c: BankCard) => {
    if (!c.is_active) {
      setCardActionModal({
        title: 'Carte Inactive',
        message: 'Votre carte est actuellement inactive. Veuillez contacter l\'assistance client pour obtenir votre code CVC et demander l\'activation de la carte.',
        type: 'warning'
      });
      return;
    }
    setRevealedCardCvc((prev) => ({ ...prev, [c.id]: !prev[c.id] }));
  };

  const handleInitiateCardFunding = (c: BankCard) => {
    if (c.creation_status !== 'approved') {
      setCardActionModal({
        title: 'Demande en cours de validation',
        message: 'Votre demande de carte est actuellement en cours de validation par le service d\'administration. Veuillez patienter avant d\'effectuer un transfert.',
        type: 'info'
      });
      return;
    }
    if (!c.is_active) {
      setCardActionModal({
        title: 'Carte Inactive',
        message: 'Votre carte est actuellement inactive. Veuillez contacter le service client pour activer votre carte et obtenir votre code CVC avant d\'effectuer un transfert.',
        type: 'warning'
      });
      return;
    }
    if (!c.allow_balance_transfer) {
      setCardActionModal({
        title: 'Transfert Bloqué',
        message: 'Le transfert depuis le solde principal est actuellement bloqué sur cette carte. Veuillez contacter le service client pour activer le transfert.',
        type: 'warning'
      });
      return;
    }
    setCardFundingId(c.id);
  };

  const handleRequestNewCard = () => {
    openNewCardModal();
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
        setCardFundingId(null);
        setCardFundingAmount('');
        setCardFundingPin('');
        setTransferSuccessModal({
          title: 'Transfert effectué',
          message: 'Votre transfert depuis votre solde principal a été validé avec succès. Les fonds ont été crédités immédiatement sur votre carte virtuelle.'
        });
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
  const [termsAgreedInModal, setTermsAgreedInModal] = useState(false);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loanSubmissionSuccessModal, setLoanSubmissionSuccessModal] = useState<{ title: string; message: string } | null>(null);
  const [selectedLoanForParams, setSelectedLoanForParams] = useState<LoanApplication | null>(null);
  const [loanParamsSuccessModal, setLoanParamsSuccessModal] = useState<{ title: string; message: string } | null>(null);

  // Active rate for selected project
  const currentLoanRate =
    rates.find((r) => r.category.toLowerCase() === loanProject.toLowerCase())?.annual_rate_percent || 3.0;

  const amortizationCalculation = calculateAmortization(loanAmount, currentLoanRate, loanDuration);

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      flash('Veuillez d\'abord consulter et accepter les conditions de prêt pour activer la soumission.', 'error');
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
        setTermsAccepted(false);
        setTermsAgreedInModal(false);
        setLoanSubmissionSuccessModal({
          title: 'Demande de prêt envoyée avec succès !',
          message: 'Votre dossier a été soumis pour analyse financière par le comité de crédit. Vous recevrez également une notification par e-mail dès qu\'une décision sera rendue par l\'administration.'
        });
        await refreshData();
      } else {
        flash(res.message || 'Échec de la soumission du prêt.', 'error');
      }
    } catch (e: any) {
      flash(e.message || 'Erreur lors de la soumission.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeParameters = async (loanId: string) => {
    setLoading(true);
    try {
      const res = await api.agreeCreditParameters(loanId);
      if (res.success) {
        setSelectedLoanForParams(null);
        setLoanParamsSuccessModal({
          title: 'Paramètres de crédit validés !',
          message: 'Vous avez validé avec succès vos paramètres de crédit. L\'administration a été notifiée afin de procéder au déblocage immédiat des fonds sur votre compte principal.'
        });
        await refreshData();
      } else {
        flash(res.message || 'Échec de validation des paramètres.', 'error');
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
              href={`mailto:${settings?.support_email || 'support@movafi-groupes.com'}?subject=Private%20Client%20Request%20(${account.client_id})`}
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
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Header with Private Customer Service Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {currentLang === 'fr' ? 'Virement & Règlements' : t.transferTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentLang === 'fr' ? 'Émission de virements bancaires nationaux et internationaux certifiés' : t.transferSubtitle}
                </p>
              </div>

              <a
                href={`mailto:${settings?.support_email || 'support@movafi-groupes.com'}?subject=Assistance%20Virement%20Client%20${account.client_id}`}
                className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{currentLang === 'fr' ? 'Service client privé' : 'Service client privé'}</span>
              </a>
            </div>

            {/* Solde disponible affiché tout en haut, juste en dessous du bouton Service client privé */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                    {currentLang === 'fr' ? 'Solde Principal Disponible' : 'Available Primary Balance'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mt-1">
                    {formatCurrency(account.balance, account.currency)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span>Compte #{account.account_number}</span>
                    <span>•</span>
                    <span>IBAN: {account.iban}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Devise de Tenue</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{account.currency}</span>
                </div>
              </div>
            </div>

            {/* Transfer Configuration Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              <form onSubmit={handleInitiateTransfer} className="space-y-4">
                {/* Moyen de transfert bancaire (Menu déroulant unique) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {currentLang === 'fr' ? 'Moyen de Transfert Bancaire *' : 'Transfer Method *'}
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {account.currency === 'MXN' ? 'Options Internationales & Locales Mexique' : 'Réseaux Bancaires Internationaux'}
                    </span>
                  </div>
                  <select
                    value={transferMethod}
                    onChange={(e) => {
                      setTransferMethod(e.target.value);
                      setTransferCategory(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  >
                    {getAvailableTransferMethods().map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Nom du bénéficiaire */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Nom complet ou Raison sociale du bénéficiaire *' : 'Beneficiary Full Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="Ex: Meridian Maritime Holdings LLC ou Jean Dupont"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 4. IBAN et Code BIC/SWIFT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {currentLang === 'fr' ? 'IBAN du bénéficiaire (Confirmé) *' : 'Beneficiary IBAN (Confirmed) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={transferAccount}
                      onChange={(e) => setTransferAccount(e.target.value.toUpperCase())}
                      placeholder="Ex: FR76 3000 6000 0112 3456 7890 189"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {currentLang === 'fr' ? 'Code BIC / SWIFT & Banque réceptrice *' : 'BIC / SWIFT & Recipient Bank *'}
                    </label>
                    <input
                      type="text"
                      value={transferBank}
                      onChange={(e) => setTransferBank(e.target.value.toUpperCase())}
                      placeholder="Ex: BNPAFRPPXXX - BNP Paribas"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 5. Montant et Référence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {currentLang === 'fr' ? `Montant du virement (${account.currency}) *` : `${t.amount} (${account.currency}) *`}
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
                      {currentLang === 'fr' ? 'Disponible :' : 'Available:'} {formatCurrency(account.balance, account.currency)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {currentLang === 'fr' ? 'Référence bancaire *' : 'Transfer Reference *'}
                    </label>
                    <input
                      type="text"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="Ex: FACTURE-2026-0091"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fr' ? 'Motif du virement' : t.description}
                  </label>
                  <input
                    type="text"
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    placeholder={currentLang === 'fr' ? 'Ex: Règlement de prestations ou virement personnel' : 'Commercial or personal escrow settlement'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Submit button: « Autoriser et revoir le transfert » */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6 active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>{currentLang === 'fr' ? 'Autoriser et revoir le transfert' : 'Authorize & Review Settlement'}</span>
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

        {/* DORMANT / INACTIVE ACCOUNT RESTRICTION MODAL */}
        {showDormantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/30 p-6 sm:p-7 space-y-5 text-center shadow-2xl relative">
              {/* Header Icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>

              <div>
                <h4 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                  {currentLang === 'fr'
                    ? 'Compte dormant — Activation requise'
                    : currentLang === 'es'
                    ? 'Cuenta inactiva — Activación requerida'
                    : currentLang === 'ar'
                    ? 'حساب خامل — التنشيط مطلوب'
                    : 'Dormant Account — Activation Required'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {currentLang === 'fr'
                    ? 'Votre compte bancaire est actuellement au statut dormant pour les débits sortants. Afin de finaliser l’autorisation et exécuter cette opération, vous devez contacter le service client afin de faire activer votre compte.'
                    : currentLang === 'es'
                    ? 'Su cuenta bancaria se encuentra actualmente en estado inactivo para débitos salientes. Para autorizar y procesar transferencias o retiros, debe comunicarse con atención al cliente para activar su cuenta.'
                    : currentLang === 'ar'
                    ? 'حسابك المصرفي حالياً في حالة خمول بالنسبة للتحويلات والسحوبات الصادرة. لتفويض هذه العملية وتنفيذها، يرجى التواصل مع خدمة العملاء لتفعيل حسابك.'
                    : 'Your bank account is currently in dormant status for outgoing debits. In order to authorize and execute this transaction, you must contact customer service to activate your account.'}
                </p>
              </div>

              {/* Client & Account details pill */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Identifiant Client</span>
                  <span className="font-bold">{account.client_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Statut Actuel</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{account.account_status.toUpperCase()}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <a
                  href={`mailto:${settings?.support_email || 'support@movafi-groupes.com'}?subject=Demande%20d%27activation%20de%20compte%20dormant%20-%20Client%20${account.client_id}&body=Bonjour%20le%20service%20client%20Movafibank,%0A%0AJe%20souhaite%20procéder%20à%20l%27activation%20de%20mon%20compte%20bancaire%20afin%20d%27autoriser%20mes%20transferts%20sortants.%0A%0AIdentifiant%20Client%20:%20${account.client_id}%0ANuméro%20de%20compte%20:%20${account.account_number}%0ANom%20:%20${user.first_name}%20${user.last_name}%0A%0AMerci.`}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  <span>{currentLang === 'fr' ? 'Contacter le service client privé' : 'Contact Concierge Support'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowDormantModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {currentLang === 'fr' ? 'Fermer et revenir au tableau de bord' : 'Close and return to dashboard'}
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
                {rechargeMethods.map((pm) => {
                  const isCrypto =
                    pm.category === 'Digital Assets' ||
                    pm.name.toLowerCase().includes('bitcoin') ||
                    pm.name.toLowerCase().includes('usdt') ||
                    pm.name.toLowerCase().includes('crypto');

                  return (
                    <div
                      key={pm.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-amber-500" />
                          <span>{pm.name}</span>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isCrypto
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isCrypto ? 'Crypto / Digital Assets' : pm.category}
                        </span>
                      </div>

                      {pm.description && (
                        <p className="text-xs text-slate-500">{pm.description}</p>
                      )}

                      {/* Pour Bitcoin et USDT : Affichage UNIQUE de l'adresse de dépôt */}
                      {isCrypto ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Adresse de dépôt ({pm.crypto_network || 'Blockchain'})
                          </span>
                          <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-400 border border-slate-800 break-all select-all flex items-center justify-between gap-2">
                            <span>{pm.wallet_address || pm.account_info}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pm.wallet_address || pm.account_info);
                                flash('Adresse copiée dans le presse-papier !');
                              }}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-sans font-bold cursor-pointer shrink-0"
                            >
                              Copier
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Coordonnées Bancaires & Routage
                          </span>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 break-all select-all">
                            {pm.account_info}
                          </div>
                        </div>
                      )}

                      {pm.instructions && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                          <strong className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                            Instructions :
                          </strong>
                          {pm.instructions}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inflow Declaration Form (Section 26) */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {currentLang === 'fr' ? 'Déclarer un Dépôt' : 'Submit Deposit Notice'}
                </h4>
                <p className="text-xs text-slate-500">
                  {currentLang === 'fr'
                    ? 'Après avoir transféré vos fonds, déclarez les références de la transaction pour un rapprochement et un crédit immédiat.'
                    : 'After initiating funds from your external bank or vault, declare the wire memo here for immediate reconciliation.'}
                </p>

                {(() => {
                  const selectedPm = rechargeMethods.find((m) => m.name === rechargeMethod);
                  const isSelectedCrypto =
                    selectedPm &&
                    (selectedPm.category === 'Digital Assets' ||
                      selectedPm.name.toLowerCase().includes('bitcoin') ||
                      selectedPm.name.toLowerCase().includes('usdt') ||
                      selectedPm.name.toLowerCase().includes('crypto'));

                  return (
                    <form onSubmit={handleRechargeSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.paymentMethod}
                        </label>
                        <select
                          value={rechargeMethod}
                          onChange={(e) => setRechargeMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-semibold"
                        >
                          {rechargeMethods.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Encadré d'adresse pour Crypto */}
                      {isSelectedCrypto && selectedPm && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                            Adresse de versement {selectedPm.name} :
                          </span>
                          <div className="font-mono font-bold text-slate-900 dark:text-white break-all select-all text-[11px]">
                            {selectedPm.wallet_address || selectedPm.account_info}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.amount} ({account.currency})
                        </label>
                        <input
                          type="number"
                          required
                          min={10}
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          placeholder="50,000.00"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Si ce n'est PAS crypto, on demande le nom de l'émetteur bancaire */}
                      {!isSelectedCrypto && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {currentLang === 'fr' ? 'Nom du Titulaire Émetteur (Banque) *' : t.senderName}
                          </label>
                          <input
                            type="text"
                            required
                            value={rechargeSender}
                            onChange={(e) => setRechargeSender(e.target.value)}
                            placeholder="ex. Jean Dupont ou Nom de l'entreprise"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isSelectedCrypto
                            ? 'Hash de transaction (TXID) / Référence Blockchain *'
                            : (t.sourceReference || 'Référence de virement')}
                        </label>
                        <input
                          type="text"
                          required={isSelectedCrypto}
                          value={rechargeRef}
                          onChange={(e) => setRechargeRef(e.target.value)}
                          placeholder={isSelectedCrypto ? "ex. 0x71a9... ou TXID Bitcoin / Tron" : "e.g. FED-WIRE-982014"}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
                      >
                        <span>{loading ? 'Enregistrement...' : (currentLang === 'fr' ? 'Confirmer l\'avis de dépôt' : 'Register Deposit Notice')}</span>
                        <ArrowDownLeft className="w-4 h-4" />
                      </button>
                    </form>
                  );
                })()}
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

                  {/* Payout Rail / Moyen de retrait */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        {currentLang === 'fr' ? 'Moyen de Retrait / Canal de Règlement *' : (t.payoutRail || 'Payout Settlement Rail')}
                      </label>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {account.currency === 'MXN' ? 'Options Internationales & Locales Mexique' : 'Réseaux Internationaux'}
                      </span>
                    </div>
                    <select
                      value={withdrawRail}
                      onChange={(e) => setWithdrawRail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-semibold"
                    >
                      {getAvailableTransferMethods().map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
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
                        <option value="MXN">MXN ($ / MXN)</option>
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
                    disabled={loading}
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
                  type="button"
                  onClick={openNewCardModal}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Demander une nouvelle carte</span>
                </button>
              </div>
            </div>

            {/* Regulatory & Card Processor Status Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-semibold block">Cartes Bancaires Virtuelles & Physiques Sécurisées</strong>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Vos cartes virtuelles opèrent sous les normes internationales PCI-DSS. Les numéros et codes CVC sont protégés par chiffrement. Une fois votre demande validée par l'administration, demandez l'activation auprès du service client pour démasquer votre CVC et utiliser vos plafonds.
                </p>
              </div>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Aucune carte bancaire active
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Commandez instantanément votre première carte bancaire Visa ou Mastercard (Standard, Gold ou Premium) avec plafonds personnalisés.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewCardModal}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Demander une nouvelle carte
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((c) => {
                  const isPremium = c.tier === 'premium';
                  const isGold = c.tier === 'gold';

                  const cardBg = isPremium
                    ? 'bg-gradient-to-br from-zinc-950 via-slate-900 to-black border-amber-500/40 shadow-2xl'
                    : isGold
                    ? 'bg-gradient-to-br from-amber-800 via-amber-700 to-amber-950 border-amber-400/50 shadow-2xl'
                    : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border-blue-500/30 shadow-2xl';

                  return (
                    <div
                      key={c.id}
                      className="space-y-4"
                    >
                      {/* VRAIE CARTE VIRTUELLE DESSINÉE */}
                      <div className={`p-6 rounded-3xl text-white border space-y-5 relative overflow-hidden transition-all duration-300 hover:shadow-amber-500/10 ${cardBg}`}>
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />

                        {/* Card Header : Brand & Network */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-black tracking-wider text-sm bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                              MOVAFI BANK
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-widest font-bold border border-white/10 text-amber-300">
                              {c.tier.toUpperCase()}
                            </span>
                          </div>

                          {/* Network Logo : Visa / Mastercard */}
                          <div className="flex items-center">
                            {c.network === 'mastercard' ? (
                              <div className="flex items-center -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-rose-600/90 shadow-sm" />
                                <div className="w-6 h-6 rounded-full bg-amber-500/90 shadow-sm" />
                              </div>
                            ) : (
                              <div className="font-sans font-black italic tracking-tighter text-base text-blue-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                                VISA
                              </div>
                            )}
                          </div>
                        </div>

                        {/* EMV Chip & Contactless */}
                        <div className="flex items-center justify-between pt-1 relative z-10">
                          {/* Realistic Metallic Gold Chip */}
                          <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-200/60 shadow-inner flex flex-col justify-between p-1">
                            <div className="w-full h-0.5 bg-amber-700/40 rounded-full" />
                            <div className="flex justify-between">
                              <div className="w-3 h-3 border border-amber-700/40 rounded-sm" />
                              <div className="w-3 h-3 border border-amber-700/40 rounded-sm" />
                            </div>
                            <div className="w-full h-0.5 bg-amber-700/40 rounded-full" />
                          </div>

                          {/* Contactless waves symbol */}
                          <div className="flex items-center gap-0.5 text-slate-400 rotate-90">
                            <span className="text-sm font-bold">)</span>
                            <span className="text-base font-bold">)</span>
                            <span className="text-lg font-bold">)</span>
                          </div>
                        </div>

                        {/* Numéro de la carte (format 4x4) */}
                        <div className="relative z-10 pt-2">
                          <div className="font-mono text-lg tracking-widest font-bold text-white drop-shadow-sm flex items-center justify-between">
                            <span>{c.card_number_masked}</span>
                            <span className="text-[10px] uppercase font-sans tracking-normal font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                              Virtuelle
                            </span>
                          </div>
                        </div>

                        {/* Nom du titulaire, Expiration et CVC */}
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 relative z-10">
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">Titulaire</div>
                            <div className="font-bold text-slate-100 tracking-wide uppercase truncate max-w-[130px]">
                              {c.cardholder_name}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">Expire</div>
                            <div className="font-mono font-bold text-slate-200">
                              {String(c.expiry_month).padStart(2, '0')}/{c.expiry_year % 100}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                              <span>CVC</span>
                              <button
                                type="button"
                                onClick={() => handleToggleRevealCvc(c)}
                                className="text-amber-400 hover:text-amber-300 cursor-pointer"
                                title="Démasquer le CVC"
                              >
                                {revealedCardCvc[c.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
                              <span>{revealedCardCvc[c.id] && c.is_active ? c.cvc_mock : '•••'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Statuts & Actions sous la carte */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm">
                        {/* Deux badges distincts exigés par l'utilisateur */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {/* Statut 1 : Demande de validation */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              c.creation_status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : c.creation_status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>
                              {c.creation_status === 'approved'
                                ? 'Demande approuvée'
                                : c.creation_status === 'rejected'
                                ? 'Demande rejetée'
                                : 'Demande en cours de validation'}
                            </span>
                          </span>

                          {/* Statut 2 : Activation de la carte */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              c.is_active
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{c.is_active ? 'Carte active' : 'Carte inactive'}</span>
                          </span>
                        </div>

                        {/* Solde & Plafonds */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Solde de la carte</span>
                            <span className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                              {formatCurrency(c.balance, account.currency)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Plafond mensuel</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(c.monthly_limit || (c.tier === 'premium' ? 100000 : c.tier === 'gold' ? 25000 : 10000), account.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Bouton : Transférer depuis solde principal */}
                        <button
                          type="button"
                          onClick={() => handleInitiateCardFunding(c)}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transférer depuis solde principal</span>
                        </button>

                        {/* Bouton : Demander une livraison physique de ma carte */}
                        {!c.is_physical && (
                          <button
                            type="button"
                            onClick={() => setOrderingPhysicalForCard(c.id)}
                            className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5 text-amber-500" />
                            <span>Demander une livraison physique de ma carte</span>
                          </button>
                        )}

                        {/* 6-Stage Physical Logistics Tracker */}
                        {c.delivery && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5" />
                                <span>Suivi Livraison Physique</span>
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {c.delivery.tracking_number}
                              </span>
                            </div>

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

                              const stageLabels: Record<string, string> = {
                                request_received: 'Demande reçue',
                                processing: 'Traitement du dossier',
                                preparation: 'Préparation & Gravure',
                                transit: 'En transit express',
                                customs: 'Dédouanement sécurisé',
                                delivered: 'Carte livrée'
                              };

                              return (
                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-6 gap-1">
                                    {stages.map((st, idx) => (
                                      <div
                                        key={st}
                                        className={`h-1.5 rounded-full transition-all ${
                                          idx <= currentIndex ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                        title={stageLabels[st]}
                                      />
                                    ))}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                    <span>Étape {currentIndex + 1}/6 :</span>
                                    <strong className="text-amber-600 dark:text-amber-400">
                                      {stageLabels[c.delivery.current_stage] || c.delivery.current_stage}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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

                  {/* Formulaire de soumission avec validation obligatoire des conditions */}
                  <form onSubmit={handleLoanSubmit} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    {/* Message d'information et bouton pour consulter les conditions */}
                    {!termsAccepted ? (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            Veuillez consulter les conditions de prêt et donner votre accord pour pouvoir soumettre la demande.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Consulter les conditions de prêt</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Conditions de prêt consultées et accord formel accordé.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-[11px] underline font-bold cursor-pointer"
                        >
                          Revoir
                        </button>
                      </div>
                    )}

                    {/* Bouton soumettre ma demande : inactif / désactivé tant que conditions non validées */}
                    <button
                      type="submit"
                      disabled={!termsAccepted || loading}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                        termsAccepted && !loading
                          ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-amber-600/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      <span>{loading ? 'Envoi en cours...' : 'Soumettre ma demande'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* My Financing Applications (Section 38, 39, 40) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {currentLang === 'fr' ? 'Mes Demandes de Financement' : t.myLoans}
                </h4>
                {loans.some((l) => l.status === 'approved' && !l.credit_parameters_agreed) && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                    Action requise : Paramètres de crédit à valider
                  </span>
                )}
              </div>

              {/* Message d'information pour prêt approuvé */}
              {loans.some((l) => l.status === 'approved' && !l.credit_parameters_agreed) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Votre demande de prêt a été approuvée !</strong>
                    <span>Veuillez consulter les paramètres de crédit et donner votre accord pour que les fonds soient débloqués.</span>
                  </div>
                </div>
              )}

              {loans.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {currentLang === 'fr' ? 'Aucun dossier de crédit actuellement soumis.' : 'No financing dossiers currently submitted.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Projet</th>
                        <th className="py-2.5 px-3">Montant</th>
                        <th className="py-2.5 px-3">Durée</th>
                        <th className="py-2.5 px-3">Taux</th>
                        <th className="py-2.5 px-3">Mensualité</th>
                        <th className="py-2.5 px-3 text-center">Statut Prêt</th>
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
                          <td className="py-3 px-3">{l.duration_months} Mois</td>
                          <td className="py-3 px-3 font-mono">{l.rate_percent}%</td>
                          <td className="py-3 px-3 font-mono">
                            {formatCurrency(l.monthly_payment, l.currency)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                l.status === 'funds_released'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : l.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : l.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {l.status === 'funds_released'
                                ? 'Fonds Débloqués'
                                : l.status === 'approved'
                                ? 'Approuvé'
                                : l.status === 'rejected'
                                ? 'Rejeté'
                                : 'En attente'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                            {/* Le bouton Paramètres de crédit s'affiche UNIQUEMENT si le prêt a été approuvé par l'administrateur */}
                            {(l.status === 'approved' || l.status === 'funds_released') && (
                              <button
                                type="button"
                                onClick={() => setSelectedLoanForParams(l)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                                  !l.credit_parameters_agreed
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {l.credit_parameters_agreed ? 'Paramètres validés' : 'Paramètres de crédit'}
                              </button>
                            )}

                            <button
                              type="button"
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
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                            >
                              PDF Contrat
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

                  {/* Case à cocher et validation complètement en bas */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <input
                        type="checkbox"
                        checked={termsAgreedInModal}
                        onChange={(e) => setTermsAgreedInModal(e.target.checked)}
                        className="mt-0.5 accent-amber-600 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold">
                        J'approuve et je donne mon accord aux conditions de prêt institutionnel, au tableau d'amortissement et aux engagements contractuels.
                      </span>
                    </label>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
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
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        <span>Télécharger les conditions (PDF)</span>
                      </button>

                      <button
                        type="button"
                        disabled={!termsAgreedInModal}
                        onClick={() => {
                          setTermsAccepted(true);
                          setShowTermsModal(false);
                          flash('Accord donné avec succès ! Le bouton « Soumettre ma demande » est désormais actif.');
                        }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                          termsAgreedInModal
                            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-amber-600/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        Approuver et donner mon accord
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal : Consultation et Validation des Paramètres de Crédit */}
            {selectedLoanForParams && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-amber-500" />
                        <span>Paramètres de Crédit · Dossier #{selectedLoanForParams.id}</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Examen des conditions finales préalables au déblocage des fonds
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLoanForParams(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 leading-relaxed">
                      Votre demande de prêt a été officiellement approuvée par le comité de crédit. Veuillez examiner les paramètres financiers ci-dessous et cliquer sur <strong>« Valider »</strong> afin de notifier la direction financière pour le déblocage immédiat de vos fonds.
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Type de Projet</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedLoanForParams.project_type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Montant Emprunté</span>
                        <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                          {formatCurrency(selectedLoanForParams.amount, selectedLoanForParams.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Taux Annuel (TAEG)</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedLoanForParams.rate_percent}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Durée Remboursement</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedLoanForParams.duration_months} mois</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Mensualité Estimée</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(selectedLoanForParams.monthly_payment, selectedLoanForParams.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Coût Total Estimé</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(selectedLoanForParams.total_cost, selectedLoanForParams.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                      <strong className="block text-slate-900 dark:text-white font-semibold">Conditions de déblocage :</strong>
                      <p>
                        En validant ces paramètres, vous confirmez votre accord irrévocable sur les modalités de remboursement mensuel prélevées sur votre compte principal #{account.account_number}.
                      </p>
                      <p>
                        Une notification sera transmise en temps réel au service d'administration afin d'exécuter l'ordre de déblocage des liquidités sur votre solde.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        generateLoanTermsPdf(
                          selectedLoanForParams.project_type,
                          selectedLoanForParams.amount,
                          selectedLoanForParams.currency,
                          selectedLoanForParams.duration_months,
                          selectedLoanForParams.rate_percent,
                          user,
                          settings
                        )
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>Télécharger en PDF</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLoanForParams(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Fermer
                      </button>
                      <button
                        type="button"
                        disabled={loading || selectedLoanForParams.credit_parameters_agreed}
                        onClick={() => handleAgreeParameters(selectedLoanForParams.id)}
                        className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                          selectedLoanForParams.credit_parameters_agreed
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/20'
                        }`}
                      >
                        {selectedLoanForParams.credit_parameters_agreed ? 'Déjà Validé' : 'Valider'}
                      </button>
                    </div>
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
                    <option value="MXN">MXN — Peso Mexicain ($ / MXN)</option>
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
                    <option value="MXN">MXN — Peso Mexicain ($ / MXN)</option>
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

        {/* MODAL: DEMANDE DE NOUVELLE CARTE BANCAIRE (2 ÉTAPES) */}
        {showRequestCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Demande de nouvelle carte bancaire
                    </h3>
                    <p className="text-xs text-slate-500">
                      {cardRequestStep === 1
                        ? 'Étape 1/2 : Choisissez votre réseau de paiement'
                        : 'Étape 2/2 : Choisissez la gamme de carte'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequestCardModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* ÉTAPE 1 : CHOIX DU RÉSEAU (VISA OU MASTERCARD) AVEC DEUX GROS BOUTONS DISTINCTS */}
              {cardRequestStep === 1 && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Sélectionnez le réseau international pour votre nouvelle carte bancaire :
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* BOUTON 1 : VISA */}
                    <button
                      type="button"
                      onClick={() => setNewCardNetwork('visa')}
                      className={`p-5 rounded-2xl border-2 text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                        newCardNetwork === 'visa'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white shadow-lg ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-sans font-black italic tracking-tighter text-2xl text-blue-400 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                          VISA
                        </div>
                        {newCardNetwork === 'visa' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Réseau Visa International</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Acceptée mondialement · Débit immédiat & paiements sans contact
                        </div>
                      </div>
                    </button>

                    {/* BOUTON 2 : MASTERCARD */}
                    <button
                      type="button"
                      onClick={() => setNewCardNetwork('mastercard')}
                      className={`p-5 rounded-2xl border-2 text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                        newCardNetwork === 'mastercard'
                          ? 'border-amber-500 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white shadow-lg ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center -space-x-3">
                          <div className="w-8 h-8 rounded-full bg-rose-600/90 shadow-md" />
                          <div className="w-8 h-8 rounded-full bg-amber-500/90 shadow-md" />
                        </div>
                        {newCardNetwork === 'mastercard' && (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Mastercard World</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Protection 3D Secure · Plafonds élevés & conciergerie
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowRequestCardModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardRequestStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                    >
                      <span>Continuer vers le choix de la gamme</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : CHOIX DE LA GAMME (STANDARD, GOLD, PREMIUM) */}
              {cardRequestStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Réseau sélectionné :</span>
                    <span className="font-bold uppercase px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {newCardNetwork}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'premium' as CardTier,
                        name: 'Carte Premium Infinite Metal',
                        dailyLimit: 50000,
                        monthlyLimit: 100000,
                        desc: 'Haute capacité financière — Conciergerie privée 24/7 & fabrication carte métal gravée au laser.',
                        badge: 'Exclusif'
                      },
                      {
                        id: 'gold' as CardTier,
                        name: 'Carte Gold Prestige',
                        dailyLimit: 20000,
                        monthlyLimit: 25000,
                        desc: 'Plafonds étendus — Assurances voyages complètes & assistance bancaire prioritaire.',
                        badge: 'Recommandé'
                      },
                      {
                        id: 'standard' as CardTier,
                        name: 'Carte Standard Digital',
                        dailyLimit: 5000,
                        monthlyLimit: 10000,
                        desc: 'Plafonds de base — Gestion courante, paiements en ligne et retraits sécurisés.',
                        badge: 'Standard'
                      }
                    ].map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setNewCardTier(tier.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          newCardTier === tier.id
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {tier.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {tier.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                            {tier.desc}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700/60 shrink-0 text-right">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Limite journalière</span>
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatCurrency(tier.dailyLimit, account.currency)} / jour
                            </span>
                          </div>
                          <div className="text-right mt-1">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Limite mensuelle</span>
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                              {formatCurrency(tier.monthlyLimit, account.currency)} / mois
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCardRequestStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      ← Retour au réseau
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={submitCardRequest}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{loading ? 'Envoi...' : 'Envoyer ma demande'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL POPUP : SUCCÈS DEMANDE DE CARTE */}
        {cardRequestSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  {cardRequestSuccessModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {cardRequestSuccessModal.message}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCardRequestSuccessModal(null)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-md transition-colors"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL POPUP : SUCCÈS TRANSFERT DEPUIS SOLDE PRINCIPAL (Transfert effectué) */}
        {transferSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  {transferSuccessModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {transferSuccessModal.message}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTransferSuccessModal(null)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md transition-colors"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL POPUP : ACTION SUR CARTE (INACTIVE, EN COURS, TRANSFERT BLOQUÉ) */}
        {cardActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  {cardActionModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {cardActionModal.message}
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <a
                  href={`mailto:${settings?.support_email || 'support@movafi-groupes.com'}?subject=Assistance%20Carte%20Client%20${account.client_id}`}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Contacter le service client</span>
                </a>
                <button
                  type="button"
                  onClick={() => setCardActionModal(null)}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL POPUP : SOUMISSION DE PRÊT SUCCÈS */}
        {loanSubmissionSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  {loanSubmissionSuccessModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {loanSubmissionSuccessModal.message}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setLoanSubmissionSuccessModal(null)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-md transition-colors"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL POPUP : VALIDATION PARAMÈTRES DE CRÉDIT SUCCÈS */}
        {loanParamsSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  {loanParamsSuccessModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {loanParamsSuccessModal.message}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setLoanParamsSuccessModal(null)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md transition-colors"
                >
                  Fermer
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
