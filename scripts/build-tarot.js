const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'content', 'tarot', 'major-arcana');
const outputDir = path.join(root, 'tarot');

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
    <footer class="site-footer"><div class="site-footer__inner"><img src="../../images/brand/Header Logo 1.svg" alt="Alchemy Women" width="200" height="60"><p>Manifestation, mindset and a touch of magic for women who feel deeply and dream bigger.</p><p class="site-footer__small">© Alchemy Women</p></div></footer>`;

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
  const pagination = [previous ? `<a href="../${previous.slug}/"><span>Previous card</span><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>', `<a class="card-pagination__all" href="../major-arcana/">View all Major Arcana</a>`, next ? `<a class="card-pagination__next" href="../${next.slug}/"><span>Next card</span><strong>${escapeHtml(next.title)} →</strong></a>` : '<span></span>'].join('');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="${escapeHtml(card.seo_description)}"><title>${escapeHtml(card.seo_title)}</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-page">${sharedHeader}
    <main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="../../index.html">Home</a></li><li><a href="../">Tarot</a></li><li><a href="../major-arcana/">Major Arcana</a></li><li aria-current="page">${escapeHtml(card.title)}</li></ol></div>
      <section class="card-hero" aria-labelledby="card-title"><div class="card-hero__art"><div class="tarot-card-frame"><img src="../../${card.image}" alt="${escapeHtml(card.title)} from the Rider–Waite–Smith tarot deck" width="300" height="527"></div></div><div class="card-hero__copy"><p class="eyebrow">Major Arcana</p><h1 id="card-title">${escapeHtml(card.title)}</h1><div class="quick-meaning">${quick}</div><div class="keyword-groups">${groups('Upright', card.upright_keywords)}${groups('Reversed', card.reversed_keywords)}</div></div></section>
      <div class="card-reading-layout"><aside class="section-nav" aria-label="On this page"><p class="section-nav__title">On this page</p><nav>${sectionConfig.map(([title, id]) => `<a href="#${id}">${title.replace('Detailed ', '').replace(' and ', ' &amp; ')}</a>`).join('')}<a href="#reflection">Reflective question</a></nav></aside><article class="card-meaning">${sections}<section id="reflection" class="reflection-card"><span class="reflection-card__sparkle" aria-hidden="true">✦</span><p class="section-kicker">Your moment of reflection</p><h2>${inline(reflection)}</h2><p>You might like to sit with this question, write without editing for a few minutes, or simply notice what answer keeps returning.</p></section><p class="tarot-notice"><strong>A gentle note:</strong> Tarot is offered as a tool for reflection and personal insight. It does not predict the future or replace professional medical, legal, financial or mental health advice.</p></article></div><nav class="card-pagination" aria-label="Tarot card navigation">${pagination}</nav></main>${sharedFooter}</body></html>`;
}

cards.forEach((card, index) => {
  const dir = path.join(outputDir, card.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(card, index));
});

const cardGrid = cards.map((card) => `<article class="library-card" data-card="${escapeHtml(`${card.title} ${card.upright_keywords.join(' ')} ${card.reversed_keywords.join(' ')}`.toLowerCase())}"><a href="../${card.slug}/"><img src="../../${card.image}" alt="${escapeHtml(card.title)} tarot card" width="300" height="527" loading="lazy"><div class="library-card__copy"><p>Major Arcana</p><h2>${escapeHtml(card.title)}</h2><span>${escapeHtml(card.upright_keywords.slice(0, 3).join(' · '))}</span></div></a></article>`).join('\n');
const indexHtml = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="Explore all 22 Major Arcana tarot cards, with original upright and reversed meanings, symbolism and reflective questions."><title>Major Arcana Tarot Card Meanings | Alchemy Women</title><link rel="stylesheet" href="../../css/style.css"><script src="../../js/script.js" defer></script></head><body class="tarot-library-page">${sharedHeader}<main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="../../index.html">Home</a></li><li><a href="../">Tarot</a></li><li aria-current="page">Major Arcana</li></ol></div><section class="library-hero"><p class="eyebrow">The tarot library</p><h1>Major Arcana</h1><p>The 22 Major Arcana cards explore the larger themes, turning points and inner lessons that shape a human life. Begin with the card that drew you here, or browse the full journey from The Fool to The World.</p><label class="card-search"><span>Search the Major Arcana</span><input type="search" placeholder="Try “change”, “love” or “The Star”" data-card-search></label><p class="search-status" aria-live="polite"><span data-result-count>${cards.length}</span> cards</p></section><section class="library-grid" aria-label="Major Arcana cards">${cardGrid}</section><div class="library-empty" hidden><h2>No cards found</h2><p>Try another card name or theme.</p></div><p class="tarot-notice library-notice"><strong>A gentle note:</strong> Tarot is offered as a tool for reflection and personal insight. It does not predict the future or replace professional advice.</p></main>${sharedFooter}</body></html>`;
fs.mkdirSync(path.join(outputDir, 'major-arcana'), { recursive: true });
fs.writeFileSync(path.join(outputDir, 'major-arcana', 'index.html'), indexHtml);
console.log(`Built ${cards.length} card pages and the Major Arcana index.`);
