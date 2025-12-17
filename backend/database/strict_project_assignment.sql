-- STRICT PROJECT ASSIGNMENT MIGRATION
-- 1. Add 'assigned_employee_id' to projects table
-- 2. Clean up old incorrect logic if any
-- 3. Apply STRICT RLS

BEGIN;

-- 1. Add Column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'assigned_employee_id') THEN
        ALTER TABLE public.projects ADD COLUMN assigned_employee_id UUID REFERENCES public.employees(id);
    END IF;
END $$;

-- 2. Enable RLS on Projects and Tasks
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing loose policies
DROP POLICY IF EXISTS "Admins full access projects" ON public.projects;
DROP POLICY IF EXISTS "Employees view projects" ON public.projects;
DROP POLICY IF EXISTS "Employees view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins full access tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees view assigned tasks" ON public.tasks;

-- 4. Create STRICT Policies for PROJECTS

-- ADMINS: Full Access
CREATE POLICY "Admins full access projects" 
ON public.projects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE public.employees.email = auth.email() 
    AND public.employees.role IN ('admin', 'manager')
  )
);

-- EMPLOYEES: View ONLY assigned projects
CREATE POLICY "Employees view assigned projects" 
ON public.projects 
FOR SELECT 
USING (
  assigned_employee_id IN (
    SELECT id FROM public.employees WHERE email = auth.email()
  )
);

-- 5. Create STRICT Policies for TASKS

-- ADMINS: Full Access
CREATE POLICY "Admins full access tasks" 
ON public.tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE public.employees.email = auth.email() 
    AND public.employees.role IN ('admin', 'manager')
  )
);

-- EMPLOYEES: View Tasks via Project Assignment
CREATE POLICY "Employees view assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    from public.projects
    join public.employees on public.employees.id = public.projects.assigned_employee_id
    where public.projects.id = tasks.project_id
    and public.employees.email = auth.email()
  )
);

-- 6. Helper Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_assigned_employee ON public.projects(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

COMMIT;

NOTIFY pgrst, 'reload schema';
