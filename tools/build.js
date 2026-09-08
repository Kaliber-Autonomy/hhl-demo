/* Static page builder for the Halifax Holland Line demo site.
   Usage:  node tools/build.js

   Four locales across two regional branches:

     en-CA  ->  site/          Canada, English   (canonical; the original URL)
     fr-CA  ->  site/fr-ca/    Canada, French
     de-DE  ->  site/de-de/    Germany, German
     en-DE  ->  site/en-de/    Germany, English

   Chrome strings come from tools/i18n/<code>.json. Page bodies come from
   tools/pages/<dir>/<page>.html; a page missing from a locale falls back to
   the en-CA body with a notice in the reader's own language, so navigation
   never dead-ends.                                                          */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(__dirname, 'pages');
const I18N = path.join(__dirname, 'i18n');
const OUT = path.join(ROOT, 'site');

const BRAND = 'Halifax Holland Line';
const SITE = process.env.HHL_SITE_URL || 'https://kaliber-autonomy.github.io/hhl-demo';

/* This is a demonstration of a company that does not trade. Letting it be
   indexed would put a fictional shipping line into search results as though
   it were real, so every page ships noindex unless explicitly overridden. */
const ROBOTS = process.env.HHL_ROBOTS || 'noindex, nofollow';

const INLINE_JS = "document.documentElement.className += ' js';";
const INLINE_JS_HASH = crypto.createHash('sha256').update(INLINE_JS, 'utf8').digest('base64');

const LOCALES = [
  { code: 'en-CA', dir: '',      lang: 'en-CA', region: 'ca', primary: true },
  { code: 'fr-CA', dir: 'fr-ca', lang: 'fr-CA', region: 'ca' },
  { code: 'de-DE', dir: 'de-de', lang: 'de-DE', region: 'de' },
  { code: 'en-DE', dir: 'en-de', lang: 'en-DE', region: 'de' },
];
const BASE = LOCALES[0];

/* Pages carrying a full translation in every locale. Everything else is
   built from the English body with a notice. */
const CORE = ['index', 'services', 'schedule', 'tracking', 'contact', 'bremerhaven'];

const S = {};
for (const L of LOCALES) S[L.code] = JSON.parse(fs.readFileSync(path.join(I18N, L.code + '.json'), 'utf8'));

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

/* Path from a locale's directory back to the site root. */
function up(L) { return L.dir ? '../' : ''; }

/* Same page, other locale. Used by the switcher and by hreflang. */
function altHref(L, file, from) { return up(from) + (L.dir ? L.dir + '/' : '') + file; }

function navHTML(t, active, A) {
  const panel = [
    ['services.html#ocean', t.svcOcean, t.svcOceanD],
    ['services.html#customs', t.svcCustoms, t.svcCustomsD],
    ['services.html#warehouse', t.svcWarehouse, t.svcWarehouseD],
    ['services.html#inland', t.svcInland, t.svcInlandD],
    ['services.html#project', t.svcProject, t.svcProjectD],
    ['services.html#reefer', t.svcReefer, t.svcReeferD],
  ].map(p => `<a href="${p[0]}"><span class="t">${p[1]}</span><span class="d">${p[2]}</span></a>`).join('\n            ');

  /* Four top-level items only. Network lives in the footer, the drawer and
     the services panel; a fifth item wrapped the bar onto two lines. */
  const plain = [
    ['bremerhaven.html', t.navBremerhaven, 'bremerhaven'],
    ['schedule.html', t.navScheduleShort || t.navSchedule, 'schedule'],
    ['about.html', t.navCompany, 'about'],
  ].map(i => `<a href="${i[0]}"${active === i[2] ? ' aria-current="page"' : ''}>${i[1]}</a>`).join('\n        ');

  return `<div class="navitem">
          <button type="button">${t.navServices}<svg class="chev" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg></button>
          <div class="navpanel">
            ${panel}
            <div class="navpanel__foot">
              <a class="link-arrow" href="network.html">${t.drawerNetwork}</a>
              <a class="link-arrow" href="contact.html">${t.navPanelCta}</a>
            </div>
          </div>
        </div>
        ${plain}`;
}

/* Region and language picker. Every locale reachable from every page. */
function switcher(cur, file) {
  const items = LOCALES.map(L => {
    const s = S[L.code];
    const on = L.code === cur.code;
    return `<a href="${altHref(L, file, cur)}" hreflang="${L.lang}" lang="${L.lang}"${on ? ' aria-current="true"' : ''}>
              <span class="langpick__region">${s.regionName}</span>
              <span class="langpick__lang">${s.langName}</span>
            </a>`;
  }).join('\n            ');
  const t = S[cur.code];
  return `<div class="langpick navitem">
        <button type="button" aria-label="${t.chooseLanguage}">
          <span class="langpick__flag" aria-hidden="true">${cur.region === 'de' ? 'DE' : 'CA'}</span>
          ${t.langName}
          <svg class="chev" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>
        <div class="navpanel langpick__panel">
            ${items}
        </div>
      </div>`;
}

function header(L, active, file) {
  const t = S[L.code], A = up(L);
  return `<div class="utilbar">
    <div class="wrap">
      <div class="utilbar-left">
        <span class="flex items-center gap-1"><span class="dot"></span> ${t.statusOk}</span>
        <span class="sep hide-sm"></span>
        <span class="hide-sm">Halifax +1 902 555 0100</span>
      </div>
      <div class="utilbar-right">
        <a href="tracking.html">${t.trackTop}</a>
        <span class="sep"></span>
        <a href="contact.html">${t.clientLogin}</a>
        <span class="sep"></span>
        ${switcher(L, file)}
      </div>
    </div>
  </div>

  <header class="masthead">
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="${BRAND}">
        ${markDark}
        <span class="brand__text">
          <span class="brand__name">Halifax Holland Line</span>
          <span class="brand__sub">${t.tagline}</span>
        </span>
      </a>

      <nav class="mainnav" aria-label="${t.navMain}">
        ${navHTML(t, active, A)}
      </nav>

      <div class="nav-cta">
        <a class="btn btn--ghost btn--sm" href="tracking.html">${t.navTrack}</a>
        <a class="btn btn--sm" href="quote.html">${t.navQuote}</a>
      </div>

      <button class="navtoggle" type="button" aria-expanded="false" aria-controls="drawer" aria-label="${t.navMenu}"><span></span></button>
    </div>
  </header>

  <div class="drawer" id="drawer">
    <p class="drawer__group">${t.drawerServices}</p>
    <a href="services.html">${t.drawerAll}</a>
    <a href="services.html#ocean">${t.svcOcean}</a>
    <a href="services.html#customs">${t.svcCustoms}</a>
    <a href="services.html#warehouse">${t.svcWarehouse}</a>
    <a href="services.html#inland">${t.svcInland}</a>
    <p class="drawer__group">${t.drawerCompany}</p>
    <a href="bremerhaven.html">${t.navBremerhaven}</a>
    <a href="network.html">${t.drawerNetwork}</a>
    <a href="schedule.html">${t.navSchedule}</a>
    <a href="about.html">${t.drawerAbout}</a>
    <a href="contact.html">${t.drawerContact}</a>
    <p class="drawer__group">${t.drawerTools}</p>
    <a href="tracking.html">${t.trackTop}</a>
    <a href="quote.html">${t.navQuote}</a>
    <p class="drawer__group">${t.chooseLanguage}</p>
    ${LOCALES.map(o => `<a href="${altHref(o, file, L)}" hreflang="${o.lang}" lang="${o.lang}">${S[o.code].regionName} — ${S[o.code].langName}</a>`).join('\n    ')}
  </div>`;
}

function footer(L) {
  const t = S[L.code];
  return `<footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html" aria-label="${BRAND}">
            ${markLight}
            <span class="brand__text">
              <span class="brand__name">Halifax Holland Line</span>
              <span class="brand__sub">${t.tagline}</span>
            </span>
          </a>
          <p class="mt-3" style="max-width:34ch">${t.footBlurb}</p>
          <p class="tiny" style="color:#7793AF">${t.footLicence}</p>
        </div>
        <div>
          <h4>${t.footServices}</h4>
          <ul>
            <li><a href="services.html#ocean">${t.svcOcean}</a></li>
            <li><a href="services.html#customs">${t.svcCustoms}</a></li>
            <li><a href="services.html#warehouse">${t.svcWarehouse}</a></li>
            <li><a href="services.html#inland">${t.svcInland}</a></li>
            <li><a href="services.html#reefer">${t.svcReefer}</a></li>
            <li><a href="services.html#project">${t.svcProject}</a></li>
          </ul>
        </div>
        <div>
          <h4>${t.footOperations}</h4>
          <ul>
            <li><a href="schedule.html">${t.navSchedule}</a></li>
            <li><a href="tracking.html">${t.trackTop}</a></li>
            <li><a href="bremerhaven.html">${t.navBremerhaven}</a></li>
            <li><a href="network.html">${t.footPorts}</a></li>
            <li><a href="quote.html">${t.navQuote}</a></li>
          </ul>
        </div>
        <div>
          <h4>${t.footCompany}</h4>
          <ul>
            <li><a href="about.html">${t.drawerAbout}</a></li>
            <li><a href="about.html#leadership">${t.footLeadership}</a></li>
            <li><a href="about.html#news">${t.footNews}</a></li>
            <li><a href="contact.html">${t.drawerContact}</a></li>
            <li><a href="contact.html#careers">${t.footCareers}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__offices">
        <div>
          <h4>${t.officeCanada}</h4>
          <p class="mb-0">${t.officeCanadaLines}<br><span class="tiny">${t.addressPending}</span></p>
          <p class="mt-1 mb-0">+1 902 555 0100 · <a href="mailto:halifax@example.com">halifax@example.com</a></p>
        </div>
        <div>
          <h4>${t.officeGermany}</h4>
          <p class="mb-0">${t.officeGermanyLines}<br><span class="tiny">${t.addressPending}</span></p>
          <p class="mt-1 mb-0"><a href="mailto:bremerhaven@example.com">bremerhaven@example.com</a></p>
        </div>
        <div>
          <h4>${t.officeNetherlands}</h4>
          <p class="mb-0">${t.officeNetherlandsLines}<br><span class="tiny">${t.addressPending}</span></p>
          <p class="mt-1 mb-0"><a href="mailto:rotterdam@example.com">rotterdam@example.com</a></p>
        </div>
      </div>

      <div class="footer__legal">
        <span>&copy; <span data-year>2026</span> ${BRAND}. <b>${t.footDemo}</b> <a href="sources.html">${t.footSources}</a></span>
        <nav aria-label="Legal">
          <a href="sources.html">${t.footSources}</a>
          <a href="contact.html">${t.footPrivacy}</a>
          <a href="contact.html">${t.footTerms}</a>
          <a href="contact.html">${t.footAccess}</a>
        </nav>
      </div>
    </div>
  </footer>

  <button class="totop" type="button" aria-label="${t.backToTop}">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>

  <div class="consent" role="region" aria-label="${t.consentTitle}" hidden>
    <p><b>${t.consentTitle}</b></p>
    <p class="small">${t.consentBody}</p>
    <div class="btn-row">
      <button class="btn btn--sm" type="button" data-consent="ok">${t.consentOk}</button>
      <a class="btn btn--ghost btn--sm" href="contact.html">${t.consentPolicy}</a>
    </div>
  </div>`;
}

function page(L, meta, body, translated) {
  const t = S[L.code], A = up(L);
  const title = meta.title === BRAND ? meta.title : `${meta.title} | ${BRAND}`;
  const selfUrl = `${SITE}/${L.dir ? L.dir + '/' : ''}${meta.file}`;

  const alternates = LOCALES.map(o =>
    `<link rel="alternate" hreflang="${o.lang}" href="${SITE}/${o.dir ? o.dir + '/' : ''}${meta.file}">`
  ).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE}/${meta.file}">`;

  const notice = translated ? '' : `
<div class="wrap" style="padding-top:1.4rem">
  <div class="notice" lang="${L.lang}">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5M12 7.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <div><p><b>${t.fallbackTitle}</b></p><p class="mb-0">${t.fallbackBody}</p></div>
  </div>
</div>`;

  /* Bodies are written for the root locale, so asset URLs are root-relative
     to it. In a locale subdirectory they need one level up. */
  const fixed = L.dir ? body.replace(/(["'(])assets\//g, '$1../assets/') : body;

  return `<!doctype html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'sha256-${INLINE_JS_HASH}'; connect-src 'none'; frame-src 'none'; object-src 'none'; manifest-src 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="${ROBOTS}">
<title>${title}</title>
<meta name="description" content="${meta.desc}">
<meta name="theme-color" content="#08203A">
<link rel="canonical" href="${selfUrl}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="${L.lang.replace('-', '_')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:image" content="${SITE}/assets/img/ocean-aerial-ship.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${A}assets/favicon.ico" sizes="32x32">
<link rel="icon" href="${A}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${A}assets/apple-touch-icon.png">
<link rel="manifest" href="${A}site.webmanifest">
<link rel="stylesheet" href="${A}assets/css/fonts.css">
<link rel="stylesheet" href="${A}assets/css/site.css">
<script>${INLINE_JS}</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"${BRAND}","url":"${SITE}","description":"Weekly ocean freight and customs brokerage between Halifax, Bremerhaven and Rotterdam.","areaServed":[{"@type":"Place","name":"Halifax, Nova Scotia, Canada"},{"@type":"Place","name":"Bremerhaven, Germany"},{"@type":"Place","name":"Rotterdam, the Netherlands"}]}
</script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>

${header(L, meta.nav || '', meta.file)}

<main id="main">
${notice}
${fixed.trim()}
</main>

${footer(L)}

<script src="${A}assets/js/i18n/${L.code}.js"></script>
<script src="${A}assets/js/data.js"></script>
<script src="${A}assets/js/site.js"></script>
</body>
</html>
`;
}

/* ---- runtime strings, so the schedule and tracker speak the same language ---- */
function writeRuntimeStrings() {
  const dir = path.join(OUT, 'assets', 'js', 'i18n');
  fs.mkdirSync(dir, { recursive: true });
  for (const L of LOCALES) {
    const s = S[L.code];
    const out = {};
    for (const k of Object.keys(s)) if (k.startsWith('js')) out[k] = s[k];
    out.locale = L.lang;
    fs.writeFileSync(path.join(dir, L.code + '.js'),
      '/* Generated by tools/build.js. Runtime strings for ' + L.code + '. */\n' +
      'window.HHL_STRINGS = ' + JSON.stringify(out, null, 2) + ';\n', 'utf8');
  }
  console.log('  runtime strings for', LOCALES.length, 'locales');
}

/* ---- run ---- */
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
writeRuntimeStrings();

const baseDir = path.join(PAGES, 'en-ca');
const allPages = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
let built = 0;

for (const L of LOCALES) {
  const outDir = L.dir ? path.join(OUT, L.dir) : OUT;
  fs.mkdirSync(outDir, { recursive: true });
  const localeDir = path.join(PAGES, L.dir || 'en-ca');

  for (const f of allPages) {
    const stem = f.replace(/\.html$/, '');
    const localFile = path.join(localeDir, f);
    const translated = L.primary || fs.existsSync(localFile);
    if (!translated && CORE.includes(stem)) {
      console.error(`  !! ${L.code}/${f} is a core page but has no translation`);
    }
    const raw = fs.readFileSync(translated ? localFile : path.join(baseDir, f), 'utf8');
    const m = raw.match(/^<!--(\{[\s\S]*?\})-->/);
    if (!m) { console.error('  skipped (no front matter):', f); continue; }
    const meta = JSON.parse(m[1]);
    meta.file = f;
    fs.writeFileSync(path.join(outDir, f), page(L, meta, raw.slice(m[0].length), translated), 'utf8');
    built++;
  }
  console.log(`  ${L.code.padEnd(6)} -> ${(L.dir || '/').padEnd(7)} ${allPages.length} pages`);
}
console.log(`\n${built} pages across ${LOCALES.length} locales written to site/`);
