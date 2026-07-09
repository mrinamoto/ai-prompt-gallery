# Phase 8 - Search And Recommendations

## Goal

Add a real discovery page for search, filters, and recommendations.

This phase adds:

- dedicated `search.html`
- search by title, description, prompt text, category, and tags
- category filter
- AI tool filter
- relevance, trending, popular, rating, and newest sort modes
- search suggestions
- related searches
- similar prompts
- trending content
- "You May Also Like" recommendations
- Supabase RPC functions for ranked database search
- demo fallback when Supabase is not configured yet

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
|   |   |-- search.css
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
|   `-- phase-08-search-recommendations.md
|-- tools/
|   `-- local-server.js
|-- account.html
|-- auth.html
|-- index.html
|-- post.html
|-- search.html
|-- README.md
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/account.html
ai-prompt-gallery/auth.html
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/css/search.css
ai-prompt-gallery/assets/js/home.js
ai-prompt-gallery/assets/js/post.js
ai-prompt-gallery/assets/js/search.js
ai-prompt-gallery/database/README.md
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/docs/phase-08-search-recommendations.md
ai-prompt-gallery/index.html
ai-prompt-gallery/post.html
ai-prompt-gallery/README.md
ai-prompt-gallery/search.html
```

## What The New SQL Does

`database/schema.sql` now includes three Phase 8 helper functions:

```text
search_posts
get_recommended_posts
get_related_searches
```

`search_posts` searches:

```text
title
description
prompt
category
tags
AI tool
AI model
```

It uses the existing `posts.search_vector` generated column plus category and tag matching.

`get_recommended_posts` scores posts by:

```text
same category
shared tags
likes
saves
views
average rating
publish date
```

`get_related_searches` returns category and tag ideas related to the current search.

## Supabase SQL Update

If this is a fresh database, run the full latest file:

```text
database/schema.sql
```

If your database already exists, open:

```text
database/schema.sql
```

Copy the block that starts with:

```sql
-- Search and recommendation helpers for Phase 8.
```

and also copy these grant lines from the API grants section:

```sql
grant execute on function public.search_posts(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.get_recommended_posts(uuid, text, text[], integer) to anon, authenticated;
grant execute on function public.get_related_searches(text, text, integer) to anon, authenticated;
```

Paste that SQL into Supabase SQL Editor and click `Run`.

## Windows 11 Commands

Open the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Start the local server:

```powershell
node tools/local-server.js
```

Open search:

```text
http://localhost:5500/search.html?q=portrait
```

## How To Test Demo Search

1. Leave `assets/js/supabase-client.js` with placeholder keys.
2. Start the local server.
3. Open:

```text
http://localhost:5500/search.html?q=portrait
```

4. Try these searches:

```text
cinematic
product
architecture
fantasy
neon
```

5. Change category, AI tool, and sort filters.
6. Click a related search.
7. Confirm the similar prompts and recommendation rows update.

## How To Test Supabase Search

1. Run the Phase 8 SQL update.
2. Add your Supabase URL and anon key to:

```text
assets/js/supabase-client.js
```

3. Make sure at least one post has `is_published = true`.
4. Start the local server.
5. Open:

```text
http://localhost:5500/search.html
```

6. Search by title, description, prompt words, category name, and tag names.
7. Change filters and sort modes.
8. Open a result and confirm the post details page loads.

## Common Errors And Fixes

`Demo fallback is active`

Supabase may not be configured, or the Phase 8 SQL helper functions have not been run yet.

`Could not find the function public.search_posts`

Run the Phase 8 SQL update from `database/schema.sql`.

`No prompts matched that search`

Make sure your posts are published with `is_published = true`.

`Search works but tags do not appear`

Make sure the post has rows in `post_tags`.

`Related searches are empty`

Add categories, tags, and published posts. Related searches need real searchable content.

## Next Phase

Phase 9 will build user profiles and collections:

- public profile page
- saved posts list
- custom collections
- adding posts to collections
- collection privacy
