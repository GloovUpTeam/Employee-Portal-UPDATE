-- 1. Attendance Table (Ensure it exists)
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in timestamptz,
  check_out timestamptz,
  status text,
  date date default current_date,
  created_at timestamptz default now()
);

alter table attendance enable row level security;

create policy "Enable read access for users to their own attendance"
on attendance for select
using (auth.uid() = user_id);

create policy "Enable insert access for users to their own attendance"
on attendance for insert
with check (auth.uid() = user_id);

create policy "Enable update access for users to their own attendance"
on attendance for update
using (auth.uid() = user_id);


-- 2. Payroll Table
create table if not exists payroll (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  year int not null,
  amount numeric not null,
  status text default 'Paid',
  pdf_url text,
  created_at timestamptz default now()
);

alter table payroll enable row level security;

create policy "Enable read access for users to their own payroll"
on payroll for select
using (auth.uid() = user_id);

-- Only admins should be able to insert/update payroll (assuming admin role check or service role)
-- For now, we'll allow users to read their own.


-- 3. Messages Table (Team Chat & DMs)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade, -- Null for public/team chat
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Enable read access for users involved in the message"
on messages for select
using (
  auth.role() = 'authenticated' and (
    receiver_id is null -- Public message
    or sender_id = auth.uid() -- I sent it
    or receiver_id = auth.uid() -- It was sent to me
  )
);

create policy "Enable insert access for all authenticated users"
on messages for insert
with check (auth.role() = 'authenticated');

-- 4. Profiles Table (Ensure it exists for joins)
-- This is usually created by a trigger on auth.users, but let's ensure RLS allows reading
alter table profiles enable row level security;

create policy "Enable read access for all authenticated users"
on profiles for select
using (auth.role() = 'authenticated');
