import React from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Info,
  Layers,
  Heart,
  Globe,
  FileText,
  Target,
  Mail,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { UserProfile } from '../types';

interface PricingPageProps {
  currentUser: UserProfile | null;
  onUserUpdated?: (user: UserProfile) => void;
  onNavigate?: (page: string) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ currentUser, onNavigate, onOpenAuth }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          100% Free Public Launch Edition · Zero Billing
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          All AI Career Tools Unlocked. Zero Fees.
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          CareerPilot AI is launched with <strong className="text-cyan-400">100% free, unlimited access</strong> for students, freshers, and job seekers worldwide. No credit cards, no paywalls, and no subscription fees.
        </p>

        {/* Deployment & Zero-Billing Architecture Badge */}
        <div className="pt-2">
          <div className="p-4 rounded-xl bg-[#0e121b] border border-cyan-800/40 text-left flex items-start gap-3.5 shadow-xl">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-white flex items-center gap-2">
                Public Deployment Notice · No Billing Required
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                  Active
                </span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                You can deploy and use this web application immediately without configuring any payment processor (Stripe or Razorpay). All Gemini 3.8 Flash analysis tools, resume scoring engines, and job tracking features are fully unlocked for every registered user.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Unlocked Plan Showcase */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Left: Full Access Card */}
        <div className="md:col-span-7 p-8 rounded-2xl bg-gradient-to-b from-[#131826] to-[#0e121b] border-2 border-cyan-500/50 flex flex-col justify-between relative shadow-2xl shadow-cyan-950/30">
          <div className="absolute -top-3 right-8 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-200" />
            <span>Fully Unlocked</span>
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Universal Access Plan
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Community Launch Edition</h3>
              <p className="text-xs text-slate-400 mt-1">
                Full-stack AI career acceleration for every candidate worldwide.
              </p>
            </div>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-mono">$0</span>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                Free Forever · No Payment Gateway Required
              </span>
            </div>

            <ul className="space-y-3 pt-4 border-t border-[#1e2638] text-xs text-slate-200">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">Unlimited Gemini 3.8 Flash Resume Audits</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">Targeted Job Description Matcher & Gap Analysis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Tone Cover Letter Generator (Enthusiastic, Direct, Professional)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full Kanban Job Application Tracker & Interview Calendar</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom STAR Behavioral Interview Coach for every tracked job</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Format Resume Support (PDF, DOCX, TXT, Markdown)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configurable Supabase Cloud Sync & Verified Email Auth</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <div className="w-full py-3 text-center text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Platform Access Active on Your Account</span>
            </div>
          </div>
        </div>

        {/* Right: Account Status & Future Roadmap */}
        <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Current User Status Box */}
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Your Account Summary
            </h4>

            <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Account:</span>
                <span className="font-semibold text-white">
                  {currentUser ? currentUser.name : 'Guest Visitor'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Status:</span>
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {currentUser ? 'Supabase Verified' : 'Free Public Access'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>AI Quota:</span>
                <span className="font-mono text-cyan-400 font-bold">Unlimited</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Cost:</span>
                <span className="font-mono text-slate-300 font-medium">$0.00 / Zero Billing</span>
              </div>
            </div>

            {currentUser ? (
              onNavigate && (
                <button
                  onClick={() => onNavigate('resume-analyzer')}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-900/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  Go to Resume Analyzer
                </button>
              )
            ) : (
              <button
                onClick={() => onOpenAuth && onOpenAuth('signup')}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-900/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                Sign Up for Free Account
              </button>
            )}
          </div>

          {/* Future Roadmap Card */}
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-3">
            <div className="flex items-center gap-2 text-violet-400">
              <Layers className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Future Extensibility Roadmap
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you decide to monetize in a future phase, you can plug in Stripe or Razorpay webhooks for enterprise recruiter seats or multi-campus university licenses. The underlying database and backend architecture are already modular and ready.
            </p>
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Ready for future Stripe / Razorpay webhooks
            </div>
          </div>
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-white text-center">
          What is included in the Free Public Launch?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">ATS Resume Auditor</h4>
            <p className="text-[11px] text-slate-400">
              In-depth scoring, action verb counts, and impact bullet point rewrites.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-violet-950/80 border border-violet-800 flex items-center justify-center text-violet-400">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Job Description Matcher</h4>
            <p className="text-[11px] text-slate-400">
              Semantic alignment comparison, missing keywords, and recruiter rubric checks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Cover Letter Creator</h4>
            <p className="text-[11px] text-slate-400">
              Tailored, company-specific letters with custom tones and instant download.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Application Tracker</h4>
            <p className="text-[11px] text-slate-400">
              Visual Kanban board, interview dates, contact notes, and STAR coaching.
            </p>
          </div>
        </div>
      </div>

      {/* University & Campus Program */}
      <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800 flex items-center justify-center text-violet-300 shrink-0">
            <GraduationCap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">University & Student Cohorts Program</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Empowering college placement cells, coding bootcamps, and student engineering clubs worldwide at zero cost.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-lg bg-[#131826] border border-[#1e2638] text-xs text-slate-300 font-mono">
          partnerships@careerpilot.ai
        </div>
      </div>
    </div>
  );
};
