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
  Info,
  Download,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ResumeAnalysisResult, UserProfile } from '../types';
import { SAMPLE_RESUME_TEXT, storage } from '../lib/storage';
import { saveResumeAuditToCloud, uploadResumeFileToStorage, logFeatureUsageToCloud } from '../lib/supabase';

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
  const [isScannedAlert, setIsScannedAlert] = useState(false);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [extractingFile, setExtractingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  // File Upload Handler with Size & Format Validation, Scanned PDF Check, and Supabase Storage Sync
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScannedAlert(false);

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');
    const isTxt = lowerName.endsWith('.txt') || lowerName.endsWith('.md');

    if (!isPdf && !isDocx && !isTxt) {
      setError('Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    setExtractingFile(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    try {
      // 1. Background sync to private Supabase storage bucket under user's UUID
      if (currentUser?.id) {
        uploadResumeFileToStorage(currentUser.id, file, file.name)
          .then((res) => {
            if (res.success && res.filePath) {
              setUploadedStoragePath(res.filePath);
            }
          })
          .catch((err) => console.warn('Supabase storage upload background notice:', err));
      }

      // 2. Extract genuine text on server
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
            if (data.isScanned) {
              setIsScannedAlert(true);
              setError(data.error);
            } else {
              setError(data.error || 'Failed to extract readable text from document.');
            }
            return;
          }

          setResumeText(data.text);
          setShowExtractedPreview(true);
          setUploadedFileName(file.name);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error extracting text from file.';
          setError(msg);
        } finally {
          setExtractingFile(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file from disk. Please try again.');
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

    setError(null);
    setIsScannedAlert(false);
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
        fileName: uploadedFileName || undefined,
        fileSize: uploadedFileSize || undefined,
        storageFilePath: uploadedStoragePath || undefined,
      };

      setAnalysisResult(enrichedResult);
      storage.saveResumeAnalysis(enrichedResult, currentUser.id);
      storage.saveMasterResumeText(resumeText, currentUser.id);

      // Save to Supabase DB cloud persistence
      saveResumeAuditToCloud(currentUser.id, enrichedResult);

      // Track feature usage in Supabase public.feature_usage_logs
      storage.addUsageLog('resume_analysis', { atsScore: enrichedResult.atsScore, fileName: uploadedFileName || 'Direct Text' }, currentUser.id);
      logFeatureUsageToCloud(currentUser.id, 'resume_analysis', { atsScore: enrichedResult.atsScore, fileName: uploadedFileName || 'Direct Text' });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      console.error(err);
      setError('Analysis failed. Check your internet connection and try again.');
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

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadPdfReport = () => {
    window.print();
  };

  const handleResetToSample = () => {
    setResumeText(SAMPLE_RESUME_TEXT);
    setUploadedFileName(null);
    setShowExtractedPreview(false);
    setError(null);
    setIsScannedAlert(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Resume Upload & ATS Audit
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload your genuine PDF/DOCX resume or paste text to perform rigorous ATS scoring and Gemini-powered optimization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {analysisResult && (
            <button
              onClick={handleDownloadPdfReport}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-500 text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download or Print Full Analysis Report as PDF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download PDF Report</span>
            </button>
          )}

          <button
            onClick={handleResetToSample}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-[#0e121b] border border-[#1e2638] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {/* Scanned / Image-Based PDF Alert */}
      {isScannedAlert && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300 block">
              Scanned / Image-Based PDF Detected
            </span>
            <p className="text-amber-200/90 leading-relaxed">
              This document consists of scanned images with no extractable text layer. Applicant Tracking Systems (ATS) and our parser cannot read text from flattened scans.
            </p>
            <p className="text-amber-300/90 font-medium">
              Recommendation: Upload a digitally generated PDF (exported directly from Word, Google Docs, or Canva) or copy and paste your resume text below.
            </p>
          </div>
        </div>
      )}

      {/* Generic Error Notice */}
      {error && !isScannedAlert && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Cloud Save Confirmation */}
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Resume analysis saved to your private Supabase profile!</span>
        </div>
      )}

      {/* Two Column Layout: Left Input Panel, Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Input Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Upload Resume Document
              </span>
              <span className="text-[10px] text-slate-500 font-mono">PDF, DOCX up to 10MB</span>
            </div>

            {/* Drag & Drop Upload Target */}
            <label className="relative border-2 border-dashed border-[#1e2638] hover:border-cyan-500/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-[#090b10] hover:bg-[#0c1018] transition-all group">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileUpload}
                disabled={extractingFile || loading}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                Choose a PDF or DOCX file
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Reliable text extraction using native server parser
              </span>
            </label>

            {extractingFile && (
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span>Extracting readable text with server parser...</span>
              </div>
            )}

            {uploadedFileName && !extractingFile && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate font-medium">{uploadedFileName}</span>
                </div>
                {uploadedStoragePath && (
                  <span className="text-[10px] font-mono text-emerald-400/80 shrink-0">
                    Synced to Cloud
                  </span>
                )}
              </div>
            )}

            {/* Target Role Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Role / Job Title (Optional)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Junior Full-Stack Developer, Data Analyst"
                className="w-full px-3 py-2 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                ATS keywords and missing competencies will be tailored against this target role.
              </span>
            </div>

            {/* Toggle Extracted Text Preview */}
            <div className="pt-2 border-t border-[#1e2638]">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  type="button"
                  onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                >
                  {showExtractedPreview ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide Extracted Resume Text
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> View Extracted Resume Text
                    </>
                  )}
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {resumeText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {showExtractedPreview ? (
                <div className="space-y-2">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Extracted resume text appears here..."
                    rows={12}
                    className="w-full p-3 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    You can inspect or make manual edits to the text before running the audit.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] text-xs text-slate-400 flex items-center justify-between">
                  <span>Resume content is loaded and ready.</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {resumeText.length} characters
                  </span>
                </div>
              )}
            </div>

            {/* Run Analysis Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading || extractingFile}
              className="w-full py-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              {loading ? 'Evaluating with Gemini 3.8...' : 'Run Comprehensive ATS Audit'}
            </button>
          </div>
        </div>

        {/* Right Column: Loading or Comprehensive Results Dashboard */}
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
                  Analyzing extracted text density, contact formatting, skills taxonomy, and bullet impact with Gemini AI.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="w-full max-w-xs space-y-2 text-left">
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 1 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Parsing candidate credentials & contact details</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 2 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Extracting verified technical & soft skills</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 3 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Benchmarking against target role ({targetRole})</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${loadingStep >= 4 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Generating bullet improvements & ATS keywords</span>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <div id="resume-audit-report" className="space-y-6 print:bg-white print:text-black">
              {/* Candidate Overview & Contact Card */}
              <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white print:text-black">
                        {analysisResult.candidateName}
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/50 text-violet-300 font-mono text-[10px]">
                        {analysisResult.experienceLevel}
                      </span>
                    </div>
                    <span className="text-xs text-cyan-400 font-medium block mt-0.5">
                      Target Role: {analysisResult.targetRoleDetected}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => onNavigateToJobMatcher(resumeText)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-colors"
                    >
                      Match with Job <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onNavigateToCoverLetter(resumeText)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-500 text-slate-200 flex items-center gap-1 transition-colors"
                    >
                      Draft Cover Letter
                    </button>
                  </div>
                </div>

                {/* Contact Badges if present */}
                {analysisResult.contactDetails && (
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1e2638] text-xs text-slate-300 print:text-gray-700">
                    {analysisResult.contactDetails.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{analysisResult.contactDetails.email}</span>
                      </div>
                    )}
                    {analysisResult.contactDetails.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{analysisResult.contactDetails.phone}</span>
                      </div>
                    )}
                    {analysisResult.contactDetails.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{analysisResult.contactDetails.location}</span>
                      </div>
                    )}
                    {analysisResult.contactDetails.links && analysisResult.contactDetails.links.length > 0 && (
                      <div className="flex items-center gap-2">
                        {analysisResult.contactDetails.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.startsWith('http') ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-0.5 truncate max-w-[180px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ATS Pass Score & Executive Verdict Card */}
              <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800 print:text-gray-200 stroke-current"
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
                    <span className="absolute font-mono text-xl font-bold text-white print:text-black">
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
                    <h3 className="text-base sm:text-lg font-bold text-white print:text-black mt-0.5">
                      {analysisResult.atsScore >= 85
                        ? 'Excellent ATS Optimization'
                        : analysisResult.atsScore >= 70
                        ? 'Good Foundation — Needs Metric Tuning'
                        : 'Action Needed: Missing Critical Keywords'}
                    </h3>
                    <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                      {analysisResult.summaryReview}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Pillar Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638] print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 block">Impact & Metrics</span>
                  <span className="text-lg font-mono font-bold text-white print:text-black">
                    {analysisResult.scoresBreakdown.impact}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-violet-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.impact}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638] print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 block">Formatting Cleanliness</span>
                  <span className="text-lg font-mono font-bold text-white print:text-black">
                    {analysisResult.scoresBreakdown.formatting}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.formatting}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638] print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 block">Brevity & Conciseness</span>
                  <span className="text-lg font-mono font-bold text-white print:text-black">
                    {analysisResult.scoresBreakdown.brevity}%
                  </span>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: `${analysisResult.scoresBreakdown.brevity}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0e121b] border border-[#1e2638] print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 block">Keyword Saturation</span>
                  <span className="text-lg font-mono font-bold text-white print:text-black">
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

              {/* Education & Qualifications */}
              {analysisResult.education && analysisResult.education.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    Education & Credentials
                  </span>
                  <div className="space-y-3">
                    {analysisResult.education.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-semibold text-white print:text-black">{edu.degree}</span>
                          {edu.year && <span className="font-mono text-slate-400 text-[11px]">{edu.year}</span>}
                        </div>
                        <div className="text-slate-300 print:text-gray-700 mt-0.5">{edu.institution}</div>
                        {edu.gpa && <div className="text-cyan-400 font-mono text-[11px] mt-1">GPA / Score: {edu.gpa}</div>}
                        {edu.details && <div className="text-slate-400 text-[11px] mt-1">{edu.details}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience & Internships */}
              {analysisResult.workExperience && analysisResult.workExperience.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-violet-400" />
                    Work Experience & Internships
                  </span>
                  <div className="space-y-3">
                    {analysisResult.workExperience.map((exp, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-semibold text-white print:text-black">{exp.role}</span>
                            <span className="text-slate-400 print:text-gray-600 ml-2">· {exp.company}</span>
                          </div>
                          {exp.duration && (
                            <span className="font-mono text-slate-400 text-[11px]">{exp.duration}</span>
                          )}
                        </div>
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="space-y-1 text-slate-300 print:text-gray-700 list-disc list-inside">
                            {exp.achievements.map((ach, aIdx) => (
                              <li key={aIdx} className="leading-relaxed">
                                {ach}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects & Certifications */}
              {analysisResult.projects && analysisResult.projects.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4 text-indigo-400" />
                    Key Projects & Technical Deliverables
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.projects.map((proj, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs space-y-1.5">
                        <span className="font-semibold text-white print:text-black block">{proj.name}</span>
                        <p className="text-slate-300 print:text-gray-700 line-clamp-3 leading-relaxed">
                          {proj.description}
                        </p>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.techStack.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 font-mono text-[10px]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Skills Categories */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-4">
                <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider block">
                  Detected Skill Ecosystem
                </span>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 print:text-gray-600 font-medium mr-2">Technical Core:</span>
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
                    <span className="text-slate-400 print:text-gray-600 font-medium mr-2">Soft Competencies:</span>
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
                    <span className="text-slate-400 print:text-gray-600 font-medium mr-2">Tools & Environments:</span>
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
                <div className="p-4 rounded-xl bg-[#0e121b] border border-emerald-950/60 print:border-gray-300">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <CheckCircle className="w-4 h-4" />
                    Key Competitive Edges
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300 print:text-gray-700">
                    {analysisResult.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold leading-tight">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0e121b] border border-amber-950/60 print:border-gray-300">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="w-4 h-4" />
                    Actionable Vulnerabilities
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300 print:text-gray-700">
                    {analysisResult.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold leading-tight">!</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Skills & Improvement Suggestions */}
              {analysisResult.missingSkillsAndSuggestions && analysisResult.missingSkillsAndSuggestions.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-400" />
                    Missing Skills & Tailoring Suggestions for {analysisResult.targetRoleDetected}
                  </span>
                  <div className="space-y-2.5">
                    {analysisResult.missingSkillsAndSuggestions.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-mono text-[11px] font-semibold">
                            {item.skill}
                          </span>
                          <span className="text-slate-400 print:text-gray-600">{item.rationale}</span>
                        </div>
                        <div className="text-emerald-300 font-medium pl-1">
                          → Recommendation: {item.recommendedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar & Spelling Corrections */}
              {analysisResult.grammarAndSpelling && analysisResult.grammarAndSpelling.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Grammar, Clarity & Punctuation Audit
                  </span>
                  <div className="space-y-2.5">
                    {analysisResult.grammarAndSpelling.map((errItem, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs space-y-1.5">
                        <div className="flex items-start gap-2 text-red-300">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                          <span className="line-through">{errItem.originalText}</span>
                        </div>
                        <div className="flex items-start gap-2 text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                          <span className="font-medium text-white print:text-black">{errItem.suggestedCorrection}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic pl-5">
                          {errItem.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improved Professional Summary */}
              {analysisResult.improvedProfessionalSummary && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Optimized Professional Summary (ATS Tailored)
                    </span>
                    <button
                      onClick={() => handleCopySummary(analysisResult.improvedProfessionalSummary!)}
                      className="px-2.5 py-1 text-xs rounded bg-[#131826] border border-[#1e2638] hover:border-slate-500 text-slate-300 hover:text-white flex items-center gap-1 transition-colors print:hidden"
                    >
                      {copiedSummary ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Summary
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#090b10] border border-cyan-900/30 text-xs text-slate-200 print:text-gray-800 leading-relaxed font-sans">
                    {analysisResult.improvedProfessionalSummary}
                  </div>
                </div>
              )}

              {/* Bullet Point Rewrites */}
              <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider block">
                      AI Metric & Action Verb Transformations
                    </span>
                    <span className="text-[11px] text-slate-400 print:text-gray-600">
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
                      className="p-3.5 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 space-y-2 text-xs"
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
                          <span className="font-medium text-white print:text-black">{item.improved}</span>
                        </div>
                        <button
                          onClick={() => handleCopyBullet(item.improved, idx)}
                          className="px-2 py-1 text-[11px] rounded bg-[#0e121b] border border-[#1e2638] text-slate-300 hover:text-white flex items-center gap-1 shrink-0 print:hidden"
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

              {/* ATS Keyword Suggestions */}
              {analysisResult.atsKeywordSuggestions && analysisResult.atsKeywordSuggestions.length > 0 && (
                <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 space-y-3">
                  <span className="text-xs font-semibold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-cyan-400" />
                    Target ATS Keyword Analysis
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysisResult.atsKeywordSuggestions.map((kw, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] print:border-gray-200 text-xs flex items-start gap-2.5"
                      >
                        {kw.status === 'found' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white print:text-black">{kw.keyword}</span>
                            <span className="text-[10px] text-slate-500">({kw.category})</span>
                          </div>
                          <span className="text-[11px] text-slate-400 print:text-gray-600 block mt-0.5">
                            {kw.recommendation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Certifications */}
              <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] print:border-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white print:text-black">
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
                Upload your PDF or Word document on the left, then click "Run Comprehensive ATS Audit" to receive a full breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
