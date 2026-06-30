-- 1. Create public profiles table
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  bio text,
  weekly_goal_hours numeric default 10.0,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS for profiles
alter table profiles enable row level security;

-- Policy for select (anyone can view public profiles)
create policy "anyone can view public profiles"
  on profiles for select
  using (is_public = true);

-- Policy for select (users can view their own private profiles)
create policy "users view own private profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Policy for insert/update/delete (users manage their own profile)
create policy "users manage own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Create weekly AI summaries table
create table if not exists weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  summary text not null,
  created_at timestamptz default now()
);

-- Enable RLS for weekly_summaries
alter table weekly_summaries enable row level security;

-- Policy for users to manage their own weekly summaries
create policy "users manage own weekly summaries"
  on weekly_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow public select if their profile is public
create policy "anyone can read public weekly summaries"
  on weekly_summaries for select
  using (
    exists (
      select 1 from profiles 
      where profiles.user_id = weekly_summaries.user_id 
      and profiles.is_public = true
    )
  );
