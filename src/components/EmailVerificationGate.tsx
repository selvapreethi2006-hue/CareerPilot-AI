import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Mail,
  Send,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  resendVerificationEmail,
  fetchCurrentSupabaseUser,
  getSupabaseClient,
} from '../lib/supabase';

interface EmailVerificationGateProps {
  email: string;
  onVerified: () => void;
  onSignOut: () => void;
  onOpenSupabaseModal: () => void;
}

export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({
  email,
  onVerified,
  onSignOut,
  onOpenSupabaseModal,
}) => {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    setResending(true);
    setFeedback(null);
    const res = await resendVerificationEmail(email);
    setResending(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setCountdown(30);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data.user && (data.user.email_confirmed_at || (data.user as any).confirmed_at)) {
          setFeedback({
            type: 'success',
            message: 'Email confirmed! Unlocking your dashboard...',
          });
          setTimeout(() => {
            onVerified();
          }, 800);
          setChecking(false);
          return;
        }
      } catch (e) {
        console.warn('Status check error:', e);
      }
    }

    setChecking(false);
    setFeedback({
      type: 'error',
      message:
        'Email is still unverified. Please check your inbox and click the verification link, or confirm the user in Supabase Studio.',
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="p-8 rounded-2xl bg-[#0e121b] border-2 border-amber-500/40 shadow-2xl shadow-amber-950/20 text-center space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-700/50 text-amber-400">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-semibold">
            Security Enforcement · Email Confirmation Required
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-3">
            Verify Your Email to Access CareerPilot
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
            Supabase email verification is actively enforced on this project. Unverified users are blocked from dashboard and workspace features to protect account integrity.
          </p>
        </div>

        {/* Email banner */}
        <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-xs max-w-md mx-auto flex items-center justify-center gap-2">
          <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400">Target Email:</span>
          <span className="font-mono text-white font-semibold break-all">{email}</span>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs max-w-md mx-auto flex items-start gap-2 text-left ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/60 border border-red-800/60 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* How to confirm guide */}
        <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] text-[11px] text-slate-400 max-w-md mx-auto text-left space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Info className="w-4 h-4" />
            <span>How to complete verification:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
            <li>
              <strong>Check your inbox & spam folder</strong> for the confirmation link sent by Supabase.
            </li>
            <li>
              <strong>Click the confirmation link</strong> in the email to activate your account.
            </li>
            <li>
              <span className="text-slate-300">For developers / testing in Supabase Studio:</span> Go to{' '}
              <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">Authentication &gt; Users</code>, click{' '}
              <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">... (Actions)</code> next to this email &rarr;{' '}
              <strong>"Confirm user"</strong>.
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : "I've Verified, Check Status"}</span>
          </button>

          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="w-full sm:w-auto py-2.5 px-4 rounded-lg text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{resending ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : 'Resend Email'}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-[#1e2638] flex items-center justify-between text-xs text-slate-400 max-w-md mx-auto">
          <button
            onClick={onOpenSupabaseModal}
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Database className="w-3.5 h-3.5" />
            Supabase Studio Settings
          </button>

          <button
            onClick={onSignOut}
            className="text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out / Switch Persona
          </button>
        </div>
      </div>
    </div>
  );
};
