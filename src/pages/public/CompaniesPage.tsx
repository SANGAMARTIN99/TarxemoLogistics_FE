import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Building2, Search, MapPin, Star, ShieldCheck,
  ChevronLeft, ChevronRight, Eye, Phone, Mail,
  Briefcase, FilterX, ArrowLeft
} from 'lucide-react';
import { GET_COMPANIES } from '../../api/queries';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description: string;
  city: string;
  country: string;
  rating: number;
  totalDrivers: number;
  totalTrucks: number;
  isVerified: boolean;
  activeJobsCount: number;
  email?: string;
  phone?: string;
  services?: string[];
  foundedYear?: number;
}

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters State
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>('rating_desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected Detail Sidebar
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // GSAP Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // GraphQL query
  const { data, loading } = useQuery(GET_COMPANIES, {
    variables: {
      search: search || undefined,
      page,
      pageSize,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Page Load animations
  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  // Trigger stagger animation when grid items load
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.company-grid-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }
      );
    }, gridRef);
    return () => ctx.revert();
  }, [loading, data, countryFilter, verifiedFilter, sortBy]);

  // Handle slide-in animations for sidebar details drawer
  useEffect(() => {
    if (!selectedCompany) return;
    gsap.fromTo(
      sidebarRef.current,
      { x: '100%' },
      { x: '0%', duration: 0.4, ease: 'power3.out' }
    );
  }, [selectedCompany]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setCountryFilter('ALL');
    setVerifiedFilter(null);
    setSortBy('rating_desc');
    setPage(1);
    toast.success('Filters cleared successfully');
  };

  // Helper variables for data list with premium regional fallbacks
  const mockCompanies: Company[] = [
    {
      id: 'c1',
      name: 'Kenfreight East Africa Ltd',
      slug: 'kenfreight',
      description: 'Kenfreight is a premier logistics and forwarding operator offering full border handling, dry terminal logistics, customs brokerage, and container shipping corridors.',
      city: 'Mombasa',
      country: 'Kenya',
      rating: 4.8,
      totalDrivers: 240,
      totalTrucks: 180,
      isVerified: true,
      activeJobsCount: 12,
      email: 'info@kenfreight.com',
      phone: '+254 41 222 3000',
      services: ['Overland Haulage', 'Customs Clearance', 'Port Warehousing'],
      foundedYear: 1998,
    },
    {
      id: 'c2',
      name: 'Bolloré Transport & Logistics',
      slug: 'bollore',
      description: 'Global logistics operator with bespoke cargo handling infrastructure, shipping depots, and multimodal route networks across East and Southern Africa.',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      rating: 4.9,
      totalDrivers: 450,
      totalTrucks: 320,
      isVerified: true,
      activeJobsCount: 8,
      email: 'contact.tz@bollore.com',
      phone: '+255 22 211 0000',
      services: ['Customs Brokerage', 'Project Cargo', 'Cold Chain Storage'],
      foundedYear: 1985,
    },
    {
      id: 'c3',
      name: 'Spedag Interfreight Uganda',
      slug: 'spedag',
      description: 'Expert cargo transport and distribution services spanning Uganda, South Sudan, Rwanda, Burundi, and Central African corridors.',
      city: 'Kampala',
      country: 'Uganda',
      rating: 4.6,
      totalDrivers: 150,
      totalTrucks: 110,
      isVerified: true,
      activeJobsCount: 5,
      email: 'uganda@spedaginterfreight.com',
      phone: '+256 414 562 000',
      services: ['Air Freight', 'Road Transport', 'Dangerous Goods'],
      foundedYear: 2002,
    },
    {
      id: 'c4',
      name: 'Salama Logistics East Africa',
      slug: 'salama-logistics',
      description: 'Providing secure transport corridor services for high-value mining, agriculture, and retail supplies with modern GPS tracking.',
      city: 'Kigali',
      country: 'Rwanda',
      rating: 4.7,
      totalDrivers: 90,
      totalTrucks: 75,
      isVerified: false,
      activeJobsCount: 3,
      email: 'info@salamalogistics.rw',
      phone: '+250 788 300 000',
      services: ['GPS Secured Escorts', 'Border Hub Handling'],
      foundedYear: 2012,
    },
    {
      id: 'c5',
      name: 'Al-Maruf Transit Operators',
      slug: 'al-maruf',
      description: 'High-speed transit container services. Specialised routes linking Mombasa port directly to Goma, Bukavu, and eastern DRC.',
      city: 'Goma',
      country: 'DRC',
      rating: 4.4,
      totalDrivers: 110,
      totalTrucks: 85,
      isVerified: true,
      activeJobsCount: 4,
      email: 'transit@almaruf.cd',
      phone: '+243 999 123 456',
      services: ['DRC Transit Cargo', 'Heavy Lifting Operations'],
      foundedYear: 2010,
    },
    {
      id: 'c6',
      name: 'Express Cargo Transit',
      slug: 'express-cargo',
      description: 'Express overland parcel, machinery, and agricultural supply transit solutions based out of Bujumbura cargo hubs.',
      city: 'Bujumbura',
      country: 'Burundi',
      rating: 4.5,
      totalDrivers: 60,
      totalTrucks: 50,
      isVerified: false,
      activeJobsCount: 2,
      email: 'info@expresscargo.bi',
      phone: '+257 222 222 22',
      services: ['LTL Express Freight', 'Warehousing solutions'],
      foundedYear: 2016,
    }
  ];

  // Client side filtering & sorting on list
  const filteredCompanies = mockCompanies
    .filter((comp) => {
      const matchSearch = comp.name.toLowerCase().includes(search.toLowerCase()) ||
                          comp.city.toLowerCase().includes(search.toLowerCase());
      const matchCountry = countryFilter === 'ALL' || comp.country.toUpperCase() === countryFilter;
      const matchVerified = verifiedFilter === null || comp.isVerified === verifiedFilter;
      return matchSearch && matchCountry && matchVerified;
    })
    .sort((a, b) => {
      if (sortBy === 'rating_desc') return b.rating - a.rating;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'drivers_desc') return b.totalDrivers - a.totalDrivers;
      return 0;
    });

  return (
    <div className="min-h-screen text-white select-none relative pt-24 pb-20 overflow-hidden"
      style={{ background: 'var(--color-bg)' }}>
      
      {/* Background visual components */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="container-wide px-4 relative z-10">

        {/* ─── Header ─── */}
        <div ref={headerRef} className="space-y-4 mb-10 text-center max-w-2xl mx-auto">
          <span className="badge badge-primary">PARTNER NETWORKS</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Logistics <span className="gradient-text">Operators</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm">
            Browse and connect with top logistics hubs, certified transit operators, and border clearing partners operating in East & Central Africa.
          </p>
        </div>

        {/* ─── Filter Bar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 glass border border-white/5 rounded-2xl mb-8 items-center">
          
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name or city..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/40 focus:border-orange-500/50 outline-none"
            />
          </div>

          {/* Region/Country Selector */}
          <div className="lg:col-span-2">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="ALL">All Countries</option>
              <option value="KENYA">Kenya</option>
              <option value="TANZANIA">Tanzania</option>
              <option value="UGANDA">Uganda</option>
              <option value="RWANDA">Rwanda</option>
              <option value="DRC">DR Congo</option>
              <option value="BURUNDI">Burundi</option>
            </select>
          </div>

          {/* Verification toggle filter */}
          <div className="lg:col-span-2">
            <select
              value={verifiedFilter === null ? 'ALL' : verifiedFilter ? 'VERIFIED' : 'UNVERIFIED'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') setVerifiedFilter(null);
                else setVerifiedFilter(val === 'VERIFIED');
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="ALL">All Credentials</option>
              <option value="VERIFIED">Verified Operators</option>
              <option value="UNVERIFIED">Pending Verification</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="rating_desc">Highest Rated</option>
              <option value="name_asc">Name A-Z</option>
              <option value="drivers_desc">Largest Fleet Size</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="lg:col-span-2 flex gap-2">
            <button
              onClick={handleClearFilters}
              className="flex-1 btn btn-ghost border-white/10 hover:border-orange-500/40 text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <FilterX size={14} />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* ─── Grid Listing ─── */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="company-grid-card card group cursor-pointer hover:border-orange-500/40 flex flex-col justify-between"
                onClick={() => setSelectedCompany(company)}
              >
                <div>
                  {/* cover overlay */}
                  <div className="h-24 w-full bg-neutral-950/80 relative overflow-hidden rounded-t-[1.25rem]">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-neutral-900 z-10" />
                    {company.isVerified && (
                      <span className="absolute top-3 right-3 badge badge-success text-[8px] px-2 py-0.5 z-20 flex items-center gap-0.5">
                        <ShieldCheck size={10} />
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <div className="p-5 relative -mt-8 z-20">
                    <div className="w-14 h-14 rounded-xl border border-white/10 glass-dark flex items-center justify-center overflow-hidden mb-3 shadow-lg">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="object-cover w-full h-full" />
                      ) : (
                        <Building2 size={24} className="text-orange-500" />
                      )}
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base leading-tight group-hover:text-orange-400 transition-colors">
                      {company.name}
                    </h3>

                    <div className="flex items-center gap-1 mt-1.5 mb-3 text-xs text-white/50">
                      <MapPin size={11} className="text-orange-500" />
                      <span>{company.city}, {company.country}</span>
                      <span className="text-white/20 mx-1">•</span>
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white/80 font-bold">{company.rating}</span>
                    </div>

                    <p className="text-white/60 text-xs line-clamp-3 leading-relaxed mb-4">
                      {company.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-white/5 text-center text-xs">
                    <div>
                      <p className="text-white/40 text-[8px] uppercase font-bold">DRIVERS</p>
                      <p className="text-white font-extrabold">{company.totalDrivers}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[8px] uppercase font-bold">TRUCKS</p>
                      <p className="text-white font-extrabold">{company.totalTrucks}</p>
                    </div>
                  </div>

                  <button className="w-full mt-2 btn btn-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold">
                    <span>Explore Operator</span>
                    <Eye size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center glass border border-white/5 rounded-3xl space-y-4">
              <Building2 size={48} className="mx-auto text-white/20" />
              <div>
                <h3 className="text-lg font-bold text-white">No Operators Found</h3>
                <p className="text-white/50 text-xs mt-1">Try adjusting your filters or search terms.</p>
              </div>
              <button onClick={handleClearFilters} className="btn btn-primary py-2 px-6 text-xs font-semibold">
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* ─── Pagination Controls ─── */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

      </div>

      {/* ─── Slide-in Details Drawer ─── */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedCompany(null)} />
          
          <div
            ref={sidebarRef}
            className="w-full max-w-md h-full glass border-l border-white/10 relative z-10 flex flex-col justify-between p-6 md:p-8"
          >
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="inline-flex items-center gap-1 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>
                {selectedCompany.isVerified && (
                  <span className="badge badge-success text-[8px] px-2 py-0.5">
                    VERIFIED PARTNER
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="w-16 h-16 rounded-2xl border border-white/15 glass flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedCompany.logoUrl ? (
                    <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="object-cover w-full h-full" />
                  ) : (
                    <Building2 size={28} className="text-orange-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">{selectedCompany.name}</h2>
                  <p className="text-orange-500 text-xs mt-1">Founded in {selectedCompany.foundedYear || 2005}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs uppercase font-bold text-orange-500">About Company</h4>
                <p className="text-white/70 text-xs md:text-sm leading-relaxed">{selectedCompany.description}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs uppercase font-bold text-orange-500">Core Services</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedCompany.services || ['Container Haulage', 'Local Distribution', 'Customs brokerage']).map((srv) => (
                    <span key={srv} className="px-2.5 py-1 rounded-lg text-[10px] text-white/70 bg-white/5 border border-white/10">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs uppercase font-bold text-orange-500">Contact Details</h4>
                <div className="space-y-2 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-orange-500" />
                    <span>{selectedCompany.phone || '+254 700 000 000'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-orange-500" />
                    <span>{selectedCompany.email || 'contact@operator.com'}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setSelectedCompany(null)}
                className="flex-1 btn btn-ghost text-white border-white/10"
              >
                Close Drawer
              </button>
              <button
                onClick={() => {
                  toast.success(`Opening Active Jobs for ${selectedCompany.name}`);
                  setSelectedCompany(null);
                  navigate(`/jobs?company=${selectedCompany.slug}`);
                }}
                className="flex-1 btn btn-primary flex items-center justify-center gap-1.5"
              >
                <span>View Jobs</span>
                <Briefcase size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompaniesPage;
