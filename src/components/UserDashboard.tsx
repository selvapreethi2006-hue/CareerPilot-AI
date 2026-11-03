import React from 'react';
import {
  FileText,
  Target,
  Mail,
  Briefcase,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  BookOpen
} from 'lucide-react';
import { UserProfile, JobApplication, ResumeAnalysisResult } from '../types';
import { storage } from '../lib/storage';

interface UserDashboardProps {
  currentUser: UserProfile;
  onNavigate: (page: string) => void;
  onSelectApplicationForPrep: (app: JobApplication) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onNavigate,
  onSelectApplicationForPrep,
}) => {
  const applications = storage.getApplications();
  const savedResumes = storage.getSavedResumes();

  const activeApps = applications.filter((a) => a.status !== 'rejected');
  const interviews = applications.filter((a) => a.status === 'interviewing');
  const offers = applications.filter((a) => a.status === 'offered');

  const latestResume = savedResumes[0];
  const atsScore = latestResume?.atsScore || 78;

  // Composite Readiness Score
  const readinessScore = Math.min(
    98,
    Math.round(atsScore * 0.5 + (activeApps.length > 0 ? 30 : 10) + (interviews.length > 0 ? 15 : 5))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-36 -bottom-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-14 h-14 rounded-xl object-cover border-2 border-violet-500/50 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, {currentUser.name}
              </h1>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                100% FREE PUBLIC ACCESS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {currentUser.headline} · {currentUser.universityOrCompany}
            </p>
          </div>
        </div>

        {/* Usage Tracker */}
        <div className="flex flex-col sm:items-end justify-center relative z-10 p-3 rounded-xl bg-[#090b10]/80 border border-[#1e2638] sm:min-w-[220px]">
          <div className="flex items-center justify-between w-full text-xs mb-1.5">
            <span className="text-slate-400">Monthly AI Allowance:</span>
            <span className="font-mono font-bold text-cyan-400">
              ∞ Unlimited Free Access
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 w-full" />
          </div>
          <div className="mt-2 flex items-center justify-between w-full text-[11px]">
            <span className="text-slate-500 font-mono">
              {currentUser.monthlyAnalysisCount} audits run
            </span>
            <button
              onClick={() => onNavigate('pricing')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              All Features Unlocked
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metrics & Readiness Score Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Dial Card */}
        <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Readiness Index
            </span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {readinessScore}
              <span className="text-xs text-cyan-400 font-normal"> / 100</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {readinessScore > 80 ? 'Highly Competitive' : 'Moderate Alignment'}
            </p>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800 stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 stroke-current"
                strokeDasharray={`${readinessScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-white">
              {readinessScore}%
            </span>
          </div>
        </div>

        {/* ATS Score Card */}
        <div
          onClick={() => onNavigate('resume-analyzer')}
          className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] hover:border-violet-500/50 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Latest ATS Score
            </span>
            <FileText className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {atsScore}
              <span className="text-xs text-violet-400 font-normal"> / 100</span>
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {latestResume?.targetRoleDetected || 'Full-Stack Developer'}
            </div>
          </div>
          <div className="text-[11px] text-violet-400 flex items-center gap-1 font-medium">
            View full analysis <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Active Applications Card */}
        <div
          onClick={() => onNavigate('tracker')}
          className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] hover:border-emerald-500/50 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Tracked Pipelines
            </span>
            <Briefcase className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {applications.length}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeApps.length} active in evaluation
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            Open Kanban board <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Upcoming Interviews & Offers */}
        <div
          onClick={() => onNavigate('tracker')}
          className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] hover:border-cyan-500/50 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Interviews & Offers
            </span>
            <Calendar className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {interviews.length}
                </span>
                <span className="text-xs text-slate-400 ml-1">Interviews</span>
              </div>
              <span className="text-slate-600">|</span>
              <div>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {offers.length}
                </span>
                <span className="text-xs text-slate-400 ml-1">Offer</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1 font-medium">
            Launch interview prep <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Quick Action Launchpad
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('resume-analyzer')}
                className="flex items-start gap-3.5 p-4 rounded-lg bg-[#090b10] border border-[#1e2638] hover:border-violet-500/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-950/80 border border-violet-800/40 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-violet-300">
                    Audit Resume
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Upload or paste resume text for instant ATS scoring and bullet improvements.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('job-matcher')}
                className="flex items-start gap-3.5 p-4 rounded-lg bg-[#090b10] border border-[#1e2638] hover:border-cyan-500/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300">
                    Match Job Description
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Paste target JD to check missing keywords and calculate interview odds.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('cover-letter')}
                className="flex items-start gap-3.5 p-4 rounded-lg bg-[#090b10] border border-[#1e2638] hover:border-indigo-500/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-indigo-300">
                    Generate Cover Letter
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Draft a tailored letter matching company values and your specific stack.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('tracker')}
                className="flex items-start gap-3.5 p-4 rounded-lg bg-[#090b10] border border-[#1e2638] hover:border-emerald-500/60 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-emerald-300">
                    Log Job Application
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Track statuses, interview dates, salary, and notes in one unified view.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Tracked Jobs Table */}
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Recent Applications
              </h2>
              <button
                onClick={() => onNavigate('tracker')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                View all ({applications.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e2638] text-slate-400">
                    <th className="pb-2.5 font-medium">Company & Role</th>
                    <th className="pb-2.5 font-medium">Applied</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Interview Prep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638]/50">
                  {applications.slice(0, 4).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-white">{app.companyName}</div>
                        <div className="text-[11px] text-slate-400">{app.jobTitle}</div>
                      </td>
                      <td className="py-3 font-mono text-slate-400">{app.applicationDate}</td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            app.status === 'offered'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : app.status === 'interviewing'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                              : app.status === 'screening'
                              ? 'bg-violet-950/80 text-violet-300 border border-violet-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectApplicationForPrep(app)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#090b10] border border-[#1e2638] text-cyan-300 hover:border-cyan-500 hover:text-white transition-colors"
                        >
                          Prep Q&A
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Weekly Tactical Checklist & Saved Resumes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tactical Checklist */}
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Weekly Career Checklist
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] flex items-start gap-2">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-cyan-500" />
                <span className="text-slate-300 line-through">
                  Complete baseline ATS resume audit (Score: 86)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] flex items-start gap-2">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-cyan-500" />
                <span className="text-slate-300 line-through">
                  Tailor keywords for Stripe Frontend Engineer role
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 rounded text-cyan-500" />
                <span className="text-slate-300">
                  Practice STAR responses for upcoming Datadog / Stripe rounds
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 rounded text-cyan-500" />
                <span className="text-slate-300">
                  Add 2 new target engineering roles to application pipeline
                </span>
              </div>
            </div>
          </div>

          {/* Saved Resume History */}
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Saved Resume Audits
            </h2>
            {savedResumes.length === 0 ? (
              <p className="text-xs text-slate-500">No audits saved yet.</p>
            ) : (
              <div className="space-y-2">
                {savedResumes.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onNavigate('resume-analyzer')}
                    className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] hover:border-violet-500/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {res.candidateName} — {res.targetRoleDetected}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(res.timestamp).toLocaleDateString()} · {res.experienceLevel}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {res.atsScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
