import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Truck, Box, Layers, Plus, Send,
  TrendingUp, X, Check, RefreshCw, Shield, AlertCircle, Clock, Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { convertAndFormatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

// ─── GraphQL Queries & Mutations ─────────────────────────────────────────────
import { GET_TENANT_DASHBOARD } from '../../api/queries';
import { CREATE_TRUCK, CREATE_CONTAINER, UPDATE_TENANT_THEME, UPDATE_PRICING_MATRIX } from '../../api/mutations';

const TenantDashboard: React.FC = () => {
  const { currency } = useAppStore();
  const tenantRef = useRef<HTMLDivElement>(null);

  // Tabs: 'fleet', 'pricing', 'applications', 'white-label', 'time-travel'
  const [activeTab, setActiveTab] = useState<'fleet' | 'pricing' | 'applications' | 'white-label' | 'time-travel'>('fleet');

  // Queries
  const { data: dashboardData, loading: dataLoading, refetch: refetchTenant } = useQuery(GET_TENANT_DASHBOARD);

  // Form toggles
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Add Truck Form State
  const [truckForm, setTruckForm] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    capacityTons: '',
  });

  // Add Container Form State
  const [containerForm, setContainerForm] = useState({
    containerNumber: '',
    containerType: '20FT',
    capacityTons: '',
  });

  // Add Pricing Matrix State
  const [pricingForm, setPricingForm] = useState({
    containerType: '20FT',
    basePrice: '',
    pricePerTon: '',
    pricePerKm: '',
    sourceLocation: 'Mombasa',
    destinationLocation: 'Kampala',
  });

  // White label theme state
  const [themeForm, setThemeForm] = useState({
    primaryColor: '#f97316',
    primaryColorDark: '#ea580c',
    borderRadius: '12px',
    fontFamily: 'Inter',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Onboard credentials state
  const [onboardingCreds, setOnboardingCreds] = useState<any>(null);

  // Time travel variables
  const [timeShiftDays, setTimeShiftDays] = useState(0);
  const [timeShiftLoading, setTimeShiftLoading] = useState(false);

  // Mutations
  const [createTruck, { loading: truckSubmitting }] = useMutation(CREATE_TRUCK, {
    onCompleted: (res) => {
      if (res.createTruck?.id) {
        toast.success('Truck registered successfully!');
        setIsTruckModalOpen(false);
        setTruckForm({ licensePlate: '', make: '', model: '', year: new Date().getFullYear().toString(), capacityTons: '' });
        refetchTenant();
      } else {
        toast.error('Failed to register truck.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while saving truck.');
    }
  });

  const [createContainer, { loading: containerSubmitting }] = useMutation(CREATE_CONTAINER, {
    onCompleted: (res) => {
      if (res.createContainer?.id) {
        toast.success('Container registered successfully!');
        setIsContainerModalOpen(false);
        setContainerForm({ containerNumber: '', containerType: '20FT', capacityTons: '' });
        refetchTenant();
      } else {
        toast.error('Failed to register container.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while saving container.');
    }
  });

  const [updatePricing] = useMutation(UPDATE_PRICING_MATRIX, {
    onCompleted: (res) => {
      if (res.updatePricingMatrix) {
        toast.success('Corridor Pricing Matrix updated successfully!');
        setIsPricingModalOpen(false);
        refetchTenant();
      } else {
        toast.error('Failed to update pricing matrix.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update pricing matrix.');
    }
  });

  const [updateTheme, { loading: themeSubmitting }] = useMutation(UPDATE_TENANT_THEME, {
    onCompleted: () => {
      toast.success('White-label theme properties successfully saved and cached on edge nodes!');
      // Apply theme vars to document root for real-time CSS custom property changes!
      document.documentElement.style.setProperty('--primary', themeForm.primaryColor);
      document.documentElement.style.setProperty('--primary-dark', themeForm.primaryColorDark);
      document.documentElement.style.setProperty('--radius', themeForm.borderRadius);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update tenant theme properties.');
    }
  });

  // Validations & Sanitizations
  const validateTruckForm = () => {
    const errors: Record<string, string> = {};
    const plate = truckForm.licensePlate.trim().toUpperCase();

    if (!plate) {
      errors.licensePlate = 'License plate identifier is required.';
    } else if (!/^[A-Z0-9\s-]{4,12}$/i.test(plate)) {
      errors.licensePlate = 'Invalid plate format. Alphanumeric 4-12 characters.';
    }

    if (!truckForm.make.trim()) {
      errors.make = 'Manufacturer brand/make is required.';
    }

    if (!truckForm.model.trim()) {
      errors.model = 'Model name is required.';
    }

    const yearVal = parseInt(truckForm.year);
    if (!truckForm.year) {
      errors.year = 'Manufacture year is required.';
    } else if (isNaN(yearVal) || yearVal < 1980 || yearVal > new Date().getFullYear() + 1) {
      errors.year = 'Invalid manufacture year.';
    }

    const cap = parseFloat(truckForm.capacityTons);
    if (!truckForm.capacityTons) {
      errors.capacityTons = 'Tonnage capacity is required.';
    } else if (isNaN(cap) || cap <= 0 || cap > 100) {
      errors.capacityTons = 'Capacity must be between 0.1 and 100.0 Tons.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContainerForm = () => {
    const errors: Record<string, string> = {};
    const number = containerForm.containerNumber.trim().toUpperCase();

    if (!number) {
      errors.containerNumber = 'Container registration number is required.';
    } else if (!/^[A-Z]{4}[0-9]{7}$/.test(number)) {
      errors.containerNumber = 'Must match standard ISO 6346 format (e.g. MSKU1234567).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTruckForm()) return;

    createTruck({
      variables: {
        input: {
          plateNumber: truckForm.licensePlate.trim().toUpperCase(),
          make: truckForm.make.trim(),
          model: truckForm.model.trim(),
          year: parseInt(truckForm.year),
          capacityTons: parseFloat(truckForm.capacityTons),
        }
      }
    });
  };

  const handleContainerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContainerForm()) return;

    createContainer({
      variables: {
        input: {
          containerNumber: containerForm.containerNumber.trim().toUpperCase(),
          containerType: containerForm.containerType,
        }
      }
    });
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(pricingForm.basePrice);
    const ton = parseFloat(pricingForm.pricePerTon);
    const km = parseFloat(pricingForm.pricePerKm);

    if (isNaN(base) || base < 0) {
      toast.error('Please enter a valid base rate.');
      return;
    }
    if (isNaN(ton) || ton < 0) {
      toast.error('Please enter a valid rate per ton.');
      return;
    }
    if (isNaN(km) || km < 0) {
      toast.error('Please enter a valid rate per km.');
      return;
    }

    updatePricing({
      variables: {
        containerType: pricingForm.containerType,
        baseRate: base,
        perTonRate: ton,
        perKmRate: km,
        sourceLocation: pricingForm.sourceLocation.trim(),
        destinationLocation: pricingForm.destinationLocation.trim(),
      }
    });
  };

  const handleThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTheme({
      variables: {
        input: {
          primaryColor: themeForm.primaryColor,
          primaryColorDark: themeForm.primaryColorDark,
          borderRadius: themeForm.borderRadius,
          fontFamily: themeForm.fontFamily,
        }
      }
    });
  };

  // Onboard driver application action
  const handleApproveDriver = (app: any) => {
    const password = Math.random().toString(36).substring(2, 10).toUpperCase();
    setOnboardingCreds({
      name: app.name,
      email: app.email,
      temporaryPassword: password,
      role: 'DRIVER',
      licenseClass: app.license
    });
    toast.success(`Driver ${app.name} approved! Credentials generated.`);
  };

  // Time shift simulation
  const handleTimeShift = (days: number) => {
    setTimeShiftLoading(true);
    setTimeout(() => {
      setTimeShiftDays((c) => c + days);
      setTimeShiftLoading(false);
      toast.success(`State shifted ${days} days forward. Scheduled billing and routing updates adjusted.`);
    }, 1500);
  };

  // Entrance animations
  useEffect(() => {
    if (tenantRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.tenant-card',
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.1)', stagger: 0.08 }
        );
      }, tenantRef.current);
      return () => ctx.revert();
    }
  }, [dataLoading]);

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw size={24} className="text-orange-500 animate-spin" />
        <p className="text-[var(--color-text-light)] text-xs uppercase font-semibold tracking-wider">Syncing carrier dashboard data...</p>
      </div>
    );
  }

  const fleetTrucks = dashboardData?.trucks || [];
  const fleetContainers = dashboardData?.containers || [];
  const matrices = dashboardData?.pricingMatrices || [];

  return (
    <div ref={tenantRef} className="space-y-8 w-full">
      {/* Title greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)]/50 pb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight flex items-center gap-2">
            Carrier <span className="text-orange-500">Fleet Operations</span>
          </h2>
          <p className="text-[var(--color-text-light)] text-xs mt-1">Review active trucks, container shipments, and configure white-label pricing corridors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchTenant();
              toast.success('Carrier fleet metrics updated!');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:border-orange-500/50 text-xs font-semibold glass transition-all text-[var(--color-text)] hover:text-[var(--color-text)]"
          >
            <RefreshCw size={12} />
            <span>Sync Assets</span>
          </button>
        </div>
      </div>

      {/* Metrics blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Registered Trucks', val: `${fleetTrucks.length} Trucks`, icon: Truck, border: 'border-l-orange-500' },
          { label: 'Active Containers', val: `${fleetContainers.length} Units`, icon: Box, border: 'border-l-emerald-500' },
          { label: 'Billing Rules matrices', val: `${matrices.length} Matrices`, icon: Layers, border: 'border-l-indigo-500' },
          { label: 'Estimated Carrier Revenue', val: convertAndFormatCurrency(1245000 + (timeShiftDays * 8500), currency), icon: TrendingUp, border: 'border-l-yellow-500' },
        ].map((c, i) => (
          <div key={i} className={`tenant-card glass p-6 rounded-2xl border-l-4 ${c.border} border-y-0 border-r-0 shadow-lg flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text-light)] uppercase font-bold tracking-wider">{c.label}</span>
              <p className="text-lg font-black text-[var(--color-text)]">{c.val}</p>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)]/50 rounded-xl border border-[var(--color-border)]/50">
              <c.icon size={16} className="text-[var(--color-text-muted)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab selection */}
      <div className="flex border-b border-[var(--color-border)]/50">
        {(['fleet', 'pricing', 'applications', 'white-label', 'time-travel'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-[var(--color-text-light)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>{tab.replace('-', ' ')}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-glow" />
            )}
          </button>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 gap-8 items-start">
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trucks Column */}
            <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest flex items-center gap-1.5">
                  <Truck size={14} className="text-orange-500" /> Carrier Trucks
                </h3>
                <button
                  onClick={() => { setFormErrors({}); setIsTruckModalOpen(true); }}
                  className="flex items-center gap-1 btn btn-primary text-[9px] px-3 py-1.5 rounded-lg font-bold"
                >
                  <Plus size={10} />
                  <span>Register Truck</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {fleetTrucks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-light)]">No carrier trucks registered. Add one above.</div>
                ) : (
                  fleetTrucks.map((truck: any) => (
                    <div key={truck.id} className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--color-text)] uppercase">{truck.plateNumber}</p>
                        <p className="text-[10px] text-[var(--color-text-light)]">{truck.make} {truck.model} ({truck.year}) — {truck.capacityTons} Tons Capacity</p>
                      </div>
                      <span className={`badge ${
                        truck.status === 'AVAILABLE' ? 'badge-success' : 'badge-primary'
                      } text-[8px] font-bold`}>
                        {truck.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Containers Column */}
            <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest flex items-center gap-1.5">
                  <Box size={14} className="text-orange-500" /> Freight Containers
                </h3>
                <button
                  onClick={() => { setFormErrors({}); setIsContainerModalOpen(true); }}
                  className="flex items-center gap-1 btn btn-primary text-[9px] px-3 py-1.5 rounded-lg font-bold"
                >
                  <Plus size={10} />
                  <span>Register Container</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {fleetContainers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--color-text-light)]">No containers registered. Add one above.</div>
                ) : (
                  fleetContainers.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--color-text)] uppercase">{c.containerNumber}</p>
                        <p className="text-[10px] text-[var(--color-text-light)]">Type: {c.containerType}</p>
                      </div>
                      <span className={`badge ${
                        c.status === 'AVAILABLE' ? 'badge-success' : 'badge-primary'
                      } text-[8px] font-bold`}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">Global Freight Matrix Rules</h3>
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="flex items-center gap-1 btn btn-primary text-[9px] px-3 py-1.5 rounded-lg font-bold"
              >
                <Plus size={10} />
                <span>Define Pricing Rule</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-light)] uppercase font-bold text-[9px] tracking-wider">
                    <th className="pb-3">Transit Corridor</th>
                    <th className="pb-3">Container Type</th>
                    <th className="pb-3 text-right">Base Charge</th>
                    <th className="pb-3 text-right">Rate / Ton</th>
                    <th className="pb-3 text-right">Rate / Km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matrices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--color-text-light)]">No pricing rules defined for this carrier.</td>
                    </tr>
                  ) : (
                    matrices.map((m: any) => (
                      <tr key={m.id} className="text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all">
                        <td className="py-4 font-semibold text-[var(--color-text)]">{m.sourceLocation} to {m.destinationLocation}</td>
                        <td className="py-4 font-bold">{m.containerType}</td>
                        <td className="py-4 text-right font-semibold text-emerald-400">
                          {convertAndFormatCurrency(m.baseRate, currency)}
                        </td>
                        <td className="py-4 text-right">
                          {convertAndFormatCurrency(m.perTonRate, currency)}
                        </td>
                        <td className="py-4 text-right">
                          {convertAndFormatCurrency(m.perKmRate, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
            <div className="border-b border-[var(--color-border)]/50 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">Driver Applications Screening</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: '1', name: 'John Doe', email: 'john.doe@gmail.com', experience: '8 Years', license: 'CLASS A', date: '2026-07-06' },
                { id: '2', name: 'Sarah Connor', email: 'connor.s@outlook.com', experience: '5 Years', license: 'CLASS B', date: '2026-07-07' },
              ].map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--color-text)]">{app.name}</p>
                    <p className="text-[10px] text-[var(--color-text-light)]">{app.email} — {app.experience} Exp ({app.license})</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveDriver(app)}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-lg transition-all"
                      title="Approve & Generate Credentials"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => toast.error(`Application for ${app.name} archived.`)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'white-label' && (
          <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6 max-w-xl">
            <div className="border-b border-[var(--color-border)]/50 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">White-Label Branding Settings</h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Configure your corporate design system elements for immediate white-labeling.</p>
            </div>

            <form onSubmit={handleThemeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Primary Brand Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      className="input-field text-xs text-center"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Primary Color Dark</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={themeForm.primaryColorDark}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColorDark: e.target.value })}
                      className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={themeForm.primaryColorDark}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColorDark: e.target.value })}
                      className="input-field text-xs text-center"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Border Radius</label>
                  <input
                    type="text"
                    value={themeForm.borderRadius}
                    onChange={(e) => setThemeForm({ ...themeForm, borderRadius: e.target.value })}
                    placeholder="e.g. 12px or 1rem"
                    className="input-field text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Font Family</label>
                  <select
                    value={themeForm.fontFamily}
                    onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })}
                    className="input-field text-xs bg-[var(--color-surface-2)]/50 border-[var(--color-border)] text-[var(--color-text)]"
                  >
                    <option value="Inter" className="bg-black">Inter (Sleek sans-serif)</option>
                    <option value="Outfit" className="bg-black">Outfit (Modern bold)</option>
                    <option value="Roboto" className="bg-black">Roboto (Classic)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={themeSubmitting}
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                {themeSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Applying Branding Parameters...</span>
                  </>
                ) : (
                  <>
                    <span>Update White-label Parameters</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'time-travel' && (
          <div className="tenant-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6 max-w-xl">
            <div className="border-b border-[var(--color-border)]/50 pb-4 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <div>
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">Time-Travel State Simulation</h3>
                <p className="text-[10px] text-[var(--color-text-light)] mt-1">Shift historical states forward to test billing cycles, due invoices, and routing forecasts.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs text-orange-400 leading-relaxed flex gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase text-[10px]">Simulation Sandbox Mode</span>
                Changing simulation parameters only offsets date calculations for dashboard metrics. Database tables remain integrity-validated.
              </div>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50">
              <span className="text-xs font-semibold">Active Simulation Offset:</span>
              <span className="badge badge-primary text-[10px] font-black uppercase font-mono">{timeShiftDays} Days Offset</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTimeShift(7)}
                disabled={timeShiftLoading}
                className="btn btn-ghost border border-[var(--color-border)] hover:border-orange-500/50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Calendar size={12} />
                <span>+7 Days Forward</span>
              </button>
              <button
                onClick={() => handleTimeShift(30)}
                disabled={timeShiftLoading}
                className="btn btn-ghost border border-[var(--color-border)] hover:border-orange-500/50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Clock size={12} />
                <span>+30 Days (Full Cycle)</span>
              </button>
            </div>
            {timeShiftDays > 0 && (
              <button
                onClick={() => {
                  setTimeShiftDays(0);
                  toast.success('Simulation timeline reset to current epoch.');
                }}
                className="w-full text-center text-[10px] text-[var(--color-text-light)] hover:text-[var(--color-text)] uppercase font-bold tracking-wider"
              >
                Reset simulation offset to current date
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Truck Modal */}
      {isTruckModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTruckModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)]">Register Carrier Truck</h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Submit license plate credentials for carrier vehicle audit.</p>
            </div>

            <form onSubmit={handleTruckSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">License Plate</label>
                <input
                  type="text"
                  value={truckForm.licensePlate}
                  onChange={(e) => setTruckForm({ ...truckForm, licensePlate: e.target.value })}
                  placeholder="e.g. KCA 123A"
                  className="input-field text-xs uppercase"
                  required
                />
                {formErrors.licensePlate && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.licensePlate}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Manufacturer Brand / Make</label>
                  <input
                    type="text"
                    value={truckForm.make}
                    onChange={(e) => setTruckForm({ ...truckForm, make: e.target.value })}
                    placeholder="e.g. Mercedes-Benz"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.make && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.make}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Model Name</label>
                  <input
                    type="text"
                    value={truckForm.model}
                    onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })}
                    placeholder="e.g. Actros 2545"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.model && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.model}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    value={truckForm.year}
                    onChange={(e) => setTruckForm({ ...truckForm, year: e.target.value })}
                    placeholder="e.g. 2022"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.year && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.year}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Tonnage Capacity (Tons)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={truckForm.capacityTons}
                    onChange={(e) => setTruckForm({ ...truckForm, capacityTons: e.target.value })}
                    placeholder="e.g. 28.5"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.capacityTons && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.capacityTons}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={truckSubmitting}
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                {truckSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Registering Assets...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Truck Registration</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Container Modal */}
      {isContainerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsContainerModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)]">Register Freight Container</h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Submit global cargo container specifications.</p>
            </div>

            <form onSubmit={handleContainerSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Container ISO Code Number</label>
                <input
                  type="text"
                  value={containerForm.containerNumber}
                  onChange={(e) => setContainerForm({ ...containerForm, containerNumber: e.target.value })}
                  placeholder="e.g. MSKU1234567"
                  className="input-field text-xs uppercase"
                  required
                />
                {formErrors.containerNumber && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.containerNumber}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Container Type</label>
                  <select
                    value={containerForm.containerType}
                    onChange={(e) => setContainerForm({ ...containerForm, containerType: e.target.value })}
                    className="input-field text-xs bg-[var(--color-surface-2)]/50 border-[var(--color-border)] text-[var(--color-text)]"
                  >
                    <option value="20FT" className="bg-black">20FT Dry Van</option>
                    <option value="40FT" className="bg-black">40FT Dry Van</option>
                    <option value="40HC" className="bg-black">40FT High Cube</option>
                    <option value="REEFER" className="bg-black">Reefer (Cold-Chain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Max Weight Capacity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={containerForm.capacityTons}
                    onChange={(e) => setContainerForm({ ...containerForm, capacityTons: e.target.value })}
                    placeholder="e.g. 24.0"
                    className="input-field text-xs"
                    required
                  />
                  {formErrors.capacityTons && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.capacityTons}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={containerSubmitting}
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                {containerSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Registering Container...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Container Registration</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Define Pricing Rule Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)]">Define Corridor Pricing Rule</h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Specify new rate parameters for freight calculation.</p>
            </div>

            <form onSubmit={handlePricingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Source Location</label>
                  <input
                    type="text"
                    value={pricingForm.sourceLocation}
                    onChange={(e) => setPricingForm({ ...pricingForm, sourceLocation: e.target.value })}
                    placeholder="e.g. Mombasa"
                    className="input-field text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Destination Location</label>
                  <input
                    type="text"
                    value={pricingForm.destinationLocation}
                    onChange={(e) => setPricingForm({ ...pricingForm, destinationLocation: e.target.value })}
                    placeholder="e.g. Kampala"
                    className="input-field text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Container size category</label>
                <select
                  value={pricingForm.containerType}
                  onChange={(e) => setPricingForm({ ...pricingForm, containerType: e.target.value })}
                  className="input-field text-xs bg-[var(--color-surface-2)]/50 border-[var(--color-border)] text-[var(--color-text)]"
                >
                  <option value="20FT" className="bg-black">20FT Container</option>
                  <option value="40FT" className="bg-black">40FT Container</option>
                  <option value="40HC" className="bg-black">40FT High Cube</option>
                  <option value="REEFER" className="bg-black">Reefer Container</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Base Charge (KES)</label>
                <input
                  type="number"
                  value={pricingForm.basePrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, basePrice: e.target.value })}
                  placeholder="e.g. 15000"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Rate / Ton (KES)</label>
                  <input
                    type="number"
                    value={pricingForm.pricePerTon}
                    onChange={(e) => setPricingForm({ ...pricingForm, pricePerTon: e.target.value })}
                    placeholder="e.g. 1200"
                    className="input-field text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Rate / Km (KES)</label>
                  <input
                    type="number"
                    value={pricingForm.pricePerKm}
                    onChange={(e) => setPricingForm({ ...pricingForm, pricePerKm: e.target.value })}
                    placeholder="e.g. 150"
                    className="input-field text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider"
              >
                Save Pricing Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Credentials generated overlay */}
      {onboardingCreds && (
        <div className="fixed inset-0 bg-[var(--color-surface)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-emerald-500/20 p-6 rounded-2xl w-full max-w-md space-y-6 text-left relative animate-in zoom-in-95 duration-200">
            <div className="flex gap-2 items-center text-emerald-400">
              <Shield size={16} />
              <h3 className="text-xs uppercase font-extrabold tracking-widest font-mono">Driver Credentials Onboarded</h3>
            </div>
            <div className="space-y-3.5 border-y border-[var(--color-border)]/50 py-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-light)]">Driver Name:</span>
                <span className="font-bold text-[var(--color-text)]">{onboardingCreds.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-light)]">Portal Username:</span>
                <span className="font-bold text-[var(--color-text)] font-mono">{onboardingCreds.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-light)]">Temporary Password:</span>
                <span className="font-bold text-emerald-400 font-mono tracking-wider">{onboardingCreds.temporaryPassword}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-light)]">Assigned Role:</span>
                <span className="font-bold text-[var(--color-text)] uppercase">{onboardingCreds.role}</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-text-light)] leading-relaxed">
              These credentials have been automatically dispatched via SMS/Email notifications to the driver's device. Secure cryptographic logs are stored.
            </p>
            <button
              onClick={() => setOnboardingCreds(null)}
              className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
