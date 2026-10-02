# Alchemy Women

A lightweight HTML, CSS and JavaScript website.

## Structure

- `index.html` — homepage markup
- `css/style.css` — global design tokens and site styling
- `js/script.js` — site behaviour
- `mainlogo.png` — primary logo artwork
- `sparkles.png` — transparent decorative layer for the logo
- `images/rider-waite-smith/` — complete 78-card tarot deck and card back
- `content/tarot/` — editable Markdown source for tarot meanings
- `content/site-notices.md` — reusable editorial and safety notices
- `tarot/index.html` — main tarot landing page and route into both libraries
- `angel-numbers/`, `crystals/` and `about/` — branded coming-soon pages

Colours and other reusable design decisions are defined as custom properties at
the top of `css/style.css` so the visual direction can be changed centrally.

## Building the tarot library

The Markdown files in `content/tarot/major-arcana/` and
`content/tarot/minor-arcana/` are the source of truth for both tarot libraries.
After editing them, regenerate the listings and dedicated card pages with:

```powershell
node scripts\build-tarot.js
```

Preview the site locally with `node scripts\preview-server.js`, then open either:

- `http://127.0.0.1:4173/tarot/major-arcana/`
- `http://127.0.0.1:4173/tarot/minor-arcana/`
- `http://127.0.0.1:4173/tarot/`

The newsletter form on the homepage is currently a front-end preview. It does
not send or store visitor details until a form service is connected.
