**🎮 Add New Games**

Thanks for feeding the list! Easiest ways first: one game → the Suggest page (https://freeitchgames.win/suggest, no GitHub needed); a bulk list → the "Add Games" issue template. A PR also works if you wanna be extra :D

**How to add games in a PR:** put the itch.io game URLs in `scripts/temp_link.json` (a JSON array of URL strings). Please don't edit `data_game/` by hand — the pipeline writes it. Merging the PR is the Maintainer's approval; the ingest workflow (`update.yml`) then scrapes each link and adds the free ones. Paid games and games already in the catalog are skipped.

### Games Added
List the itch.io URLs (free-to-play only!):

### Why these games?
Optional: short notes, why they rock, NSFW/safety concerns (the Maintainer sets the `nsfw`, `safe_virus` and `notes` fields).

### Checklist
- [ ] All links are free itch.io game pages
- [ ] No duplicates (searched https://freeitchgames.win/games)
- [ ] Only `scripts/temp_link.json` changed, and it's still valid JSON
- [ ] I agree my contribution is licensed under CC BY 4.0, like the rest of the catalog data (`data_game/LICENSE.md`)

You're making this boredom project bigger — legend status unlocked! 🚀
