-- JamBridge post detail comments and community creation.
-- Safe to run on existing projects; does not delete existing content.
alter table public.posts add column if not exists location_text text;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  description text not null check (char_length(description) between 10 and 500),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "groups visible to authenticated" on public.groups;
create policy "groups visible to authenticated" on public.groups for select to authenticated using (true);
drop policy if exists "signed in users create groups" on public.groups;
create policy "signed in users create groups" on public.groups for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "group owners update groups" on public.groups;
create policy "group owners update groups" on public.groups for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
drop policy if exists "members visible to members" on public.group_members;
create policy "members visible to members" on public.group_members for select to authenticated using (true);
drop policy if exists "users join groups" on public.group_members;
create policy "users join groups" on public.group_members for insert to authenticated with check (user_id = auth.uid() and (role = 'member' or exists(select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())));
drop policy if exists "users leave groups or owners manage" on public.group_members;
create policy "users leave groups or owners manage" on public.group_members for delete to authenticated using (user_id = auth.uid() or exists(select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()) or public.is_admin());

-- Allow signed-in users to read and add comments to community posts.
drop policy if exists "comments visible authenticated" on public.comments;
create policy "comments visible authenticated" on public.comments for select to authenticated using (true);
drop policy if exists "comments owner insert" on public.comments;
create policy "comments owner insert" on public.comments for insert to authenticated with check (author_id = auth.uid() and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_suspended));
