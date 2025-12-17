-- DISABLE ROW LEVEL SECURITY ON EMPLOYEES
-- Requirement: Custom Auth (JWT) is used, so Supabase RLS policies block access.
-- Solution: Completely disable RLS on 'employees' table.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
