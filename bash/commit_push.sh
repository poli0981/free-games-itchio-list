#!/usr/bin/env bash
# Apply a pipeline patch to the latest main and push it, retrying on races.
#
# Usage: bash bash/commit_push.sh PATCH.json "commit message"
#
# Every data writer (refresh, ingest, admin Worker, browser extension) pushes
# to main. Instead of rebasing whole-file JSON rewrites (which conflict), each
# attempt starts from a fresh origin/main and re-applies the URL-keyed patch;
# apply_patch.py is idempotent and validates before anything is committed.
# Pushes use the job's GITHUB_TOKEN, so they do not re-trigger workflows.
set -euo pipefail

PATCH="${1:?patch file required}"
MESSAGE="${2:?commit message required}"
MAX_ATTEMPTS=5

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  git fetch --no-tags --depth=1 origin main
  git reset --hard origin/main
  python scripts/apply_patch.py "$PATCH"
  git add -A data_game scripts/deleted_games.json scripts/temp_link.json scripts/state
  if git diff --cached --quiet; then
    echo "No data changes — nothing to commit."
    exit 0
  fi
  git commit -q -m "$MESSAGE"
  if git push origin HEAD:main; then
    echo "Pushed on attempt $attempt."
    exit 0
  fi
  echo "::warning::push rejected (attempt $attempt/$MAX_ATTEMPTS) — retrying on the new main"
  sleep $((attempt * 10 + RANDOM % 10))
done

echo "::error::push failed after $MAX_ATTEMPTS attempts"
exit 1
