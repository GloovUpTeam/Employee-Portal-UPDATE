
-- 1. Ensure EMPLOYEES table structure is correct
-- We assume it exists, but ensure user_id and email are unique/indexed
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Modify TASKS table to correct structure
-- Add assigned_employee_id if missing
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID;

-- Drop incorrect constraints if they exist (heuristics for common names)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_fkey' AND table_name = 'tasks') THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_fkey;
  END IF;
  
  -- If there was an old 'assigned_employee_id' pointing to profiles, try to drop it
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_employee_id_fkey' AND table_name = 'tasks') THEN
      ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_employee_id_fkey;
  END IF;
END $$;

-- Add strict constraint to EMPLOYEES table
ALTER TABLE tasks 
  ADD CONSTRAINT tasks_assigned_employee_id_fkey 
  FOREIGN KEY (assigned_employee_id) 
  REFERENCES employees(id)
  ON DELETE SET NULL;

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Employees can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admin view all tasks" ON tasks;

-- EMPLOYEES Policy
CREATE POLICY "Employees can view own profile" 
ON employees 
FOR SELECT 
USING (
  auth.email() = email
);

-- TASKS Policy (Employee View)
CREATE POLICY "Employees can view assigned tasks" 
ON tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = tasks.assigned_employee_id 
    AND employees.email = auth.email()
  )
);

-- TASKS Policy (Admin - assuming admin role check exists via metadata or employees table)
-- Providing a generic Admin policy for now, user can refine
CREATE POLICY "Admins can manage all tasks" 
ON tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.email() AND employees.role = 'admin'
  )
);
