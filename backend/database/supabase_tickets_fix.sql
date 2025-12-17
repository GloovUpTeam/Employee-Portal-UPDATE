-- 1) Ensure columns exist
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS client_id uuid NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid NULL,
  ADD COLUMN IF NOT EXISTS assignee uuid NULL;

-- 2) Add foreign keys if they don't exist (helper: drop/create safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_client_id_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_assignee_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_assignee_fkey FOREIGN KEY (assignee) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Ensure minimal profiles table row for current auth test user
-- Replace '00000000-0000-0000-0000-000000000000' with your test profile id OR use auth.uid() if running inside DB function.
-- NOTE: This is a template. In a real migration, you might want to use auth.uid() in a policy or trigger.
-- For now, we insert a dummy profile for testing if you know the ID.
-- If you are running this in the SQL Editor and want to seed for a specific user, replace the UUID below.
INSERT INTO public.profiles (id, full_name, email, role, created_at)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, 'Test User', 'test@example.com', 'employee', now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111');

-- 4) Insert a dummy ticket to verify UI
INSERT INTO public.tickets (id, title, description, status, priority, client_id, assignee, created_by, due_date, created_at)
VALUES (
  gen_random_uuid(),
  'Dummy ticket - verify UI',
  'This is a seed ticket for frontend testing',
  'open',
  'normal',
  NULL,
  '11111111-1111-1111-1111-111111111111', -- assignee profile id (existing above)
  '11111111-1111-1111-1111-111111111111', -- created_by
  now() + interval '3 days',
  now()
);

-- 5) Row Level Security policies
-- Profiles: allow authenticated reads
CREATE POLICY "authenticated_read_profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tickets: read for authenticated users
CREATE POLICY "authenticated_read_tickets" ON public.tickets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tickets: insert for authenticated users if created_by equals auth.uid()
CREATE POLICY "tickets_insert_auth" ON public.tickets
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Tickets: allow owners to update their own ticket rows (optional)
CREATE POLICY "tickets_update_owner" ON public.tickets
  FOR UPDATE USING (created_by = auth.uid());
