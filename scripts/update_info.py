import requests
from bs4 import BeautifulSoup
import json
import time

games = []
page = 1
while True:  # Limit ví dụ 10 pages để test
    url = f"https://itch.io/games/free/last-day/released?page={page}"
    r = requests.get(url)
    soup = BeautifulSoup(r.text, 'html.parser')
    game_rows = soup.find_all('div', class_='game_cell')
    if not game_rows:
        break
    for row in game_rows:
        title = row.find('a', class_='title').text.strip()
        link = row.find('a', class_='title')['href']
        author = row.find('div', class_='game_author').text.strip()
        genre = row.find('div', class_='game_genre').text.strip() if row.find('div', class_='game_genre') else "N/A"
        games.append({"title": title, "link": link, "author": author, "genre": genre})
    print(f"Page {page} done, {len(games)} games")
    page += 1
    time.sleep(2)  # Đừng spam server nhé bro
    if page > 10: break  # Test thôi

with open('free_games.json', 'w', encoding='utf-8') as f:
    json.dump(games, f, ensure_ascii=False, indent=4)