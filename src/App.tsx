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

export type AppTheme = 'light' | 'dark' | 'mixed';

export default function App() {
  // Theme state: light, dark, or mixed
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('movafi_theme') as AppTheme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'mixed') return saved;
    return 'dark'; // Default to luxury dark mode
  });

  const isDark = theme !== 'light';

  // Language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('movafi_lang');
    if (saved === 'fr' || saved === 'es' || saved === 'en' || saved === 'ar') return saved as SupportedLanguage;
    return 'en';
  });

  // Settings
  const [bankSettings, setBankSettings] = useState<BankSettings | undefined>(undefined);

  // Authentication & Session with Instant Local Storage Hydration
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('movafi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentAccount, setCurrentAccount] = useState<BankAccount | null>(() => {
    try {
      const saved = localStorage.getItem('movafi_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // If user is already cached in localStorage, start non-blocking for immediate seamless render
  const [isInitializingAuth, setIsInitializingAuth] = useState(() => {
    try {
      return !localStorage.getItem('movafi_user');
    } catch {
      return true;
    }
  });

  // Modals & Navigation with persistent view & tab
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [view, setView] = useState<'public' | 'client' | 'admin'>(() => {
    const saved = localStorage.getItem('movafi_view') as any;
    if (saved === 'admin' || saved === 'client') return saved;
    const savedUser = localStorage.getItem('movafi_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.is_admin ? 'admin' : 'client';
      } catch {
        return 'public';
      }
    }
    return 'public';
  });
  const [clientTab, setClientTab] = useState<'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'profile' | 'referrals'>(() => {
    const savedTab = localStorage.getItem('movafi_client_tab') as any;
    if (savedTab && ['overview', 'transfer', 'recharge', 'withdraw', 'cards', 'financing', 'profile', 'referrals'].includes(savedTab)) {
      return savedTab;
    }
    return 'overview';
  });

  // Keep session caches synchronized in local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('movafi_user', JSON.stringify(currentUser));
      localStorage.setItem('movafi_token', currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentAccount) {
      localStorage.setItem('movafi_account', JSON.stringify(currentAccount));
    }
  }, [currentAccount]);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-mixed');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'mixed') {
      root.classList.add('theme-mixed');
    }
    localStorage.setItem('movafi_theme', theme);
  }, [theme]);

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
      setCurrentUser((prev) => (prev ? { ...prev, preferred_language: lang } : null));
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

        const savedLang = localStorage.getItem('movafi_lang') as SupportedLanguage | null;
        if (savedLang) {
          setCurrentLang(savedLang);
        }

        const token = localStorage.getItem('movafi_token');
        if (token) {
          try {
            const authRes = await api.getMe();
            if (authRes.success && authRes.user) {
              setCurrentUser(authRes.user);
              if (authRes.account) setCurrentAccount(authRes.account);
              if (!savedLang && authRes.user.preferred_language) {
                setCurrentLang(authRes.user.preferred_language);
                localStorage.setItem('movafi_lang', authRes.user.preferred_language);
              }
              if (authRes.user.is_admin) {
                const savedView = localStorage.getItem('movafi_view');
                setView(savedView === 'client' ? 'client' : 'admin');
              } else {
                // Regular client remains seamlessly logged in on refresh
                setView('client');
                localStorage.setItem('movafi_view', 'client');
                const savedTab = localStorage.getItem('movafi_client_tab') as any;
                if (savedTab) {
                  setClientTab(savedTab);
                }
              }
            } else if (authRes.success === false && authRes.message?.includes('expired')) {
              // Token strictly expired from server
              localStorage.removeItem('movafi_token');
              localStorage.removeItem('movafi_user');
              localStorage.removeItem('movafi_account');
              localStorage.removeItem('movafi_view');
              setCurrentUser(null);
              setCurrentAccount(null);
              setView('public');
            }
          } catch (apiErr) {
            console.warn('Silent session validation fallback (keeping existing session):', apiErr);
            // On connection glitch or reload, preserve current valid session
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
      localStorage.setItem('movafi_view', 'admin');
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
      localStorage.setItem('movafi_view', 'client');
      localStorage.setItem('movafi_client_tab', 'referrals');
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleLoginSuccess = (user: UserProfile, account: BankAccount) => {
    setCurrentUser(user);
    setCurrentAccount(account);
    localStorage.setItem('movafi_token', user.id);
    localStorage.setItem('movafi_user', JSON.stringify(user));
    localStorage.setItem('movafi_account', JSON.stringify(account));
    const savedLang = localStorage.getItem('movafi_lang') as SupportedLanguage | null;
    if (!savedLang && user.preferred_language) {
      setCurrentLang(user.preferred_language);
      localStorage.setItem('movafi_lang', user.preferred_language);
    }
    if (user.is_admin) {
      setView('admin');
      localStorage.setItem('movafi_view', 'admin');
    } else {
      setView('client');
      localStorage.setItem('movafi_view', 'client');
      const savedTab = localStorage.getItem('movafi_client_tab') as any;
      if (savedTab) setClientTab(savedTab);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('movafi_token');
    localStorage.removeItem('movafi_user');
    localStorage.removeItem('movafi_account');
    localStorage.removeItem('movafi_view');
    localStorage.removeItem('movafi_client_tab');
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

  if (isInitializingAuth && !currentUser) {
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
  if (view === 'client' && currentUser) {
    if (!currentAccount) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <MovafiLogo size="lg" />
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-slate-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Chargement du compte bancaire sécurisé...</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Header
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onThemeChange={setTheme}
          isDark={isDark}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'mixed' : 'light')}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenPortal={() => {
            setView('client');
            localStorage.setItem('movafi_view', 'client');
          }}
          onOpenAdmin={() => {
            setView('admin');
            localStorage.setItem('movafi_view', 'admin');
          }}
          onOpenReferrals={handleOpenReferrals}
          onNavigateTab={(tab) => {
            setView('client');
            setClientTab(tab);
            localStorage.setItem('movafi_view', 'client');
            localStorage.setItem('movafi_client_tab', tab);
          }}
          onLogout={handleLogout}
          supportEmail={bankSettings?.support_email}
          onNavigateSection={scrollToSection}
          onLogoClick={() => {
            if (currentUser) {
              setView('client');
              localStorage.setItem('movafi_view', 'client');
            } else {
              setView('public');
              localStorage.setItem('movafi_view', 'public');
            }
          }}
        />
        <div className="flex-1">
          <ClientDashboard
            user={currentUser}
            initialAccount={currentAccount}
            currentLang={currentLang}
            onLogout={handleLogout}
            settings={bankSettings}
            initialTab={clientTab}
            onTabChange={(tab) => {
              setClientTab(tab as any);
              localStorage.setItem('movafi_client_tab', tab);
            }}
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
        theme={theme}
        onThemeChange={setTheme}
        isDark={isDark}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'mixed' : 'light')}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenPortal={() => {
          setView('client');
          setClientTab('overview');
          localStorage.setItem('movafi_view', 'client');
          localStorage.setItem('movafi_client_tab', 'overview');
        }}
        onOpenAdmin={() => {
          setView('admin');
          localStorage.setItem('movafi_view', 'admin');
        }}
        onOpenReferrals={handleOpenReferrals}
        onNavigateTab={(tab) => {
          setView('client');
          setClientTab(tab);
          localStorage.setItem('movafi_view', 'client');
          localStorage.setItem('movafi_client_tab', tab);
        }}
        onLogout={handleLogout}
        supportEmail={bankSettings?.support_email}
        onNavigateSection={scrollToSection}
        onLogoClick={() => {
          if (currentUser) {
            setView('client');
            localStorage.setItem('movafi_view', 'client');
          } else {
            setView('public');
            localStorage.setItem('movafi_view', 'public');
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
          localStorage.setItem('movafi_token', newUser.id);
          localStorage.setItem('movafi_user', JSON.stringify(newUser));
          localStorage.setItem('movafi_account', JSON.stringify(newAccount));
          setCurrentUser(newUser);
          setCurrentAccount(newAccount);
          if (newAccount.account_status === 'active' || newAccount.application_status === 'approved') {
            setView('client');
            localStorage.setItem('movafi_view', 'client');
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
