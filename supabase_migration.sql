-- Supabase migration: profiles, tasks, policies and RPC

create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  points int default 0,
  created_at timestamptz default now()
);

create table tasks (
  id bigserial primary key,
  title text not null,
  points int not null default 10,
  status text not null default 'open',
  assigned_to uuid references profiles(id),
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table tasks enable row level security;

-- Policies
create policy "Profiles: select own" on profiles
  for select using (auth.uid() = id);

create policy "Profiles: update own" on profiles
  for update using (auth.uid() = id);

create policy "Tasks: select own" on tasks
  for select using (auth.uid() = assigned_to);

create policy "Tasks: update own" on tasks
  for update using (auth.uid() = assigned_to);

-- RPC to increment points (run as service role)
create or replace function increment_points(userid uuid, add_points int)
returns void as $$
begin
  update profiles set points = points + add_points where id = userid;
end;
$$ language plpgsql;
  
