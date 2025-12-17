-- 1) List columns (Run this to see current state)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tickets'
ORDER BY ordinal_position;

-- 2) Add missing columns
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assignee uuid;

-- 3) Ensure types
-- ALTER TABLE public.tickets ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- 4) Profiles check
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles'
ORDER BY ordinal_position;

-- 5) Add FKs safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_assignee_fkey') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_assignee_fkey
      FOREIGN KEY (assignee) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 6) Seed Profile
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Ticket Tester',
  'ticket-test@example.com',
  'employee',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 7) Test Insert
INSERT INTO public.tickets (id, title, description, priority, status, created_by, due_date)
VALUES (
  gen_random_uuid(),
  'sql-ticket-test',
  'testing insert via sql',
  'normal',
  'open',
  '11111111-1111-1111-1111-111111111111',
  '2025-12-10T10:00:00Z'
);

-- 8) Test Select
SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
       p.id as profile_id, p.full_name, p.email
FROM public.tickets t
LEFT JOIN public.profiles p ON t.created_by = p.id
LIMIT 20;

-- 9) RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_all" ON public.tickets;
CREATE POLICY "tickets_select_all" ON public.tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "tickets_insert_auth" ON public.tickets;
CREATE POLICY "tickets_insert_auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
