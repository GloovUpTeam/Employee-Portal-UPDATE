-- EMAIL-BASED RLS POLICY
-- Ensures users can read the employees table if their Auth Email matches the Record Email.
-- This allows the initial login check to work even if user_id is NULL.

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 1. DROP OLD POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Public Read" ON employees;
DROP POLICY IF EXISTS "Users can only select their own record" ON employees;

-- 2. CREATE SELECT POLICY (Match Email)
CREATE POLICY "Allow read own email"
ON employees
FOR SELECT
USING (
  email = auth.jwt() ->> 'email'
);

-- 3. CREATE UPDATE POLICY (Allow Self-Link)
-- Allow a user to update ONLY their own user_id if it matches their email.
CREATE POLICY "Allow self-link user_id"
ON employees
FOR UPDATE
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

GRANT SELECT, UPDATE ON employees TO authenticated;
