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

-- RLS: Users can insert their own profile (Needed for auto-creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

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

-- RLS: Read Tasks (Authenticated Users)
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks" 
ON public.tasks FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS: Insert Tasks (Authenticated Users, must set created_by = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() = created_by);

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
-- 3. DUMMY DATA INSERT (Template)
-- =============================================================================
-- Run this if you want to manually seed a profile for testing
-- Replace 'YOUR_USER_ID_HERE' with your actual Supabase User ID

/*
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES 
  ('YOUR_USER_ID_HERE', 'test@example.com', 'Test User', 'employee', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (title, description, status, priority, created_by, assignee)
VALUES 
  ('Test Task 1', 'This is a test task', 'Pending', 'High', 'YOUR_USER_ID_HERE', 'YOUR_USER_ID_HERE');
*/
