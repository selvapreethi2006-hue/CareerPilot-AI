import React from 'react';
import {
  Compass,
  LayoutDashboard,
  FileText,
  Target,
  Mail,
  Briefcase,
  CreditCard,
  User,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Database,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredSupabaseConfig } from '../lib/supabase';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenSupabaseModal: () => void;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onOpenAuth,
  onOpenSupabaseModal,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const isSupabaseConnected = getStoredSupabaseConfig().isConnected;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { id: 'job-matcher', label: 'JD Matcher', icon: Target },
    { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
    { id: 'tracker', label: 'Job Tracker', icon: Briefcase },
    { id: 'pricing', label: 'Access & Plans', icon: Sparkles },
  ];

  if (currentUser.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: ShieldCheck });
  }

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#090b10]/90 backdrop-blur-md border-b border-[#1e2638] h-16 flex items-center justify-between px-4 lg:px-8">
        {/* Zone 1: Wordmark / Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#090b10] rounded-[7px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                CareerPilot <span className="text-cyan-400 font-extrabold text-sm">AI</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => handleNavClick('landing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentPage === 'landing'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Home
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Supabase honest connection status badge */}
          <button
            onClick={onOpenSupabaseModal}
            title="Configure Supabase Integration"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700 transition-colors"
          >
            <Database className={`w-3 h-3 ${isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isSupabaseConnected ? 'Supabase Connected' : 'Supabase (Not Connected)'}</span>
          </button>

          {/* User profile button & dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-[#1e2638] bg-[#0e121b] hover:border-slate-700 transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-violet-500/40"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                  100% Free Access
                  {currentUser.isSupabaseUser ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                      Cloud
                    </span>
                  ) : (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                      Demo
                    </span>
                  )}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-lg bg-[#0e121b] border border-[#1e2638] shadow-2xl py-1 z-50">
                <div className="px-3 py-2 border-b border-[#1e2638]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white truncate max-w-[160px]">{currentUser.name}</p>
                    {currentUser.isSupabaseUser && (
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Usage:</span>
                    <span className="font-mono text-cyan-400">
                      {currentUser.monthlyAnalysisCount} audits (Unlimited)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleNavClick('profile');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                >
                  <User className="w-3.5 h-3.5" />
                  Profile & Settings
                </button>

                <button
                  onClick={() => {
                    handleNavClick('pricing');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-slate-800/60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Access & Plans (100% Free)
                </button>

                <button
                  onClick={() => {
                    onOpenSupabaseModal();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase Config & Schema
                </button>

                <div className="border-t border-[#1e2638] my-1" />

                {currentUser.isSupabaseUser ? (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out (Supabase)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-slate-800/60"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Sign In to Real Supabase Account
                    </button>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800/60"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Switch Demo Persona
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#0e121b] border border-[#1e2638] text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-[#090b10] border-b border-[#1e2638] p-4 z-40 shadow-2xl flex flex-col gap-2">
          <button
            onClick={() => handleNavClick('landing')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'landing' ? 'bg-cyan-950/60 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            Landing Page
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-cyan-950/60 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#1e2638] flex flex-col gap-2">
            <button
              onClick={() => {
                handleNavClick('profile');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50"
            >
              <User className="w-4 h-4" />
              Profile & Settings
            </button>
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
            >
              Switch Account / Sign In
            </button>
          </div>
        </div>
      )}
    </>
  );
};
