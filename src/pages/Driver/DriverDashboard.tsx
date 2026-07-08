import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Truck, Shield, Star, Award, Clock, MapPin, Send,
  CheckCircle2, AlertTriangle, Play, Pause, RefreshCw,
  ClipboardList, Briefcase, ChevronRight, Check, X, FileText, CheckCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { convertAndFormatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

// ─── GraphQL Queries & Mutations ─────────────────────────────────────────────
import { gql } from '@apollo/client';

const GET_DRIVER_DASHBOARD = gql`
  query GetDriverDashboard {
    driverDashboard {
      availableJobs
      completedTrips
      rating
      earnings {
        thisMonth
        currency
      }
      upcomingTrips {
        id
        title
        pickup
        delivery
        date
        status
      }
    }
  }
`;

const LOG_LOCATION = gql`
  mutation LogLocation($input: LogLocationInput!) {
    logLocation(input: $input) {
      success
      message
      locationLog {
        id
        latitude
        longitude
        notes
        timestamp
      }
    }
  }
`;

const UPDATE_DRIVER_PROFILE = gql`
  mutation UpdateDriverProfile($input: DriverProfileInput!) {
    updateDriverProfile(input: $input) {
      success
      message
      profile {
        licenseClass
        licenseNumber
        yearsExperience
        phoneNumber
      }
    }
  }
`;

const GET_OPEN_JOBS = gql`
  query GetOpenJobs($search: String, $page: Int, $pageSize: Int) {
    jobs(search: $search, page: $page, pageSize: $pageSize, status: "OPEN") {
      items {
        id
        title
        location
        jobType
        salaryMin
        salaryMax
        currency
        licenseClass
        deadline
        description
        company {
          name
        }
      }
    }
  }
`;

const APPLY_FOR_JOB = gql`
  mutation ApplyForJob($input: JobApplicationInput!) {
    applyForJob(input: $input) {
      success
      message
    }
  }
`;

const DriverDashboard: React.FC = () => {
  const { currency } = useAppStore();
  const driverContainerRef = useRef<HTMLDivElement>(null);

  // Tabs: 'duty', 'jobs', 'profile', 'earnings'
  const [activeTab, setActiveTab] = useState<'duty' | 'jobs' | 'profile' | 'earnings'>('duty');

  // Queries
  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useQuery(GET_DRIVER_DASHBOARD);
  const { data: openJobsData, refetch: refetchJobs } = useQuery(GET_OPEN_JOBS, {
    variables: { search: '', page: 1, pageSize: 15 }
  });

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    licenseClass: 'CLASS A',
    licenseNumber: 'DL-98273615',
    yearsExperience: '6',
    phoneNumber: '+254700000000',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProfileEditing, setIsProfileEditing] = useState(false);

  // Mutations
  const [updateProfile, { loading: profileSubmitting }] = useMutation(UPDATE_DRIVER_PROFILE, {
    onCompleted: (res) => {
      if (res.updateDriverProfile?.success) {
        toast.success(res.updateDriverProfile.message);
        setIsProfileEditing(false);
        refetchDash();
      } else {
        toast.error(res.updateDriverProfile?.message || 'Failed to update credentials.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while updating driver profile.');
    }
  });

  const [logLocation] = useMutation(LOG_LOCATION);
  const [applyForJob] = useMutation(APPLY_FOR_JOB);

  // Simulated GPS Duty Loop
  const [isDutyActive, setIsDutyActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: -1.2921, lng: 36.8219 }); // Nairobi Default
  const [gpsLogCount, setGpsLogCount] = useState(0);

  // Custom log modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [customLogText, setCustomLogText] = useState('');
  const [customLogType, setCustomLogType] = useState('CUSTOMS');

  // Selected job details modal
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Trigger GPS coordinate drifting and dispatch location logs dynamically
  useEffect(() => {
    let interval: any;
    if (isDutyActive) {
      toast.success('Duty active! Real-time GPS coordinates broadcasting started.');
      interval = setInterval(() => {
        // Drift coordinates slightly towards Kampala
        setCurrentCoords((prev) => {
          const nextLat = prev.lat + (Math.random() - 0.4) * 0.01;
          const nextLng = prev.lng + (Math.random() - 0.3) * 0.01;

          // Dispatch mutation update to backend
          logLocation({
            variables: {
              input: {
                tripId: '1', // Mock Active Trip ID
                latitude: parseFloat(nextLat.toFixed(5)),
                longitude: parseFloat(nextLng.toFixed(5)),
                notes: `Automated telemetry ping. Index: ${gpsLogCount + 1}.`,
              }
            }
          }).catch(() => {});

          setGpsLogCount((c) => c + 1);
          return { lat: nextLat, lng: nextLng };
        });
      }, 12000); // Trigger every 12 seconds
    } else {
      if (gpsLogCount > 0) {
        toast.error('Duty paused. GPS coordinates dispatch suspended.');
      }
    }

    return () => clearInterval(interval);
  }, [isDutyActive]);

  // Entrance animations
  useEffect(() => {
    if (driverContainerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.driver-widget',
          { opacity: 0, y: 25, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
        );
      }, driverContainerRef.current);
      return () => ctx.revert();
    }
  }, [dashLoading]);

  // Form validations
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    if (!profileForm.licenseClass.trim()) {
      errors.licenseClass = 'License designation is required.';
    }

    if (!profileForm.licenseNumber.trim()) {
      errors.licenseNumber = 'Permit credential number is required.';
    } else if (!/^[A-Z0-9-]{5,20}$/i.test(profileForm.licenseNumber)) {
      errors.licenseNumber = 'Invalid license format. Must be alphanumeric (5-20 characters).';
    }

    const exp = parseInt(profileForm.yearsExperience);
    if (!profileForm.yearsExperience) {
      errors.yearsExperience = 'Years of experience is required.';
    } else if (isNaN(exp) || exp < 0 || exp > 50) {
      errors.yearsExperience = 'Experience must be between 0 and 50 years.';
    }

    if (!profileForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone connection is required.';
    } else if (!/^\+?[0-9\s-]{9,15}$/.test(profileForm.phoneNumber)) {
      errors.phoneNumber = 'Invalid contact phone format.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    updateProfile({
      variables: {
        input: {
          licenseClass: profileForm.licenseClass.trim().toUpperCase(),
          licenseNumber: profileForm.licenseNumber.trim(),
          yearsExperience: parseInt(profileForm.yearsExperience),
          phoneNumber: profileForm.phoneNumber.trim(),
        }
      }
    });
  };

  // Submit manual checkpoint check-in report
  const handleCustomCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogText.trim()) return;

    logLocation({
      variables: {
        input: {
          tripId: '1',
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          notes: `[CHECK-IN: ${customLogType}] ${customLogText.trim()}`,
        }
      }
    }).then(() => {
      toast.success(`Check-in reported: ${customLogType} details logged.`);
      setCustomLogText('');
      setIsLogModalOpen(false);
      setGpsLogCount((c) => c + 1);
    }).catch((err) => {
      toast.error(err.message || 'Check-in log failed.');
    });
  };

  // Apply for carrier job
  const handleJobApplication = (jobId: string) => {
    applyForJob({
      variables: {
        input: {
          jobId: jobId,
          licenseClass: profileForm.licenseClass,
          experienceYears: parseInt(profileForm.yearsExperience),
          coverLetter: 'Applying for route cargo transport mission on the corridor.'
        }
      }
    }).then((res: any) => {
      toast.success('Mission application submitted to carrier operations manager!');
      setSelectedJob(null);
      refetchJobs();
      refetchDash();
    }).catch((err) => {
      toast.error(err.message || 'Application failed.');
    });
  };

  if (dashLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw size={24} className="text-orange-500 animate-spin" />
        <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Syncing driver telemetry...</p>
      </div>
    );
  }

  const dashboardData = dashData?.driverDashboard || {
    availableJobs: 8,
    completedTrips: 18,
    rating: 4.88,
    earnings: { thisMonth: 145000, currency: 'KES' },
    upcomingTrips: [
      { id: '1', title: 'Corridor Load #1827', pickup: 'Mombasa Port Terminal 4', delivery: 'Kampala Depot Y', date: '2026-07-09', status: 'IN_TRANSIT' }
    ],
  };

  const openJobs = openJobsData?.jobs?.items || [];

  return (
    <div ref={driverContainerRef} className="space-y-8 w-full">
      {/* Driver Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Driver <span className="text-orange-500">Dispatch Portal</span>
          </h2>
          <p className="text-white/40 text-xs mt-1">Simulate live corridors, update licenses, and review trip payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDutyActive(!isDutyActive)}
            className={`btn px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isDutyActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isDutyActive ? (
              <>
                <Pause size={12} />
                <span>Go Off-Duty</span>
              </>
            ) : (
              <>
                <Play size={12} />
                <span>Go On-Duty</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              refetchDash();
              refetchJobs();
              toast.success('Telemetry and assigned manifests re-synced!');
            }}
            className="p-2.5 rounded-full border border-white/10 hover:border-orange-500/50 glass text-white/60 hover:text-white transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Metric widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Carrier Rating', val: `${dashboardData.rating} / 5.0`, icon: Star, color: 'text-yellow-400', border: 'border-l-yellow-500' },
          { label: 'Completed Cargoes', val: `${dashboardData.completedTrips} Trips`, icon: CheckCircle2, color: 'text-emerald-400', border: 'border-l-emerald-500' },
          { label: 'Open Opportunities', val: `${dashboardData.availableJobs} Jobs`, icon: Briefcase, color: 'text-orange-400', border: 'border-l-orange-500' },
          { label: 'Current Month Earnings', val: convertAndFormatCurrency(dashboardData.earnings.thisMonth, currency), icon: Award, color: 'text-indigo-400', border: 'border-l-indigo-500' },
        ].map((c, i) => (
          <div key={i} className={`driver-widget glass p-6 rounded-2xl border-l-4 ${c.border} border-y-0 border-r-0 shadow-lg flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{c.label}</span>
              <p className="text-lg font-black text-white">{c.val}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <c.icon size={16} className={c.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab select layout */}
      <div className="flex border-b border-white/5">
        {(['duty', 'jobs', 'profile', 'earnings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase font-extrabold tracking-wider transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span>{tab}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-glow" />
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Sub views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Panel */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'duty' && (
            <div className="driver-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-2">
                  <Truck size={14} className="text-orange-500" /> Active Transit Mission
                </h3>
                <div className="flex items-center gap-2">
                  {isDutyActive && (
                    <button
                      onClick={() => setIsLogModalOpen(true)}
                      className="btn btn-ghost border border-white/15 text-[9px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold"
                    >
                      <FileText size={10} />
                      <span>Report Check-in</span>
                    </button>
                  )}
                  {isDutyActive ? (
                    <span className="badge badge-success text-[8px] animate-pulse">Broadcasting Location</span>
                  ) : (
                    <span className="badge badge-primary text-[8px]">On-Hold</span>
                  )}
                </div>
              </div>

              {/* Transit Map Simulator */}
              <div className="w-full h-56 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden flex flex-col justify-between p-4">
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <span className="text-[8px] text-white/40 uppercase font-black">GPS Signal</span>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isDutyActive ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                      Lat: {currentCoords.lat.toFixed(5)}, Lng: {currentCoords.lng.toFixed(5)}
                    </p>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/5 text-right">
                    <span className="text-[8px] text-white/40 uppercase font-black">Logs Dispatched</span>
                    <p className="text-xs font-black text-orange-500">{gpsLogCount} Packets</p>
                  </div>
                </div>

                {/* SVG Road Map */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 200">
                  <path d="M 30,170 C 120,30 380,180 470,40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <path d="M 30,170 C 120,30 380,180 470,40" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />
                  
                  {/* Position Dot */}
                  <circle
                    cx={30 + (440 * Math.min(gpsLogCount * 0.05, 1))}
                    cy={170 - (130 * Math.min(gpsLogCount * 0.05, 1))}
                    r="8"
                    fill="#ef4444"
                    className="animate-ping opacity-70"
                  />
                  <circle
                    cx={30 + (440 * Math.min(gpsLogCount * 0.05, 1))}
                    cy={170 - (130 * Math.min(gpsLogCount * 0.05, 1))}
                    r="5"
                    fill="#ef4444"
                  />
                </svg>

                <div className="flex justify-between items-end z-10 border-t border-white/5 pt-3 bg-black/10 -mx-4 -mb-4 p-4">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[8px] text-white/40 uppercase font-black">Departure Terminal</span>
                    <p className="text-xs font-bold text-white">Mombasa Port Cargo Terminal</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] text-white/40 uppercase font-black">Destination Terminal</span>
                    <p className="text-xs font-bold text-white">Kampala Logistics Depot</p>
                  </div>
                </div>
              </div>

              {/* Assigned Jobs List */}
              <div className="space-y-4">
                {dashboardData.upcomingTrips.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">No cargo trips assigned. Browse opportunities in the Jobs panel.</div>
                ) : (
                  dashboardData.upcomingTrips.map((trip: any) => (
                    <div key={trip.id} className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-4 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase">{trip.title}</span>
                        <span className="badge badge-primary text-[8px] uppercase">{trip.status}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/60">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-orange-500" />
                          <span>Pickup: <strong>{trip.pickup}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-emerald-500" />
                          <span>Delivery: <strong>{trip.delivery}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-orange-500" />
                          <span>Date: <strong>{trip.date}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="driver-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
                  <Briefcase size={14} className="text-orange-500" /> Public Opportunity Marketplace
                </h3>
                <p className="text-[10px] text-white/40 mt-1">Browse and apply for cargo runs across major logistics corridors.</p>
              </div>

              <div className="space-y-4">
                {openJobs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">No open transport opportunities resolved. Check back later.</div>
                ) : (
                  openJobs.map((job: any) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all flex justify-between items-center gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase">{job.title}</h4>
                        <p className="text-[10px] text-white/50">{job.company?.name} • {job.location}</p>
                        <span className="badge bg-white/5 text-[8px] border-white/5 uppercase">{job.licenseClass} Required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-emerald-400">
                          {convertAndFormatCurrency(job.salaryMin || 35000, currency)}
                        </span>
                        <ChevronRight size={14} className="text-white/30" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="driver-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest font-mono">Driver Credentials</h3>
                <button
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                  className="btn btn-ghost border border-white/10 px-3.5 py-1.5 rounded-lg text-[10px] font-bold"
                >
                  {isProfileEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">License Class</label>
                    <input
                      type="text"
                      disabled={!isProfileEditing}
                      value={profileForm.licenseClass}
                      onChange={(e) => setProfileForm({ ...profileForm, licenseClass: e.target.value })}
                      placeholder="e.g. CLASS A"
                      className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    {formErrors.licenseClass && (
                      <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.licenseClass}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Years of Experience</label>
                    <input
                      type="number"
                      disabled={!isProfileEditing}
                      value={profileForm.yearsExperience}
                      onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                      placeholder="e.g. 5"
                      className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    {formErrors.yearsExperience && (
                      <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.yearsExperience}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">License Number</label>
                  <input
                    type="text"
                    disabled={!isProfileEditing}
                    value={profileForm.licenseNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                    placeholder="e.g. DL-9836471"
                    className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {formErrors.licenseNumber && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.licenseNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Operational Phone</label>
                  <input
                    type="text"
                    disabled={!isProfileEditing}
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    placeholder="e.g. +254712345678"
                    className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {formErrors.phoneNumber && (
                    <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.phoneNumber}</span>
                  )}
                </div>

                {isProfileEditing && (
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {profileSubmitting ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Save License Credentials</span>
                        <Send size={12} />
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="driver-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest font-mono">Earning Manifests & Payouts</h3>
              </div>

              {/* Earnings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-3">Trip ID</th>
                      <th className="pb-3">Route Terminal</th>
                      <th className="pb-3">Payout Date</th>
                      <th className="pb-3 text-right">Earning Rate</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { id: 'TRP-1982', route: 'Mombasa - Kampala', date: '2026-07-01', amount: 45000, status: 'DISBURSED' },
                      { id: 'TRP-1827', route: 'Nairobi - Eldoret', date: '2026-06-25', amount: 32000, status: 'DISBURSED' },
                      { id: 'TRP-1534', route: 'Malaba - Jinja', date: '2026-06-18', amount: 15000, status: 'DISBURSED' },
                    ].map((row, idx) => (
                      <tr key={idx} className="text-white/80 hover:bg-white/5 transition-all">
                        <td className="py-4 font-mono text-[10px] text-white/60">{row.id}</td>
                        <td className="py-4 font-semibold">{row.route}</td>
                        <td className="py-4">{row.date}</td>
                        <td className="py-4 text-right font-black text-emerald-400">
                          {convertAndFormatCurrency(row.amount, currency)}
                        </td>
                        <td className="py-4 text-right">
                          <span className="badge badge-success text-[8px] font-bold">DISBURSED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right column alert guidelines */}
        <div className="lg:col-span-4 driver-widget glass border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center gap-1.5">
              <Shield size={13} className="text-orange-500" /> Carrier Guidelines
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Real-time GPS Tracking', text: 'You must toggle Duty Mode on at start of journey. Background coordinates keep shippers informed of delays.', icon: MapPin },
              { title: 'Border clearances', text: 'Prepare documentation 50km before customs checkpoints. Document customs numbers inside transit logs.', icon: ClipboardList },
              { title: 'Speed Governors', text: 'Adhere to regional speed limits (max 80km/h for loaded shipping container vehicles). Speed violations are logged.', icon: AlertTriangle },
            ].map((g, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="p-2 h-fit bg-white/5 rounded-lg border border-white/5 mt-0.5">
                  <g.icon size={13} className="text-orange-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white">{g.title}</p>
                  <p className="text-white/50 leading-relaxed text-[11px]">{g.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MODAL: MANUAL CHECK-IN REPORT ─── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <h3 className="text-sm uppercase font-extrabold text-white flex items-center gap-1.5">
                <FileText size={14} className="text-orange-500" />
                <span>Submit Customs/Incident Check-in Log</span>
              </h3>
              <p className="text-[10px] text-white/40 mt-1">Dispatches manual checkpoints & coordinate packets directly to dispatcher logs.</p>
            </div>

            <form onSubmit={handleCustomCheckin} className="space-y-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Check-in Classification</label>
                <select
                  value={customLogType}
                  onChange={(e) => setCustomLogType(e.target.value)}
                  className="input-field text-xs bg-white/5 border-white/10 text-white"
                >
                  <option value="CUSTOMS" className="bg-black">Customs & Border Clearance</option>
                  <option value="FUEL" className="bg-black">Fuel Station Refill</option>
                  <option value="MECHANICAL" className="bg-black">Mechanical Check / Repair</option>
                  <option value="DELAY" className="bg-black">Traffic / Road Incident Delay</option>
                  <option value="REST" className="bg-black">Driver Rest Break</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-white/40 uppercase font-bold mb-1">Report Description & Notes</label>
                <textarea
                  value={customLogText}
                  onChange={(e) => setCustomLogText(e.target.value)}
                  placeholder="e.g. Cleared through Kenya-Uganda customs gate at Malaba. All cargo seals intact."
                  className="input-field text-xs h-24 resize-none"
                  required
                />
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-[9px] text-white/40">
                Current Telemetry coordinates will be attached: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider"
              >
                Dispatch Check-in Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: JOB DETAILS & CORRIDOR MISSION ─── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-white/15 p-6 rounded-2xl w-full max-w-lg space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
            <div>
              <span className="badge badge-primary text-[8px] uppercase tracking-widest">{selectedJob.jobType}</span>
              <h3 className="text-sm uppercase font-extrabold text-white mt-1">{selectedJob.title}</h3>
              <p className="text-[10px] text-white/40">{selectedJob.company?.name} | {selectedJob.location}</p>
            </div>

            <div className="space-y-4 text-xs text-white/80 max-h-60 overflow-y-auto border-y border-white/5 py-4">
              <div className="space-y-1">
                <p className="font-bold text-white uppercase text-[9px] text-orange-500">Mission Description</p>
                <p className="leading-relaxed">{selectedJob.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-white uppercase text-[9px] text-orange-500 block">Required Permit</span>
                  <span>{selectedJob.licenseClass}</span>
                </div>
                <div>
                  <span className="font-bold text-white uppercase text-[9px] text-orange-500 block">Est. Payout</span>
                  <span className="font-semibold text-emerald-400">
                    {convertAndFormatCurrency(selectedJob.salaryMin || 35000, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleJobApplication(selectedJob.id)}
                className="flex-1 btn btn-primary py-2.5 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={12} />
                <span>Confirm Application Submission</span>
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
