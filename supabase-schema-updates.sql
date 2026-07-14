-- ============================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Alter donations table to add location-related fields
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  max_attendees INTEGER NOT NULL DEFAULT 100,
  registered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to view events
CREATE POLICY "Allow public read access to events"
  ON public.events FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert/update/delete events
CREATE POLICY "Allow admin write access to events"
  ON public.events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- 3. Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_event_user UNIQUE(event_id, user_id)
);

-- Enable RLS for event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view their own RSVPs
CREATE POLICY "Allow users to view own RSVPs"
  ON public.event_rsvps FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow admins to view all RSVPs
CREATE POLICY "Allow admins to view all RSVPs"
  ON public.event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- Policy: Allow authenticated users to insert their own RSVPs
CREATE POLICY "Allow users to insert own RSVPs"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own RSVPs
CREATE POLICY "Allow users to delete own RSVPs"
  ON public.event_rsvps FOR DELETE
  USING (auth.uid() = user_id);
