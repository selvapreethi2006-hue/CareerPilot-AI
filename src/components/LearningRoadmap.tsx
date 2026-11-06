import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Circle,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  Download,
  RotateCcw,
  Code2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';
import { UserProfile, LearningRoadmapResult, WeeklyRoadmapModule } from '../types';
import { storage } from '../lib/storage';

interface LearningRoadmapProps {
  currentUser: UserProfile;
  initialRole?: string;
  initialSkills?: string[];
  onNavigateToInterviews?: () => void;
}

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  currentUser,
  initialRole = '',
  initialSkills = [],
  onNavigateToInterviews,
}) => {
  const [targetRole, setTargetRole] = useState<string>(
    initialRole || currentUser.targetRole || 'Full Stack Developer'
  );
  const [experienceLevel, setExperienceLevel] = useState<string>('fresher');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeRoadmap, setActiveRoadmap] = useState<LearningRoadmapResult | null>(() => {
    const saved = storage.getLearningRoadmaps(currentUser.id);
    return saved[0] || null;
  });

  const savedRoadmaps = storage.getLearningRoadmaps(currentUser.id);

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/learning-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          durationWeeks,
          currentSkills: initialSkills.length
            ? initialSkills
            : ['Core Programming', 'Web Basics'],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: LearningRoadmapResult = await response.json();

      setActiveRoadmap(data);
      storage.saveLearningRoadmap(data, currentUser.id);
      setExpandedWeek(1);
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setError('Could not generate learning roadmap. Please verify inputs and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (weekNumber: number, dayNumber: number, currentStatus?: boolean) => {
    if (!activeRoadmap) return;
    const newStatus = !currentStatus;

    storage.updateRoadmapProgress(
      activeRoadmap.id,
      weekNumber,
      dayNumber,
      newStatus,
      currentUser.id
    );

    // Update active in-memory state
    const updatedModules = activeRoadmap.weeklyModules.map((m) => {
      if (m.weekNumber === weekNumber) {
        const updatedTasks = m.dailyTasks.map((t) =>
          t.dayNumber === dayNumber ? { ...t, completed: newStatus } : t
        );
        return {
          ...m,
          dailyTasks: updatedTasks,
          completed: updatedTasks.every((t) => t.completed),
        };
      }
      return m;
    });

    setActiveRoadmap({
      ...activeRoadmap,
      weeklyModules: updatedModules,
    });
  };

  // Calculate Overall Progress
  const totalTasks =
    activeRoadmap?.weeklyModules.reduce((acc, m) => acc + m.dailyTasks.length, 0) || 0;
  const completedTasks =
    activeRoadmap?.weeklyModules.reduce(
      (acc, m) => acc + m.dailyTasks.filter((t) => t.completed).length,
      0
    ) || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const exportMarkdown = () => {
    if (!activeRoadmap) return;
    let md = `# Career Roadmap: ${activeRoadmap.targetRole} (${activeRoadmap.durationWeeks} Weeks)\n\n`;
    md += `Experience Level: ${activeRoadmap.experienceLevel}\n`;
    md += `Overall Completion: ${progressPercentage}%\n\n`;

    activeRoadmap.weeklyModules.forEach((w) => {
      md += `## Week ${w.weekNumber}: ${w.weekTitle}\n`;
      md += `**Objective:** ${w.coreObjective}\n\n`;
      md += `### Recommended Technologies & Docs:\n`;
      w.resources.forEach((r) => {
        md += `- [${r.title}](${r.url}) (${r.provider})\n`;
      });
      md += `\n### Hands-On Project: ${w.handsOnProject.title}\n`;
      md += `${w.handsOnProject.description}\n\n`;
      md += `### Daily Tasks:\n`;
      w.dailyTasks.forEach((t) => {
        md += `- [${t.completed ? 'x' : ' '}] Day ${t.dayNumber}: ${t.taskTitle} (${t.estimatedMinutes} mins) — ${t.exercise}\n`;
      });
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `career-roadmap-${activeRoadmap.targetRole.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Personalized AI Learning Roadmap
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-950 border border-violet-800 text-cyan-300">
                Weekly & Daily Execution
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Customized learning paths with verified official documentation, hands-on portfolio projects, and checkbox progress tracking.
            </p>
          </div>
        </div>

        {activeRoadmap && (
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={exportMarkdown}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#090b10] border border-[#1e2638] hover:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Markdown</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Roadmap Parameters
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. AI Engineer, React Developer, Data Scientist"
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="student">Student / Undergraduate</option>
                <option value="fresher">Fresher / Recent Graduate (0-1 yr)</option>
                <option value="transition">Career Transition / Non-CS Background</option>
                <option value="experienced">Working Professional (1-3 yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Pacing & Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDurationWeeks(4)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    durationWeeks === 4
                      ? 'bg-violet-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-[#090b10] border-[#1e2638] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4 Weeks (Sprint)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationWeeks(8)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    durationWeeks === 8
                      ? 'bg-violet-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-[#090b10] border-[#1e2638] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  8 Weeks (Deep Dive)
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Synthesizing Curriculum...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>{activeRoadmap ? 'Regenerate Learning Roadmap' : 'Generate Learning Roadmap'}</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Card */}
          {activeRoadmap && (
            <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Roadmap Execution
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {progressPercentage}% Completed
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{completedTasks} tasks finished</span>
                <span>{totalTasks - completedTasks} remaining</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Modules Explorer (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeRoadmap ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Target & Scope Banner */}
              <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {activeRoadmap.targetRole} Roadmap
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target Skills: {activeRoadmap.targetSkillsToMaster.join(', ')}
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800">
                  {activeRoadmap.weeklyModules.length} Weekly Milestones
                </span>
              </div>

              {/* Weekly Modules Accordion */}
              {activeRoadmap.weeklyModules.map((module) => {
                const isExpanded = expandedWeek === module.weekNumber;
                const completedInWeek = module.dailyTasks.filter((t) => t.completed).length;

                return (
                  <div
                    key={module.weekNumber}
                    className="rounded-2xl bg-[#0e121b] border border-[#1e2638] overflow-hidden shadow-md transition-colors"
                  >
                    {/* Module Header Bar */}
                    <div
                      onClick={() => setExpandedWeek(isExpanded ? 0 : module.weekNumber)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            module.completed
                              ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                              : 'bg-violet-950 border border-violet-800 text-cyan-300'
                          }`}
                        >
                          W{module.weekNumber}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{module.weekTitle}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{module.coreObjective}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-400">
                          {completedInWeek}/{module.dailyTasks.length} tasks
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 space-y-5 border-t border-[#1e2638] animate-in fade-in duration-150">
                        {/* Core Objective & Tech */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Key Technologies
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {module.recommendedTechnologies.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200 border border-slate-700/60 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2638] space-y-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Verified Official Documentation
                            </span>
                            <div className="space-y-1.5">
                              {module.resources.map((res, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-between group transition-colors"
                                >
                                  <span className="truncate max-w-[220px]">{res.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Hands-On Project */}
                        <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-cyan-400" />
                            <h5 className="text-xs font-bold text-white">
                              Weekly Portfolio Project: {module.handsOnProject.title}
                            </h5>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {module.handsOnProject.description}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                            <span>Deliverables: {module.handsOnProject.deliverables.join(' · ')}</span>
                          </div>
                        </div>

                        {/* Daily Tasks List */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Daily Action Items (Click to complete)
                          </span>
                          <div className="space-y-2">
                            {module.dailyTasks.map((task) => (
                              <div
                                key={task.dayNumber}
                                onClick={() =>
                                  handleToggleTask(module.weekNumber, task.dayNumber, task.completed)
                                }
                                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                  task.completed
                                    ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-300'
                                    : 'bg-[#090b10] border-[#1e2638] text-slate-200 hover:border-slate-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="mt-0.5 text-cyan-400 hover:text-cyan-300 shrink-0"
                                >
                                  {task.completed ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-xs font-semibold ${
                                        task.completed ? 'line-through text-slate-500' : 'text-white'
                                      }`}
                                    >
                                      Day {task.dayNumber}: {task.taskTitle}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      ~{task.estimatedMinutes} mins
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">{task.description}</p>
                                  <p className="text-[10px] text-cyan-300 font-mono pt-0.5">
                                    Exercise: {task.exercise}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ready to Interview CTA */}
              {onNavigateToInterviews && (
                <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Validate Your Mastery</h4>
                      <p className="text-[11px] text-slate-400">
                        Test your technical and behavioral skills in the AI Mock Interview simulator.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToInterviews}
                    className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
                  >
                    Open Mock Interviews →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Active Learning Roadmap</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Configure your target career goal and duration on the left, then click <strong>"Generate Learning Roadmap"</strong> to receive an actionable, daily execution schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
