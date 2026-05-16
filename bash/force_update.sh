#!/bin/bash
set -euo pipefail

pip install --quiet beautifulsoup4 requests

# INPUT_URL is passed through from the workflow_dispatch input.
python scripts/force_update.py

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add data_game/

if [[ -n "${INPUT_URL:-}" ]]; then
  msg="Force update ${INPUT_URL} [$(date +'%Y-%m-%d')]"
else
  msg="Force update [$(date +'%Y-%m-%d')]"
fi

git diff --staged --quiet && echo "No changes – skip commit" \
  || (git commit -m "${msg}" && git push)
