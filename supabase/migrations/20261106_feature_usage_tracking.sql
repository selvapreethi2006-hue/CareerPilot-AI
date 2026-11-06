-- ==============================================================================
-- CareerPilot AI — Feature Usage Tracking & Engagement Visualization Migration
-- Non-Destructive, RLS-Hardened PostgreSQL Schema for Supabase
-- Safe to run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feature_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL CHECK (feature_name IN (
    'resume_analysis',
    'job_application',
    'skill_gap_analysis',
    'mock_interview',
    'cover_letter',
    'job_match',
    'roadmap_task'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast analytics aggregation and dashboard user queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON public.feature_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_feature ON public.feature_usage_logs(user_id, feature_name);

-- Row-Level Security
ALTER TABLE public.feature_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_logs_select_own" ON public.feature_usage_logs;
CREATE POLICY "usage_logs_select_own" ON public.feature_usage_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_logs_insert_own" ON public.feature_usage_logs;
CREATE POLICY "usage_logs_insert_own" ON public.feature_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_logs_delete_own" ON public.feature_usage_logs;
CREATE POLICY "usage_logs_delete_own" ON public.feature_usage_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
