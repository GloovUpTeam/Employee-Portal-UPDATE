-- STRICT AUTHENTICATION SETUP
-- This script refactors the employees table, profiles table, and adds security triggers.

-- 1. REFACTOR EMPLOYEES TABLE
-- Remove the old foreign key constraint if it exists (assuming it was id -> auth.users.id)
-- We want employees to exist INDEPENDENTLY of auth.users.

-- Temporarily disable RLS to avoid migration issues
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- Drop dependent triggers first to be safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- MODIFY employees schema
-- We need to check if 'user_id' exists, if not add it.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id') THEN
        ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.employees ADD CONSTRAINT employees_email_key UNIQUE (email);
    END IF;
END $$;

-- Depending on current state, 'id' might be the auth.user_id. 
-- Ideally we want 'id' to be a broad UUID, and user_id to link to auth. 
-- For now, we will keep 'id' as is if it's already a UUID, but crucial part is user_id.

-- 2. REFACTOR PROFILES TABLE
-- Add employee_id FK
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_id') THEN
        ALTER TABLE public.profiles ADD COLUMN employee_id UUID REFERENCES public.employees(id);
    END IF;
END $$;

-- 3. VALIDATION TRIGGER (BEFORE SIGNUP)
-- Block signup if email is not in employees table.
CREATE OR REPLACE FUNCTION public.check_employee_registration()
RETURNS TRIGGER AS $$
DECLARE
    emp_record RECORD;
BEGIN
    -- Check if email exists in employees table
    SELECT * INTO emp_record FROM public.employees WHERE email = NEW.email;
    
    IF emp_record IS NULL THEN
        RAISE EXCEPTION 'Access denied. You are not registered as an employee.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind to auth.users BEFORE INSERT
DROP TRIGGER IF EXISTS check_employee_exists_trigger ON auth.users;
CREATE TRIGGER check_employee_exists_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_employee_registration();

-- 4. AUTO-LINKING TRIGGER (AFTER SIGNUP)
-- Link auth user to employee record AND create profile
CREATE OR REPLACE FUNCTION public.link_employee_and_create_profile()
RETURNS TRIGGER AS $$
DECLARE
    emp_id UUID;
BEGIN
    -- Find the employee record (we know it exists due to the BEFORE trigger)
    SELECT id INTO emp_id FROM public.employees WHERE email = NEW.email;

    -- 1. Update employees table with the new user_id
    UPDATE public.employees 
    SET user_id = NEW.id 
    WHERE id = emp_id;

    -- 2. Create Profile
    INSERT INTO public.profiles (id, employee_id, email, full_name, role)
    VALUES (
        NEW.id,
        emp_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name', -- Provided by frontend
        'employee' -- Default role, can be adjusted based on employees table if needed
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind to auth.users AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.link_employee_and_create_profile();

-- 5. UPDATE RLS POLICIES
-- Re-enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Employees Table Policies
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
    FOR SELECT USING (auth.uid() = user_id);

-- Profiles Table Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- (Optional) Admin policies would go here

