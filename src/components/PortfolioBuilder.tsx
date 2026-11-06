import React, { useState } from 'react';
import {
  Globe,
  Code,
  Download,
  Copy,
  Check,
  Eye,
  Sparkles,
  Layers,
  Palette,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import {
  UserProfile,
  PortfolioProfileData,
  PortfolioTemplateId,
  PortfolioProjectItem,
} from '../types';
import { storage } from '../lib/storage';

interface PortfolioBuilderProps {
  currentUser: UserProfile;
}

const TEMPLATES: Array<{ id: PortfolioTemplateId; name: string; desc: string }> = [
  {
    id: 'modern_minimal',
    name: 'Modern Minimalist',
    desc: 'Sleek dark theme with refined typography and clean cards.',
  },
  {
    id: 'cyber_dark',
    name: 'Cyber Terminal',
    desc: 'Developer-first aesthetic with monospace accents and terminal styling.',
  },
  {
    id: 'executive_clean',
    name: 'Executive Clean',
    desc: 'Polished corporate presentation ideal for senior roles and consulting.',
  },
  {
    id: 'creative_developer',
    name: 'Creative Engineer',
    desc: 'Vibrant gradients and dynamic project highlights.',
  },
];

const ACCENTS = [
  { name: 'Cyan Tech', hex: '#06b6d4' },
  { name: 'Electric Violet', hex: '#8b5cf6' },
  { name: 'Emerald Code', hex: '#10b981' },
  { name: 'Amber Glow', hex: '#f59e0b' },
  { name: 'Rose Impact', hex: '#f43f5e' },
];

export const PortfolioBuilder: React.FC<PortfolioBuilderProps> = ({ currentUser }) => {
  const [templateId, setTemplateId] = useState<PortfolioTemplateId>('modern_minimal');
  const [accentColor, setAccentColor] = useState<string>('#06b6d4');

  // Initial data derived from user profile or saved portfolio
  const [profileData, setProfileData] = useState<PortfolioProfileData>(() => {
    const saved = storage.getPortfolioData(currentUser.id);
    if (saved) return saved;

    return {
      fullName: currentUser.name || 'Job Seeker',
      headline: currentUser.headline || 'Full Stack Engineer & Tech Innovator',
      aboutBio: currentUser.bio || 'Passionate software engineer focused on building scalable, reliable, and accessible web solutions with modern frameworks.',
      email: currentUser.email || '',
      location: 'Bengaluru, India / Remote',
      githubUrl: currentUser.githubProfile?.htmlUrl || 'https://github.com',
      linkedinUrl: 'https://linkedin.com/in',
      portfolioUrl: '',
      skills: {
        technical: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'HTML5', 'CSS3'],
        frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS'],
        tools: ['Git', 'Docker', 'PostgreSQL', 'Supabase', 'Vercel'],
        soft: ['Problem Solving', 'Collaborative Leadership', 'Communication'],
      },
      projects: [
        {
          id: 'p1',
          title: 'CareerPilot AI Web Platform',
          tagline: 'Modern AI-driven career development dashboard',
          description: 'Engineered an end-to-end career intelligence workspace featuring resume parsing, ATS scoring, and automated job synchronization.',
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
          githubUrl: 'https://github.com',
          liveUrl: 'https://careerpilot.internal',
          highlights: ['Sub-second client rendering', 'RLS database security'],
        },
      ],
      experience: [
        {
          id: 'e1',
          role: 'Frontend Engineering Intern',
          organization: currentUser.universityOrCompany || 'Tech Innovators Co.',
          period: '2025 – Present',
          type: 'internship',
          achievements: ['Developed responsive client components in React and TypeScript with 90+ Lighthouse score.'],
        },
      ],
      education: [
        {
          id: 'ed1',
          institution: currentUser.universityOrCompany || 'University Institute of Technology',
          degree: 'Bachelor of Technology',
          field: 'Computer Science & Engineering',
          year: '2026',
        },
      ],
      certifications: ['AWS Certified Cloud Practitioner', 'Meta Frontend Developer Certificate'],
      theme: {
        templateId: 'modern_minimal',
        accentColor: '#06b6d4',
      },
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');

  const handleGenerateHtml = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/portfolio-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          templateId,
          accentColor,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const updatedData: PortfolioProfileData = {
        ...profileData,
        theme: { templateId, accentColor },
        generatedHtml: data.generatedHtml,
      };

      setProfileData(updatedData);
      storage.savePortfolioData(updatedData, currentUser.id);
    } catch (err: any) {
      console.error('Portfolio generation failed:', err);
      setError('Could not generate portfolio preview. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!profileData.generatedHtml) return;
    navigator.clipboard.writeText(profileData.generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!profileData.generatedHtml) return;
    const blob = new Blob([profileData.generatedHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const addProject = () => {
    const newProj: PortfolioProjectItem = {
      id: `p-${Date.now()}`,
      title: 'New Featured Project',
      tagline: 'High impact software solution',
      description: 'Describe the problem solved, architectural constraints, and measurable results.',
      techStack: ['TypeScript', 'React'],
      highlights: ['Demonstrated clean code principles'],
    };
    setProfileData({
      ...profileData,
      projects: [...profileData.projects, newProj],
    });
  };

  const removeProject = (id: string) => {
    setProfileData({
      ...profileData,
      projects: profileData.projects.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Portfolio Website Builder
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Single-File HTML & React
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create and preview modern developer portfolio sites with verified projects, skills, and interactive themes. Ready to host on GitHub Pages or Vercel.
            </p>
          </div>
        </div>

        {profileData.generatedHtml && (
          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#090b10] border border-[#1e2638] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 flex items-center gap-1.5 transition-all shadow-md shadow-violet-900/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download index.html</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 space-y-5">
          {/* Theme & Styling Card */}
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              Theme & Presentation
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Template Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      templateId === tpl.id
                        ? 'bg-violet-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-[#090b10] border-[#1e2638] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block text-white">{tpl.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Accent Color
              </label>
              <div className="flex items-center gap-2">
                {ACCENTS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setAccentColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accentColor === col.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0e121b]' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Profile & Portfolio Content
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={profileData.headline}
                  onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">About Bio</label>
              <textarea
                value={profileData.aboutBio}
                onChange={(e) => setProfileData({ ...profileData, aboutBio: e.target.value })}
                rows={3}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={profileData.githubUrl || ''}
                  onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={profileData.linkedinUrl || ''}
                  onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Featured Projects list */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white uppercase tracking-wider">
                  Featured Projects ({profileData.projects.length})
                </label>
                <button
                  type="button"
                  onClick={addProject}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {profileData.projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-3 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...profileData.projects];
                        updated[idx].title = e.target.value;
                        setProfileData({ ...profileData, projects: updated });
                      }}
                      className="bg-transparent font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...profileData.projects];
                      updated[idx].description = e.target.value;
                      setProfileData({ ...profileData, projects: updated });
                    }}
                    placeholder="Short description..."
                    className="w-full bg-[#131826] border border-[#1e2638] rounded px-2 py-1 text-slate-300 text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleGenerateHtml}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Synthesizing Portfolio Design...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Generate Portfolio Site Preview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0e121b] border border-[#1e2638] shadow-xl space-y-4">
            {/* View Switcher */}
            <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    previewTab === 'preview'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Interactive Live Preview</span>
                </button>
                <button
                  onClick={() => setPreviewTab('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    previewTab === 'code'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML Source Code</span>
                </button>
              </div>

              {profileData.generatedHtml && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Self-Contained & Production-Ready
                </span>
              )}
            </div>

            {/* Content Display */}
            {profileData.generatedHtml ? (
              previewTab === 'preview' ? (
                <div className="w-full h-[650px] rounded-xl overflow-hidden border border-[#1e2638] bg-[#07090e]">
                  <iframe
                    title="Portfolio Live Preview"
                    srcDoc={profileData.generatedHtml}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    readOnly
                    value={profileData.generatedHtml}
                    rows={26}
                    className="w-full bg-[#090b10] border border-[#1e2638] rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none"
                  />
                </div>
              )
            ) : (
              /* Empty Preview */
              <div className="p-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">Your Portfolio Live Canvas</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Review your information on the left and click <strong>"Generate Portfolio Site Preview"</strong> to compile a responsive single-file website.
                </p>
              </div>
            )}

            {/* Hosting Help */}
            <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Host for free: Upload <code>index.html</code> directly to GitHub Pages, Vercel, or Netlify.</span>
              <a
                href="https://pages.github.com/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>GitHub Pages Guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
