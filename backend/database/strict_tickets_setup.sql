-- STRICT TICKETS SECURITY SETUP
-- This script enables RLS on the tickets table and enforces Admin-only access.

-- 1. ENABLE RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES

-- ADMIN POLICY: Full Access
-- Admins can do everything (SELECT, INSERT, UPDATE, DELETE).
DROP POLICY IF EXISTS "Admins have full access to tickets" ON public.tickets;
CREATE POLICY "Admins have full access to tickets" ON public.tickets
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'admin'
        )
    );

-- EMPLOYEE POLICY: No Access
-- We explicitly deny access by NOT creating a policy for them.
-- However, for clarity and to override any previous permissive policies, we can ensure no other policies exist.
-- (Supabase denies by default if no policy matches).

-- 3. ENSURE COLUMNS EXIST
DO $$ 
BEGIN
    -- created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_by') THEN
        ALTER TABLE public.tickets ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
