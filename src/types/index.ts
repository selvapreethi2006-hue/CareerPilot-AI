export type UserRole = 'student' | 'fresher' | 'jobseeker' | 'admin';
export type PlanTier = 'free' | 'pro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: PlanTier;
  avatarUrl: string;
  headline: string;
  universityOrCompany: string;
  targetRole: string;
  bio: string;
  monthlyAnalysisCount: number;
  monthlyAnalysisLimit: number;
  createdAt: string;
  isSupabaseUser?: boolean;
  isEmailVerified?: boolean;
  isDemo?: boolean;
}

export interface ResumeAnalysisResult {
  id: string;
  timestamp: string;
  candidateName: string;
  targetRoleDetected: string;
  experienceLevel: string;
  atsScore: number;
  scoresBreakdown: {
    impact: number;
    formatting: number;
    brevity: number;
    keywords: number;
  };
  extractedSkills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  strengths: string[];
  weaknesses: string[];
  actionVerbsCount: number;
  actionVerbsSuggestions: string[];
  bulletPointImprovements: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  recommendedCertifications: string[];
  summaryReview: string;
  rawResumeText?: string;
}

export interface JobMatchResult {
  id: string;
  timestamp: string;
  companyName: string;
  jobTitle: string;
  overallMatchScore: number;
  categoryScores: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    domainRelevance: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  atsKeywordCheck: Array<{
    keyword: string;
    foundInResume: boolean;
    importance: 'critical' | 'preferred' | 'optional';
  }>;
  interviewProbability: 'High' | 'Medium' | 'Low';
  tailoringAdvice: string[];
  recommendedResumeEdits: Array<{
    section: string;
    suggestion: string;
  }>;
  verdict: string;
  jobDescriptionText?: string;
}

export interface CoverLetterResult {
  id: string;
  timestamp: string;
  companyName: string;
  jobTitle: string;
  tone: 'confident' | 'enthusiastic' | 'corporate' | 'creative';
  coverLetterText: string;
  subjectLine: string;
  keySellingPoints: string[];
  suggestedCallToAction: string;
}

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offered'
  | 'rejected';

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  salaryRange?: string;
  applicationDate: string;
  status: ApplicationStatus;
  interviewDate?: string;
  notes: string;
  matchScore?: number;
  jobUrl?: string;
  contactPerson?: string;
}

export interface InterviewPrepData {
  likelyQuestions: Array<{
    question: string;
    category: string;
    sampleAnswerFramework: string;
    tip: string;
  }>;
  questionsToAskInterviewer: string[];
  companyResearchTips: string[];
}
