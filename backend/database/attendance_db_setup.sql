-- 1. Create table
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in timestamptz,
  check_out timestamptz,
  status text,
  created_at timestamptz default now()
);

-- 2. RLS Policies
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
