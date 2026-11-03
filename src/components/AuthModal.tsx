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
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../lib/storage';
import {
  getStoredSupabaseConfig,
  getSupabaseClient,
  signUpWithSupabase,
  signInWithSupabase,
  resendVerificationEmail,
  verifyProjectEmailConfirmationSettings,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenSupabaseModal: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onOpenSupabaseModal,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
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
  const [authSettingsDetails, setAuthSettingsDetails] = useState('');

  const config = getStoredSupabaseConfig();
  const isSupabaseReady = config.isConnected && !!config.url && !!config.anonKey;

  useEffect(() => {
    if (isOpen && isSupabaseReady) {
      verifyProjectEmailConfirmationSettings().then((res) => {
        setEmailConfirmEnforced(res.enforced);
        setAuthSettingsDetails(res.details);
      });
    }
  }, [isOpen, isSupabaseReady]);

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
      setError('Please provide both email and password.');
      return;
    }

    if (!isSupabaseReady) {
      setError(
        'Supabase Cloud is not connected yet. Real authentication requires connecting your project URL and Publishable/Anon key.'
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
          setError(result.message);
        }
        return;
      }

      if (result.user) {
        onSelectUser(result.user);
        setSuccessMsg(`Welcome, ${result.user.name}!`);
        setTimeout(() => {
          onClose();
        }, 600);
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

  const handleSelectDemo = (user: UserProfile) => {
    const demoUser: UserProfile = {
      ...user,
      isDemo: true,
      isSupabaseUser: false,
      isEmailVerified: true, // Demo personas bypass verification for UI testing
    };
    onSelectUser(demoUser);
    setSuccessMsg(`Switched to Demo Persona: ${user.name}`);
    setTimeout(() => {
      onClose();
    }, 500);
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
          <h2 className="text-xl font-bold text-white">CareerPilot AI Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your verified Supabase Cloud account or explore with an instant Sandbox persona.
          </p>
        </div>

        {/* Supabase Email Confirmation Status Banner */}
        <div className="mb-4 p-3 rounded-xl bg-[#090b10] border border-[#1e2638] flex items-start gap-2.5 text-[11px]">
          <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Supabase Cloud Auth</span>
              {emailConfirmEnforced !== null && (
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
                ? 'Authentication is powered directly by your live Supabase project. Unverified emails are strictly blocked from dashboard access.'
                : 'Supabase is not connected. Configure credentials to enable real login.'}
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
              A verification link was dispatched to your email address. Because Supabase email confirmation is enabled,
              you <strong>cannot sign in or access the dashboard</strong> until your email is confirmed.
            </p>

            <div className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>How to verify:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Check your inbox (and spam folder) for the Supabase confirmation link.</li>
                <li>
                  <span className="text-slate-300">In Supabase Studio (for testing):</span> Go to{' '}
                  <code className="text-amber-300">Authentication &gt; Users</code>, click{' '}
                  <code className="text-amber-300">...</code> next to this email, and click <strong>"Confirm user"</strong>.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending || resendCooldown > 0}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {resending
                  ? 'Sending...'
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
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#131826] border border-[#1e2638]"
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
                  mode === 'signin' ? 'bg-[#131826] text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
                  mode === 'signup' ? 'bg-[#131826] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account (Supabase)
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

            {/* Real Supabase Form */}
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
                    <option value="fresher">Fresher / Recent Graduate (0-1 Yrs)</option>
                    <option value="jobseeker">Active Job Seeker (1+ Yrs)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Default role is safely assigned server-side; accounts start on the free tier.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isSupabaseReady}
                className="w-full mt-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-colors shadow-md shadow-violet-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting to Supabase...</span>
                  </>
                ) : mode === 'signin' ? (
                  'Sign In to CareerPilot'
                ) : (
                  'Register with Supabase'
                )}
              </button>
            </form>

            {/* Offline Sandbox Personas Section */}
            <div className="mt-6 pt-5 border-t border-[#1e2638]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Sandbox Demo Personas
                </span>
                <span className="text-[10px] text-slate-500">For offline UI testing</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Need to preview dashboard layouts without email confirmation? Use these instant pre-seeded profiles:
              </p>

              <div className="flex flex-col gap-2">
                {DEMO_USERS.map((user) => {
                  const isSelected = currentUser.id === user.id && currentUser.isDemo;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectDemo(user)}
                      className={`flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-violet-950/60 border border-violet-600/50 text-white'
                          : 'bg-[#090b10] border border-[#1e2638] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover border border-violet-500/30"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            {user.name}
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                              DEMO
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[210px]">{user.headline}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Supabase link */}
        <div className="mt-5 pt-4 border-t border-[#1e2638] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className={`w-3.5 h-3.5 ${isSupabaseReady ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isSupabaseReady ? 'Supabase Connected' : 'Supabase Not Configured'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSupabaseModal();
            }}
            className="text-cyan-400 hover:underline font-medium"
          >
            Configure Keys & Schema
          </button>
        </div>
      </div>
    </div>
  );
};
