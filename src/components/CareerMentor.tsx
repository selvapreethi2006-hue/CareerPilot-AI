import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Compass,
  ArrowRight,
  Globe2,
  BookOpen,
  Mic,
  Target,
  Briefcase,
  FileText,
  User,
  Bot,
} from 'lucide-react';
import { UserProfile, MentorChatMessage, MentorLanguage } from '../types';
import { storage } from '../lib/storage';

interface CareerMentorProps {
  currentUser: UserProfile;
  onNavigateToTool?: (toolId: string) => void;
}

const SAMPLE_PROMPTS = [
  'How can I switch to AI / ML Engineering from a non-CS background?',
  'What hands-on projects impress recruiters for entry-level developer roles?',
  'How do freshers pass technical interviews without previous company experience?',
  'Explain the STAR method for answering behavioral questions with an example.',
  'How do I tailor my resume for remote international jobs in US/Europe?',
];

export const CareerMentor: React.FC<CareerMentorProps> = ({
  currentUser,
  onNavigateToTool,
}) => {
  const [messages, setMessages] = useState<MentorChatMessage[]>(() => {
    const saved = storage.getMentorChatHistory(currentUser.id);
    if (saved && saved.length > 0) return saved;

    return [
      {
        id: 'msg-welcome',
        sender: 'mentor',
        text: `Hello ${currentUser.name || 'there'}! I am your AI Career Mentor. Whether you are choosing a career direction, transitioning into AI or software engineering, optimizing your resume, or preparing for tough interviews, I'm here to support you. You can ask me in English, தமிழ் (Tamil), or Tanglish!`,
        timestamp: new Date().toISOString(),
        actionableFollowUps: [
          'What are high-growth tech careers for freshers in 2026?',
          'How can I bridge my resume skill gaps?',
          'How should I prepare for a technical screening interview?',
        ],
        recommendedTool: 'skill-gap',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [language, setLanguage] = useState<MentorLanguage>('en');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    storage.saveMentorChatHistory(messages, currentUser.id);
  }, [messages, currentUser.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || loading) return;

    const userMsg: MentorChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: new Date().toISOString(),
      language,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/career-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          chatHistory: newMessages.slice(-6),
          language,
          userContext: {
            name: currentUser.name,
            targetRole: currentUser.targetRole,
            headline: currentUser.headline,
            resumeSummary: storage.getMasterResumeText(currentUser.id).slice(0, 500),
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const mentorData: MentorChatMessage = await response.json();

      setMessages((prev) => [...prev, mentorData]);
    } catch (err: any) {
      console.error('Mentor response failed:', err);
      const errorMsg: MentorChatMessage = {
        id: `mentor-err-${Date.now()}`,
        sender: 'mentor',
        text: 'I encountered a temporary connection issue. Please feel free to ask again or review your question.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    storage.clearMentorChatHistory(currentUser.id);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'mentor',
        text: `Chat cleared. What career topic would you like to explore next, ${currentUser.name || 'Friend'}?`,
        timestamp: new Date().toISOString(),
        actionableFollowUps: [
          'Recommend 3 full-stack projects for freshers.',
          'How do I network with engineering managers on LinkedIn?',
        ],
      },
    ]);
  };

  const getToolLabel = (toolId: string) => {
    switch (toolId) {
      case 'skill-gap':
        return 'Launch Skill Gap Analyzer';
      case 'mock-interview':
        return 'Practice with Mock Interviews';
      case 'learning-roadmap':
        return 'View Personalized Roadmap';
      case 'resume-analyzer':
        return 'Audit Resume with AI';
      case 'jobs':
        return 'Explore Verified Jobs';
      case 'portfolio-builder':
        return 'Build Portfolio Website';
      case 'salary-insights':
        return 'View Salary Benchmarks';
      default:
        return 'Explore Tool';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Career Mentor AI
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-950 border border-violet-800 text-cyan-300">
                24/7 Career Coach
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personalized guidance for career switching, learning roadmaps, resume feedback, and interview tactics.
            </p>
          </div>
        </div>

        {/* Controls: Language & Clear */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Language Switcher */}
          <div className="flex items-center bg-[#090b10] border border-[#1e2638] p-1 rounded-xl">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'ta'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              onClick={() => setLanguage('tanglish')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'tanglish'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tanglish
            </button>
          </div>

          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-2 rounded-xl bg-[#090b10] border border-[#1e2638] text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-[#0e121b] border border-[#1e2638] shadow-2xl flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-violet-950 border border-violet-700 text-cyan-300'
                      : 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-[#090b10] border border-[#1e2638] text-slate-200 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-black/40 text-slate-300 hover:text-white transition-opacity"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Recommended Tool Bridge */}
                  {!isUser && msg.recommendedTool && onNavigateToTool && (
                    <div className="pt-2 border-t border-[#1e2638]">
                      <button
                        onClick={() => onNavigateToTool(msg.recommendedTool!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                        <span>{getToolLabel(msg.recommendedTool)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Actionable Follow-Up Suggestions */}
                  {!isUser && msg.actionableFollowUps && msg.actionableFollowUps.length > 0 && (
                    <div className="pt-2 border-t border-[#1e2638] space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Suggested Follow-Ups:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actionableFollowUps.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendMessage(prompt)}
                            className="px-2.5 py-1 rounded-md text-[11px] bg-[#131826] border border-[#1e2638] hover:border-cyan-500 text-slate-300 hover:text-white transition-colors text-left"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090b10] border border-[#1e2638] text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                <span>Thinking through mentor guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starter Pills */}
        <div className="px-4 py-2 border-t border-[#1e2638] bg-[#090b10]/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0">Prompts:</span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-full text-[11px] bg-[#131826] border border-[#1e2638] hover:border-slate-600 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#090b10] border-t border-[#1e2638]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'உங்கள் தொழில் சார்ந்த கேள்வியை இங்கே கேளுங்கள்...'
                  : language === 'tanglish'
                  ? 'Ungal kelvi-ya inge type pannunga...'
                  : 'Ask about career switching, resume tips, projects, or interview prep...'
              }
              className="flex-1 bg-[#131826] border border-[#1e2638] focus:border-cyan-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white transition-all shadow-md shadow-violet-900/30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
