import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Users, ArrowRight, ChevronDown, Milestone, Clock, ShieldCheck, HelpCircle as HelpIcon, Compass
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES & LOCAL TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface TimelineEvent {
  year: string;
  title: string;
  desc: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface Corridor {
  name: string;
  length: string;
  borders: string[];
  status: 'FAST' | 'MODERATE' | 'SLOW';
  avgDays: number;
}

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  // FAQ Accordion State
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Refs for animations
  const pageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const corridorsRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP SCROLLTRIGGERS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance Fade
      gsap.fromTo(
        '.about-hero-anim',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.2 }
      );

      // 2. Corridors showcase slide-in
      gsap.fromTo(
        '.corridor-card-anim',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: corridorsRef.current,
            start: 'top 85%'
          }
        }
      );

      // 3. Timeline progression line height tween
      gsap.fromTo(
        '.timeline-progress-line',
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 80%',
            end: 'bottom 50%',
            scrub: true
          }
        }
      );

      // 4. Timeline items fade-in
      gsap.fromTo(
        '.timeline-item-anim',
        { opacity: 0, x: -35 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.2,
          duration: 0.5,
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 75%'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleToggleFAQ = (idx: number) => {
    setOpenFAQ(openFAQ === idx ? null : idx);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ABOUT CONTENT DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  const timeline: TimelineEvent[] = [
    { year: '2023', title: 'Platform Conception', desc: 'Tarxemo Logistics was founded in Nairobi, Kenya, by a team of logistics engineers aiming to simplify freight crossing documentation.' },
    { year: '2024', title: 'Corridor Expansion', desc: 'Integrated real-time tracking feeds for the Northern Corridor (Mombasa - Kampala - Kigali) and verified over 80 trucking fleets.' },
    { year: '2025', title: 'Multitenancy Launch', desc: 'Introduced customized tenant portals for large logistics companies, supporting custom colors and branded sub-routes.' },
    { year: '2026', title: 'AI Route Optimizations', desc: 'Added smart border-crossing duration estimators and advanced drivers dispatch board capabilities.' }
  ];

  const corridors: Corridor[] = [
    { name: 'Northern Transit Corridor', length: '1,700 km', borders: ['Malaba (KE/UG)', 'Gatuna (UG/RW)'], status: 'FAST', avgDays: 3 },
    { name: 'Central Highway Corridor', length: '1,300 km', borders: ['Rusumo (TZ/RW)', 'Kobero (RW/BI)'], status: 'MODERATE', avgDays: 5 },
    { name: 'SADC Link Corridor', length: '2,100 km', borders: ['Tunduma (TZ/ZM)', 'Kasumbalesa (ZM/CD)'], status: 'SLOW', avgDays: 8 }
  ];

  const faqs: FAQItem[] = [
    { q: 'How does Tarxemo ensure vehicle and driver safety?', a: 'Every logistics company registered on the platform undergoes strict audit checks including license verification, insurance certificate audits, and regular safety record reports. Customers can view the verification badges on company profile cards.' },
    { q: 'Can drivers apply directly to cargo dispatches?', a: 'Yes! Vetted drivers can search open dispatches on the Jobs Board, view specific license requirements, and apply directly. If they are not registered, they will be guided to complete the secure driver onboarding forms.' },
    { q: 'What is a multi-tenant logistics portal?', a: 'Tarxemo allows registered transport companies to create their own sub-portals. Premium members can customize their primary theme colors, display unique logos, and manage their assigned drivers inside a private database corridor.' },
    { q: 'How do you estimate border clearance delays?', a: 'We utilize crowd-sourced driver logs combined with border-crossing check points timestamps to estimate live transit hour delays at Namanga, Malaba, and Rusumo borders.' }
  ];

  return (
    <div ref={pageRef} className="min-h-screen pt-36 md:pt-40 pb-20 px-6 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background Radial nodes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-6xl space-y-24">
        
        {/* ─── ABOUT HERO SECTION ─── */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <span className="about-hero-anim badge badge-primary uppercase tracking-widest text-[9px] font-bold px-3 py-1 inline-block">
            WHO WE ARE
          </span>
          <h1 className="about-hero-anim text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Connecting Africa's <br />
            <span className="text-orange-500">Logistics Ecosystem</span>
          </h1>
          <p className="about-hero-anim text-sm md:text-base text-white/60 leading-relaxed">
            Tarxemo Logistics is a multi-tenant cross-border logistics network built to optimize freight transport, driver recruitment, and fleet tracking across East and Central African transit corridors.
          </p>
          <div className="about-hero-anim pt-4">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="btn btn-primary px-8 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mx-auto"
            >
              <span>Join the Network</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ─── OPERATIONAL METRICS GRID ─── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Corridor Security', desc: 'Cryptographic data tracking ensures cargo manifest documents match at all border checkpoints.', icon: ShieldCheck },
            { title: 'Regional Scope', desc: 'Active shipping routes connecting major ports (Mombasa, Dar es Salaam) to inland terminals.', icon: Compass },
            { title: 'Empowering Drivers', desc: 'Connecting truck drivers directly with verified shippers, cutting agency fees.', icon: Users }
          ].map((item, idx) => (
            <div key={idx} className="p-8 rounded-2xl glass border border-white/5 space-y-4 hover:border-orange-500/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <item.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* ─── CORRIDOR SHOWCASE WIDGET ─── */}
        <section ref={corridorsRef} className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge badge-primary">TRANSIT NETWORKS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Active Cargo Corridors</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              We monitor average delays and clearance timeframes across key border control points dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {corridors.map((c, i) => (
              <div key={i} className="corridor-card-anim p-6 rounded-2xl glass border border-white/5 space-y-6 flex flex-col justify-between hover:border-orange-500/20 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Milestone size={14} className="text-orange-500" />
                      {c.name}
                    </span>
                    <span className={`badge text-[8px] font-bold px-2 py-0.5 ${
                      c.status === 'FAST' ? 'badge-success' : c.status === 'MODERATE' ? 'badge-primary' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-white/60">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Total Corridor Length:</span>
                      <strong className="text-white">{c.length}</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Avg Transit Days:</span>
                      <strong className="text-white">{c.avgDays} Days</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Key Border Stations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.borders.map((b, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/80">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                  <span className="flex items-center gap-1"><Clock size={12} /> Live tracking active</span>
                  <span className="text-orange-400 font-bold">100% Secure</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TIMELINE SECTION (GSAP SCROLLTRIGGER PROGRESS) ─── */}
        <section ref={timelineRef} className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge badge-primary">OUR JOURNEY</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Milestones & History</h2>
          </div>

          <div className="relative max-w-3xl mx-auto pl-8">
            {/* Timeline Progress Line */}
            <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-white/10" />
            <div className="timeline-progress-line absolute left-1.5 top-0 w-0.5 bg-orange-500 origin-top" />

            <div className="space-y-10">
              {timeline.map((evt, idx) => (
                <div key={idx} className="timeline-item-anim relative space-y-2">
                  {/* Bullet Node */}
                  <div className="absolute -left-[32px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-orange-500 z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                  </div>
                  <div className="p-5 rounded-2xl glass border border-white/5 hover:border-orange-500/10 transition-all space-y-1">
                    <span className="text-xs font-black text-orange-500">{evt.year}</span>
                    <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{evt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQs ACCORDION ─── */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge badge-primary">COMMON INQUIRIES</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFAQ === idx;
              return (
                <div key={idx} className="rounded-2xl glass border border-white/5 overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => handleToggleFAQ(idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-white/80 hover:text-white transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <HelpIcon size={14} className="text-orange-500" />
                      {faq.q}
                    </span>
                    <ChevronDown size={16} className={`text-white/40 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[160px] border-t border-white/5 p-5' : 'max-h-0 overflow-hidden'}`}>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;
