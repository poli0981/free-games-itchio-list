#!/bin/bash

# Write script generate table of contents for list of games.

# Run python script
python scripts/generate_md.py

# Check file
ls -la
ls -la lists/*.md

# push if change
git config --global user.name "poli0981"
git config --global user.email "127664709+poli0981@users.noreply.github.com"
git add lists/*.md
git status
if git diff --cached --quiet; then
    echo "No diff detected"
    git commit --allow-empty -m "Auto regenerate tables (timestamp update) [$(date +'%Y-%m-%d %H:%M')]" || echo "Empty commit skip"
else
    git commit -m "Auto regenerate tables from game_info.json [$(date +'%Y-%m-%d %H:%M')]"
fi
    git push || echo "Push fail – check token/permission bro"