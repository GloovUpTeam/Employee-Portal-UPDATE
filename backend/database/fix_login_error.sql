-- Run this in your Supabase SQL Editor to fix the login error for gowsalya@gloovup.com

UPDATE employees
SET password = '$2b$10$rT4TD4XF9KCOiPF0/8p8vOKA/9WuX5sheyA9qCyI74mMZck5uViru', -- Hash for 'password123'
    is_active = true
WHERE email = 'gowsalya@gloovup.com';
