import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  MapPin, Send, ClipboardList,
  TrendingUp, Box, CheckCircle,
  Truck, ArrowRight, Activity, RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { convertAndFormatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

// ─── GraphQL Queries & Mutations ─────────────────────────────────────────────
import { gql } from '@apollo/client';

const GET_CUSTOMER_DASHBOARD = gql`
  query GetCustomerDashboard {
    customerDashboard {
      activeShipments
      totalShipments
      pendingQuotes
      recentShipments {
        id
        trackingNumber
        status
        pickup
        delivery
        estimatedDelivery
      }
    }
  }
`;

const REQUEST_QUOTE = gql`
  mutation RequestQuote($input: RequestQuoteInput!) {
    requestQuote(input: $input) {
      success
      message
      quote {
        id
        pickupLocation
        deliveryLocation
        weightTons
        containerType
        cargoDetails
        estimatedPrice
        status
        createdAt
      }
    }
  }
`;

const GET_CUSTOMER_QUOTES = gql`
  query GetCustomerQuotes {
    quotes {
      id
      pickupLocation
      deliveryLocation
      weightTons
      containerType
      estimatedPrice
      status
      createdAt
    }
  }
`;

const GET_CUSTOMER_INVOICES = gql`
  query GetCustomerInvoices {
    invoices {
      id
      amount
      status
      dueDate
      createdAt
    }
  }
`;

const CustomerDashboard: React.FC = () => {
  const { currency } = useAppStore();
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Tabs: 'shipments', 'quotes', 'invoices'
  const [activeTab, setActiveTab] = useState<'shipments' | 'quotes' | 'invoices'>('shipments');

  // Queries
  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useQuery(GET_CUSTOMER_DASHBOARD);
  const { data: quotesData, refetch: refetchQuotes } = useQuery(GET_CUSTOMER_QUOTES);
  const { data: invoicesData, refetch: refetchInvoices } = useQuery(GET_CUSTOMER_INVOICES);

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    pickupLocation: '',
    deliveryLocation: '',
    weightTons: '',
    containerType: '20FT',
    cargoDetails: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mutations
  const [requestQuote, { loading: quoteSubmitting }] = useMutation(REQUEST_QUOTE, {
    onCompleted: (res) => {
      if (res.requestQuote?.success) {
        toast.success(res.requestQuote.message);
        setQuoteForm({
          pickupLocation: '',
          deliveryLocation: '',
          weightTons: '',
          containerType: '20FT',
          cargoDetails: '',
        });
        refetchQuotes();
        refetchDash();
      } else {
        toast.error(res.requestQuote?.message || 'Failed to dispatch quotation request.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while contacting carriers.');
    }
  });

  // Sanitization & Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!quoteForm.pickupLocation.trim()) {
      errors.pickupLocation = 'Pickup checkpoint is required.';
    } else if (/[<>{}[\]]/.test(quoteForm.pickupLocation)) {
      errors.pickupLocation = 'Invalid characters detected.';
    }

    if (!quoteForm.deliveryLocation.trim()) {
      errors.deliveryLocation = 'Delivery terminal is required.';
    } else if (/[<>{}[\]]/.test(quoteForm.deliveryLocation)) {
      errors.deliveryLocation = 'Invalid characters detected.';
    }

    const weight = parseFloat(quoteForm.weightTons);
    if (!quoteForm.weightTons) {
      errors.weightTons = 'Tonnage load is required.';
    } else if (isNaN(weight) || weight <= 0 || weight > 50) {
      errors.weightTons = 'Weight must be between 0.1 and 50.0 Tons.';
    }

    if (quoteForm.cargoDetails && quoteForm.cargoDetails.length > 500) {
      errors.cargoDetails = 'Manifest details cannot exceed 500 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    requestQuote({
      variables: {
        input: {
          pickupLocation: quoteForm.pickupLocation.trim(),
          deliveryLocation: quoteForm.deliveryLocation.trim(),
          weightTons: parseFloat(quoteForm.weightTons),
          containerType: quoteForm.containerType,
          cargoDetails: quoteForm.cargoDetails.trim(),
        }
      }
    });
  };

  // GSAP Entrance Animations
  useEffect(() => {
    if (dashboardRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.dashboard-card',
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.2)', stagger: 0.1 }
        );
      }, dashboardRef.current);
      return () => ctx.revert();
    }
  }, [dashLoading]);

  // Loading state
  if (dashLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw size={24} className="text-orange-500 animate-spin" />
        <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Syncing dashboard statistics...</p>
      </div>
    );
  }

  const stats = dashData?.customerDashboard || {
    activeShipments: 3,
    totalShipments: 12,
    pendingQuotes: 1,
    recentShipments: [],
  };

  const quotes = quotesData?.quotes || [];
  const invoices = invoicesData?.invoices || [];

  return (
    <div ref={dashboardRef} className="space-y-8 w-full">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Customer <span className="text-orange-500">Freight Center</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Submit load details, inspect invoice payments, and track containers in real-time.</p>
        </div>
        <button
          onClick={() => {
            refetchDash();
            refetchQuotes();
            refetchInvoices();
            toast.success('Dashboard metrics refreshed!');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-orange-500/50 text-xs font-semibold glass transition-all text-white/80 hover:text-white"
        >
          <RefreshCw size={12} />
          <span>Sync Console</span>
        </button>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Cargo Containers', val: `${stats.activeShipments} Shipments`, icon: Box, border: 'border-l-orange-500' },
          { label: 'Carrier Quote Requests', val: `${stats.pendingQuotes} Quotes`, icon: ClipboardList, border: 'border-l-indigo-500' },
          { label: 'Completed Deliveries', val: `${stats.totalShipments} Containers`, icon: CheckCircle, border: 'border-l-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className={`dashboard-card glass p-6 rounded-2xl border-l-4 ${stat.border} border-y-0 border-r-0 shadow-xl flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{stat.label}</span>
              <p className="text-xl font-black text-white">{stat.val}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <stat.icon size={18} className="text-white/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/5">
        {(['shipments', 'quotes', 'invoices'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span>{tab}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-glow" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main interactive panel */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'shipments' && (
            <div className="dashboard-card glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-orange-500 animate-pulse" /> Active Transit Tracking
                </h3>
                <span className="badge badge-success text-[8px]">GPS Feeds Live</span>
              </div>

              {/* Dynamic shipment visual map simulator */}
              <div className="w-full h-48 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden flex items-center justify-center p-4">
                {/* SVG Route Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 200">
                  <path
                    d="M 50,150 Q 250,50 450,120"
                    fill="none"
                    stroke="rgba(249, 115, 22, 0.15)"
                    strokeWidth="4"
                  />
                  <path
                    d="M 50,150 Q 250,50 450,120"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeDasharray="6,6"
                    className="animate-dash"
                  />
                  {/* Milestones */}
                  <circle cx="50" cy="150" r="6" fill="#10b981" />
                  <circle cx="210" cy="85" r="8" fill="#f97316" className="animate-ping opacity-75" />
                  <circle cx="210" cy="85" r="5" fill="#f97316" />
                  <circle cx="450" cy="120" r="6" fill="#3b82f6" />
                </svg>

                {/* Map Labels */}
                <div className="absolute top-8 left-8 text-left space-y-1 z-15">
                  <p className="text-[8px] text-white/40 uppercase font-black">Pickup Checkpoint</p>
                  <p className="text-xs font-bold text-white">Mombasa Port (KE)</p>
                </div>

                <div className="absolute bottom-8 right-8 text-right space-y-1 z-15">
                  <p className="text-[8px] text-white/40 uppercase font-black">Final Terminal</p>
                  <p className="text-xs font-bold text-white">Kampala Depot (UG)</p>
                </div>

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[9px] text-white/80 font-semibold tracking-wider flex items-center gap-1.5">
                  <Truck size={10} className="text-orange-500" />
                  <span>En-Route: Malaba Border Station</span>
                </div>
              </div>

              {/* Shipment Cards list */}
              <div className="space-y-4">
                {stats.recentShipments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">No active shipments in transit. Request a quote to initiate.</div>
                ) : (
                  stats.recentShipments.map((shipment: any) => (
                    <div key={shipment.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{shipment.trackingNumber}</span>
                          <span className="badge badge-primary text-[8px] px-2 py-0.5 uppercase">{shipment.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                          <span>{shipment.pickup}</span>
                          <ArrowRight size={10} className="text-white/30" />
                          <span>{shipment.delivery}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-left sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-white/40 uppercase font-black">ETA Delivery</span>
                          <p className="text-xs font-bold text-white">{shipment.estimatedDelivery}</p>
                        </div>
                        <button className="btn btn-ghost border border-white/10 text-[10px] px-3.5 py-1.5 rounded-lg font-bold">
                          Live Map
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="dashboard-card glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Freight Quotation History</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Container</th>
                      <th className="pb-3">Weight (Tons)</th>
                      <th className="pb-3 text-right">Estimate</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/40">No quotes generated yet. Submit the request panel on the right.</td>
                      </tr>
                    ) : (
                      quotes.map((q: any) => (
                        <tr key={q.id} className="text-white/80 hover:bg-white/5 transition-all">
                          <td className="py-4 font-semibold">
                            <span className="block text-xs">{q.pickupLocation}</span>
                            <span className="text-[9px] text-white/40">to {q.deliveryLocation}</span>
                          </td>
                          <td className="py-4">{q.containerType}</td>
                          <td className="py-4 font-semibold">{q.weightTons} Tons</td>
                          <td className="py-4 text-right font-black text-orange-500">
                            {convertAndFormatCurrency(q.estimatedPrice, currency)}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`badge ${
                              q.status === 'APPROVED' ? 'badge-success' : q.status === 'PENDING' ? 'badge-primary' : 'bg-red-500/10 text-red-400'
                            } text-[8px] font-bold`}>
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="dashboard-card glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest">Billing & Invoices</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-3">Invoice ID</th>
                      <th className="pb-3">Date Generated</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3 text-right">Tonnage Rate</th>
                      <th className="pb-3 text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/40">No pending invoices found.</td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="text-white/80 hover:bg-white/5 transition-all">
                          <td className="py-4 font-mono text-[10px] text-white/60">{inv.id.slice(0, 8)}...</td>
                          <td className="py-4">{inv.createdAt.split('T')[0]}</td>
                          <td className="py-4 text-white/50">{inv.dueDate}</td>
                          <td className="py-4 text-right font-black text-white">
                            {convertAndFormatCurrency(inv.amount, currency)}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`badge ${
                              inv.status === 'PAID' ? 'badge-success' : 'badge-primary'
                            } text-[8px] font-bold`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right side form panel: Request Quote */}
        <div className="lg:col-span-4 dashboard-card glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
              <TrendingUp size={13} className="text-orange-500" /> Dynamic Quote Estimator
            </h3>
            <p className="text-[10px] text-white/40 mt-1">Get immediate pricing estimates for international cargo routes.</p>
          </div>

          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Pickup Terminal</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/30" size={13} />
                <input
                  type="text"
                  value={quoteForm.pickupLocation}
                  onChange={(e) => setQuoteForm({ ...quoteForm, pickupLocation: e.target.value })}
                  placeholder="e.g. Mombasa Port"
                  className="input-field pl-10 text-xs"
                  required
                />
              </div>
              {formErrors.pickupLocation && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.pickupLocation}</span>
              )}
            </div>

            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Delivery Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/30" size={13} />
                <input
                  type="text"
                  value={quoteForm.deliveryLocation}
                  onChange={(e) => setQuoteForm({ ...quoteForm, deliveryLocation: e.target.value })}
                  placeholder="e.g. Kampala Depot"
                  className="input-field pl-10 text-xs"
                  required
                />
              </div>
              {formErrors.deliveryLocation && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.deliveryLocation}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Weight (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={quoteForm.weightTons}
                  onChange={(e) => setQuoteForm({ ...quoteForm, weightTons: e.target.value })}
                  placeholder="e.g. 15.5"
                  className="input-field text-xs"
                  required
                />
                {formErrors.weightTons && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.weightTons}</span>
                )}
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Container size</label>
                <select
                  value={quoteForm.containerType}
                  onChange={(e) => setQuoteForm({ ...quoteForm, containerType: e.target.value })}
                  className="input-field text-xs bg-white/5 border-white/10 text-white"
                >
                  <option value="20FT" className="bg-black">20FT Container</option>
                  <option value="40FT" className="bg-black">40FT Container</option>
                  <option value="40HC" className="bg-black">40FT High Cube</option>
                  <option value="REEFER" className="bg-black">Reefer Container</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Cargo Details & Description</label>
              <textarea
                value={quoteForm.cargoDetails}
                onChange={(e) => setQuoteForm({ ...quoteForm, cargoDetails: e.target.value })}
                placeholder="e.g. Perishable agricultural goods, requires constant 4C temperature monitoring."
                className="input-field text-xs h-20 resize-none"
              />
              {formErrors.cargoDetails && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.cargoDetails}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={quoteSubmitting}
              className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
            >
              {quoteSubmitting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Computing Quote...</span>
                </>
              ) : (
                <>
                  <span>Request Shipping Quote</span>
                  <Send size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
