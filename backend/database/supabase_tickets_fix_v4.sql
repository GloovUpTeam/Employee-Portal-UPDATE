-- ================================================================
-- FIX V4: The "Nuclear Option" for Schema & Data
-- ================================================================

-- 1) Ensure Columns Exist & are Nullable
-- We drop NOT NULL because we use ON DELETE SET NULL later, so they MUST be nullable.
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.tickets ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assignee uuid;
ALTER TABLE public.tickets ALTER COLUMN assignee DROP NOT NULL;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.tickets ALTER COLUMN client_id DROP NOT NULL;

-- 2) Pre-flight cleanup: Handle orphan records
-- Now that columns are nullable, this UPDATE will work.
UPDATE public.tickets 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM public.profiles);

UPDATE public.tickets 
SET assignee = NULL 
WHERE assignee IS NOT NULL 
  AND assignee NOT IN (SELECT id FROM public.profiles);

-- 3) Insert Test/System Profile (Ensures reference exists)
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Ticket Test User', 'ticket-test@example.com', 'employee', now())
ON CONFLICT (id) DO NOTHING;

-- 4) Add Foreign Keys
DO $$
BEGIN
  -- Created By -> Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN
    ALTER TABLE public.tickets 
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Client ID -> Clients
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_client_id_fkey') THEN
        ALTER TABLE public.tickets 
        ADD CONSTRAINT tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
      END IF;
  END IF;

  -- Assignee -> Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_assignee_fkey') THEN
    ALTER TABLE public.tickets 
    ADD CONSTRAINT tickets_assignee_fkey FOREIGN KEY (assignee) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 5) Insert Test Ticket (Safe insert)
INSERT INTO public.tickets (id, title, description, priority, status, created_by, due_date)
VALUES (
  gen_random_uuid(),
  'SQL ticket test v4',
  'Inserted via SQL v4',
  'medium',
  'open',
  '11111111-1111-1111-1111-111111111111',
  '2025-12-10T10:00:00Z'
);

-- 6) Refresh RLS Policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tickets read all" ON public.tickets;
CREATE POLICY "Tickets read all" ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets insert auth" ON public.tickets;
CREATE POLICY "Tickets insert auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tickets update owner" ON public.tickets;
CREATE POLICY "Tickets update owner" ON public.tickets FOR UPDATE USING (created_by = auth.uid());
