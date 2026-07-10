import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  FileText, Plus, Search, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, CreditCard, Download, AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GET_CUSTOMER_INVOICES } from '../../api/queries';
import { PROCESS_PAYMENT } from '../../api/mutations';
import { convertAndFormatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  PAID:     { label: 'Paid',     color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/10 border-emerald-500/20' },
  UNPAID:   { label: 'Unpaid',   color: 'text-yellow-400',  icon: Clock,        bg: 'bg-yellow-500/10 border-yellow-500/20'  },
  OVERDUE:  { label: 'Overdue',  color: 'text-red-400',     icon: AlertCircle,  bg: 'bg-red-500/10 border-red-500/20'        },
  CANCELLED:{ label: 'Cancelled',color: 'text-gray-400',    icon: XCircle,      bg: 'bg-gray-500/10 border-gray-500/20'      },
};

const PAGE_SIZE = 8;
const PAYMENT_METHODS = [
  { id: 'MPESA',         label: 'M-Pesa',        symbol: '📱', desc: 'Mobile Money' },
  { id: 'TIGOPESA',      label: 'Tigo Pesa',     symbol: '📲', desc: 'Mobile Money TZ' },
  { id: 'AIRTEL_MONEY',  label: 'Airtel Money',  symbol: '📡', desc: 'Mobile Money' },
  { id: 'STRIPE',        label: 'Credit Card',   symbol: '💳', desc: 'Visa / Mastercard' },
  { id: 'BANK_TRANSFER', label: 'Bank Wire',     symbol: '🏦', desc: 'Direct Transfer' },
];

const CustomerInvoices: React.FC = () => {
  const { currency } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data, loading, refetch } = useQuery(GET_CUSTOMER_INVOICES);
  const invoices: any[] = data?.invoices || [];
  const [processPayment] = useMutation(PROCESS_PAYMENT);

  const filtered = invoices.filter((inv: any) => {
    const matchSearch = !search || inv.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalUnpaid = invoices.filter((i: any) => i.status === 'UNPAID').reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.amount || 0), 0);

  const handlePay = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      await processPayment({ variables: { input: { invoiceId: selectedInvoice.id, paymentMethod, phoneNumber } } });
      toast.success('Payment processed successfully!');
      setSelectedInvoice(null);
      refetch();
    } catch {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <FileText size={20} className="text-blue-400" />
          </div>
          Invoices & Payments
        </h1>
        <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">Manage your billing and payment history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length.toString(), color: 'text-[var(--color-text)]' },
          { label: 'Unpaid', value: invoices.filter((i:any)=>i.status==='UNPAID').length.toString(), color: 'text-yellow-400' },
          { label: 'Amount Unpaid', value: convertAndFormatCurrency(totalUnpaid, currency), color: 'text-red-400' },
          { label: 'Amount Paid', value: convertAndFormatCurrency(totalPaid, currency), color: 'text-emerald-400' },
        ].map(c => (
          <div key={c.label} className="glass border border-[var(--color-border)] rounded-2xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{c.label}</p>
            <p className={`text-xl font-black mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Search invoice ID..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-orange-500/50" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] px-3 py-2 focus:outline-none focus:border-orange-500/50">
          <option value="ALL">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-bold hover:border-orange-500/30">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
                  {['Invoice ID', 'Amount', 'Status', 'Due Date', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv: any) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['UNPAID'];
                  const Icon = cfg.icon;
                  return (
                    <tr key={inv.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[var(--color-text)] text-[11px]">
                        #{inv.id?.slice(0, 10).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-black text-[var(--color-text)]">
                        {convertAndFormatCurrency(inv.amount || 0, currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                          <Icon size={10} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)] font-mono">{inv.dueDate || '—'}</td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)]">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {inv.status === 'UNPAID' && (
                            <button onClick={() => setSelectedInvoice(inv)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold hover:bg-orange-500/20 transition-colors">
                              <CreditCard size={11} />Pay
                            </button>
                          )}
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-bold hover:border-orange-500/30 transition-colors">
                            <Download size={11} />PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
              <p className="text-[10px] text-[var(--color-text-muted)]">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                <CreditCard size={16} className="text-orange-500" />
                Pay Invoice
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">✕</button>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Amount Due</p>
              <p className="text-2xl font-black text-orange-500 mt-1">{convertAndFormatCurrency(selectedInvoice.amount || 0, currency)}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border text-center text-[10px] font-bold transition-all ${paymentMethod === m.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-orange-500/30'}`}>
                  <div className="text-xl mb-1">{m.symbol}</div>
                  <div>{m.label}</div>
                </button>
              ))}
            </div>
            {(paymentMethod === 'MPESA' || paymentMethod === 'TIGOPESA' || paymentMethod === 'AIRTEL_MONEY') && (
              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Phone Number</label>
                <input type="tel" placeholder="+255 7XX XXX XXX" value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
              </div>
            )}
            <button onClick={handlePay} disabled={processing}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {processing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : <><CreditCard size={16} />Confirm Payment</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoices;
