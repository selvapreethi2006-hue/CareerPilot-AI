import React, { useState } from 'react';
import {
  Target,
  FileText,
  Briefcase,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  PlusCircle,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { JobMatchResult, UserProfile, JobApplication } from '../types';
import { SAMPLE_RESUME_TEXT, SAMPLE_JOB_DESCRIPTION, storage } from '../lib/storage';

interface JobMatcherProps {
  currentUser: UserProfile;
  initialResumeText?: string;
  onNavigateToCoverLetter: (resumeText: string, jobDesc: string, company: string, title: string) => void;
  onAddApplicationToTracker: (app: Omit<JobApplication, 'id'>) => void;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  currentUser,
  initialResumeText,
  onNavigateToCoverLetter,
  onAddApplicationToTracker,
}) => {
  const [resumeText, setResumeText] = useState(
    initialResumeText || storage.getMasterResumeText() || SAMPLE_RESUME_TEXT
  );
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTION);
  const [companyName, setCompanyName] = useState('Stripe');
  const [jobTitle, setJobTitle] = useState('Junior Frontend Engineer');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(
    storage.getSavedMatches()[0] || null
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);
  const [addedToTracker, setAddedToTracker] = useState(false);

  const handleMatchJob = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both your resume text and the target job description.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/match-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          companyName,
          jobTitle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const enrichedResult: JobMatchResult = {
        ...data,
        id: `match-${Date.now()}`,
        timestamp: new Date().toISOString(),
        companyName,
        jobTitle,
        jobDescriptionText: jobDescription,
      };

      setMatchResult(enrichedResult);
      storage.saveJobMatch(enrichedResult, currentUser.id);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to calculate job alignment. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySkill = (skill: string) => {
    navigator.clipboard.writeText(skill);
    setCopiedSkill(skill);
    setTimeout(() => setCopiedSkill(null), 1500);
  };

  const handleAddToTracker = () => {
    if (!companyName || !jobTitle) return;
    onAddApplicationToTracker({
      companyName,
      jobTitle,
      location: 'Remote / US',
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'wishlist',
      notes: `Targeted match score: ${matchResult?.overallMatchScore || 85}%. Tailored for key requirements.`,
      matchScore: matchResult?.overallMatchScore || 85,
    });
    setAddedToTracker(true);
    setTimeout(() => setAddedToTracker(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2638] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-cyan-400" />
            Job Description Matcher
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare your resume directly against target job descriptions to calculate alignment scores and unearth missing keywords.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setJobDescription(SAMPLE_JOB_DESCRIPTION);
              setCompanyName('Stripe');
              setJobTitle('Junior Frontend Engineer');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e121b] border border-[#1e2638] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load Sample Tech JD
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {addedToTracker && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Job successfully logged to your Application Tracker Kanban board!</span>
        </div>
      )}

      {/* Input Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Input controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
            <span className="text-xs font-semibold text-white uppercase tracking-wider block">
              Target Position Details
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Linear"
                  className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Pasted Job Description</span>
                <span className="font-mono">{jobDescription.trim().split(/\s+/).length} words</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description (responsibilities, requirements, qualifications)..."
                rows={9}
                className="w-full p-3 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Your Resume Text</span>
                <span className="font-mono">{resumeText.trim().split(/\s+/).length} words</span>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Resume text used for matching..."
                rows={6}
                className="w-full p-3 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
              />
            </div>

            <button
              onClick={handleMatchJob}
              disabled={loading}
              className="w-full py-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              {loading ? 'Evaluating Alignment with Gemini 3.8...' : 'Calculate Explainable Match Score'}
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Match Results */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-full min-h-[460px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-t-cyan-400 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" />
              <h3 className="text-base font-semibold text-white">Cross-Referencing Resume & Requirements</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Evaluating core technical keywords, experience hierarchy, and generating tailoring recommendations.
              </p>
            </div>
          ) : matchResult ? (
            <div className="space-y-6">
              {/* Overall Match Hero Card */}
              <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800 stroke-current"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-cyan-400 stroke-current"
                        strokeDasharray={`${matchResult.overallMatchScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-mono text-xl font-bold text-white">
                      {matchResult.overallMatchScore}%
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                        Alignment Score
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span
                        className={`text-xs font-semibold ${
                          matchResult.interviewProbability === 'High'
                            ? 'text-emerald-400'
                            : matchResult.interviewProbability === 'Medium'
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {matchResult.interviewProbability} Interview Probability
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      {companyName} — {jobTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{matchResult.verdict}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleAddToTracker}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Log in Job Tracker
                  </button>

                  <button
                    onClick={() =>
                      onNavigateToCoverLetter(resumeText, jobDescription, companyName, jobTitle)
                    }
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-600 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Draft Tailored Cover Letter
                  </button>
                </div>
              </div>

              {/* 4 Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Skills Overlap</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {matchResult.categoryScores.skillsMatch}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${matchResult.categoryScores.skillsMatch}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Experience Level</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {matchResult.categoryScores.experienceMatch}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-violet-400 h-full rounded-full"
                      style={{ width: `${matchResult.categoryScores.experienceMatch}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Education Match</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {matchResult.categoryScores.educationMatch}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${matchResult.categoryScores.educationMatch}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Domain Relevance</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {matchResult.categoryScores.domainRelevance}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: `${matchResult.categoryScores.domainRelevance}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched Skills */}
                <div className="p-5 rounded-xl bg-[#0e121b] border border-emerald-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Matched Competencies ({matchResult.matchedSkills.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 font-mono text-[11px]"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-5 rounded-xl bg-[#0e121b] border border-amber-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Missing Core Skills ({matchResult.missingSkills.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Click to copy</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopySkill(skill)}
                        className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 font-mono text-[11px] hover:border-amber-600 flex items-center gap-1 transition-colors"
                      >
                        {copiedSkill === skill ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-amber-400" />
                        )}
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ATS Keyword Radar Table */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                  ATS Keyword Radar Checklist
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e2638] text-slate-400">
                        <th className="pb-2 font-medium">Target Keyword</th>
                        <th className="pb-2 font-medium">Importance</th>
                        <th className="pb-2 font-medium">Found in Resume</th>
                        <th className="pb-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2638]/40">
                      {matchResult.atsKeywordCheck.map((kw, i) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          <td className="py-2.5 font-mono text-white">{kw.keyword}</td>
                          <td className="py-2.5 capitalize text-slate-400">{kw.importance}</td>
                          <td className="py-2.5">
                            {kw.foundInResume ? (
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Present
                              </span>
                            ) : (
                              <span className="text-red-400 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Missing
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono">
                            {kw.foundInResume ? (
                              <span className="text-[11px] text-emerald-400 font-bold">+Match</span>
                            ) : (
                              <span className="text-[11px] text-amber-400 font-bold">Needs Addition</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tailoring Recommendations */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Tactical Resume Customization Steps
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {matchResult.tailoringAdvice.map((advice, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center">
              <Target className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Match Computed Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Paste your target job description on the left and click "Calculate Explainable Match Score".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
