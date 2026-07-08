# Phase 7 - Likes, Ratings, Comments, And Saves

## Goal

Connect the post details page to Supabase for real user interactions.

This phase adds:

- real likes for Supabase posts
- real saved posts for logged-in users
- one rating per user per post
- rating updates without duplicate rows
- real comments
- editing and deleting your own comments
- admin-safe comment management rules
- view tracking for Supabase posts
- count refreshes after each action

The demo homepage still uses temporary demo cards. Real browsing/search from Supabase arrives in later phases.

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- assets/
|   |-- css/
|   |   |-- auth.css
|   |   |-- base.css
|   |   |-- components.css
|   |   |-- home.css
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- post.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   `-- js/
|       |-- account.js
|       |-- app.js
|       |-- auth-page.js
|       |-- auth-state.js
|       |-- demo-data.js
|       |-- home.js
|       |-- post.js
|       |-- supabase-client.js
|       `-- theme.js
|-- database/
|   |-- README.md
|   |-- make-admin.sql
|   `-- schema.sql
|-- docs/
|   |-- phase-01-project-setup.md
|   |-- phase-02-folder-structure-design-system.md
|   |-- phase-03-homepage-masonry-feed.md
|   |-- phase-04-post-details-page.md
|   |-- phase-05-supabase-setup.md
|   |-- phase-06-authentication.md
|   `-- phase-07-likes-ratings-comments-saves.md
|-- tools/
|   `-- local-server.js
|-- account.html
|-- auth.html
|-- index.html
|-- post.html
|-- README.md
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/assets/css/post.css
ai-prompt-gallery/assets/js/post.js
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/docs/phase-07-likes-ratings-comments-saves.md
ai-prompt-gallery/post.html
ai-prompt-gallery/README.md
```

## How Duplicate Prevention Works

The database prevents duplicates with unique rules:

```sql
unique (post_id, user_id)
```

This exists on:

```text
likes
ratings
saved_posts
views
```

For ratings, the frontend uses an upsert. That means the first rating creates a row, and later ratings update the same row.

## Supabase SQL Update

If you run the full latest `database/schema.sql`, this is already included.

If your database was created before Phase 7, run this SQL in Supabase SQL Editor:

```sql
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

drop trigger if exists comments_prevent_identity_change on public.comments;
create trigger comments_prevent_identity_change
before update on public.comments
for each row execute function public.prevent_comment_identity_change();
```

## Optional Test Post SQL

The admin upload dashboard is not built yet, so use this temporary SQL if your `posts` table is empty.

First, sign up once in the website so you have a profile. Then run this in Supabase SQL Editor:

```sql
insert into public.posts (
  author_id,
  category_id,
  title,
  slug,
  description,
  prompt,
  negative_prompt,
  image_url,
  ai_tool,
  ai_model,
  aspect_ratio,
  is_published
)
select
  p.id,
  c.id,
  'Phase 7 Test Portrait',
  'phase-7-test-portrait',
  'A temporary published post for testing likes, ratings, comments, saves, and views.',
  'Editorial portrait in soft window light, calm expression, refined styling, natural skin texture, realistic detail, premium photography.',
  'blurry, watermark, distorted face, extra fingers',
  'https://picsum.photos/seed/phase-7-test-portrait/900/1125',
  'Midjourney',
  'v6',
  '4 / 5',
  true
from public.profiles p
cross join public.categories c
where c.slug = 'portrait'
order by p.created_at asc
limit 1
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  prompt = excluded.prompt,
  negative_prompt = excluded.negative_prompt,
  image_url = excluded.image_url,
  ai_tool = excluded.ai_tool,
  ai_model = excluded.ai_model,
  aspect_ratio = excluded.aspect_ratio,
  is_published = true
returning id;
```

Copy the returned `id`.

Then open:

```text
http://localhost:5500/post.html?id=PASTE_RETURNED_ID_HERE
```

## Windows 11 Commands

Open the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Start the local server:

```powershell
node tools/local-server.js
```

Open:

```text
http://localhost:5500/post.html?id=YOUR_SUPABASE_POST_UUID
```

## How To Test This Phase

1. Run the Phase 7 SQL update above if your database is older than this phase.
2. Make sure `assets/js/supabase-client.js` has your Project URL and anon key.
3. Start the local server.
4. Sign in at:

```text
http://localhost:5500/auth.html
```

5. Open a Supabase post using its UUID.
6. Click `Like`.
7. Click `Like` again and confirm it removes the like instead of creating another row.
8. Click `Save`.
9. Click `Save` again and confirm it removes the save.
10. Choose a star rating.
11. Choose a different star rating and confirm your rating updates instead of duplicating.
12. Add a comment.
13. Edit your comment.
14. Delete your comment.
15. Refresh the page and confirm the counts still match Supabase.

## Quick SQL Checks

Replace the IDs before running these.

Check duplicate likes:

```sql
select post_id, user_id, count(*)
from public.likes
group by post_id, user_id
having count(*) > 1;
```

Check duplicate ratings:

```sql
select post_id, user_id, count(*)
from public.ratings
group by post_id, user_id
having count(*) > 1;
```

Check your rating:

```sql
select rating, updated_at
from public.ratings
where post_id = 'YOUR_POST_ID'
order by updated_at desc;
```

Check post counters:

```sql
select likes_count, saves_count, rating_count, average_rating, comments_count, views_count
from public.posts
where id = 'YOUR_POST_ID';
```

## Common Errors And Fixes

`Supabase is not configured yet`

Replace the placeholders in `assets/js/supabase-client.js`.

`Post not found`

You opened a numeric demo ID or a UUID that does not exist in Supabase. Real interactions require a published Supabase post UUID.

`new row violates row-level security policy`

Make sure you are signed in and the post has `is_published = true`.

`duplicate key value violates unique constraint`

The database is correctly blocking duplicates. The frontend normally handles this quietly, but this can appear if you manually insert duplicate rows from SQL.

`Users can update rating value only`

The Phase 7 trigger is protecting rating ownership. Update only the `rating` value.

`Users can update comment text only`

The Phase 7 trigger is protecting comment ownership. Update only the `body` value.

## Next Phase

Phase 8 will connect search and recommendations to Supabase:

- search titles
- search descriptions
- search prompts
- search tags
- category matching
- popular related results
- highly rated related posts
