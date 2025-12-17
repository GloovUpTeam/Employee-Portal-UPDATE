-- Force recreate the messages table to ensure correct columns exist
DROP TABLE IF EXISTS public.messages;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID, -- Null for public/team chat
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Explicit Foreign Constraints to profiles for Supabase logic detection
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Enable read access for users involved in the message" ON public.messages;
CREATE POLICY "Enable read access for users involved in the message"
ON public.messages FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    receiver_id IS NULL -- Public message
    OR sender_id = auth.uid() -- I sent it
    OR receiver_id = auth.uid() -- It was sent to me
  )
);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.messages;
CREATE POLICY "Enable insert access for all authenticated users"
ON public.messages FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
