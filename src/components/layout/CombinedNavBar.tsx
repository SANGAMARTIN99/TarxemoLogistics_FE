import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Truck, Building2, Users, LogOut, Bell,
  Sun, Moon, Menu, X, LayoutDashboard, Settings,
  FileText, DollarSign, Briefcase, Layers, ClipboardList, ShieldCheck, Map
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../store/useAppStore';
import toast from 'react-hot-toast';

// ─── Dummy / Mock Inner Dashboard Components ───
// To support full functionality within a single file of 500+ lines, we declare detailed subcomponents.

const DriverDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Driver Dispatch Board</h2>
          <p className="text-xs text-white/50">Manage your active transit deliveries and cargo schedules.</p>
        </div>
        <span className="badge badge-success px-3 py-1 flex items-center gap-1">
          <ShieldCheck size={12} /> Duty Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Completed Deliveries', val: '48 Trips', color: 'border-l-emerald-500' },
          { label: 'Pending Dispatches', val: '2 Tasks', color: 'border-l-orange-500' },
          { label: 'Driver Rating score', val: '4.95 / 5', color: 'border-l-yellow-500' }
        ].map((c, i) => (
          <div key={i} className={`glass p-5 rounded-2xl border-l-4 ${c.color} border-y-0 border-r-0`}>
            <p className="text-[10px] text-white/40 uppercase font-bold">{c.label}</p>
            <p className="text-xl font-extrabold text-white mt-1">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="glass border border-white/5 p-5 rounded-2xl">
        <h3 className="font-bold text-sm text-white mb-4">Current Assigned Trip Corridor</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 glass-dark rounded-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-xs font-bold text-white">Mombasa Cargo Port Terminal (Pickup)</span>
            </div>
            <div className="w-0.5 h-6 bg-white/10 ml-1.25" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-white">Kampala Central Depot (Delivery)</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 font-bold uppercase">Estimated Duration</p>
            <p className="text-sm font-bold text-white mt-0.5">18h 45m remaining</p>
            <span className="badge badge-primary text-[8px] mt-1.5 px-2 py-0.5">ON SCHEDULE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Customer Cargo Console</h2>
        <p className="text-xs text-white/50">Track your ongoing shipments, request quotes and review invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Shipments', val: '3 Cargoes' },
          { label: 'Quotes Pending', val: '1 Quote' },
          { label: 'Total Invoiced', val: 'KES 450,000' },
          { label: 'Delivered Packages', val: '12 Items' }
        ].map((c, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-bold">{c.label}</p>
            <p className="text-lg font-black text-white mt-1">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="glass border border-white/5 p-5 rounded-2xl">
        <h3 className="font-bold text-sm text-white mb-3">Live Cargo Tracking status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2.5">Tracking ID</th>
                <th className="py-2.5">Destination Route</th>
                <th className="py-2.5">Carrier Operator</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              <tr>
                <td className="py-3 font-semibold text-orange-400">TRX-782635</td>
                <td className="py-3">Dar es Salaam to Kigali</td>
                <td className="py-3">Bolloré Logistics</td>
                <td className="py-3"><span className="badge badge-success text-[8px] px-2 py-0.5">IN TRANSIT</span></td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-orange-400">TRX-192837</td>
                <td className="py-3">Mombasa to Nairobi</td>
                <td className="py-3">Kenfreight Ltd</td>
                <td className="py-3"><span className="badge badge-primary text-[8px] px-2 py-0.5">DELIVERED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DefaultDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Management Console</h2>
        <p className="text-xs text-white/50">Core fleet metrics, operational parameters, and staff performance indices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Fleet Utility', val: '88% Capacity' },
          { label: 'Monthly Revenue', val: 'TZS 12.4M' },
          { label: 'Active Drivers Assigned', val: '14 Operators' }
        ].map((c, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-bold">{c.label}</p>
            <p className="text-lg font-black text-white mt-1">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="glass border border-white/5 p-5 rounded-2xl">
        <h3 className="font-bold text-sm text-white mb-3">Recent Corridor logs</h3>
        <p className="text-white/60 text-xs leading-relaxed">
          No deviations detected. Standard transit checklists verified at Namanga and Malaba border checkpoints. All dispatch schedules remain within nominal parameter tolerances.
        </p>
      </div>
    </div>
  );
};

// ─── CombinedNavBar Master Component ───

const CombinedNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // AppStore parameters
  const { user, logout, theme, toggleTheme } = useAppStore();
  const userRole = user?.role || 'DRIVER';

  // Toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Animation Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Trigger initial drawer size toggle animation
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Handle Logout workflow
  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
    navigate('/');
  };

  // Define Navigation layout menus per role
  const getSidebarMenuItems = (role: UserRole) => {
    const commonItems = [
      { path: '/dashboard', label: 'Console Home', icon: LayoutDashboard },
      { path: '/dashboard/settings', label: 'Account Settings', icon: Settings }
    ];

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { path: '/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
          { path: '/dashboard/tenants', label: 'Manage Tenants', icon: Building2 },
          { path: '/dashboard/system-logs', label: 'System Logs', icon: ClipboardList },
          { path: '/dashboard/pricing-cards', label: 'Global Rates', icon: DollarSign },
          { path: '/dashboard/settings', label: 'Settings', icon: Settings }
        ];
      case 'TENANT_ADMIN':
        return [
          ...commonItems,
          { path: '/dashboard/fleet', label: 'Fleet Registry', icon: Truck },
          { path: '/dashboard/drivers', label: 'Drivers Hub', icon: Users },
          { path: '/dashboard/jobs', label: 'Dispatch Jobs', icon: Briefcase },
          { path: '/dashboard/finance', label: 'Financial Audits', icon: DollarSign }
        ];
      case 'OPERATIONS_MANAGER':
        return [
          ...commonItems,
          { path: '/dashboard/fleet', label: 'Vehicles status', icon: Truck },
          { path: '/dashboard/jobs', label: 'Active Dispatches', icon: Briefcase },
          { path: '/dashboard/tracking', label: 'Live GPS Feeds', icon: Map }
        ];
      case 'FINANCE_OFFICER':
        return [
          ...commonItems,
          { path: '/dashboard/invoices', label: 'Invoices', icon: FileText },
          { path: '/dashboard/payments', label: 'Reconciliation', icon: DollarSign }
        ];
      case 'DRIVER':
        return [
          ...commonItems,
          { path: '/dashboard/driver-trips', label: 'My Assigned Trips', icon: Truck },
          { path: '/dashboard/driver-logs', label: 'Transit Logs', icon: FileText },
          { path: '/dashboard/driver-earnings', label: 'Earnings Record', icon: DollarSign }
        ];
      case 'CUSTOMER':
        return [
          ...commonItems,
          { path: '/dashboard/customer-cargo', label: 'My Cargoes', icon: Layers },
          { path: '/dashboard/customer-quotes', label: 'Quotes Board', icon: FileText },
          { path: '/dashboard/customer-billing', label: 'Payment Logs', icon: DollarSign }
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getSidebarMenuItems(userRole);
  const activeItem = menuItems.find((item) => location.pathname === item.path) || menuItems[0];

  const dummyNotifications = [
    { id: 'n1', text: 'New dispatch job assigned to Mombasa route', time: '10m ago' },
    { id: 'n2', text: 'Tanzania customs updates on Namanga border delay', time: '1h ago' },
    { id: 'n3', text: 'Weekly revenue logs generated successfully', time: '1d ago' }
  ];

  return (
    <div className="min-h-screen flex text-white overflow-hidden select-none"
      style={{ background: 'var(--color-bg)' }}>

      {/* ─── Sidebar Navigation Drawer ─── */}
      <div
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 glass border-r border-white/10 transition-all duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden lg:flex lg:w-20'
        } flex flex-col justify-between p-4`}
      >
        <div className="space-y-8">
          {/* Logo header */}
          <div className="flex items-center justify-between pl-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--gradient-primary)' }}>
                <Truck size={18} className="text-white" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>Tarx</span>emo
                </span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation link list */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  style={isSelected ? { background: 'var(--gradient-primary)' } : {}}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer parameters */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {sidebarOpen && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[8px] text-white/40 uppercase font-bold">Logged In Role</p>
              <p className="text-[10px] font-bold mt-0.5 text-orange-400">{userRole.replace('_', ' ')}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* ─── Main Content Shell Area ─── */}
      <div
        ref={mainContentRef}
        className="flex-1 min-h-screen flex flex-col justify-between overflow-y-auto"
      >
        {/* Header toolbar */}
        <header className="h-16 border-b border-white/10 glass px-6 flex items-center justify-between relative z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-bold text-white hidden sm:block">
              {activeItem ? activeItem.label : 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((p) => !p)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 relative"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 glass border border-white/15 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
                  <p className="text-[10px] text-white/40 uppercase font-bold border-b border-white/5 pb-2">Active Notifications</p>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                    {dummyNotifications.map((notif) => (
                      <div key={notif.id} className="text-[11px] leading-relaxed text-white/80 p-2 rounded-lg bg-white/5">
                        <p>{notif.text}</p>
                        <span className="text-[9px] text-white/40 mt-1 block">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((p) => !p)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-white/10 hover:border-orange-500/50 glass transition-all"
              >
                <span className="text-xs font-semibold text-white/80">{user?.firstName || 'User'}</span>
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.firstName?.[0] || 'U'}
                </div>
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 text-xs">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[9px] text-white/40 mt-0.5">{user?.email}</p>
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

          </div>
        </header>

        {/* Main Dashboard Render Window */}
        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route index element={
              userRole === 'DRIVER' ? (
                <DriverDashboardView />
              ) : userRole === 'CUSTOMER' ? (
                <CustomerDashboardView />
              ) : (
                <DefaultDashboardView />
              )
            } />
            <Route path="settings" element={
              <div className="glass border border-white/5 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-white">Profile settings</h3>
                <p className="text-white/60 text-xs">Configure your user information cards and language properties.</p>
              </div>
            } />
            {/* Fallback redirects */}
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </main>

        {/* Dashboard inner footer */}
        <footer className="h-12 border-t border-white/10 px-6 flex items-center justify-between text-[10px] text-white/40 bg-black/20">
          <span>© 2026 Tarxemo Logistics. Secure Session Active.</span>
          <span>Role: {userRole}</span>
        </footer>

      </div>

      {/* Backdrop overlay */}
      {(profileDropdownOpen || notificationsOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setProfileDropdownOpen(false); setNotificationsOpen(false); }} />
      )}

    </div>
  );
};

export default CombinedNavBar;
