-- ==========================================
-- SUPABASE SEED DATA SCRIPT
-- ==========================================
-- Instructions:
-- 1. Go to your Supabase Dashboard -> SQL Editor.
-- 2. Copy and paste this entire script.
-- 3. IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual User ID (UUID) 
--    found in the Authentication -> Users section of Supabase.
--    Example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
-- 4. Run the script.

-- Define your User ID here for easy replacement
\set user_id 'YOUR_USER_ID_HERE'

-- 1. Ensure Profiles Exist
-- We insert a profile for your user if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES 
  (:'user_id', 'user@gloovup.com', 'Demo User', 'employee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')
ON CONFLICT (id) DO UPDATE 
SET full_name = 'Demo User', role = 'employee', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

-- Insert a fake Admin user for assigning tasks
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@gloovup.com', 'System Admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Tasks
INSERT INTO public.tasks (title, description, status, priority, created_by, assignee, due_date, created_at)
VALUES
  ('Complete Onboarding', 'Read through the employee handbook and sign documents.', 'Completed', 'High', '00000000-0000-0000-0000-000000000001', :'user_id', NOW() + interval '2 days', NOW() - interval '1 day'),
  ('Setup Development Environment', 'Install VS Code, Node.js, and clone the repository.', 'In Progress', 'Urgent', '00000000-0000-0000-0000-000000000001', :'user_id', NOW() + interval '1 day', NOW()),
  ('Update Profile Picture', 'Upload a professional photo to your profile.', 'Pending', 'Low', :'user_id', :'user_id', NOW() + interval '7 days', NOW());

-- 3. Insert Tickets
INSERT INTO public.tickets (title, description, status, priority, created_by, assignee, created_at)
VALUES
  ('Laptop Overheating', 'My laptop gets very hot when running the build script.', 'Open', 'Medium', :'user_id', '00000000-0000-0000-0000-000000000001', NOW()),
  ('Access to Jira', 'Need access to the project board.', 'Closed', 'High', :'user_id', '00000000-0000-0000-0000-000000000001', NOW() - interval '3 days');

-- 4. Insert Attendance
INSERT INTO public.attendance (user_id, date, check_in, check_out, status)
VALUES
  (:'user_id', CURRENT_DATE, '09:00:00', NULL, 'Present'),
  (:'user_id', CURRENT_DATE - 1, '08:55:00', '17:05:00', 'Present'),
  (:'user_id', CURRENT_DATE - 2, '09:10:00', '17:00:00', 'Present');

-- 5. Insert Notifications (Optional, if you have a notifications table)
-- INSERT INTO public.notifications ...

