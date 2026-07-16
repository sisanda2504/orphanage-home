-- ============================================================
-- Supabase SQL Editor Script: Events V2 Redesign
-- ============================================================

-- 1. Modify existing `events` table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_registration_open BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS donation_goal NUMERIC,
  ADD COLUMN IF NOT EXISTS donations_raised NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volunteer_requirements TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS time TIME;

-- (Optional: drop the old event_rsvps if it exists, since we are moving to event_registrations)
-- DROP TABLE IF EXISTS public.event_rsvps CASCADE;

-- 2. Create `event_registrations` table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID, -- Can be nullable if allowing guest checkouts, else NOT NULL
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  attendance_type TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  checked_in BOOLEAN DEFAULT FALSE,
  arrival_time TIMESTAMP WITH TIME ZONE,
  qr_code_id UUID DEFAULT gen_random_uuid(),
  notes TEXT,
  CONSTRAINT unique_event_registration UNIQUE(event_id, email) -- prevent duplicate emails per event
);

-- Enable RLS for event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to event_registrations"
  ON public.event_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to view own registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to manage event_registrations"
  ON public.event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );


-- 3. Create `registration_details` table (for dynamic fields)
CREATE TABLE IF NOT EXISTS public.registration_details (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registration_id BIGINT REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT
);

-- Enable RLS for registration_details
ALTER TABLE public.registration_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to registration_details"
  ON public.registration_details FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to view own registration_details"
  ON public.registration_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE public.event_registrations.id = registration_details.registration_id
        AND public.event_registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to manage registration_details"
  ON public.registration_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );


-- 4. Create `event_gallery` table
CREATE TABLE IF NOT EXISTS public.event_gallery (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for event_gallery
ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to event_gallery"
  ON public.event_gallery FOR SELECT
  USING (true);

CREATE POLICY "Allow admins to manage event_gallery"
  ON public.event_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- 5. Create `event_sponsors` table
CREATE TABLE IF NOT EXISTS public.event_sponsors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  logo_url TEXT,
  contribution_amount NUMERIC
);

-- Enable RLS for event_sponsors
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to event_sponsors"
  ON public.event_sponsors FOR SELECT
  USING (true);

CREATE POLICY "Allow admins to manage event_sponsors"
  ON public.event_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- 6. Create `event_checkins` table (Optional: Since we added checked_in and arrival_time to registrations, this might be redundant, but creating it as requested)
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registration_id BIGINT REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id),
  scan_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for event_checkins
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage event_checkins"
  ON public.event_checkins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
