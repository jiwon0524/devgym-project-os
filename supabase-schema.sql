-- DevGym ProjectOS production schema
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  original_input text not null,
  summary text,
  functional jsonb not null default '[]'::jsonb,
  non_functional jsonb not null default '[]'::jsonb,
  ui jsonb not null default '[]'::jsonb,
  api jsonb not null default '[]'::jsonb,
  database_schema jsonb not null default '[]'::jsonb,
  erd_relations jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.requirements add column if not exists summary text;
alter table public.requirements add column if not exists non_functional jsonb not null default '[]'::jsonb;
alter table public.requirements add column if not exists erd_relations jsonb not null default '[]'::jsonb;

create table if not exists public.acceptance_criteria (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  title text not null,
  given_text text not null,
  when_text text not null,
  then_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  content text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid references public.requirements(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  target_type text not null check (target_type in ('project', 'requirement', 'task')),
  target_id uuid,
  body text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invite_token text not null default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.invitations add column if not exists invite_token text;
alter table public.invitations add column if not exists expires_at timestamptz not null default (now() + interval '7 days');
update public.invitations
set invite_token = encode(gen_random_bytes(16), 'hex')
where invite_token is null;
alter table public.invitations alter column invite_token set default encode(gen_random_bytes(16), 'hex');
alter table public.invitations alter column invite_token set not null;

create table if not exists public.engineering_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid references public.requirements(id) on delete cascade,
  type text not null check (type in ('prd', 'uml', 'test_plan', 'traceability', 'markdown')),
  title text not null,
  current_version integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, requirement_id, type)
);

create table if not exists public.engineering_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.engineering_documents(id) on delete cascade,
  version_number integer not null,
  content jsonb not null default '{}'::jsonb,
  markdown text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists projects_workspace_id_idx on public.projects(workspace_id);
create index if not exists requirements_project_id_idx on public.requirements(project_id);
create index if not exists acceptance_criteria_requirement_id_idx on public.acceptance_criteria(requirement_id);
create index if not exists test_cases_requirement_id_idx on public.test_cases(requirement_id);
create index if not exists risks_requirement_id_idx on public.risks(requirement_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists comments_project_id_idx on public.comments(project_id);
create index if not exists activity_logs_workspace_id_idx on public.activity_logs(workspace_id);
create index if not exists invitations_workspace_id_idx on public.invitations(workspace_id);
create index if not exists invitations_email_idx on public.invitations(lower(email));
create unique index if not exists invitations_invite_token_idx on public.invitations(invite_token);
create index if not exists engineering_documents_workspace_id_idx on public.engineering_documents(workspace_id);
create index if not exists engineering_documents_project_id_idx on public.engineering_documents(project_id);
create index if not exists engineering_documents_requirement_id_idx on public.engineering_documents(requirement_id);
create index if not exists engineering_document_versions_document_id_idx on public.engineering_document_versions(document_id);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.requirements enable row level security;
alter table public.acceptance_criteria enable row level security;
alter table public.test_cases enable row level security;
alter table public.risks enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.invitations enable row level security;
alter table public.engineering_documents enable row level security;
alter table public.engineering_document_versions enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, '사용자'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.workspace_role(target_workspace uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace
    and wm.user_id = auth.uid()
  limit 1;
$$;

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
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role(target_workspace) = any(allowed_roles), false);
$$;

create or replace function public.project_workspace(target_project uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.workspace_id
  from public.projects p
  where p.id = target_project
  limit 1;
$$;

create or replace function public.can_read_project(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_member(public.project_workspace(target_project));
$$;

create or replace function public.can_edit_project_artifacts(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(public.project_workspace(target_project), array['owner', 'admin', 'member']);
$$;

create or replace function public.can_manage_project(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(public.project_workspace(target_project), array['owner', 'admin']);
$$;

create or replace function public.requirement_project(target_requirement uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.project_id
  from public.requirements r
  where r.id = target_requirement
  limit 1;
$$;

create or replace function public.can_read_requirement(target_requirement uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_project(public.requirement_project(target_requirement));
$$;

create or replace function public.can_edit_requirement_artifacts(target_requirement uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_edit_project_artifacts(public.requirement_project(target_requirement));
$$;

create or replace function public.create_requirement_analysis(
  p_project_id uuid,
  p_title text,
  p_original_input text,
  p_summary text,
  p_functional jsonb,
  p_non_functional jsonb,
  p_ui jsonb,
  p_api jsonb,
  p_database_schema jsonb,
  p_erd_relations jsonb,
  p_tasks jsonb,
  p_acceptance_criteria jsonb,
  p_risks jsonb,
  p_test_cases jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_requirement public.requirements;
  v_workspace_id uuid;
  v_tasks jsonb := '[]'::jsonb;
begin
  select workspace_id
  into v_workspace_id
  from public.projects
  where id = p_project_id;

  if v_workspace_id is null then
    raise exception 'Project not found';
  end if;

  insert into public.requirements (
    project_id,
    title,
    original_input,
    summary,
    functional,
    non_functional,
    ui,
    api,
    database_schema,
    erd_relations,
    created_by
  )
  values (
    p_project_id,
    p_title,
    p_original_input,
    p_summary,
    coalesce(p_functional, '[]'::jsonb),
    coalesce(p_non_functional, '[]'::jsonb),
    coalesce(p_ui, '[]'::jsonb),
    coalesce(p_api, '[]'::jsonb),
    coalesce(p_database_schema, '[]'::jsonb),
    coalesce(p_erd_relations, '[]'::jsonb),
    auth.uid()
  )
  returning * into v_requirement;

  insert into public.acceptance_criteria (requirement_id, content)
  select v_requirement.id, value
  from jsonb_array_elements_text(coalesce(p_acceptance_criteria, '[]'::jsonb));

  insert into public.risks (requirement_id, content, severity)
  select
    v_requirement.id,
    risk.content,
    case when risk.severity in ('low', 'medium', 'high') then risk.severity else 'medium' end
  from jsonb_to_recordset(coalesce(p_risks, '[]'::jsonb)) as risk(content text, severity text);

  insert into public.test_cases (requirement_id, title, given_text, when_text, then_text)
  select
    v_requirement.id,
    coalesce(test_case.title, '테스트 케이스'),
    coalesce(test_case."given", ''),
    coalesce(test_case."when", ''),
    coalesce(test_case."then", '')
  from jsonb_to_recordset(coalesce(p_test_cases, '[]'::jsonb)) as test_case(
    title text,
    "given" text,
    "when" text,
    "then" text
  );

  with inserted_tasks as (
    insert into public.tasks (
      project_id,
      requirement_id,
      title,
      description,
      status,
      priority,
      assignee_id,
      created_by
    )
    select
      p_project_id,
      v_requirement.id,
      task.title,
      coalesce(task.description, 'AI 요구사항 분석에서 생성된 작업입니다.'),
      case when task.status in ('todo', 'in_progress', 'done') then task.status else 'todo' end,
      case when task.priority in ('low', 'medium', 'high') then task.priority else 'medium' end,
      auth.uid(),
      auth.uid()
    from jsonb_to_recordset(coalesce(p_tasks, '[]'::jsonb)) as task(
      title text,
      description text,
      priority text,
      status text
    )
    where coalesce(task.title, '') <> ''
    returning *
  )
  select coalesce(jsonb_agg(to_jsonb(inserted_tasks)), '[]'::jsonb)
  into v_tasks
  from inserted_tasks;

  insert into public.activity_logs (workspace_id, project_id, actor_id, action, target_type, target_id)
  values (
    v_workspace_id,
    p_project_id,
    auth.uid(),
    '요구사항을 분석하고 저장했습니다',
    'requirement',
    v_requirement.id
  );

  return jsonb_build_object(
    'requirement', to_jsonb(v_requirement),
    'tasks', v_tasks
  );
end;
$$;

revoke all on function public.create_requirement_analysis(
  uuid, text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) from anon;
revoke all on function public.create_requirement_analysis(
  uuid, text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) from public;
grant execute on function public.create_requirement_analysis(
  uuid, text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
) to authenticated;

create or replace function public.accept_workspace_invitation(p_invite_id uuid)
returns public.invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invitations;
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_invite
  from public.invitations
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation is already processed';
  end if;

  if v_invite.expires_at < now() then
    update public.invitations
    set status = 'expired'
    where id = v_invite.id
    returning * into v_invite;
    raise exception 'Invitation expired';
  end if;

  if lower(v_invite.email) <> v_email then
    raise exception 'Invitation email does not match current user';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id)
  do nothing;

  update public.invitations
  set status = 'accepted'
  where id = v_invite.id
  returning * into v_invite;

  return v_invite;
end;
$$;

revoke all on function public.accept_workspace_invitation(uuid) from anon;
revoke all on function public.accept_workspace_invitation(uuid) from public;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;

create or replace function public.save_engineering_document_version(
  p_workspace_id uuid,
  p_project_id uuid,
  p_requirement_id uuid,
  p_type text,
  p_title text,
  p_content jsonb,
  p_markdown text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document public.engineering_documents;
  v_version public.engineering_document_versions;
  v_version_number integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('prd', 'uml', 'test_plan', 'traceability', 'markdown') then
    raise exception 'Unsupported document type';
  end if;

  if public.project_workspace(p_project_id) <> p_workspace_id then
    raise exception 'Project does not belong to workspace';
  end if;

  if not public.can_edit_project_artifacts(p_project_id) then
    raise exception 'Not allowed to save engineering documents';
  end if;

  if p_requirement_id is not null and public.requirement_project(p_requirement_id) <> p_project_id then
    raise exception 'Requirement does not belong to project';
  end if;

  insert into public.engineering_documents (
    workspace_id,
    project_id,
    requirement_id,
    type,
    title,
    current_version,
    created_by
  )
  values (
    p_workspace_id,
    p_project_id,
    p_requirement_id,
    p_type,
    p_title,
    0,
    auth.uid()
  )
  on conflict (project_id, requirement_id, type)
  do update set
    title = excluded.title,
    updated_at = now()
  returning *
  into v_document;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.engineering_document_versions
  where document_id = v_document.id;

  insert into public.engineering_document_versions (
    document_id,
    version_number,
    content,
    markdown,
    created_by
  )
  values (
    v_document.id,
    v_version_number,
    coalesce(p_content, '{}'::jsonb),
    p_markdown,
    auth.uid()
  )
  returning *
  into v_version;

  update public.engineering_documents
  set current_version = v_version.version_number,
      updated_at = now()
  where id = v_document.id
  returning *
  into v_document;

  insert into public.activity_logs (workspace_id, project_id, actor_id, action, target_type, target_id)
  values (
    p_workspace_id,
    p_project_id,
    auth.uid(),
    '요구사항 산출물을 버전으로 저장했습니다',
    'engineering_document',
    v_document.id
  );

  return jsonb_build_object(
    'document', to_jsonb(v_document),
    'version', to_jsonb(v_version)
  );
end;
$$;

revoke all on function public.save_engineering_document_version(
  uuid, uuid, uuid, text, text, jsonb, text
) from anon;
revoke all on function public.save_engineering_document_version(
  uuid, uuid, uuid, text, text, jsonb, text
) from public;
grant execute on function public.save_engineering_document_version(
  uuid, uuid, uuid, text, text, jsonb, text
) to authenticated;

drop policy if exists "profiles can read own profile" on public.profiles;
create policy "profiles can read own profile"
on public.profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members teammate on teammate.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid()
      and teammate.user_id = profiles.id
  )
);

drop policy if exists "profiles can insert own profile" on public.profiles;
create policy "profiles can insert own profile"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles can update own profile" on public.profiles;
create policy "profiles can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "members can read workspaces" on public.workspaces;
create policy "members can read workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "authenticated users can create workspaces" on public.workspaces;
create policy "authenticated users can create workspaces"
on public.workspaces
for insert
with check (owner_id = auth.uid());

drop policy if exists "owners and admins can update workspaces" on public.workspaces;
create policy "owners and admins can update workspaces"
on public.workspaces
for update
using (public.has_workspace_role(id, array['owner', 'admin']))
with check (public.has_workspace_role(id, array['owner', 'admin']));

drop policy if exists "owners can delete workspaces" on public.workspaces;
create policy "owners can delete workspaces"
on public.workspaces
for delete
using (public.has_workspace_role(id, array['owner']));

drop policy if exists "members can read workspace members" on public.workspace_members;
create policy "members can read workspace members"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id) or user_id = auth.uid());

drop policy if exists "workspace owner can add self member" on public.workspace_members;
create policy "workspace owner can add self member"
on public.workspace_members
for insert
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists "owners and admins can add members" on public.workspace_members;
create policy "owners and admins can add members"
on public.workspace_members
for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "invited users can join workspace" on public.workspace_members;
create policy "invited users can join workspace"
on public.workspace_members
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.invitations i
    where i.workspace_id = workspace_members.workspace_id
      and lower(i.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and i.status = 'pending'
      and i.role = workspace_members.role
  )
);

drop policy if exists "owners and admins can update members" on public.workspace_members;
create policy "owners and admins can update members"
on public.workspace_members
for update
using (public.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "owners and admins can remove members" on public.workspace_members;
create policy "owners and admins can remove members"
on public.workspace_members
for delete
using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "members can read workspace projects" on public.projects;
create policy "members can read workspace projects"
on public.projects
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "owners and admins can create projects" on public.projects;
create policy "owners and admins can create projects"
on public.projects
for insert
with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner', 'admin'])
);

drop policy if exists "owners and admins can update projects" on public.projects;
create policy "owners and admins can update projects"
on public.projects
for update
using (public.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "owners and admins can delete projects" on public.projects;
create policy "owners and admins can delete projects"
on public.projects
for delete
using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "members can read requirements" on public.requirements;
create policy "members can read requirements"
on public.requirements
for select
using (public.can_read_project(project_id));

drop policy if exists "editors can create requirements" on public.requirements;
create policy "editors can create requirements"
on public.requirements
for insert
with check (
  created_by = auth.uid()
  and public.can_edit_project_artifacts(project_id)
);

drop policy if exists "editors can update requirements" on public.requirements;
create policy "editors can update requirements"
on public.requirements
for update
using (public.can_edit_project_artifacts(project_id))
with check (public.can_edit_project_artifacts(project_id));

drop policy if exists "editors can delete requirements" on public.requirements;
create policy "editors can delete requirements"
on public.requirements
for delete
using (public.can_edit_project_artifacts(project_id));

drop policy if exists "members can read acceptance criteria" on public.acceptance_criteria;
create policy "members can read acceptance criteria"
on public.acceptance_criteria
for select
using (public.can_read_requirement(requirement_id));

drop policy if exists "editors can create acceptance criteria" on public.acceptance_criteria;
create policy "editors can create acceptance criteria"
on public.acceptance_criteria
for insert
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can update acceptance criteria" on public.acceptance_criteria;
create policy "editors can update acceptance criteria"
on public.acceptance_criteria
for update
using (public.can_edit_requirement_artifacts(requirement_id))
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can delete acceptance criteria" on public.acceptance_criteria;
create policy "editors can delete acceptance criteria"
on public.acceptance_criteria
for delete
using (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "members can read test cases" on public.test_cases;
create policy "members can read test cases"
on public.test_cases
for select
using (public.can_read_requirement(requirement_id));

drop policy if exists "editors can create test cases" on public.test_cases;
create policy "editors can create test cases"
on public.test_cases
for insert
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can update test cases" on public.test_cases;
create policy "editors can update test cases"
on public.test_cases
for update
using (public.can_edit_requirement_artifacts(requirement_id))
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can delete test cases" on public.test_cases;
create policy "editors can delete test cases"
on public.test_cases
for delete
using (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "members can read risks" on public.risks;
create policy "members can read risks"
on public.risks
for select
using (public.can_read_requirement(requirement_id));

drop policy if exists "editors can create risks" on public.risks;
create policy "editors can create risks"
on public.risks
for insert
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can update risks" on public.risks;
create policy "editors can update risks"
on public.risks
for update
using (public.can_edit_requirement_artifacts(requirement_id))
with check (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "editors can delete risks" on public.risks;
create policy "editors can delete risks"
on public.risks
for delete
using (public.can_edit_requirement_artifacts(requirement_id));

drop policy if exists "members can read tasks" on public.tasks;
create policy "members can read tasks"
on public.tasks
for select
using (public.can_read_project(project_id));

drop policy if exists "editors can create tasks" on public.tasks;
create policy "editors can create tasks"
on public.tasks
for insert
with check (
  created_by = auth.uid()
  and public.can_edit_project_artifacts(project_id)
);

drop policy if exists "editors can update tasks" on public.tasks;
create policy "editors can update tasks"
on public.tasks
for update
using (public.can_edit_project_artifacts(project_id))
with check (public.can_edit_project_artifacts(project_id));

drop policy if exists "editors can delete tasks" on public.tasks;
create policy "editors can delete tasks"
on public.tasks
for delete
using (public.can_edit_project_artifacts(project_id));

drop policy if exists "members can read comments" on public.comments;
create policy "members can read comments"
on public.comments
for select
using (public.can_read_project(project_id));

drop policy if exists "members can create comments" on public.comments;
create policy "members can create comments"
on public.comments
for insert
with check (
  created_by = auth.uid()
  and public.can_read_project(project_id)
);

drop policy if exists "comment owners and managers can update comments" on public.comments;
create policy "comment owners and managers can update comments"
on public.comments
for update
using (created_by = auth.uid() or public.can_manage_project(project_id))
with check (created_by = auth.uid() or public.can_manage_project(project_id));

drop policy if exists "comment owners and managers can delete comments" on public.comments;
create policy "comment owners and managers can delete comments"
on public.comments
for delete
using (created_by = auth.uid() or public.can_manage_project(project_id));

drop policy if exists "members can read activity logs" on public.activity_logs;
create policy "members can read activity logs"
on public.activity_logs
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members can create activity logs" on public.activity_logs;
create policy "members can create activity logs"
on public.activity_logs
for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "members can read engineering documents" on public.engineering_documents;
create policy "members can read engineering documents"
on public.engineering_documents
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "editors can create engineering documents" on public.engineering_documents;
create policy "editors can create engineering documents"
on public.engineering_documents
for insert
with check (
  created_by = auth.uid()
  and public.can_edit_project_artifacts(project_id)
);

drop policy if exists "editors can update engineering documents" on public.engineering_documents;
create policy "editors can update engineering documents"
on public.engineering_documents
for update
using (public.can_edit_project_artifacts(project_id))
with check (public.can_edit_project_artifacts(project_id));

drop policy if exists "editors can delete engineering documents" on public.engineering_documents;
create policy "editors can delete engineering documents"
on public.engineering_documents
for delete
using (public.can_edit_project_artifacts(project_id));

drop policy if exists "members can read engineering document versions" on public.engineering_document_versions;
create policy "members can read engineering document versions"
on public.engineering_document_versions
for select
using (
  exists (
    select 1
    from public.engineering_documents document
    where document.id = engineering_document_versions.document_id
      and public.is_workspace_member(document.workspace_id)
  )
);

drop policy if exists "editors can create engineering document versions" on public.engineering_document_versions;
create policy "editors can create engineering document versions"
on public.engineering_document_versions
for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.engineering_documents document
    where document.id = engineering_document_versions.document_id
      and public.can_edit_project_artifacts(document.project_id)
  )
);

drop policy if exists "owners and admins can read invitations" on public.invitations;
create policy "owners and admins can read invitations"
on public.invitations
for select
using (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
);

drop policy if exists "owners and admins can create invitations" on public.invitations;
create policy "owners and admins can create invitations"
on public.invitations
for insert
with check (
  invited_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner', 'admin'])
);

drop policy if exists "owners admins and invited users can update invitations" on public.invitations;
create policy "owners admins and invited users can update invitations"
on public.invitations
for update
using (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
)
with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin'])
  or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
);

do $$
begin
  alter publication supabase_realtime add table public.requirements;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.activity_logs;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.acceptance_criteria;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.test_cases;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.risks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.engineering_documents;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.engineering_document_versions;
exception when duplicate_object then null;
end $$;

-- AI company automation persistence
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  command text not null,
  mission text,
  selected_agents jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  type text not null check (type in ('prd', 'wbs', 'uml', 'api', 'qa', 'risk', 'release', 'integrations', 'final')),
  title text not null,
  body text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.agent_runs(id) on delete cascade,
  title text not null,
  body text not null,
  tone text not null default 'info' check (tone in ('success', 'info', 'warning')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_created_at_idx on public.agent_runs(created_at desc);
create index if not exists deliverables_run_type_idx on public.deliverables(run_id, type, sort_order);
create index if not exists notifications_run_created_idx on public.notifications(run_id, created_at desc);
