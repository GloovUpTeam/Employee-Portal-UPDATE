-- STRICT FILES STORAGE SETUP
-- 1. Create 'files' table for metadata persistence
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    type TEXT, -- 'image', 'doc', 'archive', etc.
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on 'files'
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for 'files' table
-- View: All Authenticated Users can view files (or restrict to company/team?)
-- Requirement: "Employee sees allowed files". Let's assume all company files are shared for now.
DROP POLICY IF EXISTS "Authenticated users can view files" ON public.files;
CREATE POLICY "Authenticated users can view files" ON public.files
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Upload: Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload files" ON public.files;
CREATE POLICY "Authenticated users can upload files" ON public.files
    FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- Delete: Only Uploader or Admin can delete
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;
CREATE POLICY "Users can delete own files" ON public.files
    FOR DELETE
    USING (auth.uid() = uploaded_by OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));


-- 4. STORAGE SETUP
-- We need a bucket named 'company_files'
-- Note: SQL to create buckets is specific to Supabase extensions, usually done in UI, but we can try inserting into storage.buckets if permissions allow.
-- If this fails, User must create bucket 'company_files' in UI.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('company_files', 'company_files', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Policies (storage.objects)
-- View: Public or Authenticated
DROP POLICY IF EXISTS "Public Access" ON storage.objects; 
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'company_files' );

-- Upload: Authenticated
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'company_files' AND auth.role() = 'authenticated' );

-- Delete: Owner or Admin
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE
USING ( bucket_id = 'company_files' AND (auth.uid() = owner OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) );
