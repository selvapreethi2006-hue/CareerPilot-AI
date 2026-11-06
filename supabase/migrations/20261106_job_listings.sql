-- CareerPilot AI: Job Listings Table Migration for Automatic Sync
-- Stores verified external job listings from Remotive and future providers
-- Safe non-destructive migration

CREATE TABLE IF NOT EXISTS public.job_listings (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  category TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  job_type TEXT DEFAULT 'full_time',
  publication_date TIMESTAMPTZ NOT NULL,
  candidate_required_location TEXT DEFAULT 'Worldwide',
  salary TEXT,
  description TEXT,
  source TEXT DEFAULT 'Remotive',
  is_fresher_friendly BOOLEAN DEFAULT false,
  is_india_eligible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_pub_date ON public.job_listings (publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON public.job_listings (category);
CREATE INDEX IF NOT EXISTS idx_job_listings_fresher ON public.job_listings (is_fresher_friendly);
CREATE INDEX IF NOT EXISTS idx_job_listings_india ON public.job_listings (is_india_eligible);

-- Enable Row Level Security
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users and guests to view active job listings
DROP POLICY IF EXISTS "Public read active job listings" ON public.job_listings;
CREATE POLICY "Public read active job listings" 
ON public.job_listings FOR SELECT 
USING (is_active = true);

-- Allow service role and authenticated sync
DROP POLICY IF EXISTS "Allow backend sync job listings" ON public.job_listings;
CREATE POLICY "Allow backend sync job listings" 
ON public.job_listings FOR ALL 
USING (true)
WITH CHECK (true);
