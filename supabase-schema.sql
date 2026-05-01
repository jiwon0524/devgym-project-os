-- DevGym ProjectOS collaboration backend
-- Run this in Supabase SQL Editor after enabling the Kakao provider in Auth.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'Member' check (role in ('Owner', 'Manager', 'Member', 'Viewer')),
  status text not null default 'Invited' check (status in ('Invited', 'Active', 'Removed')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.project_snapshots (
  workspace_id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_type text not null,
  target_id text,
  body text not null,
  mentions text[] not null default '{}',
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  type text not null,
  channel text not null default 'app' check (channel in ('app', 'kakao')),
  status text not null default 'queued' check (status in ('queued', 'needs_server', 'sent', 'failed')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_type text not null,
  target_id text,
  body text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_type text not null,
  target_id text,
  type text not null,
  body text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.project_snapshots enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.decisions enable row level security;
alter table public.activity_log enable row level security;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.status = 'Active'
  );
$$;

drop policy if exists "workspace owner can manage" on public.workspaces;
create policy "workspace owner can manage"
on public.workspaces
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "members can read workspace" on public.workspaces;
create policy "members can read workspace"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "members visible to workspace users" on public.workspace_members;
create policy "members visible to workspace users"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id) or user_id = auth.uid());

drop policy if exists "owners and managers manage members" on public.workspace_members;
create policy "owners and managers manage members"
on public.workspace_members
for all
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('Owner', 'Manager')
      and wm.status = 'Active'
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('Owner', 'Manager')
      and wm.status = 'Active'
  )
);

drop policy if exists "snapshot owner access" on public.project_snapshots;
create policy "snapshot owner access"
on public.project_snapshots
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "members read comments" on public.comments;
create policy "members read comments"
on public.comments
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members write comments" on public.comments;
create policy "members write comments"
on public.comments
for insert
with check (public.is_workspace_member(workspace_id) and author_id = auth.uid());

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications
for select
using (recipient_id = auth.uid() or public.is_workspace_member(workspace_id));

drop policy if exists "members queue notifications" on public.notifications;
create policy "members queue notifications"
on public.notifications
for insert
with check (workspace_id is null or public.is_workspace_member(workspace_id));

drop policy if exists "members read decisions" on public.decisions;
create policy "members read decisions"
on public.decisions
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members write decisions" on public.decisions;
create policy "members write decisions"
on public.decisions
for insert
with check (public.is_workspace_member(workspace_id) and author_id = auth.uid());

drop policy if exists "members read activity log" on public.activity_log;
create policy "members read activity log"
on public.activity_log
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members write activity log" on public.activity_log;
create policy "members write activity log"
on public.activity_log
for insert
with check (public.is_workspace_member(workspace_id));
