import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  Check,
  Database,
  Sparkles,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  ExternalLink,
  Info,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import {
  getStoredSupabaseConfig,
  signUpWithSupabase,
  signInWithSupabase,
  resendVerificationEmail,
  verifyProjectEmailConfirmationSettings,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onOpenSupabaseModal: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onOpenSupabaseModal,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('fresher');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Supabase Auth Settings Verification
  const [emailConfirmEnforced, setEmailConfirmEnforced] = useState<boolean | null>(null);

  const config = getStoredSupabaseConfig();
  const isSupabaseReady = config.isConnected && !!config.url && !!config.anonKey;

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
      if (isSupabaseReady) {
        verifyProjectEmailConfirmationSettings().then((res) => {
          setEmailConfirmEnforced(res.enforced);
        });
      }
    }
  }, [isOpen, initialMode, isSupabaseReady]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    if (!isSupabaseReady) {
      setError(
        'Supabase Cloud is not configured yet. Real authentication requires connecting your project URL and Publishable/Anon key.'
      );
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const cleanName = name.trim() || cleanEmail.split('@')[0];
      const result = await signUpWithSupabase(cleanEmail, password, cleanName);
      setLoading(false);

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setVerificationPending(true);
        setPendingEmail(cleanEmail);
        setSuccessMsg(result.message);
      } else {
        setSuccessMsg('Account created successfully! You can now sign in.');
        setMode('signin');
      }
    } else {
      // Sign In Flow
      const result = await signInWithSupabase(cleanEmail, password);
      setLoading(false);

      if (!result.success) {
        if (result.isUnconfirmed) {
          setVerificationPending(true);
          setPendingEmail(cleanEmail);
          setError(result.message);
        } else {
          // Provide user-friendly messages for standard auth errors
          const lowMsg = result.message.toLowerCase();
          if (lowMsg.includes('invalid login credentials') || lowMsg.includes('invalid_grant')) {
            setError('Invalid email or password. Please verify your credentials and try again.');
          } else {
            setError(result.message);
          }
        }
        return;
      }

      if (result.user) {
        onSelectUser(result.user);
        setSuccessMsg(`Welcome back, ${result.user.name}!`);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    }
  };

  const handleResendEmail = async () => {
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail) return;

    setResending(true);
    const res = await resendVerificationEmail(targetEmail);
    setResending(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setResendCooldown(30);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0e121b] border border-[#1e2638] shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/40 text-violet-400 mb-3">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'Sign In to CareerPilot AI' : 'Create Real Supabase Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signin'
              ? 'Access your saved resumes, job tracker pipelines, and ATS audits.'
              : 'Sign up with your personal email. Real email verification enforced.'}
          </p>
        </div>

        {/* Supabase Connection Status Banner */}
        <div className="mb-4 p-3 rounded-xl bg-[#090b10] border border-[#1e2638] flex items-start gap-2.5 text-[11px]">
          <Database className={`w-4 h-4 shrink-0 mt-0.5 ${isSupabaseReady ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Supabase Cloud Authentication</span>
              {isSupabaseReady && emailConfirmEnforced !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    emailConfirmEnforced
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : 'bg-amber-950 border border-amber-800 text-amber-300'
                  }`}
                >
                  {emailConfirmEnforced ? 'Email Verification Enforced' : 'Auto-Confirm Active'}
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              {isSupabaseReady
                ? 'Directly integrated with your Supabase project. Passwords and sessions are cryptographically secured.'
                : 'Supabase credentials not yet detected. Click below to enter your Project URL and Publishable Key.'}
            </p>
          </div>
        </div>

        {/* Verification Pending Screen */}
        {verificationPending ? (
          <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
                <Mail className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Email Verification Required</h3>
                <p className="text-xs text-amber-200/90 font-mono break-all">{pendingEmail}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A verification link was dispatched to your email address by Supabase.
              You <strong>must confirm your email before accessing the dashboard</strong>.
            </p>

            <div className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Next steps:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Check your inbox (and spam/promotions folder) for the confirmation email.</li>
                <li>Click the confirmation link to activate your account.</li>
                <li>Return here to sign in with your email and password.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending || resendCooldown > 0}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                {resending
                  ? 'Sending fresh email...'
                  : resendCooldown > 0
                  ? `Wait ${resendCooldown}s to Resend`
                  : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationPending(false);
                  setMode('signin');
                  setEmail(pendingEmail);
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#131826] border border-[#1e2638] transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab switch */}
            <div className="flex p-1 bg-[#090b10] rounded-lg border border-[#1e2638] mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'signin' ? 'bg-[#131826] text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'signup' ? 'bg-[#131826] text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Supabase Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-[10px] text-slate-500 mt-1">Minimum 6 characters required.</p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Career Stage</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="student">College / University Student</option>
                    <option value="fresher">Fresher / Recent Graduate (0-1 Yrs Exp)</option>
                    <option value="jobseeker">Active Job Seeker (1+ Yrs Exp)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isSupabaseReady}
                className="w-full mt-3 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition-all shadow-md shadow-violet-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting to Supabase...</span>
                  </>
                ) : mode === 'signin' ? (
                  'Sign In with Supabase'
                ) : (
                  'Register & Send Verification Link'
                )}
              </button>
            </form>
          </>
        )}

        {/* Supabase Configuration Link */}
        <div className="mt-5 pt-4 border-t border-[#1e2638] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className={`w-3.5 h-3.5 ${isSupabaseReady ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isSupabaseReady ? 'Supabase Ready' : 'Supabase Not Configured'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSupabaseModal();
            }}
            className="text-cyan-400 hover:underline font-medium"
          >
            Configure Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
