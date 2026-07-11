# Phase 9 - User Profiles And Collections

## Goal

Add user-owned libraries so signed-in users can manage their profile, see their saved and liked posts, create custom collections, add or remove posts from collections, and choose whether each collection is public or private.

This phase adds:

- editable account profile
- public profile page
- saved posts list
- liked posts list
- custom collection creation
- public/private collection setting
- add saved or liked posts to a collection
- remove posts from a collection
- collection deletion
- public collection detail page
- private collection detail page for the owner

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
|   |   |-- profiles.css
|   |   |-- search.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   `-- js/
|       |-- account.js
|       |-- app.js
|       |-- auth-page.js
|       |-- auth-state.js
|       |-- collection.js
|       |-- demo-data.js
|       |-- home.js
|       |-- post.js
|       |-- profile.js
|       |-- search.js
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
|   |-- phase-07-likes-ratings-comments-saves.md
|   |-- phase-08-search-recommendations.md
|   `-- phase-09-user-profiles-collections.md
|-- tools/
|   `-- local-server.js
|-- account.html
|-- auth.html
|-- collection.html
|-- index.html
|-- post.html
|-- profile.html
|-- README.md
|-- search.html
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/account.html
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/css/profiles.css
ai-prompt-gallery/assets/js/account.js
ai-prompt-gallery/assets/js/collection.js
ai-prompt-gallery/assets/js/profile.js
ai-prompt-gallery/collection.html
ai-prompt-gallery/database/README.md
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/docs/phase-09-user-profiles-collections.md
ai-prompt-gallery/profile.html
ai-prompt-gallery/README.md
```

## What Was Built

`account.html` is now the signed-in user's library hub.

Users can:

- edit username, display name, bio, and website URL
- open their public profile page
- create public or private collections
- see saved posts
- see liked posts
- add saved or liked posts to any collection
- remove posts from collections
- make collections public or private
- delete collections

`profile.html` shows a user's visible collections. Public visitors only see public collections. The signed-in owner can also see their own private collections because Supabase Row Level Security allows it.

`collection.html` shows posts inside one collection. Public visitors can open public collections. Private collections are only visible to the owner or admin.

## Supabase SQL Update

If this is a fresh database, run the full latest file:

```text
database/schema.sql
```

If your database already exists from Phase 8, run this Phase 9 update in Supabase SQL Editor:

```sql
create index if not exists idx_collections_public_user
on public.collections (user_id, is_private, updated_at desc);

create index if not exists idx_collection_posts_collection
on public.collection_posts (collection_id, added_at desc);

grant select (id, username, display_name, avatar_url, bio, website_url, created_at, updated_at)
on public.profiles to anon, authenticated;

grant select
on public.categories, public.tags, public.posts, public.post_tags,
   public.comments, public.collections, public.collection_posts
to anon;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public can view profiles" on public.profiles;
create policy "Public can view profiles"
on public.profiles for select
to anon, authenticated
using (true);

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

Open the account page:

```text
http://localhost:5500/account.html
```

## How To Test This Phase

1. Run the Phase 9 SQL update or the full latest `database/schema.sql`.
2. Add your Supabase URL and anon key in:

```text
assets/js/supabase-client.js
```

3. Sign in at:

```text
http://localhost:5500/auth.html
```

4. Open:

```text
http://localhost:5500/account.html
```

5. Update your username, display name, bio, and website.
6. Open a real Supabase post and click `Save` and `Like`.
7. Return to `account.html` and confirm saved and liked posts appear.
8. Create a private collection.
9. Add a saved or liked post to the collection.
10. Open the collection link and confirm the posts appear.
11. Make the collection public.
12. Open your public profile link and confirm the collection appears.
13. Make the collection private again and confirm it no longer appears for signed-out visitors.

## Common Errors And Fixes

`Supabase is not configured yet`

Add your Project URL and anon public key in `assets/js/supabase-client.js`.

`That profile is unavailable`

Run the Phase 9 profile policy update so public profile pages can read profile rows.

`The collection may be private`

This is expected when signed-out visitors open a private collection. Sign in as the collection owner to view it.

`duplicate key value violates unique constraint`

The collection already has that post, or you already have a collection with the same slug. Use a different collection name or add a different post.

`new row violates row-level security policy`

Make sure you are signed in, the collection belongs to you, and the post is published.

## Next Phase

Phase 10 will build the admin dashboard:

- upload images
- create and edit posts
- publish and unpublish posts
- manage categories
- manage comments
- manage users
- view basic statistics
