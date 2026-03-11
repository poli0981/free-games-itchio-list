#!/bin/bash
set -euo pipefail

pip install --quiet pandas

python scripts/export_csv.py

git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add .
git diff --staged --quiet && echo "No changes – skip commit" \
  || (git commit -m "Auto update CSV [$(date +'%Y-%m-%d')]" && git push)