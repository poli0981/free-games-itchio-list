#!/bin/bash

echo "This is a test script to rewrite workflow shorter."
echo "This is only a test."

# Install python dependencies
pip install BeautifulSoup4 requests

# Run update game info script
python scripts/update_info.py
echo "Game info has been updated."

# Force reset temporary link file
echo "[]" > scripts/temp_link.json
echo "Temporary link file has been reset."
git add scripts/temp_link.json

# Commit and push changes if any
git config --global user.name "poli0981"
git config --global user.email "127664709+poli0981@users.noreply.github.com"
git status
git add scripts/game_info.json
git diff --staged --quiet && echo "No changes – skip commit" || (git commit -m "JSON updated [$(date +'%Y-%m-%d')]" && git push)