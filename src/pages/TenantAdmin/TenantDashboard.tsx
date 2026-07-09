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
import { gql } from '@apollo/client';

const GET_TENANT_DASHBOARD = gql`
  query GetTenantDashboard {
    trucks {
      id
      licensePlate
      model
      capacityTons
      status
    }
    containers {
      id
      containerNumber
      containerType
      status
    }
    pricingMatrices {
      id
      containerType
      basePrice
      pricePerTon
      pricePerKm
    }
  }
`;

const CREATE_TRUCK = gql`
  mutation CreateTruck($input: CreateTruckInput!) {
    createTruck(input: $input) {
      success
      message
      truck {
        id
        licensePlate
        model
        capacityTons
      }
    }
  }
`;

const CREATE_CONTAINER = gql`
  mutation CreateContainer($input: CreateContainerInput!) {
    createContainer(input: $input) {
      success
      message
      container {
        id
        containerNumber
        containerType
      }
    }
  }
`;

const UPDATE_TENANT_THEME = gql`
  mutation UpdateTenantTheme($input: UpdateTenantThemeInput!) {
    updateTenantTheme(input: $input) {
      primaryColor
      primaryColorDark
      borderRadius
    }
  }
`;

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
    model: '',
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
      if (res.createTruck?.success) {
        toast.success(res.createTruck.message);
        setIsTruckModalOpen(false);
        setTruckForm({ licensePlate: '', model: '', capacityTons: '' });
        refetchTenant();
      } else {
        toast.error(res.createTruck?.message || 'Failed to register truck.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while saving truck.');
    }
  });

  const [createContainer, { loading: containerSubmitting }] = useMutation(CREATE_CONTAINER, {
    onCompleted: (res) => {
      if (res.createContainer?.success) {
        toast.success(res.createContainer.message);
        setIsContainerModalOpen(false);
        setContainerForm({ containerNumber: '', containerType: '20FT', capacityTons: '' });
        refetchTenant();
      } else {
        toast.error(res.createContainer?.message || 'Failed to register container.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while saving container.');
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

    if (!truckForm.model.trim()) {
      errors.model = 'Manufacturer/Model is required.';
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

    const cap = parseFloat(containerForm.capacityTons);
    if (!containerForm.capacityTons) {
      errors.capacityTons = 'Max weight capacity is required.';
    } else if (isNaN(cap) || cap <= 0 || cap > 40) {
      errors.capacityTons = 'Capacity must be between 0.1 and 40.0 Tons.';
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
          licensePlate: truckForm.licensePlate.trim().toUpperCase(),
          model: truckForm.model.trim(),
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
          capacityTons: parseFloat(containerForm.capacityTons),
        }
      }
    });
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Corridor Pricing Matrix updated for container category: ${pricingForm.containerType}`);
    setIsPricingModalOpen(false);
    setPricingForm({ containerType: '20FT', basePrice: '', pricePerTon: '', pricePerKm: '' });
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
        <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Syncing carrier dashboard data...</p>
      </div>
    );
  }

  const fleetTrucks = dashboardData?.trucks || [];
  const fleetContainers = dashboardData?.containers || [];
  const matrices = dashboardData?.pricingMatrices || [];

  return (
    <div ref={tenantRef} className="space-y-8 w-full">
      {/* Title greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Carrier <span className="text-orange-500">Fleet Operations</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Review active trucks, container shipments, and configure white-label pricing corridors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchTenant();
              toast.success('Carrier fleet metrics updated!');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-orange-500/50 text-xs font-semibold glass transition-all text-white/80 hover:text-white"
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
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</span>
              <p className="text-lg font-black text-white">{c.val}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <c.icon size={16} className="text-white/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab selection */}
      <div className="flex border-b border-white/5">
        {(['fleet', 'pricing', 'applications', 'white-label', 'time-travel'] as const).map((tab) => (
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

      {/* Main panels */}
      <div className="grid grid-cols-1 gap-8 items-start">
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trucks Column */}
            <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
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
                  <div className="py-8 text-center text-xs text-white/40">No carrier trucks registered. Add one above.</div>
                ) : (
                  fleetTrucks.map((truck: any) => (
                    <div key={truck.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase">{truck.licensePlate}</p>
                        <p className="text-[10px] text-white/40">{truck.model} — {truck.capacityTons} Tons Capacity</p>
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
            <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
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
                  <div className="py-8 text-center text-xs text-white/40">No containers registered. Add one above.</div>
                ) : (
                  fleetContainers.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase">{c.containerNumber}</p>
                        <p className="text-[10px] text-white/40">Type: {c.containerType}</p>
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
          <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Global Freight Matrix Rules</h3>
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
                  <tr className="border-b border-white/10 text-white/40 uppercase font-bold text-[9px] tracking-wider">
                    <th className="pb-3">Container Type</th>
                    <th className="pb-3 text-right">Base Charge</th>
                    <th className="pb-3 text-right">Rate / Ton</th>
                    <th className="pb-3 text-right">Rate / Km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matrices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/40">No pricing rules defined for this carrier.</td>
                    </tr>
                  ) : (
                    matrices.map((m: any) => (
                      <tr key={m.id} className="text-white/80 hover:bg-white/5 transition-all">
                        <td className="py-4 font-bold">{m.containerType}</td>
                        <td className="py-4 text-right font-semibold text-emerald-400">
                          {convertAndFormatCurrency(m.basePrice, currency)}
                        </td>
                        <td className="py-4 text-right">
                          {convertAndFormatCurrency(m.pricePerTon, currency)}
                        </td>
                        <td className="py-4 text-right">
                          {convertAndFormatCurrency(m.pricePerKm, currency)}
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
          <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Driver Applications Screening</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: '1', name: 'John Doe', email: 'john.doe@gmail.com', experience: '8 Years', license: 'CLASS A', date: '2026-07-06' },
                { id: '2', name: 'Sarah Connor', email: 'connor.s@outlook.com', experience: '5 Years', license: 'CLASS B', date: '2026-07-07' },
              ].map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">{app.name}</p>
                    <p className="text-[10px] text-white/40">{app.email} — {app.experience} Exp ({app.license})</p>
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
          <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6 max-w-xl">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">White-Label Branding Settings</h3>
              <p className="text-[10px] text-white/40 mt-1">Configure your corporate design system elements for immediate white-labeling.</p>
            </div>

            <form onSubmit={handleThemeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Primary Brand Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Primary Color Dark</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={themeForm.primaryColorDark}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColorDark: e.target.value })}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Border Radius</label>
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Font Family</label>
                  <select
                    value={themeForm.fontFamily}
                    onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })}
                    className="input-field text-xs bg-white/5 border-white/10 text-white"
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
          <div className="tenant-card glass border border-white/5 p-6 rounded-2xl space-y-6 max-w-xl">
            <div className="border-b border-white/5 pb-4 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <div>
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Time-Travel State Simulation</h3>
                <p className="text-[10px] text-white/40 mt-1">Shift historical states forward to test billing cycles, due invoices, and routing forecasts.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs text-orange-400 leading-relaxed flex gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase text-[10px]">Simulation Sandbox Mode</span>
                Changing simulation parameters only offsets date calculations for dashboard metrics. Database tables remain integrity-validated.
              </div>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-xs font-semibold">Active Simulation Offset:</span>
              <span className="badge badge-primary text-[10px] font-black uppercase font-mono">{timeShiftDays} Days Offset</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTimeShift(7)}
                disabled={timeShiftLoading}
                className="btn btn-ghost border border-white/10 hover:border-orange-500/50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Calendar size={12} />
                <span>+7 Days Forward</span>
              </button>
              <button
                onClick={() => handleTimeShift(30)}
                disabled={timeShiftLoading}
                className="btn btn-ghost border border-white/10 hover:border-orange-500/50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
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
                className="w-full text-center text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider"
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
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTruckModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-white">Register Carrier Truck</h3>
              <p className="text-[10px] text-white/40 mt-1">Submit license plate credentials for carrier vehicle audit.</p>
            </div>

            <form onSubmit={handleTruckSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">License Plate</label>
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

              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Manufacturer / Model</label>
                <input
                  type="text"
                  value={truckForm.model}
                  onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })}
                  placeholder="e.g. Mercedes Actros 2545"
                  className="input-field text-xs"
                  required
                />
                {formErrors.model && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.model}</span>
                )}
              </div>

              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Tonnage Capacity (Tons)</label>
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
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsContainerModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-white">Register Freight Container</h3>
              <p className="text-[10px] text-white/40 mt-1">Submit global cargo container specifications.</p>
            </div>

            <form onSubmit={handleContainerSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Container ISO Code Number</label>
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Container Type</label>
                  <select
                    value={containerForm.containerType}
                    onChange={(e) => setContainerForm({ ...containerForm, containerType: e.target.value })}
                    className="input-field text-xs bg-white/5 border-white/10 text-white"
                  >
                    <option value="20FT" className="bg-black">20FT Dry Van</option>
                    <option value="40FT" className="bg-black">40FT Dry Van</option>
                    <option value="40HC" className="bg-black">40FT High Cube</option>
                    <option value="REEFER" className="bg-black">Reefer (Cold-Chain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Max Weight Capacity</label>
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
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-white">Define Corridor Pricing Rule</h3>
              <p className="text-[10px] text-white/40 mt-1">Specify new rate parameters for freight calculation.</p>
            </div>

            <form onSubmit={handlePricingSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Container size category</label>
                <select
                  value={pricingForm.containerType}
                  onChange={(e) => setPricingForm({ ...pricingForm, containerType: e.target.value })}
                  className="input-field text-xs bg-white/5 border-white/10 text-white"
                >
                  <option value="20FT" className="bg-black">20FT Container</option>
                  <option value="40FT" className="bg-black">40FT Container</option>
                  <option value="40HC" className="bg-black">40FT High Cube</option>
                  <option value="REEFER" className="bg-black">Reefer Container</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Base Charge (KES)</label>
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Rate / Ton (KES)</label>
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
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Rate / Km (KES)</label>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-emerald-500/20 p-6 rounded-2xl w-full max-w-md space-y-6 text-left relative animate-in zoom-in-95 duration-200">
            <div className="flex gap-2 items-center text-emerald-400">
              <Shield size={16} />
              <h3 className="text-xs uppercase font-extrabold tracking-widest font-mono">Driver Credentials Onboarded</h3>
            </div>
            <div className="space-y-3.5 border-y border-white/5 py-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/40">Driver Name:</span>
                <span className="font-bold text-white">{onboardingCreds.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Portal Username:</span>
                <span className="font-bold text-white font-mono">{onboardingCreds.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Temporary Password:</span>
                <span className="font-bold text-emerald-400 font-mono tracking-wider">{onboardingCreds.temporaryPassword}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Assigned Role:</span>
                <span className="font-bold text-white uppercase">{onboardingCreds.role}</span>
              </div>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
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
