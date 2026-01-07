import json

with open('scripts/game_info.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check for dups link on the list
dups = []
seen_url = set()

for item in data:
    url = item['url']
    if url in seen_url:
        dups.append(url)
    else:
        seen_url.add(url)

# Print dups in console
if dups:
    print("Duplicate link found: ")
    for url in dups:
        print(url)
else:
    print("No duplicate link found.")