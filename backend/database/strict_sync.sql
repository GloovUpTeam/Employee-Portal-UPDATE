-- STRICT SYNC SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Link Employees to Auth Users by Email
UPDATE public.employees
SET user_id = auth.users.id
FROM auth.users
WHERE public.employees.email = auth.users.email;

-- 2. Ensure is_active is set
UPDATE public.employees
SET is_active = true
WHERE is_active IS NULL;

-- 3. Verify RLS Policy
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only select their own record" ON employees;

CREATE POLICY "Users can only select their own record"
ON employees
FOR SELECT
USING (auth.uid() = user_id);

GRANT SELECT ON employees TO authenticated;

-- 4. Check for unlinked employees (Reporting)
SELECT email, full_name, 'WARNING: No Auth User Found' as status
FROM public.employees
WHERE user_id IS NULL;
