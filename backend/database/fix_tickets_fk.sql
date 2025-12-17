-- FIX TICKET FOREIGN KEYS (REVISED)
-- The previous script failed because constraints already existed with the specific names.
-- We will strictly DROP them by the names we intend to use, to ensure we can recreate them pointing to public.profiles.

DO $$ 
BEGIN
    -- 1. DROP EXISTING CONSTRAINTS (Handle all potential names to be safe)
    
    -- Drop 'tickets_assignee_fkey' if it exists (This was the one causing error)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_name = 'tickets_assignee_fkey') THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_assignee_fkey;
    END IF;

    -- Drop 'tickets_created_by_fkey' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_name = 'tickets_created_by_fkey') THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_created_by_fkey;
    END IF;

    -- Also drop the auto-generated ones just in case they are lingering and we want to be clean
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_name = 'tickets_raised_by_admin_id_fkey') THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_raised_by_admin_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_name = 'tickets_assigned_employee_id_fkey') THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_assigned_employee_id_fkey;
    END IF;


    -- 2. RE-CREATE CONSTRAINTS referencing public.profiles
    -- Map raised_by_admin_id -> profiles.id
    -- Map assigned_employee_id -> profiles.id

    ALTER TABLE public.tickets 
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (raised_by_admin_id) REFERENCES public.profiles(id);

    ALTER TABLE public.tickets 
    ADD CONSTRAINT tickets_assignee_fkey FOREIGN KEY (assigned_employee_id) REFERENCES public.profiles(id);

END $$;
