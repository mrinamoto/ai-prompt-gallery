# Admin Upload Guide

This guide explains how to manage AI Prompt Gallery posts from the admin dashboard without editing HTML.

The static website does not store uploaded images in the project folder. Images go to Supabase Storage, and prompt data goes to the Supabase `prompt_posts` table.

## Files Used

```text
database/schema.sql
database/prompt-posts.sql
database/make-admin.sql
assets/js/supabase-client.js
admin.html
```

## 1. Create A Supabase Project

1. Go to Supabase.
2. Create a new free project.
3. Wait for the project to finish provisioning.
4. Open `Project Settings > API`.
5. Copy:

```text
Project URL
anon public key
```

Do not copy or use the `service_role` key in frontend code.

## 2. Add Supabase Keys To The Website

Open:

```text
assets/js/supabase-client.js
```

Replace:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```

with your Project URL and anon public key.

The anon key is safe to use in a browser when Row Level Security is enabled.

## 3. Create The Main Database Tables

Open Supabase SQL Editor.

Run the full contents of:

```text
database/schema.sql
```

This creates the existing project tables, profiles, admin role helpers, user interactions, and the original app security policies.

## 4. Create The Admin CMS Table

Then run the full contents of:

```text
database/prompt-posts.sql
```

This creates:

- `public.prompt_posts`
- indexes for status, category, tags, and search
- secure Row Level Security policies
- `prompt-images` Storage bucket
- admin-only Storage upload/update/delete policies

## 5. prompt_posts Columns

The admin CMS table stores:

```text
id
title
prompt
negative_prompt
image_url
image_path
ai_tool
model
category
tags
aspect_ratio
style
status
notes
created_by
created_at
updated_at
```

`created_at` and `updated_at` are automatic.

## 6. Create The Storage Bucket

The migration creates the bucket automatically:

```text
prompt-images
```

If you create it manually, use:

```text
Bucket name: prompt-images
Public bucket: enabled
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

Uploaded files are stored under:

```text
posts/{admin-user-id}/{userId}_{timestamp}_{random}_{originalName}.jpg
posts/{admin-user-id}/{userId}_{timestamp}_{random}_{originalName}.png
posts/{admin-user-id}/{userId}_{timestamp}_{random}_{originalName}.webp
```

Only admins can upload, update, or delete files in this bucket.

## 7. Security And RLS

The policies in `database/prompt-posts.sql` enforce:

- public visitors can read only `status = 'published'` posts
- admins can read published and draft posts
- admins can insert posts
- admins can update posts
- admins can delete posts
- normal users cannot insert, update, or delete posts
- public visitors can read images
- only admins can upload, update, or delete images

The browser uses only the Supabase anon public key. Supabase RLS decides what each visitor can do.

## 8. Create Your Admin User

1. Open the website locally.
2. Go to:

```text
http://localhost:5500/auth.html
```

3. Sign up with your admin email.
4. Confirm the email if Supabase asks you to.

## 9. Set Your Email As Admin

Open:

```text
database/make-admin.sql
```

Replace:

```sql
'your-admin-email@example.com'
```

with your real email.

Run the SQL in Supabase SQL Editor.

After that, your profile has:

```text
role = admin
```

## 10. Login As Admin

Start the local server:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
node tools/local-server.js
```

Open:

```text
http://localhost:5500/admin.html
```

If you are not signed in, the site sends you to login.

If you are signed in but not admin, the dashboard shows an access denied message.

## 11. Upload A New Image And Prompt

In `admin.html`:

1. Choose an image file.
2. Add a title.
3. Paste the full AI prompt.
4. Add a negative prompt if you have one.
5. Add AI tool, model, category, tags, aspect ratio, and style.
6. Choose `Published` or `Draft`.
7. Add notes if needed.
8. Click `Save post`.

Published posts appear on the homepage, search page, and detail page.

Draft posts are visible only to admin users in the dashboard.

## 12. Edit Or Delete Posts

In the admin dashboard:

- Use search to find a post by title, prompt, category, model, style, or tag.
- Use the category dropdown to filter by category.
- Use the status dropdown to filter published or draft posts.
- Click `Edit` to update a post.
- Upload a replacement image if needed.
- Click `Delete` to remove the database row and the image from Supabase Storage.

## 13. Test Locally

Run:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
node tools/local-server.js
```

Test these pages:

```text
http://localhost:5500/
http://localhost:5500/search.html
http://localhost:5500/admin.html
```

Checklist:

- normal visitors can see published posts
- normal visitors cannot open the admin dashboard
- admin can upload a JPG, PNG, or WebP image
- admin can create a draft
- draft does not appear publicly
- admin can publish the draft
- admin can edit a post
- admin can delete a post and its image

## 14. GitHub Pages Redirect URLs

If your GitHub Pages URL is:

```text
https://USERNAME.github.io/ai-prompt-gallery/
```

Open Supabase:

```text
Authentication > URL Configuration
```

Set `Site URL`:

```text
https://USERNAME.github.io/ai-prompt-gallery/
```

Add redirect URLs:

```text
https://USERNAME.github.io/ai-prompt-gallery/
https://USERNAME.github.io/ai-prompt-gallery/auth.html
https://USERNAME.github.io/ai-prompt-gallery/account.html
https://USERNAME.github.io/ai-prompt-gallery/admin.html
http://localhost:5500/**
```

The project uses relative links like `./admin.html`, so it works from the `/ai-prompt-gallery/` subfolder.

## 15. Deploy Or Update GitHub Pages

Commit and push your changes:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git add .
git commit -m "Add admin prompt upload CMS"
git push
```

GitHub Pages will rebuild from the latest commit.

## 16. Common Errors

`Supabase is not configured yet`

Add your Project URL and anon public key in `assets/js/supabase-client.js`.

`permission denied for table prompt_posts`

Run `database/prompt-posts.sql`, then confirm your account is admin with `database/make-admin.sql`.

`new row violates row-level security policy`

Make sure you are signed in as an admin and that `created_by` is your signed-in user id. The dashboard handles this automatically.

`Upload failed`

Check that the `prompt-images` bucket exists and the Storage policies from `database/prompt-posts.sql` ran successfully.

`Image must be 10 MB or smaller`

Compress the image or export a smaller JPG, PNG, or WebP file.

`Redirect URL is not allowed`

Add the exact local and GitHub Pages URLs to Supabase Authentication URL Configuration.

## 17. Current Limitation

Uploaded `prompt_posts` content appears on the homepage, search page, and detail page. The existing like, save, rating, comment, and view-counter systems are still attached to the older relational `posts` table, so those interactions are disabled for `prompt_posts` records in this version.
