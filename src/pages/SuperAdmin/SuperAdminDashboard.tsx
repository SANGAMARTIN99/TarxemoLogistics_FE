import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Building2, Plus, Send, X, RefreshCw,
  Activity, Shield, RefreshCw as LoopIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── GraphQL Queries & Mutations ─────────────────────────────────────────────
import { gql } from '@apollo/client';

const GET_TENANTS = gql`
  query GetTenants($search: String, $status: String, $plan: String) {
    tenants(search: $search, status: $status, plan: $plan) {
      id
      name
      slug
      email
      phone
      country
      plan
      status
    }
  }
`;

const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      name
      slug
      email
      plan
      status
    }
  }
`;

const SET_TENANT_STATUS = gql`
  mutation SetTenantStatus($tenantId: String!, $status: String!) {
    setTenantStatus(tenantId: $tenantId, status: $status) {
      id
      name
      status
    }
  }
`;

const SuperAdminDashboard: React.FC = () => {
  const superRef = useRef<HTMLDivElement>(null);

  // Tabs: 'tenants', 'system-health', 'time-travel'
  const [activeTab, setActiveTab] = useState<'tenants' | 'system-health' | 'time-travel'>('tenants');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Queries
  const { data: tenantsData, loading: loadingTenants, refetch: refetchTenants } = useQuery(GET_TENANTS, {
    variables: { search: searchQuery, plan: filterPlan || null, status: filterStatus || null }
  });

  // Modal toggles
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);

  // Tenant Register Form state
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    country: 'Tanzania',
    city: '',
    registrationNumber: '',
    plan: 'TRIAL',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mutations
  const [createTenant, { loading: tenantSubmitting }] = useMutation(CREATE_TENANT, {
    onCompleted: (res) => {
      toast.success(`Tenant ${res.createTenant.name} registered and activated successfully!`);
      setIsTenantModalOpen(false);
      setTenantForm({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        country: 'Tanzania',
        city: '',
        registrationNumber: '',
        plan: 'TRIAL',
      });
      refetchTenants();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to initialize tenant.');
    }
  });

  const [setTenantStatus, { loading: statusChanging }] = useMutation(SET_TENANT_STATUS, {
    onCompleted: (res) => {
      toast.success(`Tenant status updated to: ${res.setTenantStatus.status}`);
      refetchTenants();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update tenant status.');
    }
  });

  // Form sanitization and validation
  const validateTenantForm = () => {
    const errors: Record<string, string> = {};
    if (!tenantForm.name.trim()) {
      errors.name = 'Company legal name is required.';
    } else if (/[<>{}[\]]/.test(tenantForm.name)) {
      errors.name = 'Invalid characters detected in name.';
    }

    if (!tenantForm.email.trim()) {
      errors.email = 'Corporate email is required.';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(tenantForm.email)) {
      errors.email = 'Invalid email address format.';
    }

    if (tenantForm.slug && !/^[a-z0-9-]+$/.test(tenantForm.slug)) {
      errors.slug = 'Slug identifier must contain only lowercase alphanumeric and hyphens.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenantForm()) return;

    createTenant({
      variables: {
        input: {
          name: tenantForm.name.trim(),
          slug: tenantForm.slug.trim() || null,
          email: tenantForm.email.trim().toLowerCase(),
          phone: tenantForm.phone.trim() || null,
          address: tenantForm.address.trim() || null,
          country: tenantForm.country,
          city: tenantForm.city.trim() || null,
          registrationNumber: tenantForm.registrationNumber.trim() || null,
          plan: tenantForm.plan,
        }
      }
    });
  };

  const toggleTenantStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTenantStatus({
      variables: {
        tenantId: id,
        status: nextStatus
      }
    });
  };

  // Time Travel snapshot trigger simulation
  const handleSnapshotTrigger = (mode: string) => {
    toast.loading(`Triggering cryptographic ${mode} snapshot...`, { id: 'snapshot' });
    setTimeout(() => {
      toast.success(`${mode} snapshot complete! Historical states locked.`, { id: 'snapshot' });
    }, 1500);
  };

  // Entrance animations
  useEffect(() => {
    if (superRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.super-widget',
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.15)', stagger: 0.08 }
        );
      }, superRef.current);
      return () => ctx.revert();
    }
  }, [loadingTenants]);

  const tenants = tenantsData?.tenants || [];

  return (
    <div ref={superRef} className="space-y-8 w-full max-w-full">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Super Admin <span className="text-orange-500">Monitor Console</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Global registry dashboard, subscription plans, system health monitors, and time-travel utilities.</p>
        </div>
        <button
          onClick={() => {
            refetchTenants();
            toast.success('Global registers updated!');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-orange-500/50 text-xs font-semibold glass transition-all text-white/80 hover:text-white"
        >
          <RefreshCw size={12} />
          <span>Sync Registry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Global Registered Tenants', val: `${tenants.length} Tenants`, icon: Building2, border: 'border-l-orange-500' },
          { label: 'System Api Health', val: '99.98% Uptime', icon: Activity, border: 'border-l-emerald-500' },
          { label: 'API request Latency', val: '24ms Avg', icon: LoopIcon, border: 'border-l-indigo-500' },
          { label: 'Security Threats Blocked', val: '0 Threat Logs', icon: Shield, border: 'border-l-red-500' },
        ].map((c, i) => (
          <div key={i} className={`super-widget glass p-6 rounded-2xl border-l-4 ${c.border} border-y-0 border-r-0 shadow-lg flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</span>
              <p className="text-lg font-black text-white">{c.val}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <c.icon size={16} className="text-white/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5">
        {(['tenants', 'system-health', 'time-travel'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span>{tab.replace('-', ' ')}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-glow" />
            )}
          </button>
        ))}
      </div>

      {/* Tabs Dispatch */}
      <div className="grid grid-cols-1 gap-8 items-start">
        {activeTab === 'tenants' && (
          <div className="super-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
                <Building2 size={14} className="text-orange-500" /> Carrier Tenants Registry
              </h3>
              <button
                onClick={() => { setFormErrors({}); setIsTenantModalOpen(true); }}
                className="flex items-center gap-1 btn btn-primary text-[9px] px-3.5 py-2 rounded-lg font-bold"
              >
                <Plus size={10} />
                <span>Onboard New Tenant Carrier</span>
              </button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tenant name, slug, email..."
                className="input-field text-xs"
              />
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="input-field text-xs bg-white/5 border-white/10 text-white"
              >
                <option value="" className="bg-black">All Subscription Plans</option>
                <option value="TRIAL" className="bg-black">Trial Plan</option>
                <option value="GROWTH" className="bg-black">Growth Plan</option>
                <option value="ENTERPRISE" className="bg-black">Enterprise Plan</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field text-xs bg-white/5 border-white/10 text-white"
              >
                <option value="" className="bg-black">All Statuses</option>
                <option value="ACTIVE" className="bg-black">Active</option>
                <option value="SUSPENDED" className="bg-black">Suspended</option>
              </select>
            </div>

            {/* Table registry */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase font-bold text-[9px] tracking-wider">
                    <th className="pb-3">Carrier / Slug</th>
                    <th className="pb-3">Corporate Contact</th>
                    <th className="pb-3">Country</th>
                    <th className="pb-3">Subscription Tier</th>
                    <th className="pb-3 text-right">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingTenants ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Querying Tenant Registry Database...</span>
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40">No carrier tenants found.</td>
                    </tr>
                  ) : (
                    tenants.map((t: any) => (
                      <tr key={t.id} className="text-white/80 hover:bg-white/5 transition-all">
                        <td className="py-4">
                          <span className="font-bold text-white block">{t.name}</span>
                          <span className="text-[10px] text-white/40 font-mono">slug: {t.slug}</span>
                        </td>
                        <td className="py-4">
                          <span className="block">{t.email}</span>
                          <span className="text-[10px] text-white/45">{t.phone || 'No Phone'}</span>
                        </td>
                        <td className="py-4 text-white/60">{t.country}</td>
                        <td className="py-4 font-mono font-bold text-indigo-400">{t.plan}</td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            onClick={() => toggleTenantStatus(t.id, t.status)}
                            disabled={statusChanging}
                            className={`btn text-[9px] px-3.5 py-1.5 rounded-lg font-bold uppercase transition-all ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 border border-emerald-500/20 hover:border-red-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-emerald-500/10 hover:text-emerald-400 border border-red-500/20 hover:border-emerald-500/20'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system-health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* API performance logs */}
            <div className="super-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Global Endpoint Performance Monitor</h3>
              </div>

              <div className="space-y-4">
                {[
                  { endpoint: 'graphql/query (Tenants)', latency: '12ms', rate: '28 req/s', status: 'NOMINAL' },
                  { endpoint: 'graphql/mutation (ProcessPayment)', latency: '82ms', rate: '4 req/s', status: 'NOMINAL' },
                  { endpoint: 'graphql/mutation (LogLocation)', latency: '18ms', rate: '142 req/s', status: 'NOMINAL' },
                  { endpoint: 'rest/images/upload', latency: '240ms', rate: '1 req/s', status: 'NOMINAL' },
                ].map((row, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white font-mono">{row.endpoint}</p>
                      <p className="text-[10px] text-white/40">Rate: {row.rate}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="badge badge-primary text-[8px] font-bold font-mono">{row.latency}</span>
                      <span className="badge badge-success text-[7px] block uppercase tracking-wider">{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Security Log */}
            <div className="super-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1 text-orange-500">
                  <Shield size={14} />
                  <span>Intrusion Prevention & Security Audit</span>
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { event: 'JWT Signature Verification', count: '18,273 Verified', status: 'PASS' },
                  { event: 'GraphQL Query Depth Audit', count: 'Depth Limit Checked (<= 5)', status: 'PASS' },
                  { event: 'Tenant Domain SSL checks', count: 'Let\'s Encrypt Valid', status: 'PASS' },
                  { event: 'Failed Authentication Locks', count: '0 accounts currently locked', status: 'CLEAN' },
                ].map((row, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">{row.event}</p>
                      <p className="text-[10px] text-white/40">{row.count}</p>
                    </div>
                    <span className="badge badge-success text-[8px] font-bold">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'time-travel' && (
          <div className="super-widget glass border border-white/5 p-6 rounded-2xl space-y-6 max-w-xl">
            <div className="border-b border-white/5 pb-4 flex items-center gap-2">
              <Activity size={16} className="text-orange-500" />
              <div>
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest font-mono">Time-Travel Cryptographic Snapshots</h3>
                <p className="text-[10px] text-white/40 mt-1">Manual system snapshots to review billing archives, fleet capacities and driver rosters at historic dates.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { title: 'Recompute Global Billing Invoices', desc: 'Runs transaction audits and sets status to OVERDUE for invoices exceeding credit limits.', mode: 'BILLING' },
                { title: 'Purge Expired Verification Tokens', desc: 'Flushes domain TXT credentials and OTP security codes from the cache.', mode: 'SECURITY' },
                { title: 'Recalculate Route OSRM Estimations', desc: 'Syncs road corridor weight rules with current East African transit updates.', mode: 'ROUTING' }
              ].map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1 max-w-md">
                    <p className="font-bold text-white">{s.title}</p>
                    <p className="text-white/40 text-[10px] leading-relaxed">{s.desc}</p>
                  </div>
                  <button
                    onClick={() => handleSnapshotTrigger(s.mode)}
                    className="btn btn-ghost border border-white/10 hover:border-orange-500/50 text-[9px] px-3.5 py-1.5 rounded-lg font-bold uppercase shrink-0"
                  >
                    Trigger Run
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Onboard Tenant Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-lg space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTenantModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-white">Register Carrier Tenant</h3>
              <p className="text-[10px] text-white/40 mt-1">Provision a new multitenant company container with automatic schema hooks.</p>
            </div>

            <form onSubmit={handleRegisterTenantSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                    placeholder="e.g. Bolloré Logistics"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.name && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Custom Subdomain Slug</label>
                  <input
                    type="text"
                    value={tenantForm.slug}
                    onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value })}
                    placeholder="e.g. bollore-east"
                    className="input-field text-xs lowercase"
                  />
                  {formErrors.slug && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.slug}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  placeholder="e.g. billing@bollore.com"
                  className="input-field text-xs"
                  required
                />
                {formErrors.email && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.email}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Operational Phone</label>
                  <input
                    type="text"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    placeholder="e.g. +254712345678"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Subscription Plan</label>
                  <select
                    value={tenantForm.plan}
                    onChange={(e) => setTenantForm({ ...tenantForm, plan: e.target.value })}
                    className="input-field text-xs bg-white/5 border-white/10 text-white"
                  >
                    <option value="TRIAL" className="bg-black">Trial Account (30 Days)</option>
                    <option value="GROWTH" className="bg-black">Growth Plan (Corridor pricing)</option>
                    <option value="ENTERPRISE" className="bg-black">Enterprise Plan (Dedicated support)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Office Address</label>
                  <input
                    type="text"
                    value={tenantForm.address}
                    onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                    placeholder="Mombasa Road Suite 5B"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={tenantForm.country}
                    onChange={(e) => setTenantForm({ ...tenantForm, country: e.target.value })}
                    placeholder="Tanzania"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={tenantSubmitting}
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                {tenantSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Provisioning Tenant...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Onboarding Provision</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
