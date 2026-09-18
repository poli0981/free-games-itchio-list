#!/usr/bin/env bash
# Is the site's latest Cloudflare build OK? Exit 1 on a new failure.
#
# Usage: bash bash/cf_build_status.sh      (needs GH_TOKEN with checks + contents read)
#
# Walks main's recent commits, newest first, to the latest one that has a
# "Workers Builds: <worker>" check run. Workers Builds posts that check run
# only when a build finishes, so a newer commit without one is still building
# (or was skipped by watch paths) and is looked past. If that latest build
# failed and finished within WINDOW_MIN, the build is reported (exit 1); an
# older failure was reported by an earlier run. A failure of a commit that a
# newer successful build superseded does not matter: the site is current.
#
# This replaces a check_run-triggered relay, which GitHub never starts for
# the pipeline's GITHUB_TOKEN data commits.
set -euo pipefail

WORKER="${CF_WORKER:-free-games-itchio-list}" # must equal webapp/wrangler.jsonc "name"
CHECK_NAME="Workers Builds: $WORKER"
WINDOW_MIN="${WINDOW_MIN:-125}" # the schedule is hourly; a late run must not miss a failure

# gh api with a few retries; a persistent API problem is a warning, not an alert.
api() {
  local out attempt
  for attempt in 1 2 3; do
    if out=$(gh api "$@" 2>/dev/null); then
      printf '%s\n' "$out"
      return 0
    fi
    sleep $((attempt * 5))
  done
  echo "::warning::GitHub API request failed: $*" >&2
  return 1
}

shas=$(api "repos/$GITHUB_REPOSITORY/commits?sha=main&per_page=30" --jq '.[].sha') || exit 0
now=$(date -u +%s)
for sha in $shas; do
  run=$(api --method GET "repos/$GITHUB_REPOSITORY/commits/$sha/check-runs" \
    -f check_name="$CHECK_NAME" -f filter=latest --jq \
    '[.check_runs[] | select(.app.slug == "cloudflare-workers-and-pages")] | first
     | if . == null then "none||" else "\(.conclusion // "")|\(.completed_at // "")|\(.html_url)" end') || exit 0
  IFS='|' read -r conclusion completed url <<<"$run"
  case "$conclusion" in
    none | "" | cancelled | stale)
      continue # not built (yet), or superseded: look at the commit before
      ;;
    success | neutral | skipped)
      echo "Latest Cloudflare build is fine: ${sha:0:7} $conclusion $url"
      exit 0
      ;;
    *)
      age_min=$(((now - $(date -u -d "$completed" +%s)) / 60))
      if [ "$age_min" -le "$WINDOW_MIN" ]; then
        echo "::error::The Cloudflare build of ${sha:0:7} ended '$conclusion' ${age_min} min ago — freeitchgames.win is not up to date: $url"
        exit 1
      fi
      echo "The latest Cloudflare build (${sha:0:7}) failed ${age_min} min ago — already reported: $url"
      exit 0
      ;;
  esac
done
echo "::warning::No finished Cloudflare build among main's last 30 commits."
