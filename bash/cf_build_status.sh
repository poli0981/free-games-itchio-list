#!/usr/bin/env bash
# Find main's latest finished Cloudflare Workers Build and, if it failed within
# the last WINDOW_H hours, hand it to deploy-status.yml for an alert.
#
# Usage: bash bash/cf_build_status.sh      (needs GH_TOKEN with contents + checks read)
#
# Walks main's first-parent history (commits of merged branches carry *preview*
# builds under the same check name) to the newest commit that has a finished
# "Workers Builds: <worker>" check run. Workers Builds posts that check run only
# when a build ends, so a newer commit without one is still building (or was
# skipped by watch paths) and is looked past. A failure is written to
# $GITHUB_OUTPUT (failed_id / failed_url / failed_sha); deploy-status.yml
# alerts once per failed build, keyed on its check-run id, so a dropped or late
# scheduled run only delays the alert. A successful newer build means the site
# is current, whatever happened before it.
#
# A GitHub API problem is a warning (exit 0): the next hourly run tries again.
set -euo pipefail

WORKER="${CF_WORKER:-free-games-itchio-list}" # must equal webapp/wrangler.jsonc "name"
CHECK_NAME="Workers Builds: $WORKER"
WINDOW_H="${WINDOW_H:-24}"
MAX_COMMITS=30

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

output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1" >>"$GITHUB_OUTPUT"; fi
}

commits=$(api "repos/$GITHUB_REPOSITORY/commits?sha=main&per_page=100" \
  --jq '.[] | "\(.sha) \(.parents[0].sha // "-")"') || exit 0
declare -A parent=()
sha=""
while read -r commit first_parent; do
  [ -n "$commit" ] || continue
  [ -n "$sha" ] || sha=$commit
  parent[$commit]=$first_parent
done <<<"$commits"

now=$(date -u +%s)
for _ in $(seq 1 "$MAX_COMMITS"); do
  [ -n "$sha" ] && [ -n "${parent[$sha]+set}" ] || break
  run=$(api --method GET "repos/$GITHUB_REPOSITORY/commits/$sha/check-runs" \
    -f check_name="$CHECK_NAME" -f filter=latest --jq \
    '[.check_runs[] | select(.app.slug == "cloudflare-workers-and-pages")] | first
     | if . == null then "none|||" else "\(.conclusion // "")|\(.completed_at // "")|\(.id)|\(.html_url)" end') || exit 0
  IFS='|' read -r conclusion completed id url <<<"$run"
  case "$conclusion" in
    none | "" | cancelled | stale)
      sha=${parent[$sha]} # not built (yet), or superseded: look at the commit before
      ;;
    success | neutral | skipped)
      echo "Latest Cloudflare build is fine: ${sha:0:7} $conclusion $url"
      exit 0
      ;;
    *)
      age_h=$(((now - $(date -u -d "$completed" +%s)) / 3600))
      if [ "$age_h" -lt "$WINDOW_H" ]; then
        echo "::error::The Cloudflare build of ${sha:0:7} ended '$conclusion' — freeitchgames.win is not up to date: $url"
        output "failed_id=$id"
        output "failed_url=$url"
        output "failed_sha=${sha:0:7}"
      else
        echo "The latest Cloudflare build (${sha:0:7}) failed ${age_h} h ago; not alerting again: $url"
      fi
      exit 0
      ;;
  esac
done
echo "::warning::No finished Cloudflare build among main's last $MAX_COMMITS first-parent commits."
