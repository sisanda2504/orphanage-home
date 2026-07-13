-- ============================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Add donor_name column to donations table (if it doesn't exist)
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_name TEXT;

-- 2. Allow admins to SELECT all donations
--    (This checks if the logged-in user has role='admin' in the users table)
CREATE POLICY IF NOT EXISTS "Admins can view all donations"
  ON donations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- 3. Keep existing policy so users can still read their own donations
--    (skip if you already have one)
CREATE POLICY IF NOT EXISTS "Users can view own donations"
  ON donations
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Allow users to insert their own donations (if not already set)
CREATE POLICY IF NOT EXISTS "Users can insert donations"
  ON donations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
