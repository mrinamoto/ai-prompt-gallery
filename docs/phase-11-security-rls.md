# Phase 11 - Security And Supabase Row Level Security

## Goal

Audit the project security surface and harden Supabase access so the public browser app can stay simple without trusting the browser.

This phase adds:

- narrower database grants
- safer public profile reads
- RPC helpers for current profile and admin user role data
- server-side admin role change protection
- protection against self-demoting or removing the final admin
- server-side post payload validation
- protection for system-managed post counters
- folder-scoped Supabase Storage upload policies
- frontend updates so role checks use secure RPC functions
- updated setup notes to avoid broad profile exposure

## Security Audit Summary

The project already had strong foundations:

- RLS enabled on all public tables
- admin-only policies for posts, categories, tags, and storage writes
- user ownership checks for likes, ratings, comments, saves, and collections
- no `service_role` key in frontend code
- Supabase Storage bucket MIME type and file size limits
- frontend HTML escaping before rendering database content

This phase tightened the remaining risk areas:

- public profile reads no longer expose `profiles.role` through broad grants
- admin user-role listing now uses `admin_list_profiles()`
- current user role checks now use `get_current_profile()`
- role changes now use `admin_set_profile_role()`
- post counters and `author_id` cannot be changed from browser updates
- uploaded image paths must stay inside `posts/{admin-user-id}/`
- Storage policies now restrict admin writes to that same folder pattern

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- assets/
|   `-- js/
|       |-- account.js
|       |-- admin.js
|       `-- post.js
|-- database/
|   |-- README.md
|   |-- make-admin.sql
|   `-- schema.sql
|-- docs/
|   |-- phase-10-admin-dashboard.md
|   `-- phase-11-security-rls.md
|-- README.md
`-- ...
```

## Exact File Paths Changed

```text
ai-prompt-gallery/assets/js/account.js
ai-prompt-gallery/assets/js/admin.js
ai-prompt-gallery/assets/js/post.js
ai-prompt-gallery/database/README.md
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/docs/phase-09-user-profiles-collections.md
ai-prompt-gallery/docs/phase-11-security-rls.md
ai-prompt-gallery/README.md
```

## What Changed In Supabase

### Profile Access

Public and authenticated users now receive only safe profile columns through table grants:

```text
id
username
display_name
avatar_url
bio
website_url
created_at
updated_at
```

The `role` column is no longer directly exposed through public profile reads.

### Role RPC Helpers

`get_current_profile()` returns the signed-in user's own profile, including role.

`admin_list_profiles()` returns profile roles only when the caller is an admin.

`admin_set_profile_role()` changes a user's role only when the caller is an admin.

### Admin Role Safety

The database now blocks:

- non-admin role changes
- self-demoting the current admin account from the browser
- removing the final remaining admin

### Post Safety

The database now validates post payloads and blocks browser updates to:

```text
author_id
views_count
likes_count
saves_count
rating_count
average_rating
comments_count
```

Those fields are managed by database triggers, not by dashboard form data.

### Storage Safety

Admin uploads must stay in:

```text
post-images/posts/{admin-user-id}/filename
```

The browser cannot use the admin upload policy to write elsewhere in the bucket.

## Supabase SQL Update

Fresh project:

```text
Run the full latest database/schema.sql
```

Existing project:

Run the latest `database/schema.sql` in Supabase SQL Editor. It is idempotent, so it can safely recreate policies, functions, triggers, and grants.

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

1. Run the latest `database/schema.sql`.
2. Sign in as your admin account.
3. Open:

```text
http://localhost:5500/admin.html
```

4. Confirm the dashboard opens.
5. Create a post with an uploaded image.
6. Confirm the image path starts with:

```text
posts/YOUR_USER_ID/
```

7. Try to demote your own admin account in the Users tab. The database should reject it.
8. Sign in as a non-admin user and open `admin.html`. The dashboard should stay locked.
9. Confirm the account page still shows the admin link only for admin users.
10. Open public profile and collection pages while signed out. They should still load public data, but not role data.

## Common Errors And Fixes

`permission denied for table profiles`

Run the latest `database/schema.sql`. The frontend now expects Phase 11 column grants and profile RPC helpers.

`Could not find the function public.get_current_profile`

Run the latest `database/schema.sql`.

`System-managed post fields cannot be changed from the browser`

This is expected if a browser request tries to change counters or `author_id`. Use normal likes, saves, ratings, comments, and views to update counters.

`Post image path must stay inside the admin upload folder`

Upload images through the admin dashboard so they are stored under the correct admin folder.

`Admins cannot demote their own account from the browser`

This prevents accidentally locking yourself out. Use Supabase SQL Editor only if you intentionally need to change your own admin role.

## Security Reminders

- Never paste a Supabase `service_role` key into frontend code.
- Keep only the anon public key in `assets/js/supabase-client.js`.
- Run the full schema after security changes so grants and policies are in sync.
- Keep admin accounts limited to trusted users.

## Next Phase

Phase 12 will upload the project to GitHub:

- review Git status
- prepare a clean commit history
- create or connect the GitHub repository
- push the project
- keep secrets out of GitHub
