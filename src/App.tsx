import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { LoanSimulatorPreview } from './components/LoanSimulatorPreview';
import { Footer } from './components/Footer';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginModal } from './components/LoginModal';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPortal } from './components/AdminPortal';
import { UserProfile, BankAccount, SupportedLanguage, BankSettings } from './types/banking';
import { api } from './services/api';
import { MovafiLogo } from './components/MovafiLogo';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('movafi_theme');
    if (saved) return saved === 'dark';
    return true; // Default to luxury dark mode
  });

  // Language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('movafi_lang');
    if (saved === 'fr' || saved === 'es' || saved === 'en' || saved === 'ar') return saved as SupportedLanguage;
    return 'en';
  });

  // Settings
  const [bankSettings, setBankSettings] = useState<BankSettings | undefined>(undefined);

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentAccount, setCurrentAccount] = useState<BankAccount | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  // Modals & Navigation
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [view, setView] = useState<'public' | 'client' | 'admin'>('public');
  const [clientTab, setClientTab] = useState<'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals'>('overview');

  // Sync theme with DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('movafi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('movafi_theme', 'light');
    }
  }, [isDark]);

  // Sync language and RTL with DOM
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [currentLang]);

  // Sync language with localStorage
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    localStorage.setItem('movafi_lang', lang);
    if (currentUser) {
      api.updateProfile({ preferred_language: lang }).catch(() => {});
    }
  };

  // Initial load: settings and session restoration
  useEffect(() => {
    const initApp = async () => {
      try {
        const settingsRes = await api.getSettings();
        if (settingsRes.success && settingsRes.settings) {
          setBankSettings(settingsRes.settings);
        }

        const token = localStorage.getItem('movafi_token');
        if (token) {
          const authRes = await api.getMe();
          if (authRes.success && authRes.user && authRes.account) {
            setCurrentUser(authRes.user);
            setCurrentAccount(authRes.account);
            if (authRes.user.preferred_language) {
              setCurrentLang(authRes.user.preferred_language);
            }
          }
        }
      } catch (err) {
        console.error('Initial session check failed:', err);
      } finally {
        setIsInitializingAuth(false);
      }
    };

    initApp();

    // Check for admin route in URL hash or path
    if (window.location.pathname.includes('/administration') || window.location.hash.includes('admin')) {
      setView('admin');
    }

    // Referral URL Detection (/register?ref=MOV-8K4P2X or ?ref=MOV-8K4P2X)
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('movafi_referral_ref', refCode.trim().toUpperCase());
      localStorage.setItem('movafi_referral_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
      setIsRegisterOpen(true);
    } else if (window.location.pathname === '/register') {
      setIsRegisterOpen(true);
    }
  }, []);

  const handleOpenReferrals = () => {
    if (currentUser && currentAccount) {
      setView('client');
      setClientTab('referrals');
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleLoginSuccess = (user: UserProfile, account: BankAccount) => {
    setCurrentUser(user);
    setCurrentAccount(account);
    if (user.preferred_language) {
      setCurrentLang(user.preferred_language);
    }
    if (user.is_admin && (window.location.hash.includes('admin') || window.location.pathname.includes('admin'))) {
      setView('admin');
    } else {
      setView('client');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('movafi_token');
    setCurrentUser(null);
    setCurrentAccount(null);
    setView('public');
  };

  const scrollToSection = (sectionId: string) => {
    if (view !== 'public') {
      setView('public');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <MovafiLogo size="lg" />
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Establishing Secure Ledger Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // View: Administration Portal
  if (view === 'admin' && currentUser?.is_admin) {
    return (
      <AdminPortal
        currentUser={currentUser}
        onExit={() => setView('public')}
      />
    );
  }

  // View: Client Dashboard (NO FOOTER as requested by user)
  if (view === 'client' && currentUser && currentAccount) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Header
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenPortal={() => {
            setView('client');
            setClientTab('overview');
          }}
          onOpenAdmin={() => setView('admin')}
          onOpenReferrals={handleOpenReferrals}
          onNavigateTab={(tab) => {
            setView('client');
            setClientTab(tab);
          }}
          onLogout={handleLogout}
          supportEmail={bankSettings?.support_email}
          onNavigateSection={scrollToSection}
          onLogoClick={() => setView('public')}
        />
        <div className="flex-1">
          <ClientDashboard
            user={currentUser}
            initialAccount={currentAccount}
            currentLang={currentLang}
            onLogout={handleLogout}
            settings={bankSettings}
            initialTab={clientTab}
          />
        </div>
      </div>
    );
  }

  // View: Public Institutional Homepage (WITH FOOTER)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenPortal={() => {
          setView('client');
          setClientTab('overview');
        }}
        onOpenAdmin={() => setView('admin')}
        onOpenReferrals={handleOpenReferrals}
        onNavigateTab={(tab) => {
          setView('client');
          setClientTab(tab);
        }}
        onLogout={handleLogout}
        supportEmail={bankSettings?.support_email}
        onNavigateSection={scrollToSection}
        onLogoClick={() => {
          if (currentUser) {
            setView('client');
          } else {
            setView('public');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <main className="flex-1">
        <Hero
          currentLang={currentLang}
          city={bankSettings?.city || 'New York'}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        <Solutions
          currentLang={currentLang}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenFinancingSimulator={() => scrollToSection('financing-simulator')}
          supportEmail={bankSettings?.support_email}
          supportPhone={bankSettings?.support_phone}
        />

        <div id="financing-simulator">
          <LoanSimulatorPreview
            onOpenRegister={() => setIsRegisterOpen(true)}
            currency={currentAccount?.currency || 'USD'}
            currentLang={currentLang}
          />
        </div>
      </main>

      <Footer
        currentLang={currentLang}
        city={bankSettings?.city}
        supportEmail={bankSettings?.support_email}
        supportPhone={bankSettings?.support_phone}
        onOpenAdmin={currentUser?.is_admin ? () => setView('admin') : undefined}
        onNavigateSection={scrollToSection}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        currentLang={currentLang}
        supportEmail={bankSettings?.support_email}
        onSuccess={(newUser, newAccount) => {
          // If approved/active, can enter; otherwise stays inactive awaiting admin validation
          if (newAccount.account_status === 'active') {
            setCurrentUser(newUser);
            setCurrentAccount(newAccount);
            setView('client');
          }
        }}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentLang={currentLang}
        supportEmail={bankSettings?.support_email}
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />
    </div>
  );
}
