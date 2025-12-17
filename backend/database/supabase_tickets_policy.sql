-- Add due_date column if it doesn't exist
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS due_date timestamptz;

-- Enable RLS on tickets table if not already enabled
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admin and support roles to insert tickets
CREATE POLICY "Allow insert for admin and support only" ON public.tickets
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'support')
  )
);

-- Ensure users can view tickets (assuming all authenticated users can view)
-- If there isn't already a select policy, you might need one like this:
-- CREATE POLICY "Allow select for all authenticated users" ON public.tickets FOR SELECT TO authenticated USING (true);
