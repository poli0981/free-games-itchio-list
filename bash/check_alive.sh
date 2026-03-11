#!/bin/bash
set -euo pipefail

pip install --quiet beautifulsoup4 requests

python scripts/check_alive.py

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add scripts/game_info.json scripts/deleted_games.json
git diff --staged --quiet && echo "No changes – skip commit" \
  || (git commit -m "Remove dead game links [$(date +'%Y-%m-%d')]" && git push)