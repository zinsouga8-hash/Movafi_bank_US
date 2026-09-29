import React, { useState, useEffect } from 'react';
import {
  Gift,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Sliders,
  Award,
  Users,
  Settings,
  ArrowRight,
  Shield,
  ShieldCheck,
  FileText,
  UserCheck,
  Send,
  Edit,
  Save,
  Check
} from 'lucide-react';
import {
  ReferralRecord,
  ReferralProgramSettings,
  ReferralStatus,
  ReferralRewardType,
  SupportedCurrency
} from '../types/banking';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

interface AdminReferralsTabProps {
  notify: (text: string, type?: 'success' | 'error') => void;
}

export const AdminReferralsTab: React.FC<AdminReferralsTabProps> = ({ notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'settings'>('list');
  const [loading, setLoading] = useState(false);

  // Data states
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    new_recent: 0,
    pending: 0,
    validated: 0,
    rejected: 0
  });
  const [topReferrers, setTopReferrers] = useState<
    { profile_id: string; name: string; email: string; count: number; validated: number }[]
  >([]);
  const [settings, setSettings] = useState<ReferralProgramSettings | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal: Manage single referral
  const [selectedReferral, setSelectedReferral] = useState<ReferralRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<ReferralStatus>('invitation_created');
  const [modalNotes, setModalNotes] = useState('');
  const [modalRewardValue, setModalRewardValue] = useState<number>(10);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Settings form states
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [formSettings, setFormSettings] = useState<ReferralProgramSettings | null>(null);

  // Lazy load data on open
  const loadReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getReferrals();
      if (res.success) {
        setReferrals(res.referrals || []);
        if (res.kpis) setKpis(res.kpis);
        if (res.top_referrers) setTopReferrers(res.top_referrers);
        if (res.settings) {
          setSettings(res.settings);
          setFormSettings(JSON.parse(JSON.stringify(res.settings)));
        }
      } else {
        notify('Impossible de charger les parrainages.', 'error');
      }
    } catch (e: any) {
      notify(e.message || 'Erreur réseau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const openManageModal = (record: ReferralRecord) => {
    setSelectedReferral(record);
    setModalStatus(record.status);
    setModalNotes(record.notes || '');
    setModalRewardValue(record.reward_value || 10);
  };

  const handleSaveModal = async () => {
    if (!selectedReferral) return;
    setIsSavingModal(true);
    try {
      const res = await api.admin.updateReferral(selectedReferral.id, {
        status: modalStatus,
        notes: modalNotes,
        reward_value: modalRewardValue
      });
      if (res.success) {
        notify('Parrainage mis à jour avec succès.', 'success');
        setSelectedReferral(null);
        await loadReferrals();
      } else {
        notify(res.message || 'Erreur lors de la mise à jour.', 'error');
      }
    } catch (e: any) {
      notify(e.message || 'Erreur.', 'error');
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSettings) return;
    setIsSavingSettings(true);
    try {
      const res = await api.admin.updateReferralSettings(formSettings);
      if (res.success) {
        notify('Règles du programme de parrainage enregistrées dans la base de données.', 'success');
        setSettings(res.settings);
      } else {
        notify(res.message || 'Erreur d’enregistrement.', 'error');
      }
    } catch (e: any) {
      notify(e.message || 'Erreur.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: ReferralStatus) => {
    const config: Record<ReferralStatus, { label: string; class: string }> = {
      referral_validated: { label: 'Parrainage validé', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      account_approved: { label: 'Compte approuvé', class: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
      verification_pending: { label: 'Vérification en attente', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      registration_completed: { label: 'Inscription terminée', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      registration_started: { label: 'Inscription commencée', class: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
      invitation_sent: { label: 'Invitation envoyée', class: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
      invitation_created: { label: 'Invitation créée', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      referral_rejected: { label: 'Parrainage rejeté', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      expired: { label: 'Expiré', class: 'bg-slate-600/20 text-slate-500 border-slate-600/30' }
    };
    const c = config[status] || { label: status, class: 'bg-slate-700 text-slate-300' };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.class}`}>
        {status === 'referral_validated' && <CheckCircle2 className="w-3 h-3" />}
        {status === 'referral_rejected' && <XCircle className="w-3 h-3" />}
        {status === 'verification_pending' && <Clock className="w-3 h-3" />}
        <span>{c.label}</span>
      </span>
    );
  };

  // Filter list
  const filteredReferrals = referrals.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      r.code_used.toLowerCase().includes(query) ||
      (r.referrer_name && r.referrer_name.toLowerCase().includes(query)) ||
      (r.referee_name && r.referee_name.toLowerCase().includes(query)) ||
      (r.referee_email && r.referee_email.toLowerCase().includes(query)) ||
      (r.referee_name_masked && r.referee_name_masked.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Advisory Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Programme de Parrainage & Affiliation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Administration des parrainages, codes uniques, règles d’attribution et privilèges clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReferrals}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Regulatory & Compliance Guidelines Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider">
            Programme de Parrainage & Privilèges Clients — Conformité Bancaire
          </span>
          <p className="text-amber-200/80 text-[11px] mt-0.5">
            Toutes les attributions de points et avantages sont soumises à la validation de conformité des comptes filleuls et à la réglementation KYC/AML.
          </p>
        </div>
      </div>

      {/* Top 5 KPI Cards (Section 18) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Parrainages</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{kpis.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Nouveaux (7j)</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{kpis.new_recent}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">En Attente</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{kpis.pending}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Validés</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{kpis.validated}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Rejetés / Expirés</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{kpis.rejected}</div>
        </div>
      </div>

      {/* Subtabs switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'list'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Liste des Parrainages ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Règles du Programme & Récompenses</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: LISTE DES PARRAINAGES */}
      {/* ======================================================== */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Top Referrers strip (Utilisateurs les plus actifs) */}
          {topReferrers.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Utilisateurs les plus actifs (Top Parrains)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {topReferrers.slice(0, 4).map((top, idx) => (
                  <div key={top.profile_id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white truncate max-w-[140px]">{top.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{top.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400">{top.count}</span>
                      <div className="text-[10px] text-emerald-400">{top.validated} validé(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par code, nom de parrain ou de filleul..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les statuts ({referrals.length})</option>
              <option value="referral_validated">Validés</option>
              <option value="verification_pending">Vérification en attente</option>
              <option value="registration_completed">Inscription terminée</option>
              <option value="invitation_sent">Invitation envoyée</option>
              <option value="referral_rejected">Rejetés</option>
              <option value="expired">Expirés</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Parrain</th>
                  <th className="px-4 py-3.5">Filleul</th>
                  <th className="px-4 py-3.5">Code Utilisé</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Dernière Étape</th>
                  <th className="px-4 py-3.5">Récompense</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Aucun parrainage correspondant aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">
                        <div>{r.referrer_name || 'Utilisateur'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.referrer_email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{r.referee_name || r.referee_name_masked || 'Filleul'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.referee_email || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-amber-400 font-bold">
                        {r.code_used}
                      </td>
                      <td className="px-4 py-3.5">
                        {renderStatusBadge(r.status)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {r.last_step_reached || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-amber-400">
                        {r.reward_description || `${r.reward_value} pts`}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openManageModal(r)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: RÈGLES DU PROGRAMME & RÉCOMPENSES (SECTIONS 9, 10, 11) */}
      {/* ======================================================== */}
      {activeSubTab === 'settings' && formSettings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-white">Paramètres Généraux du Programme</h3>
                <p className="text-xs text-slate-400">
                  Ces paramètres sont stockés dans la base de données et dictent l'attribution des parrainages.
                </p>
              </div>

              {/* Active Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-300">
                  {formSettings.is_enabled ? 'Programme Activé' : 'Programme Désactivé'}
                </span>
                <input
                  type="checkbox"
                  checked={formSettings.is_enabled}
                  onChange={(e) => setFormSettings({ ...formSettings, is_enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Durée de validité d'une invitation (jours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formSettings.invitation_validity_days}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, invitation_validity_days: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre max de filleuls par utilisateur
                </label>
                <input
                  type="number"
                  min={1}
                  value={formSettings.max_referrals_per_user}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, max_referrals_per_user: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre max d'invitations par utilisateur
                </label>
                <input
                  type="number"
                  min={1}
                  value={formSettings.max_invitations_per_user}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, max_invitations_per_user: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Condition requise pour validation
                </label>
                <select
                  value={formSettings.validation_condition}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, validation_condition: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="account_approved">Compte approuvé par la conformité</option>
                  <option value="registration_completed">Inscription initiale terminée</option>
                  <option value="first_deposit">Premier dépôt de liquidité simulé</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Type de récompense
                </label>
                <select
                  value={formSettings.reward_type}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, reward_type: e.target.value as ReferralRewardType })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="points">Points Privilèges fidélité</option>
                  <option value="fixed_amount">Montant fixe en compte</option>
                  <option value="bonus">Bonus de bienvenue</option>
                  <option value="badge">Badge exclusif uniquement</option>
                  <option value="none">Aucune récompense (Affiliation simple)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valeur de la récompense (points ou montant)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formSettings.reward_value}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, reward_value: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Devise compatible (including SAR and AED) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Devise de référence pour récompenses monétaires
              </label>
              <select
                value={formSettings.reward_currency || 'USD'}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, reward_currency: e.target.value as SupportedCurrency })
                }
                className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="SAR">SAR — Saudi Riyal (ر.س / SAR)</option>
                <option value="AED">AED — UAE Dirham (د.إ / AED)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="CAD">CAD — Canadian Dollar (C$)</option>
              </select>
            </div>

            {/* Niveaux de parrainage (Section 11) */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Configuration des 3 Niveaux de Parrainage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {formSettings.tiers.map((tier, idx) => (
                  <div key={tier.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Niveau {idx + 1}</div>
                    <div>
                      <label className="text-[10px] text-slate-400">Nom du niveau</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const updated = [...formSettings.tiers];
                          updated[idx].name = e.target.value;
                          setFormSettings({ ...formSettings, tiers: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Seuil minimum de parrainages</label>
                      <input
                        type="number"
                        min={1}
                        value={tier.min_referrals}
                        onChange={(e) => {
                          const updated = [...formSettings.tiers];
                          updated[idx].min_referrals = Number(e.target.value);
                          setFormSettings({ ...formSettings, tiers: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Badge</label>
                      <input
                        type="text"
                        value={tier.badge}
                        onChange={(e) => {
                          const updated = [...formSettings.tiers];
                          updated[idx].badge = e.target.value;
                          setFormSettings({ ...formSettings, tiers: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Description de la récompense</label>
                      <input
                        type="text"
                        value={tier.reward_description}
                        onChange={(e) => {
                          const updated = [...formSettings.tiers];
                          updated[idx].reward_description = e.target.value;
                          setFormSettings({ ...formSettings, tiers: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Textes explicatifs & CGU */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Texte explicatif affiché aux clients
                </label>
                <textarea
                  rows={2}
                  value={formSettings.explanatory_text}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, explanatory_text: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message de partage par défaut
                </label>
                <input
                  type="text"
                  value={formSettings.default_share_message}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, default_share_message: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Conditions générales du programme (Disclaimer légal)
                </label>
                <textarea
                  rows={3}
                  value={formSettings.terms_and_conditions}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, terms_and_conditions: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Enregistrement...' : 'Sauvegarder les Règles du Programme'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL: GESTION D'UN PARRAINAGE (SECTION 19) */}
      {/* ======================================================== */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl my-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-white">
                  Gérer le Parrainage ({selectedReferral.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Parrain</span>
                <div className="font-medium text-white">{selectedReferral.referrer_name || 'Utilisateur'}</div>
                <div className="font-mono text-slate-400 text-[11px]">{selectedReferral.referrer_email}</div>
                <div className="text-[10px] text-slate-500 font-mono">ID: {selectedReferral.referrer_profile_id}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Filleul</span>
                <div className="font-medium text-white">
                  {selectedReferral.referee_name || selectedReferral.referee_name_masked || 'Filleul'}
                </div>
                <div className="font-mono text-slate-400 text-[11px]">{selectedReferral.referee_email || '—'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ID: {selectedReferral.referee_profile_id || 'En attente de compte'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Code Utilisé</span>
                <div className="font-mono text-amber-400 font-bold">{selectedReferral.code_used}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Date de création</span>
                <div className="font-mono text-slate-300">{formatDateTime(selectedReferral.created_at)}</div>
              </div>

              {selectedReferral.ip_address && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Adresse IP</span>
                  <div className="font-mono text-slate-300">{selectedReferral.ip_address}</div>
                </div>
              )}

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Dernière étape atteinte</span>
                <div className="text-slate-200">{selectedReferral.last_step_reached || '—'}</div>
              </div>
            </div>

            {/* Edit Status & Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Statut du parrainage
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as ReferralStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="invitation_created">Invitation créée</option>
                  <option value="invitation_sent">Invitation envoyée</option>
                  <option value="registration_started">Inscription commencée</option>
                  <option value="registration_completed">Inscription terminée</option>
                  <option value="verification_pending">Vérification en attente</option>
                  <option value="account_approved">Compte approuvé</option>
                  <option value="referral_validated">Parrainage validé (Attribuer récompense)</option>
                  <option value="referral_rejected">Parrainage rejeté</option>
                  <option value="expired">Expiré</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Points / Récompense accordée
                </label>
                <input
                  type="number"
                  value={modalRewardValue}
                  onChange={(e) => setModalRewardValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes administratives
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Justification administrative ou note interne de conformité..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Activity History Timeline */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Historique des événements
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                {selectedReferral.activity_history && selectedReferral.activity_history.length > 0 ? (
                  selectedReferral.activity_history.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{act.label}</span>
                        {act.note && <span className="text-slate-500 italic">({act.note})</span>}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">{formatDateTime(act.timestamp)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">Aucun historique enregistré.</span>
                )}
              </div>
            </div>

            {/* Quick action buttons & Save */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalStatus('referral_validated')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatus('referral_rejected')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Rejeter
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReferral(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSavingModal}
                  onClick={handleSaveModal}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                >
                  {isSavingModal ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
