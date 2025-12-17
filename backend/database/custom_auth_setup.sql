-- CUSTOM AUTH SETUP
-- 1. Add password column to employees
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'password') THEN
        ALTER TABLE public.employees ADD COLUMN password TEXT;
    END IF;
END $$;

-- 2. (Optional) You might want to seed a user manually for testing.
-- Since we can't hash via SQL easily without extensions (pgcrypto), 
-- we will ask the user or provide a helper endpoint to register/hash later.
-- For now, just ensuring the column exists is enough for the server to work (it will check it).
