
-- 1. Ensure EMPLOYEES table structure is correct (Idempotent)
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Modify TICKETS table structure
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID,
  ADD COLUMN IF NOT EXISTS raised_by_admin_id UUID REFERENCES auth.users(id); 

-- 3. DATA CLEANUP & MIGRATION
-- Attempt to fix cases where Auth User ID was stored in assigned_employee_id
-- Update tickets t SET assigned_employee_id = e.id FROM employees e WHERE t.assigned_employee_id = e.user_id;

-- Attempt to migrate from legacy 'assignee' column (often JSON or UUID in some schemas)
-- or 'assigneeId' if it exists.
-- We'll try to guess based on common patterns in this codebase.
DO $$
BEGIN
  -- If 'assignee' column exists and is a UUID (common in Supabase for FKs)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assignee' AND data_type = 'uuid') THEN
    UPDATE tickets t
    SET assigned_employee_id = e.id
    FROM employees e
    WHERE t.assigned_employee_id IS NULL 
    AND t.assignee = e.user_id; -- Assuming legacy absentee was Auth ID
  END IF;

   -- If 'client_id' was wrongly used for employee assignment (rare but possible in messy schemas), ignore for now unless requested.
END $$;

-- 4. NULLIFY INVALID DATA
-- If assigned_employee_id still does not match any employee.id, set it to NULL
UPDATE tickets
SET assigned_employee_id = NULL
WHERE assigned_employee_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM employees WHERE id = tickets.assigned_employee_id
);

-- 5. APPLY CONSTRAINTS
DO $$ 
BEGIN
  -- Drop old constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tickets_assigned_employee_id_fkey' AND table_name = 'tickets') THEN
      ALTER TABLE tickets DROP CONSTRAINT tickets_assigned_employee_id_fkey;
  END IF;
  
   IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tickets_assignee_fkey' AND table_name = 'tickets') THEN
      ALTER TABLE tickets DROP CONSTRAINT tickets_assignee_fkey;
  END IF;
END $$;

ALTER TABLE tickets 
  ADD CONSTRAINT tickets_assigned_employee_id_fkey 
  FOREIGN KEY (assigned_employee_id) 
  REFERENCES employees(id)
  ON DELETE SET NULL;

-- 6. RLS Policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can manage tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;

CREATE POLICY "Employees can view own tickets" 
ON tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = tickets.assigned_employee_id 
    AND employees.email = auth.email()
  )
);

CREATE POLICY "Admins can manage all tickets" 
ON tickets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.email() AND employees.role = 'admin'
  )
);
