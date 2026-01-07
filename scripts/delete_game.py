import json

json_file_path="game_info.json"

with open(json_file_path, 'r', encoding="utf-8") as f:
    data = json.load(f)

print("Link of the game?")
url = input()
if url in[g["url"] for g in data ]:
    for game in data:
        if game['url'] == url:
            data.remove(game)
            break
    with open(json_file_path, "w", encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("This game is removed.")
else:
    print("This game is not in the list. Run code again and try again.")
