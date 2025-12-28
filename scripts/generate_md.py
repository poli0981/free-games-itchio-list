import json
import os
from collections import defaultdict

with open('scripts/game_info.json', 'r', encoding='utf-8') as f:
    games = json.load(f)

# Group by primary genre
grouped = defaultdict(list)
for g in games:
    primary_genre = g['genre'].split(', ')[0].strip() if g['genre'] != "Unknown" else "Other"
    grouped[primary_genre].append(g)

# Check folder exists
os.makedirs('lists', exist_ok=True)

for genre, game_list in grouped.items():
    # Sort alphabet name
    game_list.sort(key=lambda x: x['name'].lower())

    # Split chunks 300
    chunk_size = 300
    for chunk_idx, start in enumerate(range(0, len(game_list), chunk_size)):
        chunk = game_list[start:start + chunk_size]
        genre_filename = genre.lower().replace(' ', '_').replace('/', '_')
        if chunk_idx > 0:
            filename = f"lists/{genre_filename}_part{chunk_idx + 1}.md"
        else:
            filename = f"lists/{genre_filename}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# {genre} Games ({len(chunk)} games)\n\n")
            f.write("| No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW |\n")
            f.write("|----|-------|------|-----|------------|------|------|-------|------|\n")
            for i, g in enumerate(chunk, start=1):
                thumb = f"![thumb]({g['thumbnail']})" if g['thumbnail'] else ""
                name = g['name']
                url = g['url']
                short_desc = g['description']
                f.write(
                    f"| {i} | {thumb} | {name} | {g['dev']} | {short_desc} | "
                    f"[Link]({g['url']}) | {g['safe_virus']} | {g['notes']} |"
                    f" {g['nsfw']} |\n")
            f.write("\n")
