import React, { useState, useEffect } from 'react';
import { UserProfile, JobApplication } from './types';
import { storage } from './lib/storage';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { ResumeAnalyzer } from './components/ResumeAnalyzer';
import { JobMatcher } from './components/JobMatcher';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { RealJobsFinder } from './components/RealJobsFinder';
import { ApplicationTracker } from './components/ApplicationTracker';
import { PricingPage } from './components/PricingPage';
import { UserProfileComponent } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { SupabaseModal } from './components/SupabaseModal';
import { InterviewPrepModal } from './components/InterviewPrepModal';
import { EmailVerificationGate } from './components/EmailVerificationGate';
import { SkillGapAnalyzer } from './components/SkillGapAnalyzer';
import { MockInterviewPlatform } from './components/MockInterviewPlatform';
import { LearningRoadmap } from './components/LearningRoadmap';
import { JobApplicationAssistant } from './components/JobApplicationAssistant';
import { PortfolioBuilder } from './components/PortfolioBuilder';
import { SalaryInsights } from './components/SalaryInsights';
import { CareerMentor } from './components/CareerMentor';
import {
  fetchCurrentSupabaseUser,
  signOutFromSupabase,
  getSupabaseClient,
  saveApplicationToCloud,
} from './lib/supabase';
import { Lock, Sparkles, UserPlus, LogIn } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(storage.getCurrentUser());
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Cross-tool data transfer states
  const [sharedResumeText, setSharedResumeText] = useState<string>('');
  const [sharedJobDesc, setSharedJobDesc] = useState<string>('');
  const [sharedCompany, setSharedCompany] = useState<string>('');
  const [sharedTitle, setSharedTitle] = useState<string>('');
  const [sharedRole, setSharedRole] = useState<string>('');
  const [sharedSkills, setSharedSkills] = useState<string[]>([]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activePrepApp, setActivePrepApp] = useState<JobApplication | null>(null);

  // Sync Supabase authentication on mount and subscribe to auth lifecycle events
  useEffect(() => {
    // 1. Initial session verification
    fetchCurrentSupabaseUser()
      .then(({ user }) => {
        if (user) {
          storage.setCurrentUser(user);
          setCurrentUser(user);
          setSharedResumeText(storage.getMasterResumeText(user.id));
        } else {
          storage.setCurrentUser(null);
          setCurrentUser(null);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });

    // 2. Real-time auth subscription
    const supabase = getSupabaseClient();
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const { user } = await fetchCurrentSupabaseUser();
            if (user) {
              storage.setCurrentUser(user);
              setCurrentUser(user);
              setSharedResumeText(storage.getMasterResumeText(user.id));
            }
          }
        } else if (event === 'SIGNED_OUT') {
          storage.setCurrentUser(null);
          setCurrentUser(null);
          setCurrentPage('landing');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthOpen(true);
  };

  const handleSelectUser = (user: UserProfile) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
    setSharedResumeText(storage.getMasterResumeText(user.id));
    if (!user.isEmailVerified) {
      setCurrentPage('dashboard');
    } else if (currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOutFromSupabase();
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleEmailConfirmed = async () => {
    const { user } = await fetchCurrentSupabaseUser();
    if (user) {
      storage.setCurrentUser(user);
      setCurrentUser(user);
      setSharedResumeText(storage.getMasterResumeText(user.id));
    }
  };

  const handleNavigateToJobMatcher = (resumeText: string) => {
    setSharedResumeText(resumeText);
    setCurrentPage('job-matcher');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCoverLetter = (
    resumeText: string,
    jobDesc: string = '',
    company: string = '',
    title: string = ''
  ) => {
    setSharedResumeText(resumeText);
    if (jobDesc) setSharedJobDesc(jobDesc);
    if (company) setSharedCompany(company);
    if (title) setSharedTitle(title);
    setCurrentPage('cover-letter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddApplicationToTracker = (appData: Omit<JobApplication, 'id'>) => {
    const created = storage.addApplication(appData, currentUser?.id);
    if (currentUser?.id) {
      saveApplicationToCloud(currentUser.id, created);
    }
    setCurrentPage('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Protected route checking
  const isProtectedWorkspacePage =
    currentPage !== 'landing' && currentPage !== 'pricing' && currentPage !== 'jobs';
  const isUnconfirmedUser = currentUser && !currentUser.isEmailVerified;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-cyan-300">
      {/* Navigation Header */}
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {authLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Verifying user session...</p>
          </div>
        ) : isProtectedWorkspacePage && !currentUser ? (
          /* Route Protection: Unauthenticated Users */
          <div className="max-w-md mx-auto my-16 px-4">
            <div className="p-8 rounded-2xl bg-[#0e121b] border border-[#1e2638] text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-cyan-400 mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Sign In Required</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  CareerPilot AI workspace tools require a free account. Please sign in or register to securely save and access your resumes, ATS scores, and application tracking pipeline.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 shadow-md shadow-violet-900/30 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4 text-cyan-200" />
                  Sign In to Continue
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#131826] border border-[#1e2638] hover:border-slate-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  Create Free Account
                </button>
              </div>
            </div>
          </div>
        ) : isProtectedWorkspacePage && isUnconfirmedUser ? (
          /* Email Verification Gate for Unverified Users */
          <EmailVerificationGate
            email={currentUser.email}
            onVerified={handleEmailConfirmed}
            onSignOut={handleSignOut}
            onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
          />
        ) : (
          /* Main Pages */
          <>
            {currentPage === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onOpenAuth={() => handleOpenAuth('signup')}
              />
            )}

            {currentPage === 'dashboard' && currentUser && (
              <UserDashboard
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onSelectApplicationForPrep={(app) => setActivePrepApp(app)}
              />
            )}

            {currentPage === 'resume-analyzer' && currentUser && (
              <ResumeAnalyzer
                currentUser={currentUser}
                onNavigateToJobMatcher={handleNavigateToJobMatcher}
                onNavigateToCoverLetter={handleNavigateToCoverLetter}
              />
            )}

            {currentPage === 'job-matcher' && currentUser && (
              <JobMatcher
                currentUser={currentUser}
                initialResumeText={sharedResumeText}
                onNavigateToCoverLetter={handleNavigateToCoverLetter}
                onAddApplicationToTracker={handleAddApplicationToTracker}
              />
            )}

            {currentPage === 'cover-letter' && currentUser && (
              <CoverLetterGenerator
                currentUser={currentUser}
                initialResumeText={sharedResumeText}
                initialJobDesc={sharedJobDesc}
                initialCompany={sharedCompany}
                initialTitle={sharedTitle}
              />
            )}

            {currentPage === 'tracker' && currentUser && (
              <ApplicationTracker currentUser={currentUser} />
            )}

            {currentPage === 'career-mentor' && currentUser && (
              <CareerMentor
                currentUser={currentUser}
                onNavigateToTool={(toolId) => {
                  setCurrentPage(toolId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'skill-gap' && currentUser && (
              <SkillGapAnalyzer
                currentUser={currentUser}
                initialResumeText={sharedResumeText}
                onNavigateToRoadmap={(role, skills) => {
                  setSharedRole(role);
                  setSharedSkills(skills);
                  setCurrentPage('learning-roadmap');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToJobs={(role) => {
                  setCurrentPage('jobs');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'mock-interviews' && currentUser && (
              <MockInterviewPlatform
                currentUser={currentUser}
                initialRole={sharedRole}
                onNavigateToRoadmap={() => {
                  setCurrentPage('learning-roadmap');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'learning-roadmap' && currentUser && (
              <LearningRoadmap
                currentUser={currentUser}
                initialRole={sharedRole}
                initialSkills={sharedSkills}
                onNavigateToInterviews={() => {
                  setCurrentPage('mock-interviews');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'outreach-assistant' && currentUser && (
              <JobApplicationAssistant
                currentUser={currentUser}
                initialCompany={sharedCompany}
                initialTitle={sharedTitle}
                onNavigateToTracker={() => {
                  setCurrentPage('tracker');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'portfolio-builder' && currentUser && (
              <PortfolioBuilder currentUser={currentUser} />
            )}

            {currentPage === 'salary-insights' && currentUser && (
              <SalaryInsights
                currentUser={currentUser}
                initialRole={sharedRole}
                onNavigateToJobs={() => {
                  setCurrentPage('jobs');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'jobs' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <RealJobsFinder
                  currentUser={currentUser || {
                    id: '',
                    name: 'Guest User',
                    email: '',
                    role: 'jobseeker',
                    plan: 'free',
                    avatarUrl: '',
                    headline: '',
                    universityOrCompany: '',
                    targetRole: '',
                    bio: '',
                    monthlyAnalysisCount: 0,
                    monthlyAnalysisLimit: 10,
                    createdAt: '',
                  }}
                  onNavigateToJobMatcher={(jobDesc, company, title) => {
                    setSharedJobDesc(jobDesc);
                    setSharedCompany(company);
                    setSharedTitle(title);
                    setCurrentPage('job-matcher');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToCoverLetter={(jobDesc, company, title) => {
                    handleNavigateToCoverLetter(sharedResumeText, jobDesc, company, title);
                  }}
                  onAddApplicationToTracker={(appData) => {
                    if (!currentUser) {
                      handleOpenAuth('signin');
                      return;
                    }
                    handleAddApplicationToTracker(appData);
                  }}
                />
              </div>
            )}

            {currentPage === 'pricing' && (
              <PricingPage
                currentUser={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
                onNavigate={handleNavigate}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentPage === 'profile' && currentUser && (
              <UserProfileComponent
                currentUser={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
                onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'admin' && currentUser && (
              <AdminDashboard />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onOpenSupabaseModal={() => {
          setIsAuthOpen(false);
          setIsSupabaseOpen(true);
        }}
        initialMode={authModalMode}
      />

      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />

      {activePrepApp && (
        <InterviewPrepModal
          application={activePrepApp}
          onClose={() => setActivePrepApp(null)}
          resumeText={sharedResumeText || (currentUser ? storage.getMasterResumeText(currentUser.id) : '')}
        />
      )}
    </div>
  );
}
