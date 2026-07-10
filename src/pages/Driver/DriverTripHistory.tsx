import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import { History, Search, ArrowRight, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { GET_DRIVER_DASHBOARD } from '../../api/queries';

const DriverTripHistory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, refetch } = useQuery(GET_DRIVER_DASHBOARD);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const pastTrips = data?.driverDashboard?.past_trips || [];

  const filteredTrips = pastTrips.filter((t: any) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.delivery.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <History size={20} className="text-orange-500" />
            </div>
            Trip History
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Comprehensive log of all completed cargo transits and delivery receipts
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/30 glass text-[var(--color-text-muted)] transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass border border-[var(--color-border)] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-light)]" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by manifest title, pickup, or delivery checkpoint..."
            className="input-field pl-9 text-xs w-full bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
          />
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider">
          Total Logs: <span className="text-orange-500">{filteredTrips.length} completed</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedTrips.length === 0 ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-16 text-center">
          <History size={48} className="text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-[var(--color-text)]">No Completed Trips Found</h3>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">
            There are no past logs matching your search parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase font-bold text-[9px] tracking-wider bg-[var(--color-surface-2)]/30">
                    <th className="p-4">Trip Manifest</th>
                    <th className="p-4">Route Terminal</th>
                    <th className="p-4">Delivery Date</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/55">
                  {paginatedTrips.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-[var(--color-surface-2)]/20 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                            <FileText size={13} className="text-orange-500" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--color-text)]">{trip.title}</p>
                            <span className="text-[9px] text-[var(--color-text-muted)] font-mono">ID: {trip.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-[var(--color-text)]/90 font-semibold">
                          <span>{trip.pickup}</span>
                          <ArrowRight size={10} className="text-[var(--color-text-light)]" />
                          <span>{trip.delivery}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[var(--color-text-muted)]">
                        {trip.date}
                      </td>
                      <td className="p-4 text-right">
                        <span className="badge badge-success text-[8px] uppercase tracking-wider font-bold">
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                  className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-2)] transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                  className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-2)] transition-all"
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

export default DriverTripHistory;
