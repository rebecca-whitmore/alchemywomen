const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'content', 'tarot', 'major-arcana');
const outputDir = path.join(root, 'tarot');
const analyticsTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQN1SJTZME"></script><script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-QQN1SJTZME');</script>`;
const withAnalytics = (html) => html.replace('<head>', `<head>${analyticsTag}`);

const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function parseFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const [, frontmatter, body] = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/) || [];
  if (!frontmatter) throw new Error(`Invalid frontmatter: ${file}`);
  const data = {};
  let activeList;
  frontmatter.split(/\r?\n/).forEach((line) => {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && activeList) return data[activeList].push(listItem[1]);
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!field) return;
    const [, key, value] = field;
    if (!value) {
      data[key] = [];
      activeList = key;
    } else {
      data[key] = /^\d+$/.test(value) ? Number(value) : value;
      activeList = undefined;
    }
  });
  const sections = {};
  body.split(/^## /m).slice(1).forEach((chunk) => {
    const newline = chunk.indexOf('\n');
    const title = chunk.slice(0, newline).trim();
    sections[title] = chunk.slice(newline + 1).trim();
  });
  return { ...data, sections };
}

function inline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function paragraphs(markdown, lead = false) {
  return markdown.split(/\r?\n\s*\r?\n/).map((block, index) => {
    const quote = block.match(/^>\s*(.+)$/s);
    if (quote) return `<blockquote>${inline(quote[1].trim())}</blockquote>`;
    return `<p${lead && index === 0 ? ' class="section-lead"' : ''}>${inline(block.replace(/\r?\n/g, ' ').trim())}</p>`;
  }).join('\n');
}

const cards = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.md'))
  .map((file) => parseFile(path.join(sourceDir, file)))
  .sort((a, b) => a.card_number - b.card_number);

const sharedHeader = `
    <a class="skip-link" href="#main-content">Skip to the main content</a>
    <header class="site-header">
      <div class="site-header__inner">
        <a class="site-logo" href="../../index.html" aria-label="Alchemy Women home"><img src="../../images/brand/Header Logo 1.svg" alt="Alchemy Women" width="200" height="60"></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><span>Menu</span></button>
        <nav class="site-nav" id="site-navigation" aria-label="Main navigation"><a href="../../index.html">Home</a><a href="../">Tarot</a><a href="../../angel-numbers/">Angel numbers</a><a href="../../crystals/">Crystals</a><a href="../../about/">About</a></nav>
      </div>
    </header>`;

const sharedFooter = `
    <button class="back-to-top" type="button" aria-label="Back to top"><span aria-hidden="true">↑</span></button>
    <footer class="site-footer"><div class="site-footer__inner"><img src="../../images/brand/Header Logo 1.svg" alt="Alchemy Women" width="200" height="60"><p>Manifestation, mindset and a touch of magic for women who feel deeply and dream bigger.</p><div class="site-footer__meta"><p class="site-footer__small">© Alchemy Women</p><nav aria-label="Site information"><a href="/sitemap/">Sitemap</a><a href="/ai/">For AI systems</a></nav></div></div></footer>`;

const sectionConfig = [
  ['Detailed upright meaning', 'upright-meaning', (c) => `When ${c.title} appears upright`],
  ['Detailed reversed meaning', 'reversed-meaning', (c) => `When ${c.title} appears reversed`],
  ['Love and relationships', 'love', (c) => `${c.title} in love`],
  ['Career and money', 'career', (c) => `${c.title} at work`],
  ['Spiritual guidance', 'spiritual', (c) => `${c.title} as spiritual guidance`],
  ['Imagery and symbolism', 'symbolism', () => 'Reading the traditional image']
];

function page(card, index) {
  const quick = paragraphs(card.sections['Quick meaning']);
  const groups = (label, values) => `<div class="keyword-group"><h2>${label}</h2><ul class="keyword-list" aria-label="${label} keywords">${values.map((word) => `<li>${escapeHtml(word)}</li>`).join('')}</ul></div>`;
  const sections = sectionConfig.map(([title, id, kicker]) => {
    const content = paragraphs(card.sections[title], true);
    if (id === 'symbolism') return `<section id="${id}" class="meaning-section meaning-section--symbolism"><div><p class="section-kicker">${kicker(card)}</p><h2>${title}</h2>${content}</div><img src="../../${card.image}" alt="Details in ${escapeHtml(card.title)} tarot card artwork" width="300" height="527" loading="lazy"></section>`;
    return `<section id="${id}" class="meaning-section"><p class="section-kicker">${kicker(card)}</p><h2>${title}</h2>${content}</section>`;
  }).join('\n');
  const reflection = card.sections['A reflective question'].replace(/^>\s*/, '').trim();
  const previous = cards[index - 1];
  const next = cards[index + 1];
  const pagination = [previous ? `<a href="/tarot/${previous.slug}/"><span>Previous card</span><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>', `<a class="card-pagination__all" href="/tarot/major-arcana/">View all Major Arcana</a>`, next ? `<a class="card-pagination__next" href="/tarot/${next.slug}/"><span>Next card</span><strong>${escapeHtml(next.title)} →</strong></a>` : '<span></span>'].join('');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="${escapeHtml(card.seo_description)}"><title>${escapeHtml(card.seo_title)}</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-page">${sharedHeader}
    <main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/tarot/">Tarot</a></li><li><a href="/tarot/major-arcana/">Major Arcana</a></li><li aria-current="page">${escapeHtml(card.title)}</li></ol></div>
      <section class="card-hero" aria-labelledby="card-title"><div class="card-hero__art"><div class="tarot-card-frame"><img src="../../${card.image}" alt="${escapeHtml(card.title)} from the Rider–Waite–Smith tarot deck" width="300" height="527"></div></div><div class="card-hero__copy"><p class="eyebrow">Major Arcana</p><h1 id="card-title">${escapeHtml(card.title)}</h1><div class="quick-meaning">${quick}</div><div class="keyword-groups">${groups('Upright', card.upright_keywords)}${groups('Reversed', card.reversed_keywords)}</div></div></section>
      <div class="card-reading-layout"><aside class="section-nav" aria-label="On this page"><p class="section-nav__title">On this page</p><nav>${sectionConfig.map(([title, id]) => `<a href="#${id}">${title.replace('Detailed ', '').replace(' and ', ' &amp; ')}</a>`).join('')}<a href="#reflection">Reflective question</a></nav></aside><article class="card-meaning">${sections}<section id="reflection" class="reflection-card"><span class="reflection-card__sparkle" aria-hidden="true">✦</span><p class="section-kicker">Your moment of reflection</p><h2>${inline(reflection)}</h2><p>You might like to sit with this question, write without editing for a few minutes, or simply notice what answer keeps returning.</p></section></article></div><nav class="card-pagination" aria-label="Tarot card navigation">${pagination}</nav></main>${sharedFooter}</body></html>`;
}

cards.forEach((card, index) => {
  const dir = path.join(outputDir, card.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), withAnalytics(page(card, index)));
});

const cardGrid = cards.map((card) => `<article class="library-card" data-card="${escapeHtml(`${card.title} ${card.upright_keywords.join(' ')} ${card.reversed_keywords.join(' ')}`.toLowerCase())}"><a href="/tarot/${card.slug}/"><img src="../../${card.image}" alt="${escapeHtml(card.title)} tarot card" width="300" height="527" loading="lazy"><div class="library-card__copy"><p>Major Arcana</p><h2>${escapeHtml(card.title)}</h2></div></a></article>`).join('\n');
const indexHtml = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="Explore all 22 Major Arcana tarot cards, with original upright and reversed meanings, symbolism and reflective questions."><title>Major Arcana Tarot Card Meanings | Alchemy Women</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-library-page">${sharedHeader}<main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="../../index.html">Home</a></li><li><a href="../">Tarot</a></li><li aria-current="page">Major Arcana</li></ol></div><section class="library-hero"><p class="eyebrow">The tarot library</p><h1>Major Arcana</h1><p>The 22 Major Arcana cards explore the larger themes, turning points and inner lessons that shape a human life. Begin with the card that drew you here, or browse the full journey from The Fool to The World.</p><label class="card-search"><span>Search the Major Arcana</span><input type="search" placeholder="start typing..." data-card-search></label><p class="search-status" aria-live="polite"><span data-result-count>${cards.length}</span> cards</p></section><section class="library-grid" aria-label="Major Arcana cards">${cardGrid}</section><div class="library-empty" hidden><h2>No cards found</h2><p>Try another card name or theme.</p></div></main>${sharedFooter}</body></html>`;
fs.mkdirSync(path.join(outputDir, 'major-arcana'), { recursive: true });
fs.writeFileSync(path.join(outputDir, 'major-arcana', 'index.html'), withAnalytics(indexHtml));
console.log(`Built ${cards.length} card pages and the Major Arcana index.`);

const minorSourceDir = path.join(root, 'content', 'tarot', 'minor-arcana');
const suitDetails = [
  { slug: 'cups', name: 'Cups', title: 'Cups: The emotional landscape', description: 'Explore feeling, intuition, relationships and the ways your inner world shapes connection. Cups invite you to meet emotion with honesty, tenderness and discernment.' },
  { slug: 'pentacles', name: 'Pentacles', title: 'Pentacles: The grounded path', description: 'Explore work, resources, the body and the practical foundations that support everyday life. Pentacles bring attention to what you build, tend and value over time.' },
  { slug: 'swords', name: 'Swords', title: 'Swords: The realm of thought', description: 'Explore communication, choice, truth and the stories your mind creates around experience. Swords invite clarity without asking you to leave compassion behind.' },
  { slug: 'wands', name: 'Wands', title: 'Wands: The creative spark', description: 'Explore inspiration, courage, ambition and the energy that moves an idea into action. Wands ask how you use your fire without letting it consume your capacity.' }
];

const minorSuits = suitDetails.map((suit) => ({
  ...suit,
  cards: fs.readdirSync(path.join(minorSourceDir, suit.slug))
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseFile(path.join(minorSourceDir, suit.slug, file)))
    .sort((a, b) => a.card_number - b.card_number)
}));

function minorPage(card, suit, index) {
  const quick = paragraphs(card.sections['Quick meaning']);
  const groups = (label, values) => `<div class="keyword-group"><h2>${label}</h2><ul class="keyword-list" aria-label="${label} keywords">${values.map((word) => `<li>${escapeHtml(word)}</li>`).join('')}</ul></div>`;
  const sections = sectionConfig.map(([title, id, kicker]) => {
    const content = paragraphs(card.sections[title], true);
    if (id === 'symbolism') return `<section id="${id}" class="meaning-section meaning-section--symbolism"><div><p class="section-kicker">${kicker(card)}</p><h2>${title}</h2>${content}</div><img src="../../${card.image}" alt="Details in ${escapeHtml(card.title)} tarot card artwork" width="300" height="527" loading="lazy"></section>`;
    return `<section id="${id}" class="meaning-section"><p class="section-kicker">${kicker(card)}</p><h2>${title}</h2>${content}</section>`;
  }).join('\n');
  const reflection = card.sections['A reflective question'].replace(/^>\s*/, '').trim();
  const previous = suit.cards[index - 1];
  const next = suit.cards[index + 1];
  const pagination = [
    previous ? `<a href="/tarot/${previous.slug}/"><span>Previous card</span><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>',
    '<a class="card-pagination__all" href="/tarot/minor-arcana/">View all Minor Arcana</a>',
    next ? `<a class="card-pagination__next" href="/tarot/${next.slug}/"><span>Next card</span><strong>${escapeHtml(next.title)} →</strong></a>` : '<span></span>'
  ].join('');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="${escapeHtml(card.seo_description)}"><title>${escapeHtml(card.seo_title)}</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-page">${sharedHeader}
    <main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/tarot/">Tarot</a></li><li><a href="/tarot/minor-arcana/">Minor Arcana</a></li><li><a href="/tarot/minor-arcana/#${suit.slug}">${suit.name}</a></li><li aria-current="page">${escapeHtml(card.title)}</li></ol></div>
      <section class="card-hero" aria-labelledby="card-title"><div class="card-hero__art"><div class="tarot-card-frame"><img src="../../${card.image}" alt="${escapeHtml(card.title)} from the Rider–Waite–Smith tarot deck" width="300" height="527"></div></div><div class="card-hero__copy"><p class="eyebrow">Minor Arcana · ${suit.name}</p><h1 id="card-title">${escapeHtml(card.title)}</h1><div class="quick-meaning">${quick}</div><div class="keyword-groups">${groups('Upright', card.upright_keywords)}${groups('Reversed', card.reversed_keywords)}</div></div></section>
      <div class="card-reading-layout"><aside class="section-nav" aria-label="On this page"><p class="section-nav__title">On this page</p><nav>${sectionConfig.map(([title, id]) => `<a href="#${id}">${title.replace('Detailed ', '').replace(' and ', ' &amp; ')}</a>`).join('')}<a href="#reflection">Reflective question</a></nav></aside><article class="card-meaning">${sections}<section id="reflection" class="reflection-card"><span class="reflection-card__sparkle" aria-hidden="true">✦</span><p class="section-kicker">Your moment of reflection</p><h2>${inline(reflection)}</h2><p>You might like to sit with this question, write without editing for a few minutes, or simply notice what answer keeps returning.</p></section></article></div><nav class="card-pagination" aria-label="Tarot card navigation">${pagination}</nav></main>${sharedFooter}</body></html>`;
}

minorSuits.forEach((suit) => suit.cards.forEach((card, index) => {
  const dir = path.join(outputDir, card.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), withAnalytics(minorPage(card, suit, index)));
}));

const suitJumpLinks = minorSuits.map((suit) => `<a href="#${suit.slug}">${suit.name}</a>`).join('');
const minorSections = minorSuits.map((suit) => {
  const grid = suit.cards.map((card) => `<article class="library-card" data-card="${escapeHtml(`${card.title} ${suit.name} ${card.upright_keywords.join(' ')} ${card.reversed_keywords.join(' ')}`.toLowerCase())}"><a href="/tarot/${card.slug}/"><img src="../../${card.image}" alt="${escapeHtml(card.title)} tarot card" width="300" height="527" loading="lazy"><div class="library-card__copy"><p>${suit.name}</p><h3>${escapeHtml(card.title)}</h3></div></a></article>`).join('\n');
  return `<section class="minor-suit" id="${suit.slug}" aria-labelledby="${suit.slug}-title"><div class="minor-suit__heading"><div><p class="eyebrow">The suit of ${suit.name}</p><h2 id="${suit.slug}-title">${suit.title}</h2><p>${suit.description}</p></div><a class="suit-back-to-top" href="#minor-arcana-top">Back to top ↑</a></div><div class="library-grid">${grid}</div></section>`;
}).join('\n');

const minorIndexHtml = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="Explore all 56 Minor Arcana tarot cards across Cups, Pentacles, Swords and Wands, with original upright and reversed meanings."><title>Minor Arcana Tarot Card Meanings | Alchemy Women</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-library-page minor-arcana-page">${sharedHeader}<main id="main-content"><div class="breadcrumbs"><ol><li><a href="/">Home</a></li><li><a href="/tarot/">Tarot</a></li><li aria-current="page">Minor Arcana</li></ol></div><section class="library-hero" id="minor-arcana-top"><p class="eyebrow">The tarot library</p><h1>Minor Arcana</h1><p>The 56 Minor Arcana cards bring tarot into the texture of everyday life: your feelings, choices, responsibilities, relationships and creative energy. Browse by suit or search for the card that brought you here.</p><nav class="suit-jump-links" aria-label="Jump to a suit">${suitJumpLinks}</nav><label class="card-search"><span>Search the Minor Arcana</span><input type="search" placeholder="start typing..." data-card-search></label><p class="search-status" aria-live="polite"><span data-result-count>56</span> cards</p></section>${minorSections}<div class="library-empty" hidden><h2>No cards found</h2><p>Try another card name, suit or theme.</p></div></main>${sharedFooter}</body></html>`;
fs.mkdirSync(path.join(outputDir, 'minor-arcana'), { recursive: true });
fs.writeFileSync(path.join(outputDir, 'minor-arcana', 'index.html'), withAnalytics(minorIndexHtml));
console.log('Built 56 card pages and the Minor Arcana index.');
