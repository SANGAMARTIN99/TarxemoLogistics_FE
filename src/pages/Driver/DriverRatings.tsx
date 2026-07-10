import React, { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import { Star, RefreshCw, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import { GET_DRIVER_DASHBOARD } from '../../api/queries';

const DriverRatings: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, refetch } = useQuery(GET_DRIVER_DASHBOARD);

  const rating = data?.driverDashboard?.rating || 5.0;
  const completedTrips = data?.driverDashboard?.completedTrips || 0;

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
              <Star size={20} className="text-orange-500" />
            </div>
            Driver Ratings & Reviews
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Monitor customer feedback, safety metrics, and operational performance
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
        {/* Rating Score Card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 text-center space-y-3">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Overall Rating</span>
          <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-[var(--color-text)]">
            <Star className="text-yellow-400 fill-yellow-400 animate-pulse" size={24} />
            <span>{rating.toFixed(1)}</span>
            <span className="text-xs text-[var(--color-text-light)]">/ 5.0</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Based on customer dispatch satisfaction surveys</p>
        </div>

        {/* Trips completed safety card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 text-center space-y-3">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Safety Violations</span>
          <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-emerald-400">
            <Award size={24} className="text-emerald-400" />
            <span>0</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Excellent compliance, no speed or delay violations</p>
        </div>

        {/* Level card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 text-center space-y-3">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Carrier Tier</span>
          <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-orange-500">
            <span>GOLD TIER</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Priority routing dispatch unlocked</p>
        </div>
      </div>

      {/* Reviews feed */}
      <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-[var(--color-text)] text-sm border-b border-[var(--color-border)] pb-3">Recent Customer Reviews</h3>
        {completedTrips === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={36} className="text-[var(--color-text-muted)] mx-auto mb-2 opacity-35" />
            <p className="text-[var(--color-text-light)] text-xs">No reviews submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { author: 'East Africa Grain Ltd', rating: 5, date: '2026-07-02', text: 'Excellent driver. Arrived ahead of estimated time at Malaba checkpoint, maintained communications throughout the journey.' },
              { author: 'Mombasa Steel Distributors', rating: 5, date: '2026-06-25', text: 'Cargo delivered safely with no seal tampering. Professional and cooperative at customs.' },
            ].map((review, idx) => (
              <div key={idx} className="p-4 bg-[var(--color-surface-2)]/30 border border-[var(--color-border)] rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[var(--color-text)]">{review.author}</span>
                  <span className="font-mono text-[var(--color-text-muted)] text-[10px]">{review.date}</span>
                </div>
                <div className="flex gap-0.5 text-yellow-400">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={11} className="fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed mt-1">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRatings;
