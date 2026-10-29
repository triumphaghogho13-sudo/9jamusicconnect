-- JamBridge initial schema for Supabase PostgreSQL.
-- Run this file in Supabase SQL Editor. Review policies before production launch.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  city text,
  state text,
  country text not null default 'Nigeria',
  musician_type text,
  instruments text[] not null default '{}',
  genres text[] not null default '{}',
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','moderator','user')),
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  media_url text,
  media_type text check (media_type in ('image','audio','video') or media_type is null),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 1 and 5000),
  event_type text,
  instrument text,
  city text,
  state text,
  event_date date,
  start_time time,
  end_time time,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  status text not null default 'open' check (status in ('draft','open','paused','filled','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_max >= 0),
  check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

create table if not exists public.gig_applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  musician_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  proposed_fee numeric(12,2) check (proposed_fee is null or proposed_fee >= 0),
  status text not null default 'pending' check (status in ('pending','shortlisted','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(gig_id, musician_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references public.gigs(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete restrict,
  musician_id uuid not null references public.profiles(id) on delete restrict,
  application_id uuid references public.gig_applications(id) on delete set null,
  agreed_fee numeric(12,2) check (agreed_fee is null or agreed_fee >= 0),
  status text not null default 'confirmed' check (status in ('pending','confirmed','in_progress','completed','cancelled','disputed')),
  event_date date,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id <> musician_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('profile','post','comment','gig','message','other')),
  target_id uuid,
  reason text not null check (char_length(reason) between 3 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  moderator_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  unique(booking_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);
create index if not exists gigs_status_date_idx on public.gigs(status, event_date);
create index if not exists applications_gig_status_idx on public.gig_applications(gig_id, status);
create index if not exists bookings_client_created_idx on public.bookings(client_id, created_at desc);
create index if not exists bookings_musician_created_idx on public.bookings(musician_id, created_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Enable RLS on every table.
do $$ declare t text; begin
  foreach t in array array['profiles','user_roles','posts','comments','likes','follows','gigs','gig_applications','bookings','conversations','conversation_members','messages','notifications','reports','reviews','admin_audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Profiles: visible to signed-in users; users may edit only their own profile.
create policy "profiles authenticated read" on public.profiles for select to authenticated using (true);
create policy "profiles owner update" on public.profiles for update to authenticated using (id = auth.uid() and not is_suspended) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles admin all" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Role records are private; a user can see their own role but cannot grant roles.
create policy "roles own or admin read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "roles admin manage" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "posts visible authenticated" on public.posts for select to authenticated using (true);
create policy "posts owner insert" on public.posts for insert to authenticated with check (author_id = auth.uid() and not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_suspended));
create policy "posts owner update" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts owner or admin delete" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "posts admin manage" on public.posts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "comments authenticated read" on public.comments for select to authenticated using (true);
create policy "comments owner insert" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments owner or admin delete" on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "likes authenticated read" on public.likes for select to authenticated using (true);
create policy "likes owner insert" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes owner delete" on public.likes for delete to authenticated using (user_id = auth.uid());
create policy "follows authenticated read" on public.follows for select to authenticated using (true);
create policy "follows owner manage" on public.follows for all to authenticated using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy "gigs authenticated read" on public.gigs for select to authenticated using (status = 'open' or client_id = auth.uid() or public.is_admin());
create policy "gigs owner insert" on public.gigs for insert to authenticated with check (client_id = auth.uid());
create policy "gigs owner update" on public.gigs for update to authenticated using (client_id = auth.uid() or public.is_admin()) with check (client_id = auth.uid() or public.is_admin());
create policy "gigs owner or admin delete" on public.gigs for delete to authenticated using (client_id = auth.uid() or public.is_admin());

create policy "applications applicant or gig owner read" on public.gig_applications for select to authenticated using (musician_id = auth.uid() or exists(select 1 from public.gigs g where g.id=gig_id and g.client_id=auth.uid()) or public.is_admin());
create policy "applications musician insert" on public.gig_applications for insert to authenticated with check (musician_id = auth.uid());
create policy "applications applicant update" on public.gig_applications for update to authenticated using (musician_id = auth.uid() or exists(select 1 from public.gigs g where g.id=gig_id and g.client_id=auth.uid()) or public.is_admin()) with check (musician_id = auth.uid() or exists(select 1 from public.gigs g where g.id=gig_id and g.client_id=auth.uid()) or public.is_admin());

create policy "bookings participant or admin read" on public.bookings for select to authenticated using (client_id = auth.uid() or musician_id = auth.uid() or public.is_admin());
create policy "bookings client create" on public.bookings for insert to authenticated with check (client_id = auth.uid());
create policy "bookings participant update" on public.bookings for update to authenticated using (client_id = auth.uid() or musician_id = auth.uid() or public.is_admin()) with check (client_id = auth.uid() or musician_id = auth.uid() or public.is_admin());

create policy "conversation members read own" on public.conversation_members for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "conversation creator adds self" on public.conversation_members for insert to authenticated with check (user_id = auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy "conversations member read" on public.conversations for select to authenticated using (exists(select 1 from public.conversation_members m where m.conversation_id=id and m.user_id=auth.uid()) or public.is_admin());
create policy "conversations member create" on public.conversations for insert to authenticated with check (created_by = auth.uid());
create policy "messages member read" on public.messages for select to authenticated using (exists(select 1 from public.conversation_members m where m.conversation_id=messages.conversation_id and m.user_id=auth.uid()) or public.is_admin());
create policy "messages member send" on public.messages for insert to authenticated with check (sender_id=auth.uid() and exists(select 1 from public.conversation_members m where m.conversation_id=messages.conversation_id and m.user_id=auth.uid()));
create policy "notifications owner read" on public.notifications for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "notifications owner update" on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "reports reporter insert" on public.reports for insert to authenticated with check (reporter_id=auth.uid());
create policy "reports reporter or admin read" on public.reports for select to authenticated using (reporter_id=auth.uid() or public.is_admin());
create policy "reports admin update" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reviews authenticated read" on public.reviews for select to authenticated using (true);
create policy "reviews booking participant insert" on public.reviews for insert to authenticated with check (reviewer_id=auth.uid() and exists(select 1 from public.bookings b where b.id=booking_id and b.status='completed' and (b.client_id=auth.uid() or b.musician_id=auth.uid())));
create policy "reviews reviewer update delete" on public.reviews for all to authenticated using (reviewer_id=auth.uid() or public.is_admin()) with check (reviewer_id=auth.uid() or public.is_admin());
create policy "audit admin read" on public.admin_audit_logs for select to authenticated using (public.is_admin());
create policy "audit admin insert" on public.admin_audit_logs for insert to authenticated with check (public.is_admin() and admin_id=auth.uid());

-- Private storage buckets for user media. Upload/download policies are intentionally
-- conservative; extend them for your final media UX before enabling public uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jambridge-avatars','jambridge-avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jambridge-media','jambridge-media',false,52428800,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav','video/mp4','video/webm'])
on conflict (id) do nothing;
create policy "avatar owner upload" on storage.objects for insert to authenticated with check (bucket_id='jambridge-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatar owner update" on storage.objects for update to authenticated using (bucket_id='jambridge-avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='jambridge-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatar public view" on storage.objects for select to public using (bucket_id='jambridge-avatars');
create policy "media owner upload" on storage.objects for insert to authenticated with check (bucket_id='jambridge-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "media owner view" on storage.objects for select to authenticated using (bucket_id='jambridge-media' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
