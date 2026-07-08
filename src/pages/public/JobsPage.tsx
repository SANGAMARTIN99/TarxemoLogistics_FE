import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Briefcase, Search, MapPin, Clock, ChevronLeft, ChevronRight,
  Building2, FilterX, Award, Send
} from 'lucide-react';
import { GET_JOBS } from '../../api/queries';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logoUrl?: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
  };
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  experienceYears: number;
  licenseClass: string;
  deadline: string;
  status: string;
  description: string;
  requirements: string[];
  benefits?: string[];
}

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppStore();

  // Parse URL queries (e.g. ?company=kenfreight)
  const queryParams = new URLSearchParams(location.search);

  // Filters State
  const [search, setSearch] = useState(queryParams.get('company') || '');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [jobTypeFilter, setJobTypeFilter] = useState('ALL');
  const [licenseFilter, setLicenseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Selected Detail Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // GSAP Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // GraphQL query
  const { data, loading } = useQuery(GET_JOBS, {
    variables: {
      search: search || undefined,
      page,
      pageSize,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Page Intro Reveal
  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  // Stagger animate job list items when data changes
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.job-list-item-card',
        { opacity: 0, x: -25 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out' }
      );
    }, listRef);
    return () => ctx.revert();
  }, [loading, data, locationFilter, jobTypeFilter, licenseFilter, sortBy]);

  // Modal scale animation
  useEffect(() => {
    if (!selectedJob) return;
    gsap.fromTo(
      modalRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.2)' }
    );
  }, [selectedJob]);

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setLocationFilter('ALL');
    setJobTypeFilter('ALL');
    setLicenseFilter('ALL');
    setSortBy('newest');
    setPage(1);
    toast.success('Filters reset successfully');
  };

  // Action Apply workflow
  const handleApplyJob = (job: Job) => {
    if (!isAuthenticated) {
      toast.error('Authentication Required. Redirecting to register form...');
      navigate('/auth?mode=register&redirect=/jobs');
    } else {
      toast.success(`Application submitted successfully for ${job.title}!`);
      setSelectedJob(null);
    }
  };

  // Helper mock data matching queries schema
  const mockJobs: Job[] = [
    {
      id: 'j1',
      title: 'Heavy Duty Truck Driver (Cross-Border)',
      company: {
        id: 'c1',
        name: 'Kenfreight East Africa Ltd',
        city: 'Mombasa',
        country: 'Kenya',
        email: 'careers@kenfreight.com',
        phone: '+254 41 222 3000'
      },
      location: 'Mombasa - Kampala Route',
      jobType: 'Full-Time',
      salaryMin: 85000,
      salaryMax: 120000,
      currency: 'KES',
      experienceYears: 5,
      licenseClass: 'Class A',
      deadline: '2026-08-15',
      status: 'URGENT',
      description: 'We are seeking a reliable, heavy-duty commercial truck driver to manage cross-border deliveries between Kenya and Uganda. Responsible for cargo verification, security, and basic mechanical inspections.',
      requirements: [
        'Valid East African driving license class A.',
        'Over 5 years of commercial truck operations.',
        'Clean background check and record log.',
        'Defensive driving certification.'
      ],
      benefits: ['Medical cover', 'Overtime allowances', 'Travel stipend']
    },
    {
      id: 'j2',
      title: 'Fuel Tanker Driver Specialist',
      company: {
        id: 'c2',
        name: 'Bolloré Transport & Logistics',
        city: 'Dar es Salaam',
        country: 'Tanzania',
        email: 'jobs.tz@bollore.com',
        phone: '+255 22 211 0000'
      },
      location: 'Dar es Salaam - Lusaka Route',
      jobType: 'Full-Time',
      salaryMin: 950000,
      salaryMax: 1300000,
      currency: 'TZS',
      experienceYears: 4,
      licenseClass: 'Class G (Tanker)',
      deadline: '2026-07-30',
      status: 'OPEN',
      description: 'Seeking professional tanker drivers to safely transport fuel across international corridors. Strict adherence to occupational hazard control and speed limits required.',
      requirements: [
        'Class G tanker endorsement.',
        'First Aid and hazardous material response certified.',
        'Familiarity with SADC customs corridors.',
        'Valid passport.'
      ],
      benefits: ['Annual bonus', 'Accident cover plan', 'Hazard allowances']
    },
    {
      id: 'j3',
      title: 'Refrigerated Truck Operator',
      company: {
        id: 'c3',
        name: 'Spedag Interfreight Uganda',
        city: 'Kampala',
        country: 'Uganda',
        email: 'jobs@spedag.ug',
        phone: '+256 414 562 000'
      },
      location: 'Kampala - Gulu Route',
      jobType: 'Contract',
      salaryMin: 700000,
      salaryMax: 900000,
      currency: 'UGX',
      experienceYears: 3,
      licenseClass: 'Class B',
      deadline: '2026-08-01',
      status: 'CLOSING',
      description: 'Manage refrigerated transit corridors transporting agricultural goods. Monitor and log temperature readouts to guarantee zero supply chain decay.',
      requirements: [
        'Knowledge of cold chain safety protocol.',
        'Clean driving record for at least 3 years.',
        'Basic mechanic competencies.'
      ],
      benefits: ['Overnight allowance', 'Technical support backup']
    },
    {
      id: 'j4',
      title: 'Regional Delivery Van Driver',
      company: {
        id: 'c4',
        name: 'Salama Logistics East Africa',
        city: 'Kigali',
        country: 'Rwanda',
        email: 'info@salamalogistics.rw',
        phone: '+250 788 300 000'
      },
      location: 'Kigali - Gisenyi Corridor',
      jobType: 'Full-Time',
      salaryMin: 450000,
      salaryMax: 600000,
      currency: 'RWF',
      experienceYears: 2,
      licenseClass: 'Class B',
      deadline: '2026-08-20',
      status: 'OPEN',
      description: 'Recruiting a professional light commercial van driver to operate regional logistics distribution paths. Quick turnaround and high route density.',
      requirements: [
        'Valid class B driving license.',
        'Expert familiarity with Rwanda regional road maps.',
        'Good customer service etiquette.'
      ],
      benefits: ['Mobile communication package', 'Performance incentives']
    }
  ];

  // Client side filtering
  const filteredJobs = mockJobs.filter((job) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                        job.company.name.toLowerCase().includes(search.toLowerCase());
    const matchLocation = locationFilter === 'ALL' || job.location.includes(locationFilter);
    const matchType = jobTypeFilter === 'ALL' || job.jobType.toUpperCase() === jobTypeFilter;
    const matchLicense = licenseFilter === 'ALL' || job.licenseClass.includes(licenseFilter);
    return matchSearch && matchLocation && matchType && matchLicense;
  });

  return (
    <div className="min-h-screen text-white select-none relative pt-24 pb-20 overflow-hidden"
      style={{ background: 'var(--color-bg)' }}>
      
      {/* Visual background components */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="container-wide px-4 relative z-10">

        {/* ─── Header ─── */}
        <div ref={headerRef} className="space-y-4 mb-10 text-center max-w-2xl mx-auto">
          <span className="badge badge-primary">DISPATCH JOBS BOARD</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Driver <span className="gradient-text">Opportunities</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm">
            Discover verified heavy transport, tanker, delivery van, and regional logistics jobs seeking skilled operators across East & Central Africa.
          </p>
        </div>

        {/* ─── Filter Bar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 glass border border-white/5 rounded-2xl mb-8 items-center">
          
          {/* Search Input */}
          <div className="lg:col-span-3 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or keyword..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/40 focus:border-orange-500/50 outline-none"
            />
          </div>

          {/* Location */}
          <div className="lg:col-span-2">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="ALL">All Routes</option>
              <option value="Mombasa">Mombasa Routes</option>
              <option value="Dar es Salaam">Dar es Salaam Routes</option>
              <option value="Kigali">Kigali Routes</option>
              <option value="Kampala">Kampala Routes</option>
            </select>
          </div>

          {/* Job Type */}
          <div className="lg:col-span-2">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="ALL">All Types</option>
              <option value="FULL-TIME">Full-Time</option>
              <option value="CONTRACT">Contract Basis</option>
            </select>
          </div>

          {/* License Class */}
          <div className="lg:col-span-2">
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="ALL">All Licenses</option>
              <option value="Class A">Class A (Heavy Duty)</option>
              <option value="Class B">Class B (Medium van)</option>
              <option value="Class G">Class G (Tanker specialist)</option>
            </select>
          </div>

          {/* Sort */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="salary_desc">Highest Pay</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1">
            <button
              onClick={handleClearFilters}
              className="w-full btn btn-ghost border-white/10 hover:border-orange-500/40 text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <FilterX size={14} />
            </button>
          </div>

        </div>

        {/* ─── Jobs list render ─── */}
        <div ref={listRef} className="space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="job-list-item-card glass border border-white/5 hover:border-orange-500/30 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl border border-white/10 glass flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Building2 size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white text-base md:text-lg hover:text-orange-500 transition-colors cursor-pointer"
                        onClick={() => setSelectedJob(job)}>
                        {job.title}
                      </h3>
                      {job.status === 'URGENT' && (
                        <span className="badge badge-danger text-[8px] px-2 py-0.5 animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-white/50 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-orange-500" />
                        {job.company.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-orange-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-orange-500" />
                        {job.jobType}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Award size={13} className="text-orange-500" />
                        {job.experienceYears} Years Exp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5 gap-4">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] text-white/40 uppercase font-bold">Salary Range</p>
                    <p className="text-base font-extrabold text-white">
                      {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                      <span className="text-xs font-normal text-white/40"> /m</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="btn btn-ghost border-white/10 hover:border-orange-500/50 text-xs px-4 py-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleApplyJob(job)}
                      className="btn btn-primary text-xs px-5 py-2"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center glass border border-white/5 rounded-3xl space-y-4">
              <Briefcase size={48} className="mx-auto text-white/20 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-white">No Jobs Available</h3>
                <p className="text-white/50 text-xs mt-1">Try resetting filters to show regional openings.</p>
              </div>
              <button onClick={handleClearFilters} className="btn btn-primary py-2 px-6 text-xs font-semibold">
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* ─── Pagination ─── */}
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

      {/* ─── Details Modal ─── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div
            ref={modalRef}
            className="glass border border-white/10 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{selectedJob.title}</h3>
                    <p className="text-orange-500 text-xs font-semibold mt-0.5">{selectedJob.company.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 glass-dark rounded-xl text-[10px] sm:text-xs">
                <div>
                  <p className="text-white/40 uppercase font-bold">Route Location</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-bold">Type</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.jobType}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-bold">Experience</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.experienceYears} Years</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-bold">License Class</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.licenseClass}</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 text-xs md:text-sm">
                <div>
                  <h4 className="text-xs uppercase font-bold text-orange-500 mb-1">Description</h4>
                  <p className="text-white/70 leading-relaxed">{selectedJob.description}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold text-orange-500 mb-1.5">Key Requirements</h4>
                  <ul className="space-y-1.5">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="text-white/70 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedJob.benefits && (
                  <div>
                    <h4 className="text-xs uppercase font-bold text-orange-500 mb-1.5">Benefits & Perks</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((ben, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          {ben}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 btn btn-ghost text-white border-white/10"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApplyJob(selectedJob)}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobsPage;
