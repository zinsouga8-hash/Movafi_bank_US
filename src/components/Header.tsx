import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
  ArrowRight,
  UserCheck,
  User,
  Lock,
  Headphones,
  ChevronDown,
  ChevronRight,
  Check,
  Gift,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CreditCard,
  Landmark,
  Building2,
  LogOut
} from 'lucide-react';
import { UserProfile, SupportedLanguage } from '../types/banking';
import { translations } from '../i18n/translations';
import { MovafiLogo } from './MovafiLogo';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenPortal: () => void;
  onOpenAdmin: () => void;
  onOpenReferrals?: () => void;
  onNavigateTab?: (tab: 'overview' | 'transfer' | 'recharge' | 'withdraw' | 'cards' | 'financing' | 'referrals' | 'profile') => void;
  onLogout: () => void;
  supportEmail?: string;
  onNavigateSection?: (sectionId: string) => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  isDark,
  onToggleTheme,
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onOpenPortal,
  onOpenAdmin,
  onOpenReferrals,
  onNavigateTab,
  onLogout,
  supportEmail = 'concierge@movafibank.com',
  onNavigateSection,
  onLogoClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';

  // Lock body scroll when mobile menu is open (superimposed overlay contract)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle ESC key to close open overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setLangDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: SupportedLanguage; label: string; flag: string; native: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸', native: 'English (US)' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', native: 'Français' },
    { code: 'es', label: 'Español', flag: '🇪🇸', native: 'Español' },
    { code: 'ar', label: 'العربية', flag: '🇦🇪', native: 'العربية' }
  ];

  const currentLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  const handleSupportClick = () => {
    window.location.href = `mailto:${supportEmail}?subject=Movafi%20Bank%20Private%20Client%20Inquiry`;
  };

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 3x3 Grid Navigation Actions
  const handleGridAction = (actionId: string) => {
    setMobileMenuOpen(false);
    switch (actionId) {
      case 'deposit':
        if (currentUser && onNavigateTab) {
          onNavigateTab('recharge');
        } else {
          onOpenRegister();
        }
        break;
      case 'withdraw':
        if (currentUser && onNavigateTab) {
          onNavigateTab('withdraw');
        } else {
          onOpenLogin();
        }
        break;
      case 'transfer':
        if (currentUser && onNavigateTab) {
          onNavigateTab('transfer');
        } else {
          onOpenLogin();
        }
        break;
      case 'cards':
        if (currentUser && onNavigateTab) {
          onNavigateTab('cards');
        } else {
          onOpenRegister();
        }
        break;
      case 'financing':
        if (currentUser && onNavigateTab) {
          onNavigateTab('financing');
        } else {
          handleNavClick('financing');
        }
        break;
      case 'referrals':
        if (currentUser && onNavigateTab) {
          onNavigateTab('referrals');
        } else if (onOpenReferrals) {
          onOpenReferrals();
        } else {
          onOpenRegister();
        }
        break;
      case 'profile':
        if (currentUser && onNavigateTab) {
          onNavigateTab('profile');
        } else {
          onOpenLogin();
        }
        break;
      case 'security':
        if (currentUser && onNavigateTab) {
          onNavigateTab('profile');
        } else {
          onOpenLogin();
        }
        break;
      case 'about':
        handleNavClick('about');
        break;
      default:
        break;
    }
  };

  // 3x3 Grid items specification (Requirement 22)
  const gridItems = [
    { id: 'deposit', label: t.menuDeposit || 'Dépôt', icon: ArrowDownLeft, desc: 'Liquidity Inflow' },
    { id: 'withdraw', label: t.menuWithdraw || 'Retrait', icon: ArrowUpRight, desc: 'Treasury Payout' },
    { id: 'transfer', label: t.menuTransfer || 'Virement', icon: Send, desc: 'Wire Settlement' },
    { id: 'cards', label: t.menuCards || 'Cartes', icon: CreditCard, desc: 'Metal & Virtual' },
    { id: 'financing', label: t.menuFinancing || 'Financement', icon: Landmark, desc: 'Credit Facilities' },
    { id: 'referrals', label: t.menuReferrals || 'Parrainage', icon: Gift, desc: 'Affiliate Network' },
    { id: 'profile', label: t.menuProfile || 'Profil', icon: User, desc: 'Client Identity' },
    { id: 'security', label: t.menuSecurity || 'Sécurité', icon: Shield, desc: 'PIN & Keys' },
    { id: 'about', label: t.menuAbout || 'À propos', icon: Building2, desc: 'Institutional' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors shadow-xs">
      {/* Top Advisory Strip (Desktop only) */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-300 text-xs border-b border-amber-500/10 tracking-wide font-medium">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-300">{t.demoBadge}</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400/90 font-medium">United States Division</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={handleSupportClick}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
          >
            <Headphones className="w-3 h-3 text-amber-500" />
            <span>{t.customerService}: {supportEmail}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-1 sm:gap-4">
        
        {/* ========================================================================= */}
        {/* MOBILE SPECIFIC BAR (Screens < md: strictly 320px non-overflow contract) */}
        {/* ┌──────────────────────────────┐ */}
        {/* │ ☰       MOVAFI BANK        👤│ */}
        {/* └──────────────────────────────┘ */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between w-full min-w-0">
          {/* Left: ☰ Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>

          {/* Center: MOVAFI BANK Logo (fits cleanly on 320px) */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1 overflow-hidden">
            <MovafiLogo
              size="sm"
              onClick={onLogoClick}
            />
          </div>

          {/* Right: 👤 Profile / Sign In button "A" */}
          <div className="shrink-0 flex items-center gap-1">
            <button
              onClick={currentUser ? () => setUserMenuOpen(!userMenuOpen) : onOpenLogin}
              className="p-1 -mr-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={currentUser ? `Menu utilisateur (${currentUser.first_name})` : 'Connexion / Portail client'}
              title={currentUser ? `Menu utilisateur (${currentUser.first_name})` : 'Connexion'}
            >
              {currentUser ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center border border-amber-300/40 shadow-xs">
                  {currentUser.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'A'}
                </div>
              ) : (
                <User className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP BAR (Screens >= md) */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <MovafiLogo
              size="md"
              onClick={onLogoClick}
            />
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-8 text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300 min-w-0">
            <button
              onClick={() => handleNavClick('wealth')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.navWealth}
            </button>
            <button
              onClick={() => handleNavClick('financing')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.navFinancing}
            </button>
            <button
              onClick={() => handleNavClick('digital')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.navDigital}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.navAbout}
            </button>
            {onOpenReferrals && (
              <button
                onClick={onOpenReferrals}
                className="hidden xl:flex hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{t.navReferrals}</span>
              </button>
            )}
          </nav>

          {/* Controls: Language, Theme, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-3 shrink-0">
            {/* Language Selector */}
            <div className="relative shrink-0" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{currentLangObj.flag}</span>
                <span className="hidden xl:inline">{currentLangObj.label}</span>
                <span className="xl:hidden inline uppercase font-mono text-[11px]">{currentLangObj.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language / اللغة
                  </div>
                  {languages.map((lng) => (
                    <button
                      key={lng.code}
                      onClick={() => {
                        onLanguageChange(lng.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        currentLang === lng.code
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lng.flag}</span>
                        <span>{lng.native}</span>
                      </span>
                      {currentLang === lng.code && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Theme (Dark / Light)"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Superimposed Menu Trigger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Menu de navigation"
              title="Menu principal (superposé)"
            >
              <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>

            {/* Authentication Buttons (Desktop) */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.is_admin && (
                  <button
                    onClick={onOpenAdmin}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer whitespace-nowrap hidden sm:flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Admin</span>
                  </button>
                )}

                {/* Avatar "A" Button (Desktop trigger for User Menu) */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Menu utilisateur"
                  title="Menu utilisateur"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center border border-amber-300/40 shadow-xs">
                    {currentUser.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {currentUser.first_name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.navPortal}
                </button>

                <button
                  onClick={onOpenRegister}
                  className="px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>{t.navOpenAccount}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* USER MENU DROPDOWN (Requirement 3: click on "A" button in top right) */}
      {/* ========================================================================= */}
      {userMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99990] bg-slate-950/40 backdrop-blur-xs flex items-start justify-end p-2.5 sm:p-6 animate-in fade-in duration-150"
            onClick={() => setUserMenuOpen(false)}
          >
            <div
              ref={userMenuRef}
              className="mt-14 sm:mt-16 w-80 sm:w-88 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-[99991] animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
              dir={isRtl ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {currentUser?.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Compte Client Movafi'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser ? currentUser.email : 'Accès sécurisé'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-1.5 text-xs">
                {/* 1. SYSTÈME DE CHANGEMENT DE LANGUES */}
                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.menuLanguage || 'Changement de Langue'}</span>
                    </span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      {currentLangObj.flag} {currentLangObj.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {languages.map((lng) => (
                      <button
                        key={lng.code}
                        onClick={() => {
                          onLanguageChange(lng.code);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          currentLang === lng.code
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{lng.flag}</span>
                          <span>{lng.native}</span>
                        </span>
                        {currentLang === lng.code && <Check className="w-3 h-3 text-slate-950" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. PROFIL */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (currentUser && onNavigateTab) {
                      onNavigateTab('profile');
                    } else if (currentUser) {
                      onOpenPortal();
                    } else {
                      onOpenLogin();
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center gap-2.5 font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs leading-none">
                      {t.menuProfile || 'Profil'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Identité, sécurité et PIN de transaction</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* 3. SERVICES CLIENTS */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleSupportClick();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center gap-2.5 font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs leading-none">
                      {t.customerService || 'Services Clients'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Conciergerie privée 24/7 ({supportEmail})</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* 4. À PROPOS */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleNavClick('about');
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center gap-2.5 font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs leading-none">
                      {t.menuAbout || 'À propos'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Informations institutionnelles Movafi Bank</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* 5. SE DÉCONNECTER */}
                {currentUser ? (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-left flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>{t.navLogout || 'Se déconnecter'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-center font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{t.navPortal || 'Connexion'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 3×3 MOBILE HAMBURGER GRID MODAL / DRAWER (SUPERIMPOSED OVER ENTIRE PAGE VIA PORTAL) */}
      {/* ┌──────────┬──────────┬──────────┐ */}
      {/* │  Dépôt   │ Retrait  │ Virement │ */}
      {/* ├──────────┼──────────┼──────────┤ */}
      {/* │  Cartes  │Financement│Parrainage│ */}
      {/* ├──────────┼──────────┼──────────┤ */}
      {/* │  Profil  │ Sécurité │ À propos │ */}
      {/* └──────────┴──────────┴──────────┘ */}
      {/* ========================================================================= */}
      {mobileMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] bg-slate-950/85 backdrop-blur-md flex flex-col justify-start overflow-y-auto animate-in fade-in duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-950 border-b sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 w-full max-w-lg mx-auto min-h-screen sm:min-h-0 sm:my-8 sm:rounded-3xl animate-in slide-in-from-top-4 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Top Bar of the 3x3 Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MovafiLogo size="sm" onClick={() => { setMobileMenuOpen(false); onLogoClick?.(); }} />
              </div>

              <div className="flex items-center gap-2">
                {/* Language quick picker */}
                <div className="relative">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentLangObj.flag}</span>
                  </button>

                  {langDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                      {languages.map((lng) => (
                        <button
                          key={lng.code}
                          onClick={() => {
                            onLanguageChange(lng.code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between ${
                            currentLang === lng.code ? 'font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{lng.flag} {lng.native}</span>
                          {currentLang === lng.code && <Check className="w-3 h-3 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theme switch */}
                <button
                  onClick={onToggleTheme}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  aria-label="Basculer thème"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Header Banner */}
            <div className="pt-3 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Navigation Rapide · Movafi Core
              </span>
            </div>

            {/* 3×3 Grid Contract */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 py-3">
              {gridItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleGridAction(item.id)}
                    className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer active:scale-95 group shadow-2xs"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 group-hover:bg-amber-500 text-amber-600 dark:text-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-slate-400 hidden sm:block truncate max-w-full">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* User Session Bar / Auth Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                        {currentUser.first_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {currentUser.first_name} {currentUser.last_name}
                        </div>
                        <div className="text-[10px] text-slate-500">{currentUser.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); onOpenPortal(); }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold"
                    >
                      Espace
                    </button>
                  </div>

                  {currentUser.is_admin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Console d'Administration</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleSupportClick}
                      className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-1"
                    >
                      <Headphones className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.customerService}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400"
                    >
                      {t.navLogout}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center"
                    >
                      {t.navPortal}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenRegister();
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold text-center shadow-xs"
                    >
                      {t.navOpenAccount}
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      onClick={handleSupportClick}
                      className="text-[11px] text-slate-400 hover:text-amber-500 inline-flex items-center gap-1"
                    >
                      <Headphones className="w-3 h-3 text-amber-500" />
                      <span>{t.customerService}: {supportEmail}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
