-- AI Prompt Gallery - Phase 5 Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.
-- This file creates the database tables, relationships, indexes, triggers, storage bucket, and RLS policies.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  create type public.profile_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

-- Updated-at helper used by multiple tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- User profiles mirror auth.users in the public schema.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 500),
  website_url text,
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if
    new.role is distinct from old.role
    and not public.is_admin()
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_username text;
  profile_display_name text;
begin
  cleaned_username := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
  profile_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));

  if cleaned_username is null or char_length(cleaned_username) < 3 then
    cleaned_username := 'user';
  end if;

  cleaned_username := left(cleaned_username, 17) || '_' || substr(replace(new.id::text, '-', ''), 1, 12);

  if profile_display_name is null or char_length(profile_display_name) < 2 then
    profile_display_name := 'New user';
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    cleaned_username,
    left(profile_display_name, 80),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 300),
  color text not null default '#ef4056' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null check (char_length(description) between 10 and 500),
  prompt text not null check (char_length(prompt) between 10 and 12000),
  negative_prompt text check (negative_prompt is null or char_length(negative_prompt) <= 6000),
  image_url text not null check (char_length(image_url) > 0),
  image_path text,
  ai_tool text not null check (char_length(ai_tool) between 2 and 80),
  ai_model text not null check (char_length(ai_model) between 1 and 80),
  aspect_ratio text not null check (char_length(aspect_ratio) between 3 and 20),
  is_published boolean not null default false,
  published_at timestamptz,
  views_count integer not null default 0 check (views_count >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  saves_count integer not null default 0 check (saves_count >= 0),
  rating_count integer not null default 0 check (rating_count >= 0),
  average_rating numeric(3,2) not null default 0 check (average_rating >= 0 and average_rating <= 5),
  comments_count integer not null default 0 check (comments_count >= 0),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(prompt, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_tool, '') || ' ' || coalesce(ai_model, '')), 'D')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_publish_date_check check (
    (is_published = false) or (published_at is not null)
  )
);

create or replace function public.set_post_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_published = true and new.published_at is null then
    new.published_at = now();
  end if;

  if new.is_published = false then
    new.published_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_set_published_at on public.posts;
create trigger posts_set_published_at
before insert or update on public.posts
for each row execute function public.set_post_published_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
before update on public.ratings
for each row execute function public.set_updated_at();

create or replace function public.prevent_rating_identity_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if
    (
      new.post_id is distinct from old.post_id
      or new.user_id is distinct from old.user_id
    )
    and not public.is_admin()
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Users can update rating value only.';
  end if;

  return new;
end;
$$;

drop trigger if exists ratings_prevent_identity_change on public.ratings;
create trigger ratings_prevent_identity_change
before update on public.ratings
for each row execute function public.prevent_rating_identity_change();

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prevent_comment_approval_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if
    new.is_approved is distinct from old.is_approved
    and not public.is_admin()
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Only admins can change comment approval.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_comment_identity_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if
    (
      new.post_id is distinct from old.post_id
      or new.user_id is distinct from old.user_id
      or new.parent_id is distinct from old.parent_id
    )
    and not public.is_admin()
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Users can update comment text only.';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists comments_prevent_identity_change on public.comments;
create trigger comments_prevent_identity_change
before update on public.comments
for each row execute function public.prevent_comment_identity_change();

drop trigger if exists comments_prevent_approval_change on public.comments;
create trigger comments_prevent_approval_change
before update on public.comments
for each row execute function public.prevent_comment_approval_change();

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 300),
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

create table if not exists public.collection_posts (
  collection_id uuid not null references public.collections(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, post_id)
);

create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  visitor_id text not null check (char_length(visitor_id) between 8 and 120),
  viewed_at timestamptz not null default now(),
  unique (post_id, visitor_id)
);

-- Count refresh helpers.
create or replace function public.refresh_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set likes_count = (
    select count(*)::integer from public.likes where post_id = target_post_id
  )
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_post_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set saves_count = (
    select count(*)::integer from public.saved_posts where post_id = target_post_id
  )
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_post_rating_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set
    rating_count = (
      select count(*)::integer from public.ratings where post_id = target_post_id
    ),
    average_rating = coalesce((
      select round(avg(rating)::numeric, 2) from public.ratings where post_id = target_post_id
    ), 0)
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set comments_count = (
    select count(*)::integer
    from public.comments
    where post_id = target_post_id
      and is_approved = true
  )
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_post_view_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set views_count = (
    select count(*)::integer from public.views where post_id = target_post_id
  )
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists likes_refresh_post_count on public.likes;
create trigger likes_refresh_post_count
after insert or delete on public.likes
for each row execute function public.refresh_post_like_count();

drop trigger if exists saved_posts_refresh_post_count on public.saved_posts;
create trigger saved_posts_refresh_post_count
after insert or delete on public.saved_posts
for each row execute function public.refresh_post_save_count();

drop trigger if exists ratings_refresh_post_summary on public.ratings;
create trigger ratings_refresh_post_summary
after insert or update or delete on public.ratings
for each row execute function public.refresh_post_rating_summary();

drop trigger if exists comments_refresh_post_count on public.comments;
create trigger comments_refresh_post_count
after insert or update or delete on public.comments
for each row execute function public.refresh_post_comment_count();

drop trigger if exists views_refresh_post_count on public.views;
create trigger views_refresh_post_count
after insert or delete on public.views
for each row execute function public.refresh_post_view_count();

-- Helpful indexes for browsing, filtering, search, and recommendations.
create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_categories_active_sort on public.categories (is_active, sort_order, name);
create index if not exists idx_tags_slug on public.tags (slug);
create index if not exists idx_posts_published_created on public.posts (is_published, created_at desc);
create index if not exists idx_posts_category_published on public.posts (category_id, is_published, created_at desc);
create index if not exists idx_posts_popular on public.posts (is_published, likes_count desc, average_rating desc);
create index if not exists idx_posts_search_vector on public.posts using gin (search_vector);
create index if not exists idx_posts_title_trgm on public.posts using gin (title gin_trgm_ops);
create index if not exists idx_post_tags_tag on public.post_tags (tag_id, post_id);
create index if not exists idx_likes_user on public.likes (user_id, created_at desc);
create index if not exists idx_ratings_post on public.ratings (post_id);
create index if not exists idx_comments_post_created on public.comments (post_id, created_at desc);
create index if not exists idx_saved_posts_user on public.saved_posts (user_id, created_at desc);
create index if not exists idx_collections_user on public.collections (user_id, updated_at desc);
create index if not exists idx_collections_public_user on public.collections (user_id, is_private, updated_at desc);
create index if not exists idx_collection_posts_collection on public.collection_posts (collection_id, added_at desc);
create index if not exists idx_collection_posts_post on public.collection_posts (post_id);
create index if not exists idx_views_post_viewed on public.views (post_id, viewed_at desc);

-- Search and recommendation helpers for Phase 8.
create or replace function public.search_posts(
  p_search_text text default '',
  p_category_slug text default null,
  p_ai_tool text default null,
  p_sort_by text default 'relevance',
  p_limit integer default 40
)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  prompt text,
  negative_prompt text,
  image_url text,
  ai_tool text,
  ai_model text,
  aspect_ratio text,
  views_count integer,
  likes_count integer,
  saves_count integer,
  rating_count integer,
  average_rating numeric,
  comments_count integer,
  published_at timestamptz,
  created_at timestamptz,
  category_name text,
  category_slug text,
  tags text[],
  rank real
)
language sql
stable
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(p_search_text, '')), '') as query_text,
      case
        when nullif(trim(coalesce(p_search_text, '')), '') is null then null
        else websearch_to_tsquery('english', trim(p_search_text))
      end as query,
      nullif(trim(coalesce(p_category_slug, '')), '') as category_filter,
      nullif(trim(coalesce(p_ai_tool, '')), '') as tool_filter,
      coalesce(nullif(trim(coalesce(p_sort_by, '')), ''), 'relevance') as sort_filter,
      greatest(1, least(coalesce(p_limit, 40), 80)) as safe_limit
  ),
  tag_list as (
    select
      post_tags.post_id,
      array_agg(tags.name order by tags.name) as tags,
      string_agg(tags.name, ' ' order by tags.name) as tag_text
    from public.post_tags
    join public.tags on tags.id = post_tags.tag_id
    group by post_tags.post_id
  )
  select
    posts.id,
    posts.title,
    posts.slug,
    posts.description,
    posts.prompt,
    posts.negative_prompt,
    posts.image_url,
    posts.ai_tool,
    posts.ai_model,
    posts.aspect_ratio,
    posts.views_count,
    posts.likes_count,
    posts.saves_count,
    posts.rating_count,
    posts.average_rating,
    posts.comments_count,
    posts.published_at,
    posts.created_at,
    categories.name as category_name,
    categories.slug as category_slug,
    coalesce(tag_list.tags, array[]::text[]) as tags,
    (
      case when params.query is null then 0 else ts_rank(posts.search_vector, params.query) * 4 end
      + case when params.query_text is not null and posts.title ilike '%' || params.query_text || '%' then 2 else 0 end
      + case when params.query_text is not null and posts.description ilike '%' || params.query_text || '%' then 1.5 else 0 end
      + case when params.query_text is not null and posts.prompt ilike '%' || params.query_text || '%' then 1 else 0 end
      + case when params.query_text is not null and categories.name ilike '%' || params.query_text || '%' then 1.5 else 0 end
      + case when params.query_text is not null and coalesce(tag_list.tag_text, '') ilike '%' || params.query_text || '%' then 1.5 else 0 end
      + (posts.average_rating::real * 0.35)
      + (posts.likes_count::real * 0.001)
      + (posts.views_count::real * 0.0002)
      + (posts.saves_count::real * 0.0015)
    )::real as rank
  from public.posts
  join public.categories on categories.id = posts.category_id
  left join tag_list on tag_list.post_id = posts.id
  cross join params
  where posts.is_published = true
    and (params.category_filter is null or categories.slug = params.category_filter)
    and (params.tool_filter is null or lower(posts.ai_tool) = lower(params.tool_filter))
    and (
      params.query_text is null
      or (params.query is not null and posts.search_vector @@ params.query)
      or posts.title ilike '%' || params.query_text || '%'
      or posts.description ilike '%' || params.query_text || '%'
      or posts.prompt ilike '%' || params.query_text || '%'
      or categories.name ilike '%' || params.query_text || '%'
      or coalesce(tag_list.tag_text, '') ilike '%' || params.query_text || '%'
    )
  order by
    case when params.sort_filter = 'newest' then posts.published_at end desc nulls last,
    case when params.sort_filter = 'popular' then (posts.likes_count + posts.views_count) end desc,
    case when params.sort_filter = 'rating' then posts.average_rating end desc,
    case when params.sort_filter = 'trending' then (posts.views_count + posts.likes_count * 3 + posts.saves_count * 2 + posts.average_rating * 100) end desc,
    rank desc,
    posts.published_at desc nulls last,
    posts.created_at desc
  limit (select safe_limit from params);
$$;

create or replace function public.get_recommended_posts(
  p_post_id uuid default null,
  p_category_slug text default null,
  p_tag_names text[] default null,
  p_limit integer default 8
)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  prompt text,
  negative_prompt text,
  image_url text,
  ai_tool text,
  ai_model text,
  aspect_ratio text,
  views_count integer,
  likes_count integer,
  saves_count integer,
  rating_count integer,
  average_rating numeric,
  comments_count integer,
  published_at timestamptz,
  created_at timestamptz,
  category_name text,
  category_slug text,
  tags text[],
  recommendation_score real
)
language sql
stable
set search_path = public
as $$
  with target_context as (
    select
      categories.slug as target_category_slug,
      coalesce(array_agg(tags.name order by tags.name) filter (where tags.id is not null), array[]::text[]) as target_tags
    from public.posts
    join public.categories on categories.id = posts.category_id
    left join public.post_tags on post_tags.post_id = posts.id
    left join public.tags on tags.id = post_tags.tag_id
    where posts.id = p_post_id
    group by categories.slug
  ),
  params as (
    select
      coalesce(nullif(trim(coalesce(p_category_slug, '')), ''), (select target_category_slug from target_context)) as category_filter,
      case
        when cardinality(coalesce(p_tag_names, array[]::text[])) > 0 then p_tag_names
        else coalesce((select target_tags from target_context), array[]::text[])
      end as tag_filter,
      greatest(1, least(coalesce(p_limit, 8), 24)) as safe_limit
  ),
  tag_list as (
    select
      post_tags.post_id,
      array_agg(tags.name order by tags.name) as tags,
      string_agg(tags.name, ' ' order by tags.name) as tag_text
    from public.post_tags
    join public.tags on tags.id = post_tags.tag_id
    group by post_tags.post_id
  ),
  scored_posts as (
    select
      posts.id,
      posts.title,
      posts.slug,
      posts.description,
      posts.prompt,
      posts.negative_prompt,
      posts.image_url,
      posts.ai_tool,
      posts.ai_model,
      posts.aspect_ratio,
      posts.views_count,
      posts.likes_count,
      posts.saves_count,
      posts.rating_count,
      posts.average_rating,
      posts.comments_count,
      posts.published_at,
      posts.created_at,
      categories.name as category_name,
      categories.slug as category_slug,
      coalesce(tag_list.tags, array[]::text[]) as tags,
      (
        case when params.category_filter is not null and categories.slug = params.category_filter then 6 else 0 end
        + (
          select count(*)::real * 3
          from unnest(coalesce(tag_list.tags, array[]::text[])) as post_tag(name)
          join unnest(coalesce(params.tag_filter, array[]::text[])) as wanted_tag(name)
            on lower(post_tag.name) = lower(wanted_tag.name)
        )
        + (posts.average_rating::real * 1.4)
        + (posts.likes_count::real * 0.003)
        + (posts.views_count::real * 0.0005)
        + (posts.saves_count::real * 0.003)
      )::real as recommendation_score
    from public.posts
    join public.categories on categories.id = posts.category_id
    left join tag_list on tag_list.post_id = posts.id
    cross join params
    where posts.is_published = true
      and (p_post_id is null or posts.id <> p_post_id)
  )
  select *
  from scored_posts
  order by recommendation_score desc, published_at desc nulls last, created_at desc
  limit (select safe_limit from params);
$$;

create or replace function public.get_related_searches(
  p_search_text text default '',
  p_category_slug text default null,
  p_limit integer default 10
)
returns table (
  label text,
  kind text,
  query text,
  category_slug text
)
language sql
stable
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(p_search_text, '')), '') as query_text,
      nullif(trim(coalesce(p_category_slug, '')), '') as category_filter,
      greatest(1, least(coalesce(p_limit, 10), 20)) as safe_limit
  ),
  related as (
    select
      categories.name as label,
      'category'::text as kind,
      categories.name as query,
      categories.slug as category_slug,
      (count(posts.id) + 5)::integer as score
    from public.categories
    cross join params
    left join public.posts on posts.category_id = categories.id and posts.is_published = true
    where categories.is_active = true
      and (params.category_filter is null or categories.slug <> params.category_filter)
      and (
        params.query_text is null
        or categories.name ilike '%' || params.query_text || '%'
        or exists (
          select 1
          from public.posts category_posts
          where category_posts.category_id = categories.id
            and category_posts.is_published = true
            and (
              category_posts.title ilike '%' || params.query_text || '%'
              or category_posts.description ilike '%' || params.query_text || '%'
              or category_posts.prompt ilike '%' || params.query_text || '%'
            )
        )
      )
    group by categories.name, categories.slug

    union all

    select
      tags.name as label,
      'tag'::text as kind,
      tags.name as query,
      null::text as category_slug,
      count(posts.id)::integer as score
    from public.tags
    cross join params
    join public.post_tags on post_tags.tag_id = tags.id
    join public.posts on posts.id = post_tags.post_id and posts.is_published = true
    join public.categories on categories.id = posts.category_id
    where params.category_filter is null or categories.slug = params.category_filter
    group by tags.name, params.query_text
    having params.query_text is null or tags.name ilike '%' || params.query_text || '%' or count(posts.id) > 0
  )
  select label, kind, query, category_slug
  from related
  order by score desc, label asc
  limit (select safe_limit from params);
$$;

-- Seed starter categories and tags.
insert into public.categories (name, slug, description, color, sort_order)
values
  ('Portrait', 'portrait', 'Character, editorial, and human-focused prompts.', '#ef4056', 10),
  ('Product', 'product', 'Product renders, campaign scenes, and commercial visuals.', '#0f9f9a', 20),
  ('Fantasy', 'fantasy', 'Worldbuilding, creatures, magic, and fantasy art.', '#8b5cf6', 30),
  ('Architecture', 'architecture', 'Buildings, interiors, spaces, and environments.', '#2563eb', 40),
  ('Anime', 'anime', 'Anime, manga, and stylized character prompts.', '#f59e0b', 50),
  ('UI Design', 'ui-design', 'Interface mockups, app screens, and product visuals.', '#10b981', 60),
  ('Sci-Fi', 'sci-fi', 'Futuristic, space, cyberpunk, and speculative prompts.', '#6366f1', 70),
  ('Fashion', 'fashion', 'Editorial clothing, styling, and fashion campaign prompts.', '#ec4899', 80),
  ('Landscape', 'landscape', 'Natural scenes, environments, and cinematic locations.', '#22c55e', 90)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

insert into public.tags (name, slug)
values
  ('neon', 'neon'),
  ('portrait', 'portrait'),
  ('cinematic', 'cinematic'),
  ('product', 'product'),
  ('studio', 'studio'),
  ('glass', 'glass'),
  ('fantasy', 'fantasy'),
  ('architecture', 'architecture'),
  ('garden', 'garden'),
  ('anime', 'anime'),
  ('market', 'market'),
  ('night', 'night'),
  ('ui', 'ui'),
  ('landing', 'landing'),
  ('saas', 'saas'),
  ('space', 'space'),
  ('poster', 'poster'),
  ('fashion', 'fashion'),
  ('editorial', 'editorial'),
  ('landscape', 'landscape')
on conflict (slug) do nothing;

-- Storage bucket for uploaded post images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Enable RLS on all public tables.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.likes enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;
alter table public.collections enable row level security;
alter table public.collection_posts enable row level security;
alter table public.views enable row level security;

-- API grants. RLS policies below still decide which rows are allowed.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.categories, public.tags, public.posts, public.post_tags, public.comments, public.collections, public.collection_posts to anon;
grant insert on public.views to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.search_posts(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.get_recommended_posts(uuid, text, text[], integer) to anon, authenticated;
grant execute on function public.get_related_searches(text, text, integer) to anon, authenticated;

-- Profiles policies.
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public can view profiles" on public.profiles;
create policy "Public can view profiles"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Users can create own profile if missing" on public.profiles;
create policy "Users can create own profile if missing"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id and role = 'user');

drop policy if exists "Users can update own profile and admins can update all profiles" on public.profiles;
create policy "Users can update own profile and admins can update all profiles"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check ((select auth.uid()) = id or public.is_admin());

-- Categories policies.
drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories"
on public.categories for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Tags policies.
drop policy if exists "Public can view tags" on public.tags;
create policy "Public can view tags"
on public.tags for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage tags" on public.tags;
create policy "Admins can manage tags"
on public.tags for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Posts policies.
drop policy if exists "Public can view published posts" on public.posts;
create policy "Public can view published posts"
on public.posts for select
to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "Admins can create posts" on public.posts;
create policy "Admins can create posts"
on public.posts for insert
to authenticated
with check (public.is_admin() and author_id = (select auth.uid()));

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
on public.posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
on public.posts for delete
to authenticated
using (public.is_admin());

-- Post tags policies.
drop policy if exists "Public can view tags on published posts" on public.post_tags;
create policy "Public can view tags on published posts"
on public.post_tags for select
to anon, authenticated
using (
  exists (
    select 1
    from public.posts
    where posts.id = post_tags.post_id
      and (posts.is_published = true or public.is_admin())
  )
);

drop policy if exists "Admins can manage post tags" on public.post_tags;
create policy "Admins can manage post tags"
on public.post_tags for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Likes policies.
drop policy if exists "Anyone can view likes on published posts" on public.likes;
create policy "Anyone can view likes on published posts"
on public.likes for select
to anon, authenticated
using (
  exists (
    select 1 from public.posts
    where posts.id = likes.post_id
      and posts.is_published = true
  )
  or public.is_admin()
);

drop policy if exists "Authenticated users can like published posts" on public.likes;
create policy "Authenticated users can like published posts"
on public.likes for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.posts
    where posts.id = likes.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Users can remove own likes and admins can remove any like" on public.likes;
create policy "Users can remove own likes and admins can remove any like"
on public.likes for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- Ratings policies.
drop policy if exists "Anyone can view ratings on published posts" on public.ratings;
create policy "Anyone can view ratings on published posts"
on public.ratings for select
to anon, authenticated
using (
  exists (
    select 1 from public.posts
    where posts.id = ratings.post_id
      and posts.is_published = true
  )
  or public.is_admin()
);

drop policy if exists "Authenticated users can rate published posts" on public.ratings;
create policy "Authenticated users can rate published posts"
on public.ratings for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.posts
    where posts.id = ratings.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Users can update own ratings and admins can update any rating" on public.ratings;
create policy "Users can update own ratings and admins can update any rating"
on public.ratings for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can delete own ratings and admins can delete any rating" on public.ratings;
create policy "Users can delete own ratings and admins can delete any rating"
on public.ratings for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- Comments policies.
drop policy if exists "Public can view approved comments on published posts" on public.comments;
create policy "Public can view approved comments on published posts"
on public.comments for select
to anon, authenticated
using (
  (
    is_approved = true
    and exists (
      select 1 from public.posts
      where posts.id = comments.post_id
        and posts.is_published = true
    )
  )
  or user_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "Authenticated users can comment on published posts" on public.comments;
create policy "Authenticated users can comment on published posts"
on public.comments for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and is_approved = true
  and exists (
    select 1 from public.posts
    where posts.id = comments.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Users can update own comments and admins can update any comment" on public.comments;
create policy "Users can update own comments and admins can update any comment"
on public.comments for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can delete own comments and admins can delete any comment" on public.comments;
create policy "Users can delete own comments and admins can delete any comment"
on public.comments for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- Saved posts policies.
drop policy if exists "Users can view own saved posts and admins can view all saved posts" on public.saved_posts;
create policy "Users can view own saved posts and admins can view all saved posts"
on public.saved_posts for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can save published posts" on public.saved_posts;
create policy "Users can save published posts"
on public.saved_posts for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.posts
    where posts.id = saved_posts.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Users can remove own saved posts and admins can remove any saved post" on public.saved_posts;
create policy "Users can remove own saved posts and admins can remove any saved post"
on public.saved_posts for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- Collections policies.
drop policy if exists "Public can view public collections" on public.collections;
create policy "Public can view public collections"
on public.collections for select
to anon, authenticated
using (is_private = false or user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can create own collections" on public.collections;
create policy "Users can create own collections"
on public.collections for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own collections and admins can update any collection" on public.collections;
create policy "Users can update own collections and admins can update any collection"
on public.collections for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can delete own collections and admins can delete any collection" on public.collections;
create policy "Users can delete own collections and admins can delete any collection"
on public.collections for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- Collection posts policies.
drop policy if exists "Public can view posts in visible collections" on public.collection_posts;
create policy "Public can view posts in visible collections"
on public.collection_posts for select
to anon, authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_posts.collection_id
      and (
        collections.is_private = false
        or collections.user_id = (select auth.uid())
        or public.is_admin()
      )
  )
  and exists (
    select 1
    from public.posts
    where posts.id = collection_posts.post_id
      and (posts.is_published = true or public.is_admin())
  )
);

drop policy if exists "Users can add posts to own collections" on public.collection_posts;
create policy "Users can add posts to own collections"
on public.collection_posts for insert
to authenticated
with check (
  exists (
    select 1
    from public.collections
    where collections.id = collection_posts.collection_id
      and (collections.user_id = (select auth.uid()) or public.is_admin())
  )
  and exists (
    select 1
    from public.posts
    where posts.id = collection_posts.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Users can remove posts from own collections" on public.collection_posts;
create policy "Users can remove posts from own collections"
on public.collection_posts for delete
to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_posts.collection_id
      and (collections.user_id = (select auth.uid()) or public.is_admin())
  )
);

-- Views policies.
drop policy if exists "Anyone can record a view for published posts" on public.views;
create policy "Anyone can record a view for published posts"
on public.views for insert
to anon, authenticated
with check (
  (user_id is null or user_id = (select auth.uid()))
  and exists (
    select 1 from public.posts
    where posts.id = views.post_id
      and posts.is_published = true
  )
);

drop policy if exists "Admins can view view records" on public.views;
create policy "Admins can view view records"
on public.views for select
to authenticated
using (public.is_admin());

-- Storage object policies for the public post-images bucket.
drop policy if exists "Public can read post images" on storage.objects;
create policy "Public can read post images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'post-images');

drop policy if exists "Admins can upload post images" on storage.objects;
create policy "Admins can upload post images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post-images' and public.is_admin());

drop policy if exists "Admins can update post images" on storage.objects;
create policy "Admins can update post images"
on storage.objects for update
to authenticated
using (bucket_id = 'post-images' and public.is_admin())
with check (bucket_id = 'post-images' and public.is_admin());

drop policy if exists "Admins can delete post images" on storage.objects;
create policy "Admins can delete post images"
on storage.objects for delete
to authenticated
using (bucket_id = 'post-images' and public.is_admin());
