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

Phase 5 is complete: Supabase setup.

Phase 1 created the local project folder, Git-ready housekeeping files, VS Code helper settings, and a small browser test page.

Phase 2 added the real website structure, CSS design tokens, reusable components, responsive layout rules, and light/dark theme foundations.

Phase 3 added the real homepage experience with temporary demo data, responsive image cards, filters, search, sorting, loading states, mobile navigation, and trending/new/popular sections.

Phase 4 added the post details page with full image, prompt, copy button, metadata, ratings, likes, saves, comments preview, and similar posts.

Phase 5 added the Supabase client placeholder, full database SQL, storage bucket setup, Row Level Security policies, and beginner setup steps.

## Folder Structure

```text
ai-prompt-gallery/
|-- .vscode/
|   |-- extensions.json
|   `-- settings.json
|-- assets/
|   |-- css/
|   |   |-- base.css
|   |   |-- components.css
|   |   |-- home.css
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- post.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   |-- icons/
|   |-- images/
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
|-- .editorconfig
|-- .gitignore
|-- index.html
|-- post.html
|-- README.md
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

Open `setup-check.html` in your browser if you want to confirm the Phase 1 setup page still works.

You can also open this folder in VS Code and run `git status` to check your local changes.

## Phase Guides

- `docs/phase-01-project-setup.md`
- `docs/phase-02-folder-structure-design-system.md`
- `docs/phase-03-homepage-masonry-feed.md`
- `docs/phase-04-post-details-page.md`
- `docs/phase-05-supabase-setup.md`
