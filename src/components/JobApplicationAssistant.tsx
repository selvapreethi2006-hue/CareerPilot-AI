import React, { useState } from 'react';
import {
  Send,
  Copy,
  Check,
  Mail,
  Clock,
  Sparkles,
  ShieldAlert,
  Edit3,
  Bookmark,
  History,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, SmartOutreachDraft, OutreachType } from '../types';
import { storage } from '../lib/storage';

interface JobApplicationAssistantProps {
  currentUser: UserProfile;
  initialCompany?: string;
  initialTitle?: string;
  onNavigateToTracker?: () => void;
}

const OUTREACH_OPTIONS: Array<{ type: OutreachType; label: string; desc: string }> = [
  {
    type: 'recruiter_inmail',
    label: 'Recruiter InMail / Message',
    desc: 'High-converting direct message to recruiters or engineering leads.',
  },
  {
    type: 'linkedin_connection',
    label: 'LinkedIn Connection Request',
    desc: 'Concise connection note strictly kept under 300 characters.',
  },
  {
    type: 'application_email',
    label: 'Direct Job Application Email',
    desc: 'Formal email to hiring manager accompanying your resume and portfolio.',
  },
  {
    type: 'post_interview_followup',
    label: 'Post-Interview Thank You & Follow-Up',
    desc: 'Thoughtful appreciation note reinforcing interest and key interview highlights.',
  },
  {
    type: 'interview_acceptance',
    label: 'Interview Invitation Response',
    desc: 'Polished confirmation of scheduled interview times and preparation details.',
  },
  {
    type: 'offer_negotiation',
    label: 'Respectful Compensation Dialogue',
    desc: 'Professional communication discussing offer alignment and package terms.',
  },
];

export const JobApplicationAssistant: React.FC<JobApplicationAssistantProps> = ({
  currentUser,
  initialCompany = '',
  initialTitle = '',
  onNavigateToTracker,
}) => {
  const [outreachType, setOutreachType] = useState<OutreachType>('recruiter_inmail');
  const [companyName, setCompanyName] = useState<string>(initialCompany || '');
  const [jobTitle, setJobTitle] = useState<string>(
    initialTitle || currentUser.targetRole || 'Software Engineer'
  );
  const [contactName, setContactName] = useState<string>('');
  const [keyHighlights, setKeyHighlights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [activeDraft, setActiveDraft] = useState<SmartOutreachDraft | null>(() => {
    const saved = storage.getSmartOutreachDrafts(currentUser.id);
    return saved[0] || null;
  });

  const [editableSubject, setEditableSubject] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');

  const savedDrafts = storage.getSmartOutreachDrafts(currentUser.id);

  const handleGenerate = async () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      setError('Please provide at least the Company Name and Job Title.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/application-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outreachType,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          contactName: contactName.trim() || undefined,
          keyHighlights: keyHighlights.trim() || undefined,
          resumeText: storage.getMasterResumeText(currentUser.id),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: SmartOutreachDraft = await response.json();

      setActiveDraft(data);
      setEditableSubject(data.subject || '');
      setEditableContent(data.messageContent || '');
      storage.saveSmartOutreachDraft(data, currentUser.id);
    } catch (err: any) {
      console.error('Outreach generation failed:', err);
      setError('Could not generate message draft. Please verify connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = editableSubject
      ? `Subject: ${editableSubject}\n\n${editableContent}`
      : editableContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Smart Job Application Assistant
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Strategic Outreach
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              High-converting recruiter InMails, LinkedIn connection requests, follow-ups, and negotiation messages tailored to your resume.
            </p>
          </div>
        </div>

        {savedDrafts.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#090b10] border border-[#1e2638] px-3 py-2 rounded-xl">
            <History className="w-4 h-4 text-cyan-400" />
            <span>{savedDrafts.length} saved drafts</span>
          </div>
        )}
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/40 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Strict User Control:</strong> You can edit and copy every message draft. CareerPilot AI will <strong>never send emails or LinkedIn messages on your behalf</strong> without your explicit manual action.
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Outreach Configuration
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Communication Scenario
              </label>
              <select
                value={outreachType}
                onChange={(e) => setOutreachType(e.target.value as OutreachType)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {OUTREACH_OPTIONS.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Company *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Google, Startup"
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Person or Hiring Manager Name (Optional)
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins or Tech Recruiting Lead"
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Key Strengths to Highlight (Optional)
              </label>
              <textarea
                value={keyHighlights}
                onChange={(e) => setKeyHighlights(e.target.value)}
                rows={3}
                placeholder="e.g. Built high-concurrency event syncing with 88% test coverage, specialized in React 19 and PostgreSQL."
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Drafting Personalized Message...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Generate High-Converting Outreach Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Saved Drafts List */}
          {savedDrafts.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Saved Outreach Messages
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setActiveDraft(d);
                      setEditableSubject(d.subject || '');
                      setEditableContent(d.messageContent || '');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeDraft?.id === d.id
                        ? 'bg-violet-950/40 border-violet-700 text-white'
                        : 'bg-[#090b10] border-[#1e2638] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[150px]">{d.companyName}</span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {d.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{d.jobTitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Editor: 7 Cols */}
        <div className="lg:col-span-7 space-y-5">
          {activeDraft ? (
            <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-5 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#1e2638] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400">
                    {activeDraft.type.replace(/_/g, ' ')} Draft
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {activeDraft.companyName} · {activeDraft.jobTitle}
                  </h3>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                </button>
              </div>

              {/* Subject Line (if applicable) */}
              {activeDraft.type !== 'linkedin_connection' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none"
                  />
                </div>
              )}

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Message Body (Editable)
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {editableContent.length} chars
                    {activeDraft.type === 'linkedin_connection' && ' (Max 300)'}
                  </span>
                </div>
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={8}
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none leading-relaxed font-sans"
                />
              </div>

              {/* Timing & Strategy Box */}
              <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-3">
                <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Recommended Dispatch Window:</span>
                  <span className="text-slate-300 font-normal">{activeDraft.recommendedTiming}</span>
                </div>

                {activeDraft.proTips?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#1e2638]">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Conversion Pro-Tips:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {activeDraft.proTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tracker Bridge CTA */}
              {onNavigateToTracker && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onNavigateToTracker}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <span>View in Application Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Active Outreach Draft</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Select your communication scenario on the left, enter the company and role, and generate a tailored message ready to copy and send.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
