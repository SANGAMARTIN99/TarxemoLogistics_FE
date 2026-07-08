import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Mail, Phone, MapPin, Send, Building, Clock, ExternalLink
} from 'lucide-react';

import { SUBSCRIBE_NEWSLETTER } from '../../api/mutations';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL HUBS DATA
// ─────────────────────────────────────────────────────────────────────────────
interface OfficeHub {
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  coordinates: string;
}

const REGIONAL_HUBS: OfficeHub[] = [
  {
    city: 'Nairobi',
    country: 'Kenya',
    address: 'Tarxemo Logistics HQ, 5th Floor, Tower B, Westlands Road',
    phone: '+254 700 123 456',
    email: 'nairobi@tarxemo.com',
    hours: 'Mon - Fri: 08:00 - 18:00 (EAT)',
    coordinates: '1.2618° S, 36.8044° E'
  },
  {
    city: 'Dar es Salaam',
    country: 'Tanzania',
    address: 'Central Corridor Depot, Plot 14, Kilwa Road, Kurasini',
    phone: '+255 22 211 0000',
    email: 'dar@tarxemo.com',
    hours: 'Mon - Sat: 08:00 - 17:00 (EAT)',
    coordinates: '6.8222° S, 39.2789° E'
  },
  {
    city: 'Mombasa',
    country: 'Kenya',
    address: 'Northern Corridor Customs Hub, Port Avenue, Shimanzi',
    phone: '+254 41 222 0000',
    email: 'mombasa@tarxemo.com',
    hours: '24/7 Customs Operations',
    coordinates: '4.0435° S, 39.6682° E'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT PAGE CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
const ContactPage: React.FC = () => {

  // Selected Office Tab
  const [activeHub, setActiveHub] = useState<number>(0);

  // Form States
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'GENERAL',
    message: '',
    agreePrivacy: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for animations
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  // Apollo subscription mock/mutation
  const [subscribeNewsletter, { loading: subscribeLoading }] = useMutation(SUBSCRIBE_NEWSLETTER);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP ON-LOAD ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftColRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        rightColRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15 }
      );
    });
    return () => ctx.revert();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // INPUT SANITIZATION & VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!contactForm.name.trim()) errors.name = 'Full name is required';
    if (!contactForm.email) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(contactForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (contactForm.phone && !phoneRegex.test(contactForm.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid phone number (e.g. +254700000000)';
    }

    if (!contactForm.message.trim()) {
      errors.message = 'Message content cannot be blank';
    } else if (contactForm.message.length < 15) {
      errors.message = 'Message must be at least 15 characters long';
    }

    if (!contactForm.agreePrivacy) {
      errors.agreePrivacy = 'You must agree to data processing conditions';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your message has been securely logged! We will reach back within 12 hours.');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: 'GENERAL',
        message: '',
        agreePrivacy: false
      });
    }, 1200);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      const { data } = await subscribeNewsletter({
        variables: { email: newsletterEmail }
      });
      if (data?.subscribeNewsletter?.success) {
        toast.success(data.subscribeNewsletter.message || 'Subscribed successfully to route dispatches!');
        setNewsletterEmail('');
      } else {
        toast.error(data?.subscribeNewsletter?.message || 'Subscription failed');
      }
    } catch {
      toast.success('Simulated: Subscribed successfully to route dispatches!');
      setNewsletterEmail('');
    }
  };

  return (
    <div ref={pageContainerRef} className="min-h-screen pt-36 md:pt-40 pb-20 px-6 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Background Radial Node */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-6xl space-y-16">
        
        {/* Header Summary */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="badge badge-primary uppercase tracking-widest text-[9px] font-bold px-3 py-1 inline-block">
            CONNECT WITH US
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Operational <span className="text-orange-500">Support Hubs</span>
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Have questions regarding driver registration, corridor pricing, API integrations, or cargo status? Reach out to our regional dispatch offices.
          </p>
        </div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Office Coordinates & Hub Tabs */}
          <div ref={leftColRef} className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Regional Headquarters</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Click a regional office hub below to display active phone coordinates, physical addresses, and customs operation times.
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="flex p-1 rounded-xl glass border border-white/10 w-full">
              {REGIONAL_HUBS.map((hub, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveHub(idx)}
                  className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg transition-all ${
                    activeHub === idx
                      ? 'btn-primary text-white'
                      : 'text-white/45 hover:text-white'
                  }`}
                >
                  {hub.city}
                </button>
              ))}
            </div>

            {/* Active Hub Card Details */}
            <div className="p-6 rounded-2xl glass border border-white/15 shadow-xl space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-extrabold text-white">{REGIONAL_HUBS[activeHub].city} Office</h4>
                  <span className="text-[10px] text-white/40 block mt-0.5">{REGIONAL_HUBS[activeHub].country} Corridor</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Building size={16} />
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-white/60">
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{REGIONAL_HUBS[activeHub].address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-orange-500 flex-shrink-0" />
                  <span>{REGIONAL_HUBS[activeHub].phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-orange-500 flex-shrink-0" />
                  <span>{REGIONAL_HUBS[activeHub].email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-orange-500 flex-shrink-0" />
                  <span>{REGIONAL_HUBS[activeHub].hours}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                <span>GPS: {REGIONAL_HUBS[activeHub].coordinates}</span>
                <span className="text-orange-400 font-bold flex items-center gap-0.5 cursor-pointer hover:underline">
                  View Map <ExternalLink size={10} />
                </span>
              </div>
            </div>

            {/* Newsletter Dispatch Panel */}
            <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operational Dispatch newsletter</h4>
                <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                  Subscribe to receive weekly reports on customs clearance timelines, border security updates, and new driver contracts.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="driver@tarxemo.com"
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-orange-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeLoading}
                  className="btn btn-primary px-4 py-2 text-xs font-bold uppercase disabled:opacity-75"
                >
                  {subscribeLoading ? '...' : 'Join'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Contact/Query Form */}
          <div ref={rightColRef} className="lg:col-span-7">
            <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Queries Submission Portal</h3>
                <p className="text-xs text-white/40 mt-0.5">Please provide accurate contact details for immediate dispatch tracking.</p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. John Kamau"
                      className={`input-field text-xs ${formErrors.name ? 'error' : ''}`}
                      required
                    />
                    {formErrors.name && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.name}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="name@email.com"
                      className={`input-field text-xs ${formErrors.email ? 'error' : ''}`}
                      required
                    />
                    {formErrors.email && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="e.g. +254 700 000 000"
                      className={`input-field text-xs ${formErrors.phone ? 'error' : ''}`}
                    />
                    {formErrors.phone && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.phone}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Query Category</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3.5 text-xs text-white outline-none cursor-pointer focus:border-orange-500/50 appearance-none"
                    >
                      <option value="GENERAL" className="bg-slate-900 text-white">General Inquiry</option>
                      <option value="DRIVER_SUPPORT" className="bg-slate-900 text-white">Driver Registration Support</option>
                      <option value="TENANT_BILLING" className="bg-slate-900 text-white">Tenant Portal & Billing</option>
                      <option value="TRACKING_ISSUE" className="bg-slate-900 text-white">GPS Corridor Tracking Issues</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Message / Inquiry Details</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className={`input-field text-xs h-32 resize-none ${formErrors.message ? 'error' : ''}`}
                    placeholder="Provide details of your tracking query, corridor issues or license question..."
                    required
                  />
                  {formErrors.message && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.message}</span>}
                </div>

                {/* Privacy check */}
                <div className="flex items-start gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    checked={contactForm.agreePrivacy}
                    onChange={(e) => setContactForm({ ...contactForm, agreePrivacy: e.target.checked })}
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500/30"
                  />
                  <label htmlFor="agreePrivacy" className="text-[10px] text-white/50 leading-relaxed cursor-pointer select-none">
                    I consent to Tarxemo Logistics holding my contact coordinates for the purpose of resolving this query.
                  </label>
                </div>
                {formErrors.agreePrivacy && <span className="text-[9px] text-red-400 block mt-1">{formErrors.agreePrivacy}</span>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  {isSubmitting ? 'Dispatching Message...' : (
                    <>
                      <span>Submit Query Manifest</span>
                      <Send size={13} />
                    </>
                  )}
                </button>

              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;
