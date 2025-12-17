
-- FINAL STRICT CLEANUP
-- Drops any remaining constraints to 'profiles' or 'auth.users' from tasks and tickets tables.

DO $$
BEGIN
  -- 0. FORCE CLEANUP of invalid foreign keys (The Fix for 23503 Error)
  -- If an assigned_employee_id does not exist in employees table, set it to NULL
  UPDATE tasks
  SET assigned_employee_id = NULL
  WHERE assigned_employee_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM employees WHERE id = tasks.assigned_employee_id
  );

  UPDATE tickets
  SET assigned_employee_id = NULL
  WHERE assigned_employee_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM employees WHERE id = tickets.assigned_employee_id
  );

  -- Drop tasks -> profiles/auth constraints
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_created_by_fkey' AND table_name = 'tasks') THEN
      ALTER TABLE tasks DROP CONSTRAINT tasks_created_by_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assignee_fkey' AND table_name = 'tasks') THEN
      ALTER TABLE tasks DROP CONSTRAINT tasks_assignee_fkey;
  END IF;

  -- Drop tickets -> profiles/auth constraints
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tickets_created_by_fkey' AND table_name = 'tickets') THEN
      ALTER TABLE tickets DROP CONSTRAINT tickets_created_by_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tickets_assignee_fkey' AND table_name = 'tickets') THEN
      ALTER TABLE tickets DROP CONSTRAINT tickets_assignee_fkey;
  END IF;

  -- Ensure strict constraints exist
  -- (These should have been created by previous scripts, but good to double check or re-apply if missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_employee_id_fkey' AND table_name = 'tasks') THEN
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_assigned_employee_id_fkey 
      FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tickets_assigned_employee_id_fkey' AND table_name = 'tickets') THEN
      ALTER TABLE tickets 
      ADD CONSTRAINT tickets_assigned_employee_id_fkey 
      FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  -- Notifying reload of schema cache just in case
  PERFORM pg_notify('pgrst', 'reload config');
END $$;
