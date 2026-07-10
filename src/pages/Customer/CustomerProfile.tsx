import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { User, Shield, Bell, Camera, Save, Eye, EyeOff, Phone, Mail, Lock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

const CustomerProfile: React.FC = () => {
  const { user } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'personal'|'security'|'notifications'>('personal');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifPrefs, setNotifPrefs] = useState({
    shipmentUpdates: true,
    invoiceAlerts: true,
    quoteResponses: true,
    promotions: false,
    smsAlerts: false,
    emailAlerts: true,
  });

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Profile updated successfully!');
    setSaving(false);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div ref={containerRef} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <User size={20} className="text-blue-400" />
          </div>
          My Profile
        </h1>
        <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">Manage your account details and preferences</p>
      </div>

      {/* Avatar */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
            {user?.firstName?.[0] || 'U'}
          </div>
          <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-orange-500 border-2 border-[var(--color-bg)] flex items-center justify-center hover:bg-orange-600 transition-colors">
            <Camera size={12} className="text-white" />
          </button>
        </div>
        <div>
          <p className="font-black text-lg text-[var(--color-text)]">{user?.firstName} {user?.lastName}</p>
          <p className="text-[var(--color-text-muted)] text-xs">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-bold uppercase">Customer Account</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-5">
        {activeTab === 'personal' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name', key: 'firstName', icon: User },
                { label: 'Last Name', key: 'lastName', icon: User },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1.5">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} type="tel"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
              </div>
            </div>
          </>
        )}
        {activeTab === 'security' && (
          <>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1.5">{f.label}</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input type={showPass ? 'text' : 'password'} value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="w-full pl-9 pr-10 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {Object.entries(notifPrefs).map(([key, val]) => {
              const labels: Record<string,string> = {
                shipmentUpdates: 'Shipment Status Updates',
                invoiceAlerts: 'Invoice & Payment Alerts',
                quoteResponses: 'Quote Responses',
                promotions: 'Promotional Offers',
                smsAlerts: 'SMS Alerts',
                emailAlerts: 'Email Notifications',
              };
              return (
                <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                  <p className="text-sm text-[var(--color-text)] font-semibold">{labels[key]}</p>
                  <button onClick={() => setNotifPrefs({...notifPrefs, [key]: !val})}
                    className={`w-11 h-6 rounded-full transition-all relative ${val ? 'bg-orange-500' : 'bg-[var(--color-surface-2)] border border-[var(--color-border)]'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save size={15} />Save Changes</>}
        </button>
      </div>
    </div>
  );
};

export default CustomerProfile;
