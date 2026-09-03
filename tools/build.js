/* Static page builder for the Halifax Holland Line demo site.
   Usage:  node tools/build.js
   Reads tools/pages/*.html (body content + a JSON front-matter comment)
   and writes complete, standalone pages into site/.                        */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(__dirname, 'pages');
const OUT = path.join(ROOT, 'site');

const BRAND = 'Halifax Holland Line';
const TAGLINE = 'Canada · Netherlands ocean freight';
const SITE = process.env.HHL_SITE_URL || 'https://kaliber-autonomy.github.io/hhl-demo';

/* This is a demonstration of a company that does not trade. Letting it be
   indexed would put a fictional shipping line into search results as though
   it were real, so every page ships noindex unless explicitly overridden. */
const ROBOTS = process.env.HHL_ROBOTS || 'noindex, nofollow';

/* One inline script sets a class before first paint so that content is never
   hidden when scripting is off. It is pinned by hash in the CSP rather than
   allowed with 'unsafe-inline'. */
const INLINE_JS = "document.documentElement.className += ' js';";
const INLINE_JS_HASH = crypto.createHash('sha256').update(INLINE_JS, 'utf8').digest('base64');

const markDark = `<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="23" fill="#08203A"/>
        <circle cx="24" cy="24" r="18.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>
        <path d="M10.5 31.8C15.5 21.6 32.4 16.4 38 19.8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>
        <circle cx="10.5" cy="31.8" r="3.1" fill="#fff"/>
        <circle cx="38" cy="19.8" r="3.1" fill="#fff"/>
        <path d="M24 3.4v4.2" stroke="#C8102E" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;

const markLight = `<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="23" fill="#fff"/>
        <circle cx="24" cy="24" r="18.5" fill="none" stroke="#08203A" stroke-opacity=".25" stroke-width="1"/>
        <path d="M10.5 31.8C15.5 21.6 32.4 16.4 38 19.8" fill="none" stroke="#08203A" stroke-width="2.1" stroke-linecap="round"/>
        <circle cx="10.5" cy="31.8" r="3.1" fill="#08203A"/>
        <circle cx="38" cy="19.8" r="3.1" fill="#08203A"/>
        <path d="M24 3.4v4.2" stroke="#C8102E" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`;

const NAV = [
  { href: 'services.html', label: 'Services', key: 'services', panel: [
      ['services.html#ocean', 'Ocean freight', 'A guaranteed weekly slot, whether you fill a box or a pallet'],
      ['services.html#customs', 'Customs and tariffs', 'Classification, origin and both declarations'],
      ['services.html#warehouse', 'Warehousing', 'Bonded space, so duty waits until the goods sell'],
      ['services.html#inland', 'Inland transport', 'Collection and delivery at both ends'],
      ['services.html#project', 'Project and heavy cargo', 'Machinery, breakbulk and anything that will not fit a container'],
      ['services.html#reefer', 'Temperature controlled', 'Reefer positions for seafood and produce']
    ] },
  { href: 'network.html', label: 'Network', key: 'network' },
  { href: 'schedule.html', label: 'Sailing schedule', key: 'schedule' },
  { href: 'about.html', label: 'Company', key: 'about' }
];

function navHTML(active) {
  return NAV.map(item => {
    if (!item.panel) {
      return `<a href="${item.href}"${active === item.key ? ' aria-current="page"' : ''}>${item.label}</a>`;
    }
    const links = item.panel.map(p =>
      `<a href="${p[0]}"><span class="t">${p[1]}</span><span class="d">${p[2]}</span></a>`).join('\n            ');
    return `<div class="navitem">
          <button type="button">${item.label}<svg class="chev" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg></button>
          <div class="navpanel">
            ${links}
            <div class="navpanel__foot">
              <span class="muted">Not sure which service fits? Our team will map it for you.</span>
              <a class="link-arrow" href="contact.html">Talk to us</a>
            </div>
          </div>
        </div>`;
  }).join('\n        ');
}

function header(active) {
  return `<div class="utilbar">
    <div class="wrap">
      <div class="utilbar-left">
        <span class="flex items-center gap-1"><span class="dot"></span> Both ports operating normally</span>
        <span class="sep hide-sm"></span>
        <span class="hide-sm">Halifax +1 902 555 0100</span>
        <span class="sep hide-sm"></span>
        <span class="hide-sm">Rotterdam rotterdam@example.com</span>
      </div>
      <div class="utilbar-right">
        <a href="tracking.html">Track a shipment</a>
        <span class="sep"></span>
        <a href="contact.html">Client login</a>
        <span class="sep"></span>
        <span>EN</span>
      </div>
    </div>
  </div>

  <header class="masthead">
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="${BRAND}, home">
        ${markDark}
        <span class="brand__text">
          <span class="brand__name">Halifax Holland Line</span>
          <span class="brand__sub">${TAGLINE}</span>
        </span>
      </a>

      <nav class="mainnav" aria-label="Main">
        ${navHTML(active)}
      </nav>

      <div class="nav-cta">
        <a class="btn btn--ghost btn--sm" href="tracking.html">Track</a>
        <a class="btn btn--sm" href="quote.html">Request a quote</a>
      </div>

      <button class="navtoggle" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menu"><span></span></button>
    </div>
  </header>

  <div class="drawer" id="drawer">
    <p class="drawer__group">Services</p>
    <a href="services.html">All services</a>
    <a href="services.html#ocean">Ocean freight</a>
    <a href="services.html#customs">Customs and tariffs</a>
    <a href="services.html#warehouse">Warehousing</a>
    <a href="services.html#inland">Inland transport</a>
    <p class="drawer__group">Company</p>
    <a href="network.html">Network and ports</a>
    <a href="schedule.html">Sailing schedule</a>
    <a href="about.html">About us</a>
    <a href="contact.html">Contact</a>
    <p class="drawer__group">Tools</p>
    <a href="tracking.html">Track a shipment</a>
    <a href="quote.html">Request a quote</a>
    <a class="btn btn--block" href="quote.html">Request a quote</a>
  </div>`;
}

function footer() {
  return `<footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html" aria-label="${BRAND}, home">
            ${markLight}
            <span class="brand__text">
              <span class="brand__name">Halifax Holland Line</span>
              <span class="brand__sub">${TAGLINE}</span>
            </span>
          </a>
          <p class="mt-3" style="max-width:34ch">We move containers between Atlantic Canada and the Netherlands, and we handle the customs paperwork at both ends ourselves.</p>
          <p class="tiny" style="color:#7793AF">Freight forwarder and customs broker. Cargo liability and errors and omissions cover in force.</p>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="services.html#ocean">Ocean freight</a></li>
            <li><a href="services.html#customs">Customs and tariffs</a></li>
            <li><a href="services.html#warehouse">Warehousing</a></li>
            <li><a href="services.html#inland">Inland transport</a></li>
            <li><a href="services.html#reefer">Temperature controlled</a></li>
            <li><a href="services.html#project">Project cargo</a></li>
          </ul>
        </div>
        <div>
          <h4>Operations</h4>
          <ul>
            <li><a href="schedule.html">Sailing schedule</a></li>
            <li><a href="tracking.html">Track a shipment</a></li>
            <li><a href="network.html">Ports and network</a></li>
            <li><a href="quote.html">Request a quote</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About us</a></li>
            <li><a href="about.html#leadership">Leadership</a></li>
            <li><a href="about.html#news">News and notices</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="contact.html#careers">Careers</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__offices">
        <div>
          <h4>Halifax, Canada</h4>
          <p class="mb-0">Registered office and Canadian operations<br>Halifax, Nova Scotia<br><span class="tiny">Street address confirmed on incorporation</span></p>
          <p class="mt-1 mb-0">+1 902 555 0100 · <a href="mailto:halifax@example.com">halifax@example.com</a></p>
        </div>
        <div>
          <h4>Rotterdam, the Netherlands</h4>
          <p class="mb-0">European operations and customs<br>Rotterdam, the Netherlands<br><span class="tiny">Street address confirmed on incorporation</span></p>
          <p class="mt-1 mb-0"><a href="mailto:rotterdam@example.com">rotterdam@example.com</a></p>
        </div>
      </div>

      <div class="footer__legal">
        <span>&copy; <span data-year>2026</span> ${BRAND}. <b>Demonstration only &mdash; not a trading company.</b> <a href="sources.html">Sources and disclosures</a></span>
        <nav aria-label="Legal">
          <a href="sources.html">Sources</a>
          <a href="contact.html">Privacy</a>
          <a href="contact.html">Terms of carriage</a>
          <a href="contact.html">Accessibility</a>
          <a href="contact.html">Modern slavery statement</a>
        </nav>
      </div>
    </div>
  </footer>

  <button class="totop" type="button" aria-label="Back to top">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>

  <div class="consent" role="region" aria-label="Cookie notice" hidden>
    <p><b>This demonstration stores nothing about you.</b></p>
    <p class="small">No analytics, no advertising cookies. A single local setting remembers that you have seen this notice.</p>
    <div class="btn-row">
      <button class="btn btn--sm" type="button" data-consent="ok">Understood</button>
      <a class="btn btn--ghost btn--sm" href="contact.html">Privacy policy</a>
    </div>
  </div>`;
}

function page(meta, body) {
  const title = meta.title === BRAND ? meta.title : `${meta.title} | ${BRAND}`;
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'sha256-${INLINE_JS_HASH}'; connect-src 'none'; frame-src 'none'; object-src 'none'; manifest-src 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="${ROBOTS}">
<title>${title}</title>
<meta name="description" content="${meta.desc}">
<meta name="theme-color" content="#08203A">
<link rel="canonical" href="${SITE}/${meta.file}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:image" content="${SITE}/assets/img/ocean-aerial-ship.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/favicon.ico" sizes="32x32">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/site.css">
<script>${INLINE_JS}</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"${BRAND}","url":"${SITE}","description":"Weekly ocean freight and customs brokerage between Halifax, Nova Scotia and Rotterdam, the Netherlands.","areaServed":[{"@type":"Place","name":"Halifax, Nova Scotia, Canada"},{"@type":"Place","name":"Rotterdam, the Netherlands"}]}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

${header(meta.nav || '')}

<main id="main">
${body.trim()}
</main>

${footer()}

<script src="assets/js/data.js"></script>
<script src="assets/js/site.js"></script>
</body>
</html>
`;
}

/* ---- run ---- */
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(PAGES).filter(f => f.endsWith('.html'));
let built = 0;
for (const f of files) {
  const raw = fs.readFileSync(path.join(PAGES, f), 'utf8');
  const m = raw.match(/^<!--(\{[\s\S]*?\})-->/);
  if (!m) { console.error('  skipped (no front matter):', f); continue; }
  const meta = JSON.parse(m[1]);
  meta.file = f;
  const body = raw.slice(m[0].length);
  fs.writeFileSync(path.join(OUT, f), page(meta, body), 'utf8');
  built++;
  console.log('  built', f);
}
console.log(`\n${built} page${built === 1 ? '' : 's'} written to site/`);
