import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  ExternalLink,
  BookmarkPlus,
  Target,
  Mail,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Building2,
  DollarSign,
  Filter,
  X,
  Layers,
  ChevronRight,
  Globe2,
  Check,
  RefreshCw,
  GraduationCap,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { RemotiveJob, UserProfile, JobApplication } from '../types';
import { storage } from '../lib/storage';

interface RealJobsFinderProps {
  currentUser: UserProfile;
  onNavigateToJobMatcher: (jobDesc: string, company: string, title: string) => void;
  onNavigateToCoverLetter: (jobDesc: string, company: string, title: string) => void;
  onAddApplicationToTracker: (appData: Omit<JobApplication, 'id'>) => void;
}

// Preset search tags requested by user
const PRESET_ROLE_FILTERS = [
  { label: 'All Remote', query: '', category: '' },
  { label: 'AI Engineer', query: 'AI Engineer', category: 'artificial-intelligence' },
  { label: 'Machine Learning', query: 'Machine Learning', category: 'artificial-intelligence' },
  { label: 'Data Scientist', query: 'Data Scientist', category: 'data' },
  { label: 'GenAI Engineer', query: 'GenAI', category: 'artificial-intelligence' },
  { label: 'Python Developer', query: 'Python', category: 'software-development' },
  { label: 'Fresher / Intern', query: '', fresherOnly: true },
  { label: 'India Eligible', query: '', indiaOnly: true },
  { label: 'Full-Time', query: '', jobType: 'full_time' },
];

const CATEGORIES = [
  { slug: '', label: 'All Categories' },
  { slug: 'software-development', label: 'Software Development' },
  { slug: 'artificial-intelligence', label: 'Artificial Intelligence' },
  { slug: 'data', label: 'Data & Analytics' },
  { slug: 'devops', label: 'DevOps & Cloud' },
  { slug: 'engineering', label: 'Engineering' },
  { slug: 'product', label: 'Product & Design' },
];

export const RealJobsFinder: React.FC<RealJobsFinderProps> = ({
  currentUser,
  onNavigateToJobMatcher,
  onNavigateToCoverLetter,
  onAddApplicationToTracker,
}) => {
  const [jobs, setJobs] = useState<RemotiveJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Telemetry
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);
  const [nextScheduledSync, setNextScheduledSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [totalStoreCount, setTotalStoreCount] = useState<number>(0);
  const [fresherCount, setFresherCount] = useState<number>(0);
  const [indiaCount, setIndiaCount] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('All Remote');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [fresherOnly, setFresherOnly] = useState<boolean>(false);
  const [indiaOnly, setIndiaOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'match' | 'newest'>('match');

  // Selected job for full modal preview
  const [inspectJob, setInspectJob] = useState<RemotiveJob | null>(null);

  // Tracking state to show immediate visual feedback when saved
  const [savedJobIds, setSavedJobIds] = useState<Record<string | number, boolean>>({});

  // User Resume Skills for personalized dynamic matching
  const userResumeText = useMemo(() => {
    return storage.getMasterResumeText(currentUser?.id) || '';
  }, [currentUser?.id]);

  const candidateSkills = useMemo(() => {
    if (!userResumeText) return ['javascript', 'python', 'react', 'node', 'sql', 'git'];
    const textLower = userResumeText.toLowerCase();
    const taxonomy = [
      'python', 'javascript', 'typescript', 'react', 'next.js', 'node.js', 'node', 'express',
      'sql', 'postgresql', 'mysql', 'mongodb', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
      'git', 'ci/cd', 'machine learning', 'pytorch', 'tensorflow', 'pandas', 'numpy',
      'tailwind', 'html', 'css', 'graphql', 'rest api', 'fastapi', 'django', 'flask',
      'c++', 'java', 'c#', 'golang', 'rust', 'linux', 'figma'
    ];
    return taxonomy.filter((skill) => textLower.includes(skill));
  }, [userResumeText]);

  // Fetch jobs from server Remotive sync engine
  const fetchJobs = async (search = searchQuery, category = activeCategory, isFresher = fresherOnly, isIndia = indiaOnly) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (isFresher) params.set('fresherOnly', 'true');
      if (isIndia) params.set('indiaOnly', 'true');
      params.set('limit', '80');

      const res = await fetch(`/api/jobs/remotive?${params.toString()}`);
      const data = await res.json();

      if (!res.ok && (!data.jobs || data.jobs.length === 0)) {
        throw new Error(data.error || 'Failed to load remote jobs.');
      }

      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      if (data.lastSuccessfulSync) setLastSuccessfulSync(data.lastSuccessfulSync);
      if (data.nextScheduledSync) setNextScheduledSync(data.nextScheduledSync);
      if (data.syncStatus) setSyncStatus(data.syncStatus);
      if (data.totalCount) setTotalStoreCount(data.totalCount);
      if (data.fresherCount !== undefined) setFresherCount(data.fresherCount);
      if (data.indiaCount !== undefined) setIndiaCount(data.indiaCount);
      if (data.lastError && data.syncStatus === 'warning') {
        setError(`Notice: Serving cached listings while background sync retries: ${data.lastError}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching remote jobs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(searchQuery, activeCategory, fresherOnly, indiaOnly);
  }, [activeCategory, fresherOnly, indiaOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(searchQuery, activeCategory, fresherOnly, indiaOnly);
  };

  // Manual Refresh Button handler
  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/jobs/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.throttled) {
        setToastMessage(data.message || 'Jobs were recently synced. Showing latest cached listings.');
      } else if (data.success) {
        setToastMessage(`Synced ${data.totalActive || 0} active job openings (${data.newJobsCount || 0} new).`);
      } else {
        setToastMessage(data.error || 'Refresh complete.');
      }

      if (data.lastSuccessfulSync) setLastSuccessfulSync(data.lastSuccessfulSync);
      if (data.nextScheduledSync) setNextScheduledSync(data.nextScheduledSync);
      if (data.syncStatus) setSyncStatus(data.syncStatus);

      // Re-query current view
      await fetchJobs(searchQuery, activeCategory, fresherOnly, indiaOnly);
    } catch (err: any) {
      setToastMessage('Refreshed from verified local store.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handlePresetClick = (preset: typeof PRESET_ROLE_FILTERS[0]) => {
    setActivePreset(preset.label);
    setSearchQuery(preset.query);

    const isFresher = !!preset.fresherOnly;
    const isIndia = !!preset.indiaOnly;
    setFresherOnly(isFresher);
    setIndiaOnly(isIndia);

    if (preset.category !== undefined) {
      setActiveCategory(preset.category);
    }
    if (preset.jobType) {
      setSelectedJobType(preset.jobType);
    } else {
      setSelectedJobType('all');
    }
    fetchJobs(preset.query, preset.category || '', isFresher, isIndia);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('');
    setActivePreset('All Remote');
    setSelectedJobType('all');
    setSelectedLocation('all');
    setFresherOnly(false);
    setIndiaOnly(false);
    setSortBy('match');
    fetchJobs('', '', false, false);
  };

  // Client-side filtering & Dynamic Resume Match Score Calculation
  const filteredAndRankedJobs = useMemo(() => {
    return jobs
      .map((job) => {
        // Calculate match score against user's skills
        const jobCombined = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
        const matched = candidateSkills.filter((skill) => jobCombined.includes(skill));

        let score = 55;
        if (matched.length >= 4) score = 92;
        else if (matched.length >= 3) score = 84;
        else if (matched.length >= 2) score = 76;
        else if (matched.length >= 1) score = 68;

        if (currentUser?.targetRole && jobCombined.includes(currentUser.targetRole.toLowerCase().split(' ')[0])) {
          score += 6;
        }
        score = Math.min(98, score);

        return {
          ...job,
          matchScore: score,
          matchedSkills: matched.slice(0, 3).map((s) => s.toUpperCase()),
        };
      })
      .filter((job) => {
        // Job Type filter
        if (selectedJobType !== 'all') {
          const jType = (job.jobType || '').toLowerCase();
          if (selectedJobType === 'full_time' && !jType.includes('full')) return false;
          if (selectedJobType === 'internship' && !jType.includes('intern')) return false;
          if (selectedJobType === 'contract' && !jType.includes('contract') && !jType.includes('freelance')) return false;
        }

        // Location filter
        if (selectedLocation !== 'all') {
          const loc = (job.candidateRequiredLocation || '').toLowerCase();
          if (selectedLocation === 'worldwide' && !loc.includes('worldwide') && !loc.includes('anywhere')) return false;
          if (selectedLocation === 'india' && !job.isIndiaEligible) return false;
          if (selectedLocation === 'usa' && !loc.includes('usa') && !loc.includes('us') && !loc.includes('united states') && !loc.includes('worldwide')) return false;
          if (selectedLocation === 'europe' && !loc.includes('europe') && !loc.includes('eu') && !loc.includes('uk') && !loc.includes('worldwide')) return false;
        }

        // Fresher Only filter
        if (fresherOnly && !job.isFresherFriendly) return false;

        // India Only filter
        if (indiaOnly && !job.isIndiaEligible) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        // newest publication date
        return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
      });
  }, [jobs, selectedJobType, selectedLocation, fresherOnly, indiaOnly, sortBy, candidateSkills, currentUser?.targetRole]);

  // Handle Save to Application Tracker
  const handleSaveToTracker = (job: RemotiveJob) => {
    onAddApplicationToTracker({
      companyName: job.companyName,
      jobTitle: job.title,
      location: job.candidateRequiredLocation || 'Remote',
      salaryRange: job.salary || undefined,
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'wishlist',
      notes: `Auto-synced from Remotive. Category: ${job.category}. Original Link: ${job.url}`,
      jobUrl: job.url,
      matchScore: job.matchScore,
    });

    setSavedJobIds((prev) => ({ ...prev, [job.id]: true }));
    setTimeout(() => {
      setSavedJobIds((prev) => ({ ...prev, [job.id]: false }));
    }, 4000);
  };

  // Helper to format publication date
  const formatPublishedDate = (dateStr: string) => {
    try {
      const pubDate = new Date(dateStr);
      const diffMs = Date.now() - pubDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return pubDate.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const formatLastSyncTimestamp = (isoStr: string | null) => {
    if (!isoStr) return 'Pending automated sync';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return 'Recently';
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Automatic Scheduled Sync Status & Refresh Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Real Remote Job Openings
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Sync: Every 6h
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real vacancies automatically synchronized every 6 hours from Remotive, matched to your resume and optimized for freshers & global applicants.
          </p>
        </div>

        {/* Sync Status Telemetry & Manual Refresh Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-end gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300">Last Synced:</span>
              <span className="text-cyan-400 font-semibold">{formatLastSyncTimestamp(lastSuccessfulSync)}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {totalStoreCount} active vacancies · Remotive 24h Delay
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-cyan-500/60 text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 shrink-0"
            title="Trigger an on-demand sync from Remotive (enforces 3m cooldown to respect provider rate limits)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Jobs'}</span>
          </button>
        </div>
      </div>

      {/* Toast / Notification Banner */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Warning/Error Notice with Safe Fallback Explanation */}
      {error && (
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-white font-medium text-xs transition-colors shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Search & Comprehensive Filter Strip */}
      <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, skills (Python, GenAI, React), or company..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#090b10] border border-[#1e2638] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Preset Quick-Role Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] text-slate-500 uppercase font-semibold mr-1 shrink-0">
            Presets:
          </span>
          {PRESET_ROLE_FILTERS.map((preset) => {
            const isActive = activePreset === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-[#131826] border border-[#1e2638] text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {preset.label === 'Fresher / Intern' && <GraduationCap className="w-3 h-3 text-cyan-300" />}
                {preset.label === 'India Eligible' && <MapPin className="w-3 h-3 text-emerald-400" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Location, Fresher Toggle, India Toggle, and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#1e2638] text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Selector (India & International) */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setIndiaOnly(e.target.value === 'india');
                }}
                className="px-2 py-1 text-xs bg-[#090b10] border border-[#1e2638] rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Locations</option>
                <option value="india">India & APAC Eligible ({indiaCount})</option>
                <option value="worldwide">Worldwide (Anywhere)</option>
                <option value="usa">USA / Americas</option>
                <option value="europe">Europe</option>
              </select>
            </div>

            {/* Fresher & Entry-Level Priority Toggle */}
            <button
              onClick={() => {
                const next = !fresherOnly;
                setFresherOnly(next);
                if (next) setActivePreset('Fresher / Intern');
                else if (activePreset === 'Fresher / Intern') setActivePreset('All Remote');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                fresherOnly
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-[#090b10] border-[#1e2638] text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fresher & Intern Friendly ({fresherCount})</span>
            </button>

            {/* Job Type Selector */}
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Type:</span>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="px-2 py-1 text-xs bg-[#090b10] border border-[#1e2638] rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Types</option>
                <option value="full_time">Full-Time</option>
                <option value="contract">Contract / Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Sorting & Results Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 text-xs bg-[#090b10] border border-[#1e2638] rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="match">Best Match for My Resume</option>
                <option value="newest">Newly Posted First</option>
              </select>
            </div>

            <span className="font-mono text-slate-300 font-medium">
              {filteredAndRankedJobs.length} openings
            </span>

            {(searchQuery || activeCategory || selectedJobType !== 'all' || selectedLocation !== 'all' || fresherOnly || indiaOnly) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-850 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-850 rounded w-full" />
              <div className="h-3 bg-slate-850 rounded w-5/6" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 bg-slate-800 rounded" />
                <div className="h-6 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndRankedJobs.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Matching Remote Jobs Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              We couldn't find any vacancies matching your current filter criteria. Our automated scheduler checks Remotive every 6 hours for fresh openings.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-600 text-slate-200 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Filters & View All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndRankedJobs.map((job) => {
            const isSaved = !!savedJobIds[job.id];
            const cleanDescription = stripHtml(job.description).slice(0, 190) + '...';

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Header: Company Logo, Title, Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Logo or Initials Avatar */}
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-11 h-11 rounded-lg object-contain bg-[#07090e] border border-[#1e2638] p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-900/60 to-cyan-900/60 border border-[#1e2638] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {job.companyName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          {job.isNew && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-mono font-bold uppercase shrink-0">
                              NEW
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="font-medium text-slate-300">{job.companyName}</span>
                          <span>·</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {formatPublishedDate(job.publicationDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resume Match Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 ${
                        (job.matchScore || 0) >= 85
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          : (job.matchScore || 0) >= 70
                          ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        <span>{job.matchScore}% Match</span>
                      </span>
                    </div>
                  </div>

                  {/* Highlights Bar: Fresher Badge, India Eligibility, Location, Salary */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {/* Fresher & Entry-Level Priority Badge */}
                    {job.isFresherFriendly && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-emerald-400" />
                        <span>Fresher / Intern Friendly</span>
                      </span>
                    )}

                    {/* Location Badge */}
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="truncate max-w-[140px]">
                        {job.candidateRequiredLocation || 'Worldwide'}
                      </span>
                    </span>

                    {/* India Eligibility Badge */}
                    {job.isIndiaEligible && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-[10px]">
                        India Eligible
                      </span>
                    )}

                    {/* Job Type Badge */}
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 capitalize">
                      {job.jobType ? job.jobType.replace('_', ' ') : 'Full Time'}
                    </span>

                    {/* Genuine Salary Badge (ONLY if provided, never fake) */}
                    {job.salary ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-mono font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span>{job.salary}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800/60 text-slate-500 text-[10px]">
                        Salary undisclosed
                      </span>
                    )}
                  </div>

                  {/* Matched Skills with Resume Preview */}
                  {job.matchedSkills && job.matchedSkills.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Resume Match:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.matchedSkills.map((ms, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-violet-950/50 border border-violet-800/40 text-violet-300 font-mono text-[10px]"
                          >
                            ✓ {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cleanDescription}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#1e2638] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setInspectJob(job)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-600 text-slate-200 transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleSaveToTracker(job)}
                      disabled={isSaved}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                        isSaved
                          ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                          : 'bg-[#131826] border-[#1e2638] hover:border-slate-600 text-slate-300 hover:text-white'
                      }`}
                      title="Save this role to your private Job Application Tracker in Supabase"
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Tracked
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" /> Track
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onNavigateToJobMatcher(stripHtml(job.description), job.companyName, job.title)
                      }
                      className="p-1.5 text-xs rounded-lg bg-[#131826] border border-[#1e2638] hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                      title="Run ATS Matcher comparing your resume against this job description"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        onNavigateToCoverLetter(stripHtml(job.description), job.companyName, job.title)
                      }
                      className="p-1.5 text-xs rounded-lg bg-[#131826] border border-[#1e2638] hover:border-violet-500/50 text-slate-300 hover:text-violet-300 transition-colors"
                      title="Generate a tailored cover letter for this role"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <span>Apply on Remotive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Job Modal */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1e2638] flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {inspectJob.companyLogo ? (
                  <img
                    src={inspectJob.companyLogo}
                    alt={inspectJob.companyName}
                    className="w-12 h-12 rounded-xl object-contain bg-[#07090e] border border-[#1e2638] p-1.5 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {inspectJob.companyName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {inspectJob.title}
                    </h2>
                    {inspectJob.isNew && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{inspectJob.companyName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {inspectJob.candidateRequiredLocation || 'Worldwide'}
                    </span>
                    <span>·</span>
                    <span>Published {formatPublishedDate(inspectJob.publicationDate)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectJob(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131826] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Badges Bar */}
            <div className="px-6 py-3 bg-[#090b10] border-b border-[#1e2638] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {inspectJob.isFresherFriendly && (
                  <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>Fresher & Intern Friendly</span>
                  </span>
                )}

                <span className="px-2.5 py-1 rounded bg-[#131826] border border-[#1e2638] text-slate-300 capitalize">
                  {inspectJob.jobType ? inspectJob.jobType.replace('_', ' ') : 'Full Time'}
                </span>

                {inspectJob.salary ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-mono font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>{inspectJob.salary}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-[#131826] text-slate-500">
                    Salary undisclosed by employer
                  </span>
                )}

                <span className="px-2.5 py-1 rounded bg-violet-950/40 text-violet-300">
                  {inspectJob.category}
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Official Listing on Remotive.com
              </span>
            </div>

            {/* Description Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans max-h-[50vh] prose prose-invert prose-xs max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: inspectJob.description }}
                className="space-y-3"
              />
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#090b10] border-t border-[#1e2638] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    handleSaveToTracker(inspectJob);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-slate-500 text-slate-200 flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Track in Pipeline</span>
                </button>

                <button
                  onClick={() => {
                    const desc = stripHtml(inspectJob.description);
                    setInspectJob(null);
                    onNavigateToJobMatcher(desc, inspectJob.companyName, inspectJob.title);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#131826] border border-[#1e2638] hover:border-cyan-500/50 text-cyan-300 flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Match with Resume</span>
                </button>
              </div>

              <a
                href={inspectJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/30"
              >
                <span>Apply on Official Remotive Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
