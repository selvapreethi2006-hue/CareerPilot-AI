import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Send,
  History,
  Clock,
  Layers,
  HelpCircle,
  BarChart3,
  ThumbsUp,
  Lightbulb,
} from 'lucide-react';
import {
  UserProfile,
  MockInterviewSession,
  MockInterviewQuestion,
  InterviewDifficulty,
  InterviewCategory,
} from '../types';
import { storage } from '../lib/storage';

interface MockInterviewPlatformProps {
  currentUser: UserProfile;
  initialRole?: string;
  onNavigateToRoadmap?: () => void;
}

export const MockInterviewPlatform: React.FC<MockInterviewPlatformProps> = ({
  currentUser,
  initialRole = '',
  onNavigateToRoadmap,
}) => {
  const [targetRole, setTargetRole] = useState<string>(
    initialRole || currentUser.targetRole || 'Full Stack Developer'
  );
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('intermediate');
  const [category, setCategory] = useState<InterviewCategory>('technical');

  const [activeSession, setActiveSession] = useState<MockInterviewSession | null>(() => {
    const saved = storage.getMockInterviewSessions(currentUser.id);
    return saved[0] || null;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Web Speech API: Voice Recording
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API: Text-to-Speech (Interviewer Speaking)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    // Check speech recognition capability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition event:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      setError('Voice input is not supported in this browser. Please type your response.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Could not start speech recognition', e);
        setIsListening(false);
      }
    }
  };

  const speakQuestion = (text: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartNewSession = async () => {
    setIsGenerating(true);
    setError(null);
    setCurrentQuestionIndex(0);
    setUserAnswer('');

    try {
      const response = await fetch('/api/gemini/mock-interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          difficulty,
          category,
          resumeText: storage.getMasterResumeText(currentUser.id),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const newSession: MockInterviewSession = {
        id: data.id || `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetRole,
        difficulty,
        category,
        questions: data.questions || [],
      };

      setActiveSession(newSession);
      storage.saveMockInterviewSession(newSession, currentUser.id);
    } catch (err: any) {
      console.error('Session generation failed:', err);
      setError('Could not generate interview questions. Please verify connection and retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!activeSession || !activeSession.questions[currentQuestionIndex]) return;
    const currentQ = activeSession.questions[currentQuestionIndex];

    if (!userAnswer.trim()) {
      setError('Please type or dictate your answer before requesting evaluation.');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/mock-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          userAnswer,
          targetRole: activeSession.targetRole,
          category: currentQ.category,
          difficulty: currentQ.difficulty,
          keyPointsToCover: currentQ.keyPointsToCover,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // Update question with evaluation
      const updatedQuestions = [...activeSession.questions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQ,
        userAnswer,
        evaluation: data.evaluation,
      };

      // Calculate aggregate session metrics
      const evaluatedQuestions = updatedQuestions.filter((q) => q.evaluation);
      const avgScore =
        evaluatedQuestions.length > 0
          ? Math.round(
              (evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation?.scoreOutOf10 || 0), 0) /
                evaluatedQuestions.length) *
                10
            )
          : undefined;

      const updatedSession: MockInterviewSession = {
        ...activeSession,
        questions: updatedQuestions,
        overallScore: avgScore,
        overallFeedback:
          avgScore && avgScore >= 75
            ? 'Strong technical articulation with solid domain awareness.'
            : 'Good foundational attempts; focus on quantifying outcomes and edge cases.',
        completedAt:
          evaluatedQuestions.length === updatedQuestions.length
            ? new Date().toISOString()
            : undefined,
      };

      setActiveSession(updatedSession);
      storage.saveMockInterviewSession(updatedSession, currentUser.id);
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      setError('Could not evaluate response. Please retry.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentQ = activeSession?.questions[currentQuestionIndex];
  const savedSessions = storage.getMockInterviewSessions(currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Mock Interview Platform
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Voice & Text Simulation
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Realistic, role-specific technical and behavioral interviews with instant objective scoring, communication feedback, and Staff-level model answers.
            </p>
          </div>
        </div>

        {savedSessions.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#090b10] border border-[#1e2638] px-3 py-2 rounded-xl">
            <History className="w-4 h-4 text-cyan-400" />
            <span>{savedSessions.length} interview sessions completed</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Session Controls & Setup (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Interview Configuration
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Job Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. AI Engineer, Full Stack Developer, Data Scientist"
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InterviewCategory)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="technical">Technical & System Architecture</option>
                <option value="role-specific">Role-Specific Deep Dive</option>
                <option value="behavioral">Behavioral & Leadership (STAR Method)</option>
                <option value="hr">HR & Cultural Alignment</option>
                <option value="system-design">System Design & Scalability</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as InterviewDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 text-xs font-medium rounded-lg capitalize border transition-all ${
                      difficulty === d
                        ? 'bg-violet-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-[#090b10] border-[#1e2638] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartNewSession}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Generating Interview Session...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Start New AI Interview (5 Questions)</span>
                </>
              )}
            </button>
          </div>

          {/* Previous Sessions Summary */}
          {savedSessions.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Previous Interview Records
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {savedSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSession(s);
                      setCurrentQuestionIndex(0);
                      setUserAnswer(s.questions[0]?.userAnswer || '');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeSession?.id === s.id
                        ? 'bg-violet-950/40 border-violet-700 text-white'
                        : 'bg-[#090b10] border-[#1e2638] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[150px]">{s.targetRole}</span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {s.overallScore !== undefined ? `${s.overallScore}% Score` : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="capitalize">{s.category}</span>
                      <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Question & Interactive Evaluation (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSession && currentQ ? (
            <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-6 shadow-xl animate-in fade-in duration-200">
              {/* Question Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-[#1e2638] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Question {currentQuestionIndex + 1} of {activeSession.questions.length}
                  </span>
                  <span className="text-[11px] font-mono capitalize text-cyan-400">
                    [{currentQ.difficulty} · {currentQ.category}]
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {activeSession.questions.map((q, idx) => (
                    <button
                      key={q.id || idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setUserAnswer(q.userAnswer || '');
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                        idx === currentQuestionIndex
                          ? 'bg-cyan-500 text-black'
                          : q.evaluation
                          ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          : 'bg-[#090b10] border border-[#1e2638] text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Card with Read Out Loud option */}
              <div className="p-5 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                  <button
                    onClick={() => speakQuestion(currentQ.question)}
                    title={isSpeaking ? 'Stop speaking' : 'Read question out loud'}
                    className={`p-2 rounded-lg border transition-colors shrink-0 ${
                      isSpeaking
                        ? 'bg-cyan-950 border-cyan-700 text-cyan-300 animate-pulse'
                        : 'bg-[#131826] border-[#1e2638] text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {currentQ.intent && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong className="text-slate-300">Interviewer Intent:</strong> {currentQ.intent}</span>
                  </p>
                )}
              </div>

              {/* Answer Input Area with Voice Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    Your Response
                    {isListening && (
                      <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Listening...
                      </span>
                    )}
                  </label>

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isListening
                          ? 'bg-red-950/80 border-red-700 text-red-300'
                          : 'bg-[#131826] border-[#1e2638] text-cyan-400 hover:text-cyan-300'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isListening ? 'Stop Recording' : 'Speak Answer'}</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={5}
                  placeholder="Type or dictate your structured response here... (Tip: For behavioral, use STAR: Situation, Task, Action, Result. For technical, address constraints and performance tradeoffs)."
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                />

                {error && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>

                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={isEvaluating || !userAnswer.trim()}
                    className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-violet-900/30 cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <span>Evaluating Answer...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Objective Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Evaluation Report (When available) */}
              {currentQ.evaluation && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#090b10] via-[#111624] to-[#090b10] border border-cyan-900/40 space-y-5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2638] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-cyan-400">
                        AI Evaluator Feedback
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        Performance Assessment
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-violet-950/60 border border-violet-800 text-center min-w-[70px]">
                        <span className="text-[9px] text-slate-400 block uppercase">Overall</span>
                        <span className="font-mono text-base font-bold text-cyan-300">
                          {currentQ.evaluation.scoreOutOf10}/10
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-center min-w-[70px]">
                        <span className="text-[9px] text-slate-400 block uppercase">Comm</span>
                        <span className="font-mono text-base font-bold text-emerald-400">
                          {currentQ.evaluation.communicationScore}/10
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-center min-w-[70px]">
                        <span className="text-[9px] text-slate-400 block uppercase">Technical</span>
                        <span className="font-mono text-base font-bold text-amber-400">
                          {currentQ.evaluation.technicalAccuracyScore}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        Demonstrated Strengths
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {currentQ.evaluation.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Improvement Opportunities
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {currentQ.evaluation.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Staff Engineer Model Answer */}
                  <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Award className="w-4 h-4 text-cyan-400" />
                      Staff-Level Benchmark Answer
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                      {currentQ.evaluation.modelAnswer}
                    </p>
                  </div>

                  {/* Actionable Tip */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center gap-2.5 text-xs text-cyan-200">
                    <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>Actionable Strategy:</strong> {currentQ.evaluation.improvementTip}</span>
                  </div>

                  {/* Next Question Navigation */}
                  {currentQuestionIndex < activeSession.questions.length - 1 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          const nextIdx = currentQuestionIndex + 1;
                          setCurrentQuestionIndex(nextIdx);
                          setUserAnswer(activeSession.questions[nextIdx]?.userAnswer || '');
                        }}
                        className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5 transition-colors"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Your Mock Interview?</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Configure your target role, difficulty, and interview category on the left, then click <strong>"Start New AI Interview"</strong> to begin answering with voice or text.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
