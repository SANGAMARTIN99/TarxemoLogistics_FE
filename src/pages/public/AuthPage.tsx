import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useLazyQuery } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Truck, Eye, EyeOff, Lock, Mail, Phone, User,
  ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Check, Sun, Moon
} from 'lucide-react';

import { LOGIN_USER, REGISTER_USER } from '../../api/mutations';
import { CHECK_EMAIL_EXISTS, CHECK_PHONE_EXISTS } from '../../api/queries';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setTokens, theme, toggleTheme } = useAppStore();

  // Redirect URL parameters
  const redirectUrl = searchParams.get('redirect') || 'dashboard';
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  // State Management
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // Async Verification States
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Refs for animations
  const formCardRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // APOLLO GRAPHQL HOOKS
  // ─────────────────────────────────────────────────────────────────────────────
  const [loginUser, { loading: loginLoading }] = useMutation(LOGIN_USER);
  const [registerUser, { loading: registerLoading }] = useMutation(REGISTER_USER);

  const [checkEmailQuery] = useLazyQuery(CHECK_EMAIL_EXISTS);
  const [checkPhoneQuery] = useLazyQuery(CHECK_PHONE_EXISTS);

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP MOUNT ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftColRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        formCardRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.2)', delay: 0.1 }
      );
    });
    return () => ctx.revert();
  }, []);

  // Sync mode changes with search params
  useEffect(() => {
    const currentMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    setMode(currentMode);
  }, [searchParams]);

  // ─────────────────────────────────────────────────────────────────────────────
  // INSTANT AVAILABILITY CHECKS FOR EMAIL & PHONE
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'register' || !registerForm.email) {
      setEmailCheckStatus('idle');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setEmailCheckStatus('idle');
      return;
    }

    setEmailCheckStatus('checking');
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await checkEmailQuery({
          variables: { email: registerForm.email },
          fetchPolicy: 'network-only'
        });
        if (data?.checkEmailExists?.exists) {
          setEmailCheckStatus('taken');
        } else {
          setEmailCheckStatus('available');
        }
      } catch {
        setEmailCheckStatus('idle');
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [registerForm.email, mode]);

  useEffect(() => {
    if (mode !== 'register' || !registerForm.phone) {
      setPhoneCheckStatus('idle');
      return;
    }
    const cleanPhone = registerForm.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      setPhoneCheckStatus('idle');
      return;
    }

    setPhoneCheckStatus('checking');
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await checkPhoneQuery({
          variables: { phone: cleanPhone },
          fetchPolicy: 'network-only'
        });
        if (data?.checkPhoneExists?.exists) {
          setPhoneCheckStatus('taken');
        } else {
          setPhoneCheckStatus('available');
        }
      } catch {
        setPhoneCheckStatus('idle');
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [registerForm.phone, mode]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD STRENGTH ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  const analyzePassword = (pwd: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (!pwd) return { score: 0, label: 'strength.weak', color: 'bg-white/10', feedback };

    if (pwd.length >= 8) {
      score += 1;
    } else {
      feedback.push('Min 8 characters required');
    }
    if (/[A-Z]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Requires uppercase letter');
    }
    if (/[0-9]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Requires numeric character');
    }
    if (/[^A-Za-z0-9]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Requires special symbol');
    }

    let label = 'strength.weak';
    let color = 'bg-red-500';

    if (score === 2) {
      label = 'strength.fair';
      color = 'bg-yellow-500';
    } else if (score === 3) {
      label = 'strength.good';
      color = 'bg-orange-500';
    } else if (score === 4) {
      label = 'strength.strong';
      color = 'bg-emerald-500';
    }

    return { score, label, color, feedback };
  };

  const registerPasswordStrength = analyzePassword(registerForm.password);

  // ─────────────────────────────────────────────────────────────────────────────
  // INPUT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setRegisterForm({ ...registerForm, [e.target.name]: value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM SUBMISSION & ROLE SANITIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const { data } = await loginUser({
        variables: {
          input: {
            email: loginForm.email,
            password: loginForm.password
          }
        }
      });

      if (data?.login?.success) {
        toast.success(data.login.message || 'Login successful!');
        setTokens(data.login.accessToken, data.login.refreshToken);
        setUser(data.login.user);
        
        // Timeout redirect to allow storage updates
        setTimeout(() => {
          navigate(redirectUrl === 'dashboard' ? '/dashboard' : `/?redirect=${redirectUrl}`);
        }, 800);
      } else {
        toast.error(data?.login?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication error. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate details
    if (!registerForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!registerForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!registerForm.email) errors.email = 'Email is required';
    if (!registerForm.phone) errors.phone = 'Phone number is required';
    if (registerForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!registerForm.agreeTerms) errors.agreeTerms = 'You must agree to terms';

    if (emailCheckStatus === 'taken') errors.email = 'Email is already taken';
    if (phoneCheckStatus === 'taken') errors.phone = 'Phone number is already taken';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix errors in the form before submitting');
      return;
    }

    try {
      // Clean phone to numeric format for standard backend E.164 compliance
      const cleanPhone = registerForm.phone.replace(/\s+/g, '');
      const { data } = await registerUser({
        variables: {
          input: {
            email: registerForm.email,
            password: registerForm.password,
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
            phone: cleanPhone
          }
        }
      });

      if (data?.register?.success) {
        toast.success(data.register.message || 'Registration successful! Signing in...');
        setTokens(data.register.accessToken, data.register.refreshToken);
        setUser(data.register.user);

        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        toast.error(data?.register?.message || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration error. Please check your network.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      
      {/* Background Graphic Nodes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8580A 0%, transparent 70%)' }} />

      {/* Floating Theme / Language Top Bar */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full glass border border-white/10 text-white/70 hover:text-white transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Link to="/" className="btn btn-ghost text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold border-white/10 text-white/80">
          <span>Home Page</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left column (Visual highlights) */}
        <div ref={leftColRef} className="lg:col-span-5 hidden lg:block space-y-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}>
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--color-primary)' }}>Tarx</span>emo
              </span>
              <p className="text-[10px] text-white/40 tracking-widest uppercase -mt-1 font-bold">Logistics</p>
            </div>
          </Link>

          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Access the Regional <br />
              <span className="text-orange-500">Logistics Hub</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Log in to coordinate cargo shipments, view active transit logs, monitor live GPS geofences, and manage driver tasks across SADC and East African border checkpoints.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Secure Role Audits', desc: 'All sessions are cryptographically signed with strict role compliance checks.' },
              { title: 'Time-Travel Audits', desc: 'Query previous transit logs and historical metrics retroactively.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-4 rounded-xl glass border border-white/5">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</h4>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column (Authentication cards) */}
        <div ref={formCardRef} className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md glass border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            
            {/* Header switcher */}
            <div className="flex border-b border-white/10 pb-6 mb-6">
              <button
                onClick={() => navigate('/auth?mode=login')}
                className={`flex-1 text-center pb-2.5 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                  mode === 'login'
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {t('auth.signIn')}
              </button>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className={`flex-1 text-center pb-2.5 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                  mode === 'register'
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {t('auth.signUp')}
              </button>
            </div>

            {/* ─── Mode: LOGIN FORM ─── */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{t('auth.loginTitle')}</h3>
                  <p className="text-xs text-white/50">{t('auth.loginSubtitle')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.email')}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="email"
                        name="email"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        placeholder="driver@tarxemo.com"
                        className="input-field text-xs pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] text-white/50 uppercase font-bold">{t('auth.password')}</label>
                      <Link to="/forgot-password" className="text-[10px] text-orange-500 font-bold hover:underline">
                        {t('auth.forgotPassword')}
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="••••••••"
                        className="input-field text-xs pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider mt-2 disabled:opacity-75"
                >
                  {loginLoading ? 'Signing In...' : t('auth.signIn')}
                </button>
              </form>
            )}

            {/* ─── Mode: REGISTER FORM ─── */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">{t('auth.registerTitle')}</h3>
                  <p className="text-xs text-white/50">{t('auth.registerSubtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.firstName')}</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        name="firstName"
                        value={registerForm.firstName}
                        onChange={handleRegisterChange}
                        placeholder="John"
                        className={`input-field text-xs pl-9 ${formErrors.firstName ? 'error' : ''}`}
                        required
                      />
                    </div>
                    {formErrors.firstName && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.firstName}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.lastName')}</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        name="lastName"
                        value={registerForm.lastName}
                        onChange={handleRegisterChange}
                        placeholder="Kamau"
                        className={`input-field text-xs pl-9 ${formErrors.lastName ? 'error' : ''}`}
                        required
                      />
                    </div>
                    {formErrors.lastName && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.lastName}</span>}
                  </div>
                </div>

                {/* Email (with instant availability verification) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] text-white/50 uppercase font-bold">{t('auth.email')}</label>
                    {emailCheckStatus === 'checking' && (
                      <span className="text-[9px] text-orange-400 flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> {t('auth.emailCheck')}
                      </span>
                    )}
                    {emailCheckStatus === 'available' && (
                      <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                        <Check size={10} /> {t('auth.emailAvailable')}
                      </span>
                    )}
                    {emailCheckStatus === 'taken' && (
                      <span className="text-[9px] text-red-400 flex items-center gap-1 font-bold">
                        <AlertCircle size={10} /> {t('auth.emailTaken')}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      placeholder="driver@tarxemo.com"
                      className={`input-field text-xs pl-9 ${formErrors.email ? 'error' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.email && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.email}</span>}
                </div>

                {/* Phone (with instant availability verification) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] text-white/50 uppercase font-bold">{t('auth.phone')}</label>
                    {phoneCheckStatus === 'checking' && (
                      <span className="text-[9px] text-orange-400 flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> {t('auth.phoneCheck')}
                      </span>
                    )}
                    {phoneCheckStatus === 'available' && (
                      <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                        <Check size={10} /> {t('auth.phoneAvailable')}
                      </span>
                    )}
                    {phoneCheckStatus === 'taken' && (
                      <span className="text-[9px] text-red-400 flex items-center gap-1 font-bold">
                        <AlertCircle size={10} /> {t('auth.phoneTaken')}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      name="phone"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      placeholder="+254 700 000 000"
                      className={`input-field text-xs pl-9 ${formErrors.phone ? 'error' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.phone && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.phone}</span>}
                </div>

                {/* Password & Strength Indicator */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.password')}</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className={`input-field text-xs pl-9 pr-9 ${formErrors.password ? 'error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className={`input-field text-xs pl-9 pr-9 ${formErrors.confirmPassword ? 'error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {formErrors.confirmPassword && <span className="text-[9px] text-red-400 mt-1 block">{formErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Password Strength Progress Bar & Feedback */}
                {registerForm.password && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-white/50 uppercase">
                      <span>Password Strength</span>
                      <span className={registerPasswordStrength.score === 4 ? 'text-emerald-400 font-extrabold' : 'text-orange-400'}>
                        {t(registerPasswordStrength.label)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full rounded-full transition-all duration-300 ${
                            i < registerPasswordStrength.score
                              ? registerPasswordStrength.color
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    {registerPasswordStrength.feedback.length > 0 && (
                      <p className="text-[8px] text-white/40 leading-normal">
                        * {registerPasswordStrength.feedback.join(' | ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Terms agreement */}
                <div className="flex items-start gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={registerForm.agreeTerms}
                    onChange={handleRegisterChange}
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500/30"
                  />
                  <label htmlFor="agreeTerms" className="text-[10px] text-white/50 leading-relaxed cursor-pointer select-none">
                    {t('auth.agreeTerms')}
                  </label>
                </div>
                {formErrors.agreeTerms && <span className="text-[9px] text-red-400 block -mt-2">{formErrors.agreeTerms}</span>}

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider disabled:opacity-75"
                >
                  {registerLoading ? 'Creating Account...' : t('auth.signUp')}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
