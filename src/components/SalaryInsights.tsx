import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  MapPin,
  Sparkles,
  Layers,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, SalaryInsightsResult } from '../types';
import { storage } from '../lib/storage';

interface SalaryInsightsProps {
  currentUser: UserProfile;
  initialRole?: string;
  onNavigateToJobs?: (role: string) => void;
}

const COUNTRIES = [
  { name: 'India', cities: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Mumbai'] },
  { name: 'United States', cities: ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'] },
  { name: 'United Kingdom', cities: ['London', 'Manchester', 'Edinburgh', 'Remote'] },
  { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Remote'] },
  { name: 'Germany', cities: ['Berlin', 'Munich', 'Frankfurt', 'Remote'] },
  { name: 'Singapore', cities: ['Singapore (Central)', 'Remote APAC'] },
];

const INDUSTRIES = [
  'Technology & Software (SaaS)',
  'Artificial Intelligence & Deep Tech',
  'Fintech & Digital Banking',
  'Healthcare & BioTech',
  'E-Commerce & Digital Marketplaces',
  'Enterprise Cloud & Infrastructure',
];

export const SalaryInsights: React.FC<SalaryInsightsProps> = ({
  currentUser,
  initialRole = '',
  onNavigateToJobs,
}) => {
  const [jobTitle, setJobTitle] = useState<string>(
    initialRole || currentUser.targetRole || 'AI / Machine Learning Engineer'
  );
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [experienceLevel, setExperienceLevel] = useState<string>('fresher');
  const [industry, setIndustry] = useState<string>('Technology & Software (SaaS)');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeResult, setActiveResult] = useState<SalaryInsightsResult | null>(() => {
    const saved = storage.getSalarySearches(currentUser.id);
    return saved[0] || null;
  });

  const savedSearches = storage.getSalarySearches(currentUser.id);

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found && found.cities.length > 0) {
      setSelectedCity(found.cities[0]);
    }
  };

  const handleFetchInsights = async () => {
    if (!jobTitle.trim()) {
      setError('Please provide a job title to research.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/salary-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          country: selectedCountry,
          city: selectedCity,
          experienceLevel,
          industry,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: SalaryInsightsResult = await response.json();

      setActiveResult(data);
      storage.saveSalarySearch(data, currentUser.id);
    } catch (err: any) {
      console.error('Salary research failed:', err);
      setError('Could not fetch salary insights. Please verify connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number, cur: string) => {
    if (cur.includes('LPA') || cur.includes('INR')) {
      return `₹${val} LPA`;
    }
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0e121b] via-[#131826] to-[#0e121b] border border-[#1e2638] shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-700 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Salary & Career Insights
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                Market Benchmarks
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Verified compensation bands, fresher hiring opportunities, high-value skills premium, and 4-tier career progression ladders.
            </p>
          </div>
        </div>

        {savedSearches.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#090b10] border border-[#1e2638] px-3 py-2 rounded-xl">
            <History className="w-4 h-4 text-cyan-400" />
            <span>{savedSearches.length} past queries saved</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Filters (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4 shadow-lg">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Compensation Query
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. AI Engineer, Python Developer, Data Scientist"
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                City / Metro Market
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {(COUNTRIES.find((c) => c.name === selectedCountry)?.cities || []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Experience Tier
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="fresher">Fresher / Entry-Level (0 – 1 Year)</option>
                <option value="junior">Junior Specialist (1 – 3 Years)</option>
                <option value="mid-level">Mid-Level Engineer (3 – 5 Years)</option>
                <option value="senior">Senior Engineer (5 – 8 Years)</option>
                <option value="staff">Staff / Lead Engineer (8+ Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Industry Sector
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#090b10] border border-[#1e2638] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleFetchInsights}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 transition-all shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Synthesizing Labor Economics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Analyze Salary & Market Trends</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output: 8 Cols */}
        <div className="lg:col-span-8 space-y-6">
          {activeResult ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Compensation Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0e121b] via-[#111624] to-[#0e121b] border border-[#1e2638] shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400">
                      {activeResult.city}, {activeResult.country} · {activeResult.industry}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      {activeResult.jobTitle}
                    </h3>
                  </div>

                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-violet-950/80 border border-violet-700 text-cyan-300 uppercase">
                    {activeResult.experienceLevel} Tier
                  </span>
                </div>

                {/* 4-Band Metric Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">25th Percentile</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-slate-200">
                      {formatCurrency(activeResult.salaryBand.min, activeResult.salaryBand.currency)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-violet-950/50 border border-violet-800 text-center">
                    <span className="text-[10px] text-cyan-400 block uppercase font-bold">Median Benchmark</span>
                    <span className="font-mono text-base sm:text-lg font-extrabold text-cyan-300">
                      {formatCurrency(activeResult.salaryBand.median, activeResult.salaryBand.currency)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">75th Percentile</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-slate-200">
                      {formatCurrency(activeResult.salaryBand.p75, activeResult.salaryBand.currency)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Top 90th %</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                      {formatCurrency(activeResult.salaryBand.max, activeResult.salaryBand.currency)}
                    </span>
                  </div>
                </div>

                {/* Entry-Level / Fresher Opportunity Card */}
                {activeResult.entryLevelOpportunities && (
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Fresher Hiring Outlook:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-900/60 text-cyan-200">
                          {activeResult.entryLevelOpportunities.availabilityRating}
                        </span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          ({activeResult.entryLevelOpportunities.fresherAverageSalary})
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {activeResult.entryLevelOpportunities.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Demand Skills & Premium */}
              <div className="p-5 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Top Skills Driving Higher Compensation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeResult.topInDemandSkills.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#090b10] border border-[#1e2638] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{item.skill}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{item.demandLevel} Demand</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {item.salaryPremium}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4-Step Progression Ladder */}
              <div className="p-5 rounded-2xl bg-[#0e121b] border border-[#1e2638] space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Career Progression Ladder & Tenure Expectations
                </h4>
                <div className="space-y-2.5">
                  {activeResult.careerProgressionLadder.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{step.level}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({step.typicalTenure})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{step.keyMilestone}</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-cyan-300 shrink-0">
                        {step.expectedCompensation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Roles & Trends */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Adjacent Roles to Explore
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {activeResult.relatedJobRoles.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-300">
                        <span>{r.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{r.similarity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Market Dynamics
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {activeResult.industryTrends.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Attribution and Disclaimer */}
              <p className="text-[11px] text-slate-500 font-mono italic">
                {activeResult.dataSourceNote}
              </p>

              {/* CTA to Find Jobs */}
              {onNavigateToJobs && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onNavigateToJobs(activeResult.jobTitle)}
                    className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Browse Verified Remote Jobs for {activeResult.jobTitle}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Research Career Compensation</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Select your target role, metro area, and experience tier on the left to review verified labor market salary distributions and high-demand skills.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
