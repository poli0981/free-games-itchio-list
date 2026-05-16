#!/bin/bash
set -euo pipefail

pip install --quiet beautifulsoup4 requests

python scripts/update_reviews.py

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add data_game/
git diff --staged --quiet && echo "No changes – skip commit" \
  || (git commit -m "Update reviews [$(date +'%Y-%m-%d')]" && git push)
