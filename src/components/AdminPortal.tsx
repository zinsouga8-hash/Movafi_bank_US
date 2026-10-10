import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  BankAccount,
  Transaction,
  BankCard,
  LoanApplication,
  LoanRate,
  NotificationItem,
  AuditLog,
  TransactionRequest
} from '../types/banking';
import { api } from '../services/api';
import {
  formatCurrency,
  formatDateTime,
  formatDateOnly
} from '../utils/formatters';
import {
  Shield,
  Users,
  CreditCard,
  ArrowDownLeft,
  PiggyBank,
  Sliders,
  Gift,
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Send,
  LogOut,
  Bell,
  Eye,
  Lock,
  Unlock,
  Check,
  X
} from 'lucide-react';
import { MovafiLogo } from './MovafiLogo';
import { AdminReferralsTab } from './AdminReferralsTab';

interface AdminPortalProps {
  user: UserProfile;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
  onBackToClient?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onRefreshData,
  onLogout,
  onBackToClient
}) => {
  const [activeSection, setActiveSection] = useState<'accounts' | 'deposits' | 'cards' | 'loans' | 'rates' | 'referrals' | 'audit' | 'notifications'>('accounts');
  const [loading, setLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Accounts state
  const [accountsList, setAccountsList] = useState<BankAccount[]>([]);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('');
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<any | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState('');

  // Deposits state
  const [depositRequests, setDepositRequests] = useState<TransactionRequest[]>([]);
  const [depositsPage, setDepositsPage] = useState(1);

  // Cards state
  const [cardsList, setCardsList] = useState<BankCard[]>([]);
  const [cardsPage, setCardsPage] = useState(1);

  // Loans state
  const [loansList, setLoansList] = useState<LoanApplication[]>([]);
  const [loansPage, setLoansPage] = useState(1);
  const [selectedLoanForManage, setSelectedLoanForManage] = useState<LoanApplication | null>(null);
  const [isReleasingFunds, setIsReleasingFunds] = useState(false);

  // Rates state
  const [ratesList, setRatesList] = useState<LoanRate[]>([]);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Notifications broadcast state
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    target: 'all' as 'all' | 'specific',
    profile_id: '',
    priority: 'normal',
    send_email: true,
    send_sms: false
  });

  const flash = (text: string, type: 'success' | 'error' = 'success') => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg(null), 5000);
  };

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
        setAccountsList(res.accounts || []);
        setAccountsTotal(res.total || 0);
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDeposits = async () => {
    try {
      const res = await api.admin.getTransactions();
      if (res.success) {
        setDepositRequests(res.requests || []);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const loadCards = async () => {
    try {
      const res = await api.admin.getCards();
      if (res.success) {
        setCardsList(res.cards || []);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const loadLoans = async () => {
    try {
      const res = await api.admin.getLoans();
      if (res.success) {
        setLoansList(res.loans || []);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const loadRates = async () => {
    try {
      const res = await api.admin.getRates();
      if (res.success) {
        setRatesList(res.rates || []);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const loadAudit = async () => {
    try {
      const res = await api.admin.getAuditLogs();
      if (res.success) {
        setAuditLogs(res.logs || []);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  useEffect(() => {
    if (activeSection === 'accounts') loadAccounts();
    if (activeSection === 'deposits') loadDeposits();
    if (activeSection === 'cards') loadCards();
    if (activeSection === 'loans') loadLoans();
    if (activeSection === 'rates') loadRates();
    if (activeSection === 'audit') loadAudit();
  }, [activeSection, accountsPage, accountsSearch, accountsStatusFilter]);

  // Handle deposit action
  const handleDepositAction = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const res = await api.admin.approveDeposit(requestId, action);
      if (res.success) {
        flash(action === 'approve' ? 'Dépôt validé et crédité sur le compte client.' : 'Dépôt rejeté.');
        await loadDeposits();
        await onRefreshData();
      } else {
        flash(res.message || 'Action échouée.', 'error');
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle card status update
  const handleCardStatus = async (cardId: string, status: string) => {
    setLoading(true);
    try {
      const res = await api.admin.updateCardStatus(cardId, { status });
      if (res.success) {
        flash('Statut de la carte mis à jour.');
        await loadCards();
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle loan status update
  const handleLoanStatus = async (loanId: string, status: string) => {
    setLoading(true);
    try {
      const res = await api.admin.updateLoanStatus(loanId, status);
      if (res.success) {
        flash(`Dossier de prêt mis à jour : ${status}. Notification envoyée.`);
        if (selectedLoanForManage) {
          setSelectedLoanForManage({ ...selectedLoanForManage, status: status as any });
        }
        await loadLoans();
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle single-click loan release funds
  const handleReleaseFunds = async (loanId: string) => {
    if (isReleasingFunds) return;
    setIsReleasingFunds(true);
    try {
      const res = await api.admin.releaseLoanFunds(loanId);
      if (res.success) {
        flash(`Fonds débloqués avec succès (${formatCurrency(res.amount, res.currency)} crédités). Opération définitive.`);
        if (selectedLoanForManage) {
          setSelectedLoanForManage({ ...selectedLoanForManage, status: 'funds_released' });
        }
        await loadLoans();
        await onRefreshData();
      } else {
        flash(res.message || 'Échec du déblocage des fonds.', 'error');
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setIsReleasingFunds(false);
    }
  };

  // Handle balance adjustment
  const handleAdjustBalance = async () => {
    if (!selectedAccountForEdit) return;
    const amt = Number(balanceAdjustAmount);
    if (isNaN(amt) || amt === 0) {
      flash('Veuillez spécifier un montant positif ou négatif.', 'error');
      return;
    }
    if (!balanceAdjustReason.trim()) {
      flash('Le motif comptable d\'audit est obligatoire.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.admin.updateAccount(selectedAccountForEdit.id, {
        balance_adjustment: amt,
        adjustment_reason: balanceAdjustReason.trim()
      });
      if (res.success) {
        setSelectedAccountForEdit(null);
        setBalanceAdjustAmount('');
        setBalanceAdjustReason('');
        flash('Écriture d\'ajustement comptable validée et tracée dans le journal d\'audit.');
        await loadAccounts();
        await onRefreshData();
      } else {
        flash(res.message, 'error');
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Broadcast notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message) {
      flash('Titre et message obligatoires.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.admin.broadcastNotification(broadcastData);
      if (res.success) {
        flash(`Notification diffusée avec succès (${res.sent_count || 1} destinataire(s)).`);
        setBroadcastData({
          title: '',
          message: '',
          target: 'all',
          profile_id: '',
          priority: 'normal',
          send_email: true,
          send_sms: false
        });
      }
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = (currentPage: number, totalCount: number, pageSize: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-white px-2">Page {currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MovafiLogo size="md" />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider">Console Administrative Trésorerie</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 font-semibold">{user.first_name} {user.last_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBackToClient && (
              <button
                type="button"
                onClick={onBackToClient}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Espace Client
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Flash Banner */}
      {flashMsg && (
        <div
          className={`px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            flashMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
          }`}
        >
          {flashMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{flashMsg.text}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <nav className="bg-slate-900/50 border-b border-slate-800/80 sticky top-20 z-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 py-2 min-w-max">
          {[
            { id: 'accounts', label: 'Comptes Clients', icon: Users },
            { id: 'deposits', label: 'Dépôts & Inflows', icon: ArrowDownLeft },
            { id: 'cards', label: 'Cartes Prestige', icon: CreditCard },
            { id: 'loans', label: 'Crédits & Financements', icon: PiggyBank },
            { id: 'rates', label: 'Barème Taux', icon: Sliders },
            { id: 'referrals', label: 'Parrainages', icon: Gift },
            { id: 'notifications', label: 'Diffusions & Alertes', icon: Bell },
            { id: 'audit', label: 'Journal d\'Audit', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ACCOUNTS SECTION */}
        {activeSection === 'accounts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Dossiers Clients & Tenue de Comptes</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Consultez les soldes, effectuez des ajustements comptables motivés et gérez les statuts d'accès.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={accountsSearch}
                  onChange={(e) => setAccountsSearch(e.target.value)}
                  placeholder="Rechercher client, IBAN..."
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                />
                <select
                  value={accountsStatusFilter}
                  onChange={(e) => setAccountsStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="">Tous statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="dormant">Dormant</option>
                </select>
                <button
                  type="button"
                  onClick={loadAccounts}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-4">Client ID</th>
                    <th className="py-3 px-4">Titulaire</th>
                    <th className="py-3 px-4">IBAN / Compte</th>
                    <th className="py-3 px-4 text-right">Solde</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {accountsList.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-amber-400 font-bold">{acc.client_id}</td>
                      <td className="py-3 px-4 font-sans text-white font-semibold">
                        {acc.profile?.first_name} {acc.profile?.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{acc.iban}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {formatCurrency(acc.balance, acc.currency)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          acc.account_status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {acc.account_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedAccountForEdit(acc)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Gérer le Solde
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(accountsPage, accountsTotal, 10, setAccountsPage)}
            </div>

            {/* Modal Balance Adjustment */}
            {selectedAccountForEdit && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
                  <h4 className="font-bold text-base text-white">Ajustement Comptable Motivé</h4>
                  <p className="text-xs text-slate-400">
                    Compte : <strong>{selectedAccountForEdit.account_number}</strong> ({selectedAccountForEdit.client_id}).
                    Solde actuel : <strong>{formatCurrency(selectedAccountForEdit.balance, selectedAccountForEdit.currency)}</strong>.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Variation de Solde (+ pour crédit, - pour débit)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={balanceAdjustAmount}
                      onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                      placeholder="+5000 ou -250"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Motif Comptable d'Audit (Obligatoire) *
                    </label>
                    <textarea
                      rows={2}
                      value={balanceAdjustReason}
                      onChange={(e) => setBalanceAdjustReason(e.target.value)}
                      placeholder="Ex. Régularisation d'inflow Fedwire n°8491 / Décision du comité"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAccountForEdit(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAdjustBalance}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Valider l'Écriture
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEPOSITS SECTION */}
        {activeSection === 'deposits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-amber-500" />
                  <span>Dépôts en Attente & Réconciliation Trésorerie</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Validez les déclarations de flux entrants pour créditer le solde client de manière irrévocable.
                </p>
              </div>
              <button
                type="button"
                onClick={loadDeposits}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Méthode</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {depositRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        Aucun dépôt en attente.
                      </td>
                    </tr>
                  ) : (
                    depositRequests.slice((depositsPage - 1) * 10, depositsPage * 10).map((req) => (
                      <tr key={req.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 text-slate-400">{formatDateTime(req.created_at)}</td>
                        <td className="py-3 px-4 font-sans text-white font-semibold">{req.client_name || req.sender_name}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{req.payment_method}</td>
                        <td className="py-3 px-4 text-slate-400">{req.source_reference}</td>
                        <td className="py-3 px-4 text-right text-amber-400 font-bold">
                          {formatCurrency(req.amount, req.currency)}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans space-x-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(req.id, 'approve')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                              >
                                Approuver & Créditer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDepositAction(req.id, 'reject')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPagination(depositsPage, depositRequests.length, 10, setDepositsPage)}
            </div>
          </div>
        )}

        {/* CARDS SECTION */}
        {activeSection === 'cards' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>Cartes Bancaires Prestige & Expéditions Métal</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Supervision des cartes actives, suspensions de sécurité et dispatching physique.
                </p>
              </div>
              <button
                type="button"
                onClick={loadCards}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-4">Numéro Masqué</th>
                    <th className="py-3 px-4">Titulaire</th>
                    <th className="py-3 px-4">Formule</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4 text-right">Solde Carte</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {cardsList.slice((cardsPage - 1) * 10, cardsPage * 10).map((card) => (
                    <tr key={card.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-white font-bold">{card.card_number_masked}</td>
                      <td className="py-3 px-4 font-sans text-white">{card.cardholder_name}</td>
                      <td className="py-3 px-4 uppercase text-amber-400">{card.tier}</td>
                      <td className="py-3 px-4 text-slate-400">{card.expiry_month}/{card.expiry_year}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">{formatCurrency(card.balance)}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          card.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans space-x-2">
                        {card.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleCardStatus(card.id, 'frozen')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                          >
                            Bloquer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCardStatus(card.id, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                          >
                            Réactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(cardsPage, cardsList.length, 10, setCardsPage)}
            </div>
          </div>
        )}

        {/* LOANS SECTION */}
        {activeSection === 'loans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-amber-500" />
                  <span>Dossiers de Crédit & Déblocage des Fonds</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Étude financière, validation des paramètres et déblocage unique et définitif des liquidités.
                </p>
              </div>
              <button
                type="button"
                onClick={loadLoans}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Emprunteur</th>
                    <th className="py-3 px-4">Projet</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4">Durée & Taux</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Décision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {loansList.slice((loansPage - 1) * 10, loansPage * 10).map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(loan.created_at)}</td>
                      <td className="py-3 px-4 font-sans text-white font-semibold">{loan.borrower_name || loan.borrower_email}</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{loan.project_type}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">{formatCurrency(loan.amount, loan.currency)}</td>
                      <td className="py-3 px-4 text-slate-400">{loan.duration_months} mois @ {loan.rate_percent}%</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          loan.status === 'funds_released'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : loan.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : loan.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {loan.status === 'funds_released' ? 'Fonds Débloqués' : loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedLoanForManage(loan)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Examiner le Prêt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(loansPage, loansList.length, 10, setLoansPage)}
            </div>

            {/* Modal Loan Management */}
            {selectedLoanForManage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-base text-white">Gestion du Dossier de Prêt</h4>
                    <button
                      onClick={() => setSelectedLoanForManage(null)}
                      className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Emprunteur</span>
                      <strong className="text-white">{selectedLoanForManage.borrower_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Projet</span>
                      <strong className="text-white">{selectedLoanForManage.project_type}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Montant</span>
                      <strong className="text-amber-400 font-mono">{formatCurrency(selectedLoanForManage.amount, selectedLoanForManage.currency)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Durée & Taux</span>
                      <strong className="text-white">{selectedLoanForManage.duration_months} mois @ {selectedLoanForManage.rate_percent}%</strong>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  {selectedLoanForManage.status === 'funds_released' ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Fonds Débloqués et Crédités</span>
                      </div>
                      <p className="text-[11px] text-emerald-400/90">
                        Cette opération est unique et définitive. Le montant a déjà été transféré sur le compte client. Aucun nouveau versement n'est autorisé.
                      </p>
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-emerald-400 font-bold text-xs cursor-not-allowed opacity-80"
                      >
                        ✓ Fonds déjà débloqués ({formatCurrency(selectedLoanForManage.amount, selectedLoanForManage.currency)})
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-300">1. Décision d'Approbation</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoanStatus(selectedLoanForManage.id, 'approved')}
                            className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoanStatus(selectedLoanForManage.id, 'pending')}
                            className="py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                          >
                            En Attente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoanStatus(selectedLoanForManage.id, 'rejected')}
                            className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-xs font-semibold text-slate-300">2. Déblocage des Fonds</span>
                        <p className="text-[11px] text-slate-400">
                          {selectedLoanForManage.credit_parameters_agreed
                            ? 'Le client a validé ses paramètres. Vous pouvez procéder au déblocage immédiat.'
                            : 'Le client doit d\'abord cliquer sur « Valider Paramètres » dans son espace une fois le prêt approuvé.'}
                        </p>
                        <button
                          type="button"
                          disabled={!selectedLoanForManage.credit_parameters_agreed || isReleasingFunds}
                          onClick={() => handleReleaseFunds(selectedLoanForManage.id)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {isReleasingFunds ? 'Déblocage en cours...' : `Débloquer les Fonds (${formatCurrency(selectedLoanForManage.amount, selectedLoanForManage.currency)})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RATES SECTION */}
        {activeSection === 'rates' && (
          <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Barème des Taux d'Intérêt & Marges de Crédit</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajustez les taux d'intérêt annuels fixes appliqués automatiquement lors des simulations clients.
              </p>
            </div>

            <div className="space-y-4">
              {ratesList.map((rate) => (
                <div
                  key={rate.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <strong className="text-sm text-white block">{rate.category}</strong>
                    <span className="text-xs text-slate-500">
                      Montant : ${rate.min_amount.toLocaleString()} à ${rate.max_amount.toLocaleString()} · Durée : {rate.min_duration_months} à {rate.max_duration_months} mois
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.05"
                      defaultValue={rate.annual_rate_percent}
                      onBlur={async (e) => {
                        const newRate = Number(e.target.value);
                        if (newRate > 0) {
                          await api.admin.updateRate({ id: rate.id, annual_rate_percent: newRate });
                          flash(`Taux pour ${rate.category} mis à jour : ${newRate}%.`);
                          await loadRates();
                        }
                      }}
                      className="w-20 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs font-bold text-center focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REFERRALS SECTION */}
        {activeSection === 'referrals' && <AdminReferralsTab />}

        {/* NOTIFICATIONS BROADCAST */}
        {activeSection === 'notifications' && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>Centre de Diffusion & Alertes Bancaires</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Diffusez une communication officielle ou une alerte de sécurité à tous les clients ou à un compte spécifique.
              </p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Titre de l'Alerte *</label>
                <input
                  type="text"
                  required
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="Ex. Information sur vos opérations du week-end"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message Détaillé *</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  placeholder="Rédigez le texte de la notification..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Destinataire</label>
                  <select
                    value={broadcastData.target}
                    onChange={(e) => setBroadcastData({ ...broadcastData, target: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="all">Tous les clients (Global)</option>
                    <option value="specific">Client Spécifique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priorité</label>
                  <select
                    value={broadcastData.priority}
                    onChange={(e) => setBroadcastData({ ...broadcastData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastData.send_email}
                    onChange={(e) => setBroadcastData({ ...broadcastData, send_email: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span>Envoi E-mail Automatique</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastData.send_sms}
                    onChange={(e) => setBroadcastData({ ...broadcastData, send_sms: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span>Envoi SMS Automatique</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Diffuser Immédiatement</span>
              </button>
            </form>
          </div>
        )}

        {/* AUDIT LOGS SECTION */}
        {activeSection === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>Journal d'Audit Immuable des Opérations</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enregistrement inaltérable de chaque décision administrative, ajustement comptable et connexion.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAudit}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Opérateur</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Cible / Ressource</th>
                    <th className="py-3 px-4">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {auditLogs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(log.created_at)}</td>
                      <td className="py-3 px-4 text-white font-bold">{log.admin_email}</td>
                      <td className="py-3 px-4 text-amber-400 font-sans font-semibold">{log.action}</td>
                      <td className="py-3 px-4 text-slate-300">{log.target_resource}</td>
                      <td className="py-3 px-4 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
