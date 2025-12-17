-- ================================================================
-- FIX: Create Missing Payroll Table
-- ================================================================

-- 1) Create Table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g. "December"
  year INTEGER NOT NULL, -- e.g. 2025
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Allow users to view their own slips
DROP POLICY IF EXISTS "Users can view own payroll" ON public.payroll;
CREATE POLICY "Users can view own payroll" ON public.payroll
  FOR SELECT USING (auth.uid() = user_id);

-- 4) Seed Data for the Test User
-- Using the same ID we used in tickets fix: '11111111-1111-1111-1111-111111111111'
INSERT INTO public.payroll (user_id, month, year, amount, status, pdf_url)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'November', 2025, 4500.00, 'Paid', '#'),
  ('11111111-1111-1111-1111-111111111111', 'October', 2025, 4500.00, 'Paid', '#')
ON CONFLICT DO NOTHING;
