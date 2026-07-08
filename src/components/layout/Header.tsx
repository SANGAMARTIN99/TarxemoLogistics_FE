import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import {
  Truck, Menu, X, Sun, Moon, Globe, ChevronDown,
  Bell, User, LogOut, LayoutDashboard, Search
} from 'lucide-react';
import i18n from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import type { Language } from '../../store/useAppStore';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const Header: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, language, setLanguage, isAuthenticated, user, logout, notifications } = useAppStore();

  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP intro animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        logoRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'back.out(1.5)' }
      );
      if (navRef.current) {
        gsap.fromTo(
          navRef.current.querySelectorAll('.nav-item'),
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.3, ease: 'power2.out' }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  // Language change
  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  // Active nav
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', key: 'nav.home' },
    { path: '/companies', key: 'nav.companies' },
    { path: '/jobs', key: 'nav.jobs' },
    { path: '/about', key: 'nav.about' },
    { path: '/contact', key: 'nav.contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'glass border-b border-white/10 shadow-lg'
          : 'bg-transparent'
        }`}
    >
      <div className="container-wide flex items-center justify-between h-16 md:h-20">
        {/* ─── Logo ─────────────────────────────────────────────── */}
        <div ref={logoRef}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden"
              style={{ background: 'var(--gradient-primary)' }}>
              <Truck size={20} className="text-white" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <div>
              <span className="font-bold text-xl text-white hidden sm:block"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                <span style={{ color: 'var(--color-primary)' }}>Tarx</span>emo
              </span>
              <span className="text-[10px] text-white/60 -mt-1 hidden sm:block tracking-widest uppercase">
                Logistics
              </span>
            </div>
          </Link>
        </div>

        {/* ─── Desktop Nav ──────────────────────────────────────── */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-item px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive(link.path)
                  ? 'text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              style={isActive(link.path) ? { background: 'var(--gradient-primary)' } : {}}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* ─── Right Controls ────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className="nav-item p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-item p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language */}
          <div className="relative nav-item">
            <button
              onClick={() => setLangOpen((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              <Globe size={15} />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
              <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 glass rounded-xl overflow-hidden shadow-xl border border-white/10 z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-all ${language === lang.code
                        ? 'text-white font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    style={language === lang.code ? { background: 'rgba(232,88,10,0.2)' } : {}}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authenticated controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="nav-item relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                <Bell size={18} />
                {notifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>

              {/* Profile */}
              <div className="relative nav-item">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 hover:border-orange-500/50 transition-all"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'var(--gradient-primary)' }}>
                      {user?.firstName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-white text-sm font-medium">{user?.firstName}</span>
                  <ChevronDown size={13} className={`text-white/60 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass rounded-xl overflow-hidden shadow-xl border border-white/10 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                      <p className="text-white/50 text-xs mt-0.5">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                      onClick={() => setProfileOpen(false)}>
                      <LayoutDashboard size={15} />
                      {t('nav.dashboard')}
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                      <LogOut size={15} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 nav-item">
              <Link to="/auth" className="btn btn-ghost text-white border-white/20 hover:border-white/40 hover:bg-white/10 text-sm px-4 py-2">
                {t('nav.login')}
              </Link>
              <Link to="/auth?mode=register"
                className="btn btn-primary text-sm px-4 py-2">
                {t('nav.register')}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="lg:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ─── Search Bar (expandable) ──────────────────────────────── */}
      {searchOpen && (
        <div className="border-t border-white/10 px-4 py-3 glass">
          <div className="container-wide">
            <div className="relative max-w-2xl mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                autoFocus
                type="text"
                placeholder={t('hero.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Menu ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-white/10">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                    ? 'text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                style={isActive(link.path) ? { background: 'rgba(232,88,10,0.2)', color: 'var(--color-primary)' } : {}}
              >
                {t(link.key)}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <Link to="/auth" onClick={() => setMobileOpen(false)}
                  className="flex-1 btn btn-ghost text-white border-white/20 text-sm py-2">
                  {t('nav.login')}
                </Link>
                <Link to="/auth?mode=register" onClick={() => setMobileOpen(false)}
                  className="flex-1 btn btn-primary text-sm py-2">
                  {t('nav.register')}
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm">
                  <User size={15} />
                  {t('nav.dashboard')}
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm">
                  <LogOut size={15} />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown backdrop */}
      {(langOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setLangOpen(false); setProfileOpen(false); }} />
      )}
    </header>
  );
};

export default Header;
