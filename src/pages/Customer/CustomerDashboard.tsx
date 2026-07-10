import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  MapPin, Send, ClipboardList,
  TrendingUp, Box, CheckCircle,
  Truck, ArrowRight, Activity, RefreshCw,
  X, Star, CreditCard, Download, Play, Pause
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { convertAndFormatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

// ─── GraphQL Queries & Mutations ─────────────────────────────────────────────
import {
  GET_CUSTOMER_DASHBOARD,
  GET_CUSTOMER_QUOTES,
  GET_CUSTOMER_INVOICES
} from '../../api/queries';
import {
  REQUEST_QUOTE,
  BOOK_QUOTE,
  PROCESS_PAYMENT
} from '../../api/mutations';

const CustomerDashboard: React.FC = () => {
  const { currency } = useAppStore();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  // Tabs: 'shipments', 'quotes', 'invoices'
  const [activeTab, setActiveTab] = useState<'shipments' | 'quotes' | 'invoices'>('shipments');

  useEffect(() => {
    if (location.pathname.endsWith('/quotes')) {
      setActiveTab('quotes');
    } else if (location.pathname.endsWith('/invoices')) {
      setActiveTab('invoices');
    } else {
      setActiveTab('shipments');
    }
  }, [location.pathname]);

  // Selected Detail Modal states
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Rating feedback state
  const [ratingTripId, setRatingTripId] = useState<string>('');
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  // Payment checkout states
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'STRIPE' | 'BANK_TRANSFER'>('MPESA');
  const [paymentForm, setPaymentForm] = useState({
    phoneNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stkPushWaiting, setStkPushWaiting] = useState(false);

  // Map Replay state
  const [replayProgress, setReplayProgress] = useState<number>(65);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const replayIntervalRef = useRef<any>(null);

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
    declaredValue: '',
    isHazmat: false,
    isExpress: false,
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
          declaredValue: '',
          isHazmat: false,
          isExpress: false,
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

  const [bookQuote, { loading: bookSubmitting }] = useMutation(BOOK_QUOTE, {
    onCompleted: (res) => {
      if (res.bookQuote?.success) {
        toast.success(res.bookQuote.message);
        setIsQuoteModalOpen(false);
        refetchQuotes();
        refetchInvoices();
        refetchDash();
      } else {
        toast.error(res.bookQuote?.message || 'Failed to book quote.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while booking quote.');
    }
  });

  const [processPayment] = useMutation(PROCESS_PAYMENT);

  // Map replay simulation
  useEffect(() => {
    if (isReplaying) {
      replayIntervalRef.current = setInterval(() => {
        setReplayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(replayIntervalRef.current);
            setIsReplaying(false);
            return 100;
          }
          return prev + 5;
        });
      }, 800);
    } else {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    }
    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [isReplaying]);

  // Form sanitization and validation
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

    const declaredVal = parseFloat(quoteForm.declaredValue);
    if (quoteForm.declaredValue && (isNaN(declaredVal) || declaredVal < 0)) {
      errors.declaredValue = 'Declared value must be a positive number.';
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
          cargoDetails: quoteForm.cargoDetails.trim() + 
            (quoteForm.isHazmat ? ' [HAZMAT]' : '') + 
            (quoteForm.isExpress ? ' [EXPRESS]' : '') + 
            (quoteForm.declaredValue ? ` [Value: KES ${quoteForm.declaredValue}]` : ''),
        }
      }
    });
  };

  // ClickPesa Payment simulation
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setPaymentProcessing(true);

    if (paymentMethod === 'MPESA') {
      setStkPushWaiting(true);
      setTimeout(() => {
        setStkPushWaiting(false);
        // Complete the payment via backend mutation
        const txId = 'MPESA-TX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        processPayment({
          variables: {
            input: {
              invoiceId: selectedInvoice.id,
              transactionId: txId,
              paymentMethod: 'MPESA',
              amount: parseFloat(selectedInvoice.amount),
            }
          }
        }).then(() => {
          toast.success(`ClickPesa payment successful! TxID: ${txId}`);
          setPaymentProcessing(false);
          setIsInvoiceModalOpen(false);
          refetchInvoices();
          refetchDash();
        }).catch((err) => {
          toast.error(err.message || 'Payment mutation failed.');
          setPaymentProcessing(false);
        });
      }, 3500);
    } else {
      setTimeout(() => {
        const txId = (paymentMethod === 'STRIPE' ? 'STRIPE-TX-' : 'BANK-REF-') + Math.random().toString(36).substring(2, 10).toUpperCase();
        processPayment({
          variables: {
            input: {
              invoiceId: selectedInvoice.id,
              transactionId: txId,
              paymentMethod: paymentMethod,
              amount: parseFloat(selectedInvoice.amount),
            }
          }
        }).then(() => {
          toast.success(`Payment verified successfully! Ref: ${txId}`);
          setPaymentProcessing(false);
          setIsInvoiceModalOpen(false);
          refetchInvoices();
          refetchDash();
        }).catch((err) => {
          toast.error(err.message || 'Payment mutation failed.');
          setPaymentProcessing(false);
        });
      }, 2000);
    }
  };

  // Download receipt / invoice simulation
  const handleDownloadInvoice = (inv: any) => {
    toast.loading('Generating Secure Cryptographic PDF Invoice...', { id: 'pdf' });
    setTimeout(() => {
      toast.success(`Invoice-${inv.id.slice(0,8)}.pdf downloaded successfully!`, { id: 'pdf' });
    }, 1500);
  };

  // Submit Driver / Trip Rating
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Thank you for rating driver for shipment ${ratingTripId}! Feedback recorded: ${ratingValue}/5 Stars.`);
    setIsRatingModalOpen(false);
    setRatingComment('');
    setRatingValue(5);
  };

  // Calculate pricing itemization for a quote
  const getPricingBreakdown = (q: any) => {
    if (!q) return null;
    const base = q.estimatedPrice ? parseFloat(q.estimatedPrice) * 0.4 : 10000;
    const weightFee = q.estimatedPrice ? parseFloat(q.estimatedPrice) * 0.3 : 4000;
    const distanceFee = q.estimatedPrice ? parseFloat(q.estimatedPrice) * 0.2 : 3000;
    const surcharges = q.estimatedPrice ? parseFloat(q.estimatedPrice) * 0.1 : 1000;
    
    return {
      base,
      weightFee,
      distanceFee,
      surcharges,
      insurance: base * 0.05,
      discount: (base + weightFee + distanceFee + surcharges) * -0.05,
      total: q.estimatedPrice ? parseFloat(q.estimatedPrice) : 18000
    };
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
        <p className="text-[var(--color-text-light)] text-xs uppercase font-semibold tracking-wider">Syncing dashboard statistics...</p>
      </div>
    );
  }

  const stats = dashData?.customerDashboard || {
    activeShipments: 0,
    totalShipments: 0,
    pendingQuotes: 0,
    recentShipments: [],
  };

  const quotes = quotesData?.quotes || [];
  const invoices = invoicesData?.invoices || [];

  return (
    <div ref={dashboardRef} className="space-y-8 w-full">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)]/50 pb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight flex items-center gap-2">
            Customer <span className="text-orange-500">Freight Center</span>
          </h2>
          <p className="text-[var(--color-text-light)] text-xs mt-1">Submit load details, inspect invoice payments, and track containers in real-time.</p>
        </div>
        <button
          onClick={() => {
            refetchDash();
            refetchQuotes();
            refetchInvoices();
            toast.success('Dashboard metrics refreshed!');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] hover:border-orange-500/50 text-xs font-semibold glass transition-all text-[var(--color-text)] hover:text-[var(--color-text)]"
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
              <span className="text-[10px] text-[var(--color-text-light)] uppercase font-bold tracking-wider">{stat.label}</span>
              <p className="text-xl font-black text-[var(--color-text)]">{stat.val}</p>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)]/50 rounded-xl border border-[var(--color-border)]/50">
              <stat.icon size={18} className="text-[var(--color-text-muted)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[var(--color-border)]/50">
        {(['shipments', 'quotes', 'invoices'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-[var(--color-text-light)] hover:text-[var(--color-text)]'
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
            <div className="dashboard-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-orange-500 animate-pulse" /> Active Transit Tracking
                </h3>
                <span className="badge badge-success text-[8px]">GPS Feeds Live</span>
              </div>

              {/* Dynamic shipment visual map simulator */}
              <div className="w-full h-48 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]/50 relative overflow-hidden flex items-center justify-center p-4">
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
                  <circle cx="50" cy="150" r="6" fill="#10b981" />
                  <circle cx="210" cy="85" r="8" fill="#f97316" className="animate-ping opacity-75" />
                  <circle cx="210" cy="85" r="5" fill="#f97316" />
                  <circle cx="450" cy="120" r="6" fill="#3b82f6" />
                </svg>

                <div className="absolute top-8 left-8 text-left space-y-1 z-15">
                  <p className="text-[8px] text-[var(--color-text-light)] uppercase font-black">Pickup Checkpoint</p>
                  <p className="text-xs font-bold text-[var(--color-text)]">Mombasa Port (KE)</p>
                </div>

                <div className="absolute bottom-8 right-8 text-right space-y-1 z-15">
                  <p className="text-[8px] text-[var(--color-text-light)] uppercase font-black">Final Terminal</p>
                  <p className="text-xs font-bold text-[var(--color-text)]">Kampala Depot (UG)</p>
                </div>

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[var(--color-surface)] backdrop-blur-md px-4 py-1.5 rounded-full border border-[var(--color-border)] text-[9px] text-[var(--color-text)] font-semibold tracking-wider flex items-center gap-1.5">
                  <Truck size={10} className="text-orange-500" />
                  <span>En-Route: Malaba Border Station</span>
                </div>
              </div>

              {/* Shipment Cards list */}
              <div className="space-y-4">
                {stats.recentShipments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--color-text-light)]">No active shipments in transit. Request a quote to initiate.</div>
                ) : (
                  stats.recentShipments.map((shipment: any) => (
                    <div key={shipment.id} className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[var(--color-text)]">{shipment.trackingNumber}</span>
                          <span className="badge badge-primary text-[8px] px-2 py-0.5 uppercase">{shipment.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                          <span>{shipment.pickup}</span>
                          <ArrowRight size={10} className="text-[var(--color-text-light)]" />
                          <span>{shipment.delivery}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-left sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--color-border)]/50">
                        <div className="space-y-0.5 mr-2">
                          <span className="text-[8px] text-[var(--color-text-light)] uppercase font-black">ETA Delivery</span>
                          <p className="text-xs font-bold text-[var(--color-text)]">{shipment.estimatedDelivery}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedShipment(shipment); setIsShipmentModalOpen(true); }}
                            className="btn btn-ghost border border-[var(--color-border)] text-[10px] px-3.5 py-1.5 rounded-lg font-bold"
                          >
                            Live Map
                          </button>
                          {shipment.status === 'DELIVERED' && (
                            <button
                              onClick={() => { setRatingTripId(shipment.id); setIsRatingModalOpen(true); }}
                              className="btn btn-primary text-[10px] px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Star size={10} className="fill-white" />
                              <span>Rate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="dashboard-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
              <div className="border-b border-[var(--color-border)]/50 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">Freight Quotation History</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-light)] uppercase font-bold text-[9px] tracking-wider">
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
                        <td colSpan={5} className="py-8 text-center text-[var(--color-text-light)]">No quotes generated yet. Submit the request panel on the right.</td>
                      </tr>
                    ) : (
                      quotes.map((q: any) => (
                        <tr
                          key={q.id}
                          onClick={() => { setSelectedQuote(q); setIsQuoteModalOpen(true); }}
                          className="text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all cursor-pointer"
                        >
                          <td className="py-4 font-semibold">
                            <span className="block text-xs">{q.pickupLocation}</span>
                            <span className="text-[9px] text-[var(--color-text-light)]">to {q.deliveryLocation}</span>
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
            <div className="dashboard-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
              <div className="border-b border-[var(--color-border)]/50 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest">Billing & Invoices</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-light)] uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-3">Invoice ID</th>
                      <th className="pb-3">Date Generated</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--color-text-light)]">No pending invoices found.</td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all">
                          <td className="py-4 font-mono text-[10px] text-[var(--color-text-muted)]">{inv.id.slice(0, 8)}...</td>
                          <td className="py-4">{inv.createdAt.split('T')[0]}</td>
                          <td className="py-4 text-[var(--color-text-muted)]">{inv.dueDate}</td>
                          <td className="py-4 text-right font-black text-[var(--color-text)]">
                            {convertAndFormatCurrency(inv.amount, currency)}
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {inv.status !== 'PAID' ? (
                              <button
                                onClick={() => { setSelectedInvoice(inv); setIsInvoiceModalOpen(true); }}
                                className="btn btn-primary text-[9px] px-3 py-1 rounded-lg font-bold"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="badge badge-success text-[8px] font-bold">PAID</span>
                            )}
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="btn btn-ghost border border-[var(--color-border)] text-[9px] p-1.5 rounded-lg hover:border-orange-500/50"
                              title="Download PDF confirmation"
                            >
                              <Download size={10} />
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
        </div>

        {/* Right side form panel: Request Quote */}
        <div className="lg:col-span-4 dashboard-card glass border border-[var(--color-border)]/50 p-6 rounded-2xl space-y-6">
          <div className="border-b border-[var(--color-border)]/50 pb-4">
            <h3 className="text-xs uppercase font-extrabold text-[var(--color-text)] tracking-widest flex items-center gap-1.5">
              <TrendingUp size={13} className="text-orange-500" /> Dynamic Quote Estimator
            </h3>
            <p className="text-[10px] text-[var(--color-text-light)] mt-1">Get immediate pricing estimates for international cargo routes.</p>
          </div>

          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Pickup Terminal</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--color-text-light)]" size={13} />
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
              <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Delivery Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--color-text-light)]" size={13} />
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
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Weight (Tons)</label>
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
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Container size</label>
                <select
                  value={quoteForm.containerType}
                  onChange={(e) => setQuoteForm({ ...quoteForm, containerType: e.target.value })}
                  className="input-field text-xs bg-[var(--color-surface-2)]/50 border-[var(--color-border)] text-[var(--color-text)]"
                >
                  <option value="20FT" className="bg-black">20FT Dry Van</option>
                  <option value="40FT" className="bg-black">40FT Dry Van</option>
                  <option value="40HC" className="bg-black">40FT High Cube</option>
                  <option value="REEFER" className="bg-black">Reefer Container</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Cargo Declared Value (KES)</label>
              <input
                type="number"
                value={quoteForm.declaredValue}
                onChange={(e) => setQuoteForm({ ...quoteForm, declaredValue: e.target.value })}
                placeholder="e.g. 1200000"
                className="input-field text-xs"
              />
              {formErrors.declaredValue && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.declaredValue}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quoteForm.isHazmat}
                  onChange={(e) => setQuoteForm({ ...quoteForm, isHazmat: e.target.checked })}
                  className="accent-orange-500 rounded bg-[var(--color-surface-2)]/50 border-[var(--color-border)]"
                />
                <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Hazmat Surcharge</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quoteForm.isExpress}
                  onChange={(e) => setQuoteForm({ ...quoteForm, isExpress: e.target.checked })}
                  className="accent-orange-500 rounded bg-[var(--color-surface-2)]/50 border-[var(--color-border)]"
                />
                <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Express Surcharge</span>
              </label>
            </div>

            <div>
              <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Cargo Details & Description</label>
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

      {/* ─── MODAL: QUOTE DETAIL & PRICE BREAKDOWN ─── */}
      {isQuoteModalOpen && selectedQuote && (() => {
        const pricing = getPricingBreakdown(selectedQuote);
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-lg space-y-6 relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
              >
                <X size={14} />
              </button>
              <div>
                <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-orange-500" />
                  <span>Quote Itemization Breakdown</span>
                </h3>
                <p className="text-[10px] text-[var(--color-text-light)] mt-1">Detailed transparency breakdown for route: {selectedQuote.pickupLocation} to {selectedQuote.deliveryLocation}</p>
              </div>

              <div className="space-y-3.5 border-y border-[var(--color-border)]/50 py-4 text-xs">
                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                  <span>Base Charge (Corridor Rate Card)</span>
                  <span className="font-semibold">{convertAndFormatCurrency(pricing?.base || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                  <span>Tonnage Surcharge ({selectedQuote.weightTons} Tons)</span>
                  <span className="font-semibold">{convertAndFormatCurrency(pricing?.weightFee || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                  <span>Distance Transit Rate (OSRM calculated)</span>
                  <span className="font-semibold">{convertAndFormatCurrency(pricing?.distanceFee || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                  <span>Hazmat & Priority Multipliers</span>
                  <span className="font-semibold">{convertAndFormatCurrency(pricing?.surcharges || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                  <span>Cargo Insurance Levy (Declared Value)</span>
                  <span className="font-semibold">{convertAndFormatCurrency(pricing?.insurance || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Loyalty Discount (Volume Tier)</span>
                  <span>{convertAndFormatCurrency(pricing?.discount || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 text-sm font-black text-[var(--color-text)]">
                  <span className="uppercase">Net Estimated Quote</span>
                  <span className="text-orange-500">{convertAndFormatCurrency(pricing?.total || 0, currency)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={bookSubmitting}
                  onClick={() => {
                    if (selectedQuote?.id) {
                      bookQuote({ variables: { quoteId: selectedQuote.id } });
                    }
                  }}
                  className="flex-1 btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  Accept & Book Corridor Trip
                </button>
                <button
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:text-[var(--color-text)] text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── MODAL: SHIPMENT TRACKING & GPS REPLAY ─── */}
      {isShipmentModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsShipmentModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[var(--color-border)]/50">
              <div>
                <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
                  <Activity size={14} className="text-orange-500 animate-pulse" />
                  <span>Shipment Live Tracking Panel ({selectedShipment.trackingNumber})</span>
                </h3>
                <p className="text-[10px] text-[var(--color-text-light)]">Pickup: {selectedShipment.pickup} | Destination: {selectedShipment.delivery}</p>
              </div>
              <span className="badge badge-success text-[8px] font-bold uppercase tracking-wider">Nominal Corridor Transit</span>
            </div>

            {/* Map Simulation */}
            <div className="w-full h-64 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]/50 relative overflow-hidden flex flex-col justify-between p-4">
              {/* Geofence Indicators */}
              <div className="absolute top-4 right-4 flex flex-col gap-1.5 text-right z-20">
                <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] font-bold px-2 py-0.5">
                  GEOFENCE: ENTERED MOMBASA ZONE
                </span>
                <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[7px] font-bold px-2 py-0.5">
                  GEOFENCE: EN-ROUTE TAITA
                </span>
              </div>

              {/* Route Graphics */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 240">
                <path d="M 60,180 Q 300,40 540,150" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <path d="M 60,180 Q 300,40 540,150" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />
                
                {/* Moving dot based on replay slider */}
                <circle
                  cx={60 + (480 * (replayProgress / 100))}
                  cy={180 - (100 * Math.sin((replayProgress / 100) * Math.PI))}
                  r="10"
                  fill="#f97316"
                  className="animate-ping opacity-60"
                />
                <circle
                  cx={60 + (480 * (replayProgress / 100))}
                  cy={180 - (100 * Math.sin((replayProgress / 100) * Math.PI))}
                  r="6"
                  fill="#f97316"
                />
              </svg>

              <div className="flex justify-between items-start z-10">
                <div className="space-y-1">
                  <p className="text-[7px] text-[var(--color-text-light)] uppercase font-black">Current GPS Ping</p>
                  <p className="text-[10px] text-[var(--color-text)] font-semibold">Lat: -3.3142, Lng: 38.3182 (Taita Hills Corridor)</p>
                </div>
                <div className="bg-black/60 px-3 py-1 rounded border border-[var(--color-border)] text-[9px] text-[var(--color-text)] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Route status: OK</span>
                </div>
              </div>

              <div className="flex justify-between items-end z-10 border-t border-[var(--color-border)]/50 pt-2">
                <div>
                  <span className="text-[7px] text-[var(--color-text-light)] uppercase font-black block">Origin</span>
                  <span className="text-[10px] text-[var(--color-text)] font-bold">{selectedShipment.pickup}</span>
                </div>
                <div>
                  <span className="text-[7px] text-[var(--color-text-light)] uppercase font-black block text-right">Destination</span>
                  <span className="text-[10px] text-[var(--color-text)] font-bold">{selectedShipment.delivery}</span>
                </div>
              </div>
            </div>

            {/* Replay Timeline Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--color-text-light)] font-bold uppercase text-[9px]">Location History Replay</span>
                <button
                  onClick={() => setIsReplaying(!isReplaying)}
                  className="btn btn-ghost border border-[var(--color-border)] text-[9px] px-3 py-1 rounded-lg flex items-center gap-1 font-bold"
                >
                  {isReplaying ? <Pause size={10} /> : <Play size={10} />}
                  <span>{isReplaying ? 'Pause Replay' : 'Play Timeline'}</span>
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={replayProgress}
                onChange={(e) => setReplayProgress(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-[var(--color-surface-2)] rounded-lg cursor-pointer appearance-none"
              />
              <div className="flex justify-between text-[9px] text-[var(--color-text-light)] font-semibold">
                <span>0% Journey (Mombasa)</span>
                <span>50% Mid-point (Taita Corridor)</span>
                <span>100% Complete (Kampala)</span>
              </div>
            </div>

            {/* Countdown Widget */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 grid grid-cols-4 gap-4 text-center">
              {[
                { label: 'Days', val: '01' },
                { label: 'Hours', val: '14' },
                { label: 'Minutes', val: '28' },
                { label: 'Seconds', val: '59' }
              ].map((c, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xl font-black text-[var(--color-text)]">{c.val}</p>
                  <p className="text-[8px] text-[var(--color-text-light)] uppercase font-bold tracking-wider">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INVOICE BILLING & CLICKPESA CHECKOUT ─── */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)] flex items-center gap-1.5">
                <CreditCard size={14} className="text-orange-500" />
                <span>ClickPesa Payment Gateway Checkout</span>
              </h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Invoice Ref: {selectedInvoice.id.slice(0, 12).toUpperCase()} | Due: {selectedInvoice.dueDate}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50 flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[9px]">Corridor Billing Rate</span>
              <span className="text-lg font-black text-[var(--color-text)]">{convertAndFormatCurrency(selectedInvoice.amount, currency)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MPESA', label: 'Mobile Money' },
                { id: 'STRIPE', label: 'Credit Card' },
                { id: 'BANK_TRANSFER', label: 'Bank Wire' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2.5 rounded-xl border text-[9px] uppercase font-bold tracking-wider transition-all ${
                    paymentMethod === m.id
                      ? 'border-orange-500 text-orange-500 bg-orange-500/5'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-orange-500 hover:bg-orange-500/5'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Checkout Form */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {paymentMethod === 'MPESA' && (
                <div>
                  <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">ClickPesa Connected Phone (M-Pesa / Airtel)</label>
                  <input
                    type="text"
                    value={paymentForm.phoneNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, phoneNumber: e.target.value })}
                    placeholder="e.g. +254712345678"
                    className="input-field text-xs"
                    required
                  />
                  <p className="text-[8px] text-[var(--color-text-light)] mt-1">You will receive an STK pin prompt on your device immediately.</p>
                </div>
              )}

              {paymentMethod === 'STRIPE' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Cardholder Card Number</label>
                    <input
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                      placeholder="e.g. 4111 2222 3333 4444"
                      className="input-field text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={paymentForm.cardExpiry}
                        onChange={(e) => setPaymentForm({ ...paymentForm, cardExpiry: e.target.value })}
                        placeholder="MM/YY"
                        className="input-field text-xs text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">CVC Code</label>
                      <input
                        type="password"
                        value={paymentForm.cardCvc}
                        onChange={(e) => setPaymentForm({ ...paymentForm, cardCvc: e.target.value })}
                        placeholder="123"
                        maxLength={3}
                        className="input-field text-xs text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-4 rounded-xl bg-black/30 border border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-muted)] space-y-2">
                  <p className="font-bold text-[var(--color-text)] uppercase text-[8px] text-orange-500">Bank Transfer Details</p>
                  <p>Bank: <strong>Tarxemo Standard Bank</strong></p>
                  <p>Account Number: <strong>982635-1826-19</strong></p>
                  <p>Reference: <strong>{selectedInvoice.id.slice(0, 8).toUpperCase()}</strong></p>
                  <p className="text-[9px] text-[var(--color-text-light)] pt-1">Confirm payment to receive automated validation within 2 hours.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={paymentProcessing}
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>{stkPushWaiting ? 'Waiting for STK PIN entry...' : 'Confirming Checkout...'}</span>
                  </>
                ) : (
                  <>
                    <span>Submit Payment Gateway</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DRIVER & TRIP RATING FEEDBACK ─── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRatingModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-[var(--color-text)] flex items-center gap-1">
                <Star size={14} className="text-orange-500 fill-orange-500" />
                <span>Rate Cargo Delivery & Carrier Driver</span>
              </h3>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Your feedback updates driver profiles and maintains high service parameters.</p>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-4">
              {/* Star Rating select */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRatingValue(val)}
                    className="p-1 text-[var(--color-text-light)] hover:scale-110 transition-all"
                  >
                    <Star
                      size={28}
                      className={val <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-text-light)]/30'}
                    />
                  </button>
                ))}
              </div>

              {/* Quick comment tags */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Safe Driving', 'On Time', 'Accurate Location', 'Great Communication'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setRatingComment((prev) => (prev ? prev + ', ' + tag : tag))}
                    className="px-2.5 py-1 rounded-full border border-[var(--color-border)] hover:border-orange-500/50 text-[9px] font-semibold text-[var(--color-text-muted)] hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[9px] text-[var(--color-text-light)] uppercase font-bold mb-1">Feedback Comments</label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Tell us about the delivery experience..."
                  className="input-field text-xs h-20 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider"
              >
                Submit Performance Rating
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
