# AI Prompt Gallery

A modern Pinterest-style AI prompt discovery website built with HTML5, CSS3, vanilla JavaScript, and Supabase.

AI Prompt Gallery lets visitors browse AI-generated images, open detailed prompt pages, search by prompt metadata, save and rate posts, create collections, and manage content through a secure admin dashboard. It is intentionally beginner-friendly: there is no React, Next.js, bundler, paid build service, or complicated framework.

## Features

- Responsive masonry-style discovery homepage
- Search by title, description, prompt, category, tags, AI tool, and model
- Post details with image, prompt, negative prompt, metadata, likes, saves, ratings, comments, and similar posts
- Supabase Auth with sign up, login, logout, forgot password, session persistence, and Google login support
- Likes, one-rating-per-user, comments, saved posts, profiles, and collections
- Public and private collections
- Secure admin dashboard for uploads, posts, prompts, categories, tags, users, comments, and analytics
- Light and dark mode
- Mobile-friendly layout
- Supabase Row Level Security and Storage policies
- GitHub-ready static project structure

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase Database
- Supabase Auth
- Supabase Storage
- Git and GitHub
- Cloudflare Pages or GitHub Pages for free deployment

## Project Structure

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
|   |-- phase-10-admin-dashboard.md
|   |-- phase-11-security-rls.md
|   `-- phase-12-github-upload.md
|-- tools/
|   `-- local-server.js
|-- .editorconfig
|-- .env.example
|-- .gitignore
|-- LICENSE
|-- account.html
|-- admin.html
|-- auth.html
|-- collection.html
|-- index.html
|-- post.html
|-- profile.html
|-- search.html
`-- setup-check.html
```

## Quick Start On Windows 11

Open PowerShell in the project folder:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
```

Start the local server:

```powershell
node tools/local-server.js
```

Open:

```text
http://localhost:5500
```

If Node.js is not installed, use the VS Code Live Server extension or Python:

```powershell
python -m http.server 5500
```

## Supabase Setup

1. Create a free Supabase project.
2. Open Supabase SQL Editor.
3. Run:

```text
database/schema.sql
```

4. Open:

```text
assets/js/supabase-client.js
```

5. Replace the placeholders with your Supabase Project URL and anon public key.
6. Sign up through `auth.html`.
7. To make yourself admin, open:

```text
database/make-admin.sql
```

8. Replace the placeholder email with your sign-in email and run it in Supabase SQL Editor.

## Security Notes

- Only use the Supabase anon public key in frontend JavaScript.
- Never commit a Supabase `service_role` key.
- `.env`, `.env.local`, and other local secret files are ignored by Git.
- `database/schema.sql` enables Row Level Security and narrows browser grants.
- Admin actions are protected by Supabase policies and role-checking RPC functions.
- Storage uploads are scoped to the `post-images/posts/{admin-user-id}/` folder pattern.

## Main Pages

```text
index.html       Homepage and masonry feed
search.html      Search and recommendations
post.html        Post details
auth.html        Sign up, login, forgot password
account.html     User profile, saved posts, liked posts, collections
profile.html     Public profile page
collection.html  Collection detail page
admin.html       Admin dashboard
```

## GitHub Upload Commands

Use these commands from PowerShell after you create or sign in to a GitHub account.

### First Upload With GitHub CLI

Install GitHub CLI first if needed: https://cli.github.com/

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git branch -M main
gh auth login
gh repo create ai-prompt-gallery --public --source . --remote origin --push
```

### First Upload Without GitHub CLI

1. Create an empty public repository on GitHub named `ai-prompt-gallery`.
2. Do not add a README, license, or `.gitignore` on GitHub because this project already has them.
3. Run:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-prompt-gallery.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

### Update GitHub After Future Changes

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git add .
git commit -m "Describe your update"
git push
```

## Free Deployment

### GitHub Pages

1. Push this project to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings > Pages`.
4. Set source to `Deploy from a branch`.
5. Choose `main` and `/root`.
6. Save.

### Cloudflare Pages

1. Push this project to GitHub.
2. Open Cloudflare Pages.
3. Connect your GitHub repository.
4. Use no build command.
5. Use `/` as the output folder.
6. Deploy.

## Documentation

The `docs/` folder contains the full phase-by-phase build history, including Supabase setup, authentication, interactions, search, profiles, admin, security, and GitHub upload notes.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
