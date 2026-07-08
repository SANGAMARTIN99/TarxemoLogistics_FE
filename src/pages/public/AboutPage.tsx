import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Compass, ShieldCheck, Truck, Users, Globe, ChevronDown
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AboutPage: React.FC = () => {
  // Accordion active state for FAQs
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Refs for animations
  const introRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro sections
      gsap.fromTo(
        '.about-reveal',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' }
      );

      // Value Cards reveal
      gsap.fromTo(
        '.value-card',
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.7,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: valuesRef.current,
            start: 'top 85%',
          }
        }
      );

      // Timeline entries
      gsap.fromTo(
        '.timeline-node',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.15,
          duration: 0.8,
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 80%',
          }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleToggleFaq = (idx: number) => {
    setActiveFaq((prev) => (prev === idx ? null : idx));
  };

  const coreValues = [
    {
      title: 'Regional Logistics Safety First',
      desc: 'We mandate and monitor stringent safety checks on cargo handling and driver wellness checklists.',
      icon: ShieldCheck
    },
    {
      title: 'Real-Time Visibility transparency',
      desc: 'Every single kilometer of transit is linked to real-time GPS feeds with precision ETA predictors.',
      icon: Compass
    },
    {
      title: 'Empowering Transport Drivers',
      desc: 'We offer competitive job dispatches, structured insurance cover, and simplified regional transit permits.',
      icon: Truck
    },
    {
      title: 'Pan-African Collaboration Network',
      desc: 'Unifying border crossing points, clearing agencies, and fleet operators into one cohesive marketplace.',
      icon: Globe
    }
  ];

  const timelineSteps = [
    { year: '2023', title: 'Scaffolding Foundation', desc: 'Tarxemo was founded in Nairobi, Kenya, aiming to simplify transport logs across the Mombasa corridor.' },
    { year: '2024', title: 'Regional Expansion', desc: 'Integrated cross-border tracking hubs in Uganda and Tanzania. Active driver registrations hit 500+.' },
    { year: '2025', title: 'Multi-Tenant Launch', desc: 'Introduced standard white-label subdomains and customizable theme configurations for logistics companies.' },
    { year: '2026', title: 'Intelligent Corridors', desc: 'Deployed state-of-the-art dispatch optimization models, time-travel auditing, and real-time mapping APIs.' }
  ];

  const faqs = [
    {
      q: 'How does Tarxemo assist transport drivers?',
      a: 'Tarxemo is a direct connection marketplace. Drivers can register on the platform, browse active regional dispatch logs, and directly apply for work. The dashboard gives drivers route logs, navigation widgets, and automated payment tracking.'
    },
    {
      q: 'Can logistics companies customize the platform?',
      a: 'Yes, Tarxemo features complete white-labeling. Every registered company gets a dedicated subdomain, custom color parameters, brand logo files, and personalized style sheets for their dispatch board.'
    },
    {
      q: 'Which countries are supported?',
      a: 'We currently cover routes and clearing corridors in Kenya, Uganda, Tanzania, Rwanda, Burundi, and the Democratic Republic of Congo (DRC).'
    },
    {
      q: 'Are payments handled inside the platform?',
      a: 'Yes. Tarxemo offers invoicing tools and supports automated payment collections via ClickPesa, bank wire, and major mobile money APIs.'
    }
  ];

  return (
    <div className="min-h-screen text-white select-none relative pt-24 pb-20 overflow-hidden"
      style={{ background: 'var(--color-bg)' }}>
      
      {/* Background components */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="container-wide px-4 relative z-10">

        {/* ─── Intro Section ─── */}
        <div ref={introRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 space-y-6">
            <span className="badge badge-primary about-reveal">OUR PLATFORM VISION</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight about-reveal">
              We Are Unifying <span className="gradient-text">Africa\'s Logistics</span> Ecosystem
            </h1>
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed about-reveal">
              Logistics in East & Central Africa presents unique geographical and compliance challenges. Tarxemo was created to build a high-performance bridge connecting cargo owners, fleet managers, and skilled drivers. Our dashboard maps routes, speeds up custom clearances, and builds trust through verified metrics.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 about-reveal">
              <div className="flex items-center gap-2 px-3 py-2 glass border border-white/10 rounded-xl">
                <Users size={16} className="text-orange-500" />
                <span className="text-xs font-bold">1,200+ Verified Drivers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 glass border border-white/10 rounded-xl">
                <Globe size={16} className="text-orange-500" />
                <span className="text-xs font-bold">6 Countries Covered</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 about-reveal">
            <div className="relative glass border border-white/15 p-4 rounded-3xl w-full max-w-sm mx-auto shadow-2xl">
              <div className="h-64 rounded-2xl bg-neutral-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent z-10" />
                <Truck size={64} className="text-orange-500 float-anim relative z-20" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Core Values Section ─── */}
        <div ref={valuesRef} className="space-y-12 mb-24">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="badge badge-primary">HOW WE OPERATE</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Core Value Pillar Cards</h2>
            <p className="text-white/50 text-xs sm:text-sm">These operating guidelines define how we design, validate, and secure logistics transport corridors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="value-card card p-6 space-y-4 hover:border-orange-500/30 flex flex-col justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Icon size={22} className="text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-sm sm:text-base">{val.title}</h3>
                    <p className="text-white/60 text-xs leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Timeline / Roadmap ─── */}
        <div ref={timelineRef} className="space-y-12 mb-24">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="badge badge-primary">GROWTH MILESTONES</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Company Timeline Journey</h2>
            <p className="text-white/50 text-xs sm:text-sm">Our milestones indicate our rapid adaptation and deployment of transport APIs.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="timeline-node relative pl-12 flex gap-4">
                <div className="absolute left-1.5 top-2 w-5.5 h-5.5 rounded-full border-4 border-neutral-900 bg-orange-500 z-10 flex items-center justify-center" />
                <div className="glass border border-white/5 p-5 rounded-2xl flex-1 hover:border-orange-500/20 transition-all">
                  <span className="text-orange-500 text-xs font-extrabold">{step.year}</span>
                  <h4 className="font-bold text-white text-sm sm:text-base mt-1">{step.title}</h4>
                  <p className="text-white/65 text-xs mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FAQ Accordion ─── */}
        <div className="space-y-12 max-w-3xl mx-auto mb-20">
          <div className="text-center space-y-3">
            <span className="badge badge-primary">HELP & QUESTIONS</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Answered Queries</h2>
            <p className="text-white/50 text-xs sm:text-sm">Find answers to common questions about driver logs, company configurations, and routes.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all"
                  onClick={() => handleToggleFaq(idx)}
                >
                  <div className="p-5 flex justify-between items-center gap-4 hover:bg-white/5">
                    <span className="font-bold text-xs sm:text-sm text-white">{faq.q}</span>
                    <ChevronDown size={16} className={`text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isOpen && (
                    <div className="p-5 pt-0 border-t border-white/5 text-xs sm:text-sm text-white/60 leading-relaxed bg-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
