import React, { useState } from 'react';
import {
  Target,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  TrendingUp,
  Layers,
  ChevronRight,
  ExternalLink,
  History,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, SkillGapResult } from '../types';
import { storage } from '../lib/storage';

interface SkillGapAnalyzerProps {
  currentUser: UserProfile;
  initialResumeText?: string;
  onNavigateToRoadmap?: (role: string, skills: string[]) => void;
  onNavigateToJobs?: (role: string) => void;
}

const COMMON_ROLES = [
  'AI / Machine Learning Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Python Developer',
  'Data Scientist',
  'Cloud / DevOps Engineer',
  'Mobile App Developer',
  'Cybersecurity Analyst',
];

export const SkillGapAnalyzer: React.FC<SkillGapAnalyzerProps> = ({
  currentUser,
  initialResumeText = '',
  onNavigateToRoadmap,
  onNavigateToJobs,
}) => {
  const [resumeText, setResumeText] = useState<string>(
    initialResumeText || storage.getMasterResumeText(currentUser.id)
  );
  const [targetRole, setTargetRole] = useState<string>(
    currentUser.targetRole || 'AI / Machine Learning Engineer'
  );
  const [customJobTitle, setCustomJobTitle] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeAnalysis, setActiveAnalysis] = useState<SkillGapResult | null>(() => {
    const saved = storage.getSkillGapAnalyses(currentUser.id);
    return saved[0] || null;
  });

  const savedAnalyses = storage.getSkillGapAnalyses(currentUser.id);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please provide or upload your resume text to analyze skills accurately.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          targetRole,
          customJobTitle: customJobTitle.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: SkillGapResult = await response.json();
      setActiveAnalysis(data);
      storage.saveSkillGapAnalysis(data, currentUser.id);
    } catch (err: any) {
      console.error('Skill gap analysis failed:', err);
      setError('Failed to complete AI skill gap analysis. Please verify your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950/70 border border-red-800 text-red-300">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/70 border border-amber-800 text-amber-300">
            Medium Priority
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/70 border border-blue-800 text-blue-300">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Skill Gap Analyzer
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-950 border border-violet-800 text-cyan-300">
                Precision Matching
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Benchmark your verified resume competencies against target job roles, identify critical missing skills, and build a personalized closure plan.
            </p>
          </div>
        </div>

        {savedAnalyses.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#090b10] border border-[#1e2638] px-3 py-2 rounded-xl">
            <History className="w-4 h-4 text-cyan-400" />
            <span>{savedAnalyses.length} analyses on record</span>
          </div>
        )}
      </div>

      {/* Main Grid: Inputs & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Target Career Role
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Predefined Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {COMMON_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Or Custom Job Title (Optional)
              </label>
              <input
                type="text"
                value={customJobTitle}
                onChange={(e) => setCustomJobTitle(e.target.value)}
                placeholder="e.g. Senior MLOps Engineer, GenAI Prompt Specialist"
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Job Description (Optional for JD-specific matching)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste the target job description requirements here for hyper-targeted gap detection..."
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  Your Resume Text
                </label>
                <button
                  type="button"
                  onClick={() => setResumeText(storage.getMasterResumeText(currentUser.id))}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Reload Master Resume
                </button>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={7}
                placeholder="Paste your plain text resume or upload from the Resume Analyzer..."
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Auditing Skill Matrix with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Run AI Skill Gap Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output: 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {activeAnalysis ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Summary Scorecard */}
              <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400">
                    Role Benchmark Result
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {activeAnalysis.customJobTitle || activeAnalysis.targetRole}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {activeAnalysis.summaryVerdict}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800 stroke-current"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${
                          activeAnalysis.skillMatchPercentage >= 75
                            ? 'text-emerald-400'
                            : activeAnalysis.skillMatchPercentage >= 55
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        } stroke-current`}
                        strokeDasharray={`${activeAnalysis.skillMatchPercentage}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-mono text-base font-bold text-white">
                        {activeAnalysis.skillMatchPercentage}%
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase">Match</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing vs Missing Skills Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verified Skills */}
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                  <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Verified Strengths ({activeAnalysis.existingSkills.technical.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAnalysis.existingSkills.technical.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/50 border border-emerald-800/60 text-emerald-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {activeAnalysis.existingSkills.soft?.length > 0 && (
                    <div className="pt-2 border-t border-[#1e2638]">
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                        Soft & Professional Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeAnalysis.existingSkills.soft.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                  <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Priority Missing Skills ({activeAnalysis.missingSkills.length})
                  </h4>
                  <div className="space-y-2">
                    {activeAnalysis.missingSkills.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#090b10] border border-[#1e2638] text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{item.skill}</span>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <p className="text-[11px] text-slate-400">{item.rationale}</p>
                        {item.recommendedLearningResource && (
                          <div className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3" />
                            <span>Resource: {item.recommendedLearningResource}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Partially Matching & Experience Gaps */}
              {activeAnalysis.partiallyMatchingSkills?.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                  <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Partially Matching Skills (Upskill Recommended)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeAnalysis.partiallyMatchingSkills.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#090b10] border border-amber-900/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-200">{item.skill}</span>
                          <span className="text-[10px] font-mono text-amber-400">
                            {item.estimatedTimeToLearn || '1 week'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{item.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personalized Improvement Plan */}
              {activeAnalysis.personalizedImprovementPlan?.length > 0 && (
                <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Personalized Skill Closure Plan
                    </h4>
                    {onNavigateToRoadmap && (
                      <button
                        onClick={() =>
                          onNavigateToRoadmap(
                            activeAnalysis.targetRole,
                            activeAnalysis.missingSkills.map((s) => s.skill)
                          )
                        }
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <span>Open Complete Roadmap</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {activeAnalysis.personalizedImprovementPlan.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300">{phase.phase}</span>
                          <span className="text-[11px] font-mono text-slate-400">{phase.focus}</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {phase.actions.map((act, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                          <span className="font-semibold text-slate-300">Deliverable:</span>
                          <span className="font-mono text-emerald-400">{phase.deliverable}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onNavigateToRoadmap && (
                  <button
                    onClick={() =>
                      onNavigateToRoadmap(
                        activeAnalysis.targetRole,
                        activeAnalysis.missingSkills.map((s) => s.skill)
                      )
                    }
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-900/30"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-200" />
                    <span>Generate Guided Learning Roadmap</span>
                  </button>
                )}

                {onNavigateToJobs && (
                  <button
                    onClick={() => onNavigateToJobs(activeAnalysis.targetRole)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-[#131826] border border-[#1e2638] hover:border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Browse Matching Jobs</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Active Skill Gap Audit</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Select your target career role on the left, verify your resume text, and run the audit to uncover your skill alignment and personalized learning tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
