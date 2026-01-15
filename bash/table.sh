#!/bin/bash

# Write script generate table of contents for list of games.

# Run python script
python scripts/generate_md.py

# Check file
ls -la
ls -la lists/*.md

# push if change
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add .
git status
git diff --staged --quiet && echo "No changes – skip commit" || (git commit -m "JSON updated [$(date +'%Y-%m-%d')]" && git push)
