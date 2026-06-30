-- 1. Create projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  status text check (status in ('active', 'paused', 'shipped')) default 'active',
  github_repo_url text,
  tech_stack text[] default '{}',
  created_at timestamptz default now()
);

-- Enable RLS for projects
alter table projects enable row level security;

-- Policy for users to manage their own projects
create policy "users manage own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Create dev_sessions table
create table if not exists dev_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references projects on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,  -- computed on end
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS for dev_sessions
alter table dev_sessions enable row level security;

-- Policy for users to manage their own dev_sessions
create policy "users manage own dev sessions"
  on dev_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Upgrade coding_stats table to support rating history sparkline
alter table coding_stats add column if not exists cf_rating_history jsonb;
