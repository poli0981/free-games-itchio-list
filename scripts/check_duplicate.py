import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from data_store import load_all_games

data = load_all_games()

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
