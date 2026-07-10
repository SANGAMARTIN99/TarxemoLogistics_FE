import React, { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import { Wallet, Award, TrendingUp, RefreshCw, Landmark, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { convertAndFormatCurrency } from '../../utils/currency';
import { GET_DRIVER_DASHBOARD } from '../../api/queries';

const DriverEarnings: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currency } = useAppStore();
  const { data, loading, refetch } = useQuery(GET_DRIVER_DASHBOARD);

  const earnings = data?.driverDashboard?.earnings || { thisMonth: 0, lastMonth: 0 };
  const pastTrips = data?.driverDashboard?.past_trips || [];

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Wallet size={20} className="text-orange-500" />
            </div>
            Earnings & Payouts
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Review accumulated transit rates, bonuses, and banking dispatches
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/30 glass text-[var(--color-text-muted)] transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Stats Card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">This Month's Earnings</span>
            <h2 className="text-3xl font-black text-emerald-400">
              {convertAndFormatCurrency(earnings.thisMonth, currency)}
            </h2>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Award size={14} className="text-orange-500" />
            <span>Based on {pastTrips.length} completed transit routes.</span>
          </div>
          <div className="absolute right-4 top-4 opacity-5 text-orange-500">
            <Wallet size={120} />
          </div>
        </div>

        {/* Bank Card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Payout Destination</span>
            <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2 text-sm mt-1">
              <Landmark size={14} className="text-orange-500" /> ClickPesa Connected Wallet
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Instant settlements to bank or mobile money</p>
          </div>
          <button className="w-full mt-6 py-2 px-4 border border-[var(--color-border)] hover:border-orange-500/30 hover:bg-orange-500/5 rounded-xl text-xs font-bold text-[var(--color-text)] flex items-center justify-center gap-1.5 transition-all">
            <span>Manage Wallet</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Performance summary */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Payout Status</span>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[var(--color-text)]">Auto-disbursement Active</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Payments settle every Friday at 17:00 EAT</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] mt-4">
            <TrendingUp size={13} className="text-orange-500" />
            <span>Transit fees are guaranteed upon successful delivery check-in.</span>
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-[var(--color-text)] text-sm border-b border-[var(--color-border)] pb-3">Earning Rate History</h3>
        {pastTrips.length === 0 ? (
          <p className="text-[var(--color-text-light)] text-xs py-4 text-center">No payouts recorded this month.</p>
        ) : (
          <div className="space-y-3">
            {pastTrips.map((row: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3.5 bg-[var(--color-surface-2)]/30 border border-[var(--color-border)] rounded-xl hover:border-orange-500/25 transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--color-text)]">{row.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{row.pickup} → {row.delivery}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-400">
                    + {convertAndFormatCurrency(row.estimatedPrice || 45000, currency)}
                  </p>
                  <span className="badge badge-success text-[7px] font-bold uppercase mt-1">SETTLED</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverEarnings;
