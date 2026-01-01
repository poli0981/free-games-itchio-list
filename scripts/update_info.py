import json
import os

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def scrape_game_info(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')

        title_tag = soup.find('h1', class_='game_title') or soup.find('h1', attrs={'itemprop': 'name'})
        name = title_tag.text.strip() if title_tag else "Unknown"

        # Parse info table
        info_dict = {}
        info_wrapper = soup.find('div', class_='info_panel_wrapper')
        if info_wrapper:
            table = info_wrapper.find('table')
            if table:
                rows = table.find_all('tr')
                for row in rows:
                    tds = row.find_all('td')
                    if len(tds) >= 2:
                        key = tds[0].get_text(strip=True)
                        value_td = tds[1]
                        links = value_td.find_all('a')
                        if links:
                            value = ', '.join(a.get_text(strip=True) for a in links)
                        else:
                            value = value_td.get_text(strip=True)
                        info_dict[key] = value

        dev = info_dict.get('Author', 'Unknown')
        genre = info_dict.get('Genre', 'Unknown')
        tags = info_dict.get('Tags', '')

        # Description
        desc_tag = soup.find('div', class_='formatted_description')
        if desc_tag:
            full_desc = desc_tag.get_text(strip=True, separator=' ')
            if '.' in full_desc:
                first_sentence = full_desc.split('.', 1)[0] + '.'
                description = first_sentence if len(first_sentence) <= 200 else first_sentence[:197] + '...'
            else:
                description = full_desc[:200] + '...' if len(full_desc) > 200 else full_desc
            description += " (see more on itch.io)"
        else:
            description = "No description"

        # NSFW detect
        nsfw_keywords = ['adult', 'nsfw', 'erotic', 'hentai', 'porn', 'mature']
        has_nsfw_tag = any(kw in tags.lower() for kw in nsfw_keywords)
        has_warning = soup.find('div', class_=['view_game_warning', 'mature_content_notice'])
        nsfw = "Yes" if has_nsfw_tag or has_warning else "No"

        # Thumbnail
        thumb_meta = soup.find('meta', property='og:image')
        thumbnail = thumb_meta['content'] if thumb_meta else ""
        if not thumbnail:
            screenshot_list = soup.find('div', class_='screenshot_list')
            if screenshot_list:
                first_img = screenshot_list.find('img')
                thumbnail = first_img['src'] if first_img else ""

        return {
            "url": url,
            "name": name,
            "dev": dev,
            "description": description,
            "genre": genre,
            "nsfw": nsfw,
            "safe_virus": "?",
            "notes": "",
            "thumbnail": thumbnail,
            "tags": tags
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


# Main flow
if os.path.exists('scripts/temp_link.json'):
    with open('scripts/temp_link.json', 'r', encoding='utf-8') as f:
        new_links = json.load(f)

    # Load existing
    existing = []
    if os.path.exists('scripts/game_info.json'):
        with open('scripts/game_info.json', 'r', encoding='utf-8') as f:
            existing = json.load(f)
    existing_urls = {g['url'] for g in existing}

    new_games = []
    for link in new_links:
        if link in existing_urls:
            print(f"Skip duplicate: {link}")
            continue
        info = scrape_game_info(link)
        if info:
            new_games.append(info)
            existing_urls.add(link)

    # Save merged
    all_games = existing + new_games
    with open('scripts/game_info.json', 'w', encoding='utf-8') as f:
        json.dump(all_games, f, ensure_ascii=False, indent=4)

    # Delete temp_link (overwrite empty array)
    with open('scripts/temp_link.json', 'w', encoding='utf-8') as f:
        json.dump([], f)
