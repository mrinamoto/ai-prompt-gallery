# Phase 4 - Post Details Page

## Goal

Build a complete post details page using temporary demo data.

When a user opens an image from the homepage, the site now shows:

- full image
- title
- description
- full AI prompt
- copy prompt button
- optional negative prompt
- AI tool
- AI model
- tags
- category
- aspect ratio
- views
- likes
- saves
- average rating
- comments preview
- similar posts

Database features are still not included. Supabase starts in a later phase.

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
|   |   |-- post.css
|   |   |-- tokens.css
|   |   `-- utilities.css
|   `-- js/
|       |-- app.js
|       |-- demo-data.js
|       |-- home.js
|       |-- post.js
|       `-- theme.js
|-- docs/
|   |-- phase-01-project-setup.md
|   |-- phase-02-folder-structure-design-system.md
|   |-- phase-03-homepage-masonry-feed.md
|   `-- phase-04-post-details-page.md
|-- index.html
|-- post.html
|-- README.md
`-- setup-check.html
```

## Exact File Paths Changed Or Added

```text
ai-prompt-gallery/post.html
ai-prompt-gallery/index.html
ai-prompt-gallery/assets/css/main.css
ai-prompt-gallery/assets/css/home.css
ai-prompt-gallery/assets/css/post.css
ai-prompt-gallery/assets/js/demo-data.js
ai-prompt-gallery/assets/js/home.js
ai-prompt-gallery/assets/js/post.js
ai-prompt-gallery/docs/phase-04-post-details-page.md
ai-prompt-gallery/README.md
```

## What Each New File Does

`post.html` is the reusable post details page.

`assets/css/post.css` styles the full image layout, prompt panels, metadata, comments preview, and similar posts.

`assets/js/demo-data.js` stores the temporary demo posts and comments used by both the homepage and details page.

`assets/js/post.js` reads the post id from the URL, fills the details page, handles copy prompt, demo likes, demo saves, and similar posts.

## How The Page Opens

Each homepage card now links to:

```text
post.html?id=1
post.html?id=2
post.html?id=3
```

The number after `id=` tells the page which demo post to show.

## Windows 11 Commands

Open PowerShell inside the project folder:

```powershell
cd C:\Users\User\Documents\Codex\2026-07-08\act-as-a-senior-full-stack\outputs\ai-prompt-gallery
```

Open the homepage:

```powershell
start index.html
```

Open a details page directly. Without an id, it shows the first demo post:

```powershell
start .\post.html
```

Check Git:

```powershell
git status
```

## How To Test This Phase

1. Open `index.html`.
2. Click an image or `View prompt`.
3. Confirm `post.html?id=...` opens.
4. Confirm the full image, title, description, prompt, tool, model, category, tags, aspect ratio, likes, saves, rating, and comments preview appear.
5. Click `Copy prompt`.
6. Confirm a small toast says the prompt was copied.
7. Click `Like` and `Save`.
8. Confirm the demo counts update.
9. Click a similar post.
10. Confirm another details page opens.

## Common Errors And Fixes

`The details page is blank`

Make sure `post.html` includes these scripts near the bottom:

```html
<script src="./assets/js/demo-data.js"></script>
<script src="./assets/js/post.js"></script>
```

`Clicking a homepage image does nothing`

Make sure `index.html` includes:

```html
<script src="./assets/js/demo-data.js"></script>
<script src="./assets/js/home.js"></script>
```

`Copy prompt does not work`

Some browsers limit clipboard access when opening files directly. The fallback copy method is included, but if your browser still blocks it, test with VS Code Live Server.

`The image is not the same every time`

This phase still uses temporary demo image URLs. Supabase Storage will replace them with uploaded admin images later.

## Next Phase

Phase 5 will set up Supabase:

- project URL and anon key placeholders
- database table SQL
- storage bucket plan
- safe frontend connection file
- beginner setup instructions
