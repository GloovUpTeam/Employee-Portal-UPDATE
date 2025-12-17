-- FIX TASKS SCHEMA (CORRECTED)
-- 1. Use 'assigned_employee_id'
-- 2. FK MUST reference 'public.profiles(id)' for the join to work in the frontend (PostgREST requirement).

DO $$ 
BEGIN
    -- 1. Standardize Column Name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_employee_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
            ALTER TABLE public.tasks RENAME COLUMN assigned_to TO assigned_employee_id;
        ELSE
            ALTER TABLE public.tasks ADD COLUMN assigned_employee_id UUID REFERENCES public.profiles(id);
        END IF;
    END IF;
    
    -- 2. Ensure created_by exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
         ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- 3. FORCE CONSTRAINT CORRECTION
    -- We need constraint 'tasks_assigned_employee_id_fkey' to point to 'profiles'.
    
    -- Drop potential bad constraints
    BEGIN ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_employee_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Re-create correctly
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_assigned_employee_id_fkey 
    FOREIGN KEY (assigned_employee_id) 
    REFERENCES public.profiles(id);

    -- 4. Fix created_by to point to profiles too?
    -- If 'created_by' join fails, we might need to fix that too.
    -- But let's assume 'created_by' was working or we fix it if reported.
    -- For safety, let's allow created_by to stay as is, or check strict tickets restore logic. 
    -- Tickets used "referenced public.profiles".
    -- Let's NOT touch created_by constraint unless necessary to avoid unrelated breakages.

    -- 5. Reload Schema
    NOTIFY pgrst, 'reload schema';
END $$;
