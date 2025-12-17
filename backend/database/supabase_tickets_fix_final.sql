-- Force recreate the tickets foreign keys to ensure they exist with the expected names
-- This script effectively "resets" the relationship definitions for tickets

-- 0) CLEANUP ORPHAN RECORDS (CRITICAL FIX for FK Violation)
-- Delete any tickets where created_by does not exist in profiles
DELETE FROM public.tickets 
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM public.profiles);

-- Delete any tickets where assignee does not exist in profiles
DELETE FROM public.tickets 
WHERE assignee IS NOT NULL 
  AND assignee NOT IN (SELECT id FROM public.profiles);

-- 1) IDs must be nullable for ON DELETE SET NULL
ALTER TABLE public.tickets ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN assignee DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN client_id DROP NOT NULL;

-- 2) Drop existing constraints if they exist (to support re-running)
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assignee_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

-- 3) Re-add constraints pointing to PROFILES
-- We reference public.profiles(id)
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_assignee_fkey
  FOREIGN KEY (assignee) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4) Verify or Add Client FK (Optional if clients table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 5) Ensure RLS policies don't block access
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tickets read all" ON public.tickets;
CREATE POLICY "Tickets read all" ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets insert auth" ON public.tickets;
CREATE POLICY "Tickets insert auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets update owner" ON public.tickets;
CREATE POLICY "Tickets update owner" ON public.tickets FOR UPDATE USING (created_by = auth.uid());
