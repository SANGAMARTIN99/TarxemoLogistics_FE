import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Package, Search, Filter, ChevronLeft, ChevronRight,
  Truck, Clock, CheckCircle2, XCircle, AlertCircle, MapPin, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { GET_CUSTOMER_DASHBOARD } from '../../api/queries';
import { convertAndFormatCurrency } from '../../utils/currency';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  IN_TRANSIT:  { label: 'In Transit',  color: 'text-blue-400',   icon: Truck,         bg: 'bg-blue-500/10 border-blue-500/20' },
  CONFIRMED:   { label: 'Confirmed',   color: 'text-emerald-400', icon: CheckCircle2,  bg: 'bg-emerald-500/10 border-emerald-500/20' },
  DELIVERED:   { label: 'Delivered',   color: 'text-orange-400',  icon: CheckCircle2,  bg: 'bg-orange-500/10 border-orange-500/20' },
  PENDING:     { label: 'Pending',     color: 'text-yellow-400',  icon: Clock,         bg: 'bg-yellow-500/10 border-yellow-500/20' },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400',     icon: XCircle,       bg: 'bg-red-500/10 border-red-500/20' },
  OPEN:        { label: 'Open',        color: 'text-purple-400',  icon: AlertCircle,   bg: 'bg-purple-500/10 border-purple-500/20' },
};

const PAGE_SIZE = 8;

const CustomerShipments: React.FC = () => {
  const { currency } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery(GET_CUSTOMER_DASHBOARD);
  const allShipments: any[] = data?.customerDashboard?.recentShipments || [];

  // Client-side filter & paginate (backend query will handle this properly once schema extended)
  const filtered = allShipments.filter((s: any) => {
    const matchesSearch = !search ||
      s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.pickup?.toLowerCase().includes(search.toLowerCase()) ||
      s.delivery?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Package size={20} className="text-orange-500" />
            </div>
            My Shipments
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Track and manage all your cargo shipments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
            {filtered.length} shipment{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by tracking number, pickup, or delivery..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] px-3 py-2 focus:outline-none focus:border-orange-500/50"
          >
            <option value="ALL">All Status</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'IN_TRANSIT', 'CONFIRMED', 'DELIVERED', 'PENDING'].map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = s === 'ALL' ? allShipments.length : allShipments.filter((sh: any) => sh.status === s).length;
          return (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                filterStatus === s
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-orange-500/30'
              }`}
            >
              {s === 'ALL' ? 'All' : (cfg?.label ?? s)} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--color-text-muted)] text-xs">Loading shipments...</p>
          </div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-16 text-center">
          <Package size={40} className="text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
          <p className="text-[var(--color-text)] font-bold">No shipments found</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
                  {['Tracking #', 'Route', 'Status', 'Est. Delivery', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((shipment: any, i: number) => {
                  const cfg = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG['PENDING'];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={shipment.id}
                      className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)]/30 transition-colors"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-orange-400 text-[11px]">
                          {shipment.trackingNumber || `TRX-${shipment.id?.slice(0,8)?.toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={11} className="text-[var(--color-text-muted)] shrink-0" />
                          <div>
                            <p className="text-[var(--color-text)] font-semibold truncate max-w-[140px]">{shipment.pickup}</p>
                            <p className="text-[var(--color-text-muted)] truncate max-w-[140px]">→ {shipment.delivery}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)] font-mono">
                        {shipment.estimatedDelivery || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/dashboard/tracking/${shipment.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase hover:bg-orange-500/20 transition-colors"
                        >
                          <Eye size={11} />
                          Track
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${
                      page === p
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-orange-500/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerShipments;
