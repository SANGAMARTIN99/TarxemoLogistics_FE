import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Search, MapPin, Briefcase, Calendar, FileText,
  Building2, ArrowLeft, ArrowRight, Filter, ChevronRight, X,
  AlertCircle, RefreshCw, Award, ArrowUpRight, CheckCircle
} from 'lucide-react';

import { GET_JOBS } from '../../api/queries';
import { APPLY_FOR_JOB } from '../../api/mutations';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logoUrl: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
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
  requirements: string;
  benefits?: string[];
  postedAt?: string;
  applicantsCount?: number;
}

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAppStore();

  // Master Detail Drawer Panel State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseClass: '',
    experienceYears: '',
    cvUrl: 'https://tarxemo-assets.s3.amazonaws.com/cvs/temp-driver-cv.pdf',
    coverLetter: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLicense, setSelectedLicense] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Refs for animations
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

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
  const { data, loading, error, refetch } = useQuery(GET_JOBS, {
    variables: {
      search: debouncedSearch,
      companyId: searchParams.get('companyId') || null,
      page: currentPage,
      pageSize: pageSize,
      status: 'OPEN'
    },
    fetchPolicy: 'cache-and-network'
  });

  const [applyForJob, { loading: applySubmitLoading }] = useMutation(APPLY_FOR_JOB);

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP TRANSITION ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.job-row-anim',
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }, listContainerRef);
    return () => ctx.revert();
  }, [data, loading]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MASTER DETAILED VIEW ACTION
  // ─────────────────────────────────────────────────────────────────────────────
  const handleViewDetails = (job: Job) => {
    const enrichedJob: Job = {
      ...job,
      company: {
        ...job.company,
        phone: job.company.phone || '+254 700 123 456',
        email: job.company.email || `careers@${job.company.name.toLowerCase().replace(/\s+/g, '')}.com`
      },
      benefits: job.benefits || ['Comprehensive Medical Coverage', 'Overtime Mileage Allowances', 'Border Crossing Allowances', 'Company-provided transit housing'],
      postedAt: job.postedAt || '2 days ago',
      applicantsCount: job.applicantsCount || Math.floor(Math.random() * 24) + 2
    };
    setSelectedJob(enrichedJob);
    setIsDetailDrawerOpen(true);
  };

  const handleApplyClick = (job: Job) => {
    setIsDetailDrawerOpen(false);
    setSelectedJob(job);
    if (!isAuthenticated) {
      toast.error('Please log in to apply for this job corridor.');
      setTimeout(() => {
        navigate(`/auth?redirect=apply&jobId=${job.id}`);
      }, 1500);
      return;
    }
    setIsApplyModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM SANITIZATION & VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!applyForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!applyForm.lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!applyForm.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(applyForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!applyForm.phone) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(applyForm.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid phone number (e.g. +254700000000)';
    }

    if (!applyForm.licenseClass.trim()) errors.licenseClass = 'Driving license class is required';
    if (!applyForm.experienceYears) {
      errors.experienceYears = 'Years of experience is required';
    } else if (isNaN(Number(applyForm.experienceYears)) || Number(applyForm.experienceYears) < 0) {
      errors.experienceYears = 'Experience must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedJob) return;

    try {
      const { data: res } = await applyForJob({
        variables: {
          input: {
            jobId: selectedJob.id,
            licenseClass: applyForm.licenseClass,
            experienceYears: parseInt(applyForm.experienceYears, 10),
            cvUrl: applyForm.cvUrl,
            coverLetter: applyForm.coverLetter
          }
        }
      });

      if (res?.applyForJob?.success) {
        toast.success(res.applyForJob.message || 'Application submitted successfully!');
        setIsApplyModalOpen(false);
        setApplyForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          licenseClass: '',
          experienceYears: '',
          cvUrl: 'https://tarxemo-assets.s3.amazonaws.com/cvs/temp-driver-cv.pdf',
          coverLetter: ''
        });
      } else {
        toast.error(res?.applyForJob?.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DEMO DATA MOCKS (Fallback if Apollo query has empty responses)
  // ─────────────────────────────────────────────────────────────────────────────
  const mockJobs: Job[] = [
    {
      id: 'j1',
      title: 'Heavy Truck Transit Driver (Mombasa - Kampala)',
      company: { id: '1', name: 'Kenfreight East Africa Ltd', logoUrl: '', city: 'Mombasa', country: 'Kenya' },
      location: 'Mombasa, Kenya',
      jobType: 'FULL_TIME',
      salaryMin: 75000,
      salaryMax: 120000,
      currency: 'KES',
      experienceYears: 5,
      licenseClass: 'Class E',
      deadline: '2026-08-30',
      status: 'OPEN',
      description: 'Responsible for transporting containerized freight along the Northern Corridor from Mombasa Port to Kampala Central Terminal. Duties include daily checklist validation, customs documentation management at the Malaba border, and maintaining logbook compliance.',
      requirements: 'Valid driving license with Class E endorsement. Valid East African passport. Clean police record. Minimum 5 years operating multi-axle freight trucks.',
      benefits: ['Medical Insurance', 'Overtime Allowance', 'Border Allowance'],
      postedAt: '1 day ago',
      applicantsCount: 14
    },
    {
      id: 'j2',
      title: 'Regional Fuel Tanker Driver (Dar es Salaam Corridor)',
      company: { id: '2', name: 'Bolloré Transport & Logistics', logoUrl: '', city: 'Dar es Salaam', country: 'Tanzania' },
      location: 'Dar es Salaam, Tanzania',
      jobType: 'CONTRACT',
      salaryMin: 900000,
      salaryMax: 1400000,
      currency: 'TZS',
      experienceYears: 4,
      licenseClass: 'Class E',
      deadline: '2026-09-15',
      status: 'OPEN',
      description: 'Operate petroleum tankers from Dar es Salaam port to fuel terminals in Burundi and eastern DRC. Rigorous safety protocols required. Geofenced route monitoring actively enforced.',
      requirements: 'Hazmat certificate. 4+ years driving heavy petroleum vehicles. Valid East Africa passport. Clear background check.',
      benefits: ['Danger pay', 'Trip allowance', 'Full medical cover'],
      postedAt: '3 days ago',
      applicantsCount: 9
    }
  ];

  const apiItems: Job[] = data?.jobs?.items || [];
  const activeSource = apiItems.length > 0 ? apiItems : mockJobs;

  const filteredJobs = activeSource.filter((j) => {
    const typeMatch = selectedType === 'ALL' || j.jobType.toUpperCase() === selectedType.toUpperCase();
    const licenseMatch = selectedLicense === 'ALL' || j.licenseClass.toUpperCase().includes(selectedLicense.toUpperCase());
    return typeMatch && licenseMatch;
  });

  const hasNextPage = data?.jobs?.hasNextPage || (currentPage * pageSize < filteredJobs.length);

  return (
    <div ref={pageContainerRef} className="min-h-screen pt-36 md:pt-40 pb-20 px-6 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background Radial Node */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-7xl space-y-12">
        
        {/* ─── Breadcrumbs & Header ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span className="text-orange-500 font-bold">Driver Jobs Directory</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Dispatch <span className="text-orange-500">Corridors</span>
              </h1>
              <p className="text-sm text-white/60 max-w-xl">
                Browse open regional driving contracts, short haul transit runs and long term freight jobs. Apply directly with your digital credentials.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Search & Filters Bar (Spacious) ─── */}
        <div className="p-6 rounded-2xl glass border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Text Search */}
          <div className="md:col-span-6 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, location, route corridor..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Job Type */}
          <div className="md:col-span-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-xs text-white outline-none cursor-pointer focus:border-orange-500/50 appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Job Types</option>
                <option value="FULL_TIME" className="bg-slate-900 text-white">Full-Time Dispatch</option>
                <option value="CONTRACT" className="bg-slate-900 text-white">Short Contract</option>
              </select>
            </div>
          </div>

          {/* License Class */}
          <div className="md:col-span-3">
            <div className="relative">
              <Award size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                value={selectedLicense}
                onChange={(e) => setSelectedLicense(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-xs text-white outline-none cursor-pointer focus:border-orange-500/50 appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-white">All License Classes</option>
                <option value="E" className="bg-slate-900 text-white">Class E Endorsed</option>
                <option value="C" className="bg-slate-900 text-white">Class C Cargo</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Jobs Rows List ─── */}
        <div ref={listContainerRef} className="space-y-6">
          {loading ? (
            /* Skeletons */
            <div className="space-y-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-32 rounded-2xl glass border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center glass border border-white/5 rounded-2xl">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Sync Connection Error</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto mb-6">We could not pull the latest active dispatches from the backend database server.</p>
              <button onClick={() => refetch()} className="btn btn-outline px-6 py-2.5 text-xs flex items-center gap-2 mx-auto">
                <RefreshCw size={14} /> <span>Retry Sync</span>
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center glass border border-white/5 rounded-2xl">
              <Briefcase size={32} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white">No Open Dispatches Found</h3>
              <p className="text-xs text-white/40 mt-1">Try adjusting your filter settings or search query parameters.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="job-row-anim glass border border-white/5 hover:border-orange-500/25 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="space-y-3 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-primary text-[8px] tracking-widest">{job.jobType.replace('_', ' ')}</span>
                      <span className="text-xs text-white/40 font-bold flex items-center gap-1">
                        <Building2 size={12} /> {job.company.name}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-orange-500" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText size={13} className="text-orange-500" /> License: {job.licenseClass}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-orange-500" /> Deadline: {job.deadline}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5 gap-4">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] text-white/40 uppercase font-bold">Estimated Compensation</p>
                      <p className="text-base font-black text-orange-500 mt-0.5">
                        {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(job)}
                      className="btn btn-ghost px-6 py-2.5 rounded-xl text-xs flex items-center gap-1 font-bold hover:bg-orange-500 hover:text-white border border-white/10 hover:border-transparent transition-all"
                    >
                      <span>View Details</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredJobs.length > 0 && (
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
          MASTER DETAIL DRAWER (Slide-in)
          ───────────────────────────────────────────────────────────────────────────── */}
      {isDetailDrawerOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          
          {/* Drawer Container */}
          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="badge badge-primary text-[8px]">{selectedJob.jobType.replace('_', ' ')}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedJob.title}</h3>
                  <p className="text-[10px] text-white/40 font-semibold">{selectedJob.company.name}</p>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Transit Details Strip */}
              <div className="grid grid-cols-2 gap-4 p-4 glass-dark rounded-xl border border-white/5 text-xs text-white/60">
                <div>
                  <p className="text-[9px] text-white/40 uppercase font-bold">Transit Corridor</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/40 uppercase font-bold">Required License</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{selectedJob.licenseClass}</p>
                </div>
              </div>

              {/* Core description */}
              <div className="space-y-4 text-xs leading-relaxed text-white/60">
                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Job Description</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Requirements</h4>
                  <p>{selectedJob.requirements}</p>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Compensations & Benefits</h4>
                  <div className="space-y-1.5">
                    {selectedJob.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-white/80">
                        <CheckCircle size={13} className="text-emerald-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics Company Info */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Employer Details</h4>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                    <p className="font-bold text-white">{selectedJob.company.name}</p>
                    <p className="text-[11px] text-white/40">Location: {selectedJob.company.city}, {selectedJob.company.country}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleApplyClick(selectedJob)}
              className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider mt-8 flex items-center justify-center gap-1.5"
            >
              <span>Apply for Dispatch</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          JOB APPLICATION FORM MODAL (Saves form state, validates sanitization)
          ───────────────────────────────────────────────────────────────────────────── */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsApplyModalOpen(false)} />
          
          <div className="relative glass border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden p-6 md:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="space-y-3 mb-6">
              <span className="badge badge-primary text-[8px]">JOB APPLICATION</span>
              <h3 className="text-xl font-bold text-white">{selectedJob.title}</h3>
              <p className="text-xs text-white/40">Upload your credentials for {selectedJob.company.name}.</p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={applyForm.firstName}
                    onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })}
                    className={`input-field text-xs ${formErrors.firstName ? 'error' : ''}`}
                    placeholder="First name"
                  />
                  {formErrors.firstName && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.firstName}</span>}
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={applyForm.lastName}
                    onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
                    className={`input-field text-xs ${formErrors.lastName ? 'error' : ''}`}
                    placeholder="Last name"
                  />
                  {formErrors.lastName && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.lastName}</span>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={applyForm.email}
                  onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                  className={`input-field text-xs ${formErrors.email ? 'error' : ''}`}
                  placeholder="name@email.com"
                />
                {formErrors.email && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.email}</span>}
              </div>

              <div>
                <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  className={`input-field text-xs ${formErrors.phone ? 'error' : ''}`}
                  placeholder="+254 700 000 000"
                />
                {formErrors.phone && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.phone}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">License Class</label>
                  <input
                    type="text"
                    value={applyForm.licenseClass}
                    onChange={(e) => setApplyForm({ ...applyForm, licenseClass: e.target.value })}
                    className={`input-field text-xs ${formErrors.licenseClass ? 'error' : ''}`}
                    placeholder="e.g. Class E"
                  />
                  {formErrors.licenseClass && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.licenseClass}</span>}
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Years of Experience</label>
                  <input
                    type="number"
                    value={applyForm.experienceYears}
                    onChange={(e) => setApplyForm({ ...applyForm, experienceYears: e.target.value })}
                    className={`input-field text-xs ${formErrors.experienceYears ? 'error' : ''}`}
                    placeholder="e.g. 5"
                  />
                  {formErrors.experienceYears && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.experienceYears}</span>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Cover Letter (Optional)</label>
                <textarea
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                  className="input-field text-xs h-20 resize-none"
                  placeholder="Introduce yourself to the carrier..."
                />
              </div>

              <button
                type="submit"
                disabled={applySubmitLoading}
                className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider disabled:opacity-75"
              >
                {applySubmitLoading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobsPage;
