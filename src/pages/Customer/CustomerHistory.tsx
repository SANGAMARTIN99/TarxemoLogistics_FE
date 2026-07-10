import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  History, Search, Filter, ChevronLeft, ChevronRight,
  Truck, CheckCircle2, Star, Download, Calendar, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { GET_CUSTOMER_DASHBOARD } from '../../api/queries';
import { convertAndFormatCurrency } from '../../utils/currency';

const PAGE_SIZE = 8;

const CustomerHistory: React.FC = () => {
  const { currency } = useAppStore();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

  const { data, loading } = useQuery(GET_CUSTOMER_DASHBOARD);
  const allShipments: any[] = data?.customerDashboard?.recentShipments || [];

  // Show only delivered/completed shipments
  const completed = allShipments.filter((s: any) =>
    s.status === 'DELIVERED' || s.status === 'COMPLETED'
  );

  const filtered = completed.filter((s: any) => {
    return !search ||
      s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.pickup?.toLowerCase().includes(search.toLowerCase()) ||
      s.delivery?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Metrics
  const totalSpend = completed.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
  const avgRating = 4.7;

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
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <History size={20} className="text-purple-400" />
            </div>
            Shipment History
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            All your completed cargo deliveries and records
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Deliveries', value: completed.length.toString(), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Total Spend', value: convertAndFormatCurrency(totalSpend, currency), icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Avg. Rating Given', value: `${avgRating} ★`, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'This Year', value: completed.filter((s: any) => new Date(s.createdAt).getFullYear() === 2026).length.toString(), icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map((card) => (
          <div key={card.label} className={`glass border rounded-2xl p-4 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} className={card.color} />
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{card.label}</p>
            </div>
            <p className={`text-lg font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search completed shipments..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-bold hover:border-orange-500/30 transition-all">
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-16 text-center">
          <History size={40} className="text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
          <p className="text-[var(--color-text)] font-bold">No completed shipments yet</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">Your delivery history will appear here once shipments are delivered</p>
        </div>
      ) : (
        <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
                  {['Tracking #', 'Route', 'Delivered', 'Amount', 'Rating', 'Receipt'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((shipment: any, i: number) => (
                  <tr
                    key={shipment.id}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)]/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-emerald-400 text-[11px]">
                        {shipment.trackingNumber || `TRX-${shipment.id?.slice(0, 8)?.toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-[var(--color-text-muted)] shrink-0" />
                        <div>
                          <p className="text-[var(--color-text)] font-semibold truncate max-w-[130px]">{shipment.pickup}</p>
                          <p className="text-[var(--color-text-muted)] truncate max-w-[130px]">→ {shipment.delivery}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[var(--color-text-muted)] font-mono">
                        {shipment.estimatedDelivery || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-[var(--color-text)]">
                        {shipment.amount ? convertAndFormatCurrency(shipment.amount, currency) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star
                            key={star}
                            size={11}
                            className={star <= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-text-muted)]'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-bold uppercase hover:border-orange-500/30 hover:text-orange-400 transition-colors">
                        <Download size={11} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${page === p ? 'bg-orange-500 text-white border-orange-500' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-orange-500/30'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
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

export default CustomerHistory;
