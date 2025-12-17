-- CHECK MESSAGES TABLE RLS & FK
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'messages';

-- Check Foreign Keys
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'messages';

-- Check Policies (Corrected column name)
select * from pg_policies where tablename = 'messages';

-- INSERT POLICY Creation (Safe fallback)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
CREATE POLICY "Authenticated users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Authenticated users can select messages" ON messages;
CREATE POLICY "Authenticated users can select messages"
ON messages FOR SELECT
TO authenticated
USING (true); -- Simplified for team chat debug

-- Check Profiles vs Employees content for gowsalya
SELECT count(*) as profiles_count FROM profiles WHERE email = 'gowsalya@gloovup.com';
SELECT count(*) as employees_count FROM employees WHERE email = 'gowsalya@gloovup.com';
