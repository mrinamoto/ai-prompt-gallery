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

Phase 2 is complete: folder structure and design system.

Phase 1 created the local project folder, Git-ready housekeeping files, VS Code helper settings, and a small browser test page.

Phase 2 added the real website structure, CSS design tokens, reusable components, responsive layout rules, and light/dark theme foundations.

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
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   |-- icons/
|   |-- images/
|   `-- js/
|       |-- app.js
|       `-- theme.js
|-- database/
|-- docs/
|   |-- phase-01-project-setup.md
|   `-- phase-02-folder-structure-design-system.md
|-- .editorconfig
|-- .gitignore
|-- index.html
|-- README.md
`-- setup-check.html
```

## Important Security Note

Later, Supabase will give you two kinds of keys:

- The anon/public key can be used in browser JavaScript.
- The service role key must never be placed in frontend code or committed to GitHub.

This project will only use the anon/public key in the frontend.

## How To Test This Phase

Open `index.html` in your browser to preview the Phase 2 design system.

Open `setup-check.html` in your browser if you want to confirm the Phase 1 setup page still works.

You can also open this folder in VS Code and run `git status` to check your local changes.

## Phase Guides

- `docs/phase-01-project-setup.md`
- `docs/phase-02-folder-structure-design-system.md`
