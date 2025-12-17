-- ENABLE STRICT RLS
-- This ensures that even if you have a token, you can only see your own data.

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read" ON employees;
DROP POLICY IF EXISTS "Users can only select their own record" ON employees;

CREATE POLICY "Users can only select their own record"
ON employees
FOR SELECT
USING (auth.uid() = user_id);

GRANT SELECT ON employees TO authenticated;
