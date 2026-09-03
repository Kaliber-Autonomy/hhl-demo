"""Render the Halifax Holland Line mark to a full icon set.

The mark is the site's brand mark: two ports joined by a great-circle arc,
with a red tick at north. Drawn at 8x and downsampled so the curves are clean,
because a favicon that is 3 px of mush is worse than no favicon.

At 16 px the hairline ring and the north tick disappear into noise, so small
sizes get a deliberately simplified, bolder variant of the same idea.
"""
import io, os
from PIL import Image, ImageDraw

OUT = r"C:\Users\Karl\Desktop\Kaliber OS\WORK\Halifax-Holland-Line\site\assets"
os.makedirs(OUT, exist_ok=True)

NAVY = (8, 32, 58, 255)      # --navy-900, the site's primary
WHITE = (255, 255, 255, 255)
RED = (200, 16, 46, 255)     # --red, the Canadian accent

SS = 8  # supersample factor

def bezier(p0, p1, p2, p3, steps=160):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts

def thick_line(d, pts, width, fill):
    """Polyline with round joins, since PIL has no round line caps."""
    d.line(pts, fill=fill, width=int(round(width)))
    r = width / 2.0
    for (x, y) in pts[::4] + [pts[-1]]:
        d.ellipse([x-r, y-r, x+r, y+r], fill=fill)

def draw_mark(size, detailed=True, square=False, pad=0.0):
    """Draw the mark at `size` px. square=True fills the canvas for iOS."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = S / 64.0                      # one design unit
    inset = pad * S

    if square:
        d.rectangle([0, 0, S, S], fill=NAVY)
    else:
        d.ellipse([inset, inset, S - inset, S - inset], fill=NAVY)

    # The route. Bolder at small sizes so it survives downsampling.
    stroke = (4.2 if detailed else 5.6) * u
    p = bezier((17*u, 40.5*u), (24*u, 27.5*u), (41*u, 21.5*u), (47.5*u, 25.5*u))
    if square:  # nudge inward so iOS corner rounding cannot clip it
        p = [(x*0.84 + S*0.08, y*0.84 + S*0.08) for (x, y) in p]
        stroke *= 0.84
    thick_line(d, p, stroke, WHITE)

    # The two ports
    dot = (5.0 if detailed else 5.8) * u
    if square:
        dot *= 0.84
    for (cx, cy) in (p[0], p[-1]):
        d.ellipse([cx-dot, cy-dot, cx+dot, cy+dot], fill=WHITE)

    # North tick, in the Canadian red. Vanishes below ~32 px, so drop it there.
    if detailed:
        w = 4.2 * u
        x = S / 2.0
        y0, y1 = (7.0 * u) + inset, (13.5 * u) + inset
        if square:
            x = S/2.0; y0 = S*0.115; y1 = S*0.20; w *= 0.9
        d.line([(x, y0), (x, y1)], fill=RED, width=int(round(w)))
        r = w/2
        for yy in (y0, y1):
            d.ellipse([x-r, yy-r, x+r, yy+r], fill=RED)

    return img.resize((size, size), Image.LANCZOS)

made = []

# Classic PNG favicons. 16 and 32 use the simplified mark.
for s in (16, 32):
    f = os.path.join(OUT, "favicon-%d.png" % s)
    draw_mark(s, detailed=False).save(f, optimize=True); made.append(f)

for s in (48, 192, 512):
    f = os.path.join(OUT, "icon-%d.png" % s)
    draw_mark(s, detailed=True).save(f, optimize=True); made.append(f)

# Multi-size .ico for legacy tabs, bookmarks and Windows shortcuts
ico = os.path.join(OUT, "favicon.ico")
draw_mark(64, detailed=True).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
made.append(ico)

# iOS home screen: full-bleed square, iOS applies its own rounding
apple = os.path.join(OUT, "apple-touch-icon.png")
draw_mark(180, detailed=True, square=True).save(apple, optimize=True); made.append(apple)

# Scalable version, same geometry, for tabs that prefer SVG
svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Halifax Holland Line">
  <circle cx="32" cy="32" r="32" fill="#08203A"/>
  <path d="M17 40.5C24 27.5 41 21.5 47.5 25.5" fill="none" stroke="#ffffff"
        stroke-width="4.2" stroke-linecap="round"/>
  <circle cx="17" cy="40.5" r="5" fill="#ffffff"/>
  <circle cx="47.5" cy="25.5" r="5" fill="#ffffff"/>
  <path d="M32 7v6.5" stroke="#C8102E" stroke-width="4.2" stroke-linecap="round"/>
</svg>
"""
f = os.path.join(OUT, "favicon.svg")
io.open(f, "w", encoding="utf-8").write(svg); made.append(f)

# Web app manifest
manifest = """{
  "name": "Halifax Holland Line",
  "short_name": "HHL",
  "description": "Demonstration site. Not a trading company.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#08203A",
  "theme_color": "#08203A",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
"""
mf = os.path.join(os.path.dirname(OUT), "site.webmanifest")
io.open(mf, "w", encoding="utf-8").write(manifest); made.append(mf)

for f in made:
    print("  %-26s %5d bytes" % (os.path.basename(f), os.path.getsize(f)))
