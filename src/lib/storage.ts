import { UserProfile, ResumeAnalysisResult, JobMatchResult, CoverLetterResult, JobApplication } from '../types';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-maya',
    name: 'Maya Lin',
    email: 'maya.lin@student.edu',
    role: 'fresher',
    plan: 'free',
    avatarUrl: '/src/assets/images/avatar_career_student_1793498999647.jpg',
    headline: 'Computer Science Senior | Aspiring Full-Stack Engineer',
    universityOrCompany: 'University of California, Berkeley',
    targetRole: 'Junior Frontend Developer / Software Engineer',
    bio: 'Passionate about React, TypeScript, and modern UI engineering. Building responsive applications and preparing for 2026 graduate tech roles.',
    monthlyAnalysisCount: 2,
    monthlyAnalysisLimit: 9999,
    createdAt: '2026-09-15',
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@careerpilot.io',
    role: 'jobseeker',
    plan: 'pro',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    headline: 'Software Engineer (2 Yrs Exp) | Cloud & TypeScript',
    universityOrCompany: 'Ex-NextGen Labs',
    targetRole: 'Full Stack Engineer (Mid-Level)',
    bio: 'Experienced in Node.js microservices, React dashboards, and AWS deployments. Seeking next high-impact engineering role.',
    monthlyAnalysisCount: 14,
    monthlyAnalysisLimit: 9999,
    createdAt: '2026-06-10',
  },
  {
    id: 'user-admin',
    name: 'Sarah Chen (Admin)',
    email: 'admin@careerpilot.ai',
    role: 'admin',
    plan: 'pro',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    headline: 'Platform Administrator & Career Director',
    universityOrCompany: 'CareerPilot AI Global',
    targetRole: 'Platform Admin',
    bio: 'Oversees AI models, user quotas, university partnerships, and student placement metrics.',
    monthlyAnalysisCount: 42,
    monthlyAnalysisLimit: 9999,
    createdAt: '2026-01-01',
  },
];

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

export const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: 'app-1',
    companyName: 'Stripe',
    jobTitle: 'Junior Frontend Engineer',
    location: 'San Francisco, CA (Hybrid)',
    salaryRange: '$115,000 - $130,000',
    applicationDate: '2026-10-18',
    status: 'interviewing',
    interviewDate: '2026-11-04',
    notes: 'Completed technical screen. System architecture interview scheduled with Engineering Manager.',
    matchScore: 88,
    jobUrl: 'https://stripe.com/jobs/frontend-engineer',
    contactPerson: 'David Vance (Senior Recruiter)',
  },
  {
    id: 'app-2',
    companyName: 'Vercel',
    jobTitle: 'Product Engineer (Next.js)',
    location: 'Remote',
    salaryRange: '$120,000 - $140,000',
    applicationDate: '2026-10-22',
    status: 'screening',
    interviewDate: '2026-11-02',
    notes: 'Recruiter reached out on LinkedIn regarding open-source React work.',
    matchScore: 92,
    jobUrl: 'https://vercel.com/careers/product-engineer',
    contactPerson: 'Elena Rostova',
  },
  {
    id: 'app-3',
    companyName: 'Linear',
    jobTitle: 'Software Engineer — Client Apps',
    location: 'Remote (US/EU)',
    salaryRange: '$130,000 - $155,000',
    applicationDate: '2026-10-26',
    status: 'applied',
    notes: 'Submitted resume tailored with high-performance UI keywords and EventSync metrics.',
    matchScore: 84,
    jobUrl: 'https://linear.app/careers',
  },
  {
    id: 'app-4',
    companyName: 'Datadog',
    jobTitle: 'Associate Software Engineer',
    location: 'New York, NY',
    salaryRange: '$110,000 - $125,000',
    applicationDate: '2026-10-12',
    status: 'offered',
    notes: 'Received initial offer package ($118k base + RSUs). Reviewing benefits and relocation support.',
    matchScore: 86,
    contactPerson: 'Marcus Cole',
  },
  {
    id: 'app-5',
    companyName: 'Figma',
    jobTitle: 'Junior Systems Engineer',
    location: 'San Francisco, CA',
    salaryRange: '$125,000 - $145,000',
    applicationDate: '2026-10-29',
    status: 'wishlist',
    notes: 'Preparing cover letter focused on canvas performance and TypeScript design systems.',
    matchScore: 79,
  },
];

export const INITIAL_SAVED_RESUMES: ResumeAnalysisResult[] = [
  {
    id: 'res-sample-1',
    timestamp: '2026-10-25T14:32:00.000Z',
    candidateName: 'Maya Lin',
    targetRoleDetected: 'Frontend / Full-Stack Engineer',
    experienceLevel: 'Fresher / Entry-Level',
    atsScore: 86,
    scoresBreakdown: {
      impact: 84,
      formatting: 92,
      brevity: 89,
      keywords: 88,
    },
    extractedSkills: {
      technical: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'SQL', 'Git', 'Docker'],
      soft: ['Team Mentorship', 'Collaboration', 'Problem Solving', 'Communication'],
      tools: ['Supabase', 'GitHub Actions', 'Jest', 'Figma', 'VS Code'],
    },
    strengths: [
      'Strong metric-backed project bullet points (e.g., 45% latency drop, 800+ users)',
      'High-demand modern frontend stack clearly showcased in top third of resume',
      'Clean single-column chronological structure ideal for ATS parsing scanners',
    ],
    weaknesses: [
      'Missing explicit mention of end-to-end automated testing frameworks like Playwright or Cypress',
      'Could elaborate on production cloud deployment monitoring (e.g. Datadog or Sentry)',
      'Academic coursework could be condensed to free up space for deeper project architectural details',
    ],
    actionVerbsCount: 16,
    actionVerbsSuggestions: ['Orchestrated', 'Spearheaded', 'Optimized', 'Architected', 'Revitalized'],
    bulletPointImprovements: [
      {
        original: 'Collaborated in a 6-person Agile sprint team building user onboarding flows in React.',
        improved: 'Spearheaded frontend development of responsive 4-step onboarding flow in React & TypeScript, boosting user signup completion rate by 19%.',
        reason: 'Added concrete outcome metric and leading active action verb.',
      },
    ],
    recommendedCertifications: [
      'AWS Certified Cloud Practitioner',
      'Meta Frontend Professional Certificate',
    ],
    summaryReview: 'Exceptional early-career resume with clear technical focus and quantifiable outcomes. Minor optimization for test automation keywords will elevate pass rates for Tier-1 tech screening.',
    rawResumeText: SAMPLE_RESUME_TEXT,
  },
];

// LocalStorage Helper
class StorageService {
  private USER_KEY = 'cp_current_user_v2';
  private USERS_LIST_KEY = 'cp_users_list_v2';
  private APPS_KEY = 'cp_applications_v2';
  private RESUMES_KEY = 'cp_resumes_v2';
  private MATCHES_KEY = 'cp_matches_v2';
  private LETTERS_KEY = 'cp_letters_v2';
  private MASTER_RESUME_KEY = 'cp_master_resume_text';

  getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure zero-billing launch users have unlimited monthly allowance
        if (!parsed.monthlyAnalysisLimit || parsed.monthlyAnalysisLimit < 9999) {
          parsed.monthlyAnalysisLimit = 9999;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return DEMO_USERS[0];
  }

  setCurrentUser(user: UserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getAllUsers(): UserProfile[] {
    try {
      const stored = localStorage.getItem(this.USERS_LIST_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return DEMO_USERS;
  }

  saveAllUsers(users: UserProfile[]): void {
    localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(users));
  }

  getApplications(): JobApplication[] {
    try {
      const stored = localStorage.getItem(this.APPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return INITIAL_APPLICATIONS;
  }

  saveApplications(apps: JobApplication[]): void {
    localStorage.setItem(this.APPS_KEY, JSON.stringify(apps));
  }

  addApplication(app: Omit<JobApplication, 'id'>): JobApplication {
    const apps = this.getApplications();
    const newApp: JobApplication = {
      ...app,
      id: `app-${Date.now()}`,
    };
    const updated = [newApp, ...apps];
    this.saveApplications(updated);
    return newApp;
  }

  updateApplication(id: string, updates: Partial<JobApplication>): JobApplication | null {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return null;
    apps[idx] = { ...apps[idx], ...updates };
    this.saveApplications(apps);
    return apps[idx];
  }

  deleteApplication(id: string): void {
    const apps = this.getApplications();
    const filtered = apps.filter(a => a.id !== id);
    this.saveApplications(filtered);
  }

  getSavedResumes(): ResumeAnalysisResult[] {
    try {
      const stored = localStorage.getItem(this.RESUMES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return INITIAL_SAVED_RESUMES;
  }

  saveResumeAnalysis(analysis: ResumeAnalysisResult): void {
    const existing = this.getSavedResumes();
    const updated = [analysis, ...existing.filter(r => r.id !== analysis.id)];
    localStorage.setItem(this.RESUMES_KEY, JSON.stringify(updated.slice(0, 20)));

    // Increment user usage
    const user = this.getCurrentUser();
    user.monthlyAnalysisCount += 1;
    this.setCurrentUser(user);
  }

  getSavedMatches(): JobMatchResult[] {
    try {
      const stored = localStorage.getItem(this.MATCHES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveJobMatch(match: JobMatchResult): void {
    const existing = this.getSavedMatches();
    const updated = [match, ...existing.filter(m => m.id !== match.id)];
    localStorage.setItem(this.MATCHES_KEY, JSON.stringify(updated.slice(0, 20)));
  }

  getSavedCoverLetters(): CoverLetterResult[] {
    try {
      const stored = localStorage.getItem(this.LETTERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return [];
  }

  saveCoverLetter(letter: CoverLetterResult): void {
    const existing = this.getSavedCoverLetters();
    const updated = [letter, ...existing.filter(l => l.id !== letter.id)];
    localStorage.setItem(this.LETTERS_KEY, JSON.stringify(updated.slice(0, 20)));
  }

  getMasterResumeText(): string {
    const stored = localStorage.getItem(this.MASTER_RESUME_KEY);
    return stored || SAMPLE_RESUME_TEXT;
  }

  saveMasterResumeText(text: string): void {
    localStorage.setItem(this.MASTER_RESUME_KEY, text);
  }

  resetAllData(): void {
    localStorage.clear();
    this.setCurrentUser(DEMO_USERS[0]);
    this.saveApplications(INITIAL_APPLICATIONS);
    this.saveMasterResumeText(SAMPLE_RESUME_TEXT);
  }
}

export const storage = new StorageService();
