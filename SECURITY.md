# Security review

Reviewed 2026-09-03, before publishing to GitHub Pages.

This is a static demonstration site. No backend, no database, no accounts, no
payments, and nothing on it transmits data anywhere. That removes most of the
attack surface before the review starts, so this document is mainly about the
things that remain: injection into the one dynamic surface, third-party data
leakage, and what a static host can and cannot enforce.

---

## What was tested

**Live probe battery** (`.claude/skills/secure-audit/scripts/probe.py`)
59 passed, 6 failed, 0 throttled. All six failures are response-header checks;
each is assessed below.

**Injection sink scan** (`scan-xss.py`)
23 files scanned, no unescaped interpolation into an HTML sink.

**Manual injection testing** against both surfaces that render user input:

| Surface | Payload | Result |
|---|---|---|
| `tracking.html?ref=` | `<img src=x onerror="window.__XSS=1">` | Rendered as text. 0 elements injected, 0 executions. |
| Quote wizard, voyage field via query string | `<img src=x onerror=…>` | Escaped in the review table. No execution. |
| Quote wizard, origin field | `<script>…</script>` | Escaped. No execution. |
| Quote wizard, commodity field | `"><svg onload=…>` | Escaped. No execution. |

All output passes through the `esc()` helper in `site.js` before reaching
`innerHTML`.

**Secrets and stray files**
No credential patterns anywhere in the tree. No `.env`, key, or certificate
files. `.gitignore` blocks them from ever being added.

**Outbound data**
No `fetch`, no `XMLHttpRequest`, no `sendBeacon`, no WebSocket, and no `action`
attribute on any form. Every form calls `preventDefault()` and renders a local
success state. Nothing a visitor types leaves their browser.

---

## What was fixed

**Third-party font loading.** The site loaded Archivo, Inter and IBM Plex Mono
from `fonts.googleapis.com`, which discloses every visitor's IP address to a
third party and has been held to breach the GDPR in at least one European
judgment. All three families are now self-hosted from `assets/fonts/`, subset to
Latin, under the SIL Open Font License. **The site now makes zero third-party
requests on page load.**

**Content Security Policy.** Added as a `<meta http-equiv>` element, since a
static host cannot set response headers:

```
default-src 'none'; base-uri 'none'; form-action 'none';
img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self';
script-src 'self' 'sha256-…'; connect-src 'none'; frame-src 'none';
object-src 'none'; manifest-src 'self'
```

`connect-src 'none'` and `form-action 'none'` mean that even if a script were
somehow injected, it has no route to send anything anywhere. The single inline
script is pinned by SHA-256 hash rather than permitted with `'unsafe-inline'`.

**Referrer policy.** `strict-origin-when-cross-origin`, so the outbound links on
the sources page do not disclose the full referring URL.

**Search indexing.** Every page ships `noindex, nofollow` and `robots.txt`
disallows everything. A fictional shipping line should not appear in search
results as though it were a real business.

**A telephone number that could belong to somebody.** The Canadian numbers use
`+1 902 555 01xx`, which is formally reserved for fiction. The Netherlands has no
equivalent reserved range, so the Rotterdam number was removed rather than risk
publishing a real subscriber's line.

---

## What was claimed but is not true

Per the skill's Rule 0, each probe failure was reproduced before being acted on.

**"Page carries no content-security-policy"** — partly true. The policy ships as
a `<meta>` element, which browsers enforce for every directive used here. Only
`frame-ancestors` is unavailable via meta. See the accepted risk below.

**"Page carries no referrer-policy"** — not true. It is set via
`<meta name="referrer">`, a fully supported mechanism. The probe inspects
response headers only.

**"Page carries no strict-transport-security"** — not true on the real host.
Verified against the live URL: GitHub Pages returns
`strict-transport-security: max-age=31556952`.

**"Page carries no x-content-type-options"** — **true, and I predicted otherwise.**
I expected GitHub Pages to send `nosniff`. It does not. Verified against the live
URL, the header is absent, and a static host gives no way to add it. See the
accepted risk below.

**"API response carries HSTS"** and **"API response carries nosniff"** — not
applicable. There is no API. Those checks were exercising a 404.

---

## Accepted risks

**Clickjacking is not blocked, deliberately.** `frame-ancestors` cannot be set in
a meta CSP, and GitHub Pages does not allow custom response headers. A JavaScript
frame-buster was considered and rejected, because the stated purpose of this
build is to be embedded in Karl's own portfolio site — frame-busting would break
the thing it exists for.

The residual risk is close to nil: the site has no authentication, no session, no
payment, and no control whose click does anything more than navigate. There is
nothing worth stealing a click for.

If this ever becomes a real trading site with a login, move it to a host that can
set headers and add `frame-ancestors 'self'`.

**No `X-Content-Type-Options: nosniff`.** GitHub Pages does not send it and does
not permit custom headers. The exposure is a browser sniffing a response as a
type other than the one declared.

What limits it here: every file is static, correctly typed by GitHub from its
extension, and there are no user uploads, so no attacker controls a file or its
declared type. The CSP narrows what a successful sniff could achieve anyway —
`script-src` allows only same-origin files plus one hash-pinned inline script,
and `object-src` and `default-src` are `'none'`.

Verified live: `content-type: text/html; charset=utf-8` on documents and the
correct types on assets. Accepted for a static demo. On a host that can set
headers, add nosniff.

**Font files are redistributed.** Permitted by the SIL Open Font License; the
licence notice ships in `assets/fonts/OFL.txt`.

---

## Legal position

- The company does not exist. Every page footer says so, and the sources page
  opens with it.
- Real organisations are named — PSA Halifax, the Port of Rotterdam, terminal
  operators, shipping lines, and Canadian and Dutch government bodies — because
  the site cites facts published by them. A no-affiliation notice on the sources
  page and in the contact policies states that none of them endorses or is
  connected to this demonstration.
- Contact details are placeholders. Email uses `example.com`, reserved by IANA
  for exactly this. Addresses name a city only, after invented street addresses
  inside real, tenanted buildings were removed.
- No personal data is collected, so there is no processing to disclose. The only
  browser storage is a single local flag recording that the notice was dismissed.
- The photography is AI-generated placeholder imagery and is labelled as such.
  It should be replaced before any real launch.

---

## Re-run this

```bash
python "../../.claude/skills/secure-audit/scripts/probe.py" <url> --delay 1
python "../../.claude/skills/secure-audit/scripts/scan-xss.py" .
```

Verified live at <https://kaliber-autonomy.github.io/hhl-demo/> on 2026-09-03:

| Check | Result |
|---|---|
| `strict-transport-security` | present, `max-age=31556952` |
| `x-content-type-options` | absent, accepted above |
| CSP, referrer policy, noindex | present in the document |
| Third-party requests on load | none |
| `robots.txt` | returns disallow all |
| Fonts, pages, assets | all 200 |
