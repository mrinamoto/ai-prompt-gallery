# Phase 5 - Supabase Setup

## Goal

Prepare Supabase as the backend for the website.

This phase adds:

- Supabase browser client setup with safe placeholders
- complete database schema
- relationships between all project tables
- validation rules
- indexes
- automatic count triggers
- starter categories and tags
- image storage bucket setup
- Row Level Security policies
- admin setup SQL

The website still uses demo data on the homepage and details page. Real Supabase reads and writes start in later phases.

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- assets/
|   `-- js/
|       |-- app.js
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
|   `-- phase-05-supabase-setup.md
|-- index.html
|-- post.html
|-- README.md
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/assets/js/supabase-client.js
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/database/make-admin.sql
ai-prompt-gallery/database/README.md
ai-prompt-gallery/docs/phase-05-supabase-setup.md
ai-prompt-gallery/index.html
ai-prompt-gallery/post.html
ai-prompt-gallery/README.md
```

## Tables Created

```text
profiles
posts
categories
tags
post_tags
likes
ratings
comments
saved_posts
collections
collection_posts
views
```

## Relationships

`profiles.id` links to `auth.users.id`.

`posts.author_id` links to `profiles.id`.

`posts.category_id` links to `categories.id`.

`post_tags.post_id` links to `posts.id`.

`post_tags.tag_id` links to `tags.id`.

`likes`, `ratings`, `comments`, `saved_posts`, and `views` link to `posts.id`.

`likes`, `ratings`, `comments`, `saved_posts`, and `collections` link to `profiles.id`.

`collection_posts.collection_id` links to `collections.id`.

`collection_posts.post_id` links to `posts.id`.

## What The SQL Includes

`database/schema.sql` includes:

- table creation
- foreign keys
- unique rules
- text length checks
- rating range checks
- slug format checks
- search indexes
- count triggers for likes, saves, ratings, comments, and views
- starter categories and tags
- `post-images` Supabase Storage bucket
- storage upload policies
- RLS policies

`database/make-admin.sql` promotes your own account to admin.

## Windows 11 Commands

Open the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Open the project in VS Code:

```powershell
code .
```

Check Git:

```powershell
git status
```

## Supabase Setup Steps

1. Go to `https://supabase.com`.
2. Create a free account or sign in.
3. Create a new project.
4. Choose a project name such as `ai-prompt-gallery`.
5. Save your database password somewhere private.
6. Wait for Supabase to finish creating the project.
7. Open the project dashboard.
8. Go to `SQL Editor`.
9. Open this local file:

```text
database/schema.sql
```

10. Copy the full contents.
11. Paste it into Supabase SQL Editor.
12. Click `Run`.

## Create Your Admin User

1. In Supabase, go to `Authentication`.
2. Open `Users`.
3. Create your own user with email and password.
4. Open this local file:

```text
database/make-admin.sql
```

5. Replace:

```sql
your-admin-email@example.com
```

with your real admin email.

6. Copy the edited SQL.
7. Paste it into Supabase SQL Editor.
8. Click `Run`.

Only this admin account can create, edit, publish, or delete posts in the current RLS setup.

## Connect The Frontend

1. In Supabase, go to `Project Settings`.
2. Open `API`.
3. Copy your `Project URL`.
4. Copy your `anon` public key.
5. Open:

```text
assets/js/supabase-client.js
```

6. Replace:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```

with your real values.

The anon key is safe to use in frontend JavaScript because RLS policies control what it can do.

Never use the `service_role` key in frontend code.

## Storage Setup

The SQL creates a public bucket called:

```text
post-images
```

Why public? The images in this website are meant to be visible to visitors.

Uploads, updates, and deletes are still protected by RLS policies. Only admins can upload or manage files.

## How To Test This Phase

1. Run `database/schema.sql` in Supabase SQL Editor.
2. Create your admin user in Supabase Authentication.
3. Run `database/make-admin.sql` after replacing the email.
4. Open `assets/js/supabase-client.js`.
5. Paste your Project URL and anon key.
6. Open `index.html`.
7. Open the browser console.
8. Confirm there is no message saying Supabase is not configured.

The visible homepage still uses demo data. That is expected.

## Common Errors And Fixes

`permission denied for schema storage`

Make sure you are running the SQL inside the Supabase SQL Editor for your project.

`Only admins can change profile roles`

This is expected if a normal user tries to make themselves admin. Use `database/make-admin.sql` from SQL Editor.

`duplicate key value violates unique constraint`

You may already have a category, tag, like, rating, save, view, or collection with the same unique value. The schema is designed to prevent duplicates.

`Supabase is not configured yet`

You have not replaced the placeholders in `assets/js/supabase-client.js`.

`Do I paste the service_role key?`

No. Never paste the service role key into frontend files.

## Next Phase

Phase 6 will build authentication:

- register
- login
- logout
- Google login setup
- auth-aware header
- protected user session state
