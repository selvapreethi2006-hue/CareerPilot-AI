import React, { useState, useEffect } from 'react';
import { UserProfile, JobApplication } from './types';
import { storage, DEMO_USERS } from './lib/storage';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { ResumeAnalyzer } from './components/ResumeAnalyzer';
import { JobMatcher } from './components/JobMatcher';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { ApplicationTracker } from './components/ApplicationTracker';
import { PricingPage } from './components/PricingPage';
import { UserProfileComponent } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { SupabaseModal } from './components/SupabaseModal';
import { InterviewPrepModal } from './components/InterviewPrepModal';
import { EmailVerificationGate } from './components/EmailVerificationGate';
import {
  fetchCurrentSupabaseUser,
  signOutFromSupabase,
  getSupabaseClient,
} from './lib/supabase';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());

  // Cross-tool data transfer states
  const [sharedResumeText, setSharedResumeText] = useState<string>(storage.getMasterResumeText());
  const [sharedJobDesc, setSharedJobDesc] = useState<string>('');
  const [sharedCompany, setSharedCompany] = useState<string>('');
  const [sharedTitle, setSharedTitle] = useState<string>('');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activePrepApp, setActivePrepApp] = useState<JobApplication | null>(null);

  // Sync Supabase authentication on mount and subscribe to auth lifecycle events
  useEffect(() => {
    // 1. Initial session verification
    fetchCurrentSupabaseUser().then(({ user }) => {
      if (user) {
        storage.setCurrentUser(user);
        setCurrentUser(user);
      } else {
        const stored = storage.getCurrentUser();
        setCurrentUser(stored);
      }
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
            }
          }
        } else if (event === 'SIGNED_OUT') {
          const defaultUser: UserProfile = {
            ...DEMO_USERS[0],
            isDemo: true,
            isSupabaseUser: false,
            isEmailVerified: true,
          };
          storage.setCurrentUser(defaultUser);
          setCurrentUser(defaultUser);
          setCurrentPage('landing');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleNavigate = (page: string) => {
    // If user is a Supabase user with an unconfirmed email, redirect to dashboard trigger verification gate
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUser = (user: UserProfile) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
    if (user.isSupabaseUser && !user.isEmailVerified) {
      // Direct unverified user to dashboard where the verification gate will engage
      setCurrentPage('dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOutFromSupabase();
    const defaultUser: UserProfile = {
      ...DEMO_USERS[0],
      isDemo: true,
      isSupabaseUser: false,
      isEmailVerified: true,
    };
    storage.setCurrentUser(defaultUser);
    setCurrentUser(defaultUser);
    setCurrentPage('landing');
  };

  const handleEmailConfirmed = async () => {
    const { user } = await fetchCurrentSupabaseUser();
    if (user) {
      storage.setCurrentUser(user);
      setCurrentUser(user);
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
    storage.addApplication(appData);
    setCurrentPage('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if unconfirmed Supabase user is trying to access protected workspace views
  const isUnconfirmedSupabaseUser = currentUser.isSupabaseUser && !currentUser.isEmailVerified;
  const isProtectedWorkspacePage =
    currentPage !== 'landing' && currentPage !== 'pricing';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-cyan-300">
      {/* Navigation Header */}
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Strict Email Verification Gate for Unverified Users */}
        {isUnconfirmedSupabaseUser && isProtectedWorkspacePage ? (
          <EmailVerificationGate
            email={currentUser.email}
            onVerified={handleEmailConfirmed}
            onSignOut={handleSignOut}
            onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
          />
        ) : (
          <>
            {currentPage === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {currentPage === 'dashboard' && (
              <UserDashboard
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onSelectApplicationForPrep={(app) => setActivePrepApp(app)}
              />
            )}

            {currentPage === 'resume-analyzer' && (
              <ResumeAnalyzer
                currentUser={currentUser}
                onNavigateToJobMatcher={handleNavigateToJobMatcher}
                onNavigateToCoverLetter={handleNavigateToCoverLetter}
              />
            )}

            {currentPage === 'job-matcher' && (
              <JobMatcher
                currentUser={currentUser}
                initialResumeText={sharedResumeText}
                onNavigateToCoverLetter={handleNavigateToCoverLetter}
                onAddApplicationToTracker={handleAddApplicationToTracker}
              />
            )}

            {currentPage === 'cover-letter' && (
              <CoverLetterGenerator
                currentUser={currentUser}
                initialResumeText={sharedResumeText}
                initialJobDesc={sharedJobDesc}
                initialCompany={sharedCompany}
                initialTitle={sharedTitle}
              />
            )}

            {currentPage === 'tracker' && <ApplicationTracker />}

            {currentPage === 'pricing' && (
              <PricingPage
                currentUser={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'profile' && (
              <UserProfileComponent
                currentUser={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
                onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'admin' && <AdminDashboard />}
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
      />

      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />

      {activePrepApp && (
        <InterviewPrepModal
          application={activePrepApp}
          onClose={() => setActivePrepApp(null)}
          resumeText={sharedResumeText || storage.getMasterResumeText()}
        />
      )}
    </div>
  );
}
