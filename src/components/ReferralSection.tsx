import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Send,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  ShieldCheck,
  Info,
  ExternalLink,
  Sparkles,
  UserCheck,
  XCircle,
  Mail
} from 'lucide-react';
import {
  UserProfile,
  SupportedLanguage,
  ReferralRecord,
  ReferralStats,
  ReferralProgramSettings,
  ReferralStatus
} from '../types/banking';
import { api } from '../services/api';
import { translations } from '../i18n/translations';
import { formatDateTime } from '../utils/formatters';

interface ReferralSectionProps {
  user: UserProfile;
  currentLang: SupportedLanguage;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ user, currentLang }) => {
  const t = translations[currentLang];

  // States
  const [code, setCode] = useState<string>('MOV-8K4P2X');
  const [stats, setStats] = useState<ReferralStats>({
    invitations_sent: 0,
    registrations_started: 0,
    registrations_completed: 0,
    accounts_verified: 0,
    referrals_validated: 0,
    referrals_pending: 0,
    referrals_rejected: 0,
    total_points: 0,
    current_tier: 'Niveau 1 — Initié',
    tier_badge: 'Bronze Sovereign'
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [settings, setSettings] = useState<ReferralProgramSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Copy feedbacks
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Regenerate Confirmation Modal
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Direct Invitation Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Construct real application URL
  const realOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://movafi-bank.example';
  const referralLink = `${realOrigin}/register?ref=${code}`;

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const res = await api.referrals.getStats();
      if (res.success) {
        if (res.code) setCode(res.code);
        if (res.stats) setStats(res.stats);
        if (res.referrals) setReferrals(res.referrals);
        if (res.settings) setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed loading referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  // Copy handlers
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
    } catch {
      // Fallback
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  // Web Share or Email Share
  const handleShare = async () => {
    const shareText = (t.shareMessageText || 'Découvrez Movafi Bank via mon lien d’invitation : {link}').replace('{link}', referralLink);
    const shareTitle = t.shareSubject || 'Invitation exclusive Movafi Bank';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: referralLink
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      // Email fallback
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`;
      window.location.href = mailtoUrl;
    }
  };

  // Regenerate Code Handler
  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      const res = await api.referrals.generateNewCode();
      if (res.success && res.code) {
        setCode(res.code);
        setShowConfirmRegenerate(false);
        loadReferralData();
      }
    } catch (err) {
      console.error('Regenerate code failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Direct Invitation Submit
  const handleSendDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteFeedback({ text: 'Veuillez saisir une adresse email valide.', type: 'error' });
      return;
    }

    setIsSendingInvite(true);
    setInviteFeedback(null);
    try {
      const res = await api.referrals.invite({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        custom_message: customMessage.trim() || undefined
      });

      if (res.success) {
        setInviteFeedback({
          text: t.inviteSentSuccess || 'Invitation transmise avec succès !',
          type: 'success'
        });
        setInviteEmail('');
        setInviteName('');
        setCustomMessage('');
        loadReferralData();
      } else {
        setInviteFeedback({
          text: res.message || 'Impossible d’envoyer l’invitation.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setInviteFeedback({
        text: err.message || 'Erreur lors de la transmission.',
        type: 'error'
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Helper for visual badges of all 9 referral statuses
  const renderReferralStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'referral_validated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.status_referral_validated || 'Parrainage validé'}</span>
          </span>
        );
      case 'account_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.status_account_approved || 'Compte approuvé'}</span>
          </span>
        );
      case 'verification_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.status_verification_pending || 'Vérification en attente'}</span>
          </span>
        );
      case 'registration_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Check className="w-3.5 h-3.5" />
            <span>{t.status_registration_completed || 'Inscription terminée'}</span>
          </span>
        );
      case 'registration_started':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.status_registration_started || 'Inscription commencée'}</span>
          </span>
        );
      case 'invitation_sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Send className="w-3.5 h-3.5" />
            <span>{t.status_invitation_sent || 'Invitation envoyée'}</span>
          </span>
        );
      case 'invitation_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Gift className="w-3.5 h-3.5" />
            <span>{t.status_invitation_created || 'Invitation créée'}</span>
          </span>
        );
      case 'referral_rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>{t.status_referral_rejected || 'Parrainage rejeté'}</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-400/15 text-slate-500 border border-slate-400/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.status_expired || 'Expiré'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.referralDemoBadge || 'Programme Membre Privilèges'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Tier: <strong className="text-amber-400">{stats.current_tier}</strong>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t.referralHeroTitle || 'Invitez vos proches'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t.referralHeroSubtitle ||
              "Invitez de nouveaux utilisateurs à découvrir l'expérience numérique de Movafi Bank et suivez vos invitations depuis votre espace personnel."}
          </p>

          {/* Programme Compliance Information */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-300">
                Programme Membre Privilège — Conditions & Sécurité
              </span>
              <p className="text-amber-200/80 text-[11px] leading-relaxed">
                Les points privilèges et avantages sont crédités automatiquement dès validation de la conformité du dossier de votre invité.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REFERRAL CODE & LINK GENERATOR BOXES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Mon code de parrainage */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t.referralCodeTitle || 'Mon code de parrainage'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Unique & Permanent</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="font-mono text-2xl font-extrabold tracking-wider text-slate-900 dark:text-amber-400">
              {code}
            </span>

            <button
              onClick={handleCopyCode}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                codeCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{codeCopied ? (t.codeCopied || 'Code copié.') : (t.copyCode || 'Copier le code')}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ce code est associé à votre identifiant client. Vos filleuls peuvent le saisir directement lors de leur inscription dans le champ facultatif prévu à cet effet.
          </p>
        </div>

        {/* Right: Mon lien de parrainage */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t.referralLinkTitle || 'Mon lien de parrainage'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">URL réelle configurée</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 flex items-center justify-between gap-2 overflow-hidden">
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
              {referralLink}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                linkCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{linkCopied ? (t.linkCopied || 'Lien copié.') : (t.copyLink || 'Copier le lien')}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.shareLink || 'Partager'}</span>
            </button>

            <button
              onClick={() => setShowConfirmRegenerate(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.generateNewLink || 'Générer un nouveau lien'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR REGENERATING LINK */}
      {showConfirmRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.confirmNewLinkTitle || 'Générer un nouveau lien de parrainage ?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.confirmNewLinkDesc ||
                "L'ancien lien et le code actuel ne seront plus associés aux nouvelles inscriptions. Les parrainages déjà validés ou en cours ne seront pas affectés."}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmRegenerate(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.cancel || 'Annuler'}
              </button>
              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleRegenerateCode}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Génération...' : (t.confirm || 'Confirmer')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DIRECT INVITATION FORM */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.sendInviteTitle || 'Transmettre une invitation directe'}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Envoi sécurisé</span>
        </div>

        <form onSubmit={handleSendDirectInvite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.inviteEmailLabel || "Adresse email de l'invité"} *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="partenaire@domaine.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.inviteNameLabel || 'Nom ou prénom (facultatif)'}
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ex : Marcelle Dupont"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.inviteCustomMessage || 'Message personnalisé (facultatif)'}
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ex : Rejoignez l’expérience numérique privée Movafi Bank via mon code."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {inviteFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                inviteFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {inviteFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{inviteFeedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSendingInvite}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingInvite ? 'Envoi en cours...' : (t.sendInviteButton || "Envoyer l'invitation")}</span>
          </button>
        </form>
      </div>

      {/* 4. COMMENT ÇA MARCHE (4 ÉTAPES) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.howItWorks || 'Comment ça marche'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Protocole d'invitation et d'attribution automatique en 4 étapes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Étape 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
              1
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.step1Title || 'Étape 1 : Partagez votre lien'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.step1Desc || 'Copiez votre lien ou votre code personnel et transmettez-le à vos proches.'}
            </p>
          </div>

          {/* Étape 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
              2
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.step2Title || 'Étape 2 : Votre invité s’inscrit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.step2Desc || 'La personne utilise votre lien pour commencer son inscription sur Movafi Bank.'}
            </p>
          </div>

          {/* Étape 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
              3
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.step3Title || 'Étape 3 : Le système associe le compte'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.step3Desc || 'Le système détecte automatiquement le code de parrainage utilisé.'}
            </p>
          </div>

          {/* Étape 4 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
              4
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t.step4Title || 'Étape 4 : Suivez votre parrainage'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.step4Desc || 'Le statut de votre invitation apparaît en direct dans votre espace personnel.'}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center italic">
          {t.howItWorksNotice ||
            'Les conditions et récompenses du programme sont validées en conformité avec la réglementation bancaire.'}
        </div>
      </div>

      {/* 5. SUIVI DES PARRAINAGES & STATISTIQUES (6 KPIS) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t.myReferralsTitle || 'Mes parrainages'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suivi en temps réel de vos invitations et statuts d'intégration
            </p>
          </div>

          {/* Tier badge & Points indicator */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{stats.tier_badge}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
              {stats.total_points} {settings?.reward_type === 'points' ? 'points Privilèges' : 'récompenses'}
            </div>
          </div>
        </div>

        {/* 6 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statInvitationsSent || 'Invitations envoyées'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {stats.invitations_sent}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statRegistrationsStarted || 'Inscriptions commencées'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-1">
              {stats.registrations_started}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statRegistrationsCompleted || 'Inscriptions terminées'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              {stats.registrations_completed}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statAccountsVerified || 'Comptes vérifiés'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400 mt-1">
              {stats.accounts_verified}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statReferralsValidated || 'Parrainages validés'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.referrals_validated}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
              {t.statReferralsPending || 'Parrainages en attente'}
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {stats.referrals_pending}
            </div>
          </div>
        </div>

        {/* Responsive Table / Cards */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">{t.refereeName || 'Nom ou identifiant masqué'}</th>
                  <th className="px-5 py-3.5">{t.registrationDate || "Date d'inscription"}</th>
                  <th className="px-5 py-3.5">{t.status || 'Statut'}</th>
                  <th className="px-5 py-3.5">{t.lastStepReached || 'Dernière étape atteinte'}</th>
                  <th className="px-5 py-3.5">{t.simulatedReward || 'Récompense'}</th>
                  <th className="px-5 py-3.5">{t.validationDate || 'Date de validation'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      {t.noReferralsYet || 'Aucun parrainage enregistré pour le moment.'}
                    </td>
                  </tr>
                ) : (
                  referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {r.referee_name_masked?.charAt(0) || 'F'}
                          </div>
                          <span>{r.referee_name_masked || 'Filleul Privé'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        {renderReferralStatusBadge(r.status)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.last_step_reached || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-amber-600 dark:text-amber-400">
                        {r.reward_description || `${r.reward_value} points`}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {r.validated_at ? formatDateTime(r.validated_at) : 'En attente'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Privacy Note */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confidentialité garantie : les données sensibles, KYC, mots de passe ou PIN du filleul ne sont jamais exposés.</span>
            </span>
            <span className="font-mono">{referrals.length} dossier(s)</span>
          </div>
        </div>
      </div>

      {/* 6. NIVEAUX DE PARRAINAGE ET RÉCOMPENSES PRIVILÈGES */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Niveaux de parrainage & Récompenses Privilèges</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.fictionalRewardNotice || 'Récompenses réservées aux clients de la banque.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Niveau 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Niveau 1 — Initié
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                1 à 5 parrainages
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Badge Bronze Sovereign · 25 points Privilèges par filleul validé.
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Éligibilité standard dès la première activation.
            </div>
          </div>

          {/* Niveau 2 */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Niveau 2 — Ambassadeur
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                6 à 20 parrainages
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Badge Silver Ambassador · 50 points Privilèges par filleul validé + Exonération de frais.
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Statut privilégié pour clients actifs.
            </div>
          </div>

          {/* Niveau 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Niveau 3 — Cercle Privilège
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                21+ parrainages
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Badge Gold Sovereign Elite · 100 points Privilèges + Conciergerie privée dédiée.
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Niveau supérieur d’excellence et de privilèges.
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Conditions et engagements de conformité :
          </span>
          <p className="leading-relaxed">
            {settings?.terms_and_conditions ||
              'Programme de parrainage et privilèges Movafi Bank. Les points et avantages sont accordés sous réserve de vérification de conformité des comptes parrainés.'}
          </p>
        </div>
      </div>
    </div>
  );
};
