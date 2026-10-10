import React, { useState, useEffect } from 'react';
import { UserProfile, BankAccount, NotificationItem } from './types/banking';
import { api } from './services/api';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { LoanSimulatorPreview } from './components/LoanSimulatorPreview';
import { AboutSection } from './components/AboutSection';
import { ReferralSection } from './components/ReferralSection';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPortal } from './components/AdminPortal';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentLang, setCurrentLang] = useState('fr');
  const [view, setView] = useState<'landing' | 'client' | 'admin'>('landing');

  // Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchSessionAndData = async () => {
    const token = localStorage.getItem('movafi_token');
    if (!token) {
      setLoadingInitial(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setAccount(res.account);
        setAccounts(res.accounts || [res.account]);
        if (res.notifications) setNotifications(res.notifications);

        if (res.user.is_admin) {
          setView('admin');
        } else {
          setView('client');
        }
      } else {
        localStorage.removeItem('movafi_token');
      }
    } catch {
      localStorage.removeItem('movafi_token');
    } finally {
      setLoadingInitial(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile, primaryAccount: BankAccount, allAccounts: BankAccount[]) => {
    setUser(loggedInUser);
    setAccount(primaryAccount);
    setAccounts(allAccounts || [primaryAccount]);
    if (loggedInUser.is_admin) {
      setView('admin');
    } else {
      setView('client');
    }
    refreshNotifications();
  };

  const handleLogout = () => {
    localStorage.removeItem('movafi_token');
    setUser(null);
    setAccount(null);
    setAccounts([]);
    setNotifications([]);
    setView('landing');
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Chargement Sécurisé Movafi Bank...
          </span>
        </div>
      </div>
    );
  }

  // Admin View
  if (view === 'admin' && user?.is_admin) {
    return (
      <AdminPortal
        user={user}
        onRefreshData={fetchSessionAndData}
        onLogout={handleLogout}
        onBackToClient={() => setView('client')}
      />
    );
  }

  // Client Dashboard View
  if (view === 'client' && user && account) {
    return (
      <>
        <ClientDashboard
          user={user}
          account={account}
          accounts={accounts}
          notifications={notifications}
          onRefreshData={fetchSessionAndData}
          onLogout={handleLogout}
          onOpenNotifications={() => setShowNotificationsModal(true)}
        />
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={notifications}
          onRefresh={refreshNotifications}
        />
      </>
    );
  }

  // Landing Page View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        user={user}
        account={account}
        notifications={notifications}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenRegister={() => setShowRegisterModal(true)}
        onOpenDashboard={() => setView('client')}
        onOpenAdmin={() => setView('admin')}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Hero
          onOpenRegister={() => setShowRegisterModal(true)}
          onOpenSimulator={() => {
            const el = document.getElementById('simulator');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <Solutions />
        <LoanSimulatorPreview onOpenRegister={() => setShowRegisterModal(true)} />
        <AboutSection />
        <ReferralSection onOpenRegister={() => setShowRegisterModal(true)} />
      </main>

      <Footer />

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setShowRegisterModal(true)}
      />

      <OnboardingModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setShowLoginModal(true)}
      />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        onRefresh={refreshNotifications}
      />
    </div>
  );
};
