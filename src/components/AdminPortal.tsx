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
  Shield,
  Menu,
  Copy,
  Check,
  FileText,
  Download,
  EyeOff,
  Save,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import {
  UserProfile,
  BankAccount,
  AccountStatus,
  ApplicationStatus,
  SupportedCurrency,
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

  // Drawer Hamburger Menu State
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // -------------------------------------------------------------
  // GESTION DES COMPTES CLIENTS (Grand Livre)
  // -------------------------------------------------------------
  const [accountsList, setAccountsList] = useState<{ account: BankAccount; profile: UserProfile | null }[]>([]);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('all');
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsTotal, setAccountsTotal] = useState(0);

  // Modal Ma Fiche Client & États Brouillon (Enregistrer les modifications)
  const [selectedFileAccountId, setSelectedFileAccountId] = useState<string | null>(null);
  const [fileDetail, setFileDetail] = useState<{
    account: BankAccount;
    profile: UserProfile;
    transactions: Transaction[];
    cards: BankCard[];
    loans: LoanApplication[];
  } | null>(null);

  // États locaux de modifications dans Ma Fiche
  const [draftAccountStatus, setDraftAccountStatus] = useState<AccountStatus>('inactive');
  const [draftApplicationStatus, setDraftApplicationStatus] = useState<ApplicationStatus>('pending');
  const [draftCatCode, setDraftCatCode] = useState('');
  const [draftCotCode, setDraftCotCode] = useState('');
  const [draftBalance, setDraftBalance] = useState<number>(0);

  // Identifiants Secrets (Consultation & Maintenance)
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Édition des informations du profil dans Ma Fiche
  const [isEditingProfile, setIsEditingProfile] = useState(true); // Toujours éditable directement
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [editResidenceCountry, setEditResidenceCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editMonthlyIncome, setEditMonthlyIncome] = useState('');
  const [editIncomeBracket, setEditIncomeBracket] = useState('');
  const [editAccountType, setEditAccountType] = useState<'Personal' | 'Business'>('Personal');
  const [editCurrency, setEditCurrency] = useState<SupportedCurrency>('USD');

  // Visualiseur de documents KYC réaliste à l'écran
  const [previewDoc, setPreviewDoc] = useState<{
    type: 'proof_of_address' | 'id_document';
    title: string;
    filename: string;
  } | null>(null);

  const copyToClipboard = (text: string, keyName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    notify(`${label} copié dans le presse-papier !`);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleDownloadDoc = (filename: string, docTitle: string) => {
    const content = `MOVAFI BANK UNITED STATES - DOSSIER OFFICIEL DE CONFORMITÉ KYC\n\nIntitulé: ${docTitle}\nFichier: ${filename}\nTitulaire: ${fileDetail?.profile?.first_name} ${fileDetail?.profile?.last_name}\nIdentifiant Client: ${fileDetail?.account?.client_id}\nNuméro de Compte: ${fileDetail?.account?.account_number}\nIBAN: ${fileDetail?.account?.iban}\nDate d'audit: ${new Date().toISOString()}\nStatut: Certifié conforme et chiffré dans le coffre-fort d'audit Movafi Bank`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    notify(`Document « ${filename} » téléchargé.`);
  };

  // Crédit / Débit de solde dans Ma Fiche
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
      if (res.success && res.account && res.profile) {
        setFileDetail({
          account: res.account,
          profile: res.profile,
          transactions: res.transactions || [],
          cards: res.cards || [],
          loans: res.loans || []
        });

        // Initialisation des statuts brouillons
        setDraftAccountStatus(res.account.account_status || 'inactive');
        setDraftApplicationStatus(res.account.application_status || res.profile.application_status || 'pending');
        setDraftCatCode(res.account.cat_code || '');
        setDraftCotCode(res.account.cot_code || '');
        setDraftBalance(res.account.balance || 0);

        // Initialisation des champs du profil
        setEditFirstName(res.profile.first_name || '');
        setEditLastName(res.profile.last_name || '');
        setEditPhone(res.profile.phone || '');
        setEditNationality(res.profile.nationality || 'United States');
        setEditResidenceCountry(res.profile.residence_country || 'United States');
        setEditCity(res.profile.city || '');
        setEditOccupation(res.profile.occupation || '');
        setEditMonthlyIncome(String(res.profile.monthly_income || ''));
        setEditIncomeBracket(res.profile.income_bracket || '');
        setEditAccountType(res.profile.account_type || 'Personal');
        setEditCurrency(res.account.currency || 'USD');

        setShowPassword(false);
        setShowPin(false);
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedFileAccountId || !adjustAmount || !adjustReason) {
      notify('Veuillez renseigner un montant valide et un motif d\'audit obligatoire.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.admin.adjustBalance(selectedFileAccountId, adjustType, Number(adjustAmount), adjustReason);
      if (res.success) {
        notify(`Ajustement de solde comptable (${adjustType === 'credit' ? 'Crédit' : 'Débit'}) exécuté avec succès.`);
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

  // Régénération individuelle du code CAT
  const handleRegenerateCat = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.regenerateCatCode(selectedFileAccountId);
      if (res.success && res.cat_code) {
        setDraftCatCode(res.cat_code);
        notify('Nouveau Code d\'Autorisation de Transfert (CAT) généré individuellement.');
      } else {
        notify(res.message || 'Erreur lors de la génération du code CAT', 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Régénération individuelle du code COT
  const handleRegenerateCot = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.regenerateCotCode(selectedFileAccountId);
      if (res.success && res.cot_code) {
        setDraftCotCode(res.cot_code);
        notify('Nouveau Code d\'Opération de Trésorerie (COT) généré individuellement.');
      } else {
        notify(res.message || 'Erreur lors de la génération du code COT', 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Enregistrer toutes les modifications appliquées dans Ma Fiche
  const handleSaveClientFile = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.saveClientFile(selectedFileAccountId, {
        account_status: draftAccountStatus,
        application_status: draftApplicationStatus,
        balance: draftBalance,
        cat_code: draftCatCode,
        cot_code: draftCotCode,
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        nationality: editNationality,
        residence_country: editResidenceCountry,
        city: editCity,
        occupation: editOccupation,
        monthly_income: Number(editMonthlyIncome) || 0,
        income_bracket: editIncomeBracket,
        account_type: editAccountType,
        currency: editCurrency
      });

      if (res.success) {
        notify('Toutes les modifications ont été enregistrées et appliquées avec succès au compte de ce client.');
        await openBankingFile(selectedFileAccountId);
        await loadAccounts();
      } else {
        notify(res.message || 'Erreur lors de l\'enregistrement des modifications.', 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Annuler les modifications et fermer Ma Fiche
  const handleCancelClientFile = () => {
    setSelectedFileAccountId(null);
    setFileDetail(null);
    notify('Dossier fermé. Aucune modification non enregistrée n\'a été appliquée.');
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
    { id: 'accounts', label: 'Comptes Clients & Portefeuilles', icon: Users },
    { id: 'transactions', label: 'Dépôts & Rapprochements Bancaires', icon: ArrowDownLeft },
    { id: 'cards', label: 'Cartes Bancaires Prestige', icon: CreditCard },
    { id: 'loans', label: 'Demandes de Crédit & Déblocage', icon: Landmark },
    { id: 'rates', label: 'Taux d\'Intérêt des Prêts', icon: Percent },
    { id: 'payment_methods', label: 'Canaux de Dépôt & RIB', icon: DollarSign },
    { id: 'referrals', label: 'Programme de Parrainage & Affiliations', icon: Gift },
    { id: 'email_history', label: 'Historique & Envoi d\'E-mails', icon: Mail },
    { id: 'email_templates', label: 'Modèles d\'E-mails Transactionnels', icon: FileCode },
    { id: 'settings', label: 'Configuration & Identité Banque', icon: Settings },
    { id: 'security_ips', label: 'Sécurité & Filtrage IP', icon: ShieldAlert },
    { id: 'audit_logs', label: 'Journal d\'Audit Centralisé', icon: ClipboardList }
  ];

  const currentNav = navItems.find((item) => item.id === activeSection) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar with Hamburger Button in Top-Left */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Hamburger Menu Button in Top-Left */}
          <button
            onClick={() => setIsNavDrawerOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-slate-700/80 shadow-sm cursor-pointer transition-colors flex items-center gap-2"
            title="Ouvrir le menu de navigation de la console"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-semibold hidden md:inline text-slate-200">Menu Onglets</span>
          </button>

          <MovafiLogo size="sm" showText={false} onClick={onExit} />
          
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span className="hidden sm:inline">ADMINISTRATION EXÉCUTIVE MOVAFI BANK</span>
              <span className="sm:hidden">MOVAFI ADMIN</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                RÔLE : {currentUser.admin_role?.toUpperCase() || 'ADMINISTRATEUR'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-none">
              Signataire habilité : {currentUser.first_name} {currentUser.last_name} ({currentUser.email})
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-3 sm:px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quitter vers le site</span>
          <span className="sm:hidden">Quitter</span>
        </button>
      </header>

      {/* Hamburger Drawer Modal (Menu Déroulant Latéral avec tous les onglets) */}
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsNavDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800 p-5 flex flex-col h-full z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <MovafiLogo size="sm" showText={false} />
                <div>
                  <h3 className="font-bold text-sm text-white">Console Administrateur</h3>
                  <p className="text-[10px] text-amber-500 font-mono">12 modules de gestion</p>
                </div>
              </div>
              <button
                onClick={() => setIsNavDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of all tabs */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as any);
                      setIsNavDrawerOpen(false);
                    }}
                    className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsNavDrawerOpen(false);
                  onExit();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quitter l'administration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-bar showing active module & Quick Menu Button */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Onglet actif :</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1.5">
            <currentNav.icon className="w-3.5 h-3.5" />
            <span>{currentNav.label}</span>
          </span>
        </div>
        <button
          onClick={() => setIsNavDrawerOpen(true)}
          className="text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Changer d'onglet</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Content Viewport (Full width without horizontal tabs) */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-full overflow-x-hidden">
          {/* ======================================================= */}
          {/* 1. COMPTES CLIENTS (Grand Livre) */}
          {/* ======================================================= */}
          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Grand Livre des Comptes Clients</h2>
                  <p className="text-xs text-slate-400">
                    Nombre total de portefeuilles enregistrés : {accountsTotal}
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
                      placeholder="Rechercher par nom, e-mail, IBAN, N° compte..."
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 w-64"
                    />
                  </div>

                  <select
                    value={accountsStatusFilter}
                    onChange={(e) => setAccountsStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                    <option value="rejected">Rejeté</option>
                  </select>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Client & Titulaire</th>
                      <th className="py-3 px-4">Compte / IBAN</th>
                      <th className="py-3 px-4 text-right">Solde Réconcilié</th>
                      <th className="py-3 px-4 text-center">Statut Compte</th>
                      <th className="py-3 px-4 text-center">Décision Demande</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {accountsList.map(({ account, profile }) => {
                      const appStatus = account.application_status || profile?.application_status || 'pending';
                      return (
                        <tr key={account.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">
                              {profile ? `${profile.first_name} ${profile.last_name}` : 'Titulaire inconnu'}
                            </div>
                            <div className="text-[11px] text-slate-400">{profile?.email}</div>
                            <div className="text-[10px] text-amber-500/80 font-mono">ID: {account.client_id}</div>
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
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                account.account_status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : account.account_status === 'inactive'
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : account.account_status === 'suspended'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {account.account_status === 'active'
                                ? 'Actif'
                                : account.account_status === 'inactive'
                                ? 'Inactif'
                                : account.account_status === 'suspended'
                                ? 'Suspendu'
                                : 'En attente'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                appStatus === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : appStatus === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {appStatus === 'approved'
                                ? 'Approuvée'
                                : appStatus === 'rejected'
                                ? 'Rejetée'
                                : 'En attente'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => openBankingFile(account.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Gérer le dossier
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                              title="Supprimer ce compte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ======================================================= */}
              {/* MODAL : MA FICHE CLIENT (Dossier Complet & Actions) */}
              {/* ======================================================= */}
              {selectedFileAccountId && fileDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
                  <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-950/70 shrink-0">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <span>Dossier Bancaire : {fileDetail.profile.first_name} {fileDetail.profile.last_name}</span>
                          </h3>
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ID: {fileDetail.account.client_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Compte N° {fileDetail.account.account_number} · IBAN: {fileDetail.account.iban} · BIC: {fileDetail.account.bic_swift}
                        </p>
                      </div>
                      <button
                        onClick={handleCancelClientFile}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Fermer le dossier"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
                      
                      {/* SECTION 1: SOLDE ET IDENTIFIANTS SECRETS DE PORTAIL */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Solde Réconcilié */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                              Solde Réconcilié du Compte
                            </span>
                            <div className="text-2xl font-mono font-black text-amber-400">
                              {formatCurrency(draftBalance, editCurrency)}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                              Devise : {editCurrency}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-2">
                            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Ajustement comptable immédiat :</span>
                            <div className="flex gap-1.5">
                              <select
                                value={adjustType}
                                onChange={(e) => setAdjustType(e.target.value as any)}
                                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                              >
                                <option value="credit">Crédit (+)</option>
                                <option value="debit">Débit (-)</option>
                              </select>
                              <input
                                type="number"
                                min={1}
                                value={adjustAmount}
                                onChange={(e) => setAdjustAmount(e.target.value)}
                                placeholder="Montant..."
                                className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                              />
                            </div>
                            <input
                              type="text"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              placeholder="Motif audit obligatoire..."
                              className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                            />
                            <button
                              onClick={handleAdjustBalance}
                              disabled={loading}
                              className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Appliquer ajustement ({adjustType.toUpperCase()})
                            </button>
                          </div>
                        </div>

                        {/* Mot de passe de portail client */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                                Mot de Passe Portail Client
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">
                                Maintenance
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mb-2">
                              Mot de passe confidentiel d'accès au portail pour consultation et maintenance en cas de besoin client.
                            </p>
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-white tracking-wider select-all truncate pr-2">
                                {showPassword ? (fileDetail.profile.portal_password || '********') : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
                                title={showPassword ? 'Masquer' : 'Afficher'}
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 mt-3">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(fileDetail.profile.portal_password || '', 'password', 'Mot de passe portail')}
                              className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedKey === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedKey === 'password' ? 'Copié !' : 'Copier le mot de passe'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Code PIN secret à 6 chiffres */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                                Code PIN Secret (6 Chiffres)
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase">
                                Sécurité
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mb-2">
                              Code PIN secret de validation des transactions à 6 chiffres pour maintenance administrative.
                            </p>
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                              <span className="font-mono text-base font-bold text-amber-300 tracking-[0.3em] select-all truncate pr-2">
                                {showPin ? (fileDetail.profile.portal_pin || '******') : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
                                title={showPin ? 'Masquer' : 'Afficher'}
                              >
                                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 mt-3">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(fileDetail.profile.portal_pin || '', 'pin', 'Code PIN secret')}
                              className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedKey === 'pin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedKey === 'pin' ? 'Copié !' : 'Copier le code PIN'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: STATUTS DISTINCTS (STATUT COMPTE vs DÉCISION DE DEMANDE) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span>Contrôle des Statuts et Décisions (Indépendants)</span>
                          </h4>
                          <span className="text-[10px] text-slate-400">Les modifications prennent effet lors du clic sur Enregistrer</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Statut Actif / Inactif du Compte */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300">1. Statut Actuel du Compte :</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                                  draftAccountStatus === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : draftAccountStatus === 'inactive'
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : draftAccountStatus === 'suspended'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                }`}
                              >
                                {draftAccountStatus === 'active'
                                  ? 'Actif'
                                  : draftAccountStatus === 'inactive'
                                  ? 'Inactif'
                                  : draftAccountStatus === 'suspended'
                                  ? 'Suspendu'
                                  : 'En attente'}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-tight">
                              Permet d'autoriser ou de restreindre les connexions et opérations bancaires du client.
                            </p>

                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setDraftAccountStatus('active')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftAccountStatus === 'active'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                Activer
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftAccountStatus('inactive')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftAccountStatus === 'inactive'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                }`}
                              >
                                Désactiver
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftAccountStatus('suspended')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftAccountStatus === 'suspended'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                Suspendre
                              </button>
                            </div>
                          </div>

                          {/* 2. Décision sur la Demande d'Ouverture */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300">2. Décision de la Demande :</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                                  draftApplicationStatus === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : draftApplicationStatus === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                }`}
                              >
                                {draftApplicationStatus === 'approved'
                                  ? 'Approuvée'
                                  : draftApplicationStatus === 'rejected'
                                  ? 'Rejetée'
                                  : 'En attente'}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-tight">
                              Décision administrative relative à la demande d'adhésion et de création du compte.
                            </p>

                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setDraftApplicationStatus('approved')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftApplicationStatus === 'approved'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                Approuver
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftApplicationStatus('pending')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftApplicationStatus === 'pending'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                En attente
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftApplicationStatus('rejected')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  draftApplicationStatus === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: CODES DE SÉCURITÉ INTERNES (CAT & COT INDIVIDUELS) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span>Codes de Sécurité Internes Individuels (CAT & COT)</span>
                          </h4>
                          <span className="text-[10px] text-slate-400">Génération et copie totalement individuelles</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Code CAT */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Code d'Autorisation de Transfert (CAT)</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">Étape 2</span>
                              </div>
                              <div className="text-base font-mono font-bold text-amber-300 mt-1.5 tracking-wider select-all">
                                {draftCatCode || 'CAT-NON-GÉNÉRÉ'}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Requis pour l'autorisation de virement sortant.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(draftCatCode, 'cat', 'Code CAT')}
                                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === 'cat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKey === 'cat' ? 'Copié !' : 'Copier CAT'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRegenerateCat}
                                disabled={loading}
                                className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Régénérer CAT</span>
                              </button>
                            </div>
                          </div>

                          {/* Code COT */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Code d'Opération de Trésorerie (COT)</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">Étape 3</span>
                              </div>
                              <div className="text-base font-mono font-bold text-amber-300 mt-1.5 tracking-wider select-all">
                                {draftCotCode || 'COT-NON-GÉNÉRÉ'}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Requis pour validation par le gestionnaire de trésorerie.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(draftCotCode, 'cot', 'Code COT')}
                                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === 'cot' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKey === 'cot' ? 'Copié !' : 'Copier COT'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRegenerateCot}
                                disabled={loading}
                                className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Régénérer COT</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: INFORMATIONS COMPLÈTES SAISIES LORS DE LA CRÉATION DU COMPTE */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                            Informations Complètes du Dossier Client (État Civil, Domicile, Activité, Revenus)
                          </h4>
                          <span className="text-[10px] text-amber-400 font-semibold">Champs modifiables</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Prénom</label>
                            <input
                              type="text"
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nom de famille</label>
                            <input
                              type="text"
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Adresse E-mail</label>
                            <input
                              type="email"
                              disabled
                              value={fileDetail.profile.email}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Téléphone International</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Nationalité</label>
                            <input
                              type="text"
                              value={editNationality}
                              onChange={(e) => setEditNationality(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Pays de Résidence</label>
                            <input
                              type="text"
                              value={editResidenceCountry}
                              onChange={(e) => setEditResidenceCountry(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Ville de Résidence</label>
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Structure du Compte</label>
                            <select
                              value={editAccountType}
                              onChange={(e) => setEditAccountType(e.target.value as any)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="Personal">Compte Privé (Personal)</option>
                              <option value="Business">Trésorerie d'Entreprise (Corporate)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Profession / Activité</label>
                            <input
                              type="text"
                              value={editOccupation}
                              onChange={(e) => setEditOccupation(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Tranche de Revenus</label>
                            <select
                              value={editIncomeBracket}
                              onChange={(e) => {
                                setEditIncomeBracket(e.target.value);
                                if (e.target.value === '0 - 2 000') setEditMonthlyIncome('1500');
                                else if (e.target.value === '2 000 - 5 000') setEditMonthlyIncome('3500');
                                else if (e.target.value === '5 000 - 10 000') setEditMonthlyIncome('7500');
                                else if (e.target.value === '10 000 - 25 000') setEditMonthlyIncome('15000');
                                else if (e.target.value === '25 000 ou plus') setEditMonthlyIncome('30000');
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">Sélectionner une tranche...</option>
                              <option value="0 - 2 000">Entre 0 et 2 000</option>
                              <option value="2 000 - 5 000">Entre 2 000 et 5 000</option>
                              <option value="5 000 - 10 000">Entre 5 000 et 10 000</option>
                              <option value="10 000 - 25 000">Entre 10 000 et 25 000</option>
                              <option value="25 000 ou plus">25 000 ou plus</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Revenu Mensuel ({editCurrency})</label>
                            <input
                              type="number"
                              value={editMonthlyIncome}
                              onChange={(e) => setEditMonthlyIncome(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Devise Principale</label>
                            <select
                              value={editCurrency}
                              onChange={(e) => setEditCurrency(e.target.value as SupportedCurrency)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="CAD">CAD (C$)</option>
                              <option value="MXN">MXN ($ / Peso)</option>
                              <option value="BHD">BHD (د.ب / BHD)</option>
                              <option value="SAR">SAR (ر.س / SAR)</option>
                              <option value="AED">AED (د.إ / AED)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 5: JUSTIFICATIF DE DOMICILE ET PIÈCE D'IDENTITÉ (VISUALISATION DIRECTE À L'ÉCRAN) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span>Documents de Conformité KYC Déposés (Visualisation Directe)</span>
                          </h4>
                          <span className="text-[10px] text-slate-400">Chiffrement AES-256 · Consultation instantanée</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* 1. Justificatif de Domicile */}
                          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">Justificatif de Domicile</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                                  DÉPOSÉ
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                                {fileDetail.profile.proof_of_address_name || 'Facture_Electricite_EDF_Justificatif_Domicile.pdf'}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Facture de service public certifiant la domiciliation à : {fileDetail.profile.city}, {fileDetail.profile.residence_country}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({
                                  type: 'proof_of_address',
                                  title: 'Justificatif Officiel de Domicile & Résidence',
                                  filename: fileDetail.profile.proof_of_address_name || 'Facture_Electricite_EDF_Justificatif_Domicile.pdf'
                                })}
                                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Consulter à l'écran</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(
                                  fileDetail.profile.proof_of_address_name || 'Facture_Electricite_EDF_Justificatif_Domicile.pdf',
                                  'Justificatif de Domicile'
                                )}
                                className="flex-1 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Télécharger</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. Pièce d'Identité / Passeport */}
                          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">Pièce d'Identité / Passeport</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                                  DÉPOSÉ
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                                {fileDetail.profile.id_document_name || 'Passeport_International_Officiel.pdf'}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Document gouvernemental d'identité de : {fileDetail.profile.first_name} {fileDetail.profile.last_name} ({fileDetail.profile.nationality})
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({
                                  type: 'id_document',
                                  title: 'Pièce d\'Identité Gouvernementale & Passeport',
                                  filename: fileDetail.profile.id_document_name || 'Passeport_International_Officiel.pdf'
                                })}
                                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Consulter à l'écran</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(
                                  fileDetail.profile.id_document_name || 'Passeport_International_Officiel.pdf',
                                  'Pièce d\'Identité / Passeport'
                                )}
                                className="flex-1 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Télécharger</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SECTION 6: BARRE FIXE EN BAS DE MA FICHE (ENREGISTRER & ANNULER) */}
                    <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Les modifications apportées doivent être enregistrées pour prendre effet sur le compte client.</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleCancelClientFile}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveClientFile}
                          disabled={loading}
                          className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/20"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ======================================================= */}
              {/* MODAL : VISUALISEUR RÉALISTE DE DOCUMENT KYC À L'ÉCRAN */}
              {/* ======================================================= */}
              {previewDoc && fileDetail && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
                  <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-7 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>{previewDoc.title}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{previewDoc.filename}</p>
                      </div>
                      <button
                        onClick={() => setPreviewDoc(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Authentic Document Rendered Directly On Screen */}
                    <div className="p-6 sm:p-8 rounded-xl bg-white text-slate-900 shadow-inner border border-slate-300 space-y-6 font-sans">
                      {/* Document Header */}
                      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                        <div>
                          <div className="text-xs uppercase font-extrabold tracking-widest text-slate-500">
                            {previewDoc.type === 'proof_of_address'
                              ? "Fournisseur d'Énergie & Distribution de Services Publics"
                              : "Ministère de l'Intérieur & Titres Sécurisés"}
                          </div>
                          <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 mt-1">
                            {previewDoc.type === 'proof_of_address'
                              ? 'JUSTIFICATIF OFFICIEL DE DOMICILIATION & RÉSIDENCE'
                              : 'DOCUMENT D\'IDENTIFICATION GOUVERNEMENTAL SÉCURISÉ'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Certificat Réf : {previewDoc.type === 'proof_of_address' ? 'DOM-2026-' : 'IDN-2026-'}
                            {fileDetail.account.account_number.slice(-6)} · Enregistrement Central Movafi
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] uppercase">
                            ✓ Document Authentifié
                          </span>
                        </div>
                      </div>

                      {/* Client & Document Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Titulaire du Document</span>
                          <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                            {fileDetail.profile.first_name} {fileDetail.profile.last_name}
                          </div>
                          <div className="text-slate-600 mt-1 font-medium">
                            E-mail : {fileDetail.profile.email}
                          </div>
                          <div className="text-slate-600 font-medium">
                            Tél : {fileDetail.profile.phone || '+1 (555) 000-0000'}
                          </div>
                          <div className="text-slate-600 font-medium">
                            Nationalité : {fileDetail.profile.nationality}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            {previewDoc.type === 'proof_of_address' ? 'Adresse de Domiciliation Certifiée' : 'Statut de Validité'}
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {fileDetail.profile.city || 'Résidence Principale'}
                          </div>
                          <div className="font-semibold text-amber-700">
                            {fileDetail.profile.residence_country}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1 font-mono">
                            Date d'enregistrement : {new Date(fileDetail.profile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Security Seal Notice */}
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>Ce document est stocké dans le coffre-fort d'audit chiffré de Movafi Bank United States avec signature cryptographique.</span>
                        </div>
                        <div className="text-right font-mono text-[10px] font-bold shrink-0 pl-2">
                          SHA256: 8f4a...92b1
                        </div>
                      </div>

                      {/* Footer Stamp */}
                      <div className="flex items-end justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-500">
                        <div>
                          <div>Département de Conformité & KYC Movafi Bank United States</div>
                          <div className="font-mono text-[9px] text-slate-400">Identifiant Dossier: {fileDetail.account.client_id}</div>
                        </div>
                        <div className="w-28 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 uppercase bg-slate-100 font-bold">
                          [ SCEAU OFFICIEL ]
                        </div>
                      </div>
                    </div>

                    {/* Viewer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-xs text-slate-400">Visualisation directe à l'écran avant décision de téléchargement</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewDoc(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Fermer la vue
                        </button>
                        <button
                          onClick={() => {
                            handleDownloadDoc(previewDoc.filename, previewDoc.title);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger le justificatif</span>
                        </button>
                      </div>
                    </div>
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
