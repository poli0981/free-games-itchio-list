#!/bin/bash
set -euo pipefail

python scripts/log_deleted.py

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add deleted_games.txt scripts/deleted_games.json
git diff --staged --quiet && echo "No changes – skip commit" \
  || (git commit -m "Update deleted games log [$(date +'%Y-%m-%d')]" && git push)