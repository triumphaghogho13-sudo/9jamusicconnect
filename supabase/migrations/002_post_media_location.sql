-- JamBridge post media and location support. Run once in Supabase SQL Editor.
alter table public.posts add column if not exists location_text text;

-- Posts are public community content, so uploaded post media can be viewed by anyone with the URL.
-- Uploads remain restricted to a user's own folder.
update storage.buckets
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
where id = 'jambridge-media';

-- Existing installs may have the conservative owner-only read policy from the first migration.
-- Add public read access for community post media while retaining owner-only uploads.
drop policy if exists "post media public read" on storage.objects;
create policy "post media public read"
on storage.objects for select to public
using (bucket_id = 'jambridge-media');

-- Authenticated users may create their own posts; other authenticated users can read community posts.
-- These are safe to recreate for projects that already ran the initial migration.
drop policy if exists "posts visible authenticated" on public.posts;
create policy "posts visible authenticated" on public.posts for select to authenticated using (true);
drop policy if exists "posts owner insert" on public.posts;
create policy "posts owner insert" on public.posts for insert to authenticated
with check (author_id = auth.uid() and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_suspended));
