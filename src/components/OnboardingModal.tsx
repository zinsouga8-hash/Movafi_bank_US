import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';
import { SupportedLanguage, SupportedCurrency, UserProfile, BankAccount } from '../types/banking';
import { translations } from '../i18n/translations';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  onSuccess: (user: UserProfile, account: BankAccount) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSuccess
}) => {
  const t = translations[currentLang];
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Access
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  // Referral Code state (auto-prefilled from URL ?ref=... or localStorage)
  const [referralCode, setReferralCode] = useState(() => {
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef) return urlRef.toUpperCase();
    const stored = localStorage.getItem('movafi_referral_ref');
    return stored || '';
  });
  const [referrerHint, setReferrerHint] = useState<string | null>(null);

  useEffect(() => {
    if (referralCode && referralCode.trim().length >= 4) {
      api.referrals.checkCode(referralCode.trim())
        .then((res) => {
          if (res.success && res.valid) {
            setReferrerHint(res.referrer_name || 'Membre Movafi Bank');
          } else {
            setReferrerHint(null);
          }
        })
        .catch(() => setReferrerHint(null));
    } else {
      setReferrerHint(null);
    }
  }, [referralCode]);

  // Step 2: OTP
  const [otp, setOtp] = useState('');

  // Step 3: Detailed Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('United States');
  const [residenceCountry, setResidenceCountry] = useState('United States');
  const [city, setCity] = useState('New York');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [accountType, setAccountType] = useState<'Personal' | 'Business'>('Personal');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(35000);
  const [activityDuration, setActivityDuration] = useState('5 years');

  // Step 4: KYC Files
  const [idFileName, setIdFileName] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Step 5: PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Step 6: Result
  const [generatedAccount, setGeneratedAccount] = useState<BankAccount | null>(null);
  const [generatedUser, setGeneratedUser] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  // Password complexity calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordMatch = password.length > 0 && password === confirmPassword;

  // Handlers
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasNumber) {
      setError('Password must have at least 8 characters and include a number.');
      return;
    }
    if (!passwordMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerStep1(email, password);
      if (res.success) {
        if (res.demoOtpHint) setDemoOtpCode(res.demoOtpHint);
        setStep(2);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(email, otp);
      if (res.success) {
        setStep(3);
      } else {
        setError(res.message || 'Invalid code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      setError('Please fill in all mandatory legal details.');
      return;
    }
    setError(null);
    setStep(4);
  };

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(5);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('Security PIN must be exactly 6 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PIN confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitApplication({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        nationality,
        residence_country: residenceCountry,
        city,
        preferred_currency: currency,
        account_type: accountType,
        occupation,
        monthly_income: monthlyIncome,
        activity_duration: activityDuration,
        pin,
        referral_code: referralCode.trim() || undefined
      });

      if (res.success && res.user && res.account) {
        localStorage.setItem('movafi_token', res.token || res.user.id);
        setGeneratedUser(res.user);
        setGeneratedAccount(res.account);
        setStep(6);
      } else {
        setError(res.message || 'Dossier submission failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAndEnter = () => {
    if (generatedUser && generatedAccount) {
      onSuccess(generatedUser, generatedAccount);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Step Tracker */}
        <div className="mb-6 space-y-1">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>MOVAFI BANK ONBOARDING DOSSIER</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {step === 1 && '1. Create Security Credentials'}
            {step === 2 && '2. Verify Identity Email (OTP)'}
            {step === 3 && '3. Private Client Profile'}
            {step === 4 && '4. KYC Compliance Documents'}
            {step === 5 && '5. Set 6-Digit Transaction PIN'}
            {step === 6 && '6. Account Credentials Generated'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Step {step} of 6 — Automated Private Client Onboarding Protocol
          </p>
        </div>

        {/* Step progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Executive Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters with number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{t.referralCodeOptional || 'Code de parrainage — facultatif'}</span>
                <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="MOV-8K4P2X"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {referrerHint && (
                <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.invitedByMember || 'Vous avez été invité par un membre de Movafi Bank.'} ({referrerHint})</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className={hasMinLength ? 'text-emerald-500 font-bold' : ''}>• 8+ characters</span>
                <span className="text-slate-300">|</span>
                <span className={hasNumber ? 'text-emerald-500 font-bold' : ''}>• Includes number</span>
                <span className="text-slate-300">|</span>
                <span className={passwordMatch ? 'text-emerald-500 font-bold' : ''}>• Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
            >
              <span>{loading ? 'Dispatching Code...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We have dispatched a confidential 6-digit OTP verification code to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
            </p>

            {demoOtpCode && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Code de sécurité temporaire :</span>
                <span className="font-mono font-bold text-sm tracking-wider">{demoOtpCode}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DETAILED PROFILE */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Legal First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom (ex: Jean)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Legal Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom (ex: Dupont)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="CAD">CAD — Canadian Dollar (C$)</option>
                  <option value="SAR">SAR — Saudi Riyal (ر.س / SAR)</option>
                  <option value="AED">AED — UAE Dirham (د.إ / AED)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Structure
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'Personal' | 'Business')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Personal">Private Wealth (Personal)</option>
                  <option value="Business">Corporate Treasury (Business)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City of Residence
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Professional Occupation
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Investment Principal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Est. Monthly Inflow ({currency})
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Continue to KYC</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: KYC DOCUMENTS */}
        {step === 4 && (
          <form onSubmit={handleStep4Submit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pursuant to digital banking compliance guidelines (KYC/AML), please attach verified identification and proof of address.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Government ID / Passport</div>
                    <div className="text-[11px] text-slate-400">{idFileName}</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <span>Browse</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setIdFileName(e.target.files?.[0]?.name || 'id_document.pdf')}
                  />
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Proof of Address / Utility Bill</div>
                    <div className="text-[11px] text-slate-400">{proofFileName}</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  <span>Browse</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setProofFileName(e.target.files?.[0]?.name || 'address_proof.pdf')}
                  />
                </label>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Continue to Security PIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: 6-DIGIT TRANSACTION PIN */}
        {step === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set your 6-digit transaction authorization PIN. This code is cryptographically hashed and never visible in plain text.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                6-Digit Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm 6-Digit Security PIN
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>{loading ? 'Generating Banking File...' : 'Submit Dossier'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 6: APPLICATION SUBMITTED & CREDENTIALS DISPLAY */}
        {step === 6 && generatedAccount && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Compte Bancaire Ouvert & Activé
              </h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                « Votre compte digital est prêt pour vos opérations »
              </p>
              <p className="text-xs text-slate-500">
                Vos identifiants bancaires sécurisés ont été générés avec succès. Vous pouvez maintenant gérer votre compte.
              </p>
            </div>

            {/* Banking Identifiers */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Identifiant Client (Client ID)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {generatedAccount.client_id}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Numéro de Compte</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {generatedAccount.account_number}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">IBAN International (RIB)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white break-all text-[11px]">
                  {generatedAccount.iban}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Code BIC / SWIFT</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {generatedAccount.bic_swift}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompleteAndEnter}
              className="w-full py-3 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Accéder à mon espace bancaire</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
