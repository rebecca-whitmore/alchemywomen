# Alchemy Women

A lightweight HTML, CSS and JavaScript website.

## Structure

- `index.html` — homepage markup
- `css/style.css` — global design tokens and site styling
- `js/script.js` — site behaviour
- `mainlogo.png` — primary logo artwork
- `sparkles.png` — transparent decorative layer for the logo
- `favicon.svg` — browser icon using the Alchemy Women sparkle and palette
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

The updates forms on the homepage and About page submit through Forminit using
the public form ID configured in `js/script.js`.

Google Analytics is enabled sitewide with measurement ID `G-QQN1SJTZME`.
Generated tarot pages inherit the tag from `scripts/build-tarot.js`.

After adding or removing public pages, rebuild the XML and human-readable
sitemaps with:

```powershell
node scripts\build-discovery.js
```

`llms.txt`, `robots.txt` and the `/ai/` guide provide machine-readable and
human-readable discovery information about the site and its editorial scope.
