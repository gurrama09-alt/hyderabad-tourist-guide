-- ==============================================================================
-- SHARED PLACES TABLE (Allows admin updates and photos to sync across all devices)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xgjxmiofyuhmutyyngax/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shared_places (
  id TEXT PRIMARY KEY,
  places_json TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.shared_places ENABLE ROW LEVEL SECURITY;

-- Allow public read access for all viewers
DROP POLICY IF EXISTS "Public read shared_places" ON public.shared_places;
CREATE POLICY "Public read shared_places" ON public.shared_places
  FOR SELECT USING (true);

-- Allow upsert for saving updates
DROP POLICY IF EXISTS "Public upsert shared_places" ON public.shared_places;
CREATE POLICY "Public upsert shared_places" ON public.shared_places
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime broadcast on shared_places table
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_places;
ALTER TABLE public.shared_places REPLICA IDENTITY FULL;

