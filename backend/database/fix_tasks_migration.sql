
-- 1. Ensure EMPLOYEES table structure is correct
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Modify TASKS table structure
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID;

-- 3. DATA CLEANUP & MIGRATION (CRITICAL STEP)
-- Attempt to fix cases where Auth User ID was stored in assigned_employee_id
-- We look up the employee via user_id
UPDATE tasks t
SET assigned_employee_id = e.id
FROM employees e
WHERE t.assigned_employee_id = e.user_id;

-- Attempt to migrate from legacy 'assigned_to' column if it exists and assigned_employee_id is NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    UPDATE tasks t
    SET assigned_employee_id = e.id
    FROM employees e
    WHERE t.assigned_employee_id IS NULL 
    AND t.assigned_to::text = e.user_id::text; -- Cast to text to be safe if types differ
  END IF;
END $$;

-- 4. NULLIFY INVALID DATA
-- If assigned_employee_id still does not match any employee.id, set it to NULL
-- This prevents the Foreign Key violation error
UPDATE tasks
SET assigned_employee_id = NULL
WHERE assigned_employee_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM employees WHERE id = tasks.assigned_employee_id
);

-- 5. APPLY CONSTRAINTS
-- Now safe to apply the foreign key
DO $$ 
BEGIN
  -- Drop old constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_fkey' AND table_name = 'tasks') THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_employee_id_fkey' AND table_name = 'tasks') THEN
      ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_employee_id_fkey;
  END IF;
END $$;

ALTER TABLE tasks 
  ADD CONSTRAINT tasks_assigned_employee_id_fkey 
  FOREIGN KEY (assigned_employee_id) 
  REFERENCES employees(id)
  ON DELETE SET NULL;

-- 6. RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Employees can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;

CREATE POLICY "Employees can view own profile" 
ON employees FOR SELECT USING (
  auth.email() = email
);

CREATE POLICY "Employees can view assigned tasks" 
ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = tasks.assigned_employee_id 
    AND employees.email = auth.email()
  )
);

CREATE POLICY "Admins can manage all tasks" 
ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.email() AND employees.role = 'admin'
  )
);
