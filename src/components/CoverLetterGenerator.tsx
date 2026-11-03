import React, { useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Share2,
  FileText
} from 'lucide-react';
import { CoverLetterResult, UserProfile } from '../types';
import { SAMPLE_RESUME_TEXT, SAMPLE_JOB_DESCRIPTION, storage } from '../lib/storage';

interface CoverLetterGeneratorProps {
  currentUser: UserProfile;
  initialResumeText?: string;
  initialJobDesc?: string;
  initialCompany?: string;
  initialTitle?: string;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  currentUser,
  initialResumeText,
  initialJobDesc,
  initialCompany,
  initialTitle,
}) => {
  const [companyName, setCompanyName] = useState(initialCompany || 'Stripe');
  const [jobTitle, setJobTitle] = useState(initialTitle || 'Junior Frontend Engineer');
  const [resumeText, setResumeText] = useState(
    initialResumeText || storage.getMasterResumeText() || SAMPLE_RESUME_TEXT
  );
  const [jobDescription, setJobDescription] = useState(initialJobDesc || SAMPLE_JOB_DESCRIPTION);
  const [applicantName, setApplicantName] = useState(currentUser.name || 'Maya Lin');
  const [tone, setTone] = useState<'confident' | 'enthusiastic' | 'corporate' | 'creative'>('confident');
  const [highlights, setHighlights] = useState(
    'Highlight EventSync real-time platform and 45% latency improvement'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [editableLetter, setEditableLetter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      setError('Please provide both target company name and job title.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          companyName,
          jobTitle,
          applicantName,
          tone,
          highlights,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      const enriched: CoverLetterResult = {
        ...data,
        id: `cov-${Date.now()}`,
        timestamp: new Date().toISOString(),
        companyName,
        jobTitle,
        tone,
      };

      setResult(enriched);
      setEditableLetter(enriched.coverLetterText);
      storage.saveCoverLetter(enriched);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError('Could not generate cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([editableLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${companyName}_${jobTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2638] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-indigo-400" />
            Tailored Cover Letter Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate high-conversion cover letters personalized to the target company's mission and your proven projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCompanyName('Stripe');
              setJobTitle('Junior Frontend Engineer');
              setHighlights('Highlight EventSync real-time platform and 45% latency improvement');
              setTone('confident');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e121b] border border-[#1e2638] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load Preset Info
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Cover letter saved to your library!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
            <span className="text-xs font-semibold text-white uppercase tracking-wider block">
              Application Parameters
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, OpenAI"
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
              <label className="block text-xs text-slate-300 mb-1">Applicant Name</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Writing Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'confident', label: 'Confident & Impactful' },
                  { id: 'enthusiastic', label: 'Enthusiastic (Fresher)' },
                  { id: 'corporate', label: 'Structured Corporate' },
                  { id: 'creative', label: 'Creative Narrative' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      tone === t.id
                        ? 'bg-violet-950/80 border-violet-500 text-white'
                        : 'bg-[#090b10] border-[#1e2638] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Key Accomplishments to Weave In
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Mention specific projects, metrics, or personal interest in company..."
                rows={3}
                className="w-full p-2.5 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              {loading ? 'Synthesizing Letter with Gemini 3.8...' : 'Draft Tailored Cover Letter'}
            </button>
          </div>
        </div>

        {/* Right: Output & Live Editor */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-full min-h-[460px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-t-indigo-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
              <h3 className="text-base font-semibold text-white">Synthesizing Tailored Letter</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Weaving company values, engineering stack requirements, and your quantifiable milestones into a compelling narrative.
              </p>
            </div>
          ) : result || editableLetter ? (
            <div className="space-y-4">
              {/* Subject line box */}
              {result?.subjectLine && (
                <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1e2638] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-cyan-400 block font-semibold">
                      Suggested Email Subject Line:
                    </span>
                    <span className="font-medium text-white">{result.subjectLine}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.subjectLine);
                    }}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Copy Subject Line"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Editable Letter Canvas */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold text-white">Live Letter Editor</span>
                    <span>·</span>
                    <span className="font-mono">
                      {editableLetter.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#090b10] border border-[#1e2638] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#090b10] border border-[#1e2638] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> .TXT
                    </button>

                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#090b10] border border-[#1e2638] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                </div>

                <textarea
                  value={editableLetter}
                  onChange={(e) => setEditableLetter(e.target.value)}
                  rows={16}
                  className="w-full p-4 text-xs sm:text-sm bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-y"
                />

                {/* Selling Points Preview */}
                {result?.keySellingPoints && (
                  <div className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
                      Core Value Hooks Communicated:
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {result.keySellingPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center">
              <Mail className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Cover Letter Generated Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Enter target company and job details on the left, then click "Draft Tailored Cover Letter".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
