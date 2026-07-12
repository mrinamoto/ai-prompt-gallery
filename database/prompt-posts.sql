-- AI Prompt Gallery - Admin CMS prompt_posts migration
-- Run this after database/schema.sql in Supabase Dashboard > SQL Editor.
-- It adds the simpler admin-managed prompt_posts table and prompt-images Storage bucket.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.prompt_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 160),
  prompt text not null check (char_length(trim(prompt)) between 2 and 12000),
  negative_prompt text check (negative_prompt is null or char_length(negative_prompt) <= 6000),
  image_url text not null check (image_url ~ '^https?://'),
  image_path text,
  ai_tool text check (ai_tool is null or char_length(ai_tool) <= 80),
  model text check (model is null or char_length(model) <= 120),
  category text check (category is null or char_length(category) <= 80),
  tags text[] not null default '{}',
  aspect_ratio text check (aspect_ratio is null or char_length(aspect_ratio) <= 32),
  style text check (style is null or char_length(style) <= 80),
  status text not null default 'published' check (status in ('published', 'draft')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompt_posts
  add column if not exists ai_tool text check (ai_tool is null or char_length(ai_tool) <= 80);

create index if not exists idx_prompt_posts_status_created
on public.prompt_posts (status, created_at desc);

create index if not exists idx_prompt_posts_created_by
on public.prompt_posts (created_by, updated_at desc);

create index if not exists idx_prompt_posts_category
on public.prompt_posts (lower(category));

create index if not exists idx_prompt_posts_tags
on public.prompt_posts using gin (tags);

create index if not exists idx_prompt_posts_title_trgm
on public.prompt_posts using gin (title gin_trgm_ops);

create index if not exists idx_prompt_posts_prompt_trgm
on public.prompt_posts using gin (prompt gin_trgm_ops);

drop trigger if exists set_prompt_posts_updated_at on public.prompt_posts;
create trigger set_prompt_posts_updated_at
before update on public.prompt_posts
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-images',
  'prompt-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.prompt_posts enable row level security;

revoke all on public.prompt_posts from anon, authenticated;
grant select on public.prompt_posts to anon, authenticated;
grant insert, update, delete on public.prompt_posts to authenticated;

drop policy if exists "Public can view published prompt posts" on public.prompt_posts;
create policy "Public can view published prompt posts"
on public.prompt_posts for select
to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "Admins can create prompt posts" on public.prompt_posts;
create policy "Admins can create prompt posts"
on public.prompt_posts for insert
to authenticated
with check (
  public.is_admin()
  and created_by = (select auth.uid())
  and status in ('published', 'draft')
);

drop policy if exists "Admins can update prompt posts" on public.prompt_posts;
create policy "Admins can update prompt posts"
on public.prompt_posts for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('published', 'draft')
);

drop policy if exists "Admins can delete prompt posts" on public.prompt_posts;
create policy "Admins can delete prompt posts"
on public.prompt_posts for delete
to authenticated
using (public.is_admin());

drop policy if exists "Public can read prompt images" on storage.objects;
create policy "Public can read prompt images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'prompt-images');

drop policy if exists "Admins can upload prompt images" on storage.objects;
create policy "Admins can upload prompt images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'prompt-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Admins can update prompt images" on storage.objects;
create policy "Admins can update prompt images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'prompt-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'prompt-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Admins can delete prompt images" on storage.objects;
create policy "Admins can delete prompt images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'prompt-images'
  and public.is_admin()
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
