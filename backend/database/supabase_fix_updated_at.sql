-- 1. Add updated_at column if it doesn't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Backfill existing rows with current time
UPDATE public.tasks 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks(updated_at);

-- 4. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Create Update Policy (Owner or Assignee)
DROP POLICY IF EXISTS "Users can update their own or assigned tasks" ON public.tasks;

CREATE POLICY "Users can update their own or assigned tasks"
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

-- 6. Verify column existence
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks' 
AND column_name = 'updated_at';
