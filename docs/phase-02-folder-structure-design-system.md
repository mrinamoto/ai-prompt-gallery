# Phase 2 - Folder Structure And Design System

## Goal

Create the reusable foundation for the full website before building the real homepage.

This phase adds:

- scalable folders
- CSS variables
- typography
- colors
- spacing
- buttons
- cards
- forms
- badges
- filters
- responsive layout rules
- dark and light mode foundations

Phase 1 was not rebuilt. The original `setup-check.html` page still exists.

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- .vscode/
|-- assets/
|   |-- css/
|   |   |-- base.css
|   |   |-- components.css
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   |-- icons/
|   |   `-- .gitkeep
|   |-- images/
|   |   `-- .gitkeep
|   `-- js/
|       |-- app.js
|       `-- theme.js
|-- database/
|   `-- .gitkeep
|-- docs/
|   |-- phase-01-project-setup.md
|   `-- phase-02-folder-structure-design-system.md
|-- .editorconfig
|-- .gitignore
|-- README.md
|-- index.html
`-- setup-check.html
```

## Exact File Paths Added In This Phase

```text
ai-prompt-gallery/index.html
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/css/tokens.css
ai-prompt-gallery/assets/css/base.css
ai-prompt-gallery/assets/css/layout.css
ai-prompt-gallery/assets/css/components.css
ai-prompt-gallery/assets/css/utilities.css
ai-prompt-gallery/assets/js/theme.js
ai-prompt-gallery/assets/js/app.js
ai-prompt-gallery/assets/images/.gitkeep
ai-prompt-gallery/assets/icons/.gitkeep
ai-prompt-gallery/database/.gitkeep
ai-prompt-gallery/docs/phase-02-folder-structure-design-system.md
```

## Where To Paste The Code

The code has already been placed into the correct files.

If you ever rebuild manually, create each file path above, then paste the matching file's full contents into that file.

## What Each CSS File Does

`main.css` loads all CSS files in the right order.

`tokens.css` stores the design variables such as colors, spacing, border radius, shadows, and theme values.

`base.css` sets default browser cleanup, typography, focus styles, and accessibility behavior.

`layout.css` controls containers, headers, grids, responsive layout, and spacing between sections.

`components.css` contains reusable UI pieces like buttons, cards, chips, tabs, forms, stats, notices, and empty states.

`utilities.css` contains tiny helper classes like screen-reader-only text and muted text.

## What Each JavaScript File Does

`theme.js` switches between light mode and dark mode and saves the visitor's choice in the browser.

`app.js` contains small page helpers for this phase. Larger features will be added later.

## Windows 11 Commands

Open PowerShell inside the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Open the project in VS Code:

```powershell
code .
```

Check Git:

```powershell
git status
```

Open the Phase 2 preview page:

```powershell
start index.html
```

## How To Test This Phase

1. Open `index.html` in a browser.
2. Confirm the page has a polished header, search preview, cards, form controls, and stats.
3. Click the theme button in the header.
4. Confirm the page switches between light and dark mode.
5. Make the browser window narrow.
6. Confirm the layout stacks nicely on mobile width.
7. Open `setup-check.html`.
8. Confirm the Phase 1 setup page still works.

## Common Errors And Fixes

`The page has no styling`

Make sure `index.html` still links to:

```html
<link rel="stylesheet" href="./assets/css/main.css" />
```

`Dark mode button does nothing`

Make sure `index.html` still links to:

```html
<script src="./assets/js/theme.js"></script>
```

`CSS changes do not appear`

Refresh the browser. If needed, press `Ctrl + F5` to force a full refresh.

`The layout looks squeezed on mobile`

Check that this line exists in the `<head>` of `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

## Next Phase

Phase 3 will turn this foundation into the real homepage:

- responsive Pinterest-style masonry feed
- sample post data
- search input layout
- category filters
- trending, popular, and newest sections
