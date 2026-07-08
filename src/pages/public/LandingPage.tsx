import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Truck, Search, MapPin, Building2, UserCheck, ShieldCheck,
  Star, Briefcase, ChevronLeft, ChevronRight, ArrowRight,
  SlidersHorizontal, Compass, Fuel, Clock
} from 'lucide-react';
import { GET_COMPANIES, GET_JOBS } from '../../api/queries';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

gsap.registerPlugin(ScrollTrigger);

// Local interfaces for typed rendering
interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  coverImageUrl?: string;
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
    logoUrl?: string;
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
  requirements: string[];
}

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();

  // Page States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'jobs'>('companies');
  
  // Filtering & Pagination State
  const [companyPage, setCompanyPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const pageSize = 4;

  const [companySearch, setCompanySearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // GSAP Container Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const interactiveMapRef = useRef<HTMLDivElement>(null);

  // GraphQL Queries with fallback parameters
  const { data: companiesData } = useQuery(GET_COMPANIES, {
    variables: { search: companySearch || undefined, page: companyPage, pageSize },
    fetchPolicy: 'cache-and-network',
  });

  const { data: jobsData } = useQuery(GET_JOBS, {
    variables: { search: jobSearch || undefined, page: jobPage, pageSize },
    fetchPolicy: 'cache-and-network',
  });

  // GSAP Scroll Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      gsap.fromTo(
        '.hero-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.3 }
      );
      gsap.fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.5 }
      );
      gsap.fromTo(
        '.hero-ctas',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.7 }
      );
      gsap.fromTo(
        '.hero-image-card',
        { opacity: 0, x: 100 },
        { opacity: 1, x: 0, duration: 1.2, ease: 'power4.out', delay: 0.6 }
      );

      // Stats Count-up & Reveal
      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 45 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
          }
        }
      );

      // Interactive Sections
      gsap.fromTo(
        '.showcase-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top 80%',
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // Form handler for global header search
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'companies') {
      setCompanySearch(searchTerm);
      setCompanyPage(1);
    } else {
      setJobSearch(searchTerm);
      setJobPage(1);
    }
    // Smooth scroll to showcase
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Job Application / Selection Workflow
  const handleApplyJob = (job: Job) => {
    if (!isAuthenticated) {
      toast.error('Authentication Required. Please register or sign in to continue.');
      navigate('/auth?mode=register&redirect=/jobs');
    } else {
      toast.success(`Applying for ${job.title} at ${job.company.name}`);
      setSelectedJob(job);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSearchTerm('');
    setJobSearch(company.name);
    // Switch to jobs tab for this company
    setActiveTab('jobs');
    setJobPage(1);
    // Smooth scroll to listing
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Dynamic statistics fallback
  const stats = [
    { value: '45+', label: t('hero.stats.companies'), icon: Building2 },
    { value: '1,200+', label: t('hero.stats.drivers'), icon: UserCheck },
    { value: '18k+', label: t('hero.stats.trips'), icon: Truck },
    { value: '6', label: t('hero.stats.countries'), icon: ShieldCheck },
  ];

  // Helper variables for data lists to handle server loading/error gracefully
  const companiesList: Company[] = companiesData?.companies?.items || [
    {
      id: 'c1',
      name: 'Kenfreight East Africa Ltd',
      slug: 'kenfreight',
      description: 'Kenfreight is a leading logistics and freight forwarding company specializing in overland freight, customs clearance, and warehousing throughout Kenya, Uganda, Rwanda, and South Sudan.',
      city: 'Mombasa',
      country: 'Kenya',
      rating: 4.8,
      totalDrivers: 240,
      totalTrucks: 180,
      isVerified: true,
      activeJobsCount: 12,
    },
    {
      id: 'c2',
      name: 'Bolloré Transport & Logistics',
      slug: 'bollore-logistics',
      description: 'Bolloré Transport & Logistics is a global logistics giant offering tailored solutions in multimodal transport, customs brokerages, industrial logistics, and port warehousing operations.',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      rating: 4.9,
      totalDrivers: 450,
      totalTrucks: 320,
      isVerified: true,
      activeJobsCount: 8,
    },
    {
      id: 'c3',
      name: 'Spedag Interfreight',
      slug: 'spedag-interfreight',
      description: 'Providing comprehensive shipping, forwarding and supply chain solutions in East Africa. Our network reaches the remotest parts of East and Central Africa.',
      city: 'Kampala',
      country: 'Uganda',
      rating: 4.6,
      totalDrivers: 150,
      totalTrucks: 110,
      isVerified: true,
      activeJobsCount: 5,
    },
    {
      id: 'c4',
      name: 'Salama Logistics East Africa',
      slug: 'salama-logistics',
      description: 'Safe, secure, and smart logistics services. Specialized cargo and cross-border transport with focus on Rwanda, Burundi and Eastern DRC corridors.',
      city: 'Kigali',
      country: 'Rwanda',
      rating: 4.7,
      totalDrivers: 90,
      totalTrucks: 75,
      isVerified: false,
      activeJobsCount: 3,
    }
  ];

  const jobsList: Job[] = jobsData?.jobs?.items || [
    {
      id: 'j1',
      title: 'Heavy Duty Truck Driver (Cross-Border)',
      company: {
        id: 'c1',
        name: 'Kenfreight East Africa Ltd',
        city: 'Mombasa',
        country: 'Kenya',
      },
      location: 'Mombasa - Kampala Corridor',
      jobType: 'Full-Time',
      salaryMin: 85000,
      salaryMax: 120000,
      currency: 'KES',
      experienceYears: 5,
      licenseClass: 'Class A (Heavy Commercial)',
      deadline: '2026-08-15',
      status: 'URGENT',
      description: 'Seeking a highly experienced heavy duty commercial driver to operate Scania and Volvo semi-trailers along the Northern corridor (Mombasa to Kampala/Kigali). Must possess valid clean driving credentials and certificates.',
      requirements: [
        'Minimum 5 years of active cross-border heavy truck driving experience.',
        'Valid East African passport and clean driver license class A.',
        'Experience with container transport and route logs.',
        'Clean background check and reference letters.'
      ]
    },
    {
      id: 'j2',
      title: 'Fuel Tanker Professional Driver',
      company: {
        id: 'c2',
        name: 'Bolloré Transport & Logistics',
        city: 'Dar es Salaam',
        country: 'Tanzania',
      },
      location: 'Dar es Salaam - Lusaka Route',
      jobType: 'Full-Time',
      salaryMin: 950000,
      salaryMax: 1300000,
      currency: 'TZS',
      experienceYears: 4,
      licenseClass: 'Class E (Hazardous Goods)',
      deadline: '2026-07-30',
      status: 'OPEN',
      description: 'We are recruiting professional tanker drivers to safely transport fuel and chemical fluids. The operations cover Tanzania, Zambia, and Malawi. Safety adherence is non-negotiable.',
      requirements: [
        'Hazardous materials transport certification (Class E or equivalent).',
        'Demonstrated knowledge of defensive driving principles.',
        'Basic vehicle maintenance and troubleshooting skills.',
        'Fluency in Swahili and basic English.'
      ]
    },
    {
      id: 'j3',
      title: 'Reefer Container Operator & Driver',
      company: {
        id: 'c3',
        name: 'Spedag Interfreight',
        city: 'Kampala',
        country: 'Uganda',
      },
      location: 'Regional East Africa Routes',
      jobType: 'Contract',
      salaryMin: 700000,
      salaryMax: 900000,
      currency: 'UGX',
      experienceYears: 3,
      licenseClass: 'Class D (Medium & Heavy Trailer)',
      deadline: '2026-08-01',
      status: 'CLOSING',
      description: 'Operate refrigerated trucks transporting agricultural exports and pharmaceutical goods. Responsible for monitoring thermal logs and ensuring delivery schedules are met without failure.',
      requirements: [
        'Knowledge of cold chain protocol and refrigerator logs.',
        'Minimum 3 years logistics driver record.',
        'Familiar with border checkpoint protocols.'
      ]
    }
  ];

  return (
    <div className="relative overflow-hidden w-full min-h-screen text-white select-none">
      {/* ─── Background Noise Overlay ───────────────────────── */}
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none z-0" />

      {/* ─── Hero Section ───────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-16 px-4 z-10"
        style={{ background: 'var(--gradient-hero)' }}
      >
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none bg-orange-600" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none bg-orange-400" />

        <div className="container-wide grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Details */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 glass text-xs font-semibold text-orange-400 w-fit float-anim">
              <Compass size={14} className="animate-spin text-orange-500" style={{ animationDuration: '6s' }} />
              {t('hero.badge')}
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              {t('hero.title')}{' '}
              <span className="gradient-text">{t('hero.titleAccent')}</span>
            </h1>

            <p className="hero-subtitle text-white/70 text-base sm:text-lg max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Combined Search bar */}
            <form onSubmit={handleGlobalSearch} className="hero-search relative max-w-2xl w-full flex items-center gap-2 p-1.5 rounded-full glass border border-white/10 shadow-glow">
              <div className="flex-1 relative flex items-center">
                <Search size={18} className="absolute left-4 text-orange-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full bg-transparent border-0 outline-none text-white pl-11 pr-4 py-3 text-sm placeholder-white/40 focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary rounded-full px-6 py-2.5 flex items-center gap-2 text-xs uppercase tracking-wider"
              >
                <span>{t('common.search')}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="hero-ctas flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => {
                  setActiveTab('jobs');
                  showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-primary py-3 px-8 text-sm flex items-center gap-2 font-semibold"
              >
                <Briefcase size={16} />
                <span>{t('hero.ctaDriver')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('companies');
                  showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-ghost py-3 px-8 text-sm text-white border-white/20 hover:border-orange-500/50 flex items-center gap-2"
              >
                <Building2 size={16} />
                <span>{t('hero.ctaCustomer')}</span>
              </button>
            </div>
          </div>

          {/* Hero Glass Illustration Card */}
          <div className="lg:col-span-5 flex justify-center relative hero-image-card">
            <div className="relative glass border border-white/15 p-4 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden group">
              <img
                src="/assets/hero_banner.png"
                alt="Tarxemo premium logistics layout illustration"
                className="rounded-2xl object-cover w-full h-[360px] filter brightness-90 contrast-105 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none rounded-2xl" />
              
              {/* Glass status overlays */}
              <div className="absolute bottom-6 left-6 right-6 p-4 glass-dark border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
                    <Fuel size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Mombasa Route</p>
                    <p className="text-white/50 text-[10px]">Optimal Routing Active</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge-success text-[9px] px-2 py-0.5">ON SCHEDULE</span>
                  <p className="text-[10px] text-white/40 mt-1">ETA: 4h 12m</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Banner ───────────────────────────────────── */}
      <section ref={statsRef} className="py-12 bg-black/40 border-y border-white/5 relative z-10">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card flex flex-col items-center text-center p-4 glass border border-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-3">
                    <Icon size={22} className="text-orange-500" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</h3>
                  <p className="text-white/50 text-xs mt-1 uppercase tracking-wider font-semibold">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Map & Regional corridors section ───────────────── */}
      <section ref={interactiveMapRef} className="py-20 relative z-10 bg-black/10">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="badge badge-primary">INTELLIGENT FLEET CORRIDORS</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                East Africa's Connected <span className="text-orange-500">Supply Corridors</span>
              </h2>
              <p className="text-white/70 leading-relaxed text-sm">
                Tarxemo Logistics orchestrates routes across major EAC economic hubs. Real-time data streams link Kenya, Uganda, Tanzania, Rwanda, Burundi, and DRC. Drivers get access to secure digital navigation tools, transit logs, and custom border clearance guidelines.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: 'Northern Corridor', desc: 'Mombasa – Nairobi – Kampala – Kigali route', distance: '1,700 Km' },
                  { title: 'Central Corridor', desc: 'Dar es Salaam – Dodoma – Kigali – Bujumbura route', distance: '1,450 Km' },
                  { title: 'South Corridor', desc: 'Dar es Salaam – Mbeya – Lusaka connection route', distance: '1,900 Km' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 glass border border-white/10 rounded-xl hover:border-orange-500/30 transition-all">
                    <div>
                      <h4 className="text-white text-xs font-semibold">{item.title}</h4>
                      <p className="text-white/50 text-[10px]">{item.desc}</p>
                    </div>
                    <span className="text-orange-500 text-xs font-bold">{item.distance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder Graphic with pulsing routes */}
            <div className="lg:col-span-7 relative h-[420px] rounded-3xl overflow-hidden border border-white/10 glass-dark">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />
              
              {/* Regional Map graphics simulated via SVG grid */}
              <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 800 400">
                <circle cx="200" cy="180" r="4" fill="#E8580A" className="animate-ping" />
                <circle cx="200" cy="180" r="3" fill="#E8580A" />
                <text x="215" y="184" fill="#fff" fontSize="10" fontWeight="bold">Nairobi Hub</text>

                <circle cx="450" cy="220" r="4" fill="#E8580A" className="animate-ping" />
                <circle cx="450" cy="220" r="3" fill="#E8580A" />
                <text x="465" y="224" fill="#fff" fontSize="10" fontWeight="bold">Dar es Salaam</text>

                <circle cx="100" cy="250" r="4" fill="#E8580A" className="animate-ping" />
                <circle cx="100" cy="250" r="3" fill="#E8580A" />
                <text x="115" y="254" fill="#fff" fontSize="10" fontWeight="bold">Kigali Hub</text>

                {/* Pulsing connection lines */}
                <path d="M 200,180 L 100,250 M 450,220 L 100,250 M 200,180 L 450,220" stroke="#E8580A" strokeWidth="1.5" strokeDasharray="5,5" className="animate-[dash_4s_linear_infinite]" />
              </svg>
              
              {/* Live Overlay Widget */}
              <div className="absolute top-6 left-6 p-4 glass border border-white/15 rounded-2xl max-w-[280px]">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE TRAFFIC STREAM
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Real-time GPS correlation shows Mombasa customs clearance times currently operating with minor delays (15m average wait time).
                </p>
              </div>

              <div className="absolute bottom-6 right-6 p-3 glass-dark border border-white/10 rounded-xl text-right">
                <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Active Fleet Units</p>
                <p className="text-lg font-black text-white">412 Vehicles En Route</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Partners & Available Jobs Section ──────────────── */}
      <section ref={showcaseRef} className="py-20 relative z-10">
        <div className="container-wide">
          
          {/* Section Header */}
          <div className="showcase-header flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <span className="badge badge-primary mb-3">CURRENT DISPATCH BOARD</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Tarxemo <span className="text-orange-500">Dispatch Board</span>
              </h2>
              <p className="text-white/60 text-sm mt-1 max-w-xl">
                Filter and browse registered transport operators or look at live jobs currently seeking qualified regional drivers.
              </p>
            </div>

            {/* Tab Swapping Switch */}
            <div className="flex p-1 rounded-full glass border border-white/10">
              <button
                onClick={() => setActiveTab('companies')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  activeTab === 'companies'
                    ? 'btn-primary shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Building2 size={14} />
                <span>{t('companies.title')}</span>
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
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

          {/* ─── Search / Filter controls per Tab ────────────────── */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass border border-white/5 rounded-2xl">
            <div className="relative w-full md:max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <input
                type="text"
                value={activeTab === 'companies' ? companySearch : jobSearch}
                onChange={(e) => {
                  if (activeTab === 'companies') {
                    setCompanySearch(e.target.value);
                    setCompanyPage(1);
                  } else {
                    setJobSearch(e.target.value);
                    setJobPage(1);
                  }
                }}
                placeholder={
                  activeTab === 'companies'
                    ? t('companies.searchPlaceholder')
                    : t('jobs.searchPlaceholder')
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button className="btn btn-ghost text-white border-white/10 hover:border-orange-500/40 text-xs px-4 py-2.5 flex items-center gap-2">
                <SlidersHorizontal size={14} />
                <span>{t('common.filter')}</span>
              </button>
              <span className="text-[10px] text-white/40 uppercase font-semibold">
                Page {activeTab === 'companies' ? companyPage : jobPage} of 3
              </span>
            </div>
          </div>

          {/* ─── Content Render: Companies Grid ──────────────────── */}
          {activeTab === 'companies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companiesList.map((company) => (
                <div
                  key={company.id}
                  className="card group cursor-pointer hover:border-orange-500/40"
                  onClick={() => handleSelectCompany(company)}
                >
                  {/* Decorative card header */}
                  <div className="h-28 w-full bg-neutral-950 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-black/80 z-10" />
                    <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                      {company.isVerified && (
                        <span className="badge badge-success text-[8px] px-2 py-0.5 flex items-center gap-1">
                          <ShieldCheck size={10} />
                          {t('companies.verified')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 relative -mt-10 z-20">
                    <div className="w-16 h-16 rounded-xl border border-white/10 glass-dark flex items-center justify-center overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="object-cover w-full h-full" />
                      ) : (
                        <Building2 size={28} className="text-orange-500" />
                      )}
                    </div>

                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-orange-400 transition-colors">
                      {company.name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 mt-2 mb-3">
                      <MapPin size={12} className="text-orange-500" />
                      <span className="text-white/50 text-xs font-semibold">
                        {company.city}, {company.country}
                      </span>
                      <span className="text-white/20 mx-1">•</span>
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white/80 text-xs font-bold">{company.rating}</span>
                    </div>

                    <p className="text-white/60 text-xs line-clamp-3 leading-relaxed mb-4 min-h-[54px]">
                      {company.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-center">
                      <div>
                        <p className="text-white/40 text-[9px] uppercase font-bold">{t('companies.drivers')}</p>
                        <p className="text-white font-extrabold text-sm">{company.totalDrivers}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[9px] uppercase font-bold">{t('companies.trucks')}</p>
                        <p className="text-white font-extrabold text-sm">{company.totalTrucks}</p>
                      </div>
                    </div>

                    <button className="w-full mt-4 btn btn-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold">
                      <span>{t('companies.viewJobs')}</span>
                      <span className="badge badge-primary bg-white/25 text-white border-0 px-2 py-0.5 text-[9px]">
                        {company.activeJobsCount}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Content Render: Jobs List ────────────────────── */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {jobsList.map((job) => (
                <div
                  key={job.id}
                  className="glass border border-white/5 hover:border-orange-500/30 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl border border-white/10 glass flex items-center justify-center overflow-hidden flex-shrink-0">
                      {job.company.logoUrl ? (
                        <img src={job.company.logoUrl} alt={job.company.name} className="object-cover w-full h-full" />
                      ) : (
                        <Briefcase size={22} className="text-orange-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base md:text-lg hover:text-orange-500 transition-colors cursor-pointer"
                          onClick={() => handleApplyJob(job)}>
                          {job.title}
                        </h3>
                        {job.status === 'URGENT' && (
                          <span className="badge badge-danger text-[8px] px-2 py-0.5">
                            {t('jobs.status.urgent')}
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
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5 gap-4">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] text-white/40 uppercase font-bold">{t('jobs.salary')}</p>
                      <p className="text-base font-extrabold text-white">
                        {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                        <span className="text-xs font-normal text-white/40"> {t('jobs.perMonth')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="btn btn-ghost border-white/10 hover:border-orange-500/50 text-xs px-4 py-2"
                      >
                        {t('jobs.viewDetails')}
                      </button>
                      <button
                        onClick={() => handleApplyJob(job)}
                        className="btn btn-primary text-xs px-5 py-2"
                      >
                        {t('jobs.applyNow')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="mt-12 flex justify-center gap-4">
            <button
              onClick={() => {
                if (activeTab === 'companies') {
                  setCompanyPage((p) => Math.max(1, p - 1));
                } else {
                  setJobPage((p) => Math.max(1, p - 1));
                }
              }}
              disabled={activeTab === 'companies' ? companyPage === 1 : jobPage === 1}
              className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 hover:border-orange-500/50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                if (activeTab === 'companies') {
                  setCompanyPage((p) => p + 1);
                } else {
                  setJobPage((p) => p + 1);
                }
              }}
              className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-orange-500/50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ─── Detail Modals ─── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass border border-white/10 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">{selectedJob.title}</h3>
                  <p className="text-orange-500 text-sm font-semibold mt-1">{selectedJob.company.name}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 glass-dark rounded-xl text-xs">
                <div>
                  <p className="text-white/40 uppercase font-bold">{t('jobs.location')}</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-bold">{t('jobs.experience')}</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.experienceYears} Years</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-bold">{t('jobs.licenseClass')}</p>
                  <p className="text-white font-semibold mt-0.5">{selectedJob.licenseClass}</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-xs uppercase font-bold text-orange-500 mb-1">Job Description</h4>
                  <p className="text-white/70 text-xs md:text-sm leading-relaxed">{selectedJob.description}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold text-orange-500 mb-1.5">Requirements</h4>
                  <ul className="space-y-1.5">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="text-white/70 text-xs flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 btn btn-ghost text-white border-white/10"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    handleApplyJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="flex-1 btn btn-primary"
                >
                  {t('jobs.applyNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer Section ─── */}
    </div>
  );
};

export default LandingPage;
