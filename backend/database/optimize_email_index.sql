-- OPTIMIZE LOGIN PERFORMANCE
-- Create an index on email to make the login lookup instant.

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
