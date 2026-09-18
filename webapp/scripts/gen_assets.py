"""Generate the favicon, PWA icons and Open Graph image (v4 brand).

Run from repo root after `npm ci` in webapp/ (the Geist fonts come from
node_modules/@fontsource-variable):
    python webapp/scripts/gen_assets.py

Outputs to webapp/public/. Idempotent — re-run after tweaking colors/text.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
FONTS = ROOT / "node_modules" / "@fontsource-variable"
SANS = FONTS / "geist" / "files" / "geist-latin-wght-normal.woff2"
MONO = FONTS / "geist-mono" / "files" / "geist-mono-latin-wght-normal.woff2"

# Same values as the dark theme tokens in src/index.css.
ACCENT = (124, 92, 255)  # --primary #7c5cff
BG = (11, 11, 12)  # --background #0b0b0c
TEXT = (237, 237, 239)  # --foreground
MUTED = (155, 155, 164)  # --muted-foreground
BORDER = (35, 35, 40)  # --border
WHITE = (255, 255, 255)

# The header brand mark's bolt, on a 24-unit grid (SVG path "M13 2 4 14h7l-1 8 9-12h-7l1-8z").
BOLT = [(13, 2), (4, 14), (11, 14), (10, 22), (19, 10), (12, 10)]
BOLT_CENTER = (11.5, 12.0)  # middle of its bounding box (x 4–19, y 2–22)
BOLT_HEIGHT = 20

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\
<rect width="32" height="32" rx="8" fill="#7c5cff"/>\
<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="#fff" transform="translate(7.375 7) scale(.75)"/>\
</svg>
"""


def font(path: Path, size: int, weight: int = 400) -> ImageFont.FreeTypeFont:
    face = ImageFont.truetype(str(path), size)
    face.set_variation_by_axes([weight])
    return face


def draw_bolt(draw: ImageDraw.ImageDraw, cx: float, cy: float, height: float, fill) -> None:
    s = height / BOLT_HEIGHT
    points = [(cx + (x - BOLT_CENTER[0]) * s, cy + (y - BOLT_CENTER[1]) * s) for x, y in BOLT]
    draw.polygon(points, fill=fill)


def brand_mark(size: int, radius_ratio: float = 7 / 26) -> Image.Image:
    """Rounded accent square with the white bolt, drawn 4x and scaled down (anti-aliasing)."""
    big = size * 4
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=round(big * radius_ratio), fill=ACCENT)
    draw_bolt(draw, big / 2, big / 2, big * 0.45, WHITE)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_icon(size: int) -> Image.Image:
    """Full-bleed square (the manifest marks it maskable; the bolt sits in the safe zone)."""
    big = size * 4
    img = Image.new("RGB", (big, big), ACCENT)
    draw_bolt(ImageDraw.Draw(img), big / 2, big / 2, big * 0.46, WHITE)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_og(width: int = 1200, height: int = 630) -> Image.Image:
    img = Image.new("RGB", (width, height), BG)

    # A soft accent glow in the top-left corner.
    glow = Image.new("RGB", (width, height), BG)
    ImageDraw.Draw(glow).ellipse((-260, -420, 700, 380), fill=(58, 44, 120))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(160)), 0.55)
    draw = ImageDraw.Draw(img)

    x = 88
    img.paste(brand_mark(60), (x, 84), brand_mark(60))
    draw.text((x + 80, 96), "Free Itch Games", font=font(SANS, 34, 600), fill=TEXT)

    headline = font(SANS, 78, 600)
    draw.text((x, 212), "Free games on itch.io,", font=headline, fill=TEXT)
    draw.text((x, 306), "sorted and kept fresh.", font=headline, fill=TEXT)

    facts = "2,600+ games · re-checked weekly · open data (CC BY 4.0)"
    draw.text((x, 440), facts, font=font(MONO, 26), fill=MUTED)
    draw.line((x, 512, width - x, 512), fill=BORDER, width=2)
    draw.text((x, 540), "freeitchgames.win", font=font(SANS, 28, 500), fill=ACCENT)
    note = "Not affiliated with itch.io"
    draw.text((width - x, 540), note, font=font(SANS, 22), fill=MUTED, anchor="ra")
    return img


def main() -> None:
    (OUT / "favicon.svg").write_text(FAVICON, encoding="utf-8", newline="\n")
    print(f"wrote {OUT / 'favicon.svg'}")
    for size in (192, 512):
        path = OUT / f"icon-{size}.png"
        make_icon(size).save(path, format="PNG", optimize=True)
        print(f"wrote {path} ({size}x{size})")
    og = make_og()
    og.save(OUT / "og.png", format="PNG", optimize=True)
    og.save(OUT / "og.webp", format="WEBP", quality=85, method=6)
    print(f"wrote {OUT / 'og.png'} and og.webp")


if __name__ == "__main__":
    main()
