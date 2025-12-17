-- =============================================================================
-- LEAVE REQUEST WORKFLOW SCHEMA
-- =============================================================================

BEGIN;

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_day BOOLEAN DEFAULT false,
  half_day_period TEXT NULL CHECK (half_day_period IN ('morning', 'afternoon')),
  days_count NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info', 'cancelled')),
  manager_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  decision_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_at TIMESTAMPTZ NULL,
  decision_comment TEXT NULL,
  is_deducted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.leave_request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests (status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON public.leave_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_leave_messages_request_id ON public.leave_request_messages (leave_request_id);

-- 3. Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_request_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Leave Requests: 
-- Employee can view their own
-- Admin/HR/Manager can view all (simplification for "manager can view direct reports" requires org hierarchy, falling back to role-based for now)
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
CREATE POLICY "leave_requests_select" ON public.leave_requests FOR SELECT
USING (
  auth.uid() = employee_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager'))
);

-- Employee can insert their own
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
CREATE POLICY "leave_requests_insert" ON public.leave_requests FOR INSERT
WITH CHECK (auth.uid() = employee_id);

-- Only Admin/HR can update (status changes), Employee can update only if pending (e.g. cancelling)
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
CREATE POLICY "leave_requests_update" ON public.leave_requests FOR UPDATE
USING (
  (auth.uid() = employee_id AND status = 'pending') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr'))
);

-- Messages:
-- Participants (employee or admin) can view
DROP POLICY IF EXISTS "leave_messages_select" ON public.leave_request_messages;
CREATE POLICY "leave_messages_select" ON public.leave_request_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leave_requests lr 
    WHERE lr.id = leave_request_id 
    AND (
      lr.employee_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager'))
    )
  )
);

-- Participants can insert
DROP POLICY IF EXISTS "leave_messages_insert" ON public.leave_request_messages;
CREATE POLICY "leave_messages_insert" ON public.leave_request_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.leave_requests lr 
    WHERE lr.id = leave_request_id 
    AND (
      lr.employee_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager'))
    )
  )
);

COMMIT;

-- 5. RPC Functions (Security Definer to bypass strict RLS if needed, or just encapsulate logic)
-- Note: Created outside transaction block usually, or ensured compatibility

CREATE OR REPLACE FUNCTION public.create_leave_request(
  p_leave_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_half_day BOOLEAN,
  p_half_day_period TEXT,
  p_reason TEXT,
  p_manager_id UUID DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_days NUMERIC;
BEGIN
  -- Simple business logic validation
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;

  -- Approximate calculation (Frontend should do better, this is a fallback)
  -- For precise business days, we'd need a holidays table function.
  v_days := (p_end_date - p_start_date) + 1;
  IF p_half_day THEN
    v_days := 0.5;
  END IF;

  INSERT INTO public.leave_requests (
    employee_id, leave_type, start_date, end_date, half_day, half_day_period, days_count, reason, manager_id, created_by
  ) VALUES (
    auth.uid(), p_leave_type, p_start_date, p_end_date, p_half_day, p_half_day_period, v_days, p_reason, p_manager_id, auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_leave_status(
  p_request_id UUID,
  p_status TEXT,
  p_comment TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check permission
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')) THEN
    RAISE EXCEPTION 'Access denied: Only Admins or HR can update status';
  END IF;

  UPDATE public.leave_requests
  SET 
    status = p_status,
    decision_by = auth.uid(),
    decision_at = NOW(),
    decision_comment = p_comment,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Add system message for the update
  INSERT INTO public.leave_request_messages (
    leave_request_id, sender_id, message
  ) VALUES (
    p_request_id, auth.uid(), 'Status updated to ' || p_status || ': ' || COALESCE(p_comment, '')
  );
END;
$$;
