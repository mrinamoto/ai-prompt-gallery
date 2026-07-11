# AI Prompt Gallery

A beginner-friendly Pinterest-style AI image prompt discovery website.

This project will use:

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase for database, authentication, and image storage
- GitHub for version control
- Free deployment through Cloudflare Pages or GitHub Pages

No React, Next.js, npm build step, or paid tools are required.

## Current Phase

Phase 9 is complete: User profiles and collections.

Phase 1 created the local project folder, Git-ready housekeeping files, VS Code helper settings, and a small browser test page.

Phase 2 added the real website structure, CSS design tokens, reusable components, responsive layout rules, and light/dark theme foundations.

Phase 3 added the real homepage experience with temporary demo data, responsive image cards, filters, search, sorting, loading states, mobile navigation, and trending/new/popular sections.

Phase 4 added the post details page with full image, prompt, copy button, metadata, ratings, likes, saves, comments preview, and similar posts.

Phase 5 added the Supabase client placeholder, full database SQL, storage bucket setup, Row Level Security policies, and beginner setup steps.

Phase 6 added sign up, login, logout, forgot password, session persistence, Google login support, protected account page routing, and profile creation.

Phase 7 connected post detail interactions to Supabase for real database posts: likes, saves, one rating per user, comments, comment editing/deleting, and view tracking.

Phase 8 added a dedicated search page, search suggestions, filters, related searches, trending content, similar prompts, and "You May Also Like" recommendations. Supabase projects use SQL RPC helpers; unconfigured projects fall back to demo search.

Phase 9 added editable profiles, saved posts, liked posts, custom collections, public/private collection settings, post add/remove tools, public profile pages, and collection detail pages.

## Folder Structure

```text
ai-prompt-gallery/
|-- .vscode/
|   |-- extensions.json
|   `-- settings.json
|-- assets/
|   |-- css/
|   |   |-- base.css
|   |   |-- auth.css
|   |   |-- components.css
|   |   |-- home.css
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- post.css
|   |   |-- profiles.css
|   |   |-- search.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   |-- icons/
|   |-- images/
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
|-- .editorconfig
|-- .gitignore
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

## Important Security Note

Later, Supabase will give you two kinds of keys:

- The anon/public key can be used in browser JavaScript.
- The service role key must never be placed in frontend code or committed to GitHub.

This project will only use the anon/public key in the frontend.

## How To Test This Phase

Open `index.html` in your browser to use the demo homepage, then click an image to open its details page.

For Supabase setup, run `database/schema.sql` in Supabase SQL Editor, then run `database/make-admin.sql` after replacing the placeholder email.

For auth testing, run a simple local server and open `auth.html`:

```powershell
node tools/local-server.js
```

Then visit:

```text
http://localhost:5500/auth.html
```

If Node is not installed on your Windows machine, use the VS Code Live Server extension or try `python -m http.server 5500`.

Use `account.html` to test the protected account page.

Use a real Supabase post UUID to test Phase 7 interactions:

```text
http://localhost:5500/post.html?id=YOUR_SUPABASE_POST_UUID
```

Use the Phase 8 search page:

```text
http://localhost:5500/search.html?q=portrait
```

Use the Phase 9 account library and public pages:

```text
http://localhost:5500/account.html
http://localhost:5500/profile.html?username=YOUR_USERNAME
http://localhost:5500/collection.html?id=YOUR_COLLECTION_UUID
```

Open `setup-check.html` in your browser if you want to confirm the Phase 1 setup page still works.

You can also open this folder in VS Code and run `git status` to check your local changes.

## Phase Guides

- `docs/phase-01-project-setup.md`
- `docs/phase-02-folder-structure-design-system.md`
- `docs/phase-03-homepage-masonry-feed.md`
- `docs/phase-04-post-details-page.md`
- `docs/phase-05-supabase-setup.md`
- `docs/phase-06-authentication.md`
- `docs/phase-07-likes-ratings-comments-saves.md`
- `docs/phase-08-search-recommendations.md`
- `docs/phase-09-user-profiles-collections.md`
