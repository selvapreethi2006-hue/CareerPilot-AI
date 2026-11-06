import {
  UserProfile,
  ResumeAnalysisResult,
  JobMatchResult,
  CoverLetterResult,
  JobApplication,
  SkillGapResult,
  MockInterviewSession,
  LearningRoadmapResult,
  SmartOutreachDraft,
  PortfolioProfileData,
  SalaryInsightsResult,
  MentorChatMessage,
} from '../types';

export const SAMPLE_RESUME_TEXT = `Maya Lin
San Francisco, CA | (555) 234-5678 | maya.lin@berkeley.edu | linkedin.com/in/mayalin | github.com/mayalin-dev

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science | Expected May 2026
GPA: 3.82 / 4.00
Relevant Coursework: Data Structures & Algorithms, Full-Stack Web Architecture, Database Systems, Computer Security, UI/UX Design

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3/Tailwind
Frameworks & Libraries: React, Next.js, Node.js, Express, Jest, React Testing Library
Tools & Platforms: Git, GitHub Actions, Docker, PostgreSQL, Supabase, Vercel, Figma

PROJECTS
EventSync — Real-Time Campus Collaboration Platform | React, TypeScript, Node.js, WebSocket
• Engineered a responsive collaborative campus event planner supporting 800+ concurrent active student users.
• Developed server-side WebSocket event dispatching that decreased synchronization latency by 45%.
• Integrated Supabase PostgreSQL database with Row Level Security (RLS) ensuring strict student privacy.

TaskPulse — Agile Workflow & Sprint Board | React, Tailwind CSS, TypeScript
• Built a drag-and-drop Kanban application with custom optimistic UI state updates and keyboard navigation.
• Implemented automated unit and end-to-end test suites achieving 88% code coverage using Jest.
• Deployed microservices via Docker containers to Cloud Run with automated GitHub Actions CI/CD pipeline.

EXPERIENCE
Frontend Engineering Intern | Horizon Labs
May 2025 – August 2025 | San Francisco, CA
• Collaborated in a 6-person Agile sprint team building user onboarding flows in React and Tailwind.
• Refactored legacy component tree reducing initial bundle size by 28% and boosting Lighthouse accessibility to 98.
• Authored 12 reusable TypeScript component primitives adopted across the core product design system.

LEADERSHIP & ACTIVITIES
Lead Mentor, Berkeley CS Undergraduate Society
• Mentored 35 incoming freshmen students on Git workflows, algorithmic problem solving, and portfolio development.`;

export const SAMPLE_JOB_DESCRIPTION = `Frontend Engineer (Early Career / Fresher)
Stripe / Modern Fintech Co. — San Francisco, CA or Remote

About the Role:
We are looking for an ambitious, user-focused Frontend Engineer to join our Developer Experience and Dashboard engineering team. You will build world-class, responsive, accessible web interfaces that millions of businesses rely on daily to manage payments and financial infrastructure.

What You Will Do:
• Develop high-performance, polished web user interfaces using TypeScript, React, and modern CSS frameworks.
• Collaborate with product designers, backend engineers, and product managers to bring complex workflows to life.
• Write clean, testable, and maintainable code with robust unit and integration tests (Jest, Playwright).
• Optimize frontend performance, web vitals, and accessibility (WCAG AA standards).
• Participate in design sprints, code reviews, and architectural discussions.

Requirements:
• Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
• Solid proficiency in modern JavaScript/TypeScript, HTML5, and CSS/Tailwind.
• Experience building interactive web applications with React.
• Familiarity with RESTful APIs, Git version control, and CI/CD pipelines.
• Passion for craft, pixel-level detail, and empathetic user experience.

Nice to Have:
• Experience with Next.js, WebSockets, or real-time event streaming.
• Understanding of relational databases like PostgreSQL.
• Open-source contributions or active technical portfolio projects.`;

// User-scoped LocalStorage Helper
class StorageService {
  private USER_KEY = 'cp_current_supabase_user_v3';

  private getKey(prefix: string, userId?: string): string {
    const activeId = userId || this.getActiveUserId();
    if (activeId) {
      return `cp_${activeId}_${prefix}`;
    }
    return `cp_guest_${prefix}`;
  }

  private getActiveUserId(): string | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && !parsed.isDemo) {
          return parsed.id;
        }
      }
    } catch {}
    return null;
  }

  getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Exclude legacy mock demo personas
        if (parsed && !parsed.isDemo && parsed.isSupabaseUser) {
          if (!parsed.monthlyAnalysisLimit || parsed.monthlyAnalysisLimit < 9999) {
            parsed.monthlyAnalysisLimit = 9999;
          }
          return parsed;
        }
        // If it was a mock demo user, clear it out
        if (parsed?.isDemo) {
          localStorage.removeItem(this.USER_KEY);
        }
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return null;
  }

  setCurrentUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(this.USER_KEY);
      return;
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getApplications(userId?: string): JobApplication[] {
    try {
      const key = this.getKey('apps_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveApplications(apps: JobApplication[], userId?: string): void {
    const key = this.getKey('apps_v3', userId);
    localStorage.setItem(key, JSON.stringify(apps));
  }

  addApplication(app: Omit<JobApplication, 'id'>, userId?: string): JobApplication {
    const apps = this.getApplications(userId);
    const newApp: JobApplication = {
      ...app,
      id: `app-${Date.now()}`,
    };
    const updated = [newApp, ...apps];
    this.saveApplications(updated, userId);
    return newApp;
  }

  updateApplication(id: string, updates: Partial<JobApplication>, userId?: string): JobApplication | null {
    const apps = this.getApplications(userId);
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    apps[idx] = { ...apps[idx], ...updates };
    this.saveApplications(apps, userId);
    return apps[idx];
  }

  deleteApplication(id: string, userId?: string): void {
    const apps = this.getApplications(userId);
    const filtered = apps.filter((a) => a.id !== id);
    this.saveApplications(filtered, userId);
  }

  getSavedResumes(userId?: string): ResumeAnalysisResult[] {
    try {
      const key = this.getKey('resumes_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveResumeAnalysis(analysis: ResumeAnalysisResult, userId?: string): void {
    const existing = this.getSavedResumes(userId);
    const updated = [analysis, ...existing.filter((r) => r.id !== analysis.id)];
    const key = this.getKey('resumes_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));

    // Increment user usage
    const user = this.getCurrentUser();
    if (user) {
      user.monthlyAnalysisCount += 1;
      this.setCurrentUser(user);
    }
  }

  getSavedMatches(userId?: string): JobMatchResult[] {
    try {
      const key = this.getKey('matches_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveJobMatch(match: JobMatchResult, userId?: string): void {
    const existing = this.getSavedMatches(userId);
    const updated = [match, ...existing.filter((m) => m.id !== match.id)];
    const key = this.getKey('matches_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));
  }

  getSavedCoverLetters(userId?: string): CoverLetterResult[] {
    try {
      const key = this.getKey('letters_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveCoverLetter(letter: CoverLetterResult, userId?: string): void {
    const existing = this.getSavedCoverLetters(userId);
    const updated = [letter, ...existing.filter((l) => l.id !== letter.id)];
    const key = this.getKey('letters_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));
  }

  getMasterResumeText(userId?: string): string {
    const key = this.getKey('master_resume_v3', userId);
    const stored = localStorage.getItem(key);
    return stored || '';
  }

  saveMasterResumeText(text: string, userId?: string): void {
    const key = this.getKey('master_resume_v3', userId);
    localStorage.setItem(key, text);
  }

  // -------------------------------------------------------------
  // 1. Skill Gap Analyses
  // -------------------------------------------------------------
  getSkillGapAnalyses(userId?: string): SkillGapResult[] {
    try {
      const key = this.getKey('skill_gaps_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveSkillGapAnalysis(analysis: SkillGapResult, userId?: string): void {
    const existing = this.getSkillGapAnalyses(userId);
    const updated = [analysis, ...existing.filter((item) => item.id !== analysis.id)];
    const key = this.getKey('skill_gaps_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));
  }

  // -------------------------------------------------------------
  // 2. Mock Interview Sessions
  // -------------------------------------------------------------
  getMockInterviewSessions(userId?: string): MockInterviewSession[] {
    try {
      const key = this.getKey('interviews_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveMockInterviewSession(session: MockInterviewSession, userId?: string): void {
    const existing = this.getMockInterviewSessions(userId);
    const updated = [session, ...existing.filter((item) => item.id !== session.id)];
    const key = this.getKey('interviews_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 25)));
  }

  // -------------------------------------------------------------
  // 3. Learning Roadmaps & Progress
  // -------------------------------------------------------------
  getLearningRoadmaps(userId?: string): LearningRoadmapResult[] {
    try {
      const key = this.getKey('roadmaps_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveLearningRoadmap(roadmap: LearningRoadmapResult, userId?: string): void {
    const existing = this.getLearningRoadmaps(userId);
    const updated = [roadmap, ...existing.filter((item) => item.id !== roadmap.id)];
    const key = this.getKey('roadmaps_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 10)));
  }

  updateRoadmapProgress(
    roadmapId: string,
    weekNumber: number,
    dayNumber: number,
    completed: boolean,
    userId?: string
  ): void {
    const roadmaps = this.getLearningRoadmaps(userId);
    const target = roadmaps.find((r) => r.id === roadmapId);
    if (!target) return;

    const module = target.weeklyModules.find((m) => m.weekNumber === weekNumber);
    if (module) {
      const task = module.dailyTasks.find((t) => t.dayNumber === dayNumber);
      if (task) {
        task.completed = completed;
      }
      module.completed = module.dailyTasks.every((t) => t.completed);
    }
    this.saveLearningRoadmap(target, userId);
  }

  // -------------------------------------------------------------
  // 4. Smart Outreach Drafts
  // -------------------------------------------------------------
  getSmartOutreachDrafts(userId?: string): SmartOutreachDraft[] {
    try {
      const key = this.getKey('outreach_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveSmartOutreachDraft(draft: SmartOutreachDraft, userId?: string): void {
    const existing = this.getSmartOutreachDrafts(userId);
    const updated = [draft, ...existing.filter((item) => item.id !== draft.id)];
    const key = this.getKey('outreach_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 30)));
  }

  // -------------------------------------------------------------
  // 5. Portfolio Builder Profiles
  // -------------------------------------------------------------
  getPortfolioData(userId?: string): PortfolioProfileData | null {
    try {
      const key = this.getKey('portfolio_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return null;
  }

  savePortfolioData(data: PortfolioProfileData, userId?: string): void {
    const key = this.getKey('portfolio_v3', userId);
    localStorage.setItem(key, JSON.stringify(data));
  }

  // -------------------------------------------------------------
  // 6. Salary & Career Insights Searches
  // -------------------------------------------------------------
  getSalarySearches(userId?: string): SalaryInsightsResult[] {
    try {
      const key = this.getKey('salaries_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveSalarySearch(search: SalaryInsightsResult, userId?: string): void {
    const existing = this.getSalarySearches(userId);
    const updated = [search, ...existing.filter((item) => item.id !== search.id)];
    const key = this.getKey('salaries_v3', userId);
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 15)));
  }

  // -------------------------------------------------------------
  // 7. Career Mentor Chat History
  // -------------------------------------------------------------
  getMentorChatHistory(userId?: string): MentorChatMessage[] {
    try {
      const key = this.getKey('mentor_chat_v3', userId);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveMentorChatHistory(messages: MentorChatMessage[], userId?: string): void {
    const key = this.getKey('mentor_chat_v3', userId);
    localStorage.setItem(key, JSON.stringify(messages.slice(-50)));
  }

  clearMentorChatHistory(userId?: string): void {
    const key = this.getKey('mentor_chat_v3', userId);
    localStorage.removeItem(key);
  }

  clearUserData(userId?: string): void {
    const activeId = userId || this.getActiveUserId();
    if (!activeId) return;
    localStorage.removeItem(`cp_${activeId}_apps_v3`);
    localStorage.removeItem(`cp_${activeId}_resumes_v3`);
    localStorage.removeItem(`cp_${activeId}_matches_v3`);
    localStorage.removeItem(`cp_${activeId}_letters_v3`);
    localStorage.removeItem(`cp_${activeId}_master_resume_v3`);
    localStorage.removeItem(`cp_${activeId}_skill_gaps_v3`);
    localStorage.removeItem(`cp_${activeId}_interviews_v3`);
    localStorage.removeItem(`cp_${activeId}_roadmaps_v3`);
    localStorage.removeItem(`cp_${activeId}_outreach_v3`);
    localStorage.removeItem(`cp_${activeId}_portfolio_v3`);
    localStorage.removeItem(`cp_${activeId}_salaries_v3`);
    localStorage.removeItem(`cp_${activeId}_mentor_chat_v3`);
  }
}

export const storage = new StorageService();
