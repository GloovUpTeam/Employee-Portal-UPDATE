-- STRICT TASK-PROJECT LINKING (REVISED)
-- 1. Ensure 'projects' table exists and has required columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        -- Create projects table if completely missing
        CREATE TABLE public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT now()
        );
        -- Enable RLS
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        
        -- Admin Access (Full)
        CREATE POLICY "Admins full access projects" ON public.projects
            FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
            
        -- Employee Access (Read Only)
        CREATE POLICY "Employees view projects" ON public.projects
            FOR SELECT USING (true);
    ELSE
        -- Table exists, ensure columns exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'created_by') THEN
            ALTER TABLE public.projects ADD COLUMN created_by UUID REFERENCES auth.users(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
            ALTER TABLE public.projects ADD COLUMN description TEXT;
        END IF;
    END IF;
END $$;

-- 2. Add 'project_id' to 'tasks' table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE public.tasks ADD COLUMN project_id UUID REFERENCES public.projects(id);
    END IF;
END $$;

-- 3. Backfill Existing Tasks
DO $$ 
DECLARE
    general_project_id UUID;
BEGIN
    -- Check if we have NULL project_id tasks
    IF EXISTS (SELECT 1 FROM public.tasks WHERE project_id IS NULL) THEN
        -- Find or Create 'General' Project
        SELECT id INTO general_project_id FROM public.projects WHERE name = 'General' LIMIT 1;
        
        IF general_project_id IS NULL THEN
            -- Now safe to insert because we ensured columns exist above
            INSERT INTO public.projects (name, description, created_by)
            VALUES ('General', 'Default project for existing tasks', (SELECT id FROM profiles WHERE role='admin' LIMIT 1))
            RETURNING id INTO general_project_id;
        END IF;

        -- Update NULL tasks
        UPDATE public.tasks SET project_id = general_project_id WHERE project_id IS NULL;
    END IF;
END $$;
