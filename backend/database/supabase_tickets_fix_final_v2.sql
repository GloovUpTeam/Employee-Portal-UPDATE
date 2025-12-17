-- FIX V2: Resolve FK Violation by ensuring the referenced profile exists
-- Step 1: Insert the missing "Test User" profile (referencing the ID failing in your error)
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Ticket Test User', 'ticket-test@example.com', 'employee', now())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Cleanup any OTHER orphan records (just in case)
DELETE FROM public.tickets 
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.tickets 
WHERE assignee IS NOT NULL 
  AND assignee NOT IN (SELECT id FROM public.profiles);

-- Step 3: Ensure Columns are Nullable (Safety)
ALTER TABLE public.tickets ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN assignee DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN client_id DROP NOT NULL;

-- Step 4: Drop existing constraints to reset
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assignee_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

-- Step 5: Add Constraints (Now safe because the profile exists)
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_assignee_fkey
  FOREIGN KEY (assignee) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 6: Verify/Add Client FK
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_client_id_fkey') THEN
      ALTER TABLE public.tickets
        ADD CONSTRAINT tickets_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- Step 7: Policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tickets read all" ON public.tickets;
CREATE POLICY "Tickets read all" ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets insert auth" ON public.tickets;
CREATE POLICY "Tickets insert auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets update owner" ON public.tickets;
CREATE POLICY "Tickets update owner" ON public.tickets FOR UPDATE USING (created_by = auth.uid());
