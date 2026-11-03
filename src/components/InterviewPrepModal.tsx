import React, { useState, useEffect } from 'react';
import { X, Sparkles, HelpCircle, CheckCircle, MessageSquare, Lightbulb, Building, Briefcase } from 'lucide-react';
import { JobApplication, InterviewPrepData } from '../types';

interface InterviewPrepModalProps {
  application: JobApplication | null;
  onClose: () => void;
  resumeText: string;
}

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
  application,
  onClose,
  resumeText,
}) => {
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!application) return;

    const fetchPrep = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/gemini/interview-prep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: application.jobTitle,
            companyName: application.companyName,
            resumeText,
            jobDescription: application.notes,
          }),
        });

        if (!res.ok) throw new Error('Failed to generate interview prep');
        const data = await res.json();
        setPrepData(data);
      } catch (err: unknown) {
        console.error(err);
        setError('Could not generate custom interview prep. Using standard role coaching.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrep();
  }, [application, resumeText]);

  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-[#0e121b] border border-[#1e2638] shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2638]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Interview Prep Coach · {application.companyName}
              </h2>
              <p className="text-xs text-slate-400">
                Target Role: <span className="text-cyan-300 font-medium">{application.jobTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-t-cyan-400 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" />
              <h3 className="text-sm font-semibold text-white">Synthesizing Role-Specific Q&A</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Analyzing typical technical challenges and behavioral rubrics for {application.jobTitle} at {application.companyName}...
              </p>
            </div>
          ) : prepData ? (
            <div className="space-y-6 text-xs">
              {/* Likely Questions Section */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                  High-Probability Interview Questions & STAR Frameworks
                </span>

                <div className="space-y-3">
                  {prepData.likelyQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-white text-sm flex items-start gap-2">
                          <span className="text-cyan-400 font-mono text-xs">Q{idx + 1}.</span>
                          <span>{q.question}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800 text-violet-300 font-mono text-[10px] shrink-0">
                          {q.category}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-cyan-200 text-xs">
                        <span className="text-cyan-400 font-bold block mb-1">
                          Recommended STAR Framework:
                        </span>
                        <span>{q.sampleAnswerFramework}</span>
                      </div>

                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Recruiter Tip: {q.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions To Ask Interviewer */}
              <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2.5">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Impactful Reverse-Interview Questions to Ask
                </span>
                <p className="text-[11px] text-slate-400">
                  Asking sharp architectural and team-velocity questions demonstrates senior ownership and enthusiasm.
                </p>
                <ul className="space-y-2 text-slate-300">
                  {prepData.questionsToAskInterviewer.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">?</span>
                      <span>"{item}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Research Guidance */}
              <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2.5">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  Target Company Research Checklist
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {prepData.companyResearchTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Click prep to generate tailored interview questions.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#1e2638] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by CareerPilot Gemini 3.8 Flash Interview Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
