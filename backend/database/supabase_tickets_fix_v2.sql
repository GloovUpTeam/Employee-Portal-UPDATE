-- 1) Inspect columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='tickets' 
ORDER BY ordinal_position;

-- 2) Add missing columns
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assignee uuid;

-- 3) Ensure types (safe cast if needed)
-- These commands will fail if data cannot be cast, but for new/empty columns it's fine.
-- Uncomment if you suspect type mismatch.
-- ALTER TABLE public.tickets ALTER COLUMN created_by TYPE uuid USING created_by::uuid;
-- ALTER TABLE public.tickets ALTER COLUMN client_id TYPE uuid USING client_id::uuid;

-- 4) Add Foreign Keys (Safe execution)
DO $$
BEGIN
  -- Created By -> Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN
    ALTER TABLE public.tickets 
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Client ID -> Clients (Only if clients table exists, wrapped in exception block just in case, or check existence)
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

-- 5) Seed minimal profile for testing
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Ticket Test User', 'ticket-test@example.com', 'employee', now())
ON CONFLICT (id) DO NOTHING;

-- 6) Insert test ticket
INSERT INTO public.tickets (id, title, description, priority, status, created_by, due_date)
VALUES (
  gen_random_uuid(),
  'SQL ticket test',
  'Inserted via SQL to verify schema',
  'medium',
  'open',
  '11111111-1111-1111-1111-111111111111',
  '2025-12-10T10:00:00Z'
);

-- 7) RLS Policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Tickets read all" ON public.tickets;
CREATE POLICY "Tickets read all" ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert if authenticated
DROP POLICY IF EXISTS "Tickets insert auth" ON public.tickets;
CREATE POLICY "Tickets insert auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update if owner
DROP POLICY IF EXISTS "Tickets update owner" ON public.tickets;
CREATE POLICY "Tickets update owner" ON public.tickets FOR UPDATE USING (created_by = auth.uid());
