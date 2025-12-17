-- 1. Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL, -- Format: GU-YY-XXXX
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow users to read their own data
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
CREATE POLICY "Users can view their own employee record"
ON public.employees FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own data (needed for signup)
DROP POLICY IF EXISTS "Users can insert their own employee record" ON public.employees;
CREATE POLICY "Users can insert their own employee record"
ON public.employees FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow admins to view all (optional, good practice)
-- CREATE POLICY "Admins can view all employees" ... (Skipping for now to keep it simple)

-- 4. Clean up old triggers that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
