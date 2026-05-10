"""Generate PWA icons and OG image for the webapp.

Run from repo root:
    python webapp/scripts/gen_assets.py

Outputs to webapp/public/. Idempotent — re-run after tweaking colors/text.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "public"
OUT.mkdir(parents=True, exist_ok=True)

PURPLE = (134, 59, 255)        # primary brand purple, matches favicon.svg
PURPLE_LIGHT = (237, 230, 255)  # halo / soft fill
PURPLE_DEEP = (60, 16, 130)    # background bottom
CYAN_HL = (71, 191, 255)       # accent
WHITE = (255, 255, 255)
DARK_BG = (10, 10, 15)


def lightning_path(scale: float, ox: float, oy: float):
    """A stylized lightning-bolt / Z-shape silhouette tracing the favicon.

    Returns a sequence of polygons (each polygon = list of (x, y) tuples).
    """
    pts = [
        (8, 0), (38, 0), (28, 14), (44, 14), (16, 46), (24, 32), (4, 32),
    ]
    return [[(ox + x * scale, oy + y * scale) for (x, y) in pts]]


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), PURPLE)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=size // 6, fill=PURPLE)
    s = size / 48 * 0.78
    cx = size / 2 - 24 * s
    cy = size / 2 - 23 * s
    for poly in lightning_path(s, cx, cy):
        draw.polygon(poly, fill=PURPLE_LIGHT)
    return img


def make_og(width: int = 1200, height: int = 630) -> Image.Image:
    img = Image.new("RGB", (width, height), DARK_BG)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / height
        r = int(DARK_BG[0] + (PURPLE_DEEP[0] - DARK_BG[0]) * t)
        g = int(DARK_BG[1] + (PURPLE_DEEP[1] - DARK_BG[1]) * t)
        b = int(DARK_BG[2] + (PURPLE_DEEP[2] - DARK_BG[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    glyph_scale = 7.0
    for poly in lightning_path(glyph_scale, 88, 156):
        draw.polygon(poly, fill=PURPLE)
    for poly in lightning_path(glyph_scale * 0.96, 92, 160):
        draw.polygon(poly, fill=PURPLE_LIGHT)
    title = "Itch.io Free Games DB"
    subtitle = "500+ free itch.io games  ·  auto-updated  ·  webapp + desktop"
    footer = "poli0981.github.io/free-games-itchio-list"
    try:
        title_font = ImageFont.truetype("arial.ttf", 78)
        subtitle_font = ImageFont.truetype("arial.ttf", 32)
        footer_font = ImageFont.truetype("arialbd.ttf", 24)
    except OSError:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        footer_font = ImageFont.load_default()
    draw.text((460, 200), title, font=title_font, fill=WHITE)
    draw.text((460, 310), subtitle, font=subtitle_font, fill=PURPLE_LIGHT)
    draw.rectangle((460, 420, 462 + 220, 422), fill=CYAN_HL)
    draw.text((460, 440), footer, font=footer_font, fill=CYAN_HL)
    return img


def main() -> None:
    for size in (192, 512):
        path = OUT / f"icon-{size}.png"
        make_icon(size).save(path, format="PNG", optimize=True)
        print(f"wrote {path} ({size}x{size})")
    og = make_og()
    og_png = OUT / "og.png"
    og.save(og_png, format="PNG", optimize=True)
    print(f"wrote {og_png}")
    og_webp = OUT / "og.webp"
    og.save(og_webp, format="WEBP", quality=85, method=6)
    print(f"wrote {og_webp}")


if __name__ == "__main__":
    main()
