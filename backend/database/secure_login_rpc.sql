-- SECURE LOGIN FUNCTION
-- This function runs as the database owner (SECURITY DEFINER)
-- It allows us to safely check role/status without complex RLS overhead during login.
-- It requires the user to be authenticated via Supabase Auth first.

CREATE OR REPLACE FUNCTION get_my_employee_status()
RETURNS TABLE (
  role text,
  is_active boolean,
  user_id uuid,
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
     RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    e.role, 
    e.is_active, 
    e.user_id,
    e.full_name
  FROM employees e
  WHERE e.email = auth.jwt() ->> 'email'
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_employee_status() TO authenticated;
