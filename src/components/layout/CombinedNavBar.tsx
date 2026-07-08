import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Truck, Building2, Briefcase, Layers, LayoutDashboard,
  Bell, Sun, Moon, ClipboardList, ShieldCheck, Clock,
  RefreshCw, Send, ArrowRight, Settings, FileText, X, Menu, Map
} from 'lucide-react';

import { GET_DRIVER_DASHBOARD, GET_CUSTOMER_DASHBOARD } from '../../api/queries';
import { LOGOUT_USER } from '../../api/mutations';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../store/useAppStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE-BASED DASHBOARD VIEWS ( horizontal grids, full-width layouts )
// ─────────────────────────────────────────────────────────────────────────────

// 1. DRIVER DASHBOARD VIEW
const DriverDashboardView: React.FC = () => {
  const { data, loading, error } = useQuery(GET_DRIVER_DASHBOARD, {
    fetchPolicy: 'cache-and-network'
  });

  const [transitLog, setTransitLog] = useState({
    corridorName: 'Mombasa - Kampala Highway',
    locationCheckpoint: 'Malaba Border Station',
    notes: 'Standard clearances verified. Weather clear. Moving towards Kampala Central Depot.'
  });

  const handleTransitLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Transit log report dispatched successfully!');
    setTransitLog({ ...transitLog, notes: '' });
  };

  if (loading) return <div className="h-64 rounded-2xl glass animate-pulse" />;
  if (error) return <div className="p-8 text-center glass border border-white/5 rounded-2xl text-xs text-white/50">Unable to query driver logs.</div>;

  const dashboardData = data?.driverDashboard || {
    availableJobs: 14,
    completedTrips: 48,
    rating: 4.95,
    earnings: { thisMonth: 125000, currency: 'KES' },
    upcomingTrips: [
      { id: '1', title: 'Container Freight dispatch', pickup: 'Mombasa Port', delivery: 'Kampala Depot', date: '2026-08-12', status: 'ASSIGNED' }
    ]
  };

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Upper overview widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Driver Rating', val: `${dashboardData.rating} / 5.0`, color: 'border-l-yellow-500' },
          { label: 'Completed Cargo Trips', val: `${dashboardData.completedTrips} Trips`, color: 'border-l-emerald-500' },
          { label: 'Open Corridor dispatches', val: `${dashboardData.availableJobs} Jobs`, color: 'border-l-orange-500' },
          { label: 'Monthly Earnings Estimate', val: `${dashboardData.earnings.currency} ${dashboardData.earnings.thisMonth.toLocaleString()}`, color: 'border-l-indigo-500' }
        ].map((c, i) => (
          <div key={i} className={`glass p-6 rounded-2xl border-l-4 ${c.color} border-y-0 border-r-0 shadow-md`}>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</p>
            <p className="text-xl font-extrabold text-white mt-2">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Upcoming Trips */}
        <div className="lg:col-span-7 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Active Transit Corridor</h3>
              <p className="text-[10px] text-white/40">Assigned corridor routes and milestones.</p>
            </div>
            <span className="badge badge-success text-[8px] px-2 py-0.5 flex items-center gap-1">
              <ShieldCheck size={10} /> Active Duty
            </span>
          </div>

          {dashboardData.upcomingTrips.map((trip: any) => (
            <div key={trip.id} className="p-5 glass-dark rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <span className="text-xs font-bold text-white uppercase">{trip.title}</span>
                <span className="badge badge-primary text-[8px] px-2 py-0.5">{trip.status}</span>
              </div>
              <div className="space-y-2.5 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Pickup: <strong>{trip.pickup}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Delivery: <strong>{trip.delivery}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-orange-500" />
                  <span>Departure Date: <strong>{trip.date}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column: Submit Transit logs */}
        <div className="lg:col-span-5 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Report Transit Logs</h3>
            <p className="text-[10px] text-white/40">Send location manifests directly to tenant admins.</p>
          </div>

          <form onSubmit={handleTransitLogSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Active Corridor</label>
              <input
                type="text"
                value={transitLog.corridorName}
                readOnly
                className="input-field text-xs bg-white/5 border-white/5 text-white/60 select-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Current Checkpoint</label>
              <input
                type="text"
                value={transitLog.locationCheckpoint}
                onChange={(e) => setTransitLog({ ...transitLog, locationCheckpoint: e.target.value })}
                className="input-field text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Operational Manifest Notes</label>
              <textarea
                value={transitLog.notes}
                onChange={(e) => setTransitLog({ ...transitLog, notes: e.target.value })}
                className="input-field text-xs h-20 resize-none"
                placeholder="Enter custom delay audits, fuel details, border remarks..."
                required
              />
            </div>
            <button type="submit" className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
              <span>Send Log Manifest</span>
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 2. CUSTOMER DASHBOARD VIEW
const CustomerDashboardView: React.FC = () => {
  const { data, loading, error } = useQuery(GET_CUSTOMER_DASHBOARD, {
    fetchPolicy: 'cache-and-network'
  });

  const [quoteRequest, setQuoteRequest] = useState({
    pickup: '',
    delivery: '',
    weight: '',
    description: ''
  });

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cargo quotation query dispatched to regional transport offices!');
    setQuoteRequest({ pickup: '', delivery: '', weight: '', description: '' });
  };

  if (loading) return <div className="h-64 rounded-2xl glass animate-pulse" />;
  if (error) return <div className="p-8 text-center glass border border-white/5 rounded-2xl text-xs text-white/50">Unable to query customer console.</div>;

  const dashboardData = data?.customerDashboard || {
    activeShipments: 3,
    totalShipments: 12,
    pendingQuotes: 1,
    recentShipments: [
      { id: '1', trackingNumber: 'TRX-782635', status: 'IN_TRANSIT', pickup: 'Mombasa', delivery: 'Kigali', estimatedDelivery: '2026-08-15' },
      { id: '2', trackingNumber: 'TRX-192837', status: 'DELIVERED', pickup: 'Dar es Salaam', delivery: 'Nairobi', estimatedDelivery: '2026-08-02' }
    ]
  };

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Top metrics grids */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Shipments In Corridor', val: `${dashboardData.activeShipments} Cargoes` },
          { label: 'Pending Corridor Quotations', val: `${dashboardData.pendingQuotes} Request` },
          { label: 'Delivered Freight Volumes', val: `${dashboardData.totalShipments} Containers` }
        ].map((c, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 shadow-md">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</p>
            <p className="text-xl font-extrabold text-white mt-2">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Live shipments tracking */}
        <div className="lg:col-span-7 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Live Cargo Tracking Consoles</h3>
            <p className="text-[10px] text-white/40 font-semibold">Real-time status updates from the Northern and Central Transit Corridors.</p>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-[9px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-2">Tracking ID</th>
                  <th className="py-3 px-2">Corridor Route</th>
                  <th className="py-3 px-2">Est Delivery</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {dashboardData.recentShipments.map((s: any) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2 font-bold text-orange-400">{s.trackingNumber}</td>
                    <td className="py-4 px-2">{s.pickup} to {s.delivery}</td>
                    <td className="py-4 px-2">{s.estimatedDelivery}</td>
                    <td className="py-4 px-2">
                      <span className={`badge text-[8px] px-2 py-0.5 font-bold ${
                        s.status === 'DELIVERED' ? 'badge-success' : 'badge-primary'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Quote dispatch form */}
        <div className="lg:col-span-5 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Request Freight Quotation</h3>
            <p className="text-[10px] text-white/40">Request corridor quotes from verified shippers.</p>
          </div>

          <form onSubmit={handleRequestQuote} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Pickup Station</label>
                <input
                  type="text"
                  value={quoteRequest.pickup}
                  onChange={(e) => setQuoteRequest({ ...quoteRequest, pickup: e.target.value })}
                  placeholder="e.g. Mombasa Port"
                  className="input-field text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Delivery Depot</label>
                <input
                  type="text"
                  value={quoteRequest.delivery}
                  onChange={(e) => setQuoteRequest({ ...quoteRequest, delivery: e.target.value })}
                  placeholder="e.g. Kigali Depot"
                  className="input-field text-xs"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Cargo Weight Estimate (Tons)</label>
              <input
                type="number"
                value={quoteRequest.weight}
                onChange={(e) => setQuoteRequest({ ...quoteRequest, weight: e.target.value })}
                placeholder="e.g. 24"
                className="input-field text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Description of Cargo Goods</label>
              <textarea
                value={quoteRequest.description}
                onChange={(e) => setQuoteRequest({ ...quoteRequest, description: e.target.value })}
                className="input-field text-xs h-16 resize-none"
                placeholder="e.g. Industrial machinery parts..."
                required
              />
            </div>
            <button type="submit" className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
              <span>Send Quotation Query</span>
              <ArrowRight size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 3. DEFAULT ADMIN/MANAGEMENT VIEW ( Super Admin, Tenant Admin, Operations, Finance )
const DefaultDashboardView: React.FC<{ role: UserRole }> = ({ role }) => {
  const activeLogs = [
    { checkpoint: 'Malaba border checkpoint', time: '14:28', operator: 'Kenfreight Ltd', code: 'TRX-782635' },
    { checkpoint: 'Rusumo border station', time: '11:15', operator: 'Bolloré Logistics', code: 'TRX-982182' }
  ];

  const [pricingModel, setPricingModel] = useState({
    baseRateKm: '1.25',
    currency: 'USD',
    corridorName: 'Northern Highway Corridor'
  });

  const handleUpdatepricing = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Global pricing parameters updated across tenant corridors!');
  };

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Top statistical grid row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Platform Corridor Utility', val: '88% Capacity' },
          { label: 'Active Drivers Logged In', val: '1,420 Drivers' },
          { label: 'Active Registered Tenants', val: '24 Companies' }
        ].map((c, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 shadow-md">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</p>
            <p className="text-xl font-extrabold text-white mt-2">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Logs manifest review */}
        <div className="lg:col-span-7 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">System Operations Manifest</h3>
              <p className="text-[10px] text-white/40 font-semibold">Active dispatch logs and border updates monitored in real-time.</p>
            </div>
            <span className="badge badge-primary text-[8px] uppercase tracking-wider px-2 py-0.5">{role} View</span>
          </div>

          <div className="space-y-4">
            {activeLogs.map((log, idx) => (
              <div key={idx} className="p-4 glass-dark rounded-xl border border-white/5 flex justify-between items-center gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-white">{log.checkpoint}</span>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium">Operator: {log.operator} | Manifest ID: {log.code}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/50 block font-mono">{log.time}</span>
                  <span className="badge badge-success text-[8px] px-1.5 py-0.5 mt-1">Nominal</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Pricing parameters (Super Admin or Finance specific) */}
        <div className="lg:col-span-5 glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Corridor Pricing Rates</h3>
            <p className="text-[10px] text-white/40">Adjust base rates and currency values globally.</p>
          </div>

          <form onSubmit={handleUpdatepricing} className="space-y-4">
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Transit Corridor</label>
              <input
                type="text"
                value={pricingModel.corridorName}
                readOnly
                className="input-field text-xs bg-white/5 border-white/5 text-white/60 select-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Base Rate / KM</label>
                <input
                  type="text"
                  value={pricingModel.baseRateKm}
                  onChange={(e) => setPricingModel({ ...pricingModel, baseRateKm: e.target.value })}
                  className="input-field text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Billing Currency</label>
                <input
                  type="text"
                  value={pricingModel.currency}
                  onChange={(e) => setPricingModel({ ...pricingModel, currency: e.target.value })}
                  className="input-field text-xs"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
              <span>Adjust Pricing Manifest</span>
              <RefreshCw size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMBINEDNAVBAR HEADER MASTER COMPONENT ( Horizontal top layouts, no left sidebar )
// ─────────────────────────────────────────────────────────────────────────────
const CombinedNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // AppStore context parameters
  const { user, logout, theme, toggleTheme, language, setLanguage } = useAppStore();
  const userRole: UserRole = user?.role || 'DRIVER';

  // Toggle/dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apollo queries and mutations
  const [logoutUser] = useMutation(LOGOUT_USER);

  // GSAP Ref for page transitions
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // On-load animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentContainerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    });
    return () => ctx.revert();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Mock logout support
    }
    logout();
    toast.success('Successfully logged out of secure corridor session!');
    navigate('/');
  };

  // Get Horizontal action links based on user role
  const getRoleMenuItems = (role: UserRole) => {
    const common = [
      { path: '/dashboard', label: 'Console Home', icon: LayoutDashboard },
      { path: '/dashboard/settings', label: 'Account Config', icon: Settings }
    ];

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { path: '/dashboard', label: 'Global Monitor', icon: LayoutDashboard },
          { path: '/dashboard/tenants', label: 'Tenants Registry', icon: Building2 },
          { path: '/dashboard/system-logs', label: 'Audit Manifests', icon: ClipboardList },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'TENANT_ADMIN':
        return [
          { path: '/dashboard', label: 'Tenant Console', icon: LayoutDashboard },
          { path: '/dashboard/fleet', label: 'Fleet Registry', icon: Truck },
          { path: '/dashboard/jobs', label: 'Load Dispatches', icon: Briefcase },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'OPERATIONS_MANAGER':
        return [
          { path: '/dashboard', label: 'Ops Console', icon: LayoutDashboard },
          { path: '/dashboard/tracking', label: 'Live GPS Corridor', icon: Map },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'FINANCE_OFFICER':
        return [
          { path: '/dashboard', label: 'Finance Console', icon: LayoutDashboard },
          { path: '/dashboard/invoices', label: 'Billing Manifests', icon: FileText },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'DRIVER':
        return [
          { path: '/dashboard', label: 'Driver Dashboard', icon: LayoutDashboard },
          { path: '/dashboard/trips', label: 'My assigned loads', icon: Truck },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'CUSTOMER':
        return [
          { path: '/dashboard', label: 'Customer Console', icon: LayoutDashboard },
          { path: '/dashboard/cargoes', label: 'Cargo Tracking', icon: Layers },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      default:
        return common;
    }
  };

  const actionItems = getRoleMenuItems(userRole);

  const dummyNotifications = [
    { id: 'n1', text: 'Mombasa corridor customs update. Malaba clearance delayed by 2h.', time: '5m ago' },
    { id: 'n2', text: 'Weekly revenue logs generated successfully.', time: '1d ago' }
  ];

  return (
    <div className="min-h-screen flex flex-col text-white select-none" style={{ backgroundColor: 'var(--color-bg)' }}>
      
      {/* ─── PREMIUM HORIZONTAL HEADER (Spacious Top Bar) ─── */}
      <header className="h-20 border-b border-white/10 glass px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse"
              style={{ background: 'var(--gradient-primary)' }}>
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--color-primary)' }}>Tarx</span>emo
              </span>
              <p className="text-[9px] text-white/40 uppercase tracking-widest -mt-1 font-bold">Logistics</p>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation (Displays action links dynamically based on user role) */}
          <nav className="hidden lg:flex items-center gap-6">
            {actionItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-orange-500 font-extrabold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <item.icon size={13} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Tools (Notifications, Language switcher, Dropdown) */}
        <div className="flex items-center gap-4">
          
          {/* Language Switcher */}
          <div className="hidden sm:flex p-0.5 rounded-full glass border border-white/10 text-[10px] font-bold uppercase w-fit gap-1">
            {['en', 'sw', 'fr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as any)}
                className={`px-2.5 py-1 rounded-full uppercase transition-all ${
                  language === lang
                    ? 'btn-primary text-white font-extrabold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((p) => !p)}
              className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white relative"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 glass border border-white/15 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] text-white/40 uppercase font-bold border-b border-white/5 pb-2">Active notifications</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dummyNotifications.map((notif) => (
                    <div key={notif.id} className="text-[11px] leading-relaxed text-white/80 p-2.5 rounded-lg bg-white/5">
                      <p>{notif.text}</p>
                      <span className="text-[9px] text-white/40 mt-1 block">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen((p) => !p)}
              className="flex items-center gap-2 p-1 pl-3 rounded-full border border-white/10 hover:border-orange-500/50 glass transition-all"
            >
              <span className="text-xs font-semibold text-white/80 hidden sm:inline">{user?.firstName || 'Operator'}</span>
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white relative">
                {user?.firstName?.[0] || 'O'}
              </div>
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 glass border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-3 border-b border-white/5 bg-black/10">
                  <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">{user?.email}</p>
                  <span className="badge badge-primary text-[8px] mt-1.5 uppercase font-bold">{userRole.replace('_', ' ')}</span>
                </div>
                <Link to="/dashboard/settings" className="block px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all">
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-all border-t border-white/5"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass border-b border-white/15 p-4 space-y-3 z-30 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider ${
                  location.pathname === item.path
                    ? 'text-orange-500 font-extrabold bg-orange-500/10'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* ─── FULL-WIDTH MAIN CONTAINER ─── */}
      <div className="flex-1 w-full px-6 md:px-12 py-10 relative z-10">
        <main ref={contentContainerRef} className="w-full max-w-7xl mx-auto space-y-10">
          <Routes>
            <Route index element={
              userRole === 'DRIVER' ? (
                <DriverDashboardView />
              ) : userRole === 'CUSTOMER' ? (
                <CustomerDashboardView />
              ) : (
                <DefaultDashboardView role={userRole} />
              )
            } />
            <Route path="settings" element={
              <div className="glass border border-white/5 p-6 md:p-8 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-lg">Profile Configuration</h3>
                  <p className="text-white/40 text-xs mt-0.5">Configure your active driver licenses, phone credentials and session states.</p>
                </div>
                <div className="border-t border-white/5 pt-6 space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">First Name</label>
                      <input type="text" readOnly value={user?.firstName || ''} className="input-field text-xs bg-white/5 border-white/5 text-white/60" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Last Name</label>
                      <input type="text" readOnly value={user?.lastName || ''} className="input-field text-xs bg-white/5 border-white/5 text-white/60" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Security Role</label>
                    <input type="text" readOnly value={userRole.replace('_', ' ')} className="input-field text-xs bg-white/5 border-white/5 text-white/60" />
                  </div>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </main>
      </div>

      {/* Full-width Footer */}
      <footer className="h-14 border-t border-white/10 px-6 md:px-12 flex items-center justify-between text-[10px] text-white/40 bg-black/20">
        <span>© 2026 Tarxemo Logistics. Secure Session Active.</span>
        <span>Role: {userRole}</span>
      </footer>

      {/* Backdrop overlay */}
      {(profileDropdownOpen || notificationsOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setProfileDropdownOpen(false); setNotificationsOpen(false); }} />
      )}

    </div>
  );
};

export default CombinedNavBar;
