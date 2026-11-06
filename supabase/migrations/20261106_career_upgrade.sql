-- ==============================================================================
-- CareerPilot AI — Platform Upgrade: 7 New AI Career Services Migration
-- Safe, Idempotent, RLS-Hardened, and Non-Destructive PostgreSQL DDL
-- Apply in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. SKILL GAP ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.skill_gap_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  custom_job_title TEXT,
  skill_match_percentage INTEGER NOT NULL CHECK (skill_match_percentage >= 0 AND skill_match_percentage <= 100),
  existing_skills JSONB NOT NULL DEFAULT '{"technical":[],"soft":[]}'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  partially_matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_gaps TEXT[] DEFAULT '{}',
  personalized_improvement_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths_summary TEXT,
  summary_verdict TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MOCK INTERVIEW SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL CHECK (category IN ('role-specific', 'technical', 'hr', 'behavioral', 'system-design')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score INTEGER CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  overall_feedback TEXT,
  communication_summary TEXT,
  technical_summary TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. LEARNING ROADMAPS & PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  current_skills_covered TEXT[] DEFAULT '{}',
  target_skills_to_master TEXT[] DEFAULT '{}',
  weekly_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  career_milestones TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SMART OUTREACH DRAFTS TABLE
CREATE TABLE IF NOT EXISTS public.smart_outreach_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  contact_name TEXT,
  outreach_type TEXT NOT NULL,
  subject TEXT,
  message_content TEXT NOT NULL,
  recommended_timing TEXT,
  pro_tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PORTFOLIO PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  headline TEXT,
  about_bio TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills JSONB NOT NULL DEFAULT '{"technical":[],"frameworks":[],"tools":[],"soft":[]}'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications TEXT[] DEFAULT '{}',
  theme JSONB NOT NULL DEFAULT '{"templateId":"modern_minimal","accentColor":"#06b6d4"}'::jsonb,
  generated_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SALARY RESEARCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.salary_research_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  industry TEXT NOT NULL,
  salary_band JSONB NOT NULL,
  entry_level_opportunities JSONB NOT NULL,
  top_in_demand_skills JSONB NOT NULL,
  career_progression_ladder JSONB NOT NULL,
  related_job_roles JSONB NOT NULL,
  industry_trends TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CAREER MENTOR CHATS TABLE
CREATE TABLE IF NOT EXISTS public.career_mentor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'mentor')),
  message_text TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ta', 'tanglish')),
  actionable_follow_ups TEXT[] DEFAULT '{}',
  recommended_tool TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_skill_gap_user_id ON public.skill_gap_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interview_user_id ON public.mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_user_id ON public.learning_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_user_id ON public.smart_outreach_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_research_user_id ON public.salary_research_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_chats_user_id ON public.career_mentor_chats(user_id);

-- ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.skill_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_mentor_chats ENABLE ROW LEVEL SECURITY;

-- IDEMPOTENT RLS POLICIES (Users can only access their own records)

-- Skill Gaps
DROP POLICY IF EXISTS "skill_gaps_all_own" ON public.skill_gap_analyses;
CREATE POLICY "skill_gaps_all_own" ON public.skill_gap_analyses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mock Interviews
DROP POLICY IF EXISTS "interviews_all_own" ON public.mock_interview_sessions;
CREATE POLICY "interviews_all_own" ON public.mock_interview_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Learning Roadmaps
DROP POLICY IF EXISTS "roadmaps_all_own" ON public.learning_roadmaps;
CREATE POLICY "roadmaps_all_own" ON public.learning_roadmaps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Outreach Drafts
DROP POLICY IF EXISTS "outreach_all_own" ON public.smart_outreach_drafts;
CREATE POLICY "outreach_all_own" ON public.smart_outreach_drafts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Portfolio Profiles
DROP POLICY IF EXISTS "portfolio_all_own" ON public.portfolio_profiles;
CREATE POLICY "portfolio_all_own" ON public.portfolio_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Salary Searches
DROP POLICY IF EXISTS "salary_all_own" ON public.salary_research_history;
CREATE POLICY "salary_all_own" ON public.salary_research_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentor Chats
DROP POLICY IF EXISTS "mentor_chats_all_own" ON public.career_mentor_chats;
CREATE POLICY "mentor_chats_all_own" ON public.career_mentor_chats
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
