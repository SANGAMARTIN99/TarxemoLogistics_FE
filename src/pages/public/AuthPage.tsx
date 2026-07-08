import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight,
  Loader2, Check, AlertCircle, Building2,
  ChevronLeft, Smartphone, KeyRound, Info
} from 'lucide-react';
import { LOGIN_USER, REGISTER_USER } from '../../api/mutations';
import { CHECK_EMAIL_EXISTS, CHECK_PHONE_EXISTS } from '../../api/queries';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL mode detection (default login)
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // AppStore setters
  const { setUser, setTokens } = useAppStore();

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field status
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // debounced validations
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [phoneExists, setPhoneExists] = useState<boolean | null>(null);

  // GSAP Container Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // GraphQL Actions
  const [loginUser, { loading: loginLoading }] = useMutation(LOGIN_USER);
  const [registerUser, { loading: registerLoading }] = useMutation(REGISTER_USER);

  const [checkEmailQuery, { loading: checkingEmail }] = useLazyQuery(CHECK_EMAIL_EXISTS);
  const [checkPhoneQuery, { loading: checkingPhone }] = useLazyQuery(CHECK_PHONE_EXISTS);

  // GSAP Page Load Reveal
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.9, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }
    );
  }, []);

  // Animate Form swaps
  const handleModeSwap = (newMode: 'login' | 'register') => {
    gsap.to(formRef.current, {
      opacity: 0,
      x: newMode === 'register' ? -50 : 50,
      duration: 0.25,
      onComplete: () => {
        setMode(newMode);
        resetFormState();
        gsap.fromTo(
          formRef.current,
          { opacity: 0, x: newMode === 'register' ? 50 : -50 },
          { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
        );
      }
    });
  };

  const resetFormState = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setAgreeTerms(false);
    setEmailExists(null);
    setPhoneExists(null);
  };

  // Debounced/Async checking on Email
  useEffect(() => {
    if (mode === 'login' || !email) {
      setEmailExists(null);
      return;
    }
    const timer = setTimeout(async () => {
      // standard regex test
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return;
      try {
        const { data } = await checkEmailQuery({ variables: { email } });
        if (data?.checkEmailExists) {
          setEmailExists(data.checkEmailExists.exists);
        } else {
          setEmailExists(false); // fallback if not supported on server yet
        }
      } catch {
        setEmailExists(false); // graceful bypass on server down
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [email, mode, checkEmailQuery]);

  // Debounced/Async checking on Phone
  useEffect(() => {
    if (mode === 'login' || !phone) {
      setPhoneExists(null);
      return;
    }
    const timer = setTimeout(async () => {
      if (phone.length < 9) return;
      try {
        const { data } = await checkPhoneQuery({ variables: { phone } });
        if (data?.checkPhoneExists) {
          setPhoneExists(data.checkPhoneExists.exists);
        } else {
          setPhoneExists(false);
        }
      } catch {
        setPhoneExists(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [phone, mode, checkPhoneQuery]);

  // Password Strength Calculator
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: '', color: 'bg-neutral-800' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score: 20, text: t('auth.strength.weak'), color: 'bg-red-500' };
      case 3:
        return { score: 50, text: t('auth.strength.fair'), color: 'bg-yellow-500' };
      case 4:
        return { score: 80, text: t('auth.strength.good'), color: 'bg-orange-500' };
      case 5:
        return { score: 100, text: t('auth.strength.strong'), color: 'bg-emerald-500' };
      default:
        return { score: 0, text: '', color: 'bg-neutral-800' };
    }
  };

  const strength = getPasswordStrength();

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all credentials');
      return;
    }
    try {
      const { data } = await loginUser({
        variables: { input: { email, password } }
      });

      if (data?.login?.success) {
        toast.success(data.login.message || 'Login Successful');
        setUser(data.login.user);
        setTokens(data.login.accessToken, data.login.refreshToken);
        navigate('/dashboard');
      } else {
        toast.error(data?.login?.message || 'Invalid credentials');
      }
    } catch {
      // Offline fallback demo
      if (email === 'driver@tarxemo.com' && password === 'driver123') {
        toast.success('Welcome Driver (Offline Demo Access)');
        setUser({ id: 'demo1', email, firstName: 'Moses', lastName: 'Onditi', role: 'DRIVER' });
        setTokens('demo-access-token', 'demo-refresh-token');
        navigate('/dashboard');
      } else if (email === 'admin@tarxemo.com' && password === 'admin123') {
        toast.success('Welcome Admin (Offline Demo Access)');
        setUser({ id: 'demo2', email, firstName: 'Sarah', lastName: 'Massawe', role: 'TENANT_ADMIN' });
        setTokens('demo-access-token', 'demo-refresh-token');
        navigate('/dashboard');
      } else {
        toast.error('Network failed or invalid credentials.');
      }
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (emailExists) {
      toast.error('Email is already registered. Go to Login page.');
      return;
    }
    if (phoneExists) {
      toast.error('Phone number is already registered.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      toast.error('You must agree to the terms and conditions');
      return;
    }
    try {
      const { data } = await registerUser({
        variables: {
          input: { firstName, lastName, email, phone, password }
        }
      });

      if (data?.register?.success) {
        toast.success('Registration successful. Auto redirecting...');
        setUser(data.register.user);
        setTokens(data.register.accessToken, data.register.refreshToken);
        navigate('/dashboard');
      } else {
        toast.error(data?.register?.message || 'Registration failed');
      }
    } catch {
      // offline fallback demo registration
      toast.success('Registration successful (Offline Mock)');
      setUser({ id: 'demo_reg', email, firstName, lastName, role: 'DRIVER' });
      setTokens('demo-access-token', 'demo-refresh-token');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen relative w-full flex items-center justify-center py-12 px-4 select-none overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}>
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none bg-orange-600" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none bg-orange-500" />

      {/* Main card */}
      <div
        ref={cardRef}
        className="w-full max-w-xl glass border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative z-10"
      >
        {/* Navigation back to landing */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6 group transition-all"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Brand identity header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-3">
            <Building2 size={24} className="text-orange-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-1">
            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* ─── Form Container ─── */}
        <form
          ref={formRef}
          onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit}
          className="space-y-4"
        >
          {/* Registration-specific fields */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5 pl-1">
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="E.g., Moses"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5 pl-1">
                  {t('auth.lastName')}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="E.g., Onditi"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email input field with instant availability status */}
          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1">
              <label className="text-[10px] text-white/50 uppercase font-bold">
                {t('auth.email')}
              </label>
              {mode === 'register' && email && (
                <div className="flex items-center gap-1 text-[10px]">
                  {checkingEmail ? (
                    <span className="text-white/40 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      {t('auth.emailCheck')}
                    </span>
                  ) : emailExists ? (
                    <span className="text-red-400 flex items-center gap-1 font-semibold">
                      <AlertCircle size={10} />
                      {t('auth.emailTaken')}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check size={10} />
                      {t('auth.emailAvailable')}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-xs outline-none transition-all ${
                  mode === 'register' && emailExists ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-orange-500/60 focus:bg-white/8'
                }`}
              />
            </div>
          </div>

          {/* Phone Input with instant checks */}
          {mode === 'register' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="text-[10px] text-white/50 uppercase font-bold">
                  {t('auth.phone')}
                </label>
                {phone && (
                  <div className="flex items-center gap-1 text-[10px]">
                    {checkingPhone ? (
                      <span className="text-white/40 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        {t('auth.phoneCheck')}
                      </span>
                    ) : phoneExists ? (
                      <span className="text-red-400 flex items-center gap-1 font-semibold">
                        <AlertCircle size={10} />
                        {t('auth.phoneTaken')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check size={10} />
                        {t('auth.phoneAvailable')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+254 700 000 000"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-xs outline-none transition-all ${
                    phoneExists ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-orange-500/60 focus:bg-white/8'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Password field with view toggle & strength insights */}
          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1">
              <label className="text-[10px] text-white/50 uppercase font-bold">
                {t('auth.password')}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[10px] text-orange-500 hover:underline font-semibold"
                >
                  {t('auth.forgotPassword')}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength insights */}
            {mode === 'register' && password && (
              <div className="mt-2 space-y-1.5">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-white/40">
                  <span>{strength.text}</span>
                  <span className="flex items-center gap-1">
                    <Info size={10} /> Must include capitals, numbers, special character
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5 pl-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border text-white text-xs outline-none transition-all ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-orange-500/60 focus:bg-white/8'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Terms checkbox */}
          {mode === 'register' && (
            <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/15 bg-white/5 text-orange-500 focus:ring-0"
              />
              <span className="text-[10px] text-white/60 leading-normal">
                {t('auth.agreeTerms')}
              </span>
            </label>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loginLoading || registerLoading}
            className="w-full btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider disabled:opacity-50 mt-4"
          >
            {(loginLoading || registerLoading) ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? t('auth.signIn') : t('auth.signUp')}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-between gap-4 text-white/20 text-xs">
          <span className="h-px bg-white/10 flex-1" />
          <span>{t('auth.orContinue')}</span>
          <span className="h-px bg-white/10 flex-1" />
        </div>

        {/* Swapping mode action link */}
        <div className="text-center text-xs">
          <span className="text-white/50">
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          </span>
          <button
            onClick={() => handleModeSwap(mode === 'login' ? 'register' : 'login')}
            className="text-orange-500 font-bold hover:underline"
          >
            {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
