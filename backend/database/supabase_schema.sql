-- =============================================================================
-- 1. PROFILES TABLE (Master User Data)
-- =============================================================================
-- Ensure the table exists with correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'employee',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Public Read (Safe columns only)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- RLS: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- =============================================================================
-- 2. TASKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Foreign Keys (We add them safely below)
  assignee UUID,
  created_by UUID,
  project_id UUID
);

-- Add/Fix Foreign Key: Assignee -> Profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_assignee_fkey') THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_assignee_fkey 
    FOREIGN KEY (assignee) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add/Fix Foreign Key: Created By -> Profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_created_by_fkey') THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS: Read Tasks (Assignee, Creator, or Admin)
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" 
ON public.tasks FOR SELECT 
USING (
  auth.uid() = assignee OR 
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: Insert Tasks (Authenticated Users)
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: Update Tasks (Assignee, Creator, or Admin)
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" 
ON public.tasks FOR UPDATE 
USING (
  auth.uid() = assignee OR 
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================================================
-- 3. TICKETS TABLE (Optional but requested)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Open',
  priority TEXT DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tickets" ON public.tickets;
CREATE POLICY "Users can view their tickets" 
ON public.tickets FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = assignee);

-- =============================================================================
-- 4. SEED DATA (Safe Insert)
-- =============================================================================
-- Replace 'YOUR_USER_ID_HERE' with your actual Supabase User ID
-- This prevents FK errors when you try to create a task for yourself.

/*
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES 
  ('YOUR_USER_ID_HERE', 'you@example.com', 'Developer', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================================================
-- 5. ATTENDANCE TABLE
-- =============================================================================
-- Note: If you previously created this table with 'time' columns, you may need to DROP it first.
-- DROP TABLE IF EXISTS public.attendance;

create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text check (status in ('Present', 'Late', 'Absent', 'Half Day')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable RLS
alter table public.attendance enable row level security;

-- Policies
drop policy if exists "Users can view their own attendance" on public.attendance;
create policy "Users can view their own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own attendance" on public.attendance;
create policy "Users can insert their own attendance"
  on public.attendance for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own attendance" on public.attendance;
create policy "Users can update their own attendance"
  on public.attendance for update
  using (auth.uid() = user_id);

