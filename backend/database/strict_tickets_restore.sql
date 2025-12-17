-- STRICT TICKETS RESTORE SETUP
-- 1. Ensure Table Permissions (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Ensure Required Columns Exist (Strict naming as requested)
-- raised_by_admin_id (UUID, FK to profiles/users)
-- assigned_employee_id (UUID, FK to profiles/users)
-- (We also keep existing created_by/assignee to avoid breaking existing data immediately, 
--  but we will direct new logic to use the new columns OR map them if they are synonyms.)

DO $$ 
BEGIN
    -- raised_by_admin_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'raised_by_admin_id') THEN
        ALTER TABLE public.tickets ADD COLUMN raised_by_admin_id UUID REFERENCES auth.users(id);
    END IF;

    -- assigned_employee_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assigned_employee_id') THEN
        ALTER TABLE public.tickets ADD COLUMN assigned_employee_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. RLS POLICIES (STRICT)

-- Policy: Admin Access (Full)
-- Admins can do everything.
DROP POLICY IF EXISTS "Admins have full access to tickets" ON public.tickets;
CREATE POLICY "Admins have full access to tickets" ON public.tickets
    FOR ALL
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Policy: Employee Access (View Only Assigned)
-- Employees can SELECT tickets where THEY are the assigned_employee_id.
-- (They CANNOT see other tickets).
DROP POLICY IF EXISTS "Employees can view assigned tickets" ON public.tickets;
CREATE POLICY "Employees can view assigned tickets" ON public.tickets
    FOR SELECT
    USING (
        assigned_employee_id = auth.uid() OR
        -- Fallback for legacy data if needed, or if assigned_employee_id is null? 
        -- Strict requirement says "fetch only where assigned_employee_id = logged_in_employee_id".
        -- We will enforce that strictly.
        assigned_employee_id = auth.uid()
    );

-- Policy: Employee NO Create/Update/Delete (Implicit Deny or explicit?)
-- We only grant SELECT above.

-- 4. Sync Legacy Columns (Optional but helpful for transition)
-- If your app logic used 'assignee', we might want to sync it or drop it.
-- For now, we leave it but rely on the new columns for strict logic.
