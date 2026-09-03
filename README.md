# Halifax Holland Line — website demonstration

A working, multi-page website for a Halifax to Netherlands shipping company.
Built to be shown to the client as a functioning site, not a picture of one.

Placeholder brand throughout: **Halifax Holland Line**. Company details,
addresses, telephone numbers, rates and shipment records are invented. Facts
about the ports, the route and the trade rules are researched and cited on
`sources.html`.

---

## Run it

```bash
python -m http.server 4310 --directory site
```

Then open <http://localhost:4310>. There is no build step required to view it,
no dependencies, and no server-side code. Any static host will serve it as is.

## What is here

```
site/                 the website, ready to deploy
  *.html              10 built pages
  assets/css/         one stylesheet, no framework
  assets/js/          data.js (the demo data) + site.js (all behaviour)
  assets/img/         27 photographs, cropped from the generated mockups
tools/
  build.js            assembles pages from the shared chrome + page bodies
  pages/*.html        page content only, with a JSON front-matter line
```

### Editing

Shared header, footer, navigation and `<head>` live in `tools/build.js`.
Page content lives in `tools/pages/`. After changing either, run:

```bash
node tools/build.js
```

That regenerates every file in `site/`. **Do not edit `site/*.html` directly**,
those files are overwritten by the build. Stylesheet, scripts and images in
`site/assets/` are edited in place and are not touched by the build.

### Renaming the company

The name appears in `tools/build.js` (the `BRAND` and `TAGLINE` constants) and
in a handful of page bodies. Change the constants, search `tools/pages/` for the
old name, then rebuild.

---

## Pages

| Page | What it does |
|---|---|
| `index.html` | Hero, live next-sailing widgets, corridor map, services, CETA position, schedule preview, cargo types, trade context, notices |
| `services.html` | Six services in detail, each with its own anchor |
| `network.html` | Route map, how weekly space is secured, port profiles for both ends, inland reach |
| `schedule.html` | Filterable, sortable sailing schedule with remaining space |
| `tracking.html` | Shipment lookup with milestone history and document status |
| `quote.html` | Four-step quote request with validation and a review step |
| `about.html` | Company, how it is licensed and insured, leadership, notices |
| `contact.html` | Both offices, working contact form, policies |
| `sources.html` | Every external fact with its source, and what is demonstration data |
| `404.html` | Not-found page |

## What actually works

Nothing is a picture of a feature. All of the following run in the browser:

- **Sailing schedule** built from `data.js`, filtered by direction, month and
  free-text search, sortable on four columns, paginated by a show-more button.
  Dates are generated relative to today, so the schedule never looks stale.
- **Shipment tracking** with five demonstration consignments. Deep links work:
  `tracking.html?ref=HHL-2041`. Try `HHL-2041` (at sea), `HHL-2115` (customs
  hold), `HHL-1987` (delivered), `HHL-2103` (awaiting loading), or the container
  number `HHLU5560413`.
- **Quote wizard** across four steps with per-field validation, a generated
  reference number and a draft saved to local storage between steps.
- **Contact form** with validation and a success state.
- Mega-menu navigation, mobile drawer, accordions, scroll reveals, animated
  figures, toasts, back-to-top and a cookie notice.

## Verified

- 633 internal links and anchors checked, none broken, plus the external sources.
- No horizontal overflow at 360 px or 1280 px on any of the ten pages.
- No console errors on any page.
- Keyboard reachable throughout, skip link, visible focus rings, `aria-current`
  on the active navigation item, `aria-live` on the tracking result.
- Respects `prefers-reduced-motion`.
- Content is visible with JavaScript disabled; the reveal animation is scoped
  to a `js` class on the root element.
- Image payload 2.8 MB across 27 files.

## Grounding

The factual content is researched and cited on `sources.html`: Halifax and
Rotterdam terminal specifications, the 3,854 nm sea distance, CETA tariff and
origin rules, CARM security requirements, Dutch Article 23 VAT deferment, CFIA
seafood certification, and Canadian export figures. The customs material now
lives on `services.html#customs`; there is no separate tariffs page and no duty
estimator, so the site never quotes a rate of its own.

The company is positioned as a freight forwarder buying contracted weekly slot
space on transatlantic services that already call Halifax, with customs
brokerage as the differentiator and chartered tonnage stated as an ambition
rather than a fact. That is a business somebody could actually start.

Deliberately **not** published: vessel IMO numbers, berth assignments at real
terminals, invented performance percentages, and street addresses inside real
buildings.

## Icons

The favicon is the site's own brand mark: two ports joined by a great-circle
arc, with a red tick at north. `tools/make-favicon.py` renders the whole set at
8x and downsamples, so the curves stay clean:

| File | Used for |
|---|---|
| `favicon.ico` | 16, 32 and 48 px, for tabs, bookmarks and Windows |
| `favicon.svg` | scalable, preferred by modern browsers |
| `apple-touch-icon.png` | 180 px, iOS home screen, full-bleed so iOS can round it |
| `icon-192.png`, `icon-512.png` | Android and installed web app, via `site.webmanifest` |

Below about 32 px the hairline detail and the north tick turn to mush, so the
small sizes render a deliberately bolder, simplified version of the same shape.
Re-run `python tools/make-favicon.py` after any change to the mark.

## Hosting

Published from `site/` on GitHub Pages. The repository is
`Kaliber-Autonomy/hhl-demo` and the live URL is
<https://kaliber-autonomy.github.io/hhl-demo/>.

Every page ships `noindex, nofollow` and `robots.txt` disallows everything, so
the demo never surfaces in search results as a real shipping company. To change
the URL, set `HHL_SITE_URL` before building, or edit the default in
`tools/build.js`, then rebuild and commit.

Security review and the reasoning behind the headers, the self-hosted fonts and
the one accepted risk are in [SECURITY.md](SECURITY.md).

## Before this becomes a real site

1. Replace the placeholder company name, addresses, phone numbers and email.
2. Replace the photography. The current images are cropped from AI-generated
   mockups and are for demonstration only.
3. Point the forms at a real endpoint. They currently do nothing on submit.
4. Replace `data.js` with the operational schedule and tracking feeds.
5. Have the terms of carriage reviewed by maritime counsel, and any customs
   wording checked by a licensed broker.
6. Set the real domain in the canonical, Open Graph and sitemap URLs
   (`SITE` in `tools/build.js`, plus `site/robots.txt` and `site/sitemap.xml`).
7. Run the security audit before go-live.
