# Phase 10 - Admin Dashboard

## Goal

Add a secure admin dashboard so content can be managed from the website instead of editing HTML files.

This phase adds:

- `admin.html`
- admin-only access check
- Supabase Storage image upload
- create, edit, publish, unpublish, and delete posts
- full prompt and negative prompt editing
- category management
- tag management
- comment approval, hiding, and deletion
- user role management
- basic analytics
- an admin dashboard link on admin accounts

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- assets/
|   |-- css/
|   |   |-- admin.css
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
|       |-- admin.js
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
|   |-- phase-09-user-profiles-collections.md
|   `-- phase-10-admin-dashboard.md
|-- tools/
|   `-- local-server.js
|-- account.html
|-- admin.html
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
ai-prompt-gallery/admin.html
ai-prompt-gallery/assets/css/admin.css
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/js/account.js
ai-prompt-gallery/assets/js/admin.js
ai-prompt-gallery/database/README.md
ai-prompt-gallery/docs/phase-10-admin-dashboard.md
ai-prompt-gallery/README.md
```

## Security Model

The dashboard uses the normal Supabase anon public key.

It does not use a `service_role` key.

Security comes from:

- `profiles.role = 'admin'`
- `public.is_admin()`
- Row Level Security policies in `database/schema.sql`
- Supabase Storage policies for the `post-images` bucket

The browser can ask Supabase to create or update admin content, but Supabase only allows the request when the signed-in user is an admin.

## Supabase SQL

If you already ran the latest Phase 9 schema, no new table is required for Phase 10.

Make sure the latest file has already been run:

```text
database/schema.sql
```

Then make your account an admin:

1. Create your account through the website sign-up page.
2. Open:

```text
database/make-admin.sql
```

3. Replace:

```sql
'your-admin-email@example.com'
```

with your real sign-in email.

4. Run the SQL in Supabase SQL Editor.

## Windows 11 Commands

Open the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Start the local server:

```powershell
node tools/local-server.js
```

Open the admin dashboard:

```text
http://localhost:5500/admin.html
```

## How To Test This Phase

1. Add your Supabase Project URL and anon public key in:

```text
assets/js/supabase-client.js
```

2. Sign up or sign in.
3. Run `database/make-admin.sql` with your email.
4. Open:

```text
http://localhost:5500/admin.html
```

5. Confirm the dashboard opens.
6. Upload an image and create a draft post.
7. Publish the post.
8. Open the post from the dashboard.
9. Edit the prompt, tags, category, or status.
10. Add, edit, and delete a category.
11. Add, edit, and delete a tag.
12. Hide, approve, and delete comments.
13. Promote or demote another test user.
14. Check that analytics cards update.

## Common Errors And Fixes

`Admin dashboard is locked`

Your signed-in user does not have `profiles.role = 'admin'`. Run `database/make-admin.sql` with your email.

`Supabase is not configured yet`

Add your Supabase Project URL and anon public key in `assets/js/supabase-client.js`.

`new row violates row-level security policy`

You are not signed in as an admin, or the latest `database/schema.sql` has not been run.

`Image must be 10 MB or smaller`

Upload a smaller image. The `post-images` bucket is configured for a 10 MB file limit.

`Upload a JPG, PNG, WebP, or GIF image`

Use one of the allowed image formats from the storage bucket setup.

`Cannot delete category`

The category may still have posts attached. Move those posts to another category first.

## Next Phase

Phase 11 will focus on security review and Row Level Security hardening:

- audit every policy
- tighten admin operations
- verify public/private access
- review storage rules
- document safe deployment settings
