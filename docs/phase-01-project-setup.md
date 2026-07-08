# Phase 1 - Project Setup

## Goal

Create a clean local project folder on Windows 11 so the website can be built in small, safe phases.

This phase does not build the real homepage, database, login, or admin dashboard yet. It prepares the workspace so the next phases stay organized.

## Exact Folder Structure

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

## Exact File Paths

```text
ai-prompt-gallery/.editorconfig
ai-prompt-gallery/.gitignore
ai-prompt-gallery/.vscode/extensions.json
ai-prompt-gallery/.vscode/settings.json
ai-prompt-gallery/README.md
ai-prompt-gallery/setup-check.html
ai-prompt-gallery/docs/phase-01-project-setup.md
```

## What Each File Does

`.editorconfig` keeps spacing and line endings consistent across editors.

`.gitignore` tells Git which files should not be uploaded to GitHub.

`.vscode/extensions.json` recommends helpful VS Code extensions.

`.vscode/settings.json` turns on small formatting helpers in VS Code.

`README.md` explains what the project is.

`setup-check.html` is a tiny test page. It proves your folder opens correctly in a browser before we build the real website.

`docs/phase-01-project-setup.md` is this beginner-friendly setup guide.

## Windows 11 Commands

Open PowerShell in the folder where you want the project, then run:

```powershell
mkdir ai-prompt-gallery
cd ai-prompt-gallery
code .
```

If `code .` does not work, open VS Code manually, then choose:

```text
File > Open Folder > ai-prompt-gallery
```

To start Git:

```powershell
git init
git status
```

To make your first local save:

```powershell
git add .
git commit -m "Set up project"
```

Do not push to GitHub yet if you are not ready. We will do the full GitHub upload in Phase 12.

## How To Test This Phase

Option 1:

1. Open the `ai-prompt-gallery` folder.
2. Double-click `setup-check.html`.
3. Your browser should show a setup success page.

Option 2, using VS Code Live Server:

1. Open the folder in VS Code.
2. Install the recommended Live Server extension if VS Code asks.
3. Right-click `setup-check.html`.
4. Click `Open with Live Server`.

## Common Errors And Fixes

`git is not recognized`

Install Git for Windows, then close and reopen PowerShell.

`code is not recognized`

Open VS Code manually. Later, in VS Code, you can enable the `code` command from the Command Palette.

`Live Server option is missing`

Install the Live Server extension in VS Code, then restart VS Code.

`The page opens but looks plain`

That is okay in Phase 1. The real design system starts in Phase 2.

## Next Phase

Phase 2 will create the real website folder structure and design system:

- CSS variables
- reusable layout rules
- light and dark mode foundation
- starter HTML page structure
- organized JavaScript files
