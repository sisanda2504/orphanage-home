-- ============================================================
-- Supabase SQL Editor Script: Auto-Update Registered Count
-- ============================================================

-- This function will automatically increment the `registered` count
-- on the `events` table whenever a new registration is inserted.
CREATE OR REPLACE FUNCTION public.increment_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registered = COALESCE(registered, 0) + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the event_registrations table
DROP TRIGGER IF EXISTS on_registration_inserted ON public.event_registrations;
CREATE TRIGGER on_registration_inserted
AFTER INSERT ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.increment_event_registered_count();
