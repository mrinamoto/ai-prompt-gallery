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

Phase 1 is complete: project setup.

In this phase we created the local project folder, Git-ready housekeeping files, VS Code helper settings, and a small browser test page.

The real website pages will be added in later phases.

## Folder Structure

```text
ai-prompt-gallery/
|-- .vscode/
|   |-- extensions.json
|   `-- settings.json
|-- docs/
|   `-- phase-01-project-setup.md
|-- .editorconfig
|-- .gitignore
|-- README.md
`-- setup-check.html
```

## Important Security Note

Later, Supabase will give you two kinds of keys:

- The anon/public key can be used in browser JavaScript.
- The service role key must never be placed in frontend code or committed to GitHub.

This project will only use the anon/public key in the frontend.

## How To Test This Phase

Open `setup-check.html` in your browser. If you see the setup success page, this phase is working.

You can also open this folder in VS Code and initialize Git when you are ready.
