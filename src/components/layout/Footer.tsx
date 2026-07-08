import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Truck, MapPin, Phone, Mail, Globe, ArrowRight, Send,
  ChevronRight, Shield, Clock, Star
} from 'lucide-react';
import { SUBSCRIBE_NEWSLETTER } from '../../api/mutations';
import toast from 'react-hot-toast';

const FacebookIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const YoutubeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

gsap.registerPlugin(ScrollTrigger);

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const footerRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const [subscribeNewsletter, { loading }] = useMutation(SUBSCRIBE_NEWSLETTER);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-col',
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
          },
        }
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const { data } = await subscribeNewsletter({ variables: { email } });
      if (data?.subscribeNewsletter?.success) {
        setSubscribed(true);
        toast.success('Successfully subscribed!');
        setEmail('');
      } else {
        toast.error(data?.subscribeNewsletter?.message || 'Subscription failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  const quickLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/companies', label: t('nav.companies') },
    { to: '/jobs', label: t('nav.jobs') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const services = [
    'Freight Transport',
    'Fleet Management',
    'Real-time Tracking',
    'Cargo Insurance',
    'Route Optimization',
    'Driver Portal',
  ];

  const support = [
    { label: 'Help Center', to: '/help' },
    { label: 'Documentation', to: '/docs' },
    { label: 'API Reference', to: '/api' },
    { label: t('footer.privacy'), to: '/privacy' },
    { label: t('footer.terms'), to: '/terms' },
    { label: t('footer.cookie'), to: '/cookies' },
  ];

  const socials = [
    { icon: FacebookIcon, href: '#', label: 'Facebook' },
    { icon: TwitterIcon, href: '#', label: 'Twitter' },
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
    { icon: YoutubeIcon, href: '#', label: 'YouTube' },
  ];

  const trustBadges = [
    { icon: Shield, label: 'SSL Secured' },
    { icon: Star, label: 'Top Rated' },
    { icon: Clock, label: '24/7 Support' },
  ];

  return (
    <footer ref={footerRef} className="relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8580A 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF7A2F 0%, transparent 70%)' }} />

      {/* ─── Main Footer Content ─────────────────────────────── */}
      <div className="container-wide pt-20 pb-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="footer-col lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--gradient-primary)' }}>
                <Truck size={22} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-2xl text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>Tarx</span>emo
                </span>
                <p className="text-[10px] text-white/40 uppercase tracking-widest -mt-1">Logistics</p>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              {t('footer.tagline')}
            </p>

            {/* Contact Info */}
            <div className="space-y-2.5 mb-6">
              {[
                { icon: MapPin, text: 'Nairobi, Kenya · Dar es Salaam, TZ' },
                { icon: Phone, text: '+254 700 000 000' },
                { icon: Mail, text: 'info@tarxemo.com' },
                { icon: Globe, text: 'www.tarxemo.com' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/50 text-sm">
                  <Icon size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-all group">
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform"
                      style={{ color: 'var(--color-primary)' }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-white font-semibold text-sm mt-6 mb-4 uppercase tracking-wider">
              {t('footer.services')}
            </h3>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s}>
                  <span className="flex items-center gap-1.5 text-white/50 text-sm">
                    <ChevronRight size={13} style={{ color: 'var(--color-primary)' }} />
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              {t('footer.support')}
            </h3>
            <ul className="space-y-2">
              {support.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-all group">
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform"
                      style={{ color: 'var(--color-primary)' }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="mt-6 space-y-2">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 glass-orange rounded-lg px-3 py-2">
                  <Icon size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-white/70 text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="footer-col">
            <h3 className="text-white font-semibold text-sm mb-2 uppercase tracking-wider">
              {t('footer.newsletter')}
            </h3>
            <p className="text-white/50 text-sm mb-4">{t('footer.newsletterSub')}</p>

            {subscribed ? (
              <div className="glass-orange rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'var(--gradient-primary)' }}>
                  <Send size={16} className="text-white" />
                </div>
                <p className="text-white font-semibold text-sm">You're subscribed! 🎉</p>
                <p className="text-white/50 text-xs mt-1">Stay tuned for updates.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer.emailPlaceholder')}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                    required
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full btn btn-primary text-sm py-3 disabled:opacity-70">
                  {loading ? '...' : (
                    <><Send size={14} /> {t('footer.subscribe')}</>
                  )}
                </button>
              </form>
            )}

            {/* App badge placeholder */}
            <div className="mt-5 p-3 glass rounded-xl border border-white/10">
              <p className="text-white/60 text-xs mb-2">Driver App — Coming Soon</p>
              <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/40 text-xs">
                  App Store
                </div>
                <div className="flex-1 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/40 text-xs">
                  Google Play
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="mt-4">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Available in</p>
              <div className="flex gap-1.5">
                {['🇬🇧 EN', '🇹🇿 SW', '🇫🇷 FR'].map((lang) => (
                  <span key={lang} className="px-2 py-1 rounded-full text-xs text-white/60 border border-white/10 glass">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Divider ─────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">{t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            {[t('footer.privacy'), t('footer.terms'), t('footer.cookie')].map((label) => (
              <Link key={label} to="#"
                className="text-white/40 hover:text-white text-xs transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <span>Made with</span>
            <span style={{ color: 'var(--color-primary)' }}>♥</span>
            <span>for Africa</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
