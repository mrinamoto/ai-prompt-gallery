# Phase 12 - GitHub Upload

## Goal

Prepare AI Prompt Gallery for a professional public GitHub repository.

This phase adds:

- improved `.gitignore`
- `.env.example`
- `LICENSE`
- public-repository README
- exact Windows 11 upload commands
- exact Windows 11 update commands

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/.env.example
ai-prompt-gallery/.gitignore
ai-prompt-gallery/LICENSE
ai-prompt-gallery/README.md
ai-prompt-gallery/docs/phase-12-github-upload.md
```

## What Each File Does

`.gitignore`

Keeps local secrets, logs, dependencies, build output, and hosting cache folders out of GitHub.

`.env.example`

Shows which Supabase values are needed without storing real keys.

`LICENSE`

Adds the MIT License so other developers know how they may use the project.

`README.md`

Explains the project, features, setup, Supabase steps, security notes, upload commands, and deployment options.

## Before Uploading

Make sure you have:

- a GitHub account
- Git installed
- optionally GitHub CLI installed
- no real secret keys committed

Check your project status:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
```

## First Upload With GitHub CLI

Install GitHub CLI first if needed:

```text
https://cli.github.com/
```

Then run:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git branch -M main
gh auth login
gh repo create ai-prompt-gallery --public --source . --remote origin --push
```

## First Upload Without GitHub CLI

1. Create an empty public repository on GitHub named:

```text
ai-prompt-gallery
```

2. Do not add a README, license, or `.gitignore` on GitHub.
3. Run:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-prompt-gallery.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Update The GitHub Repository Later

Use this every time you make new changes:

```powershell
cd "C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery"
git status
git add .
git commit -m "Describe your update"
git push
```

## Fix Common GitHub Upload Errors

`remote origin already exists`

Run:

```powershell
git remote -v
git remote set-url origin https://github.com/YOUR-USERNAME/ai-prompt-gallery.git
git push -u origin main
```

`src refspec main does not match any`

Run:

```powershell
git branch -M main
git status
git add .
git commit -m "Prepare project for GitHub"
git push -u origin main
```

`Authentication failed`

Sign in again:

```powershell
gh auth login
```

Or use GitHub's browser-based sign-in when Git prompts you.

`Updates were rejected`

If the GitHub repository is not empty, pull first:

```powershell
git pull --rebase origin main
git push
```

Only do this if the GitHub repository contains files you want to keep.

## Security Checklist Before Public Release

- Do not commit `.env`.
- Do not commit Supabase `service_role` keys.
- Keep `assets/js/supabase-client.js` limited to Project URL and anon public key.
- Run `database/schema.sql` in Supabase before testing database features.
- Use `database/make-admin.sql` only in Supabase SQL Editor.
- Review `git status` before every commit.

## Next Phase

Phase 13 will cover free deployment through Cloudflare Pages or GitHub Pages.
