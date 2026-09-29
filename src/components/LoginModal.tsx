import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound, UserCheck, Shield, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { SupportedLanguage, UserProfile, BankAccount } from '../types/banking';
import { translations } from '../i18n/translations';
import { MovafiLogo } from './MovafiLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  onSuccess: (user: UserProfile, account: BankAccount) => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSuccess,
  onSwitchToRegister
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
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Email + Password
  const handleStep1Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.loginStep1(email.trim(), password);
      if (res.success && res.user_id) {
        setUserId(res.user_id);
        setUserName(res.first_name || 'Executive Client');
        setUserIsAdmin(Boolean(res.is_admin));
        // Pre-set appropriate PIN default to prevent any typo or lockout
        const defaultPin = res.is_admin ? '998877' : '123456';
        setPin(defaultPin);
        setStep(2);
      } else {
        setError(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 6-digit PIN
  const handleStep2Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userId) return;
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      setError(isRtl ? 'يرجى إدخال رمز الأمان المكون من 6 أرقام.' : 'Please enter your 6-digit Security PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginStep2(userId, cleanPin);
      if (res.success && res.user) {
        localStorage.setItem('movafi_token', res.token || res.user.id);
        const acc = res.account || {
          id: 'acc_' + res.user.id,
          profile_id: res.user.id,
          client_id: res.user.is_admin ? 'EXECUTIVE-01' : 'CL-99001',
          account_number: '984000100201',
          iban: 'US94MOVA021000021984000100201',
          bic_swift: 'MOVAFUS33XXX',
          currency: res.user.preferred_currency || 'USD',
          balance: res.user.is_admin ? 50000000.00 : 2845000.00,
          account_status: 'active' as const,
          is_balance_visible: true,
          created_at: new Date().toISOString()
        };
        onSuccess(res.user, acc);
        onClose();
      } else {
        setError(res.message || (isRtl ? 'فشل التحقق من رمز PIN.' : 'Security PIN verification failed.'));
      }
    } catch (err: any) {
      setError(err.message || 'PIN verification error.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Fast Sign In
  const handleInstantSignIn = async (targetEmail: string, targetPass: string, defaultPin: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
    setLoading(true);
    try {
      const step1Res = await api.loginStep1(targetEmail, targetPass);
      if (step1Res.success && step1Res.user_id) {
        const step2Res = await api.loginStep2(step1Res.user_id, defaultPin);
        if (step2Res.success && step2Res.user) {
          localStorage.setItem('movafi_token', step2Res.token || step2Res.user.id);
          const acc = step2Res.account || {
            id: 'acc_' + step2Res.user.id,
            profile_id: step2Res.user.id,
            client_id: step2Res.user.is_admin ? 'EXECUTIVE-01' : 'CL-99001',
            account_number: '984000100201',
            iban: 'US94MOVA021000021984000100201',
            bic_swift: 'MOVAFUS33XXX',
            currency: step2Res.user.preferred_currency || 'USD',
            balance: step2Res.user.is_admin ? 50000000.00 : 2845000.00,
            account_status: 'active' as const,
            is_balance_visible: true,
            created_at: new Date().toISOString()
          };
          onSuccess(step2Res.user, acc);
          onClose();
          return;
        }
      }
      // Fallback to manual step 2
      setUserId(step1Res.user_id || null);
      setPin(defaultPin);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
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
            <span>MOVAFI BANK UNITED STATES</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {step === 1 
              ? (isRtl ? 'تسجيل الدخول الآمن' : 'Private Client Access') 
              : (isRtl ? 'التحقق برمز الأمان PIN' : 'Security PIN Authorization')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            {step === 1
              ? (isRtl ? 'أدخل بريدك الإلكتروني المعتمد وكلمة المرور المشفرة.' : 'Enter your registered credentials to access your private ledger.')
              : (isRtl ? `مرحباً بك، ${userName}. يرجى تأكيد رمز PIN المكون من 6 أرقام.` : `Welcome back, ${userName}. Please enter your 6-digit authorization PIN.`)}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Email + Password */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRtl ? 'البريد الإلكتروني المعتمد' : 'Executive Email'}
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
                {isRtl ? 'كلمة المرور' : 'Master Password'}
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
              <span>{loading ? (isRtl ? 'جارٍ التحقق...' : 'Authenticating...') : (isRtl ? 'المتابعة إلى رمز PIN' : 'Continue to Security PIN')}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* Administration / Staff Access */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isRtl ? 'بوابة الإدارة والامتثال' : 'Executive Administration Portal'}
                </span>
                <Shield className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <button
                type="button"
                onClick={() => handleInstantSignIn('admin@movafibank.com', 'AdminPass2026!', '998877')}
                className="w-full p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-900 dark:text-amber-200 cursor-pointer text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-bold flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <span>Executive Administrator</span>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">PIN: 998877</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">admin@movafibank.com · Genevieve Rothschild</div>
                </div>
                <ArrowRight className={`w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                {isRtl ? 'ليس لديك حساب بعد؟ افتح حسابك الرقمي الآن' : "Pas encore client ? Ouvrir un compte bancaire en ligne →"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: 6-Digit PIN */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium">
                  {userIsAdmin ? (isRtl ? 'رمز أمان الإدارة: 998877' : 'Executive Security PIN: 998877') : (isRtl ? 'رمز أمان العميل: 123456' : 'Client Security PIN: 123456')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPin(userIsAdmin ? '998877' : '123456')}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 underline hover:no-underline cursor-pointer"
              >
                {isRtl ? 'تعبئة' : 'Auto Fill'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                {isRtl ? 'أدخل رمز الأمان المكون من 6 أرقام' : '6-Digit Authorization Security PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  required
                  autoFocus
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
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isRtl ? 'رجوع' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? (isRtl ? 'جارٍ الفتح...' : 'Unlocking...') : (isRtl ? 'فتح البوابة المصرفية' : 'Authorize & Open Portal')}</span>
                <UserCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
