import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Search, MapPin, Star, Building2, Shield, Users, Truck,
  Globe, Phone, Mail, ExternalLink, ArrowLeft, ArrowRight,
  Filter, ChevronRight, X, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

import { GET_COMPANIES } from '../../api/queries';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  description: string;
  city: string;
  country: string;
  rating: number;
  totalDrivers: number;
  totalTrucks: number;
  isVerified: boolean;
  planTier: string;
  activeJobsCount: number;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  foundedYear?: number;
}

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected Company Details Panel State
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Refs for animations
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBOUNCED SEARCH CORRELATION
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────────
  // APOLLO GRAPHQL QUERY
  // ─────────────────────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useQuery(GET_COMPANIES, {
    variables: {
      search: debouncedSearch,
      page: currentPage,
      pageSize: pageSize
    },
    fetchPolicy: 'cache-and-network'
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP TRANSITION ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.company-card-anim',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }, gridContainerRef);
    return () => ctx.revert();
  }, [data, loading]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MASTER DETAILED VIEW ACTION
  // ─────────────────────────────────────────────────────────────────────────────
  const handleViewDetails = (company: Company) => {
    // Populate detailed mock parameters in case GraphQL fields are partially defined
    const enrichedCompany: Company = {
      ...company,
      phone: company.phone || '+254 711 082 931',
      email: company.email || `contact@${company.slug || 'company'}.com`,
      website: company.website || `www.${company.slug || 'company'}.com`,
      foundedYear: company.foundedYear || 2012,
      services: company.services || ['Cross-Border Logistics', 'Customs Bonded Transit', 'Heavy Cargo Escorts', 'LTL & FTL Dispatches']
    };
    setSelectedCompany(enrichedCompany);
    setIsDetailDrawerOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO DATA MOCKS (Fallback if Apollo query has empty responses)
  // ─────────────────────────────────────────────────────────────────────────────
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'Kenfreight East Africa Ltd',
      slug: 'kenfreight',
      logoUrl: '',
      coverImageUrl: '',
      description: 'Customs clearance, transit warehousing and specialized heavy transport operations across East Africa.',
      city: 'Mombasa',
      country: 'Kenya',
      rating: 4.8,
      totalDrivers: 240,
      totalTrucks: 180,
      isVerified: true,
      planTier: 'PREMIUM',
      activeJobsCount: 12,
      phone: '+254 722 000 000',
      email: 'info@kenfreight.com',
      website: 'www.kenfreight.com',
      foundedYear: 1998,
      services: ['Customs Clearance', 'Warehousing', 'Heavy Haulage', 'Border Manifests']
    },
    {
      id: '2',
      name: 'Bolloré Transport & Logistics',
      slug: 'bollore',
      logoUrl: '',
      coverImageUrl: '',
      description: 'Multimodal freight corridor solutions bridging Central and Eastern African transit corridors.',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      rating: 4.9,
      totalDrivers: 450,
      totalTrucks: 320,
      isVerified: true,
      planTier: 'PREMIUM',
      activeJobsCount: 8,
      phone: '+255 22 211 0000',
      email: 'contact.tz@bollore.com',
      website: 'www.bollore-logistics.com',
      foundedYear: 1985,
      services: ['Ocean Freight', 'Cross-Border trucking', 'Supply Chain Mgmt', 'Contract Logistics']
    },
    {
      id: '3',
      name: 'Spedag Interfreight Uganda',
      slug: 'spedag',
      logoUrl: '',
      coverImageUrl: '',
      description: 'Project cargo, supply chain management, and clearing agent networks in SADC border checkpoints.',
      city: 'Kampala',
      country: 'Uganda',
      rating: 4.6,
      totalDrivers: 150,
      totalTrucks: 110,
      isVerified: true,
      planTier: 'STANDARD',
      activeJobsCount: 5,
      phone: '+256 414 562 000',
      email: 'info.ug@spedaginterfreight.com',
      website: 'www.spedaginterfreight.com',
      foundedYear: 2004,
      services: ['Freight forwarding', 'Project cargo logistics', 'Customs bonding', 'LCL consolidation']
    },
    {
      id: '4',
      name: 'Salama Logistics East Africa',
      slug: 'salama',
      logoUrl: '',
      coverImageUrl: '',
      description: 'Secure logistics services focusing on Northern corridor transit corridors and border clearances.',
      city: 'Kigali',
      country: 'Rwanda',
      rating: 4.7,
      totalDrivers: 90,
      totalTrucks: 75,
      isVerified: false,
      planTier: 'STANDARD',
      activeJobsCount: 3,
      phone: '+250 788 123 456',
      email: 'operations@salama-logistics.rw',
      website: 'www.salama-logistics.rw',
      foundedYear: 2016,
      services: ['Border Clearence', 'Express Cargo Delivery', 'Transit Warehousing']
    }
  ];

  // Raw company items filter matching UI dropdown filter
  const apiItems: Company[] = data?.companies?.items || [];
  const activeSource = apiItems.length > 0 ? apiItems : mockCompanies;

  const filteredCompanies = activeSource.filter((c) => {
    const countryMatch = selectedCountry === 'ALL' || c.country.toUpperCase() === selectedCountry.toUpperCase();
    const tierMatch = selectedTier === 'ALL' || c.planTier.toUpperCase() === selectedTier.toUpperCase();
    return countryMatch && tierMatch;
  });

  const hasNextPage = data?.companies?.hasNextPage || (currentPage * pageSize < filteredCompanies.length);

  return (
    <div ref={pageContainerRef} className="min-h-screen pt-36 md:pt-40 pb-20 px-6 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background Radial nodes */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-7xl space-y-12">
        
        {/* ─── Breadcrumbs & Header ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span className="text-orange-500 font-bold">Logistics Companies</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Logistics <span className="text-orange-500">Operators</span>
              </h1>
              <p className="text-sm text-white/60 max-w-xl">
                Browse our regional database of verified freight forwarding and transit companies operating across East and Central Africa.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Search & Advanced Filter Bar (Spacious) ─── */}
        <div className="p-6 rounded-2xl glass border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Text Input */}
          <div className="md:col-span-6 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, country, or location..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Country Selection */}
          <div className="md:col-span-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-xs text-white outline-none cursor-pointer focus:border-orange-500/50 appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Countries</option>
                <option value="KENYA" className="bg-slate-900 text-white">Kenya</option>
                <option value="TANZANIA" className="bg-slate-900 text-white">Tanzania</option>
                <option value="UGANDA" className="bg-slate-900 text-white">Uganda</option>
                <option value="RWANDA" className="bg-slate-900 text-white">Rwanda</option>
              </select>
            </div>
          </div>

          {/* Tier Selection */}
          <div className="md:col-span-3">
            <div className="relative">
              <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-xs text-white outline-none cursor-pointer focus:border-orange-500/50 appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Plan Tiers</option>
                <option value="PREMIUM" className="bg-slate-900 text-white">Premium Tier</option>
                <option value="STANDARD" className="bg-slate-900 text-white">Standard Tier</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Main Content Grid (Spacious Cards) ─── */}
        <div ref={gridContainerRef} className="space-y-10">
          {loading ? (
            /* Skeleton list */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-72 rounded-2xl glass border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center glass border border-white/5 rounded-2xl">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Sync Connection Error</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto mb-6">We could not pull the latest verified company logs from the backend database server.</p>
              <button onClick={() => refetch()} className="btn btn-outline px-6 py-2.5 text-xs flex items-center gap-2 mx-auto">
                <RefreshCw size={14} /> <span>Retry Sync</span>
              </button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center glass border border-white/5 rounded-2xl">
              <Building2 size={32} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white">No Operators Found</h3>
              <p className="text-xs text-white/40 mt-1">Try adjusting your filter settings or search query parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="company-card-anim card p-6 flex flex-col justify-between h-[340px] hover:border-orange-500/25 group transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center font-black text-xl text-orange-500 border border-orange-500/20">
                        {company.name[0]}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {company.isVerified && (
                          <span className="badge badge-success text-[8px] px-2 py-0.5 flex items-center gap-0.5">
                            <Shield size={9} /> Verified
                          </span>
                        )}
                        <span className="badge badge-primary text-[8px] px-2 py-0.5">{company.planTier}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-orange-500 transition-colors line-clamp-1">
                        {company.name}
                      </h3>
                      <p className="text-[11px] text-white/40 flex items-center gap-1 mt-1 font-semibold">
                        <MapPin size={12} className="text-orange-500" />
                        {company.city}, {company.country}
                      </p>
                    </div>

                    <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                      {company.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase">
                      <span className="flex items-center gap-1"><Truck size={12} /> {company.totalTrucks} Trucks</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {company.totalDrivers} Drivers</span>
                    </div>

                    <button
                      onClick={() => handleViewDetails(company)}
                      className="btn btn-ghost px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 font-bold group-hover:bg-orange-500 group-hover:text-white group-hover:border-transparent transition-all"
                    >
                      <span>Profile</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Pagination Controls ─── */}
          {filteredCompanies.length > 0 && (
            <div className="flex justify-between items-center pt-8 border-t border-white/5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="btn btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 border border-white/10 disabled:opacity-40"
              >
                <ArrowLeft size={14} /> <span>Previous</span>
              </button>
              <span className="text-xs font-bold text-white/60">Page {currentPage}</span>
              <button
                disabled={!hasNextPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="btn btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 border border-white/10 disabled:opacity-40"
              >
                <span>Next</span> <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MASTER-DETAIL DRAWER PANEL (Slide-in)
          ───────────────────────────────────────────────────────────────────────────── */}
      {isDetailDrawerOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          
          {/* Drawer Container */}
          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="badge badge-primary text-[8px]">{selectedCompany.planTier} Tier</span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedCompany.name}</h3>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cover/Logo Placeholder block */}
              <div className="h-32 w-full rounded-2xl bg-gradient-to-tr from-orange-500/20 to-indigo-500/10 border border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-2xl text-orange-500 border border-white/10 relative z-10">
                  {selectedCompany.name[0]}
                </div>
              </div>

              {/* Core Details */}
              <div className="space-y-4 text-xs leading-relaxed text-white/60">
                <p>{selectedCompany.description}</p>

                <div className="grid grid-cols-2 gap-4 p-4 glass-dark rounded-xl border border-white/5">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold">Country Headquarters</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{selectedCompany.city}, {selectedCompany.country}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold">Founded Year</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{selectedCompany.foundedYear}</p>
                  </div>
                </div>

                {/* Operations Counters */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <Star size={14} className="text-yellow-500 fill-yellow-500 mx-auto mb-1" />
                    <p className="text-[9px] text-white/40 uppercase font-bold">Rating</p>
                    <p className="text-xs font-black text-white mt-0.5">{selectedCompany.rating}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <Truck size={14} className="text-orange-500 mx-auto mb-1" />
                    <p className="text-[9px] text-white/40 uppercase font-bold">Trucks</p>
                    <p className="text-xs font-black text-white mt-0.5">{selectedCompany.totalTrucks}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <Users size={14} className="text-orange-500 mx-auto mb-1" />
                    <p className="text-[9px] text-white/40 uppercase font-bold">Drivers</p>
                    <p className="text-xs font-black text-white mt-0.5">{selectedCompany.totalDrivers}</p>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Services Provided</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCompany.services?.map((svc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/80">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Contact Coordinates</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-orange-500" />
                      <span>{selectedCompany.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-orange-500" />
                      <span>{selectedCompany.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-orange-500" />
                      <a href={`https://${selectedCompany.website}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5 text-orange-400">
                        {selectedCompany.website} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsDetailDrawerOpen(false);
                navigate(`/jobs?companyId=${selectedCompany.id}`);
              }}
              className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider mt-8 flex items-center justify-center gap-1.5"
            >
              <span>Browse Active Jobs</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompaniesPage;
