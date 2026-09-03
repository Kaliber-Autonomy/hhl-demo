# Halifax Holland Line — working notes

Demo website for a prospective client running ocean freight between Halifax,
Nova Scotia and the Netherlands. Karl took the brief by phone on 2026-09-02.

**Status: demonstration only.** Not deployed, no domain, no real company details.

## The brief

- Blue and white, "military" or "government" looking, mimicking the Government
  of Canada palette. Delivered as navy `#08203A` / white / ice blue, with a
  single Canadian red `#C8102E` hairline used sparingly as an accent.
- The site should read as the interconnecting point between Halifax and Holland.
  That drives the split hero, the corridor map and the paired-port pattern
  repeated throughout.
- The client's angle is the current tariff situation, so customs and duty are
  treated as a first-class service rather than a footnote.

## Architecture

Plain static HTML, CSS and vanilla JS. No framework, no dependencies, no build
tooling beyond one Node script. It opens from any static host or a local server.

**Edit sources, not output.** `site/*.html` is generated.

- `tools/build.js` — shared `<head>`, header, navigation, footer, brand
  constants (`BRAND`, `TAGLINE`, `SITE`) and the inline SVG logo marks.
- `tools/pages/*.html` — page bodies. First line is a JSON front-matter comment
  giving title, meta description and which nav item is current.
- Run `node tools/build.js` after editing either. It rewrites all ten pages.
- `site/assets/**` is hand-edited and never touched by the build.

## Where the images came from

Cropped out of the 48 Higgsfield mockups in
`Desktop\Halifax-Holland Shipping Templates`. Each crop deliberately avoids the
baked-in interface text from those mockups; several early crops caught headline
fragments and had to be retightened, so **check any new crop at full size before
using it**.

Per [[karl-feedback]], AI imagery does not go on production sites. These crops
are for the demo only and must be replaced with real photography before launch.

## The site is grounded, keep it that way

Every external fact is cited on `sources.html`. If you add a claim, add its
source there too. Things deliberately left out, do not reintroduce them:

- **Vessel IMO numbers.** There is a real global register; inventing entries in
  it is worse than leaving the field blank.
- **Berth numbers at real terminals.** Fairview Cove and Maasvlakte are operated
  by other companies. Name the terminal, never a berth.
- **Invented performance percentages.** The old site claimed 99.2% schedule
  integrity in the hero and 98.6% on-time further down the same page.
- **Street addresses inside real buildings.** Purdy's Wharf and Wilhelminakade
  are real; the old JSON-LD asserted invented suite numbers at both to search
  engines.
- **Fabricated certificate numbers** in CFIA, NVWA or CBSA B3 formats.
- **Testimonials.** There are no customers yet.
- **A duty estimator or any published rate.** The tariffs page was removed on
  Karl's instruction. The site points at EU Access2Markets and the Canadian
  Customs Tariff as the authorities and quotes no rate of its own, which also
  removes the risk of a shipper relying on a stale number. Customs content lives
  on `services.html#customs`.

The business is positioned as a freight forwarder holding contracted weekly slot
space, not a vessel owner. Chartered tonnage is stated as an ambition. Do not
quietly upgrade the company to a carrier.

## House style, to keep it from reading as generated

An audit found 24 rule-of-three triads and 30 "not X, but Y" constructions in
the first draft. When editing copy:

- Avoid rhetorical triads, especially in headings and straplines.
- Avoid antithesis as a default sentence shape.
- Vary card copy length on purpose. Uniform 20-word descriptions across six
  cards is a tell.
- No aphoristic closing lines.
- Prefer a checkable number with a source over a confident adjective.

## Gotchas already hit and fixed

Do not reintroduce these:

1. **`.section--navy a { color: #fff }` beats `.btn`** on specificity, which
   rendered light buttons as white-on-white. Fixed with an explicit
   `.section--navy .btn { color: var(--btn-fg) }`. Any new dark section wrapper
   needs the same treatment.
2. **Scroll reveal must be scoped to `.js`** on the root element, otherwise
   content is permanently invisible without JavaScript. There is also a scroll
   and timeout sweep in `initReveal` because some embedded browsers never
   deliver IntersectionObserver callbacks.
3. **Animated counters must settle.** `requestAnimationFrame` stops in a
   throttled or background tab, which froze "99.2%" at "14.0%". `initCounters`
   now forces the final value on a timeout and on `visibilitychange`.
4. **Notices need explicit text colour.** They sit inside dark panels, where
   inheriting white text put white on a pale green background.
5. **The header CTA is hidden below 720px**, otherwise it pushes the hamburger
   toggle off screen.
6. The tools bar overlaps the hero stats by design; `.hero__stats` carries a
   `margin-bottom` to keep the labels clear.

## Verifying in the Claude browser pane

The pane cannot screenshot a scrolled page that has a sticky header; captures
come back blank or with a white band. To inspect a section, hide its siblings
instead of scrolling:

```js
const k=[...document.querySelectorAll('main > *')];
k.forEach((el,n)=>el.style.display=(n===TARGET?'':'none'));
document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in'));
window.scrollTo(0,0);
```

The pane also throttles `requestAnimationFrame`, so animated figures look stuck
in screenshots. Read the DOM to check the real value, not the picture.

## Checks to re-run after changes

- Link and anchor audit across all built pages (633 internal, expect zero broken).
- Horizontal overflow at 360px and 1280px on every page (expect zero).
- Console errors on every page (expect none).
- `/secure-audit` before this ever goes live.

## Open with the client

Name, logo, Dutch port (Rotterdam assumed), cargo types, whether tracking and
online quoting are wanted, how literally to copy the Government of Canada look,
language requirements, domain and budget. The forwarder-versus-carrier question
is settled: forwarder now, chartered tonnage stated as an ambition.
See [[halifax-holland-shipping-project]].
