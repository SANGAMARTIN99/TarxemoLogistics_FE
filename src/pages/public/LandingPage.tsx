import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Truck, Building2, Briefcase, Search, ArrowRight, Star,
  MapPin, CheckCircle, Shield, Award, ChevronRight,
  X, User, FileText, Calendar, Sparkles
} from 'lucide-react';

import { GET_COMPANIES, GET_JOBS } from '../../api/queries';
import { APPLY_FOR_JOB } from '../../api/mutations';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';
import { convertAndFormatCurrency } from '../../utils/currency';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  city: string;
  country: string;
  rating: number;
  totalDrivers: number;
  totalTrucks: number;
  isVerified: boolean;
  activeJobsCount: number;
}

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logoUrl: string;
    city: string;
    country: string;
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
}

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, currency } = useAppStore();

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'companies' | 'jobs'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Job Application Form State
  const [applyForm, setApplyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseClass: '',
    experienceYears: '',
    cvUrl: 'https://tarxemo-assets.s3.amazonaws.com/cvs/temp-driver-cv.pdf', // Mock uploaded doc
    coverLetter: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────────────────────────
  // DOM REFS FOR GSAP ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBOUNCED SEARCH CORRELATION
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────────
  // APOLLO GRAPHQL DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────────
  const {
    data: companiesData,
    loading: companiesLoading,
    error: companiesError,
    refetch: refetchCompanies
  } = useQuery(GET_COMPANIES, {
    variables: { search: debouncedSearch, page: 1, pageSize: 8 },
    fetchPolicy: 'cache-and-network'
  });

  const {
    data: jobsData,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery(GET_JOBS, {
    variables: { search: debouncedSearch, page: 1, pageSize: 8, status: 'OPEN' },
    fetchPolicy: 'cache-and-network'
  });

  const [applyForJob, { loading: applySubmitLoading }] = useMutation(APPLY_FOR_JOB);

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP SCROLLTRIGGERS AND TEXT TWEENING
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const heroTl = gsap.timeline();
      heroTl.fromTo(
        '.hero-title-part',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );
      heroTl.fromTo(
        '.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );
      heroTl.fromTo(
        '.hero-search-wrapper',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' },
        '-=0.3'
      );
      heroTl.fromTo(
        '.hero-stats-badge',
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );
      heroTl.fromTo(
        '.hero-visual-card',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );

      // 2. Stats Counters Scroll Trigger
      gsap.fromTo(
        '.stat-counter-card',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%'
          }
        }
      );

      // 3. Middle Features Section Scroll Trigger
      gsap.fromTo(
        '.info-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: infoRef.current,
            start: 'top 80%'
          }
        }
      );

      // 4. Testimonials Section Scroll Trigger
      gsap.fromTo(
        '.testimonial-card',
        { scale: 0.95, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.2,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 85%'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM SANITIZATION & VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 phone validation

    if (!applyForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!applyForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
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
    if (!applyForm.licenseClass.trim()) {
      errors.licenseClass = 'Driving license class is required';
    }
    if (!applyForm.experienceYears) {
      errors.experienceYears = 'Years of experience is required';
    } else if (isNaN(Number(applyForm.experienceYears)) || Number(applyForm.experienceYears) < 0) {
      errors.experienceYears = 'Experience must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    if (!isAuthenticated) {
      toast.error('Authentication required to apply directly. Redirecting...');
      setTimeout(() => {
        navigate(`/auth?redirect=apply&jobId=${job.id}`);
      }, 1500);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedJob) return;

    try {
      const { data } = await applyForJob({
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

      if (data?.applyForJob?.success) {
        toast.success(data.applyForJob.message || 'Application submitted successfully!');
        setIsApplyModalOpen(false);
        // Reset form
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
        toast.error(data?.applyForJob?.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission.');
    }
  };

  const handleSelectCompany = (slug: string) => {
    navigate(`/companies?slug=${slug}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HARDCODED FALLBACK MOCK DATA (Only displayed if backend query returns empty/error)
  // ─────────────────────────────────────────────────────────────────────────────
  const mockCompanies: Company[] = [
    { id: '1', name: 'Kenfreight East Africa Ltd', slug: 'kenfreight', logoUrl: '', description: 'Customs clearance, transit warehousing and specialized heavy transport operations across East Africa.', city: 'Mombasa', country: 'Kenya', rating: 4.8, totalDrivers: 240, totalTrucks: 180, isVerified: true, activeJobsCount: 12 },
    { id: '2', name: 'Bolloré Transport & Logistics', slug: 'bollore', logoUrl: '', description: 'Multimodal freight corridor solutions bridging Central and Eastern African transit corridors.', city: 'Dar es Salaam', country: 'Tanzania', rating: 4.9, totalDrivers: 450, totalTrucks: 320, isVerified: true, activeJobsCount: 8 },
    { id: '3', name: 'Spedag Interfreight', slug: 'spedag', logoUrl: '', description: 'Project cargo, supply chain management, and clearing agent networks in SADC border checkpoints.', city: 'Kampala', country: 'Uganda', rating: 4.6, totalDrivers: 150, totalTrucks: 110, isVerified: true, activeJobsCount: 5 },
    { id: '4', name: 'Salama Logistics East Africa', slug: 'salama', logoUrl: '', description: 'Secure logistics services focusing on Northern corridor transit corridors and border clearances.', city: 'Kigali', country: 'Rwanda', rating: 4.7, totalDrivers: 90, totalTrucks: 75, isVerified: true, activeJobsCount: 3 }
  ];

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
      licenseClass: 'Class A, B, C, E',
      deadline: '2026-08-30',
      status: 'OPEN',
      description: 'Responsible for transporting containerized freight along the Northern Corridor from Mombasa Port to Kampala Central Terminal.',
      requirements: 'Valid driving license with Class E endorsement. Valid passport. Clear police record.'
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
      licenseClass: 'Class C, D, E',
      deadline: '2026-09-15',
      status: 'OPEN',
      description: 'Operate petroleum tankers from Dar es Salaam port to fuel terminals in Burundi and eastern DRC.',
      requirements: 'Hazmat certificate. 4+ years driving heavy petroleum vehicles. Valid East Africa passport.'
    }
  ];

  const displayCompanies: Company[] = companiesData?.companies?.items?.length
    ? companiesData.companies.items
    : mockCompanies;

  const displayJobs: Job[] = jobsData?.jobs?.items?.length
    ? jobsData.jobs.items
    : mockJobs;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background Radial Glow Nodes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] rounded-full opacity-15 blur-[160px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8580A 0%, transparent 70%)' }} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          HERO SECTION (Spacious and Animated)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-8">
            {/* Stats Badge */}
            <div className="hero-stats-badge inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-orange-500/20 glass text-xs font-semibold text-orange-400 w-fit">
              <Sparkles size={14} className="animate-pulse" />
              <span>{t('hero.badge')}</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="hero-title-part block text-white">{t('hero.title')}</span>
              <span className="hero-title-part block text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                {t('hero.titleAccent')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-white/60 text-base md:text-lg leading-relaxed max-w-2xl">
              {t('hero.subtitle')}
            </p>

            {/* Centralized Search Bar */}
            <div className="hero-search-wrapper relative max-w-2xl w-full flex items-center gap-3 p-2 rounded-full glass border border-white/10 shadow-glow">
              <Search size={20} className="ml-4 text-white/40 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full bg-transparent border-none text-white placeholder-white/40 text-sm outline-none px-2 py-1"
              />
              <button className="btn btn-primary rounded-full px-6 py-3 flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick CTAs */}
            <div className="hero-ctas flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => {
                  setActiveTab('jobs');
                  const el = document.getElementById('dispatch-showcase');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-primary py-3.5 px-8 text-sm flex items-center gap-2 font-semibold"
              >
                <span>{t('hero.ctaDriver')}</span>
                <Briefcase size={16} />
              </button>
              <Link
                to="/auth?mode=register"
                className="btn btn-ghost py-3.5 px-8 text-sm text-white border-white/20 hover:border-orange-500/50 flex items-center gap-2"
              >
                <span>{t('hero.ctaCustomer')}</span>
                <Truck size={16} />
              </Link>
            </div>
          </div>

          {/* Visual Showcase Graphic */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="hero-visual-card relative w-full max-w-[450px] aspect-[4/3] rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl p-4">
              <img
                src="/assets/hero_banner.png"
                alt="Tarxemo Transport Network"
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800';
                }}
              />
              
              {/* Overlay Glass Widgets */}
              <div className="absolute top-8 left-8 p-3 glass-dark border border-white/10 rounded-2xl max-w-[200px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-bold">Customs Corridors</p>
                  <p className="text-xs font-bold text-white">Namanga Clearance: Active</p>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 p-3.5 glass border border-white/15 rounded-2xl text-right">
                <p className="text-[9px] text-white/50 uppercase tracking-wider font-bold">Fleet Operations</p>
                <p className="text-base font-black text-white mt-0.5">850+ Cargo Runs Completed</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          STATS STRIP (Responsive Counters)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-12 border-y border-white/5 relative z-10 glass-dark bg-black/10">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '120+', label: t('hero.stats.companies'), icon: Building2 },
              { val: '2,400+', label: t('hero.stats.drivers'), icon: User },
              { val: '14,800+', label: t('hero.stats.trips'), icon: Truck },
              { val: '6', label: t('hero.stats.countries'), icon: MapPin }
            ].map((stat, i) => (
              <div key={i} className="stat-counter-card p-4 space-y-2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-1">
                  <stat.icon size={20} />
                </div>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{stat.val}</h3>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CORE MARKETING INFO
          ───────────────────────────────────────────────────────────────────────────── */}
      <section ref={infoRef} className="py-24 relative z-10 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="badge badge-primary">HOW WE OPERATE</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              One Unified Cargo Highway
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              We connect cross-border shipping corridors across Kenya, Uganda, Tanzania, Rwanda, Burundi, and DRC with real-time location metrics and automated border manifests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Verified Transport Operators', desc: 'All listed transport companies undergo rigorous vetting including vehicle roadworthiness audits and license verifications.', icon: Shield },
              { title: 'Real-time GPS Tracking', desc: 'Customers track their shipment corridors instantly with live ETAs, geofenced alerts, and route deviation checks.', icon: MapPin },
              { title: 'Direct Driver Recruitment', desc: 'Vetted drivers can apply directly to open loads and companies without intermediary agency overheads.', icon: Award }
            ].map((card, i) => (
              <div key={i} className="info-card p-8 rounded-2xl glass border border-white/5 space-y-4 hover:border-orange-500/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <card.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PARTNERS & AVAILABLE JOBS BOARD SECTION (Spacing & Overlap Fixed)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="dispatch-showcase" ref={showcaseRef} className="py-24 relative z-10 px-6">
        <div className="container mx-auto max-w-7xl">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div className="space-y-3">
              <span className="badge badge-primary">CURRENT DISPATCH BOARD</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Tarxemo <span className="text-orange-500">Dispatch Board</span>
              </h2>
              <p className="text-white/60 text-xs md:text-sm max-w-xl">
                Filter and browse registered transport operators or look at live jobs currently seeking qualified regional drivers.
              </p>
            </div>

            {/* Tab Swapping Switch (Generous margins/padding to avoid overlap) */}
            <div className="flex p-1.5 rounded-full glass border border-white/10 w-fit gap-2">
              <button
                onClick={() => {
                  setActiveTab('companies');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'companies'
                    ? 'btn-primary shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Building2 size={14} />
                <span>{t('companies.title')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('jobs');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'jobs'
                    ? 'btn-primary shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Briefcase size={14} />
                <span>{t('jobs.title')}</span>
              </button>
            </div>
          </div>

          {/* ─── Tab Content: Companies ─── */}
          {activeTab === 'companies' && (
            <div className="space-y-8">
              {companiesLoading ? (
                /* Skeleton Loader */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-64 rounded-2xl glass border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : companiesError ? (
                <div className="p-8 text-center glass border border-white/5 rounded-2xl">
                  <p className="text-sm text-red-400">Failed to sync with backend logistics servers.</p>
                  <button onClick={() => refetchCompanies()} className="btn btn-outline mt-4 px-6 py-2 text-xs">
                    Retry Synchronization
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {displayCompanies.map((company) => (
                    <div key={company.id} className="card p-6 flex flex-col justify-between h-[340px] hover:border-orange-500/20 group relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center font-black text-xl text-orange-500 border border-orange-500/20">
                            {company.name[0]}
                          </div>
                          {company.isVerified && (
                            <span className="badge badge-success text-[9px] px-2 py-0.5 flex items-center gap-1">
                              <Shield size={10} /> Verified
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg group-hover:text-orange-500 transition-colors line-clamp-1">
                            {company.name}
                          </h3>
                          <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-1 font-semibold">
                            <MapPin size={12} className="text-orange-500" />
                            {company.city}, {company.country}
                          </p>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                          {company.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star size={13} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-extrabold text-white">{company.rating}</span>
                        </div>
                        <button
                          onClick={() => handleSelectCompany(company.slug)}
                          className="btn btn-ghost px-4 py-2 rounded-xl text-xs flex items-center gap-1 font-bold group-hover:bg-orange-500 group-hover:text-white group-hover:border-transparent transition-all"
                        >
                          <span>{t('companies.viewJobs')}</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Tab Content: Jobs ─── */}
          {activeTab === 'jobs' && (
            <div className="space-y-8">
              {jobsLoading ? (
                /* Skeleton Loader */
                <div className="space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-28 rounded-2xl glass border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : jobsError ? (
                <div className="p-8 text-center glass border border-white/5 rounded-2xl">
                  <p className="text-sm text-red-400">Failed to sync open jobs directory with core DB.</p>
                  <button onClick={() => refetchJobs()} className="btn btn-outline mt-4 px-6 py-2 text-xs">
                    Retry Sync
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {displayJobs.map((job) => (
                    <div key={job.id} className="glass border border-white/5 hover:border-orange-500/25 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-lg transition-all duration-300">
                      
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
                            {convertAndFormatCurrency(job.salaryMin, currency)} - {convertAndFormatCurrency(job.salaryMax, currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleApplyClick(job)}
                          className="btn btn-primary text-xs px-6 py-2.5 rounded-xl font-bold w-fit"
                        >
                          <span>{t('jobs.applyNow')}</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TESTIMONIALS SECTION
          ───────────────────────────────────────────────────────────────────────────── */}
      <section ref={testimonialsRef} className="py-24 relative z-10 px-6 border-t border-white/5 bg-black/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="badge badge-primary">TESTIMONIALS</span>
            <h2 className="text-3xl font-bold tracking-tight">What Our Partners Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Kassim Mwita', role: 'Fleet Manager, Bolloré', quote: 'Tarxemo simplified our regional dispatch board operations. We now verify and assign transit loads within minutes instead of hours.' },
              { name: 'Sylvia Alindi', role: 'Transit Cargo Driver', quote: 'The job applications portal is completely transparent. I applied, uploaded my driver details, and received my contract transit logs in three days.' },
              { name: 'Olivier Museminali', role: 'Operations Lead, Kigali', quote: 'The real-time geofence alerts and border-crossing estimators helped us optimize the Central Corridor routes completely.' }
            ].map((t, idx) => (
              <div key={idx} className="testimonial-card p-8 rounded-2xl glass border border-white/5 space-y-4 hover:border-orange-500/15 transition-all">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">"{t.quote}"</p>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          JOB APPLICATION DRAWER MODAL
          ───────────────────────────────────────────────────────────────────────────── */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsApplyModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative glass border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden p-6 md:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-4 mb-6">
              <span className="badge badge-primary text-[8px]">JOB APPLICATION</span>
              <h3 className="text-xl font-bold text-white">{selectedJob.title}</h3>
              <p className="text-xs text-white/40">Enter your driver registration credentials below to apply.</p>
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
                    placeholder="Enter first name"
                  />
                  {formErrors.firstName && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.firstName}</span>}
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={applyForm.lastName}
                    onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
                    className={`input-field text-xs ${formErrors.lastName ? 'error' : ''}`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.lastName}</span>}
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
                {formErrors.email && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.email}</span>}
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
                {formErrors.phone && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.phone}</span>}
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
                  {formErrors.licenseClass && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.licenseClass}</span>}
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
                  {formErrors.experienceYears && <span className="text-[10px] text-red-400 mt-1 block">{formErrors.experienceYears}</span>}
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

export default LandingPage;
