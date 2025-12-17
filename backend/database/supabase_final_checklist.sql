-- 1) DB columns check
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tickets'
ORDER BY ordinal_position;

-- 2) Add missing columns
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assignee uuid;

-- 3) Make created_by uuid (safe cast)
-- Uncomment if needed, but usually safe to skip if column was just created
-- ALTER TABLE public.tickets ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- 4) Add foreign key to profiles (safe DO block)
DO $$
BEGIN
  -- Created By FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;

  -- Assignee FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_assignee_fkey') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_assignee_fkey
      FOREIGN KEY (assignee) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 5) Seed a test profile
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES ('11111111-1111-1111-1111-111111111111','Ticket Test','ticket-test@example.com','employee', now())
ON CONFLICT (id) DO NOTHING;

-- 6) Test insert a ticket via SQL
INSERT INTO public.tickets (id, title, description, priority, status, created_by, due_date)
VALUES (
  gen_random_uuid(), 
  'SQL ticket test', 
  'Inserted via SQL to verify', 
  'normal', 
  'open',
  '11111111-1111-1111-1111-111111111111', 
  '2025-12-10T10:00:00Z'
);

-- 7) Run join query used by frontend (verify select)
SELECT 
  t.id, t.title, 
  p1.full_name as creator_name, 
  p2.full_name as assignee_name
FROM public.tickets t
LEFT JOIN public.profiles p1 ON t.created_by = p1.id
LEFT JOIN public.profiles p2 ON t.assignee = p2.id
LIMIT 10;

-- 8) Row-Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_all" ON public.tickets;
CREATE POLICY "tickets_select_all" ON public.tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "tickets_insert_auth" ON public.tickets;
CREATE POLICY "tickets_insert_auth" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tickets_update_owner" ON public.tickets;
CREATE POLICY "tickets_update_owner" ON public.tickets FOR UPDATE USING (created_by = auth.uid());
