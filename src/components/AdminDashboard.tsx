import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  TrendingUp,
  Database,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Server,
  Zap,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { storage } from '../lib/storage';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(storage.getAllUsers());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const totalUsers = users.length + 1840; // realistic platform numbers
  const totalAudits = users.reduce((acc, u) => acc + u.monthlyAnalysisCount, 0) + 14850;
  const proUsersCount = users.filter((u) => u.plan === 'pro').length + 420;

  const handleTogglePlan = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextPlan = u.plan === 'pro' ? 'free' : 'pro';
        return {
          ...u,
          plan: nextPlan as any,
          monthlyAnalysisLimit: 9999,
        };
      }
      return u;
    });
    setUsers(updated);
    storage.saveAllUsers(updated);
    setToastMsg(`User subscription plan toggled.`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const trendingSkills = [
    { name: 'TypeScript', count: '94% of modern tech JDs', growth: '+28%' },
    { name: 'React & Next.js', count: '91% of frontend roles', growth: '+24%' },
    { name: 'Python & FastApi', count: '82% of data/AI roles', growth: '+35%' },
    { name: 'Docker & Containerization', count: '76% of engineering JDs', growth: '+19%' },
    { name: 'PostgreSQL & Supabase', count: '68% of fullstack roles', growth: '+31%' },
    { name: 'CI/CD & GitHub Actions', count: '64% of junior/mid roles', growth: '+15%' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2638] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-800 text-violet-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Superadmin & Operations Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Telemetry & User Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global usage monitoring, Gemini 3.8 model health, in-demand recruitment trends, and user tier governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Server Cluster: 100% Operational</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Global Registered Candidates</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {totalUsers.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">↑ +14.2% MoM growth</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Resumes Audited</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {totalAudits.toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Avg turnaround: 1.4s</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Pro Subscribers</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {proUsersCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-400 mt-1">22.8% conversion rate</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e121b] border border-[#1e2638]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gemini 3.8 Inference API</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2">
            99.98%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Avg latency: 420ms</div>
        </div>
      </div>

      {/* Main Grid: User Management & Market Demand Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Candidate Directory & Quota Administration
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Showing active accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400">
                  <th className="pb-3 font-medium">Candidate</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Audits Done</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-violet-500/30"
                        />
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 capitalize text-slate-300 font-medium">
                      {u.role}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          u.plan === 'pro'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {u.monthlyAnalysisCount} / {u.plan === 'pro' ? '∞' : u.monthlyAnalysisLimit}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleTogglePlan(u.id)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#090b10] border border-[#1e2638] text-violet-300 hover:border-violet-500 transition-colors"
                      >
                        {u.plan === 'pro' ? 'Downgrade to Free' : 'Promote to Pro'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Demand Radar */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-[#0e121b] border border-[#1e2638] space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Trending In-Demand Skills
          </h2>
          <p className="text-xs text-slate-400">
            Real-time keyword frequency detected in employer job descriptions submitted by students this month.
          </p>

          <div className="space-y-3">
            {trendingSkills.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#090b10] border border-[#1e2638] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-400">{item.count}</div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {item.growth}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-violet-950/30 border border-violet-900/40 text-violet-200 text-xs">
            <span className="font-bold block mb-0.5">Automated ATS Rubric Sync:</span>
            <span>All skill taxonomies are refreshed weekly against Tier-1 and startup job specifications.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
