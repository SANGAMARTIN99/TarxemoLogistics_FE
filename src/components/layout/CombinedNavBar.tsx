import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Truck, Building2, Briefcase, Layers, LayoutDashboard, Bell, Sun, Moon,
  ClipboardList, RefreshCw, Settings, FileText, X, Menu, Map, LogOut,
  ChevronRight, ChevronDown, Package, History, MessageSquare, User,
  BarChart3, Shield, Zap, Navigation, CreditCard, Users, Star,
  TrendingUp, Globe, Wallet, HelpCircle, BookOpen
} from 'lucide-react';
import { GET_MY_TENANT_MEMBERSHIPS } from '../../api/queries';
import { LOGOUT_USER } from '../../api/mutations';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../store/useAppStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CURRENCY_SYMBOLS, CURRENCY_FLAGS, CURRENCY_NAMES } from '../../utils/currency';

import CustomerDashboard from '../../pages/Customer/CustomerDashboard';
import CustomerShipments from '../../pages/Customer/CustomerShipments';
import CustomerHistory from '../../pages/Customer/CustomerHistory';
import CustomerTracking from '../../pages/Customer/CustomerTracking';
import CustomerInvoices from '../../pages/Customer/CustomerInvoices';
import CustomerSupport from '../../pages/Customer/CustomerSupport';
import CustomerProfile from '../../pages/Customer/CustomerProfile';
import DriverDashboard from '../../pages/Driver/DriverDashboard';
import DriverTrips from '../../pages/Driver/DriverTrips';
import DriverTripHistory from '../../pages/Driver/DriverTripHistory';
import DriverEarnings from '../../pages/Driver/DriverEarnings';
import DriverRatings from '../../pages/Driver/DriverRatings';
import DriverProfile from '../../pages/Driver/DriverProfile';
import TenantDashboard from '../../pages/TenantAdmin/TenantDashboard';
import SuperAdminDashboard from '../../pages/SuperAdmin/SuperAdminDashboard';

// ─── Language options ─────────────────────────────────────────────────────────
const LANGS = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'sw', flag: '🇹🇿', name: 'Kiswahili' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
];

const CURRENCIES = ['TZS','KES','USD','EUR','UGX','RWF'];

interface MenuCategory {
  title: string;
  items: { path: string; label: string; icon: React.ElementType }[];
}

const ROLE_MENUS: Record<UserRole, MenuCategory[]> = {
  CUSTOMER: [
    {
      title: 'Core Logistics',
      items: [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/dashboard/shipments', label: 'My Shipments', icon: Package },
        { path: '/dashboard/tracking', label: 'Track Cargo', icon: Navigation },
        { path: '/dashboard/quotes', label: 'Request Quote', icon: Briefcase },
      ]
    },
    {
      title: 'Finance & Records',
      items: [
        { path: '/dashboard/invoices', label: 'Invoices', icon: FileText },
        { path: '/dashboard/history', label: 'Shipment History', icon: History },
      ]
    },
    {
      title: 'Account & Support',
      items: [
        { path: '/dashboard/support', label: 'Support Center', icon: MessageSquare },
        { path: '/dashboard/profile', label: 'My Profile', icon: User },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  DRIVER: [
    {
      title: 'Transit Operations',
      items: [
        { path: '/dashboard', label: 'Driver Console', icon: LayoutDashboard },
        { path: '/dashboard/trips', label: 'Active Trips', icon: Truck },
        { path: '/dashboard/trip-history', label: 'Trip History', icon: History },
      ]
    },
    {
      title: 'Performance & Docs',
      items: [
        { path: '/dashboard/earnings', label: 'Earnings', icon: Wallet },
        { path: '/dashboard/ratings', label: 'My Ratings', icon: Star },
        { path: '/dashboard/documents', label: 'Documents', icon: BookOpen },
      ]
    },
    {
      title: 'Account',
      items: [
        { path: '/dashboard/support', label: 'Support', icon: MessageSquare },
        { path: '/dashboard/profile', label: 'Profile', icon: User },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  TENANT_ADMIN: [
    {
      title: 'Operations',
      items: [
        { path: '/dashboard', label: 'Tenant Console', icon: LayoutDashboard },
        { path: '/dashboard/fleet', label: 'Fleet Manager', icon: Truck },
        { path: '/dashboard/jobs', label: 'Load Dispatches', icon: Briefcase },
        { path: '/dashboard/drivers', label: 'Driver Registry', icon: Users },
      ]
    },
    {
      title: 'Management & pricing',
      items: [
        { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/dashboard/billing', label: 'Billing', icon: CreditCard },
        { path: '/dashboard/pricing', label: 'Pricing Matrix', icon: TrendingUp },
        { path: '/dashboard/customers', label: 'Customers', icon: Globe },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  SUPER_ADMIN: [
    {
      title: 'Platform Control',
      items: [
        { path: '/dashboard', label: 'Global Monitor', icon: LayoutDashboard },
        { path: '/dashboard/tenants', label: 'Tenants Registry', icon: Building2 },
        { path: '/dashboard/users', label: 'User Management', icon: Users },
        { path: '/dashboard/analytics', label: 'Platform Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Security & Audits',
      items: [
        { path: '/dashboard/system-logs', label: 'Audit Manifests', icon: ClipboardList },
        { path: '/dashboard/security', label: 'Security Center', icon: Shield },
        { path: '/dashboard/integrations', label: 'Integrations', icon: Zap },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  OPERATIONS_MANAGER: [
    {
      title: 'Realtime Monitoring',
      items: [
        { path: '/dashboard', label: 'Ops Console', icon: LayoutDashboard },
        { path: '/dashboard/tracking', label: 'Live GPS Corridor', icon: Map },
      ]
    },
    {
      title: 'Operations Management',
      items: [
        { path: '/dashboard/dispatches', label: 'Dispatches', icon: Briefcase },
        { path: '/dashboard/drivers', label: 'Driver Status', icon: Users },
        { path: '/dashboard/incidents', label: 'Incidents', icon: ClipboardList },
      ]
    },
    {
      title: 'Reporting',
      items: [
        { path: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  FINANCE_OFFICER: [
    {
      title: 'Billing & Payroll',
      items: [
        { path: '/dashboard', label: 'Finance Console', icon: LayoutDashboard },
        { path: '/dashboard/invoices', label: 'Billing Manifests', icon: FileText },
        { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
        { path: '/dashboard/payroll', label: 'Driver Payroll', icon: Wallet },
      ]
    },
    {
      title: 'Accounting',
      items: [
        { path: '/dashboard/reports', label: 'Financial Reports', icon: BarChart3 },
        { path: '/dashboard/tax', label: 'Tax Records', icon: ClipboardList },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  VIEWER: [
    {
      title: 'Console',
      items: [
        { path: '/dashboard', label: 'Console Home', icon: LayoutDashboard },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
};

// ─── Dropdown component ───────────────────────────────────────────────────────
const Dropdown: React.FC<{ trigger: React.ReactNode; children: React.ReactNode; align?: 'left'|'right' }> = ({ trigger, children, align='right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-2 glass border border-[var(--color-border)] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 min-w-[160px] ${align==='right' ? 'right-0' : 'left-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── MAIN NAV ─────────────────────────────────────────────────────────────────
const CombinedNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, theme, toggleTheme, language, setLanguage, activeTenantId, setActiveTenantId, currency, setCurrency } = useAppStore();
  const { t } = useTranslation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: membershipData } = useQuery(GET_MY_TENANT_MEMBERSHIPS, { skip: !user });
  const memberships = membershipData?.myTenantMemberships || [];
  const currentMembership = memberships.find((m: any) => m.tenant.id === (activeTenantId || user?.tenantId)) || memberships[0];
  const userRole: UserRole = currentMembership?.role || user?.role || 'DRIVER';
  const menuCategories = ROLE_MENUS[userRole] || ROLE_MENUS.VIEWER;

  const [logoutUser] = useMutation(LOGOUT_USER);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setCompanyDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (contentRef.current) gsap.fromTo(contentRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout(); toast.success('Logged out.'); navigate('/');
  };

  const currentLang = LANGS.find(l => l.code === language) || LANGS[0];

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between py-5 px-3">
      <div className="space-y-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
              <span className="text-orange-500">Tarx</span>emo
            </span>
            <p className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest -mt-0.5 font-bold">Logistics</p>
          </div>
        </Link>

        {/* Company switcher */}
        {memberships.length > 0 && (
          <div className="relative" ref={switcherRef}>
            <button onClick={() => setCompanyDropdownOpen(p => !p)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/40 bg-[var(--color-surface-2)] text-xs font-bold transition-all text-[var(--color-text)]">
              <div className="flex items-center gap-2 truncate">
                <Building2 size={13} className="text-orange-500 shrink-0" />
                <span className="truncate">{currentMembership?.tenant?.name || 'Select'}</span>
              </div>
              <ChevronDown size={12} className={`text-[var(--color-text-muted)] transition-transform ${companyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {companyDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 glass border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden">
                {memberships.map((m: any) => {
                  const isActive = (activeTenantId || user?.tenantId) === m.tenant.id;
                  return (
                    <button key={m.id} onClick={() => { setActiveTenantId(m.tenant.id); setCompanyDropdownOpen(false); toast.success(`Switched to ${m.tenant.name}`); }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs border-b border-[var(--color-border)] last:border-0 hover:bg-orange-500/5 transition-all ${isActive ? 'text-orange-500 font-bold bg-orange-500/5' : 'text-[var(--color-text)]'}`}>
                      <span className="truncate">{m.tenant.name}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Role badge */}
        <div className="px-2">
          <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
            {userRole.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Nav items */}
        <nav className="space-y-4">
          {menuCategories.map((category) => (
            <div key={category.title} className="space-y-1">
              <span className="px-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-light)]/70">
                {category.title}
              </span>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-orange-500/12 text-orange-500 font-bold border border-orange-500/20'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border border-transparent'
                      }`}>
                      <item.icon size={15} className={isActive ? 'text-orange-500' : ''} />
                      <span>{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User + logout */}
      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-xs font-black text-white">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-[var(--color-text)] truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[9px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all">
          <LogOut size={14} />Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Desktop Sidebar */}
      <aside className="w-60 shrink-0 glass border-r border-[var(--color-border)] hidden lg:block h-screen z-40 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-[var(--color-border)] glass px-4 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
              <Menu size={18} />
            </button>
            <span className="hidden lg:block text-[10px] text-[var(--color-text-muted)] uppercase font-black tracking-widest">
              Logistics Dashboard Gateway
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Language Dropdown */}
            <Dropdown align="right" trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-[var(--color-border)] text-xs font-bold hover:border-orange-500/40 transition-all">
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="text-[var(--color-text)] hidden sm:block">{currentLang.code.toUpperCase()}</span>
                <ChevronDown size={11} className="text-[var(--color-text-muted)]" />
              </button>
            }>
              <div className="py-1.5 px-1">
                <p className="text-[8px] font-black uppercase tracking-wider text-[var(--color-text-muted)] px-2 pb-1.5">Language</p>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code as any)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${language === l.code ? 'bg-orange-500/10 text-orange-400 font-bold' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}>
                    <span className="text-base">{l.flag}</span>
                    <span>{l.name}</span>
                    {language === l.code && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>
            </Dropdown>

            {/* Currency Dropdown */}
            <Dropdown align="right" trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-[var(--color-border)] text-xs font-bold hover:border-orange-500/40 transition-all">
                <span className="text-base leading-none">{CURRENCY_FLAGS[currency] || '💰'}</span>
                <span className="text-[var(--color-text)] hidden sm:block">{CURRENCY_SYMBOLS[currency] || currency}</span>
                <ChevronDown size={11} className="text-[var(--color-text-muted)]" />
              </button>
            }>
              <div className="py-1.5 px-1 min-w-[180px]">
                <p className="text-[8px] font-black uppercase tracking-wider text-[var(--color-text-muted)] px-2 pb-1.5">Currency</p>
                {CURRENCIES.map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${currency === c ? 'bg-orange-500/10 text-orange-400 font-bold' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}>
                    <span className="text-base">{CURRENCY_FLAGS[c]}</span>
                    <span>{CURRENCY_SYMBOLS[c]}</span>
                    <span className="text-[var(--color-text-muted)] text-[9px] ml-auto">{CURRENCY_NAMES[c]?.split(' ')[0]}</span>
                    {currency === c && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </Dropdown>

            {/* Theme */}
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotificationsOpen(p => !p)} className="p-2 rounded-xl hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] relative transition-all">
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 glass border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[var(--color-text)]">Notifications</p>
                    <button onClick={() => setNotificationsOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={13} /></button>
                  </div>
                  {[
                    { title: 'Shipment Update', msg: 'Your cargo TRX-A4F2 passed Dodoma checkpoint', time: '5m ago', type: 'info' },
                    { title: 'Invoice Ready', msg: 'Invoice #INV-0023 is ready for payment', time: '1h ago', type: 'warning' },
                    { title: 'Quote Approved', msg: 'Your quote for Dar es Salaam→Mbeya has been approved', time: '2d ago', type: 'success' },
                  ].map((n, i) => (
                    <div key={i} className="flex gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer mb-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type==='success'?'bg-emerald-400':n.type==='warning'?'bg-yellow-400':'bg-blue-400'}`} />
                      <div>
                        <p className="text-[11px] font-bold text-[var(--color-text)]">{n.title}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{n.msg}</p>
                        <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="relative w-60 glass border-r border-[var(--color-border)] h-full z-10 overflow-y-auto">
              <button onClick={() => setMobileSidebarOpen(false)} className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X size={18} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          {/* Content */}
          <div className="w-full px-4 md:px-8 py-8">
            <main ref={contentRef} className="w-full max-w-7xl mx-auto">
              <Routes>
                <Route index element={
                  userRole === 'DRIVER' ? <DriverDashboard /> :
                  userRole === 'CUSTOMER' ? <CustomerDashboard /> :
                  userRole === 'TENANT_ADMIN' ? <TenantDashboard /> :
                  userRole === 'SUPER_ADMIN' ? <SuperAdminDashboard /> :
                  <CustomerDashboard />
                } />
                {/* Customer Routes */}
                <Route path="shipments" element={<CustomerShipments />} />
                <Route path="tracking" element={<CustomerTracking />} />
                <Route path="tracking/:id" element={<CustomerTracking />} />
                <Route path="quotes" element={<CustomerDashboard />} />
                <Route path="invoices" element={<CustomerInvoices />} />
                <Route path="history" element={<CustomerHistory />} />
                <Route path="support" element={<CustomerSupport />} />
                <Route path="profile" element={userRole === 'DRIVER' ? <DriverProfile /> : <CustomerProfile />} />
                {/* Driver Routes */}
                <Route path="trips" element={<DriverTrips />} />
                <Route path="trip-history" element={<DriverTripHistory />} />
                <Route path="earnings" element={<DriverEarnings />} />
                <Route path="ratings" element={<DriverRatings />} />
                {/* Tenant Routes */}
                <Route path="fleet" element={<TenantDashboard />} />
                <Route path="jobs" element={<TenantDashboard />} />
                {/* Admin Routes */}
                <Route path="tenants" element={<SuperAdminDashboard />} />
                <Route path="system-logs" element={<SuperAdminDashboard />} />
                <Route path="settings" element={
                  <div className="glass border border-[var(--color-border)] p-6 md:p-8 rounded-2xl space-y-6 max-w-lg">
                    <div>
                      <h3 className="font-bold text-[var(--color-text)] text-lg">Profile Configuration</h3>
                      <p className="text-[var(--color-text-muted)] text-xs mt-1">Session & account settings</p>
                    </div>
                    <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
                      {[['First Name', user?.firstName||''], ['Last Name', user?.lastName||''], ['Security Role', userRole.replace(/_/g,' ')]].map(([label, val]) => (
                        <div key={label}>
                          <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">{label}</label>
                          <input type="text" readOnly value={val} className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)]/70" />
                        </div>
                      ))}
                    </div>
                  </div>
                } />
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>
            </main>
          </div>

          {/* Footer */}
          <footer className="h-12 border-t border-[var(--color-border)] px-6 flex items-center justify-between text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-2)]/30 shrink-0">
            <span>© 2026 Tarxemo Logistics. East & Central Africa.</span>
            <span className="font-mono">{userRole}</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CombinedNavBar;
