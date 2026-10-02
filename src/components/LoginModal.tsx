import React, { useState } from 'react';
import {
  X,
  Lock,
  ArrowRight,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Mail,
  Headphones
} from 'lucide-react';
import { SupportedLanguage, UserProfile, BankAccount } from '../types/banking';
import { translations } from '../i18n/translations';
import { api } from '../services/api';
import { MovafiLogo } from './MovafiLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  onSuccess: (user: UserProfile, account: BankAccount) => void;
  onSwitchToRegister: () => void;
  supportEmail?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSuccess,
  onSwitchToRegister,
  supportEmail = 'support@movafi-groupes.com'
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInactiveAccount, setIsInactiveAccount] = useState(false);

  if (!isOpen) return null;

  // Step 1: Email + Password
  const handleStep1Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsInactiveAccount(false);
    setLoading(true);

    try {
      const res = await api.loginStep1(email.trim(), password);
      if (res.success && res.user_id) {
        setUserId(res.user_id);
        setUserName(res.first_name || 'Client');
        setStep(2);
      } else {
        setError(res.message || (isRtl ? 'بيانات الاعتماد غير صحيحة.' : 'Identifiants invalides.'));
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 6-digit PIN (strictly manual entry, no autofill)
  const handleStep2Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userId) return;
    setError(null);
    setIsInactiveAccount(false);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      setError(
        currentLang === 'fr'
          ? 'Le code PIN de sécurité doit comporter exactement 6 chiffres.'
          : currentLang === 'es'
          ? 'El PIN de seguridad debe contener exactamente 6 dígitos.'
          : currentLang === 'ar'
          ? 'يجب أن يتكون رمز الأمان PIN من 6 أرقام بالضبط.'
          : 'Security PIN must be exactly 6 digits.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginStep2(userId, cleanPin);
      if (res.success && res.user && (res.account || res.user.is_admin)) {
        localStorage.setItem('movafi_token', res.token || res.user.id);
        onSuccess(res.user, res.account || ({} as any));
        onClose();
      } else if (res.is_inactive) {
        setIsInactiveAccount(true);
        setError(
          res.message ||
            (currentLang === 'fr'
              ? 'Votre compte est actuellement inactif. Un administrateur examine votre dossier. Veuillez contacter le service client afin de demander son activation.'
              : currentLang === 'es'
              ? 'Su cuenta está actualmente inactiva. Un administrador revisa su expediente. Por favor contacte a atención al cliente para solicitar su activación.'
              : currentLang === 'ar'
              ? 'حسابك غير نشط حالياً. يقوم المسؤول بمراجعة ملفك. يرجى التواصل مع خدمة العملاء لطلب التفعيل.'
              : 'Your account is currently inactive. An administrator is reviewing your dossier. Please contact customer support to request activation.')
        );
      } else {
        setError(res.message || (isRtl ? 'رمز PIN غير صحيح.' : 'Code PIN incorrect.'));
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('inactif') || err.message.includes('inactive'))) {
        setIsInactiveAccount(true);
      }
      setError(err.message || 'PIN verification error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-md my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 transition-all"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <MovafiLogo size="md" showText={false} className="mb-3" />
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Movafibank</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {step === 1 ? t.loginTitle : t.securityPinTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            {step === 1 ? t.loginSubtitle : `${t.greeting || ''} ${userName}. ${t.securityPinSubtitle}`}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {isInactiveAccount && (
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
                <span className="font-semibold text-[11px]">
                  {currentLang === 'fr'
                    ? 'Contacter le support :'
                    : currentLang === 'es'
                    ? 'Contactar soporte:'
                    : currentLang === 'ar'
                    ? 'الاتصال بالدعم:'
                    : 'Contact concierge:'}
                </span>
                <a
                  href={`mailto:${supportEmail}?subject=Demande%20d%27activation%20de%20compte`}
                  className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 underline hover:no-underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{supportEmail}</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Email + Password */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.emailLabel || 'Executive Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@movafibank.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.passwordLabel || 'Master Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400 ${isRtl ? 'pl-11' : 'pr-11'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? (t.authenticating || 'Authenticating...') : (t.continueToPin || 'Continue to Security PIN')}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                {t.noAccountYet || 'Pas encore client ? Ouvrir un compte bancaire en ligne →'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: 6-Digit PIN (strictly manual entry, NO autofill) */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                {currentLang === 'fr'
                  ? 'Saisissez manuellement votre code PIN à 6 chiffres'
                  : currentLang === 'es'
                  ? 'Ingrese manualmente su PIN de seguridad de 6 dígitos'
                  : currentLang === 'ar'
                  ? 'أدخل رمز الأمان PIN المكون من 6 أرقام يدوياً'
                  : 'Enter your 6-digit Security PIN manually'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5`}
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 mt-1">
                {currentLang === 'fr'
                  ? 'Le code PIN doit comporter exactement 6 chiffres numériques.'
                  : currentLang === 'es'
                  ? 'El PIN debe contener exactamente 6 dígitos numéricos.'
                  : currentLang === 'ar'
                  ? 'يجب أن يتكون رمز PIN من 6 أرقام رقمية بالضبط.'
                  : 'The PIN must consist of exactly 6 numeric digits.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setPin('');
                  setError(null);
                  setIsInactiveAccount(false);
                }}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {currentLang === 'fr' ? 'Retour' : currentLang === 'es' ? 'Volver' : currentLang === 'ar' ? 'رجوع' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? (t.unlocking || 'Unlocking...') : (t.unlockPortal || 'Authorize & Open Portal')}</span>
                <UserCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
