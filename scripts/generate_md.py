"""
generate_md.py — Generate per-genre markdown tables from game_info.json.
"""

import json
import os
from collections import defaultdict

NA = "N/A"


def esc(text: str) -> str:
    """Escape pipe characters so they don't break the markdown table."""
    if not text or text == NA:
        return text
    return text.replace("|", "\\|")


def fmt_list(val) -> str:
    """Format a field that may be list or string for table display."""
    if isinstance(val, list):
        return ", ".join(val) if val else NA
    return val if val else NA


def main() -> None:
    with open("scripts/game_info.json", "r", encoding="utf-8") as f:
        games: list[dict] = json.load(f)

    # Group by genre (now a single string, not comma-separated)
    grouped: dict[str, list[dict]] = defaultdict(list)
    for g in games:
        genre = g.get("genre", NA)
        if not genre or genre == NA:
            genre = "Other"
        grouped[genre].append(g)

    os.makedirs("lists", exist_ok=True)

    for genre, game_list in grouped.items():
        game_list.sort(key=lambda x: x.get("name", "").lower())

        chunk_size = 300
        for chunk_idx, start in enumerate(range(0, len(game_list), chunk_size)):
            chunk = game_list[start : start + chunk_size]
            genre_filename = genre.lower().replace(" ", "_").replace("/", "_")

            if chunk_idx > 0:
                filename = f"lists/{genre_filename}_part{chunk_idx + 1}.md"
            else:
                filename = f"lists/{genre_filename}.md"

            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"# {genre} Games ({len(chunk)} games)\n\n")

                # Header
                f.write(
                    "| No | Thumb | Name | Dev | Short Desc | Genre | Tags "
                    "| Status | Platforms | Publisher | Release Date | Made With "
                    "| Rating | Session | Languages | Inputs "
                    "| Link | Safe | Notes | NSFW |\n"
                )
                f.write(
                    "|----|-------|------|-----|------------|-------|------"
                    "|--------|-----------|-----------|--------------|----------"
                    "|--------|---------|-----------|--------"
                    "|------|------|-------|------|\n"
                )

                for i, g in enumerate(chunk, start=1):
                    thumb_url = g.get("thumbnail", NA)
                    thumb = (
                        f"![thumb]({thumb_url})"
                        if thumb_url and thumb_url != NA
                        else NA
                    )

                    name         = esc(g.get("name", NA))
                    dev          = esc(g.get("dev", NA))
                    short_desc   = esc(g.get("description", NA))
                    genre_val    = esc(g.get("genre", NA))
                    tags         = esc(fmt_list(g.get("tags")))
                    status       = esc(g.get("status", NA))
                    platforms    = esc(fmt_list(g.get("platforms")))
                    publisher    = esc(g.get("publisher", NA))
                    release_date = esc(g.get("release_date", NA))
                    made_with    = esc(fmt_list(g.get("made_with")))
                    avg_session  = esc(g.get("average_session", NA))
                    languages    = esc(fmt_list(g.get("languages")))
                    inputs       = esc(fmt_list(g.get("inputs")))
                    safe_virus   = esc(g.get("safe_virus", "?"))
                    notes        = esc(g.get("notes", ""))
                    nsfw         = esc(g.get("nsfw", NA))

                    # Rating: combine score + count
                    r_val   = g.get("rating", NA)
                    r_count = g.get("rating_count", NA)
                    if r_val != NA and r_count != NA:
                        rating_cell = f"{r_val} ({r_count})"
                    else:
                        rating_cell = NA

                    url = g.get("url", "")
                    link_cell = f"[Link]({url})" if url else NA

                    f.write(
                        f"| {i} | {thumb} | {name} | {dev} | {short_desc} "
                        f"| {genre_val} | {tags} | {status} | {platforms} "
                        f"| {publisher} | {release_date} | {made_with} "
                        f"| {rating_cell} | {avg_session} | {languages} "
                        f"| {inputs} | {link_cell} | {safe_virus} "
                        f"| {notes} | {nsfw} |\n"
                    )

                f.write("\n")

    print(f"Generated markdown for {len(grouped)} genre(s).")


if __name__ == "__main__":
    main()
