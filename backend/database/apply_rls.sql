-- 1. Add is_active column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='is_active') THEN
        ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Only allow access to own record
DROP POLICY IF EXISTS "Users can only select their own record" ON employees;

CREATE POLICY "Users can only select their own record"
ON employees
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Grant access to authenticated users (so the policy can actually be evaluated)
GRANT SELECT ON employees TO authenticated;
