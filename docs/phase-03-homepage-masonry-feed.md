# Phase 3 - Homepage And Pinterest-Style Masonry Feed

## Goal

Build the first real homepage experience using temporary demo data.

This phase adds:

- responsive AI image cards
- Pinterest-style masonry layout
- category filters
- AI tool filter
- sort tabs for For You, Trending, Popular, and Newest
- search behavior using demo data
- loading skeletons
- empty state
- hover effects
- sidebar discovery blocks
- trending, newest, and popular sections
- mobile bottom navigation

Database features are not included yet. Supabase starts in a later phase.

## Exact Folder Structure

```text
ai-prompt-gallery/
|-- assets/
|   |-- css/
|   |   |-- base.css
|   |   |-- components.css
|   |   |-- home.css
|   |   |-- layout.css
|   |   |-- main.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   `-- js/
|       |-- app.js
|       |-- home.js
|       `-- theme.js
|-- docs/
|   |-- phase-01-project-setup.md
|   |-- phase-02-folder-structure-design-system.md
|   `-- phase-03-homepage-masonry-feed.md
|-- index.html
|-- README.md
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/index.html
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/css/home.css
ai-prompt-gallery/assets/js/app.js
ai-prompt-gallery/assets/js/home.js
ai-prompt-gallery/docs/phase-03-homepage-masonry-feed.md
ai-prompt-gallery/README.md
```

## What Each New File Does

`assets/css/home.css` contains homepage-only styles: hero, filters, masonry cards, sidebar lists, content rails, loading skeletons, and mobile navigation.

`assets/js/home.js` contains temporary demo post data and homepage interactions.

## Where To Paste The Code

The code has already been placed into the correct files.

If rebuilding manually, create the file paths above and paste each file's full code into its matching path.

## Windows 11 Commands

Open PowerShell inside the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Open the homepage:

```powershell
start index.html
```

Check Git:

```powershell
git status
```

## How To Test This Phase

1. Open `index.html`.
2. Confirm demo cards appear in a masonry layout.
3. Search for `neon`, `product`, or `architecture`.
4. Click category chips and confirm the feed changes.
5. Change the AI tool dropdown and confirm results update.
6. Click For You, Trending, Popular, and Newest tabs.
7. Make the browser narrow and confirm the mobile bottom navigation appears.
8. Click the theme button and confirm light/dark mode still works.
9. Search for a nonsense word and confirm the empty state appears.

## Common Errors And Fixes

`Cards do not appear`

Make sure `index.html` includes this script near the bottom:

```html
<script src="./assets/js/home.js"></script>
```

`The page has no masonry styling`

Make sure `assets/css/main.css` imports:

```css
@import url("./home.css");
```

`Images load slowly or appear different`

This phase uses temporary demo image URLs. Supabase Storage will replace them later.

`Filters do nothing`

Make sure the browser is not blocking JavaScript and refresh with `Ctrl + F5`.

## Next Phase

Phase 4 will build the post details page:

- large image view
- title and description
- full prompt
- negative prompt placeholder
- copy prompt button
- tool, model, category, tags, aspect ratio, views, likes, rating, and comments layout
- similar prompt sections using demo data
