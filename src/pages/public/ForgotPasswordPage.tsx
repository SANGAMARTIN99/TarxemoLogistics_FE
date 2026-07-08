import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  Mail, KeyRound, Lock, ArrowLeft, ArrowRight,
  Send, Flame, MailOpen, Eye, EyeOff
} from 'lucide-react';

import { REQUEST_PASSWORD_RESET, VERIFY_OTP, RESET_PASSWORD } from '../../api/mutations';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Reset steps: 1 = Email validation, 2 = OTP check, 3 = Reset Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification codes/tokens
  const [resetToken, setResetToken] = useState('');
  const [mockOtpCode, setMockOtpCode] = useState('284719'); // Simulated OTP sent to email

  // Timer states
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);

  // Form input validation status
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Refs for animations
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const emailSandboxRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // APOLLO GRAPHQL MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [requestReset, { loading: requestLoading }] = useMutation(REQUEST_PASSWORD_RESET);
  const [verifyOtp, { loading: verifyLoading }] = useMutation(VERIFY_OTP);
  const [resetPassword, { loading: resetLoading }] = useMutation(RESET_PASSWORD);

  // ─────────────────────────────────────────────────────────────────────────────
  // GSAP ON-LOAD ANIMATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftPaneRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        emailSandboxRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15 }
      );
    });
    return () => ctx.revert();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // OTP COUNTDOWN TIMER EFFECT
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || countdown <= 0) {
      if (countdown === 0) setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtpCode(generatedCode);
      setCountdown(120);
      setCanResend(false);

      const { data } = await requestReset({ variables: { email } });
      if (data?.requestPasswordReset?.success) {
        toast.success('A new OTP security token has been dispatched!');
      } else {
        toast.error('Unable to request OTP code. Check connection.');
      }
    } catch {
      toast.success('Simulated: Code resent successfully!');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: SUBMIT EMAIL FOR RESET REQUEST
  // ─────────────────────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      // Step 1 check if email exists. The server responds with success if the account is present.
      const { data } = await requestReset({ variables: { email } });
      
      if (data?.requestPasswordReset?.success) {
        toast.success(data.requestPasswordReset.message || 'OTP code sent successfully!');
        
        // Generate and log mock code for ease of local validation
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setMockOtpCode(generatedCode);
        
        // Advance to step 2 (OTP code input verification)
        setStep(2);
      } else {
        setEmailError(data?.requestPasswordReset?.message || 'Email does not exist in our systems');
        toast.error('Email verification check failed');
      }
    } catch (err: any) {
      // In case backend is offline, we fall back to a mock demo flow for presentation
      toast.error('Backend server offline. Simulating recovery pipeline...');
      const demoCode = '482937';
      setMockOtpCode(demoCode);
      setStep(2);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: VERIFY CODE
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== 6 || isNaN(Number(otp))) {
      setOtpError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      const { data } = await verifyOtp({ variables: { email, otp } });
      if (data?.verifyOtp?.success) {
        setResetToken(data.verifyOtp.resetToken);
        toast.success('Security OTP code verified successfully!');
        setStep(3);
      } else {
        setOtpError(data?.verifyOtp?.message || 'Invalid or expired OTP code');
      }
    } catch {
      // Fallback verification matching the simulated code on the right panel
      if (otp === mockOtpCode) {
        setResetToken('mock-secret-jwt-token-4712893');
        toast.success('Simulated: Code verified successfully!');
        setStep(3);
      } else {
        setOtpError('Invalid OTP code code. Please check the simulated inbox.');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('Passwords do not match');
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: {
          resetToken: resetToken,
          newPassword: newPassword
        }
      });

      if (data?.resetPassword?.success) {
        toast.success('Password updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/auth?mode=login');
        }, 1500);
      } else {
        setPwdError(data?.resetPassword?.message || 'Reset expired. Re-authenticate.');
      }
    } catch {
      toast.success('Simulated: Password updated successfully!');
      setTimeout(() => {
        navigate('/auth?mode=login');
      }, 1500);
    }
  };

  // Analyze strength of the password input
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Weak', color: 'bg-white/10' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-orange-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      
      {/* Background Graphic Nodes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8580A 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left column (Form interface) */}
        <div ref={leftPaneRef} className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md glass border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Link to="/auth?mode=login" className="text-white/60 hover:text-white flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                <ArrowLeft size={14} />
                <span>{t('auth.backToLogin')}</span>
              </Link>
              <span className="badge badge-primary text-[8px]">Step {step} of 3</span>
            </div>

            {/* ─── STEP 1: Enter Email ─── */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">{t('auth.forgotTitle')}</h2>
                  <p className="text-xs text-white/50">{t('auth.forgotSubtitle')}</p>
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="driver@tarxemo.com"
                      className={`input-field text-xs pl-10 ${emailError ? 'error' : ''}`}
                      required
                    />
                  </div>
                  {emailError && <span className="text-[10px] text-red-400 mt-1 block font-bold">{emailError}</span>}
                </div>

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {requestLoading ? 'Checking...' : (
                    <>
                      <span>{t('auth.sendOtp')}</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ─── STEP 2: Enter OTP ─── */}
            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">{t('auth.otpTitle')}</h2>
                  <p className="text-xs text-white/50">{t('auth.otpSubtitle')}</p>
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">6-Digit Security Token</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (otpError) setOtpError('');
                      }}
                      placeholder="Enter 6-digit OTP"
                      className={`input-field text-xs pl-10 font-bold tracking-widest ${otpError ? 'error' : ''}`}
                      required
                    />
                  </div>
                  {otpError && <span className="text-[10px] text-red-400 mt-1 block font-bold">{otpError}</span>}
                </div>

                {/* Resend / Expiry Timer */}
                <div className="flex justify-between items-center text-[10px] font-bold uppercase p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40">{t('auth.otpExpiry')}</span>
                  {countdown > 0 ? (
                    <span className="text-orange-500 font-extrabold">
                      {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-orange-500 font-extrabold hover:underline"
                    >
                      {t('auth.resendOtp')}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {verifyLoading ? 'Verifying OTP...' : (
                    <>
                      <span>{t('auth.verifyOtp')}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ─── STEP 3: Set New Password ─── */}
            {step === 3 && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">{t('auth.newPassword')}</h2>
                  <p className="text-xs text-white/50">Establish a secure and unique system password.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">{t('auth.newPassword')}</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (pwdError) setPwdError('');
                        }}
                        placeholder="••••••••"
                        className={`input-field text-xs pl-9 pr-9 ${pwdError ? 'error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/50 uppercase font-bold mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          if (pwdError) setPwdError('');
                        }}
                        placeholder="••••••••"
                        className={`input-field text-xs pl-9 pr-9 ${pwdError ? 'error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-white/50 uppercase">
                      <span>Password Strength</span>
                      <span className={strength.score === 4 ? 'text-emerald-400' : 'text-orange-400'}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full rounded-full transition-all duration-300 ${
                            i < strength.score ? strength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pwdError && <span className="text-[10px] text-red-400 mt-1 block font-bold">{pwdError}</span>}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full btn btn-primary py-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider disabled:opacity-75"
                >
                  {resetLoading ? 'Resetting Password...' : t('auth.resetPassword')}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Right column: Simulated Inbox displaying gorgeous colorful HTML email */}
        <div ref={emailSandboxRef} className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md glass border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl relative">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4 text-xs font-bold text-white/40">
              <MailOpen size={14} className="text-orange-500" />
              <span>Simulated Inbox Sandbox (Live Verification)</span>
            </div>

            {step === 1 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/30">
                  <Mail size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">No incoming dispatch alerts</h4>
                  <p className="text-[10px] text-white/40 max-w-xs">Enter your email and click Send OTP to dispatch verification codes.</p>
                </div>
              </div>
            ) : (
              /* Beautiful colorful HTML email mockup */
              <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Email Header */}
                <div className="bg-slate-950 p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--gradient-primary)' }}>
                      <Flame size={12} className="text-white" />
                    </div>
                    <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Tarxemo Dispatch</span>
                  </div>
                  <span className="text-[9px] text-white/40">Just now</span>
                </div>

                {/* Email Metadata */}
                <div className="p-3 bg-slate-900/60 border-b border-white/5 text-[9px] text-white/60 space-y-0.5">
                  <p><strong>From:</strong> security-alerts@tarxemo.com</p>
                  <p><strong>To:</strong> {email || 'user@tarxemo.com'}</p>
                  <p><strong>Subject:</strong> Action Required: Secure Account Recovery OTP</p>
                </div>

                {/* Email Body */}
                <div className="p-6 bg-white space-y-5 text-xs text-slate-700 leading-relaxed font-sans">
                  <h3 className="text-sm font-black text-slate-900 border-l-4 border-orange-500 pl-2">
                    Account Verification Code
                  </h3>
                  
                  <p>
                    Hello, <br />
                    We received a request to recover your Tarxemo Logistics platform password. Enter the security code below to establish a new password credential:
                  </p>

                  {/* Dynamic OTP block */}
                  <div className="my-6 p-4 rounded-xl text-center bg-orange-50 border border-orange-100 space-y-1.5">
                    <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest block">Security OTP Code</span>
                    <span className="text-2xl font-black text-orange-500 tracking-[0.4em] block pl-[0.4em]">
                      {mockOtpCode}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Valid for 2 minutes. Do not share this token.</span>
                  </div>

                  <p>
                    If you did not initiate this recovery process, please notify security-audit@tarxemo.com immediately or check with your tenant admin.
                  </p>

                  <div className="pt-4 border-t border-slate-100 text-[9px] text-slate-400">
                    <p>© 2026 Tarxemo Logistics Inc. Nairobi-Dar es Salaam highway corridors.</p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
