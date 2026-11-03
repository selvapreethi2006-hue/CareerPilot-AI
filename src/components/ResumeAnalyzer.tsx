import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { ResumeAnalysisResult, UserProfile } from '../types';
import { SAMPLE_RESUME_TEXT, storage } from '../lib/storage';

interface ResumeAnalyzerProps {
  currentUser: UserProfile;
  onNavigateToJobMatcher: (resumeText: string) => void;
  onNavigateToCoverLetter: (resumeText: string) => void;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  currentUser,
  onNavigateToJobMatcher,
  onNavigateToCoverLetter,
}) => {
  const [resumeText, setResumeText] = useState(storage.getMasterResumeText() || SAMPLE_RESUME_TEXT);
  const [targetRole, setTargetRole] = useState(currentUser.targetRole || 'Frontend / Software Engineer');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(
    storage.getSavedResumes()[0] || null
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [extractingFile, setExtractingFile] = useState(false);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);

  // File Upload Handler with Validation & Real PDF/DOCX Text Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setExtractedFileName(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller document.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');
    const isTxt = lowerName.endsWith('.txt') || lowerName.endsWith('.md');

    if (!isPdf && !isDocx && !isTxt) {
      setError('Unsupported file type. Please upload a .pdf, .docx, or .txt resume file.');
      return;
    }

    setExtractingFile(true);

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/extract-resume-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              fileName: file.name,
              fileType: file.type,
            }),
          });

          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to extract text from file.');
          }

          setResumeText(data.text);
          setExtractedFileName(`${file.name} (${data.wordCount} words extracted)`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error extracting text from file.';
          setError(msg);
        } finally {
          setExtractingFile(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file from disk.');
        setExtractingFile(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error initiating file upload.');
      setExtractingFile(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!resumeText || resumeText.trim().length < 40) {
      setError('Please provide at least 40 characters of resume text to evaluate.');
      return;
    }

    // Zero-billing launch: All users have unlimited free access to Gemini ATS evaluations
    setError(null);
    setLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch('/api/gemini/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const enrichedResult: ResumeAnalysisResult = {
        ...data,
        id: `res-${Date.now()}`,
        timestamp: new Date().toISOString(),
        rawResumeText: resumeText,
      };

      setAnalysisResult(enrichedResult);
      storage.saveResumeAnalysis(enrichedResult);
      storage.saveMasterResumeText(resumeText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError('Analysis failed. Check your internet connection or try again.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
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
            <FileText className="w-7 h-7 text-violet-400" />
            Resume ATS Auditor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze formatting, action verbs, keyword saturation, and receive high-impact metric rewrites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {analysisResult && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e121b] border border-[#1e2638] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          )}

          <button
            onClick={() => {
              setResumeText(SAMPLE_RESUME_TEXT);
              setTargetRole('Junior Frontend Engineer');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e121b] border border-[#1e2638] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load Fresher Sample
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Audit saved to your history and master resume repository!</span>
        </div>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Textarea and File Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Resume Source
              </span>
              <label className="cursor-pointer text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium bg-[#131826] px-2.5 py-1 rounded border border-[#1e2638] hover:border-cyan-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF / DOCX / TXT</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={extractingFile}
                />
              </label>
            </div>

            {extractingFile && (
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>Extracting genuine text from document with server parser...</span>
              </div>
            )}

            {extractedFileName && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{extractedFileName}</span>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-300 mb-1">Target Role or Title</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Junior Frontend Developer"
                className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Resume Content</span>
                <span className="font-mono">{resumeText.trim().split(/\s+/).length} words</span>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full text of your resume here..."
                rows={14}
                className="w-full p-3 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full py-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              {loading ? 'Evaluating with Gemini 3.8...' : 'Run Comprehensive ATS Audit'}
            </button>
          </div>
        </div>

        {/* Right: Results or Loading State */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-full min-h-[480px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping" />
                <div className="w-full h-full rounded-full border-4 border-t-cyan-400 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Auditing Resume Against Global ATS Rubrics
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Parsing experience density, benchmarking keywords, and synthesizing metric-driven bullet points.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="w-full max-w-xs space-y-2 text-left">
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 1 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Scanning structure and contact formatting</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 2 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Extracting hard & soft skill taxonomies</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 3 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Auditing action verbs & quantitative deliverables</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 4 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Drafting tailored high-impact rewrites</span>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* ATS Score Header Card */}
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
                        className="text-violet-400 stroke-current"
                        strokeDasharray={`${analysisResult.atsScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-mono text-xl font-bold text-white">
                      {analysisResult.atsScore}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                        ATS Pass Rating
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">{analysisResult.experienceLevel}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      {analysisResult.atsScore >= 85
                        ? 'Excellent ATS Optimization'
                        : analysisResult.atsScore >= 70
                        ? 'Good Foundation — Needs Metric Tuning'
                        : 'Critical Keywords Missing'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {analysisResult.summaryReview}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => onNavigateToJobMatcher(resumeText)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Match with a Job <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigateToCoverLetter(resumeText)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-600 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Draft Cover Letter
                  </button>
                </div>
              </div>

              {/* 4 Pillar Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Impact & Metrics</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {analysisResult.scoresBreakdown.impact}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-violet-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.impact}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Formatting Cleanliness</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {analysisResult.scoresBreakdown.formatting}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.formatting}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Brevity & Conciseness</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {analysisResult.scoresBreakdown.brevity}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.brevity}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 block">Keyword Saturation</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {analysisResult.scoresBreakdown.keywords}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.keywords}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Extracted Skills Categories */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Detected Skill Ecosystem
                </span>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium mr-2">Technical Core:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {analysisResult.extractedSkills.technical.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/50 text-violet-300 font-mono text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium mr-2">Soft Competencies:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {analysisResult.extractedSkills.soft.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium mr-2">Tools & Environments:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {analysisResult.extractedSkills.tools.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#131826] border border-[#1e2638] text-slate-300 font-mono text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0e121b] border border-emerald-950/60">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <CheckCircle className="w-4 h-4" />
                    Key Competitive Edges
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {analysisResult.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold leading-tight">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0e121b] border border-amber-950/60">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="w-4 h-4" />
                    Actionable Vulnerabilities
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {analysisResult.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold leading-tight">!</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bullet Point Rewriter */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                      AI Metric & Action Verb Transformations
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Replaces passive duty descriptions with quantifiable business impact.
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-400">
                    {analysisResult.actionVerbsCount} Active Verbs Detected
                  </div>
                </div>

                <div className="space-y-3">
                  {analysisResult.bulletPointImprovements.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-[#090b10] border border-[#1e2638] space-y-2 text-xs"
                    >
                      <div className="text-slate-400">
                        <span className="text-red-400 font-mono text-[10px] uppercase font-bold mr-2">
                          Original:
                        </span>
                        <span className="line-through">{item.original}</span>
                      </div>

                      <div className="text-emerald-300 flex items-start justify-between gap-3 bg-emerald-950/20 p-2.5 rounded border border-emerald-900/40">
                        <div>
                          <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold block mb-1">
                            High-Impact Revision:
                          </span>
                          <span className="font-medium text-white">{item.improved}</span>
                        </div>
                        <button
                          onClick={() => handleCopyBullet(item.improved, idx)}
                          className="px-2 py-1 text-[11px] rounded bg-[#0e121b] border border-[#1e2638] text-slate-300 hover:text-white flex items-center gap-1 shrink-0"
                        >
                          {copiedBulletIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 italic">
                        Why this works: {item.reason}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Action Verbs */}
                <div className="pt-2 border-t border-[#1e2638]">
                  <span className="text-[11px] text-slate-400 mr-2">Recommended Power Verbs:</span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {analysisResult.actionVerbsSuggestions.map((verb, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-violet-950/40 text-violet-300 font-mono text-[10px]"
                      >
                        {verb}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Certifications */}
              <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white">
                      Recommended Credential Boosters
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {analysisResult.recommendedCertifications.join(' · ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] p-8 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Resume Analyzed Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Paste your resume or load the sample fresher resume on the left, then click "Run Comprehensive ATS Audit".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
