-- FORCE CREATE USERS AND SYNC
-- Run this in Supabase SQL Editor

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert Users into auth.users if they don't exist
-- We use a default password 'password123'
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    e.email,
    crypt('password123', gen_salt('bf')), -- Default password
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', e.full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
FROM public.employees e
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = e.email
);

-- 3. Link Employees to the new Auth Users
UPDATE public.employees
SET user_id = auth.users.id
FROM auth.users
WHERE public.employees.email = auth.users.email
  AND public.employees.user_id IS NULL;

-- 4. Enable is_active for everyone
UPDATE public.employees
SET is_active = true
WHERE is_active IS NULL;

-- 5. Verification Report
SELECT 
    email, 
    full_name, 
    CASE 
        WHEN user_id IS NOT NULL THEN '✅ Linked' 
        ELSE '❌ Still Unlinked' 
    END as status
FROM public.employees;
