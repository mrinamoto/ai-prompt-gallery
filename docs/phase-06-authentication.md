# Phase 6 - Authentication

## Goal

Add Supabase Auth to the website while keeping the frontend simple.

This phase adds:

- sign up with email and password
- login with email and password
- logout
- forgot password emails
- password reset form
- session persistence
- protected account page
- profile creation for signed-in users
- Google login support when enabled in Supabase
- auth-aware header links

The homepage and post details page still use demo post data. Real likes, saves, comments, and profiles come in later phases.

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
|   `-- phase-06-authentication.md
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
ai-prompt-gallery/account.html
ai-prompt-gallery/auth.html
ai-prompt-gallery/assets/css/auth.css
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/js/account.js
ai-prompt-gallery/assets/js/auth-page.js
ai-prompt-gallery/assets/js/auth-state.js
ai-prompt-gallery/database/schema.sql
ai-prompt-gallery/docs/phase-06-authentication.md
ai-prompt-gallery/index.html
ai-prompt-gallery/post.html
ai-prompt-gallery/README.md
ai-prompt-gallery/tools/local-server.js
```

## What Each New File Does

`auth.html`

The public sign-in page. It contains the login, sign up, forgot password, reset password, and Google login UI.

`account.html`

A protected page. If the visitor is not signed in, they are sent to `auth.html`.

`assets/js/auth-state.js`

Shared session helper. It loads the current Supabase session, keeps header links updated, handles logout, and protects pages marked with `data-requires-auth`.

`assets/js/auth-page.js`

Handles sign up, login, forgot password, password updates, and Google login.

`assets/js/account.js`

Loads or creates the signed-in user's profile and lets the user edit basic public profile fields.

`assets/css/auth.css`

Styles the authentication and account pages.

`tools/local-server.js`

An optional local preview server that uses built-in Node features only. It is useful when Python is not installed and Supabase redirects need a real `http://localhost` URL.

## Supabase SQL Update

If you run the full `database/schema.sql` after this phase, this is already included.

If you already ran Phase 5 before Phase 6, run this small update in Supabase SQL Editor:

```sql
drop policy if exists "Users can create own profile if missing" on public.profiles;
create policy "Users can create own profile if missing"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id and role = 'user');
```

Why this exists:

The database trigger should create a profile automatically when a user signs up. This policy is a backup so the account page can safely create the signed-in user's own profile if the trigger did not run or the user existed before the trigger was added.

## Windows 11 Commands

Open the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Check Git:

```powershell
git status
```

Start a simple local website server:

```powershell
node tools/local-server.js
```

Open the website:

```text
http://localhost:5500/auth.html
```

If `node` is not recognized, use the VS Code Live Server extension or try:

```powershell
python -m http.server 5500
```

## Supabase Auth Setup Steps

1. Open your Supabase project dashboard.
2. Go to `Authentication`.
3. Go to `Providers`.
4. Make sure `Email` is enabled.
5. Go to `URL Configuration`.
6. Set `Site URL` to:

```text
http://localhost:5500
```

7. Add these redirect URLs:

```text
http://localhost:5500/auth.html
http://localhost:5500/account.html
http://127.0.0.1:5500/auth.html
http://127.0.0.1:5500/account.html
```

Later, after deployment, add your real Cloudflare Pages or GitHub Pages URL here too.

## Connect The Frontend

Open:

```text
assets/js/supabase-client.js
```

Replace:

```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```

with your real Supabase Project URL and anon public key.

Never paste the `service_role` key into this file.

## Google Login Setup

Google login only works after you enable it in Supabase and Google Cloud.

1. In Supabase, go to `Authentication`.
2. Open `Providers`.
3. Open `Google`.
4. Copy the callback URL shown by Supabase. It usually looks like:

```text
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

5. In Google Cloud Console, create an OAuth Client ID for a web application.
6. Add your local site as an authorized JavaScript origin:

```text
http://localhost:5500
```

7. Add the Supabase callback URL as an authorized redirect URI.
8. Copy the Google Client ID and Client Secret.
9. Paste them into the Google provider settings in Supabase.
10. Save the provider.

If Google login is not enabled, the normal email login still works.

## How To Test This Phase

1. Run the Phase 5 schema in Supabase if you have not already.
2. Run the Phase 6 SQL update above if your schema was created before this phase.
3. Paste your Project URL and anon key into `assets/js/supabase-client.js`.
4. Start the local server:

```powershell
node tools/local-server.js
```

5. Open:

```text
http://localhost:5500/auth.html
```

6. Create a new account.
7. If Supabase asks for email confirmation, open the email and confirm.
8. Log in.
9. Confirm you arrive at:

```text
http://localhost:5500/account.html
```

10. Edit your display name, username, bio, or website URL.
11. Click `Save profile`.
12. Click `Logout`.
13. Open `account.html` again and confirm it sends you back to `auth.html`.
14. Try the forgot password form and confirm the email arrives.
15. Enable Google in Supabase, then test `Continue with Google`.

## Common Errors And Fixes

`Supabase is not configured yet`

You still need to replace the placeholder URL and anon key in `assets/js/supabase-client.js`.

`Invalid login credentials`

The email or password is wrong, or the account has not been created yet.

`Email not confirmed`

Open the confirmation email from Supabase, then try logging in again.

`Redirect URL not allowed`

Add your local URL to Supabase `Authentication > URL Configuration > Redirect URLs`.

`Google login opens but fails`

Check that Google Cloud has the Supabase callback URL as an authorized redirect URI. Also confirm the Google provider is enabled in Supabase.

`new row violates row-level security policy for table "profiles"`

Run the Phase 6 SQL update above, or rerun the latest `database/schema.sql`.

`Should I use the service_role key?`

No. Frontend code must only use the anon public key.

## Next Phase

Phase 7 will connect real logged-in user actions:

- likes
- ratings
- comments
- saves
- saved posts
