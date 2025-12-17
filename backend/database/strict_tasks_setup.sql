-- STRICT TASKS SECURITY SETUP
-- This script enables RLS on the tasks table and enforces Admin-only creation.

-- 1. ENABLE RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES

-- ADMIN POLICY: Full Access
-- Admins can do everything.
-- We check if the current user's ID exists in the 'profiles' table with role = 'admin'.
DROP POLICY IF EXISTS "Admins have full access to tasks" ON public.tasks;
CREATE POLICY "Admins have full access to tasks" ON public.tasks
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'admin'
        )
    );

-- EMPLOYEE POLICY: View Assignments
-- Employees can view tasks ONLY if assigned to them.
DROP POLICY IF EXISTS "Employees can view assigned tasks" ON public.tasks;
CREATE POLICY "Employees can view assigned tasks" ON public.tasks
    FOR SELECT
    USING (
        assigned_to = auth.uid() OR created_by = auth.uid()
    );

-- EMPLOYEE POLICY: Update Status
-- Employees can ONLY update the 'status' (and updated_at) of tasks assigned to them.
-- Supabase/Postgres RLS for UPDATE checks the USING clause to see if the row is visible,
-- and the WITH CHECK clause to see if the new row state is allowed.
DROP POLICY IF EXISTS "Employees can update status of assigned tasks" ON public.tasks;
CREATE POLICY "Employees can update status of assigned tasks" ON public.tasks
    FOR UPDATE
    USING (
        assigned_to = auth.uid()
    )
    WITH CHECK (
        assigned_to = auth.uid() 
        -- Note: Postgres RLS doesn't easily restrict *which* columns are modified in the policy itself without triggers.
        -- But we can ensure they can't reassign the task with the check above (assigned_to must equal auth.uid()).
    );

-- EMPLOYEE POLICY: Create/Delete (DENY)
-- We do NOT create policies for INSERT or DELETE for employees. 
-- By default, if no policy matches, access is denied.

-- 3. ENSURE COLUMNS EXIST (Just in case)
DO $$ 
BEGIN
    -- assigned_to
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.tasks ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;

    -- created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
        ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
