# Contributing Guidelines

Thanks for considering contributing to this random repo! I'm just an unemployed Vietnamese dev with mediocre skills and Grok as my only buddy, so any help is massively appreciated. This list lives on community additions — because I'm too lazy to hunt every free gem myself :D

## How to Contribute

### 1. Add New Games (Easiest & Most Welcome!)
- Use the **[Add New Games]** issue template.
- Paste itch.io links (free-to-play only, one per line, max 50 per issue).
- Optional: add notes why it's cool.
- The daily GitHub Action will scrape and add them automatically. Magic!

### 2. Report Bugs or Wrong Info
- Use the **[Bug Report]** template.
- Checkboxes for common issues (broken links, wrong NSFW/safe flags, bad genre, etc.).
- Provide game URLs and details — the more specific, the faster fix.

### 3. Suggest Features or Code Improvements
- Use the **[Feature Request]** template.
- Describe the idea (better tables? auto rating? search?).
- Bonus: include code snippets or pseudocode (I'll probably need Grok to understand it anyway).

### 4. Submit Code Changes
- Fork the repo.
- Create a branch (`fix-bug-xyz` or `feature-awesome-thing`).
- Make changes (test locally if possible — run the scripts manually).
- Submit a PR with clear title/description.
- I'll review (slowly, because unemployed schedule) and merge if it doesn't break everything.

## Tips for Smooth Contributing
- **Test locally**: Clone repo, add links to `temp_link.json`, run `python update_info.py` then `python generate_md.py`,
  check output.
- **Keep it clean**: Only free itch.io games, no paid/demo/malware.
- **Be patient**: I'm introvert + noob, responses might be slow.
- **No pressure**: Even a single game suggestion makes you a hero.

## What Happens Next?
- Issues/PRs get labeled.
- Daily Action runs at 3:00 UTC — new games appear automatically.
- Big thanks in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md) if you contribute!

This repo is MIT licensed, so go wild. Questions? Open a **[Question/Feedback]** issue.

Thanks legend — you're making this boredom project less boring. 🚀