-- 1. Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. DEV POLICY (Permissive - Run this for quick testing)
-- Allows any authenticated user to update any task
CREATE POLICY "Dev: Enable update for all authenticated users" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. PROD POLICY (Strict - Use this for production)
-- Only allows update if user is the creator OR the assignee
-- Uncomment to use:
/*
CREATE POLICY "Prod: Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assignee
)
WITH CHECK (
  auth.uid() = created_by OR 
  auth.uid() = assignee
);
*/

-- 4. Ensure Select Policy Exists (so users can see tasks)
CREATE POLICY "Enable read access for all authenticated users"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);
