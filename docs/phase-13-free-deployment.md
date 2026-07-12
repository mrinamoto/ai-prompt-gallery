# Phase 13 - Free Deployment

## Goal

Prepare AI Prompt Gallery for a free public deployment.

The easiest beginner-friendly option is GitHub Pages because this project is already a static site and has no build step. Cloudflare Pages is also supported if you want automatic deployments, preview deployments, and a nicer hosting dashboard after the project is on GitHub.

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/.nojekyll
ai-prompt-gallery/_headers
ai-prompt-gallery/404.html
ai-prompt-gallery/robots.txt
ai-prompt-gallery/assets/css/utilities.css
ai-prompt-gallery/README.md
ai-prompt-gallery/docs/phase-13-free-deployment.md
```

## What Each File Does

`.nojekyll`

Tells GitHub Pages to serve this as a plain static website instead of running Jekyll processing.

`_headers`

Adds simple security headers when the site is hosted on Cloudflare Pages. GitHub Pages will ignore this file.

`404.html`

Adds a friendly not-found page for broken or old links.

`robots.txt`

Allows search engines to crawl the public site.

`assets/css/utilities.css`

Adds small reusable alignment helpers used by the deployment 404 page.

## Recommended Platform

Use GitHub Pages first if you want the fewest steps.

Use Cloudflare Pages if you want Cloudflare's dashboard, deployment previews, security headers from `_headers`, and an easy custom-domain path later.

## Before You Deploy

Make sure these items are done:

- Supabase database tables and RLS are created from `database/schema.sql`.
- `assets/js/supabase-client.js` contains only your Supabase Project URL and anon public key.
- No `.env` file or service role key is committed.
- The project is pushed to a GitHub repository.

Check the project from PowerShell:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
```

## Option A - Deploy With GitHub Pages

### 1. Upload To GitHub

If you have not created the GitHub repository yet:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-prompt-gallery.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

If the remote already exists:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git branch -M main
git push -u origin main
```

### 2. Turn On GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main`.
6. Set folder to `/root`.
7. Click `Save`.

Your site URL will usually be:

```text
https://YOUR-USERNAME.github.io/ai-prompt-gallery/
```

GitHub can take several minutes to publish the first deployment.

## Option B - Deploy With Cloudflare Pages

### 1. Push The Project To GitHub

Cloudflare Pages needs the repository to exist on GitHub first.

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git branch -M main
git push -u origin main
```

### 2. Create The Cloudflare Pages Project

1. Go to Cloudflare.
2. Open `Workers & Pages`.
3. Select `Create application`.
4. Choose `Pages`.
5. Choose `Connect to Git`.
6. Connect your GitHub account.
7. Select the `ai-prompt-gallery` repository.
8. Use these build settings:

```text
Framework preset: None
Production branch: main
Build command: leave empty
Build output directory: /
Root directory: leave empty
Environment variables: none required
```

9. Click `Save and Deploy`.

Your site URL will usually be:

```text
https://ai-prompt-gallery.pages.dev/
```

Cloudflare will deploy again every time you push to the connected branch.

## Supabase Auth URL Setup

After you know your live URL, open Supabase:

1. Go to `Authentication`.
2. Open `URL Configuration`.
3. Set `Site URL` to your live website URL.
4. Add exact redirect URLs for the pages that receive auth redirects.

For GitHub Pages:

```text
https://YOUR-USERNAME.github.io/ai-prompt-gallery/
https://YOUR-USERNAME.github.io/ai-prompt-gallery/auth.html
https://YOUR-USERNAME.github.io/ai-prompt-gallery/account.html
http://localhost:5500/**
```

For Cloudflare Pages:

```text
https://ai-prompt-gallery.pages.dev/
https://ai-prompt-gallery.pages.dev/auth.html
https://ai-prompt-gallery.pages.dev/account.html
http://localhost:5500/**
```

Use exact production URLs when possible. Keep the localhost wildcard so you can still test locally.

## Google Login Setup

If Google login is enabled in Supabase:

1. Open Google Cloud Console.
2. Open your OAuth client.
3. Add this authorized redirect URI:

```text
https://YOUR-SUPABASE-PROJECT-REF.supabase.co/auth/v1/callback
```

4. In Supabase, confirm Google is enabled under `Authentication > Providers`.
5. Confirm your live `auth.html` and `account.html` URLs are in Supabase redirect URLs.

## How To Test The Live Site

Open the live website and check:

1. Homepage images load.
2. Search opens and filters demo or database posts.
3. Post detail pages open from image cards.
4. Sign up works.
5. Login works.
6. Logout works.
7. Forgot password email returns to `auth.html`.
8. Admin dashboard blocks non-admin users.
9. Admin user can upload an image and create a post.
10. Likes, ratings, comments, saves, profiles, and collections still work.

## Common Deployment Errors

`404 page after enabling GitHub Pages`

Wait a few minutes, then confirm `Settings > Pages` is using `main` and `/root`.

`Styles or scripts do not load`

Confirm the site was deployed from the project root and that `.nojekyll` exists in the repository.

`Supabase login redirects to localhost`

Update `Authentication > URL Configuration > Site URL` to your live website URL.

`Supabase says redirect URL is not allowed`

Add the exact live `auth.html` and `account.html` URLs to the redirect allow list.

`Google login returns an OAuth error`

Confirm the Google OAuth redirect URI is the Supabase callback URL, not your GitHub Pages or Cloudflare URL.

`Admin upload fails`

Confirm the signed-in user has `role = 'admin'` in `profiles`, and confirm the storage bucket/policies from `database/schema.sql` were created.

## Future Updates

After the site is live, update it with:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git add .
git commit -m "Describe your update"
git push
```

GitHub Pages and Cloudflare Pages will publish the new commit automatically after you push.
