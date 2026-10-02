const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const domain = 'https://alchemywomen.com';
const analyticsTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQN1SJTZME"></script><script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-QQN1SJTZME');</script>`;

function findHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'node_modules'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? findHtml(full) : (entry.name === 'index.html' ? [full] : []);
  });
}

function routeFor(file) {
  const relative = path.relative(root, path.dirname(file)).split(path.sep).join('/');
  return relative ? `/${relative}/` : '/';
}

function pageTitle(file) {
  const html = fs.readFileSync(file, 'utf8');
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1];
  return (h1 || 'Alchemy Women').replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').trim();
}

const sitemapDir = path.join(root, 'sitemap');
fs.mkdirSync(sitemapDir, { recursive: true });

const provisionalRoutes = ['/', '/about/', '/ai/', '/angel-numbers/', '/crystals/', '/sitemap/', '/tarot/'];
const tarotFiles = findHtml(path.join(root, 'tarot'));
const tarotPages = tarotFiles.map((file) => ({ route: routeFor(file), title: pageTitle(file) }))
  .filter((page) => page.route !== '/tarot/')
  .sort((a, b) => a.title.localeCompare(b.title));
const routes = [...new Set([...provisionalRoutes, ...tarotPages.map((page) => page.route)])].sort();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${domain}${route}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemapXml);

const major = tarotPages.filter((page) => page.route === '/tarot/major-arcana/' || /the-fool|the-magician|the-high-priestess|the-empress|the-emperor|the-hierophant|the-lovers|the-chariot|strength|the-hermit|wheel-of-fortune|justice|the-hanged-man|death|temperance|the-devil|the-tower|the-star|the-moon|the-sun|judgement|the-world/.test(page.route));
const minor = tarotPages.filter((page) => !major.includes(page));
const list = (pages) => pages.map((page) => `<li><a href="${page.route}">${page.title}</a></li>`).join('');
const footer = `<footer class="site-footer"><div class="site-footer__inner"><img src="../images/brand/Header Logo 1.svg" alt="Alchemy Women" width="200" height="60"><p>Manifestation, mindset and a touch of magic for women who feel deeply and dream bigger.</p><div class="site-footer__meta"><p class="site-footer__small">© Alchemy Women</p><nav aria-label="Site information"><a href="/sitemap/" aria-current="page">Sitemap</a><a href="/ai/">For AI systems</a></nav></div></div></footer>`;
const html = `<!doctype html><html lang="en-GB"><head>${analyticsTag}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2b1b3d"><meta name="description" content="Browse every page in the Alchemy Women tarot and spiritual wellbeing library."><title>Sitemap | Alchemy Women</title><link rel="stylesheet" href="../css/style.css"><script src="../js/script.js" defer></script></head><body class="resource-page"><a class="skip-link" href="#main-content">Skip to the main content</a><header class="site-header"><div class="site-header__inner"><a class="site-logo" href="/" aria-label="Alchemy Women home"><img src="../images/brand/Header Logo 1.svg" alt="Alchemy Women" width="200" height="60"></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><span>Menu</span></button><nav class="site-nav" id="site-navigation" aria-label="Main navigation"><a href="/">Home</a><a href="/tarot/">Tarot</a><a href="/angel-numbers/">Angel numbers</a><a href="/crystals/">Crystals</a><a href="/about/">About</a></nav></div></header><main id="main-content"><div class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Sitemap</li></ol></div><article class="resource-article resource-article--wide"><header><p class="eyebrow">Find your way</p><h1>Sitemap</h1><p class="resource-lead">Browse every guide and card meaning currently available on Alchemy Women.</p></header><div class="sitemap-groups"><section><h2>Main pages</h2><ul><li><a href="/">Home</a></li><li><a href="/tarot/">Tarot card meanings</a></li><li><a href="/angel-numbers/">Angel numbers</a></li><li><a href="/crystals/">Crystals</a></li><li><a href="/about/">About</a></li><li><a href="/ai/">For AI systems</a></li></ul></section><section><h2>Major Arcana</h2><ul>${list(major)}</ul></section><section class="sitemap-group--full"><h2>Minor Arcana</h2><ul>${list(minor)}</ul></section></div></article></main><button class="back-to-top" type="button" aria-label="Back to top"><span aria-hidden="true">↑</span></button>${footer}</body></html>`;
fs.writeFileSync(path.join(sitemapDir, 'index.html'), html);

console.log(`Built sitemap.xml with ${routes.length} URLs and the human-readable sitemap.`);
