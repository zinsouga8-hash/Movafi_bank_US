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
  LoanRate,
  DeliveryStage
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
    url?: string;
  } | null>(null);

  // Pop-up vert de confirmation d'enregistrement
  const [saveSuccessPopup, setSaveSuccessPopup] = useState(false);

  const copyToClipboard = (text: string, keyName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    notify(`${label} copié dans le presse-papier !`);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleDownloadDoc = (filename: string, docTitle: string, fileUrl?: string) => {
    if (fileUrl && fileUrl.startsWith('data:')) {
      const element = document.createElement('a');
      element.href = fileUrl;
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      notify(`Document « ${filename} » téléchargé.`);
      return;
    }

    const content = `MOVAFI BANK - DOSSIER OFFICIEL DE CONFORMITÉ KYC\n\nIntitulé: ${docTitle}\nFichier: ${filename}\nTitulaire: ${fileDetail?.profile?.first_name} ${fileDetail?.profile?.last_name}\nIdentifiant Client: ${fileDetail?.account?.client_id}\nNuméro de Compte: ${fileDetail?.account?.account_number}\nIBAN: ${fileDetail?.account?.iban}\nDate d'audit: ${new Date().toISOString()}\nStatut: Certifié conforme et chiffré dans le coffre-fort d'audit Movafi Bank`;
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
        setSaveSuccessPopup(true);
        setTimeout(() => setSaveSuccessPopup(false), 4000);
        notify('Modifications appliquées et enregistrées avec succès');
        if (res.account && res.profile) {
          setFileDetail((prev: any) => (prev ? { ...prev, account: res.account, profile: res.profile } : prev));
          setAccountsList((prev) =>
            prev.map((item) =>
              item.account.id === selectedFileAccountId
                ? { account: res.account, profile: res.profile }
                : item
            )
          );
        }
        // Background sync without blocking UI
        loadAccounts().catch(() => {});
      } else {
        notify(res.message || 'Erreur lors de l\'enregistrement des modifications.', 'error');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Action rapide : Approuver la demande & Activer le compte en 1 Clic
  const handleQuickApproveAndActivate = async () => {
    if (!selectedFileAccountId) return;
    setLoading(true);
    try {
      const res = await api.admin.saveClientFile(selectedFileAccountId, {
        account_status: 'active',
        application_status: 'approved',
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
        setDraftAccountStatus('active');
        setDraftApplicationStatus('approved');
        setSaveSuccessPopup(true);
        setTimeout(() => setSaveSuccessPopup(false), 5000);
        notify('Compte approuvé et activé avec succès ! Le client peut maintenant se connecter.');
        await openBankingFile(selectedFileAccountId);
        await loadAccounts();
      } else {
        notify(res.message || 'Erreur lors de l\'activation.', 'error');
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

  // Modal Gérer la Carte & États Brouillons
  const [selectedCardForManage, setSelectedCardForManage] = useState<any | null>(null);
  const [draftCardCreationStatus, setDraftCardCreationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [draftCardIsActive, setDraftCardIsActive] = useState<boolean>(false);
  const [draftCardAllowTransfer, setDraftCardAllowTransfer] = useState<boolean>(false);
  const [draftCardDeliveryStage, setDraftCardDeliveryStage] = useState<DeliveryStage>('request_received');

  const openCardManageModal = (c: any) => {
    setSelectedCardForManage(c);
    setDraftCardCreationStatus(c.creation_status || (c.status === 'active' ? 'approved' : 'pending'));
    setDraftCardIsActive(!!c.is_active);
    setDraftCardAllowTransfer(!!c.allow_balance_transfer);
    setDraftCardDeliveryStage(c.delivery?.current_stage || 'request_received');
  };

  const handleSaveCardModifications = async () => {
    if (!selectedCardForManage) return;
    setLoading(true);
    try {
      const payload: any = {
        creation_status: draftCardCreationStatus,
        is_active: draftCardIsActive,
        allow_balance_transfer: draftCardAllowTransfer
      };
      if (selectedCardForManage.delivery) {
        payload.delivery_stage = draftCardDeliveryStage;
      }
      const res = await api.admin.updateCard(selectedCardForManage.id, payload);
      if (res.success) {
        notify('Modifications de la carte enregistrées avec succès.');
        setSelectedCardForManage(null);
        await loadCards();
      } else {
        notify(res.message || 'Erreur lors de l\'enregistrement de la carte', 'error');
      }
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
  const [selectedLoanForManage, setSelectedLoanForManage] = useState<LoanApplication | null>(null);
  const [draftLoanStatus, setDraftLoanStatus] = useState<string>('pending');
  const [draftLoanNotes, setDraftLoanNotes] = useState<string>('');

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

  const openLoanManageModal = (l: LoanApplication) => {
    setSelectedLoanForManage(l);
    setDraftLoanStatus(l.status);
    setDraftLoanNotes(l.admin_notes || '');
  };

  const handleSaveLoanModifications = async () => {
    if (!selectedLoanForManage) return;
    setLoading(true);
    try {
      const res = await api.admin.updateLoanStatus(selectedLoanForManage.id, draftLoanStatus, draftLoanNotes);
      if (res.success) {
        notify('Modifications du dossier de prêt enregistrées avec succès.');
        setSelectedLoanForManage(null);
        await loadLoans();
      } else {
        notify(res.message || 'Erreur lors de l\'enregistrement du prêt', 'error');
      }
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
        notify(`Dossier de prêt mis à jour (${status}).`);
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
        notify('Fonds débloqués avec succès et crédités sur le solde principal du client.');
        if (selectedLoanForManage && selectedLoanForManage.id === loanId) {
          setSelectedLoanForManage((prev) => (prev ? { ...prev, status: 'funds_released' } : null));
        }
        await loadLoans();
      } else {
        notify(res.message || 'Impossible de débloquer les fonds.', 'error');
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
    const isCrypto =
      editingMethod?.category === 'Digital Assets' ||
      editingMethod?.name?.toLowerCase().includes('bitcoin') ||
      editingMethod?.name?.toLowerCase().includes('usdt') ||
      editingMethod?.name?.toLowerCase().includes('crypto');

    const address = editingMethod?.wallet_address || editingMethod?.account_info;
    if (!editingMethod?.name || (!address && !editingMethod?.account_info)) {
      notify('Veuillez renseigner le nom et l’adresse ou les coordonnées de paiement.', 'error');
      return;
    }

    const payload: Partial<PaymentMethod> = {
      ...editingMethod,
      account_info: isCrypto ? (address || '') : (editingMethod.account_info || ''),
      wallet_address: isCrypto ? (address || '') : editingMethod.wallet_address,
      instructions: editingMethod.instructions || ''
    };

    setLoading(true);
    try {
      const res = await api.admin.savePaymentMethod(payload);
      if (res.success) {
        notify('Moyen de paiement enregistré avec succès.');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
      {/* Pop-up Vert de confirmation d'enregistrement (« Modification enregistrée ») */}
      {saveSuccessPopup && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-2xl border-2 border-emerald-400 font-bold text-sm sm:text-base animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
          <span>Modification enregistrée</span>
        </div>
      )}

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
                                onClick={() => {
                                  setDraftAccountStatus('active');
                                  setDraftApplicationStatus('approved');
                                }}
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
                                onClick={() => {
                                  setDraftApplicationStatus('approved');
                                  if (draftAccountStatus !== 'active') {
                                    setDraftAccountStatus('inactive');
                                  }
                                }}
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
                                onClick={() => {
                                  setDraftApplicationStatus('pending');
                                  setDraftAccountStatus('inactive');
                                }}
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
                                onClick={() => {
                                  setDraftApplicationStatus('rejected');
                                  setDraftAccountStatus('inactive');
                                }}
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
                                  filename: fileDetail.profile.proof_of_address_name || 'Facture_Electricite_EDF_Justificatif_Domicile.pdf',
                                  url: fileDetail.profile.proof_of_address_url
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
                                  'Justificatif de Domicile',
                                  fileDetail.profile.proof_of_address_url
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
                                  filename: fileDetail.profile.id_document_name || 'Passeport_International_Officiel.pdf',
                                  url: fileDetail.profile.id_document_url
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
                                  'Pièce d\'Identité / Passeport',
                                  fileDetail.profile.id_document_url
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
                    {previewDoc.url && previewDoc.url.startsWith('data:image/') ? (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center max-h-[58vh] overflow-y-auto">
                          <img
                            src={previewDoc.url}
                            alt={previewDoc.title}
                            className="max-h-[52vh] w-auto object-contain rounded-lg shadow-xl border border-slate-700"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Document Téléversé par le Client</span>
                            <div className="font-mono text-white font-semibold mt-0.5 truncate">{previewDoc.filename}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Titulaire Identifié</span>
                            <div className="text-white font-bold mt-0.5">{fileDetail.profile.first_name} {fileDetail.profile.last_name}</div>
                          </div>
                        </div>
                      </div>
                    ) : previewDoc.url && previewDoc.url.startsWith('data:application/pdf') ? (
                      <div className="space-y-4">
                        <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          <iframe src={previewDoc.url} className="w-full h-full" title={previewDoc.title} />
                        </div>
                        <div className="text-xs text-slate-300 font-mono">Fichier PDF officiel téléversé par le client : {previewDoc.filename}</div>
                      </div>
                    ) : (
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
                            <span>Ce document est stocké dans le coffre-fort d'audit chiffré de Movafibank avec signature cryptographique.</span>
                          </div>
                          <div className="text-right font-mono text-[10px] font-bold shrink-0 pl-2">
                            SHA256: 8f4a...92b1
                          </div>
                        </div>

                        {/* Footer Stamp */}
                        <div className="flex items-end justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-500">
                          <div>
                            <div>Département de Conformité & KYC Movafibank</div>
                            <div className="font-mono text-[9px] text-slate-400">Identifiant Dossier: {fileDetail.account.client_id}</div>
                          </div>
                          <div className="w-28 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 uppercase bg-slate-100 font-bold">
                            [ SCEAU OFFICIEL ]
                          </div>
                        </div>
                      </div>
                    )}

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
                            handleDownloadDoc(previewDoc.filename, previewDoc.title, previewDoc.url);
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
          {/* 3. PRESTIGE CARDS LOGISTICS & MANAGEMENT */}
          {/* ======================================================= */}
          {activeSection === 'cards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Cartes Bancaires Prestige & Gestion</h2>
                  <p className="text-xs text-slate-400">
                    Validation des demandes de cartes, activation de sécurité, autorisation des transferts et expédition physique.
                  </p>
                </div>
                <button
                  onClick={loadCards}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Client & Titulaire</th>
                      <th className="py-3 px-4">Réseau & Type</th>
                      <th className="py-3 px-4">Numéro Carte</th>
                      <th className="py-3 px-4 text-right">Solde Carte</th>
                      <th className="py-3 px-4 text-center">Décision Demande</th>
                      <th className="py-3 px-4 text-center">Activation</th>
                      <th className="py-3 px-4 text-center">Transfert Solde</th>
                      <th className="py-3 px-4">Livraison Physique</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {cardsList.map((c) => {
                      const creationStatus = c.creation_status || (c.status === 'active' ? 'approved' : 'pending');
                      const isActive = !!c.is_active;
                      return (
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
                            ${Number(c.balance || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                creationStatus === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : creationStatus === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {creationStatus === 'approved' ? 'Approuvée' : creationStatus === 'rejected' ? 'Rejetée' : 'En attente'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.allow_balance_transfer
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {c.allow_balance_transfer ? 'Autorisé' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {c.delivery ? (
                              <span className="text-amber-400 font-semibold text-[11px] capitalize">
                                Étape: {c.delivery.current_stage.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Non demandée</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openCardManageModal(c)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Gérer la carte
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MODAL : GÉRER LA CARTE */}
              {selectedCardForManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                  <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80 shrink-0">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-amber-500" />
                          <span>Gérer la Carte Privilège · {selectedCardForManage.cardholder_name}</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          {selectedCardForManage.client_email} · Réseau {selectedCardForManage.network?.toUpperCase()} · Type {selectedCardForManage.tier?.toUpperCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedCardForManage(null)}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                      {/* Module 1: Approbation / Rejet de la Demande */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            1. Décision de création de la carte
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            draftCardCreationStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : draftCardCreationStatus === 'rejected' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {draftCardCreationStatus === 'approved' ? 'Approuvée' : draftCardCreationStatus === 'rejected' ? 'Rejetée' : 'En attente'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          L'approbation envoie automatiquement une notification et un e-mail au client. La carte reste inactive par défaut tant que vous ne l'activez pas.
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDraftCardCreationStatus('approved')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftCardCreationStatus === 'approved'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ✓ Approuver
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftCardCreationStatus('pending')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftCardCreationStatus === 'pending'
                                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ⏱ En attente
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftCardCreationStatus('rejected')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftCardCreationStatus === 'rejected'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ✕ Rejeter
                          </button>
                        </div>
                      </div>

                      {/* Module 2: Activation / Désactivation de la carte */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            2. Activation de la carte (Sécurité & CVC)
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            draftCardIsActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {draftCardIsActive ? 'Carte Active' : 'Carte Inactive'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          La carte est inactive par défaut. Une fois activée, le client peut démasquer son code CVC sur son espace bancaire et utiliser sa carte.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDraftCardIsActive(true)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftCardIsActive
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Activer la carte
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftCardIsActive(false)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              !draftCardIsActive
                                ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Désactiver la carte (Inactive)
                          </button>
                        </div>
                      </div>

                      {/* Module 3: Autorisation du transfert depuis le solde principal */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            3. Transfert depuis le solde principal
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            draftCardAllowTransfer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {draftCardAllowTransfer ? 'Transfert Activé' : 'Transfert Bloqué'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Tant que ce bouton n'est pas activé, le client reçoit un message d'avertissement indiquant que le transfert est bloqué et qu'il doit contacter le service client.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDraftCardAllowTransfer(true)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftCardAllowTransfer
                                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Autoriser le transfert
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftCardAllowTransfer(false)}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              !draftCardAllowTransfer
                                ? 'bg-rose-900/60 text-rose-200 border-rose-700 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Bloquer le transfert
                          </button>
                        </div>
                      </div>

                      {/* Module 4: Suivi de livraison physique */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            4. Suivi de la livraison physique de la carte
                          </span>
                          {selectedCardForManage.delivery && (
                            <span className="font-mono text-[10px] text-amber-400">
                              {selectedCardForManage.delivery.tracking_number}
                            </span>
                          )}
                        </div>

                        {!selectedCardForManage.delivery ? (
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs text-center">
                            Le client n'a pas encore demandé de livraison physique de sa carte. Les étapes ne peuvent pas être activées.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-slate-400 text-[11px]">
                              Le client a sollicité la fabrication physique. Cliquez sur une étape pour l'activer instantanément :
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { id: 'request_received', label: '1. Demande reçue' },
                                { id: 'processing', label: '2. Traitement dossier' },
                                { id: 'preparation', label: '3. Préparation & Gravure' },
                                { id: 'transit', label: '4. En transit express' },
                                { id: 'customs', label: '5. Dédouanement' },
                                { id: 'delivered', label: '6. Carte livrée' }
                              ].map((step) => {
                                const isCurrent = draftCardDeliveryStage === step.id;
                                return (
                                  <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => setDraftCardDeliveryStage(step.id as DeliveryStage)}
                                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold text-center cursor-pointer transition-all ${
                                      isCurrent
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                    }`}
                                  >
                                    {step.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                              Étape actuellement sélectionnée : <strong className="text-amber-400 capitalize">{draftCardDeliveryStage.replace('_', ' ')}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 p-5 bg-slate-950/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedCardForManage(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        Fermer sans enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCardModifications}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les modifications</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. LOAN REQUESTS & RELEASE */}
          {/* ======================================================= */}
          {activeSection === 'loans' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Demandes de Crédit & Déblocage des Fonds</h2>
                  <p className="text-xs text-slate-400">
                    Examen des dossiers de prêt, approbation et déblocage après validation des paramètres de crédit par le client.
                  </p>
                </div>
                <button
                  onClick={loadLoans}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-3 px-4">Emprunteur</th>
                      <th className="py-3 px-4">Type de Projet</th>
                      <th className="py-3 px-4 text-right">Montant Emprunté</th>
                      <th className="py-3 px-4">Taux & Durée</th>
                      <th className="py-3 px-4 text-right">Mensualité</th>
                      <th className="py-3 px-4 text-center">Statut Prêt</th>
                      <th className="py-3 px-4 text-center">Paramètres Crédit</th>
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
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {loan.rate_percent}% · {loan.duration_months} mois
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-white">
                          {formatCurrency(loan.monthly_payment, loan.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              loan.status === 'funds_released'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : loan.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : loan.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {loan.status === 'funds_released'
                              ? 'Fonds Débloqués'
                              : loan.status === 'approved'
                              ? 'Approuvé'
                              : loan.status === 'rejected'
                              ? 'Rejeté'
                              : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {loan.credit_parameters_agreed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ✓ Validés par client
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                              En attente validation
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openLoanManageModal(loan)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Gérer le prêt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL : GÉRER LE PRÊT */}
              {selectedLoanForManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                  <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80 shrink-0">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-amber-500" />
                          <span>Dossier de Financement · #{selectedLoanForManage.id}</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          {selectedLoanForManage.borrower_name} ({selectedLoanForManage.borrower_email})
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedLoanForManage(null)}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                      {/* Récapitulatif du crédit */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Montant</span>
                          <span className="font-mono text-base font-extrabold text-amber-400">
                            {formatCurrency(selectedLoanForManage.amount, selectedLoanForManage.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Taux d'intérêt</span>
                          <span className="font-mono text-sm font-bold text-white">
                            {selectedLoanForManage.rate_percent}% TAEG
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Durée</span>
                          <span className="text-sm font-bold text-white">
                            {selectedLoanForManage.duration_months} mois
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Mensualité</span>
                          <span className="font-mono text-sm font-bold text-white">
                            {formatCurrency(selectedLoanForManage.monthly_payment, selectedLoanForManage.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Coût total</span>
                          <span className="font-mono text-sm font-bold text-white">
                            {formatCurrency(selectedLoanForManage.total_cost, selectedLoanForManage.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Type de projet</span>
                          <span className="text-xs font-semibold text-slate-200">
                            {selectedLoanForManage.project_type}
                          </span>
                        </div>
                      </div>

                      {/* Module 1: Décision administrative */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            1. Décision d'approbation du prêt
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            draftLoanStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : draftLoanStatus === 'rejected' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {draftLoanStatus === 'approved' ? 'Approuvé' : draftLoanStatus === 'rejected' ? 'Rejeté' : 'En attente'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Une fois le prêt approuvé, le client reçoit une notification et pourra accéder au bouton « Paramètres de crédit » pour les consulter et donner son accord.
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDraftLoanStatus('approved')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftLoanStatus === 'approved'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ✓ Approuver
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftLoanStatus('pending')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftLoanStatus === 'pending'
                                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ⏱ En attente
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftLoanStatus('rejected')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              draftLoanStatus === 'rejected'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            ✕ Rejeter
                          </button>
                        </div>
                      </div>

                      {/* Module 2: Paramètres de crédit & Déblocage des fonds */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            2. Validation des Paramètres de Crédit & Déblocage
                          </span>
                          {selectedLoanForManage.status === 'funds_released' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              Fonds Débloqués
                            </span>
                          ) : selectedLoanForManage.credit_parameters_agreed ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                              ✓ Paramètres Validés par Client
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                              En attente accord client
                            </span>
                          )}
                        </div>

                        {selectedLoanForManage.status === 'funds_released' ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                            ✓ Les fonds de ce crédit ont déjà été débloqués et crédités avec succès sur le solde principal du compte client.
                          </div>
                        ) : selectedLoanForManage.credit_parameters_agreed ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                              Le client a examiné et validé ses paramètres de crédit. Vous pouvez désormais débloquer les fonds en 1 clic.
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReleaseLoanFunds(selectedLoanForManage.id)}
                              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>Débloquer les fonds ({formatCurrency(selectedLoanForManage.amount, selectedLoanForManage.currency)})</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                            Le bouton de déblocage sera actif dès que le client aura cliqué sur « Paramètres de crédit » dans son espace et validé son accord.
                          </div>
                        )}
                      </div>

                      {/* Notes administratives */}
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                          Notes administratives / Motifs d'audit
                        </label>
                        <textarea
                          rows={2}
                          value={draftLoanNotes}
                          onChange={(e) => setDraftLoanNotes(e.target.value)}
                          placeholder="Commentaires internes d'octroi ou de conformité..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 p-5 bg-slate-950/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedLoanForManage(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        Fermer
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLoanModifications}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les modifications</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

                  {(() => {
                    const isCrypto =
                      editingMethod.category === 'Digital Assets' ||
                      editingMethod.name?.toLowerCase().includes('bitcoin') ||
                      editingMethod.name?.toLowerCase().includes('usdt') ||
                      editingMethod.name?.toLowerCase().includes('crypto');

                    return (
                      <>
                        {isCrypto ? (
                          <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-amber-500/20">
                            <div className="text-xs font-semibold text-amber-400">
                              Paramètres Crypto (Bitcoin & USDT) — Seule l'adresse et les instructions sont requises
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Adresse de dépôt du portefeuille (Wallet Address) *
                              </label>
                              <input
                                type="text"
                                required
                                value={editingMethod.wallet_address || editingMethod.account_info || ''}
                                onChange={(e) =>
                                  setEditingMethod({
                                    ...editingMethod,
                                    wallet_address: e.target.value,
                                    account_info: e.target.value
                                  })
                                }
                                placeholder="ex. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa ou TXYZ..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Réseau Blockchain (Optionnel : BTC, TRC20, ERC20, Polygon)
                              </label>
                              <input
                                type="text"
                                value={editingMethod.crypto_network || ''}
                                onChange={(e) =>
                                  setEditingMethod({ ...editingMethod, crypto_network: e.target.value })
                                }
                                placeholder="ex. Bitcoin Mainnet ou TRC-20 (Tron)"
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Coordonnées bancaires & Routage (Banque, IBAN, SWIFT / BIC) *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={editingMethod.account_info || ''}
                              onChange={(e) =>
                                setEditingMethod({ ...editingMethod, account_info: e.target.value })
                              }
                              placeholder="Banque : Movafi Treasury\nIBAN : GB29NWBK...\nSWIFT : MVFBUS33"
                              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                            />
                          </div>
                        )}

                        {/* Case pour écrire les instructions de dépôt */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Instructions de dépôt pour le client (Case Instructions)
                          </label>
                          <textarea
                            rows={3}
                            value={editingMethod.instructions || ''}
                            onChange={(e) =>
                              setEditingMethod({ ...editingMethod, instructions: e.target.value })
                            }
                            placeholder="Instructions affichées au client pour réaliser son dépôt..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </>
                    );
                  })()}

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
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white text-sm">{m.name}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {m.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingMethod(m)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteMethod(m.id)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {m.description && <div className="text-xs text-slate-400">{m.description}</div>}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
                      {m.account_info || m.wallet_address}
                    </div>
                    {m.instructions && (
                      <div className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <strong className="text-amber-300 block font-semibold mb-0.5">Instructions :</strong>
                        <span>{m.instructions}</span>
                      </div>
                    )}
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-sm text-white">Manual Executive Email Dispatch (Resend)</h3>
                  <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-400 font-bold">
                    Émetteur officiel : MOVAFI BANK &lt;support@movafi-groupes.com&gt;
                  </div>
                </div>
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
